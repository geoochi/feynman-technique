import type { Model, Params } from "../../../packages/core/types";

/**
 * Standing wave on a string whose ends are fixed at x = 0 and x = L.
 *
 * Two waves of equal amplitude A and equal angular frequency ω travel in
 * opposite directions:
 *
 *   y₁(x,t) = A sin(kx − ωt)   (travelling towards +x)
 *   y₂(x,t) = A sin(kx + ωt)   (travelling towards −x)
 *
 * Their sum is the standing wave
 *
 *   y(x,t) = y₁ + y₂ = 2A sin(kx) cos(ωt),
 *
 * so space (sin kx) and time (cos ωt) separate. The fixed ends demand
 * y(0,t) = y(L,t) = 0 for every t, i.e. sin(kL) = 0, which quantises the
 * wavelength:
 *
 *   kL = nπ  ⇒  λ_n = 2L/n,   f_n = v/λ_n = n v / (2L),   n = 1, 2, 3, …
 *
 * The wavelength is therefore derived from the mode number, never chosen
 * freely. Nodes sit at x_k = kL/n for k = 0…n (n+1 points, both ends included)
 * and antinodes at x = (k + 1/2)L/n for k = 0…n−1 (n points).
 *
 * The mode number is an integer; the UI accepts any number in [1, 6], so it is
 * rounded to the nearest integer here. This keeps sin(kL) = 0 exact and the
 * node positions clean for any input inside the schema range.
 */

export const TAU = 2 * Math.PI;

/** Integer mode number, clamped to the documented 1–6 range. */
export function modeNumber(p: Params): number {
  return Math.min(6, Math.max(1, Math.round(p.mode)));
}

/** Allowed wavelength λ_n = 2L/n, in metres. */
export function wavelength(p: Params): number {
  return (2 * p.length) / modeNumber(p);
}

/** Wave number k = 2π/λ_n = nπ/L, in rad/m. */
export function waveNumber(p: Params): number {
  return (modeNumber(p) * Math.PI) / p.length;
}

/** Mode frequency f_n = v/λ_n = n v / (2L), in Hz. */
export function frequency(p: Params): number {
  return (modeNumber(p) * p.speed) / (2 * p.length);
}

/** Angular frequency ω = 2π f_n, in rad/s. */
export function angularFrequency(p: Params): number {
  return TAU * frequency(p);
}

/** Node positions x_k = kL/n for k = 0…n: n+1 points, both ends included. */
export function nodePositions(p: Params): number[] {
  const n = modeNumber(p);
  return Array.from({ length: n + 1 }, (_, k) => (k * p.length) / n);
}

/** Antinode positions x = (k + 1/2)L/n for k = 0…n−1: n points. */
export function antinodePositions(p: Params): number[] {
  const n = modeNumber(p);
  return Array.from(
    { length: n },
    (_, k) => ((k + 0.5) * p.length) / n,
  );
}

/** Displacement of the resultant standing wave, y(x,t) = 2A sin(kx) cos(ωt). */
export function displacement(p: Params, x: number, t: number): number {
  return displacementAtPhase(p, x, angularFrequency(p) * t);
}

/** Same, evaluated from the stored animation phase ω t. */
export function displacementAtPhase(
  p: Params,
  x: number,
  phase: number,
): number {
  return 2 * p.amplitude * Math.sin(waveNumber(p) * x) * Math.cos(phase);
}

/** The wave travelling towards +x: y₁ = A sin(kx − ωt). */
export function waveRight(p: Params, x: number, phase: number): number {
  return p.amplitude * Math.sin(waveNumber(p) * x - phase);
}

/** The wave travelling towards −x: y₂ = A sin(kx + ωt). */
export function waveLeft(p: Params, x: number, phase: number): number {
  return p.amplitude * Math.sin(waveNumber(p) * x + phase);
}

/** Envelope of the standing wave, the largest |y| reached at x: 2A|sin(kx)|. */
export function envelope(p: Params, x: number): number {
  return Math.abs(2 * p.amplitude * Math.sin(waveNumber(p) * x));
}

/** Wrap the animation phase into [0, 2π); the profile is periodic in it. */
export function wrapPhase(phase: number): number {
  return ((phase % TAU) + TAU) % TAU;
}

export const model: Model = {
  initial: () => ({ phase: 0 }),
  step: (state, params, dt) => ({
    phase: wrapPhase(state.phase + angularFrequency(params) * dt),
  }),
};
