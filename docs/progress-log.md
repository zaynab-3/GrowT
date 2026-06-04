# GrowT Progress Log

Last updated: June 4, 2026

## Latest Checkpoints

- Folder creation now uses `public.create_folder`, which sets `owner_id` from `auth.uid()` and creates the owner row in `folder_members`.
- Auth now uses normal email/password registration and login instead of magic-link-first login.
- Registration collects email, username, password, and confirm password.
- Username login is supported through `public.resolve_login_email(identifier text)`.
- Task creation now uses `public.create_task`, so shared folder members can create tasks without direct browser inserts into `tasks`.
- Folder task loading now uses `public.list_folder_tasks`.
- The live folder view subscribes to Realtime for folder, member, task, task level, progress, status action, and notification tables.
- Task status contributor columns now display non-undone `task_status_actions` history, not only current `task_progress`.
- A user can appear in multiple status stages for the same task when their non-undone action history includes those stages.
- Undo buttons appear only beside the current user's latest undoable action.
- Member summaries now show blue ongoing, yellow half-done, and green completed contribution counts.
- Folder info now shows category, shared/private access, active state, dates, task count, status totals, and member counts.
- Add Member is only active for shared folders; personal/work private folders show the message to convert to Shared first.
- Folder edit/delete was added through `public.update_folder` and `public.soft_delete_folder`.
- Task edit/delete was added through `public.update_task` and `public.soft_delete_task`.
- Folder and task deletes are soft deletes using `deleted_at`; normal UI state updates immediately without reload.
- Basic local search was added for already-loaded accessible folders/tasks, including title, description, category, status, assignee, contributors, and loaded member profile values.
- `App.tsx` was partially split into display helpers, search, confirm dialog, folder edit/info, task edit, and task status grid components.
- Selected-folder empty state now distinguishes between zero folders and folders that simply have not been selected.
- Undo is now action-scoped through `public.undo_task_status_action(action_id)`, so users can undo each of their own visible contributions independently.
- Standalone tasks were added under "Standalone Tasks"; these have `folder_id = null`.
- Shared standalone tasks now use `task_members` for database-backed membership and visibility.
- Owners can add members by username only on Shared standalone tasks.
- Personal and Work standalone tasks stay private and do not show standalone Add Member controls.
- Shared standalone task members can see the shared task through `public.list_standalone_tasks()`.
- Shared standalone task member management uses `public.add_task_member(task_id, username)`, `public.remove_task_member(task_id, user_id)`, and `public.list_task_members(task_id)`.
- `private.can_access_task()` now includes standalone shared task membership, while folder tasks still use `folder_members`.
- Deleted folder/task restore basics were added through archive panels and restore RPCs.
- `App.tsx` was further split with `src/auth/AuthPanel.tsx`, `src/features/tasks/TaskForm.tsx`, `src/features/tasks/TaskList.tsx`, `src/features/tasks/StandaloneTasksPanel.tsx`, `src/features/folders/FolderRestorePanel.tsx`, and `src/features/tasks/TaskRestorePanel.tsx`.
- Deep modular cleanup reduced `App.tsx` from 2,274 lines to 1,231 lines without changing database logic or product behavior.
- Added layout modules for `AppShell`, `Topbar`, and `Sidebar`.
- Added folder presentation modules for `FolderCard`, `FolderList`, `FolderDetail`, and `FolderMembersPanel`.
- Added `TaskCard` so `TaskList` no longer owns the full task-row rendering.
- Added `useAuthSession`, `useGrowTData`, and `useGrowTRealtime` hooks.
- Added `folderApi` and `taskApi` feature wrapper modules that preserve the existing Supabase calls.
- Added `EmptyState`, `LoadingState`, and `SearchResults` utility components.
- Added the Acquaintances system through secure RPCs and a modular sidebar panel.
- Acquaintances now support username search, sending requests, incoming requests, outgoing requests, accept, reject, remove, and current acquaintance list display.
- Acquaintance UI is isolated under `src/features/acquaintances/` and was not added to `App.tsx`.
- Acquaintance request/acquaintance Realtime subscriptions refresh the panel state without browser reload.
- Added a shared acquaintance-aware MemberPicker under `src/features/members/`.
- Shared folder Add Member now shows current acquaintances first, supports relationship-aware username search, and adds selected acquaintances through `folder_members`.
- Shared standalone task Add Member now uses the same picker and adds selected acquaintances through `public.add_task_member`.
- Added `public.search_profiles_with_relationship(query_text)` so Add Member search can show acquaintance, pending outgoing, pending incoming, none, and already-member states without exposing emails.
- Fixed acquaintance remove/state consistency so removed acquaintances no longer appear as still connected in relationship-aware search.
- Added outgoing acquaintance request cancellation through secure RPC/state refresh, including Pending + Cancel UI.
- Restore now works for folders, folder tasks, and standalone tasks; restored items reappear without browser reload.
- Restore panels show the 7-day restore countdown.
- Added MVP in-app notifications with a bell, unread count, dropdown panel, mark-one-read, mark-all-read, and realtime arrival.
- Notification rows are now created by real database/RPC actions for acquaintance requests, accepted requests, shared folder membership, and shared standalone task membership.
- Manual QA confirms restore, acquaintance-aware Add Member, outgoing request cancellation, and MVP in-app notifications are working.
- Added simple persistent Up/Down reorder controls for folders, folder tasks, and standalone tasks.
- Reorder uses the existing `position` columns and secure RPCs instead of frontend-only ordering.
- Manual QA confirms folder reorder, folder task reorder, standalone task reorder, refresh persistence, and shared folder task realtime updates without browser reload.
- Pixel Design Pass 1 added a working visual foundation for GrowT, using a cozy retro pixel-art direction while keeping the app usable.
- Pixel styling is organized into modular CSS layers for tokens/primitives, layout, feature surfaces, and responsive adjustments instead of being dumped into `App.tsx`.
- Logout race fixes prevent stale authenticated requests from showing `Unable to load deleted items.` or `Unable to load GrowT data.` on login/register/opening-session screens after sign out.
- Manual QA confirms logout returns to the auth page cleanly; final design/layout polish is still pending.
- Pixel Design Pass 2 added a page/view-based app layout so the main content shows one active view instead of one giant scrolling dashboard.
- Sidebar navigation now switches between Dashboard, My Tasks, Shared with Me, Acquaintances, Notifications, Restore, and Settings.
- The Notifications realtime crash was fixed by sharing one `NotificationProvider`/`useNotifications` store between the bell and Notifications view.
- Notification realtime subscriptions now register `postgres_changes` callbacks before `subscribe()` and clean up channels on unmount/session changes.
- Invalid refresh token/session cleanup was improved so stale sessions return to the auth surface without stale app errors.
- Minimal mobile responsive cleanup was added for a usable pixel-styled phone layout with stacked panels, wrapping buttons, compact navigation, and no obvious horizontal overflow.
- Manual QA confirms Design Pass 2, notification crash fix, session cleanup, and mobile usability are okay; final visual polish is still pending.

