import { describe, expect, it } from "vitest";
import {
  TAU,
  dampingRatio,
  integrate,
  model,
  naturalFrequency,
  peakFrequency,
  phaseLag,
  responseAmplitude,
  staticDeflection,
  steadyStateAmplitude,
  wrapPhase,
} from "./model";

// Reference case: ω₀ = √(4/1) = 2 rad/s, so ω_d = 2 is exact resonance.
const base = { mass: 1, stiffness: 4, damping: 1, force: 1, driveFrequency: 2 };

/** Integrate a state for `seconds` at the runtime step dt = 1/120 s. */
function run(p: typeof base, seconds: number, from = model.initial(p)) {
  const dt = 1 / 120;
  let s = from;
  for (let i = 0; i < Math.round(seconds * 120); i++) s = model.step(s, p, dt);
  return s;
}

/** Largest |x| seen while integrating from rest for `seconds`. */
function windowPeak(p: typeof base, from: number, to: number) {
  const dt = 1 / 120;
  let s = model.initial(p);
  let peak = 0;
  for (let i = 0; i < Math.round(to * 120); i++) {
    s = model.step(s, p, dt);
    if (i >= Math.round(from * 120)) peak = Math.max(peak, Math.abs(s.x));
  }
  return peak;
}

describe("natural frequency and damping", () => {
  it("gives ω₀ = √(k/m) with the expected square-root scalings", () => {
    expect(naturalFrequency({ ...base, mass: 1, stiffness: 4 })).toBeCloseTo(
      2,
      12,
    );
    expect(naturalFrequency({ ...base, mass: 4, stiffness: 4 })).toBeCloseTo(
      1,
      12,
    );
    expect(
      naturalFrequency({ ...base, mass: 1, stiffness: 16 }),
    ).toBeCloseTo(4, 12);
    // Quadrupling m divides ω₀ by 2; quadrupling k doubles it.
    expect(
      naturalFrequency({ ...base, mass: 4 }) / naturalFrequency(base),
    ).toBeCloseTo(0.5, 12);
    expect(
      naturalFrequency({ ...base, stiffness: 16 }) / naturalFrequency(base),
    ).toBeCloseTo(2, 12);
  });

  it("gives the damping ratio ζ = c / (2√(km))", () => {
    // m = 1, k = 4 ⇒ √(km) = 2, so ζ = c/4.
    expect(dampingRatio({ ...base, damping: 1 })).toBeCloseTo(0.25, 12);
    expect(dampingRatio({ ...base, damping: 2 })).toBeCloseTo(0.5, 12);
    expect(dampingRatio({ ...base, damping: 4 })).toBeCloseTo(1, 12);
  });

  it("locates the amplitude-resonance frequency √(ω₀² − 2γ²)", () => {
    // γ = c/(2m) = 0.5 ⇒ ω_r = √(4 − 0.5) = √3.5.
    expect(peakFrequency({ ...base, damping: 1 })).toBeCloseTo(
      Math.sqrt(3.5),
      12,
    );
    // Overdamped enough: no peak, the response falls monotonically.
    expect(peakFrequency({ ...base, damping: 20 })).toBe(0);
  });
});

