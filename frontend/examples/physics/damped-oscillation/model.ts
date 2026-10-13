import type { Model, Params } from "../../../packages/core/types";

// Linear, viscous-damped spring–mass oscillator on a horizontal track:
//
//     m x″ + c x′ + k x = 0
//
// mass m (kg), spring stiffness k (N/m), damping coefficient c (N·s/m) and
// initial displacement x₀ (m). The block is released from rest (v₀ = 0), and
// the potential energy is measured from the equilibrium position x = 0.
//
// With ω₀ = √(k/m) and ζ = c / (2√(mk)) the motion is underdamped for ζ < 1,
// critically damped for ζ = 1 and overdamped for ζ > 1. Every step is taken
// with the exact closed-form solution of this linear equation, so repeated
// stepping adds no time-stepping error; the zero-damping limit therefore
// conserves energy to floating-point precision.

const TAU = 2 * Math.PI;
// ζ is compared with 1 using an absolute tolerance: a slider value that is
// meant to sit exactly on the critical boundary lands within a few ulp of 1.
const CRITICAL_TOLERANCE = 1e-9;

// Natural angular frequency ω₀ = √(k/m), rad/s.
export function naturalFrequency(p: Params): number {
  return Math.sqrt(p.stiffness / p.mass);
}
// Critical damping coefficient c_c = 2√(mk), N·s/m.
export function criticalDamping(p: Params): number {
  return 2 * Math.sqrt(p.mass * p.stiffness);
}
// Damping ratio ζ = c / (2√(mk)), dimensionless.
export function dampingRatio(p: Params): number {
  return p.damping / criticalDamping(p);
}
export function isUnderdamped(p: Params): boolean {
  return dampingRatio(p) < 1 - CRITICAL_TOLERANCE;
}
export function isCritical(p: Params): boolean {
  return Math.abs(dampingRatio(p) - 1) <= CRITICAL_TOLERANCE;
}
export function isOverdamped(p: Params): boolean {
  return dampingRatio(p) > 1 + CRITICAL_TOLERANCE;
}
// Damped angular frequency ω_d = ω₀√(1 − ζ²) for ζ < 1, rad/s; 0 when the
// motion no longer oscillates.
export function dampedFrequency(p: Params): number {
  const z = dampingRatio(p);
  if (z >= 1) return 0;
  return naturalFrequency(p) * Math.sqrt(1 - z * z);
}
// Damped period T_d = 2π/ω_d for ζ < 1; Infinity when ζ ≥ 1.
export function dampedPeriod(p: Params): number {
  const wd = dampedFrequency(p);
  return wd > 0 ? TAU / wd : Number.POSITIVE_INFINITY;
}
// Mechanical energy E = ½kx² + ½mv², J. With damping dE/dt = −c v² ≤ 0, so the
// energy never increases.
export function energy(p: Params, s: Params): number {
  return 0.5 * p.stiffness * s.x ** 2 + 0.5 * p.mass * s.v ** 2;
}
// Closed-form solution of the linear equation from (x₀, v₀) after a time dt.
export function evolve(
  x0: number,
  v0: number,
  p: Params,
  dt: number,
): { x: number; v: number } {
  const w0 = naturalFrequency(p);
  const z = dampingRatio(p);
  const beta = z * w0;
  if (isUnderdamped(p)) {
    // x = e^(−βt)[x₀cos(ω_d t) + ((v₀ + βx₀)/ω_d)sin(ω_d t)]
    const wd = w0 * Math.sqrt(1 - z * z);
    const decay = Math.exp(-beta * dt);
    const c = Math.cos(wd * dt);
    const s = Math.sin(wd * dt);
    return {
      x: decay * (x0 * c + ((v0 + beta * x0) / wd) * s),
      v: decay * (v0 * c - ((w0 * w0 * x0 + beta * v0) / wd) * s),
    };
  }
  if (isCritical(p)) {
    // x = [x₀ + (v₀ + ω₀x₀)t] e^(−ω₀t)
    const decay = Math.exp(-w0 * dt);
    const b = v0 + w0 * x0;
    return { x: (x0 + b * dt) * decay, v: (v0 - w0 * b * dt) * decay };
  }
  // Overdamped: two real roots λ = −β ± r, x = A e^(λ₁t) + B e^(λ₂t).
  const r = Math.sqrt(beta * beta - w0 * w0);
  const l1 = -beta + r;
  const l2 = -beta - r;
  const a = (v0 - l2 * x0) / (l1 - l2);
  const b = x0 - a;
  const e1 = Math.exp(l1 * dt);
  const e2 = Math.exp(l2 * dt);
  return { x: a * e1 + b * e2, v: l1 * a * e1 + l2 * b * e2 };
}
// Displacement and velocity at time t for the released-from-rest trajectory.
export function solution(p: Params, t: number): { x: number; v: number } {
  return evolve(p.initialDisplacement, 0, p, t);
}
// Displacement x(t) of the trajectory shown in the plot, m.
export function displacementAt(p: Params, t: number): number {
  return solution(p, t).x;
}
// Exponential envelope amplitude |x₀| e^(−ζω₀t), m.
export function envelopeAt(p: Params, t: number): number {
  return (
    Math.abs(p.initialDisplacement) *
    Math.exp(-dampingRatio(p) * naturalFrequency(p) * t)
  );
}

export const model: Model = {
  initial: (p) => ({ x: p.initialDisplacement, v: 0 }),
  step: (s, p, dt) => evolve(s.x, s.v, p, dt),
};
