# GrowT approved task and recipient design QA

## Approved references

- Standalone task page: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-38dea9b2-789d-40f6-8f98-a9bffb324421.png`
- Task row architecture: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-fab7dfdb-98d5-4a38-8f29-0d25a1680ad5.png`
- Folder recipient sheet: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-1a513b03-a057-4fe5-a0da-63db893e9ccc.png`

## Implementation reviewed

- Standalone tasks: `src/views/TaskListPage.tsx`
- Standalone and folder task rows: `src/features/tasks/TaskCard.tsx`
- Compact checklist summary: `src/features/tasks/TaskChecklist.tsx`
- Participant status attribution: `src/features/tasks/TaskStatusParticipants.tsx`
- Folder recipient sheet: `src/components/RecipientReportPopup.tsx`
- Responsive design rules: `src/styles/redesign.css`

## Exact mobile comparisons

- CSS viewport: 390 × 844.
- Task page state: All categories, all statuses, first task rows visible.
- Recipient state: May 1 folder, People tab, real payout and recipient data.
- Task comparison: `qa-artifacts/comparison-mobile-tasks.png`
- Recipient comparison: `qa-artifacts/comparison-mobile-recipients.png`

The comparisons check the full visible viewport and the following focused regions:

- Task title and New task action.
- Explicit All, Personal, Work, and Shared filters.
- Status filter control.
- Task category marker, title, actions, checklist progress, three status columns, participant names, and assignee.
- Recipient sheet header, payout summary, completion and recipient counts, tabs, people rows, per-status credit counts, and task-breakdown control.

## Responsive and interaction checks

| Surface | Viewport | Result |
| --- | --- | --- |
| Standalone tasks | 390 × 844 phone | Pass |
| Folder tasks | phone | Pass |
| Recipient sheet | 390 × 844 phone | Pass |
| Task layouts | 758 × 1086 tablet | Pass |
| Task layouts | 1309 × 931 desktop | Pass |

- No document-level horizontal overflow at phone, tablet, or desktop widths.
- All four category controls fit on a phone without clipping or hidden horizontal scrolling.
- The task checklist is summarized on compact cards instead of expanding the card height.
- Standalone and folder tasks share the approved row architecture.
- Reorder, edit, recipient, share, export, delete, status, and assignee actions remain functional.
- The status Filter opens and filters the visible tasks.
- The recipient sheet opens and closes from the folder and task surfaces.
- People and Status breakdown tabs switch correctly.
- Recipient rows expand to show their credited task records.
- Escape and backdrop dismissal work; background scrolling is locked while the sheet is open.
- Browser console errors: none.

## Design QA findings resolved

- P1: checklist items made phone task cards too tall. Resolved with a progress-only compact checklist.
- P2: category filters could extend beyond the phone viewport. Resolved with four explicit compact icon-and-label controls.
- P2: older task controls compressed titles and hid participant attribution. Resolved with a dedicated title/action row and three clear participant status columns.

## Accepted content differences

- The implementation uses live GrowT task names, avatars, counts, payouts, and status records rather than the illustrative mock data.
- The global GrowT navigation retains Menu because it exposes additional authenticated routes.
- The folder task row follows the separately approved task-row reference while sharing the standalone task component.

## Code verification

- `npm run build`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed; only existing Windows line-ending notices were reported.
- React review: stable keys, effect cleanup, semantic interactive controls, accessible labels, and typed component boundaries checked.

final result: passed
