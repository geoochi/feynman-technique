import { afterEach, describe, expect, it, vi } from "vitest";
import { Simulation } from "../packages/runtime/simulation";
import { model } from "../examples/physics/pendulum/model";
import { catalog } from "../apps/web/generated/catalog";
const lab = catalog.find((l) => l.slug === "pendulum")!;
describe("snapshot and parameter boundaries", () => {
  it("restores the full evolving state and continues identically", () => {
    const a = new Simulation(lab, model);
    for (let i = 0; i < 157; i++) a.step();
    a.setChapter(4);
    a.setCamera(6);
    const b = new Simulation(lab, model);
    b.restore(JSON.parse(JSON.stringify(a.snapshot())));
    expect(b.snapshot()).toEqual(a.snapshot());
    a.step();
    b.step();
    expect(b.snapshot()).toEqual(a.snapshot());
    expect(b.playing).toBe(false);
  });
  it.each([NaN, Infinity, -1, 10])(
    "rejects illegal length %s without mutation",
    (value) => {
      const sim = new Simulation(lab, model),
        before = sim.snapshot();
      expect(() => sim.setParams({ ...sim.params, length: value })).toThrow();
      expect(sim.snapshot()).toEqual(before);
    },
  );
  it("rejects incompatible snapshots and unknown state fields atomically", () => {
    const sim = new Simulation(lab, model),
      before = sim.snapshot();
    for (const change of [
      { labVersion: "99.0.0" },
      { simulationTime: -1 },
      { camera: { distance: 100 } },
      { internalState: { theta: 0, omega: 0, evil: 1 } },
      { params: { ...before.params, gravity: Infinity } },
      { activeChapter: 100 },
      { seed: -1 },
    ]) {
      expect(() => sim.restore({ ...before, ...change })).toThrow();
      expect(sim.snapshot()).toEqual(before);
    }
  });
  it("resets internal state on changed parameters", () => {
    const sim = new Simulation(lab, model);
    sim.singleStep();
    sim.setParams({ ...sim.params, angle: 0.5 });
    expect(sim.time).toBe(0);
    expect(sim.state).toEqual({ theta: 0.5, omega: 0 });
  });
});

describe("simulation clock lifecycle", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("discards hidden-page time and releases its frame callback", () => {
    const doc = Object.assign(new EventTarget(), { hidden: false });
    let frame: FrameRequestCallback = () => {};
    vi.stubGlobal("document", doc);
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frame = fn;
      return 1;
    });
    const cancel = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const sim = new Simulation(lab, model);
    sim.start();
    sim.toggle();
    frame(0);
    frame(100);
    const before = sim.snapshot();
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    frame(100000);
    expect(sim.snapshot()).toEqual(before);
    sim.dispose();
    expect(cancel).toHaveBeenCalledWith(1);
    frame(100100);
    expect(sim.snapshot()).toEqual(before);
  });
});
