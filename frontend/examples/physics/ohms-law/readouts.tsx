import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { current, power } from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const i = current(p.v, p.r);
  const watts = power(p.v, p.r);
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.power} />
        <p className={s.coefficients}>
          V = {p.v} V · R = {p.r} Ω
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.current}</span>
          <strong>
            {i.toFixed(2)}
            <small>A</small>
          </strong>
        </div>
        <div>
          <span>{text.power}</span>
          <strong>
            {watts.toFixed(2)}
            <small>W</small>
          </strong>
        </div>
      </div>
    </>
  );
}
