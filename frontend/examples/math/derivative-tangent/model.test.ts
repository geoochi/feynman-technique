import { describe, expect, it } from "vitest";
import { derivative, evaluate, model, secantSlope, tangentValue } from "./model";

describe("derivative of the square function", () => {
  it("matches known slopes and a horizontal tangent at the vertex", () => {
    expect(secantSlope(1, 1)).toBe(3);
    expect(secantSlope(1, -.5)).toBe(1.5);
    expect(secantSlope(-1, .5)).toBe(-1.5);
    expect(derivative(-1.5)).toBe(-3);
    expect(derivative(0)).toBe(0);
    expect(tangentValue(2, 1)).toBe(3);
    expect(tangentValue(-2, 0)).toBe(0);
  });
  it("does not substitute a derivative for the undefined zero-gap quotient", () => {
    for (const x of [-1.5, 0, 1, 1.5]) {
      expect(secantSlope(x, 0)).toBeNull();
      expect(secantSlope(x, -0)).toBeNull();
      expect(Number.isFinite(derivative(x))).toBe(true);
    }
  });
  it("secants pass through both sampled points across the parameter domain", () => {
    for (const x of [-1.5, -1, 0, .3, 1, 1.5])
      for (const h of [-1, -.5, -.01, .01, .5, 1]) {
        const predictedY = evaluate(x) + secantSlope(x, h)! * h;
        expect(predictedY).toBeCloseTo(evaluate(x + h), 12);
      }
  });
  it("converges from opposite sides with first-order slope error", () => {
    for (const x of [-1.5, 0, 1.5]) {
      for (const h of [1, .1, .01, .001]) {
        const right = secantSlope(x, h)! - derivative(x);
        const left = secantSlope(x, -h)! - derivative(x);
        expect(right).toBeGreaterThan(0);
        expect(left).toBeLessThan(0);
        expect(right).toBeCloseTo(-left, 12);
        expect(Math.abs(secantSlope(x, h / 2)! - derivative(x))).toBeCloseTo(right / 2, 12);
      }
    }
  });
  it("keeps tiny nonzero gaps finite without subtractive cancellation", () => {
    expect(secantSlope(1, 1e-12)).toBeGreaterThan(2);
    expect(secantSlope(1, -1e-12)).toBeLessThan(2);
  });
  it("has no time-dependent state", () => {
    const state = model.initial({ x0: 1, h: 1 });
    expect(model.step(state, { x0: -1, h: 0 }, 100)).toEqual({ phase: 0 });
  });
});
