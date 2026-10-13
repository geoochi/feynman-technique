import { describe, expect, it } from "vitest";
import {
  criticalAngle,
  isTotalInternalReflection,
  model,
  refractedAngle,
} from "./model";

const DEG = Math.PI / 180;
const params = { theta1: 40, n1: 1, n2: 1.5 };

describe("Snell's law and the special cases", () => {
  it("does not deviate a ray at normal incidence (θ₁ = 0 -> θ₂ = 0)", () => {
    expect(refractedAngle(1, 1.5, 0)).toBe(0);
    expect(refractedAngle(1.5, 1, 0)).toBe(0);
    expect(refractedAngle(2.5, 1, 0)).toBe(0);
    expect(isTotalInternalReflection(1.5, 1, 0)).toBe(false);
  });

  it("leaves the direction unchanged when the two indices are equal", () => {
    for (const theta of [0, 10, 30, 45, 60, 89])
      expect(refractedAngle(1.33, 1.33, theta)).toBeCloseTo(theta, 9);
    expect(criticalAngle(1.33, 1.33)).toBeNull();
  });

  it("bends the ray toward the normal when it enters the denser medium", () => {
    expect(refractedAngle(1, 1.5, 30)).toBeCloseTo(19.471220634490695, 9);
    expect(refractedAngle(1, 1.5, 30)!).toBeLessThan(30);
    expect(refractedAngle(1, 1.5, 60)!).toBeCloseTo(35.264389682754654, 9);
  });

  it("bends the ray away from the normal when it leaves the denser medium", () => {
    const theta2 = refractedAngle(1.5, 1, 30)!;
    expect(theta2).toBeGreaterThan(30);
    expect(theta2).toBeCloseTo(48.590377890729144, 9);
  });

  it("satisfies n₁ sin θ₁ = n₂ sin θ₂ wherever a refracted ray exists", () => {
    for (const n1 of [1, 1.33, 1.5, 2.5])
      for (const n2 of [1, 1.33, 1.5, 2.5])
        for (const theta1 of [0, 5, 20, 30, 45, 60, 75, 89]) {
          const theta2 = refractedAngle(n1, n2, theta1);
          if (theta2 === null) {
            expect(isTotalInternalReflection(n1, n2, theta1)).toBe(true);
            continue;
          }
          expect(n1 * Math.sin(theta1 * DEG)).toBeCloseTo(
            n2 * Math.sin(theta2 * DEG),
            9,
          );
        }
  });

  it("increases the refracted angle monotonically with the incidence angle", () => {
    const samples = [0, 10, 20, 30, 40, 50, 60, 70, 89];
    const values = samples.map((theta) => refractedAngle(1, 1.5, theta)!);
    for (let i = 1; i < values.length; i++)
      expect(values[i]).toBeGreaterThan(values[i - 1]);
  });
});

describe("critical angle and total internal reflection", () => {
  it("finds the critical angle only when n₁ > n₂", () => {
    expect(criticalAngle(1.5, 1)).toBeCloseTo(41.810314895778596, 9);
    expect(criticalAngle(1, 1.5)).toBeNull();
    expect(criticalAngle(1.5, 1.5)).toBeNull();
    expect(criticalAngle(1.33, 1)).toBeCloseTo(
      Math.asin(1 / 1.33) / DEG,
      12,
    );
    // sin θc = n₂/n₁ by construction.
    const c = criticalAngle(2.4, 1.2)!;
    expect(Math.sin(c * DEG)).toBeCloseTo(1.2 / 2.4, 12);
  });

  it("refracts at the critical angle and reflects beyond it", () => {
    const c = criticalAngle(1.5, 1)!;
    expect(isTotalInternalReflection(1.5, 1, c)).toBe(false);
    expect(isTotalInternalReflection(1.5, 1, c - 0.01)).toBe(false);
    expect(isTotalInternalReflection(1.5, 1, c + 0.01)).toBe(true);

    // Exactly at the critical angle the refracted ray grazes the interface.
    expect(refractedAngle(1.5, 1, c)).toBeCloseTo(90, 3);
    // Just below it the ray still leaves the medium.
    expect(refractedAngle(1.5, 1, 41)).toBeCloseTo(79.766, 1);
    expect(refractedAngle(1.5, 1, 41)).not.toBeNull();
  });

  it("reports no refracted ray beyond the critical angle", () => {
    for (const theta of [42, 45, 60, 75, 89]) {
      expect(isTotalInternalReflection(1.5, 1, theta)).toBe(true);
      expect(refractedAngle(1.5, 1, theta)).toBeNull();
    }
    // A denser second medium can never produce total internal reflection.
    for (const theta of [0, 30, 60, 89]) {
      expect(isTotalInternalReflection(1, 1.5, theta)).toBe(false);
      expect(refractedAngle(1, 1.5, theta)).not.toBeNull();
    }
  });

  it("never returns NaN, and never a refracted ray without refraction", () => {
    for (const n1 of [1, 1.33, 1.5, 2.5])
      for (const n2 of [1, 1.33, 1.5, 2.5])
        for (const theta1 of [0, 1, 30, 41, 41.81, 45, 60, 89]) {
          const theta2 = refractedAngle(n1, n2, theta1);
          expect(Number.isNaN(theta2 as number)).toBe(false);
          if (theta2 !== null) {
            expect(Number.isFinite(theta2)).toBe(true);
            expect(theta2).toBeGreaterThanOrEqual(0);
            expect(theta2).toBeLessThanOrEqual(90);
          }
          const c = criticalAngle(n1, n2);
          expect(c === null || (c > 0 && c < 90)).toBe(true);
        }
  });

  it("rejects non-physical inputs without throwing", () => {
    expect(refractedAngle(0, 1.5, 30)).toBeNull();
    expect(refractedAngle(1, 0, 30)).toBeNull();
    expect(refractedAngle(-1, 1.5, 30)).toBeNull();
    expect(refractedAngle(1, 1.5, Number.NaN)).toBeNull();
    expect(refractedAngle(Number.NaN, 1.5, 30)).toBeNull();
    expect(criticalAngle(0, 1)).toBeNull();
    expect(criticalAngle(1, Number.POSITIVE_INFINITY)).toBeNull();
    expect(isTotalInternalReflection(1, 1.5, Number.NaN)).toBe(false);
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
