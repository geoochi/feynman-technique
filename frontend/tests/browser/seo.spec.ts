import { test, expect } from "@playwright/test";
import { siteOrigin } from "../../site.config";
import { catalog } from "../../apps/web/generated/catalog";
import { messages } from "../../packages/i18n/messages";
import type { Locale } from "../../packages/i18n/locales";

test("every production page has crawlable content and consistent SEO without JavaScript", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const titles = new Set<string>();
  const canonicals: string[] = [];
  for (const [prefix, lang, questions] of [
    ["", "en", "Questions"],
    ["/zh", "zh-CN", "问题"],
    ["/ja", "ja", "問い"],
  ]) {
    for (const path of [
      "/",
      ...["function-transform", "pendulum", "day-night"].flatMap((slug) => [
        `/labs/${slug}`,
        `/learn/${slug}`,
      ]),
    ]) {
      const route = prefix + path;
      const response = await page.goto(route);
      expect(response!.status()).toBe(200);
      expect(await response!.text()).not.toMatch(/geoochi|geoooochi|github\.com\/geoochi/i);
      await expect(page.locator('a[href*="github.com"], a[href$="/contribute"]')).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("main h1")).toHaveCount(1);
      const title = await page.title();
      expect(titles.has(title)).toBe(false);
      titles.add(title);
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
        "content",
        /^index, follow/,
      );
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        siteOrigin + route,
      );
      canonicals.push(siteOrigin + route);
      await expect(page.locator("head link[hreflang]")).toHaveCount(4);
      for (const [language, alternatePrefix] of [
        ["en", ""],
        ["zh-CN", "/zh"],
        ["ja", "/ja"],
        ["x-default", ""],
      ])
        await expect(
          page.locator(`head link[hreflang="${language}"]`),
        ).toHaveAttribute("href", siteOrigin + alternatePrefix + path);
      await expect(
        page.locator('head meta[property="og:url"]'),
      ).toHaveAttribute("content", siteOrigin + route);
      const json = JSON.parse(
        (await page
          .locator('head script[type="application/ld+json"]')
          .textContent())!,
      );
      expect(json["@context"]).toBe("https://schema.org");
      expect(JSON.stringify(json)).not.toContain('"author"');
      expect(
        json["@graph"].some(
          (item: { url: string }) => item.url === siteOrigin + route,
        ),
      ).toBe(true);
      if (path !== "/") {
        const lab = catalog.find((item) => path.endsWith(`/${item.slug}`))!;
        const copy = lab.seo![path.startsWith("/learn/") ? "lesson" : "experiment"]!;
        expect(title).toBe(copy.title[lang as Locale]);
        for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'])
          await expect(page.locator(`head ${selector}`)).toHaveAttribute("content", copy.description[lang as Locale]);
        for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]'])
          await expect(page.locator(`head ${selector}`)).toHaveAttribute("content", title);
        const entity = json["@graph"].find((item: { url: string }) => item.url === siteOrigin + route);
        expect(entity.name).toBe(title);
        expect(entity.description).toBe(copy.description[lang as Locale]);
        expect(entity.mainEntity.description).toBe(copy.description[lang as Locale]);
        if (path.startsWith("/learn/")) {
          await expect(page.locator("main h1 + p")).toBeVisible();
          expect((await page.locator("main h1 + p").textContent())!.length).toBeGreaterThan(40);
          await expect(page.locator("main h2")).toHaveCount(9); // Seven chapters, objectives and sources.
          expect(await page.locator("main h3").count()).toBeGreaterThanOrEqual(2);
          await expect(page.locator('main a[href^="https://"]')).not.toHaveCount(0);
        }
      }
      if (path.startsWith("/labs/")) {
        await expect(
          page.getByRole("heading", { name: questions, exact: true }),
        ).toBeVisible();
        await expect(
          page.locator(
            `a[href="${prefix}${path.replace("/labs/", "/learn/")}"]`,
          ),
        ).toBeVisible();
      }
    }
    await page.goto(prefix + "/404");
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, follow",
    );
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator("head link[hreflang]")).toHaveCount(0);
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(
    Array.from(
      xml.matchAll(/<loc>([^<]+)<\/loc>/g),
      (match) => match[1],
    ).sort(),
  ).toEqual(canonicals.sort());
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain(`Sitemap: ${siteOrigin}/sitemap.xml`);
  const social = await request.get("/social-card.png");
  expect(social.status()).toBe(200);
  expect(social.headers()["content-type"]).toContain("image/png");
  expect((await request.get("/this-page-does-not-exist")).status()).toBe(404);
  expect((await request.get("/assets/missing.js")).status()).toBe(404);
  for (const prefix of ["", "/zh", "/ja"])
    expect((await request.get(prefix + "/contribute")).status()).toBe(404);
  const catalogResponse = await request.get("/catalog.json");
  expect(catalogResponse.status()).toBe(200);
  expect(await catalogResponse.text()).not.toMatch(/geoochi|geoooochi|github\.com\/geoochi/i);
  await context.close();
});

test("language navigation updates canonical, sharing metadata and structured data together", async ({
  page,
}) => {
  await page.goto("/labs/pendulum?utm_source=test#diagram");
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    siteOrigin + "/labs/pendulum",
  );
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("ja");
  await expect(page).toHaveURL(
    /\/ja\/labs\/pendulum\?utm_source=test#diagram$/,
  );
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    siteOrigin + "/ja/labs/pendulum",
  );
  await expect(page.locator('head meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "ja_JP",
  );
  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
    "content",
    "単振り子シミュレーター：長さ・重力・周期 · Feynman",
  );
  expect(
    (await page
      .locator('head script[type="application/ld+json"]')
      .textContent())!,
  ).toContain('"inLanguage":"ja"');
  const pendulum = catalog.find((lab) => lab.slug === "pendulum")!;
  const expectCopy = async (locale: Locale) => {
    const copy = pendulum.seo!.experiment!;
    await expect(page).toHaveTitle(copy.title[locale]);
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'])
      await expect(page.locator(`head ${selector}`)).toHaveAttribute("content", copy.description[locale]);
    const data = JSON.parse((await page.locator('head script[type="application/ld+json"]').textContent())!);
    expect(data["@graph"][0].name).toBe(copy.title[locale]);
    expect(data["@graph"][0].description).toBe(copy.description[locale]);
  };
  await expectCopy("ja");
  await page.goBack();
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    siteOrigin + "/labs/pendulum",
  );
  await expect(page.locator('head meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "en_US",
  );
  await expectCopy("en");
  await expect(page.locator("head title")).toHaveCount(1);
  await expect(page.locator('head meta[name="description"]')).toHaveCount(1);
  await expect(
    page.locator('head script[type="application/ld+json"]'),
  ).toHaveCount(1);
});

test("home explains the product in all languages with readable desktop and mobile layout", async ({ page }, testInfo) => {
  for (const [i, prefix] of ["", "/zh", "/ja"].entries()) {
    await page.goto(`${prefix}/`);
    const intro = page.getByText(messages.intro1[i], { exact: false });
    await expect(intro).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const heading = await page.locator("main h1").boundingBox();
    const paragraph = await intro.boundingBox();
    expect(heading!.y + heading!.height).toBeLessThanOrEqual(paragraph!.y);
    expect(paragraph!.x + paragraph!.width).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
    await page.screenshot({ path: testInfo.outputPath(`home-${i}.png`), fullPage: true });
  }
});
