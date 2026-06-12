import Phaser from "phaser";
import { assetPath } from "../assetPaths";
import { getZoneMetrics } from "../simulation/ecology";
import { getScoopRadius } from "../simulation/balance";
import { cleanAtWithResult, magnetizePoopsTowardScoop, type CleanedPoop, type CleanResult } from "../simulation/actions";
import { getStaticFurniturePlacement, getUnlockedFurniturePlacements } from "../simulation/state";
import { updateSimulation } from "../simulation/systems";
import type { AbilityId, FurnitureId, GameState, Pig, Poop, PoopType, Robot } from "../simulation/types";
import { emitPlayerAction, emitUiSound, type SceneFeedbackDetail } from "../ui/events";
import {
  getAbilityReaction,
  getCleanRewardText,
  getClickReactionText,
  getCouncilReactionText,
  getEventReactionText,
  getPigThoughtText,
} from "./sceneFeedbackText";

interface SceneData {
  state: GameState;
  onStateChanged: () => void;
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

const PIG_DISPLAY_WIDTH = 80;
const PIG_DISPLAY_HEIGHT = 60;
const PIG_SHADOW_WIDTH = 62;
const PIG_SHADOW_HEIGHT = 16;
const PIG_SHADOW_Y = 18;
const PIG_SPRITE_Y = -2;
const PIG_THOUGHT_Y = -52;
const POOP_SHADOW_Y = 14;
const BEAN_POP_SCALE = 1.3;
const MESS_PILE_POP_SCALE = 1.16;
const FIRST_CLEAN_POP_SCALE = 1.52;
const FIRST_CLEAN_BURST_COUNT = 14;
const FLOATING_TEXT_MARGIN = 34;
const MAX_FLOATING_TEXT_LABELS = 5;
const SCOOPER_CURSOR_ORIGIN_X = 0;
const SCOOPER_CURSOR_ORIGIN_Y = 1;
const SCOOPER_CURSOR_MIN_WIDTH = 46;
const SCOOPER_CURSOR_MAX_WIDTH = 76;
const SCOOP_RADIUS_PREVIEW_DEPTH = 49;
const GOLDEN_SCOOP_MAGNET_INTERVAL_MS = 90;
const GOLDEN_SCOOP_MIN_POINTER_DISTANCE = 6;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private onStateChanged!: () => void;
  private pigViews = new Map<number, Phaser.GameObjects.Container>();
  private poopViews = new Map<number, Phaser.GameObjects.Image>();
  private poopShadowViews = new Map<number, Phaser.GameObjects.Ellipse>();
  private furnitureViews = new Map<FurnitureId, Phaser.GameObjects.Container>();
  private pigThoughtCooldowns = new Map<number, number>();
  private pigActionCooldowns = new Map<number, number>();
  private seenActivePigRequestToken = 0;
  private seenPigRequestResultToken = 0;
  private robotView: Phaser.GameObjects.Image | null = null;
  private cageBacking!: Phaser.GameObjects.Graphics;
  private cageFloor!: Phaser.GameObjects.TileSprite;
  private cageDetails!: Phaser.GameObjects.Graphics;
  private cleanlinessWash!: Phaser.GameObjects.Rectangle;
  private dirtPatches!: Phaser.GameObjects.Graphics;
  private cageRim!: Phaser.GameObjects.Graphics;
  private hayPile!: Phaser.GameObjects.Image;
  private hayShadow!: Phaser.GameObjects.Ellipse;
  private waterBottle!: Phaser.GameObjects.Image;
  private waterShadow!: Phaser.GameObjects.Ellipse;
  private scoopRadiusPreview!: Phaser.GameObjects.Ellipse;
  private scoopCursor!: Phaser.GameObjects.Image;
  private lastCageWidth = 0;
  private lastCageHeight = 0;
  private activeFloatingTextCount = 0;
  private lastCleanedPoops = 0;
  private lastGoldenScoopMagnetAt = 0;
  private lastMagnetPointerX = Number.NaN;
  private lastMagnetPointerY = Number.NaN;
  private prefersReducedMotion = false;
  private readonly handleHudActionEffect = (event: Event): void => {
    const detail = (event as CustomEvent<SceneFeedbackDetail>).detail;
    if (detail) this.playActionEffect(detail);
  };

  constructor() {
    super("GameScene");
  }

  init(data: SceneData): void {
    this.state = data.state;
    this.onStateChanged = data.onStateChanged;
  }

