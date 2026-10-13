"use client";
import {
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";
import type {
  RuntimeLabConfig,
  LabController,
  PreparedFormula,
  Snapshot,
  ViewProps,
} from "../../../packages/core/types";
import type { Locale } from "../../../packages/i18n/locales";
import { resolveRoute } from "../../../packages/i18n/locales";
import { I18nProvider, useI18n } from "../../../packages/i18n/I18n";
import {
  defaults,
  netlistParam,
  numericParams,
} from "../../../packages/core/parameters";
import { Simulation } from "../../../packages/runtime/simulation";
import { ParameterControl } from "../../../packages/ui/ParameterControl";
import { stateValidators } from "../generated/state-validators";
import { controllerLoaders } from "../generated/controllers";
import { sceneLoaders } from "../generated/scenes";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import { attachSession } from "./handoff";
import s from "../LabPage.module.css";
// Start the tiny current-case controller when its client entry executes, before hydration.
// The loader comes only from the validated registry, never from a URL-built module path.
const initialSlug =
  typeof window === "undefined"
    ? undefined
    : resolveRoute(window.location.pathname).path.match(
        /^\/labs\/([a-z0-9-]+)$/,
      )?.[1];
const initialController =
  initialSlug && Object.hasOwn(controllerLoaders, initialSlug)
    ? controllerLoaders[initialSlug]()
    : undefined;
initialController?.catch(() => {});
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
export function ExperimentSession({
  lab,
  locale,
  introduction,
  header,
  tools,
  formulas,
}: {
  lab: RuntimeLabConfig & {
    slug: string;
    theme: string;
    previewUrl: string;
    playback: boolean;
  };
  locale: Locale;
  introduction: ReactNode;
  header: ReactNode;
  tools: ReactNode;
  formulas: Record<string, PreparedFormula>;
}) {
  return (
    <I18nProvider locale={locale}>
      <Session
        lab={lab}
        introduction={introduction}
        header={header}
        tools={tools}
        formulas={formulas}
      />
    </I18nProvider>
  );
}
function Session({
  lab,
  introduction,
  header,
  tools,
  formulas,
}: {
  lab: RuntimeLabConfig & {
    slug: string;
    theme: string;
    previewUrl: string;
    playback: boolean;
  };
  introduction: ReactNode;
  header: ReactNode;
  tools: ReactNode;
  formulas: Record<string, PreparedFormula>;
}) {
  const { t } = useI18n();
  const hasPlayback = lab.playback;
  const [ready, setReady] = useState(false);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [module, setModule] = useState<LabController | null>(null);
  const [View, setView] = useState<ComponentType<ViewProps> | null>(null);
  const [modelFailed, setModelFailed] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const [modelAttempt, setModelAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [notice, setNotice] = useState(false);
  const [playing, setPlaying] = useState(false),
    [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.documentElement.dataset.feynmanShellReady = "true";
    for (const node of document.querySelectorAll<HTMLElement>(
      "[data-bootstrap-fallback]",
    ))
      node.hidden = true;
    let active = true;
    let simulation: Simulation | undefined,
      off: (() => void) | undefined,
      detach: (() => void) | undefined;
    setModelFailed(false);
    setReady(false);
    (modelAttempt === 0 && initialSlug === lab.slug && initialController
      ? initialController
      : controllerLoaders[lab.slug]()
    )
      .then((controller) => {
        if (!active) return;
        const validator = stateValidators[lab.id];
        if (
          !validator ||
          JSON.stringify(validator.schema) !== JSON.stringify(lab.stateSchema)
        )
          throw new Error("State schema does not match the compiled validator");
        simulation = new Simulation(lab, controller.model, validator.validate);
        off = simulation.subscribe(() => {
          setSnapshot(simulation!.snapshot());
          setPlaying(simulation!.playing);
        });
        detach = attachSession(
          simulation,
          () => setRestoreFailed(true),
          setReady,
        );
        if (hasPlayback) simulation.start();
        setSnapshot(simulation.snapshot());
        setPlaying(simulation!.playing);
        setSimulation(simulation);
        setModule(controller);
        setReady(true);
      })
      .catch(() => {
        if (active) setModelFailed(true);
      });
    return () => {
      delete document.documentElement.dataset.feynmanShellReady;
      active = false;
      detach?.();
      off?.();
      simulation?.dispose();
    };
  }, [lab.slug, modelAttempt, hasPlayback]);
  useEffect(() => {
    let active = true;
    setSceneFailed(false);
    sceneLoaders[lab.slug]()
      .then((scene) => {
        if (active) setView(() => scene.default);
      })
      .catch(() => {
        if (active) setSceneFailed(true);
      });
    return () => {
      active = false;
    };
  }, [lab.slug, sceneAttempt]);
  useEffect(() => {
    if (ready && !restoreFailed) performance.mark("feynman:controls-ready");
  }, [ready, restoreFailed]);
  useEffect(() => {
    const listener = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setNotice(true);
    }
  };

  const values = snapshot?.params ?? defaults(lab.parameters);
  const viewProps = {
    simulation: simulation!,
    params: numericParams(values, lab.parameters),
    netlist: netlistParam(values, lab.parameters),
    state: snapshot?.internalState ?? {},
    time: snapshot?.simulationTime ?? 0,
    camera: snapshot?.camera.distance ?? 5,
    formulas,
  };
  return (
    <div
      className={s.shell}
      data-theme={lab.theme}
      data-controls-ready={ready && !restoreFailed && !modelFailed}
      ref={root}
    >
      {modelFailed && (
        <div role="alert" className={s.notice}>
          <p>{t("moduleFailed")}</p>
          <button onClick={() => setModelAttempt((n) => n + 1)}>
            {t("retry")}
          </button>
        </div>
      )}
      {restoreFailed && <p role="alert">{t("sessionRestoreFailed")}</p>}
      <header className={s.header}>
        {header}
        <nav aria-label={t("tools")}>
          {tools}
          <button onClick={toggleFull}>
            {t(fullscreen ? "exitFullscreen" : "fullscreen")}
          </button>
        </nav>
      </header>
      <div className={s.layout}>
        {introduction}
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
                key={sceneAttempt}
                fallback={
                  <div className={s.sceneError}>
                    <img src={lab.previewUrl} alt={t("staticDiagram")} />
                    <p>{t("renderFailed")}</p>
                    <button onClick={() => setSceneAttempt((n) => n + 1)}>
                      {t("retry")}
                    </button>
                  </div>
                }
              >
                {View && simulation ? (
                  <View {...viewProps} />
                ) : (
                  <div className={s.sceneError}>
                    <img
                      src={lab.previewUrl}
                      alt={t("staticDiagram")}
                      width="600"
                      height="260"
                    />
                    <p role="status">
                      {t(
                        sceneFailed
                          ? "renderFailed"
                          : modelFailed
                            ? "moduleFailed"
                            : "preparing",
                      )}
                    </p>
                    {sceneFailed && (
                      <button onClick={() => setSceneAttempt((n) => n + 1)}>
                        {t("retry")}
                      </button>
                    )}
                    <noscript>
                      <p>{t("noScript")}</p>
                    </noscript>
                  </div>
                )}
              </SceneBoundary>
            </div>
          </section>
          <div className={s.sidebar}>
            <aside
              className={s.controlPanel}
              aria-label={t(hasPlayback ? "playbackParameters" : "parameters")}
            >
              <fieldset
                disabled={!ready || restoreFailed || modelFailed}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
                <h2 className={s.panelTitle}>
                  {t(hasPlayback ? "controls" : "parameters")}{" "}
                  <span>{hasPlayback ? "CONTROLS" : "PARAMETERS"}</span>
                </h2>
                {hasPlayback && (
                  <div className={s.playback}>
                    <button
                      className={s.playButton}
                      onClick={() => simulation!.toggle()}
                      aria-label={t(playing ? "pause" : "play")}
                    >
                      {playing ? "Ⅱ " : "▷ "}
                      {t(playing ? "pause" : "play")}
                    </button>
                    <button onClick={() => simulation!.singleStep()}>
                      {t("singleStep")}
                    </button>
                    <button
                      onClick={() => {
                        if (simulation!.playing) simulation!.toggle();
                        simulation!.reset();
                        setNotice(false);
                      }}
                    >
                      {t("reset")}
                    </button>
                    <span className={s.clock} aria-label={t("time")}>
                      t = {(snapshot?.simulationTime ?? 0).toFixed(2)} s
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
                      if (simulation!.playing) simulation!.toggle();
                      simulation!.setParams(defaults(lab.parameters));
                      setNotice(false);
                    }}
                  >
                    {t("resetParameters")}
                  </button>
                </div>
                {Object.entries(lab.parameters.properties).map(([key, spec]) =>
                  spec.type === "number" ? (
                    <ParameterControl
                      key={key}
                      name={key}
                      spec={spec}
                      resetToken={snapshot?.params}
                      value={viewProps.params[key]}
                      onChange={(v) =>
                        simulation!.setParams({
                          ...simulation!.params,
                          [key]: v,
                        })
                      }
                    />
                  ) : null,
                )}
                <p className={s.hint}>
                  {t(hasPlayback ? "parameterHint" : "staticHint")}
                </p>
              </fieldset>
            </aside>
            <section className={s.readoutPanel} aria-label={t("readouts")}>
              <h2 className={s.panelTitle}>
                {t("readouts")} <span>MODEL</span>
              </h2>
              {module && simulation ? (
                <module.Readouts {...viewProps} />
              ) : (
                <FormulaMarkup formula={formulas.default} />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
