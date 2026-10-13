import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import { imageDistance, imageKind, magnification } from "./model";

const WIDTH = 600;
// Fixed optical scale. Changing a parameter moves the drawing; it never rescales
// it, so the same grid step always means the same distance in metres.
const X_RANGE = 0.9; // metres shown on each side of the lens
const Y_RANGE = 0.16; // metres shown on each side of the optical axis
const MARGIN = 24;
const GRID_STEP_X = 0.1;
const GRID_STEP_Y = 0.04;

function ticks(step: number, range: number) {
  const out: number[] = [];
  for (let m = step; m <= range + 1e-9; m += step) out.push(Number(m.toFixed(2)));
  return out;
}
const X_GRID = ticks(GRID_STEP_X, X_RANGE);
const Y_GRID = ticks(GRID_STEP_Y, Y_RANGE);
const X_LABELS = [0.2, 0.4, 0.6, 0.8];
const Y_LABELS = [0.08, 0.16];

function Arrow({
  x,
  yBase,
  yTip,
  color,
  dashed,
}: {
  x: number;
  yBase: number;
  yTip: number;
  color: string;
  dashed?: boolean;
}) {
  const direction = yTip <= yBase ? -1 : 1;
  return (
    <g>
      <path
        d={`M${x},${yBase}L${x},${yTip}`}
        stroke={color}
        strokeWidth="2.4"
        strokeDasharray={dashed ? "5 4" : undefined}
        fill="none"
      />
      <path
        d={`M${x},${yTip}L${x - 4},${yTip - direction * 7}L${x + 4},${yTip - direction * 7}Z`}
        fill={color}
      />
    </g>
  );
}