  preload(): void {
    this.load.image("cage-floor-fleece", assetPath("assets/backgrounds/cage_floor_fleece.png"));
    this.load.image("pig-cream-brown", assetPath("assets/sprites/pigs/pig_cream_brown_idle.png"));
    this.load.image("pig-white-black", assetPath("assets/sprites/pigs/pig_white_black_idle.png"));
    this.load.image("pig-russet", assetPath("assets/sprites/pigs/pig_russet_idle.png"));
    this.load.image("pig-gray-white", assetPath("assets/sprites/pigs/pig_gray_white_idle.png"));
    this.load.image("pig-tricolor", assetPath("assets/sprites/pigs/pig_tricolor_idle.png"));
    this.load.image("bean-normal", assetPath("assets/sprites/beans/bean_normal.png"));
    this.load.image("bean-aged", assetPath("assets/sprites/beans/bean_aged.png"));
    this.load.image("bean-golden", assetPath("assets/sprites/beans/bean_golden.png"));
    this.load.image("bean-rainbow", assetPath("assets/sprites/beans/bean_rainbow.png"));
    this.load.image("bean-compost", assetPath("assets/sprites/beans/bean_compost.png"));
    this.load.image("hay-rack-full", assetPath("assets/sprites/decor/hay_rack_full.png"));
    this.load.image("water-bottle-full", assetPath("assets/sprites/decor/water_bottle_full.png"));
    this.load.image("hidey-house", assetPath("assets/sprites/decor/hidey_house.png"));
    this.load.image("litter-tray-clean", assetPath("assets/sprites/decor/litter_tray_clean.png"));
    this.load.image("toy-pile", assetPath("assets/sprites/decor/toy_pile.png"));
    this.load.image("toy-tunnel-blue", assetPath("assets/sprites/decor/toy_tunnel_blue.png"));
    this.load.image("snuggle-sack", assetPath("assets/sprites/decor/snuggle_sack.png"));
    this.load.image("royal-throne", assetPath("assets/sprites/decor/royal_throne.png"));
    this.load.image("roaming-dustpan", assetPath("assets/sprites/upgrades/roaming_dustpan.png"));
    this.load.image("compost-bin", assetPath("assets/sprites/upgrades/compost_bin.png"));
    this.load.image("cavybot-3000", assetPath("assets/sprites/upgrades/cavybot_3000.png"));
    this.load.image("scooper-cursor", assetPath("assets/ui/scooper_cursor.png"));
    this.load.image("golden-scooper-cursor", assetPath("assets/ui/golden_scooper_cursor.png"));
  }