## Project Identity

- Project name corrected to `GrowT`.
- Original prompt used `Grow+`, but the app and repo now use `GrowT`.
- Current direction: build a real collaborative web app first. Visual/pixel-art design polish is intentionally saved for later.

## Repository And Tooling

- Local workspace: `C:\Users\Zainab\OneDrive\Documents\GrowT`.
- GitHub repository linked: `https://github.com/zaynab-3/GrowT.git`.
- Main branch is connected to `origin/main`.
- Vite, React, TypeScript, ESLint, and Supabase JS are installed.
- Supabase CLI is installed locally through npm.
- `.env.local` is configured locally and ignored by Git.
- `.env.example` exists for the public environment variable names.

## Supabase Setup

- Supabase project URL configured: `https://gptgwddtmxckdmjzltan.supabase.co`.
- Supabase project ref linked through CLI: `gptgwddtmxckdmjzltan`.
- User completed `npx supabase login`.
- User completed `npx supabase link --project-ref gptgwddtmxckdmjzltan`.
- Initial starter migration was pushed successfully.
- Canonical GrowT MVP schema migration was pushed successfully.

## Database Work Completed

- Created early prototype tables:
  - `growt_profiles`
  - `growt_workspaces`
  - `growt_checkpoints`
- Created canonical MVP tables:
  - `profiles`
  - `acquaintance_requests`
  - `acquaintances`
  - `folders`
  - `folder_members`
  - `folder_share_links`
  - `tasks`
  - `task_levels`
