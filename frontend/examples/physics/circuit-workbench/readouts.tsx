import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { solveCircuit, type ElementSolution } from "./model";

function failure(text: (typeof labels)["en"], code: string, node?: number) {
  switch (code) {
    case "not-one-source":
      return text.errorNotOneSource;
    case "shorted-source":
      return text.errorShortedSource;
    case "floating-node":
      return text.errorFloatingNode.replace("{node}", String(node ?? 0));
    case "no-loop":
      return text.errorNoLoop.replace("{node}", String(node ?? 0));
    default:
      return text.errorSingular;
  }
}

export function Readouts({ netlist, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const result = netlist ? solveCircuit(netlist) : null;
  const solved = result && result.status === "ok" ? result : null;
  const source = solved?.elements.find((e) => e.kind === "source");
  const branch = (element: ElementSolution) =>
    `${element.id}: ${element.current.toFixed(3)} A, ${element.voltage.toFixed(2)} V`;

  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.parallel} />
        <p className={s.coefficients}>
          {text.elementsCount}: {netlist ? netlist.elements.length : 0}
        </p>
      </div>
      <div className={s.readings}>
        {source && (
          <>
            <div>
              <span>{text.sourceEmf}</span>
              <strong>
                {source.value.toFixed(1)}
                <small>V</small>
              </strong>
            </div>
            <div>
              <span>{text.sourceCurrent}</span>
              <strong>
                {(-source.current).toFixed(3)}
                <small>A</small>
              </strong>
            </div>
            <div>
              <span>{text.totalPower}</span>
              <strong>
                {(-source.power).toFixed(3)}
                <small>W</small>
              </strong>
            </div>
          </>
        )}
        {solved && (
          <div>
            <span>{text.balance}</span>
            <strong>
              {solved.totalPower.toFixed(6)}
              <small>W</small>
            </strong>
          </div>
        )}
        {solved && (
          <div>
            <span>{text.nodeVoltages}</span>
            <strong>
              {solved.nodeVoltages
                .map((voltage, node) => `${node}:${voltage.toFixed(2)}`)
                .join("  ")}
            </strong>
          </div>
        )}
        {solved &&
          solved.elements
            .filter((element) => element.kind !== "wire")
            .map((element) => (
              <div key={element.id}>
                <span>{element.id}</span>
                <strong>{branch(element)}</strong>
              </div>
            ))}
      </div>
      {result && result.status === "error" && (
        <p className={s.readoutStatus}>
          {failure(text, result.code, result.node)}
        </p>
      )}
      <p className={s.readoutStatus}>{text.markerLegend}</p>
    </>
  );
}
