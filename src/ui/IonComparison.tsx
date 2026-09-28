import React from 'react';
import { WaterIons } from '../types';
import { ION_LABEL, ION_SYMBOL } from '../domain/water';
import { StyleWater, positionInRange, styleIonRange } from '../domain/waterStyles';
import { formatDecimal } from './numericInput';
import { formatIonReading } from './waterReadings';

interface IonComparisonProps {
  start: WaterIons;
  achieved: WaterIons;
  style: StyleWater;
  scenarioLabel?: string;
  compact?: boolean;
  compactLayout?: 'row' | 'radar-rail';
  className?: string;
  selectedIon?: keyof WaterIons | null;
  onSelectIon?: (ion: keyof WaterIons) => void;
  /** An absent analysis is unknown even when the domain's fallback is zero. */
  unknownIons?: readonly (keyof WaterIons)[];
}

const IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];
const columns = 'grid grid-cols-[3.25rem_3.25rem_3.25rem_minmax(1rem,1fr)_4.25rem] items-center gap-x-1.5';

/** Each row has its own scale and target; bars never compare one ion to another. */
const IonRow: React.FC<{
  ion: keyof WaterIons;
  start: number;
  achieved: number;
  style: StyleWater;
  scenarioLabel: string;
  selected: boolean;
  onSelect?: (ion: keyof WaterIons) => void;
  unknown: boolean;
}> = ({ ion, start, achieved, style, scenarioLabel, selected, onSelect, unknown }) => {
  const range = styleIonRange(style, ion);
  const targeted = !style.untargetedIons?.includes(ion);
  const valueUnknown = unknown || !Number.isFinite(start) || !Number.isFinite(achieved);
  const outside = !targeted || valueUnknown ? 0 : positionInRange(achieved, range);
  const finiteValues = [start, achieved].filter(Number.isFinite);
  const scale = Math.max(range.max / 0.66, ...finiteValues.map(value => value * 1.08), 1);
  const pct = (value: number) => Number.isFinite(value)
    ? Math.max(0, Math.min(100, (value / scale) * 100))
    : 0;
  const before = valueUnknown ? 'inconnu' : formatDecimal(start);
  const after = valueUnknown ? 'inconnu' : formatDecimal(achieved);
  const legacyAfter = valueUnknown ? 'inconnu' : formatIonReading(achieved, targeted ? range : undefined);
  const changed = !valueUnknown && start !== achieved;
  const status = valueUnknown
    ? 'analyse manquante'
    : !targeted ? 'sans cible'
      : outside < 0 ? 'sous la cible'
      : outside > 0 ? 'au-dessus de la cible' : 'dans la cible';
  const target = targeted ? `${range.min} à ${range.max} ppm` : 'sans cible';
  const compatibleStatus = `corrigée ${legacyAfter} ppm ; ${status}`;
  const currentStatus = scenarioLabel === 'Corrigée'
    ? compatibleStatus
    : `${scenarioLabel.toLowerCase()} ${legacyAfter} ppm ; ${status} ; ${compatibleStatus}`;
  const accessibleName = `${ION_LABEL[ion]} : départ ${before} mg/L, ${currentStatus} ; valeur exacte ${scenarioLabel.toLowerCase()} ${after} mg/L${targeted ? ` ; cible ${target}` : ''}`;

  return (
    <li
      className={`${columns} min-h-8 rounded-control px-1 ${selected ? 'bg-water/15 ring-1 ring-water/70' : ''}`}
      aria-label={accessibleName}
      data-ion-row={ion}
      data-selected={selected || undefined}
    >
      {onSelect ? (
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${selected ? 'Ion sélectionné' : 'Sélectionner'} : ${ION_LABEL[ion]}`}
          onClick={() => onSelect(ion)}
          className={`min-h-8 text-left text-2xs tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-water ${selected ? 'font-bold text-cave-50' : 'text-cave-200'}`}
        >
          {ION_SYMBOL[ion]}{ion === 'hco3' && <span className="text-cave-400"> éq.</span>}
        </button>
      ) : (
        <span className="text-2xs text-cave-200" title={ION_LABEL[ion]}>
          {ION_SYMBOL[ion]}{ion === 'hco3' && <span className="text-cave-400"> éq.</span>}
        </span>
      )}
      <span className="text-right whitespace-nowrap text-2xs tabular-nums text-cave-400" aria-label={`Départ ${before} mg/L`}>
        {before}
      </span>
      <span className={`text-right whitespace-nowrap text-2xs tabular-nums font-semibold ${outside === 0 ? 'text-cave-50' : 'text-ebc-amber'}`} aria-label={`${scenarioLabel} ${after} mg/L`}>
        {changed && <span className="sr-only">{before} → </span>}{after}
      </span>
      <span className="relative min-w-0 h-2 rounded-full bg-cave-800" aria-hidden>
        {targeted && <span className="absolute inset-y-0 rounded-full bg-hop/35" style={{ left: `${pct(range.min)}%`, right: `${100 - pct(range.max)}%` }} />}
        {!valueUnknown && changed && <span className="absolute inset-y-0 w-0.5 bg-cave-50/80" style={{ left: `${pct(start)}%` }} />}
        {!valueUnknown && <span className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-cave-950 ${!targeted ? 'bg-cave-400' : outside === 0 ? 'bg-hop' : 'bg-ebc-amber'}`} style={{ left: `calc(${pct(achieved)}% - 5px)` }} />}
      </span>
      <span className="text-right whitespace-nowrap text-2xs tabular-nums text-cave-400">
        {targeted ? `${range.min}–${range.max}` : 'sans cible'}
      </span>
    </li>
  );
};