- `task_progress`
- `task_status_actions`
- `notifications`
- `task_members`
- Enabled RLS on canonical public tables.
- Added RLS policies for profiles, folders, members, tasks, task progress, task status actions, and notifications.
- Added database RPCs:
  - `public.set_task_progress(task_id, task_level_id, new_status)`
  - `public.undo_latest_task_progress(task_id, task_level_id)`
  - `public.create_folder(title, description, category)`
  - `public.resolve_login_email(identifier)`
  - `public.list_folder_tasks(folder_id)`
  - `public.create_task(folder_id, title, description, category, assigned_user_id, due_date)`
  - `public.update_folder(folder_id, title, description, category, due_date, is_active)`
  - `public.soft_delete_folder(folder_id)`
  - `public.update_task(task_id, title, description, category, due_date, is_active, assigned_user_id)`
  - `public.soft_delete_task(task_id)`
  - `public.undo_task_status_action(action_id)`
  - `public.list_standalone_tasks()`
  - `public.create_standalone_task(title, description, category, assigned_user_id, due_date)`
  - `public.list_deleted_folders()`
  - `public.restore_folder(folder_id)`
  - `public.list_deleted_tasks()`
  - `public.restore_task(task_id)`
  - `public.search_profiles_by_username(query_text)`
  - `public.search_profiles_with_relationship(query_text)`
  - `public.send_acquaintance_request(username)`
  - `public.accept_acquaintance_request(request_id)`
  - `public.reject_acquaintance_request(request_id)`
  - `public.cancel_acquaintance_request(request_id)`
  - `public.remove_acquaintance(user_id)`
  - `public.list_acquaintances()`
  - `public.list_acquaintance_requests()`
  - `public.add_folder_member(folder_id, username)`
  - `public.reorder_folder(folder_id, direction)`
  - `public.reorder_task(task_id, direction)`
- Kept privileged status logic inside the private schema.
- Kept privileged edit/delete logic inside the private schema.
- Kept privileged reorder logic inside the private schema.
- Added `task_status_actions_active_contrib_idx` for non-undone status contribution lookups.
- Added `tasks_standalone_owner_idx` and `task_status_actions_action_user_idx`.
- Added canonical Realtime publication entries for:
  - `acquaintance_requests`
  - `folders`
  - `folder_members`
  - `tasks`
  - `task_levels`
  - `task_progress`
  - `task_status_actions`
  - `notifications`
  - `acquaintances`

## Security Notes

- Supabase advisor found security warnings after the canonical migration.
- Created a follow-up migration: `supabase/migrations/20260602085224_security_advisor_fixes.sql`.
- That migration fixes:
  - missing fixed `search_path` on the timestamp trigger function
  - `citext` extension placement by moving it to the `extensions` schema
- That migration has now been pushed to the remote database.
- Manual dashboard item still pending:
  - enable leaked password protection in Supabase Auth settings.

## Frontend Work Completed

- Built the first Supabase-backed auth flow, then replaced it with normal email/password auth.
- Added registration, login, forgot-password, and reset-password flows.
- Built the starter workspace/checkpoint prototype to confirm Supabase auth and data access worked.
- Replaced the prototype app flow with canonical GrowT app data:
  - folders
  - folder members
  - tasks
  - task progress
  - task status actions
  - user profiles
