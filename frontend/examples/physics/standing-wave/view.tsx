import { useId, useEffect, useRef } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { Params, ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import {
  antinodePositions,
  displacementAtPhase,
  nodePositions,
  waveLeft,
  waveNumber,
  waveRight,
} from "./model";

const WIDTH = 600;
// Fixed coordinate frame. Changing a parameter moves the drawing inside this
// frame; it never rescales it, so a grid step always means the same distance in
// metres. L (the string length) may change how far the string extends, but only
// through this fixed mapping.
const X_RANGE = 4.5; // metres shown from x = 0 to the right edge
const Y_RANGE = 0.45; // metres shown on each side of the equilibrium line
const MARGIN_L = 56;
const MARGIN_R = 26;
const MARGIN_T = 36;
const MARGIN_B = 48;
const CURVE_SAMPLES = 240;

const X_GRID = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5];
const Y_GRID = [-0.4, -0.3, -0.2, -0.1, 0.1, 0.2, 0.3, 0.4];
const X_TICKS = [0, 1, 2, 3, 4];
const Y_TICKS = [-0.4, -0.2, 0.2, 0.4];

export default function StandingWaveView({ simulation, params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 360);
  const height = frame.height;
  const resultantRef = useRef<SVGPathElement>(null);
  const rightRef = useRef<SVGPathElement>(null);
  const leftRef = useRef<SVGPathElement>(null);

  const plotW = WIDTH - MARGIN_L - MARGIN_R;
  const halfH = (height - MARGIN_T - MARGIN_B) / 2;
  const axisY = MARGIN_T + halfH;
  const sx = plotW / X_RANGE;
  const sy = halfH / Y_RANGE;
  const toPx = (x: number) => MARGIN_L + x * sx;
  const toPy = (y: number) => axisY - y * sy;

  const nodes = nodePositions(p);
  const antinodes = antinodePositions(p);
  // The envelope 2A|sin(kx)| and the string extent L are the only things that can
  // reach beyond the fixed frame; when they do, the frame stays put and a hint
  // is shown instead of rescaling.
  const clipped = 2 * p.amplitude > Y_RANGE || p.length > X_RANGE;
  const wallTop = toPy(0.3);
  const wallBottom = toPy(-0.3);

  const staticCurve = (f: (x: number) => number) => {
    const parts: string[] = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const x = (i / CURVE_SAMPLES) * p.length;
      parts.push(
        `${i === 0 ? "M" : "L"}${toPx(x).toFixed(2)} ${toPy(f(x)).toFixed(2)}`,
      );
    }
    return parts.join(" ");
  };

  // Redraw the animated curves from the model's phase on every animation frame,
  // without a React render.
  useEffect(() => {
    const plotWidth = WIDTH - MARGIN_L - MARGIN_R;
    const half = (frame.height - MARGIN_T - MARGIN_B) / 2;
    const line = MARGIN_T + half;
    const px = (x: number) => MARGIN_L + x * (plotWidth / X_RANGE);
    const py = (y: number) => line - y * (half / Y_RANGE);
    const path = (q: Params, f: (x: number) => number) => {
      const parts: string[] = [];
      for (let i = 0; i <= CURVE_SAMPLES; i++) {
        const x = (i / CURVE_SAMPLES) * q.length;
        parts.push(
          `${i === 0 ? "M" : "L"}${px(x).toFixed(2)} ${py(f(x)).toFixed(2)}`,
        );
      }
      return parts.join(" ");
    };
    return simulation.onRender(() => {
      const q = simulation.params;
      const phase = simulation.state.phase;
      resultantRef.current?.setAttribute(
        "d",
        path(q, (x) => displacementAtPhase(q, x, phase)),
      );
      rightRef.current?.setAttribute(
        "d",
        path(q, (x) => waveRight(q, x, phase)),
      );
      leftRef.current?.setAttribute(
        "d",
        path(q, (x) => waveLeft(q, x, phase)),
      );
    });
  }, [simulation, frame.height]);

  const legend = [
    { key: "resultant", color: "var(--color-accent)", dash: undefined },
    { key: "right", color: "var(--color-secondary)", dash: undefined },
    { key: "left", color: "var(--color-secondary)", dash: "4 3" },
    { key: "envelope", color: "var(--color-text-muted)", dash: "5 4" },
  ] as const;

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
          <clipPath id={`clip-${id}`}>
            <rect
              x={MARGIN_L}
              y={MARGIN_T}
              width={plotW}
              height={2 * halfH}
            />
          </clipPath>
        </defs>
        <rect width={WIDTH} height={height} fill={`url(#grid-${id})`} />

        <g clipPath={`url(#clip-${id})`}>
          {/* Coordinate grid: one horizontal cell is 0.5 m, one vertical cell 0.1 m. */}
          <g stroke="var(--color-border)" strokeWidth="0.5">
            {X_GRID.map((metres) => (
              <path
                key={`gx-${metres}`}
                d={`M${toPx(metres)},${MARGIN_T}V${MARGIN_T + 2 * halfH}`}
              />
            ))}
            {Y_GRID.map((metres) => (
              <path
                key={`gy-${metres}`}
                d={`M${MARGIN_L},${toPy(metres)}H${MARGIN_L + plotW}`}
              />
            ))}
          </g>

          {/* Axes: the equilibrium line y = 0 and the string end x = 0. */}
          <path
            d={`M${MARGIN_L},${axisY}H${MARGIN_L + plotW}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={`M${MARGIN_L},${MARGIN_T}V${MARGIN_T + 2 * halfH}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {X_TICKS.map((metres) => (
              <path
                key={`tx-${metres}`}
                d={`M${toPx(metres)},${axisY - 3}V${axisY + 3}`}
              />
            ))}
            {Y_TICKS.map((metres) => (
              <path
                key={`ty-${metres}`}
                d={`M${MARGIN_L - 3},${toPy(metres)}H${MARGIN_L + 3}`}
              />
            ))}
          </g>

          {/* Envelope ±2A|sin(kx)|: the largest swing at each position. */}
          <path
            d={staticCurve(
              (x) => 2 * p.amplitude * Math.abs(Math.sin(waveNumber(p) * x)),
            )}
            fill="none"
            stroke="var(--color-text-muted)"
            strokeWidth="1"
            strokeDasharray="5 4"
          />
          <path
            d={staticCurve(
              (x) => -2 * p.amplitude * Math.abs(Math.sin(waveNumber(p) * x)),
            )}
            fill="none"
            stroke="var(--color-text-muted)"
            strokeWidth="1"
            strokeDasharray="5 4"
          />

          {/* The two counter-propagating waves and their resultant. */}
          <path
            ref={rightRef}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="1"
          />
          <path
            ref={leftRef}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <path
            ref={resultantRef}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.2"
          />
        </g>

        {/* The two fixed ends, the string's rest line and the node/antinode
            markers always lie inside the frame, so they are not clipped. */}
        <rect
          x={toPx(0) - 6}
          y={wallTop}
          width="6"
          height={wallBottom - wallTop}
          fill="var(--color-text)"
        />
        <rect
          x={toPx(p.length)}
          y={wallTop}
          width="6"
          height={wallBottom - wallTop}
          fill="var(--color-text)"
        />
        <path
          d={`M${toPx(0)},${axisY}H${toPx(p.length)}`}
          stroke="var(--color-border)"
          strokeWidth="2"
          strokeDasharray="2 3"
        />
        <g>
          {nodes.map((x) => (
            <circle
              key={`n-${x}`}
              cx={toPx(x)}
              cy={axisY}
              r="3.6"
              fill="var(--color-text)"
            />
          ))}
          {antinodes.map((x) => (
            <circle
              key={`a-${x}`}
              cx={toPx(x)}
              cy={axisY}
              r="3.2"
              fill="var(--color-background)"
              stroke="var(--color-accent)"
              strokeWidth="1.6"
            />
          ))}
        </g>

        <g fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">
          {X_TICKS.map((metres) => (
            <text key={`lx-${metres}`} x={toPx(metres)} y={axisY + 16}>
              {metres}
            </text>
          ))}
        </g>
        <g fill="var(--color-text-muted)" fontSize="9" textAnchor="end">
          {Y_TICKS.map((metres) => (
            <text key={`ly-${metres}`} x={MARGIN_L - 8} y={toPy(metres) + 3}>
              {metres.toFixed(1)}
            </text>
          ))}
        </g>
        <text
          x={MARGIN_L + plotW}
          y={axisY + 32}
          fill="var(--color-text-muted)"
          fontSize="10"
          textAnchor="end"
        >
          {text.axisX}
        </text>
        <text
          x={4}
          y={14}
          fill="var(--color-text-muted)"
          fontSize="10"
          textAnchor="start"
        >
          {text.axisY}
        </text>

        {/* Legend. */}
        <g fontSize="9">
          {legend.map((item, i) => {
            const x = MARGIN_L + i * 78;
            return (
              <g key={item.key}>
                <path
                  d={`M${x},${MARGIN_T - 16}h22`}
                  stroke={item.color}
                  strokeWidth="2"
                  strokeDasharray={item.dash}
                />
                <text x={x + 26} y={MARGIN_T - 13} fill="var(--color-text-muted)">
                  {text[item.key]}
                </text>
              </g>
            );
          })}
        </g>

        {clipped && (
          <text
            x={MARGIN_L + plotW}
            y={MARGIN_T - 26}
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
