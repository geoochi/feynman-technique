import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import { useId } from "react";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
export default function FunctionView({ params: p, camera }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(500, 320);
  const scale = (36 * 5) / camera,
    X = (x: number) => 250 + x * scale,
    Y = (y: number) => frame.height / 2 - y * scale;
  const path = (a: number, h: number, k: number) =>
    Array.from({ length: 241 }, (_, i) => {
      const x = -7 + (i * 14) / 240;
      return `${i ? "L" : "M"}${X(x)},${Y(a * (x - h) ** 2 + k)}`;
    }).join(" ");
  const extent = Math.ceil(Math.max(250, frame.height / 2) / scale);
  const ticks = Array.from({ length: extent * 2 + 1 }, (_, i) => i - extent);
  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 500 ${frame.height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <clipPath id={`clip-${id}`}>
            <rect width="500" height={frame.height} />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${id})`}>
          {ticks.map((v) => (
            <g key={v}>
              <path
                d={`M${X(v)} 0V${frame.height}M0 ${Y(v)}H500`}
                stroke="var(--color-border)"
                strokeWidth=".6"
              />
              {v !== 0 && (
                <>
                  {X(v) > 12 && X(v) < 488 && (
                    <text
                      x={X(v)}
                      y={Y(0) + 15}
                      fill="var(--color-text-muted)"
                      fontSize="8"
                      textAnchor="middle"
                    >
                      {v}
                    </text>
                  )}
                  {Y(v) > 12 && Y(v) < frame.height - 12 && (
                    <text
                      x={X(0) - 8}
                      y={Y(v) + 3}
                      fill="var(--color-text-muted)"
                      fontSize="8"
                      textAnchor="end"
                    >
                      {v}
                    </text>
                  )}
                </>
              )}
            </g>
          ))}
          <path
            d={`M0 ${Y(0)}H500M${X(0)} 0V${frame.height}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            d={path(1, 0, 0)}
            stroke="var(--color-secondary)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            fill="none"
          />
          <path
            d={path(p.a, p.h, p.k)}
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            fill="none"
          />
          {p.a !== 0 && (
            <>
              <circle
                cx={X(p.h)}
                cy={Y(p.k)}
                r="4"
                fill="var(--color-accent)"
              />
              <text
                x={X(p.h) + 10}
                y={Y(p.k) - 12}
                fontSize="10"
                fill="var(--color-accent)"
              >
                ({p.h.toFixed(1)}, {p.k.toFixed(1)})
              </text>
            </>
          )}
        </g>
        <text x="481" y={Y(0) - 7} fill="var(--color-text-muted)" fontSize="10">
          x
        </text>
        <text x={X(0) + 8} y="13" fill="var(--color-text-muted)" fontSize="10">
          y
        </text>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