describe("steady-state amplitude and the resonance pole", () => {
  it("reduces to the static deflection F₀/k as ω_d → 0", () => {
    const p = { ...base, force: 2, stiffness: 8, driveFrequency: 0.5 };
    expect(responseAmplitude(p, 0)).toBeCloseTo(2 / 8, 12);
    expect(responseAmplitude(p, 0)).toBeCloseTo(staticDeflection(p), 12);
  });

  it("matches the closed form at an off-resonance frequency", () => {
    // m=1, k=4, c=1, F₀=1, ω_d=1: A = 1/√(3² + 1²) = 1/√10.
    const p = { ...base, driveFrequency: 1 };
    expect(steadyStateAmplitude(p)).toBeCloseTo(1 / Math.sqrt(10), 12);
  });

  it("reaches A = F₀/(c ω₀) exactly at resonance when damped", () => {
    for (const damping of [0.4, 1, 2.5]) {
      const p = { ...base, damping, force: 3 };
      const w0 = naturalFrequency(p);
      expect(steadyStateAmplitude(p)).toBeCloseTo(3 / (damping * w0), 12);
      // The peak is at ω_d = ω₀, so shifting away from it lowers the amplitude.
      expect(responseAmplitude(p, w0 * 1.2)).toBeLessThan(
        steadyStateAmplitude(p),
      );
    }
  });

  it("returns +∞ at the undamped resonance pole instead of dividing by zero", () => {
    const pole = { ...base, damping: 0, driveFrequency: naturalFrequency(base) };
    const A = steadyStateAmplitude(pole);
    expect(A).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(A)).toBe(false);
    expect(Number.isFinite(A)).toBe(false);
  });

  it("returns A = 0 for a zero driving force, even at the undamped pole", () => {
    const noDrive = {
      ...base,
      force: 0,
      damping: 0,
      driveFrequency: naturalFrequency(base),
    };
    expect(steadyStateAmplitude(noDrive)).toBe(0);
    expect(responseAmplitude(noDrive, 0)).toBe(0);
    expect(responseAmplitude(noDrive, 7.3)).toBe(0);
  });

  it("grows without bound as damping shrinks toward zero at resonance", () => {
    const w0 = naturalFrequency(base);
    const amplitudes = [2, 1, 0.5, 0.2, 0.02].map((damping) =>
      steadyStateAmplitude({ ...base, damping, driveFrequency: w0 }),
    );
    for (let i = 1; i < amplitudes.length; i++)
      expect(amplitudes[i]).toBeGreaterThan(amplitudes[i - 1]);
    // A = F₀/(c ω₀) = 1/(0.02 × 2) = 25 as c → 0.
    expect(amplitudes[amplitudes.length - 1]).toBeGreaterThan(10);
  });

  it("never returns NaN or a negative amplitude over the parameter grid", () => {
    for (const mass of [0.5, 1, 4])
      for (const stiffness of [10, 30, 80])
        for (const damping of [0, 0.4, 5])
          for (const force of [0, 2, 5])
            for (const driveFrequency of [0.5, 5.5, 16]) {
              const p = { mass, stiffness, damping, force, driveFrequency };
              for (const w of [0, 0.5, driveFrequency, 16, 40]) {
                const a = responseAmplitude(p, w);
                expect(Number.isNaN(a)).toBe(false);
                expect(a).toBeGreaterThanOrEqual(0);
              }
            }
  });
});

describe("phase lag", () => {
  it("stays in [0, π] and increases with the driving frequency", () => {
    const ws = [0.2, 0.5, 1, 1.9, 2, 2.1, 4, 8, 16];
    const phis = ws.map((driveFrequency) =>
      phaseLag({ ...base, driveFrequency }),
    );
    for (const phi of phis) {
      expect(phi).toBeGreaterThanOrEqual(0);
      expect(phi).toBeLessThanOrEqual(Math.PI);
    }
    for (let i = 1; i < phis.length; i++)
      expect(phis[i]).toBeGreaterThan(phis[i - 1]);
    // Well below resonance the motion follows the force; well above it lags by π.
    expect(phis[0]).toBeLessThan(0.15);
    expect(phis[phis.length - 1]).toBeGreaterThan(Math.PI - 0.2);
  });

  it("is exactly π/2 at resonance and matches atan2 off resonance", () => {
    expect(phaseLag(base)).toBeCloseTo(Math.PI / 2, 12);
    const p = { ...base, damping: 0.6, driveFrequency: 1 };
    expect(phaseLag(p)).toBeCloseTo(Math.atan2(0.6, 3), 12);
  });

  it("returns the finite limit π/2 at the undamped pole instead of NaN", () => {
    const pole = { ...base, damping: 0, driveFrequency: naturalFrequency(base) };
    const phi = phaseLag(pole);
    expect(phi).toBeCloseTo(Math.PI / 2, 12);
    expect(Number.isNaN(phi)).toBe(false);
  });
});

