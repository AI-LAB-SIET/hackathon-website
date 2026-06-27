# Volunteer Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new Volunteer portal page at `app/volunteer/page.tsx` with dashboard, tickets, and profile tabs.

**Architecture:** Follow the same pattern as existing portal pages (mentor, organizer). Single page component with tab switching, Sidebar integration, notification bell, and profile management.

**Tech Stack:** React, Next.js, Tailwind CSS, framer-motion, lucide-react, useAppState, useTheme, useToast

---

### Task 1: Add Volunteer Tab Configuration to Sidebar

**Files:**
- Modify: `components/layout/Sidebar.tsx:52-98`

- [ ] **Step 1: Add volunteer case to getTabs()**

Add a new case `"volunteer"` to the switch statement in `getTabs()`:

```tsx
case "volunteer":
  return [
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "tickets", name: "Tickets", icon: <LifeBuoy className="h-5 w-5" /> },
    { id: "profile", name: "Profile", icon: <User className="h-5 w-5" /> },
  ];
```

Insert this case after the `"mentor"` case (around line 76) and before the `"organizer"` case.

- [ ] **Step 2: Verify Sidebar compiles**

Run: `npx tsc --noEmit --pretty`
Expected: No errors related to Sidebar

---

### Task 2: Create Volunteer Portal Page

**Files:**
- Create: `app/volunteer/page.tsx`

- [ ] **Step 1: Write the full volunteer page**

Create `app/volunteer/page.tsx` following the mentor page pattern with:
- "use client" directive
- Imports: Sidebar, PageWrapper, useAppState, useToast, useTheme, Badge, Avatar, Button, Input, motion/AnimatePresence, lucide icons
- TabType: "dashboard" | "tickets" | "profile"
- ProfileTabType: "edit" | "appearance"
- Auth check redirecting to /login if not volunteer role
- Sidebar with activeTab prop
- Three tabs: dashboard, tickets, profile
- Notification bell in header

Key features:
- **Dashboard:** Welcome banner, stats cards (assigned tickets, pending, recently resolved), assigned tickets list
- **Tickets:** Aggregated tickets from `teams` state's `supportTickets`, filter by status, volunteer actions (In Progress, Resolved, Closed)
- **Profile:** Edit name, bio, skills, social links; Appearance theme toggle; Email immutable

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

---

### Task 3: Final Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: Clean compilation

- [ ] **Step 2: Review file structure**

Verify `app/volunteer/page.tsx` exists and Sidebar has volunteer tabs.
