import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { loaders } from "./generated/registry";
import { Simulation } from "../../packages/runtime/simulation";
import type { Lab, LabModule } from "../../packages/core/types";
import { ParameterControl } from "../../packages/ui/ParameterControl";
import { Brand } from "./App";
import s from "./LabPage.module.css";
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function LabPage({ lab }: { lab: Lab }) {
  const [loaded, setLoaded] = useState<LabModule | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    loaders[lab.slug]().then(
      (m) => {
        if (active) setLoaded(m);
      },
      () => {
        if (active)
          setError("实验资源加载失败。请刷新重试，也可以先阅读完整讲解。");
      },
    );
    return () => {
      active = false;
    };
  }, [lab.slug]);
  if (!loaded)
    return (
      <main className={s.loading}>
        <Brand />
        <h1>{lab.title["zh-CN"]}</h1>
        <p role="status">{error || "正在加载实验资源…"}</p>
        {error && (
          <button onClick={() => window.location.reload()}>刷新重试</button>
        )}
        <a href={`/learn/${lab.slug}`}>阅读完整讲解 →</a>
      </main>
    );
  return <Session key={lab.slug} lab={lab} module={loaded} />;
}
function Session({ lab, module }: { lab: Lab; module: LabModule }) {
  const [simulation] = useState(() => new Simulation(lab, module.model));
  const [snapshot, setSnapshot] = useState(() => simulation.snapshot());
  const [notice, setNotice] = useState(""),
    [choice, setChoice] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1),
    [playing, setPlaying] = useState(false),
    [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const off = simulation.subscribe(() => {
      setSnapshot(simulation.snapshot());
      setPlaying(simulation.playing);
    });
    simulation.start();
    return () => {
      off();
      simulation.dispose();
    };
  }, [simulation]);
  useEffect(() => {
    const listener = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);
  const chapter = lab.chapters[snapshot.activeChapter];
  const exportState = () => {
    const blob = new Blob([JSON.stringify(simulation.snapshot(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${lab.slug}-v${lab.version}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("已导出参数、模拟时间、内部状态和视角。");
  };
  const importState = async (input: File | undefined) => {
    if (!input) return;
    try {
      if (input.size > 16384) throw new Error("快照最大为 16 KiB。");
      simulation.restore(JSON.parse(await input.text()));
      setNotice("已恢复快照，实验保持暂停。");
      setChoice(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "无法读取快照。");
    }
    if (file.current) file.current.value = "";
  };
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setNotice("当前浏览器不支持全屏。");
    }
  };
  const View = module.default;
  return (
    <div className={s.shell} data-theme={lab.theme} ref={root}>
      <header className={s.header}>
        <Brand />
        <a href="/" className={s.back}>
          ← 实验目录
        </a>
        <span className={s.headerTitle}>{lab.title["zh-CN"]}</span>
        <nav aria-label="实验工具">
          <a
            href={`https://github.com/geoochi/feynman/tree/main/frontend/${lab.path}`}
            target="_blank"
            rel="noreferrer"
          >
            源码 ↗
          </a>
          <a href="/contribute">改编 / 贡献 ↗</a>
          <button onClick={toggleFull}>
            {fullscreen ? "退出全屏" : "全屏"}
          </button>
        </nav>
      </header>
      <div className={s.layout}>
        <aside className={s.left}>
          <p className={s.micro}>EXPLORE / {lab.subjects[0].toUpperCase()}</p>
          <h1>{lab.title["zh-CN"]}</h1>
          <p className={s.summary}>{lab.summary["zh-CN"]}</p>
          <div className={s.lessonMeta}>
            {lab.estimatedMinutes} 分钟 <span>v{lab.version}</span>
          </div>
          <h2 className={s.asideTitle}>
            探究路径 <span>07 STEPS</span>
          </h2>
          <nav className={s.chapters} aria-label="讲解章节">
            {lab.chapters.map((c, i) => (
              <button
                key={c.id}
                aria-current={i === snapshot.activeChapter ? "step" : undefined}
                onClick={() => simulation.setChapter(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {c.title}
                <span>{i === snapshot.activeChapter ? "●" : "—"}</span>
              </button>
            ))}
          </nav>
          <div className={s.learning}>
            <p className={s.micro}>你将理解</p>
            <ul>
              {lab.learningObjectives.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className={s.micro}>先修知识</p>
            <p>{lab.prerequisites.join(" · ")}</p>
          </div>
          <a className={s.readMore} href={`/learn/${lab.slug}`}>
            完整探究笔记 ↗
          </a>
        </aside>
        <main id="main" className={s.stageColumn}>
          <div className={s.stageHeader}>
            <span className={s.micro}>LIVE EXPERIMENT</span>
            <span className={s.paused}>
              <i />
              {playing ? "运行中" : "已暂停"}
            </span>
          </div>
          <div className={s.stage}>
            <SceneBoundary
              fallback={
                <div className={s.sceneError}>
                  <img src={lab.previewUrl} alt="实验静态示意图" />
                  <p>渲染暂不可用。仍可调整参数、查看模型数据与阅读讲解。</p>
                  <a href={`/learn/${lab.slug}`}>打开讲解</a>
                </div>
              }
            >
              <View
                simulation={simulation}
                params={snapshot.params}
                state={snapshot.internalState}
                time={snapshot.simulationTime}
                camera={snapshot.camera.distance}
              />
            </SceneBoundary>
          </div>
          <div className={s.playback}>
            <button
              className={s.playButton}
              onClick={() => simulation.toggle()}
              aria-label={playing ? "暂停" : "播放"}
            >
              {playing ? "Ⅱ 暂停" : "▷ 播放"}
            </button>
            <button onClick={() => simulation.singleStep()}>单步</button>
            <button
              onClick={() => {
                simulation.reset();
                setNotice("已从当前参数的初始状态重新开始。");
              }}
            >
              重置
            </button>
            <label>
              速度{" "}
              <select
                aria-label="播放速度"
                value={speed}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSpeed(v);
                  simulation.setSpeed(v);
                }}
              >
                {[0.25, 0.5, 1, 2].map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
            <span className={s.clock} aria-label="模拟时间">
              t = {snapshot.simulationTime.toFixed(2)} s
            </span>
          </div>
          <div className={s.stageTools}>
            <div>
              <button
                aria-label="放大视角"
                onClick={() => simulation.setCamera(simulation.camera - 0.5)}
              >
                ＋
              </button>
              <button
                aria-label="缩小视角"
                onClick={() => simulation.setCamera(simulation.camera + 0.5)}
              >
                −
              </button>
              <span>视角缩放</span>
            </div>
            <span>浏览器计算 · 无需登录</span>
          </div>
          <div className={s.stateTools}>
            <button onClick={exportState}>↓ 导出状态</button>
            <button onClick={() => file.current?.click()}>↑ 恢复状态</button>
            <input
              hidden
              type="file"
              ref={file}
              accept="application/json,.json"
              onChange={(e) => void importState(e.target.files?.[0])}
            />
            <span>快照仅保存到你的设备</span>
          </div>
          {notice && (
            <p role="status" className={s.notice}>
              {notice}
            </p>
          )}
          <div className={s.assumptions}>
            <p className={s.micro}>MODEL NOTES / 适用条件</p>
            <ul>
              {lab.modelAssumptions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </main>
        <aside className={s.right}>
          <section className={s.parameterPanel}>
            <h2 className={s.panelTitle}>
              实验参数 <span>PARAMETERS</span>
            </h2>
            {Object.entries(lab.parameters.properties).map(([key, spec]) => (
              <ParameterControl
                key={key}
                name={key}
                spec={spec}
                resetToken={simulation.params}
                value={snapshot.params[key]}
                onChange={(v) =>
                  simulation.setParams({ ...simulation.params, [key]: v })
                }
              />
            ))}
            <p className={s.hint}>改参会重置模拟时间与模型内部状态。</p>
            <label className={s.presetLabel}>
              快速探索
              <select
                aria-label="应用预设"
                value=""
                onChange={(e) => {
                  const preset = lab.presets.find(
                    (p) => p.id === e.target.value,
                  );
                  if (preset) simulation.setParams(preset.params);
                }}
              >
                <option value="" disabled>
                  选择一个实验预设…
                </option>
                {lab.presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className={s.explanation} aria-label="当前章节">
            <p className={s.micro}>
              CHAPTER {String(snapshot.activeChapter + 1).padStart(2, "0")} / 07
            </p>
            <h2>{chapter.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: chapter.html }} />
            <div className={s.chapterActions}>
              <button
                disabled={snapshot.activeChapter === 0}
                onClick={() => simulation.setChapter(simulation.chapter - 1)}
              >
                ← 上一步
              </button>
              <button
                disabled={snapshot.activeChapter === lab.chapters.length - 1}
                onClick={() => simulation.setChapter(simulation.chapter + 1)}
              >
                下一步 →
              </button>
            </div>
          </section>
          <section className={s.question}>
            <p className={s.micro}>CHECK YOUR UNDERSTANDING</p>
            <h3>{lab.question.prompt}</h3>
            <div role="group" aria-label="自测选项">
              {lab.question.options.map((option, i) => (
                <button
                  key={option}
                  aria-pressed={choice === i}
                  onClick={() => setChoice(i)}
                >
                  {String.fromCharCode(65 + i)} · {option}
                </button>
              ))}
            </div>
            {choice !== null && (
              <p role="status">
                {choice === lab.question.answer ? "判断正确。" : "再想一想。"}
                {lab.question.explanation}
              </p>
            )}
          </section>
          <section className={s.sources}>
            <p className={s.micro}>依据与来源</p>
            {lab.references.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noreferrer">
                {r.title} ↗
              </a>
            ))}
            <p>
              {lab.authors.map((a) => a.name).join(", ")} · 实验性案例 ·
              未独立教学审阅
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
