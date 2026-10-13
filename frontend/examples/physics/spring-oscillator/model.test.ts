import { describe, expect, it } from "vitest";
import { model, integrate, energy, period, angularFrequency } from "./model";
const p = { mass: 1, stiffness: 20, amplitude: 0.2 };
describe("ideal spring-mass oscillator", () => {
  it("leaves the equilibrium motionless", () => {
    expect(integrate({ x: 0, v: 0 }, p, 1 / 120)).toEqual({ x: 0, v: 0 });
  });
  it("matches the analytic cosine solution over one period", () => {
    const params = { ...p, amplitude: 0.2 };
    const dt = period(params) / 4000;
    let s = model.initial(params);
    for (let i = 0; i < 4000; i++) s = integrate(s, params, dt);
    expect(s.x).toBeCloseTo(0.2, 6);
    expect(s.v).toBeCloseTo(0, 6);
  });
  it("reaches zero displacement a quarter period after release, whatever the amplitude", () => {
    // Time to the first downward zero crossing of x = A cos(ωt), i.e. T/4.
    const quarter = (amplitude: number) => {
      const params = { ...p, amplitude };
      let s = model.initial(params);
      const dt = 1 / 10000;
      for (let i = 0; i < 200000; i++) {
        const next = integrate(s, params, dt);
        if (next.x <= 0) return (i + s.x / (s.x - next.x)) * dt;
        s = next;
      }
      throw new Error("the block never crossed equilibrium");
    };
    expect(quarter(0.5)).toBeCloseTo(quarter(0.01), 6);
    expect(quarter(0.2)).toBeCloseTo(period(p) / 4, 5);
  });
  it("keeps total energy within 1e-6 relative error for 100 s at the stiffest parameters", () => {
    const params = { mass: 0.2, stiffness: 100, amplitude: 0.5 };
    let s = model.initial(params);
    const e = energy(s, params);
    for (let i = 0; i < 12000; i++) s = integrate(s, params, 1 / 120);
    expect(Math.abs(energy(s, params) / e - 1)).toBeLessThan(1e-6);
  });
  it("exchanges potential and kinetic energy through the cycle", () => {
    const params = { ...p, amplitude: 0.2 };
    const released = model.initial(params);
    expect(energy(released, params)).toBeCloseTo(0.5 * 20 * 0.2 ** 2, 12);
    const atEquilibrium = integrate(released, params, period(params) / 4);
    expect(atEquilibrium.x).toBeCloseTo(0, 5);
    expect(energy(atEquilibrium, params)).toBeCloseTo(energy(released, params), 6);
  });
  it("has sqrt mass and inverse sqrt stiffness scaling", () => {
    expect(period({ ...p, mass: 4 }) / period(p)).toBeCloseTo(2, 12);
    expect(period({ ...p, stiffness: 4 * p.stiffness }) / period(p)).toBeCloseTo(
      0.5,
      12,
    );
    expect(angularFrequency({ ...p, stiffness: 4 * p.stiffness })).toBeCloseTo(
      2 * angularFrequency(p),
      12,
    );
  });
});
