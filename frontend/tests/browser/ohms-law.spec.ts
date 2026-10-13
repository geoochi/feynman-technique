import { test, expect } from "@playwright/test";

// Regression: the I–V plot must use a fixed frame. The pixel-per-unit factors
// are constants of the frame, not of the current parameters, so changing V or R
// moves the operating point inside a stable coordinate system instead of
// rescaling or re-framing the whole picture.
test("ohms-law: labelled coordinate system with a fixed I–V frame", async ({
  page,
}) => {
  await page.goto("/zh/labs/ohms-law");
  const svg = page.locator("svg").first();
  await expect(svg.locator("text", { hasText: "V / V" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "I / A" })).toBeVisible();

  // A fixed reference: the label of the last voltage tick.
  const reference = svg.locator('[data-axis-tick="12"]');
  // The parameter-dependent element: the operating point marker.
  const point = svg.locator("[data-operating-point]");
  await expect(reference).toBeVisible();
  await expect(point).toBeVisible();

  const referenceBefore = (await reference.boundingBox())!;
  const pointBefore = (await point.boundingBox())!;

  const voltage = page.getByRole("spinbutton", { name: /电压/ });
  await voltage.fill("12");
  await voltage.press("Enter");

  const referenceAfter = (await reference.boundingBox())!;
  const pointAfter = (await point.boundingBox())!;

  // The fixed reference stays put: the scale does not depend on the parameters.
  expect(Math.abs(referenceAfter.x - referenceBefore.x)).toBeLessThan(1);
  // The operating point moves to the right as the voltage grows.
  expect(pointAfter.x).toBeGreaterThan(pointBefore.x + 20);
});
