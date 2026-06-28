/**
 * lib/ai/conversationManager.ts
 *
 * In-memory, server-scoped conversation history store.
 *
 * Architectural decision: this module is the ONLY place that knows where
 * conversation state lives. It is intentionally designed to be swapped out
 * for a Firestore-backed implementation in Phase 3 without touching any other
 * file — only this module changes.
 *
 * Current implementation: Node.js module-level Map (ephemeral, per-process).
 * Phase 3 migration path: replace the Map with Firestore collection reads/writes
 * behind the same public interface (getHistory / appendMessage / clearHistory).
 *
 * Security note: sessionId is generated client-side (UUID v4). In a production
 * system, this should be tied to an authenticated user token. For Phase 2 this
 * is acceptable because no sensitive data is stored here.
 */

import type { ChatMessage } from "./types";

/** Maximum number of messages retained per session to keep token usage bounded */
const MAX_HISTORY_LENGTH = 20;

/** Singleton in-memory store — shared across all API route invocations in the same process */
const store = new Map<string, ChatMessage[]>();

export class ConversationManager {
  /**
   * Retrieve the full conversation history for a session.
   * Returns an empty array if the session does not exist yet.
   */
  getHistory(sessionId: string): ChatMessage[] {
    return store.get(sessionId) ?? [];
  }

  /**
   * Append a single message to a session's history.
   * Automatically prunes older messages if the history exceeds MAX_HISTORY_LENGTH.
   */
  appendMessage(sessionId: string, message: ChatMessage): void {
    const history = store.get(sessionId) ?? [];
    history.push(message);
    // Keep only the most recent N turns to avoid context overflow
    if (history.length > MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - MAX_HISTORY_LENGTH);
    }
    store.set(sessionId, history);
  }

  /**
   * Clear all history for a session (called when user clicks "Clear conversation").
   */
  clearHistory(sessionId: string): void {
    store.delete(sessionId);
  }

  /**
   * Returns the total number of active sessions (useful for monitoring).
   */
  activeSessionCount(): number {
    return store.size;
  }
}

/** Module-level singleton — exported for use by ChatService and the API route */
export const conversationManager = new ConversationManager();
