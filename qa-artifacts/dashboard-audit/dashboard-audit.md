# GrowT mobile dashboard audit

## Audit scope

- Surface: authenticated mobile dashboard.
- Viewport: 390 × 844.
- User goal: understand what needs attention and continue the most useful task quickly.
- Evidence: `01-dashboard-mobile.png`.

## Step 1 — Scan and choose the next action

Health: needs redesign.

### Strengths

- Greeting and workload counts are immediately visible.
- The next task has a clear Continue action.
- Later tasks, progress, and workspaces are presented in a logical order.
- Primary navigation remains available without horizontal overflow.

### UX risks

- The page behaves like a vertical task feed rather than a dashboard overview.
- The large Up next card consumes too much of the first viewport despite containing very little information.
- The strongest visual element is a decorative purple line, not useful task state or urgency.
- The summary count, next task, later tasks, progress, and workspaces all compete as separate sections without a compact overview.
- The page has no direct create action in its content area; New is only discoverable through bottom navigation.
- Real data such as `ds` and `No due date` makes the featured card feel unfinished.

### Accessibility risks visible in the screenshot

- Several secondary labels are small and pale against the lilac background.
- Category and metadata text rely heavily on muted color and may lose clarity at zoom or in bright environments.
- The tiny circular marker on Later today rows has weak meaning without a label.

### Recommended direction

- Replace the oversized featured card with a compact two-column mobile summary: next task on the left and progress/attention on the right.
- Keep one strong primary action and reduce decorative gradients.
- Use a compact Today list with explicit status, category, and due information.
- Move progress and workspace momentum into one concise overview surface.
- Add a clearly labeled quick-create action near the top.

## Evidence limits

- This audit verifies the visible mobile layout and semantic structure.
- Keyboard behavior, screen-reader announcements, contrast ratios, and zoom reflow require separate implementation-level testing.
