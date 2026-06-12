export function collectConsoleErrors(page) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  return consoleErrors;
}

export function assertNoConsoleErrors(consoleErrors) {
  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }
}

export async function expectGuineaPigBeansPage(page) {
  const title = await page.title();
  if (title !== "Guinea Pig Beans") {
    throw new Error(`Expected title "Guinea Pig Beans", got "${title}"`);
  }
  await page.locator("canvas").waitFor({ state: "visible", timeout: 10000 });
  await page.locator("#open-care").waitFor({ state: "visible", timeout: 10000 });
}

export async function openSection(page, section) {
  await page.locator(`#open-${section}`).click();
  await page.locator(`[data-section-panel="${section}"]`).waitFor({ state: "visible", timeout: 10000 });
}

export async function assertVisible(page, selector, label = selector) {
  if (!(await page.locator(selector).first().isVisible().catch(() => false))) {
    throw new Error(`Expected visible ${label}.`);
  }
}

export async function seedDeterministicBean(page) {
  const devToggle = page.locator("#dev-tools .dev-tools-toggle");
  if (!(await devToggle.isVisible().catch(() => false))) return;
  await devToggle.click();
  const seedSmokeBean = page.getByRole("button", { name: "Seed Smoke Bean" });
  if (await seedSmokeBean.isVisible().catch(() => false)) {
    await seedSmokeBean.click();
    await devToggle.click();
    return;
  }
  const spawnNormal = page.getByRole("button", { name: "Spawn Normal" });
  if (await spawnNormal.isVisible().catch(() => false)) {
    for (let index = 0; index < 4; index += 1) {
      await spawnNormal.click();
    }
  }
  await devToggle.click();
}

export async function cleanOneBean(page) {
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

export async function ensureSaveIndicator(page) {
  const saveText = ((await page.locator("#save-status").textContent()) ?? "").trim();
  if (!saveText || saveText === "Save unavailable") {
    throw new Error(`Unexpected save status: "${saveText}"`);
  }
}
