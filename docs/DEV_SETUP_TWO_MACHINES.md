# Dev setup — two machines (home + work)

**Source of truth:** GitHub — `https://github.com/Armadallc/monarch.git`  
**Do not** put the repo in iCloud/Dropbox (corrupts `.git`, syncs `node_modules`, causes conflicts).

---

## Daily workflow

```text
Leaving:   git add → git commit → git push
Arriving:  git pull
```

Use a feature branch for big work; merge to `main` when ready.

---

## First-time setup (each machine)

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/Armadallc/monarch.git MonarchWebsites
cd MonarchWebsites
git pull   # always start current
```

Open in Cursor: **File → Open Folder** → `~/Projects/MonarchWebsites`  
(or `Workspaces/MonarchWebsites.code-workspace`)

### Playground (optional)

```bash
cd Code/playground/dashboard-ui
npm install
npm run dev
```

### Secrets (per machine — never in git)

| File | Purpose |
|------|---------|
| `.env` | Supabase keys, API URLs (copy from 1Password / secure note) |
| `.cursor/mcp.json` | Framer MCP URL + secret — recreate locally if using MCP |

Template only: `.env.example` (committed).

---

## Cursor settings

| What | Sync method |
|------|-------------|
| **Extensions, theme, keybindings** | Cursor **Settings Sync** (sign in to Cursor account on both Macs) |
| **Project plugins** | `.cursor/settings.json` — **committed in this repo** |

`.cursor/mcp.json` stays **gitignored** (contains secrets).

---

## What not to commit

Already in `.gitignore` or should stay local:

- `.env`, `.cursor/mcp.json`
- `node_modules/`, `dist/`, `*.tsbuildinfo`
- `.mcp-*`, `.framer-upload-*` (MCP / Framer session temp files)

Before every push: `git status` — confirm no secrets or build artifacts.

---

## Branches

| Branch | Use |
|--------|-----|
| `main` | Stable; merge when reviewed |
| `sync/*`, `feat/*` | Large or in-progress work (e.g. first multi-month sync) |

**Work machine after clone:**

```bash
git fetch origin
git checkout <branch-name>
git pull
```

---

## Wix / Framer go-live (no repo required)

DNS cutover is done in **Wix DNS + Framer** in the browser. Helpful docs in repo:

- `docs/MARKETING_GO_LIVE_MONDAY.md`
- `docs/DNS_EMAIL_AUDIT_CHECKLIST.md`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Everything I did at home is missing” | Forgot to `git push` before leaving |
| Merge conflicts | `git pull` → resolve in Cursor → commit → push |
| `node_modules` huge / weird errors | `rm -rf node_modules && npm install` in playground |
| MCP not working at work | Copy or recreate `.cursor/mcp.json` locally |
