import { test, expect } from "@playwright/test";

// Regression: the area plot must keep a fixed scale. Changing a parameter has
// to move the rectangles inside a stable frame; it must never rescale or
// re-frame the coordinate system (a previous case failed review on this).
test("integral-area: fixed coordinate frame while the rectangles move", async ({
  page,
}) => {
  await page.goto("/zh/labs/integral-area");
  const svg = page.getByRole("img", {
    name: "固定坐标网格上曲线 y = x² 与黎曼矩形",
  });
  await expect(svg).toBeVisible();

  // A labelled axis tick is the fixed reference; a sampling dot depends on s.
  const tick = svg.getByTestId("x-tick-1");
  const marker = svg.getByTestId("sample-mark").first();
  await expect(tick).toBeVisible();
  await expect(marker).toBeVisible();

  const tickBefore = (await tick.boundingBox())!;
  const markerBefore = (await marker.boundingBox())!;

  const sampling = page.getByRole("spinbutton", { name: /采样位置/ });
  await sampling.fill("1");
  await sampling.press("Enter");

  const tickAfter = (await tick.boundingBox())!;
  const markerAfter = (await marker.boundingBox())!;

  // The fixed reference does not move: the scale does not depend on parameters.
  expect(Math.abs(tickAfter.x - tickBefore.x)).toBeLessThan(1);
  // The sampling markers shift to the right edge of each subinterval.
  expect(markerAfter.x).toBeGreaterThan(markerBefore.x + 10);
});
