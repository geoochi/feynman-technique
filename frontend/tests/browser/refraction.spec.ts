import { test, expect } from "@playwright/test";

// Regression: the refraction diagram must keep a FIXED scale and a labelled
// coordinate system. Changing a parameter may only rotate the rays inside that
// frame; it must never rescale or re-frame the picture, which used to make the
// whole drawing jump.
test("refraction: labelled coordinate system with a fixed diagram scale", async ({
  page,
}) => {
  await page.goto("/zh/labs/refraction");
  const svg = page.locator("svg").first();

  // A real coordinate system with labelled axes and units.
  const axisY = svg.locator("text", { hasText: "y / a.u." });
  await expect(axisY).toBeVisible();
  await expect(svg.locator("text", { hasText: "x / a.u." })).toBeVisible();
  await expect(svg.locator("text", { hasText: "法线" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "界面" })).toBeVisible();
  await expect(svg.locator("text").filter({ hasText: /^θ₁ = / })).toBeVisible();

  const rayTip = svg.locator('[data-ray-tip="refracted"]');
  await expect(rayTip).toBeVisible();

  const referenceBefore = (await axisY.boundingBox())!;
  const tipBefore = (await rayTip.boundingBox())!;

  const angle = page.getByRole("spinbutton", {
    name: "入射角（θ₁）",
    exact: true,
  });
  await angle.fill("70");
  await angle.press("Enter");

  const referenceAfter = (await axisY.boundingBox())!;
  const tipAfter = (await rayTip.boundingBox())!;

  // The fixed reference does not move: the scale is independent of the parameters.
  expect(Math.abs(referenceAfter.x - referenceBefore.x)).toBeLessThan(1);
  // The refracted ray does move: a larger incidence angle swings its tip outward.
  expect(tipAfter.x).toBeGreaterThan(tipBefore.x + 5);
});
