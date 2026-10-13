import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { scanCatalog } from "../scripts/catalog";
import { locales, chapterIds } from "../packages/i18n/locales";
let root: string;
beforeEach(async () => {
  root = await mkdtemp(resolve(tmpdir(), "feynman-catalog-"));
  await cp(resolve("examples"), resolve(root, "examples"), { recursive: true });
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
const dir = () => resolve(root, "examples/math/function-transform");
async function modify(
  file: string,
  change: (data: Record<string, any>) => void,
) {
  const path = resolve(dir(), file),
    data = JSON.parse(await readFile(path, "utf8"));
  change(data);
  await writeFile(path, JSON.stringify(data));
}
describe("catalog validation", () => {
  it("registers local modules with content fingerprints", async () => {
    const labs = await scanCatalog(root);
    expect(labs.map(l => l.slug).sort()).toEqual(["day-night", "derivative-tangent", "function-transform", "pendulum"]);
    expect(
      labs.every(
        (l) =>
          l.contentHash.length === 16 &&
          locales.every((locale) => l.content[locale].chapters.length === 7),
      ),
    ).toBe(true);
  });
  it("rejects duplicate slugs", async () => {
    await modify("manifest.json", (m) => {
      m.slug = "pendulum";
    });
    await expect(scanCatalog(root)).rejects.toThrow("重复");
  });
  it("rejects executable entries outside the approved local file", async () => {
    await modify("manifest.json", (m) => {
      m.entry = "../../remote.tsx";
    });
    await expect(scanCatalog(root)).rejects.toThrow("manifest.json");
  });
  it("rejects out-of-range presets", async () => {
    await modify("presets.json", (p) => {
      p[0].params.a = 999;
    });
    await expect(scanCatalog(root)).rejects.toThrow("Vertical scale");
  });
  it("sanitizes Markdown and unsafe link protocols", async () => {
    const path = resolve(dir(), "lesson.zh-CN.md");
    await writeFile(
      path,
      (await readFile(path, "utf8")) +
        "\n<script>alert(1)</script>\n[unsafe](javascript:alert(1))",
    );
    const labs = await scanCatalog(root);
    const html = labs.find((l) => l.slug === "function-transform")!.content[
      "zh-CN"
    ].lessonHtml;
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });
  it("requires complete translations and localized parameter labels", async () => {
    await modify("manifest.json", (m) => {
      delete m.summary.ja;
    });
    await expect(scanCatalog(root)).rejects.toThrow("manifest.json");
  });
  it("accepts absent SEO copy and a complete override for just one page kind", async () => {
    await modify("manifest.json", (m) => { delete m.seo; });
    expect((await scanCatalog(root)).find((l) => l.slug === "function-transform")!.seo).toBeUndefined();
    await modify("manifest.json", (m) => {
      m.seo = { lesson: {
        title: { en: "Lesson", "zh-CN": "讲解", ja: "解説" },
        description: { en: "Explanation", "zh-CN": "说明", ja: "説明" },
      } };
    });
    expect((await scanCatalog(root)).find((l) => l.slug === "function-transform")!.seo!.lesson!.title.ja).toBe("解説");
  });
  it.each(["experiment", "lesson"])("rejects missing languages, blank text and unknown fields in %s SEO copy", async (kind) => {
    const original = JSON.parse(await readFile(resolve(dir(), "manifest.json"), "utf8"));
    for (const locale of locales)
      for (const field of ["title", "description"]) {
        for (const value of [undefined, "", "   "]) {
          const changed = structuredClone(original);
          changed.seo[kind][field][locale] = value;
          await writeFile(resolve(dir(), "manifest.json"), JSON.stringify(changed));
          await expect(scanCatalog(root)).rejects.toThrow("manifest.json");
        }
      }
    const changed = structuredClone(original);
    changed.seo[kind].keywords = "extra";
    await writeFile(resolve(dir(), "manifest.json"), JSON.stringify(changed));
    await expect(scanCatalog(root)).rejects.toThrow("manifest.json");
  });
  it("rejects incomplete parameter labels", async () => {
    await modify("parameters.schema.json", (p) => {
      delete p.properties.h.labels.en;
    });
    await expect(scanCatalog(root)).rejects.toThrow("参数 h 不完整");
  });
  it("builds stable chapter IDs and a separate search index for each language", async () => {
    const labs = await scanCatalog(root);
    const earth = labs.find((l) => l.slug === "day-night")!;
    for (const locale of locales)
      expect(
        earth.content[locale].chapters.map((chapter) => chapter.id),
      ).toEqual(chapterIds);
    expect(earth.content.en.searchText).toContain("rotation");
    expect(earth.content.en.searchText).not.toContain("自转");
    expect(earth.content.ja.searchText).toContain("自転");
    expect(earth.content["zh-CN"].searchText).toContain("自转");
  });
});

describe('build-time formulas', () => {
  it('requires three translations and rejects invalid expressions before rendering', async () => {
    await modify('formulas.json', f => { delete f.default.ja; });
    await expect(scanCatalog(root)).rejects.toThrow('formula');
  });
  it('uses MathML and excludes unsafe trusted commands from generated markup', async () => {
    await modify('formulas.json', f => { f.default.en = String.raw`\href{javascript:alert(1)}{x}`; });
    const labs=await scanCatalog(root); const formula=labs.find(l=>l.slug==='function-transform')!.formulas.default.en;
    expect(formula.html).toContain('<math'); expect(formula.html).not.toContain('href="javascript:');
  });
});
