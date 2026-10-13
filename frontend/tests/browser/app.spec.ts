import { repositoryUrl } from "../../repository.config";
import { test, expect } from "@playwright/test";
const slugs = ["function-transform", "pendulum", "day-night"];
test("catalog filters, searches, and has no layout overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/zh/");
  await expect(
    page.getByRole("heading", { name: "让知识发生。" }),
  ).toBeVisible();
  await expect(page.locator('a[href^="/zh/labs/"]')).toHaveCount(4);
  await page.getByRole("button", { name: "数学2", exact: true }).click();
  await expect(page.locator('a[href^="/zh/labs/"]')).toHaveCount(2);
  await page.getByRole("button", { name: "全部学科4", exact: true }).click();
  await page.getByRole("searchbox").fill("自转");
  await expect(page.locator('a[href^="/zh/labs/"]')).toHaveCount(1);
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
  test(`${slug}: controls, problem and parameter updates`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const textureResponse =
      slug === "day-night"
        ? page.waitForResponse(/earth-blue-marble.*\.webp$/)
        : null;
    await page.goto(`/zh/labs/${slug}`);
    await expect(page.getByRole("link", { name: "GitHub ↗", exact: true })).toHaveAttribute("href", repositoryUrl);
    if (textureResponse) {
      const response = await textureResponse;
      expect(response.ok()).toBe(true);
      expect(new URL(response.url()).origin).toBe("http://127.0.0.1:4173");
      expect(response.headers()["content-type"]).toContain("image/webp");
      await expect(
        page.getByRole("link", { name: "地表贴图：NASA Earth Observatory" }),
      ).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: "地球自西向东自转；地轴北端上方的弧形箭头表示自转方向",
        }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("heading", { name: "问题", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".katex-error")).toHaveCount(0);
    if (slug === "function-transform") {
      await expect(
        page.getByRole("heading", { name: "二次函数", exact: true }),
      ).toBeVisible();
      await expect(page).toHaveTitle("二次函数图像：探索 a、h、k 的作用 · Feynman");
      for (const name of ["播放", "暂停", "单步", "重置"])
        await expect(
          page.getByRole("button", { name, exact: true }),
        ).toHaveCount(0);
      await expect(page.getByLabel("模拟时间")).toHaveCount(0);
      await expect(page.getByText("已暂停", { exact: true })).toHaveCount(0);
      const graph = page.getByRole("img", {
        name: "原始抛物线与当前函数的对照坐标图",
      });
      const curve = graph.locator('path[stroke="var(--color-accent)"]');
      const originalPath = await curve.getAttribute("d");
      const horizontal = page.getByRole("spinbutton", {
        name: "水平平移（h）",
        exact: true,
      });
      await horizontal.fill("2");
      await horizontal.press("Enter");
      await expect(curve).not.toHaveAttribute("d", originalPath!);
      await expect(
        graph.getByText("(2.0, 0.0)", { exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "重置参数", exact: true }).click();
    } else {
      await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.00 s");
      await page.getByRole("button", { name: "单步", exact: true }).click();
      await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.10 s");
      await page.getByRole("button", { name: "播放", exact: true }).click();
      await expect(page.getByLabel("模拟时间")).not.toHaveText("t = 0.10 s");
      await page.getByRole("button", { name: "重置", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "播放", exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.00 s");
    }
    const inputs = page.locator("input[type=number]");
    for (const input of await inputs.all())
      await expect(input).toHaveAccessibleName(/.+（.+）$/);
    const initialValues = await inputs.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement).value),
    );
    for (const input of await inputs.all()) {
      await input.fill((await input.getAttribute("min"))!);
      await input.press("Enter");
    }
    const parameter = inputs.first();
    await parameter.fill("99999");
    await parameter.press("Enter");
    await expect(parameter).toHaveAttribute("aria-invalid", "true");
    await page.getByRole("button", { name: "重置参数", exact: true }).click();
    if (slug !== "function-transform")
      await expect(
        page.getByRole("button", { name: "播放", exact: true }),
      ).toBeVisible();
    await expect
      .poll(() =>
        inputs.evaluateAll((nodes) =>
          nodes.map((node) => (node as HTMLInputElement).value),
        ),
      )
      .toEqual(initialValues);
    await expect(page.getByLabel("应用预设")).toHaveCount(0);
    await expect(page.getByRole("combobox")).toHaveCount(1);
    await expect(
      page.getByRole("combobox", { name: "语言", exact: true }),
    ).toHaveValue("zh-CN");
    await expect(page.getByRole("button", { name: "放大视角" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "缩小视角" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "↓ 导出状态" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: "↑ 恢复状态" })).toHaveCount(
      0,
    );
    await expect(page.locator("input[type=file]")).toHaveCount(0);
    await expect(parameter).toHaveAttribute("aria-invalid", "false");
    if (slug !== "function-transform")
      await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.00 s");
    await expect(
      page.getByRole("heading", { name: "问题", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "讲解章节" }),
    ).toHaveCount(0);
    const problemTexts = await page
      .getByRole("region", { name: "实验问题" })
      .locator("p")
      .allTextContents();
    expect(problemTexts.length).toBeGreaterThanOrEqual(1);
    expect(problemTexts.length).toBeLessThanOrEqual(3);
    expect(problemTexts.every((text) => text.trim().endsWith("？"))).toBe(true);
    await expect(
      page.getByRole("complementary", { name: "实验介绍" }).locator("details"),
    ).toHaveCount(0);
    if (slug === "pendulum")
      await expect(
        page.getByText("单位质量总能量", { exact: true }),
      ).toHaveCount(0);
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
  await page.goto("/zh/learn/pendulum");
  await expect(
    page.getByRole("heading", { name: "解释", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^非线性方程 θ″ =/)).toBeVisible();
  await context.close();
  const missing = await request.get("/assets/missing-resource.js");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["content-type"] ?? "").not.toContain(
    "text/javascript",
  );
  if (process.env.FEYNMAN_WORKERS) {
    expect(missing.headers()["x-content-type-options"]).toBe("nosniff");
    expect(await missing.text()).toContain('content="noindex, follow"');
  } else {
    expect(await missing.text()).not.toContain('id="root"');
  }
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
  await page.goto("/zh/labs/day-night");
  await expect(
    page.getByText("WebGL 不可用，显示静态示意图；参数与昼长计算仍可使用。"),
  ).toBeVisible();
  await page
    .getByRole("spinbutton", { name: "观察纬度（φ）", exact: true })
    .fill("75");
  await page
    .getByRole("spinbutton", { name: "观察纬度（φ）", exact: true })
    .press("Enter");
  await page
    .getByRole("spinbutton", { name: "太阳赤纬（δ）", exact: true })
    .fill("23.44");
  await page
    .getByRole("spinbutton", { name: "太阳赤纬（δ）", exact: true })
    .press("Enter");
  await expect(page.getByText("24.00", { exact: false })).toBeVisible();
});

