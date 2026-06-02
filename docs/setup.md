# GrowT Setup Checklist

## GitHub Remote

Remote is set to `https://github.com/zaynab-3/GrowT.git`.

GitHub currently rejects pushes if Windows authenticates as the wrong cached
account. Fix that by signing in as `zaynab-3` in Git Credential Manager or
GitHub Desktop, then run:

```bash
git branch -M main
git push -u origin main
```

## Supabase Project

Project ref: `gptgwddtmxckdmjzltan`

Project URL: `https://gptgwddtmxckdmjzltan.supabase.co`

`.env.local` has already been created:

```bash
VITE_SUPABASE_URL=https://gptgwddtmxckdmjzltan.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Use this CLI path after authenticating:

```bash
npx supabase login
npx supabase link --project-ref gptgwddtmxckdmjzltan
npx supabase db push
```

If the CLI asks for the database password, use the private database password
saved when creating the project.

Fallback path:

1. Open SQL Editor in Supabase.
2. Paste the contents of `supabase/schema.sql`.
3. Run the SQL.
4. Restart the local dev server.

## Supabase MCP

`.mcp.json` points Codex to the Supabase remote MCP server. If Codex asks you to
authenticate Supabase MCP, complete the browser OAuth flow and reload the
thread.
