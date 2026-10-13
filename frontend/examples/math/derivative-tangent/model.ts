import type { Model } from "../../../packages/core/types";

export const evaluate = (x: number) => x * x;
export const derivative = (x: number) => 2 * x;

// This simplification avoids subtracting nearly equal function values.
// It is equivalent to the difference quotient ONLY for nonzero h.
export function secantSlope(x0: number, h: number): number | null {
  return h === 0 ? null : 2 * x0 + h;
}

export function tangentValue(x: number, x0: number): number {
  return evaluate(x0) + derivative(x0) * (x - x0);
}

export const model: Model = {
  initial: () => ({ phase: 0 }),
  step: (state) => state,
};
