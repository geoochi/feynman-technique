import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import { current } from "./model";

const WIDTH = 600;
// Fixed frame for the I–V plot. These limits never depend on the parameters, so
// changing V or R moves the drawing inside a stable frame instead of rescaling
// the whole picture. Anything past the top edge is clipped and reported.
const V_MAX = 12; // volts across the frame
const I_MAX = 6; // amperes across the frame
const PLOT_X0 = 322;
const PLOT_X1 = 574;
const CIRCUIT_LEFT = 52;
const CIRCUIT_RIGHT = 224;
const V_TICKS = [2, 4, 6, 8, 10, 12];
const V_MINOR = [1, 3, 5, 7, 9, 11];
const I_TICKS = [1, 2, 3, 4, 5, 6];
const I_MINOR = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

export default function OhmsLawView({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 360);
  const height = frame.height;

  const plotTop = height * 0.16;
  const plotBottom = height * 0.8;
  // Pixels per unit are constants of the frame, not of the current parameters.
  const sx = (PLOT_X1 - PLOT_X0) / V_MAX;
  const sy = (plotBottom - plotTop) / I_MAX;
  const X = (volts: number) => PLOT_X0 + volts * sx;
  const Y = (amps: number) => plotBottom - amps * sy;

  const { v, r } = p;
  const i = current(v, r);
  const inFrame = i <= I_MAX + 1e-9;

  // Circuit geometry, drawn in the same vertical band as the plot.
  const circuitTop = plotTop;
  const circuitBottom = plotBottom;
  const circuitMid = (circuitTop + circuitBottom) / 2;
  const resistor =
    `M116,${circuitTop} l6,-9 l12,18 l12,-18 l12,18 l6,-9`;
  const segment = (x0: number, y0: number, x1: number, y1: number) =>
    `M${x0},${y0}L${x1},${y1}`;

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <clipPath id={`clip-all-${id}`}>
            <rect width={WIDTH} height={height} />
          </clipPath>
          <clipPath id={`clip-plot-${id}`}>
            <rect
              x={PLOT_X0}
              y={plotTop}
              width={PLOT_X1 - PLOT_X0}
              height={plotBottom - plotTop}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-all-${id})`}>
          {/* Coordinate system: a light grid plus labelled axes with units. */}
          <g clipPath={`url(#clip-plot-${id})`}>
            <g stroke="var(--color-border)" strokeWidth="0.5">
              {V_MINOR.map((volts) => (
                <path key={`vmin-${volts}`} d={`M${X(volts)},${plotTop}V${plotBottom}`} />
              ))}
              {I_MINOR.map((amps) => (
                <path key={`imin-${amps}`} d={`M${PLOT_X0},${Y(amps)}H${PLOT_X1}`} />
              ))}
              {V_TICKS.map((volts) => (
                <path key={`vmaj-${volts}`} d={`M${X(volts)},${plotTop}V${plotBottom}`} />
              ))}
              {I_TICKS.map((amps) => (
                <path key={`imaj-${amps}`} d={`M${PLOT_X0},${Y(amps)}H${PLOT_X1}`} />
              ))}
            </g>
            {/* The resistor's own characteristic I = V / R through the origin. */}
            <path
              d={segment(X(0), Y(0), X(V_MAX), Y(V_MAX / r))}
              stroke="var(--color-secondary)"
              strokeWidth="2"
              fill="none"
            />
          </g>

          {/* Axes */}
          <path
            d={segment(X(0), plotTop, X(0), plotBottom)}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={segment(PLOT_X0, Y(0), PLOT_X1, Y(0))}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {V_TICKS.map((volts) => (
              <path
                key={`vtick-${volts}`}
                d={`M${X(volts)},${plotBottom - 3}V${plotBottom + 3}`}
              />
            ))}
            {I_TICKS.map((amps) => (
              <path
                key={`itick-${amps}`}
                d={`M${PLOT_X0 - 3},${Y(amps)}H${PLOT_X0 + 3}`}
              />
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">
            {V_TICKS.map((volts) => (
              <text
                key={`vlabel-${volts}`}
                data-axis-tick={String(volts)}
                x={X(volts)}
                y={plotBottom + 13}
              >
                {volts}
              </text>
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="9" textAnchor="end">
            {I_TICKS.map((amps) => (
              <text key={`ilabel-${amps}`} x={PLOT_X0 - 6} y={Y(amps) + 3}>
                {amps}
              </text>
            ))}
          </g>
          <text
            x={PLOT_X1}
            y={plotBottom + 26}
            fill="var(--color-text-muted)"
            fontSize="10"
            textAnchor="end"
          >
            {text.axisVoltage}
          </text>
          <text
            x={PLOT_X0 - 6}
            y={plotTop - 10}
            fill="var(--color-text-muted)"
            fontSize="10"
            textAnchor="end"
          >
            {text.axisCurrent}
          </text>
          <text
            x={PLOT_X1}
            y={plotTop - 10}
            fill="var(--color-text-muted)"
            fontSize="10"
            textAnchor="end"
          >
            {text.plotTitle}
          </text>

          {/* Operating point: where the source voltage meets the resistor line. */}
          {inFrame && (
            <>
              <path
                d={segment(X(v), plotBottom, X(v), Y(i))}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="4 4"
                fill="none"
              />
              <path
                d={segment(PLOT_X0, Y(i), X(v), Y(i))}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="4 4"
                fill="none"
              />
              <circle
                data-operating-point=""
                cx={X(v)}
                cy={Y(i)}
                r="5"
                fill="var(--color-accent)"
              />
              <text
                x={X(v) + 9}
                y={Y(i) - 8}
                fill="var(--color-accent)"
                fontSize="10"
                textAnchor="start"
              >
                {text.operatingPoint}
              </text>
            </>
          )}
          {!inFrame && (
            <text
              x={PLOT_X1}
              y={plotTop + 14}
              fill="var(--color-accent)"
              fontSize="11"
              textAnchor="end"
            >
              {text.offFrame}
            </text>
          )}

          {/* Simple circuit: one ideal source on the left, one resistor on top. */}
          <g
            stroke="var(--color-text-muted)"
            strokeWidth="1.4"
            fill="none"
            strokeLinejoin="round"
          >
            <path d={segment(CIRCUIT_LEFT, circuitTop, 116, circuitTop)} />
            <path d={segment(164, circuitTop, CIRCUIT_RIGHT, circuitTop)} />
            <path d={segment(CIRCUIT_RIGHT, circuitTop, CIRCUIT_RIGHT, circuitBottom)} />
            <path d={segment(CIRCUIT_LEFT, circuitBottom, CIRCUIT_RIGHT, circuitBottom)} />
            <path d={segment(CIRCUIT_LEFT, circuitTop, CIRCUIT_LEFT, circuitMid - 9)} />
            <path d={segment(CIRCUIT_LEFT, circuitMid + 9, CIRCUIT_LEFT, circuitBottom)} />
            <path d={resistor} />
            {/* Battery plates: the long plate is the positive terminal. */}
            <path d={segment(CIRCUIT_LEFT - 14, circuitMid - 9, CIRCUIT_LEFT + 14, circuitMid - 9)} />
            <path d={segment(CIRCUIT_LEFT - 7, circuitMid + 9, CIRCUIT_LEFT + 7, circuitMid + 9)} />
            {/* Conventional current direction along the bottom wire. */}
            <path d={segment(120, circuitBottom, 160, circuitBottom)} />
          </g>
          <path
            d={`M164,${circuitBottom}L156,${circuitBottom - 4}L156,${circuitBottom + 4}Z`}
            fill="var(--color-text-muted)"
          />
          <g fill="var(--color-text-muted)" fontSize="10">
            <text x={CIRCUIT_LEFT - 20} y={circuitMid + 4} textAnchor="end">
              {text.sourceVoltage}
            </text>
            <text x={140} y={circuitTop - 10} textAnchor="middle">
              {text.resistance}
            </text>
            <text x={140} y={circuitBottom + 16} textAnchor="middle">
              {text.currentArrow}
            </text>
            <text x={138} y={circuitTop - 28} textAnchor="middle">
              {text.circuitTitle}
            </text>
          </g>
        </g>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
