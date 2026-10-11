import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { scanCatalog } from "../scripts/catalog";
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
    expect(labs).toHaveLength(3);
    expect(
      labs.every((l) => l.contentHash.length === 16 && l.chapters.length === 7),
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
    await expect(scanCatalog(root)).rejects.toThrow("纵向伸缩");
  });
  it("sanitizes Markdown and unsafe link protocols", async () => {
    const path = resolve(dir(), "lesson.zh-CN.md");
    await writeFile(
      path,
      (await readFile(path, "utf8")) +
        "\n<script>alert(1)</script>\n[unsafe](javascript:alert(1))",
    );
    const labs = await scanCatalog(root);
    const html = labs.find((l) => l.slug === "function-transform")!.lessonHtml;
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });
});
