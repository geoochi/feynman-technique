import type { Model, Params } from "../../../packages/core/types";

// A fixed series loop with an ideal source of EMF E (V), one linear resistor
// R (Ω) and one ideal capacitor C (F). The capacitor starts at u₀ (V) and the
// switch closes at t = 0.
//
// Kirchhoff's voltage law around the loop and the capacitor law i = C du/dt
// give, with τ = RC,
//
//     RC du/dt = E − u   →   u(t) = E + (u₀ − E) e^(−t/τ).
//
// The capacitor voltage u is the only internal state. It is continuous: the
// right-hand side du/dt = (E − u)/τ is finite for every finite u, so u cannot
// jump. With u₀ < E the capacitor charges; with u₀ > E it discharges. Both
// directions are the same exponential, so no separate switch parameter is
// needed. Every step below uses the exact closed form, which is why repeated
// stepping adds no time-stepping error.

// Time constant τ = RC, s.
export function timeConstant(p: Params): number {
  return p.resistance * p.capacitance;
}
// Long-term (steady-state) capacitor voltage, V: the capacitor ends at E.
export function finalVoltage(p: Params): number {
  return p.emf;
}
// Capacitor voltage u(t) = E + (u₀ − E)e^(−t/τ), V.
export function capacitorVoltage(p: Params, t: number): number {
  return p.emf + (p.initialVoltage - p.emf) * Math.exp(-t / timeConstant(p));
}
// Capacitor current i(t) = C du/dt = ((E − u₀)/R)e^(−t/τ), A. Positive means
// the capacitor is charging.
export function capacitorCurrent(p: Params, t: number): number {
  return ((p.emf - p.initialVoltage) / p.resistance) * Math.exp(-t / timeConstant(p));
}
// Exact advance of the state by dt: u(t + dt) = E + (u(t) − E)e^(−dt/τ).
function advance(s: Params, p: Params, dt: number): Params {
  const decay = Math.exp(-dt / timeConstant(p));
  return { u: p.emf + (s.u - p.emf) * decay };
}

export const model: Model = {
  initial: (p) => ({ u: p.initialVoltage }),
  step: advance,
};
