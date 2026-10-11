import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { loaders } from "./generated/registry";
import { defaults } from "../../packages/core/parameters";
import { Simulation } from "../../packages/runtime/simulation";
import type { Lab, LabModule } from "../../packages/core/types";
import { ParameterControl } from "../../packages/ui/ParameterControl";
import { Brand } from "./App";
import s from "./LabPage.module.css";
import { useI18n } from "../../packages/i18n/I18n";
import { LanguageSwitcher } from "../../packages/i18n/LanguageSwitcher";
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
  const { t, href, locale } = useI18n();
  const [loaded, setLoaded] = useState<LabModule | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    loaders[lab.slug]().then(
      (m) => {
        if (active) setLoaded(m);
      },
      () => {
        if (active) setError(true);
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
        <h1>{lab.title[locale]}</h1>
        <p role="status">{t(error ? "moduleFailed" : "loading")}</p>
        {error && (
          <button onClick={() => window.location.reload()}>{t("retry")}</button>
        )}
        <a href={href(`/learn/${lab.slug}`)}>{t("readNotes")} →</a>
      </main>
    );
  return <Session key={lab.slug} lab={lab} module={loaded} />;
}
function Session({ lab, module }: { lab: Lab; module: LabModule }) {
  const { t, href, locale } = useI18n();
  const hasPlayback = module.playback !== false;
  const [simulation] = useState(() => new Simulation(lab, module.model));
  const [snapshot, setSnapshot] = useState(() => simulation.snapshot());
  const [notice, setNotice] = useState(false);
  const [playing, setPlaying] = useState(false),
    [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const off = simulation.subscribe(() => {
      setSnapshot(simulation.snapshot());
      setPlaying(simulation.playing);
    });
    if (hasPlayback) simulation.start();
    return () => {
      off();
      simulation.dispose();
    };
  }, [simulation, hasPlayback]);
  useEffect(() => {
    const listener = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);
  const problem = lab.content[locale].chapters.find(
    (chapter) => chapter.id === "problem",
  )!;
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setNotice(true);
    }
  };
  const View = module.default,
    Readouts = module.Readouts;
  const viewProps = {
    simulation,
    params: snapshot.params,
    state: snapshot.internalState,
    time: snapshot.simulationTime,
    camera: snapshot.camera.distance,
  };
  return (
    <div className={s.shell} data-theme={lab.theme} ref={root}>
      <header className={s.header}>
        <Brand />
        <a href={href("/")} className={s.back}>
          ← {t("catalog")}
        </a>
        <span className={s.headerTitle}>{lab.title[locale]}</span>
        <LanguageSwitcher />
        <nav aria-label={t("tools")}>
          <button onClick={toggleFull}>
            {t(fullscreen ? "exitFullscreen" : "fullscreen")}
          </button>
        </nav>
      </header>
      <div className={s.layout}>
        <aside className={s.left} aria-label={t("introduction")}>
          <p className={s.micro}>EXPLORE / {lab.subjects[0].toUpperCase()}</p>
          <h1>{lab.title[locale]}</h1>
          <p className={s.summary}>{lab.summary[locale]}</p>
          <section className={s.problem} aria-label={t("questionRegion")}>
            <h2>{t("questions")}</h2>
            <div dangerouslySetInnerHTML={{ __html: problem.html }} />
          </section>
          <a className={s.readMore} href={href(`/learn/${lab.slug}`)}>
            {t("fullNotes")} ↗
          </a>
        </aside>
        <main id="main" className={s.workspace}>
          <section className={s.stageColumn} aria-label={t("diagram")}>
            <div className={s.stageHeader}>
              <span className={s.micro}>LIVE EXPERIMENT</span>
              <span className={s.paused}>
                <i />
                {t(
                  hasPlayback
                    ? playing
                      ? "running"
                      : "paused"
                    : "parameterExplore",
                )}
              </span>
            </div>
            <div className={s.stage}>
              <SceneBoundary
                fallback={
                  <div className={s.sceneError}>
                    <img src={lab.previewUrl} alt={t("staticDiagram")} />
                    <p>{t("renderFailed")}</p>
                    <a href={href(`/learn/${lab.slug}`)}>{t("openNotes")}</a>
                  </div>
                }
              >
                <View {...viewProps} />
              </SceneBoundary>
            </div>
          </section>
          <div className={s.sidebar}>
            <aside
              className={s.controlPanel}
              aria-label={t(hasPlayback ? "playbackParameters" : "parameters")}
            >
              <h2 className={s.panelTitle}>
                {t(hasPlayback ? "controls" : "parameters")}{" "}
                <span>{hasPlayback ? "CONTROLS" : "PARAMETERS"}</span>
              </h2>
              {hasPlayback && (
                <div className={s.playback}>
                  <button
                    className={s.playButton}
                    onClick={() => simulation.toggle()}
                    aria-label={t(playing ? "pause" : "play")}
                  >
                    {playing ? "Ⅱ " : "▷ "}
                    {t(playing ? "pause" : "play")}
                  </button>
                  <button onClick={() => simulation.singleStep()}>
                    {t("singleStep")}
                  </button>
                  <button
                    onClick={() => {
                      if (simulation.playing) simulation.toggle();
                      simulation.reset();
                      setNotice(false);
                    }}
                  >
                    {t("reset")}
                  </button>
                  <span className={s.clock} aria-label={t("time")}>
                    t = {snapshot.simulationTime.toFixed(2)} s
                  </span>
                </div>
              )}
              {notice && (
                <p role="status" className={s.notice}>
                  {t("fullscreenUnsupported")}
                </p>
              )}
              <div
                className={`${s.parameterHeading} ${hasPlayback ? "" : s.staticParameterHeading}`}
              >
                {hasPlayback && <h3>{t("parameters")}</h3>}
                <button
                  onClick={() => {
                    if (simulation.playing) simulation.toggle();
                    simulation.setParams(defaults(lab.parameters));
                    setNotice(false);
                  }}
                >
                  {t("resetParameters")}
                </button>
              </div>
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
              <p className={s.hint}>
                {t(hasPlayback ? "parameterHint" : "staticHint")}
              </p>
            </aside>
            <section className={s.readoutPanel} aria-label={t("readouts")}>
              <h2 className={s.panelTitle}>
                {t("readouts")} <span>MODEL</span>
              </h2>
              <Readouts {...viewProps} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
