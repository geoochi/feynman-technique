import { describe, expect, it } from "vitest";
import {
  WAVE_SPEED,
  TAU,
  model,
  angularFrequency,
  displacement,
  resultantAmplitude,
  resultantPhase,
  totalAt,
  wave1,
  wave1At,
  wave2At,
  waveNumber,
  wrapPhase,
} from "./model";
const base = { amplitude1: 1, amplitude2: 1, wavelength: 2, phase: 0 };
// Sample positions across several wavelengths for envelope checks.
const xs = Array.from({ length: 20000 }, (_, i) => (i / 19999) * 8);
const peak = (p: typeof base, phase: number) =>
  Math.max(...xs.map((x) => Math.abs(totalAt(p, x, phase))));

describe("linear wave superposition", () => {
  it("doubles the amplitude for equal in-phase waves", () => {
    expect(resultantAmplitude(base)).toBeCloseTo(2, 12);
    for (const phase of [0, 0.5, 1, 2, 3])
      expect(peak(base, phase)).toBeCloseTo(2, 3);
  });
  it("cancels equal antiphase waves to zero everywhere", () => {
    const p = { ...base, phase: Math.PI };
    expect(resultantAmplitude(p)).toBeCloseTo(0, 12);
    for (const phase of [0, 0.9, 2.4, 5.5])
      for (const x of [0, 0.7, 1.9, 3.3, 6.1, 8])
        expect(totalAt(p, x, phase)).toBeCloseTo(0, 12);
  });
  it("leaves the other wave untouched when one amplitude is zero", () => {
    const p = { ...base, amplitude2: 0 };
    expect(resultantAmplitude(p)).toBeCloseTo(1, 12);
    for (const x of [0, 1.3, 4.2, 7.5])
      for (const phase of [0, 1.1, 4.7])
        expect(totalAt(p, x, phase)).toBeCloseTo(wave1At(p, x, phase), 12);
    const silent = { ...base, amplitude1: 0, amplitude2: 0 };
    expect(resultantAmplitude(silent)).toBeCloseTo(0, 12);
    expect(totalAt(silent, 2.5, 1.7)).toBeCloseTo(0, 12);
  });
  it("matches the phasor amplitude to the envelope of the summed profile", () => {
    for (const phase of [0, 0.7, 1.9, Math.PI, 4.5]) {
      const p = { ...base, phase };
      expect(peak(p, 1.3)).toBeCloseTo(resultantAmplitude(p), 3);
    }
    const unequal = { amplitude1: 1, amplitude2: 0.4, wavelength: 3, phase: 2.2 };
    expect(peak(unequal, 0.4)).toBeCloseTo(resultantAmplitude(unequal), 3);
    expect(resultantAmplitude(unequal)).toBeCloseTo(
      Math.sqrt(1 + 0.16 + 2 * 0.4 * Math.cos(2.2)),
      12,
    );
  });
  it("keeps the |A1 - A2| minimum for antiphase waves of unequal amplitude", () => {
    const p = { amplitude1: 1, amplitude2: 0.4, wavelength: 2.5, phase: Math.PI };
    expect(resultantAmplitude(p)).toBeCloseTo(0.6, 12);
    expect(peak(p, 0.3)).toBeCloseTo(0.6, 3);
  });
  it("propagates in the +x direction at the wave speed", () => {
    const p = { ...base, phase: 0.8 };
    for (const t of [0.05, 0.31, 1.2])
      for (const x of [1, 3.4, 6.7])
        expect(displacement(p, x, t)).toBeCloseTo(
          displacement(p, x - WAVE_SPEED * t, 0),
          10,
        );
    expect(waveNumber(p) * WAVE_SPEED).toBeCloseTo(angularFrequency(p), 12);
    expect(angularFrequency(p)).toBeCloseTo((TAU / p.wavelength) * WAVE_SPEED, 12);
  });
  it("repeats the profile every wavelength", () => {
    const p = { ...base, wavelength: 1.6, phase: 0.35 };
    for (const x of [0.2, 1.1, 4.4])
      for (const phase of [0, 2.3])
        expect(wave1At(p, x + p.wavelength, phase)).toBeCloseTo(
          wave1At(p, x, phase),
          10,
        );
  });
  it("makes the mean squared displacement half the squared resultant amplitude", () => {
    const n = 1024;
    for (const phase of [0, 0.7, Math.PI, 2.9]) {
      const p = { ...base, phase };
      const mean =
        Array.from({ length: n }, (_, i) => {
          const theta = (TAU * i) / n;
          return (p.amplitude1 * Math.sin(theta) +
            p.amplitude2 * Math.sin(theta + p.phase)) ** 2;
        }).reduce((a, b) => a + b, 0) / n;
      expect(mean).toBeCloseTo(resultantAmplitude(p) ** 2 / 2, 10);
    }
  });
  it("advances the animation phase by omega dt and stays inside the snapshot bounds", () => {
    const p = { ...base, wavelength: 1, phase: 0 };
    let s = model.initial(p);
    expect(s).toEqual({ phase: 0 });
    const dt = 1 / 120;
    s = model.step(s, p, dt);
    expect(s.phase).toBeCloseTo(wrapPhase(angularFrequency(p) * dt), 12);
    for (let i = 0; i < 5000; i++) s = model.step(s, p, dt);
    expect(s.phase).toBeGreaterThanOrEqual(0);
    expect(s.phase).toBeLessThan(TAU);
    // Wrapping does not change the drawn profile.
    expect(totalAt(p, 1.3, s.phase)).toBeCloseTo(
      totalAt(p, 1.3, s.phase + TAU),
      10,
    );
  });
  it("wraps the phase into [0, 2π) and keeps the phasor phase well defined", () => {
    expect(wrapPhase(-0.1)).toBeCloseTo(TAU - 0.1, 12);
    expect(wrapPhase(TAU + 0.5)).toBeCloseTo(0.5, 12);
    expect(resultantPhase({ ...base, phase: 0 })).toBeCloseTo(0, 12);
    const p = { amplitude1: 1, amplitude2: 1, wavelength: 2, phase: Math.PI / 2 };
    expect(resultantPhase(p)).toBeCloseTo(Math.PI / 4, 12);
  });
  it("keeps the time-domain helpers consistent with the phase-domain ones", () => {
    const p = { ...base, phase: 1.1, wavelength: 3.3 };
    for (const t of [0, 0.25, 2.5])
      for (const x of [0, 2.2, 7.1]) {
        expect(wave1(p, x, t)).toBeCloseTo(
          wave1At(p, x, angularFrequency(p) * t),
          10,
        );
        expect(totalAt(p, x, angularFrequency(p) * t)).toBeCloseTo(
          displacement(p, x, t),
          10,
        );
      }
    expect(wave2At(p, 1, 0.4) - wave1At(p, 1, 0.4)).toBeCloseTo(
      1 * Math.sin(waveNumber(p) * 1 - 0.4 + p.phase) -
        1 * Math.sin(waveNumber(p) * 1 - 0.4),
      12,
    );
  });
});
