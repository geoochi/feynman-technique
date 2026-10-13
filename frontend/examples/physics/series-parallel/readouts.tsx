import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import {
  branchCurrents,
  branchVoltages,
  parallelEquivalent,
  seriesCurrent,
  seriesEquivalent,
  totalPower,
} from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const { voltage: v, resistance1: r1, resistance2: r2 } = p;

  const reqSeries = seriesEquivalent(r1, r2);
  const reqParallel = parallelEquivalent(r1, r2);
  const iSeries = seriesCurrent(v, r1, r2);
  const { v1, v2 } = branchVoltages(v, r1, r2);
  const { i1, i2 } = branchCurrents(v, r1, r2);

  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.parallel} />
        <FormulaMarkup formula={formulas.power} />
        <p className={s.coefficients}>
          V = {v.toFixed(1)} V · R₁ = {r1.toFixed(0)} Ω · R₂ = {r2.toFixed(0)} Ω
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.reqSeries}</span>
          <strong>
            {reqSeries.toFixed(1)}
            <small>Ω</small>
          </strong>
        </div>
        <div>
          <span>{text.reqParallel}</span>
          <strong>
            {reqParallel.toFixed(1)}
            <small>Ω</small>
          </strong>
        </div>
        <div>
          <span>{text.iSeries}</span>
          <strong>
            {iSeries.toFixed(3)}
            <small>A</small>
          </strong>
        </div>
        <div>
          <span>{text.v1}</span>
          <strong>
            {v1.toFixed(2)}
            <small>V</small>
          </strong>
        </div>
        <div>
          <span>{text.v2}</span>
          <strong>
            {v2.toFixed(2)}
            <small>V</small>
          </strong>
        </div>
        <div>
          <span>{text.i1}</span>
          <strong>
            {i1.toFixed(3)}
            <small>A</small>
          </strong>
        </div>
        <div>
          <span>{text.i2}</span>
          <strong>
            {i2.toFixed(3)}
            <small>A</small>
          </strong>
        </div>
        <div>
          <span>{text.iTotal}</span>
          <strong>
            {(i1 + i2).toFixed(3)}
            <small>A</small>
          </strong>
        </div>
        <div>
          <span>{text.pSeries}</span>
          <strong>
            {totalPower(v, reqSeries).toFixed(3)}
            <small>W</small>
          </strong>
        </div>
        <div>
          <span>{text.pParallel}</span>
          <strong>
            {totalPower(v, reqParallel).toFixed(3)}
            <small>W</small>
          </strong>
        </div>
      </div>
    </>
  );
}
