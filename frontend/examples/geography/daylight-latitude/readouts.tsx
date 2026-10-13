import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import { dayLengthHours, dayLengthState, polarBoundaryLatitude } from "./model";
import s from "../../../packages/ui/Scene.module.css";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const state = dayLengthState(p.latitude, p.declination);
  const hours = dayLengthHours(p.latitude, p.declination);
  const boundary = polarBoundaryLatitude(p.declination);
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup
          formula={
            state === "polarDay"
              ? formulas.polarDay
              : state === "polarNight"
                ? formulas.polarNight
                : formulas.default
          }
        />
        <p className={s.coefficients}>
          φ = {p.latitude.toFixed(1)}° · δ = {p.declination.toFixed(1)}°
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.dayLength}</span>
          <strong>
            {hours.toFixed(2)}
            <small>h</small>
          </strong>
        </div>
        <div>
          <span>{text.boundary}</span>
          <strong>
            {boundary.toFixed(2)}
            <small>°</small>
          </strong>
        </div>
      </div>
      <p className={s.readoutStatus}>{text[state]}</p>
    </>
  );
}
