import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const targetUrl = process.env.GPB_POLISH_URL ?? "http://127.0.0.1:5176";
const outputDir = process.env.GPB_POLISH_OUT ?? "tmp";
const desktopScreenshot = path.join(outputDir, "polish-smoke-desktop.png");
const mobileScreenshot = path.join(outputDir, "polish-smoke-mobile.png");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

try {
  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await expectTitle(page);
  await page.locator("canvas").waitFor({ state: "visible", timeout: 10000 });

  await seedDeterministicBean(page);
  await cleanOneBean(page);
  await page.locator("#quick-refill-hay").click();
  await page.locator("#quick-refill-water").click();
  await page.locator("#open-furniture").click();
  await page.locator("#ecology-zone-list .zone-tend-button").first().waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: desktopScreenshot, fullPage: true });
  await page.locator("#close-section-modal").click();
  await page.waitForTimeout(1100);
  await ensureSaveIndicator(page);

  await page.setViewportSize({ width: 390, height: 760 });
  await page.locator("#open-shop").click();
  await page.screenshot({ path: mobileScreenshot, fullPage: true });

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }

  console.log(`Polish smoke passed: ${targetUrl}`);
  console.log(`Screenshots: ${desktopScreenshot}, ${mobileScreenshot}`);
} finally {
  await browser.close();
}

async function expectTitle(page) {
  const title = await page.title();
  if (title !== "Guinea Pig Beans") {
    throw new Error(`Expected title "Guinea Pig Beans", got "${title}"`);
  }
}

async function seedDeterministicBean(page) {
  const devToggle = page.locator("#dev-tools .dev-tools-toggle");
  if (!(await devToggle.isVisible().catch(() => false))) return;
  await devToggle.click();
  const spawnNormal = page.getByRole("button", { name: "Spawn Normal" });
  if (await spawnNormal.isVisible().catch(() => false)) {
    for (let index = 0; index < 4; index += 1) {
      await spawnNormal.click();
    }
  }
  await devToggle.click();
}

async function cleanOneBean(page) {
  const before = Number((await page.locator("#beans").textContent()) ?? 0);
  const canvasBox = await page.locator("canvas").boundingBox();
  if (!canvasBox) throw new Error("Canvas bounding box was unavailable.");

  for (const yStep of [0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88]) {
    for (const xStep of [0.1, 0.18, 0.26, 0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9]) {
      await page.mouse.click(canvasBox.x + canvasBox.width * xStep, canvasBox.y + canvasBox.height * yStep);
      await page.waitForTimeout(60);
      const current = Number((await page.locator("#beans").textContent()) ?? 0);
      if (current > before) return;
    }
  }

  throw new Error("Smoke could not clean a bean.");
}

async function ensureSaveIndicator(page) {
  const saveText = ((await page.locator("#save-status").textContent()) ?? "").trim();
  if (!saveText || saveText === "Save unavailable") {
    throw new Error(`Unexpected save status: "${saveText}"`);
  }
}
