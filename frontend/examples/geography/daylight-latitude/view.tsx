import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import { dayLengthHours, polarBoundaryLatitude } from "./model";
import s from "../../../packages/ui/Scene.module.css";

const WIDTH = 640;
const HEIGHT = 420;
const PAD = { left: 48, right: 20, top: 24, bottom: 36 };
const LATITUDE_TICKS = [-90, -60, -30, 0, 30, 60, 90];
const HOUR_TICKS = [0, 6, 12, 18, 24];

export default function DaylightView({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, HEIGHT);
  const height = frame.height;
  const left = PAD.left;
  const right = WIDTH - PAD.right;
  const top = PAD.top;
  const bottom = height - PAD.bottom;
  const X = (latitude: number) =>
    left + ((latitude + 90) / 180) * (right - left);
  const Y = (hours: number) => bottom - (hours / 24) * (bottom - top);

  const curve = Array.from({ length: 361 }, (_, i) => {
    const latitude = -90 + i * 0.5;
    return `${i ? "L" : "M"}${X(latitude).toFixed(2)},${Y(
      dayLengthHours(latitude, p.declination),
    ).toFixed(2)}`;
  }).join(" ");

  const boundary = polarBoundaryLatitude(p.declination);
  const showsBoundary = boundary < 90 - 1e-6;
  const dayRegion: [number, number] = p.declination > 0
    ? [boundary, 90]
    : [-90, -boundary];
  const nightRegion: [number, number] = p.declination > 0
    ? [-90, -boundary]
    : [boundary, 90];
  const region = ([from, to]: [number, number]) => ({
    x: X(from),
    width: X(to) - X(from),
  });

  const current = dayLengthHours(p.latitude, p.declination);
  const markerRight = X(p.latitude) < right - 96;

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <clipPath id={`plot-${id}`}>
            <rect x={left} y={top} width={right - left} height={bottom - top} />
          </clipPath>
        </defs>
        <g clipPath={`url(#plot-${id})`}>
          {showsBoundary && (
            <>
              <rect
                {...region(dayRegion)}
                y={top}
                height={bottom - top}
                fill="var(--color-accent)"
                fillOpacity=".08"
              />
              <rect
                {...region(nightRegion)}
                y={top}
                height={bottom - top}
                fill="var(--color-secondary)"
                fillOpacity=".1"
              />
            </>
          )}
          {HOUR_TICKS.map((hours) => (
            <path
              key={`h${hours}`}
              d={`M${left} ${Y(hours)}H${right}`}
              stroke="var(--color-border)"
              strokeWidth=".7"
            />
          ))}
          {LATITUDE_TICKS.map((latitude) => (
            <path
              key={`v${latitude}`}
              d={`M${X(latitude)} ${top}V${bottom}`}
              stroke="var(--color-border)"
              strokeWidth={latitude === 0 ? "1.1" : ".7"}
            />
          ))}
          <path
            d={`M${left} ${Y(12)}H${right}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          {showsBoundary &&
            [boundary, -boundary].map((latitude) => (
              <path
                key={`b${latitude}`}
                d={`M${X(latitude)} ${top}V${bottom}`}
                stroke="var(--color-text-muted)"
                strokeWidth="1"
                strokeDasharray="6 5"
              />
            ))}
          <path
            d={curve}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
          />
          <path
            d={`M${X(p.latitude)} ${top}V${bottom}`}
            stroke="var(--color-text)"
            strokeWidth="1"
            strokeOpacity=".55"
          />
          <circle
            cx={X(p.latitude)}
            cy={Y(current)}
            r="4.5"
            fill="var(--color-text)"
          />
        </g>
        <path
          d={`M${left} ${top}V${bottom}H${right}`}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="1"
        />
        {HOUR_TICKS.map((hours) => (
          <text
            key={`hl${hours}`}
            x={left - 7}
            y={Y(hours) + 3}
            fill="var(--color-text-muted)"
            fontSize="8"
            textAnchor="end"
          >
            {hours}
          </text>
        ))}
        {LATITUDE_TICKS.map((latitude) => (
          <text
            key={`vl${latitude}`}
            x={X(latitude)}
            y={bottom + 13}
            fill="var(--color-text-muted)"
            fontSize="8"
            textAnchor="middle"
          >
            {latitude}
          </text>
        ))}
        <text
          x={left - 7}
          y={top - 9}
          fill="var(--color-text-muted)"
          fontSize="9"
          textAnchor="end"
        >
          D (h)
        </text>
        <text
          x={right}
          y={bottom + 26}
          fill="var(--color-text-muted)"
          fontSize="9"
          textAnchor="end"
        >
          φ (°)
        </text>
        <text
          x={right - 4}
          y={Y(12) - 5}
          fill="var(--color-text-muted)"
          fontSize="8"
          textAnchor="end"
        >
          {text.twelveHour}
        </text>
        {showsBoundary &&
          [boundary, -boundary].map((latitude) => (
            <text
              key={`bl${latitude}`}
              x={X(latitude)}
              y={top - 9}
              fill="var(--color-text-muted)"
              fontSize="8"
              textAnchor="middle"
            >
              {latitude.toFixed(1)}°
            </text>
          ))}
        <text
          x={X(p.latitude) + (markerRight ? 9 : -9)}
          y={Y(current) - 8}
          fill="var(--color-text)"
          fontSize="9"
          textAnchor={markerRight ? "start" : "end"}
        >
          {current.toFixed(2)} h
        </text>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
