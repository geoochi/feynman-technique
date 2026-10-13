import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { finalVoltage, timeConstant } from "./model";

export function Readouts({ params: p, state, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const u = state.u ?? 0;
  // i = C du/dt = (E − u)/R follows from the same loop equation, so it is exact
  // whatever the history of the run was.
  const i = (p.emf - u) / p.resistance;
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.tau} />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.timeConstant}</span>
          <strong>
            {timeConstant(p).toFixed(3)}
            <small>s</small>
          </strong>
        </div>
        <div>
          <span>{text.initialVoltage}</span>
          <strong>
            {p.initialVoltage.toFixed(2)}
            <small>V</small>
          </strong>
        </div>
        <div>
          <span>{text.finalVoltage}</span>
          <strong>
            {finalVoltage(p).toFixed(2)}
            <small>V</small>
          </strong>
        </div>
        <div>
          <span>{text.capacitorVoltage}</span>
          <strong>
            {u.toFixed(3)}
            <small>V</small>
          </strong>
        </div>
        <div>
          <span>{text.current}</span>
          <strong>
            {i.toFixed(4)}
            <small>A</small>
          </strong>
        </div>
        <div>
          <span>{text.charge}</span>
          <strong>
            {(p.capacitance * u).toFixed(5)}
            <small>C</small>
          </strong>
        </div>
      </div>
    </>
  );
}
