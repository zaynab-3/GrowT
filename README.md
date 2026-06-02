# GrowT

GrowT is a React + TypeScript + Supabase app scaffold. The name is intentionally
`GrowT`, not `Grow+`.

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

1. Create a Supabase project named `GrowT`.
2. Copy the Project URL and Publishable key from the Supabase project Connect
   dialog.
3. Paste those values into `.env.local`.
4. Open the Supabase SQL Editor and run `supabase/schema.sql`.
5. Restart `npm run dev`.

The SQL file enables RLS and grants authenticated API access for the starter
tables together.

## GitHub

This folder is already a git repository. Create an empty GitHub repository named
`GrowT` with no README, no `.gitignore`, and no license, then run:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/GrowT.git
git push -u origin main
```

If GitHub CLI or a token becomes available, these steps can be automated.

## External Chat

Use `docs/external-chat-prompt.md` when asking ChatGPT, Claude, Gemini, or
another assistant for help. It keeps the project name, stack, and safety rules
consistent.
