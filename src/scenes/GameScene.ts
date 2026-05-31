import Phaser from "phaser";
import { getScoopRadius } from "../simulation/balance";
import { cleanAtWithResult, type CleanedPoop, type CleanResult } from "../simulation/actions";
import { placeFurniture } from "../simulation/state";
import { updateSimulation } from "../simulation/systems";
import type { FurnitureId, GameState, Pig, Poop, PoopType, Robot } from "../simulation/types";

interface SceneData {
  state: GameState;
  onStateChanged: () => void;
}

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

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private onStateChanged!: () => void;
  private pigViews = new Map<number, Phaser.GameObjects.Container>();
  private poopViews = new Map<number, Phaser.GameObjects.Image>();
  private furnitureViews = new Map<number, Phaser.GameObjects.Container>();
  private robotView: Phaser.GameObjects.Image | null = null;
  private cageFloor!: Phaser.GameObjects.TileSprite;
  private cleanlinessWash!: Phaser.GameObjects.Rectangle;
  private dirtPatches!: Phaser.GameObjects.Graphics;
  private hayPile!: Phaser.GameObjects.Image;
  private waterBottle!: Phaser.GameObjects.Image;
  private scoopPreview!: Phaser.GameObjects.Ellipse;
  private prefersReducedMotion = false;

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
        return;
      }

      const cleanResult = cleanAtWithResult(this.state, pointer.worldX, pointer.worldY);
      this.playCleanFeedback(cleanResult, pointer.worldX, pointer.worldY);
      this.onStateChanged();
      this.syncViews();
    });

    this.scale.on("resize", this.resize, this);
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

    this.cleanlinessWash = this.add
      .rectangle(width / 2, height / 2, width - 28, height - 28, 0x6b503a, 0)
      .setDepth(3);
    this.dirtPatches = this.add.graphics().setDepth(3.1);

    const graphics = this.add.graphics();
    graphics.setDepth(6);
    graphics.lineStyle(14, 0x8a6e4d, 1);
    graphics.strokeRoundedRect(7, 7, width - 14, height - 14, 20);
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
    }

    for (const [id, view] of this.pigViews) {
      if (!seenPigIds.has(id)) {
        view.destroy();
        this.pigViews.delete(id);
      }
    }

    const seenPoopIds = new Set<number>();
    for (const poop of this.state.poops) {
      seenPoopIds.add(poop.id);
      let view = this.poopViews.get(poop.id);
      if (!view) {
        view = this.createPoopView(poop);
        this.poopViews.set(poop.id, view);
      }
      view.setPosition(poop.x, poop.y);
      this.applyPoopStyle(view, poop);
    }

    for (const [id, view] of this.poopViews) {
      if (!seenPoopIds.has(id)) {
        view.destroy();
        this.poopViews.delete(id);
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
    this.hayPile.setAlpha(this.state.needs.hay <= 0 ? 0.25 : this.state.needs.hay < 25 ? 0.55 : 1);
    this.waterBottle.setAlpha(
      this.state.needs.water <= 0 ? 0.3 : this.state.needs.water < 25 ? 0.6 : 1,
    );
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
    const shadow = this.add.ellipse(0, 13, 52, 12, 0x000000, 0.14);
    const sprite = this.add.image(0, -2, this.getPigTextureKey(pig)).setDisplaySize(68, 52);
    const view = this.add.container(pig.x, pig.y, [shadow, sprite]);
    view.setDepth(20);
    return view;
  }

  private applyPigMood(view: Phaser.GameObjects.Container, pig: Pig): void {
    const sprite = view.list[1] as Phaser.GameObjects.Image;
    sprite.setTexture(this.getPigTextureKey(pig));
    if (pig.mood === "hungry") sprite.setAlpha(0.78);
    else if (pig.mood === "thirsty") sprite.setAlpha(0.86);
    else if (pig.mood === "messy") sprite.setAlpha(0.7);
    else sprite.setAlpha(1);
  }

  private createPoopView(poop: Poop): Phaser.GameObjects.Image {
    const view = this.add.image(poop.x, poop.y, this.getPoopTextureKey(poop)).setDepth(10);
    view.setRotation(Math.random() * Math.PI);
    return view;
  }

  private applyPoopStyle(view: Phaser.GameObjects.Image, poop: Poop): void {
    view.setTexture(this.getPoopTextureKey(poop));
    view.clearTint();
    view.setAlpha(1);

    const size = poop.type === "mega" ? [25, 21] : poop.type === "messPile" ? [40, 32] : [18, 15];
    view.setDisplaySize(size[0], size[1]);

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

  private playCleanFeedback(result: CleanResult, x: number, y: number): void {
    if (result.cleaned === 0) return;

    for (const cleaned of result.cleanedPoops) {
      this.playBeanPop(cleaned);
    }

    if (result.comboBonus > 0) {
      this.addFloatingText(x, y - 26, `Streak +${result.comboBonus}`, 0xffd95a, 1.06);
      if (!this.prefersReducedMotion) this.addBurst(x, y, 0xffd95a, 8);
    }
  }

  private playBeanPop(cleaned: CleanedPoop): void {
    const color = getPoopAccentColor(cleaned.type);
    if (this.prefersReducedMotion) {
      this.addFloatingText(cleaned.x, cleaned.y - 18, getCleanRewardText(cleaned), color, 1);
      return;
    }

    const sprite = this.add
      .image(cleaned.x, cleaned.y, this.getPoopFeedbackTextureKey(cleaned))
      .setDepth(65)
      .setAlpha(0.95)
      .setDisplaySize(cleaned.type === "messPile" ? 42 : 22, cleaned.type === "messPile" ? 34 : 18)
      .setRotation(Math.random() * Math.PI);

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      scale: 1.85,
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

  private createHayPile(x: number, y: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, "hay-rack-full").setDisplaySize(84, 84).setDepth(4);
  }

  private createWaterBottle(x: number, y: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, "water-bottle-full").setDisplaySize(76, 76).setDepth(4);
  }

  private createFurnitureView(id: FurnitureId, x: number, y: number): Phaser.GameObjects.Container {
    const parts = this.createFurnitureParts(id);
    return this.add.container(x, y, parts).setDepth(5);
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

function getCleanRewardText(cleaned: CleanedPoop): string {
  if (cleaned.type === "golden") return "+Gold";
  if (cleaned.type === "compost") return "+Compost";
  if (cleaned.type === "blessed") return "+Squeak";
  return `+${cleaned.value}`;
}
