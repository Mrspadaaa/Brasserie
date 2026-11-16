import type { ReactNode } from "react";

export interface GradueLabel {
  /** Valeur où se pose le repère chiffré. */
  v: number;
  text: string;
  /** Borne du matériel (début de la zone hachurée) : repère en ocre. */
  borne?: boolean;
}

interface Props {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
  /** Au-delà de cette valeur, la piste est hachurée (limite du matériel : dessinée, jamais imposée). */
  zoneFrom?: number;
  /** Écart des grands traits et des petits traits, en unités de la valeur. */
  major: number;
  minor: number;
  labels: GradueLabel[];
  /** Repère ▼ posé au-dessus de la piste, à cette valeur. */
  marker?: number | null;
  children?: ReactNode;
}

/** Position en % de la piste d'une valeur, bornée. */
const at = (v: number, min: number, max: number) =>
  max > min ? Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100)) : 0;

/**
 * Curseur gradué de la maquette w1b : piste remplie, zone du matériel hachurée, graduation et repères chiffrés.
 * Le geste reste celui d'un `<input type="range">` natif (clavier compris) ; les repères sont posés à leur valeur réelle.
 */
export function GradueSlider({
  value, min, max, step, onChange, ariaLabel, id, disabled, zoneFrom, major, minor, labels, marker, children,
}: Props) {
  const v = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  const span = max - min;
  const zone = zoneFrom != null && zoneFrom < max ? at(zoneFrom, min, max) : null;
  return (
    <div className="ew-cw">
      <div className="ew-cur">
        <div className="ew-pis">
          <i style={{ width: `${at(v, min, max)}%`, ...(zone != null && zoneFrom != null && v > zoneFrom ? { background: "var(--ew-att)" } : null) }} />
          {zone != null && <i className="ew-zn" style={{ left: `${zone}%`, right: 0 }} />}
        </div>
        {marker != null && Number.isFinite(marker) && (
          <i className="ew-mk" aria-hidden="true" style={{ left: `${at(marker, min, max)}%` }} />
        )}
        <input
          id={id}
          className="ew-rg"
          type="range"
          name="water_graduated_range"
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          min={min}
          max={max}
          step={step}
          value={v}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        {children}
      </div>
      <div
        className="ew-reg"
        role="presentation"
        style={{ backgroundSize: `${(major / span) * 100}% 100%, ${(minor / span) * 100}% 4px` }}
      />
      <div className="ew-ech">
        {labels.map((l) => {
          const p = at(l.v, min, max);
          return (
            <span
              key={`${l.v}-${l.text}`}
              className={l.borne ? "ew-bo" : undefined}
              style={{ left: `${p}%`, transform: p <= 0 ? "none" : p >= 100 ? "translateX(-100%)" : l.borne ? "translateX(-100%)" : undefined }}
            >
              {l.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
