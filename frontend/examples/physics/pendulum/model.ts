import type { Model, Params } from "../../../packages/core/types";
export function smallAnglePeriod(p: Params) {
  return 2 * Math.PI * Math.sqrt(p.length / p.gravity);
}
// Energy per unit mass, J/kg. Zero potential is the lowest point.
export function energy(s: Params, p: Params) {
  return (
    0.5 * (p.length * s.omega) ** 2 +
    p.gravity * p.length * (1 - Math.cos(s.theta))
  );
}
function rk4Step(s: Params, p: Params, dt: number): Params {
  const acceleration = (theta: number) =>
    (-p.gravity / p.length) * Math.sin(theta);
  const a1 = s.omega,
    b1 = acceleration(s.theta);
  const a2 = s.omega + (b1 * dt) / 2,
    b2 = acceleration(s.theta + (a1 * dt) / 2);
  const a3 = s.omega + (b2 * dt) / 2,
    b3 = acceleration(s.theta + (a2 * dt) / 2);
  const a4 = s.omega + b3 * dt,
    b4 = acceleration(s.theta + a3 * dt);
  return {
    theta: s.theta + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4),
    omega: s.omega + (dt / 6) * (b1 + 2 * b2 + 2 * b3 + b4),
  };
}
export function integrate(s: Params, p: Params, dt: number): Params {
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  for (let i = 0; i < steps; i++) s = rk4Step(s, p, dt / steps);
  return s;
}
export const model: Model = {
  initial: (p) => ({ theta: p.angle, omega: 0 }),
  step: integrate,
};
