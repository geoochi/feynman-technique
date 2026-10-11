import { describe, expect, it } from "vitest";
import { model, integrate, energy, smallAnglePeriod } from "./model";
const p = { length: 1, gravity: 9.81, angle: 0.1 };
describe("nonlinear pendulum", () => {
  it("leaves the equilibrium motionless", () => {
    expect(integrate({ theta: 0, omega: 0 }, p, 1 / 120)).toEqual({
      theta: 0,
      omega: 0,
    });
  });
  it("matches the small angle solution over one period", () => {
    const params = { ...p, angle: 0.001 };
    let s = model.initial(params);
    const dt = 1 / 120;
    for (let i = 0; i < 240; i++) s = integrate(s, params, dt);
    expect(s.theta).toBeCloseTo(
      params.angle * Math.cos(Math.sqrt(p.gravity / p.length) * 2),
      7,
    );
  });
  it("keeps energy within 1e-5 relative error for 100 seconds at the stiffest allowed parameters", () => {
    const params = { length: 0.2, gravity: 20, angle: 1.39 };
    let s = model.initial(params);
    const e = energy(s, params);
    for (let i = 0; i < 12000; i++) s = integrate(s, params, 1 / 120);
    expect(Math.abs(energy(s, params) / e - 1)).toBeLessThan(1e-5);
  });
  it("converges when the integration step is halved", () => {
    const params = { ...p, angle: 1.3 };
    const solve = (n: number) => {
      let s = model.initial(params);
      for (let i = 0; i < n; i++) s = integrate(s, params, 1 / n);
      return s.theta;
    };
    const fine = solve(3840);
    expect(Math.abs(solve(480) - fine)).toBeLessThan(
      Math.abs(solve(240) - fine) / 10,
    );
  });
  it("has sqrt length and inverse sqrt gravity scaling", () => {
    expect(
      smallAnglePeriod({ ...p, length: 4 }) / smallAnglePeriod(p),
    ).toBeCloseTo(2, 12);
    expect(
      smallAnglePeriod({ ...p, gravity: 4 * p.gravity }) / smallAnglePeriod(p),
    ).toBeCloseTo(0.5, 12);
  });
});