- Added profile editing for:
  - display name
  - username
- Added invite-by-username for folder owners so two accounts can join the same live folder.
- Added task creation inside a folder.
- Added folder editing for title, description, category, due date, and active/inactive.
- Added folder soft delete with confirmation.
- Added task editing for title, description, category, due date, active/inactive, and assignee.
- Added task soft delete with confirmation.
- Added local search over loaded authorized data.
- Added initial modular files:
  - `src/auth/AuthPanel.tsx`
  - `src/lib/growtDisplay.ts`
  - `src/components/ConfirmDialog.tsx`
  - `src/features/search/SearchBar.tsx`
  - `src/features/folders/FolderEditForm.tsx`
  - `src/features/folders/FolderInfoPanel.tsx`
  - `src/features/folders/FolderRestorePanel.tsx`
  - `src/features/tasks/TaskForm.tsx`
  - `src/features/tasks/TaskEditForm.tsx`
  - `src/features/tasks/TaskList.tsx`
  - `src/features/tasks/TaskStatusGrid.tsx`
- `src/features/tasks/StandaloneTasksPanel.tsx`
- `src/features/tasks/TaskRestorePanel.tsx`
- Added deeper modular files:
  - `src/layout/AppShell.tsx`
  - `src/layout/Topbar.tsx`
  - `src/layout/Sidebar.tsx`
  - `src/hooks/useAuthSession.ts`
  - `src/hooks/useGrowTData.ts`
  - `src/hooks/useGrowTRealtime.ts`
  - `src/features/folders/FolderCard.tsx`
  - `src/features/folders/FolderList.tsx`
  - `src/features/folders/FolderDetail.tsx`
  - `src/features/folders/FolderMembersPanel.tsx`
  - `src/features/folders/folderApi.ts`
  - `src/features/search/SearchResults.tsx`
  - `src/features/tasks/TaskCard.tsx`
  - `src/features/tasks/taskApi.ts`
  - `src/components/EmptyState.tsx`
  - `src/components/LoadingState.tsx`
- Added acquaintances feature files:
  - `src/features/acquaintances/AcquaintancesPanel.tsx`
  - `src/features/acquaintances/UserSearch.tsx`
  - `src/features/acquaintances/IncomingRequests.tsx`
  - `src/features/acquaintances/OutgoingRequests.tsx`
  - `src/features/acquaintances/AcquaintanceList.tsx`
  - `src/features/acquaintances/acquaintanceApi.ts`
- Added shared member picker files:
  - `src/features/members/MemberPicker.tsx`
  - `src/features/members/memberApi.ts`
- Added in-app notification files:
  - `src/features/notifications/NotificationBell.tsx`
  - `src/features/notifications/NotificationPanel.tsx`
  - `src/features/notifications/notificationApi.ts`
- Added task status buttons:
  - Ongoing
  - Half Done
  - Completed
- Added persisted undo buttons based on the current user's latest undoable `task_status_actions` row.
- Added simple Move Up / Move Down controls on folder cards, folder tasks, and standalone tasks.
- Added Pixel Design Pass 1 visual foundation files:
  - `src/styles/pixel-system.css`
  - `src/styles/pixel-layout.css`
  - `src/styles/pixel-features.css`
  - `src/styles/pixel-responsive.css`
- Moved the global search control into the topbar as part of the visual foundation while preserving the existing search state and behavior.
- Added session-staleness guards for authenticated data loading so late folder/task/archive/profile requests after logout are ignored safely.

## Realtime Work Completed

The folder page now behaves as a live session.

- When a folder opens, the app subscribes to Supabase Realtime.
- Realtime channel is scoped to the current folder where possible.
- The app subscribes to:
  - `folders`
  - `folder_members`
  - `tasks`
  - `task_levels`
  - `task_progress`
  - `task_status_actions`
  - `notifications`
