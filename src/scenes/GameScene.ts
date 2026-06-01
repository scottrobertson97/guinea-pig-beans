import Phaser from "phaser";
import { getScoopRadius } from "../simulation/balance";
import { cleanAtWithResult, type CleanedPoop, type CleanResult } from "../simulation/actions";
import { placeFurniture } from "../simulation/state";
import { updateSimulation } from "../simulation/systems";
import type { AbilityId, FurnitureId, GameState, Pig, Poop, PoopType, Robot } from "../simulation/types";
import { emitPlayerAction, emitUiSound } from "../ui/events";

interface SceneData {
  state: GameState;
  onStateChanged: () => void;
}

type ActionEffectId = "hay" | "scoop" | "robot" | "cage" | "furniture-ready" | "herd" | "ability";

interface HudActionEffectDetail {
  effect?: ActionEffectId;
  abilityId?: AbilityId;
}

const HUD_ACTION_EFFECT_EVENT = "guinea-pig-action-effect";

const CLEANLINESS_PATCHES = [
  { x: 0.18, y: 0.28, width: 92, height: 36 },
  { x: 0.78, y: 0.24, width: 74, height: 30 },
  { x: 0.48, y: 0.42, width: 106, height: 42 },
  { x: 0.28, y: 0.68, width: 84, height: 34 },
  { x: 0.72, y: 0.72, width: 96, height: 38 },
  { x: 0.55, y: 0.82, width: 68, height: 28 },
  { x: 0.14, y: 0.52, width: 62, height: 26 },
  { x: 0.87, y: 0.48, width: 58, height: 24 },
] as const;

const FLEECE_STITCHES = [
  { x1: 0.16, y1: 0.22, x2: 0.3, y2: 0.22 },
  { x1: 0.46, y1: 0.2, x2: 0.62, y2: 0.2 },
  { x1: 0.72, y1: 0.3, x2: 0.86, y2: 0.3 },
  { x1: 0.18, y1: 0.46, x2: 0.34, y2: 0.46 },
  { x1: 0.52, y1: 0.52, x2: 0.66, y2: 0.52 },
  { x1: 0.13, y1: 0.74, x2: 0.28, y2: 0.74 },
  { x1: 0.42, y1: 0.79, x2: 0.58, y2: 0.79 },
  { x1: 0.72, y1: 0.72, x2: 0.88, y2: 0.72 },
] as const;

const BEDDING_VARIATIONS = [
  { x: 0.24, y: 0.3, width: 130, height: 44 },
  { x: 0.66, y: 0.36, width: 116, height: 38 },
  { x: 0.39, y: 0.62, width: 144, height: 52 },
  { x: 0.76, y: 0.78, width: 104, height: 34 },
] as const;

const LOOSE_HAY_FLECKS = [
  { x: 0.17, y: 0.18, angle: -0.35, length: 20 },
  { x: 0.28, y: 0.36, angle: 0.28, length: 16 },
  { x: 0.82, y: 0.2, angle: 0.18, length: 18 },
  { x: 0.62, y: 0.43, angle: -0.22, length: 14 },
  { x: 0.16, y: 0.63, angle: 0.4, length: 17 },
  { x: 0.53, y: 0.77, angle: -0.48, length: 18 },
  { x: 0.86, y: 0.62, angle: 0.34, length: 15 },
] as const;

const RIM_CHEW_MARKS = [
  { x: 0.2, y: 15, width: 20 },
  { x: 0.5, y: 15, width: 28 },
  { x: 0.77, y: 15, width: 18 },
  { x: 0.32, y: -15, width: 22 },
  { x: 0.68, y: -15, width: 24 },
] as const;

