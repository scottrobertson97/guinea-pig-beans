# Guinea Pig Beans Team Orchestrator

Start here as the lead agent. Your job is to understand the request, choose the right team shape, coordinate any sub-agents, integrate their work, verify the result, and keep changes game-first, visible to the player, and aligned with the cozy management loop.

## Project Shape

- Phaser 3 + TypeScript + Vite browser game.
- GitHub Pages deploys the Vite `dist` output from `main`.
- The app combines a Phaser canvas with DOM HUD controls and modal sections.
- Core docs: `docs/FEATURE_PROGRESS.md`, `docs/DESIGN_DOC.md`, `docs/POLISHING_PLAN.md`, `docs/ART_ASSET_PLAN.md`, `docs/OUTLINE.md`, and `docs/PROJECT_TICKETS.md`.

## Lead-Agent Operating Model

- Own scope, sequencing, integration, conflicts, verification, and the final user-facing summary.
- Keep small, tightly coupled, or single-file changes local.
- Use sub-agents for broad work, explicit delegation requests, independent research, separable implementation slices, or parallel verification.
- Do not hand off the immediate blocking task if you need its answer before making progress; do that work locally.
- Give every coding worker a disjoint ownership area and tell them they are not alone in the codebase.
- Preserve unrelated working-tree changes. This checkout often has active local edits.

## Orchestration Flow

1. Classify the request: docs-only, gameplay systems, UI/HUD polish, art/assets, verification, or mixed feature work.
2. Load the matching skill and inspect the current repo state before delegating.
3. For broad or ambiguous work, spawn a Project Manager sub-agent to write or update `docs/PROJECT_TICKETS.md`.
4. Split implementation only where file ownership is separable; keep cross-cutting integration local.
5. Spawn worker sub-agents for independent slices and continue non-overlapping local work while they run.
6. Spawn a verification sub-agent when testing can run in parallel or when a large change needs an independent smoke pass.
7. For large or risky changes, run a reviewer pass focused on bugs, regressions, and missing tests.
8. Integrate results, resolve conflicts, run final verification, and summarize what changed and what was checked.

## Sub-Agent Role Matrix

| Role | Use When | Expected Output | Write Scope |
| --- | --- | --- | --- |
| Project Manager | A request is broad, multi-ticket, or needs sequencing before coding | Ticket breakdown in `docs/PROJECT_TICKETS.md`, dependencies, acceptance criteria, and suggested owners | Docs only unless explicitly asked otherwise |
| Explorer | A specific codebase question can be answered independently | Short findings with file references and risks | Read-only |
| Gameplay Worker | Simulation/resources/progression work can be isolated | Direct patch plus changed file list and verification notes | Assigned `src/simulation/*`, related HUD/dev-tool/doc files only |
| UI/HUD Worker | Modal, dock, copy, CSS, or scene feedback work can be isolated | Direct patch plus changed file list and responsive/UI notes | Assigned UI/CSS/scene feedback files only |
| Art Worker | Asset preparation or integration can be isolated | Asset paths, code integration notes, and changed file list | Assigned `public/assets/*`, `src/assetPaths.ts`, and related render code only |
| Verification Worker | Build/browser smoke can run independently | Commands run, browser assertions, screenshots/log notes, failures | Verification artifacts only unless asked to fix |
| Reviewer | A large or risky change needs independent review | Findings first, ordered by severity, with file/line references | Read-only |

## Delegation Rules

- Spawn sub-agents only when the user explicitly asks for delegation/sub-agents or the task is broad enough that parallel work materially helps.
- Do not duplicate work between the lead agent and sub-agents.
- Do not assign two workers overlapping write scopes.
- Tell workers to adapt to concurrent edits and never revert changes they did not make.
- Prefer concrete tasks with clear ownership, acceptance criteria, and expected final output.
- Review sub-agent changes before finalizing; the lead agent remains responsible for the repo.

## Skill Router

| Task | Use |
| --- | --- |
| Simulation rules, resources, progression, pig autonomy, persistence, or feature backlog updates | `$guinea-pig-beans-gameplay-systems` |
| HUD layout, dock/modal behavior, player-facing copy, scene feedback, polish passes, or CSS/UI responsiveness | `$guinea-pig-beans-ui-hud-polish` |
| Build checks, strict-port Vite runs, browser smoke tests, Playwright scripts, stale localhost diagnosis, or verification notes | `$guinea-pig-beans-browser-verification` |
| Asset naming, generated art handoff, `public/assets` organization, sprite integration, or `src/assetPaths.ts` updates | `$guinea-pig-beans-art-assets` |

