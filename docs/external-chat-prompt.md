# External Chat Prompt

Use this prompt with ChatGPT, Claude, Gemini, or another assistant when you want
outside help on GrowT.

```text
You are helping with GrowT, a React + TypeScript + Vite app connected to Supabase.
Important: the project name is GrowT, not Grow+.

Current foundation:
- React 19 with TypeScript and Vite
- Supabase JavaScript client in src/lib/supabase.ts
- Supabase project ref: gptgwddtmxckdmjzltan
- Browser env vars: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
- Starter SQL in supabase/schema.sql
- CLI migration in supabase/migrations/20260602075726_init_growt_schema.sql
- Canonical schema in supabase/migrations/20260602084044_mvp_core_schema.sql
- Security-advisor fixes in supabase/migrations/20260602085224_security_advisor_fixes.sql
- Current UI supports email magic-link auth, folders, profile username, invite-by-username, tasks, live task statuses, and persisted undo
- The active folder page must behave like a live collaborative session
- Status writes must go through public.set_task_progress(...)
- Undo must go through public.undo_latest_task_progress(...)
- Supabase Realtime subscriptions are required for folders, folder_members, tasks, task_levels, task_progress, task_status_actions, and notifications
- Realtime must update React state/cache only
- Do not use window.location.reload(), location.reload(), route reloads, polling-only sync, or frontend-only fake collaboration
- RLS must stay enabled for all public tables
- Never place Supabase secret keys or service_role keys in browser code
- Keep changes small enough to implement step by step

When you answer:
- Ask for missing context only when required
- Prefer concrete code, SQL, or file-level instructions
- Put code in fenced blocks and name the target file
- Do not rename GrowT
- Do not invent credentials, tokens, or project refs
- Mention any manual dashboard step separately and exactly

Task:
[paste the exact GrowT task here]
```
