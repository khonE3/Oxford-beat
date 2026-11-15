<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Package Manager & CLI Rules (Bun Primary)

- Always use `bun` as the primary package manager and command runner in this repository instead of `npm` or `npx`.
- Package management:
  - Install dependencies: `bun install`
  - Add package: `bun add <pkg>` (or `bun add -d <pkg>` for devDependencies)
  - Remove package: `bun remove <pkg>`
- Scripts & CLI tools:
  - Dev server: `bun run dev`
  - Lint: `bun run lint`
  - TypeScript check: `bun x tsc --noEmit`
  - Execute one-off binaries: `bun x <command>` (instead of `npx <command>`)
- Production Build (Windows):
  - Use `bun x next build --webpack` for production builds on Windows to avoid Turbopack PostCSS worker spawn panics under Bun.
  - **Agents must NOT run production builds** (`bun x next build --webpack`, `bun run build`, `next build`). The user runs builds manually.
  - For verification, agents use only: `bun test`, `bun x tsc --noEmit`, `bun run lint` (and `bun run dev` for browser checks).
- Do not modify `bun.lock` with `npm` or generate `package-lock.json`.

- **Styling:** Tailwind CSS (Mobile-First Responsive Design)
