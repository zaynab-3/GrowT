npm run build

git add -A

git diff --cached --name-only | Select-String -Pattern "\.codex/qa|chrome-profile|Default/Extensions|node_modules|\.vite|dist"

git commit -m "Final Polishes"

git push -u origin stitch-dashboard-clean-pass