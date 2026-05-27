import Phaser from "phaser";
import "./styles.css";
import { GameScene } from "./scenes/GameScene";
import { createInitialState } from "./simulation/state";
import { Hud } from "./ui/hud";

const state = createInitialState();
let hud: Hud;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-canvas",
  backgroundColor: "#d8c6a6",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: 720,
    height: 520,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [GameScene],
});

hud = new Hud(state, () => {
  hud.render();
});
hud.render();

game.scene.start("GameScene", {
  state,
  onStateChanged: () => hud.render(),
});
