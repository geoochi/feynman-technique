import { useId } from "react";
import { useI18n } from "../../../packages/i18n/I18n";
import type { ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import {
  branchCurrents,
  branchVoltages,
  parallelEquivalent,
  seriesCurrent,
  seriesEquivalent,
} from "./model";

const WIDTH = 640;
const MARGIN = 14;
const GAP = 14;
const PANEL_W = (WIDTH - 2 * MARGIN - GAP) / 2;
const SERIES_X = MARGIN;
const PARALLEL_X = MARGIN + PANEL_W + GAP;

// Fixed chart scales. They depend only on the frame geometry, never on the
// current parameter values, so a parameter change moves the bars but never
// rescales or re-frames the picture.
const VOLTAGE_MAX = 24; // V, the largest allowed source voltage
const VOLTAGE_STEP = 4;
const CURRENT_MAX = 5; // A, above the largest possible total current 24 V / (10 Ω ∥ 10 Ω)
const CURRENT_STEP = 1;

// Current arrows grow with the current but stay inside the fixed frame.
function arrowLength(current: number) {
  return Math.max(12, Math.min(26, 12 + 14 * (current / 2.4)));
}

function ticks(step: number, max: number) {
  const out: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(4)));
  return out;
}

function HorizontalArrow({
  x,
  y,
  length,
  direction,
  color,
}: {
  x: number;
  y: number;
  length: number;
  direction: 1 | -1;
  color: string;
}) {
  const tipX = x + direction * length;
  return (
    <g>
      <path d={`M${x},${y}H${tipX}`} stroke={color} strokeWidth="1.4" fill="none" />
      <path
        d={`M${tipX},${y}L${tipX - direction * 7},${y - 4}L${tipX - direction * 7},${y + 4}Z`}
        fill={color}
      />
    </g>
  );
}

function VerticalArrow({
  x,
  y,
  length,
  direction,
  color,
}: {
  x: number;
  y: number;
  length: number;
  direction: 1 | -1;
  color: string;
}) {
  const tipY = y + direction * length;
  return (
    <g>
      <path d={`M${x},${y}V${tipY}`} stroke={color} strokeWidth="1.4" fill="none" />
      <path
        d={`M${x},${tipY}L${x - 4},${tipY - direction * 7}L${x + 4},${tipY - direction * 7}Z`}
        fill={color}
      />
    </g>
  );
}

function Battery({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <g stroke="var(--color-text-muted)" fill="none">
        <path d={`M${x - 10},${y - 5}H${x + 10}`} strokeWidth="1.6" />
        <path d={`M${x - 5},${y + 5}H${x + 5}`} strokeWidth="2.6" />
      </g>
      <text x={x + 14} y={y + 4} fill="var(--color-text-muted)" fontSize="10" textAnchor="start">
        V
      </text>
      <text x={x + 14} y={y - 5} fill="var(--color-text-muted)" fontSize="10" textAnchor="start">
        +
      </text>
    </g>
  );
}

function Node({
  x,
  y,
  label,
  dx,
  dy,
  anchor,
}: {
  x: number;
  y: number;
  label: string;
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
}) {
  return (
    <g>
      <circle cx={x} cy={y} r="2.5" fill="var(--color-text-muted)" />
      <text
        x={x + dx}
        y={y + dy}
        fill="var(--color-text-muted)"
        fontSize="10"
        textAnchor={anchor}
      >
        {label}
      </text>
    </g>
  );
}

