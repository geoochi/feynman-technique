import { describe, expect, it } from "vitest";
import type { Netlist, NetlistElement } from "../../../packages/core/types";
import { model, solveCircuit, wireRoots } from "./model";

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
const byId = (netlist: Netlist, id: string) => {
  const result = solveCircuit(netlist);
  if (result.status !== "ok") throw new Error(`unexpected failure: ${result.code}`);
  return result.elements.find((e) => e.id === id)!;
};

describe("DC network solver: known solutions", () => {
  it("solves a series pair: R_eq = R₁ + R₂ and the resistors share the EMF", () => {
    // 12 V across 100 Ω + 200 Ω in series: I = 12/300 A, drops 4 V and 8 V.
    const netlist = circuit(source("s1", 1, 0, 12), resistor("r1", 1, 2, 100), resistor("r2", 2, 0, 200));
    const result = solveCircuit(netlist);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.nodeVoltages).toEqual([0, 12, 8]);
    const r1 = result.elements.find((e) => e.id === "r1")!;
    const r2 = result.elements.find((e) => e.id === "r2")!;
    const s = result.elements.find((e) => e.id === "s1")!;
    expect(r1.current).toBeCloseTo(0.04, 12);
    expect(r2.current).toBeCloseTo(0.04, 12);
    // The same current flows through both, positive from a to b.
    expect(r1.current).toBe(r2.current);
    expect(r1.voltage).toBeCloseTo(4, 12);
    expect(r2.voltage).toBeCloseTo(8, 12);
    // The source current is measured inside the source (a → b), so a source
    // that delivers reads negative.
    expect(s.current).toBeCloseTo(-0.04, 12);
    expect(s.voltage).toBeCloseTo(12, 12);
  });

  it("solves a parallel pair: 1/R_eq = 1/R₁ + 1/R₂ and the branches share the current", () => {
    // 12 V across 100 Ω ∥ 200 Ω: 0.12 A + 0.06 A, R_eq = 66.67 Ω.
    const netlist = circuit(source("s1", 1, 0, 12), resistor("r1", 1, 0, 100), resistor("r2", 1, 0, 200));
    const result = solveCircuit(netlist);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const r1 = result.elements.find((e) => e.id === "r1")!;
    const r2 = result.elements.find((e) => e.id === "r2")!;
    const s = result.elements.find((e) => e.id === "s1")!;
    expect(r1.voltage).toBeCloseTo(12, 12);
    expect(r2.voltage).toBeCloseTo(12, 12);
    expect(r1.current).toBeCloseTo(0.12, 12);
    expect(r2.current).toBeCloseTo(0.06, 12);
    // Total current equals the sum of the branch currents.
    expect(s.current).toBeCloseTo(-0.18, 12);
  });

  it("solves a divider: U₂ = E·R₂/(R₁ + R₂)", () => {
    const netlist = circuit(source("s1", 1, 0, 9), resistor("r1", 1, 2, 150), resistor("r2", 2, 0, 300));
    const r2 = byId(netlist, "r2");
    expect(r2.voltage).toBeCloseTo((9 * 300) / 450, 12);
    expect(r2.current).toBeCloseTo(9 / 450, 12);
  });

  it("is symmetric across a balanced bridge: the bridge current vanishes", () => {
    // Wheatstone bridge with five equal 100 Ω resistors: V₂ = V₃, I(r5) = 0.
    const bridge = circuit(
      source("s1", 1, 0, 10),
      resistor("r1", 1, 2, 100),
      resistor("r2", 2, 0, 100),
      resistor("r3", 1, 3, 100),
      resistor("r4", 3, 0, 100),
      resistor("r5", 2, 3, 100),
    );
    const result = solveCircuit(bridge);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.nodeVoltages[2]).toBeCloseTo(5, 12);
    expect(result.nodeVoltages[3]).toBeCloseTo(5, 12);
    const r5 = result.elements.find((e) => e.id === "r5")!;
    expect(Math.abs(r5.current)).toBeLessThan(1e-9);
    // Swapping the two symmetric arms swaps their readings and nothing else.
    const mirrored = circuit(
      source("s1", 1, 0, 10),
      resistor("r3", 1, 2, 100),
      resistor("r2", 2, 0, 100),
      resistor("r1", 1, 3, 100),
      resistor("r4", 3, 0, 100),
      resistor("r5", 2, 3, 100),
    );
    const m = solveCircuit(mirrored);
    if (m.status !== "ok") throw new Error("unexpected failure");
    const before = result.elements.find((e) => e.id === "r1")!;
    const after = m.elements.find((e) => e.id === "r1")!;
    expect(after.current).toBeCloseTo(result.elements.find((e) => e.id === "r3")!.current, 12);
    expect(before.current).toBeCloseTo(m.elements.find((e) => e.id === "r3")!.current, 12);
  });

  it("balances power: the sum of element powers is zero", () => {
    const netlist = circuit(
      source("s1", 1, 0, 12),
      wire("w1", 1, 2),
      resistor("r1", 2, 3, 100),
      resistor("r2", 3, 0, 200),
      resistor("r3", 2, 0, 400),
    );
    const result = solveCircuit(netlist);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.totalPower).toBeCloseTo(0, 12);
    // The source delivers, every resistor absorbs.
    const s = result.elements.find((e) => e.id === "s1")!;
    expect(s.power).toBeLessThan(0);
    for (const r of result.elements.filter((e) => e.kind === "resistor"))
      expect(r.power).toBeGreaterThan(0);
    // Wires carry no voltage and no power.
    const w1 = result.elements.find((e) => e.id === "w1")!;
    expect(w1.voltage).toBe(0);
    expect(w1.power).toBe(0);
  });

  it("routes the full loop current through a wire that joins two nodes", () => {
    // The wire extends node 1 to node 2; the loop current 9/(150+150) A flows
    // through it from 1 to 2 and returns through the resistors.
    const netlist = circuit(source("s1", 1, 0, 9), wire("w1", 1, 2), resistor("r1", 2, 3, 150), resistor("r2", 3, 0, 150));
    const result = solveCircuit(netlist);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.nodeVoltages[1]).toBeCloseTo(9, 12);
    expect(result.nodeVoltages[2]).toBeCloseTo(9, 12); // the wire makes them one node
    const w1 = result.elements.find((e) => e.id === "w1")!;
    const r1 = result.elements.find((e) => e.id === "r1")!;
    const s = result.elements.find((e) => e.id === "s1")!;
    expect(w1.current).toBeCloseTo(0.03, 12);
    expect(r1.current).toBeCloseTo(0.03, 12);
    expect(s.current).toBeCloseTo(-0.03, 12);
  });
});

