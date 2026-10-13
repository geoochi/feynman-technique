import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import {
  evaluate,
  samplePoint,
  subintervalCount,
  subintervalWidth,
} from "./model";

const WIDTH = 600;
// Fixed plot window. The pixel scale depends only on the frame size, never on
// the parameters, so changing a value moves the rectangles inside a stable
// frame instead of rescaling or re-framing the whole picture.
const X_MIN = -2.4;
const X_MAX = 2.4;
const Y_MIN = -0.6;
const Y_MAX = 6;
const MARGIN = 28;
const X_GRID = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
const X_LABELS = [-2, -1, 1, 2];
const Y_GRID = [1, 2, 3, 4, 5];

export default function IntegralView({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 380);
  const height = frame.height;
  const sx = (WIDTH - 2 * MARGIN) / (X_MAX - X_MIN);
  const sy = (height - 2 * MARGIN) / (Y_MAX - Y_MIN);
  const X = (x: number) => MARGIN + (x - X_MIN) * sx;
  const Y = (y: number) => height - MARGIN - (y - Y_MIN) * sy;

  const count = subintervalCount(p.n);
  const h = subintervalWidth(p.a, p.b, p.n);
  const axisY = Y(0);
  const curve = Array.from({ length: 241 }, (_, i) => {
    const x = X_MIN + (i * (X_MAX - X_MIN)) / 240;
    return `${i ? "L" : "M"}${X(x)},${Y(evaluate(x))}`;
  }).join(" ");
  const bars = Array.from({ length: count }, (_, i) => {
    const left = p.a + i * h;
    const right = left + h;
    const sample = samplePoint(p.a, p.b, p.n, i, p.s);
    const top = Y(evaluate(sample));
    return {
      i,
      sample,
      x0: X(Math.min(left, right)),
      x1: X(Math.max(left, right)),
      top,
      y: Math.min(top, axisY),
      height: Math.abs(axisY - top),
    };
  });

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <clipPath id={`clip-${id}`}>
            <rect width={WIDTH} height={height} />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${id})`}>
          {/* Coordinate grid: 0.5 across and 1 up per cell. */}
          <g stroke="var(--color-border)" strokeWidth="0.6">
            {X_GRID.map((x) => (
              <path key={`gx-${x}`} d={`M${X(x)},0V${height}`} />
            ))}
            {Y_GRID.map((y) => (
              <path key={`gy-${y}`} d={`M0,${Y(y)}H${WIDTH}`} />
            ))}
          </g>

          {/* Axes meet at the origin. */}
          <path
            d={`M0,${axisY}H${WIDTH}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={`M${X(0)},0V${height}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />

          {/* Riemann rectangles sit between the axis and the sampled height. */}
          {bars.map((bar) => (
            <rect
              key={`bar-${bar.i}`}
              data-testid="riemann-bar"
              x={bar.x0}
              y={bar.y}
              width={Math.max(0, bar.x1 - bar.x0)}
              height={bar.height}
              fill="var(--color-accent)"
              fillOpacity="0.22"
              stroke="var(--color-accent)"
              strokeWidth="0.8"
            />
          ))}

          <path d={curve} fill="none" stroke="var(--color-text)" strokeWidth="2.4" />

          {/* One sampling dot per subinterval; it moves with a, b, n and s. */}
          {bars.map((bar) => (
            <circle
              key={`dot-${bar.i}`}
              data-testid="sample-mark"
              cx={X(bar.sample)}
              cy={Y(evaluate(bar.sample))}
              r="2.6"
              fill="var(--color-accent)"
            />
          ))}

          {/* Tick labels stay put because the scale is fixed. */}
          <g fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">
            {X_LABELS.map((x) => (
              <text
                key={`lx-${x}`}
                data-testid={x === 1 ? "x-tick-1" : undefined}
                x={X(x)}
                y={axisY + 13}
              >
                {x}
              </text>
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="9" textAnchor="end">
            {Y_GRID.map((y) => (
              <text key={`ly-${y}`} x={X(0) - 6} y={Y(y) + 3}>
                {y}
              </text>
            ))}
          </g>
        </g>
        <text
          x={WIDTH - 6}
          y={axisY - 8}
          fill="var(--color-text-muted)"
          fontSize="11"
          textAnchor="end"
        >
          {text.xAxis}
        </text>
        <text
          x={X(0) + 8}
          y="14"
          fill="var(--color-text-muted)"
          fontSize="11"
          textAnchor="start"
        >
          {text.yAxis}
        </text>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
