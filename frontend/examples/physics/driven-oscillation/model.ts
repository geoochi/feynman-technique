import type { Model, Params } from "../../../packages/core/types";

/**
 * Linear damped oscillator driven by a sinusoidal force:
 *
 *   m x'' + c x' + k x = F₀ cos(ω_d t)
 *
 * with mass m, stiffness k, damping coefficient c, driving amplitude F₀ and
 * driving angular frequency ω_d. Writing the drive as F₀ cos(ω_d t) lets the
 * model carry the drive phase θ = ω_d t in its state, so the force stays exact
 * even though the runtime only ever hands `step` a fixed dt.
 *
 * The steady state is the particular solution x_p(t) = A cos(ω_d t − φ) with
 *
 *   A = F₀ / √((k − m ω_d²)² + (c ω_d)²),   φ = atan2(c ω_d, k − m ω_d²).
 *
 * The whole motion is the sum of this steady part and a transient that decays
 * like e^{−γt} with γ = c / (2m); the transient is what the learner sees first.
 *
 * Resonance pole: A diverges exactly when k − m ω_d² = 0 (ω_d = ω₀) AND
 * c ω_d = 0 (c = 0). The helpers below detect that denominator and return +∞
 * instead of dividing by zero, and never return NaN.
 */

export const TAU = 2 * Math.PI;

/** Natural (undamped) angular frequency ω₀ = √(k/m), rad/s. */
export function naturalFrequency(p: Params): number {
  return Math.sqrt(p.stiffness / p.mass);
}

/** Damping ratio ζ = c / (2√(km)), dimensionless. */
export function dampingRatio(p: Params): number {
  return p.damping / (2 * Math.sqrt(p.stiffness * p.mass));
}

/** Static deflection F₀/k, the ω_d → 0 limit of the steady amplitude, m. */
export function staticDeflection(p: Params): number {
  return p.force / p.stiffness;
}

/**
 * Amplitude-resonance frequency √(ω₀² − 2γ²) with γ = c/(2m), rad/s. When the
 * damping is too large for a peak this is 0 (the response then decreases
 * monotonically with ω_d).
 */
export function peakFrequency(p: Params): number {
  const w0 = naturalFrequency(p);
  const gamma = p.damping / (2 * p.mass);
  const squared = w0 * w0 - 2 * gamma * gamma;
  return squared > 0 ? Math.sqrt(squared) : 0;
}

/**
 * Steady-state amplitude at an arbitrary driving frequency:
 *   A(ω) = F₀ / √((k − m ω²)² + (c ω)²).
 * A zero driving force gives A = 0 everywhere. At the undamped resonance pole
 * the denominator is exactly zero and A diverges; +∞ is returned there, never
 * NaN.
 */
export function responseAmplitude(p: Params, omega: number): number {
  if (p.force === 0) return 0;
  const denominator = Math.hypot(
    p.stiffness - p.mass * omega * omega,
    p.damping * omega,
  );
  return denominator === 0 ? Number.POSITIVE_INFINITY : p.force / denominator;
}

/** Steady-state amplitude at the current driving frequency ω_d, m. */
export function steadyStateAmplitude(p: Params): number {
  return responseAmplitude(p, p.driveFrequency);
}

/**
 * Steady-state phase lag φ = atan2(c ω_d, k − m ω_d²), in [0, π].
 * φ → 0 well below resonance, π/2 at resonance and → π well above it. At the
 * undamped resonance pole atan2(0, 0) is undefined; its limit π/2 is returned.
 */
export function phaseLag(p: Params): number {
  const real = p.stiffness - p.mass * p.driveFrequency * p.driveFrequency;
  const imag = p.damping * p.driveFrequency;
  if (real === 0 && imag === 0) return Math.PI / 2;
  return Math.atan2(imag, real);
}

/** Wrap an angle into [0, 2π); the driving force is periodic in it. */
export function wrapPhase(phase: number): number {
  return ((phase % TAU) + TAU) % TAU;
}

// Integration substep: one runtime dt = 1/120 s is split into eight of these.
const SUBSTEP = 1 / 960;

function acceleration(
  p: Params,
  x: number,
  v: number,
  phase: number,
): number {
  return (
    (p.force * Math.cos(phase) - p.damping * v - p.stiffness * x) / p.mass
  );
}

/**
 * One fixed-step RK4 update of (x, v, phase). The drive phase advances
 * analytically as θ + ω_d dt and is wrapped, so cos(θ) never loses precision
 * even after a very long simulation.
 */
export function integrate(state: Params, p: Params, dt: number): Params {
  const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
  const h = dt / steps;
  const w = p.driveFrequency;
  let { x, v, phase } = state;
  for (let i = 0; i < steps; i++) {
    const a1 = acceleration(p, x, v, phase);
    const k1 = v;
    const a2 = acceleration(
      p,
      x + (k1 * h) / 2,
      v + (a1 * h) / 2,
      phase + (w * h) / 2,
    );
    const k2 = v + (a1 * h) / 2;
    const a3 = acceleration(
      p,
      x + (k2 * h) / 2,
      v + (a2 * h) / 2,
      phase + (w * h) / 2,
    );
    const k3 = v + (a2 * h) / 2;
    const a4 = acceleration(p, x + k3 * h, v + a3 * h, phase + w * h);
    const k4 = v + a3 * h;
    x += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    v += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
    phase = wrapPhase(phase + w * h);
  }
  return { x, v, phase };
}

/** Starts at rest with the drive at phase zero, so the transient is visible. */
export const model: Model = {
  initial: () => ({ x: 0, v: 0, phase: 0 }),
  step: (state, params, dt) => integrate(state, params, dt),
};
