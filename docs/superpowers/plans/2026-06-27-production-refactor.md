# Production Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the hackathon platform into a polished, performant, production-ready Offline AI Hackathon Management Platform with proper dark mode, real QR scanning, removed mentor role, and consistent UI.

**Architecture:** Single-page app dashboards with role-based navigation via Sidebar. State managed via React Context (StateProvider). All data persisted to localStorage. No backend — fully client-side demo platform.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Framer Motion, lucide-react, qrcode library

---

## Audit Findings Summary

### Critical Issues
1. Dark mode is broken — only body bg/text changes, no `dark:` variants on components
2. Mentor role exists and must be removed entirely
3. No real QR scanning — currently search-based simulation
4. `/timeline` link on homepage is broken (404)
5. Dead code: `table.tsx`, `CountdownTimer.tsx`, `hackathon-website/` directory
6. Zero `React.memo`/`useMemo`/`useCallback` — causes unnecessary re-renders
7. StateProvider is a monolithic god object — every state change re-renders all consumers

### Feature Changes Required
1. Remove mentor role completely
2. Remove Resources from public nav, keep only Templates + Datasets in workspace
3. Remove Datasets from Hackathon page
4. Replace Discord with WhatsApp on Contact page
5. Add Google Auth (Continue with Google)
6. Move registration into My Team tab
7. Remove Project Brief and Milestones from Project tab
8. Remove notification sidebar entry — bell only
9. Remove mock user info from Sidebar
10. Individual participant QR + separate Team QR
11. Canvas-based circular reveal for theme toggle
12. Real QR detection with device camera
13. Volunteer portal needs Attendance, QR Scanner, Support, Approval View tabs

---

## Task Groups

### Group 1: Dead Code Removal & Cleanup
### Group 2: Mentor Role Removal
### Group 3: Navigation & Route Fixes
### Group 4: Dark Mode Implementation
### Group 5: Performance Optimization
### Group 6: QR Scanner Real Implementation
### Group 7: Participant Workspace Refactor
### Group 8: Volunteer Portal Enhancement
### Group 9: Contact Page Update
### Group 10: UI Consistency Audit
### Group 11: Error Handling & Accessibility
### Group 12: Final Verification

---

## Task 1: Dead Code Removal & Cleanup

**Files:**
- Delete: `components/ui/table.tsx`
- Delete: `components/cards/CountdownTimer.tsx`
- Delete: `hackathon-website/` directory (entire folder)

- [ ] **Step 1: Delete orphaned table component**
  ```bash
  rm components/ui/table.tsx
  ```

- [ ] **Step 2: Delete orphaned CountdownTimer**
  ```bash
  rm components/cards/CountdownTimer.tsx
  ```

- [ ] **Step 3: Delete stale hackathon-website copy**
  ```bash
  rm -rf hackathon-website/
  ```

- [ ] **Step 4: Remove unused Gavel import from judge page**
  In `app/judge/page.tsx`, remove the unused `Gavel` import from lucide-react (line ~15). The inline `GavelIcon` component at the bottom of the file is used instead.

- [ ] **Step 5: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 6: Commit**
  ```bash
  git add -A && git commit -m "chore: remove dead code, orphaned components, and stale hackathon-website copy"
  ```

---

## Task 2: Remove Mentor Role Completely

**Files:**
- Delete: `app/mentor/page.tsx`
- Modify: `components/layout/Sidebar.tsx` — remove mentor case
- Modify: `app/login/page.tsx` — remove mentor option
- Modify: `components/layout/Navbar.tsx` — remove mentor portal link
- Modify: `types/index.ts` — remove mentor from role unions
- Modify: `components/layout/StateProvider.tsx` — remove mentor from login function

- [ ] **Step 1: Delete mentor page**
  ```bash
  rm app/mentor/page.tsx
  ```