function SeriesCircuit({
  x0,
  top,
  height,
  current,
}: {
  x0: number;
  top: number;
  height: number;
  current: number;
}) {
  const cx0 = x0 + 12;
  const cx1 = x0 + PANEL_W - 12;
  const leftX = cx0 + 26;
  const rightX = cx1 - 14;
  const midX = (leftX + rightX) / 2;
  const topY = top + 30;
  const botY = top + height - 18;
  const midY = (topY + botY) / 2;
  const r1x = (leftX + midX) / 2;
  const r2x = (midX + rightX) / 2;
  const arrowCenter = (r2x + rightX) / 2;
  const arrowLen = arrowLength(current);
  const wire = "var(--color-text-muted)";
  return (
    <g>
      <g stroke={wire} strokeWidth="1.4" fill="none">
        <path d={`M${leftX},${topY}H${rightX}`} />
        <path d={`M${rightX},${topY}V${botY}`} />
        <path d={`M${rightX},${botY}H${leftX}`} />
        <path d={`M${leftX},${topY}V${midY - 5}`} />
        <path d={`M${leftX},${midY + 5}V${botY}`} />
      </g>
      <Battery x={leftX} y={midY} />
      <rect
        x={r1x - 15}
        y={topY - 7}
        width="30"
        height="14"
        fill="var(--color-background)"
        stroke={wire}
        strokeWidth="1.4"
      />
      <rect
        x={r2x - 15}
        y={topY - 7}
        width="30"
        height="14"
        fill="var(--color-background)"
        stroke={wire}
        strokeWidth="1.4"
      />
      <g fill="var(--color-text)" fontSize="10" textAnchor="middle">
        <text x={r1x} y={topY - 12}>
          R₁
        </text>
        <text x={r2x} y={topY - 12}>
          R₂
        </text>
      </g>
      <g fill="var(--color-accent)" fontSize="9" textAnchor="middle">
        <text x={r1x} y={topY + 20}>
          V₁
        </text>
        <text x={r2x} y={topY + 20}>
          V₂
        </text>
      </g>
      <HorizontalArrow
        x={arrowCenter - arrowLen / 2}
        y={topY}
        length={arrowLen}
        direction={1}
        color="var(--color-accent)"
      />
      <text
        x={arrowCenter}
        y={topY - 12}
        fill="var(--color-accent)"
        fontSize="9"
        textAnchor="middle"
      >
        I
      </text>
      <Node x={leftX} y={topY} label="A" dx={-8} dy={-6} anchor="end" />
      <Node x={midX} y={topY} label="B" dx={0} dy={-26} anchor="middle" />
      <Node x={rightX} y={topY} label="C" dx={8} dy={-6} anchor="start" />
      <Node x={leftX} y={botY} label="D" dx={-8} dy={14} anchor="end" />
    </g>
  );
}

