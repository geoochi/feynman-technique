import type { ParameterSchema, Params } from "./types";
export function defaults(schema: ParameterSchema): Params {
  return Object.fromEntries(
    Object.entries(schema.properties).map(([key, spec]) => [key, spec.default]),
  );
}
export function validateParams(
  value: unknown,
  schema: ParameterSchema,
): asserts value is Params {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("参数必须是对象。");
  const object = value as Record<string, unknown>;
  if (
    Object.keys(object).length !== schema.required.length ||
    Object.keys(object).some((key) => !Object.hasOwn(schema.properties, key))
  )
    throw new Error("参数包含未知字段或缺少字段。");
  for (const [key, spec] of Object.entries(schema.properties)) {
    const number = object[key];
    if (
      typeof number !== "number" ||
      !Number.isFinite(number) ||
      number < spec.minimum ||
      number > spec.maximum
    )
      throw new Error(
        `${spec.title}应在 ${spec.minimum}–${spec.maximum} ${spec.unit} 之间。`,
      );
  }
}
