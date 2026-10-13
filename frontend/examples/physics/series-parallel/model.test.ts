import { describe, expect, it } from "vitest";
import {
  branchCurrents,
  branchVoltages,
  model,
  parallelEquivalent,
  seriesCurrent,
  seriesEquivalent,
  totalPower,
} from "./model";

const params = { voltage: 6, resistance1: 100, resistance2: 200 };

describe("equivalent resistance", () => {
  it("adds the two resistances in series and is larger than either one", () => {
    expect(seriesEquivalent(100, 200)).toBe(300);
    expect(seriesEquivalent(10, 10)).toBe(20);
    expect(seriesEquivalent(1000, 10)).toBe(1010);
    expect(seriesEquivalent(100, 200)).toBeGreaterThan(200);
  });

  it("uses the reciprocal rule in parallel and is smaller than either one", () => {
    expect(parallelEquivalent(100, 200)).toBeCloseTo(200 / 3, 12);
    expect(parallelEquivalent(100, 100)).toBeCloseTo(50, 12);
    // 1/R_eq = 1/R₁ + 1/R₂ holds exactly across the whole range.
    for (const [r1, r2] of [
      [10, 10],
      [10, 1000],
      [100, 200],
      [300, 300],
      [1000, 500],
    ]) {
      const req = parallelEquivalent(r1, r2);
      expect(1 / req).toBeCloseTo(1 / r1 + 1 / r2, 12);
      expect(req).toBeLessThan(Math.min(r1, r2) + 1e-9);
    }
  });

  it("gives the parallel equivalent as one quarter of the series equivalent for equal resistors", () => {
    for (const r of [10, 100, 300, 1000]) {
      expect(parallelEquivalent(r, r)).toBeCloseTo(seriesEquivalent(r, r) / 4, 12);
    }
  });
});

describe("known solutions at V = 6 V, R₁ = 100 Ω, R₂ = 200 Ω", () => {
  it("solves the series circuit", () => {
    const req = seriesEquivalent(params.resistance1, params.resistance2);
    const i = seriesCurrent(params.voltage, params.resistance1, params.resistance2);
    expect(req).toBe(300);
    expect(i).toBeCloseTo(0.02, 12);
    const { v1, v2 } = branchVoltages(
      params.voltage,
      params.resistance1,
      params.resistance2,
    );
    expect(v1).toBeCloseTo(2, 12);
    expect(v2).toBeCloseTo(4, 12);
    expect(totalPower(params.voltage, req)).toBeCloseTo(0.12, 12);
  });

  it("solves the parallel circuit", () => {
    const { i1, i2 } = branchCurrents(
      params.voltage,
      params.resistance1,
      params.resistance2,
    );
    expect(i1).toBeCloseTo(0.06, 12);
    expect(i2).toBeCloseTo(0.03, 12);
    expect(i1 + i2).toBeCloseTo(0.09, 12);
    const req = parallelEquivalent(params.resistance1, params.resistance2);
    expect(req).toBeCloseTo(200 / 3, 12);
    expect(totalPower(params.voltage, req)).toBeCloseTo(0.54, 12);
  });
});

describe("Kirchhoff's laws", () => {
  it("keeps the series current the same everywhere and adds the branch voltages to the source voltage", () => {
    for (const [r1, r2] of [
      [10, 10],
      [100, 200],
      [1000, 10],
      [250, 750],
    ])
      for (const v of [1, 6, 12, 24]) {
        const i = seriesCurrent(v, r1, r2);
        const { v1, v2 } = branchVoltages(v, r1, r2);
        // KVL around the single series loop: V₁ + V₂ = V.
        expect(v1 + v2).toBeCloseTo(v, 12);
        // The same current I produces both voltages through Ohm's law.
        expect(v1 / r1).toBeCloseTo(i, 12);
        expect(v2 / r2).toBeCloseTo(i, 12);
      }
  });

  it("gives parallel branches the same voltage and adds their currents to the total", () => {
    for (const [r1, r2] of [
      [10, 10],
      [100, 200],
      [1000, 10],
      [250, 750],
    ])
      for (const v of [1, 6, 12, 24]) {
        const { i1, i2 } = branchCurrents(v, r1, r2);
        // Each branch carries the full source voltage.
        expect(i1 * r1).toBeCloseTo(v, 12);
        expect(i2 * r2).toBeCloseTo(v, 12);
        // KCL at a node: I = I₁ + I₂ = V / R_eq.
        const total = i1 + i2;
        expect(total).toBeCloseTo(v / parallelEquivalent(r1, r2), 12);
      }
  });

  it("conserves total power: the sum of the branch powers equals V² / R_eq", () => {
    for (const [r1, r2] of [
      [100, 200],
      [100, 100],
      [10, 1000],
    ])
      for (const v of [1, 6, 12, 24]) {
        const i = seriesCurrent(v, r1, r2);
        const { v1, v2 } = branchVoltages(v, r1, r2);
        expect(v1 * i + v2 * i).toBeCloseTo(
          totalPower(v, seriesEquivalent(r1, r2)),
          12,
        );
        const { i1, i2 } = branchCurrents(v, r1, r2);
        expect(v * i1 + v * i2).toBeCloseTo(
          totalPower(v, parallelEquivalent(r1, r2)),
          12,
        );
      }
  });
});

describe("symmetry", () => {
  it("does not depend on the order of the two resistors", () => {
    for (const [r1, r2] of [
      [10, 1000],
      [100, 300],
      [250, 750],
    ])
      for (const v of [1, 6, 24]) {
        expect(seriesEquivalent(r1, r2)).toBe(seriesEquivalent(r2, r1));
        expect(parallelEquivalent(r1, r2)).toBeCloseTo(
          parallelEquivalent(r2, r1),
          12,
        );
        expect(seriesCurrent(v, r1, r2)).toBeCloseTo(seriesCurrent(v, r2, r1), 12);
        const a = branchCurrents(v, r1, r2);
        const b = branchCurrents(v, r2, r1);
        expect(a.i1).toBeCloseTo(b.i2, 12);
        expect(a.i2).toBeCloseTo(b.i1, 12);
        // For equal resistors the two branches carry equal currents.
      }
  });

  it("splits the parallel current equally between equal resistors", () => {
    const { i1, i2 } = branchCurrents(6, 200, 200);
    expect(i1).toBeCloseTo(i2, 12);
    expect(i1).toBeCloseTo(0.03, 12);
  });

  it("divides the series voltage in proportion to the resistances", () => {
    const { v1, v2 } = branchVoltages(6, 100, 300);
    expect(v1 / v2).toBeCloseTo(100 / 300, 12);
    expect(v1).toBeCloseTo(1.5, 12);
    expect(v2).toBeCloseTo(4.5, 12);
  });
});

describe("static model state", () => {
  it("starts at a bounded value and never evolves", () => {
    const initial = model.initial(params);
    expect(initial).toEqual({ value: 0 });
    expect(initial.value).toBeGreaterThanOrEqual(0);
    expect(initial.value).toBeLessThanOrEqual(1);
    const after = model.step(initial, params, 1 / 120);
    expect(after).toEqual({ value: 0 });
  });
});
