import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { smallAnglePeriod } from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.period}</span>
          <strong>
            {smallAnglePeriod(p).toFixed(3)}
            <small>s</small>
          </strong>
        </div>
      </div>
    </>
  );
}
