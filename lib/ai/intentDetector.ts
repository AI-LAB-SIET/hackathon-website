// lib/ai/intentDetector.ts
/**
 * Simple intent detection for the AI assistant.
 * This is a lightweight keyword‑based classifier that maps a user query
 * to one of the supported intents. It is deliberately deterministic and
 * does not rely on any external ML services, keeping the server side safe.
 */
export enum Intent {
  KnowledgeBase = "KnowledgeBase",
  UserProfile = "UserProfile",
  TeamInfo = "TeamInfo",
  Announcements = "Announcements",
  Schedule = "Schedule",
  Resources = "Resources",
  General = "General",
}

/**
 * Detects intent based on the presence of specific keywords.
 * Returns {@link Intent.General} when nothing matches.
 */
export function detectIntent(query: string): Intent {
  const lower = query.toLowerCase();
  // Knowledge base related keywords
  if (/\b(rulebook|faq|document|guide|policy|knowledge)\b/.test(lower)) {
    return Intent.KnowledgeBase;
  }
  // User profile related
  if (/\b(my profile|who am i|my details)\b/.test(lower)) {
    return Intent.UserProfile;
  }
  // Team information
  if (/\b(my team|team members|team info|team)\b/.test(lower)) {
    return Intent.TeamInfo;
  }
  // Announcements
  if (/\b(announcement|news|updates)\b/.test(lower)) {
    return Intent.Announcements;
  }
  // Schedule
  if (/\b(schedule|timeline|agenda|when)\b/.test(lower)) {
    return Intent.Schedule;
  }
  // Resources
  if (/\b(resource|api|dataset|template|tool)\b/.test(lower)) {
    return Intent.Resources;
  }
  return Intent.General;
}
