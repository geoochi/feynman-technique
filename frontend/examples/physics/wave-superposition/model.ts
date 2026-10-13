import type { Model, Params } from "../../../packages/core/types";

// Both waves share one medium, so they travel in the same +x direction at this
// fixed speed c (m/s). With a single wavelength parameter this fixes omega = k c.
export const WAVE_SPEED = 2;
export const TAU = 2 * Math.PI;

// Wave number k = 2π/λ, in rad/m.
export function waveNumber(p: Params): number {
  return TAU / p.wavelength;
}
// Angular frequency ω = k c, in rad/s.
export function angularFrequency(p: Params): number {
  return waveNumber(p) * WAVE_SPEED;
}
// Displacement of each wave at position x (m) for a given animation phase ω t.
export function wave1At(p: Params, x: number, phase: number): number {
  return p.amplitude1 * Math.sin(waveNumber(p) * x - phase);
}
export function wave2At(p: Params, x: number, phase: number): number {
  return p.amplitude2 * Math.sin(waveNumber(p) * x - phase + p.phase);
}
// Superposition: the resultant displacement is the algebraic sum of the two.
export function totalAt(p: Params, x: number, phase: number): number {
  return wave1At(p, x, phase) + wave2At(p, x, phase);
}
// Time-domain forms, using ω t = phase.
export function wave1(p: Params, x: number, t: number): number {
  return wave1At(p, x, angularFrequency(p) * t);
}
export function wave2(p: Params, x: number, t: number): number {
  return wave2At(p, x, angularFrequency(p) * t);
}
export function displacement(p: Params, x: number, t: number): number {
  return wave1(p, x, t) + wave2(p, x, t);
}
// Resultant amplitude from the phasor sum of two waves with phase difference φ.
export function resultantAmplitude(p: Params): number {
  return Math.sqrt(
    p.amplitude1 ** 2 +
      p.amplitude2 ** 2 +
      2 * p.amplitude1 * p.amplitude2 * Math.cos(p.phase),
  );
}
// Phase of the resultant wave, from the same phasor construction.
export function resultantPhase(p: Params): number {
  return Math.atan2(
    p.amplitude2 * Math.sin(p.phase),
    p.amplitude1 + p.amplitude2 * Math.cos(p.phase),
  );
}
// Keep the animation phase inside [0, 2π); the wave profile is periodic in it.
export function wrapPhase(phase: number): number {
  return ((phase % TAU) + TAU) % TAU;
}
export const model: Model = {
  initial: () => ({ phase: 0 }),
  step: (state, params, dt) => ({
    phase: wrapPhase(state.phase + angularFrequency(params) * dt),
  }),
};
