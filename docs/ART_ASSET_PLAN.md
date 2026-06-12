# Guinea Pig Beans Art Asset Plan

## Goal

Replace the current procedural Phaser shapes with a consistent cozy 2D art set that stays readable in a top-down management game. The first pass should focus on the assets that appear constantly: pigs, beans, cage floor, hay, water, and the first visible upgrades.

## Art Direction

Use this direction for every prompt unless an asset says otherwise:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.
```

Important constraints:

- No text inside images.
- Transparent PNG for individual sprites.
- Avoid realistic detail that disappears at small size.
- Keep objects centered with a little padding.
- Use the same camera angle for every object.
- Prefer simple, readable silhouettes over busy detail.
- Generate at high resolution first, then downscale in the game.

## Suggested Source Sizes

| Asset Type | Source Size | In-Game Approx Size |
| --- | ---: | ---: |
| Guinea pig sprite | 512x512 | 64x44 |
| Bean / poop pellet | 256x256 | 18x14 |
| Small decor item | 512x512 | 40-80 px |
| Cage background tile | 1024x1024 | scaled/tiled |
| Large cage object | 768x768 | 90-160 px |
| UI icon | 256x256 | 20-32 px |

## Folder And Naming Plan

Use this structure when generated art is ready:

```text
public/
  assets/
    sprites/
      pigs/
      beans/
      decor/
      upgrades/
    backgrounds/
    ui/
```

Recommended filenames:

```text
pig_cream_brown_idle.png
pig_white_black_idle.png
pig_russet_idle.png
bean_normal.png
bean_aged.png
bean_golden.png
bean_rainbow.png
bean_compost.png
cage_floor_fleece.png
hay_rack_full.png
water_bottle_full.png
litter_tray_clean.png
toy_ball_red.png
toy_tunnel_blue.png
roaming_dustpan.png
compost_bin.png
snack_dispenser.png
cavybot_3000.png
```

## Priority Pass 1: Core Loop

These should be generated first because they replace what the player sees every second.

### Guinea Pig Variants

Need 4-6 body variants. Start with still sprites before animation.

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A cute guinea pig viewed from above at a slight angle, oval body, tiny ears, small black eyes, rounded nose, stubby feet barely visible, friendly cozy look. Cream and brown patches, clear simple silhouette, neutral idle walking pose.
```

Variant notes:

- `pig_cream_brown_idle.png`: cream body, brown patches.
- `pig_white_black_idle.png`: white body, black patches.
- `pig_russet_idle.png`: warm russet body, cream nose.
- `pig_gray_white_idle.png`: soft gray body, white face stripe.
- `pig_tricolor_idle.png`: cream, black, and caramel patches.

Optional later animation frames:

- idle
- walk_1
- walk_2
- popcorn_jump
- eating
- drinking

### Bean / Poop Pellet Sprites

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A single small oval guinea pig bean pellet, cute and non-gross, rounded like a tiny bean, simple readable shape, subtle highlight, designed as collectible currency for a cozy incremental game.
```

Variants:

- `bean_normal.png`: dark brown bean.
- `bean_aged.png`: deeper brown with a tiny dry highlight.
- `bean_golden.png`: golden bean with soft shine.
- `bean_rainbow.png`: magical rainbow bean, still readable as one small pellet.
- `bean_compost.png`: earthy green-brown compost bean with a tiny leaf accent.

### Cage Floor Background

Prompt:

```text
Cozy 2D browser game background tile, top-down three-quarter view, soft rounded hand-painted digital style, warm natural colors, gentle ambient lighting from the upper left, no text, no UI.

A clean guinea pig cage floor with soft fleece bedding, subtle quilted square pattern, a few tiny hay strands, warm tan and muted green fabric tones, seamless or tile-friendly, readable but not visually busy.
```

Notes:

- This can replace the flat cage fill.
- Keep contrast low so pigs and beans remain visible.
- Generate one clean version first. Messy/late-game variants can come later.

### Hay Rack / Hay Pile

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A small guinea pig hay rack filled with golden hay, simple wooden or soft green frame, loose hay strands visible, cozy and readable from above, designed for a cage management game.
```

Useful variants:

- `hay_rack_full.png`
- `hay_rack_low.png`
- `hay_rack_empty.png`