test("day-night texture failure keeps parameters and readouts available", async ({
  page,
}) => {
  await page.route(/earth-blue-marble.*\.webp$/, (route) => route.abort());
  await page.goto("/zh/labs/day-night");
  await expect(
    page.getByText(
      "地球贴图加载失败，显示静态示意图；参数与昼长计算仍可使用。",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "地球昼夜静态示意图" }),
  ).toBeVisible();
  await page.locator("#number-latitude").fill("75");
  await page.locator("#number-latitude").press("Enter");
  await page.locator("#number-declination").fill("23.44");
  await page.locator("#number-declination").press("Enter");
  await expect(page.getByText("24.00", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "重置参数", exact: true }).click();
  await expect(page.locator("#number-latitude")).toHaveValue("31.2");
});

test("model module failure keeps static questions and a retry action", async ({ page }) => {
  await page.route('**/_next/static/chunks/*.js', async route => {
    const response = await route.fetch();
    if ((await response.text()).includes('Small-angle period')) await route.abort();
    else await route.fulfill({response});
  });
  await page.goto('/zh/labs/pendulum');
  await expect(page.getByRole('alert').filter({hasText:'实验资源加载失败。请刷新重试，也可以先阅读完整讲解。'})).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('a[href="/zh/learn/pendulum"]').first()).toBeVisible();
  await page.unroute('**/_next/static/chunks/*.js');
  await page.getByRole('alert').getByRole('button', {name:'刷新重试', exact:true}).click();
  await expect(page.locator('[data-controls-ready=true]')).toBeVisible();
  await page.getByRole('button', {name:'单步', exact:true}).click();
  await expect(page.getByLabel('模拟时间')).toHaveText('t = 0.10 s');
});
test("scene module failure leaves controls and readouts working and can retry locally", async ({ page }) => {
  await page.route('**/_next/static/chunks/*.js', async route => {
    const response = await route.fetch();
    if ((await response.text()).includes('uniform bool hasMap')) await route.abort();
    else await route.fulfill({response});
  });
  await page.goto('/zh/labs/day-night');
  await expect(page.getByText('渲染暂不可用。仍可调整参数、查看模型数据与阅读讲解。', {exact:true})).toBeVisible();
  await page.locator('#number-latitude').fill('75'); await page.locator('#number-latitude').press('Enter');
  await page.locator('#number-declination').fill('23.44'); await page.locator('#number-declination').press('Enter');
  await expect(page.getByText('24.00', {exact:false})).toBeVisible();
  await page.unroute('**/_next/static/chunks/*.js');
  await page.getByRole('button', {name:'刷新重试',exact:true}).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#number-latitude')).toHaveValue('75');
});
test("critical client script failure keeps the static explanation and refresh link", async ({ page }) => {
  await page.route('**/_next/static/chunks/*.js', async route => {
    const response = await route.fetch();
    if ((await response.text()).includes('feynman:controls-ready')) await route.abort();
    else await route.fulfill({response});
  });
  await page.goto('/zh/labs/pendulum');
  await expect(page.locator('[data-bootstrap-fallback]')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('a[href="/zh/learn/pendulum"]').first()).toBeVisible();
});

