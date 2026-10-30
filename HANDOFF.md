# MESM Project Handoff

Handoff for the next Copilot session. Read this file before changing anything.

## Project

- **Workspace:** `D:\website-projects-backup\meems-gems`
- **App:** MESM jewellery storefront and admin/order-management app.
- **Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase in production, local JSON data in development.
- **Dev URL:** http://localhost:3000
- **Start command:** `npm.cmd run dev -- --hostname 127.0.0.1 --port 3000`
- **VS Code task:** `MESM Development Server (3000)` in `.vscode/tasks.json`

## What happened in this session

1. The user asked to load the project on localhost:3000. The first browser view showed the custom 404 page, although a later refresh showed the homepage.
2. The user reported it still was not loading. Inspection showed that the HTML could load while the generated Next.js CSS and JavaScript URLs returned 404, leaving the page unstyled/unusable. This was a stale/inconsistent generated `.next` build cache, not a missing homepage route.
3. The old `.next` directory was moved aside, Next.js was restarted using the existing VS Code development task, and the fresh build compiled successfully. The stale backup was then removed.
4. Verification after the rebuild:
   - Root page returned HTTP 200.
   - Homepage heading “Find Your Style” rendered in the browser.
   - Next.js CSS and page JavaScript assets returned HTTP 200.
   - Browser reported no HTTP error responses on the homepage.
5. No application source code was changed as part of diagnosing/fixing the localhost loading problem. The project is currently loading at http://localhost:3000.

If it stops loading again, first check whether the VS Code task is still running. If the homepage HTML loads but Next.js assets return 404, stop/restart that task; if needed, move the generated `.next` directory aside and let `next dev` create a fresh one. Do not remove source files or user data as a cache fix.

## Current GitHub and Supabase follow-up

- The user has intentionally emptied `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Fresh Supabase setup is deferred until the user signs into the new account. Do not attempt to provision or connect a Supabase project yet.
- `.env.local` is ignored and must never be staged or pushed. `data/store.json` is also ignored and should remain local. `.env.example` contains placeholders, not actual credentials.
- The repository is on local branch `master` at `9b8e102`. The user confirmed `https://github.com/nexuseventmanagementorg-cell/mesm`; it is configured locally as `origin`, and GitHub's default branch is `main` at `b7d5375`.
- Local `master` and GitHub `main` have **unrelated Git histories** (no merge base); their committed tree snapshots differ in 181 files. Do not force-push or overwrite `main`. Ask the user whether to integrate the local snapshot into `main` while preserving GitHub's existing commits, or prepare a separate review branch based on `main`.
- The worktree contains extensive pending tracked and untracked changes, including the requested product images and `public/uploads/images`. Do not discard them. Do not include anything in `public/uploads/payment-proofs`.
- The hero file `public/images/kashif bhai/MESM.mp4` is about 147.6 MB, exceeding GitHub's 100 MB per-file normal Git limit. The user approved Git LFS; Git LFS 3.8.1 is installed, and the untracked `.gitattributes` declares `*.mp4` for LFS. There are three MP4s in the public asset tree, about 358 MB total.
- The user verified that the three Supabase keys are empty and approved Git LFS, and provided the GitHub URL. `npm.cmd test` passed all 11 tests. No commit or push has been made yet because the local branch and GitHub `main` have unrelated histories; get the user's choice on safe integration before changing branch history.
- `src/components/layout/HeroVideo.tsx` references `/images/kashif%20bhai/MESM.mp4`; the named file exists at that path. The current localhost page has been verified to load.

Next action: obtain the user's GitHub repository URL and confirmation to use Git LFS for MP4s, then carefully review/stage the intended code and public assets while excluding `.env.local`, `data/store.json`, and payment proofs. After the push, arrange fresh Supabase setup separately with the user.

## Important existing workspace state

- The Git worktree was already extensively modified/untracked when inspected. It includes many application, database, test, configuration, and asset changes. These were **not** reviewed as part of this localhost troubleshooting.
- Preserve all existing changes. Do not run `git reset`, `git checkout`, broad cleanup commands, or overwrite files without first reviewing the user's intent.
- `.env.local` contains private configuration. Never display, copy into this handoff, commit, or share its values. `.env.local` is ignored by Git.
- `data/store.json` is local store data; preserve it.
- The task configuration in `.vscode/tasks.json` has two server tasks: port 3000 and port 3002. Use the 3000 task for the requested localhost URL.

## Project map

- `src/app/page.tsx` — storefront homepage.
- `src/app/shop/page.tsx` — catalogue.
- `src/app/admin/` — admin pages.
- `src/app/api/` — API routes.
- `src/lib/db.ts` — local JSON/Supabase data access.
- `data/store.json` — development store data.
- `tests/critical-logic.test.mjs` — project test suite (run with `npm.cmd test`).
- `README.md` — project setup and feature overview.

## Where to start next

There is no unfinished code change from this support task. First confirm the user is in this same workspace and that http://localhost:3000 still opens. Then ask what they want to work on next; do not infer a new feature from this handoff. If they report the loading issue again, verify the dev task and static asset responses before editing app code.