  create(): void {
    this.prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.cameras.main.setBackgroundColor("#d8c6a6");
    this.drawCage();
    this.hayPile = this.createHayPile(88, 88);
    this.waterBottle = this.createWaterBottle(this.state.cage.width - 90, 82);
    this.input.setDefaultCursor("none");
    this.scoopRadiusPreview = this.add
      .ellipse(0, 0, getScoopRadius(this.state) * 2, getScoopRadius(this.state) * 2)
      .setDepth(SCOOP_RADIUS_PREVIEW_DEPTH)
      .setVisible(false);
    this.scoopCursor = this.add
      .image(0, 0, this.getScoopCursorTextureKey())
      .setOrigin(SCOOPER_CURSOR_ORIGIN_X, SCOOPER_CURSOR_ORIGIN_Y)
      .setDepth(50)
      .setAlpha(0.94)
      .setVisible(false);
    this.syncScoopCursorSize();

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.scoopRadiusPreview.setPosition(pointer.worldX, pointer.worldY);
      this.scoopRadiusPreview.setVisible(true);
      this.scoopCursor.setPosition(pointer.worldX, pointer.worldY);
      this.scoopCursor.setVisible(true);
      this.handleGoldenScoopPointerMove(pointer.worldX, pointer.worldY);
    });

    this.input.on("pointerout", () => {
      this.scoopRadiusPreview.setVisible(false);
      this.scoopCursor.setVisible(false);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const isFirstCleanAttempt = this.state.stats.cleanedPoops === 0;
      magnetizePoopsTowardScoop(this.state, pointer.worldX, pointer.worldY);
      const cleanResult = cleanAtWithResult(this.state, pointer.worldX, pointer.worldY);
      const isFirstClean = isFirstCleanAttempt && cleanResult.cleaned > 0;
      this.playCleanFeedback(cleanResult, pointer.worldX, pointer.worldY, isFirstClean);
      if (cleanResult.cleaned === 0) {
        this.reactToEmptyClick(pointer.worldX, pointer.worldY);
      }
      this.lastCleanedPoops = this.state.stats.cleanedPoops;
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
    this.lastCleanedPoops = this.state.stats.cleanedPoops;
  }

  update(_: number, delta: number): void {
    const cleanedBefore = this.state.stats.cleanedPoops;
    updateSimulation(this.state, delta / 1000);
    this.syncViews();
    this.playAutomaticCleanupFeedback(cleanedBefore);
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
    this.cageBacking = this.add.graphics().setDepth(0);

    this.cageFloor = this.add
      .tileSprite(width / 2, height / 2, width - 28, height - 28, "cage-floor-fleece")
      .setDepth(1)
      .setAlpha(0.92);
    this.cageDetails = this.add.graphics().setDepth(2.2);

    this.cleanlinessWash = this.add
      .rectangle(width / 2, height / 2, width - 28, height - 28, 0x6b503a, 0)
      .setDepth(3);
    this.dirtPatches = this.add.graphics().setDepth(3.1);
    this.cageRim = this.add.graphics().setDepth(6);
    this.redrawCage();
  }

  private redrawCage(): void {
    const { width, height } = this.state.cage;

    this.cageBacking.clear();
    this.cageBacking.fillStyle(0x6f5135, 0.22);
    this.cageBacking.fillRoundedRect(9, 13, width - 8, height - 8, 24);
    this.cageBacking.fillStyle(0xcdb58d, 1);
    this.cageBacking.fillRoundedRect(0, 0, width, height, 22);
    this.cageBacking.lineStyle(3, 0xffebbf, 0.18);
    this.cageBacking.strokeRoundedRect(3, 3, width - 12, height - 14, 20);

    this.cageFloor
      .setPosition(width / 2, height / 2)
      .setSize(width - 28, height - 28)
      .setDisplaySize(width - 28, height - 28);
    this.drawAmbientCageDetails(width, height);

    this.cleanlinessWash
      .setPosition(width / 2, height / 2)
      .setSize(width - 28, height - 28)
      .setDisplaySize(width - 28, height - 28);

    this.cageRim.clear();
    this.cageRim.lineStyle(18, 0x5a402b, 0.2);
    this.cageRim.strokeRoundedRect(10, 12, width - 18, height - 18, 22);
    this.cageRim.lineStyle(14, 0x8a6e4d, 1);
    this.cageRim.strokeRoundedRect(7, 7, width - 14, height - 14, 20);
    this.cageRim.lineStyle(4, 0xd5b27c, 0.58);
    this.cageRim.strokeRoundedRect(9, 7, width - 20, height - 20, 18);
    this.cageRim.lineStyle(3, 0xffedc8, 0.42);
    this.cageRim.lineBetween(30, 12, width - 34, 12);
    this.cageRim.lineBetween(12, 30, 12, height - 34);
    this.cageRim.lineStyle(3, 0x4f3828, 0.26);
    this.cageRim.lineBetween(34, height - 12, width - 30, height - 12);
    this.cageRim.lineBetween(width - 12, 34, width - 12, height - 30);
    this.lastCageWidth = width;
    this.lastCageHeight = height;
  }

  private drawAmbientCageDetails(width: number, height: number): void {
    const details = this.cageDetails;
    details.clear();

    this.drawBeddingDepth(details, width, height);

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
    details.lineStyle(1, 0x8b7655, 0.1);
    details.strokeRoundedRect(31, 31, width - 62, height - 62, 14);
    details.lineStyle(2, 0x6e543b, 0.28);
    for (const mark of RIM_CHEW_MARKS) {
      const x = width * mark.x;
      const y = mark.y > 0 ? mark.y : height + mark.y;
      details.lineBetween(x - mark.width / 2, y, x + mark.width / 2, y);
      details.lineBetween(x - mark.width / 4, y + (mark.y > 0 ? 3 : -3), x + mark.width / 4, y);
    }
  }

  private drawBeddingDepth(details: Phaser.GameObjects.Graphics, width: number, height: number): void {
    const floorX = 14;
    const floorY = 14;
    const floorWidth = width - 28;
    const floorHeight = height - 28;

    details.lineStyle(5, 0x7e6649, 0.13);
    details.strokeRoundedRect(floorX + 2, floorY + 3, floorWidth - 4, floorHeight - 5, 18);
    details.lineStyle(3, 0xfff5d7, 0.14);
    details.lineBetween(floorX + 22, floorY + 10, width - 38, floorY + 10);
    details.lineBetween(floorX + 10, floorY + 24, floorX + 10, height - 42);
    details.fillStyle(0x5f4631, 0.055);
    details.fillRect(floorX + 4, height - 46, floorWidth - 8, 26);
    details.fillRect(width - 46, floorY + 4, 24, floorHeight - 8);
    details.fillStyle(0xfff4d5, 0.035);
    details.fillRect(floorX + 22, floorY + 6, floorWidth - 44, 20);
    details.fillRect(floorX + 6, floorY + 24, 20, floorHeight - 48);
  }

  private syncViews(): void {
    this.syncCageSize();
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
      const activePlay = pig.goal === "playWithPig" || pig.goal === "playWithFurniture";
      view.setRotation(
        pig.goal === "sleep"
          ? Math.sin(this.time.now / 480 + pig.id) * 0.015
          : activePlay
            ? Math.sin(this.time.now / 110 + pig.id) * 0.065
            : Math.sin(this.time.now / 220 + pig.id) * 0.035,
      );
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
    this.syncPigRequestFeedback();

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
      shadow.setPosition(poop.x, poop.y + POOP_SHADOW_Y);
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

    this.syncScoopCursorSize();
    this.syncCareObjectStates();
  }

  private syncScoopCursorSize(): void {
    this.scoopCursor.setTexture(this.getScoopCursorTextureKey());
    this.scoopRadiusPreview.setSize(getScoopRadius(this.state) * 2, getScoopRadius(this.state) * 2);
    this.scoopRadiusPreview
      .setStrokeStyle(2, this.state.lateGame.goldenScoop ? 0xf0d56b : 0xffffff, this.state.lateGame.goldenScoop ? 0.86 : 0.72)
      .setFillStyle(this.state.lateGame.goldenScoop ? 0xf0d56b : 0xffffff, this.state.lateGame.goldenScoop ? 0.1 : 0.07);
    const displayWidth = Phaser.Math.Clamp(getScoopRadius(this.state) * 1.9, SCOOPER_CURSOR_MIN_WIDTH, SCOOPER_CURSOR_MAX_WIDTH);
    this.scoopCursor.setDisplaySize(displayWidth, displayWidth * (this.scoopCursor.height / this.scoopCursor.width));
  }

  private getScoopCursorTextureKey(): string {
    return this.state.lateGame.goldenScoop ? "golden-scooper-cursor" : "scooper-cursor";
  }

  private handleGoldenScoopPointerMove(x: number, y: number): void {
    if (!this.state.lateGame.goldenScoop) return;
    if (this.time.now - this.lastGoldenScoopMagnetAt < GOLDEN_SCOOP_MAGNET_INTERVAL_MS) return;
    if (Number.isFinite(this.lastMagnetPointerX)) {
      const distance = Math.hypot(x - this.lastMagnetPointerX, y - this.lastMagnetPointerY);
      if (distance < GOLDEN_SCOOP_MIN_POINTER_DISTANCE) return;
    }

    this.lastGoldenScoopMagnetAt = this.time.now;
    this.lastMagnetPointerX = x;
    this.lastMagnetPointerY = y;
    if (magnetizePoopsTowardScoop(this.state, x, y) > 0) this.syncViews();
  }

  private syncCageSize(): void {
    if (this.state.cage.width === this.lastCageWidth && this.state.cage.height === this.lastCageHeight) return;

    this.redrawCage();
    this.repositionCareObjects();
    this.resize();
  }

  private syncPigRequestFeedback(): void {
    const active = this.state.pigRequest?.active;
    if (active && active.token !== this.seenActivePigRequestToken) {
      this.seenActivePigRequestToken = active.token;
      const pig = this.state.pigs.find((candidate) => candidate.id === active.pigId);
      if (pig) this.showPigThought(pig, active.thought, 1900);
    }

    const result = this.state.pigRequest?.lastResult;
    if (!result || result.token === this.seenPigRequestResultToken) return;
    this.seenPigRequestResultToken = result.token;

    const pig = this.state.pigs.find((candidate) => candidate.id === result.pigId);
    if (!pig) return;
    const color = result.completed ? 0xf0d56b : 0x9aa094;
    this.addFloatingText(pig.x, pig.y - 58, result.rewardText, color, result.completed ? 1 : 0.9);
    this.showPigThought(pig, result.completed ? "Done!" : "Later?", 1500);
    if (result.completed && !this.prefersReducedMotion) this.addBurst(pig.x, pig.y, color, 6);
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
    const seenIds = new Set<FurnitureId>();
    for (const placement of getUnlockedFurniturePlacements(this.state)) {
      seenIds.add(placement.furnitureId);
      let view = this.furnitureViews.get(placement.furnitureId);
      if (!view) {
        view = this.createFurnitureView(placement.furnitureId, placement.x, placement.y);
        this.furnitureViews.set(placement.furnitureId, view);
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
    if (pig.stress >= 70) sprite.setAlpha(0.68);
    else if (pig.mood === "hungry") sprite.setAlpha(0.78);
    else if (pig.mood === "thirsty") sprite.setAlpha(0.86);
    else if (pig.mood === "messy") sprite.setAlpha(0.7);
    else sprite.setAlpha(1);

    if (pig.stress >= 70) sprite.setTint(0xd8a36f);
    else if (pig.mood === "hungry") sprite.setTint(0xf0d56b);
    else if (pig.mood === "thirsty") sprite.setTint(0x9ed9e8);
    else if (pig.mood === "messy") sprite.setTint(0xd8c2a3);

    if (pig.goal === "sleep") {
      displayWidth *= 1.08;
      displayHeight *= 0.9;
      sprite.setAlpha(Math.min(sprite.alpha, 0.88));
    } else if (pig.goal === "playWithPig" || pig.goal === "playWithFurniture") {
      displayWidth *= 1.06 + Math.abs(idleWiggle) * 1.8;
      displayHeight *= 0.96 + Math.abs(idleWiggle);
    } else if (nearHay && this.state.needs.hay > 0) {
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
    return this.add.ellipse(poop.x, poop.y + POOP_SHADOW_Y, 40, 16, 0x000000, 0.13).setDepth(8);
  }

  private applyPoopShadowStyle(view: Phaser.GameObjects.Ellipse, poop: Poop): void {
    const size = poop.type === "mega" ? [52, 20] : poop.type === "messPile" ? [88, 36] : [40, 16];
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

  private playActionEffect(detail: SceneFeedbackDetail): void {
    this.syncViews();

    if (detail.category === "care") {
      this.playCareFeedback(detail);
      return;
    }

    if (detail.category === "habitat") {
      this.playHabitatFeedback(detail);
      return;
    }

    if (detail.category === "trade") {
      this.playCenterFeedback(detail.label ?? "Trade", detail.resourceText, detail.color ?? 0xe4b83b, "Trade!");
      return;
    }

    if (detail.category === "experiment") {
      this.playCenterFeedback(detail.label ?? "Experiment", detail.resourceText, detail.color ?? 0x75608f, "Wheek?");
      return;
    }

    if (detail.category === "decree") {
      this.playCouncilDecreeFeedback(detail);
      return;
    }

    if (detail.category === "event") {
      this.playEventChoiceFeedback(detail);
      return;
    }

    if (detail.category === "prestige") {
      this.playPrestigeFeedback(detail);
      return;
    }

    if (detail.category === "milestone") {
      this.playMilestoneFeedback(detail);
      return;
    }

    if (detail.category === "adoption") {
      this.playHerdWelcome(detail.label, detail.color);
      return;
    }

    if (detail.target === "hay") {
      this.playImageGlow(this.hayPile, detail.label ?? "Better Hay", detail.color ?? 0xf0d56b);
      return;
    }

    if (detail.target === "scoop") {
      this.playScoopPulse();
      return;
    }

    if (detail.target === "cage") {
      this.playCageFlash(detail.label ?? "Bigger Cage", detail.color ?? 0xf0d56b);
      return;
    }

    if (detail.target === "robot") {
      this.playRobotPulse(detail.label, detail.color);
      return;
    }

    if (detail.target === "herd") {
      this.playCenterFeedback(detail.label ?? "Unlocked", detail.resourceText, detail.color ?? 0xf0d56b, "!");
      return;
    }

    if (detail.target === "ability") {
      this.playAbilityReaction(detail.abilityId);
      return;
    }

    if (detail.category === "unlock") {
      this.playUnlockFeedback(detail);
      return;
    }

    this.playFurnitureReadyEffect(detail.furnitureId);
  }

  private playCareFeedback(detail: SceneFeedbackDetail): void {
    const isWater = detail.target === "water";
    const source = isWater ? this.waterBottle : this.hayPile;
    const label = detail.label ?? (isWater ? "Water Full" : "Hay Full");
    const color = detail.color ?? (isWater ? 0x86d9f0 : 0xd7c74b);
    this.playImageGlow(source, label, color);
    if (detail.resourceText) this.addFloatingText(source.x, source.y + 38, detail.resourceText, color, 0.94);
    this.reactPigsNear(source.x, source.y, isWater ? "Sip!" : "Hay!", 170, 3);
  }

  private playHabitatFeedback(detail: SceneFeedbackDetail): void {
    const furniturePlacement =
      detail.target === "furniture" && detail.furnitureId ? getStaticFurniturePlacement(this.state, detail.furnitureId) : null;
    const zone = !furniturePlacement && detail.zoneId ? getZoneMetrics(this.state, detail.zoneId) : null;
    const x = furniturePlacement?.x ?? zone?.x ?? this.state.cage.width / 2;
    const y = furniturePlacement?.y ?? zone?.y ?? this.state.cage.height / 2;
    const color = detail.color ?? 0x7db46a;
    this.addFloatingText(x, y - 34, detail.label ?? "Habitat Tended", color, 1, true);
    if (detail.resourceText) this.addFloatingText(x, y - 8, detail.resourceText, color, 0.92, true);
    this.reactPigsNear(x, y, "Cozy!", zone?.radius ?? 160, 3);
    if (this.prefersReducedMotion) return;
    this.addBurst(x, y, color, 7);
    const furnitureView = detail.furnitureId ? this.furnitureViews.get(detail.furnitureId) : null;
    if (furnitureView) {
      this.tweens.add({
        targets: furnitureView,
        scale: 1.08,
        duration: 130,
        yoyo: true,
        ease: "Sine.easeOut",
      });
    }
  }

  private playCenterFeedback(label: string, resourceText: string | undefined, color: number, herdThought: string): void {
    const x = this.state.cage.width / 2;
    const y = this.state.cage.height / 2;
    this.addFloatingText(x, y - 38, label, color, 1.05, true);
    if (resourceText) this.addFloatingText(x, y - 12, resourceText, color, 0.92, true);
    this.reactHerd(herdThought, 3);
    if (!this.prefersReducedMotion) this.addBurst(x, y, color, 8);
  }

  private playUnlockFeedback(detail: SceneFeedbackDetail): void {
    if (detail.target === "furniture" || detail.furnitureId) {
      this.playFurnitureReadyEffect(detail.furnitureId);
      return;
    }
    if (detail.target === "cage") {
      this.playCageFlash(detail.label ?? "Unlocked", detail.color ?? 0xf0d56b);
      if (detail.resourceText) this.addFloatingText(this.state.cage.width / 2, 84, detail.resourceText, detail.color ?? 0xf0d56b, 0.92);
      return;
    }
    this.playCenterFeedback(detail.label ?? "Unlocked", detail.resourceText, detail.color ?? 0xf0d56b, "New!");
  }

  private playCouncilDecreeFeedback(detail: SceneFeedbackDetail): void {
    const color = detail.color ?? 0xb965d2;
    this.playCageFlash(detail.label ?? "Council Decree", color);
    if (detail.resourceText) this.addFloatingText(this.state.cage.width / 2, 92, detail.resourceText, color, 0.94, true);
    this.reactHerd(getCouncilReactionText(detail.decreeId), 5);
    if (!this.prefersReducedMotion) this.addBurst(this.state.cage.width / 2, this.state.cage.height / 2, color, 12);
  }

  private playEventChoiceFeedback(detail: SceneFeedbackDetail): void {
    const color = detail.color ?? 0x7db46a;
    this.playCageRipple(color, 0.09);
    this.playCenterFeedback(detail.label ?? "Event Resolved", detail.resourceText, color, getEventReactionText(detail.eventChoiceId));
  }

  private playPrestigeFeedback(detail: SceneFeedbackDetail): void {
    const color = detail.color ?? 0xf0d56b;
    this.playCageFlash(detail.label ?? "Great Composting", color, 0.18);
    if (detail.resourceText) this.addFloatingText(this.state.cage.width / 2, this.state.cage.height / 2 - 8, detail.resourceText, color, 1, true);
    this.reactHerd("Again?", 4);
    if (!this.prefersReducedMotion) this.addBurst(this.state.cage.width / 2, this.state.cage.height / 2, color, 16);
  }

  private playMilestoneFeedback(detail: SceneFeedbackDetail): void {
    const color = detail.color ?? 0xf0d56b;
    const x = this.state.cage.width / 2;
    const y = 62;
    this.addFloatingText(x, y, detail.label ?? "Milestone", color, 1.05, true);
    if (detail.resourceText) this.addFloatingText(x, y + 26, detail.resourceText, color, 0.88, true);
    if (!this.prefersReducedMotion) this.addBurst(x, y + 16, color, detail.milestoneKind === "achievement" ? 10 : 7);
  }

  private playAutomaticCleanupFeedback(cleanedBefore: number): void {
    if (this.state.stats.cleanedPoops <= cleanedBefore || this.lastCleanedPoops >= this.state.stats.cleanedPoops) {
      this.lastCleanedPoops = this.state.stats.cleanedPoops;
      return;
    }

    this.lastCleanedPoops = this.state.stats.cleanedPoops;
    const x = this.state.robot?.x ?? this.state.cage.width / 2;
    const y = this.state.robot?.y ?? this.state.cage.height / 2;
    this.addFloatingText(x, y - 28, "Auto Clean", 0x86d9f0, 0.82);
    if (!this.prefersReducedMotion) this.addBurst(x, y, 0x86d9f0, 4);
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

    const targetScaleX = glow.scaleX * 1.24;
    const targetScaleY = glow.scaleY * 1.24;

    this.tweens.add({
      targets: glow,
      alpha: 0,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
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

  private playCageFlash(label = "Bigger Cage", color = 0xf0d56b, fillAlpha = 0.11): void {
    const { width, height } = this.state.cage;
    const flash = this.add.graphics().setDepth(7);
    flash.fillStyle(color, fillAlpha);
    flash.fillRoundedRect(0, 0, width, height, 22);
    flash.lineStyle(14, color, 0.68);
    flash.strokeRoundedRect(7, 7, width - 14, height - 14, 20);
    this.addFloatingText(width / 2, 56, label, color, 1);

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

  private playCageRipple(color: number, fillAlpha: number): void {
    const { width, height } = this.state.cage;
    const ripple = this.add.graphics().setDepth(6.5);
    ripple.fillStyle(color, fillAlpha);
    ripple.fillRoundedRect(22, 22, width - 44, height - 44, 16);

    if (this.prefersReducedMotion) {
      this.time.delayedCall(220, () => ripple.destroy());
      return;
    }

    this.tweens.add({
      targets: ripple,
      alpha: 0,
      duration: 360,
      ease: "Cubic.easeOut",
      onComplete: () => ripple.destroy(),
    });
  }

  private playRobotPulse(label = "Roomba", color = 0x86d9f0): void {
    if (this.robotView) {
      this.playImageGlow(this.robotView, label, color);
      return;
    }

    const x = this.state.robot?.x ?? this.state.cage.width / 2;
    const y = this.state.robot?.y ?? this.state.cage.height / 2;
    this.addFloatingText(x, y - 30, label, color, 1);
    if (!this.prefersReducedMotion) this.addBurst(x, y, color, 7);
  }

  private playHerdWelcome(label = "Hi!", color = 0xf0d56b): void {
    const pig = this.state.pigs.at(-1);
    if (!pig) return;

    this.addFloatingText(pig.x, pig.y - 46, label, color, 1);
    this.showPigReaction(pig, pig.legendary ? "Royal!" : "Hi!", 1200, 1200);
    if (!this.prefersReducedMotion) this.addBurst(pig.x, pig.y, color, pig.legendary ? 9 : 5);
  }

  private playFurnitureReadyEffect(furnitureId?: FurnitureId): void {
    const placement = furnitureId ? getStaticFurniturePlacement(this.state, furnitureId) : null;
    const x = placement?.x ?? this.state.cage.width / 2;
    const y = placement?.y ?? this.state.cage.height / 2;
    this.addFloatingText(x, y - 28, "Unlocked", 0x7db46a, 1);
    this.reactPigsNear(x, y, "New!", 170, 3);

    if (this.prefersReducedMotion) return;

    this.addBurst(x, y, 0xf0d56b, 8);
    const view = furnitureId ? this.furnitureViews.get(furnitureId) : this.getNearestFurnitureView(x, y);
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

  private playCleanFeedback(result: CleanResult, x: number, y: number, isFirstClean: boolean): void {
    if (result.cleaned === 0) return;

    emitPlayerAction("cleanBean");
    emitUiSound(isFirstClean || result.rare > 0 || result.golden > 0 ? "rareClean" : "clean");

    for (const [index, cleaned] of result.cleanedPoops.entries()) {
      this.playBeanPop(cleaned, isFirstClean && index === 0);
    }

    this.reactPigsNear(x, y, result.cleaned > 1 ? "Nice!" : "!");

    if (isFirstClean) {
      this.addFloatingText(x, y - 54, "Cage economy started", 0xf0d56b, 1.12, true);
      if (!this.prefersReducedMotion) this.addBurst(x, y, 0xf0d56b, FIRST_CLEAN_BURST_COUNT);
    }

    if (result.comboBonus > 0) {
      this.addFloatingText(x, y - 26, `Streak +${result.comboBonus}`, 0xffd95a, 1.06, true);
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

  private playBeanPop(cleaned: CleanedPoop, isFirstClean: boolean): void {
    const color = getPoopAccentColor(cleaned.type);
    if (this.prefersReducedMotion) {
      this.addFloatingText(cleaned.x, cleaned.y - 18, getCleanRewardText(cleaned), color, isFirstClean ? 1.08 : 1, isFirstClean);
      return;
    }

    const size = getPoopDisplaySize(cleaned.type);
    const popScale = isFirstClean ? FIRST_CLEAN_POP_SCALE : cleaned.type === "messPile" ? MESS_PILE_POP_SCALE : BEAN_POP_SCALE;
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

    this.addFloatingText(cleaned.x, cleaned.y - 18, getCleanRewardText(cleaned), color, isFirstClean ? 1.12 : 1, isFirstClean);
    this.addBurst(cleaned.x, cleaned.y, color, isFirstClean ? 9 : cleaned.type === "normal" ? 4 : 7);
  }

  private addFloatingText(x: number, y: number, text: string, color: number, scale: number, priority = false): void {
    if (!priority && this.activeFloatingTextCount >= MAX_FLOATING_TEXT_LABELS) return;
    this.activeFloatingTextCount += 1;
    const clearLabel = (label: Phaser.GameObjects.Text): void => {
      this.activeFloatingTextCount = Math.max(0, this.activeFloatingTextCount - 1);
      label.destroy();
    };
    const point = this.clampFeedbackPoint(x, y);
    const label = this.add
      .text(point.x, point.y, text, {
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
      y: point.y - (this.prefersReducedMotion ? 8 : 28),
      duration: this.prefersReducedMotion ? 280 : 620,
      ease: "Cubic.easeOut",
      onComplete: () => clearLabel(label),
    });
  }

  private clampFeedbackPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: Phaser.Math.Clamp(x, FLOATING_TEXT_MARGIN, this.state.cage.width - FLOATING_TEXT_MARGIN),
      y: Phaser.Math.Clamp(y, FLOATING_TEXT_MARGIN, this.state.cage.height - FLOATING_TEXT_MARGIN),
    };
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

  private repositionCareObjects(): void {
    this.hayPile.setPosition(88, 88);
    this.hayShadow.setPosition(88, 116);
    this.waterBottle.setPosition(this.state.cage.width - 90, 82);
    this.waterShadow.setPosition(this.state.cage.width - 90, 109);
  }

  private syncCareObjectStates(): void {
    this.repositionCareObjects();
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
    if (id === "hideyHouse") {
      return [this.add.image(0, -6, "hidey-house").setDisplaySize(108, 91)];
    }
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
      return [this.add.image(0, -8, "toy-tunnel-blue").setDisplaySize(112, 92)];
    }
    if (id === "royalThrone") {
      return [this.add.image(0, -22, "royal-throne").setDisplaySize(118, 142)];
    }
    if (id === "snuggleSack") {
      return [this.add.image(0, -16, "snuggle-sack").setDisplaySize(112, 112)];
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
  if (type === "mega") return { width: 50, height: 42 };
  if (type === "messPile") return { width: 80, height: 64 };
  return { width: 36, height: 30 };
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
  if (id === "hideyHouse") return { width: 92, height: 28, y: 32 };
  if (id === "litterTray") return { width: 86, height: 24, y: 28 };
  if (id === "chewToy") return { width: 64, height: 20, y: 24 };
  if (id === "cardboardCastle") return { width: 68, height: 22, y: 28 };
  if (id === "tunnel") return { width: 96, height: 26, y: 30 };
  if (id === "royalThrone") return { width: 94, height: 28, y: 42 };
  if (id === "snuggleSack") return { width: 74, height: 22, y: 18 };
  return { width: 74, height: 22, y: 26 };
}
