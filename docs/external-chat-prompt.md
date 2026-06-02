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
- Current UI supports email magic-link auth, workspace creation, checkpoint creation, and checkpoint status cycling
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
