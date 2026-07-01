# Implementation Task List

## Phase 1 — Types + Firestore Schema
- [x] Add `Hackathon` type to `src/types/index.ts`
- [x] Add `TeamRequest` type
- [x] Add `FoodMeal` type
- [x] Add `FoodToken` type
- [x] Extend `Team` with `hackathonId`
- [x] Extend `UserProfile` with `hackathonIds[]`, `currentHackathonId`
- [x] Extend `ProblemStatement` with `hackathonId`
- [x] Extend `Announcement` with `hackathonId?`

## Phase 2 — StateProvider Rework
- [ ] Add `hackathons` state + Firestore listener
- [ ] Add `activeHackathonId` to context + session
- [ ] Add `teamRequests` state + Firestore listener
- [ ] Scope teams/PS/announcements/tickets listeners to activeHackathonId
- [ ] Add hackathon CRUD functions (create/update/delete/setActive)
- [ ] Add team request functions (sendJoinRequest/sendInvite/respondToRequest)
- [ ] Add food token functions (createMeal/issueMealTokens/redeemToken/lookupToken/getMyTokens)
- [ ] Remove `teamSetupDone` dashboard gating logic
- [ ] Add `deleteProfile` for staff assignment

## Phase 3 — Register & Onboarding
- [ ] Register page: add hackathon dropdown (from Firestore) + URL param support
- [ ] Register page: save `currentHackathonId` on `users/{uid}`
- [ ] Onboarding page: remove team creation step (Step 2)
- [ ] Onboarding page: remove member invite flow
- [ ] Login page: remove `teamSetupDone` redirect guard

## Phase 4 — Admin Panel: Hackathon Management
- [ ] New "Hackathons" tab with create/edit/archive/delete
- [ ] Active hackathon switcher in admin header
- [ ] Per-hackathon registration link generator
- [ ] Scope all existing admin tabs to active hackathon

## Phase 5 — Admin Panel: Food Tokens Tab
- [ ] Meals list UI (create breakfast/lunch/dinner/snacks)
- [ ] Bulk issue tokens button (all participants for a meal)
- [ ] Per-meal stats: issued / redeemed / expired counts
- [ ] Token list with revoke / re-issue actions

## Phase 6 — Members & Roles: Hackathon Assignment
- [ ] Add hackathon assignment multi-select to each staff member
- [ ] Show hackathon badges on member rows

## Phase 7 — Volunteer / Organizer: Token Redemption
- [ ] Food tokens section in volunteer page
- [ ] Food tokens section in organizer page
- [ ] Redeem by register number lookup
- [ ] Active meal window display
- [ ] Live redemption log (last 20)

## Phase 8 — Dashboard: Team Tab
- [ ] Team creation form (name + problem statement picker → track auto-set)
- [ ] Browse open teams in hackathon
- [ ] Send join request
- [ ] View/accept/reject incoming team invites
- [ ] View/cancel outgoing join requests
- [ ] Invite by email (sends Firebase invite)
- [ ] Leave / disband team

## Phase 9 — Dashboard: Food Token Wallet
- [ ] Token wallet tab in participant dashboard
- [ ] List all tokens (meal name, time, status badge)
- [ ] QR code display per unused token
- [ ] Color-coded status indicators

## Phase 10 — Testing & Build Verification
- [ ] `npm run build` with zero errors
- [ ] Manual test: hackathon creation → registration → onboarding → dashboard
- [ ] Manual test: team creation → join request → approval flow
- [ ] Manual test: admin creates meal → issues tokens → volunteer redeems
