import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import { imageDistance, imageKind, magnification } from "./model";

const WIDTH = 600;

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
  const axisY = height * 0.56;

  const { u, f, h } = p;
  const v = imageDistance(u, f);
  const m = magnification(u, f);
  const kind = imageKind(u, f);
  const finite = Number.isFinite(v);
  const virtual = kind === "virtual";

  // Fit the object and the focal points; cap how far a very distant image can shrink the scale.
  const reach = Math.max(u, f);
  const span = Math.max(
    u,
    f,
    finite ? Math.min(Math.abs(v), 2.5 * reach) : 2.5 * reach,
  );
  const sx = (lensX - 46) / span;
  const sy = (height * 0.15) / 0.06;

  const objectX = lensX - u * sx;
  const objectTipY = axisY - h * sy;
  const nearFocusX = lensX - f * sx;
  const farFocusX = lensX + f * sx;

  const tipRise = axisY - objectTipY;
  const parallelSlope = tipRise / (f * sx);
  const centralSlope = tipRise / (u * sx);
  const drawFocalRay = Math.abs(u - f) > 1e-6;
  const focalSlope = tipRise / ((u - f) * sx);
  const focalHitY = objectTipY + focalSlope * u * sx;

  const imageX = lensX + v * sx;
  const imageTipY = axisY - m * h * sy;

  const segment = (x0: number, y0: number, x1: number, y1: number) =>
    `M${x0},${y0}L${x1},${y1}`;
  const rayTo = (x0: number, y0: number, slope: number, x1: number) =>
    `M${x0},${y0}L${x1},${y0 + slope * (x1 - x0)}`;

  const rightEdge = WIDTH + 2;
  const leftEdge = -2;
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
          <path
            d={`M0 ${axisY}H${WIDTH}`}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
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
            d={rayTo(lensX, objectTipY, parallelSlope, rightEdge)}
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
            d={rayTo(lensX, axisY, centralSlope, rightEdge)}
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
                d={rayTo(lensX, focalHitY, 0, rightEdge)}
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
                d={rayTo(lensX, objectTipY, parallelSlope, leftEdge)}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="5 5"
                fill="none"
              />
              <path
                d={rayTo(lensX, axisY, centralSlope, leftEdge)}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="5 5"
                fill="none"
              />
              {drawFocalRay && (
                <path
                  d={rayTo(lensX, focalHitY, 0, leftEdge)}
                  stroke="var(--color-text-muted)"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  fill="none"
                />
              )}
            </>
          )}

          {finite && (
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
          {finite && (
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
        </g>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