Repo-tracked skill sources live in `.codex/skills/`. Personal mirrored copies may also exist in `C:\Users\scott\.codex\skills\` so Codex can auto-discover them.

## Prompt Templates

Project Manager:

```text
You are the Project Manager for Guinea Pig Beans. Read AGENTS.md and relevant docs, then create or update docs/PROJECT_TICKETS.md with a ticket breakdown for: <request>. Keep tickets implementation-ready with ID, goal, owner role, files/scope, acceptance criteria, verification, dependencies, and status. Do not edit gameplay source.
```

Gameplay Worker:

```text
Use $guinea-pig-beans-gameplay-systems. You own <files/modules>. Implement <ticket/request>. You are not alone in the codebase: do not revert others' changes, and adapt to concurrent edits. Keep rules in the simulation layer, surface player-visible feedback, update docs when the system meaningfully changes, and report changed files plus verification.
```

UI/HUD Worker:

```text
Use $guinea-pig-beans-ui-hud-polish. You own <files/modules>. Implement <ticket/request>. You are not alone in the codebase: do not revert others' changes, and adapt to concurrent edits. Preserve the dock/modal pattern, keep status visible and responsive, and report changed files plus verification.
```

Art Worker:

```text
Use $guinea-pig-beans-art-assets. You own <asset/code paths>. Implement <ticket/request>. You are not alone in the codebase: do not revert others' changes, and adapt to concurrent edits. Follow docs/ART_ASSET_PLAN.md naming and integration rules, and report changed files plus visual verification.
```

Verification Worker:

```text
Use $guinea-pig-beans-browser-verification. Verify <ticket/request> in this checkout. Run the appropriate build and focused browser smoke checks, prefer strict port 5176, avoid getImageData as primary WebGL proof, and report commands, assertions, console errors, screenshots/logs, and any failures.
```

Reviewer:

```text
Review the current Guinea Pig Beans changes for bugs, regressions, missing tests, save compatibility, UI overlap, and player-visible feedback gaps. Findings first, ordered by severity, with file/line references. Do not modify files.
```

## Universal Implementation Rules

- Put resource math and player action outcomes in the simulation layer before exposing them through HUD or scene feedback.
- Keep high-frequency care/status information visible; use the existing dock and modal pattern for deeper controls.
- New persistent fields need save hydration or migration thought in `src/simulation/persistence.ts`. Current save key: `gpb-save-v1`.
- Meaningful gameplay changes should update player-facing HUD/copy and `docs/FEATURE_PROGRESS.md` in the same pass.
- Reuse existing assets under `public/assets/...` before adding placeholders.

## Commands

- `npm run dev`: start Vite on `127.0.0.1`.
- `npm run dev -- --port 5176 --strictPort`: start the preferred local review server for this checkout, then open `http://127.0.0.1:5176/`.
- `http://127.0.0.1:5176/constants`: dev-only constants editor served by Vite during `npm run dev`; it edits literal values in `src/simulation/balance.ts` and is not available from production builds or the game dock.
- `npm run build`: run TypeScript and Vite production build.
- `npm run preview`: serve the production build locally.
- There is no dedicated test script. For gameplay/UI changes, use build plus a focused browser smoke check.
- If PowerShell cannot find `npm`, run local tools through bundled Node:
  - `C:\Users\scott\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc`
  - `C:\Users\scott\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vite\bin\vite.js build`

## Constants Editor

- Use `/constants` only as local dev tooling for balance tuning. Do not add runtime mutable constants or a player-facing link.
- The editor exposes scalar literals from `src/simulation/balance.ts`, including top-level numeric constants and selected object leaves such as pig activity weights, lifecycle thresholds, furniture space costs, ability Squeak costs, and furniture base costs.
- Each row saves one source literal. A successful save rewrites `balance.ts`, so changes persist through dev-server restarts and should be reviewed like ordinary code.
- If the editor reports a stale source hash, refresh `/constants` before saving again; another process or agent changed `balance.ts`.
- After changing constants, run `npm run build` and a focused smoke check for the affected mechanic.

## Verification Baseline

- Run `npm run build` for code changes. Retry once if Vite hits a transient Windows `ENOTEMPTY` cleanup error in `dist`.
- For gameplay, UI, layout, input, or rendering changes, run a short browser smoke check after the build.
- Prefer strict local port `5176` for this checkout so another app is not tested by accident.
- Confirm the browser is serving this checkout before interacting by checking unique page text or controls related to the change.
- Open modal sections before asserting nested modal content, such as clicking `#open-herd` before checking `#pig-roster`.
- Phaser renders through WebGL, so prefer DOM assertions, console checks, or screenshots over `getImageData()` as primary canvas proof.

## Windows And Git Notes

- Git commands may need the safe-directory prefix:
  - `git -c safe.directory=D:/Documents/GitHub/guinea-pig-beans status --short`
- Generated `dist/` output may appear after builds or verification. Remove it only when a clean working tree is needed and it is not part of the intended change.
- Local dependencies are installed, but shell PATH may not expose every Node shim. Prefer local binaries or the bundled Node fallback when needed.
