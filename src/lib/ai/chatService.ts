/**
 * lib/ai/chatService.ts
 *
 * Orchestration layer between the API route and the underlying AI client.
 *
 * Responsibilities:
 * 1. Validate inputs
 * 2. Load conversation history from ConversationManager
 * 3. Prepend the role-appropriate system prompt from PromptManager
 * 4. Call NimClient for streaming or single-shot completions
 * 5. Persist new user + assistant messages back to ConversationManager
 *
 * The API route delegates entirely to this service — it has zero AI logic itself.
 * This makes the AI behaviour unit-testable without spinning up the HTTP layer.
 */

import { getNimClient } from "./nimClient";
import { getSystemPrompt } from "./promptManager";
import { conversationManager } from "./conversationManager";
import type { ChatMessage, UserRole } from "./types";

export class ChatService {
  /**
   * Returns an AsyncIterable<string> of text deltas streamed from NVIDIA NIM.
   * Persists the full assistant reply to conversation history after streaming completes.
   */
  async *streamResponse(
    sessionId: string,
    userMessage: string,
    role: UserRole
  ): AsyncIterable<string> {
    const client = getNimClient();
    const messages = this.buildMessageContext(sessionId, userMessage, role);

    // Persist the user's message immediately
    conversationManager.appendMessage(sessionId, {
      role: "user",
      content: userMessage,
    });

    let fullReply = "";

    try {
      const stream = await client.streamChat(messages);
      for await (const delta of stream) {
        fullReply += delta;
        yield delta;
      }
    } finally {
      // Always persist the assistant's reply, even on partial completion
      if (fullReply) {
        conversationManager.appendMessage(sessionId, {
          role: "assistant",
          content: fullReply,
        });
      }
    }
  }

  /**
   * Single-shot (non-streaming) completion. Used as a fallback.
   * Returns the full assistant text.
   */
  async chatOnce(
    sessionId: string,
    userMessage: string,
    role: UserRole
  ): Promise<string> {
    const client = getNimClient();
    const messages = this.buildMessageContext(sessionId, userMessage, role);

    conversationManager.appendMessage(sessionId, {
      role: "user",
      content: userMessage,
    });

    const reply = await client.chat(messages);

    conversationManager.appendMessage(sessionId, {
      role: "assistant",
      content: reply,
    });

    return reply;
  }

  /**
   * Clears the conversation history for a session.
   * Called when the user clicks "Clear conversation" in the UI.
   */
  clearSession(sessionId: string): void {
    conversationManager.clearHistory(sessionId);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private buildMessageContext(
    sessionId: string,
    userMessage: string,
    role: UserRole
  ): ChatMessage[] {
    const systemPrompt = getSystemPrompt(role);
    const history = conversationManager.getHistory(sessionId);

    return [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userMessage },
    ];
  }
}

/** Module-level singleton */
export const chatService = new ChatService();
