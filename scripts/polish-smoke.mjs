import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  assertNoConsoleErrors,
  assertVisible,
  cleanOneBean,
  collectConsoleErrors,
  ensureSaveIndicator,
  expectGuineaPigBeansPage,
  openSection,
  seedDeterministicBean,
} from "./smoke-helpers.mjs";

const targetUrl = process.env.GPB_POLISH_URL ?? "http://127.0.0.1:5176";
const outputDir = process.env.GPB_POLISH_OUT ?? "tmp";
const desktopScreenshot = path.join(outputDir, "polish-smoke-desktop.png");
const mobileScreenshot = path.join(outputDir, "polish-smoke-mobile.png");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = collectConsoleErrors(page);

try {
  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await expectGuineaPigBeansPage(page);

  await seedDeterministicBean(page);
  await cleanOneBean(page);
  await assertVisible(page, "#quick-refill-hay", "quick hay refill");
  await assertVisible(page, "#quick-refill-water", "quick water refill");
  await page.locator("#quick-refill-hay").click();
  await page.locator("#quick-refill-water").click();
  await openSection(page, "furniture");
  await assertVisible(page, "#furniture-synergy-list", "furniture synergy list");
  await assertVisible(page, "#ecology-zone-list .zone-tend-button", "habitat tend button");
  await page.screenshot({ path: desktopScreenshot, fullPage: true });
  await page.locator("#close-section-modal").click();
  await page.waitForTimeout(1100);
  await ensureSaveIndicator(page);

  await page.setViewportSize({ width: 390, height: 760 });
  await openSection(page, "shop");
  await assertVisible(page, "#adopt-pig", "adopt pig button");
  await page.screenshot({ path: mobileScreenshot, fullPage: true });

  assertNoConsoleErrors(consoleErrors);

  console.log(`Polish smoke passed: ${targetUrl}`);
  console.log(`Screenshots: ${desktopScreenshot}, ${mobileScreenshot}`);
} finally {
  await browser.close();
}
