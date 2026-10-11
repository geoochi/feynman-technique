import { test, expect } from "@playwright/test";
const slugs = ["function-transform", "pendulum", "day-night"];
test("catalog filters, searches, and has no layout overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "让知识发生。" }),
  ).toBeVisible();
  await expect(page.locator('a[href^="/labs/"]')).toHaveCount(3);
  await page.getByRole("button", { name: "数学1", exact: true }).click();
  await expect(page.locator('a[href^="/labs/"]')).toHaveCount(1);
  await page.getByRole("button", { name: "全部学科3", exact: true }).click();
  await page.getByRole("searchbox").fill("自转");
  await expect(page.locator('a[href^="/labs/"]')).toHaveCount(1);
  await page.getByRole("searchbox").fill("不存在的知识点");
  await expect(page.getByText("还没有找到这个实验")).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("catalog.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
for (const slug of slugs)
  test(`${slug}: controls, chapters, playback and snapshots`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/labs/${slug}`);
    await expect(
      page.getByRole("button", { name: "播放", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.00 s");
    await page.getByRole("button", { name: "单步", exact: true }).click();
    await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.10 s");
    await page.getByRole("button", { name: "播放", exact: true }).click();
    await expect(page.getByLabel("模拟时间")).not.toHaveText("t = 0.10 s");
    await page.getByRole("button", { name: "暂停", exact: true }).click();
    const time = await page.getByLabel("模拟时间").innerText();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "↓ 导出状态" }).click();
    const download = await downloadPromise;
    const file = await download.path();
    await page.getByRole("button", { name: "重置", exact: true }).click();
    await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.00 s");
    await page.locator("input[type=file]").setInputFiles(file!);
    await expect(page.getByText("已恢复快照，实验保持暂停。")).toBeVisible();
    await expect(page.getByLabel("模拟时间")).toHaveText(time);
    const parameter = page.locator("input[type=number]").first();
    await parameter.fill("99999");
    await parameter.press("Enter");
    await expect(parameter).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("应用预设").selectOption("0");
    await expect(parameter).toHaveAttribute("aria-invalid", "false");
    await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.00 s");
    await page.getByRole("button", { name: "下一步 →", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "预测", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "A ·", exact: false }).click();
    await expect(
      page.getByRole("group", { name: "自测选项" }).getByRole("button").first(),
    ).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: testInfo.outputPath(`${slug}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
test("static lessons are available without JavaScript and missing resources return 404", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/learn/pendulum");
  await expect(
    page.getByRole("heading", { name: "解释", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("非线性方程", { exact: false })).toBeVisible();
  await context.close();
  const missing = await request.get("/assets/missing-resource.js");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["content-type"] ?? "").not.toContain(
    "text/javascript",
  );
  expect(await missing.text()).not.toContain('id="root"');
});
test("day-night falls back without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2" || type === "webgl") return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("/labs/day-night");
  await expect(
    page.getByText("WebGL 不可用，显示静态示意图；参数与昼长计算仍可使用。"),
  ).toBeVisible();
  await page.getByLabel("应用预设").selectOption("2");
  await expect(page.getByText("24.00", { exact: false })).toBeVisible();
});

test("case module failure keeps a readable retry state", async ({ page }) => {
  await page.route(/\/assets\/view-.*\.js$/, (route) => route.abort());
  await page.goto("/labs/pendulum");
  await expect(
    page.getByText("实验资源加载失败。请刷新重试，也可以先阅读完整讲解。"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "刷新重试" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "阅读完整讲解 →" }),
  ).toBeVisible();
});
test("course shell module failure falls back to the static explanation", async ({
  page,
}) => {
  await page.route(/\/assets\/LabPage-.*\.js$/, (route) => route.abort());
  await page.goto("/labs/pendulum");
  await expect(
    page.getByText("实验界面资源加载失败。请刷新重试，或先阅读完整讲解。"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "刷新重试" })).toBeVisible();
});
