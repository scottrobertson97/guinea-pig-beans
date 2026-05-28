import Phaser from "phaser";
import { getScoopRadius } from "../simulation/balance";
import { cleanAt } from "../simulation/actions";
import { updateSimulation } from "../simulation/systems";
import type { FurnitureId, GameState, Pig, Poop, Robot } from "../simulation/types";

interface SceneData {
  state: GameState;
  onStateChanged: () => void;
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private onStateChanged!: () => void;
  private pigViews = new Map<number, Phaser.GameObjects.Container>();
  private poopViews = new Map<number, Phaser.GameObjects.Ellipse>();
  private furnitureViews = new Map<FurnitureId, Phaser.GameObjects.Container>();
  private robotView: Phaser.GameObjects.Container | null = null;
  private hayPile!: Phaser.GameObjects.Container;
  private waterBottle!: Phaser.GameObjects.Container;
  private scoopPreview!: Phaser.GameObjects.Ellipse;

  constructor() {
    super("GameScene");
  }

  init(data: SceneData): void {
    this.state = data.state;
    this.onStateChanged = data.onStateChanged;
  }

  create(): void {
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
      cleanAt(this.state, pointer.worldX, pointer.worldY);
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
    const graphics = this.add.graphics();
    graphics.fillStyle(0xcdb58d, 1);
    graphics.fillRoundedRect(0, 0, width, height, 22);
    graphics.lineStyle(14, 0x8a6e4d, 1);
    graphics.strokeRoundedRect(7, 7, width - 14, height - 14, 20);

    graphics.lineStyle(2, 0xb69a73, 0.45);
    for (let x = 40; x < width; x += 42) {
      graphics.lineBetween(x, 12, x, height - 12);
    }
    for (let y = 42; y < height; y += 38) {
      graphics.lineBetween(12, y, width - 12, y);
    }

    graphics.fillStyle(0xc9d6a0, 0.38);
    graphics.fillRoundedRect(38, 38, 132, 86, 12);
    graphics.fillStyle(0xa8c7c9, 0.28);
    graphics.fillRoundedRect(width / 2 - 86, 28, 172, 70, 12);
    graphics.fillStyle(0x8c7658, 0.26);
    graphics.fillRoundedRect(width - 176, height - 128, 112, 72, 14);
    graphics.fillStyle(0x9c835f, 0.24);
    graphics.fillRoundedRect(46, height - 164, 150, 104, 14);
    graphics.fillStyle(0x7fa878, 0.22);
    graphics.fillRoundedRect(width / 2 - 118, height - 118, 236, 66, 14);

    graphics.fillStyle(0xbca47c, 1);
    graphics.fillRoundedRect(width - 176, height - 128, 112, 72, 14);
    graphics.fillStyle(0x7a5736, 1);
    graphics.fillRoundedRect(width - 154, height - 108, 68, 42, 10);
    graphics.fillStyle(0x3d2c20, 1);
    graphics.fillRoundedRect(width - 132, height - 92, 24, 26, 8);
  }

