import { test, expect } from "@playwright/test";
import { catalog } from "../../apps/web/generated/catalog";
import { pageMetadata } from "../../packages/seo/metadata";
import { siteOrigin } from "../../site.config";
const languages = [
  {
    locale: "en",
    prefix: "",
    label: "Language",
    play: "Play",
    pause: "Pause",
    step: "Step",
    reset: "Reset",
    resetParams: "Reset parameters",
    time: "Simulation time",
  },
  {
    locale: "zh-CN",
    prefix: "/zh",
    label: "语言",
    play: "播放",
    pause: "暂停",
    step: "单步",
    reset: "重置",
    resetParams: "重置参数",
    time: "模拟时间",
  },
  {
    locale: "ja",
    prefix: "/ja",
    label: "言語",
    play: "再生",
    pause: "一時停止",
    step: "1 ステップ",
    reset: "リセット",
    resetParams: "パラメーターを戻す",
    time: "シミュレーション時間",
  },
];
async function ready(page: import("@playwright/test").Page) {
  await expect(page.locator("[data-controls-ready]")).toHaveAttribute(
    "data-controls-ready",
    "true",
  );
}
async function changeLength(
  page: import("@playwright/test").Page,
  value: string,
) {
  await page.locator("#number-length").fill(value);
  await page.locator("#number-length").press("Enter");
}
test("all content routes retain static text and metadata; localized missing routes are real 404s", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const { locale, prefix } of languages) {
    for (const path of [
      "/",
      ...catalog.flatMap((l) => [`/labs/${l.slug}`, `/learn/${l.slug}`]),
    ]) {
      const response = await page.goto(prefix + path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveCount(1);
      const meta = pageMetadata(prefix + path, catalog, {
        origin: siteOrigin,
        indexable: true,
      });
      await expect(page).toHaveTitle(meta.title);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", meta.description);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        meta.canonical!,
      );
      await expect(page.locator("head link[hreflang]")).toHaveCount(4);
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
        "content",
        "index, follow, max-image-preview:large",
      );
      expect(
        JSON.parse(
          (await page
            .locator('script[type="application/ld+json"]')
            .textContent())!,
        ),
      ).toEqual(meta.structuredData);
      if (path.startsWith("/learn/"))
        await expect(page.locator("main h2")).toHaveCount(9);
    }
    for (const path of [
      "/contribute",
      "/labs/unknown-case",
      "/learn/unknown-case",
      "/missing/page",
    ]) {
      const response = await page.goto(prefix + path);
      expect(response?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, follow",
      );
      await expect(
        page.locator(
          'link[rel="canonical"], link[hreflang], script[type="application/ld+json"]',
        ),
      ).toHaveCount(0);
    }
  }
  expect((await request.get("/en/")).status()).toBe(404);
  expect((await request.get("/fr/labs/pendulum")).status()).toBe(404);
  for (const path of ["/_next/static/missing.js", "/zh/missing.txt"])
    expect((await request.get(path)).status()).toBe(404);
  for (const path of [
    "/LICENSE.txt",
    "/THIRD_PARTY_NOTICES.txt",
    "/google845b412e18b99e6e.html",
    "/social-card.png",
  ])
    expect((await request.get(path)).status()).toBe(200);
  await context.close();
});
test("same-language client navigation requests valid RSC files and updates metadata", async ({
  page,
}) => {
  const requests: {
    url: string;
    status: number;
    headers: Record<string, string>;
  }[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes(".txt"))
      requests.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
      });
  });
  await page.goto("/zh/");
  await page.evaluate(() => {
    (window as unknown as { marker: number }).marker = 42;
  });
  await page.locator('a[href="/zh/labs/pendulum"]').click();
  await ready(page);
  expect(
    await page.evaluate(
      () => (window as unknown as { marker?: number }).marker,
    ),
  ).toBe(42);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    siteOrigin + "/zh/labs/pendulum",
  );
  await page.locator('a[href="/zh/learn/pendulum"]').first().click();
  await expect(page.locator("main h2")).toHaveCount(9);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    siteOrigin + "/zh/learn/pendulum",
  );
  await page.goBack();
  await ready(page);
  expect(requests.length).toBeGreaterThan(0);
  for (const response of requests) {
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"] ?? "").not.toContain("immutable");
    expect(response.headers["content-type"]).toContain("text/plain");
  }
  const script = await page
    .locator('script[src*="/_next/static/"]')
    .first()
    .getAttribute("src");
  const asset = await page.request.get(script!);
  expect(asset.headers()["cache-control"]).toContain("immutable");
  expect(errors).toEqual([]);
});
test("paused and playing language switches preserve state through backward and forward history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/labs/pendulum?source=test#diagram");
  await ready(page);
  await changeLength(page, "2");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  const time = await page.getByLabel("Simulation time").textContent();
  const transform = await page
    .locator("svg g[transform]")
    .getAttribute("transform");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("ja");
  await ready(page);
  await expect(page).toHaveURL(/\/ja\/labs\/pendulum\?source=test#diagram$/);
  await expect(page.locator("#number-length")).toHaveValue("2");
  await expect(page.getByLabel("シミュレーション時間")).toHaveText(time!);
  expect(
    (await page.locator("svg g[transform]").getAttribute("transform"))!.split(
      " ",
    )[0],
  ).toBe(transform!.split(" ")[0]);
  await page
    .getByRole("combobox", { name: "言語", exact: true })
    .selectOption("zh-CN");
  await ready(page);
  await expect(page.getByLabel("模拟时间")).toHaveText(time!);
  await page.goBack();
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.getByLabel("シミュレーション時間")).toHaveText(time!);
  await page.goForward();
  await ready(page);
  await expect(page.getByLabel("模拟时间")).toHaveText(time!);
  await page.getByRole("button", { name: "播放", exact: true }).click();
  await expect(page.getByLabel("模拟时间")).not.toHaveText(time!);
  await page
    .getByRole("combobox", { name: "语言", exact: true })
    .selectOption("en");
  await ready(page);
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const latest = await page.getByLabel("Simulation time").textContent();
  await page.goBack();
  await ready(page);
  await expect(page.getByLabel("模拟时间")).toHaveText(latest!);
  await expect(page.locator("#number-length")).toHaveValue("2");
  await page.goForward();
  await ready(page);
  await expect(page.getByLabel("Simulation time")).toHaveText(latest!);
  await expect(page.locator("head title")).toHaveCount(1);
  await expect(page.locator('head meta[name="description"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("refresh and direct visits start fresh; navigation and storage failures preserve the current experiment", async ({
  page,
}) => {
  await page.goto("/labs/pendulum");
  await ready(page);
  await changeLength(page, "2");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await page.route("**/ja/labs/pendulum", (route) => route.abort());
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("ja");
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Language could not",
  );
  await expect(page.locator("#number-length")).toHaveValue("2");
  await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.10 s");
  await page.unroute("**/ja/labs/pendulum");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Unavailable");
    };
  });
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("ja");
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Language could not",
  );
  await expect(page.locator("#number-length")).toHaveValue("2");
  await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.10 s");
  await page.reload();
  await ready(page);
  await expect(page.locator("#number-length")).toHaveValue("1");
  await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.00 s");
});
for (const language of languages)
  test(`${language.locale}: controls, proportional geometry, reset semantics, screenshot`, async ({
    page,
  }, info) => {
    await page.goto(language.prefix + "/labs/pendulum");
    await ready(page);
    const line = page.locator("svg g[transform] line");
    const length = async () =>
      Number(await line.getAttribute("y2")) -
      Number(await line.getAttribute("y1"));
    await changeLength(page, "0.5");
    const short = await length();
    await changeLength(page, "2");
    expect((await length()) / short).toBeCloseTo(4);
    await page
      .getByRole("button", { name: language.play, exact: true })
      .click();
    await expect(page.getByLabel(language.time)).not.toHaveText("t = 0.00 s");
    await page
      .getByRole("button", { name: language.reset, exact: true })
      .click();
    await expect(page.getByLabel(language.time)).toHaveText("t = 0.00 s");
    await expect(page.locator("#number-length")).toHaveValue("2");
    await page
      .getByRole("button", { name: language.resetParams, exact: true })
      .click();
    await expect(page.locator("#number-length")).toHaveValue("1");
    await expect(
      page.getByRole("button", { name: language.play, exact: true }),
    ).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`pendulum-${language.locale}.png`),
      fullPage: true,
    });
  });