const PIG_DISPLAY_WIDTH = 40;
const PIG_DISPLAY_HEIGHT = 30;
const PIG_SHADOW_WIDTH = 31;
const PIG_SHADOW_HEIGHT = 8;
const PIG_SHADOW_Y = 9;
const PIG_SPRITE_Y = -1;
const PIG_THOUGHT_Y = -32;
const BEAN_POP_SCALE = 1.3;
const MESS_PILE_POP_SCALE = 1.16;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private onStateChanged!: () => void;
  private pigViews = new Map<number, Phaser.GameObjects.Container>();
  private poopViews = new Map<number, Phaser.GameObjects.Image>();
  private poopShadowViews = new Map<number, Phaser.GameObjects.Ellipse>();
  private furnitureViews = new Map<number, Phaser.GameObjects.Container>();
  private pigThoughtCooldowns = new Map<number, number>();
  private pigActionCooldowns = new Map<number, number>();
  private robotView: Phaser.GameObjects.Image | null = null;
  private cageFloor!: Phaser.GameObjects.TileSprite;
  private cleanlinessWash!: Phaser.GameObjects.Rectangle;
  private dirtPatches!: Phaser.GameObjects.Graphics;
  private hayPile!: Phaser.GameObjects.Image;
  private hayShadow!: Phaser.GameObjects.Ellipse;
  private waterBottle!: Phaser.GameObjects.Image;
  private waterShadow!: Phaser.GameObjects.Ellipse;
  private scoopPreview!: Phaser.GameObjects.Ellipse;
  private prefersReducedMotion = false;
  private readonly handleHudActionEffect = (event: Event): void => {
    const detail = (event as CustomEvent<HudActionEffectDetail>).detail ?? {};
    const { effect } = detail;
    if (!effect) return;
    this.playActionEffect(detail);
  };

  constructor() {
    super("GameScene");
  }

  init(data: SceneData): void {
    this.state = data.state;
    this.onStateChanged = data.onStateChanged;
  }

  preload(): void {
    this.load.image("cage-floor-fleece", "/assets/backgrounds/cage_floor_fleece.png");
    this.load.image("pig-cream-brown", "/assets/sprites/pigs/pig_cream_brown_idle.png");
    this.load.image("pig-white-black", "/assets/sprites/pigs/pig_white_black_idle.png");
    this.load.image("pig-russet", "/assets/sprites/pigs/pig_russet_idle.png");
    this.load.image("pig-gray-white", "/assets/sprites/pigs/pig_gray_white_idle.png");
    this.load.image("pig-tricolor", "/assets/sprites/pigs/pig_tricolor_idle.png");
    this.load.image("bean-normal", "/assets/sprites/beans/bean_normal.png");
    this.load.image("bean-aged", "/assets/sprites/beans/bean_aged.png");
    this.load.image("bean-golden", "/assets/sprites/beans/bean_golden.png");
    this.load.image("bean-rainbow", "/assets/sprites/beans/bean_rainbow.png");
    this.load.image("bean-compost", "/assets/sprites/beans/bean_compost.png");
    this.load.image("hay-rack-full", "/assets/sprites/decor/hay_rack_full.png");
    this.load.image("water-bottle-full", "/assets/sprites/decor/water_bottle_full.png");
    this.load.image("litter-tray-clean", "/assets/sprites/decor/litter_tray_clean.png");
    this.load.image("toy-pile", "/assets/sprites/decor/toy_pile.png");
    this.load.image("roaming-dustpan", "/assets/sprites/upgrades/roaming_dustpan.png");
    this.load.image("compost-bin", "/assets/sprites/upgrades/compost_bin.png");
    this.load.image("cavybot-3000", "/assets/sprites/upgrades/cavybot_3000.png");
  }

  create(): void {
    this.prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.cameras.main.setBackgroundColor("#d8c6a6");
    this.drawCage();
    this.hayPile = this.createHayPile(88, 88);
    this.waterBottle = this.createWaterBottle(this.state.cage.width - 90, 82);
    this.scoopPreview = this.add
      .ellipse(0, 0, getScoopRadius(this.state) * 2, getScoopRadius(this.state) * 2)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setFillStyle(0xffffff, 0.08)
      .setDepth(50)
      .setVisible(false);

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.scoopPreview.setPosition(pointer.worldX, pointer.worldY);
      this.scoopPreview.setVisible(true);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (placeFurniture(this.state, pointer.worldX, pointer.worldY)) {
        this.onStateChanged();
        this.syncViews();
        this.playFurniturePlacementEffect(pointer.worldX, pointer.worldY);
        return;
      }

      const cleanResult = cleanAtWithResult(this.state, pointer.worldX, pointer.worldY);
      this.playCleanFeedback(cleanResult, pointer.worldX, pointer.worldY);
      if (cleanResult.cleaned === 0) {
        this.reactToEmptyClick(pointer.worldX, pointer.worldY);
      }
      this.onStateChanged();
      this.syncViews();
    });

    this.scale.on("resize", this.resize, this);
    window.addEventListener(HUD_ACTION_EFFECT_EVENT, this.handleHudActionEffect);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener(HUD_ACTION_EFFECT_EVENT, this.handleHudActionEffect);
    });
    this.resize();
    this.syncViews();
  }

  update(_: number, delta: number): void {
    updateSimulation(this.state, delta / 1000);
    this.syncViews();
    this.onStateChanged();
  }

  private resize(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const zoom = Math.min(width / this.state.cage.width, height / this.state.cage.height);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(this.state.cage.width / 2, this.state.cage.height / 2);
  }

  private drawCage(): void {
    const { width, height } = this.state.cage;
    const backing = this.add.graphics();
    backing.setDepth(0);
    backing.fillStyle(0xcdb58d, 1);
    backing.fillRoundedRect(0, 0, width, height, 22);

    this.cageFloor = this.add
      .tileSprite(width / 2, height / 2, width - 28, height - 28, "cage-floor-fleece")
      .setDepth(1)
      .setAlpha(0.92);
    this.drawAmbientCageDetails(width, height);

    this.cleanlinessWash = this.add
      .rectangle(width / 2, height / 2, width - 28, height - 28, 0x6b503a, 0)
      .setDepth(3);
    this.dirtPatches = this.add.graphics().setDepth(3.1);

    const graphics = this.add.graphics();
    graphics.setDepth(6);
    graphics.lineStyle(14, 0x8a6e4d, 1);
    graphics.strokeRoundedRect(7, 7, width - 14, height - 14, 20);
  }

  private drawAmbientCageDetails(width: number, height: number): void {
    const details = this.add.graphics().setDepth(2.2);

    details.fillStyle(0xffffff, 0.045);
    for (const patch of BEDDING_VARIATIONS) {
      details.fillEllipse(width * patch.x, height * patch.y, patch.width, patch.height);
    }

    details.lineStyle(2, 0xfffbec, 0.18);
    for (const stitch of FLEECE_STITCHES) {
      const x1 = width * stitch.x1;
      const x2 = width * stitch.x2;
      const y1 = height * stitch.y1;
      const y2 = height * stitch.y2;
      details.lineBetween(x1, y1, x2, y2);

      for (let x = x1 + 10; x < x2; x += 16) {
        details.lineBetween(x, y1 - 4, x + 4, y2 + 4);
      }
    }

    details.lineStyle(2, 0xd7c74b, 0.34);
    for (const fleck of LOOSE_HAY_FLECKS) {
      const x = width * fleck.x;
      const y = height * fleck.y;
      const dx = Math.cos(fleck.angle) * fleck.length;
      const dy = Math.sin(fleck.angle) * fleck.length;
      details.lineBetween(x - dx / 2, y - dy / 2, x + dx / 2, y + dy / 2);
    }

    details.lineStyle(3, 0xfff2cf, 0.18);
    details.strokeRoundedRect(20, 20, width - 40, height - 40, 16);
    details.lineStyle(2, 0x6e543b, 0.28);
    for (const mark of RIM_CHEW_MARKS) {
      const x = width * mark.x;
      const y = mark.y > 0 ? mark.y : height + mark.y;
      details.lineBetween(x - mark.width / 2, y, x + mark.width / 2, y);
      details.lineBetween(x - mark.width / 4, y + (mark.y > 0 ? 3 : -3), x + mark.width / 4, y);
    }
  }

  private syncViews(): void {
    this.syncCleanlinessVisuals();

    const seenPigIds = new Set<number>();
    for (const pig of this.state.pigs) {
      seenPigIds.add(pig.id);
      let view = this.pigViews.get(pig.id);
      if (!view) {
        view = this.createPigView(pig);
        this.pigViews.set(pig.id, view);
      }

      const dx = pig.targetX - pig.x;
      view.setPosition(pig.x, pig.y);
      view.setRotation(Math.sin(this.time.now / 220 + pig.id) * 0.035);
      view.setScale(dx < 0 ? -1 : 1, 1);
      this.applyPigMood(view, pig);
      this.maybeShowPigThought(pig);
    }

    for (const [id, view] of this.pigViews) {
      if (!seenPigIds.has(id)) {
        view.destroy();
        this.pigViews.delete(id);
        this.pigThoughtCooldowns.delete(id);
        this.pigActionCooldowns.delete(id);
      }
    }

    const seenPoopIds = new Set<number>();
    for (const poop of this.state.poops) {
      seenPoopIds.add(poop.id);
      let shadow = this.poopShadowViews.get(poop.id);
      if (!shadow) {
        shadow = this.createPoopShadow(poop);
        this.poopShadowViews.set(poop.id, shadow);
      }
      let view = this.poopViews.get(poop.id);
      if (!view) {
        view = this.createPoopView(poop);
        this.poopViews.set(poop.id, view);
      }
      shadow.setPosition(poop.x, poop.y + 7);
      view.setPosition(poop.x, poop.y);
      this.applyPoopShadowStyle(shadow, poop);
      this.applyPoopStyle(view, poop);
    }

    for (const [id, view] of this.poopViews) {
      if (!seenPoopIds.has(id)) {
        view.destroy();
        this.poopViews.delete(id);
      }
    }
    for (const [id, shadow] of this.poopShadowViews) {
      if (!seenPoopIds.has(id)) {
        shadow.destroy();
        this.poopShadowViews.delete(id);
      }
    }

    this.syncFurnitureViews();

    if (this.state.robot) {
      if (!this.robotView) {
        this.robotView = this.createRobotView(this.state.robot);
      }
      this.syncRobotView(this.robotView, this.state.robot);
    } else if (this.robotView) {
      this.robotView.destroy();
      this.robotView = null;
    }

    this.scoopPreview.setSize(getScoopRadius(this.state) * 2, getScoopRadius(this.state) * 2);
    this.syncCareObjectStates();
  }

  private syncCleanlinessVisuals(): void {
    const dirt = Phaser.Math.Clamp((100 - this.state.cage.cleanliness) / 100, 0, 1);
    const targetAlpha = dirt <= 0.08 ? 0 : 0.08 + dirt * 0.24;
    const washColor = this.state.cage.cleanliness < 35 ? 0x5f4937 : 0x7b633f;

    this.cageFloor.setTint(getCleanlinessFloorTint(this.state.cage.cleanliness));
    this.cleanlinessWash.setFillStyle(washColor, 1);
    this.cleanlinessWash.setAlpha(Phaser.Math.Linear(this.cleanlinessWash.alpha, targetAlpha, 0.18));

    this.dirtPatches.clear();
    if (dirt <= 0.08) return;

    const patchAlpha = Phaser.Math.Clamp(this.cleanlinessWash.alpha + 0.04, 0.06, 0.34);
    const patchCount = this.state.cage.cleanliness < 35 ? 8 : this.state.cage.cleanliness < 70 ? 5 : 2;
    this.dirtPatches.fillStyle(0x6a513a, patchAlpha);

    for (let index = 0; index < patchCount; index += 1) {
      const patch = CLEANLINESS_PATCHES[index % CLEANLINESS_PATCHES.length];
      this.dirtPatches.fillEllipse(
        this.state.cage.width * patch.x,
        this.state.cage.height * patch.y,
        patch.width,
        patch.height,
      );
    }

    for (const poop of this.state.poops) {
      if (poop.type !== "messPile" && poop.type !== "stinky") continue;
      const localAlpha = poop.type === "messPile" ? 0.28 : 0.16;
      this.dirtPatches.fillStyle(poop.type === "stinky" ? 0x56633d : 0x5d4938, localAlpha);
      this.dirtPatches.fillEllipse(poop.x, poop.y + 7, poop.type === "messPile" ? 74 : 38, poop.type === "messPile" ? 36 : 20);
    }
  }

  private syncFurnitureViews(): void {
    const seenIds = new Set<number>();
    for (const placement of this.state.furniturePlacements) {
      seenIds.add(placement.id);
      let view = this.furnitureViews.get(placement.id);
      if (!view) {
        view = this.createFurnitureView(placement.furnitureId, placement.x, placement.y);
        this.furnitureViews.set(placement.id, view);
      }
      view.setPosition(placement.x, placement.y);
    }

    for (const [id, view] of this.furnitureViews) {
      if (!seenIds.has(id)) {
        view.destroy();
        this.furnitureViews.delete(id);
      }
    }
  }

  private createPigView(pig: Pig): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, PIG_SHADOW_Y, PIG_SHADOW_WIDTH, PIG_SHADOW_HEIGHT, 0x000000, 0.13);
    const sprite = this.add.image(0, PIG_SPRITE_Y, this.getPigTextureKey(pig)).setDisplaySize(PIG_DISPLAY_WIDTH, PIG_DISPLAY_HEIGHT);
    const view = this.add.container(pig.x, pig.y, [shadow, sprite]);
    view.setDepth(20);
    return view;
  }

  private applyPigMood(view: Phaser.GameObjects.Container, pig: Pig): void {
    const sprite = view.list[1] as Phaser.GameObjects.Image;
    const nearHay = Math.hypot(pig.x - 88, pig.y - 88) < 90;
    const nearWater = Math.hypot(pig.x - (this.state.cage.width - 90), pig.y - 82) < 90;
    const idleWiggle = this.prefersReducedMotion ? 0 : Math.sin(this.time.now / 180 + pig.id) * 0.035;
    let displayWidth = PIG_DISPLAY_WIDTH;
    let displayHeight = PIG_DISPLAY_HEIGHT;

    sprite.setTexture(this.getPigTextureKey(pig));
    sprite.clearTint();
    if (pig.mood === "hungry") sprite.setAlpha(0.78);
    else if (pig.mood === "thirsty") sprite.setAlpha(0.86);
    else if (pig.mood === "messy") sprite.setAlpha(0.7);
    else sprite.setAlpha(1);

    if (pig.mood === "hungry") sprite.setTint(0xf0d56b);
    else if (pig.mood === "thirsty") sprite.setTint(0x9ed9e8);
    else if (pig.mood === "messy") sprite.setTint(0xd8c2a3);

    if (nearHay && this.state.needs.hay > 0) {
      displayWidth *= 1.04 + idleWiggle;
      displayHeight *= 0.98 - idleWiggle;
    } else if (nearWater && this.state.needs.water > 0) {
      displayWidth *= 0.98;
      displayHeight *= 1.04 + idleWiggle;
    } else if (pig.trait === "Zoomer") {
      displayWidth *= 1 + Math.abs(idleWiggle);
      displayHeight *= 1 - Math.abs(idleWiggle) * 0.5;
    }
    sprite.setDisplaySize(displayWidth, displayHeight);
  }

  private createPoopView(poop: Poop): Phaser.GameObjects.Image {
    const view = this.add.image(poop.x, poop.y, this.getPoopTextureKey(poop)).setDepth(10);
    view.setRotation(Math.random() * Math.PI);
    return view;
  }

  private createPoopShadow(poop: Poop): Phaser.GameObjects.Ellipse {
    return this.add.ellipse(poop.x, poop.y + 7, 20, 8, 0x000000, 0.13).setDepth(8);
  }

  private applyPoopShadowStyle(view: Phaser.GameObjects.Ellipse, poop: Poop): void {
    const size = poop.type === "mega" ? [26, 10] : poop.type === "messPile" ? [44, 18] : [20, 8];
    view.setSize(size[0], size[1]);
    view.setAlpha(poop.type === "stinky" || poop.type === "messPile" ? 0.18 : 0.12);
  }

  private applyPoopStyle(view: Phaser.GameObjects.Image, poop: Poop): void {
    view.setTexture(this.getPoopTextureKey(poop));
    view.clearTint();
    view.setAlpha(1);

    const size = getPoopDisplaySize(poop.type);
    view.setDisplaySize(size.width, size.height);

    if (poop.type === "stinky") view.setTint(0x6f8f47);
    else if (poop.type === "blessed") view.setTint(0xfff6bf);
    else if (poop.type === "mystery") view.setTint(0xa98be4);
    else if (poop.type === "hay") view.setTint(0xd8cb58);
    else if (poop.type === "royal") view.setTint(0xb965d2);
    else if (poop.type === "cursed") view.setTint(0x3a3348);
    else if (poop.value > poop.baseValue && poop.type === "normal") view.setTexture("bean-aged");

    if (poop.type === "messPile") view.setAlpha(0.86 + Math.sin(this.time.now / 160) * 0.08);
  }

  private createRobotView(robot: Robot): Phaser.GameObjects.Image {
    return this.add.image(robot.x, robot.y, "roaming-dustpan").setDisplaySize(48, 48).setDepth(15);
  }

  private syncRobotView(view: Phaser.GameObjects.Image, robot: Robot): void {
    const dx = robot.targetX - robot.x;
    view.setPosition(robot.x, robot.y);
    view.setFlipX(dx < 0);
    view.setRotation(robot.state === "sweeping" ? Math.sin(this.time.now / 85) * 0.05 : 0);
    if (this.state.automation.overdrive > 0) {
      view.setTint(0xf0d56b);
      const size = 52 + Math.sin(this.time.now / 120) * 2;
      view.setDisplaySize(size, size);
    } else {
      view.clearTint();
      view.setDisplaySize(48, 48);
    }
  }

  private playActionEffect(detail: HudActionEffectDetail): void {
    this.syncViews();
    const effect = detail.effect;

    if (effect === "hay") {
      this.playImageGlow(this.hayPile, "Better Hay", 0xf0d56b);
      return;
    }

    if (effect === "scoop") {
      this.playScoopPulse();
      return;
    }

    if (effect === "cage") {
      this.playCageFlash();
      return;
    }

    if (effect === "robot") {
      this.playRobotPulse();
      return;
    }

    if (effect === "herd") {
      this.playHerdWelcome();
      return;
    }

    if (effect === "ability") {
      this.playAbilityReaction(detail.abilityId);
      return;
    }

    this.playFurnitureReadyEffect();
  }

  private playImageGlow(source: Phaser.GameObjects.Image, text: string, color: number): void {
    this.addFloatingText(source.x, source.y - source.displayHeight / 2 - 8, text, color, 1);

    const glow = this.add
      .image(source.x, source.y, source.texture.key)
      .setDisplaySize(source.displayWidth, source.displayHeight)
      .setDepth(source.depth + 0.5)
      .setTint(color)
      .setAlpha(0.5);

    if (this.prefersReducedMotion) {
      this.time.delayedCall(260, () => glow.destroy());
      return;
    }

    this.tweens.add({
      targets: glow,
      alpha: 0,
      scale: 1.24,
      duration: 460,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
    this.addBurst(source.x, source.y, color, 7);
  }

  private playScoopPulse(): void {
    const x = this.state.cage.width / 2;
    const y = this.state.cage.height / 2;
    const radius = getScoopRadius(this.state);
    const ring = this.add
      .ellipse(x, y, radius * 2, radius * 2)
      .setDepth(68)
      .setStrokeStyle(3, 0xf0d56b, 0.9)
      .setFillStyle(0xf0d56b, 0.08);

    this.addFloatingText(x, y - radius - 14, "Better Scoop", 0xf0d56b, 1);

    if (this.prefersReducedMotion) {
      this.time.delayedCall(260, () => ring.destroy());
      return;
    }

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.28,
      duration: 430,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  private playCageFlash(): void {
    const { width, height } = this.state.cage;
    const flash = this.add.graphics().setDepth(7);
    flash.fillStyle(0xf0d56b, 0.11);
    flash.fillRoundedRect(0, 0, width, height, 22);
    flash.lineStyle(14, 0xf0d56b, 0.68);
    flash.strokeRoundedRect(7, 7, width - 14, height - 14, 20);
    this.addFloatingText(width / 2, 56, "Bigger Cage", 0xf0d56b, 1);

    if (this.prefersReducedMotion) {
      this.time.delayedCall(240, () => flash.destroy());
      return;
    }

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 440,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  private playRobotPulse(): void {
    if (this.robotView) {
      this.playImageGlow(this.robotView, "Roomba", 0x86d9f0);
      return;
    }

    const x = this.state.robot?.x ?? this.state.cage.width / 2;
    const y = this.state.robot?.y ?? this.state.cage.height / 2;
    this.addFloatingText(x, y - 30, "Roomba", 0x86d9f0, 1);
    if (!this.prefersReducedMotion) this.addBurst(x, y, 0x86d9f0, 7);
  }

  private playHerdWelcome(): void {
    const pig = this.state.pigs.at(-1);
    if (!pig) return;

    this.showPigReaction(pig, "Hi!", 1200, 1200);
    if (!this.prefersReducedMotion) this.addBurst(pig.x, pig.y, 0xf0d56b, 5);
  }

  private playFurnitureReadyEffect(): void {
    const x = this.state.cage.width / 2;
    const y = this.state.cage.height / 2;
    this.addFloatingText(x, y - 24, "Place it", 0xe4b83b, 1);
    this.reactHerd("New!", 2);
    if (!this.prefersReducedMotion) this.addBurst(x, y, 0xe4b83b, 5);
  }

  private playFurniturePlacementEffect(x: number, y: number): void {
    this.addFloatingText(x, y - 28, "Placed", 0x7db46a, 1);
    this.reactPigsNear(x, y, "New!", 170, 3);

    if (this.prefersReducedMotion) return;

    this.addBurst(x, y, 0xf0d56b, 8);
    const view = this.getNearestFurnitureView(x, y);
    if (!view) return;

    this.tweens.add({
      targets: view,
      scale: 1.1,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  private getNearestFurnitureView(x: number, y: number): Phaser.GameObjects.Container | null {
    let nearest: Phaser.GameObjects.Container | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const view of this.furnitureViews.values()) {
      const distance = Math.hypot(view.x - x, view.y - y);
      if (distance < nearestDistance) {
        nearest = view;
        nearestDistance = distance;
      }
    }

    return nearestDistance <= 48 ? nearest : null;
  }

  private playAbilityReaction(abilityId?: AbilityId): void {
    const reaction = getAbilityReaction(abilityId);
    const x = this.state.cage.width / 2;
    const y = this.state.cage.height / 2;

    this.addFloatingText(x, y - 34, reaction.label, reaction.color, 1);
    this.reactHerd(reaction.thought, reaction.pigCount);
    if (!this.prefersReducedMotion) this.addBurst(x, y, reaction.color, reaction.burstCount);
  }

  private playCleanFeedback(result: CleanResult, x: number, y: number): void {
    if (result.cleaned === 0) return;

    emitPlayerAction("cleanBean");
    emitUiSound(result.rare > 0 || result.golden > 0 ? "rareClean" : "clean");

    for (const cleaned of result.cleanedPoops) {
      this.playBeanPop(cleaned);
    }

    this.reactPigsNear(x, y, result.cleaned > 1 ? "Nice!" : "!");

    if (result.comboBonus > 0) {
      this.addFloatingText(x, y - 26, `Streak +${result.comboBonus}`, 0xffd95a, 1.06);
      if (!this.prefersReducedMotion) this.addBurst(x, y, 0xffd95a, 8);
    }
  }

  private reactPigsNear(x: number, y: number, text: string, radius = 130, maxCount = 2): void {
    const nearby = this.state.pigs
      .filter((pig) => Math.hypot(pig.x - x, pig.y - y) < radius)
      .slice(0, maxCount);
    for (const pig of nearby) {
      this.showPigReaction(pig, text, 1200, 1600);
    }
  }

  private reactToEmptyClick(x: number, y: number): void {
    const pig = this.getNearestPig(x, y, 74);
    if (!pig) return;
    this.showPigReaction(pig, getClickReactionText(pig), 1100, 1500);
  }

  private reactHerd(text: string, maxCount: number): void {
    const pigs = [...this.state.pigs]
      .sort((left, right) => left.id - right.id)
      .slice(0, maxCount);
    for (const pig of pigs) {
      this.showPigReaction(pig, text, 1200, 1600);
    }
  }

  private showPigReaction(pig: Pig, text: string, duration: number, cooldownMs: number): boolean {
    const nextTime = this.pigActionCooldowns.get(pig.id) ?? 0;
    if (this.time.now < nextTime) return false;

    this.showPigThought(pig, text, duration);
    emitUiSound("pig");
    this.pigActionCooldowns.set(pig.id, this.time.now + cooldownMs);
    this.pigThoughtCooldowns.set(pig.id, this.time.now + Math.max(2200, cooldownMs + 800));
    return true;
  }

  private getNearestPig(x: number, y: number, radius: number): Pig | null {
    let nearest: Pig | null = null;
    let nearestDistance = radius;

    for (const pig of this.state.pigs) {
      const distance = Math.hypot(pig.x - x, pig.y - y);
      if (distance <= nearestDistance) {
        nearest = pig;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private playBeanPop(cleaned: CleanedPoop): void {
    const color = getPoopAccentColor(cleaned.type);
    if (this.prefersReducedMotion) {
      this.addFloatingText(cleaned.x, cleaned.y - 18, getCleanRewardText(cleaned), color, 1);
      return;
    }

    const size = getPoopDisplaySize(cleaned.type);
    const popScale = cleaned.type === "messPile" ? MESS_PILE_POP_SCALE : BEAN_POP_SCALE;
    const sprite = this.add
      .image(cleaned.x, cleaned.y, this.getPoopFeedbackTextureKey(cleaned))
      .setDepth(65)
      .setAlpha(0.95)
      .setDisplaySize(size.width, size.height)
      .setRotation(Math.random() * Math.PI);
    const targetScaleX = sprite.scaleX * popScale;
    const targetScaleY = sprite.scaleY * popScale;

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      y: cleaned.y - 10,
      duration: 360,
      ease: "Cubic.easeOut",
      onComplete: () => sprite.destroy(),
    });

    this.addFloatingText(cleaned.x, cleaned.y - 18, getCleanRewardText(cleaned), color, 1);
    this.addBurst(cleaned.x, cleaned.y, color, cleaned.type === "normal" ? 4 : 7);
  }

  private addFloatingText(x: number, y: number, text: string, color: number, scale: number): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "17px",
        fontStyle: "700",
        color: `#${color.toString(16).padStart(6, "0")}`,
        stroke: "#fffaf0",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(80)
      .setScale(scale);

    this.tweens.add({
      targets: label,
      alpha: 0,
      y: y - (this.prefersReducedMotion ? 8 : 28),
      duration: this.prefersReducedMotion ? 280 : 620,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private addBurst(x: number, y: number, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.22, 0.22);
      const distance = Phaser.Math.Between(14, 28);
      const mote = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.78).setDepth(70);

      this.tweens.add({
        targets: mote,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.35,
        duration: 380,
        ease: "Cubic.easeOut",
        onComplete: () => mote.destroy(),
      });
    }
  }

  private maybeShowPigThought(pig: Pig): void {
    if (!this.pigThoughtCooldowns.has(pig.id)) {
      this.pigThoughtCooldowns.set(pig.id, this.time.now + Phaser.Math.Between(900, 3200));
      return;
    }

    const nextTime = this.pigThoughtCooldowns.get(pig.id) ?? 0;
    if (this.time.now < nextTime) return;

    const text = getPigThoughtText(pig, this.state);
    this.showPigThought(pig, text, 1500);
    this.pigThoughtCooldowns.set(pig.id, this.time.now + Phaser.Math.Between(5200, 9200));
  }

  private showPigThought(pig: Pig, text: string, duration: number): void {
    const view = this.pigViews.get(pig.id);
    if (!view) return;

    const bubble = this.add.container(pig.x, pig.y + PIG_THOUGHT_Y).setDepth(90);
    const label = this.add
      .text(0, 0, text, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "700",
        color: "#243126",
      })
      .setOrigin(0.5);
    const width = Math.max(34, label.width + 14);
    const back = this.add
      .rectangle(0, 0, width, 24, 0xfffaf0, 0.92)
      .setStrokeStyle(2, 0x7ea86d, 0.52);
    const tail = this.add.triangle(-10, 13, 0, 0, 9, 0, 4, 8, 0xfffaf0, 0.92);
    bubble.add([back, tail, label]);

    if (!this.prefersReducedMotion) {
      this.tweens.add({
        targets: view,
        y: pig.y - 3,
        yoyo: true,
        duration: 120,
        ease: "Sine.easeOut",
      });
    }

    this.tweens.add({
      targets: bubble,
      alpha: 0,
      y: pig.y + PIG_THOUGHT_Y - (this.prefersReducedMotion ? 6 : 14),
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => bubble.destroy(),
    });
  }

  private createHayPile(x: number, y: number): Phaser.GameObjects.Image {
    this.hayShadow = this.add.ellipse(x, y + 28, 68, 18, 0x000000, 0.14).setDepth(3.5);
    return this.add.image(x, y, "hay-rack-full").setDisplaySize(84, 84).setDepth(4);
  }

  private createWaterBottle(x: number, y: number): Phaser.GameObjects.Image {
    this.waterShadow = this.add.ellipse(x, y + 27, 52, 16, 0x000000, 0.13).setDepth(3.5);
    return this.add.image(x, y, "water-bottle-full").setDisplaySize(76, 76).setDepth(4);
  }

  private syncCareObjectStates(): void {
    this.applyNeedSpriteState(this.hayPile, this.hayShadow, this.state.needs.hay, 84, 84, 0xd8cb58);
    this.applyNeedSpriteState(this.waterBottle, this.waterShadow, this.state.needs.water, 76, 76, 0x86d9f0);
  }

  private applyNeedSpriteState(
    sprite: Phaser.GameObjects.Image,
    shadow: Phaser.GameObjects.Ellipse,
    value: number,
    width: number,
    height: number,
    lowTint: number,
  ): void {
    const clamped = Phaser.Math.Clamp(value, 0, 100);
    const scale = clamped <= 0 ? 0.82 : clamped < 25 ? 0.9 : clamped < 55 ? 0.96 : 1;
    sprite.setDisplaySize(width * scale, height * scale);
    sprite.setAlpha(clamped <= 0 ? 0.34 : clamped < 25 ? 0.58 : clamped < 55 ? 0.78 : 1);
    if (clamped <= 0) sprite.setTint(0x8d8171);
    else if (clamped < 25) sprite.setTint(lowTint);
    else sprite.clearTint();

    shadow.setAlpha(clamped <= 0 ? 0.06 : clamped < 25 ? 0.1 : 0.14);
    shadow.setScale(scale, scale);
  }

  private createFurnitureView(id: FurnitureId, x: number, y: number): Phaser.GameObjects.Container {
    const parts = [this.createFurnitureShadow(id), ...this.createFurnitureParts(id)];
    return this.add.container(x, y, parts).setDepth(5);
  }

  private createFurnitureShadow(id: FurnitureId): Phaser.GameObjects.Ellipse {
    const size = getFurnitureShadowSize(id);
    return this.add.ellipse(0, size.y, size.width, size.height, 0x000000, 0.13);
  }

  private createFurnitureParts(id: FurnitureId): Phaser.GameObjects.GameObject[] {
    if (id === "litterTray") {
      return [this.add.image(0, 0, "litter-tray-clean").setDisplaySize(90, 76)];
    }
    if (id === "chewToy") {
      return [this.add.image(0, 0, "toy-pile").setDisplaySize(80, 70)];
    }
    if (id === "cardboardCastle") {
      return [this.add.image(0, 0, "compost-bin").setDisplaySize(74, 76)];
    }
    if (id === "tunnel") {
      return [
        this.add.ellipse(0, 0, 96, 36, 0x7a5736).setStrokeStyle(3, 0x51351f, 0.72),
        this.add.ellipse(0, 6, 68, 22, 0x3d2c20),
      ];
    }
    if (id === "royalThrone") {
      return [
        this.add.rectangle(0, 10, 52, 38, 0x7c65a9).setStrokeStyle(3, 0x4e376b, 0.8),
        this.add.rectangle(0, -18, 44, 44, 0x9b5ab6),
        this.add.circle(0, -40, 8, 0xe4b83b),
      ];
    }
    if (id === "snuggleSack") {
      return [
        this.add.ellipse(0, 0, 78, 42, 0xd6d1c4).setStrokeStyle(3, 0x8f8a80, 0.7),
        this.add.ellipse(0, 4, 48, 20, 0x6a5f54),
      ];
    }
    return [
      this.add.rectangle(0, 12, 76, 48, 0x8a6e4d).setStrokeStyle(3, 0x5d4129, 0.7),
      this.add.ellipse(0, 28, 38, 24, 0x3d2c20),
    ];
  }

  private getPigTextureKey(pig: Pig): string {
    const keys = ["pig-cream-brown", "pig-white-black", "pig-russet", "pig-gray-white", "pig-tricolor"];
    return keys[(pig.id - 1) % keys.length];
  }

  private getPoopTextureKey(poop: Poop): string {
    return getPoopTextureKey(poop.type, poop.value > poop.baseValue);
  }

  private getPoopFeedbackTextureKey(poop: CleanedPoop): string {
    return getPoopTextureKey(poop.type, poop.type === "normal" && poop.value > 1);
  }
}

function getPoopTextureKey(type: PoopType, aged: boolean): string {
  if (type === "golden") return "bean-golden";
  if (type === "compost") return "bean-compost";
  if (type === "mystery" || type === "royal" || type === "cursed") return "bean-rainbow";
  if (type === "stinky" || type === "hay") return "bean-compost";
  if (aged) return "bean-aged";
  return "bean-normal";
}

function getPoopDisplaySize(type: PoopType): { width: number; height: number } {
  if (type === "mega") return { width: 25, height: 21 };
  if (type === "messPile") return { width: 40, height: 32 };
  return { width: 18, height: 15 };
}

function getPoopAccentColor(type: PoopType): number {
  if (type === "golden") return 0xe4b83b;
  if (type === "compost") return 0x6fa55d;
  if (type === "blessed") return 0xfff2a6;
  if (type === "royal") return 0xb965d2;
  if (type === "cursed") return 0x75608f;
  if (type === "mystery") return 0x8c75d8;
  if (type === "stinky") return 0x7a9c52;
  if (type === "hay") return 0xd7c74b;
  if (type === "messPile") return 0x8a6e4d;
  return 0x7db46a;
}

function getCleanlinessFloorTint(cleanliness: number): number {
  if (cleanliness < 35) return 0xc2aa88;
  if (cleanliness < 70) return 0xe0cfae;
  return 0xffffff;
}

function getFurnitureShadowSize(id: FurnitureId): { width: number; height: number; y: number } {
  if (id === "litterTray") return { width: 86, height: 24, y: 28 };
  if (id === "chewToy") return { width: 64, height: 20, y: 24 };
  if (id === "cardboardCastle") return { width: 68, height: 22, y: 28 };
  if (id === "tunnel") return { width: 92, height: 22, y: 18 };
  if (id === "royalThrone") return { width: 62, height: 20, y: 20 };
  if (id === "snuggleSack") return { width: 74, height: 22, y: 18 };
  return { width: 74, height: 22, y: 26 };
}

function getPigThoughtText(pig: Pig, state: GameState): string {
  if (state.needs.hay < 25 || pig.mood === "hungry") return "Hay?";
  if (state.needs.water < 25 || pig.mood === "thirsty") return "H2O";
  if (pig.mood === "messy" || state.cage.cleanliness < 45) return "Clean?";
  if (pig.trait === "Neat Freak") return "Tray";
  if (pig.trait === "Hay Goblin") return "Hay!";
  if (pig.trait === "Shy Beaner") return "Hide";
  if (pig.trait === "Royal Pig") return "Royal";
  if (pig.trait === "Zoomer") return "Run!";
  if (pig.trait === "Compost Mystic") return "Hmm";
  return "Sniff";
}

function getClickReactionText(pig: Pig): string {
  if (pig.trait === "Zoomer") return "Zoom?";
  if (pig.trait === "Neat Freak") return "Clean?";
  if (pig.trait === "Shy Beaner") return "Hi?";
  if (pig.trait === "Royal Pig") return "Yes?";
  return "Sniff";
}

function getAbilityReaction(abilityId?: AbilityId): { label: string; thought: string; color: number; pigCount: number; burstCount: number } {
  if (abilityId === "wheekCall") {
    return { label: "Wheek Call", thought: "Wheek!", color: 0xf0d56b, pigCount: 4, burstCount: 7 };
  }
  if (abilityId === "treatBag") {
    return { label: "Treat Bag", thought: "Treats?", color: 0xe4b83b, pigCount: 4, burstCount: 7 };
  }
  if (abilityId === "deepClean") {
    return { label: "Deep Clean", thought: "Clean!", color: 0x86d9f0, pigCount: 3, burstCount: 6 };
  }
  if (abilityId === "freshBedding") {
    return { label: "Fresh Bedding", thought: "Fresh!", color: 0x7db46a, pigCount: 3, burstCount: 6 };
  }
  if (abilityId === "snackTime") {
    return { label: "Snack Time", thought: "Snack!", color: 0xe4b83b, pigCount: 4, burstCount: 7 };
  }
  if (abilityId === "zoomieMode") {
    return { label: "Zoomie Mode", thought: "Run!", color: 0xb965d2, pigCount: 4, burstCount: 8 };
  }
  return { label: "Ability", thought: "!", color: 0xf0d56b, pigCount: 3, burstCount: 5 };
}

function getCleanRewardText(cleaned: CleanedPoop): string {
  if (cleaned.type === "golden") return "+Gold";
  if (cleaned.type === "compost") return "+Compost";
  if (cleaned.type === "blessed") return "+Squeak";
  return `+${cleaned.value}`;
}
