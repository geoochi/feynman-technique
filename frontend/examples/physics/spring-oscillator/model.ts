import type { Model, Params } from "../../../packages/core/types";

// Angular frequency of an ideal undamped spring-mass oscillator, rad/s.
export function angularFrequency(p: Params) {
  return Math.sqrt(p.stiffness / p.mass);
}
// Analytic period T = 2π√(m/k), s.
export function period(p: Params) {
  return 2 * Math.PI * Math.sqrt(p.mass / p.stiffness);
}
// Total mechanical energy ½k x² + ½m v², J. Zero potential is x = 0.
export function energy(s: Params, p: Params) {
  return 0.5 * p.stiffness * s.x ** 2 + 0.5 * p.mass * s.v ** 2;
}
function rk4Step(s: Params, p: Params, dt: number): Params {
  const acceleration = (x: number) => (-p.stiffness / p.mass) * x;
  const a1 = s.v,
    b1 = acceleration(s.x);
  const a2 = s.v + (b1 * dt) / 2,
    b2 = acceleration(s.x + (a1 * dt) / 2);
  const a3 = s.v + (b2 * dt) / 2,
    b3 = acceleration(s.x + (a2 * dt) / 2);
  const a4 = s.v + b3 * dt,
    b4 = acceleration(s.x + a3 * dt);
  return {
    x: s.x + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4),
    v: s.v + (dt / 6) * (b1 + 2 * b2 + 2 * b3 + b4),
  };
}
export function integrate(s: Params, p: Params, dt: number): Params {
  const steps = Math.max(1, Math.ceil(dt / (1 / 960)));
  for (let i = 0; i < steps; i++) s = rk4Step(s, p, dt / steps);
  return s;
}
export const model: Model = {
  initial: (p) => ({ x: p.amplitude, v: 0 }),
  step: integrate,
};
