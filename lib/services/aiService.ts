export interface AIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface AIResponse {
  text: string;
  suggestions?: string[];
}

export interface AIService {
  sendMessage(
    message: string,
    role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null,
    onChunk?: (text: string) => void
  ): Promise<AIResponse>;
  getSuggestions(role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null): string[];
}

// Role-specific suggestions mapping
const ROLE_SUGGESTIONS: Record<string, string[]> = {
  guest: [
    "How do I register a team?",
    "What is the schedule & timeline?",
    "What are the general rules?",
    "How can I log in using Google?"
  ],
  participant: [
    "Where is my team QR code?",
    "How do I submit my project?",
    "Where can I find templates & datasets?",
    "How do I raise a support ticket?"
  ],
  judge: [
    "How do I evaluate a project?",
    "What are the scoring criteria?",
    "Where can I leave feedback for teams?",
    "How can I view team project details?"
  ],
  volunteer: [
    "How do I check in a team?",
    "How do I view and assign support tickets?",
    "Where is the volunteer dashboard?",
    "How can I contact organizers?"
  ],
  organizer: [
    "How do I post a new announcement?",
    "How can I update problem statements?",
    "Where do I manage support tickets?",
    "How do I check team registrations?"
  ],
  admin: [
    "How do I manage platform volunteers?",
    "How do I verify team profiles?",
    "How can I edit problem statements?",
    "Where do I view all platform activity?"
  ]
};

// Knowledge base entries
interface KBEntry {
  keywords: string[];
  response: string;
  roles?: string[]; // Allowed roles or optimized for these roles
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ["register", "sign up", "create team", "registration"],
    response: `To **register** or **create a team** on AI Hack Lab 2026:
1. Go to the [Registration Page](/register) from the navigation bar.
2. Fill out your team name and project description.
3. Add participant details (Name, Register Number, Email, Department, Year, Skills, and GitHub) for all team members.
4. Mark the leader of the team.
5. Click **Submit Registration**.

*Note: The platform is frontend-only, so your registration details will be saved to your local browser storage.*`
  },
  {
    keywords: ["login", "sign in", "google auth", "authentication"],
    response: `You can log in to the platform in two ways:
- **Email Login**: Go to the [Login Page](/login), select your role (Participant, Judge, Volunteer, Organizer, or Admin), enter the matching mock email, and click **Sign In**.
- **Google Authentication**: Click the Google Auth button on the login screen for instant mock authentication using preset credentials.

**Mock Accounts for Testing:**
- **Admin**: \`admin@college.edu\`
- **Judge**: \`judge@college.edu\`
- **Organizer**: \`organizer@college.edu\`
- **Participant**: Any member email from an approved team.`
  },
  {
    keywords: ["qr code", "qr token", "attendance", "check in"],
    response: `### Team QR Code & Check-in
Every approved team receives a unique **QR Code Token** (e.g., \`AI26-105-SEC4X\`).
- **Participants**: You can view your QR Code on the [Participant Dashboard](/dashboard) under the **Team Status** section.
- **Volunteers & Organizers**: Scan this QR code or enter the code manually on the [Volunteer Dashboard](/volunteer) or [Organizer Dashboard](/organizer) to check in teams when they arrive at the venue.`,
    roles: ["participant", "volunteer", "organizer", "admin"]
  },
  {
    keywords: ["judge", "evaluation", "score", "criteria", "grading"],
    response: `### Judging & Project Evaluation
Judges evaluate team projects based on these core categories:
1. **Innovation (1-10)**: Originality and creative application of AI.
2. **Feasibility (1-10)**: Practical viability and market readiness.
3. **Presentation (1-10)**: Communication, slide quality, and demo pitch.
4. **Technical Depth (1-10)**: Quality of code, API usage, and architecture.
5. **AI Usage (1-10)**: Effectiveness of machine learning, NLP, or LLM integrations.

**How to evaluate:**
1. Navigate to the [Judge Dashboard](/judge).
2. Click **Evaluate** next to any checked-in team.
3. Use the sliders to input scores, write constructive feedback, and click **Submit Evaluation**.`
  },
  {
    keywords: ["volunteer", "responsibility", "assigned area"],
    response: `### Volunteer Workflow
As a volunteer, you are responsible for venue operations:
- **Team Check-In**: Check in arriving teams using the manual check-in or QR scanner on the [Volunteer Dashboard](/volunteer).
- **Support Tickets**: Assist teams with support requests. You can view, assign, and mark tickets as *Assigned*, *In Progress*, or *Resolved*.`
  },
  {
    keywords: ["organizer", "dashboard", "control"],
    response: `### Organizer Operations
Organizers have high-level overview controls:
- **Team Management**: Approve, reject, or review registrations.
- **Announcements**: Post notifications and updates to all users.
- **Problem Statements**: Add, edit, or archive hackathon tracks/problem statements.
- **Support Tickets**: Monitor ticket resolution across all teams.`
  },
  {
    keywords: ["admin", "privileges", "manage"],
    response: `### Admin Privileges
The Admin has full control over the platform's infrastructure:
- **Volunteer Management**: Add, edit, or remove volunteers and assign them responsibilities.
- **Global Overview**: Track all teams, verify profiles, and inspect support tickets across the venue.`
  },
  {
    keywords: ["timeline", "schedule", "events", "dates"],
    response: `### AI Hack Lab 2026 Timeline
- **Day 1 - 08:00 AM**: Registration & Team Setup
- **Day 1 - 10:00 AM**: Hackathon Kickoff & Problem Statement release
- **Day 1 - 02:00 PM**: Mentor Round 1 (Ideation & Design evaluation)
- **Day 1 - 09:00 PM**: Mentor Round 2 (Database & API Schema check)
- **Day 2 - 08:00 AM**: Mentor Round 3 (Core ML/AI Model integration review)
- **Day 2 - 01:00 PM**: Soft Pitching (Frontend & Slides review)
- **Day 2 - 04:00 PM**: Final Submissions Deadline
- **Day 2 - 05:00 PM**: Grand Judging & Pitching Session
- **Day 2 - 07:30 PM**: Valedictory & Prize Distribution`
  },
  {
    keywords: ["problem", "statement", "track", "theme"],
    response: `### Hackathon Tracks & Problem Statements
We have 3 major tracks for AI Hack Lab 2026:
1. **Generative AI & LLMs**: Build intelligent agents, chat systems, or content generators.
2. **Healthcare & Assistive Technology**: AI diagnostics, accessibility tools, or health helpers.
3. **Smart Infrastructure & Sustainability**: Energy optimization, green computing, or traffic planning.

Explore all detailed tracks and guidelines on the [Resources Page](/resources).`
  },
  {
    keywords: ["rule", "guideline", "plagiarism", "disclose"],
    response: `### General Rules & Guidelines
- **Team Size**: 2 to 4 members.
- **Originality**: Plagiarism is strictly prohibited. All code must be written during the hackathon. Pre-existing templates must be declared.
- **AI Disclosure**: Teams must explicitly disclose any AI tools, pre-trained models, or LLM APIs utilized in their project submission forms.
- **IP Ownership**: Projects built during the hackathon belong to the respective creators.`
  },
  {
    keywords: ["dataset", "template", "downloads", "resource"],
    response: `### Templates & Datasets
You can access templates and developer guides on the [Resources Page](/resources).
Available downloads:
- **Pitch Deck Template** (.pptx / Google Slides format)
- **Sample Datasets**:
  - *Medical Image Classifier set* (1.2GB)
  - *Urban Transit Logs* (150MB CSV)
  - *Generative Text Corpus* (45MB JSON)
- **Boilerplates**: Next.js + Tailwind starter, PyTorch starter kit.`
  },
  {
    keywords: ["support", "ticket", "raise ticket", "help", "internet", "power"],
    response: `### Support Tickets
If you encounter any venue-related issues (e.g., Internet disconnects, power outlet failure, food requests):
1. Navigate to the **Support** section in your dashboard.
2. Select a category: *Internet*, *Power*, *Hardware*, *Food*, *Venue*, or *Other*.
3. Choose a priority: *Low*, *Medium*, *High*, or *Critical*.
4. Write a brief description and click **Raise Ticket**.

A volunteer will be dispatched to your team's table immediately to resolve the issue.`
  },
  {
    keywords: ["submit", "submission", "project", "github", "video"],
    response: `### Project Submission Workflow
When your team is ready to submit:
1. Go to your [Dashboard](/dashboard) and click **Project Submission**.
2. Provide:
   - Project Name
   - Detailed Description
   - GitHub Repository URL
   - Demo URL (Vercel/Netlify link)
   - 2-minute Video Pitch URL (YouTube/Loom)
   - AI Tools Disclosure (List any LLMs, Copilots, or generators used)
3. Click **Submit Project**.

*Important: Submissions close exactly at 04:00 PM on Day 2. No extensions will be granted.*`
  },
  {
    keywords: ["certificate", "results", "prize", "winner"],
    response: `### Certificates & Results
- **Certificates**: All registered participants who attend and submit a project will receive a **Participation Certificate** downloadable directly from the dashboard after the hackathon ends.
- **Results**: Final winners will be announced during the Valedictory ceremony on Day 2 at 07:30 PM. Results will also be visible on the public [Announcements Page](/hackathon).`
  },
  {
    keywords: ["profile", "edit profile", "skills"],
    response: `### User Profile Management
You can update your personal details and developer profiles:
- Go to the **Profile** section in your dashboard.
- Update your profile picture, bio, skills, and links (e.g., GitHub, LinkedIn).
- Click **Save Changes** to persist your profile.`
  }
];

