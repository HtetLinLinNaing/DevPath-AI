import { expect, test, type Page } from "@playwright/test";
import roadmap from "./fixtures/roadmap.json" with { type: "json" };

const longDescription = "Backend engineer role requiring Node.js, Docker, AWS, CI/CD, testing, observability, security, APIs, databases, and communication. ".repeat(3);

async function mockEvents(page: Page) {
  await page.route("**/api/events", (route) => route.fulfill({ status: 204 }));
}

async function gotoHydratedApp(page: Page) {
  const hydrated = page.waitForResponse((response) =>
    response.url().endsWith("/api/events") && response.request().method() === "POST"
  );
  await page.goto("/");
  await hydrated;
}

async function fillValidForm(page: Page) {
  await page.getByLabel("Target role").fill("Backend Engineer");
  await page.getByLabel("Current role or status").fill("Junior Developer");
  await page.getByLabel("Skill 1 name").fill("JavaScript");
  await page.getByLabel("Job description").fill(longDescription);
  await expect(page.getByLabel("Job description")).toHaveValue(longDescription);
}

test.beforeEach(async ({ page }) => {
  await mockEvents(page);
});

test("generates, restores, exports, prints, and clears a roadmap", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => { document.documentElement.dataset.printed = "true"; };
  });
  await page.route("**/api/generate-roadmap", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(roadmap) }));
  await gotoHydratedApp(page);
  await fillValidForm(page);
  await page.getByRole("button", { name: "Generate my roadmap" }).click();
  await expect(page.getByText("Start applying in week 6 after the focused project.")).toBeVisible();
  await expect(page.getByTestId("portfolio-project")).toHaveCount(2);

  await page.reload();
  await expect(page.getByRole("article", { name: "Backend Engineer roadmap" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  expect((await download).suggestedFilename()).toBe("devpath-roadmap.md");
  await page.getByRole("button", { name: "Print / Save PDF" }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-printed")).toBe("true");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear my data" }).click();
  await expect(page.getByLabel("Job description")).toBeFocused();
  await expect(page.getByLabel("Job description")).toHaveValue("");
});

test("shows inline validation for short descriptions and duplicate skills", async ({ page }) => {
  await gotoHydratedApp(page);
  await fillValidForm(page);
  await page.getByLabel("Job description").fill("Too short");
  await page.getByRole("button", { name: "Add skill" }).click();
  await page.getByLabel("Skill 2 name").fill(" javascript ");
  await page.getByRole("button", { name: "Generate my roadmap" }).click();
  await expect(page.getByText("Please correct the highlighted fields.")).toBeVisible();
  await expect(page.getByText("Skill names must be unique")).toBeVisible();
  await expect(page.getByLabel("Job description")).toBeFocused();
});

test("offers retry after a timeout and then renders", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/generate-roadmap", (route) => {
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 504, contentType: "application/json", body: JSON.stringify({ error: { code: "GENERATION_TIMEOUT", message: "Roadmap generation timed out. Please try again.", retryable: true, requestId: "e2e" } }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(roadmap) });
  });
  await gotoHydratedApp(page);
  await fillValidForm(page);
  await page.getByRole("button", { name: "Generate my roadmap" }).click();
  await expect(page.getByText("Roadmap generation timed out. Please try again.")).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("article", { name: "Backend Engineer roadmap" })).toBeVisible();
});

test("supports keyboard traversal and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release: (() => void) | undefined;
  await page.route("**/api/generate-roadmap", async (route) => {
    await new Promise<void>((resolve) => { release = resolve; });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(roadmap) });
  });
  await gotoHydratedApp(page);
  await page.keyboard.press("Tab");
  const visited = new Set<string>();
  for (let index = 0; index < 18; index += 1) {
    visited.add(await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute("aria-label") || (document.activeElement as HTMLElement)?.textContent?.trim() || ""));
    await page.keyboard.press("Tab");
  }
  expect([...visited].some((value) => value.includes("Add skill"))).toBe(true);
  expect([...visited].some((value) => value.includes("Generate my roadmap"))).toBe(true);

  await fillValidForm(page);
  await page.getByRole("button", { name: "Generate my roadmap" }).click();
  const spinner = page.locator('[role="status"] span').first();
  await expect(spinner).toBeVisible();
  expect(["0.01ms", "1e-05s", "0.00001s"]).toContain(await spinner.evaluate((element) => getComputedStyle(element).animationDuration));
  release?.();
});

