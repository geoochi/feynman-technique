import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import { useEffect, useId, useRef } from "react";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { resultantAmplitude, totalAt, wave1At, wave2At } from "./model";

export default function WaveSuperpositionView({
  simulation,
  params: p,
  state,
}: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(600, 420);
  const wave1Path = useRef<SVGPathElement>(null);
  const wave2Path = useRef<SVGPathElement>(null);
  const sumPath = useRef<SVGPathElement>(null);

  // Shared geometry: one x-axis, three stacked lanes for y₁, y₂ and their sum.
  const W = 600;
  const padL = 48;
  const padR = 20;
  const padT = 28;
  const padB = 40;
  const gap = 12;
  const plotW = W - padL - padR;
  const laneH = (frame.height - padT - padB - 2 * gap) / 3;
  const y1c = padT + laneH / 2;
  const y2c = padT + laneH + gap + laneH / 2;
  const ysc = padT + 2 * (laneH + gap) + laneH / 2;
  const axisY = frame.height - padB + 8;
  const X_MAX = 8;
  const DISP_MAX = 2.2;
  const toPx = (x: number) => padL + (x / X_MAX) * plotW;
  const toPy = (value: number, centre: number) =>
    centre - (value / DISP_MAX) * (laneH / 2);
  const curve = (f: (x: number) => number, centre: number) => {
    const parts: string[] = [];
    for (let i = 0; i <= 180; i++) {
      const x = (i / 180) * X_MAX;
      parts.push(
        `${i === 0 ? "M" : "L"}${toPx(x).toFixed(2)} ${toPy(f(x), centre).toFixed(2)}`,
      );
    }
    return parts.join(" ");
  };

  const phase = state.phase ?? 0;
  const ares = resultantAmplitude(p);
  const lanes = [
    {
      key: "wave1",
      centre: y1c,
      ref: wave1Path,
      stroke: "var(--color-accent)",
      label: "y₁",
      f: (x: number) => wave1At(p, x, phase),
    },
    {
      key: "wave2",
      centre: y2c,
      ref: wave2Path,
      stroke: "var(--color-secondary)",
      label: "y₂",
      f: (x: number) => wave2At(p, x, phase),
    },
    {
      key: "sum",
      centre: ysc,
      ref: sumPath,
      stroke: "var(--color-text)",
      label: "y",
      f: (x: number) => totalAt(p, x, phase),
    },
  ];

  // Redraw every animation frame from the model's phase, without a React render.
  useEffect(
    () =>
      simulation.onRender(() => {
        const q = simulation.params;
        const ph = simulation.state.phase;
        wave1Path.current?.setAttribute(
          "d",
          curve((x) => wave1At(q, x, ph), y1c),
        );
        wave2Path.current?.setAttribute(
          "d",
          curve((x) => wave2At(q, x, ph), y2c),
        );
        sumPath.current?.setAttribute(
          "d",
          curve((x) => totalAt(q, x, ph), ysc),
        );
      }),
    [simulation, frame.height],
  );

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${W} ${frame.height}`}
        role="img"
        aria-label={text.diagram}
      >
        <defs>
          <pattern
            id={`grid-${id}`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 0H0V24"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth=".5"
            />
          </pattern>
        </defs>
        <rect width={W} height={frame.height} fill={`url(#grid-${id})`} />
        <g fill="var(--color-text-muted)">
          <path d={`M${padL} 14h70`} stroke="var(--color-text-muted)" />
          <path d={`M${padL + 70} 10l9 4-9 4z`} fill="var(--color-text-muted)" />
          <text x={padL + 86} y="18" fontSize="10">
            +x
          </text>
          <text x={W - padR} y="18" fontSize="10" textAnchor="end">
            c = 2 m/s
          </text>
        </g>
        {lanes.map((lane) => (
          <g key={lane.key}>
            <path
              d={`M${padL} ${lane.centre}H${padL + plotW}`}
              stroke="var(--color-border)"
              strokeDasharray="2 4"
            />
            <text
              x={padL - 8}
              y={lane.centre + 4}
              textAnchor="end"
              fontSize="11"
              fill={lane.stroke}
            >
              {lane.label}
            </text>
            <path
              ref={lane.ref}
              d={curve(lane.f, lane.centre)}
              fill="none"
              stroke={lane.stroke}
              strokeWidth={lane.key === "sum" ? 2 : 1.2}
            />
          </g>
        ))}
        {ares > 1e-3 && (
          <g stroke="var(--color-accent)" strokeDasharray="4 4" strokeWidth=".8" opacity=".7">
            <path d={`M${padL} ${toPy(ares, ysc)}H${padL + plotW}`} />
            <path d={`M${padL} ${toPy(-ares, ysc)}H${padL + plotW}`} />
          </g>
        )}
        <text
          x={padL + plotW}
          y={toPy(ares, ysc) - 4}
          textAnchor="end"
          fontSize="9"
          fill="var(--color-accent)"
        >
          A = {ares.toFixed(2)} m
        </text>
        <g fill="var(--color-text-muted)" fontSize="10">
          <path
            d={`M${padL} ${axisY}H${padL + plotW}`}
            stroke="var(--color-text-muted)"
          />
          {[0, 2, 4, 6, 8].map((x) => (
            <g key={x}>
              <path d={`M${toPx(x)} ${axisY}v5`} stroke="var(--color-text-muted)" />
              <text x={toPx(x)} y={axisY + 16} textAnchor="middle">
                {x}
              </text>
            </g>
          ))}
          <text x={padL + plotW} y={axisY + 30} textAnchor="end">
            x / m
          </text>
        </g>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
