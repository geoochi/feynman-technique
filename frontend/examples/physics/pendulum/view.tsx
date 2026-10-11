import { useEffect, useId, useRef } from "react";
import type { ViewProps } from "../../../packages/core/types";
import { Formula } from "../../../packages/ui/Formula";
import s from "../../../packages/ui/Scene.module.css";
import { smallAnglePeriod, energy } from "./model";
export { model } from "./model";
export default function PendulumView({
  simulation,
  params: p,
  state,
  camera,
}: ViewProps) {
  const id = useId().replace(/:/g, ""),
    group = useRef<SVGGElement>(null);
  const length = (p.length * 75 * 5) / camera;
  useEffect(
    () =>
      simulation.onRender(() => {
        group.current?.setAttribute(
          "transform",
          `rotate(${(-simulation.state.theta * 180) / Math.PI} 250 42)`,
        );
      }),
    [simulation],
  );
  return (
    <div className={s.scene}>
      <svg
        viewBox="0 0 500 320"
        role="img"
        aria-label="单摆的位置、摆线与初始振幅"
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
        <rect width="500" height="320" fill={`url(#grid-${id})`} />
        <path
          d="M195 42h110"
          stroke="var(--color-text-muted)"
          strokeWidth="3"
        />
        <path
          d={`M250 42v${length + 25}`}
          stroke="var(--color-text-muted)"
          strokeDasharray="4 5"
          strokeWidth=".7"
        />
        <path
          d={`M${250 - length * Math.sin(p.angle)} ${42 + length * Math.cos(p.angle)}A${length} ${length} 0 0 0 ${250 + length * Math.sin(p.angle)} ${42 + length * Math.cos(p.angle)}`}
          fill="none"
          stroke="var(--color-secondary)"
          strokeDasharray="3 6"
          strokeWidth="1"
        />
        <g
          ref={group}
          transform={`rotate(${(-state.theta * 180) / Math.PI} 250 42)`}
        >
          <line
            x1="250"
            y1="42"
            x2="250"
            y2={42 + length}
            stroke="var(--color-text)"
            strokeWidth="1.7"
          />
          <text
            x="264"
            y={42 + length / 2}
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            L = {p.length.toFixed(1)} m
          </text>
          <circle
            cx="250"
            cy={42 + length}
            r="12"
            fill={`url(#bob-${id})`}
            stroke="var(--color-accent)"
          />
        </g>
        <circle cx="250" cy="42" r="4" fill="var(--color-text)" />
        <text x="22" y="294" fill="var(--color-text-muted)" fontSize="9">
          无阻力 · 质点 · RK4 / 120 Hz
        </text>
        <text x="350" y="294" fill="var(--color-accent)" fontSize="9">
          θ = {((state.theta * 180) / Math.PI).toFixed(1)}°
        </text>
      </svg>
      <div className={s.caption}>
        <span>● 摆球位置</span>
        <span>┄ 初始摆动范围</span>
      </div>
      <div className={s.formula}>
        <Formula math="T_{\small\mathrm{小角度}} \approx 2\pi\sqrt{\frac{L}{g}}" />
      </div>
      <div className={s.readings}>
        <div>
          <span>小角度近似周期</span>
          <strong>
            {smallAnglePeriod(p).toFixed(3)}
            <small>s</small>
          </strong>
        </div>
        <div>
          <span>单位质量总能量</span>
          <strong>
            {energy(state, p).toFixed(3)}
            <small>J/kg</small>
          </strong>
        </div>
      </div>
      <p className={s.note}>
        实际运动由非线性方程计算。大角度下，周期比小角度近似更长。
      </p>
    </div>
  );
}
