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

## Phone folder overview QA

- Source visual truth: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-e98a0a51-0304-4e06-83fd-c612284927b4.png`
- Implementation screenshot: unavailable
- Target viewport: 390 × 844 CSS pixels
- Source pixels: 852 × 1845
- Implementation pixels: unavailable
- Density normalization: source used as a proportional mobile reference; implementation capture was not produced
- State: dark theme, folder overview, Collaborators tab selected

**Findings**

- No visual comparison findings were filed because a browser-rendered implementation capture is unavailable.

**Open Questions**

- The user asked to run and inspect the browser personally, so automated browser capture and interaction testing were intentionally not performed.

**Implementation Checklist**

- Open a shared folder at a viewport of 390 × 844.
- Confirm the phone-only Folder overview replaces the existing collaborator and workspace panels.
- Test both Collaborators and Workspace details tabs.
- Test the Invite shortcut, username search, and invite submission.
- Confirm page scrolling and bottom-navigation clearance.
- Confirm tablet and desktop layouts remain unchanged above 600px.

**Follow-up Polish**

- Revisit any spacing or density differences the user identifies during their visual review.

## Phone folder overview comparison history

- Initial implementation: phone-only tabbed Folder overview added. Lint and production build passed.
- Visual comparison: not run at the user's request.

## Selected folder recipient sheet QA

- Source visual truth: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-e4a9d5c6-f6bc-4b0a-9abb-5b8b8d30af62.png`
- Implementation screenshot: unavailable
- Target viewport: 390 × 844 CSS pixels
- State: light theme, two selected folders, Folders tab selected

**Implementation checks**

- Replaced the text dollar glyph with the project icon library and centered it in a fixed icon target.
- Added an independent, accessible details disclosure to every selected folder card.
- Expanded details expose each recipient's payout plus ongoing, half-done, completed, and other-half credit counts.
- Cards remain compact until their own disclosure is opened.
- Component-scoped ESLint and diff validation passed.

**Open questions**

- The user asked to inspect the browser personally, so no automated browser capture was produced.
- The full production build is currently blocked by unrelated malformed JSX in `src/views/TaskFormPage.tsx`.

final result: blocked

## Content-sized folder rail QA

- Source: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-4353716e-76b8-4d11-8158-d2e85e6667b8.png`
- Implementation screenshot: unavailable at the user's request.

**Implementation checks**

- The collaborator card no longer stretches to consume unused viewport height.
- Overview and collaborator cards remain sticky as a single content-sized rail.
- When rail content exceeds the available desktop/tablet height, the rail scrolls as one contained region.
- The persistent invite row stays removed; invitation remains available through the responsive +user modal.
- `npm run lint`, `npm run build`, and `git diff --check` passed.

final result: blocked

## Sticky desktop rail + responsive collaborator invite QA

- Layout issue sources:
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-154a60db-7d4a-4fd9-b374-33fd97a8f260.png`
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-78f083a5-ebd2-4c35-adbb-42cfb70db3d9.png`
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-3b4f70c6-fab6-4a87-8c2f-77fc8e3dc843.png`
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-87c23abc-21ca-4959-ab74-aa63af859634.png`
- Invite interaction sources:
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-c2f682a4-5adb-4e54-abf4-ead02c8b6f85.png`
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-ec04f5e1-4c8d-4918-94ce-3f4090bdd747.png`
- Implementation screenshots: unavailable at the user's request.

**Implementation checks**

- Removed the duplicated topbar offset from sticky desktop/tablet rails, eliminating the empty band above folder and profile side content.
- Folder overview and collaborator data now use the full available rail height; only a long collaborator table scrolls.
- Replaced the permanently visible invite form with an icon action in the Folder overview header.
- The invite action opens a centered desktop/tablet dialog and a phone bottom sheet.
- Username results are constrained inside the dialog, current collaborators are excluded, Escape and backdrop dismissal work, and the dialog remains open for inviting more than one person.

**Code verification**

- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed; only Windows line-ending notices were reported.

**Open visual check**

- Browser capture and interaction testing were intentionally not performed because the user asked to inspect the browser personally.

final result: blocked

## Desktop and tablet folder overview + live task preview QA

- Folder overview source: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-e98a0a51-0304-4e06-83fd-c612284927b4.png`
- Desktop layout issue sources:
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-aa617c64-c63a-4781-80f7-7a3f5a0fde05.png`
  - `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-ee9ae39a-47f2-4f4a-b774-dcdc1070f975.png`
- Task preview issue source: `C:\Users\Zainab\AppData\Local\Temp\codex-clipboard-12cecae6-b32c-4dca-bb32-fc98a99f7aee.png`
- Implementation screenshots: unavailable at the user's request
- Target states: tablet and desktop folder detail; desktop task create/edit

**Implementation checks**

- The approved tabbed Folder overview is now shared across phone, tablet, and desktop instead of using a separate compressed desktop collaborator panel.
- At widths above 600px, the overview stays sticky within the available viewport height and its content scrolls independently.
- The overview retains collaborators, all four contribution columns, invitation, and workspace details.
- The task form preview now uses the actual task-card hierarchy: category, export/edit/more actions, formatted description, checklist timeline, three status cells, assignee, due date, and payout.
- Multiline descriptions and supported inline formatting use the same rich-description renderer as task details.
- The preview updates from the current form state rather than relying on static sample text.
- Repaired missing responsive layout wrappers in the task and folder form pages.

**Code verification**

- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed; only Windows line-ending notices were reported.

**Open visual check**

- Browser capture and interaction testing were intentionally not performed because the user asked to inspect the browser personally.

final result: blocked
