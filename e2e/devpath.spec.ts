import { expect, test, type Page } from "@playwright/test";
import roadmap from "./fixtures/roadmap.json" with { type: "json" };

const longDescription = "Backend engineer role requiring Node.js, Docker, AWS, CI/CD, testing, observability, security, APIs, databases, and communication. ".repeat(3);

async function mockEvents(page: Page) {
  await page.route("**/api/events", (route) => route.fulfill({ status: 204 }));
}

async function fillValidForm(page: Page) {
  await page.getByLabel("Target role").fill("Backend Engineer");
  await page.getByLabel("Current role or status").fill("Junior Developer");
  await page.getByLabel("Skill 1 name").fill("JavaScript");
  await page.getByLabel(/I consent to sending/).check();
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
  await page.goto("/");
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
  await page.goto("/");
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
  await page.goto("/");
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
  await page.goto("/");
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
  await page.goto("/");
  await fillValidForm(page);
  await page.getByRole("button", { name: "Generate my roadmap" }).click();
  await expect(page.getByRole("article", { name: "Backend Engineer roadmap" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.viewport).toBe(320);
  expect(dimensions.document).toBeLessThanOrEqual(320);
});
