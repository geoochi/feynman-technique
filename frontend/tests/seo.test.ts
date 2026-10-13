import { beforeAll, describe, expect, it } from "vitest";
import { scanCatalog } from "../scripts/catalog";
import { pageMetadata } from "../packages/seo/metadata";
import { escapeHtml, safeJsonLd } from "../packages/seo/escape";
import { readSiteConfig } from "../scripts/site-config";
import { seoFiles } from "../scripts/seo-files";
import { locales, localizedPath } from "../packages/i18n/locales";
import { translate } from "../packages/i18n/I18n";
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
    expect(experiment.title).toBe("单摆模拟器：摆长、重力与周期 · Feynman");
    expect(lesson.title).toBe("单摆周期：公式、摆长关系与小角度近似 · Feynman");
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
  it("uses localized case copy for both page kinds and their structured data", () => {
    for (const lab of labs)
      for (const locale of locales)
        for (const [route, kind] of [["labs", "experiment"], ["learn", "lesson"]] as const) {
          const page = pageMetadata(localizedPath(locale, `/${route}/${lab.slug}`), labs, production);
          expect(page.title).toBe(lab.seo![kind]!.title[locale]);
          expect(page.description).toBe(lab.seo![kind]!.description[locale]);
          const graph = page.structuredData!["@graph"] as Record<string, any>[];
          expect(graph[0].name).toBe(page.title);
          expect(graph[0].description).toBe(page.description);
          expect(graph[0].mainEntity.description).toBe(page.description);
        }
  });
  it("falls back independently for an absent SEO configuration or page kind", () => {
    const lab = labs.find((item) => item.slug === "pendulum")!;
    for (const locale of locales) {
      const withoutSeo = { ...lab, seo: undefined };
      const lessonOnly = { ...lab, seo: { lesson: lab.seo!.lesson } };
      const experimentOnly = { ...lab, seo: { experiment: lab.seo!.experiment } };
      for (const [route, kind, titleKey, descriptionKey] of [
        ["labs", "experiment", "seoExperimentTitle", "seoExperimentDescription"],
        ["learn", "lesson", "seoLessonTitle", "seoLessonDescription"],
      ] as const) {
        const pathname = localizedPath(locale, `/${route}/${lab.slug}`);
        const fallback = pageMetadata(pathname, [withoutSeo], production);
        expect(fallback.title).toBe(translate(locale, titleKey, { title: lab.title[locale] }));
        expect(fallback.description).toBe(`${lab.summary[locale]} ${translate(locale, descriptionKey)}`);
        const partial = kind === "experiment" ? lessonOnly : experimentOnly;
        expect(pageMetadata(pathname, [partial], production)).toEqual(fallback);
      }
    }
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
  it("lists all canonical content pages, with no fabricated dates or priorities", () => {
    const { sitemap, robots } = seoFiles(labs, production);
    expect(sitemap!.match(/<loc>/g)).toHaveLength(locales.length * (1 + 2 * labs.length));
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
    expect(readSiteConfig({}, true).origin).toBe("https://www.feynman-technique.com");
    expect(seoFiles(labs, preview).sitemap).toBeUndefined();
    expect(seoFiles(labs, preview).robots).toBe("User-agent: *\nAllow: /\n");
    expect(pageMetadata("/", labs, preview).indexable).toBe(false);
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
    expect(escapeHtml(page.title)).toContain("&lt;img");
    const data = safeJsonLd(page.structuredData);
    expect(data).not.toContain("</script>");
    expect(JSON.parse(data).name).toBe(page.structuredData.name);
  });
});
