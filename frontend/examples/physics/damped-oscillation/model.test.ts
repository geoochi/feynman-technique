import { describe, expect, it } from "vitest";
import {
  criticalDamping,
  dampedFrequency,
  dampedPeriod,
  dampingRatio,
  displacementAt,
  energy,
  envelopeAt,
  evolve,
  isCritical,
  isOverdamped,
  isUnderdamped,
  model,
  naturalFrequency,
  solution,
} from "./model";

const TAU = 2 * Math.PI;
const DT = 1 / 120;
// Reference oscillator: m = 1 kg, k = 25 N/m gives ω₀ = 5 rad/s and
// c_c = 2√(mk) = 10 N·s/m, so c = 2 N·s/m is exactly ζ = 0.2.
const base = { mass: 1, stiffness: 25, damping: 2, initialDisplacement: 0.2 };
const at = (damping: number, over: Partial<typeof base> = {}) => ({
  ...base,
  ...over,
  damping,
});
const runSteps = (p: typeof base, steps: number) => {
  let s = model.initial(p);
  for (let i = 0; i < steps; i++) s = model.step(s, p, DT);
  return s;
};

describe("damping ratio and the critical boundary", () => {
  it("computes ω₀ and c_c and lands exactly on ζ = 1 at c = 2√(mk)", () => {
    expect(naturalFrequency(base)).toBeCloseTo(5, 12);
    expect(criticalDamping(base)).toBeCloseTo(10, 12);
    expect(dampingRatio(at(2))).toBeCloseTo(0.2, 12);
    expect(dampingRatio(at(0))).toBe(0);
    expect(dampingRatio(at(10))).toBe(1);
  });

  it("classifies underdamped, critical and overdamped on either side of c_c", () => {
    expect(isUnderdamped(at(9.999))).toBe(true);
    expect(isCritical(at(9.999))).toBe(false);
    expect(isOverdamped(at(9.999))).toBe(false);

    expect(isCritical(at(10))).toBe(true);
    expect(isUnderdamped(at(10))).toBe(false);
    expect(isOverdamped(at(10))).toBe(false);

    expect(isOverdamped(at(10.001))).toBe(true);
    expect(isUnderdamped(at(10.001))).toBe(false);
    expect(isCritical(at(10.001))).toBe(false);
  });

  it("closes the damped frequency at the boundary and keeps the damped period longer than T₀", () => {
    const p = at(2);
    const w0 = naturalFrequency(p);
    const wd = dampedFrequency(p);
    expect(wd).toBeCloseTo(w0 * Math.sqrt(1 - 0.2 ** 2), 12);
    expect(wd).toBeLessThan(w0);
    expect(dampedPeriod(p)).toBeCloseTo(TAU / wd, 12);
    expect(dampedPeriod(p)).toBeGreaterThan(TAU / w0);
    // ζ ≥ 1: the motion no longer oscillates, so there is no damped period.
    expect(dampedFrequency(at(10))).toBe(0);
    expect(dampedPeriod(at(10))).toBe(Number.POSITIVE_INFINITY);
    expect(dampedFrequency(at(25))).toBe(0);
  });
});

describe("zero-damping limit: simple harmonic motion", () => {
  const p = at(0);

  it("conserves the mechanical energy exactly over 10 s of fixed steps", () => {
    const e0 = energy(p, { x: p.initialDisplacement, v: 0 });
    expect(e0).toBeCloseTo(0.5, 12); // ½ k x₀² = ½ · 25 · 0.04
    let s = model.initial(p);
    for (let i = 0; i < 1200; i++) {
      s = model.step(s, p, DT);
      expect(energy(p, s)).toBeCloseTo(e0, 9);
    }
    expect(energy(p, s)).toBeCloseTo(0.5, 9);
  });

  it("returns to the starting state after the analytic period 2π/ω₀", () => {
    const T = TAU / naturalFrequency(p);
    expect(T).toBeCloseTo(1.2566370614359172, 12);
    expect(displacementAt(p, T)).toBeCloseTo(p.initialDisplacement, 10);
    expect(solution(p, T).v).toBeCloseTo(0, 10);
    expect(displacementAt(p, T / 2)).toBeCloseTo(-p.initialDisplacement, 10);
    expect(displacementAt(p, T / 4)).toBeCloseTo(0, 10);
  });

  it("keeps the period and the peak speed independent of the initial displacement", () => {
    const T = TAU / naturalFrequency(p);
    for (const x0 of [0.05, 0.2, 0.5]) {
      const q = at(0, { initialDisplacement: x0 });
      expect(displacementAt(q, T)).toBeCloseTo(x0, 10);
      // Peak speed of SHM is ω₀ x₀ and scales linearly with the amplitude.
      expect(solution(q, T / 4).v).toBeCloseTo(-5 * x0, 10);
    }
    // The energy of the released oscillator is quadratic in the amplitude.
    expect(energy(at(0, { initialDisplacement: 0.4 }), { x: 0.4, v: 0 })).toBeCloseTo(
      4 * energy(at(0, { initialDisplacement: 0.2 }), { x: 0.2, v: 0 }),
      12,
    );
  });

  it("keeps a block released from equilibrium at rest", () => {
    const q = at(2, { initialDisplacement: 0 });
    expect(model.initial(q)).toEqual({ x: 0, v: 0 });
    const s = runSteps(q, 600);
    expect(s.x).toBe(0);
    expect(s.v).toBe(0);
    expect(energy(q, s)).toBe(0);
  });
});

