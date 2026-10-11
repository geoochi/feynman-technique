import { beforeAll, describe, expect, it } from "vitest";
import { scanCatalog } from "../scripts/catalog";
import { pageMetadata } from "../packages/seo/metadata";
import { renderHead } from "../packages/seo/head";
import { readSiteConfig } from "../scripts/site-config";
import { seoFiles } from "../scripts/seo-files";
import type { Lab } from "../packages/core/types";
let labs: Lab[];
beforeAll(async () => {
  labs = await scanCatalog(process.cwd());
});
const production = { origin: "https://education.example", indexable: true };
describe("SEO output", () => {
  it("uses one clean canonical per language and distinct experiment/lesson metadata", () => {
    const experiment = pageMetadata(
      "/zh/labs/pendulum/?utm_source=test#view",
      labs,
      production,
    );
    const lesson = pageMetadata("/zh/learn/pendulum", labs, production);
    expect(experiment.canonical).toBe(
      "https://education.example/zh/labs/pendulum",
    );
    expect(experiment.title).toBe("单摆与时间 · 互动实验 · Feynman");
    expect(lesson.title).toBe("单摆与时间 · 原理与公式 · Feynman");
    expect(lesson.description).not.toBe(experiment.description);
    expect(experiment.alternates).toEqual([
      { language: "en", url: "https://education.example/labs/pendulum" },
      { language: "zh-CN", url: "https://education.example/zh/labs/pendulum" },
      { language: "ja", url: "https://education.example/ja/labs/pendulum" },
      { language: "x-default", url: "https://education.example/labs/pendulum" },
    ]);
    expect(pageMetadata("/ja/", labs, production).canonical).toBe(
      "https://education.example/ja/",
    );
  });
  it("excludes errors and unknown experiments from indexing and language annotations", () => {
    for (const path of [
      "/404",
      "/ja/404",
      "/labs/unknown",
      "/learn/unknown",
      "/no-page",
      "/contribute",
      "/zh/contribute",
      "/ja/contribute",
    ]) {
      const page = pageMetadata(path, labs, production);
      expect(page.indexable).toBe(false);
      expect(page.canonical).toBeUndefined();
      expect(page.alternates).toEqual([]);
      expect(page.structuredData).toBeUndefined();
    }
  });
  it("lists only the 21 canonical content pages, with no fabricated dates or priorities", () => {
    const { sitemap, robots } = seoFiles(labs, production);
    expect(sitemap!.match(/<loc>/g)).toHaveLength(21);
    expect(sitemap).toContain("https://education.example/ja/learn/day-night");
    expect(sitemap).not.toMatch(/404|contribute|lastmod|priority|changefreq|localhost/);
    expect(robots).toContain("Sitemap: https://education.example/sitemap.xml");
  });
  it("protects preview/development and honors an explicit indexing opt-out", () => {
    const preview = readSiteConfig(
      { WORKERS_CI: "1", WORKERS_CI_BRANCH: "feature", SITE_INDEXABLE: "true" },
      true,
    );
    expect(preview.indexable).toBe(false);
    expect(readSiteConfig({}, false).indexable).toBe(false);
    expect(readSiteConfig({ SITE_INDEXABLE: "false" }, true).indexable).toBe(
      false,
    );
    expect(
      readSiteConfig({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" }, true)
        .indexable,
    ).toBe(true);
    expect(readSiteConfig({ WORKERS_CI: "1" }, true).indexable).toBe(false);
    expect(readSiteConfig({}, true).indexable).toBe(true);
    expect(seoFiles(labs, preview).sitemap).toBeUndefined();
    expect(seoFiles(labs, preview).robots).toBe("User-agent: *\nAllow: /\n");
    expect(renderHead(pageMetadata("/", labs, preview))).toContain(
      'content="noindex, follow"',
    );
  });
  it("rejects domain configuration that would produce unsafe or wrong canonical addresses", () => {
    for (const SITE_URL of [
      "http://education.example",
      "https://user:password@education.example",
      "https://education.example/site",
      "https://education.example/?q=1",
      "https://education.example/#hash",
    ])
      expect(() => readSiteConfig({ SITE_URL }, true)).toThrow("HTTPS origin");
    expect(() => readSiteConfig({ SITE_INDEXABLE: "yes" }, true)).toThrow(
      "true or false",
    );
  });
  it("escapes head text and prevents closing tags in structured-data text", () => {
    const page = pageMetadata("/", labs, production);
    page.title = '<img src=x onerror="alert(1)">';
    page.structuredData = { name: "</script><script>unexpected()</script>" };
    const head = renderHead(page);
    expect(head).toContain("&lt;img");
    expect(head).not.toContain("<img");
    expect(head.match(/<script /g)).toHaveLength(1);
    const data = head.match(/<script[^>]*>(.*?)<\/script>/)![1];
    expect(JSON.parse(data).name).toBe(page.structuredData.name);
  });
});
