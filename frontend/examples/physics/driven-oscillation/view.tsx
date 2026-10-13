import { useEffect, useId, useRef } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import {
  naturalFrequency,
  phaseLag,
  responseAmplitude,
  steadyStateAmplitude,
} from "./model";

const WIDTH = 600;
const MARGIN_L = 54;
const MARGIN_R = 22;
const MARGIN_T = 18;
const MARGIN_B = 16;
const GAP = 30;

// Fixed scales. None of these depends on the current parameters, so changing a
// parameter moves the drawing inside a stable frame instead of rescaling it.
const X_RANGE = 2; // metres drawn on each side of x = 0 (schematic and trace)
const A_RANGE = 2; // metres of steady-state amplitude on the response axis
const W_MAX = 16; // rad/s shown on the response frequency axis
const WINDOW = 12; // seconds shown in the scrolling time window
const TIME_STEP = 2; // seconds between time gridlines
const TIME_DIVISIONS = WINDOW / TIME_STEP;
const FORCE_PX_PER_N = 14; // driving-force arrow length per newton
const HALF_BLOCK = 20;
const RESPONSE_SAMPLES = 240;

const X_GRID = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
const X_TICKS = [-2, -1, 0, 1, 2];
const A_GRID = [0.5, 1, 1.5, 2];
const A_TICKS = [0.5, 1, 1.5, 2];
const W_GRID = [2, 4, 6, 8, 10, 12, 14, 16];
const W_TICKS = [0, 4, 8, 12, 16];

// Horizontal zig-zag between the wall (x1) and the block edge (x2).
function springPath(x1: number, x2: number, y: number, coils = 9, amp = 10) {
  const span = Math.max(24, x2 - x1);
  const lead = Math.min(10, span * 0.15);
  const seg = (span - 2 * lead) / (coils * 2);
  let d = `M${x1} ${y} L${x1 + lead} ${y}`;
  for (let i = 0; i < coils * 2; i++)
    d += ` L${(x1 + lead + seg * (i + 1)).toFixed(1)} ${(y + (i % 2 === 0 ? -amp : amp)).toFixed(1)}`;
  return `${d} L${x2} ${y}`;
}

