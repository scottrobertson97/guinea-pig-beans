import Phaser from "phaser";
import { getScoopRadius } from "../simulation/balance";
import { cleanAt } from "../simulation/actions";
import { updateSimulation } from "../simulation/systems";
import type { GameState, Pig, Poop } from "../simulation/types";

interface SceneData {
  state: GameState;
  onStateChanged: () => void;
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private onStateChanged!: () => void;
  private pigViews = new Map<number, Phaser.GameObjects.Container>();
  private poopViews = new Map<number, Phaser.GameObjects.Ellipse>();
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

    this.scoopPreview.setSize(getScoopRadius(this.state) * 2, getScoopRadius(this.state) * 2);
    this.hayPile.setAlpha(this.state.needs.hay <= 0 ? 0.25 : this.state.needs.hay < 25 ? 0.55 : 1);
    this.waterBottle.setAlpha(
      this.state.needs.water <= 0 ? 0.3 : this.state.needs.water < 25 ? 0.6 : 1,
    );
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

    if (poop.type === "stinky") {
      view.setSize(16, 10);
      view.setFillStyle(0x395f2a, 1);
      view.setStrokeStyle(2, 0x223819, 0.62);
      return;
    }

    view.setSize(14, 9);
    view.setFillStyle(poop.value > poop.baseValue ? 0x6e4827 : 0x47301d, 1);
    view.setStrokeStyle(1, 0x2a1c12, 0.45);
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
}