describe("numerical motion", () => {
  it("stays exactly at rest when there is no driving force", () => {
    const p = { ...base, force: 0 };
    let s = model.initial(p);
    expect(s).toEqual({ x: 0, v: 0, phase: 0 });
    for (let i = 0; i < 1200; i++) s = model.step(s, p, 1 / 120);
    expect(s.x).toBe(0);
    expect(s.v).toBe(0);
  });

  it("decays to rest from a displaced start when F₀ = 0", () => {
    const p = { ...base, force: 0 };
    const s = run(p, 60, { x: 0.3, v: 0, phase: 0 });
    expect(Math.abs(s.x)).toBeLessThan(1e-6);
    expect(Math.abs(s.v)).toBeLessThan(1e-6);
  });

  it("settles onto the analytic steady state at resonance", () => {
    // ω₀ = 2, c = 1, F₀ = 1 ⇒ A = F₀/(cω₀) = 0.5 and φ = π/2,
    // so x(t) → A sin(ω_d t) = 0.5 sin(2t).
    const t = 60;
    const s = run(base, t);
    expect(s.x).toBeCloseTo(0.5 * Math.sin(2 * t), 3);
    expect(s.v).toBeCloseTo(0.5 * 2 * Math.cos(2 * t), 3);
    // The peak over a full drive period reproduces A = F₀/(c ω₀).
    expect(windowPeak(base, 20, 24)).toBeCloseTo(steadyStateAmplitude(base), 2);
  });

  it("matches the analytic amplitude and phase off resonance", () => {
    const p = { ...base, damping: 0.6, driveFrequency: 1 };
    const t = 60;
    const s = run(p, t);
    const A = steadyStateAmplitude(p);
    const phi = phaseLag(p);
    expect(s.x).toBeCloseTo(A * Math.cos(1 * t - phi), 3);
  });

  it("builds up from rest: the envelope grows toward the steady amplitude", () => {
    // Each window is longer than one drive period, so it contains a peak.
    const early = windowPeak(base, 0, 1.5);
    const mid = windowPeak(base, 8, 12);
    const late = windowPeak(base, 20, 24);
    expect(early).toBeLessThan(0.3);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
    expect(late).toBeCloseTo(steadyStateAmplitude(base), 2);
  });

  it("keeps the drive phase wrapped into [0, 2π) over a long run", () => {
    let s = model.initial(base);
    for (let i = 0; i < 60000; i++) s = model.step(s, base, 1 / 120);
    expect(s.phase).toBeGreaterThanOrEqual(0);
    expect(s.phase).toBeLessThan(TAU);
    expect(wrapPhase(-0.1)).toBeCloseTo(TAU - 0.1, 12);
    expect(wrapPhase(TAU + 0.5)).toBeCloseTo(0.5, 12);
    expect(wrapPhase(0)).toBe(0);
  });

  it("keeps x, v and phase inside the snapshot bounds across the parameter range", () => {
    const resonance = (mass: number, stiffness: number) =>
      Math.min(16, Math.max(0.5, Math.sqrt(stiffness / mass)));
    let maxX = 0;
    let maxV = 0;
    for (const mass of [0.5, 4])
      for (const stiffness of [10, 80])
        for (const damping of [0.4, 5])
          for (const force of [0, 5])
            for (const driveFrequency of [
              0.5,
              16,
              resonance(mass, stiffness),
            ]) {
              const p = { mass, stiffness, damping, force, driveFrequency };
              let s = model.initial(p);
              for (let i = 0; i < 120 * 40; i++) {
                s = model.step(s, p, 1 / 120);
                maxX = Math.max(maxX, Math.abs(s.x));
                maxV = Math.max(maxV, Math.abs(s.v));
                expect(s.phase).toBeGreaterThanOrEqual(0);
                expect(s.phase).toBeLessThan(TAU);
              }
            }
    // The schema bounds are ±50 m and ±100 m/s; the true extremes stay far below.
    expect(Number.isFinite(maxX)).toBe(true);
    expect(Number.isFinite(maxV)).toBe(true);
    expect(maxX).toBeLessThan(50);
    expect(maxV).toBeLessThan(100);
  });

  it("advances the drive phase by ω_d dt in a single step", () => {
    const dt = 1 / 120;
    const s = integrate({ x: 0, v: 0, phase: 0 }, base, dt);
    expect(s.phase).toBeCloseTo(wrapPhase(base.driveFrequency * dt), 12);
  });
});
