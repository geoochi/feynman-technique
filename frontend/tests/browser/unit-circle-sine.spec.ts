import { test, expect } from "@playwright/test";

// Regression: the unit-circle diagram used to rescale itself whenever a parameter
// changed, so the whole picture (including the coordinate system) jumped. The
// scale is now fixed: a parameter moves the drawing inside the frame, and the
// labelled axes stay exactly where they are.
test("unit-circle-sine: fixed coordinate frame while a parameter moves the drawing", async ({
  page,
}) => {
  await page.goto("/zh/labs/unit-circle-sine");
  const svg = page.getByRole("img", { name: /圆周上逆时针转动的一点/ });
  await expect(svg.locator("text", { hasText: "x / m" })).toBeVisible();
  await expect(svg.locator("text", { hasText: "y / m" }).first()).toBeVisible();
  await expect(svg.locator("text", { hasText: "t / s" })).toBeVisible();

  // The "+2" tick label of the fixed coordinate system is the reference.
  const tick = page.getByTestId("tick-y-2");
  // The circle is drawn from the current radius, so it must move with the parameter.
  const orbit = page.getByTestId("orbit");
  await expect(tick).toBeVisible();
  await expect(orbit).toBeVisible();

  const tickBefore = (await tick.boundingBox())!;
  const orbitBefore = (await orbit.boundingBox())!;

  const radius = page.getByRole("spinbutton", {
    name: "半径（R）",
    exact: true,
  });
  await radius.fill("1.5");
  await radius.press("Enter");

  // A parameter-dependent element grows: R = 1 → 1.5 makes the circle larger.
  await expect
    .poll(async () => (await orbit.boundingBox())!.width)
    .toBeGreaterThan(orbitBefore.width + 4);

  const tickAfter = (await tick.boundingBox())!;
  const orbitAfter = (await orbit.boundingBox())!;

  // The fixed reference must not move: the scale does not depend on the parameters.
  expect(Math.abs(tickAfter.x - tickBefore.x)).toBeLessThan(1);
  // The drawn circle moved outwards, so the parameter did affect the picture.
  expect(orbitAfter.x).toBeLessThan(orbitBefore.x - 4);
});