describe("energy never increases once damping is present", () => {
  it.each([0.1, 2, 10, 25, 50])(
    "is non-increasing for c = %s N·s/m",
    (damping) => {
      const p = at(damping);
      let s = model.initial(p);
      let previous = energy(p, s);
      const e0 = previous;
      for (let i = 0; i < 1200; i++) {
        s = model.step(s, p, DT);
        const e = energy(p, s);
        expect(e).toBeLessThanOrEqual(previous + 1e-12);
        previous = e;
      }
      expect(previous).toBeLessThanOrEqual(e0);
      // A real loss: over 10 s the energy must drop well below its start.
      expect(previous).toBeLessThan(e0);
    },
  );

  it("dissipates energy at the rate dE/dt = −c v²", () => {
    const p = at(2);
    const t = 0.4;
    const h = 1e-6;
    const a = energy(p, solution(p, t));
    const b = energy(p, solution(p, t + h));
    const numeric = (b - a) / h;
    const v = solution(p, t).v;
    expect(numeric).toBeCloseTo(-p.damping * v * v, 4);
  });
});

describe("underdamped motion", () => {
  const p = at(2); // ζ = 0.2

  it("decays by the factor e^(−ζω₀T_d) after each damped period", () => {
    const z = dampingRatio(p);
    const w0 = naturalFrequency(p);
    const Td = dampedPeriod(p);
    const factor = Math.exp(-z * w0 * Td);
    expect(factor).toBeCloseTo(0.2773, 3); // e^(−0.2·5·1.28255)
    expect(displacementAt(p, Td)).toBeCloseTo(p.initialDisplacement * factor, 9);
    expect(displacementAt(p, 2 * Td)).toBeCloseTo(
      p.initialDisplacement * factor ** 2,
      9,
    );
    // Successive peaks keep the same sign and shrink by that same factor.
    expect(displacementAt(p, 2 * Td)).toBeGreaterThan(0);
  });

  it("crosses the equilibrium at equal half-period intervals", () => {
    const crossings: number[] = [];
    let previous = displacementAt(p, 0);
    for (let i = 1; i <= 20000; i++) {
      const t = i * 1e-3;
      const x = displacementAt(p, t);
      if (previous * x < 0) crossings.push(t);
      previous = x;
    }
    expect(crossings.length).toBeGreaterThanOrEqual(20);
    const gaps = crossings.slice(1).map((t, i) => t - crossings[i]);
    for (const gap of gaps) expect(gap).toBeCloseTo(dampedPeriod(p) / 2, 2);
    for (const t of crossings)
      expect(Math.abs(displacementAt(p, t))).toBeLessThan(2e-3);
    // Damping pulls the first crossing earlier than half a damped period.
    expect(crossings[0]).toBeLessThan(dampedPeriod(p) / 2);
  });

  it("puts every successive peak on the exponential envelope and approaches equilibrium", () => {
    const z = dampingRatio(p);
    const w0 = naturalFrequency(p);
    const Td = dampedPeriod(p);
    // The true amplitude envelope of this released-from-rest solution is the
    // peak envelope x₀e^(−ζω₀t) divided by cos φ = √(1−ζ²).
    const bound = (t: number) =>
      (Math.abs(p.initialDisplacement) * Math.exp(-z * w0 * t)) /
      Math.sqrt(1 - z * z);
    for (let i = 0; i <= 400; i++) {
      const t = (i / 400) * 10;
      const x = Math.abs(displacementAt(p, t));
      expect(x).toBeLessThanOrEqual(bound(t) + 1e-12);
      expect(x).toBeLessThanOrEqual(Math.abs(p.initialDisplacement) + 1e-12);
    }
    // The peaks, half a damped period apart, sit exactly on the drawn envelope
    // ±x₀ e^(−ζω₀t).
    for (let k = 0; k <= 6; k++) {
      const t = (k * Td) / 2;
      expect(Math.abs(displacementAt(p, t))).toBeCloseTo(envelopeAt(p, t), 9);
    }
    expect(Math.abs(displacementAt(p, 60))).toBeLessThan(1e-5);
  });
});

