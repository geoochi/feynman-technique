import { describe, expect, it } from "vitest";
import {
  imageDistance,
  imageHeight,
  imageKind,
  magnification,
  model,
} from "./model";

const f = 0.1;
const params = { u: 0.2, f, h: 0.03 };

describe("thin-lens equation and sign convention", () => {
  it("forms an equal, inverted, real image at u = 2f", () => {
    const u = 2 * f;
    expect(imageDistance(u, f)).toBeCloseTo(2 * f, 12);
    expect(magnification(u, f)).toBeCloseTo(-1, 12);
    expect(imageKind(u, f)).toBe("real");
    expect(imageHeight(u, f, 0.03)).toBeCloseTo(-0.03, 12);
  });

  it("forms an enlarged, inverted, real image for f < u < 2f", () => {
    const u = 1.5 * f;
    expect(imageDistance(u, f)).toBeCloseTo(3 * f, 12);
    expect(magnification(u, f)).toBeCloseTo(-2, 12);
    expect(imageKind(u, f)).toBe("real");
  });

  it("forms a diminished, inverted, real image for u > 2f", () => {
    const u = 4 * f;
    expect(imageDistance(u, f)).toBeCloseTo((4 / 3) * f, 12);
    expect(magnification(u, f)).toBeCloseTo(-1 / 3, 12);
    expect(imageKind(u, f)).toBe("real");
  });

  it("has no finite image at u = f, without dividing by zero", () => {
    const v = imageDistance(f, f);
    expect(Number.isFinite(v)).toBe(false);
    expect(v).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(v)).toBe(false);
    expect(imageKind(f, f)).toBe("infinite");
    expect(magnification(f, f)).toBe(Number.POSITIVE_INFINITY);
  });

  it("forms an upright, enlarged, virtual image on the object side for u < f", () => {
    const u = 0.5 * f;
    const v = imageDistance(u, f);
    expect(v).toBeCloseTo(-f, 12);
    expect(v).toBeLessThan(0);
    expect(magnification(u, f)).toBeCloseTo(2, 12);
    expect(imageKind(u, f)).toBe("virtual");
    expect(imageHeight(u, f, 0.03)).toBeCloseTo(0.06, 12);
  });
});

describe("analytic relations", () => {
  it("satisfies 1/u + 1/v = 1/f across the whole parameter range", () => {
    for (const u of [0.05, 0.08, 0.11, 0.15, 0.2, 0.35, 0.6, 0.8]) {
      for (const focal of [0.05, 0.1, 0.18, 0.25]) {
        if (Math.abs(u - focal) < 1e-9) continue; // u = f has no finite image
        const v = imageDistance(u, focal);
        expect(Number.isFinite(v)).toBe(true);
        expect(1 / u + 1 / v).toBeCloseTo(1 / focal, 9);
      }
    }
  });

  it("increases the image distance and magnification as the object approaches f from the far side", () => {
    const samples = [0.8, 0.5, 0.3, 0.2, 0.15, 0.12, 0.101];
    const v = samples.map((u) => imageDistance(u, f));
    const m = samples.map((u) => Math.abs(magnification(u, f)));
    for (let i = 1; i < samples.length; i++) {
      expect(v[i]).toBeGreaterThan(v[i - 1]);
      expect(m[i]).toBeGreaterThan(m[i - 1]);
    }
    expect(v[v.length - 1]).toBeGreaterThan(10 * f);
  });

  it("flips the sign of v across u = f while staying finite and non-NaN", () => {
    const justOutside = imageDistance(f + 1e-6, f);
    const justInside = imageDistance(f - 1e-6, f);
    expect(justOutside).toBeGreaterThan(0);
    expect(justInside).toBeLessThan(0);
    expect(imageKind(f + 1e-6, f)).toBe("real");
    expect(imageKind(f - 1e-6, f)).toBe("virtual");
  });

  it("never returns NaN for a positive object distance, including exactly at u = f", () => {
    for (const u of [0.05, 0.1, 0.1, 0.2, 0.5, 0.8]) {
      expect(Number.isNaN(imageDistance(u, f))).toBe(false);
      expect(Number.isNaN(magnification(u, f))).toBe(false);
    }
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
