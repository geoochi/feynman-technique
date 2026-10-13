import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { resultantAmplitude, waveNumber } from "./model";

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
          <span>{text.resultant}</span>
          <strong>
            {resultantAmplitude(p).toFixed(3)}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.phase}</span>
          <strong>
            {((p.phase * 180) / Math.PI).toFixed(1)}
            <small>°</small>
          </strong>
        </div>
        <div>
          <span>{text.wavenumber}</span>
          <strong>
            {waveNumber(p).toFixed(3)}
            <small>rad/m</small>
          </strong>
        </div>
      </div>
    </>
  );
}
