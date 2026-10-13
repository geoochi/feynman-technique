import { stateValidators } from "../apps/web/generated/state-validators";
import { it, expect } from "vitest";
import { runtimeConfig } from "../packages/core/runtime-config";
import { Simulation } from "../packages/runtime/simulation";
import { catalog } from "../apps/web/generated/catalog";
import { model } from "../examples/physics/pendulum/model";
it("minimal runtime config retains chapter bounds and exact snapshot continuation without any lesson data", () => {
  const lab = catalog.find((l) => l.slug === "pendulum")!;
  const config = {
    id: lab.id,
    version: lab.version,
    parameters: lab.parameters,
    stateSchema: lab.stateSchema,
    chapterCount: 7,
  };
  const source = new Simulation(
    runtimeConfig(lab),
    model,
    stateValidators[lab.id].validate,
  );
  for (let i = 0; i < 240; i++) source.step();
  source.setChapter(6);
  source.setCamera(7);
  const target = new Simulation(
    config,
    model,
    stateValidators[lab.id].validate,
  );
  target.restore(source.snapshot());
  source.step();
  target.step();
  expect(target.snapshot()).toEqual(source.snapshot());
  const before = target.snapshot();
  expect(() => target.restore({ ...before, activeChapter: 7 })).toThrow();
  expect(target.snapshot()).toEqual(before);
  target.setChapter(20);
  expect(target.chapter).toBe(6);
});

it.each(catalog.map((l) => l.slug))(
  "compiled state validators preserve complete %s snapshots and reject non-finite states atomically",
  async (slug) => {
    const { controllerLoaders } = await import(
      "../apps/web/generated/controllers"
    );
    const lab = catalog.find((l) => l.slug === slug)!,
      { model } = await controllerLoaders[slug]();
    const validator = stateValidators[lab.id].validate;
    const a = new Simulation(runtimeConfig(lab), model, validator);
    a.seed = 99;
    a.setCamera(7);
    a.setChapter(4);
    for (let i = 0; i < 137; i++) a.step();
    const b = new Simulation(runtimeConfig(lab), model, validator);
    b.restore(JSON.parse(JSON.stringify(a.snapshot())));
    a.step();
    b.step();
    expect(a.snapshot()).toEqual(b.snapshot());
    const before = b.snapshot(),
      key = Object.keys(before.internalState)[0];
    expect(() =>
      b.restore({
        ...before,
        internalState: { ...before.internalState, [key]: Infinity },
      }),
    ).toThrow();
    expect(b.snapshot()).toEqual(before);
  },
);
