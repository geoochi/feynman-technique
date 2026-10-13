import { test, expect } from "@playwright/test";

for (const [prefix, locale, title, reset, missing] of [
  ["", "en", "Derivatives and tangents", "Reset parameters", "Undefined"],
  ["/zh", "zh-CN", "导数与切线", "重置参数", "无定义"],
  ["/ja", "ja", "微分と接線", "パラメーターを戻す", "定義なし"],
]) {
  test(`${locale}: derivative exploration, boundaries, reset and layout`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${prefix}/labs/derivative-tangent`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByTestId("secant-slope")).toHaveText("3.000");
    await expect(page.getByTestId("tangent-slope")).toHaveText("2.000");
    await expect(page.locator('[aria-label="Simulation time"]')).toHaveCount(0);
    const set = async (key: string, value: string) => {
      await page.locator(`#number-${key}`).fill(value);
      await page.locator(`#number-${key}`).press("Enter");
    };
    const initialP = await page.getByTestId("point-p").getAttribute("cx");
    for (const [h, slope] of [["0.1", "2.100"], ["-0.1", "1.900"]]) {
      await set("h", h);
      await expect(page.getByTestId("secant-slope")).toHaveText(slope);
      await expect(page.getByTestId("slope-error")).toHaveText("0.100");
      await expect(page.getByTestId("point-p")).toHaveAttribute("cx", initialP!);
    }
    await set("h", "0");
    await expect(page.getByTestId("secant-slope")).toHaveText(missing);
    await expect(page.getByTestId("secant-line")).toHaveCount(0);
    await expect(page.getByTestId("tangent-line")).toBeVisible();
    await expect(page.getByTestId("tangent-slope")).toHaveText("2.000");
    await set("x0", "0");
    await expect(page.getByTestId("tangent-slope")).toHaveText("0.000");
    await set("x0", "9");
    await expect(page.locator("#number-x0")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("tangent-slope")).toHaveText("0.000");
    await page.getByRole("button", { name: reset, exact: true }).click();
    await expect(page.locator("#number-x0")).toHaveValue("1");
    await expect(page.locator("#number-h")).toHaveValue("1");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${locale}-default.png`), fullPage: true });
    for (const edge of ["-1.5", "1.5"]) {
      await set("x0", edge);
      await set("h", edge.startsWith("-") ? "-1" : "1");
      const bounds = await page.getByTestId("point-q").evaluate(el => {
        const rect = el.getBoundingClientRect(), svg = el.closest("svg")!.getBoundingClientRect();
        return rect.left >= svg.left && rect.right <= svg.right && rect.top >= svg.top && rect.bottom <= svg.bottom;
      });
      expect(bounds).toBe(true);
    }
    await page.screenshot({ path: info.outputPath(`${locale}-edge.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("derivative state survives language changes and related lessons connect", async ({ page }) => {
  await page.goto("/labs/derivative-tangent");
  await expect(page.getByTestId("secant-slope")).toHaveText("3.000");
  await page.locator("#number-h").fill("-0.1");
  await page.locator("#number-h").press("Enter");
  for (const locale of ["zh-CN", "ja", "en"]) {
    await page.getByRole("combobox").selectOption(locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("#number-h")).toHaveValue("-0.1");
    await expect(page.getByTestId("secant-slope")).toHaveText("1.900");
  }
  for (const prefix of ["", "/zh", "/ja"]) {
    await page.goto(`${prefix}/learn/function-transform`);
    await page.locator(`main a[href="${prefix}/labs/derivative-tangent"]`).click();
    await expect(page.getByTestId("secant-slope")).toHaveText("3.000");
    await page.goto(`${prefix}/learn/derivative-tangent`);
    await expect(page.locator(`main a[href="${prefix}/labs/function-transform"]`)).toBeVisible();
    await page.goto(`${prefix}/`);
    await page.getByRole("searchbox").fill(prefix === "/zh" ? "导数" : prefix === "/ja" ? "微分" : "derivative");
    await expect(page.locator(`a[href^="${prefix}/labs/"]`)).toHaveCount(1);
    await expect(page.locator(`a[href="${prefix}/labs/derivative-tangent"]`)).toBeVisible();
  }
});