export default function DrivenOscillationView({
  simulation,
  params: p,
}: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 520);
  const height = frame.height;

  const plotW = WIDTH - MARGIN_L - MARGIN_R;
  const inner = height - MARGIN_T - MARGIN_B - 2 * GAP;
  const h1 = inner * 0.26;
  const h2 = inner * 0.38;
  const h3 = inner * 0.36;
  const p1Top = MARGIN_T;
  const p2Top = p1Top + h1 + GAP;
  const p3Top = p2Top + h2 + GAP;

  // Panel 1 — schematic of the driven oscillator.
  const centre1 = MARGIN_L + plotW / 2;
  const sx1 = (plotW / 2 - 46) / X_RANGE;
  const blockCy = p1Top + h1 * 0.5;
  const trackY1 = blockCy + 26;
  const wallRight = MARGIN_L + 8;

  // Panel 2 — displacement trace inside a fixed time window.
  const axisY2 = p2Top + h2 * 0.5;
  const sy2 = Math.max(1, h2 / 2 - 14) / X_RANGE;

  // Panel 3 — steady-state amplitude response.
  const base3 = p3Top + h3 - 18;
  const top3 = p3Top + 10;
  const sy3 = Math.max(1, base3 - top3) / A_RANGE;
  const toW = (w: number) => MARGIN_L + (w / W_MAX) * plotW;
  const toA = (a: number) => base3 - a * sy3;

  const A = steadyStateAmplitude(p);
  const finiteA = Number.isFinite(A);
  const w0 = naturalFrequency(p);
  const driven = p.force > 0;

  // The response curve depends only on the parameters, so it is drawn by React.
  const segments: string[] = [];
  let peak = 0;
  for (let i = 0; i <= RESPONSE_SAMPLES; i++) {
    const w = (i / RESPONSE_SAMPLES) * W_MAX;
    const a = responseAmplitude(p, w);
    if (!Number.isFinite(a)) continue;
    peak = Math.max(peak, a);
    segments.push(`${i === 0 ? "M" : "L"}${toW(w).toFixed(2)} ${toA(a).toFixed(2)}`);
  }
  const responsePath = segments.join(" ");
  const responseClipped = peak > A_RANGE;
  const traceClipped = finiteA && A > X_RANGE;
  const markerA = Math.min(finiteA ? A : 0, A_RANGE);

  const block = useRef<SVGGElement>(null);
  const spring = useRef<SVGPathElement>(null);
  const forceArrow = useRef<SVGLineElement>(null);
  const trace = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const timeLabels = useRef<(SVGTextElement | null)[]>([]);
  const live = useRef<SVGTextElement>(null);
  const samples = useRef<{ t: number; x: number }[]>([]);
  const lastT = useRef<number | null>(null);

  // Everything that moves is redrawn from the live model on each animation
  // frame, without a React render. The geometry above only changes on resize.
  useEffect(
    () =>
      simulation.onRender(() => {
        const t = simulation.time;
        const x = simulation.state.x ?? 0;
        const v = simulation.state.v ?? 0;
        const phase = simulation.state.phase ?? 0;
        const q = simulation.params;
        if (lastT.current === null || t < lastT.current) samples.current.length = 0;
        if (lastT.current === null || t !== lastT.current) {
          samples.current.push({ t, x });
          lastT.current = t;
        }
        const tLeft = Math.max(0, t - WINDOW);
        const buf = samples.current;
        while (buf.length > 1 && buf[0].t < tLeft - 0.5) buf.shift();
        const px = (time: number) =>
          MARGIN_L + ((time - tLeft) / WINDOW) * plotW;
        const py = (value: number) => axisY2 - value * sy2;

        let d = "";
        let started = false;
        for (const sample of buf) {
          if (sample.t < tLeft) continue;
          d += `${started ? "L" : "M"}${px(sample.t).toFixed(2)} ${py(sample.x).toFixed(2)}`;
          started = true;
        }
        trace.current?.setAttribute("d", d);
        dot.current?.setAttribute("cx", px(t).toFixed(2));
        dot.current?.setAttribute("cy", py(x).toFixed(2));

        const cx = centre1 + x * sx1;
        block.current?.setAttribute(
          "transform",
          `translate(${(x * sx1).toFixed(2)} 0)`,
        );
        spring.current?.setAttribute(
          "d",
          springPath(wallRight, cx - HALF_BLOCK, blockCy),
        );
        const force = q.force * Math.cos(phase) * FORCE_PX_PER_N;
        forceArrow.current?.setAttribute("x1", String(cx + HALF_BLOCK));
        forceArrow.current?.setAttribute("x2", String(cx + HALF_BLOCK + force));

        for (let i = 0; i <= TIME_DIVISIONS; i++) {
          const el = timeLabels.current[i];
          if (el) el.textContent = (tLeft + i * TIME_STEP).toFixed(1);
        }
        if (live.current)
          live.current.textContent = `t = ${t.toFixed(2)} s · x = ${x.toFixed(3)} m · v = ${v.toFixed(3)} m/s`;
      }),
    [simulation, frame.height, axisY2, sy2, sx1, centre1, blockCy, plotW],
  );

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <pattern
            id={`grid-${id}`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 0H0V24"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth=".5"
            />
          </pattern>
          <marker
            id={`arrow-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 10 5 0 10z" fill="var(--color-accent)" />
          </marker>
          <clipPath id={`clip1-${id}`}>
            <rect x={MARGIN_L - 16} y={p1Top} width={plotW + 20} height={h1} />
          </clipPath>
          <clipPath id={`clip2-${id}`}>
            <rect x={MARGIN_L} y={p2Top} width={plotW} height={h2} />
          </clipPath>
          <clipPath id={`clip3-${id}`}>
            <rect x={MARGIN_L} y={p3Top} width={plotW} height={h3} />
          </clipPath>
        </defs>
        <rect width={WIDTH} height={height} fill={`url(#grid-${id})`} />

        {/* Panel 1 — the block, the spring and the driving force. */}
        <g clipPath={`url(#clip1-${id})`}>
          <path
            d={`M${MARGIN_L},${trackY1}H${MARGIN_L + plotW}`}
            stroke="var(--color-border)"
            strokeWidth="2"
          />
          <path
            d={`M${centre1},${p1Top + 8}V${trackY1}`}
            stroke="var(--color-text-muted)"
            strokeDasharray="5 6"
            strokeWidth="1"
          />
          <rect
            x={MARGIN_L - 6}
            y={blockCy - 30}
            width="10"
            height="60"
            fill="var(--color-text-muted)"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={`hatch-${i}`}
                d={`M${MARGIN_L - 6} ${blockCy - 24 + i * 12}l-9 -9`}
              />
            ))}
          </g>
          <path
            ref={spring}
            d={springPath(wallRight, centre1 - HALF_BLOCK, blockCy)}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
          <g ref={block} transform="translate(0 0)">
            <rect
              x={centre1 - HALF_BLOCK}
              y={blockCy - 22}
              width={HALF_BLOCK * 2}
              height="44"
              rx="5"
              fill="var(--color-secondary)"
            />
            <text
              x={centre1}
              y={blockCy + 6}
              textAnchor="middle"
              fill="var(--color-surface)"
              fontSize="14"
            >
              m
            </text>
          </g>
          <line
            ref={forceArrow}
            x1={centre1 + HALF_BLOCK}
            y1={blockCy}
            x2={centre1 + HALF_BLOCK}
            y2={blockCy}
            stroke="var(--color-accent)"
            strokeWidth="2"
            markerEnd={`url(#arrow-${id})`}
          />
          <text
            x={centre1 + HALF_BLOCK + 8}
            y={blockCy - 24}
            fill="var(--color-accent)"
            fontSize="10"
          >
            {text.drivingForce}
          </text>
          <text
            x={centre1}
            y={p1Top + 6}
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            {text.equilibrium}
          </text>
        </g>

        {/* Panel 2 — displacement against time. */}
        <g clipPath={`url(#clip2-${id})`}>
          <g stroke="var(--color-border)" strokeWidth="0.5">
            {X_GRID.map((value) => (
              <path
                key={`gx-${value}`}
                d={`M${MARGIN_L},${axisY2 - value * sy2}H${MARGIN_L + plotW}`}
              />
            ))}
            {Array.from({ length: TIME_DIVISIONS + 1 }, (_, i) => (
              <path
                key={`gt-${i}`}
                d={`M${MARGIN_L + (i / TIME_DIVISIONS) * plotW},${p2Top}V${p2Top + h2}`}
              />
            ))}
          </g>
          <path
            d={`M${MARGIN_L},${p2Top}V${p2Top + h2}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={`M${MARGIN_L},${axisY2}H${MARGIN_L + plotW}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {X_TICKS.map((value) => (
              <path
                key={`tx-${value}`}
                d={`M${MARGIN_L - 3},${axisY2 - value * sy2}H${MARGIN_L + 3}`}
              />
            ))}
          </g>
          {finiteA && (
            <>
              <path
                d={`M${MARGIN_L},${axisY2 - A * sy2}H${MARGIN_L + plotW}`}
                stroke="var(--color-accent)"
                strokeWidth="1"
                strokeDasharray="6 5"
              />
              <path
                d={`M${MARGIN_L},${axisY2 + A * sy2}H${MARGIN_L + plotW}`}
                stroke="var(--color-accent)"
                strokeWidth="1"
                strokeDasharray="6 5"
              />
            </>
          )}
          <path ref={trace} d="" fill="none" stroke="var(--color-secondary)" strokeWidth="2" />
          <circle
            ref={dot}
            cx={MARGIN_L}
            cy={axisY2}
            r="3.2"
            fill="var(--color-secondary)"
          />
        </g>
        <g fill="var(--color-text-muted)" fontSize="9" textAnchor="end">
          {X_TICKS.map((value) => (
            <text key={`lx-${value}`} x={MARGIN_L - 8} y={axisY2 - value * sy2 + 3}>
              {value}
            </text>
          ))}
        </g>
        <g fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">
          {Array.from({ length: TIME_DIVISIONS + 1 }, (_, i) => (
            <text
              key={`lt-${i}`}
              ref={(el) => {
                timeLabels.current[i] = el;
              }}
              x={MARGIN_L + (i / TIME_DIVISIONS) * plotW}
              y={axisY2 + 15}
            >
              0
            </text>
          ))}
        </g>
        <text
          x={MARGIN_L - 8}
          y={p2Top + 8}
          fill="var(--color-text-muted)"
          fontSize="10"
          textAnchor="end"
        >
          {text.axisDisplacement}
        </text>
        <text
          x={MARGIN_L + plotW}
          y={p2Top + h2 - 4}
          fill="var(--color-text-muted)"
          fontSize="10"
          textAnchor="end"
        >
          {text.axisTime}
        </text>
        <text
          ref={live}
          x={MARGIN_L + 4}
          y={p2Top + h2 - 4}
          fill="var(--color-accent)"
          fontSize="10"
          textAnchor="start"
        >
          t = 0.00 s
        </text>
        {traceClipped && (
          <text
            x={MARGIN_L + plotW - 4}
            y={p2Top + 12}
            fill="var(--color-accent)"
            fontSize="10"
            textAnchor="end"
          >
            {text.offFrame}
          </text>
        )}

        {/* Panel 3 — steady-state amplitude against driving frequency. */}
        <g clipPath={`url(#clip3-${id})`}>
          <g stroke="var(--color-border)" strokeWidth="0.5">
            {A_GRID.map((value) => (
              <path
                key={`ga-${value}`}
                d={`M${MARGIN_L},${toA(value)}H${MARGIN_L + plotW}`}
              />
            ))}
            {W_GRID.map((value) => (
              <path key={`gw-${value}`} d={`M${toW(value)},${p3Top}V${base3}`} />
            ))}
          </g>
          <path
            d={`M${MARGIN_L},${p3Top}V${base3}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={`M${MARGIN_L},${base3}H${MARGIN_L + plotW}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {A_TICKS.map((value) => (
              <path
                key={`ta-${value}`}
                d={`M${MARGIN_L - 3},${toA(value)}H${MARGIN_L + 3}`}
              />
            ))}
            {W_TICKS.map((value) => (
              <path
                key={`tw-${value}`}
                d={`M${toW(value)},${base3 - 3}V${base3 + 3}`}
              />
            ))}
          </g>
          {w0 <= W_MAX && (
            <path
              d={`M${toW(w0)},${p3Top}V${base3}`}
              stroke="var(--color-text-muted)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}
          <path
            d={responsePath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.2"
          />
          <path
            d={`M${toW(p.driveFrequency)},${base3}V${toA(markerA)}`}
            stroke="var(--color-secondary)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={toW(p.driveFrequency)}
            cy={toA(markerA)}
            r="3.6"
            fill="var(--color-secondary)"
          />
        </g>
        <g fill="var(--color-text-muted)" fontSize="9" textAnchor="end">
          {A_TICKS.map((value) => (
            <text key={`la-${value}`} x={MARGIN_L - 8} y={toA(value) + 3}>
              {value.toFixed(1)}
            </text>
          ))}
        </g>
        <g fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">
          {W_TICKS.map((value) => (
            <text key={`lw-${value}`} x={toW(value)} y={base3 + 14}>
              {value}
            </text>
          ))}
        </g>
        <text
          x={MARGIN_L - 8}
          y={p3Top + 8}
          fill="var(--color-text-muted)"
          fontSize="10"
          textAnchor="end"
        >
          {text.axisAmplitude}
        </text>
        <text
          x={MARGIN_L + plotW}
          y={p3Top + h3 - 4}
          fill="var(--color-text-muted)"
          fontSize="10"
          textAnchor="end"
        >
          {text.axisFrequency}
        </text>
        <text
          x={toW(w0) + 5}
          y={p3Top + 9}
          fill="var(--color-text-muted)"
          fontSize="9"
          textAnchor="start"
        >
          {text.naturalFrequency}
        </text>
        <text
          x={toW(p.driveFrequency)}
          y={p3Top + h3 - 6}
          fill="var(--color-secondary)"
          fontSize="9"
          textAnchor="middle"
        >
          {text.currentFrequency}
        </text>
        {!driven && (
          <text
            x={MARGIN_L + plotW - 4}
            y={p3Top + 22}
            fill="var(--color-accent)"
            fontSize="10"
            textAnchor="end"
          >
            {text.noDrive}
          </text>
        )}
        {responseClipped && (
          <text
            x={MARGIN_L + plotW - 4}
            y={p3Top + 34}
            fill="var(--color-accent)"
            fontSize="10"
            textAnchor="end"
          >
            {text.offFrame}
          </text>
        )}
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
