import { test, expect } from "@playwright/test";

// Regression: the damped-oscillation plot must keep a fixed coordinate frame.
// The seconds-per-pixel and metres-per-pixel mappings are constants, so changing
// the damping moves the drawn curve inside a stable frame instead of rescaling
// or re-framing the whole picture. An axis tick label is a fixed reference that
// must not move.
test("damped-oscillation: labelled axes with a fixed coordinate frame", async ({
  page,
}) => {
  await page.goto("/zh/labs/damped-oscillation");
  const svg = page.locator("svg").first();
  await expect(svg.locator("text", { hasText: "x / m" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "t / s" })).toBeVisible();

  // The +0.40 m tick label of the displacement axis is a fixed reference.
  const tick = svg.locator("text").filter({ hasText: /^0\.40$/ });
  await expect(tick).toBeVisible();
  const trace = svg.locator("g[clip-path]").locator('path[stroke="var(--color-accent)"]');
  await page.evaluate(() => document.fonts.ready);
  const before = (await tick.boundingBox())!;

  // Advance one step (t = 0.10 s) and remember the curve drawn at that time.
  await page.getByRole("button", { name: "单步", exact: true }).click();
  await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.10 s");
  const traceBefore = await trace.getAttribute("d");

  const damping = page.getByRole("spinbutton", { name: /阻尼系数/ });
  await damping.fill("25");
  await damping.press("Enter");
  await expect(damping).toHaveValue("25");

  const after = (await tick.boundingBox())!;
  // A fixed reference stays put: the scale does not depend on the parameters.
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);

  // The parameter really took effect: c = 25 N·s/m is ζ = 2.5 here.
  await expect(page.getByText("过阻尼", { exact: true })).toBeVisible();

  // The drawing itself does respond: at the same time t = 0.10 s the curve is
  // different once the damping changes.
  await page.getByRole("button", { name: "单步", exact: true }).click();
  await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.10 s");
  const traceAfter = await trace.getAttribute("d");
  expect(traceAfter).not.toBe(traceBefore);
});