describe("critical and overdamped motion", () => {
  const critical = at(10); // ζ = 1
  const over = at(25); // ζ = 2.5

  it("returns to equilibrium monotonically without crossing it when critical", () => {
    expect(isCritical(critical)).toBe(true);
    let previous = critical.initialDisplacement;
    for (let i = 1; i <= 400; i++) {
      const x = displacementAt(critical, (i / 400) * 5);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(previous);
      previous = x;
    }
  });

  it("creeps back without crossing it when overdamped", () => {
    expect(isOverdamped(over)).toBe(true);
    let previous = over.initialDisplacement;
    for (let i = 1; i <= 400; i++) {
      const x = displacementAt(over, (i / 400) * 20);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(previous);
      previous = x;
    }
  });

  it("settles faster than the overdamped case at long times but is not instantaneous", () => {
    // At t = 2 s the overdamped oscillator is still far from equilibrium while
    // the critical one is already close: over-damping is not "more damping".
    expect(displacementAt(critical, 2)).toBeLessThan(2e-4);
    expect(displacementAt(over, 2)).toBeGreaterThan(0.02);
    // A stiffer damper does not simply speed the return up.
    expect(displacementAt(at(50), 2)).toBeGreaterThan(displacementAt(over, 2));
    expect(displacementAt(at(10), 1)).toBeLessThan(displacementAt(at(25), 1));
  });

  it("never oscillates and never returns NaN for any damping", () => {
    for (const damping of [0, 0.1, 2, 10, 25, 50]) {
      const p = at(damping);
      for (let i = 1; i <= 1200; i++) {
        const x = displacementAt(p, i * DT);
        expect(Number.isNaN(x)).toBe(false);
        expect(Number.isFinite(x)).toBe(true);
        // With v₀ = 0 the block is released at the far extreme, so it can only
        // move back: |x| never exceeds x₀.
        expect(Math.abs(x)).toBeLessThanOrEqual(
          Math.abs(p.initialDisplacement) + 1e-12,
        );
      }
    }
  });
});

describe("the stepped model reproduces the closed-form solution", () => {
  it("matches x(t) and v(t) after every fixed step in all three regimes", () => {
    for (const damping of [0, 0.1, 2, 9.9, 10, 10.1, 25, 50]) {
      const p = at(damping);
      let s = model.initial(p);
      for (let i = 1; i <= 240; i++) {
        s = model.step(s, p, DT);
        const exact = solution(p, i * DT);
        expect(s.x).toBeCloseTo(exact.x, 9);
        expect(s.v).toBeCloseTo(exact.v, 9);
      }
    }
  });

  it("composes steps consistently, so a coarse step equals many fine steps", () => {
    for (const damping of [0, 2, 10, 25]) {
      const p = at(damping);
      const coarse = evolve(p.initialDisplacement, 0, p, 0.1);
      let fine = model.initial(p);
      for (let i = 0; i < 10; i++) fine = model.step(fine, p, 0.01);
      expect(fine.x).toBeCloseTo(coarse.x, 9);
      expect(fine.v).toBeCloseTo(coarse.v, 9);
    }
  });

  it("keeps the state inside the declared snapshot bounds for every parameter extreme", () => {
    for (const mass of [0.5, 1, 5])
      for (const stiffness of [5, 25, 100])
        for (const damping of [0, 1, 10, 50]) {
          const p = { mass, stiffness, damping, initialDisplacement: 0.5 };
          let s = model.initial(p);
          for (let i = 0; i < 2000; i++) {
            s = model.step(s, p, DT);
            expect(Math.abs(s.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(s.v)).toBeLessThanOrEqual(10);
          }
        }
  });
});
