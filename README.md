# GrowT

GrowT is a React + TypeScript + Supabase app scaffold.

## Current Stack

- React 19
- TypeScript
- Vite
- Supabase JavaScript client
- Local git repository

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` after the Supabase project exists:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

Only publishable Supabase keys belong in Vite browser env vars. Never put a
secret key or service role key in `.env.local`.

## Supabase

Project ref: `gptgwddtmxckdmjzltan`

Project URL: `https://gptgwddtmxckdmjzltan.supabase.co`

The local `.env.local` file has already been created with the Supabase project
URL and publishable key. It is ignored by git.

Use the CLI once you are authenticated:

```bash
npx supabase login
npx supabase link --project-ref gptgwddtmxckdmjzltan
npx supabase db push
```

If the CLI asks for the database password, use the database password you saved
when creating the Supabase project. Do not paste the password into source files.

If CLI auth is not available yet, open the Supabase SQL Editor and run
`supabase/schema.sql`.

The SQL file enables RLS and grants authenticated API access for the starter
tables together.

## GitHub

Remote: `https://github.com/zaynab-3/GrowT.git`

If GitHub rejects the push as the wrong cached account, sign in to GitHub as
`zaynab-3` in Git Credential Manager, then run:

```bash
git branch -M main
git push -u origin main
```

## External Chat

Use `docs/external-chat-prompt.md` when asking ChatGPT, Claude, Gemini, or
another assistant for help. It keeps the project name, stack, and safety rules
consistent.
