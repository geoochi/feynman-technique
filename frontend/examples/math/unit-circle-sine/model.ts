import type { Model, Params } from "../../../packages/core/types";

/** One full turn, 2π radians. */
export const TWO_PI = 2 * Math.PI;

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Initial phase φ₀. The parameter is entered in degrees (the UI unit) and is
 * converted here to radians, because every formula uses radians.
 */
export function initialPhase(p: Params): number {
  return p.phase * DEGREES_TO_RADIANS;
}

/**
 * Unwrapped phase angle θ(t) = ω t + φ₀, in radians. For φ₀ = 0 the point
 * starts on the positive x-axis and turns counterclockwise as t grows, since
 * θ increases with time.
 */
export function phaseAngle(t: number, p: Params): number {
  return p.omega * t + initialPhase(p);
}

/** Wraps an angle into [0, 2π), the finite range stored in the snapshot. */
export function wrap(theta: number): number {
  const w = theta % TWO_PI;
  if (w < 0) return w + TWO_PI;
  return w + 0; // normalise −0 to 0
}

/** Phase θ(t) wrapped into [0, 2π). */
export function phase(t: number, p: Params): number {
  return wrap(phaseAngle(t, p));
}

/** Projection of the rotating point on the vertical axis: y(t) = R sin(ωt + φ₀). */
export function sineValue(t: number, p: Params): number {
  return p.radius * Math.sin(phaseAngle(t, p));
}

/** Horizontal coordinate of the rotating point: x(t) = R cos(ωt + φ₀). */
export function cosineValue(t: number, p: Params): number {
  return p.radius * Math.cos(phaseAngle(t, p));
}

/** Period of the rotation, T = 2π/ω, in seconds. */
export function period(p: Params): number {
  return TWO_PI / p.omega;
}

/**
 * The state is the wrapped phase angle. Advancing by ω·dt is exact for this
 * model, so the fixed-step integration has no truncation error; wrapping keeps
 * the stored value inside [0, 2π) forever.
 */
export const model: Model = {
  initial: (p) => ({ theta: phase(0, p) }),
  step: (state, p, dt) => ({ theta: wrap(state.theta + p.omega * dt) }),
};
