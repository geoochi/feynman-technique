import { describe, expect, it } from "vitest";
import { current, model, power } from "./model";

// The whole parameter range of parameters.schema.json: V in [1, 12], R in [1, 24].
const VOLTAGES = [1, 1.5, 3, 6, 9, 12];
const RESISTANCES = [1, 2, 3, 6, 12, 24];

describe("known solutions", () => {
  it("gives the textbook values for V = 6 V and R = 3 ohm", () => {
    expect(current(6, 3)).toBeCloseTo(2, 12);
    expect(power(6, 3)).toBeCloseTo(12, 12);
  });

  it("gives the textbook values for V = 12 V and R = 6 ohm", () => {
    // Doubling both the voltage and the resistance leaves the current unchanged
    // and doubles the power.
    expect(current(12, 6)).toBeCloseTo(2, 12);
    expect(power(12, 6)).toBeCloseTo(24, 12);
  });

  it("gives I = 1 A and P = 6 W for V = 6 V and R = 6 ohm", () => {
    expect(current(6, 6)).toBeCloseTo(1, 12);
    expect(power(6, 6)).toBeCloseTo(6, 12);
  });

  it("gives the maximum current of the frame, I = 6 A, at V = 6 V and R = 1 ohm", () => {
    expect(current(6, 1)).toBeCloseTo(6, 12);
    expect(power(6, 1)).toBeCloseTo(36, 12);
  });
});

describe("the power relation", () => {
  it("satisfies P = V I and P = V^2 / R across the whole parameter range", () => {
    for (const v of VOLTAGES)
      for (const r of RESISTANCES) {
        const i = current(v, r);
        expect(power(v, r)).toBeCloseTo(v * i, 9);
        expect(power(v, r)).toBeCloseTo((v * v) / r, 9);
        expect(i).toBeCloseTo(v / r, 12);
      }
  });

  it("quadruples the power and doubles the current when the voltage doubles at fixed R", () => {
    for (const r of RESISTANCES) {
      const i1 = current(3, r);
      const i2 = current(6, r);
      const p1 = power(3, r);
      const p2 = power(6, r);
      expect(i2).toBeCloseTo(2 * i1, 12);
      expect(p2).toBeCloseTo(4 * p1, 12);
    }
  });

  it("halves the current and the power when the resistance doubles at fixed V", () => {
    for (const v of VOLTAGES) {
      const i1 = current(v, 3);
      const i2 = current(v, 6);
      const p1 = power(v, 3);
      const p2 = power(v, 6);
      expect(i2).toBeCloseTo(i1 / 2, 12);
      expect(p2).toBeCloseTo(p1 / 2, 12);
    }
  });
});

describe("parameter boundaries", () => {
  it("keeps the current finite and positive over the whole documented range", () => {
    for (const v of VOLTAGES)
      for (const r of RESISTANCES) {
        const i = current(v, r);
        expect(Number.isFinite(i)).toBe(true);
        expect(Number.isNaN(i)).toBe(false);
        expect(i).toBeGreaterThan(0);
        // With R >= 1 ohm the current can never exceed the voltage itself.
        expect(i).toBeLessThanOrEqual(v);
      }
  });

  it("treats the smallest allowed resistance as a finite state, not a short circuit", () => {
    // R = 1 ohm is the lower bound in the schema; the current equals V.
    for (const v of VOLTAGES) {
      expect(current(v, 1)).toBeCloseTo(v, 12);
      expect(Number.isFinite(current(v, 1))).toBe(true);
    }
  });

  it("returns NaN, never Infinity, outside the documented domain R > 0", () => {
    for (const r of [0, -1]) {
      const i = current(6, r);
      const p = power(6, r);
      expect(Number.isNaN(i)).toBe(true);
      expect(Number.isNaN(p)).toBe(true);
      expect(Number.isFinite(i)).toBe(false);
      expect(i).not.toBe(Number.POSITIVE_INFINITY);
    }
  });

  it("increases the current and the power monotonically with the voltage", () => {
    const r = 3;
    const i = VOLTAGES.map((v) => current(v, r));
    const p = VOLTAGES.map((v) => power(v, r));
    for (let k = 1; k < VOLTAGES.length; k++) {
      expect(i[k]).toBeGreaterThan(i[k - 1]);
      expect(p[k]).toBeGreaterThan(p[k - 1]);
    }
  });

  it("decreases the current and the power monotonically with the resistance", () => {
    const v = 6;
    const i = RESISTANCES.map((r) => current(v, r));
    const p = RESISTANCES.map((r) => power(v, r));
    for (let k = 1; k < RESISTANCES.length; k++) {
      expect(i[k]).toBeLessThan(i[k - 1]);
      expect(p[k]).toBeLessThan(p[k - 1]);
    }
  });
});

describe("static model state", () => {
  it("starts at a bounded value and never evolves", () => {
    const params = { v: 6, r: 3 };
    const initial = model.initial(params);
    expect(initial).toEqual({ value: 0 });
    expect(initial.value).toBeGreaterThanOrEqual(0);
    expect(initial.value).toBeLessThanOrEqual(1);
    const after = model.step(initial, params, 1 / 120);
    expect(after).toEqual({ value: 0 });
  });
});
