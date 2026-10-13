import { test, expect } from "@playwright/test";

// The workbench is built on the structured netlist parameter: placing and
// deleting elements must change the solution while the drawing frame stays put.
test("circuit workbench: fixed frame across edits and a working place/delete loop", async ({
  page,
}) => {
  await page.goto("/zh/labs/circuit-workbench");
  await expect(
    page.getByRole("heading", { name: "电学工作台", exact: true }),
  ).toBeVisible();

  // The fixed U-I chart and the numbered lattice are part of the frame.
  const axisU = page.locator("svg text").filter({ hasText: "U / V" });
  await expect(axisU).toBeVisible();
  for (const node of [0, 1, 2, 3, 4, 5])
    await expect(page.getByRole("button", { name: `节点 ${node}` })).toHaveCount(1);

  const frameBefore = (await axisU.boundingBox())!.x;
  const read = () =>
    page.getByRole("region", { name: "公式与读数" }).textContent();
  const status = page.getByRole("status").first();
  const remove = page.getByRole("button", { name: "删除元件" });
  await expect(remove).toBeDisabled();
  const initial = await read();

  // Place one more resistor straight across the source.
  await page.getByRole("button", { name: "电阻", exact: true }).click();
  await page.getByRole("button", { name: "节点 1" }).click();
  await page.getByRole("button", { name: "节点 0" }).click();
  await expect(status).toContainText("已放置");
  await expect(remove).toBeEnabled();
  const placed = await read();
  expect(placed).not.toBe(initial);

  // Editing the circuit moves the drawing inside a stable frame.
  expect(Math.abs((await axisU.boundingBox())!.x - frameBefore)).toBeLessThan(1);

  await remove.click();
  await expect(status).toContainText("已删除");
  expect(await read()).toBe(initial);
});

// A topology the solver cannot solve must be reported, not rendered as a number.
test("circuit workbench: a shorted source is reported instead of solved", async ({
  page,
}) => {
  await page.goto("/zh/labs/circuit-workbench");
  await page.getByRole("button", { name: "导线", exact: true }).click();
  await page.getByRole("button", { name: "节点 1" }).click();
  await page.getByRole("button", { name: "节点 0" }).click();
  await expect(page.getByRole("alert")).toContainText("短接");
});
