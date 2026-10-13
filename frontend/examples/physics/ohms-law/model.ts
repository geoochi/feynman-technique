import type { Model, Params } from "../../../packages/core/types";

/**
 * A single fixed loop made of one ideal voltage source and one positive
 * linear resistor. Ohm's law fixes the current, and the power follows from it:
 *
 *   I = V / R          current through the resistor, in amperes
 *   P = V I = V^2 / R  power dissipated as heat, in watts
 *
 * Domain. V is a finite voltage (the case uses V > 0) and R is strictly
 * positive. The experiment keeps R >= 1 ohm, so the loop is never an ideal
 * short circuit and the current always stays finite. R = 0 is deliberately
 * outside the documented domain: rather than reporting an infinite current,
 * which is not a physical state of this model, the helpers return NaN there.
 */

/** Current I = V / R in amperes; NaN for a non-positive resistance. */
export function current(voltage: number, resistance: number): number {
  if (!(resistance > 0)) return Number.NaN;
  return voltage / resistance;
}

/** Power P = V I = V^2 / R in watts; NaN for a non-positive resistance. */
export function power(voltage: number, resistance: number): number {
  if (!(resistance > 0)) return Number.NaN;
  return (voltage * voltage) / resistance;
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
