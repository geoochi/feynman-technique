import { test, expect } from "@playwright/test";

// Regression: the RC capacitor-voltage–time plot must keep a fixed coordinate
// frame. The seconds-per-pixel and volts-per-pixel mappings are constants of the
// frame, never derived from the current parameters, so changing a parameter
// moves the drawn curve and the time-constant marker inside a stable frame
// instead of rescaling or re-framing the whole picture. An axis tick label is a
// fixed reference that must not move.
test("rc-circuit: labelled coordinate system with a fixed voltage–time frame", async ({
  page,
}) => {
  await page.goto("/zh/labs/rc-circuit");
  const svg = page.locator("svg").first();
  await expect(svg.locator("text", { hasText: "u / V" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "t / s" })).toBeVisible();

  // The −10.0 V tick label of the voltage axis is a fixed reference.
  const reference = svg.locator('[data-axis-tick="-10"]');
  await expect(reference).toBeVisible();
  // The parameter-dependent annotation: the time-constant marker.
  const tauLabel = svg.locator("text").filter({ hasText: /τ = / }).first();
  await expect(tauLabel).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const before = (await reference.boundingBox())!;
  const tauBefore = await tauLabel.textContent();

  const capacitance = page.getByRole("spinbutton", { name: /电容（C）/ });
  await capacitance.fill("0.1");
  await capacitance.press("Enter");
  await expect(capacitance).toHaveValue("0.1");

  const after = (await reference.boundingBox())!;
  // A fixed reference stays put: the scale does not depend on the parameters.
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);

  // The parameter really took effect: τ = RC doubles from 2.00 s to 4.00 s.
  await expect(tauLabel).toHaveText(/τ = 4\.00 s/);
  expect(await tauLabel.textContent()).not.toBe(tauBefore);
});
