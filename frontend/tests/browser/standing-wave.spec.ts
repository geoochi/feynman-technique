import { test, expect } from "@playwright/test";

// Regression: the standing-wave plot must keep a fixed coordinate frame. The
// metres-per-pixel mapping is fixed, so changing the amplitude moves the drawn
// curve inside a stable frame instead of rescaling or re-framing the picture.
// An axis tick label is a fixed reference that must not move.
test("standing-wave: fixed coordinate frame when the amplitude changes", async ({
  page,
}) => {
  await page.goto("/zh/labs/standing-wave");
  const svg = page.locator("svg").first();
  await expect(svg.locator("text", { hasText: "x / m" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "y / m" })).toBeVisible();

  const tick = svg.locator("text").filter({ hasText: /^4$/ });
  await expect(tick).toBeVisible();
  const before = (await tick.boundingBox())!;

  const amplitude = page.getByRole("spinbutton", { name: /振幅/ });
  await amplitude.fill("0.2");
  await amplitude.press("Enter");
  await expect(amplitude).toHaveValue("0.2");

  const after = (await tick.boundingBox())!;
  // A fixed reference stays put: the scale does not depend on the parameters.
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
});
