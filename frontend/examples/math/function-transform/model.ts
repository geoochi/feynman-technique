import type { Model, Params } from "../../../packages/core/types";
export function evaluate(x: number, p: Params) {
  return p.a * (x - p.h) ** 2 + p.k;
}
export const model: Model = {
  initial: () => ({ phase: 0 }),
  step: (s, _p, dt) => ({ phase: s.phase + dt }),
};