  private syncViews(): void {
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

  private syncFurnitureViews(): void {
    const furnitureIds = Object.keys(this.state.furniture) as FurnitureId[];
    for (const id of furnitureIds) {
      const count = this.state.furniture[id];
      let view = this.furnitureViews.get(id);
      if (count > 0 && !view) {
        view = this.createFurnitureView(id);
        this.furnitureViews.set(id, view);
      }
      if (view) view.setVisible(count > 0);
    }
  }

  private createPigView(pig: Pig): Phaser.GameObjects.Container {
    const body = this.add.ellipse(0, 0, 58, 34, pig.bodyTint).setStrokeStyle(2, 0x6a4b34, 0.42);
    const spot = this.add.ellipse(-12, -2, 22, 20, pig.spotTint, 0.92);
    const earA = this.add.ellipse(-20, -16, 13, 11, pig.bodyTint);
    const earB = this.add.ellipse(18, -14, 12, 10, pig.bodyTint);
    const nose = this.add.ellipse(27, 2, 8, 7, 0x6d4225);
    const eye = this.add.circle(15, -8, 2.5, 0x17120e);
    const shadow = this.add.ellipse(0, 13, 52, 12, 0x000000, 0.14);
    const view = this.add.container(pig.x, pig.y, [shadow, earA, earB, body, spot, nose, eye]);
    view.setDepth(20);
    return view;
  }

  private applyPigMood(view: Phaser.GameObjects.Container, pig: Pig): void {
    const body = view.list[3] as Phaser.GameObjects.Ellipse;
    const spot = view.list[4] as Phaser.GameObjects.Ellipse;
    body.setFillStyle(pig.bodyTint);
    spot.setFillStyle(pig.spotTint);
    if (pig.mood === "hungry") body.setAlpha(0.78);
    else if (pig.mood === "thirsty") body.setAlpha(0.86);
    else if (pig.mood === "messy") body.setAlpha(0.7);
    else body.setAlpha(1);
  }

  private createPoopView(poop: Poop): Phaser.GameObjects.Ellipse {
    const view = this.add
      .ellipse(poop.x, poop.y, 14, 9, 0x47301d)
      .setStrokeStyle(1, 0x2a1c12, 0.45)
      .setDepth(10);
    view.setRotation(Math.random() * Math.PI);
    return view;
  }

  private applyPoopStyle(view: Phaser.GameObjects.Ellipse, poop: Poop): void {
    if (poop.type === "golden") {
      view.setSize(17, 11);
      view.setFillStyle(0xe4b83b, 1);
      view.setStrokeStyle(2, 0xffef9a, 0.8);
      return;
    }

    if (poop.type === "compost") {
      view.setSize(16, 10);
      view.setFillStyle(0x6f5b2f, 1);
      view.setStrokeStyle(2, 0xa58c4c, 0.7);
      return;
    }

    if (poop.type === "stinky") {
      view.setSize(16, 10);
      view.setFillStyle(0x395f2a, 1);
      view.setStrokeStyle(2, 0x223819, 0.62);
      return;
    }

    if (poop.type === "blessed") {
      view.setSize(16, 10);
      view.setFillStyle(0xf1e7a2, 1);
      view.setStrokeStyle(2, 0xffffff, 0.85);
      return;
    }

    if (poop.type === "mega") {
      view.setSize(24, 15);
      view.setFillStyle(0x5b351d, 1);
      view.setStrokeStyle(2, 0x2a1c12, 0.65);
      return;
    }

    if (poop.type === "mystery") {
      view.setSize(17, 11);
      view.setFillStyle(0x7c65a9, 1);
      view.setStrokeStyle(2, 0xe4d7ff, 0.75);
      return;
    }

    if (poop.type === "hay") {
      view.setSize(16, 10);
      view.setFillStyle(0xc9b94e, 1);
      view.setStrokeStyle(2, 0xefe28a, 0.72);
      return;
    }

    if (poop.type === "royal") {
      view.setSize(18, 12);
      view.setFillStyle(0x9b5ab6, 1);
      view.setStrokeStyle(2, 0xe4b83b, 0.9);
      return;
    }

    if (poop.type === "cursed") {
      view.setSize(19, 12);
      view.setFillStyle(0x22202b, 1);
      view.setStrokeStyle(2, 0x87cfe0, 0.78);
      return;
    }

    view.setSize(14, 9);
    view.setFillStyle(poop.value > poop.baseValue ? 0x6e4827 : 0x47301d, 1);
    view.setStrokeStyle(1, 0x2a1c12, 0.45);
  }

  private createRobotView(robot: Robot): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 13, 38, 12, 0x000000, 0.16);
    const body = this.add.graphics();
    body.fillStyle(0xb8c0c6, 1);
    body.fillRoundedRect(-19, -14, 38, 28, 8);
    body.lineStyle(3, 0x54616a, 0.78);
    body.strokeRoundedRect(-19, -14, 38, 28, 8);
    const face = this.add.rectangle(8, -1, 14, 10, 0x2e3a42).setStrokeStyle(1, 0x172027, 0.7);
    const eyeA = this.add.circle(4, -2, 1.7, 0x92e6ff);
    const eyeB = this.add.circle(12, -2, 1.7, 0x92e6ff);
    const brush = this.add.rectangle(-15, 10, 18, 5, 0x7a5736).setRotation(-0.24);
    const antenna = this.add.rectangle(-10, -18, 3, 14, 0x54616a).setRotation(-0.32);
    const light = this.add.circle(-15, -24, 4, 0xe4b83b);
    const view = this.add.container(robot.x, robot.y, [
      shadow,
      antenna,
      light,
      body,
      face,
      eyeA,
      eyeB,
      brush,
    ]);
    view.setDepth(15);
    return view;
  }

  private syncRobotView(view: Phaser.GameObjects.Container, robot: Robot): void {
    const dx = robot.targetX - robot.x;
    view.setPosition(robot.x, robot.y);
    view.setScale(dx < 0 ? -1 : 1, 1);
    view.setRotation(robot.state === "sweeping" ? Math.sin(this.time.now / 85) * 0.05 : 0);
  }

  private createHayPile(x: number, y: number): Phaser.GameObjects.Container {
    const base = this.add.rectangle(0, 0, 72, 40, 0x7a5736).setStrokeStyle(2, 0x5d4129, 0.55);
    const strands = this.add.graphics();
    strands.lineStyle(4, 0xd7c652, 1);
    for (let i = 0; i < 14; i += 1) {
      strands.lineBetween(-28 + i * 4, 10, -18 + i * 5, -12 - (i % 3) * 3);
    }
    return this.add.container(x, y, [base, strands]).setDepth(4);
  }

  private createWaterBottle(x: number, y: number): Phaser.GameObjects.Container {
    const bottle = this.add
      .rectangle(0, 0, 30, 70, 0x87cfe0, 0.88)
      .setStrokeStyle(3, 0x3b7b8b, 0.8);
    const cap = this.add.rectangle(0, -42, 34, 12, 0xd55c4a);
    const spout = this.add.rectangle(-18, 42, 30, 5, 0xaeb5b3).setRotation(0.46);
    return this.add.container(x, y, [bottle, cap, spout]).setDepth(4);
  }

  private createFurnitureView(id: FurnitureId): Phaser.GameObjects.Container {
    const positions: Record<FurnitureId, [number, number]> = {
      hideyHouse: [116, this.state.cage.height - 108],
      tunnel: [this.state.cage.width / 2, 70],
      litterTray: [this.state.cage.width - 120, this.state.cage.height - 92],
      chewToy: [this.state.cage.width / 2 + 120, this.state.cage.height - 86],
      snuggleSack: [182, this.state.cage.height - 76],
      cardboardCastle: [this.state.cage.width / 2 - 110, this.state.cage.height - 86],
      royalThrone: [this.state.cage.width - 96, 172],
    };
    const [x, y] = positions[id];
    const parts = this.createFurnitureParts(id);
    return this.add.container(x, y, parts).setDepth(5);
  }

  private createFurnitureParts(id: FurnitureId): Phaser.GameObjects.GameObject[] {
    if (id === "tunnel") {
      return [
        this.add.ellipse(0, 0, 96, 36, 0x7a5736).setStrokeStyle(3, 0x51351f, 0.72),
        this.add.ellipse(0, 6, 68, 22, 0x3d2c20),
      ];
    }
    if (id === "litterTray") {
      return [
        this.add.rectangle(0, 0, 82, 48, 0x6d7f84).setStrokeStyle(3, 0x33484e, 0.72),
        this.add.rectangle(0, 6, 66, 28, 0xbfae91, 0.9),
      ];
    }
    if (id === "royalThrone") {
      return [
        this.add.rectangle(0, 10, 52, 38, 0x7c65a9).setStrokeStyle(3, 0x4e376b, 0.8),
        this.add.rectangle(0, -18, 44, 44, 0x9b5ab6),
        this.add.circle(0, -40, 8, 0xe4b83b),
      ];
    }
    if (id === "chewToy") {
      return [
        this.add.circle(-10, 0, 13, 0xd55c4a).setStrokeStyle(2, 0x8e352d, 0.7),
        this.add.circle(12, 0, 13, 0xdfc84f).setStrokeStyle(2, 0x998326, 0.7),
      ];
    }
    if (id === "snuggleSack") {
      return [
        this.add.ellipse(0, 0, 78, 42, 0xd6d1c4).setStrokeStyle(3, 0x8f8a80, 0.7),
        this.add.ellipse(0, 4, 48, 20, 0x6a5f54),
      ];
    }
    if (id === "cardboardCastle") {
      return [
        this.add.rectangle(0, 8, 72, 54, 0xa66a3f).setStrokeStyle(3, 0x6d4225, 0.72),
        this.add.rectangle(-22, -24, 18, 22, 0xa66a3f),
        this.add.rectangle(22, -24, 18, 22, 0xa66a3f),
      ];
    }
    return [
      this.add.rectangle(0, 12, 76, 48, 0x8a6e4d).setStrokeStyle(3, 0x5d4129, 0.7),
      this.add.ellipse(0, 28, 38, 24, 0x3d2c20),
    ];
  }
}
