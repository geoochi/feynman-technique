import type {
  Netlist,
  NetlistParameter,
  ParamValue,
  ParamValues,
  ParameterSchema,
  Params,
} from "./types";
const ID_PATTERN = /^[a-z][a-z0-9-]{0,15}$/;
const KINDS = ["resistor", "source", "wire"] as const;
const ELEMENT_KEYS = ["id", "kind", "a", "b", "value"];

/** Structured values are copied so snapshots never share state with a live edit. */
export function cloneParamValue<T extends ParamValue>(value: T): T {
  if (typeof value === "number") return value;
  return { elements: value.elements.map((element) => ({ ...element })) } as T;
}
export function cloneParamValues(values: ParamValues): ParamValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, cloneParamValue(value)]),
  );
}
function inRange(
  value: unknown,
  range: { minimum: number; maximum: number },
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= range.minimum &&
    value <= range.maximum
  );
}
export function validateNetlist(
  value: unknown,
  spec: NetlistParameter,
): asserts value is Netlist {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error(`${spec.title}必须是网表对象。`);
  const object = value as Record<string, unknown>;
  if (
    Object.keys(object).length !== 1 ||
    !Array.isArray(object.elements)
  )
    throw new Error(`${spec.title}只能包含 elements 字段。`);
  const elements = object.elements as unknown[];
  if (elements.length < 1 || elements.length > spec.maxElements)
    throw new Error(
      `${spec.title}的元件数量应在 1–${spec.maxElements} 之间。`,
    );
  const ids = new Set<string>();
  let sources = 0;
  for (const raw of elements) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw))
      throw new Error(`${spec.title}的元件必须是对象。`);
    const element = raw as Record<string, unknown>;
    const keys = Object.keys(element);
    if (
      keys.length !== ELEMENT_KEYS.length ||
      !ELEMENT_KEYS.every((key) => keys.includes(key))
    )
      throw new Error(`${spec.title}的元件字段不完整或包含未知字段。`);
    if (
      typeof element.id !== "string" ||
      !ID_PATTERN.test(element.id) ||
      ids.has(element.id)
    )
      throw new Error(`${spec.title}的元件 id 不合法或重复。`);
    ids.add(element.id);
    if (!KINDS.includes(element.kind as (typeof KINDS)[number]))
      throw new Error(`${spec.title}的元件种类不合法。`);
    for (const key of ["a", "b"] as const) {
      const node = element[key];
      if (
        !Number.isInteger(node) ||
        (node as number) < 0 ||
        (node as number) >= spec.maxNodes
      )
        throw new Error(
          `${spec.title}的节点编号应为 0–${spec.maxNodes - 1} 的整数。`,
        );
    }
    if (element.a === element.b)
      throw new Error(`${spec.title}的元件两端不能是同一个节点。`);
    if (element.kind === "wire") {
      if (element.value !== 0)
        throw new Error(`${spec.title}的导线取值必须为 0。`);
    } else if (element.kind === "resistor") {
      if (!inRange(element.value, spec.resistance))
        throw new Error(
          `${spec.title}的电阻应在 ${spec.resistance.minimum}–${spec.resistance.maximum} ${spec.resistance.unit} 之间。`,
        );
    } else {
      sources += 1;
      if (!inRange(element.value, spec.emf))
        throw new Error(
          `${spec.title}的电动势应在 ${spec.emf.minimum}–${spec.emf.maximum} ${spec.emf.unit} 之间。`,
        );
    }
  }
  if (sources !== 1)
    throw new Error(`${spec.title}必须恰好包含一个理想电压源。`);
}
export function defaults(schema: ParameterSchema): ParamValues {
  return Object.fromEntries(
    Object.entries(schema.properties).map(([key, spec]) => [
      key,
      cloneParamValue(spec.default),
    ]),
  );
}
export function validateParams(
  value: unknown,
  schema: ParameterSchema,
): asserts value is ParamValues {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("参数必须是对象。");
  const object = value as Record<string, unknown>;
  if (
    Object.keys(object).length !== schema.required.length ||
    Object.keys(object).some((key) => !Object.hasOwn(schema.properties, key))
  )
    throw new Error("参数包含未知字段或缺少字段。");
  for (const [key, spec] of Object.entries(schema.properties)) {
    const raw = object[key];
    if (spec.type === "netlist") {
      validateNetlist(raw, spec);
      continue;
    }
    if (
      typeof raw !== "number" ||
      !Number.isFinite(raw) ||
      raw < spec.minimum ||
      raw > spec.maximum
    )
      throw new Error(
        `${spec.title}应在 ${spec.minimum}–${spec.maximum} ${spec.unit} 之间。`,
      );
  }
}
/** The numeric projection that models, views and readouts receive. */
export function numericParams(
  values: ParamValues,
  schema: ParameterSchema,
): Params {
  const numeric: Params = {};
  for (const [key, spec] of Object.entries(schema.properties))
    if (spec.type === "number") numeric[key] = values[key] as number;
  return numeric;
}
/** The structured netlist parameter, when the case declares one. */
export function netlistParam(
  values: ParamValues,
  schema: ParameterSchema,
): Netlist | null {
  for (const [key, spec] of Object.entries(schema.properties))
    if (spec.type === "netlist") {
      const value = values[key];
      return value && typeof value === "object" ? (value as Netlist) : null;
    }
  return null;
}
