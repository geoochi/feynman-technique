import { describe, expect, it } from "vitest";
import type { Params } from "../../../packages/core/types";
import {
  TWO_PI,
  cosineValue,
  initialPhase,
  model,
  period,
  phase,
  phaseAngle,
  sineValue,
  wrap,
} from "./model";

const params = (over: Partial<Params> = {}): Params => ({
  radius: 1,
  omega: 2,
  phase: 0,
  ...over,
});

describe("period T = 2π/ω", () => {
  it("matches the analytic value for the default parameters", () => {
    expect(period(params({ omega: 2 }))).toBeCloseTo(Math.PI, 12);
    expect(period(params({ omega: 1 }))).toBeCloseTo(TWO_PI, 12);
    expect(period(params({ omega: 4 }))).toBeCloseTo(Math.PI / 2, 12);
  });

  it("halves the period when ω doubles and is independent of the radius", () => {
    const slow = period(params({ omega: 1.5 }));
    const fast = period(params({ omega: 3 }));
    expect(fast).toBeCloseTo(slow / 2, 12);
    for (const radius of [0.5, 1, 2.5])
      expect(period(params({ omega: 1.5, radius }))).toBeCloseTo(slow, 12);
  });

  it("satisfies T·ω = 2π across the whole parameter range", () => {
    for (const omega of [0.5, 1, 2, 3.7, 6])
      expect(period(params({ omega })) * omega).toBeCloseTo(TWO_PI, 10);
  });

  it("covers the boundary angular speeds", () => {
    expect(period(params({ omega: 0.5 }))).toBeCloseTo(4 * Math.PI, 12);
    expect(period(params({ omega: 6 }))).toBeCloseTo(Math.PI / 3, 12);
  });
});

describe("sineValue y(t) = R sin(ωt + φ₀)", () => {
  it("hits the quarter-turn values exactly", () => {
    const p = params({ omega: 2, radius: 1, phase: 0 });
    expect(sineValue(0, p)).toBeCloseTo(0, 12);
    expect(sineValue(Math.PI / 4, p)).toBeCloseTo(1, 12); // sin(π/2)
    expect(sineValue(Math.PI / 2, p)).toBeCloseTo(0, 12); // sin(π)
    expect(sineValue((3 * Math.PI) / 4, p)).toBeCloseTo(-1, 12); // sin(3π/2)
  });

  it("starts at the initial phase when φ₀ = 90°", () => {
    const p = params({ omega: 1, radius: 1, phase: 90 });
    expect(sineValue(0, p)).toBeCloseTo(1, 12);
    expect(cosineValue(0, p)).toBeCloseTo(0, 12);
  });

  it("has amplitude equal to the radius", () => {
    for (const radius of [0.5, 1, 2.5]) {
      const p = params({ omega: 2, radius, phase: 0 });
      let peak = 0;
      for (let i = 0; i <= 4000; i++)
        peak = Math.max(peak, sineValue((i / 4000) * period(p), p));
      expect(peak).toBeCloseTo(radius, 6);
    }
  });

  it("repeats after exactly one period", () => {
    const p = params({ omega: 2.3, radius: 1.7, phase: 40 });
    const T = period(p);
    for (const t of [0, 0.1, 0.7, 1.9, 3.3])
      expect(sineValue(t + T, p)).toBeCloseTo(sineValue(t, p), 10);
  });

  it("turns counterclockwise: y rises while x falls just after t = 0", () => {
    const p = params({ omega: 1, radius: 1, phase: 0 });
    const t = 0.01;
    expect(sineValue(t, p)).toBeGreaterThan(0);
    expect(cosineValue(t, p)).toBeLessThan(1);
    expect(sineValue(t, p)).toBeCloseTo(Math.sin(t), 12);
  });
});

describe("phase angle and wrapping", () => {
  it("converts the degree parameter to radians", () => {
    expect(initialPhase(params({ phase: 90 }))).toBeCloseTo(Math.PI / 2, 12);
    expect(initialPhase(params({ phase: 180 }))).toBeCloseTo(Math.PI, 12);
    expect(initialPhase(params({ phase: 360 }))).toBeCloseTo(TWO_PI, 12);
  });

  it("wraps into [0, 2π) and never returns a value outside it", () => {
    expect(wrap(0)).toBe(0);
    expect(wrap(TWO_PI)).toBe(0);
    expect(wrap(3 * Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(wrap(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 12);
    for (let k = -50; k <= 50; k++) {
      const w = wrap((k * Math.PI) / 7);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(TWO_PI);
    }
  });

  it("agrees with the unwrapped angle modulo 2π", () => {
    const p = params({ omega: 3, phase: 30 });
    for (const t of [0, 0.25, 1, 2.5, 10]) {
      const difference = phaseAngle(t, p) - phase(t, p);
      expect(difference / TWO_PI).toBeCloseTo(Math.round(difference / TWO_PI), 9);
    }
  });
});

describe("model integration", () => {
  it("starts at the initial phase", () => {
    expect(model.initial(params({ phase: 0 }))).toEqual({ theta: 0 });
    expect(model.initial(params({ phase: 90 })).theta).toBeCloseTo(Math.PI / 2, 12);
    expect(model.initial(params({ phase: 360 })).theta).toBeCloseTo(0, 12);
  });

  it("advances by ω·dt in one fixed step of 1/120 s", () => {
    const p = params({ omega: 2, phase: 0 });
    const after = model.step({ theta: 0 }, p, 1 / 120);
    expect(after.theta).toBeCloseTo(2 / 120, 12);
  });

  it("advances by ω·0.1 rad over one UI step of 12 substeps", () => {
    const p = params({ omega: 2, phase: 0 });
    let state = model.initial(p);
    for (let i = 0; i < 12; i++) state = model.step(state, p, 1 / 120);
    expect(state.theta).toBeCloseTo(2 * 0.1, 10);
  });

  it("keeps the stored phase finite and inside [0, 2π) over a long run", () => {
    const p = params({ omega: 6, phase: 355 });
    let state = model.initial(p);
    for (let i = 0; i < 20000; i++) {
      state = model.step(state, p, 1 / 120);
      expect(Number.isFinite(state.theta)).toBe(true);
      expect(state.theta).toBeGreaterThanOrEqual(0);
      expect(state.theta).toBeLessThan(TWO_PI);
    }
  });

  it("has no truncation error: the numeric phase equals the analytic phase", () => {
    const p = params({ omega: 4.3, phase: 25 });
    let state = model.initial(p);
    for (let i = 0; i < 1200; i++) state = model.step(state, p, 1 / 120);
    // 1200 steps × 1/120 s = 10 s.
    expect(state.theta).toBeCloseTo(phase(10, p), 8);
  });
});