- Folder, member, and task events use database filters where possible.
- Progress/action events are filtered client-side against the current folder's task IDs because those tables do not directly contain `folder_id`.
- Realtime events update React state only.
- No browser reload is used for synchronization.
- No `window.location.reload()` or `location.reload()` exists in `src`.
- Status changes go through the database RPC first, then state refreshes from database/Realtimes events.
- Undo goes through the database RPC first, updates `task_progress`, marks `task_status_actions.is_undone`, and broadcasts through Realtime.
- Shared standalone tasks subscribe to standalone task/member/progress/action Realtime events and filter them against visible standalone task IDs in React state.
- When a user is added to a Shared standalone task, the `task_members` event refreshes their standalone task list without a browser reload.
- The Acquaintances panel subscribes to `acquaintance_requests` for current-user sender/receiver changes and `acquaintances` for current-user relationship changes.
- The notification bell subscribes to the current user's `notifications` rows and updates unread count/panel state without browser reload.
- Folder and task reorder persists through database `position` updates and propagates through the existing folder/task Realtime subscriptions.

## Current Acceptance Flow

To test with two users:

1. Sign in as User A.
2. Set a display name and username in the profile form.
3. Create a folder, preferably category `Shared`.
4. Create at least one task.
5. Sign in as User B in another browser/account.
6. Set User B's username.
7. In User A's folder, add User B by username.
8. Open the same folder as both users.
9. User A clicks `Ongoing`, `Half Done`, or `Completed`.
10. User B should see the status update without refresh.
11. User A clicks `Undo`.
12. User B should see the reverted state without refresh.
13. User A edits a task title; User B should see the edited title without refresh.
14. User A deletes a task; User B should see it disappear without refresh.
15. User A edits folder details; User B should see changed folder metadata without refresh.
16. Search for a folder/task/member term and confirm results update immediately.
17. User A creates a standalone task without selecting a folder.
18. Confirm Personal and Work standalone tasks do not show Add Member.
19. Create or edit a standalone task as category `Shared`.
20. Add User B by username from the Shared standalone task's Members area.
21. User B should see the Shared standalone task appear without refresh.
22. User A clicks `Ongoing`, `Half Done`, or `Completed` on the Shared standalone task.
23. User B should see the status update without refresh.
24. User A clicks `Undo`.
25. User B should see the reverted state without refresh.
26. User A edits/deletes/restores a standalone task.
27. User A deletes and restores a folder.
28. User A sees Undo beside each of their own status contributions, not only the latest one.
29. User A searches User B by username in Acquaintances.
30. User A sends an acquaintance request.
31. User B sees the incoming request without browser reload.
32. User B accepts or rejects the request.
33. User A sees outgoing request state update without browser reload.
34. If accepted, both users see each other in Acquaintances.
35. Remove the acquaintance and confirm both sides update without browser reload.
36. Send an outgoing acquaintance request, click `Cancel`, and confirm search/request state returns to Add without refresh.
37. Delete and restore a folder, folder task, and standalone task; confirm each returns without refresh and shows the 7-day restore countdown while deleted.
38. Trigger notifications for acquaintance request received, request accepted, shared folder add, and shared standalone task add.
39. Confirm the notification bell unread count updates in realtime.
40. Mark one notification read, then mark all read, and confirm unread count updates.
41. Move folders up/down and refresh to confirm order persists.
42. Move folder tasks up/down and refresh to confirm order persists.
43. Move standalone tasks up/down and refresh to confirm order persists.
44. In a shared folder, move a task in one browser and confirm the other browser updates without refresh.
45. Refresh both browsers and confirm the database state remains correct.

## Current Project Status

