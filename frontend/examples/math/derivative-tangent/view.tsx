import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import { evaluate, secantSlope, tangentValue } from "./model";

export default function DerivativeView({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(500, 400);
  // Equal axis scales fit every permitted P and Q, independent of parameters.
  const scale = Math.min(72, Math.max(1, (frame.height - 50) / 8));
  const X = (x: number) => 250 + x * scale;
  const Y = (y: number) => frame.height / 2 + (3 - y) * scale;
  const slope = secantSlope(p.x0, p.h);
  const q = p.x0 + p.h;
  const line = (fn: (x: number) => number) => `M${X(-4)},${Y(fn(-4))}L${X(4)},${Y(fn(4))}`;
  const curve = Array.from({ length: 161 }, (_, i) => {
    const x = -3 + i * 6 / 160;
    return `${i ? "L" : "M"}${X(x)},${Y(evaluate(x))}`;
  }).join(" ");
  return (
    <div className={s.scene}>
      <svg ref={frame.ref} viewBox={`0 0 500 ${frame.height}`} role="img" aria-label={text.diagram}>
        <defs><clipPath id={`plot-${id}`}><rect x="12" y="12" width="476" height={Math.max(1, frame.height - 24)} /></clipPath></defs>
        <g clipPath={`url(#plot-${id})`}>
          {[-3, -2, -1, 0, 1, 2, 3].map(x => <g key={`x${x}`}>
            <path d={`M${X(x)} 12V${frame.height - 12}`} stroke="var(--color-border)" strokeWidth=".6" />
            <text x={X(x)} y={Y(0) + 16} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">{x}</text>
          </g>)}
          {[-1, 0, 1, 2, 3, 4, 5, 6, 7].map(y => <g key={`y${y}`}>
            <path d={`M12 ${Y(y)}H488`} stroke="var(--color-border)" strokeWidth=".6" />
            {y !== 0 && <text x={X(0) - 9} y={Y(y) + 3} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">{y}</text>}
          </g>)}
          <path d={`M12 ${Y(0)}H488M${X(0)} 12V${frame.height - 12}`} stroke="var(--color-text-muted)" />
          <path d={curve} fill="none" stroke="var(--color-text)" strokeWidth="2.5" />
          {slope !== null && <path data-testid="secant-line" d={line(x => evaluate(p.x0) + slope * (x - p.x0))} fill="none" stroke="var(--color-accent)" strokeWidth="2" />}
          <path data-testid="tangent-line" d={line(x => tangentValue(x, p.x0))} fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeDasharray="7 5" />
          {slope !== null && <path d={`M${X(p.x0)},${Y(evaluate(p.x0))}H${X(q)}V${Y(evaluate(q))}`} fill="none" stroke="var(--color-text-muted)" strokeDasharray="2 4" />}
          <rect data-testid="point-q" x={X(q) - 5} y={Y(evaluate(q)) - 5} width="10" height="10" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2" />
          <circle data-testid="point-p" cx={X(p.x0)} cy={Y(evaluate(p.x0))} r="3.5" fill="var(--color-secondary)" />
          <text x={X(p.x0) - 16} y={Y(evaluate(p.x0)) - 12} fontSize="12" fill="var(--color-text)">P</text>
          <text x={X(q) + 10} y={Y(evaluate(q)) + 20} fontSize="12" fill="var(--color-text)">Q</text>
        </g>
        <text x="480" y={Y(0) - 9} fontSize="12" fill="var(--color-text-muted)">x</text>
        <text x={X(0) + 10} y="23" fontSize="12" fill="var(--color-text-muted)">y</text>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
