import { describe, expect, it } from "vitest";
import {
  TAU,
  angularFrequency,
  antinodePositions,
  displacement,
  displacementAtPhase,
  envelope,
  frequency,
  modeNumber,
  model,
  nodePositions,
  waveLeft,
  waveNumber,
  waveRight,
  wavelength,
  wrapPhase,
} from "./model";

// A reference case: second mode on a 2 m string with v = 8 m/s.
const base = { mode: 2, amplitude: 0.1, length: 2, speed: 8 };

// Positions and phases used to sample the profiles below.
const xs = Array.from({ length: 401 }, (_, i) => (i / 400) * 4);
const phases = Array.from({ length: 720 }, (_, i) => (i / 720) * TAU);

describe("standing wave on a fixed string", () => {
  it("derives the allowed wavelength λ_n = 2L/n from the mode number", () => {
    // L = 2 m: λ₁ = 4 m, λ₂ = 2 m, λ₃ = 4/3 m, λ₆ = 2/3 m.
    expect(wavelength({ ...base, mode: 1 })).toBeCloseTo(4, 12);
    expect(wavelength(base)).toBeCloseTo(2, 12);
    expect(wavelength({ ...base, mode: 3 })).toBeCloseTo(4 / 3, 12);
    expect(wavelength({ ...base, mode: 6 })).toBeCloseTo(2 / 3, 12);
    for (const mode of [1, 2, 3, 4, 5, 6])
      for (const length of [1, 1.7, 2, 3.3, 4])
        expect(wavelength({ ...base, mode, length })).toBeCloseTo(
          (2 * length) / mode,
          12,
        );
  });

  it("fits a whole number of half wavelengths between the fixed ends", () => {
    for (const mode of [1, 2, 3, 4, 5, 6]) {
      const p = { ...base, mode };
      const lambda = wavelength(p);
      // L = n λ/2 exactly, so sin(kL) = 0 and both ends are nodes.
      expect(p.length).toBeCloseTo((mode * lambda) / 2, 12);
      expect(Math.sin(waveNumber(p) * p.length)).toBeCloseTo(0, 12);
    }
  });

  it("gives the mode frequency f_n = n v / (2L) and f = v/λ", () => {
    // L = 2 m, v = 8 m/s: f₁ = 2 Hz, f₂ = 4 Hz, f₃ = 6 Hz.
    expect(frequency({ ...base, mode: 1 })).toBeCloseTo(2, 12);
    expect(frequency(base)).toBeCloseTo(4, 12);
    expect(frequency({ ...base, mode: 3 })).toBeCloseTo(6, 12);
    for (const mode of [1, 2, 3, 4, 5, 6]) {
      const p = { ...base, mode };
      expect(frequency(p)).toBeCloseTo((mode * p.speed) / (2 * p.length), 12);
      expect(frequency(p)).toBeCloseTo(p.speed / wavelength(p), 12);
      expect(angularFrequency(p)).toBeCloseTo(TAU * frequency(p), 12);
    }
    // Doubling the wave speed doubles every mode frequency.
    expect(frequency({ ...base, speed: 16 }) / frequency(base)).toBeCloseTo(
      2,
      12,
    );
  });

  it("places n+1 nodes at x_k = kL/n and n antinodes between them", () => {
    expect(nodePositions({ ...base, mode: 1 })).toEqual([0, 2]);
    expect(nodePositions(base)).toEqual([0, 1, 2]);
    expect(nodePositions({ ...base, mode: 3 })).toEqual([0, 2 / 3, 4 / 3, 2]);
    expect(antinodePositions(base)).toEqual([0.5, 1.5]);
    expect(antinodePositions({ ...base, mode: 3 })).toEqual([
      1 / 3,
      1,
      5 / 3,
    ]);
    for (const mode of [1, 2, 3, 4, 5, 6]) {
      const p = { ...base, mode };
      const nodes = nodePositions(p);
      expect(nodes).toHaveLength(mode + 1);
      expect(antinodePositions(p)).toHaveLength(mode);
      // Both ends are nodes and the spacing is uniform.
      expect(nodes[0]).toBeCloseTo(0, 12);
      expect(nodes[mode]).toBeCloseTo(p.length, 12);
      for (let k = 0; k < mode; k++)
        expect(nodes[k + 1] - nodes[k]).toBeCloseTo(p.length / mode, 12);
    }
  });

  it("keeps both fixed ends at zero for every mode and every time", () => {
    for (const mode of [1, 2, 3, 4, 5, 6])
      for (const length of [1, 2, 4]) {
        const p = { ...base, mode, length };
        for (const t of [0, 0.13, 0.77, 1.5, 3.2, 9.4]) {
          expect(displacement(p, 0, t)).toBeCloseTo(0, 12);
          expect(displacement(p, p.length, t)).toBeCloseTo(0, 12);
        }
      }
  });

  it("holds every node motionless while the antinodes swing to ±2A", () => {
    const p = { ...base, mode: 3, amplitude: 0.15 };
    for (const x of nodePositions(p))
      for (const phase of phases)
        expect(displacementAtPhase(p, x, phase)).toBeCloseTo(0, 12);
    for (const x of antinodePositions(p)) {
      expect(envelope(p, x)).toBeCloseTo(2 * p.amplitude, 12);
      const peak = Math.max(
        ...phases.map((phase) => Math.abs(displacementAtPhase(p, x, phase))),
      );
      expect(peak).toBeCloseTo(2 * p.amplitude, 4);
    }
  });

  it("matches the resultant profile to the envelope 2A|sin(kx)|", () => {
    for (const mode of [1, 2, 4]) {
      const p = { ...base, mode, amplitude: 0.2 };
      for (const x of xs) {
        const peak = Math.max(
          ...phases.map((phase) => Math.abs(displacementAtPhase(p, x, phase))),
        );
        expect(peak).toBeCloseTo(envelope(p, x), 4);
      }
    }
  });

  it("splits the standing wave into two counter-propagating waves", () => {
    const p = { ...base, mode: 3, amplitude: 0.12, length: 3 };
    for (const x of [0, 0.4, 1.1, 2.5, 3])
      for (const phase of [0, 0.3, 1.7, Math.PI, 5.1])
        expect(waveRight(p, x, phase) + waveLeft(p, x, phase)).toBeCloseTo(
          displacementAtPhase(p, x, phase),
          12,
        );
    // Each component keeps its own amplitude A.
    for (const phase of [0, 2.2])
      for (const x of xs) {
        expect(Math.abs(waveRight(p, x, phase))).toBeLessThanOrEqual(
          p.amplitude + 1e-12,
        );
        expect(Math.abs(waveLeft(p, x, phase))).toBeLessThanOrEqual(
          p.amplitude + 1e-12,
        );
      }
  });

  it("flattens the string a quarter period after the peak", () => {
    const p = { ...base, mode: 2, amplitude: 0.2 };
    // At ωt = π/2 the time factor cos(ωt) vanishes, so y = 0 everywhere.
    for (const x of xs)
      expect(displacementAtPhase(p, x, Math.PI / 2)).toBeCloseTo(0, 12);
    // At ωt = π the profile is the negative of the ωt = 0 profile.
    for (const x of xs)
      expect(displacementAtPhase(p, x, Math.PI)).toBeCloseTo(
        -displacementAtPhase(p, x, 0),
        12,
      );
  });

  it("repeats the profile every period T = 1/f", () => {
    const p = { ...base, mode: 3, amplitude: 0.1, speed: 6 };
    const T = 1 / frequency(p);
    for (const x of [0.3, 1.2, 2.7])
      for (const t of [0, 0.11, 0.85])
        expect(displacement(p, x, t + T)).toBeCloseTo(
          displacement(p, x, t),
          10,
        );
  });

  it("rounds the mode number to an integer and clamps it to 1–6", () => {
    expect(modeNumber(base)).toBe(2);
    expect(modeNumber({ ...base, mode: 2.4 })).toBe(2);
    expect(modeNumber({ ...base, mode: 2.6 })).toBe(3);
    expect(modeNumber({ ...base, mode: 0.4 })).toBe(1);
    expect(modeNumber({ ...base, mode: 9 })).toBe(6);
    expect(wavelength({ ...base, mode: 2.4 })).toBeCloseTo(2, 12);
    expect(wavelength({ ...base, mode: 9 })).toBeCloseTo(2 / 3, 12);
  });

  it("keeps the wavelength fixed by L and n alone", () => {
    expect(wavelength({ ...base, amplitude: 0.25, speed: 20 })).toBeCloseTo(
      wavelength(base),
      12,
    );
    expect(wavelength({ ...base, length: 3, mode: 3 })).toBeCloseTo(2, 12);
  });

  it("advances the animation phase by ω dt and stays inside the snapshot bounds", () => {
    const p = { ...base, mode: 2, length: 2, speed: 8 };
    let s = model.initial(p);
    expect(s).toEqual({ phase: 0 });
    const dt = 1 / 120;
    s = model.step(s, p, dt);
    expect(s.phase).toBeCloseTo(wrapPhase(angularFrequency(p) * dt), 12);
    for (let i = 0; i < 5000; i++) s = model.step(s, p, dt);
    expect(s.phase).toBeGreaterThanOrEqual(0);
    expect(s.phase).toBeLessThan(TAU);
    // Wrapping does not change the drawn profile.
    expect(displacementAtPhase(p, 0.7, s.phase)).toBeCloseTo(
      displacementAtPhase(p, 0.7, s.phase + TAU),
      10,
    );
  });

  it("wraps the phase into [0, 2π)", () => {
    expect(wrapPhase(-0.1)).toBeCloseTo(TAU - 0.1, 12);
    expect(wrapPhase(TAU + 0.5)).toBeCloseTo(0.5, 12);
    expect(wrapPhase(0)).toBe(0);
  });
});
