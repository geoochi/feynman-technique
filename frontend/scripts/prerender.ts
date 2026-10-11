import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import type { Lab } from "../packages/core/types";
const root = process.cwd(),
  dist = resolve(root, "dist");
const template = await readFile(resolve(dist, "index.html"), "utf8");
const labs = JSON.parse(
  await readFile(resolve(root, "apps/web/generated/catalog.json"), "utf8"),
) as Lab[];
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
function escape(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
try {
  const { render } = (await server.ssrLoadModule(
    "/apps/web/entry-server.tsx",
  )) as { render: (path: string) => string };
  const pages = [
    {
      route: "/",
      file: "index.html",
      title: "Feynman · 让知识发生",
      description: "通过可操作的可视化实验，理解数学、物理与地球运动。",
    },
    {
      route: "/contribute",
      file: "contribute.html",
      title: "参与贡献 · Feynman",
      description: "把你的理解变成别人的起点。",
    },
    {
      route: "/404",
      file: "404.html",
      title: "页面未找到 · Feynman",
      description: "返回目录，开始一次探索。",
    },
    ...labs.flatMap((l) =>
      ["labs", "learn"].map((section) => ({
        route: `/${section}/${l.slug}`,
        file: `${section}/${l.slug}.html`,
        title: `${l.title["zh-CN"]} · Feynman`,
        description: l.summary["zh-CN"],
      })),
    ),
  ];
  for (const page of pages) {
    const html = template
      .replace("<!--app-->", render(page.route))
      .replace(/<title>.*?<\/title>/, `<title>${escape(page.title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/>/,
        `<meta name="description" content="${escape(page.description)}"/>`,
      );
    const path = resolve(dist, page.file);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, html);
  }
  console.log(
    `Prerendered ${pages.length} static pages. No runtime server required.`,
  );
} finally {
  await server.close();
}