function ParallelCircuit({
  x0,
  top,
  height,
  i1,
  i2,
  total,
}: {
  x0: number;
  top: number;
  height: number;
  i1: number;
  i2: number;
  total: number;
}) {
  const cx0 = x0 + 12;
  const cx1 = x0 + PANEL_W - 12;
  const leftX = cx0 + 26;
  const rightX = cx1 - 14;
  const railTop = top + 28;
  const railBot = top + height - 20;
  const midY = (railTop + railBot) / 2;
  const rcx = (leftX + rightX) / 2;
  const branchArrowX = (rcx + rightX) / 2;
  const wire = "var(--color-text-muted)";
  return (
    <g>
      <g stroke={wire} strokeWidth="1.4" fill="none">
        <path d={`M${leftX},${railTop}V${midY - 5}`} />
        <path d={`M${leftX},${midY + 5}V${railBot}`} />
        <path d={`M${leftX},${railTop}H${rightX}`} />
        <path d={`M${leftX},${railBot}H${rightX}`} />
        <path d={`M${rightX},${railTop}V${railBot}`} />
      </g>
      <Battery x={leftX} y={midY} />
      <rect
        x={rcx - 15}
        y={railTop - 7}
        width="30"
        height="14"
        fill="var(--color-background)"
        stroke={wire}
        strokeWidth="1.4"
      />
      <rect
        x={rcx - 15}
        y={railBot - 7}
        width="30"
        height="14"
        fill="var(--color-background)"
        stroke={wire}
        strokeWidth="1.4"
      />
      <g fill="var(--color-text)" fontSize="10" textAnchor="middle">
        <text x={rcx} y={railTop - 12}>
          R₁
        </text>
        <text x={rcx} y={railBot + 16}>
          R₂
        </text>
      </g>
      <HorizontalArrow
        x={branchArrowX - arrowLength(i1) / 2}
        y={railTop}
        length={arrowLength(i1)}
        direction={1}
        color="var(--color-accent)"
      />
      <text
        x={branchArrowX}
        y={railTop - 12}
        fill="var(--color-accent)"
        fontSize="9"
        textAnchor="middle"
      >
        I₁
      </text>
      <HorizontalArrow
        x={branchArrowX + arrowLength(i2) / 2}
        y={railBot}
        length={arrowLength(i2)}
        direction={-1}
        color="var(--color-accent)"
      />
      <text
        x={branchArrowX}
        y={railBot + 16}
        fill="var(--color-accent)"
        fontSize="9"
        textAnchor="middle"
      >
        I₂
      </text>
      <VerticalArrow
        x={leftX}
        y={midY - 8}
        length={arrowLength(total)}
        direction={-1}
        color="var(--color-accent)"
      />
      <text
        x={leftX - 8}
        y={midY - 14}
        fill="var(--color-accent)"
        fontSize="9"
        textAnchor="end"
      >
        I
      </text>
      <Node x={leftX} y={railTop} label="A" dx={-8} dy={-6} anchor="end" />
      <Node x={leftX} y={railBot} label="B" dx={-8} dy={14} anchor="end" />
      <Node x={rightX} y={railTop} label="C" dx={8} dy={-6} anchor="start" />
      <Node x={rightX} y={railBot} label="D" dx={8} dy={14} anchor="start" />
    </g>
  );
}

function Chart({
  x0,
  top,
  bottom,
  max,
  step,
  unitLabel,
  bars,
  tickPrefix,
  offFrame,
}: {
  x0: number;
  top: number;
  bottom: number;
  max: number;
  step: number;
  unitLabel: string;
  bars: { key: string; label: string; value: number }[];
  tickPrefix: string;
  offFrame: string;
}) {
  const plotLeft = x0 + 32;
  const plotRight = x0 + PANEL_W - 10;
  const catW = (plotRight - plotLeft) / bars.length;
  const barW = Math.min(26, catW * 0.44);
  const yFor = (value: number) =>
    bottom - (Math.max(0, Math.min(value, max)) / max) * (bottom - top);
  const gridTicks = ticks(step, max);
  const clipped = bars.some((bar) => bar.value > max + 1e-9);
  return (
    <g>
      <g stroke="var(--color-border)" strokeWidth="0.6">
        {gridTicks.map((v) => (
          <path key={`h-${v}`} d={`M${plotLeft},${yFor(v)}H${plotRight}`} />
        ))}
        {bars.map((bar, i) => (
          <path
            key={`v-${bar.key}`}
            d={`M${plotLeft + i * catW},${top}V${bottom}`}
          />
        ))}
        <path d={`M${plotRight},${top}V${bottom}`} />
      </g>
      <g stroke="var(--color-text-muted)" strokeWidth="1">
        <path d={`M${plotLeft},${top}V${bottom}`} />
        <path d={`M${plotLeft},${bottom}H${plotRight}`} />
        {gridTicks.map((v) => (
          <path key={`t-${v}`} d={`M${plotLeft - 4},${yFor(v)}H${plotLeft}`} />
        ))}
      </g>
      <g fill="var(--color-text-muted)" fontSize="9" textAnchor="end">
        {gridTicks.map((v) => (
          <text
            key={`l-${v}`}
            data-tick={`${tickPrefix}-${v}`}
            x={plotLeft - 6}
            y={yFor(v) + 3}
          >
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        ))}
      </g>
      <text
        x={plotLeft - 6}
        y={top - 8}
        fill="var(--color-text-muted)"
        fontSize="9"
        textAnchor="end"
      >
        {unitLabel}
      </text>
      {bars.map((bar, i) => {
        const cx = plotLeft + (i + 0.5) * catW;
        const y = yFor(bar.value);
        return (
          <g key={bar.key}>
            <rect
              data-bar={bar.key}
              x={cx - barW / 2}
              y={y}
              width={barW}
              height={Math.max(0, bottom - y)}
              fill="var(--color-accent)"
              opacity="0.85"
            />
            <text
              x={cx}
              y={y - 4}
              fill="var(--color-accent)"
              fontSize="9"
              textAnchor="middle"
            >
              {bar.value.toFixed(2)}
            </text>
            <text
              x={cx}
              y={bottom + 13}
              fill="var(--color-text-muted)"
              fontSize="9"
              textAnchor="middle"
            >
              {bar.label}
            </text>
          </g>
        );
      })}
      {clipped && (
        <text
          x={plotRight}
          y={top - 8}
          fill="var(--color-accent)"
          fontSize="9"
          textAnchor="end"
        >
          {offFrame}
        </text>
      )}
    </g>
  );
}

