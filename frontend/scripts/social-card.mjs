import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
const svg = await readFile(resolve("public/social-card.svg"), "utf8");
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}</style>${svg}`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve("public/social-card.png") });
} finally {
  await browser.close();
}
