import { useI18n } from "../../../packages/i18n/I18n";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import { derivative, secantSlope } from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const slope = secantSlope(p.x0, p.h);
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.secant} />
      </div>
      <div className={s.readings}>
        <div><span>{text.secant}</span><strong data-testid="secant-slope">{slope === null ? text.undefined : slope.toFixed(3)}</strong></div>
        <div><span>{text.tangent}</span><strong data-testid="tangent-slope">{derivative(p.x0).toFixed(3)}</strong></div>
        <div><span>{text.error}</span><strong data-testid="slope-error">{slope === null ? "—" : Math.abs(p.h).toFixed(3)}</strong></div>
      </div>
      <p className={s.readoutStatus}>{slope === null ? text.coincident : text.precision}</p>
    </>
  );
}
