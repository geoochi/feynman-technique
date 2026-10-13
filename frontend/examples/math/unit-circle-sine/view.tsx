import { useEffect, useId, useRef } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import { sineValue } from "./model";

const WIDTH = 600;
// Fixed frame. Every panel shows PANEL_RANGE units on each side of its centre,
// and the time axis always spans the same T_WINDOW seconds. Changing a parameter
// moves the drawing inside this frame; it never rescales the frame.
const PANEL_RANGE = 2;
const T_WINDOW = 12;
const CIRCLE_CX = 150;
const PLOT_X0 = 300;
const PLOT_X1 = 580;
const SAMPLES_PER_SECOND = 40;
const GRID_UNITS = [-2, -1, 1, 2];
const TIME_LABEL_STEP = 2;
const TIME_LABEL_SLOTS = 8;

export default function UnitCircleSineView({ simulation, params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 470);
  const h = frame.height;
  const cy = h / 2;
  const panelHalf = Math.max(60, Math.min(120, h / 2 - 44));
  const unit = panelHalf / PANEL_RANGE; // px per metre, fixed
  const xScale = (PLOT_X1 - PLOT_X0) / T_WINDOW; // px per second, fixed
  const toY = (y: number) => cy - y * unit;

  const radiusPx = p.radius * unit;
  const clipped = p.radius > PANEL_RANGE;
  const isUnitCircle = Math.abs(p.radius - 1) < 1e-9;

  // Everything that depends on the elapsed time is written straight to the DOM
  // each animation frame, so a React render never fights the running clock.
  const pointRef = useRef<SVGCircleElement>(null);
  const radiusRef = useRef<SVGLineElement>(null);
  const dropRef = useRef<SVGLineElement>(null);
  const projRef = useRef<SVGLineElement>(null);
  const guideRef = useRef<SVGPathElement>(null);
  const traceRef = useRef<SVGPathElement>(null);
  const gridRef = useRef<SVGPathElement>(null);
  const tickRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGCircleElement>(null);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);

  useEffect(
    () =>
      simulation.onRender(() => {
        const q = simulation.params;
        const now = Math.max(simulation.time, 0);
        // The window scrolls once the trace reaches its right edge, so the
        // frame never rescales and the projection always stays horizontal.
        const start = Math.max(0, now - T_WINDOW);
        const xOf = (t: number) => PLOT_X0 + (t - start) * xScale;

        const ang = simulation.state.theta ?? 0;
        const r = q.radius * unit;
        const px = CIRCLE_CX + r * Math.cos(ang);
        const py = cy - r * Math.sin(ang);
        const sx = xOf(now);
        const sy = toY(sineValue(now, q));
        pointRef.current?.setAttribute("cx", px.toFixed(2));
        pointRef.current?.setAttribute("cy", py.toFixed(2));
        radiusRef.current?.setAttribute("x2", px.toFixed(2));
        radiusRef.current?.setAttribute("y2", py.toFixed(2));
        dropRef.current?.setAttribute("x2", px.toFixed(2));
        dropRef.current?.setAttribute("y2", cy.toFixed(2));
        projRef.current?.setAttribute("x1", px.toFixed(2));
        projRef.current?.setAttribute("y1", py.toFixed(2));
        projRef.current?.setAttribute("x2", sx.toFixed(2));
        projRef.current?.setAttribute("y2", sy.toFixed(2));
        markerRef.current?.setAttribute("cx", sx.toFixed(2));
        markerRef.current?.setAttribute("cy", sy.toFixed(2));

        const sample = (from: number, to: number) => {
          const count = Math.max(1, Math.round((to - from) * SAMPLES_PER_SECOND));
          let d = "";
          for (let i = 0; i <= count; i++) {
            const t = from + ((to - from) * i) / count;
            d += `${i === 0 ? "M" : "L"}${xOf(t).toFixed(2)},${toY(sineValue(t, q)).toFixed(2)}`;
          }
          return d;
        };
        traceRef.current?.setAttribute("d", sample(start, now));
        guideRef.current?.setAttribute("d", sample(start, start + T_WINDOW));

        // Time grid, ticks and labels move with the window but keep a fixed scale.
        const top = cy - panelHalf;
        const bottom = cy + panelHalf;
        let grid = "";
        let ticks = "";
        for (
          let t = Math.ceil(start - 1e-9);
          t <= Math.floor(start + T_WINDOW + 1e-9);
          t++
        ) {
          const x = xOf(t).toFixed(2);
          grid += `M${x},${top}V${bottom}`;
          ticks += `M${x},${bottom}V${bottom + 5}`;
        }
        gridRef.current?.setAttribute("d", grid);
        tickRef.current?.setAttribute("d", ticks);

        const firstLabel = Math.ceil(start / TIME_LABEL_STEP - 1e-9) * TIME_LABEL_STEP;
        for (let i = 0; i < TIME_LABEL_SLOTS; i++) {
          const el = labelRefs.current[i];
          if (!el) continue;
          const t = firstLabel + i * TIME_LABEL_STEP;
          if (t > start + T_WINDOW + 1e-9) {
            el.setAttribute("opacity", "0");
            continue;
          }
          el.setAttribute("opacity", "1");
          el.setAttribute("x", xOf(t).toFixed(2));
          el.textContent = String(t);
        }
      }),
    [simulation, unit, cy, xScale, panelHalf],
  );

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${WIDTH} ${h}`}
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
          <clipPath id={`circle-clip-${id}`}>
            <rect
              x={CIRCLE_CX - panelHalf}
              y={cy - panelHalf}
              width={2 * panelHalf}
              height={2 * panelHalf}
            />
          </clipPath>
          <clipPath id={`plot-clip-${id}`}>
            <rect
              x={PLOT_X0}
              y={cy - panelHalf}
              width={PLOT_X1 - PLOT_X0}
              height={2 * panelHalf}
            />
          </clipPath>
        </defs>
        <rect width={WIDTH} height={h} fill={`url(#grid-${id})`} />

        {/* ---- Circle panel: fixed ±PANEL_RANGE unit frame ---- */}
        <g stroke="var(--color-border)" strokeWidth=".6">
          {GRID_UNITS.map((v) => (
            <g key={`cg-${v}`}>
              <path
                d={`M${CIRCLE_CX + v * unit},${cy - panelHalf}V${cy + panelHalf}`}
              />
              <path
                d={`M${CIRCLE_CX - panelHalf},${cy - v * unit}H${CIRCLE_CX + panelHalf}`}
              />
            </g>
          ))}
        </g>
        <g stroke="var(--color-text-muted)" strokeWidth="1">
          <path d={`M${CIRCLE_CX - panelHalf},${cy}H${CIRCLE_CX + panelHalf}`} />
          <path d={`M${CIRCLE_CX},${cy - panelHalf}V${cy + panelHalf}`} />
          {GRID_UNITS.map((v) => (
            <g key={`ct-${v}`}>
              <path d={`M${CIRCLE_CX + v * unit},${cy - 3}V${cy + 3}`} />
              <path d={`M${CIRCLE_CX - 3},${cy - v * unit}H${CIRCLE_CX + 3}`} />
            </g>
          ))}
        </g>
        <g fill="var(--color-text-muted)" fontSize="9">
          {GRID_UNITS.map((v) => (
            <g key={`cl-${v}`}>
              <text x={CIRCLE_CX + v * unit} y={cy + 14} textAnchor="middle">
                {v}
              </text>
              <text x={CIRCLE_CX - 6} y={cy - v * unit + 3} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <text x={CIRCLE_CX + panelHalf - 2} y={cy - 6} textAnchor="end">
            {text.axisX}
          </text>
          <text x={CIRCLE_CX + 8} y={cy - panelHalf + 12} textAnchor="start">
            {text.axisY}
          </text>
        </g>

        <g clipPath={`url(#circle-clip-${id})`}>
          <circle
            data-testid="orbit"
            cx={CIRCLE_CX}
            cy={cy}
            r={radiusPx}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="1.6"
            strokeDasharray="6 5"
          />
          <line
            ref={radiusRef}
            x1={CIRCLE_CX}
            y1={cy}
            x2={0}
            y2={0}
            stroke="var(--color-text-muted)"
            strokeWidth="1.2"
          />
          <line
            ref={dropRef}
            x1={0}
            y1={0}
            x2={0}
            y2={0}
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle
            ref={pointRef}
            data-testid="rotating-point"
            cx={0}
            cy={0}
            r="5"
            fill="var(--color-accent)"
          />
        </g>
        <text
          x={CIRCLE_CX}
          y={cy - panelHalf - 6}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize="10"
        >
          {text.circleTitle}
        </text>
        <text
          x={CIRCLE_CX}
          y={cy + panelHalf + 18}
          textAnchor="middle"
          fill="var(--color-accent)"
          fontSize="11"
        >
          {isUnitCircle ? text.unitCircle : text.generalCircle} · R ={" "}
          {p.radius.toFixed(2)} m
        </text>

        {/* Projection linking the rotating point to the sine trace. */}
        <line
          ref={projRef}
          x1={0}
          y1={0}
          x2={0}
          y2={0}
          stroke="var(--color-accent)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity=".8"
        />

        {/* ---- Sine panel: fixed T_WINDOW second frame ---- */}
        <g clipPath={`url(#plot-clip-${id})`}>
          <path
            ref={gridRef}
            d=""
            fill="none"
            stroke="var(--color-border)"
            strokeWidth=".6"
          />
          <g stroke="var(--color-border)" strokeWidth=".6">
            {[1, 2].map((v) => (
              <g key={`yg-${v}`}>
                <path d={`M${PLOT_X0},${toY(v)}H${PLOT_X1}`} />
                <path d={`M${PLOT_X0},${toY(-v)}H${PLOT_X1}`} />
              </g>
            ))}
          </g>
          <path
            d={`M${PLOT_X0},${cy}H${PLOT_X1}`}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
          />
          <path
            ref={guideRef}
            d=""
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
          <path
            ref={traceRef}
            data-testid="trace"
            d=""
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
          <circle
            ref={markerRef}
            cx={0}
            cy={0}
            r="4"
            fill="var(--color-accent)"
          />
        </g>
        <g stroke="var(--color-text-muted)" strokeWidth="1">
          <path d={`M${PLOT_X0},${cy - panelHalf}V${cy + panelHalf}`} />
          {[1, 2].map((v) => (
            <g key={`yt-${v}`}>
              <path d={`M${PLOT_X0 - 3},${toY(v)}H${PLOT_X0 + 3}`} />
              <path d={`M${PLOT_X0 - 3},${toY(-v)}H${PLOT_X0 + 3}`} />
            </g>
          ))}
          <path d={`M${PLOT_X0},${cy + panelHalf}H${PLOT_X1}`} />
          <path ref={tickRef} d="" />
        </g>
        <g fill="var(--color-text-muted)" fontSize="9">
          {[1, 2].map((v) => (
            <g key={`yl-${v}`}>
              <text
                data-testid={v === 2 ? "tick-y-2" : undefined}
                x={PLOT_X0 - 6}
                y={toY(v) + 3}
                textAnchor="end"
              >
                {v}
              </text>
              <text x={PLOT_X0 - 6} y={toY(-v) + 3} textAnchor="end">
                {-v}
              </text>
            </g>
          ))}
          {Array.from({ length: TIME_LABEL_SLOTS }, (_, i) => (
            <text
              key={`tl-${i}`}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              x={0}
              y={cy + panelHalf + 16}
              textAnchor="middle"
              opacity="0"
            />
          ))}
          <text x={PLOT_X1} y={cy + panelHalf + 30} textAnchor="end">
            {text.axisTime}
          </text>
          <text x={PLOT_X0 - 6} y={cy - panelHalf - 6} textAnchor="end">
            {text.axisY}
          </text>
          <text
            x={(PLOT_X0 + PLOT_X1) / 2}
            y={cy - panelHalf - 6}
            textAnchor="middle"
          >
            {text.curveTitle}
          </text>
        </g>

        {clipped && (
          <text
            x={WIDTH / 2}
            y={h - 6}
            textAnchor="middle"
            fill="var(--color-accent)"
            fontSize="11"
          >
            {text.clipped}
          </text>
        )}
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
