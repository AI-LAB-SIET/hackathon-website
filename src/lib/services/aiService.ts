/**
 * lib/services/aiService.ts
 *
 * Client-side AI service — the ONLY file that the UI touches for AI interactions.
 *
 * Phase 2 changes:
 * - sendMessage() now calls POST /api/chat and parses the SSE stream,
 *   forwarding real NVIDIA NIM deltas to the onChunk callback.
 * - getSuggestions() is unchanged (role-based chip prompts, no NIM needed).
 * - AIMessage / AIResponse types are preserved (UI depends on them).
 * - Fallback: if streaming fails, the full text accumulated up to the error
 *   is returned so the UI always gets something.
 *
 * The frontend never talks to NVIDIA NIM directly.
 * All requests go through /api/chat (server-side, credentials hidden).
 */

export interface AIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  error?: boolean; // true if this message represents an API error
}

export interface AIResponse {
  text: string;
  suggestions?: string[];
  error?: boolean;
}

export interface AIService {
  sendMessage(
    message: string,
    role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null,
    onChunk?: (accumulatedText: string) => void,
    sessionId?: string
  ): Promise<AIResponse>;
  getSuggestions(
    role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null
  ): string[];
}

// ── Role-specific suggestion chips ───────────────────────────────────────────

const ROLE_SUGGESTIONS: Record<string, string[]> = {
  guest: [
    "How do I register a team?",
    "What is the hackathon schedule?",
    "What are the general rules?",
    "What AI APIs can we use?",
  ],
  participant: [
    "Where is my team QR code?",
    "How do I submit my project?",
    "Where can I find datasets & templates?",
    "How do I raise a support ticket?",
  ],
  judge: [
    "How do I evaluate a project?",
    "What are the scoring criteria?",
    "How do I leave feedback for teams?",
    "How can I view team project details?",
  ],
  volunteer: [
    "How do I check in a team?",
    "How do I resolve a support ticket?",
    "Where is the volunteer dashboard?",
    "How can I contact organizers?",
  ],
  organizer: [
    "How do I post a new announcement?",
    "How can I update problem statements?",
    "Where do I manage support tickets?",
    "How do I check team registrations?",
  ],
  admin: [
    "How do I manage platform volunteers?",
    "How do I verify team profiles?",
    "How can I edit problem statements?",
    "Where do I view all platform activity?",
  ],
};

// ── Main service class ────────────────────────────────────────────────────────

export class FrontendAIService implements AIService {
  public getSuggestions(
    role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null
  ): string[] {
    const key = role ?? "guest";
    return ROLE_SUGGESTIONS[key] ?? ROLE_SUGGESTIONS.guest;
  }

  public async sendMessage(
    message: string,
    role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null,
    onChunk?: (accumulatedText: string) => void,
    sessionId?: string
  ): Promise<AIResponse> {
    const sid = sessionId ?? "default-session";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, role, sessionId: sid }),
      });

      // Handle non-SSE error responses (e.g. 400, 500 from validation)
      if (!response.ok) {
        const errJson = await response
          .json()
          .catch(() => ({ error: "Unknown server error" }));
        const errText = errJson?.error ?? "The AI service is unavailable.";
        onChunk?.(errText);
        return { text: errText, error: true };
      }

      // Parse the SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        const msg = "Failed to open response stream.";
        onChunk?.(msg);
        return { text: msg, error: true };
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (!data) continue;

          try {
            const chunk = JSON.parse(data) as {
              delta: string;
              done: boolean;
              error?: string;
              code?: string;
            };

            if (chunk.error) {
              // The server sent an error through the SSE channel
              accumulated = chunk.error;
              onChunk?.(accumulated);
              return {
                text: accumulated,
                error: true,
                suggestions: this.getSuggestions(role),
              };
            }

            if (chunk.delta) {
              accumulated += chunk.delta;
              onChunk?.(accumulated);
            }

            if (chunk.done) break;
          } catch {
            // Malformed SSE chunk — skip
          }
        }
      }

      return {
        text: accumulated || "No response received. Please try again.",
        suggestions: this.getSuggestions(role),
        error: !accumulated,
      };
    } catch (err: unknown) {
      const msg =
        "Failed to connect to the AI service. Please check your connection and try again.";
      console.error("[FrontendAIService] sendMessage error:", err);
      onChunk?.(msg);
      return { text: msg, error: true };
    }
  }
}

export const aiService = new FrontendAIService();