export default function SeriesParallelView({ params: p }: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const id = useId().replace(/:/g, "");
  const frame = useDiagramFrame(WIDTH, 400);
  const height = frame.height;

  const { voltage: v, resistance1: r1, resistance2: r2 } = p;
  const reqSeries = seriesEquivalent(r1, r2);
  const reqParallel = parallelEquivalent(r1, r2);
  const iSeries = seriesCurrent(v, r1, r2);
  const { v1, v2 } = branchVoltages(v, r1, r2);
  const { i1, i2 } = branchCurrents(v, r1, r2);
  const iTotal = i1 + i2;

  const circuitTop = 34;
  const circuitH = Math.max(108, Math.min(170, height * 0.32));
  const chartTop = circuitTop + circuitH + 28;
  const chartBottom = Math.max(chartTop + 44, height - 34);

  const seriesBars = [
    { key: "series-v1", label: "V₁", value: v1 },
    { key: "series-v2", label: "V₂", value: v2 },
    { key: "series-v", label: "V", value: v },
  ];
  const parallelBars = [
    { key: "parallel-i1", label: "I₁", value: i1 },
    { key: "parallel-i2", label: "I₂", value: i2 },
    { key: "parallel-i", label: "I", value: iTotal },
  ];

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
          <text
            x={SERIES_X + PANEL_W / 2}
            y="20"
            fill="var(--color-text-muted)"
            fontSize="12"
            textAnchor="middle"
          >
            {text.series}
          </text>
          <text
            x={PARALLEL_X + PANEL_W / 2}
            y="20"
            fill="var(--color-text-muted)"
            fontSize="12"
            textAnchor="middle"
          >
            {text.parallel}
          </text>

          <SeriesCircuit
            x0={SERIES_X}
            top={circuitTop}
            height={circuitH}
            current={iSeries}
          />
          <ParallelCircuit
            x0={PARALLEL_X}
            top={circuitTop}
            height={circuitH}
            i1={i1}
            i2={i2}
            total={iTotal}
          />

          <Chart
            x0={SERIES_X}
            top={chartTop}
            bottom={chartBottom}
            max={VOLTAGE_MAX}
            step={VOLTAGE_STEP}
            unitLabel={text.axisVoltage}
            bars={seriesBars}
            tickPrefix="series-v"
            offFrame={text.offFrame}
          />
          <Chart
            x0={PARALLEL_X}
            top={chartTop}
            bottom={chartBottom}
            max={CURRENT_MAX}
            step={CURRENT_STEP}
            unitLabel={text.axisCurrent}
            bars={parallelBars}
            tickPrefix="parallel-i"
            offFrame={text.offFrame}
          />
        </g>
      </svg>
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
