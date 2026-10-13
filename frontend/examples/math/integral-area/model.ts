import type { Model } from "../../../packages/core/types";

// Fixed integrand for this first version: f(x) = x², with F(x) = x³ / 3.
export const evaluate = (x: number) => x * x;

// The slider steps by one, but a typed value can be fractional; the model
// rounds it to a real subinterval count of at least one.
export function subintervalCount(n: number): number {
  return Math.max(1, Math.round(n));
}

export function subintervalWidth(a: number, b: number, n: number): number {
  return (b - a) / subintervalCount(n);
}

// xᵢ = a + (i + s)Δx; s = 0 is the left edge, 0.5 the midpoint, 1 the right edge.
export function samplePoint(
  a: number,
  b: number,
  n: number,
  i: number,
  s: number,
): number {
  return a + (i + s) * subintervalWidth(a, b, n);
}

export function riemannSum(a: number, b: number, n: number, s: number): number {
  const count = subintervalCount(n);
  const h = (b - a) / count;
  let total = 0;
  for (let i = 0; i < count; i++) total += evaluate(a + (i + s) * h) * h;
  return total;
}

// Signed integral ∫ₐᵇ x² dx, using the antiderivative x³ / 3.
export function exactIntegral(a: number, b: number): number {
  return (b ** 3 - a ** 3) / 3;
}

// Signed error of the approximation: sum − exact.
export function error(a: number, b: number, n: number, s: number): number {
  return riemannSum(a, b, n, s) - exactIntegral(a, b);
}

export type SamplingBias = "under" | "over" | "mixed" | "interior";

// For the monotonic pieces of f(x) = x², edge sampling has a known bias.
export function samplingBias(a: number, b: number, s: number): SamplingBias {
  if (s > 0 && s < 1) return "interior";
  const increasing = a >= 0;
  const decreasing = b <= 0;
  if (!increasing && !decreasing) return "mixed";
  if (s === 0) return increasing ? "under" : "over";
  return increasing ? "over" : "under";
}

export const model: Model = {
  initial: () => ({ phase: 0 }),
  step: (state) => state,
};
