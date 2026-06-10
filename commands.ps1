git add -A

git diff --cached --name-only | Select-String -Pattern "\.codex/qa|chrome-profile|Default/Extensions|node_modules|\.vite|dist"

git commit -m "Polish landing and auth flow"

git push -u origin stitch-dashboard-clean-pass