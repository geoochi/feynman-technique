import { useEffect, useState } from "react";
import type { Parameter } from "../core/types";
import s from "./Controls.module.css";
import { useI18n } from "../i18n/I18n";
export function ParameterControl({
  name,
  spec,
  value,
  onChange,
  resetToken,
}: {
  name: string;
  spec: Parameter;
  value: number;
  onChange: (value: number) => void;
  resetToken: unknown;
}) {
  const { t, locale } = useI18n();
  const label = spec.labels[locale];
  const factor = spec.unit === "rad" ? Math.PI / 180 : 1;
  const toDisplay = (n: number) => Number((n / factor).toFixed(2));
  const [draft, setDraft] = useState(String(toDisplay(value))),
    [error, setError] = useState(false);
  useEffect(() => {
    setDraft(String(toDisplay(value)));
    setError(false);
  }, [value, resetToken]);
  const commit = () => {
    const v = Number(draft) * factor;
    if (
      !draft.trim() ||
      !Number.isFinite(v) ||
      v < spec.minimum - 1e-10 ||
      v > spec.maximum + 1e-10
    ) {
      setError(true);
      return;
    }
    setError(false);
    const next = Math.max(spec.minimum, Math.min(spec.maximum, v));
    if (Math.abs(next - value) > Math.max(1, Math.abs(value)) * 1e-10)
      onChange(next);
  };
  return (
    <div className={s.parameter}>
      <div className={s.parameterTitle}>
        <label htmlFor={`number-${name}`}>{label}</label>
        <div>
          <input
            id={`number-${name}`}
            type="number"
            value={draft}
            min={toDisplay(spec.minimum)}
            max={toDisplay(spec.maximum)}
            step={toDisplay(spec.step)}
            aria-invalid={!!error}
            aria-describedby={error ? `error-${name}` : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
          />
          <span>{spec.unit === "rad" ? "°" : spec.unit || t("unit")}</span>
        </div>
      </div>
      <input
        aria-label={t("slider", { label })}
        type="range"
        min={spec.minimum}
        max={spec.maximum}
        step={spec.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className={s.bounds}>
        <span>{toDisplay(spec.minimum)}</span>
        <span>{toDisplay(spec.maximum)}</span>
      </div>
      {error && (
        <p id={`error-${name}`} role="alert" className={s.error}>
          {t("range", {
            min: toDisplay(spec.minimum),
            max: toDisplay(spec.maximum),
          })}
        </p>
      )}
    </div>
  );
}
