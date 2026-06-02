# GrowT Progress Log

Last updated: June 2, 2026

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
- Enabled RLS on canonical public tables.
- Added RLS policies for profiles, folders, members, tasks, task progress, task status actions, and notifications.
- Added database RPCs:
  - `public.set_task_progress(task_id, task_level_id, new_status)`
  - `public.undo_latest_task_progress(task_id, task_level_id)`
- Kept privileged status logic inside the private schema.
- Added canonical Realtime publication entries for:
  - `acquaintance_requests`
  - `folders`
  - `folder_members`
  - `tasks`
  - `task_levels`
  - `task_progress`
  - `task_status_actions`
  - `notifications`

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

- Built the first Supabase-backed auth flow with email magic link sign-in.
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
- Added task status buttons:
  - Ongoing
  - Half Done
  - Completed
- Added persisted undo buttons based on the current user's latest undoable `task_status_actions` row.

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
13. Refresh both browsers and confirm the database state remains correct.

## Verification Already Run

- `npm run lint` passes.
- `npm run build` passes.
- Search for forbidden reload sync patterns in `src` found no matches.
- Supabase migration list confirms local and remote migrations are aligned through `20260602085224`.
- Supabase database advisors now only report the dashboard-only leaked password protection warning.

## Next Steps

- Enable leaked password protection manually in the Supabase dashboard.
- Browser-test the two-account realtime acceptance flow.
- Add richer shared-folder permissions and acquaintances.
- Add task levels/subtasks UI.
- Add notifications UI.
- Add folder/task soft-delete and restore flows.
- Add search.
- Add reorder controls.
- Save the cute visual design pass for later.