Completed:
- Password auth, username login, forgot/reset password basics.
- Folder creation through secure RPC with owner membership.
- Task creation through secure RPC.
- Live folder subscriptions for the MVP tables.
- Task status action history display and undo display.
- Folder/task edit and soft delete.
- Folder/task restore basics.
- Standalone task creation/edit/delete/restore.
- Shared standalone task membership through `task_members`.
- Owner-only Add Member by username for Shared standalone tasks.
- Action-scoped undo for individual status contributions.
- Basic local search over loaded authorized data.
- Deep modular extraction away from one-file UI.
- Acquaintances system MVP.
- Acquaintance-aware Add Member.
- Outgoing acquaintance request cancellation.
- Folder, folder task, and standalone task restore with 7-day countdown.
- MVP in-app notifications.
- Simple persistent reorder controls for folders, folder tasks, and standalone tasks.
- Pixel Design Pass 1 visual foundation with modular pixel CSS organization.
- Logout race fixes after sign out, including stale deleted-items and main GrowT data requests.
- Pixel Design Pass 2 page/view-based layout.
- Sidebar-driven views for Dashboard, My Tasks, Shared with Me, Acquaintances, Notifications, Restore, and Settings.
- Shared notification state/subscription provider for notification bell and Notifications view.
- Invalid refresh token/session cleanup improvements.
- Minimal mobile responsive cleanup.

Partial:
- Modular architecture is much improved; `App.tsx` is now about 1,231 lines. Mutation handlers and some data loading orchestration still remain in `App.tsx` intentionally to avoid risky behavior changes.
- Search is local MVP search, not full database/global search.
- Final visual polish is still pending; Pixel Design Pass 2 is a working page/view foundation, not the finished app design.

Missing:
- Task levels/subtasks UI.
- Final pixel-art design polish and page/view-based layout refinement.

## Verification Already Run

- `npm run lint` passes.
- `npm run build` passes.
- Search for forbidden reload sync patterns in `src` found no matches.
- Search for `signInWithOtp` in `src` found no matches.
- Search for old `growt_*` frontend calls in `src` found no matches.
- Search for direct `from('tasks')` frontend usage in `src` found no matches.
- Remote migrations were applied through `20260604090012_simple_reorder_controls.sql`.
- Supabase database advisors were not rerun after the latest task, by request.
- `http://localhost:5173/` responds with HTTP 200.
- Browser smoke reload showed no fresh console errors after the shared standalone task membership update.
- Browser smoke reload showed no fresh console errors after the deep modular cleanup.
- Browser smoke reload showed no fresh console errors after the Acquaintances feature; the browser was on the auth surface, so signed-in feature QA is still manual.
- Manual QA confirms restore works for folders, folder tasks, and standalone tasks.
- Manual QA confirms 7-day restore countdown displays.
- Manual QA confirms acquaintance-aware Add Member works.
- Manual QA confirms cancel outgoing acquaintance request works.
- Manual QA confirms MVP in-app notifications work, including bell, unread count, panel, mark one read, mark all read, realtime arrival, and real notification rows.
- Manual QA confirms folder Up/Down reorder works.
- Manual QA confirms folder task Up/Down reorder works.
- Manual QA confirms standalone task Up/Down reorder works.
- Manual QA confirms reorder persists after refresh.
- Manual QA confirms shared folder task reorder updates another browser without refresh when tested.
- `npm run lint` passes after Pixel Design Pass 1 and logout race fixes.
- `npm run build` passes after Pixel Design Pass 1 and logout race fixes.
- Manual QA confirms sign out returns to the login/auth page cleanly with no deleted-items or GrowT data error message.
- `npm run lint` passes after Design Pass 2 and notification/mobile QA fixes.
- `npm run build` passes after Design Pass 2 and notification/mobile QA fixes.
- Forbidden scans pass after Design Pass 2 and notification/mobile QA fixes.
- Manual QA confirms the page/view layout, Notifications view, notification bell, session cleanup, and mobile cleanup are okay.

## Next Steps

Recommended build order:

1. Commit and push the completed page-based pixel app layout checkpoint.
2. Continue mutation-handler extraction only if future cleanup needs it.
3. Add task levels/subtasks UI.
4. Continue final pixel-art design/layout polish later.

Manual dashboard item:
- Enable leaked password protection in Supabase Auth settings.
