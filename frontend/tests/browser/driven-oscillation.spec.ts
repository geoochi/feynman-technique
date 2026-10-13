import { test, expect } from "@playwright/test";

// Regression: the driven-oscillator diagram must keep a fixed coordinate frame.
// Every scale is a fixed constant, so changing a parameter moves the drawing
// inside a stable frame instead of rescaling or re-framing the whole picture.
// An axis label is a fixed reference that must not move.
test("driven-oscillation: labelled coordinate system with a fixed scale", async ({
  page,
}) => {
  await page.goto("/zh/labs/driven-oscillation");
  const svg = page.locator("svg").first();
  await expect(svg.locator("text", { hasText: "t / s" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "x / m" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "A / m" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "ω / (rad/s)" })).toBeVisible();

  const reference = svg.locator("text", { hasText: "A / m" });
  const before = (await reference.boundingBox())!;

  const force = page.getByRole("spinbutton", { name: /驱动力幅值/ });
  await force.fill("5");
  await force.press("Enter");
  await expect(force).toHaveValue("5");

  const after = (await reference.boundingBox())!;
  // A fixed reference stays put: the scale does not depend on the parameters.
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
});
