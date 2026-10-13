import { useEffect, useId, useRef } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { Params, ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { displacementAt, envelopeAt } from "./model";

const W = 600;
// Fixed drawing scales. The schematic uses a constant number of viewBox units
// per metre; the plot uses a constant number of units per second and per metre.
// Neither is derived from the current parameter values, so changing a parameter
// moves the drawing inside a stable frame instead of rescaling it.
const SCHEMATIC_PX_PER_M = 300;
const TIME_WINDOW = 10; // seconds shown on the fixed time axis
const X_RANGE = 0.4; // metres shown on each side of the displacement axis
const T_GRID = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const T_LABELS = [0, 2, 4, 6, 8, 10];
const X_GRID = [-0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4];
const X_TICKS = [-0.4, -0.2, 0, 0.2, 0.4];

// Horizontal zig-zag between the wall (x1) and the block edge (x2).
function springPath(x1: number, x2: number, y: number, coils = 8, amp = 9) {
  const span = Math.max(24, x2 - x1);
  const lead = Math.min(12, span * 0.15);
  const seg = (span - 2 * lead) / (coils * 2);
  let d = `M${x1} ${y} L${x1 + lead} ${y}`;
  for (let i = 0; i < coils * 2; i++)
    d += ` L${(x1 + lead + seg * (i + 1)).toFixed(1)} ${(y + (i % 2 === 0 ? -amp : amp)).toFixed(1)}`;
  return `${d} L${x2} ${y}`;
}

export default function DampedOscillationView({
  simulation,
  params: p,
  state,
}: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(W, 440);
  const height = frame.height;
  const block = useRef<SVGGElement>(null);
  const spring = useRef<SVGPathElement>(null);
  const rod = useRef<SVGLineElement>(null);
  const arrow = useRef<SVGLineElement>(null);
  const trace = useRef<SVGPathElement>(null);
  const upper = useRef<SVGPathElement>(null);
  const lower = useRef<SVGPathElement>(null);
  const cursor = useRef<SVGCircleElement>(null);

  // Schematic geometry, in viewBox units.
  const wallX = 78;
  const equilibriumX = 330;
  const schematicY = height * 0.17;
  const blockHalf = 24;
  const blockHeight = 48;
  const springY = schematicY - 26;
  const damperY = schematicY + 30;
  const cylinderLength = 50;
  const cylinderHeight = 18;
  const arrowY = schematicY + 54;

  // Plot geometry: a fixed coordinate system with labelled axes and units.
  const plotLeft = 100;
  const plotRight = W - 28;
  const plotTop = height * 0.42;
  const plotBottom = height - 50;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const zeroY = (plotTop + plotBottom) / 2;
  const pxPerSecond = plotWidth / TIME_WINDOW;
  const pxPerMetre = plotHeight / (2 * X_RANGE);

  const toPx = (t: number) => plotLeft + t * pxPerSecond;
  const toPy = (x: number) => zeroY - x * pxPerMetre;

  const sample = (q: Params, tNow: number, value: (t: number) => number) => {
    const end = Math.min(Math.max(tNow, 0), TIME_WINDOW);
    if (end <= 1e-9) return `M${toPx(0).toFixed(2)} ${toPy(value(0)).toFixed(2)}`;
    const parts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const t = (i / 240) * end;
      parts.push(
        `${i === 0 ? "M" : "L"}${toPx(t).toFixed(2)} ${toPy(value(t)).toFixed(2)}`,
      );
    }
    return parts.join(" ");
  };
  const trajectory = (q: Params, tNow: number) =>
    sample(q, tNow, (t) => displacementAt(q, t));
  const envelope = (q: Params, sign: number, tNow: number) =>
    sample(q, tNow, (t) => sign * envelopeAt(q, t));

  // With v₀ = 0 the trajectory never reaches beyond |x₀|, so the frame is
  // exceeded exactly when the initial displacement is larger than the range.
  const peak = Math.abs(p.initialDisplacement);
  const overRange = peak > X_RANGE + 1e-9;
  const overTime = simulation.time > TIME_WINDOW + 1e-9;
  const tShown = Math.min(Math.max(simulation.time, 0), TIME_WINDOW);

  useEffect(
    () =>
      simulation.onRender(() => {
        const q = simulation.params;
        const t = simulation.time;
        const x = simulation.state.x ?? 0;
        const centre = equilibriumX + x * SCHEMATIC_PX_PER_M;
        block.current?.setAttribute(
          "transform",
          `translate(${(centre - equilibriumX).toFixed(2)} 0)`,
        );
        spring.current?.setAttribute(
          "d",
          springPath(wallX, centre - blockHalf, springY),
        );
        rod.current?.setAttribute("x2", String(centre - blockHalf));
        arrow.current?.setAttribute("x2", String(centre));
        trace.current?.setAttribute("d", trajectory(q, t));
        upper.current?.setAttribute("d", envelope(q, 1, t));
        lower.current?.setAttribute("d", envelope(q, -1, t));
        const tc = Math.min(Math.max(t, 0), TIME_WINDOW);
        cursor.current?.setAttribute("cx", String(toPx(tc)));
        cursor.current?.setAttribute("cy", String(toPy(displacementAt(q, tc))));
      }),
    [
      simulation,
      wallX,
      equilibriumX,
      springY,
      blockHalf,
      plotLeft,
      pxPerSecond,
      pxPerMetre,
      zeroY,
    ],
  );

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
          <linearGradient id={`block-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#7cc4e0" />
            <stop offset="1" stopColor="#0077a8" />
          </linearGradient>
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

        {/* Schematic: wall, spring in parallel with a viscous damper, block. */}
        <g>
          <rect
            x={wallX - 12}
            y={schematicY - 40}
            width="12"
            height="80"
            fill="var(--color-text-muted)"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M${wallX - 12} ${schematicY - 32 + i * 20}l-12 -12`}
              />
            ))}
          </g>
          <path
            d={`M${equilibriumX} ${schematicY - 44}v${88}`}
            stroke="var(--color-secondary)"
            strokeDasharray="5 6"
            strokeWidth="1"
          />
          <text
            x={equilibriumX}
            y={schematicY - 50}
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            x = 0
          </text>
          <path
            ref={spring}
            d={springPath(wallX, equilibriumX - blockHalf, springY)}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
          <text
            x={(wallX + equilibriumX) / 2}
            y={springY - 16}
            textAnchor="middle"
            fill="var(--color-accent)"
            fontSize="12"
          >
            k
          </text>
          <rect
            x={wallX}
            y={damperY - cylinderHeight / 2}
            width={cylinderLength}
            height={cylinderHeight}
            rx="4"
            fill="var(--color-background)"
            stroke="var(--color-secondary)"
            strokeWidth="1.5"
          />
          <path
            d={`M${wallX + cylinderLength} ${damperY - cylinderHeight / 2}v${cylinderHeight}`}
            stroke="var(--color-secondary)"
            strokeWidth="2"
          />
          <line
            ref={rod}
            x1={wallX + cylinderLength}
            y1={damperY}
            x2={equilibriumX - blockHalf}
            y2={damperY}
            stroke="var(--color-secondary)"
            strokeWidth="2"
          />
          <text
            x={wallX + cylinderLength / 2}
            y={damperY - cylinderHeight / 2 - 6}
            textAnchor="middle"
            fill="var(--color-secondary)"
            fontSize="12"
          >
            c
          </text>
          <g
            ref={block}
            transform={`translate(${((state.x ?? 0) * SCHEMATIC_PX_PER_M).toFixed(2)} 0)`}
          >
            <rect
              x={equilibriumX - blockHalf}
              y={schematicY - blockHeight / 2}
              width={blockHalf * 2}
              height={blockHeight}
              rx="5"
              fill={`url(#block-${id})`}
              stroke="var(--color-accent)"
            />
            <text
              x={equilibriumX}
              y={schematicY + 5}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="15"
            >
              m
            </text>
          </g>
          <line
            ref={arrow}
            x1={equilibriumX}
            y1={arrowY}
            x2={equilibriumX}
            y2={arrowY}
            stroke="var(--color-secondary)"
            strokeWidth="1.5"
            markerEnd={`url(#arrow-${id})`}
          />
          <line
            x1={equilibriumX}
            y1={arrowY - 6}
            x2={equilibriumX}
            y2={arrowY + 6}
            stroke="var(--color-secondary)"
            strokeWidth="1"
          />
          <text
            x={equilibriumX}
            y={arrowY + 18}
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            x
          </text>
        </g>

        {/* Displacement–time graph on fixed axes. */}
        <g>
          <rect
            x={plotLeft}
            y={plotTop}
            width={plotWidth}
            height={plotHeight}
            fill="var(--color-background)"
          />
          <g stroke="var(--color-border)" strokeWidth="0.5">
            {T_GRID.map((t) => (
              <path key={`gt-${t}`} d={`M${toPx(t)},${plotTop}V${plotBottom}`} />
            ))}
            {X_GRID.map((x) => (
              <path key={`gx-${x}`} d={`M${plotLeft},${toPy(x)}H${plotRight}`} />
            ))}
          </g>
          <path
            d={`M${plotLeft},${plotBottom}H${plotRight}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={`M${plotLeft},${plotTop}V${plotBottom}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {T_LABELS.map((t) => (
              <path
                key={`tt-${t}`}
                d={`M${toPx(t)},${plotBottom}V${plotBottom + 5}`}
              />
            ))}
            {X_TICKS.map((x) => (
              <path key={`xt-${x}`} d={`M${plotLeft - 5},${toPy(x)}H${plotLeft}`} />
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="10">
            {T_LABELS.map((t) => (
              <text
                key={`tl-${t}`}
                x={toPx(t)}
                y={plotBottom + 16}
                textAnchor="middle"
              >
                {t}
              </text>
            ))}
            {X_TICKS.map((x) => (
              <text
                key={`xl-${x}`}
                x={plotLeft - 8}
                y={toPy(x) + 3}
                textAnchor="end"
              >
                {x.toFixed(2)}
              </text>
            ))}
            <text x={plotLeft - 8} y={plotTop - 10} textAnchor="end">
              {text.axisDisplacement}
            </text>
            <text x={plotRight} y={plotBottom + 32} textAnchor="end">
              {text.axisTime}
            </text>
          </g>

          <g clipPath={`url(#plot-${id})`}>
            <path
              d={`M${plotLeft},${toPy(0)}H${plotRight}`}
              stroke="var(--color-text-muted)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <path
              ref={upper}
              d={envelope(p, 1, simulation.time)}
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
            <path
              ref={lower}
              d={envelope(p, -1, simulation.time)}
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
            <path
              ref={trace}
              d={trajectory(p, simulation.time)}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
            />
            <circle
              ref={cursor}
              cx={toPx(tShown)}
              cy={toPy(displacementAt(p, tShown))}
              r="3.5"
              fill="var(--color-accent)"
            />
          </g>

          <g fontSize="10">
            <path
              d={`M${plotLeft + 8},${plotTop + 14}h22`}
              stroke="var(--color-accent)"
              strokeWidth="2"
            />
            <text x={plotLeft + 36} y={plotTop + 18} fill="var(--color-accent)">
              {text.trace}
            </text>
            <path
              d={`M${plotLeft + 8},${plotTop + 30}h22`}
              stroke="var(--color-secondary)"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
            <text
              x={plotLeft + 36}
              y={plotTop + 34}
              fill="var(--color-secondary)"
            >
              {text.envelope}
            </text>
          </g>
          {(overRange || overTime) && (
            <text
              x={plotRight - 6}
              y={plotTop + 18}
              textAnchor="end"
              fontSize="10"
              fill="var(--color-accent)"
            >
              {overRange ? text.clippedDisplacement : text.clippedTime}
            </text>
          )}
        </g>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
