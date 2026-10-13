import type { Model, Params } from "../../../packages/core/types";

/**
 * Two fixed two-resistor circuits that share the same source.
 *
 *   V   source voltage in volts (V)
 *   R₁  resistance of the first resistor in ohms (Ω)
 *   R₂  resistance of the second resistor in ohms (Ω)
 *
 * Series  (single path):
 *   R_eq = R₁ + R₂
 *   I    = V / R_eq                     one current, the same everywhere
 *   V₁   = I R₁,  V₂ = I R₂             the source voltage is divided
 *
 * Parallel (two branches across the same nodes):
 *   1 / R_eq = 1 / R₁ + 1 / R₂
 *   I₁ = V / R₁,  I₂ = V / R₂           the source current is divided
 *   I  = I₁ + I₂ = V / R_eq
 *
 * All helpers are pure and assume the documented domain R₁ > 0, R₂ > 0, which
 * the parameter schema enforces (minimum 10 Ω), so no division by zero occurs.
 * Every quantity is a steady-state DC value: the case has no simulation clock.
 */

export interface BranchVoltages {
  v1: number;
  v2: number;
}

export interface BranchCurrents {
  i1: number;
  i2: number;
}

/** Series equivalent resistance R_eq = R₁ + R₂. */
export function seriesEquivalent(r1: number, r2: number): number {
  return r1 + r2;
}

/** Parallel equivalent resistance 1/R_eq = 1/R₁ + 1/R₂, i.e. R₁R₂/(R₁+R₂). */
export function parallelEquivalent(r1: number, r2: number): number {
  return (r1 * r2) / (r1 + r2);
}

/** Common series current I = V / (R₁ + R₂). */
export function seriesCurrent(v: number, r1: number, r2: number): number {
  return v / seriesEquivalent(r1, r2);
}

/** Series voltage division: V₁ = I R₁ and V₂ = I R₂, with V₁ + V₂ = V. */
export function branchVoltages(v: number, r1: number, r2: number): BranchVoltages {
  const i = seriesCurrent(v, r1, r2);
  return { v1: i * r1, v2: i * r2 };
}

/** Parallel current division: I₁ = V / R₁ and I₂ = V / R₂. */
export function branchCurrents(v: number, r1: number, r2: number): BranchCurrents {
  return { i1: v / r1, i2: v / r2 };
}

/** Total power dissipated by a circuit: P = V I = V² / R_eq. */
export function totalPower(v: number, equivalent: number): number {
  return (v * v) / equivalent;
}

/**
 * A static case: nothing evolves with time. The state is a single bounded
 * number so that snapshot validation still has a real field to check.
 */
export const model: Model = {
  initial: (_params: Params) => ({ value: 0 }),
  step: (state: Params, _params: Params, _dt: number) => ({
    value: state.value,
  }),
};
