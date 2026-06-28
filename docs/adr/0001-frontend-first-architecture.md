# ADR 0001: Frontend-First Architecture with Simulated Service Layer

## Context & Problem
During the early phases of the Hackathon platform development, frontend user flows (Registration, QR Check-ins, Live Graded Evaluations) need to be validated and demonstrated to sponsors and organizers before database schemas and server APIs are finalized. 

## Proposed Solution
Build the entire platform using a **decoupled service-adapter pattern** on the client side. The frontend components do not make direct raw backend requests. Instead, they consume standard service classes (`authService`, `teamService`, `evaluationService`) that simulate data manipulation locally using browser storage (`localStorage` / `sessionStorage`).

## Alternatives Considered
1. **Direct Backend Integration**: Delayed demonstration of the system since server setups were not ready.
2. **Hardcoded UI Placeholders**: Created non-functional visual mockups. This was rejected because user flows (like checking-in a team via a scanner and seeing their status update in real-time) need to actually work to be tested.

## Consequences & Trade-offs
- **Pros**: 
  - The UI and navigation are completely operational.
  - Highly performant, zero network lag during validation.
  - Handover is seamless; backend developers can implement target API endpoints in the services folder without breaking UI components.
- **Cons**: 
  - Session data is limited to the local browser instance. Changing roles or resetting browser history wipes state (mitigated by initial mock-data reloading).
