import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import {
  criticalAngle,
  isTotalInternalReflection,
  refractedAngle,
} from "./model";

const WIDTH = 600;
// Fixed diagram scale. One "a.u." (arbitrary unit) always spans the same number
// of pixels, and both rays are drawn exactly 1 a.u. long. Changing a parameter
// therefore only rotates the rays inside this coordinate system; it never
// rescales or re-frames the picture. The equal horizontal and vertical scale
// keeps the drawn angles equal to the physical angles.
const RANGE_AU = 1.15; // half-extent of the shorter axis, in a.u.
const RAY_LEN = 1; // both rays are 1 a.u. long, so sin θ is readable directly
const MARGIN = 28;
const GRID_STEP = 0.25;
const TICK_STEP = 0.5;
const ARC_R = 0.3; // a.u.
const DEG = Math.PI / 180;

type Point = { x: number; y: number };

/** Small filled triangle marking the direction of travel. */
function head(tip: Point, dir: Point, size = 8) {
  const length = Math.hypot(dir.x, dir.y) || 1;
  const ux = dir.x / length;
  const uy = dir.y / length;
  const bx = tip.x - ux * size;
  const by = tip.y - uy * size;
  const px = -uy * size * 0.45;
  const py = ux * size * 0.45;
  return `M${tip.x.toFixed(2)},${tip.y.toFixed(2)}L${(bx + px).toFixed(2)},${(by + py).toFixed(2)}L${(bx - px).toFixed(2)},${(by - py).toFixed(2)}Z`;
}

