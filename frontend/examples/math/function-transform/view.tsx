import { useEffect, useId, useRef } from "react";
import type { ViewProps } from "../../../packages/core/types";
import { Formula } from "../../../packages/ui/Formula";
import s from "../../../packages/ui/Scene.module.css";
import { evaluate } from "./model";
export { model } from "./model";
export default function FunctionView({
  simulation,
  params: p,
  state,
  camera,
}: ViewProps) {
  const id = useId().replace(/:/g, ""),
    dot = useRef<SVGCircleElement>(null);
  const scale = (36 * 5) / camera,
    X = (x: number) => 250 + x * scale,
    Y = (y: number) => 160 - y * scale;
  const path = (a: number, h: number, k: number) =>
    Array.from({ length: 241 }, (_, i) => {
      const x = -7 + (i * 14) / 240;
      return `${i ? "L" : "M"}${X(x)},${Y(a * (x - h) ** 2 + k)}`;
    }).join(" ");
  useEffect(
    () =>
      simulation.onRender(() => {
        const x = (simulation.state.phase % 8) - 4,
          y = evaluate(x, simulation.params);
        dot.current?.setAttribute("cx", String(X(x)));
        dot.current?.setAttribute("cy", String(Y(y)));
      }),
    [simulation, camera],
  );
  const ticks = Array.from({ length: 13 }, (_, i) => i - 6);
  return (
    <div className={s.scene}>
      <svg
        viewBox="0 0 500 320"
        role="img"
        aria-label="原始抛物线与当前函数的对照坐标图"
      >
        <defs>
          <clipPath id={`clip-${id}`}>
            <rect width="500" height="320" />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${id})`}>
          {ticks.map((v) => (
            <g key={v}>
              <path
                d={`M${X(v)} 0V320M0 ${Y(v)}H500`}
                stroke="var(--color-border)"
                strokeWidth=".6"
              />
              {v !== 0 && (
                <>
                  <text
                    x={X(v)}
                    y={Y(0) + 15}
                    fill="var(--color-text-muted)"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {v}
                  </text>
                  <text
                    x={X(0) - 8}
                    y={Y(v) + 3}
                    fill="var(--color-text-muted)"
                    fontSize="8"
                    textAnchor="end"
                  >
                    {v}
                  </text>
                </>
              )}
            </g>
          ))}
          <path
            d={`M0 ${Y(0)}H500M${X(0)} 0V320`}
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
          <circle
            ref={dot}
            r="4"
            fill="var(--color-text)"
            cx={X((state.phase % 8) - 4)}
            cy={Y(evaluate((state.phase % 8) - 4, p))}
          />
        </g>
        <text x="481" y={Y(0) - 7} fill="var(--color-text-muted)" fontSize="10">
          x
        </text>
        <text x={X(0) + 8} y="13" fill="var(--color-text-muted)" fontSize="10">
          y
        </text>
      </svg>
      <div className={s.caption}>
        <span>— 当前函数</span>
        <span>┄ 原始 y = x²</span>
        <span>● 扫描采样点</span>
      </div>
      <div className={s.formula}>
        <Formula
          math={`y = ${p.a.toFixed(1)}(x ${p.h >= 0 ? "-" : "+"} ${Math.abs(p.h).toFixed(1)})^2 ${p.k >= 0 ? "+" : "-"} ${Math.abs(p.k).toFixed(1)}`}
        />
      </div>
      <div className={s.readings}>
        <div>
          <span>{p.a === 0 ? "常函数" : "顶点坐标"}</span>
          <strong>
            {p.a === 0
              ? `y = ${p.k.toFixed(1)}`
              : `(${p.h.toFixed(1)}, ${p.k.toFixed(1)})`}
          </strong>
        </div>
        <div>
          <span>开口方向</span>
          <strong>{p.a > 0 ? "向上 ↑" : p.a < 0 ? "向下 ↓" : "水平 →"}</strong>
        </div>
      </div>
      <p className={s.note}>只改变一个参数，观察公式与图像如何一起变化。</p>
    </div>
  );
}
