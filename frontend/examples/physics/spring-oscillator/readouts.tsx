import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { period, energy } from "./model";

export function Readouts({ params: p, state, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const kinetic = 0.5 * p.mass * (state.v ?? 0) ** 2;
  const potential = 0.5 * p.stiffness * (state.x ?? 0) ** 2;
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.period}</span>
          <strong>
            {period(p).toFixed(3)}
            <small>s</small>
          </strong>
        </div>
        <div>
          <span>{text.kinetic}</span>
          <strong>
            {kinetic.toFixed(3)}
            <small>J</small>
          </strong>
        </div>
        <div>
          <span>{text.potential}</span>
          <strong>
            {potential.toFixed(3)}
            <small>J</small>
          </strong>
        </div>
        <div>
          <span>{text.total}</span>
          <strong>
            {energy(state, p).toFixed(3)}
            <small>J</small>
          </strong>
        </div>
      </div>
    </>
  );
}
