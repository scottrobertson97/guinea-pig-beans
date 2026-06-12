import { defineConfig } from "vite";
import { constantsEditorPlugin } from "./scripts/constants-editor-plugin.mjs";

export default defineConfig(({ command }) => ({
  base: "./",
  plugins: command === "serve" ? [constantsEditorPlugin()] : [],
}));
