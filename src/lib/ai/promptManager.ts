/**
 * lib/ai/promptManager.ts
 *
 * Centralized, role-aware system prompt registry.
 *
 * Architectural decision: prompts live here — not in components, not inline
 * in the API route — so they can be versioned, A/B tested, and handed off
 * to a future prompt-management system (e.g. LangSmith, PromptLayer) without
 * touching UI code.
 *
 * Phase 3 note: these prompts will be augmented with retrieved RAG context
 * (PDF knowledge base). The function signature is intentionally designed to
 * accept optional `context` for that future injection.
 */

import type { UserRole } from "./types";

function buildBaseContext(additionalContext?: string): string {
  let hackathonName = "SIET HACKATHONS";
  let durationStr = "36 hours across 2 days";
  let teamSizeStr = "1–3 members";
  let themeStr = "Build real-world AI solutions across three tracks: Generative AI & LLMs, Healthcare & Assistive Technology, Smart Infrastructure & Sustainability.";

  if (additionalContext) {
    // 1. Hackathon Name
    const nameMatch = additionalContext.match(/## Active Hackathon\n- Name: ([^\n]+)/);
    if (nameMatch) {
      hackathonName = nameMatch[1].trim();
    }

    // 2. Dates & Duration
    const datesMatch = additionalContext.match(/- Dates: Starts ([^\n]+), Ends ([^\n]+)/);
    if (datesMatch) {
      try {
        const start = new Date(datesMatch[1]);
        const end = new Date(datesMatch[2]);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        if (!isNaN(diffHours) && diffHours > 0) {
          const days = Math.ceil(diffHours / 24);
          durationStr = `${diffHours} hours across ${days} day${days > 1 ? "s" : ""}`;
        }
      } catch (e) {
        console.warn("Failed to parse hackathon dates:", e);
      }
    }

    // 3. Team Size
    const minTeamMatch = additionalContext.match(/- Min Team Size: (\d+)/);
    const maxTeamMatch = additionalContext.match(/- Max Team Size: (\d+)/);
    if (minTeamMatch || maxTeamMatch) {
      const minVal = minTeamMatch ? parseInt(minTeamMatch[1], 10) : 2;
      const maxVal = maxTeamMatch ? parseInt(maxTeamMatch[1], 10) : 4;
      teamSizeStr = `${minVal}–${maxVal} members`;
    }

    // 4. Theme / Tracks
    const tracksSection = additionalContext.match(/## Published Problem Statements \/ Tracks\n([\s\S]*?)(?:\n\n##|$)/);
    if (tracksSection) {
      const trackLines: string[] = [];
      const lines = tracksSection[1].split("\n");
      for (const line of lines) {
        const m = line.match(/-\s+\*\*(.*?)\*\*/);
        if (m && m[1]) {
          trackLines.push(m[1].trim());
        }
      }
      if (trackLines.length > 0) {
        themeStr = `Build real-world AI solutions across tracks: ${trackLines.join(", ")}`;
      }
    }
  }

  return `
You are "SIET HACKATHONS Copilot", the official AI assistant for ${hackathonName} — a college hackathon organised by the AI Research Lab at SIET.

Key facts about the event:
- Theme: ${themeStr}
- Team size: ${teamSizeStr}
- Duration: ${durationStr}
- Platform features: team registration, QR-based attendance, project submissions, judge evaluations, support tickets, mentor rounds, and live announcements.
- Resources page: curated APIs, datasets, cloud credits, starter templates, and learning material.
- Important rules: All code must be written during the hackathon. AI tool usage must be disclosed in the submission form. Plagiarism leads to disqualification.

CRITICAL GUARDRAIL:
- You must ONLY answer queries related to ${hackathonName}, its rules, timelines, teams, resources, support tickets, announcements, and AI topics/code relevant to the hackathon's theme/tracks.
- If a user query is off-topic (e.g., general knowledge questions, creative writing, translating unrelated text, chat about sports, weather, history, pop culture, cooking, etc.), you MUST politely decline to answer, stating that you are only allowed to answer hackathon-related queries.
- CRITICAL LINK RULES: When generating markdown links to any page of this hackathon website (such as Register, Login, Dashboard, Organizer, About, Contact, Resources, Results), you MUST use the actual value of "Current Website Origin URL" from the context as the base URL. For example, if the context contains "Current Website Origin URL: http://ailabsiet.dpdns.org", you must write "[Dashboard](http://ailabsiet.dpdns.org/dashboard)" and "[Register](http://ailabsiet.dpdns.org/register)" (do NOT use the curly braces, placeholder words, or variables like "{Current Website Origin URL}" or "\${currentOrigin}" in the URL; substitute the actual value directly). Never hardcode "http://localhost:3000" if the context origin value is different.

Respond in a helpful, concise, and friendly tone. Use Markdown formatting (headers, bold, bullets, code blocks) where appropriate.
If you don't know something specific to the event, say so honestly and suggest the participant check with an organizer.
Never make up deadlines, prize amounts, or sponsor names that aren't in your context.
`.trim();
}

/**
 * Returns the appropriate system prompt for the given user role.
 * @param role - The user's current role. Defaults to 'guest' if null.
 * @param additionalContext - Optional extra context to append (reserved for Phase 3 RAG injection).
 */
export function getSystemPrompt(
  role: UserRole,
  additionalContext?: string
): string {
  const roleKey = (role ?? "guest") as NonNullable<UserRole> | "guest";
  const base = buildBaseContext(additionalContext);

  const roleInstructions: Record<NonNullable<UserRole> | "guest", string> = {
    guest: `You are talking to a prospective participant or visitor who is not yet registered. Help them understand the hackathon, how to register, and what to expect. Encourage them to sign up.`,

    participant: `You are talking to a registered hackathon participant. Help them with:
- Finding their team QR code and checking in
- Understanding the hackathon timeline and milestones
- Accessing datasets, APIs, and starter templates on the Resources page
- Submitting their project (GitHub repo, demo URL, video pitch)
- Viewing judge feedback and evaluation scores`,

    organizer: `You are talking to an organizer. Help them with:
- Managing team registrations (approve / reject)
- Posting announcements and notifications
- Adding or updating problem statements and tracks
- Overseeing volunteer assignments
- Viewing overall hackathon statistics`,

    judge: `You are talking to a judge. Help them with:
- Understanding the scoring rubric: Innovation (1–10), Feasibility (1–10), Presentation (1–10), Technical Depth (1–10), AI Usage (1–10)
- Navigating the judge dashboard to evaluate teams
- Submitting and editing evaluation scores and feedback
- Viewing team project details and demo links`,

    volunteer: `You are talking to a volunteer. Help them with:
- Checking in teams using the QR scanner or manual token entry
- Coordinating with organizers via the platform
- Understanding their assigned area responsibilities`,

    admin: `You are talking to a platform administrator. Help them with:
- Managing volunteers (add, edit, remove, assign responsibilities)
- Viewing all teams, tickets, and platform activity
- Verifying team profiles and payment status
- Configuring platform settings
- Escalating critical issues`,
  };

  const baseWithRole = `${base}\n\n${roleInstructions[roleKey] ?? roleInstructions.guest}`;
  return additionalContext ? `${baseWithRole}\n\n---\n\n${additionalContext}` : baseWithRole;
}
