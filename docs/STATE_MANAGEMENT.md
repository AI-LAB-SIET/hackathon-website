# 💾 State Management & Persistence

This document explains the global state tree, reactivity triggers, and client-side database synchronization model of the platform.

---

## 🌲 Global State Model

The platform uses a React Context-based store (`StateProvider` mounted in the root layout). The state is consumed via the custom hook `useAppState`. This architecture resolves issues with prop-drilling across layouts and sidebar controllers.

```mermaid
graph TD
    Provider[StateProvider Context Wrapper] -->|Exposes| Hook[useAppState Hook]
    Hook --> UserState[user: UserInfo / null]
    Hook --> TeamState[teams: Team[]]
    Hook --> NotifState[notifications: Notification[]]
    Hook --> TicketState[tickets: SupportTicket[]]
    Hook --> ActiveTabState[activeTab: string]
```

---

## ⚡ Reactivity & State Updates

Context triggers updates that cause components to re-render in response to actions. To prevent unnecessary re-renders (ensuring stable 60 FPS transitions), context values are fully memoized, and deep comparisons are performed when resolving updates.

```typescript
const contextValue = useMemo(() => ({
  user,
  teams,
  notifications,
  tickets,
  activeTab,
  updateUser,
  updateTeams,
  addNotification,
  resolveTicket
}), [user, teams, notifications, tickets, activeTab]);
```

---

## 💾 LocalStorage Sync & Batching Caching

All modifications to teams, user accounts, evaluation scores, notifications, or support tickets are flushed asynchronously to browser `localStorage` in background queues:

1. **Read Path**: The initial state is loaded synchronously from `localStorage` on page mount inside a React `useEffect` callback to avoid hydration mismatch errors:
   ```typescript
   useEffect(() => {
     const savedSession = localStorage.getItem('siet_session');
     if (savedSession) {
       setUser(JSON.parse(savedSession));
     }
     setIsLoading(false);
   }, []);
   ```
2. **Write Path**: State updates trigger writes to matching local keys using write-through caching logic:
   - `siet_session`: Stores current active login session.
   - `siet_teams_v2`: Persists registered teams, members, QR tokens, status.
   - `siet_notifications_v2`: Saves user notification histories.
   - `siet_tickets`: Stores volunteer-assigned support messages.
   - `siet_evaluations`: Stores judge evaluations and score sheets.
