import { test, expect } from "@playwright/test";

test("Workers serves canonical HTML routes, localized errors and hashed resource headers", async ({ request }) => {
  test.skip(!process.env.FEYNMAN_WORKERS, "Requires the Workers Static Assets runtime");
  for (const [alias, canonical] of [
    ["/labs/pendulum.html", "/labs/pendulum"],
    ["/labs/pendulum/", "/labs/pendulum"],
    ["/zh", "/zh/"],
    ["/ja/index.html", "/ja/"],
  ]) {
    const response = await request.get(alias + "?source=test", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe(canonical);
    expect(new URL(response.headers().location, response.url()).search).toBe("?source=test");
  }
  for (const [prefix, language] of [["", "en"], ["/zh", "zh-CN"], ["/ja", "ja"]]) {
    const response = await request.get(prefix + "/missing-page");
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain(`lang="${language}"`);
    expect(await response.text()).toContain('content="noindex, follow"');
  }
  const home = await request.get("/");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["x-robots-tag"]).toBeUndefined();
  expect(home.headers()["cache-control"]).not.toContain("immutable");
  const script = (await home.text()).match(/src="(\/assets\/[^\"]+\.js)"/)![1];
  const asset = await request.get(script);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["content-type"]).toContain("javascript");
  expect(asset.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  const missing = await request.get("/assets/missing.js");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["x-content-type-options"]).toBe("nosniff");
});
