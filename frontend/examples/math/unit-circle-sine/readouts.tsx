import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { period } from "./model";

export function Readouts({ params: p, state, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const thetaDegrees = ((state.theta ?? 0) * 180) / Math.PI;
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.period} />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.amplitude}</span>
          <strong>
            {p.radius.toFixed(2)}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.period}</span>
          <strong>
            {period(p).toFixed(3)}
            <small>s</small>
          </strong>
        </div>
        <div>
          <span>{text.angularSpeed}</span>
          <strong>
            {p.omega.toFixed(2)}
            <small>rad/s</small>
          </strong>
        </div>
        <div>
          <span>{text.phaseNow}</span>
          <strong>
            {thetaDegrees.toFixed(1)}
            <small>°</small>
          </strong>
        </div>
      </div>
      <p className={s.readoutStatus}>{text.readoutNote}</p>
    </>
  );
}
