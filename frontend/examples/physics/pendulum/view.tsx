import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import { useEffect, useId, useRef } from "react";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import { Formula } from "../../../packages/ui/Formula";
import s from "../../../packages/ui/Scene.module.css";
import { smallAnglePeriod } from "./model";
export { model } from "./model";
export default function PendulumView({
  simulation,
  params: p,
  state,
  camera,
}: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, ""),
    group = useRef<SVGGElement>(null);
  const frame = useDiagramFrame(600, 500);
  const pivotY = frame.height * 0.1;
  // Keep a fixed scale for the full 0.2–3 m range at each viewport and zoom.
  const unitsPerMetre = (Math.min(frame.height * 0.8, 258) * 5) / (3 * camera);
  const length = p.length * unitsPerMetre;
  useEffect(
    () =>
      simulation.onRender(() => {
        group.current?.setAttribute(
          "transform",
          `rotate(${(-simulation.state.theta * 180) / Math.PI} 300 ${pivotY})`,
        );
      }),
    [simulation, pivotY],
  );
  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 600 ${frame.height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <pattern
            id={`grid-${id}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0H0V20"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth=".5"
            />
          </pattern>
          <radialGradient id={`bob-${id}`} cx=".3" cy=".3">
            <stop stopColor="#ecce91" />
            <stop offset="1" stopColor="#a87320" />
          </radialGradient>
        </defs>
        <rect width="600" height={frame.height} fill={`url(#grid-${id})`} />
        <path
          d={`M235 ${pivotY}h130`}
          stroke="var(--color-text-muted)"
          strokeWidth="3"
        />
        <path
          d={`M300 ${pivotY}v${length + 25}`}
          stroke="var(--color-text-muted)"
          strokeDasharray="4 5"
          strokeWidth=".7"
        />
        <path
          d={`M${300 - length * Math.sin(p.angle)} ${pivotY + length * Math.cos(p.angle)}A${length} ${length} 0 0 0 ${300 + length * Math.sin(p.angle)} ${pivotY + length * Math.cos(p.angle)}`}
          fill="none"
          stroke="var(--color-secondary)"
          strokeDasharray="3 6"
          strokeWidth="1"
        />
        <g
          ref={group}
          transform={`rotate(${(-state.theta * 180) / Math.PI} 300 ${pivotY})`}
        >
          <line
            x1="300"
            y1={pivotY}
            x2="300"
            y2={pivotY + length}
            stroke="var(--color-text)"
            strokeWidth="1.7"
          />
          <text
            x="316"
            y={pivotY + length / 2}
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            L = {p.length.toFixed(1)} m
          </text>
          <circle
            cx="300"
            cy={pivotY + length}
            r="12"
            fill={`url(#bob-${id})`}
            stroke="var(--color-accent)"
          />
        </g>
        <g fill="var(--color-text-muted)" fontSize="10">
          <text x="580" y={pivotY - 14} textAnchor="end">
            m
          </text>
          <path
            d={`M570 ${pivotY}v${3 * unitsPerMetre}`}
            stroke="var(--color-border)"
          />
          {[0, 1, 2, 3].map((metres) => (
            <g key={metres}>
              <path
                d={`M565 ${pivotY + metres * unitsPerMetre}h10`}
                stroke="var(--color-text-muted)"
              />
              <text x="585" y={pivotY + metres * unitsPerMetre + 3}>
                {metres}
              </text>
            </g>
          ))}
        </g>
        <circle cx="300" cy={pivotY} r="4" fill="var(--color-text)" />
        <text
          x="300"
          y={frame.height - 25}
          textAnchor="middle"
          fill="var(--color-accent)"
          fontSize="12"
        >
          θ = {((state.theta * 180) / Math.PI).toFixed(1)}°
        </text>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}

export function Readouts({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  return (
    <>
      <div className={s.formula}>
        <Formula math={text.formula} />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.period}</span>
          <strong>
            {smallAnglePeriod(p).toFixed(3)}
            <small>s</small>
          </strong>
        </div>
      </div>
    </>
  );
}