test("contains content at 320px without page-level horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route("**/api/generate-roadmap", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(roadmap) }));
  await gotoHydratedApp(page);
  await fillValidForm(page);
  await page.getByRole("button", { name: "Generate my roadmap" }).click();
  await expect(page.getByRole("article", { name: "Backend Engineer roadmap" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.viewport).toBe(320);
  expect(dimensions.document).toBeLessThanOrEqual(320);

  const requirementTable = page.getByRole("table");
  const tableDimensions = await requirementTable.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  const tableBox = await requirementTable.boundingBox();
  expect(tableDimensions.scroll).toBeLessThanOrEqual(tableDimensions.client);
  expect(tableBox?.width).toBeLessThanOrEqual(296);

  for (const button of await page.getByLabel("Roadmap actions").getByRole("button").all()) {
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("keeps HeroUI controls contained and touch friendly", async ({ page }) => {
  await gotoHydratedApp(page);

  const themeToggle = page.getByRole("button", { name: "Switch to dark theme" });
  const addSkill = page.getByRole("button", { name: "Add skill" });
  const currentRole = page.getByLabel("Current role or status");
  const experience = page.getByRole("combobox", { name: "Years of relevant experience" });
  const currentWrapper = currentRole.locator("xpath=ancestor::*[@data-slot='input-wrapper']");
  const experienceWrapper = experience.locator("xpath=ancestor::*[@data-slot='input-wrapper']");
  const currentLabel = currentRole.locator("xpath=ancestor::*[@data-slot='base']").locator("[data-slot='label']");
  const experienceLabel = experience.locator("xpath=ancestor::*[@data-slot='base']").locator("[data-slot='label']");
  const selectorButton = page.getByRole("button", { name: "Show suggestions" });

  const [themeBox, addSkillBox, currentBox, experienceBox, currentLabelBox, experienceLabelBox, selectorBox] = await Promise.all([
    themeToggle.boundingBox(),
    addSkill.boundingBox(),
    currentWrapper.boundingBox(),
    experienceWrapper.boundingBox(),
    currentLabel.boundingBox(),
    experienceLabel.boundingBox(),
    selectorButton.boundingBox(),
  ]);

  expect(themeBox?.width).toBeGreaterThanOrEqual(44);
  expect(themeBox?.height).toBeGreaterThanOrEqual(44);
  expect(addSkillBox?.height).toBeGreaterThanOrEqual(44);
  expect(currentBox?.height).toBe(44);
  expect(experienceBox?.height).toBe(44);
  if ((page.viewportSize()?.width ?? 0) > 620) {
    expect(Math.abs((currentBox?.y ?? 0) - (experienceBox?.y ?? 0))).toBeLessThanOrEqual(1);
  } else {
    expect(Math.abs((currentBox?.x ?? 0) - (experienceBox?.x ?? 0))).toBeLessThanOrEqual(1);
  }
  expect((currentLabelBox?.y ?? 0) + (currentLabelBox?.height ?? 0)).toBeLessThanOrEqual((currentBox?.y ?? 0) + 1);
  expect((experienceLabelBox?.y ?? 0) + (experienceLabelBox?.height ?? 0)).toBeLessThanOrEqual((experienceBox?.y ?? 0) + 1);
  expect(selectorBox?.width).toBeGreaterThanOrEqual(44);
  expect(selectorBox?.height).toBeGreaterThanOrEqual(44);

  const initialPageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await experience.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await listbox.evaluate(async (element) => {
    const animations: Animation[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      animations.push(...node.getAnimations());
    }
    await Promise.allSettled(animations.map((animation) => animation.finished));
  });
  const [listboxBox, openPageHeight] = await Promise.all([
    listbox.boundingBox(),
    page.evaluate(() => document.documentElement.scrollHeight),
  ]);

  expect(listboxBox?.width).toBeGreaterThanOrEqual(160);
  expect(listboxBox?.height).toBeLessThanOrEqual(320);
  if ((page.viewportSize()?.width ?? 0) > 620) {
    expect((listboxBox?.y ?? 0)).toBeGreaterThanOrEqual((experienceBox?.y ?? 0) + (experienceBox?.height ?? 0) - 2);
  }
  expect(openPageHeight - initialPageHeight).toBeLessThan(80);
});

test("keeps native control chrome out of HeroUI internal inputs", async ({ page }) => {
  await gotoHydratedApp(page);

  const currentRole = page.getByLabel("Current role or status");
  const experience = page.getByRole("combobox", { name: "Years of relevant experience" });
  const borderWidths = await Promise.all([
    currentRole.evaluate((element) => getComputedStyle(element).borderTopWidth),
    experience.evaluate((element) => getComputedStyle(element).borderTopWidth),
  ]);

  expect(borderWidths).toEqual(["0px", "0px"]);
});

test("aligns paired native controls to one fixed height", async ({ page }) => {
  await gotoHydratedApp(page);

  const controls = [
    page.getByLabel("Weekly study time"),
    page.getByLabel("Target application date"),
    page.getByLabel("Learning budget"),
    page.getByLabel("Education (optional)"),
  ];
  const boxes = await Promise.all(controls.map((control) => control.boundingBox()));

  for (const box of boxes) expect(box?.height).toBe(44);
  if ((page.viewportSize()?.width ?? 0) > 620) {
    expect(Math.abs((boxes[0]?.y ?? 0) - (boxes[1]?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((boxes[2]?.y ?? 0) - (boxes[3]?.y ?? 0))).toBeLessThanOrEqual(1);
  } else {
    expect(Math.abs((boxes[0]?.x ?? 0) - (boxes[1]?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((boxes[2]?.x ?? 0) - (boxes[3]?.x ?? 0))).toBeLessThanOrEqual(1);
  }
});

test("renders one focus indicator per HeroUI control", async ({ page }) => {
  await gotoHydratedApp(page);

  for (const control of [
    page.getByLabel("Current role or status"),
    page.getByRole("combobox", { name: "Years of relevant experience" }),
  ]) {
    await control.focus();
    const wrapper = control.locator("xpath=ancestor::*[@data-slot='input-wrapper']");
    const [inputFocus, wrapperShadow] = await Promise.all([
      control.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.outlineStyle;
      }),
      wrapper.evaluate((element) => getComputedStyle(element).boxShadow),
    ]);

    expect(inputFocus).toBe("none");
    expect(wrapperShadow).not.toBe("none");
  }
});
