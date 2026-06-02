# GrowT Architecture Plan

GrowT is a collaborative to-do and live session tracking web app. The old prompt
said Grow+, but the project name is GrowT.

## MVP Backbone

The app is moving from a small prototype toward the full production shape in
three layers:

1. Database and security foundation
2. App shell, routing, and feature modules
3. Pixel-art visual system and motion polish

Design polish is intentionally later. The immediate priority is persistence,
permissions, realtime-ready tables, and undo logic that survives refresh.

## Frontend Structure

Planned React modules:

- `src/lib`: Supabase client, generated database types, shared data helpers
- `src/auth`: session provider, auth forms, protected route helpers
- `src/layout`: app shell, sidebar, topbar, mobile drawer
- `src/features/folders`: dashboard folders, folder detail, sharing
- `src/features/tasks`: task cards, task detail, status grid, undo
- `src/features/acquaintances`: user search, requests, acquaintance list
- `src/features/notifications`: bell, panel, notification page
- `src/components/pixel`: reusable pixel UI components after core app works

## Supabase Tables

Canonical MVP tables:

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

The older `growt_profiles`, `growt_workspaces`, and `growt_checkpoints` tables
were starter tables. They can be retired after the frontend is migrated.

## RLS Strategy

- Every public app table has RLS enabled.
- Profiles are readable by authenticated users for username/display-name lookup.
- Users can update only their own profile.
- Folder access is based on ownership or `folder_members`.
- Task access follows folder membership, or ownership for standalone tasks.
- Notifications are visible and updatable only by the recipient.
- Direct task progress writes are not exposed to the client; progress mutations
  go through RPC wrappers.

## RPC Strategy

Sensitive progress logic lives in private database functions and is exposed
through small public RPC wrappers:

- `set_task_progress(task_id, task_level_id, new_status)`
- `undo_latest_task_progress(task_id, task_level_id)`

The private functions validate `auth.uid()`, folder/task access, and latest
action ownership before mutating progress/history.

## Realtime Strategy

MVP realtime uses Supabase Postgres Changes on canonical tables:

- folders
- folder members
- tasks
- task levels
- task progress
- status actions
- notifications
- acquaintance requests

React subscriptions should update local query state from database events, not
fake shared updates with local-only state.

Current implementation:

- The active folder opens a `live-folder:{folderId}` Realtime channel.
- Folder, member, task, and notification subscriptions use database filters
  where the changed table has the needed column.
- Task progress, status actions, and task level events are filtered in React
  against the active folder's current task IDs.
- Status buttons call `set_task_progress`.
- Undo buttons call `undo_latest_task_progress`.
- The browser must never reload as the sync mechanism.

## Notification Strategy

MVP uses only database-backed in-app notifications:

- notification bell
- unread count
- notification panel/page
- mark one read
- mark all read
- realtime arrival while app is open

No push notifications in the MVP.
