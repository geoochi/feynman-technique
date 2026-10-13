import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { solarAltitude, solarHour, dayLength } from "./model";

export function Readouts(props: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const hour = solarHour(props.params, props.state),
    altitude = solarAltitude(
      props.params.latitude,
      props.params.declination,
      hour,
    ),
    length = dayLength(props.params.latitude, props.params.declination);
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup
          formula={
            props.formulas[
              length === 24
                ? "polarDay"
                : length === 0
                  ? "polarNight"
                  : "default"
            ]
          }
        />
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.hour}</span>
          <strong>
            {String(Math.floor(hour)).padStart(2, "0")}:
            {String(Math.floor((hour % 1) * 60)).padStart(2, "0")}
            <small>h</small>
          </strong>
        </div>
        <div>
          <span>{text.length}</span>
          <strong>
            {length.toFixed(2)}
            <small>h</small>
          </strong>
        </div>
      </div>
      <p className={s.readoutStatus}>
        {altitude > 0 ? text.daytime : text.nighttime} · {text.altitude}{" "}
        {altitude.toFixed(1)}°
      </p>
    </>
  );
}
