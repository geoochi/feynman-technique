// P1 full-document language navigation under the same mobile throttling as P0.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.argv[2] ?? "http://127.0.0.1:4173";
const output =
  process.argv[3] ?? "test-results-next-performance/navigation.json";
const browser = await chromium.launch({ channel: "chrome" });
const samples = [];
try {
  for (let run = 1; run <= 5; run++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      locale: "en-US",
      timezoneId: "Asia/Shanghai",
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 200000,
        uploadThroughput: 93750,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.goto(origin + "/labs/pendulum");
      await page.locator("[data-controls-ready=true]").waitFor();
      await page.getByRole("button", { name: "Step", exact: true }).click();
      const startedAt = await page.evaluate(
        () => performance.timeOrigin + performance.now(),
      );
      await page
        .getByRole("combobox", { name: "Language", exact: true })
        .selectOption("ja");
      await page.waitForURL("**/ja/labs/pendulum");
      await page.locator("[data-controls-ready=true]").waitFor();
      await page.waitForFunction(() => performance.getEntriesByName("feynman:controls-ready").length > 0);
      const metrics = await page.evaluate(() => ({
        restoredAt:
          performance.timeOrigin +
          performance.getEntriesByName("feynman:controls-ready")[0].startTime,
        documentResponseStartMs:
          performance.getEntriesByType("navigation")[0].responseStart,
        resources: performance
          .getEntriesByType("resource")
          .map((r) => ({
            url: r.name,
            transferBytes: r.transferSize,
            encodedBytes: r.encodedBodySize,
          })),
      }));
      samples.push({
        run,
        switchToRestoredMs: metrics.restoredAt - startedAt,
        ...metrics,
        time: await page.getByLabel("シミュレーション時間").textContent(),
      });
      console.log(
        JSON.stringify({
          run,
          switchToRestoredMs: metrics.restoredAt - startedAt,
        }),
      );
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await mkdir(output.slice(0, output.lastIndexOf("/")), { recursive: true });
  await writeFile(
    output,
    JSON.stringify(
      {
        browser: browser.version(),
        viewport: { width: 390, height: 844 },
        dpr: 1,
        cpuSlowdown: 4,
        latencyMs: 150,
        downloadBitsPerSecond: 1600000,
        cache:
          "fresh context per run; shared assets may be cached for the destination",
        metric:
          "selection through full-document navigation to validated state restoration; includes automation dispatch",
        samples,
      },
      null,
      2,
    ) + "\n",
  );
}
