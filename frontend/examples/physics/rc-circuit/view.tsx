import { useEffect, useId, useRef } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { Params, ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { capacitorVoltage, finalVoltage, timeConstant } from "./model";

const W = 600;
// Fixed drawing scales. The seconds-per-pixel and volts-per-pixel mappings are
// constants of the frame, never derived from the current parameter values, so
// changing a parameter moves the drawn objects inside a stable frame instead of
// rescaling or re-framing the whole picture.
const TIME_WINDOW = 10; // seconds shown on the fixed time axis
const V_MIN = -10; // volts at the bottom of the fixed voltage axis
const V_MAX = 10; // volts at the top of the fixed voltage axis
const T_GRID = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const T_LABELS = [0, 2, 4, 6, 8, 10];
const V_LABELS = [-10, -5, 0, 5, 10];
const V_GRID: number[] = [];
for (let v = V_MIN; v <= V_MAX; v += 1) V_GRID.push(v);

export default function RcCircuitView({ simulation, params: p, state }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(W, 470);
  const height = frame.height;

  const trace = useRef<SVGPathElement>(null);
  const cursor = useRef<SVGCircleElement>(null);
  const currentArrow = useRef<SVGLineElement>(null);
  const fieldFill = useRef<SVGRectElement>(null);

  // Circuit geometry, in viewBox units.
  const circuitTop = height * 0.1;
  const circuitBottom = height * 0.38;
  const circuitMidY = (circuitTop + circuitBottom) / 2;
  const loopLeft = 168;
  const loopRight = 432;
  const resistorX0 = 250;
  const resistorX1 = 350;
  const capGap = 9;
  const contactLeft = 296;
  const contactRight = 334;
  const arrowStart = 362;

  // Plot geometry: a fixed coordinate system with labelled axes and units.
  const plotLeft = 104;
  const plotRight = W - 26;
  const plotTop = height * 0.47;
  const plotBottom = height - 54;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const pxPerSecond = plotWidth / TIME_WINDOW;
  const pxPerVolt = plotHeight / (V_MAX - V_MIN);
  const toPx = (t: number) => plotLeft + t * pxPerSecond;
  const toPy = (u: number) => plotTop + (V_MAX - u) * pxPerVolt;

  const tau = timeConstant(p);
  const E = finalVoltage(p);
  const u0 = p.initialVoltage;
  const u = state.u ?? 0;

  const sample = (q: Params, tNow: number) => {
    const end = Math.min(Math.max(tNow, 0), TIME_WINDOW);
    if (end <= 1e-9)
      return `M${toPx(0).toFixed(2)} ${toPy(capacitorVoltage(q, 0)).toFixed(2)}`;
    const parts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const t = (i / 240) * end;
      parts.push(
        `${i === 0 ? "M" : "L"}${toPx(t).toFixed(2)} ${toPy(capacitorVoltage(q, t)).toFixed(2)}`,
      );
    }
    return parts.join(" ");
  };

  const tauInFrame = tau <= TIME_WINDOW + 1e-9;
  const overTime = simulation.time > TIME_WINDOW + 1e-9;
  const tShown = Math.min(Math.max(simulation.time, 0), TIME_WINDOW);
  const arrowDirection = Math.sign(p.emf - p.initialVoltage);
  const tauTextX = toPx(tau) > plotRight - 96 ? toPx(tau) - 5 : toPx(tau) + 5;
  const tauAnchor = toPx(tau) > plotRight - 96 ? "end" : "start";

  useEffect(
    () =>
      simulation.onRender(() => {
        const q = simulation.params;
        const t = simulation.time;
        const voltage = simulation.state.u ?? 0;
        trace.current?.setAttribute("d", sample(q, t));
        const tc = Math.min(Math.max(t, 0), TIME_WINDOW);
        cursor.current?.setAttribute("cx", String(toPx(tc)));
        cursor.current?.setAttribute("cy", String(toPy(voltage)));
        const fraction = Math.exp(-tc / timeConstant(q));
        const length = 44 * fraction;
        currentArrow.current?.setAttribute("x1", String(arrowStart));
        currentArrow.current?.setAttribute(
          "x2",
          String(arrowStart + arrowDirection * length),
        );
        currentArrow.current?.setAttribute(
          "opacity",
          Math.abs(arrowDirection) * fraction < 1e-3 ? "0" : "1",
        );
        const share = Math.min(1, Math.abs(voltage) / V_MAX);
        fieldFill.current?.setAttribute("opacity", (0.18 + 0.62 * share).toFixed(3));
      }),
    [
      simulation,
      plotLeft,
      pxPerSecond,
      pxPerVolt,
      plotTop,
      arrowStart,
      arrowDirection,
    ],
  );

  const segment = (x0: number, y0: number, x1: number, y1: number) =>
    `M${x0},${y0}L${x1},${y1}`;

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <clipPath id={`plot-${id}`}>
            <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} />
          </clipPath>
          <clipPath id={`all-${id}`}>
            <rect width={W} height={height} />
          </clipPath>
          <marker
            id={`arrow-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 10 5 0 10z" fill="var(--color-secondary)" />
          </marker>
        </defs>
        <g clipPath={`url(#all-${id})`}>
          {/* Series loop: source on the left, resistor on top, capacitor on the right. */}
          <g
            stroke="var(--color-text-muted)"
            strokeWidth="1.6"
            fill="none"
            strokeLinejoin="round"
          >
            <path d={segment(loopLeft, circuitTop, resistorX0, circuitTop)} />
            <path d={segment(resistorX1, circuitTop, loopRight, circuitTop)} />
            <path d={segment(loopRight, circuitTop, loopRight, circuitMidY - capGap)} />
            <path d={segment(loopRight, circuitMidY + capGap, loopRight, circuitBottom)} />
            <path d={segment(loopLeft, circuitBottom, contactLeft, circuitBottom)} />
            <path d={segment(contactRight, circuitBottom, loopRight, circuitBottom)} />
            <path d={segment(loopLeft, circuitTop, loopLeft, circuitMidY - 10)} />
            <path d={segment(loopLeft, circuitMidY + 10, loopLeft, circuitBottom)} />
            {/* Resistor: a fixed zig-zag across the top wire. */}
            <path
              d={`M${resistorX0},${circuitTop} l10,-8 l20,16 l20,-16 l20,16 l20,-16 l10,8`}
            />
            {/* Source: the long plate is the positive terminal. */}
            <path d={segment(loopLeft - 16, circuitMidY - 10, loopLeft + 16, circuitMidY - 10)} />
            <path d={segment(loopLeft - 8, circuitMidY + 10, loopLeft + 8, circuitMidY + 10)} />
            {/* Capacitor plates. */}
            <path d={segment(loopRight - 18, circuitMidY - capGap, loopRight + 18, circuitMidY - capGap)} />
            <path d={segment(loopRight - 18, circuitMidY + capGap, loopRight + 18, circuitMidY + capGap)} />
            {/* Switch, drawn closed: the lever rests on the right contact. */}
            <path d={segment(contactLeft, circuitBottom - 6, contactLeft, circuitBottom + 6)} />
            <path d={segment(contactRight, circuitBottom - 6, contactRight, circuitBottom + 6)} />
            <path d={segment(contactLeft, circuitBottom - 4, contactRight, circuitBottom)} />
          </g>
          {/* Field between the plates grows with the stored voltage. */}
          <rect
            ref={fieldFill}
            x={loopRight - 16}
            y={circuitMidY - capGap + 2}
            width="32"
            height={2 * capGap - 4}
            fill="var(--color-accent)"
            opacity="0.18"
          />
          <line
            ref={currentArrow}
            x1={arrowStart}
            y1={circuitTop}
            x2={arrowStart + 44 * arrowDirection}
            y2={circuitTop}
            stroke="var(--color-secondary)"
            strokeWidth="1.6"
            markerEnd={`url(#arrow-${id})`}
          />
          <g fill="var(--color-text-muted)" fontSize="11">
            <text x={loopLeft - 22} y={circuitMidY + 4} textAnchor="end">
              {text.sourceLabel}
            </text>
            <text x={(resistorX0 + resistorX1) / 2} y={circuitTop - 12} textAnchor="middle">
              {text.resistorLabel}
            </text>
            <text x={loopRight + 26} y={circuitMidY - capGap - 3}>
              {u >= 0 ? "+" : "−"}
            </text>
            <text x={loopRight + 26} y={circuitMidY + capGap + 13}>
              {u >= 0 ? "−" : "+"}
            </text>
            <text x={loopRight + 26} y={circuitMidY - 26}>
              {text.capacitorLabel}
            </text>
            <text x={(contactLeft + contactRight) / 2} y={circuitBottom + 20} textAnchor="middle">
              {text.switchLabel}
            </text>
            <text x={arrowStart + 8} y={circuitTop - 8}>
              i
            </text>
            <text x={loopLeft} y={circuitTop - 26}>
              {text.circuitTitle}
            </text>
          </g>
          <text
            x={loopRight + 44}
            y={circuitMidY + 30}
            fill="var(--color-accent)"
            fontSize="11"
          >
            u = {u.toFixed(2)} V
          </text>

          {/* Capacitor-voltage–time graph on fixed axes. */}
          <rect
            x={plotLeft}
            y={plotTop}
            width={plotWidth}
            height={plotHeight}
            fill="var(--color-background)"
          />
          <g clipPath={`url(#plot-${id})`}>
            <g stroke="var(--color-border)" strokeWidth="0.5">
              {T_GRID.map((t) => (
                <path key={`gt-${t}`} d={segment(toPx(t), plotTop, toPx(t), plotBottom)} />
              ))}
              {V_GRID.map((v) => (
                <path key={`gv-${v}`} d={segment(plotLeft, toPy(v), plotRight, toPy(v))} />
              ))}
            </g>
          </g>
          <path d={segment(plotLeft, toPy(0), plotRight, toPy(0))} stroke="var(--color-text-muted)" strokeWidth="1" />
          <path d={segment(plotLeft, plotTop, plotLeft, plotBottom)} stroke="var(--color-text-muted)" strokeWidth="1" />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {T_LABELS.map((t) => (
              <path key={`tt-${t}`} d={segment(toPx(t), plotBottom, toPx(t), plotBottom + 5)} />
            ))}
            {V_LABELS.map((v) => (
              <path key={`vt-${v}`} d={segment(plotLeft - 5, toPy(v), plotLeft, toPy(v))} />
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="10" textAnchor="middle">
            {T_LABELS.map((t) => (
              <text key={`tl-${t}`} x={toPx(t)} y={plotBottom + 16}>
                {t}
              </text>
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="10" textAnchor="end">
            {V_LABELS.map((v) => (
              <text key={`vl-${v}`} data-axis-tick={String(v)} x={plotLeft - 8} y={toPy(v) + 3}>
                {v.toFixed(1)}
              </text>
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="10">
            <text x={plotLeft - 8} y={plotTop - 10} textAnchor="end">
              {text.axisVoltage}
            </text>
            <text x={plotRight} y={plotBottom + 32} textAnchor="end">
              {text.axisTime}
            </text>
          </g>

          <g clipPath={`url(#plot-${id})`}>
            {/* Long-term level E, and the initial level u₀. */}
            <path
              d={segment(plotLeft, toPy(E), plotRight, toPy(E))}
              stroke="var(--color-secondary)"
              strokeWidth="1.2"
              strokeDasharray="6 4"
              fill="none"
            />
            {Math.abs(u0 - E) > 1e-9 && (
              <path
                d={segment(plotLeft, toPy(u0), plotRight, toPy(u0))}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="2 4"
                fill="none"
              />
            )}
            {/* Time-constant marker τ = RC. */}
            {tauInFrame && (
              <path
                d={segment(toPx(tau), plotTop, toPx(tau), plotBottom)}
                stroke="var(--color-secondary)"
                strokeWidth="1"
                strokeDasharray="4 4"
                fill="none"
              />
            )}
            <path
              ref={trace}
              d={sample(p, simulation.time)}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
            />
            <circle
              ref={cursor}
              cx={toPx(tShown)}
              cy={toPy(capacitorVoltage(p, tShown))}
              r="3.5"
              fill="var(--color-accent)"
            />
          </g>

          <g fontSize="10">
            <path d={segment(plotLeft + 8, plotTop + 14, plotLeft + 30, plotTop + 14)} stroke="var(--color-accent)" strokeWidth="2" />
            <text x={plotLeft + 36} y={plotTop + 18} fill="var(--color-accent)">
              {text.trace}
            </text>
            <path
              d={segment(plotLeft + 8, plotTop + 30, plotLeft + 30, plotTop + 30)}
              stroke="var(--color-secondary)"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />
            <text x={plotLeft + 36} y={plotTop + 34} fill="var(--color-secondary)">
              {text.asymptote}
            </text>
            {Math.abs(u0 - E) > 1e-9 && (
              <>
                <path
                  d={segment(plotLeft + 8, plotTop + 46, plotLeft + 30, plotTop + 46)}
                  stroke="var(--color-text-muted)"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
                <text x={plotLeft + 36} y={plotTop + 50} fill="var(--color-text-muted)">
                  {text.initialLevel}
                </text>
              </>
            )}
          </g>
          {tauInFrame && (
            <text
              x={tauTextX}
              y={plotTop + 66}
              textAnchor={tauAnchor}
              fontSize="10"
              fill="var(--color-secondary)"
            >
              {text.tau} = {tau.toFixed(2)} s
            </text>
          )}
          {!tauInFrame && (
            <text
              x={plotRight - 6}
              y={plotTop + 66}
              textAnchor="end"
              fontSize="10"
              fill="var(--color-accent)"
            >
              {text.tau} = {tau.toFixed(2)} s · {text.tauBeyond}
            </text>
          )}
          {overTime && (
            <text
              x={plotRight - 6}
              y={plotTop + 82}
              textAnchor="end"
              fontSize="10"
              fill="var(--color-accent)"
            >
              {text.clippedTime}
            </text>
          )}
        </g>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
