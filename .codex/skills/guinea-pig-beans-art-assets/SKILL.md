---
name: guinea-pig-beans-art-assets
description: Work on Guinea Pig Beans art assets. Use when adding, generating, naming, organizing, or integrating sprites, UI icons, cage backgrounds, furniture art, public/assets files, ART_ASSET_PLAN.md prompts, src/assetPaths.ts mappings, or Phaser asset usage in the D:\Documents\GitHub\guinea-pig-beans checkout.
---

# Guinea Pig Beans Art Assets

Use this skill for asset handoff and integration. Favor cozy, readable game assets that make the actual pigs, beans, furniture, and cage state easier to inspect.

## First Read

- Read `ART_ASSET_PLAN.md` for art direction, source sizes, folder naming, prompt guidance, and priority batches.
- Inspect `public/assets/...` before adding new files.
- Inspect `src/assetPaths.ts` and current `src/scenes/GameScene.ts` usage before wiring assets.
- Check `FEATURE_PROGRESS.md` when assets complete a tracked polish or gameplay item.

## Asset Rules

- Reuse existing assets under `public/assets/...` before adding placeholders.
- Follow the repo naming plan from `ART_ASSET_PLAN.md`.
- Keep sprites readable at in-game scale; avoid details that only work at source resolution.
- Prefer transparent PNGs for sprites and UI icons unless the existing asset type says otherwise.
- Avoid adding generated art that conflicts with the established cozy, warm, toy-like direction.

## Integration Workflow

1. Place files in the planned `public/assets/...` location.
2. Add or update constants in `src/assetPaths.ts` when code needs stable paths.
3. Load and render assets from Phaser using existing scene patterns.
4. Keep procedural fallbacks only when they are useful for resilience or development.
5. Verify the asset appears at the intended scale, depth, and position in the game.
6. Update `ART_ASSET_PLAN.md` or `FEATURE_PROGRESS.md` if a tracked asset batch or polish item is completed.

## Prompting Workflow

- Use `ART_ASSET_PLAN.md` prompts as the source of truth for generated asset requests.
- Keep prompts specific about subject, angle, transparency, sprite readability, and what should not be included.
- Generate or request batches only when the destination paths and integration target are clear.
- Normalize naming and dimensions before wiring assets into gameplay.

## Done Criteria

- Assets live in the expected `public/assets/...` paths and are referenced through stable code paths where appropriate.
- Phaser rendering shows the real asset, not an accidental placeholder.
- Browser verification follows `$guinea-pig-beans-browser-verification` for rendering changes.
