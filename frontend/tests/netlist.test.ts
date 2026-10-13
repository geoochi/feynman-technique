import { describe, expect, it } from "vitest";
import {
  cloneParamValues,
  defaults,
  netlistParam,
  numericParams,
  validateParams,
} from "../packages/core/parameters";
import { Simulation } from "../packages/runtime/simulation";
import type {
  Model,
  Netlist,
  NetlistElement,
  ParamValues,
  ParameterSchema,
} from "../packages/core/types";

const resistor = (
  id: string,
  a: number,
  b: number,
  value: number,
): NetlistElement => ({ id, kind: "resistor", a, b, value });
const wire = (id: string, a: number, b: number): NetlistElement => ({
  id,
  kind: "wire",
  a,
  b,
  value: 0,
});
const source = (
  id: string,
  a: number,
  b: number,
  value: number,
): NetlistElement => ({ id, kind: "source", a, b, value });
const circuit = (...elements: NetlistElement[]): Netlist => ({ elements });
/** Deliberately malformed payloads that the validator must reject. */
const broken = (element: unknown): Netlist => ({
  elements: [element as NetlistElement],
});

// A numeric parameter and a structured one, mirroring what a real case declares.
const schema: ParameterSchema = {
  type: "object",
  additionalProperties: false,
  required: ["gain", "circuit"],
  properties: {
    gain: {
      type: "number",
      title: "Gain (g)",
      labels: { en: "Gain (g)", "zh-CN": "增益（g）", ja: "利得（g）" },
      default: 2,
      minimum: 0,
      maximum: 10,
      step: 0.1,
      unit: "×",
    },
    circuit: {
      type: "netlist",
      title: "Circuit",
      labels: { en: "Circuit", "zh-CN": "电路", ja: "回路" },
      default: circuit(
        wire("w1", 0, 1),
        resistor("r1", 1, 2, 100),
        source("s1", 2, 0, 6),
      ),
      maxNodes: 6,
      maxElements: 8,
      resistance: { minimum: 1, maximum: 1000, step: 10, unit: "Ω" },
      emf: { minimum: -24, maximum: 24, step: 1, unit: "V" },
    },
  },
};
const config = {
  id: "physics.demo",
  version: "0.1.0",
  parameters: schema,
  stateSchema: {},
  chapterCount: 7,
};
const model: Model = {
  initial: () => ({ value: 0 }),
  step: (state) => ({ value: state.value }),
};
const valid: ParamValues = {
  gain: 2,
  circuit: circuit(
    wire("w1", 0, 1),
    resistor("r1", 1, 2, 100),
    source("s1", 2, 0, 6),
  ),
};

describe("netlist parameter validation", () => {
  it("accepts a well formed circuit", () => {
    expect(() => validateParams(valid, schema)).not.toThrow();
  });
  it("rejects missing or extra sources, bad nodes, duplicate ids, wrong values and unknown fields", () => {
    const cases: unknown[] = [
      // no source at all
      { gain: 2, circuit: circuit(wire("w1", 0, 1), resistor("r1", 1, 2, 100)) },
      // two sources
      {
        gain: 2,
        circuit: circuit(resistor("r1", 0, 1, 10), source("s1", 1, 0, 6), source("s2", 1, 0, 3)),
      },
      // node out of range
      { gain: 2, circuit: broken({ id: "s1", kind: "source", a: 0, b: 9, value: 6 }) },
      // both ends on the same node
      { gain: 2, circuit: broken({ id: "s1", kind: "source", a: 1, b: 1, value: 6 }) },
      // duplicate element id
      {
        gain: 2,
        circuit: circuit(resistor("r1", 0, 1, 10), { id: "r1", kind: "source", a: 1, b: 0, value: 6 }),
      },
      // unknown element kind
      { gain: 2, circuit: broken({ id: "s1", kind: "battery", a: 0, b: 1, value: 6 }) },
      // unknown element field
      {
        gain: 2,
        circuit: broken({ id: "s1", kind: "source", a: 0, b: 1, value: 6, extra: 1 }),
      },
      // a wire must carry value 0
      { gain: 2, circuit: broken({ id: "w1", kind: "wire", a: 0, b: 1, value: 5 }) },
      // resistance out of range
      { gain: 2, circuit: broken({ id: "r1", kind: "resistor", a: 0, b: 1, value: 5000 }) },
      // EMF out of range
      { gain: 2, circuit: broken({ id: "s1", kind: "source", a: 0, b: 1, value: 600 }) },
      // too many elements
      {
        gain: 2,
        circuit: circuit(
          ...Array.from({ length: 9 }, (_, i) => resistor(`r${i}`, 0, 1, 10)),
          source("s1", 1, 0, 6),
        ),
      },
      // missing elements
      { gain: 2, circuit: { elements: [] } },
      // not an object
      { gain: 2, circuit: [] },
      // unknown param
      { gain: 2, circuit: valid.circuit, other: 1 },
      // numeric param out of range
      { gain: 99, circuit: valid.circuit },
    ];
    for (const value of cases)
      expect(() => validateParams(value, schema)).toThrow();
  });
  it("copies defaults so a live edit cannot corrupt the schema", () => {
    const values = defaults(schema);
    (values.circuit as Netlist).elements.push(resistor("r2", 2, 0, 50));
    expect((defaults(schema).circuit as Netlist).elements).toHaveLength(3);
  });
  it("projects numeric parameters and the netlist separately", () => {
    expect(numericParams(valid, schema)).toEqual({ gain: 2 });
    expect(netlistParam(valid, schema)?.elements).toHaveLength(3);
    expect(netlistParam({ gain: 2 }, schema)).toBe(null);
  });
});

describe("netlist parameters in the snapshot", () => {
  it("round-trips a structured circuit without sharing state", () => {
    const a = new Simulation(config, model, () => true);
    a.setParams({
      gain: 3,
      circuit: circuit(wire("w1", 0, 1), resistor("r1", 1, 2, 200), source("s1", 2, 0, 9)),
    });
    expect(a.numeric).toEqual({ gain: 3 });
    const snapshot = a.snapshot();
    // The snapshot is a deep copy: mutating it must not reach the simulation.
    (snapshot.params.circuit as Netlist).elements.push(resistor("r2", 2, 0, 50));
    expect((a.params.circuit as Netlist).elements).toHaveLength(3);
    const b = new Simulation(config, model, () => true);
    b.restore(JSON.parse(JSON.stringify(a.snapshot())));
    expect(b.snapshot()).toEqual(a.snapshot());
    expect(b.numeric).toEqual({ gain: 3 });
    expect((b.params.circuit as Netlist).elements[1].value).toBe(200);
  });
  it("rejects a snapshot whose circuit is invalid", () => {
    const a = new Simulation(config, model, () => true);
    const before = a.snapshot();
    expect(() =>
      a.restore({
        ...before,
        params: { ...before.params, circuit: circuit(wire("w1", 0, 1)) },
      }),
    ).toThrow();
    expect(a.snapshot()).toEqual(before);
  });
  it("keeps cloned values independent from the caller", () => {
    const original: ParamValues = {
      gain: 1,
      circuit: circuit(wire("w1", 0, 1), source("s1", 1, 0, 6)),
    };
    const copy = cloneParamValues(original);
    (original.circuit as Netlist).elements.push(resistor("r9", 0, 1, 5));
    expect((copy.circuit as Netlist).elements).toHaveLength(2);
  });
});