- [ ] **Step 2: Remove mentor from Sidebar**
  In `components/layout/Sidebar.tsx`, remove the entire `case "mentor":` block (lines ~71-78) from the `getTabs()` switch statement.

- [ ] **Step 3: Remove mentor from login page**
  In `app/login/page.tsx`:
  - Remove `"mentor"` from the `RoleType` union
  - Remove the mentor option from the role `<select>` dropdown
  - Remove the mentor quick-autofill button
  - Remove the mentor redirect in the login handler

- [ ] **Step 4: Remove mentor from Navbar**
  In `components/layout/Navbar.tsx`, remove the mentor case from `rolePortalHref` and `rolePortalLabel` (lines ~38-46).

- [ ] **Step 5: Remove mentor from types**
  In `types/index.ts`, remove `"mentor"` from all role union types (UserSession.role, UserProfile.role).

- [ ] **Step 6: Remove mentor from StateProvider login**
  In `components/layout/StateProvider.tsx`, remove the mentor case from the `login` function (lines ~100-103).

- [ ] **Step 7: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 8: Commit**
  ```bash
  git add -A && git commit -m "feat: remove mentor role completely from platform"
  ```

---

## Task 3: Navigation & Route Fixes

**Files:**
- Modify: `app/page.tsx` — fix /timeline broken link
- Modify: `components/layout/Footer.tsx` — remove Resources nav, fix dead links
- Modify: `app/hackathon/page.tsx` — remove Datasets tab
- Modify: `components/layout/Navbar.tsx` — remove Resources link

