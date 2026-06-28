# ADR 0002: Lazy Loading the AI Assistant Component

## Context & Problem
We introduced a feature-rich AI Assistant containing a custom Markdown parser, code highlighting blocks, conversation persistence logic, and complex animation paths. Initial test builds showed that importing this component directly in the root layout increased the initial JS bundle size, impacting first-load performance scores.

## Proposed Solution
Split the AI Assistant into a lightweight container shell (`AIAssistant.tsx`) and a heavy chat dialog window (`AIChatWindow.tsx`). Use Next.js `dynamic()` helper with `ssr: false` to import the chat window component, mounting it dynamically only when the user clicks the floating sparkles button.

## Alternatives Considered
- **Direct Import**: Simple to write, but loaded heavy components on page load, even if the user never clicked or interacted with the assistant.
- **Third-party Widgets**: Rejected to preserve design consistency, theme styling, and local session-state integration.

## Consequences & Trade-offs
- **Pros**:
  - Initial JS bundle sizes are minimized, keeping landing page load speeds extremely fast.
  - Keeps 60 FPS scrolling responsiveness on mobile devices.
- **Cons**:
  - Slight latency (a few milliseconds) when the user first clicks the button to open the chat window, as the browser fetches the chunks. This is mitigated by visual loading indicators.
