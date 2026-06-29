/**
 * app/api/chat/route.ts
 *
 * Secure server-side API route for AI chat.
 * All NVIDIA NIM communication happens here — the frontend never calls NIM directly.
 *
 * POST /api/chat
 *
 * Request body (JSON):
 *   { message: string, role: UserRole, sessionId: string }
 *
 * Success response:
 *   Content-Type: text/event-stream
 *   SSE format: "data: <json>\n\n"
 *   Each chunk: { delta: string, done: false }
 *   Final chunk: { delta: "", done: true }
 *
 * Error response:
 *   Content-Type: application/json
 *   { error: string, code: ChatError["code"] }
 *
 * Validation:
 *   - message must be a non-empty string (max 2000 chars)
 *   - role must be one of the valid UserRole values or null
 *   - sessionId must be a non-empty string
 *   - NVIDIA_NIM_API_KEY must be set in environment
 */

import { vectorStore } from '@/lib/kb/vectorStore';
import { detectIntent, Intent } from '@/lib/ai/intentDetector';
import { chatService } from '@/lib/ai/chatService';
import { UserRole, ChatRequest, ChatError } from '@/lib/ai/types';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Allow functions to stream up to 60 seconds on Vercel

// ── Verify Firebase ID token (if provided) ─────────────────────────────────────


const VALID_ROLES: Array<NonNullable<UserRole>> = [
  "participant",
  "organizer",
  "judge",
  "volunteer",
  "admin",
];

const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // ── 0. Verify Firebase ID token (if provided) ─────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    let uid: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      try {
        const { getAuth } = await import('firebase-admin/auth');
        const decoded = await getAuth().verifyIdToken(idToken);
        uid = decoded.uid;
      } catch {
        return errorResponse('Invalid Firebase ID token.', 'AUTH_ERROR', 401);
      }
    }

    // ── 1. Environment guard ──────────────────────────────────────────────────
    if (!process.env.NVIDIA_NIM_API_KEY) {
      return errorResponse(
        "NVIDIA_NIM_API_KEY is not configured on the server.",
        "MISSING_ENV",
        500
      );
    }

    // ── 2. Parse & validate request body ─────────────────────────────────────
    let body: Partial<ChatRequest>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Request body must be valid JSON.", "INVALID_REQUEST", 400);
    }

    const { message, role, sessionId } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return errorResponse("'message' is required and must be a non-empty string.", "INVALID_REQUEST", 400);
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return errorResponse(
        `'message' must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
        "INVALID_REQUEST",
        400
      );
    }
    if (!sessionId || typeof sessionId !== "string") {
      return errorResponse("'sessionId' is required.", "INVALID_REQUEST", 400);
    }
    // role can be null (unauthenticated guest) — only validate if provided
    if (role !== null && role !== undefined && !VALID_ROLES.includes(role as NonNullable<UserRole>)) {
      return errorResponse(
        `'role' must be one of: ${VALID_ROLES.join(", ")}, or null.`,
        "INVALID_REQUEST",
        400
      );
    }

    const userRole: UserRole = (role ?? null) as UserRole;
    let cleanMessage = message.trim();

    // Intent detection and context enrichment
    const intent = detectIntent(cleanMessage);
    if (intent === Intent.KnowledgeBase) {
      // Simple mock embedding (zero vector) for demo
      const dummyEmbedding = new Array(128).fill(0);
      const results = vectorStore.search(dummyEmbedding, 3);
      const retrievedContext = results.map(r => r.text).join('\n');
      cleanMessage = `${retrievedContext}\n\n${cleanMessage}`;
    } else if (intent === Intent.UserProfile) {
      if (uid) {
        try {
          const { db: adminDb } = await import('@/lib/firebaseAdmin');
          const userDoc = await adminDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const profile = userDoc.data();
            cleanMessage = `User profile: ${JSON.stringify(profile)}\n\n${cleanMessage}`;
          }
        } catch (err) {
          console.error("Firestore user profile fetch failed:", err);
        }
      }
    } else if (intent === Intent.TeamInfo) {
      if (uid) {
        try {
          const { db: adminDb } = await import('@/lib/firebaseAdmin');
          const teamsSnap = await adminDb.collection('teams')
            .where('memberUids', 'array-contains', uid)
            .get();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const teams = teamsSnap.docs.map((d: any) => d.data());
          if (teams.length) {
            cleanMessage = `Team info: ${JSON.stringify(teams)}\n\n${cleanMessage}`;
          }
        } catch (err) {
          console.error("Firestore team info fetch failed:", err);
        }
      }
    }

    // ── 3. Stream response ────────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendChunk = (delta: string, done: boolean) => {
          const data = JSON.stringify({ delta, done });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          const generator = chatService.streamResponse(
            sessionId,
            cleanMessage,
            userRole
          );

          for await (const delta of generator) {
            sendChunk(delta, false);
          }

          // Signal completion
          sendChunk("", true);
        } catch (err: unknown) {
          // Map known error codes to user-friendly messages
          const code = (err as { code?: string })?.code ?? "UNKNOWN";
          const userMessage = getFriendlyError(code, err);

          // Send error as a special SSE event so the client can display it
          const errorData = JSON.stringify({
            delta: "",
            done: true,
            error: userMessage,
            code,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));

          console.error("[POST /api/chat] AI error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Prevent nginx from buffering SSE
      },
    });
  } catch (globalErr: unknown) {
    console.error("[POST /api/chat] Global crash:", globalErr);
    return errorResponse(
      `Server crash: ${globalErr instanceof Error ? globalErr.message : String(globalErr)}`,
      "UNKNOWN",
      500
    );
  }
}

/** Handle DELETE /api/chat — clears server-side conversation history for a session */
export async function DELETE(req: NextRequest): Promise<Response> {
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", "INVALID_REQUEST", 400);
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return errorResponse("'sessionId' is required.", "INVALID_REQUEST", 400);
  }

  chatService.clearSession(body.sessionId);
  return NextResponse.json({ cleared: true });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function errorResponse(
  message: string,
  code: ChatError["code"],
  status: number
): NextResponse {
  return NextResponse.json({ error: message, code } satisfies ChatError, {
    status,
  });
}

function getFriendlyError(code: string, err: unknown): string {
  const messages: Record<string, string> = {
    AUTH_ERROR:
      "AI service authentication failed. Please contact the organizer.",
    RATE_LIMIT:
      "The AI service is temporarily busy. Please try again in a moment.",
    TIMEOUT:
      "The AI service took too long to respond. Please try again.",
    EMPTY_RESPONSE:
      "The AI returned an empty response. Please rephrase your question.",
    MISSING_ENV:
      "The AI service is not configured. Please contact the organizer.",
    NETWORK_ERROR:
      "Could not reach the AI service due to a network error. Please try again.",
  };
  return (
    messages[code] ??
    `An unexpected error occurred: ${err instanceof Error ? err.message : "Unknown error"}`
  );
}
