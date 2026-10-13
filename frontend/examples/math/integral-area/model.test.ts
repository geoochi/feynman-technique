import { describe, expect, it } from "vitest";
import {
  error,
  evaluate,
  exactIntegral,
  model,
  riemannSum,
  samplePoint,
  samplingBias,
  subintervalCount,
  subintervalWidth,
} from "./model";

describe("definite integral of f(x) = x²", () => {
  it("matches known analytic values of (b³ − a³)/3", () => {
    expect(exactIntegral(0, 1)).toBeCloseTo(1 / 3, 12);
    expect(exactIntegral(0, 2)).toBeCloseTo(8 / 3, 12);
    expect(exactIntegral(-1, 1)).toBeCloseTo(2 / 3, 12);
    expect(exactIntegral(-2, 2)).toBeCloseTo(16 / 3, 12);
    expect(exactIntegral(1, 1)).toBe(0);
    expect(exactIntegral(3, -1)).toBeCloseTo(-28 / 3, 12);
  });

  it("evaluates f and the subinterval geometry", () => {
    expect(evaluate(3)).toBe(9);
    expect(subintervalCount(0)).toBe(1);
    expect(subintervalCount(8.4)).toBe(8);
    expect(subintervalWidth(0, 2, 8)).toBeCloseTo(0.25, 12);
    expect(samplePoint(0, 2, 4, 0, 0)).toBeCloseTo(0, 12);
    expect(samplePoint(0, 2, 4, 0, 0.5)).toBeCloseTo(0.25, 12);
    expect(samplePoint(0, 2, 4, 0, 1)).toBeCloseTo(0.5, 12);
    expect(samplePoint(0, 2, 4, 3, 1)).toBeCloseTo(2, 12);
  });

  it("reproduces known left, midpoint and right sums", () => {
    // [0, 1] with a single subinterval.
    expect(riemannSum(0, 1, 1, 0)).toBeCloseTo(0, 12);
    expect(riemannSum(0, 1, 1, 1)).toBeCloseTo(1, 12);
    expect(riemannSum(0, 1, 1, 0.5)).toBeCloseTo(0.25, 12);
    // [0, 1], n = 4, left sum = (0 + 1 + 4 + 9)/16 · 1/4 = 14/64 = 7/32.
    expect(riemannSum(0, 1, 4, 0)).toBeCloseTo(7 / 32, 12);
    // [0, 2], n = 8, left sum = 0.25³ · (0² + 1² + … + 7²) = 2.1875.
    expect(riemannSum(0, 2, 8, 0)).toBeCloseTo(2.1875, 12);
    // [0, 2], n = 8, right sum = 0.25³ · (1² + … + 8²) = 3.1875.
    expect(riemannSum(0, 2, 8, 1)).toBeCloseTo(3.1875, 12);
  });

  it("gives exactly zero for a zero-length interval", () => {
    for (const n of [1, 3, 8, 40])
      for (const s of [0, 0.25, 0.5, 1]) {
        expect(riemannSum(1, 1, n, s)).toBe(0);
        expect(exactIntegral(1, 1)).toBe(0);
        expect(error(1, 1, n, s)).toBe(0);
      }
  });

  it("brackets an increasing f between left and right sums", () => {
    const exact = exactIntegral(0, 2);
    for (const n of [1, 2, 8, 40]) {
      expect(riemannSum(0, 2, n, 0)).toBeLessThan(exact);
      expect(riemannSum(0, 2, n, 1)).toBeGreaterThan(exact);
      expect(error(0, 2, n, 0)).toBeLessThan(0);
      expect(error(0, 2, n, 1)).toBeGreaterThan(0);
    }
  });

  it("converges as n grows: first order for edges, second order for the midpoint", () => {
    const edge = (n: number) => Math.abs(error(0, 2, n, 0));
    const mid = (n: number) => Math.abs(error(0, 2, n, 0.5));
    expect(edge(80)).toBeLessThan(edge(8));
    expect(mid(80)).toBeLessThan(mid(8));
    // Doubling n halves the edge error and quarters the midpoint error.
    expect(edge(16) / edge(8)).toBeCloseTo(0.5, 1);
    expect(mid(16) / mid(8)).toBeCloseTo(0.25, 1);
    expect(edge(1000)).toBeLessThan(1e-2);
    expect(mid(1000)).toBeLessThan(1e-4);
    expect(mid(1000)).toBeLessThan(edge(1000));
  });

  it("keeps the signed convention and equals the geometric area for x² ≥ 0", () => {
    expect(exactIntegral(2, 0)).toBeCloseTo(-exactIntegral(0, 2), 12);
    expect(riemannSum(2, 0, 8, 1)).toBeCloseTo(-riemannSum(0, 2, 8, 0), 12);
    expect(riemannSum(0, 2, 8, 1)).toBeCloseTo(-riemannSum(2, 0, 8, 0), 12);
    // f(x) = x² never dips below the axis, so the signed integral is positive
    // and equals the geometric area for every interval tested.
    for (const [a, b] of [
      [-2, 0],
      [-1, 1],
      [-2, 2],
    ] as const) {
      expect(exactIntegral(a, b)).toBeGreaterThan(0);
      expect(riemannSum(a, b, 64, 0.5)).toBeGreaterThan(0);
    }
  });

  it("reports the sampling bias for a monotonic integrand", () => {
    expect(samplingBias(0, 2, 0)).toBe("under");
    expect(samplingBias(0, 2, 1)).toBe("over");
    expect(samplingBias(-2, 0, 0)).toBe("over");
    expect(samplingBias(-2, 0, 1)).toBe("under");
    expect(samplingBias(-1, 1, 0)).toBe("mixed");
    expect(samplingBias(0, 2, 0.5)).toBe("interior");
  });

  it("has no time-dependent state", () => {
    const state = model.initial({ a: 0, b: 2, n: 8, s: 0 });
    expect(state).toEqual({ phase: 0 });
    expect(model.step(state, { a: 1, b: -1, n: 4, s: 1 }, 100)).toEqual({
      phase: 0,
    });
  });
});
