# Public Repository Hygiene & `.gitignore` Policy

This repository is **PUBLIC**. Never commit secrets, personal machine configs, or generated build/cache artifacts.

## Must Ignore (Never Commit)
- **Secrets & Env:** `.env`, `.env.*` (except committed templates like `.env.example`), `*.pem`, `*.key`, `*.p12`, credentials/tokens.
- **Dependencies & Caches:** `node_modules/`, `.next/`, `out/`, `build/`, `.turbo/`, `.bun/`, `*.tsbuildinfo`.
- **IDE & OS:** `.vscode/`, `.idea/`, `*.swp`, `.DS_Store`, `Thumbs.db`, `Desktop.ini`.
- **Logs & Temp:** `*.log`, `coverage/`, `tmp/`, `*.tmp`.
- **Local AI / Agent Scratch:** `.gemini/`, `*.local.md`.

## Must Select / Commit (Public Repo Essentials)
- **Source & Assets:** `app/`, `components/`, `lib/`, `types/`, `public/`.
- **Config & Lockfiles:** `package.json`, `bun.lock`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore`, `README.md`, `AGENTS.md`.
- **Tests:** `**/__tests__/**`, `*.test.ts`.
- Always check `git status` before staging/committing and update `.gitignore` if new untracked local/cache files appear.