export const IonComparison: React.FC<IonComparisonProps> = ({
  start,
  achieved,
  style,
  scenarioLabel = 'Corrigée',
  compact = false,
  compactLayout = 'row',
  className = '',
  selectedIon = null,
  onSelectIon,
  unknownIons = [],
}) => {
  if (compact) return <section className={`${compactLayout === 'row' ? 'panel min-w-0 p-1' : 'min-w-0'} ${className}`} data-ion-comparison="selector" aria-label="Choisir un ion à ajuster">
    <div role="group" aria-label="Choisir un ion ; les symboles indiquent son état face à la cible" className={`grid ${compactLayout === 'radar-rail' ? 'grid-cols-3 gap-0.5 sm:grid-cols-6 sm:gap-1' : 'grid-cols-6 gap-1'}`}>
      {IONS.map(ion => {
        const range = styleIonRange(style, ion);
        const targeted = !style.untargetedIons?.includes(ion);
        const unknown = unknownIons.includes(ion) || !Number.isFinite(start[ion]) || !Number.isFinite(achieved[ion]);
        const value = unknown ? 'inconnu' : `${formatDecimal(achieved[ion])} mg/L`;
        const status = unknown ? 'analyse manquante'
          : !targeted ? 'sans cible'
            : achieved[ion] < range.min ? 'sous la cible'
              : achieved[ion] > range.max ? 'au-dessus de la cible' : 'dans la cible';
        const marker = unknown ? '?' : !targeted ? '—'
          : status === 'sous la cible' ? '↓' : status === 'au-dessus de la cible' ? '↑' : '✓';
        const target = targeted ? `cible ${range.min} à ${range.max} mg/L` : 'sans cible';
        return <button key={ion} type="button" aria-pressed={selectedIon === ion}
          aria-label={`Sélectionner : ${ION_LABEL[ion]} · ${scenarioLabel} ${value} · ${status} · ${target}`}
          data-ion-selector={ion} onClick={() => onSelectIon?.(ion)}
          className={`min-w-0 ${compactLayout === 'radar-rail' ? 'min-h-6 sm:min-h-7 text-[10px] sm:text-xs' : 'min-h-7 text-xs'} rounded-control border px-0.5 tabular-nums flex items-center justify-center gap-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-water ${selectedIon === ion ? 'border-water bg-water/15 text-cave-50' : 'border-transparent text-cave-200'}`}>
          <span>{ION_SYMBOL[ion]}</span>
          <span aria-hidden className={unknown || status !== 'dans la cible' && targeted ? 'text-attention' : 'text-hop'}>{marker}</span>
        </button>;
      })}
    </div>
  </section>;

  return (
  <section className="panel px-2 py-2" data-ion-comparison="full" aria-label="Comparaison des ions et des plages cibles">
    <div className={`${columns} pb-1 text-2xs text-cave-400`} aria-hidden>
      <span>Ion</span>
      <span className="text-right">Départ</span>
      <span className="text-right">{scenarioLabel}</span>
      <span />
      <span className="text-right">Cible</span>
    </div>
    <ul aria-label="Eau de départ et eau corrigée : cibles ion par ion en mg/L (ppm)" className="space-y-0.5">
      {IONS.map((ion) => <IonRow
        key={ion}
        ion={ion}
        start={start[ion]}
        achieved={achieved[ion]}
        style={style}
        scenarioLabel={scenarioLabel}
        selected={selectedIon === ion}
        onSelect={onSelectIon}
        unknown={unknownIons.includes(ion)}
      />)}
    </ul>
    <p className="mt-1 border-t border-cave-800 pt-1.5 text-2xs leading-snug text-cave-400">
      Valeurs exactes en mg/L (ppm). La barre blanche marque le départ ; la plage verte est la cible. « Inconnu » signifie que l’analyse source manque.
    </p>
  </section>
  );
};
