import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

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

/** Alignement d'un repère : au bord gauche, au bord droit, ou centré sur sa valeur ; une borne finit sur sa valeur. */
const alignement = (l: GradueLabel, p: number): "debut" | "fin" | "centre" =>
  p <= 0 ? "debut" : p >= 100 || l.borne ? "fin" : "centre";

/**
 * EAU-2 (19.11, « 32,235 ») : étiquetage de repères sans chevauchement, méthode gloutonne par priorité (borne du matériel,
 * puis extrémités, puis le reste). Un repère qui toucherait un repère déjà retenu s'efface. La largeur du texte est estimée
 * à la chasse fixe d'IBM Plex Mono 12 px (0,6 em ≈ 7,2 px). Largeur inconnue (0) : tous les repères.
 */
export function reperesVisibles(labels: GradueLabel[], min: number, max: number, largeurPx: number, chassePx = 7.3, ecartPx = 4): GradueLabel[] {
  if (!(largeurPx > 0)) return labels;
  const etendue = (l: GradueLabel): [number, number] => {
    const p = at(l.v, min, max);
    const x = (p / 100) * largeurPx;
    const w = l.text.length * chassePx;
    const a = alignement(l, p);
    return a === "debut" ? [x, x + w] : a === "fin" ? [x - w, x] : [x - w / 2, x + w / 2];
  };
  const rang = (l: GradueLabel) => { const p = at(l.v, min, max); return l.borne ? 0 : p <= 0 || p >= 100 ? 1 : 2; };
  const retenus: Array<[number, number]> = [];
  const gardes = new Set<GradueLabel>();
  for (const l of [...labels].sort((a, b) => rang(a) - rang(b))) {
    const [g, d] = etendue(l);
    if (retenus.some(([rg, rd]) => g < rd + ecartPx && d > rg - ecartPx)) continue;
    retenus.push([g, d]);
    gardes.add(l);
  }
  return labels.filter((l) => gardes.has(l));
}

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
  const echelle = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(0);
  useLayoutEffect(() => {
    const el = echelle.current;
    if (!el) return;
    const mesure = () => setLargeur(el.clientWidth);
    mesure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(mesure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
      <div className="ew-ech" ref={echelle}>
        {reperesVisibles(labels, min, max, largeur).map((l) => {
          const p = at(l.v, min, max);
          return (
            <span
              key={`${l.v}-${l.text}`}
              className={l.borne ? "ew-bo" : undefined}
              style={{ left: `${p}%`, transform: { debut: "none", fin: "translateX(-100%)", centre: undefined }[alignement(l, p)] }}
            >
              {l.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
