import { test, expect } from "@playwright/test";

// Regression: the series-parallel charts must keep a FIXED scale and a labelled
// coordinate system. Changing a parameter may only move the bars inside that
// frame; it must never rescale or re-frame the picture, which would make the
// whole drawing jump.
test("series-parallel: labelled coordinate system with a fixed chart scale", async ({
  page,
}) => {
  await page.goto("/zh/labs/series-parallel");
  const svg = page.locator("svg").first();

  // A real coordinate system with labelled axes, ticks and units.
  await expect(svg.locator("text", { hasText: "V / V" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "I / A" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "串联" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "并联" })).toBeVisible();

  // A fixed reference: the voltage axis tick label at 8 V.
  const tick = svg.locator('text[data-tick="series-v-8"]');
  await expect(tick).toBeVisible();
  const tickBefore = (await tick.boundingBox())!;
  const barBefore = (await svg.locator('[data-bar="series-v1"]').boundingBox())!;

  const r1 = page.getByRole("spinbutton", { name: "电阻 R₁（Ω）", exact: true });
  await r1.fill("1000");
  await r1.press("Enter");

  const tickAfter = (await tick.boundingBox())!;
  const barAfter = (await svg.locator('[data-bar="series-v1"]').boundingBox())!;

  // The fixed reference does not move: the scale is independent of the parameters.
  expect(Math.abs(tickAfter.x - tickBefore.x)).toBeLessThan(1);
  // The bar does move: a larger R₁ takes a larger share of the source voltage.
  expect(barAfter.height).toBeGreaterThan(barBefore.height + 5);
});