export default function ThinLensView({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 360);
  const height = frame.height;
  const lensX = WIDTH / 2;
  const axisY = height / 2;
  const sx = (WIDTH / 2 - MARGIN) / X_RANGE;
  const sy = (height / 2 - MARGIN) / Y_RANGE;

  const { u, f, h } = p;
  const v = imageDistance(u, f);
  const m = magnification(u, f);
  const kind = imageKind(u, f);
  const finite = Number.isFinite(v);
  const virtual = kind === "virtual";

  const objectX = lensX - u * sx;
  const objectTipY = axisY - h * sy;
  const nearFocusX = lensX - f * sx;
  const farFocusX = lensX + f * sx;

  const tipRise = h * sy;
  const parallelSlope = tipRise / (f * sx);
  const centralSlope = tipRise / (u * sx);
  const drawFocalRay = Math.abs(u - f) > 1e-6;
  const focalSlope = tipRise / ((u - f) * sx);
  const focalHitY = objectTipY + focalSlope * u * sx;

  const imageX = lensX + v * sx;
  const imageTipY = axisY - m * h * sy;
  const imageInFrame = finite && imageX >= 0 && imageX <= WIDTH;
  // The image leaves the fixed frame when it sits past the edge, or when it is
  // taller than the fixed vertical range (u close to f).
  const imageClipped =
    finite && (!imageInFrame || Math.abs(m * h) > Y_RANGE);

  const segment = (x0: number, y0: number, x1: number, y1: number) =>
    `M${x0},${y0}L${x1},${y1}`;
  const rayTo = (x0: number, y0: number, slope: number, x1: number) =>
    `M${x0},${y0}L${x1},${y0 + slope * (x1 - x0)}`;

  const rayStyle = "var(--color-secondary)";

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
          {/* Coordinate grid: one cell is 0.1 m across and 0.02 m up. */}
          <g stroke="var(--color-border)" strokeWidth="0.5">
            {X_GRID.map((metres) => (
              <g key={`gx-${metres}`}>
                <path d={`M${lensX - metres * sx},0V${height}`} />
                <path d={`M${lensX + metres * sx},0V${height}`} />
              </g>
            ))}
            {Y_GRID.map((metres) => (
              <g key={`gy-${metres}`}>
                <path d={`M0,${axisY - metres * sy}H${WIDTH}`} />
                <path d={`M0,${axisY + metres * sy}H${WIDTH}`} />
              </g>
            ))}
          </g>

          {/* Axes: the optical axis and the lens plane meet at the origin. */}
          <path
            d={`M0,${axisY}H${WIDTH}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={`M${lensX},0V${height}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <g stroke="var(--color-text-muted)" strokeWidth="1">
            {X_GRID.map((metres) => (
              <g key={`tx-${metres}`}>
                <path
                  d={`M${lensX - metres * sx},${axisY - 3}V${axisY + 3}`}
                />
                <path
                  d={`M${lensX + metres * sx},${axisY - 3}V${axisY + 3}`}
                />
              </g>
            ))}
          </g>
          <g
            fill="var(--color-text-muted)"
            fontSize="9"
            textAnchor="middle"
          >
            {X_LABELS.map((metres) => (
              <g key={`lx-${metres}`}>
                <text x={lensX - metres * sx} y={axisY + 14}>
                  {metres.toFixed(1)}
                </text>
                <text x={lensX + metres * sx} y={axisY + 14}>
                  {metres.toFixed(1)}
                </text>
              </g>
            ))}
          </g>
          <g fill="var(--color-text-muted)" fontSize="9" textAnchor="start">
            {Y_LABELS.map((metres) => (
              <g key={`ly-${metres}`}>
                <text x={4} y={axisY - metres * sy + 3}>
                  {metres.toFixed(2)}
                </text>
                <text x={4} y={axisY + metres * sy + 3}>
                  {metres.toFixed(2)}
                </text>
              </g>
            ))}
          </g>
          <text
            x={WIDTH - 4}
            y={axisY - 6}
            fill="var(--color-text-muted)"
            fontSize="9"
            textAnchor="end"
          >
            {text.axisDistance}
          </text>
          <text
            x={4}
            y={12}
            fill="var(--color-text-muted)"
            fontSize="9"
            textAnchor="start"
          >
            {text.axisHeight}
          </text>

          {/* The lens itself is schematic. */}
          <path
            d={`M${lensX},${axisY - height * 0.34} Q${lensX + 16},${axisY} ${lensX},${axisY + height * 0.34} Q${lensX - 16},${axisY} ${lensX},${axisY - height * 0.34} Z`}
            fill="var(--color-background)"
            stroke="var(--color-text-muted)"
            strokeWidth="1.4"
          />
          {[nearFocusX, farFocusX].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={axisY} r="3" fill="var(--color-text-muted)" />
              <text
                x={x}
                y={axisY + 16}
                fill="var(--color-text-muted)"
                fontSize="11"
                textAnchor="middle"
              >
                {i === 0 ? "F" : "F′"}
              </text>
            </g>
          ))}

          {/* Ray 1: parallel to the axis, then through the far focus. */}
          <path
            d={segment(objectX, objectTipY, lensX, objectTipY)}
            stroke={rayStyle}
            strokeWidth="1.1"
            fill="none"
          />
          <path
            d={rayTo(lensX, objectTipY, parallelSlope, WIDTH)}
            stroke={rayStyle}
            strokeWidth="1.1"
            fill="none"
          />
          {/* Ray 2: through the optical centre, undeviated. */}
          <path
            d={segment(objectX, objectTipY, lensX, axisY)}
            stroke={rayStyle}
            strokeWidth="1.1"
            fill="none"
          />
          <path
            d={rayTo(lensX, axisY, centralSlope, WIDTH)}
            stroke={rayStyle}
            strokeWidth="1.1"
            fill="none"
          />
          {/* Ray 3: through the near focus, emerging parallel to the axis. */}
          {drawFocalRay && (
            <>
              <path
                d={segment(objectX, objectTipY, lensX, focalHitY)}
                stroke={rayStyle}
                strokeWidth="1.1"
                fill="none"
              />
              <path
                d={rayTo(lensX, focalHitY, 0, WIDTH)}
                stroke={rayStyle}
                strokeWidth="1.1"
                fill="none"
              />
            </>
          )}

          {/* Backward extensions locate a virtual image. */}
          {virtual && (
            <>
              <path
                d={rayTo(lensX, objectTipY, parallelSlope, 0)}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="5 5"
                fill="none"
              />
              <path
                d={rayTo(lensX, axisY, centralSlope, 0)}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="5 5"
                fill="none"
              />
              {drawFocalRay && (
                <path
                  d={rayTo(lensX, focalHitY, 0, 0)}
                  stroke="var(--color-text-muted)"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  fill="none"
                />
              )}
            </>
          )}

          {finite && imageInFrame && (
            <Arrow
              x={imageX}
              yBase={axisY}
              yTip={imageTipY}
              color="var(--color-accent)"
              dashed={virtual}
            />
          )}
          <Arrow
            x={objectX}
            yBase={axisY}
            yTip={objectTipY}
            color="var(--color-accent)"
          />

          <text
            x={objectX}
            y={objectTipY - 8}
            fill="var(--color-accent)"
            fontSize="11"
            textAnchor="middle"
          >
            {text.object}
          </text>
          {finite && imageInFrame && (
            <text
              x={imageX}
              y={imageTipY + (imageTipY < axisY ? -8 : 16)}
              fill="var(--color-accent)"
              fontSize="11"
              textAnchor="middle"
            >
              {text.image}
            </text>
          )}
          {!finite && (
            <text
              x={WIDTH - 12}
              y={axisY - 14}
              fill="var(--color-accent)"
              fontSize="12"
              textAnchor="end"
            >
              {text.infinite}
            </text>
          )}
          {imageClipped && (
            <text
              x={v >= 0 ? WIDTH - 12 : 12}
              y={axisY + (v >= 0 ? -14 : 20)}
              fill="var(--color-accent)"
              fontSize="11"
              textAnchor={v >= 0 ? "end" : "start"}
            >
              {text.offFrame}
            </text>
          )}
        </g>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
