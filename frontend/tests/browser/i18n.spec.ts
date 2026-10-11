import { test, expect } from "@playwright/test";
const cases = [
  {
    prefix: "",
    lang: "en",
    titles: [
      "Quadratic functions",
      "Pendulum and time",
      "Day and night on Earth",
    ],
    questions: "Questions",
    reset: "Reset parameters",
    play: "Play",
    resetTime: "Reset",
    time: "Simulation time",
    search: "rotation",
    filters: "Clear filters",
  },
  {
    prefix: "/ja",
    lang: "ja",
    titles: ["二次関数", "単振り子と時間", "地球の昼と夜"],
    questions: "問い",
    reset: "パラメーターを戻す",
    play: "再生",
    resetTime: "リセット",
    time: "シミュレーション時間",
    search: "自転",
    filters: "絞り込みを解除",
  },
];
const slugs = ["function-transform", "pendulum", "day-night"];
for (const language of cases) {
  test(`${language.lang}: catalog, search and direct experiment links`, async ({
    page,
  }) => {
    await page.goto(`${language.prefix}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", language.lang);
    await expect(
      page.locator(`a[href^="${language.prefix}/labs/"]`),
    ).toHaveCount(3);
    await page.getByRole("searchbox").fill(language.search);
    await expect(
      page.locator(`a[href^="${language.prefix}/labs/"]`),
    ).toHaveCount(1);
    await page
      .getByRole("heading", { name: language.titles[2], exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`${language.prefix}/labs/day-night$`),
    );
    await expect(
      page.getByRole("button", { name: language.play, exact: true }),
    ).toBeVisible();
  });
  for (const [i, slug] of slugs.entries())
    test(`${language.lang}: ${slug} translated controls and layout`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${language.prefix}/labs/${slug}`);
      await expect(page.locator("html")).toHaveAttribute("lang", language.lang);
      await expect(page).toHaveTitle(`${language.titles[i]} · Feynman`);
      await expect(
        page.getByRole("heading", { name: language.titles[i], exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: language.questions, exact: true }),
      ).toBeVisible();
      const input = page.locator('input[type="number"]').first();
      await input.fill("99999");
      await input.press("Enter");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByRole("alert")).toHaveText(
        language.lang === "en" ? /^Range:/ : /^範囲：/,
      );
      await page
        .getByRole("button", { name: language.reset, exact: true })
        .click();
      await expect(input).toHaveAttribute("aria-invalid", "false");
      if (slug !== "function-transform") {
        await page
          .getByRole("button", { name: language.play, exact: true })
          .click();
        await expect(page.getByLabel(language.time)).not.toHaveText(
          "t = 0.00 s",
        );
        await page
          .getByRole("button", { name: language.resetTime, exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: language.play, exact: true }),
        ).toBeVisible();
        await expect(page.getByLabel(language.time)).toHaveText("t = 0.00 s");
      } else
        await expect(
          page.getByRole("button", { name: language.play, exact: true }),
        ).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`${language.lang}-${slug}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
}
test("language switching keeps parameters, running state, clock and model state", async ({
  page,
}) => {
  await page.goto("/labs/pendulum");
  await expect(
    page.getByRole("combobox", { name: "Language", exact: true }),
  ).toHaveValue("en");
  await expect(page.getByRole("combobox").locator("option")).toHaveText([
    "English",
    "中文",
    "日本語",
  ]);
  await page.locator("#number-length").fill("2");
  await page.locator("#number-length").press("Enter");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByLabel("Simulation time")).not.toHaveText("t = 0.00 s");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("ja");
  await expect(page).toHaveURL(/\/ja\/labs\/pendulum$/);
  await expect(page.locator("#number-length")).toHaveValue("2");
  await expect(
    page.getByRole("button", { name: "一時停止", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "一時停止", exact: true }).click();
  const time = await page.getByLabel("シミュレーション時間").textContent();
  const transform = await page
    .locator("svg g[transform]")
    .getAttribute("transform");
  await page.locator("#number-length").focus();
  await page
    .getByRole("combobox", { name: "言語", exact: true })
    .selectOption("zh-CN");
  await expect(page.locator("#number-length")).toHaveValue("2");
  await expect(page.getByLabel("模拟时间")).toHaveText(time!);
  await expect(page.locator("svg g[transform]")).toHaveAttribute(
    "transform",
    transform!,
  );
  await page.goBack();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(
    page.getByRole("combobox", { name: "言語", exact: true }),
  ).toHaveValue("ja");
  await expect(page.getByLabel("シミュレーション時間")).toHaveText(time!);
  await page
    .getByRole("combobox", { name: "言語", exact: true })
    .selectOption("en");
  await expect(page).toHaveURL(/\/labs\/pendulum$/);
  await expect(page.getByLabel("Simulation time")).toHaveText(time!);
});
test("all languages have static lessons and localized navigation without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const { prefix, lang, heading } of [
    { prefix: "", lang: "en", heading: "Explain" },
    { prefix: "/zh", lang: "zh-CN", heading: "解释" },
    { prefix: "/ja", lang: "ja", heading: "解説" },
  ]) {
    for (const slug of slugs) {
      await page.goto(`${prefix}/learn/${slug}`);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await expect(
        page.locator(`a[href="${prefix}/labs/${slug}"]`),
      ).toBeVisible();
    }
    await page.goto(`${prefix}/contribute`);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("main h1")).toBeVisible();
  }
  await page.getByRole("link", { name: "中文", exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/contribute$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await context.close();
});