test("BFCache restores the latest shared state and allows another language switch", async () => {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({
    channel: "chrome",
    ignoreDefaultArgs: ["--disable-back-forward-cache"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    const shows: boolean[] = [];
    (window as unknown as { shows: boolean[] }).shows = shows;
    addEventListener("pageshow", (event) => shows.push(event.persisted));
  });
  try {
    await page.goto("http://127.0.0.1:4173/labs/pendulum");
    await ready(page);
    await changeLength(page, "2");
    await page.getByRole("button", { name: "Step", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Language", exact: true })
      .selectOption("ja");
    await ready(page);
    await page.getByRole("button", { name: "1 ステップ", exact: true }).click();
    await page.goBack({ waitUntil: "commit" });
    await ready(page);
    expect(
      await page.evaluate(
        () => (window as unknown as { shows: boolean[] }).shows,
      ),
    ).toContain(true);
    await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.20 s");
    await expect(
      page.getByRole("combobox", { name: "Language", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("combobox", { name: "Language", exact: true })
      .selectOption("zh-CN");
    await ready(page);
    await expect(page.getByLabel("模拟时间")).toHaveText("t = 0.20 s");
  } finally {
    await browser.close();
  }
});
test("invalid, expired and mismatched handoffs cannot apply old state to a direct visit", async ({
  page,
}) => {
  await page.goto("/labs/pendulum");
  await ready(page);
  await changeLength(page, "2");
  // A pending record alone does not authorize restoring it; the navigation token must match.
  await page.evaluate(() => {
    sessionStorage.setItem(
      "feynman:session:pending",
      JSON.stringify({
        id: "invalid",
        token: "wrong",
        target: "/ja/labs/pendulum",
        at: Date.now(),
        previousName: "",
      }),
    );
  });
  await page.goto("/ja/labs/pendulum");
  await ready(page);
  await expect(page.locator("#number-length")).toHaveValue("1");
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("feynman:session:pending"),
    ),
  ).toBeNull();
  await page.evaluate(() => {
    sessionStorage.setItem(
      "feynman:session:pending",
      JSON.stringify({
        id: "invalid",
        token: "old",
        target: "/labs/pendulum",
        at: Date.now() - 360000,
        previousName: "",
      }),
    );
    window.name = "feynman:handoff:old";
  });
  await page.goto("/labs/pendulum");
  await ready(page);
  await expect(page.locator("#number-length")).toHaveValue("1");
  await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.00 s");
});
test("home loads only lightweight cards and no lesson or scene code", async ({
  page,
}) => {
  const responses: import("@playwright/test").Response[] = [];
  page.on("response", (response) => {
    if (
      response.url().includes("/_next/static/") &&
      response.url().includes(".js")
    )
      responses.push(response);
  });
  await page.goto("/");
  await page.getByRole("searchbox").fill("period");
  await expect(page.locator('a[href="/labs/pendulum"]')).toBeVisible();
  const scripts = (await Promise.all(responses.map((r) => r.text()))).join(
    "\n",
  );
  expect(scripts).not.toContain("lessonHtml");
  expect(scripts).not.toContain("TextureLoader");
  expect(scripts).not.toContain("小角近似");
  expect(scripts).not.toContain(catalog[0].content.ja.lessonHtml);
  await page.locator('a[href="/labs/pendulum"]').hover();
  expect(responses.map((r) => r.url()).join("\n")).not.toContain(".webp");
});
test("rapid repeated language switches consume each handoff once without resetting the model", async ({
  page,
}) => {
  await page.goto("/labs/pendulum");
  await ready(page);
  await changeLength(page, "2");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  for (const locale of ["ja", "zh-CN", "en", "ja", "en"]) {
    await page.getByRole("combobox").selectOption(locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await ready(page);
    await expect(page.locator("#number-length")).toHaveValue("2");
    await expect(
      page.locator("[aria-label]").filter({ hasText: /^t = 0\.10 s$/ }),
    ).toHaveCount(1);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("feynman:session:pending"),
      ),
    ).toBeNull();
  }
});
test("localized home search, no-JS language links and fixed screenshots remain usable", async ({
  page,
  browser,
}, info) => {
  for (const { locale, prefix } of languages) {
    await page.goto(prefix + "/");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: info.outputPath(`home-${locale}.png`),
      fullPage: true,
    });
    await page.getByRole("searchbox").fill(locale === "en" ? "period" : "周期");
    await expect(
      page.locator(`a[href="${prefix}/labs/pendulum"]`),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage();
    await staticPage.goto("http://127.0.0.1:4173/");
    await staticPage.getByRole("link", { name: "中文", exact: true }).click();
    await expect(staticPage).toHaveURL(/\/zh\/$/);
    await expect(staticPage.locator("html")).toHaveAttribute("lang", "zh-CN");
  } finally {
    await context.close();
  }
});
test("storage-disabled browsers can use the model and receive clear language-switch feedback", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Unavailable");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Unavailable");
    };
  });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/labs/pendulum");
    await ready(page);
    await page.getByRole("button", { name: "Step", exact: true }).click();
    await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.10 s");
    await page
      .getByRole("combobox", { name: "Language", exact: true })
      .selectOption("ja");
    await expect(page.locator('p[role="alert"]')).toContainText(
      "Language could not",
    );
    await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.10 s");
  } finally {
    await context.close();
  }
});