describe("DC network solver: degenerate cases never produce NaN", () => {
  it("reports an open circuit: a dangling branch carries no current", () => {
    const netlist = circuit(source("s1", 1, 0, 6), resistor("r1", 1, 2, 100));
    const result = solveCircuit(netlist);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const r1 = result.elements.find((e) => e.id === "r1")!;
    expect(r1.current).toBeCloseTo(0, 12);
    expect(r1.voltage).toBeCloseTo(0, 12);
    // The dangling tip sits at the + node's potential; the whole EMF waits at
    // the open end.
    expect(result.nodeVoltages[2]).toBeCloseTo(6, 12);
    const s = result.elements.find((e) => e.id === "s1")!;
    expect(s.current).toBeCloseTo(0, 12);
    for (const value of [...result.nodeVoltages, ...result.elements.flatMap((e) => [e.voltage, e.current, e.power])])
      expect(Number.isFinite(value)).toBe(true);
  });

  it("rejects a source shorted by a wire", () => {
    const netlist = circuit(source("s1", 1, 0, 6), wire("w1", 1, 0), resistor("r1", 1, 0, 100));
    expect(solveCircuit(netlist)).toEqual({
      status: "error",
      code: "shorted-source",
    });
  });

  it("names a floating sub-network cut off from the reference", () => {
    // Nodes 3–4 hold a resistor island that touches nothing else.
    const netlist = circuit(source("s1", 1, 0, 6), resistor("r1", 1, 0, 100), resistor("r2", 3, 4, 50));
    expect(solveCircuit(netlist)).toEqual({
      status: "error",
      code: "floating-node",
      node: 3,
    });
  });

  it("fails when the source never closes a loop with the reference node", () => {
    // The source sits on nodes 1–2 while node 0's network only holds r2.
    const netlist = circuit(source("s1", 1, 2, 6), resistor("r1", 1, 2, 100), resistor("r2", 0, 5, 50));
    expect(solveCircuit(netlist)).toEqual({
      status: "error",
      code: "no-loop",
      node: 1,
    });
  });

  it("re-checks the exactly-one-source rule", () => {
    expect(solveCircuit(circuit(resistor("r1", 0, 1, 10)))).toEqual({
      status: "error",
      code: "not-one-source",
    });
    expect(
      solveCircuit(
        circuit(
          source("s1", 1, 0, 6),
          source("s2", 2, 0, 3),
          resistor("r1", 1, 0, 10),
          resistor("r2", 2, 0, 10),
        ),
      ),
    ).toEqual({ status: "error", code: "not-one-source" });
  });

  it("never leaks NaN from any degenerate input", () => {
    const cases = [
      circuit(source("s1", 1, 0, 6), resistor("r1", 1, 2, 100)),
      circuit(source("s1", 1, 0, 6), wire("w1", 1, 0)),
      circuit(source("s1", 1, 0, 6), resistor("r1", 1, 0, 100), resistor("r2", 3, 4, 50)),
      circuit(source("s1", 1, 2, 6), resistor("r1", 1, 2, 100), resistor("r2", 0, 5, 50)),
      circuit(source("s1", 1, 0, -6), wire("w1", 0, 2), resistor("r1", 1, 2, 1)),
    ];
    for (const netlist of cases) {
      const result = solveCircuit(netlist);
      if (result.status === "ok")
        for (const value of [
          ...result.nodeVoltages,
          result.totalPower,
          ...result.elements.flatMap((e) => [e.voltage, e.current, e.power]),
        ])
          expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe("wire merging helper", () => {
  it("merges chained wires and leaves unconnected nodes alone", () => {
    const roots = wireRoots(
      [wire("w1", 1, 2), wire("w2", 2, 3), resistor("r1", 3, 4, 10)],
      6,
    );
    expect(roots[1]).toBe(roots[2]);
    expect(roots[2]).toBe(roots[3]);
    expect(roots[0]).toBe(0);
    expect(roots[4]).toBe(4);
    expect(roots[5]).toBe(5);
  });
});

describe("model facade", () => {
  it("keeps one bounded state that never evolves", () => {
    expect(model.initial({})).toEqual({ value: 0 });
    let state = model.initial({});
    for (let i = 0; i < 240; i++) state = model.step(state, {}, 1 / 120);
    expect(state).toEqual({ value: 0 });
  });
});