for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
  [768, 1024],
  [5120, 2580],
])
  test(`experiment composition at ${width}×${height}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop breakpoint matrix");
    await page.setViewportSize({ width, height });
    await page.goto("/zh/labs/pendulum");
    await expect(
      page.getByRole("button", { name: "播放", exact: true }),
    ).toBeVisible();
    const intro = await page
      .getByRole("complementary", { name: "实验介绍" })
      .boundingBox();
    const readouts = await page
      .getByRole("region", { name: "公式与读数" })
      .boundingBox();
    const plot = await page
      .getByRole("region", { name: "实验主图" })
      .boundingBox();
    const controls = await page
      .getByRole("complementary", { name: "播放与参数" })
      .boundingBox();
    expect(plot!.height).toBeGreaterThan(height * 0.65);
    expect(plot!.width).toBeGreaterThan(width * 0.45);
    if (width >= 1200) {
      expect(intro!.x + intro!.width).toBeLessThanOrEqual(plot!.x);
      expect(plot!.x + plot!.width).toBeLessThanOrEqual(controls!.x);
      const bob = page
        .getByRole("img", { name: "单摆的位置、摆线与初始振幅" })
        .locator("g circle");
      const pivot = page
        .getByRole("img", { name: "单摆的位置、摆线与初始振幅" })
        .locator(":scope > circle");
      const bobBox = await bob.boundingBox(),
        pivotBox = await pivot.boundingBox();
      expect(bobBox!.y - pivotBox!.y).toBeGreaterThan(height * 0.1);
    }
    expect(readouts!.y).toBeGreaterThanOrEqual(controls!.y + controls!.height);
    expect(readouts!.x).toBeCloseTo(controls!.x, 0);
    expect(readouts!.width).toBeCloseTo(controls!.width, 0);
    await expect(
      page
        .getByRole("complementary", { name: "播放与参数" })
        .getByRole("button", { name: "播放", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: testInfo.outputPath(`layout-${width}.png`),
      fullPage: true,
    });
  });

test("pendulum length changes proportionally and resetting parameters restores the scene", async ({
  page,
}) => {
  await page.goto("/zh/labs/pendulum");
  const diagram = page.getByRole("img", { name: "单摆的位置、摆线与初始振幅" });
  const rope = diagram.locator("g line");
  const lengthInput = page.getByRole("spinbutton", {
    name: "摆长（L）",
    exact: true,
  });
  const screenLength = () =>
    rope.evaluate((node) => {
      const line = node as SVGLineElement,
        matrix = line.getScreenCTM()!;
      const start = new DOMPoint(
        line.x1.baseVal.value,
        line.y1.baseVal.value,
      ).matrixTransform(matrix);
      const end = new DOMPoint(
        line.x2.baseVal.value,
        line.y2.baseVal.value,
      ).matrixTransform(matrix);
      return Math.hypot(end.x - start.x, end.y - start.y);
    });
  await expect(lengthInput).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await lengthInput.fill("0.5");
  await lengthInput.press("Enter");
  const short = await screenLength();
  await lengthInput.fill("2");
  await lengthInput.press("Enter");
  await expect
    .poll(async () => (await screenLength()) / short)
    .toBeCloseTo(4, 2);
  await page.getByRole("button", { name: "播放", exact: true }).click();
  await expect(page.getByLabel("模拟时间")).not.toHaveText("t = 0.00 s");
  await page.getByRole("button", { name: "重置参数", exact: true }).click();
  await expect(lengthInput).toHaveValue("1");
  await expect(
    page.getByRole("spinbutton", { name: "重力加速度（g）", exact: true }),
  ).toHaveValue("9.81");
  await expect(
    page.getByRole("spinbutton", { name: "初始角度（θ₀）", exact: true }),
  ).toHaveValue("15");
  await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.00 s");
  await expect(
    page.getByRole("button", { name: "播放", exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () => (await screenLength()) / short)
    .toBeCloseTo(2, 2);
});
