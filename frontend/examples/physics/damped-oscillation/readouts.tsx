import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import {
  dampedPeriod,
  dampingRatio,
  energy,
  isCritical,
  isUnderdamped,
  naturalFrequency,
} from "./model";

export function Readouts({ params: p, state, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const zeta = dampingRatio(p);
  const regime = isUnderdamped(p)
    ? text.underdamped
    : isCritical(p)
      ? text.critical
      : text.overdamped;
  const td = dampedPeriod(p);
  const oscillates = Number.isFinite(td);
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.ratio}</span>
          <strong>
            {zeta.toFixed(3)}
            <small>ζ</small>
          </strong>
        </div>
        <div>
          <span>{text.regime}</span>
          <strong>{regime}</strong>
        </div>
        <div>
          <span>{text.natural}</span>
          <strong>
            {naturalFrequency(p).toFixed(3)}
            <small>rad/s</small>
          </strong>
        </div>
        <div>
          <span>{text.dampedPeriod}</span>
          <strong>
            {oscillates ? td.toFixed(3) : text.none}
            <small>{oscillates ? "s" : ""}</small>
          </strong>
        </div>
        <div>
          <span>{text.displacement}</span>
          <strong>
            {(state.x ?? 0).toFixed(3)}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.energy}</span>
          <strong>
            {energy(p, state).toFixed(3)}
            <small>J</small>
          </strong>
        </div>
      </div>
    </>
  );
}