- [ ] **Step 1: Fix broken /timeline link on homepage**
  In `app/page.tsx` line 144, change `href="/timeline"` to `href="/hackathon"` (since the timeline content is now in the hackathon page's Schedule tab).

- [ ] **Step 2: Remove Resources from public Navbar**
  In `components/layout/Navbar.tsx`, remove the "Resources" nav link from the desktop and mobile navigation. Resources should only be accessible from within the authenticated workspace.

- [ ] **Step 3: Remove Resources from Footer**
  In `components/layout/Footer.tsx`, remove the "Resources Hub" link from the Event Navigator section. Remove the entire "Resources" column (lines ~84-103) since those are placeholder links anyway.

- [ ] **Step 4: Remove Datasets from Hackathon page**
  In `app/hackathon/page.tsx`:
  - Remove `"datasets"` from the `TabType` union
  - Remove the datasets tab from the `tabs` array
  - Remove the datasets content section
  - Remove the `datasets` import from `@/lib/resources`

- [ ] **Step 5: Fix Footer dead links**
  In `components/layout/Footer.tsx`:
  - Remove the "College AI Portal", "Idea Slide Deck Template", "API Documentation" placeholder links (href="#")
  - Remove or update "Privacy Policy" and "Terms of Service" placeholder links

- [ ] **Step 6: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 7: Commit**
  ```bash
  git add -A && git commit -m "fix: remove broken /timeline link, remove Resources from public nav, remove Datasets from hackathon page"
  ```

---

## Task 4: Contact Page — Discord to WhatsApp

**Files:**
- Modify: `app/contact/page.tsx`

- [ ] **Step 1: Read current contact page**
  Read `app/contact/page.tsx` to find the Discord reference.

- [ ] **Step 2: Replace Discord with WhatsApp**
  Find the Discord card/section and replace it with a WhatsApp card:
  - Change icon from Discord to Phone/MessageCircle
  - Change label from "Discord Server" to "WhatsApp Group"
  - Change link to a WhatsApp group invite URL
  - Update description text
  - Change button text to "Join WhatsApp Group"

- [ ] **Step 3: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add -A && git commit -m "feat: replace Discord with WhatsApp on contact page"
  ```

---

## Task 5: Dark Mode — Full Implementation

**Files:**
- Modify: `components/layout/Navbar.tsx` — add dark: variants
- Modify: `components/layout/Sidebar.tsx` — add dark: variants
- Modify: `components/layout/Footer.tsx` — add dark: variants
- Modify: `components/ui/button.tsx` — add dark: variants
- Modify: `components/ui/input.tsx` — add dark: variants
- Modify: `components/ui/badge.tsx` — add dark: variants
- Modify: `components/ui/avatar.tsx` — add dark: variants
- Modify: `components/ui/modal.tsx` — add dark: variants
- Modify: `components/ui/toast.tsx` — add dark: variants
- Modify: `components/cards/FeatureCard.tsx` — add dark: variants
- Modify: `components/cards/FAQSection.tsx` — add dark: variants
- Modify: `app/globals.css` — add dark mode scrollbar, glassmorphism
- Modify: `components/layout/ThemeProvider.tsx` — add canvas-based circular reveal animation

- [ ] **Step 1: Update globals.css for dark mode**
  Add dark mode styles to `app/globals.css`:
  ```css
  .dark {
    color-scheme: dark;
  }
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
  }
  .dark .glassmorphism {
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
  ```

- [ ] **Step 2: Add dark: variants to Navbar**
  In `components/layout/Navbar.tsx`, add `dark:` variants to all hardcoded light colors:
  - `bg-white` → `bg-white dark:bg-gray-900`
  - `text-[#4B4B4B]` → `text-[#4B4B4B] dark:text-gray-300`
  - `border-gray-100` → `border-gray-100 dark:border-gray-800`
  - `bg-card-bg` → `bg-card-bg dark:bg-gray-800`
  - etc. for all color classes

- [ ] **Step 3: Add dark: variants to Sidebar**
  Same pattern for `components/layout/Sidebar.tsx`.

- [ ] **Step 4: Add dark: variants to Footer**
  Same pattern for `components/layout/Footer.tsx`.

- [ ] **Step 5: Add dark: variants to Button**
  In `components/ui/button.tsx`, add dark variants for each variant:
  - primary: works as-is (green on white)
  - secondary: `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`
  - ghost: `hover:bg-gray-50 dark:hover:bg-gray-800`
  - danger: works as-is

- [ ] **Step 6: Add dark: variants to Input**
  In `components/ui/input.tsx`:
  - `bg-white dark:bg-gray-800`
  - `border-gray-200 dark:border-gray-700`
  - `text-gray-900 dark:text-gray-100`

- [ ] **Step 7: Add dark: variants to Badge**
  In `components/ui/badge.tsx`, add dark variants for each color.

- [ ] **Step 8: Add dark: variants to Modal**
  In `components/ui/modal.tsx`:
  - `bg-white dark:bg-gray-900`
  - `text-gray-800 dark:text-gray-200`

- [ ] **Step 9: Add dark: variants to Toast**
  In `components/ui/toast.tsx`:
  - `bg-white dark:bg-gray-800`
  - `border-emerald-100 dark:border-gray-700`

- [ ] **Step 10: Add dark: variants to FeatureCard**
  In `components/cards/FeatureCard.tsx`:
  - `bg-white dark:bg-gray-800`
  - `border-gray-100 dark:border-gray-700`

- [ ] **Step 11: Add dark: variants to FAQSection**
  In `components/cards/FAQSection.tsx`:
  - `bg-white dark:bg-gray-800`
  - `border-gray-100 dark:border-gray-700`

- [ ] **Step 12: Add dark: variants to Avatar**
  In `components/ui/avatar.tsx`:
  - Gradient backgrounds should work in both modes

- [ ] **Step 13: Add dark: variants to all dashboard pages**
  For each dashboard page (admin, judge, organizer, volunteer, participant):
  - `bg-[#f8fafb]` → `bg-[#f8fafb] dark:bg-gray-950`
  - Card backgrounds: add `dark:bg-gray-800`
  - Text colors: add `dark:text-gray-200`
  - Border colors: add `dark:border-gray-700`

- [ ] **Step 14: Add dark: variants to login/register/hackathon/contact pages**
  Same pattern for all public pages.

- [ ] **Step 15: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 16: Commit**
  ```bash
  git add -A && git commit -m "feat: implement full dark mode across all components and pages"
  ```

---

## Task 6: Theme Toggle — Canvas Circular Reveal Animation

**Files:**
- Modify: `components/layout/ThemeProvider.tsx` — add canvas animation
- Modify: `components/layout/Navbar.tsx` — add theme toggle button with Sun/Moon icons

- [ ] **Step 1: Update ThemeProvider with canvas animation**
  Replace the current simple class-toggle with a canvas-based circular reveal:
  - Create a `<canvas>` element positioned fixed, full-screen, z-index 9999
  - On toggle, capture the button's position
  - Use `requestAnimationFrame` to animate a circular clip-path from the button position
  - The circle grows (light→dark) or shrinks (dark→light) to reveal the new theme
  - After animation completes, remove the canvas
  - Clean up properly on unmount

  ```typescript
  // In ThemeProvider.tsx, add a function like:
  const animateToggle = (buttonEl: HTMLElement) => {
    const rect = buttonEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const maxRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext("2d")!;
    const duration = 500;
    const start = performance.now();
    const expanding = theme === "light"; // growing circle for light→dark
    
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const radius = expanding ? eased * maxRadius : (1 - eased) * maxRadius;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = theme === "light" ? "#0f172a" : "#ffffff"; // new theme bg
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    };
    
    requestAnimationFrame(animate);
  };
  ```

  Expose `animateToggle` via context so the navbar button can call it.

- [ ] **Step 2: Add theme toggle to Navbar**
  In `components/layout/Navbar.tsx`, add a Sun/Moon toggle button next to the notification bell:
  ```tsx
  import { Sun, Moon } from "lucide-react";
  // ...
  <button
    onClick={(e) => { toggleTheme(); animateToggle(e.currentTarget); }}
    className="p-2.5 rounded-xl bg-card-bg border border-input-border/30 text-gray-600 hover:text-primary-green transition-colors cursor-pointer"
    aria-label="Toggle theme"
  >
    {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
  </button>
  ```

- [ ] **Step 3: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add -A && git commit -m "feat: add canvas-based circular reveal animation for theme toggle"
  ```

---

## Task 7: Performance — StateProvider Optimization

**Files:**
- Modify: `components/layout/StateProvider.tsx`

- [ ] **Step 1: Memoize context value**
  Wrap the context provider value in `useMemo` to prevent unnecessary re-renders:
  ```typescript
  const value = useMemo(() => ({
    teams, session, announcements, notifications,
    volunteers, userProfiles, problemStatements, tickets,
    login, logout,
    registerTeam, updateTeamMembers, approveTeam, rejectTeam,
    updateProjectDetails, evaluateProject, addMentorFeedback,
    updateMilestoneProgress, checkInTeam,
    addAnnouncement,
    addNotification, markNotificationRead, markAllNotificationsRead,
    raiseTicket, resolveTicket,
    addVolunteer, updateVolunteer, removeVolunteer,
    updateProfile, getProfile,
    addProblemStatement, updateProblemStatement, archiveProblemStatement,
    createTicket, assignTicket, updateTicketStatus,
  }), [teams, session, announcements, notifications, volunteers, userProfiles, problemStatements, tickets]);
  ```

- [ ] **Step 2: Memoize action functions with useCallback**
  Wrap each action function in `useCallback` to maintain stable references.

- [ ] **Step 3: Batch localStorage writes**
  Replace the 8 separate `useEffect` localStorage sync hooks with a single debounced effect:
  ```typescript
  useEffect(() => {
    if (!initialized) return;
    const timeout = setTimeout(() => {
      localStorage.setItem("siet_teams_v2", JSON.stringify(teams));
      localStorage.setItem("siet_session", JSON.stringify(session));
      localStorage.setItem("siet_announcements", JSON.stringify(announcements));
      localStorage.setItem("siet_notifications_v2", JSON.stringify(notifications));
      localStorage.setItem("siet_volunteers", JSON.stringify(volunteers));
      localStorage.setItem("siet_profiles", JSON.stringify(userProfiles));
      localStorage.setItem("siet_problems", JSON.stringify(problemStatements));
      localStorage.setItem("siet_tickets", JSON.stringify(tickets));
    }, 300); // debounce 300ms
    return () => clearTimeout(timeout);
  }, [teams, session, announcements, notifications, volunteers, userProfiles, problemStatements, tickets, initialized]);
  ```

- [ ] **Step 4: Fix registerTeam race condition**
  The `registerTeam` function creates `newTeam` inside a `setTeams` updater but then references it outside. Fix by computing the team ID before the setState:
  ```typescript
  const registerTeam = (teamData) => {
    const teamId = `team-${Date.now()}`;
    const teamNum = 100 + teams.length + 5;
    // ... create newTeam with teamId
    setTeams((prev) => [...prev, newTeam]);
    setSession({ ... , teamId });
  };
  ```

- [ ] **Step 5: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 6: Commit**
  ```bash
  git add -A && git commit -m "perf: optimize StateProvider with memoized context, batched localStorage, fixed race condition"
  ```

---

## Task 8: Performance — Component Memoization

**Files:**
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/badge.tsx`
- Modify: `components/ui/avatar.tsx`
- Modify: `components/ui/input.tsx`
- Modify: `components/cards/FeatureCard.tsx`
- Modify: `components/cards/FAQSection.tsx`
- Modify: `components/layout/PageWrapper.tsx`
- Modify: `components/layout/CinematicHero.tsx`
- Modify: `components/layout/Sidebar.tsx`
- Modify: `components/layout/Navbar.tsx`

- [ ] **Step 1: Add React.memo to pure components**
  Wrap these components in `React.memo`:
  - `Avatar` (avatar.tsx)
  - `Badge` (badge.tsx)
  - `FeatureCard` (FeatureCard.tsx)
  - `PageWrapper` (PageWrapper.tsx)

- [ ] **Step 2: Memoize expensive computations**
  In each dashboard page, wrap filtered/sorted array computations in `useMemo`:
  - `organizer/page.tsx` — memoize team filters
  - `judge/page.tsx` — memoize assigned/reviewed/pending teams
  - `volunteer/page.tsx` — memoize ticket aggregation
  - `dashboard/page.tsx` — memoize journey status calculations

- [ ] **Step 3: Memoize Sidebar tabs**
  In `components/layout/Sidebar.tsx`, wrap `getTabs()` in `useMemo`:
  ```typescript
  const tabs = useMemo(() => {
    switch (session.role) { ... }
  }, [session.role]);
  ```

- [ ] **Step 4: Fix Input ID generation**
  In `components/ui/input.tsx`, replace `Math.random()` with React's `useId()`:
  ```typescript
  const id = useId();
  ```

- [ ] **Step 5: Fix CinematicHero rAF loop**
  In `components/layout/CinematicHero.tsx`, stop the rAF loop when video opacity reaches target:
  ```typescript
  if (Math.abs(currentOpacity - targetOpacity) < 0.01) {
    setVideoOpacity(targetOpacity);
    return; // stop loop
  }
  ```

- [ ] **Step 6: Remove unnecessary "use client" from pure components**
  Remove `"use client"` from:
  - `components/ui/avatar.tsx`
  - `components/ui/badge.tsx`
  - `components/layout/Footer.tsx`

- [ ] **Step 7: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 8: Commit**
  ```bash
  git add -A && git commit -m "perf: add React.memo, useMemo, useCallback across components for render optimization"
  ```

---

## Task 9: QR Scanner — Real Camera Implementation

**Files:**
- Modify: `components/ui/QRScanner.tsx` — complete rewrite with real camera

- [ ] **Step 1: Install QR scanning library**
  ```bash
  npm install html5-qrcode
  ```

- [ ] **Step 2: Rewrite QRScanner with real camera**
  Replace the search-based QRScanner with a real camera-based QR scanner:
  - Use `Html5Qrcode` from `html5-qrcode`
  - Show live camera preview in a video element
  - Decode QR codes in real-time
  - Handle camera permissions
  - Handle camera switching (front/back)
  - Prevent duplicate scans (debounce)
  - On scan, look up the scanned token in teams/participants
  - Route to appropriate workflow based on role

  ```typescript
  import { Html5Qrcode } from "html5-qrcode";
  
  // In component:
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        handleScanResult(decodedText);
        scanner.stop(); // prevent duplicate scans
      },
      () => {} // ignore errors
    ).then(() => setScannerReady(true));
    
    return () => {
      scanner.stop().catch(() => {});
      scanner.clear();
    };
  }, [isOpen]);
  ```

- [ ] **Step 3: Add scan result routing**
  When a QR is scanned, route based on role:
  - Participant QR → Open participant profile
  - Team QR → Open team details
  - Judge → Open evaluation modal
  - Volunteer → Attendance or ticket workflow
  - Organizer → Approval workflow
  - Admin → Full management page

- [ ] **Step 4: Add camera switch button**
  Add a button to toggle between front and back cameras on mobile.

- [ ] **Step 5: Add error handling**
  Handle cases:
  - Camera permission denied
  - No camera available
  - QR code not recognized
  - Scanner initialization failure

- [ ] **Step 6: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 7: Commit**
  ```bash
  git add -A && git commit -m "feat: implement real QR scanner with device camera using html5-qrcode"
  ```

---

## Task 10: Participant Workspace — Registration in My Team

**Files:**
- Modify: `app/dashboard/page.tsx` — add registration workflow to My Team tab
- Modify: `app/register/page.tsx` — simplify or redirect to dashboard

- [ ] **Step 1: Move registration into My Team tab**
  In `app/dashboard/page.tsx`, add a registration section to the "My Team" tab that shows when the team is in PENDING state or when the team has no members added yet. Include:
  - Team name edit
  - Track selection
  - Project brief edit
  - Member management (add/remove)
  - QR pass display

- [ ] **Step 2: Remove Project Brief from Project tab**
  In the Project tab's overview sub-tab, remove the "Project Brief" / "Project Description" textarea. Keep only:
  - Track display (read-only)
  - AI Disclosure
  - GitHub/Demo/Video links (Repo sub-tab)
  - Submission (Submission sub-tab)

- [ ] **Step 3: Remove Milestones from Project tab**
  Verify milestones sub-tab is already removed. If not, remove it.

- [ ] **Step 4: Update register page to redirect**
  In `app/register/page.tsx`, after successful registration, redirect to `/dashboard#team` instead of just `/dashboard`.

- [ ] **Step 5: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 6: Commit**
  ```bash
  git add -A && git commit -m "feat: move registration workflow into My Team tab, remove Project Brief from Project"
  ```

---

## Task 11: Participant Workspace — Separate QR Codes

**Files:**
- Modify: `app/dashboard/page.tsx` — ensure individual QR and team QR are separate

- [ ] **Step 1: Verify individual participant QR exists**
  Check that the My Team tab has both:
  1. A Team QR (using QRTeamPass component with team's qrToken)
  2. An Individual Participant QR (encoding participant's email/token)

  These should be visually distinct sections, not merged.

- [ ] **Step 2: Style individual QR distinctly**
  The individual QR should be in its own card with:
  - Title: "My Personal QR"
  - Description: "Scan for attendance and identity verification"
  - QR code encoding participant email
  - Download button

- [ ] **Step 3: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add -A && git commit -m "feat: ensure individual participant QR and team QR are visually separate"
  ```

---

## Task 12: Participant Workspace — Notifications Bell Only

**Files:**
- Modify: `components/layout/Sidebar.tsx` — verify notifications removed from participant tabs
- Modify: `app/dashboard/page.tsx` — remove notification sidebar entry if present

- [ ] **Step 1: Verify Sidebar has no notifications tab for participant**
  Check `components/layout/Sidebar.tsx` participant case — should NOT have a "notifications" tab.

- [ ] **Step 2: Verify dashboard has no notifications in sidebar**
  Check `app/dashboard/page.tsx` — the notifications tab content should still exist (accessible via the bell) but should NOT be in the sidebar navigation.

- [ ] **Step 3: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add -A && git commit -m "feat: notifications only accessible via bell, not sidebar"
  ```

---

## Task 13: Sidebar — Remove Mock User Info

**Files:**
- Modify: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Remove user info section above Logout**
  In `components/layout/Sidebar.tsx`, the user info card (lines ~193-204) shows avatar, role portal label, and email above the logout button. Remove this entire section per the spec.

  Remove:
  ```tsx
  {!collapsed && session.isLoggedIn && (
    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card-bg/30 border border-input-border/10">
      <Avatar name={session.email || "User"} size="sm" />
      <div className="overflow-hidden">
        <p className="text-[10px] font-bold text-primary-dark truncate capitalize">
          {session.role} Portal
        </p>
        <p className="text-[9px] text-gray-500 truncate font-medium">{session.email}</p>
      </div>
    </div>
  )}
  ```

- [ ] **Step 2: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add -A && git commit -m "feat: remove mock user info from sidebar across all roles"
  ```

---

## Task 14: Volunteer Portal Enhancement

**Files:**
- Modify: `app/volunteer/page.tsx` — add Attendance, QR Scanner, Support, Approval tabs

- [ ] **Step 1: Add Attendance tab**
  Add an "Attendance" tab to the volunteer portal that shows:
  - Teams checked in today
  - Check-in history
  - Ability to mark attendance (if volunteer has scan capability)

- [ ] **Step 2: Add QR Scanner tab**
  Add a "QR Scanner" tab that uses the real QR scanner component to:
  - Scan team QR codes
  - Scan participant QR codes
  - Route to appropriate action

- [ ] **Step 3: Add Support tab**
  Add a "Support" tab that shows:
  - FAQ/help resources
  - Emergency contacts
  - How to handle common issues

- [ ] **Step 4: Add Approval View tab**
  Add an "Approval View" tab that shows:
  - Teams pending approval (read-only view)
  - Approved teams
  - This is a view-only tab — actual approval is done by organizers

- [ ] **Step 5: Update Sidebar volunteer tabs**
  In `components/layout/Sidebar.tsx`, update the volunteer case to include all new tabs:
  ```typescript
  case "volunteer":
    return [
      { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard /> },
      { id: "tickets", name: "Tickets", icon: <Ticket /> },
      { id: "attendance", name: "Attendance", icon: <CheckCircle /> },
      { id: "scanner", name: "QR Scanner", icon: <QrCode /> },
      { id: "support", name: "Support", icon: <LifeBuoy /> },
      { id: "approval", name: "Approval View", icon: <ClipboardCheck /> },
      { id: "profile", name: "Profile", icon: <User /> },
    ];
  ```

- [ ] **Step 6: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 7: Commit**
  ```bash
  git add -A && git commit -m "feat: enhance volunteer portal with attendance, QR scanner, support, and approval view tabs"
  ```

---

## Task 15: UI Consistency Audit & Fix

**Files:**
- All component files
- All page files

- [ ] **Step 1: Audit modal patterns**
  Ensure all modals (Modal, QRScanner, AttendancePanel) use the same:
  - Backdrop styling
  - Spring animation config
  - Close button placement
  - Escape key handling
  - Focus management

- [ ] **Step 2: Extract shared Dialog component**
  Create `components/ui/dialog.tsx` that encapsulates:
  - Backdrop overlay
  - Content panel with spring animation
  - Escape key handler
  - Click-outside handler
  - Scroll lock
  - `role="dialog"` and `aria-modal="true"`

  Then refactor Modal, QRScanner, and AttendancePanel to use this shared Dialog.

- [ ] **Step 3: Consistent button styles**
  Ensure all buttons use the Button component consistently. Remove any inline button styling that bypasses the Button component.

- [ ] **Step 4: Consistent card styles**
  Ensure all cards use consistent:
  - Border radius (rounded-2xl or rounded-3xl)
  - Border color (border-gray-100 dark:border-gray-700)
  - Shadow (shadow-sm)
  - Padding (p-5 or p-6)

- [ ] **Step 5: Consistent spacing**
  Audit all pages for consistent:
  - Section gaps (gap-6 or gap-8)
  - Page padding (p-6 lg:p-8)
  - Card internal padding

- [ ] **Step 6: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 7: Commit**
  ```bash
  git add -A && git commit -m "refactor: extract shared Dialog component, ensure UI consistency across all components"
  ```

---

## Task 16: Error Handling & Accessibility

**Files:**
- All component files
- `app/layout.tsx` — add error boundary

- [ ] **Step 1: Add Error Boundary**
  Create `components/ui/error-boundary.tsx` and add it to `app/layout.tsx`:
  ```tsx
  <ErrorBoundary fallback={<ErrorFallback />}>
    <StateProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </StateProvider>
  </ErrorBoundary>
  ```

- [ ] **Step 2: Add aria-labels to all interactive elements**
  Add `aria-label` to:
  - Navbar hamburger button
  - Navbar notification bell
  - Navbar QR scan button
  - Navbar logout button
  - Sidebar collapse button
  - Sidebar logout button
  - Modal close buttons
  - QRScanner close button
  - AttendancePanel close button
  - QRTeamPass action buttons
  - FAQ accordion buttons (add `aria-expanded`)

- [ ] **Step 3: Add role attributes**
  Add `role="dialog"` and `aria-modal="true"` to:
  - Modal component
  - QRScanner component
  - AttendancePanel component

- [ ] **Step 4: Add aria-live to dynamic content**
  Add `aria-live="polite"` to:
  - Toast container
  - Error messages in Input component

- [ ] **Step 5: Add empty states**
  Ensure all list/table views have proper empty states when no data is available.

- [ ] **Step 6: Add loading states**
  Ensure all data-dependent views have loading spinners/skeletons.

- [ ] **Step 7: Verify TypeScript compiles**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 8: Commit**
  ```bash
  git add -A && git commit -m "feat: add error boundary, aria labels, roles, and empty states across the platform"
  ```

---

## Task 17: Final Verification

- [ ] **Step 1: Run TypeScript check**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 2: Run build**
  ```bash
  npm run build
  ```

- [ ] **Step 3: Verify all routes work**
  Manually test each route:
  - `/` — homepage loads, no broken links
  - `/login` — login works for all roles (no mentor)
  - `/register` — registration works
  - `/hackathon` — tabs work, no Datasets tab
  - `/contact` — WhatsApp instead of Discord
  - `/dashboard` — participant workspace works
  - `/admin` — admin portal works
  - `/organizer` — organizer portal works
  - `/judge` — judge portal works
  - `/volunteer` — volunteer portal works with all new tabs

- [ ] **Step 4: Verify dark mode works**
  Toggle dark mode and verify ALL elements change appearance.

- [ ] **Step 5: Verify QR scanner works**
  Test QR scanning with device camera.

- [ ] **Step 6: Verify mentor role is gone**
  Confirm no mentor references exist anywhere.

- [ ] **Step 7: Verify no dead code**
  Confirm table.tsx, CountdownTimer.tsx, hackathon-website/ are deleted.

- [ ] **Step 8: Final commit**
  ```bash
  git add -A && git commit -m "chore: final verification and cleanup"
  ```
