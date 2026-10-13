import {
  cloneParamValues,
  defaults,
  numericParams,
  validateParams,
} from "../core/parameters";
import type {
  RuntimeLabConfig,
  Model,
  Params,
  ParamValues,
  Snapshot,
} from "../core/types";
const DT = 1 / 120;
export class Simulation {
  /** Raw parameter values, including any structured netlist parameter. */
  params: ParamValues;
  /** The numeric projection that models, views and readouts compute with. */
  numeric: Params;
  state: Params;
  time = 0;
  playing = false;
  speed = 1;
  camera = 5;
  chapter = 0;
  seed = 1;
  private accumulator = 0;
  private last: number | null = null;
  private lastPublish = 0;
  private frame = 0;
  private disposed = false;
  private visibilityChange = () => {
    this.last = null;
    this.accumulator = 0;
  };
  private listeners = new Set<() => void>();
  private renderers = new Set<() => void>();
  constructor(
    readonly lab: RuntimeLabConfig,
    private model: Model,
    private validateState: (value: unknown) => boolean,
  ) {
    this.params = defaults(lab.parameters);
    this.numeric = numericParams(this.params, lab.parameters);
    this.state = model.initial(this.numeric);
  }
  private syncNumeric() {
    this.numeric = numericParams(this.params, this.lab.parameters);
  }
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };
  onRender = (callback: () => void) => {
    this.renderers.add(callback);
    callback();
    return () => {
      this.renderers.delete(callback);
    };
  };
  private publish() {
    for (const fn of this.listeners) fn();
    for (const fn of this.renderers) fn();
  }
  setParams(params: ParamValues) {
    validateParams(params, this.lab.parameters);
    this.params = cloneParamValues(params);
    this.syncNumeric();
    this.reset();
  }
  reset() {
    this.state = this.model.initial(this.numeric);
    this.time = 0;
    this.accumulator = 0;
    this.last = null;
    this.publish();
  }
  toggle() {
    this.playing = !this.playing;
    this.last = null;
    this.publish();
  }
  step(dt = DT) {
    if (this.time + dt > 1000000) {
      this.playing = false;
      this.publish();
      return;
    }
    this.state = this.model.step(this.state, this.numeric, dt);
    this.time += dt;
  }
  singleStep() {
    this.playing = false;
    for (let i = 0; i < 12; i++) this.step();
    this.publish();
  }
  setSpeed(speed: number) {
    if (![0.25, 0.5, 1, 2].includes(speed)) throw new Error("不支持的倍速");
    this.speed = speed;
    this.publish();
  }
  setChapter(chapter: number) {
    this.chapter = Math.max(0, Math.min(this.lab.chapterCount - 1, chapter));
    this.publish();
  }
  setCamera(distance: number) {
    this.camera = Math.max(4, Math.min(8, distance));
    this.publish();
  }
  snapshot(): Snapshot {
    return {
      labId: this.lab.id,
      labVersion: this.lab.version,
      sdkVersion: "0.1.0",
      snapshotSchemaVersion: "1",
      params: cloneParamValues(this.params),
      seed: this.seed,
      simulationTime: this.time,
      internalState: { ...this.state },
      camera: { distance: this.camera },
      activeChapter: this.chapter,
    };
  }
  restore(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("快照格式错误。");
    const v = value as Snapshot;
    const keys = Object.keys(this.snapshot());
    if (
      Object.keys(v).length !== keys.length ||
      Object.keys(v).some((k) => !keys.includes(k))
    )
      throw new Error("快照字段不完整或包含未知字段。");
    if (
      v.labId !== this.lab.id ||
      v.labVersion !== this.lab.version ||
      v.sdkVersion !== "0.1.0" ||
      v.snapshotSchemaVersion !== "1"
    )
      throw new Error("快照与当前案例或版本不兼容。");
    validateParams(v.params, this.lab.parameters);
    if (
      !Number.isFinite(v.simulationTime) ||
      v.simulationTime < 0 ||
      v.simulationTime > 1000000 ||
      !Number.isSafeInteger(v.seed) ||
      v.seed < 0 ||
      v.seed > 0xffffffff
    )
      throw new Error("模拟时间或随机种子无效。");
    if (!this.validateState(v.internalState))
      throw new Error("模型内部状态不符合恢复格式。");
    if (
      !v.camera ||
      Object.keys(v.camera).length !== 1 ||
      !Number.isFinite(v.camera.distance) ||
      v.camera.distance < 4 ||
      v.camera.distance > 8
    )
      throw new Error("相机状态无效。");
    if (
      !Number.isInteger(v.activeChapter) ||
      v.activeChapter < 0 ||
      v.activeChapter >= this.lab.chapterCount
    )
      throw new Error("章节不存在。");
    // Validate everything before changing any state; importing never resumes playback.
    this.params = cloneParamValues(v.params);
    this.syncNumeric();
    this.state = { ...v.internalState };
    this.time = v.simulationTime;
    this.camera = v.camera.distance;
    this.chapter = v.activeChapter;
    this.seed = v.seed;
    this.playing = false;
    this.accumulator = 0;
    this.last = null;
    this.publish();
  }
  start() {
    if (this.frame && !this.disposed) return;
    this.disposed = false;
    document.addEventListener("visibilitychange", this.visibilityChange);
    const animate = (now: number) => {
      if (this.disposed) return;
      if (!document.hidden && this.playing && this.last !== null) {
        this.accumulator +=
          Math.min((now - this.last) / 1000, 0.1) * this.speed;
        while (this.accumulator >= DT) {
          this.step();
          this.accumulator -= DT;
        }
        for (const fn of this.renderers) fn();
      }
      this.last = document.hidden ? null : now;
      if (this.playing && now - this.lastPublish > 100) {
        this.lastPublish = now;
        for (const fn of this.listeners) fn();
      }
      this.frame = requestAnimationFrame(animate);
    };
    this.frame = requestAnimationFrame(animate);
  }
  dispose() {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.visibilityChange);
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.listeners.clear();
    this.renderers.clear();
    this.last = null;
  }
}
