import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Netlist, NetlistElement, ViewProps } from "../../../packages/core/types";
import { useDiagramFrame } from "../../../packages/ui/useDiagramFrame";
import s from "../../../packages/ui/Scene.module.css";
import { solveCircuit, wireRoots } from "./model";

const WIDTH = 600;
const COLS = 3;
const MAX_NODES = 6;
const MAX_ELEMENTS = 10;
const DEFAULT_RESISTANCE = 100;
const DEFAULT_EMF = 12;
/** Fixed chart range: one grid cell is 6 V across and 6 A up. */
const U_RANGE = 24;
const I_RANGE = 24;
type Kind = NetlistElement["kind"];

const COLUMNS = [76, 300, 524];
const anchorX = (node: number) => COLUMNS[node % COLS];
const anchorY = (node: number, rows: number[]) => rows[Math.floor(node / COLS)];
const kindPrefix: Record<Kind, string> = {
  resistor: "r",
  source: "s",
  wire: "w",
};
function nextId(elements: NetlistElement[], kind: Kind) {
  for (let n = 1; ; n++) {
    const id = `${kindPrefix[kind]}${n}`;
    if (!elements.some((element) => element.id === id)) return id;
  }
}
function format(hint: string, values: Record<string, string>) {
  return hint.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

export default function CircuitWorkbenchView({
  simulation,
  netlist,
}: ViewProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const frame = useDiagramFrame(WIDTH, 460);
  const height = frame.height;

  const [tool, setTool] = useState<Kind | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState(text.idleHint);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);

  const elements = netlist?.elements ?? [];
  const selected = elements.find((element) => element.id === selectedId) ?? null;

  // Fixed layout: the lattice always occupies the upper part, the chart the lower.
  // Coordinates are rounded to whole pixels so hit targets never drift.
  const rows = [
    Math.round(Math.max(52, height * 0.13)),
    Math.round(Math.max(176, height * 0.52) - 18),
  ];
  const circuitMid = (rows[0] + rows[1]) / 2;
  const chart = {
    left: 76,
    right: WIDTH - 46,
    top: Math.max(240, height * 0.58),
    bottom: height - 28,
  };
  const chartScaleX = (chart.right - chart.left) / 2 / U_RANGE;
  const chartScaleY = Math.max(
    24,
    (chart.bottom - chart.top) / 2 / I_RANGE,
  );
  const chartMidX = (chart.left + chart.right) / 2;
  const chartMidY = (chart.top + chart.bottom) / 2;
  const solution = useMemo(
    () => (netlist ? solveCircuit(netlist) : null),
    [netlist],
  );
  const solved = solution && solution.status === "ok" ? solution : null;
  const clipped = solved
    ? solved.elements.filter(
        (element) =>
          Math.abs(element.voltage) > U_RANGE ||
          Math.abs(element.current) > I_RANGE,
      ).length
    : 0;

  const commit = useCallback(
    (next: NetlistElement[]) => {
      try {
        simulation.setParams({
          ...simulation.params,
          circuit: { elements: next } as Netlist,
        });
        return true;
      } catch {
        setMessage(text.invalidNetlist);
        return false;
      }
    },
    [simulation, text.invalidNetlist],
  );

  const add = (kind: Kind, a: number, b: number) => {
    if (a === b) {
      setMessage(text.sameNodeHint);
      return;
    }
    if (elements.length >= MAX_ELEMENTS) {
      setMessage(format(text.maxElementsHint, { max: String(MAX_ELEMENTS) }));
      return;
    }
    if (kind === "source" && elements.some((element) => element.kind === "source")) {
      setMessage(text.onlyOneSourceHint);
      return;
    }
    const roots = wireRoots(elements, MAX_NODES);
    if (kind === "wire" && roots[a] === roots[b]) {
      setMessage(text.duplicateWireHint);
      return;
    }
    const id = nextId(elements, kind);
    const value =
      kind === "resistor" ? DEFAULT_RESISTANCE : kind === "source" ? DEFAULT_EMF : 0;
    if (commit([...elements, { id, kind, a, b, value }])) {
      setSelectedId(id);
      setMessage(
        format(text.placedHint, {
          kind: kindLabel(kind),
          id,
          a: String(a),
          b: String(b),
        }),
      );
    }
  };

  const remove = (id: string) => {
    const element = elements.find((candidate) => candidate.id === id);
    if (!element) return;
    if (element.kind === "source") {
      setMessage(text.sourceDeleteHint);
      return;
    }
    if (commit(elements.filter((candidate) => candidate.id !== id))) {
      setSelectedId(null);
      setMessage(format(text.deletedHint, { kind: kindLabel(element.kind), id }));
    }
  };

  const setValue = (id: string, value: number) => {
    const element = elements.find((candidate) => candidate.id === id);
    if (!element || element.kind === "wire") return;
    commit(
      elements.map((candidate) =>
        candidate.id === id ? { ...candidate, value } : candidate,
      ),
    );
  };

  const kindLabel = (kind: Kind) =>
    kind === "resistor" ? text.resistor : kind === "source" ? text.source : text.wire;

  const activateNode = (node: number) => {
    if (!tool) {
      const element = elements.find(
        (candidate) => candidate.a === node || candidate.b === node,
      );
      setSelectedId(element ? element.id : null);
      setMessage(
        element
          ? format(text.selectedHint, {
              kind: kindLabel(element.kind),
              id: element.id,
            })
          : text.selectToolFirst,
      );
      setPending(null);
      return;
    }
    if (pending === null) {
      setPending(node);
      setMessage(format(text.pendingHint, { node: String(node) }));
      return;
    }
    if (pending === node) {
      setPending(null);
      setMessage(text.cancelledHint);
      return;
    }
    add(tool, pending, node);
    setPending(null);
  };

  const onNodeKeyDown = (event: KeyboardEvent<SVGCircleElement>, node: number) => {
    const step =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowDown"
            ? COLS
            : event.key === "ArrowUp"
              ? -COLS
              : 0;
    if (step) {
      event.preventDefault();
      nodeRefs.current[node + step]?.focus();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateNode(node);
      return;
    }
    if (event.key === "Escape") {
      setPending(null);
      setMessage(text.cancelledHint);
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (!selectedId) return;
      event.preventDefault();
      remove(selectedId);
    }
  };

  const toolButton = (kind: Kind, label: string) => (
    <button
      type="button"
      aria-pressed={tool === kind}
      onClick={() => {
        setTool(tool === kind ? null : kind);
        setPending(null);
      }}
    >
      {label}
    </button>
  );

  const symbol = (element: NetlistElement) => {
    const x = anchorX(element.a),
      y = anchorY(element.a, rows),
      ex = anchorX(element.b),
      ey = anchorY(element.b, rows);
    const angle = (Math.atan2(ey - y, ex - x) * 180) / Math.PI;
    const midX = (x + ex) / 2,
      midY = (y + ey) / 2;
    const chosen = selectedId === element.id;
    return (
      <g key={element.id}>
        <path
          d={`M${x},${y}L${ex},${ey}`}
          stroke="var(--color-text-muted)"
          strokeWidth={element.kind === "wire" ? 2.4 : 1.4}
          fill="none"
          pointerEvents="none"
        />
        {element.kind === "wire" ? null : (
          <g
            transform={`translate(${midX},${midY}) rotate(${angle})`}
            onClick={() => {
              setSelectedId(element.id);
              setMessage(
                format(text.selectedHint, {
                  kind: kindLabel(element.kind),
                  id: element.id,
                }),
              );
            }}
            role="button"
            aria-label={format(text.elementAria, {
              kind: kindLabel(element.kind),
              id: element.id,
              value: `${element.value}`,
              a: String(element.a),
              b: String(element.b),
            })}
            style={{ cursor: "pointer" }}
          >
            {chosen && (
              <circle r="26" fill="var(--color-accent)" fillOpacity="0.18" />
            )}
            <rect
              x="-25"
              y="-11"
              width="50"
              height="22"
              rx="5"
              fill="var(--color-background)"
              stroke="var(--color-text-muted)"
              strokeWidth={chosen ? 2.4 : 1.4}
            />
            {element.kind === "resistor" ? (
              <path
                d={`M-16,0h4l3,-8 3,16 3,-8l4,0`}
                stroke="var(--color-secondary)"
                strokeWidth="1.6"
                fill="none"
              />
            ) : (
              <g stroke="var(--color-accent)" strokeWidth="2">
                <path d="M-8,-8V8" />
                <path d="M8,-4V4" />
              </g>
            )}
          </g>
        )}
      </g>
    );
  };

  const marker = (element: NetlistElement) => {
    const branch = solved?.elements.find((candidate) => candidate.id === element.id);
    if (!branch) return null;
    const x = chartMidX + branch.voltage * chartScaleX;
    const y = chartMidY - branch.current * chartScaleY;
    const inside =
      Math.abs(branch.voltage) <= U_RANGE && Math.abs(branch.current) <= I_RANGE;
    if (!inside) return null;
    const color =
      element.kind === "source" ? "var(--color-accent)" : "var(--color-secondary)";
    const chosen = selectedId === element.id;
    return (
      <g
        key={branch.id}
        transform={`translate(${x},${y})`}
        onClick={() => setSelectedId(element.id)}
        role="button"
        aria-label={`${element.id} ${branch.voltage.toFixed(2)} V ${branch.current.toFixed(3)} A`}
        style={{ cursor: "pointer" }}
      >
        {element.kind === "source" ? (
          <rect
            x={chosen ? -9 : -6}
            y={chosen ? -9 : -6}
            width={chosen ? 18 : 12}
            height={chosen ? 18 : 12}
            fill={color}
          />
        ) : (
          <circle r={chosen ? 8 : 5} fill={color} />
        )}
      </g>
    );
  };

  const editor = (): ReactNode => {
    if (!selected || selected.kind === "wire")
      return <span>{selected ? text.wireNoValue : text.selectToolFirst}</span>;
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{selected.kind === "resistor" ? text.valueResistor : text.valueSource}</span>
        <input
          type="range"
          min={selected.kind === "resistor" ? 1 : -24}
          max={selected.kind === "resistor" ? 1000 : 24}
          step={selected.kind === "resistor" ? 10 : 1}
          value={selected.value}
          aria-label={format(text.valueAria, {
            kind: kindLabel(selected.kind),
            id: selected.id,
            label:
              selected.kind === "resistor" ? text.valueResistor : text.valueSource,
          })}
          onChange={(event) => setValue(selected.id, Number(event.target.value))}
        />
        <strong style={{ fontVariantNumeric: "tabular-nums" }}>
          {selected.value}
          {selected.kind === "resistor" ? " Ω" : " V"}
        </strong>
      </label>
    );
  };

  return (
    <div className={s.scene}>
      <svg
        ref={frame.ref}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={text.diagram}
      >
        {/* Fixed grid: every cell is one lattice step across and 6 V × 6 A in the chart. */}
        <g stroke="var(--color-border)" strokeWidth="0.5">
          {COLUMNS.map((x) => (
            <path key={`gx${x}`} d={`M${x},12V${rows[1] + 22}`} />
          ))}
          {[0.25, 0.5, 0.75].map((fraction) => (
            <path
              key={`gy${fraction}`}
              d={`M40,${circuitMid - (rows[1] - rows[0]) * (fraction - 0.5)}H${WIDTH - 40}`}
            />
          ))}
        </g>
        {elements.map(symbol)}

        {/* Node hit targets are drawn last so they always sit above the wiring. */}
        {rows.map((y, r) =>
          COLUMNS.map((x, column) => {
            const node = column + r * COLS;
            return (
              <circle
                key={node}
                ref={(element) => {
                  nodeRefs.current[node] = element;
                }}
                cx={x}
                cy={y}
                r={pending === node ? 12 : 8}
                tabIndex={0}
                role="button"
                aria-label={`${text.node} ${node}`}
                fill={pending === node ? "var(--color-accent)" : "var(--color-background)"}
                stroke="var(--color-text)"
                strokeWidth="1.6"
                onClick={() => activateNode(node)}
                onKeyDown={(event) => onNodeKeyDown(event, node)}
                style={{ cursor: "pointer" }}
              />
            );
          }),
        )}
        <g fill="var(--color-text-muted)" fontSize="11" textAnchor="middle">
          {Array.from({ length: MAX_NODES }, (_, node) => (
            <text key={node} x={anchorX(node)} y={anchorY(node, rows) + 24}>
              {node}
            </text>
          ))}
        </g>

        {/* Fixed U–I coordinate system for every branch operating point. */}
        <g>
          <text
            x={chartMidX}
            y={chart.top - 6}
            fill="var(--color-text-muted)"
            fontSize="11"
            textAnchor="middle"
          >
            {text.chartTitle}
          </text>
          <path
            d={`M${chart.left},${chartMidY}H${chart.right}`}
            stroke="var(--color-text-muted)"
          />
          <path
            d={`M${chartMidX},${chart.top}V${chart.bottom}`}
            stroke="var(--color-text-muted)"
          />
          <text
            x={chart.right}
            y={chartMidY - 6}
            fill="var(--color-text-muted)"
            fontSize="10"
            textAnchor="end"
          >
            {text.axisU}
          </text>
          <text
            x={chartMidX + 6}
            y={chart.top + 10}
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            {text.axisI}
          </text>
          {solved?.elements.map((element) => marker(element))}
        </g>
      </svg>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          margin: "10px 0 0",
          fontSize: 13,
        }}
      >
        {toolButton("resistor", text.paletteResistor)}
        {toolButton("source", text.paletteSource)}
        {toolButton("wire", text.paletteWire)}
        <button
          type="button"
          onClick={() => remove(selectedId ?? "")}
          disabled={!selectedId}
        >
          {text.deleteElement}
        </button>
        {editor()}
      </div>
      <p role="status" style={{ margin: "8px 0 0", fontSize: 12, minHeight: "2.4em" }}>
        {message}
      </p>
      {solved && clipped > 0 && (
        <p role="status" style={{ margin: "4px 0 0", fontSize: 12 }}>
          {format(text.clipped, { n: String(clipped) })}
        </p>
      )}
      {solution && solution.status === "error" && (
        <p role="alert" style={{ margin: "4px 0 0", fontSize: 12 }}>
          {format(
            solution.code === "not-one-source"
              ? text.errorNotOneSource
              : solution.code === "shorted-source"
                ? text.errorShortedSource
                : solution.code === "floating-node"
                  ? text.errorFloatingNode
                  : solution.code === "no-loop"
                    ? text.errorNoLoop
                    : text.errorSingular,
            { node: String(solution.node ?? 0) },
          )}
        </p>
      )}
      <p className={s.note}>{text.note}</p>
    </div>
  );
}
