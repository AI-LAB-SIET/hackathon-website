/**
 * lib/ai/types.ts
 *
 * Shared TypeScript types for the Phase 2 AI chat infrastructure.
 * These types are used across the server-side service layer and the API route.
 * They are intentionally separate from the client-side AIMessage type in
 * lib/services/aiService.ts to maintain a clean server/client boundary.
 */

/** Valid user roles in the platform */
export type UserRole =
  | "participant"
  | "organizer"
  | "judge"
  | "volunteer"
  | "admin"
  | null;

/** A single message in a conversation (OpenAI-compatible format) */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Incoming request body for POST /api/chat */
export interface ChatRequest {
  /** The user's message text */
  message: string;
  /** The authenticated user's role — used to select the system prompt */
  role: UserRole;
  /** Client-generated session ID for conversation scoping */
  sessionId: string;
  /** Optional live context of the platform state */
  liveDataContext?: string;
}

/** A single SSE streaming chunk sent back to the client */
export interface StreamChunk {
  /** Incremental text delta */
  delta: string;
  /** True only on the final chunk */
  done: boolean;
}

/** Non-streaming response envelope (fallback) */
export interface ChatResponse {
  text: string;
  sessionId: string;
  error?: string;
}

/** Structured API error returned on failure */
export interface ChatError {
  error: string;
  code:
    | "MISSING_ENV"
    | "INVALID_REQUEST"
    | "AUTH_ERROR"
    | "RATE_LIMIT"
    | "TIMEOUT"
    | "EMPTY_RESPONSE"
    | "NETWORK_ERROR"
    | "UNKNOWN";
}
