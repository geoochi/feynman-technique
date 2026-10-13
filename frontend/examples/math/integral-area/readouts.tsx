import { useI18n } from "../../../packages/i18n/I18n";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { labels } from "./labels";
import {
  error,
  exactIntegral,
  riemannSum,
  samplingBias,
  subintervalCount,
  subintervalWidth,
} from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const sum = riemannSum(p.a, p.b, p.n, p.s);
  const exact = exactIntegral(p.a, p.b);
  const diff = error(p.a, p.b, p.n, p.s);
  const width = subintervalWidth(p.a, p.b, p.n);
  const count = subintervalCount(p.n);
  const zero = p.a === p.b;
  const kind =
    p.s <= 1e-9
      ? text.left
      : p.s >= 1 - 1e-9
        ? text.right
        : Math.abs(p.s - 0.5) <= 1e-9
          ? text.midpoint
          : text.custom;
  const bias = samplingBias(p.a, p.b, p.s);
  const biasText =
    bias === "under"
      ? text.under
      : bias === "over"
        ? text.over
        : bias === "mixed"
          ? text.mixed
          : text.interior;
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.riemann} />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.approximation}</span>
          <strong data-testid="riemann-sum">{sum.toFixed(3)}</strong>
        </div>
        <div>
          <span>{text.exact}</span>
          <strong data-testid="exact-value">{exact.toFixed(3)}</strong>
        </div>
        <div>
          <span>{text.error}</span>
          <strong data-testid="sum-error">{diff.toFixed(3)}</strong>
        </div>
        <div>
          <span>{text.width}</span>
          <strong data-testid="delta-x">{width.toFixed(4)}</strong>
        </div>
      </div>
      <p className={s.readoutStatus} data-testid="sampling-status">
        {zero
          ? text.zeroInterval
          : `${text.sampling}: ${kind} (n = ${count}) · ${biasText}`}
      </p>
      <p className={s.readoutStatus}>{text.signed}</p>
    </>
  );
}
