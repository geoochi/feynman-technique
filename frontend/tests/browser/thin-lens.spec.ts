import { test, expect } from "@playwright/test";

// Regression: the thin-lens diagram used to rescale itself whenever a parameter
// changed, so the whole picture jumped instead of the object moving. The scale
// is now fixed and a labelled coordinate system is drawn.
test("thin-lens: labelled coordinate system with a fixed optical scale", async ({
  page,
}) => {
  await page.goto("/zh/labs/thin-lens");
  const svg = page.locator("svg").first();
  await expect(svg.locator("text", { hasText: "x / m" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "y / m" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "0.4" }).first()).toBeVisible();
  await expect(svg.locator("text").filter({ hasText: "F′" })).toBeVisible();

  const objectLabel = svg.locator("text").filter({ hasText: "物" });
  const farFocus = svg.locator("text").filter({ hasText: "F′" });

  const focusBefore = (await farFocus.boundingBox())!;
  const objectBefore = (await objectLabel.boundingBox())!;

  const u = page.getByRole("spinbutton", { name: /物距/ });
  await u.fill("0.5");
  await u.press("Enter");

  const focusAfter = (await farFocus.boundingBox())!;
  const objectAfter = (await objectLabel.boundingBox())!;

  // A fixed reference stays put: the scale does not depend on the parameters.
  expect(Math.abs(focusAfter.x - focusBefore.x)).toBeLessThan(1);
  // The object itself moves to the left as u grows.
  expect(objectAfter.x).toBeLessThan(objectBefore.x - 20);
});
