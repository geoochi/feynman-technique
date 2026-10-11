import { readdir, readFile, realpath } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import Ajv from "ajv";
import { marked } from "marked";
import sanitize from "sanitize-html";
import { defaults, validateParams } from "../packages/core/parameters";
import type { Lab, Manifest, ParameterSchema } from "../packages/core/types";
import manifestSchema from "./manifest.schema.json";
const ajv = new Ajv({ strict: true });
const validateManifest = ajv.compile(manifestSchema);
export async function scanCatalog(root: string): Promise<Lab[]> {
  const examples = await realpath(resolve(root, "examples"));
  const manifests: string[] = [];
  async function walk(dir: string) {
    for (const file of (await readdir(dir, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      if (file.isSymbolicLink())
        throw new Error(`案例目录不能使用符号链接：${dir}/${file.name}`);
      if (file.isDirectory()) await walk(resolve(dir, file.name));
      else if (file.name === "manifest.json") manifests.push(dir);
    }
  }
  await walk(examples);
  const ids = new Set<string>(),
    slugs = new Set<string>(),
    labs: Lab[] = [];
  for (const dir of manifests) {
    const read = async (file: string) => {
      const path = await realpath(resolve(dir, file));
      if (!path.startsWith(dir + sep)) throw new Error(`资源路径越界：${file}`);
      const bytes = await readFile(path);
      if (bytes.length > 1024 * 1024)
        throw new Error(`资源超过 1 MiB：${file}`);
      return bytes.toString("utf8");
    };
    const sources: string[] = [];
    const source = async (file: string) => {
      const text = await read(file);
      sources.push(text);
      return text;
    };
    const m = JSON.parse(await source("manifest.json")) as Manifest;
    if (!validateManifest(m))
      throw new Error(
        `${dir}/manifest.json: ${ajv.errorsText(validateManifest.errors)}`,
      );
    if (ids.has(m.id) || slugs.has(m.slug))
      throw new Error(`重复 id 或 slug：${m.id}`);
    ids.add(m.id);
    slugs.add(m.slug);
    const parameters = JSON.parse(
      await source(m.parameterSchema),
    ) as ParameterSchema;
    if (
      parameters.type !== "object" ||
      parameters.additionalProperties !== false ||
      !Array.isArray(parameters.required) ||
      !parameters.properties ||
      parameters.required.length !==
        Object.keys(parameters.properties).length ||
      new Set(parameters.required).size !== parameters.required.length ||
      parameters.required.some((k) => !Object.hasOwn(parameters.properties, k))
    )
      throw new Error(`${m.id}: 参数 schema 结构错误`);
    for (const [key, p] of Object.entries(parameters.properties)) {
      if (
        !/^[a-z][a-zA-Z0-9]*$/.test(key) ||
        p.type !== "number" ||
        !p.title ||
        typeof p.unit !== "string" ||
        ![p.default, p.minimum, p.maximum, p.step].every(Number.isFinite) ||
        p.step <= 0 ||
        p.minimum > p.maximum
      )
        throw new Error(`${m.id}: 参数 ${key} 不完整`);
    }
    validateParams(defaults(parameters), parameters);
    const stateSchema = JSON.parse(await source(m.snapshotSchema));
    const checkState = ajv.compile(stateSchema);
    if (
      !checkState ||
      stateSchema.type !== "object" ||
      stateSchema.additionalProperties !== false ||
      !Array.isArray(stateSchema.required) ||
      !stateSchema.properties ||
      Object.keys(stateSchema.properties).length !==
        stateSchema.required.length ||
      stateSchema.required.some(
        (key: string) => !Object.hasOwn(stateSchema.properties, key),
      ) ||
      Object.values(stateSchema.properties).some((p: unknown) => {
        const prop = p as { type?: string; minimum?: number; maximum?: number };
        return (
          prop.type !== "number" ||
          !Number.isFinite(prop.minimum) ||
          !Number.isFinite(prop.maximum) ||
          prop.minimum! > prop.maximum!
        );
      })
    )
      throw new Error(`${m.id}: 状态 schema 必须拒绝未知字段`);
    const presets = JSON.parse(await source("presets.json")) as Lab["presets"];
    if (
      !Array.isArray(presets) ||
      presets.length < 1 ||
      presets.length > 30 ||
      new Set(presets.map((p) => p.id)).size !== presets.length
    )
      throw new Error(`${m.id}: 预设不合法`);
    for (const p of presets) {
      if (typeof p.title !== "string" || !p.title || typeof p.id !== "string")
        throw new Error(`${m.id}: 预设缺少名称或 id`);
      validateParams(p.params, parameters);
    }
    const question = JSON.parse(
      await source("questions.json"),
    ) as Lab["question"];
    if (
      typeof question.prompt !== "string" ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.some((x) => typeof x !== "string") ||
      !Number.isInteger(question.answer) ||
      question.answer < 0 ||
      question.answer >= question.options.length ||
      typeof question.explanation !== "string"
    )
      throw new Error(`${m.id}: 自测题不合法`);
    await source(m.entry);
    await source("model.ts");
    await source("model.test.ts");
    await source("ATTRIBUTION.md");
    const preview = await source(m.preview);
    if (
      !preview.includes("<svg") ||
      /<script|<foreignObject|\son[a-z]+=|(?:href|src)=['"](?:https?:|data:)/i.test(
        preview,
      )
    )
      throw new Error(`${m.id}: SVG 封面必须是无脚本的本地图示`);
    const markdown = await source("lesson.zh-CN.md");
    const safeHtml = (text: string) =>
      sanitize(marked.parse(text, { async: false }), {
        allowedTags: sanitize.defaults.allowedTags.concat(["h1", "h2"]),
        allowedSchemes: ["https"],
        allowedAttributes: { a: ["href", "title"] },
      });
    const segments = markdown.split(/^## /m).slice(1);
    if (segments.length !== 7)
      throw new Error(
        `${m.id}: 讲解需包含问题、预测、操作、观察、解释、验证、延伸七章`,
      );
    const chapters = segments.map((segment, i) => {
      const newline = segment.indexOf("\n");
      return {
        id: `chapter-${i}`,
        title: segment.slice(0, newline).trim(),
        html: safeHtml(segment.slice(newline + 1)),
      };
    });
    const path = relative(root, dir).split(sep).join("/");
    labs.push({
      ...m,
      path,
      previewUrl: `/previews/${m.slug}.svg`,
      parameters,
      stateSchema,
      presets,
      question,
      chapters,
      lessonHtml: safeHtml(markdown),
      contentHash: createHash("sha256")
        .update(sources.join("\0"))
        .digest("hex")
        .slice(0, 16),
      searchText: [
        m.title["zh-CN"],
        m.summary["zh-CN"],
        ...m.tags,
        ...m.subjects,
      ]
        .join(" ")
        .toLowerCase(),
    });
  }
  return labs.filter((l) => l.status !== "draft");
}
