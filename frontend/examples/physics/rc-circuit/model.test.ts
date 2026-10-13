import { describe, expect, it } from "vitest";
import type { Params } from "../../../packages/core/types";
import {
  capacitorCurrent,
  capacitorVoltage,
  finalVoltage,
  model,
  timeConstant,
} from "./model";

// Charging from rest, and discharging from 10 V to a dead source; τ = 40 × 0.05 = 2 s.
const charging = { emf: 6, initialVoltage: 0, resistance: 40, capacitance: 0.05 };
const discharging = { emf: 0, initialVoltage: 10, resistance: 40, capacitance: 0.05 };

describe("RC circuit", () => {
  it("starts at the initial capacitor voltage and cannot jump", () => {
    expect(model.initial(charging)).toEqual({ u: 0 });
    expect(model.initial(discharging)).toEqual({ u: 10 });

    // Voltage continuity: an arbitrarily small step moves the voltage by an
    // amount that vanishes with the step, so no jump is ever possible.
    const s = model.initial(charging);
    expect(model.step(s, charging, 0).u).toBeCloseTo(0, 12);
    expect(Math.abs(model.step(s, charging, 1e-9).u - s.u)).toBeLessThan(1e-8);
    expect(Math.abs(model.step(s, charging, 1e-3).u - s.u)).toBeLessThan(1e-2);
    // The instantaneous rate is finite: du/dt|₀ = (E − u₀)/τ = 3 V/s here.
    expect(model.step(s, charging, 1e-6).u / 1e-6).toBeCloseTo(3, 4);
  });

  it("approaches the source EMF as the long-term limit", () => {
    expect(finalVoltage(charging)).toBe(6);
    expect(capacitorVoltage(charging, 1e6)).toBeCloseTo(6, 6);
    expect(capacitorVoltage(discharging, 1e6)).toBeCloseTo(0, 6);
    // After 20 time constants the remaining gap is e^(−20) ≈ 2.06e−9 of the start.
    const gap = Math.abs(capacitorVoltage(charging, 20 * timeConstant(charging)) - 6);
    expect(gap).toBeCloseTo(6 * Math.exp(-20), 9);
  });

  it("matches the analytic solution u(t) = E + (u₀ − E)e^(−t/τ)", () => {
    for (const p of [charging, discharging]) {
      const tau = timeConstant(p);
      for (const t of [0, 0.05, 0.1, 0.37, 1, 2.5, 7, 25]) {
        expect(capacitorVoltage(p, t)).toBeCloseTo(
          p.emf + (p.initialVoltage - p.emf) * Math.exp(-t / tau),
          12,
        );
      }
    }
  });

  it("closes one time constant of the gap after exactly τ = RC", () => {
    expect(timeConstant(charging)).toBeCloseTo(2, 12);
    // Charging: u(τ) − E = (u₀ − E)/e, so u(τ) = E(1 − 1/e) from zero.
    expect(capacitorVoltage(charging, timeConstant(charging))).toBeCloseTo(
      6 * (1 - Math.exp(-1)),
      12,
    );
    expect(capacitorVoltage(charging, timeConstant(charging)) - charging.emf).toBeCloseTo(
      (charging.initialVoltage - charging.emf) / Math.E,
      12,
    );
    // Discharging: the voltage itself drops to 1/e of u₀.
    expect(capacitorVoltage(discharging, timeConstant(discharging))).toBeCloseTo(
      10 / Math.E,
      12,
    );
  });

  it("is monotone between u₀ and E: up when u₀ < E and down when u₀ > E", () => {
    let up = model.initial(charging);
    for (let i = 0; i < 600; i++) {
      const next = model.step(up, charging, 1 / 120);
      expect(next.u).toBeGreaterThanOrEqual(up.u);
      expect(next.u).toBeLessThanOrEqual(charging.emf);
      up = next;
    }
    // 600 steps of 1/120 s = 5 s = 2.5 τ.
    expect(up.u).toBeCloseTo(6 * (1 - Math.exp(-2.5)), 9);

    let down = model.initial(discharging);
    for (let i = 0; i < 600; i++) {
      const next = model.step(down, discharging, 1 / 120);
      expect(next.u).toBeLessThanOrEqual(down.u);
      expect(next.u).toBeGreaterThanOrEqual(discharging.emf);
      down = next;
    }
    expect(down.u).toBeCloseTo(10 * Math.exp(-2.5), 9);
  });

  it("stays put when u₀ already equals E", () => {
    const p = { ...charging, initialVoltage: 6 };
    let s = model.initial(p);
    for (let i = 0; i < 240; i++) s = model.step(s, p, 1 / 120);
    expect(s.u).toBe(6);
    expect(capacitorCurrent(p, 0)).toBe(0);
  });

  it("advances exactly: twelve fixed steps of 1/120 s equal the closed form at t = 0.10 s", () => {
    let s = model.initial(charging);
    for (let i = 0; i < 12; i++) s = model.step(s, charging, 1 / 120);
    expect(s.u).toBeCloseTo(capacitorVoltage(charging, 0.1), 12);
    expect(s.u).toBeCloseTo(6 * (1 - Math.exp(-0.05)), 12);
    // Composing steps is exact: 0.05 s + 0.05 s = 0.10 s.
    const half = model.step(model.initial(charging), charging, 0.05);
    expect(model.step(half, charging, 0.05).u).toBeCloseTo(s.u, 12);
  });

  it("scales the time constant with R and C", () => {
    expect(timeConstant({ ...charging, resistance: 80 })).toBeCloseTo(4, 12);
    expect(timeConstant({ ...charging, capacitance: 0.1 })).toBeCloseTo(4, 12);
    expect(timeConstant({ ...charging, resistance: 80, capacitance: 0.1 })).toBeCloseTo(8, 12);
    // Quadrupling τ makes the same fraction of the gap arrive four times later.
    const slow = { ...charging, resistance: 160 };
    expect(capacitorVoltage(slow, 8)).toBeCloseTo(capacitorVoltage(charging, 2), 12);
    // R and C enter only through their product.
    expect(timeConstant({ ...charging, resistance: 80, capacitance: 0.025 })).toBeCloseTo(
      timeConstant(charging),
      12,
    );
  });

  it("carries the capacitor voltage as its only state, so it can be restored exactly", () => {
    let s = model.initial(charging);
    for (let i = 0; i < 30; i++) s = model.step(s, charging, 1 / 120);
    const mid = s.u;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(charging.emf);
    // Restoring the stored voltage continues from exactly that point.
    let restored: Params = { u: mid };
    for (let i = 0; i < 30; i++) restored = model.step(restored, charging, 1 / 120);
    let continued = s;
    for (let i = 0; i < 30; i++) continued = model.step(continued, charging, 1 / 120);
    expect(restored.u).toBe(continued.u);
  });

  it("gives the capacitor current i(t) = (E − u)/R, largest at t = 0 and decaying to zero", () => {
    expect(capacitorCurrent(charging, 0)).toBeCloseTo(6 / 40, 12);
    expect(capacitorCurrent(charging, timeConstant(charging))).toBeCloseTo(
      (6 / 40) * Math.exp(-1),
      12,
    );
    expect(capacitorCurrent(charging, 1e6)).toBeCloseTo(0, 9);
    // Discharging reverses the current sign.
    expect(capacitorCurrent(discharging, 0)).toBeCloseTo(-10 / 40, 12);
  });
});
