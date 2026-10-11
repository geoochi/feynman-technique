import { test, expect } from "@playwright/test";
import { siteOrigin } from "../../site.config";

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
      "/contribute",
      ...["function-transform", "pendulum", "day-night"].flatMap((slug) => [
        `/labs/${slug}`,
        `/learn/${slug}`,
      ]),
    ]) {
      const route = prefix + path;
      const response = await page.goto(route);
      expect(response!.status()).toBe(200);
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
      expect(
        json["@graph"].some(
          (item: { url: string }) => item.url === siteOrigin + route,
        ),
      ).toBe(true);
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
    "単振り子と時間 · インタラクティブ実験 · Feynman",
  );
  expect(
    (await page
      .locator('head script[type="application/ld+json"]')
      .textContent())!,
  ).toContain('"inLanguage":"ja"');
  await page.goBack();
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    siteOrigin + "/labs/pendulum",
  );
  await expect(page.locator('head meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "en_US",
  );
  await expect(page.locator("head title")).toHaveCount(1);
  await expect(page.locator('head meta[name="description"]')).toHaveCount(1);
  await expect(
    page.locator('head script[type="application/ld+json"]'),
  ).toHaveCount(1);
});
