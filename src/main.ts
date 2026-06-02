import Phaser from "phaser";
import "./styles.css";
import { GameScene } from "./scenes/GameScene";
import { loadGameState, requestSave, resetSavedGame } from "./simulation/persistence";
import { AudioManager, clearAudioPersistence } from "./ui/audioManager";
import { DevTools } from "./ui/devTools";
import { Hud } from "./ui/hud";
import { clearTutorialPersistence, TutorialController } from "./ui/tutorialController";

const { state } = loadGameState();
let hud: Hud;
new AudioManager();
new TutorialController();

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
  requestSave(state);
  hud.render();
}, () => {
  resetSavedGame();
  clearTutorialPersistence();
  clearAudioPersistence();
  window.location.reload();
});
hud.render();

if (import.meta.env.DEV) {
  new DevTools(state, () => {
    requestSave(state);
    hud.render();
  });
}

game.scene.start("GameScene", {
  state,
  onStateChanged: () => {
    requestSave(state);
    hud.render();
  },
});
