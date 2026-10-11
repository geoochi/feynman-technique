import { mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { scanCatalog } from "./catalog";
import { locales } from "../packages/i18n/locales";
const root = process.cwd();
// Keep provenance in private manifests; public data and bundles omit personal authors.
const labs = (await scanCatalog(root)).map((lab) => ({ ...lab, authors: [] }));
await mkdir(resolve(root, "apps/web/generated"), { recursive: true });
await mkdir(resolve(root, "public/previews"), { recursive: true });
await writeFile(
  resolve(root, "apps/web/generated/catalog.json"),
  JSON.stringify(labs, null, 2) + "\n",
);
await writeFile(
  resolve(root, "apps/web/generated/catalog.ts"),
  `// Generated from validated manifests.\nimport type { Lab } from '../../../packages/core/types';\nexport const catalog: Lab[] = ${JSON.stringify(labs, null, 2)};\n`,
);
await writeFile(
  resolve(root, "public/catalog.json"),
  JSON.stringify(
    labs.map(
      ({ content, stateSchema, parameters, presets, question, ...lab }) => lab,
    ),
    null,
    2,
  ) + "\n",
);
for (const locale of locales)
  await writeFile(
    resolve(root, `public/search-index.${locale}.json`),
    JSON.stringify(
      labs.map((l) => ({ slug: l.slug, text: l.content[locale].searchText })),
    ) + "\n",
  );
await rm(resolve(root, "public/search-index.json"), { force: true });
await writeFile(
  resolve(root, "apps/web/generated/registry.ts"),
  `// Generated from validated local manifests; do not edit.\nimport type { LabModule } from '../../../packages/core/types';\nexport const loaders: Record<string, () => Promise<LabModule>> = {\n${labs.map((l) => `  ${JSON.stringify(l.slug)}: () => import(${JSON.stringify("../../../" + l.path + "/view")}),`).join("\n")}\n};\n`,
);
for (const lab of labs)
  await copyFile(
    resolve(root, lab.path, lab.preview),
    resolve(root, "public/previews", `${lab.slug}.svg`),
  );
console.log(`Validated and registered ${labs.length} labs.`);