// Fallback response if no keywords match
const DEFAULT_RESPONSE = `I'm here to help you navigate AI Hack Lab 2026! 

You can ask me questions about:
- **Registration & Login**
- **Team QR Codes & Attendance Check-ins**
- **Project Submissions & Timeline**
- **Evaluating teams** (for Judges)
- **Handling support tickets** (for Volunteers)
- **Accessing datasets and starter boilerplates**

Try clicking one of the suggested prompts below or type your question directly!`;

export class FrontendAIService implements AIService {
  public getSuggestions(role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null): string[] {
    const roleKey = role || "guest";
    return ROLE_SUGGESTIONS[roleKey] || ROLE_SUGGESTIONS.guest;
  }

  public async sendMessage(
    message: string,
    role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null,
    onChunk?: (text: string) => void
  ): Promise<AIResponse> {
    // 1. Simulate network delay (500ms before starting response)
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 2. Perform simple keyword match
    const cleanMsg = message.toLowerCase().trim();
    const matchedEntry = KNOWLEDGE_BASE.find((entry) => {
      // If entry is restricted to roles, filter
      if (entry.roles && role && !entry.roles.includes(role)) return false;
      return entry.keywords.some((keyword) => cleanMsg.includes(keyword));
    });

    const responseText = matchedEntry ? matchedEntry.response : DEFAULT_RESPONSE;

    // 3. Simulate streaming chunk-by-chunk if onChunk is provided
    if (onChunk) {
      const words = responseText.split(" ");
      let currentText = "";
      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? "" : " ") + words[i];
        onChunk(currentText);
        // Vary the speed slightly for a realistic feel
        const delay = 15 + Math.random() * 20;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      text: responseText,
      suggestions: this.getSuggestions(role)
    };
  }
}

export const aiService = new FrontendAIService();
