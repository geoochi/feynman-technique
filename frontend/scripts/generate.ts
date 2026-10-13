import { mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { scanCatalog } from "./catalog";
import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";
import { locales } from "../packages/i18n/locales";
const root = process.cwd();
// Keep provenance in source manifests; public catalog data omits personal authors.
const labs = (await scanCatalog(root)).map((lab) => ({ ...lab, authors: [] }));
await mkdir(resolve(root, "apps/web/generated"), { recursive: true });
await mkdir(resolve(root, "public/previews"), { recursive: true });
// Ship the original license with the static distribution; the root file is authoritative.
await copyFile(
  resolve(root, "../LICENSE"),
  resolve(root, "public/LICENSE.txt"),
);
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
      ({
        content,
        formulas,
        preloadImages,
        stateSchema,
        parameters,
        presets,
        question,
        ...lab
      }) => lab,
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
  resolve(root, "apps/web/generated/controllers.ts"),
  `// Generated from validated local manifests.\nimport type { LabController } from '../../../packages/core/types';\nexport const controllerLoaders: Record<string, () => Promise<LabController>> = {\n${labs.map((l) => `  ${JSON.stringify(l.slug)}: () => import(${JSON.stringify("../../../" + l.path + "/controller")}),`).join("\n")}\n};\n`,
);
await writeFile(
  resolve(root, "apps/web/generated/scenes.ts"),
  `// Generated from validated local manifests.\nimport type { SceneModule } from '../../../packages/core/types';\nexport const sceneLoaders: Record<string, () => Promise<SceneModule>> = {\n${labs.map((l) => `  ${JSON.stringify(l.slug)}: () => import(${JSON.stringify("../../../" + l.path + "/view")}),`).join("\n")}\n};\n`,
);
await rm(resolve(root, "apps/web/generated/registry.ts"), { force: true });
const imageImports: string[] = [],
  imageEntries: string[] = [];
for (const lab of labs) {
  const names = (lab.preloadImages ?? []).map((file) => {
    const name = `image${imageImports.length}`;
    imageImports.push(
      `import ${name} from ${JSON.stringify("../../../" + lab.path + "/" + file)};`,
    );
    return `${name}.src`;
  });
  imageEntries.push(`${JSON.stringify(lab.slug)}: [${names.join(",")}],`);
}
await writeFile(
  resolve(root, "apps/web/generated/preloads.ts"),
  `// Server-only static image URLs.\nimport 'server-only';\n${imageImports.join("\n")}\nexport const imagePreloads: Record<string,string[]> = {${imageEntries.join("\n")}};\n`,
);
for (const lab of labs)
  await copyFile(
    resolve(root, lab.path, lab.preview),
    resolve(root, "public/previews", `${lab.slug}.svg`),
  );
console.log(`Validated and registered ${labs.length} labs.`);

// Compile exactly the validated state schemas at build time; the browser needs no schema compiler.
const validatorCompiler = new Ajv({
  strict: true,
  code: { source: true, esm: true },
});
const names: Record<string, string> = {};
for (const [i, lab] of labs.entries()) {
  const id = `feynman-state-${i}`;
  validatorCompiler.addSchema(lab.stateSchema, id);
  names[`state${i}`] = id;
}
await writeFile(
  resolve(root, "apps/web/generated/validators.js"),
  standaloneCode(validatorCompiler, names),
);
await writeFile(
  resolve(root, "apps/web/generated/validators.d.ts"),
  Object.keys(names)
    .map((name) => `export const ${name}: (value: unknown) => boolean;`)
    .join("\n"),
);
await writeFile(
  resolve(root, "apps/web/generated/state-validators.ts"),
  `// Generated from validated state schemas.\nimport { ${Object.keys(names).join(",")} } from './validators.js';\nexport const stateValidators: Record<string, { schema: Record<string, unknown>; validate: (value: unknown) => boolean }> = {\n${labs.map((lab, i) => `${JSON.stringify(lab.id)}: {schema:${JSON.stringify(lab.stateSchema)},validate:state${i}},`).join("\n")}\n};\n`,
);