for (const slug of ["function-transform", "day-night"])
  test(`${slug}: language navigation preserves parameters, model time and playback`, async ({
    page,
  }) => {
    await page.goto("/labs/" + slug);
    await ready(page);
    const field = slug === "day-night" ? "latitude" : "h";
    await page.locator("#number-" + field).fill("2");
    await page.locator("#number-" + field).press("Enter");
    if (slug === "day-night")
      await page.getByRole("button", { name: "Step", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Language", exact: true })
      .selectOption("ja");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await ready(page);
    await expect(page.locator("#number-" + field)).toHaveValue("2");
    if (slug === "day-night") {
      await expect(page.getByLabel("シミュレーション時間")).toHaveText(
        "t = 0.10 s",
      );
      await page.getByRole("button", { name: "再生", exact: true }).click();
    } else
      await expect(
        page.getByRole("button", { name: "再生", exact: true }),
      ).toHaveCount(0);
    await page
      .getByRole("combobox", { name: "言語", exact: true })
      .selectOption("zh-CN");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await ready(page);
    await expect(page.locator("#number-" + field)).toHaveValue("2");
    if (slug === "day-night")
      await expect(
        page.getByRole("button", { name: "暂停", exact: true }),
      ).toBeEnabled();
  });
test("a document failure after the navigation preflight can return to the complete source session", async ({
  page,
}) => {
  await page.goto("/labs/pendulum");
  await ready(page);
  await changeLength(page, "2");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await page.route("**/ja/labs/pendulum", (route) =>
    route.request().resourceType() === "document"
      ? route.abort()
      : route.continue(),
  );
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("ja");
  await page.waitForURL("**/ja/labs/pendulum", { waitUntil: "commit" }).catch(error => expect(String(error)).toMatch(/ERR_FAILED|ERR_ABORTED/));
  await expect(page).toHaveURL("chrome-error://chromewebdata/");
  await page.goBack({ waitUntil: "commit" });
  await ready(page);
  await expect(page.locator("#number-length")).toHaveValue("2");
  await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.10 s");
});
test("same-language notes navigation and back keeps the original session while a refresh starts fresh", async ({
  page,
}) => {
  await page.goto("/labs/pendulum");
  await ready(page);
  await changeLength(page, "2");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await page
    .getByRole("link", { name: "Full exploration notes ↗", exact: true })
    .click();
  await expect(page.locator("main h2")).toHaveCount(9);
  await page.goBack();
  await ready(page);
  await expect(page.locator("#number-length")).toHaveValue("2");
  await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.10 s");
  await page.reload();
  await ready(page);
  await expect(page.locator("#number-length")).toHaveValue("1");
  await expect(page.getByLabel("Simulation time")).toHaveText("t = 0.00 s");
});
test('an expired matching navigation handoff reports failure instead of silently starting a fresh experiment', async ({page}) => {
  await page.goto('/');
  await page.evaluate(()=>{
    sessionStorage.setItem('feynman:session:pending',JSON.stringify({ id:crypto.randomUUID(),token:'expired',target:'/labs/pendulum',at:Date.now()-31000,previousName:'' }));
    window.name='feynman:handoff:expired';
  });
  await page.goto('/labs/pendulum');
  await expect(page.locator('p[role="alert"]')).toContainText('could not be restored');
  await expect(page.getByRole('button',{name:'Play',exact:true})).toBeDisabled();
  await page.reload(); await ready(page);
});
