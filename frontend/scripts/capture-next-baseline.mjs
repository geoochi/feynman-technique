// Bind exported pages and fixed Chrome screenshots to the source tree.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import os from "node:os";
const origin = process.argv[2] ?? "http://127.0.0.1:4173";
const output = process.argv[3] ?? "test-results-next-baseline";
await mkdir(output, { recursive: true });
const catalog = JSON.parse(
  await readFile("apps/web/generated/catalog.json", "utf8"),
);
const browser = await chromium.launch({ channel: "chrome" });
const report = {
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  sourceStatus: execFileSync("git", ["status", "--short"], {
    encoding: "utf8",
  }),
  browser: browser.version(),
  node: process.version,
  platform: os.platform(),
  release: os.release(),
  dpr: 1,
  zoom: 1,
  browserLocale: "zh-CN",
  timezone: "Asia/Shanghai",
  state: "default parameters, paused at t=0",
  pages: [],
  screenshots: [],
};
try {
  for (const [prefix, locale] of [
    ["", "en"],
    ["/zh", "zh-CN"],
    ["/ja", "ja"],
  ]) {
    for (const path of [
      "/",
      "/404",
      ...catalog.flatMap((l) => [`/labs/${l.slug}`, `/learn/${l.slug}`]),
    ]) {
      const route = prefix + path;
      const response = await fetch(origin + route);
      const html = await response.text();
      report.pages.push({
        route,
        status: response.status,
        htmlSha256: createHash("sha256").update(html).digest("hex"),
        title: html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1],
        description: html.match(
          /<meta[^>]*name="description" content="(.*?)"/s,
        )?.[1],
        canonical: html.match(/<link[^>]*rel="canonical" href="(.*?)"/s)?.[1],
        robots: html.match(/<meta[^>]*name="robots" content="(.*?)"/s)?.[1],
        hreflang: [...html.matchAll(/<link[^>]*rel="alternate"[^>]+>/g)].map(
          (m) => m[0],
        ),
        jsonLd: html.match(
          /<script[^>]*type="application\/ld\+json">(.*?)<\/script>/s,
        )?.[1],
      });
    }
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        locale: "zh-CN",
        timezoneId: "Asia/Shanghai",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      for (const path of ["/", ...catalog.map((l) => `/labs/${l.slug}`)]) {
        await page.goto(origin + prefix + path);
        if (path !== "/")
          await page
            .locator(
              "#number-" +
                (path.endsWith("function-transform")
                  ? "a"
                  : path.endsWith("pendulum")
                    ? "length"
                    : "latitude"),
            )
            .waitFor();
        if (await page.locator("[data-controls-ready]").count()) {
          await page.locator("[data-controls-ready=true]").waitFor();
          if (path.endsWith("day-night"))
            await page.waitForFunction(() => performance.getEntriesByName("feynman:earth-ready").length > 0);
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        const file = `${locale}-${path.split("/").at(-1) || "home"}-${viewport.width}.png`;
        await page.screenshot({ path: `${output}/${file}`, fullPage: true });
        report.screenshots.push({
          file,
          locale,
          path,
          viewport,
          physicalViewport: viewport,
        });
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(
    `${output}/pages.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(
  `Saved ${report.pages.length} pages and ${report.screenshots.length} screenshots.`,
);
