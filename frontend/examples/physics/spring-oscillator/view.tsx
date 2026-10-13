import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import { useEffect, useId, useRef } from "react";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";

// Horizontal zig-zag between the wall (x1) and the block edge (x2).
function springPath(x1: number, x2: number, y: number, coils = 9, amp = 11) {
  const span = Math.max(24, x2 - x1);
  const lead = Math.min(12, span * 0.15);
  const seg = (span - 2 * lead) / (coils * 2);
  let d = `M${x1} ${y} L${x1 + lead} ${y}`;
  for (let i = 0; i < coils * 2; i++)
    d += ` L${(x1 + lead + seg * (i + 1)).toFixed(1)} ${(y + (i % 2 === 0 ? -amp : amp)).toFixed(1)}`;
  return `${d} L${x2} ${y}`;
}

export default function SpringOscillatorView({
  simulation,
  params: p,
  state,
  camera,
}: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const block = useRef<SVGGElement>(null);
  const spring = useRef<SVGPathElement>(null);
  const arrow = useRef<SVGLineElement>(null);
  const frame = useDiagramFrame(600, 400);
  const h = frame.height;
  const midY = h * 0.5;
  const wallRight = 66;
  const centre = 330;
  const half = 24;
  // Keep a fixed scale for the full 0–0.5 m amplitude range at each viewport and zoom.
  const pxPerMetre = (300 * 5) / camera;
  useEffect(
    () =>
      simulation.onRender(() => {
        const cx = centre + (simulation.state.x ?? 0) * pxPerMetre;
        block.current?.setAttribute("transform", `translate(${cx - centre} 0)`);
        spring.current?.setAttribute("d", springPath(wallRight, cx - half, midY));
        arrow.current?.setAttribute("x2", String(cx));
      }),
    [simulation, midY, pxPerMetre],
  );
  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 600 ${h}`}
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
          <linearGradient id={`block-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#7cc4e0" />
            <stop offset="1" stopColor="#0077a8" />
          </linearGradient>
          <marker
            id={`arrow-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 10 5 0 10z" fill="var(--color-secondary)" />
          </marker>
        </defs>
        <rect width="600" height={h} fill={`url(#grid-${id})`} />
        <path
          d={`M40 ${midY + half + 10}h520`}
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        <path
          d={`M${centre} ${h * 0.2}v${h * 0.6}`}
          stroke="var(--color-secondary)"
          strokeDasharray="5 6"
          strokeWidth="1"
        />
        <rect
          x={wallRight - 10}
          y={h * 0.22}
          width="10"
          height={h * 0.56}
          fill="var(--color-text-muted)"
        />
        <g stroke="var(--color-text-muted)" strokeWidth="1">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path
              key={i}
              d={`M${wallRight - 10} ${h * 0.22 + 10 + i * 24}l-12 -12`}
            />
          ))}
        </g>
        <path
          ref={spring}
          d={springPath(wallRight, centre - half, midY)}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
        />
        <g
          ref={block}
          transform={`translate(${(state.x ?? 0) * pxPerMetre} 0)`}
        >
          <rect
            x={centre - half}
            y={midY - 32}
            width={half * 2}
            height="64"
            rx="5"
            fill={`url(#block-${id})`}
            stroke="var(--color-accent)"
          />
          <text
            x={centre}
            y={midY + 5}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="15"
          >
            m
          </text>
        </g>
        <text
          x={(wallRight + centre - half) / 2}
          y={midY - 22}
          textAnchor="middle"
          fill="var(--color-accent)"
          fontSize="12"
        >
          k
        </text>
        <text
          x={centre}
          y={h * 0.2 - 8}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize="10"
        >
          x = 0
        </text>
        <line
          ref={arrow}
          x1={centre}
          y1={midY + half + 34}
          x2={centre}
          y2={midY + half + 34}
          stroke="var(--color-secondary)"
          strokeWidth="1.5"
          markerEnd={`url(#arrow-${id})`}
        />
        <line
          x1={centre}
          y1={midY + half + 26}
          x2={centre}
          y2={midY + half + 42}
          stroke="var(--color-secondary)"
          strokeWidth="1"
        />
        <text
          x="300"
          y={h - 12}
          textAnchor="middle"
          fill="var(--color-accent)"
          fontSize="12"
        >
          x = {(state.x ?? 0).toFixed(3)} m · v = {(state.v ?? 0).toFixed(3)} m/s
        </text>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