### Water Bottle

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A guinea pig cage water bottle, clear blue-tinted bottle with red cap and small metal drinking spout, friendly rounded style, viewed from above at a slight angle, readable as a small game sprite.
```

Useful variants:

- `water_bottle_full.png`
- `water_bottle_low.png`
- `water_bottle_empty.png`

## Priority Pass 2: Visible Upgrades

These map to the current tech branches: Care, Habitat, and Automation.

### Litter Tray

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A small corner litter tray for a guinea pig cage, muted green plastic tray with pale bedding inside, rounded corners, clean and cozy, readable from above.
```

### Toy Pile

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A small pile of guinea pig toys: colorful wooden chew balls, a soft tunnel, and a tiny hanging chew toy, playful but not cluttered, viewed from above at a slight angle.
```

### Roaming Dustpan / Vacuum

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A cute small roaming dustpan robot for cleaning a guinea pig cage, rounded rectangular body, tiny wheels, little scoop front, soft gray and blue colors, one small yellow indicator light, friendly utility design.
```

### Compost Bin

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A small indoor compost bin for a cozy guinea pig cage game, rounded green container with lid slightly visible, tiny leaf symbol shape without text, clean and cute, viewed from above at a slight angle.
```

### Snack Dispenser

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A cute automatic snack dispenser for guinea pigs, rounded small machine with hay and veggie treats visible, soft teal and cream colors, simple readable shape, cozy game sprite style.
```

### CavyBot 3000

Prompt:

```text
Cozy 2D browser game asset, top-down three-quarter view, soft rounded shapes, hand-painted digital illustration, clean readable silhouette, warm natural colors with a few playful accent colors, gentle ambient lighting from the upper left, transparent background, no text, no UI, centered object, suitable for a small Phaser game sprite.

A charming advanced cleaning robot named CavyBot 3000, designed for a guinea pig cage, compact rounded body, tiny brush arms, soft blue casing, yellow status light, friendly futuristic but cozy, no visible text.
```

## Priority Pass 3: UI Icons

These can make the HUD feel more finished without changing the layout.

Recommended icons:

- Beans
- Happiness
- Hay
- Water
- Cleanliness
- Reputation
- Care branch
- Habitat branch
- Automation branch
- Pig adoption

Prompt template:

```text
Cozy 2D browser game UI icon, soft rounded hand-painted style, clean readable silhouette, transparent background, no text, no UI frame, centered object, designed to read clearly at 24 pixels.

[Describe one icon here.]
```

Examples:

- `ui_icon_beans.png`: a small pile of cute bean pellets with one golden highlight.
- `ui_icon_happiness.png`: a smiling guinea pig face with a tiny heart.
- `ui_icon_cleanliness.png`: a small sparkle over clean fleece bedding.
- `ui_icon_automation.png`: a tiny friendly cleaning robot head.

## Prompting Workflow

Use this loop for each asset family:

1. Generate a 4-image concept sheet for one asset.
2. Pick the best style.
3. Regenerate 3-5 variants using the same wording.
4. Save the best transparent PNG.
5. Downscale manually or in the build pipeline only after the source is archived.
6. Add the file to `public/assets/...`.
7. Integrate it in Phaser and verify at desktop and mobile sizes.

## Negative Prompt

Use this when the image tool supports negative prompts:

```text
photorealistic, 3D render, pixel art, hard black outlines, anime character, busy background, text, letters, numbers, watermark, logo, UI frame, cropped object, multiple unrelated objects, realistic poop, gross, horror, dark lighting, low contrast silhouette
```

## Integration Notes For Phaser

Current procedural objects to replace:

- `createPigView` should become sprite/container creation using pig variant texture keys.
- `createPoopView` should use `bean_*` sprites keyed by `PoopType`.
- `drawCage` can keep drawing the border while a `cage_floor_fleece` image/tile fills the center.
- `createHayPile`, `createWaterBottle`, and `createLitterTray` can become image sprites with alpha changes based on need/upgrade state.
- `syncTechDecor` can swap its generated shapes for upgrade sprites.

Start with image assets that can drop into the current layout without changing simulation logic.

## First Batch To Generate

Generate these first:

```text
pig_cream_brown_idle.png
pig_white_black_idle.png
pig_russet_idle.png
bean_normal.png
bean_aged.png
bean_golden.png
bean_rainbow.png
bean_compost.png
cage_floor_fleece.png
hay_rack_full.png
water_bottle_full.png
litter_tray_clean.png
toy_pile.png
roaming_dustpan.png
compost_bin.png
```

This batch is enough to make the game visibly shift from prototype art to a coherent first art pass.
