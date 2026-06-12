---
name: guinea-pig-beans-browser-verification
description: Verify Guinea Pig Beans builds and browser behavior. Use when running npm build, strict-port Vite, preview, Playwright, in-app browser checks, smoke tests, modal assertions, WebGL canvas proof, stale localhost diagnosis, Windows Node fallback commands, or verification notes for the D:\Documents\GitHub\guinea-pig-beans checkout.
---

# Guinea Pig Beans Browser Verification

Use this skill to prove code, UI, and rendering changes in the local browser game without accidentally testing the wrong app.

## Build Baseline

- Run `npm run build` for code changes.
- Retry once if Vite hits a transient Windows `ENOTEMPTY` cleanup error in `dist`.
- If PowerShell cannot find `npm`, use bundled Node:

```powershell
C:\Users\scott\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc
C:\Users\scott\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vite\bin\vite.js build
```

## Strict-Port Browser Smoke

- Prefer port `5176` for this checkout.
- Start Vite with an explicit host and port when needed:

```powershell
npx vite --host 127.0.0.1 --port 5176 --strictPort
```

- Before interacting, confirm the browser is serving this checkout by checking unique text or controls related to the current change.
- If the page looks stale, stop the old process, start a fresh strict-port server, and re-check the marker.
- Use the in-app browser when available for local targets; use compact headless Playwright from the repo when browser attachment or localhost access fails.

## Assertion Habits

- For modal content checks, open the dock section first. Example: click `#open-herd` before asserting `#pig-roster`.
- For WebGL canvas proof, avoid `getImageData()` as the main signal. Prefer DOM assertions, console checks, or `locator.screenshot()` for nonblank visual evidence.
- Avoid `Math.random = () => 0` in deterministic tests. Use a short deterministic sequence instead.
- Use `src/ui/devTools.ts` hooks when a scenario needs seeded resources, unlocks, or pig states.

## Useful Checks

- Confirm controls are enabled or disabled with readable reason text.
- Confirm scene feedback appears for major actions.
- Confirm modal rows wrap without overlapping at desktop and mobile widths.
- Confirm old-save hydration if persistent state changed.
- Confirm no console errors during the focused flow.

## Git And Cleanup

- Git commands may need:

```powershell
git -c safe.directory=D:/Documents/GitHub/guinea-pig-beans status --short
```

- `dist/` may appear after builds. Remove it only if a clean working tree is needed and it is not part of the intended change.
- Report what was verified and any checks that could not be run.
