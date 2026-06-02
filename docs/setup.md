# GrowT Setup Checklist

## GitHub Remote

1. Go to https://github.com/new.
2. Set Repository name to `GrowT`.
3. Choose Public or Private.
4. Leave README, `.gitignore`, and license unchecked.
5. Create the repository.
6. Run these commands from `C:\Users\Zainab\OneDrive\Documents\GrowT`:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/GrowT.git
git push -u origin main
```

## Supabase Project

1. Go to https://supabase.com/dashboard/projects.
2. Create a new project named `GrowT`.
3. Save the database password somewhere private.
4. Open the project, then open the Connect dialog.
5. Copy the Project URL.
6. Copy the Publishable key.
7. Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

8. Open SQL Editor in Supabase.
9. Paste the contents of `supabase/schema.sql`.
10. Run the SQL.
11. Restart the local dev server.

## Supabase MCP

`.mcp.json` points Codex to the Supabase remote MCP server. If Codex asks you to
authenticate Supabase MCP, complete the browser OAuth flow and reload the
thread.
