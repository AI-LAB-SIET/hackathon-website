/**
 * lib/ai/chatService.ts
 *
 * Orchestration layer between the API route and the underlying basic chatbot.
 *
 * Responsibilities:
 * 1. Validate inputs
 * 2. Load conversation history from ConversationManager
 * 3. Generate a basic response (no AI model used)
 * 4. Persist new user + assistant messages back to ConversationManager
 *
 * This service provides a simple rule-based response for development/testing
 * when NVIDIA NIM is not available or desired.
 */

import { conversationManager } from "./conversationManager";
import type { UserRole } from "./types";

export class ChatService {
  /**
   * Returns an AsyncIterable<string> of text deltas from a basic chatbot.
   * Persists the full assistant reply to conversation history after streaming completes.
   */
  async *streamResponse(
    sessionId: string,
    userMessage: string,
    role: UserRole
  ): AsyncIterable<string> {
    // Persist the user's message immediately
    conversationManager.appendMessage(sessionId, {
      role: "user",
      content: userMessage,
    });

    const fullReply = this.generateBasicResponse(userMessage, role);

    // Simulate streaming by yielding words one by one with small delays
    const words = fullReply.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      // Small delay to simulate streaming (optional, but makes it feel more realistic)
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Single-shot (non-streaming) completion. Returns the full assistant text.
   */
  async chatOnce(
    sessionId: string,
    userMessage: string,
    role: UserRole
  ): Promise<string> {
    conversationManager.appendMessage(sessionId, {
      role: "user",
      content: userMessage,
    });

    const reply = this.generateBasicResponse(userMessage, role);

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

  // ── Private ────────────────────────────────────────────────────────────────

  /**
   * Generates a basic response based on the user message and role.
   * This is a simple rule-based system for demonstration purposes.
   */
  private generateBasicResponse(userMessage: string, role: UserRole): string {
    const lowerMsg = userMessage.toLowerCase().trim();

    // Handle empty messages
    if (!lowerMsg) {
      return "Hello! How can I assist you today?";
    }

    // Role-specific responses
    if (role === 'admin') {
      if (lowerMsg.includes('team') || lowerMsg.includes('participant')) {
        return "As an admin, you can manage teams, participants, and announcements from the admin dashboard. What would you like to do?";
      }
      if (lowerMsg.includes('announcement')) {
        return "You can create and manage announcements in the Announcements tab. Would you like to post a new announcement?";
      }
    }

    if (role === 'judge') {
      if (lowerMsg.includes('score') || lowerMsg.includes('evaluate')) {
        return "As a judge, you can evaluate team projects in the Problems tab. You'll find published problem statements there to evaluate.";
      }
      if (lowerMsg.includes('feedback')) {
        return "Remember to provide constructive feedback when evaluating teams. Focus on innovation, feasibility, and presentation.";
      }
    }

    if (role === 'participant' || role === 'organizer' || role === 'volunteer') {
      if (lowerMsg.includes('schedule') || lowerMsg.includes('timeline')) {
        return "The hackathon schedule is available in the dashboard. Key events: Opening ceremony (9 AM), Workshop sessions (11 AM), Hacking begins (1 PM), Midpoint check-in (5 PM), Final presentations (next day 10 AM).";
      }
      if (lowerMsg.includes('team') || lowerMsg.includes('join')) {
        return "You can join or create a team in the Participants tab. Make sure your team has 2-4 members and selects a problem statement to work on.";
      }
      if (lowerMsg.includes('problem') || lowerMsg.includes('challenge')) {
        return "Check the Problems tab for available problem statements. Select one that interests your team and start working on your solution!";
      }
    }

    // General responses
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return "Hello! Welcome to the AI Hack Lab 2026 assistant. How can I help you today?";
    }
    if (lowerMsg.includes('help') || lowerMsg.includes('support')) {
      return "I'm here to help! You can ask about: hackathon schedule, team formation, problem statements, announcements, or general event information.";
    }
    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
      return "You're welcome! Happy hacking!";
    }
    if (lowerMsg.includes('weather')) {
      return "I don't have access to real-time weather data, but I hope it's a great day for hacking!";
    }
    if (lowerMsg.includes('food') || lowerMsg.includes('lunch') || lowerMsg.includes('dinner')) {
      return "Meals are provided during the event! Check the announcements for meal times and locations.";
    }

    // Default response
    return `I received your message: "${userMessage}". I'm a basic chatbot designed to help with common hackathon questions. Try asking about the schedule, teams, problem statements, or announcements!`;
  }
}

/** Module-level singleton */
export const chatService = new ChatService();