function segment(a: Point, b: Point) {
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`;
}

export default function RefractionView({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 420);
  const height = frame.height;

  const { theta1, n1, n2 } = p;
  const ox = WIDTH / 2;
  const oy = height / 2;
  // Isotropic scale derived from the frame only, never from the parameters.
  const scale = Math.max(
    1,
    Math.min(ox - MARGIN, oy - MARGIN) / RANGE_AU,
  );

  const theta2 = refractedAngle(n1, n2, theta1);
  const totalInternal = isTotalInternalReflection(n1, n2, theta1);
  const thetaC = criticalAngle(n1, n2);

  const radius = RAY_LEN * scale;
  const point = (angleDeg: number, side: -1 | 1, down: boolean): Point => ({
    x: ox + side * Math.sin(angleDeg * DEG) * radius,
    y: oy + (down ? 1 : -1) * Math.cos(angleDeg * DEG) * radius,
  });
  const along = (a: Point, b: Point, t: number): Point => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  const arc = (
    angleDeg: number,
    side: -1 | 1,
    down: boolean,
    r: number,
  ): string => {
    const steps = 24;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const a = (angleDeg * i) / steps;
      const x = ox + side * Math.sin(a * DEG) * r;
      const y = oy + (down ? 1 : -1) * Math.cos(a * DEG) * r;
      d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }
    return d;
  };
  const arcLabel = (
    angleDeg: number,
    side: -1 | 1,
    down: boolean,
    r: number,
  ): Point => {
    const a = angleDeg < 12 ? 6 : angleDeg / 2;
    return {
      x: ox + side * Math.sin(a * DEG) * r,
      y: oy + (down ? 1 : -1) * Math.cos(a * DEG) * r,
    };
  };

  const origin: Point = { x: ox, y: oy };
  const incidentEnd = point(theta1, -1, false);
  const reflectedEnd = point(theta1, 1, false);
  const refractedEnd = theta2 === null ? null : point(theta2, 1, true);

  // Coordinate grid and ticks, fixed in a.u.
  const maxAuX = ox / scale;
  const maxAuY = oy / scale;
  const verticals: number[] = [];
  for (let k = -Math.ceil(maxAuX / GRID_STEP); k <= Math.ceil(maxAuX / GRID_STEP); k++)
    verticals.push(k * GRID_STEP);
  const horizontals: number[] = [];
  for (let k = -Math.ceil(maxAuY / GRID_STEP); k <= Math.ceil(maxAuY / GRID_STEP); k++)
    horizontals.push(k * GRID_STEP);
  const ticks: number[] = [];
  const maxAu = Math.max(maxAuX, maxAuY);
  for (let v = TICK_STEP; v <= maxAu + 1e-9; v += TICK_STEP)
    ticks.push(Number(v.toFixed(2)));

  const inside = (pt: Point) =>
    pt.x >= 0 && pt.x <= WIDTH && pt.y >= 0 && pt.y <= height;
  const clipped = [
    incidentEnd,
    reflectedEnd,
    ...(refractedEnd ? [refractedEnd] : []),
  ].some((pt) => !inside(pt));

  const rayStyle = "var(--color-secondary)";
  const refractedStyle = "var(--color-accent)";
  const muted = "var(--color-text-muted)";

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
          {/* Medium 2 sits below the interface. */}
          <rect
            x="0"
            y={oy}
            width={WIDTH}
            height={Math.max(0, height - oy)}
            fill="var(--color-border)"
            opacity="0.18"
          />

          {/* Coordinate grid: one cell is 0.25 a.u. in both directions. */}
          <g stroke="var(--color-border)" strokeWidth="0.5">
            {verticals.map((v) => (
              <path key={`v${v}`} d={`M${ox + v * scale},0V${height}`} />
            ))}
            {horizontals.map((v) => (
              <path key={`h${v}`} d={`M0,${oy + v * scale}H${WIDTH}`} />
            ))}
          </g>

          {/* Unit circle: both rays are 1 a.u. long, so a ray tip lies on it. */}
          <circle
            cx={ox}
            cy={oy}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="0.8"
            strokeDasharray="3 4"
          />

          {/* Axes: the interface is the horizontal axis, the normal the vertical one. */}
          <path
            d={`M0,${oy}H${WIDTH}`}
            stroke={muted}
            strokeWidth="2"
            data-interface
          />
          <path
            d={`M${ox},0V${height}`}
            stroke={muted}
            strokeWidth="1"
            strokeDasharray="6 5"
          />

          {/* Ticks and their numbers. */}
          <g stroke={muted} strokeWidth="1">
            {ticks.map((v) => (
              <g key={`t${v}`}>
                <path d={`M${ox - v * scale},${oy - 3}V${oy + 3}`} />
                <path d={`M${ox + v * scale},${oy - 3}V${oy + 3}`} />
                <path d={`M${ox - 3},${oy - v * scale}H${ox + 3}`} />
                <path d={`M${ox - 3},${oy + v * scale}H${ox + 3}`} />
              </g>
            ))}
          </g>
          <g fill={muted} fontSize="9" textAnchor="middle">
            {ticks.map((v) => (
              <g key={`lx${v}`}>
                {ox - v * scale >= 30 && (
                  <text x={ox - v * scale} y={oy + 14}>
                    {v.toFixed(1)}
                  </text>
                )}
                {ox + v * scale <= WIDTH - 46 && (
                  <text x={ox + v * scale} y={oy + 14}>
                    {v.toFixed(1)}
                  </text>
                )}
              </g>
            ))}
          </g>
          <g fill={muted} fontSize="9" textAnchor="start">
            {ticks.map((v) => (
              <g key={`ly${v}`}>
                {oy - v * scale >= 26 && (
                  <text x={ox + 5} y={oy - v * scale + 3}>
                    {v.toFixed(1)}
                  </text>
                )}
                {oy + v * scale <= height - 18 && (
                  <text x={ox + 5} y={oy + v * scale + 3}>
                    {v.toFixed(1)}
                  </text>
                )}
              </g>
            ))}
          </g>
          <text x={6} y={16} fill={muted} fontSize="10" textAnchor="start">
            {text.axisY}
          </text>
          <text
            x={WIDTH - 6}
            y={oy + 14}
            fill={muted}
            fontSize="10"
            textAnchor="end"
          >
            {text.axisX}
          </text>

          {/* Region labels. */}
          <text
            x={WIDTH - 6}
            y={16}
            fill={muted}
            fontSize="11"
            textAnchor="end"
          >
            {text.medium1} · n₁ = {n1.toFixed(2)}
          </text>
          <text
            x={WIDTH - 6}
            y={height - 8}
            fill={muted}
            fontSize="11"
            textAnchor="end"
          >
            {text.medium2} · n₂ = {n2.toFixed(2)}
          </text>
          <text
            x={WIDTH - 6}
            y={oy - 8}
            fill={muted}
            fontSize="10"
            textAnchor="end"
          >
            {text.interface}
          </text>
          <text x={ox + 7} y={16} fill={muted} fontSize="10" textAnchor="start">
            {text.normal}
          </text>

          {/* Critical direction, drawn inside medium 1 at the angle from the normal. */}
          {thetaC !== null && (
            <g>
              <path
                d={segment(origin, point(thetaC, -1, false))}
                stroke={muted}
                strokeWidth="1"
                strokeDasharray="2 4"
                fill="none"
              />
              <text
                x={point(thetaC, -1, false).x - 6}
                y={point(thetaC, -1, false).y - 4}
                fill={muted}
                fontSize="10"
                textAnchor="end"
              >
                θc = {thetaC.toFixed(1)}°
              </text>
            </g>
          )}

          {/* Sine construction: with 1 a.u. rays, the drop to the normal is sin θ. */}
          {theta1 > 2 && (
            <>
              <path
                d={segment(incidentEnd, reflectedEnd)}
                stroke={muted}
                strokeWidth="0.8"
                strokeDasharray="3 3"
                fill="none"
              />
              <text
                x={ox - (Math.sin(theta1 * DEG) * radius) / 2}
                y={incidentEnd.y - 5}
                fill={muted}
                fontSize="9"
                textAnchor="middle"
              >
                {text.sine}₁ = {Math.sin(theta1 * DEG).toFixed(2)}
              </text>
            </>
          )}
          {refractedEnd && theta2 !== null && theta2 > 2 && (
            <>
              <path
                d={segment({ x: ox, y: refractedEnd.y }, refractedEnd)}
                stroke={muted}
                strokeWidth="0.8"
                strokeDasharray="3 3"
                fill="none"
              />
              <text
                x={ox + (Math.sin(theta2 * DEG) * radius) / 2}
                y={refractedEnd.y + 12}
                fill={muted}
                fontSize="9"
                textAnchor="middle"
              >
                {text.sine}₂ = {Math.sin(theta2 * DEG).toFixed(2)}
              </text>
            </>
          )}

          {/* Angle arcs and their labels. */}
          {theta1 > 0.5 && (
            <>
              <path
                d={arc(theta1, -1, false, ARC_R * scale)}
                fill="none"
                stroke={muted}
                strokeWidth="1"
              />
              <text
                x={arcLabel(theta1, -1, false, ARC_R * scale + 20).x}
                y={arcLabel(theta1, -1, false, ARC_R * scale + 20).y}
                fill={muted}
                fontSize="10"
                textAnchor="middle"
              >
                θ₁ = {theta1.toFixed(1)}°
              </text>
            </>
          )}
          {refractedEnd && theta2 !== null && theta2 > 0.5 && (
            <>
              <path
                d={arc(theta2, 1, true, ARC_R * scale)}
                fill="none"
                stroke={muted}
                strokeWidth="1"
              />
              <text
                x={arcLabel(theta2, 1, true, ARC_R * scale + 20).x}
                y={arcLabel(theta2, 1, true, ARC_R * scale + 20).y + 4}
                fill={muted}
                fontSize="10"
                textAnchor="middle"
              >
                θ₂ = {theta2.toFixed(1)}°
              </text>
            </>
          )}

          {/* Incident ray: light travels toward the interface. */}
          <path
            d={segment(incidentEnd, origin)}
            stroke={rayStyle}
            strokeWidth="1.6"
            fill="none"
            data-ray="incident"
          />
          <path
            d={head(along(incidentEnd, origin, 0.55), {
              x: origin.x - incidentEnd.x,
              y: origin.y - incidentEnd.y,
            })}
            fill={rayStyle}
          />
          <text
            x={incidentEnd.x - 6}
            y={incidentEnd.y - 6}
            fill={rayStyle}
            fontSize="11"
            textAnchor="end"
          >
            {text.incident}
          </text>

          {/* Reflected ray: direction only, intensity is not modelled. */}
          <path
            d={segment(origin, reflectedEnd)}
            stroke={muted}
            strokeWidth="1.2"
            strokeDasharray="6 4"
            fill="none"
          />
          <path
            d={head(reflectedEnd, {
              x: reflectedEnd.x - origin.x,
              y: reflectedEnd.y - origin.y,
            })}
            fill={muted}
          />
          <text
            x={reflectedEnd.x + 6}
            y={reflectedEnd.y - 6}
            fill={muted}
            fontSize="10"
            textAnchor="start"
          >
            {text.reflected}
          </text>

          {/* Refracted ray, when it exists. */}
          {refractedEnd && (
            <>
              <path
                d={segment(origin, refractedEnd)}
                stroke={refractedStyle}
                strokeWidth="1.8"
                fill="none"
                data-ray="refracted"
              />
              <path
                d={head(refractedEnd, {
                  x: refractedEnd.x - origin.x,
                  y: refractedEnd.y - origin.y,
                })}
                fill={refractedStyle}
              />
              <circle
                cx={refractedEnd.x}
                cy={refractedEnd.y}
                r="3.5"
                fill={refractedStyle}
                data-ray-tip="refracted"
              />
              <text
                x={refractedEnd.x + 8}
                y={refractedEnd.y + 14}
                fill={refractedStyle}
                fontSize="11"
                textAnchor="start"
              >
                {text.refracted}
              </text>
            </>
          )}

          {totalInternal && (
            <text
              x={ox + 12}
              y={oy + 30}
              fill={refractedStyle}
              fontSize="12"
              textAnchor="start"
            >
              {text.totalInternal}
            </text>
          )}
          {clipped && (
            <text
              x={WIDTH - 10}
              y={oy + 30}
              fill={refractedStyle}
              fontSize="10"
              textAnchor="end"
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
