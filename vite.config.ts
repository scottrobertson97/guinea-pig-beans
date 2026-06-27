import { defineConfig } from "vite";
import { constantsEditorPlugin } from "./scripts/constants-editor-plugin.mjs";
import { techTreeLayoutPlugin } from "./scripts/tech-tree-layout-plugin.mjs";

export default defineConfig(({ command }) => ({
  base: "./",
  plugins: command === "serve" ? [constantsEditorPlugin(), techTreeLayoutPlugin()] : [],
}));
