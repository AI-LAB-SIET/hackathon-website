# SIET AI Hack Lab Platform (AI Hack Lab 2026)

An elite, frontend-first, production-ready hackathon management platform built for college hackathons. The system coordinates registrations, team management, QR-based check-ins, real-time judge project grading, volunteer support tickets, and live organizer controls.

---

## 🏛️ Comprehensive Documentation Index

To support a large multidisciplinary engineering team, the platform is fully documented across dedicated engineering specifications:

### Core Architecture & State
- 🌐 **[Architecture Overview](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/ARCHITECTURE.md)**: Repository folder mappings, architectural components, and data flows.
- 🏎️ **[Frontend Architecture](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/FRONTEND_ARCHITECTURE.md)**: Lazy-loading strategies, theme triggers, transitions, and breakpoints.
- 💾 **[State Management](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/STATE_MANAGEMENT.md)**: Global context hook (`useAppState`) and `localStorage` caching mechanics.

### Design & Roles
- 🎨 **[Design System Guidelines](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/DESIGN_SYSTEM.md)**: Color tokens, glassmorphism templates, spacing rules, and typography.
- 🔑 **[Role & Permissions Matrix](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/ROLE_MATRIX.md)**: Entry point dashboards and operation mapping by user type.

### Systems & Workflows
- 🔒 **[Authentication & Credentials](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/AUTHENTICATION.md)**: Mock accounts, sign-in processes, and testing credentials.
- 🎫 **[QR Code Check-in System](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/QR_SYSTEM.md)**: QR lifecycle, token formats, and scanner component details.
- 🤖 **[AI Assistant Subsystem](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/AI_ASSISTANT.md)**: Knowledge base matching engine, layout mounting, and live integration strategy.

### Engineering Decisions & Onboarding
- 0️⃣ **[ADR 0001: Frontend-First Simulation](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/adr/0001-frontend-first-architecture.md)**: Rationale for simulating databases on browser storage.
- 1️⃣ **[ADR 0002: Lazy Loading Chat Window](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/adr/0002-lazy-loading-ai-assistant.md)**: Performance decisions to keep the landing page bundle lightweight.
- 🧑‍💻 **[Developer Onboarding Guide](file:///c:/Users/nitis/OneDrive/Documents/AI%20Lab%20Hackathon%20website/docs/ONBOARDING.md)**: Git conventions, branch strategy, testing, and linting rules.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 15.5 (App Router, Server-side Layout Composition)
- **Styling**: Tailwind CSS v4 (with custom `@theme` properties)
- **Animations**: Framer Motion 12.0 (for layout slides, chat entries, and page loads)
- **Icons**: Lucide React
- **Scanning**: HTML5 QR Code API

---

## 🚀 Getting Started

### Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/AI-LAB-SIET/hackathon-website.git
   cd hackathon-website
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the link displayed in terminal (typically **[http://localhost:3002](http://localhost:3002)** if port 3000 is occupied).

### Running Production Check
Verify compilation and lint checks:
```bash
npm run build
```
