# 🧑‍💻 Developer Onboarding Guide

Welcome to the team! This onboarding document is designed to get you productive on the codebase in less than one hour.

---

## 🚀 Quick Local Setup

1. **Install Prerequisites**: Ensure you have Node.js (v18.x or above) installed on your system.
2. **Clone & Install**:
   ```bash
   git clone https://github.com/AI-LAB-SIET/hackathon-website.git
   cd hackathon-website
   npm install
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
4. **Access UI**: Open [http://localhost:3000](http://localhost:3000) (or the port specified in your terminal) to view the landing page.

---

## 🎨 Mock Authentication Roles

You don't need a real database running to verify page routes. Access any dashboard immediately using our pre-seeded test accounts:
* **Admin**: `admin@siet.edu` / `admin123`
* **Organizer**: `organizer@siet.edu` / `organizer123`
* **Judge**: `judge@siet.edu` / `judge123`
* **Volunteer**: `volunteer@siet.edu` / `volunteer123`
* **Participant**: `participant@siet.edu` / `participant123`

---

## 🌳 Branching & Git Conventions

To maintain a clean and reviewable history:
* **Branch Format**:
  - `feat/feature-description`: For new features.
  - `fix/bug-description`: For bugs.
  - `chore/task-description`: For refactors, docs, or cleanups.
* **Commit Message Format**: Follow standard conventional commit formats:
  - `feat: add support ticket resolve button`
  - `fix: correct layout shifts on mobile login`
  - `docs: update onboarding steps`

---

## 🧑‍💻 Code Quality Standards

* **No Conditional Hooks**: Always define React hooks before any early returns to satisfy `react-hooks/rules-of-hooks`.
* **TypeScript Types**: Declare types for interface responses under `src/types/api/*`.
* **Linting Checks**: Run `npm run lint` and verify there are no compilation warnings or errors before pushing code.
* **Build Verification**: Run `npm run build` locally to verify build performance and output bundle sizes.
