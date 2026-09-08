import React from 'react';
import { WaterIons } from '../types';
import { ION_LABEL, ION_SYMBOL } from '../domain/water';
import { StyleWater, positionInRange, styleIonRange } from '../domain/waterStyles';
import { formatIonReading } from './waterReadings';

interface IonComparisonProps {
  start: WaterIons;
  achieved: WaterIons;
  style: StyleWater;
}

const IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];
const columns = 'grid grid-cols-[4.5rem_4.75rem_minmax(1rem,1fr)_4.25rem] items-center gap-x-2';

/** Chaque ligne compare un ion à sa propre cible ; les barres ne comparent pas les ions entre eux. */
const IonRow: React.FC<{
  ion: keyof WaterIons;
  start: number;
  achieved: number;
  style: StyleWater;
}> = ({ ion, start, achieved, style }) => {
  const range = styleIonRange(style, ion);
  const targeted = !style.untargetedIons?.includes(ion);
  const outside = !targeted ? 0 : positionInRange(achieved, range);
  const scale = Math.max(range.max / 0.66, start * 1.08, achieved * 1.08, 1);
  const pct = (v: number) => Math.max(0, Math.min(100, (v / scale) * 100));
  const before = formatIonReading(start);
  const after = formatIonReading(achieved, targeted ? range : undefined);
  const changed = before !== after;
  const status = !targeted ? 'sans cible' : outside < 0 ? 'sous la cible' : outside > 0 ? 'au-dessus de la cible' : 'dans la cible';

  return (
    <li className={`${columns} py-1.5`} aria-label={`${ION_LABEL[ion]} : départ ${before}, corrigée ${after} ppm ; ${status}${targeted ? ` ${range.min} à ${range.max} ppm` : ''}`}>
      <span className="text-2xs text-cave-200" title={ION_LABEL[ion]}>
        {ION_SYMBOL[ion]}{ion === 'hco3' && <span className="text-cave-400"> éq.</span>}
      </span>
      <span className="text-right whitespace-nowrap">
        {changed && <span className="text-2xs text-cave-400">{before}<span aria-hidden> → </span></span>}
        <span className={`font-semibold tabular-nums text-sm ${outside === 0 ? 'text-cave-50' : 'text-ebc-amber'}`}>{after}</span>
      </span>
      <span className="relative min-w-0 h-1.5 rounded-full bg-cave-800" aria-hidden>
        {targeted && <span className="absolute inset-y-0 rounded-full bg-hop/25" style={{ left: `${pct(range.min)}%`, right: `${100 - pct(range.max)}%` }} />}
        {changed && <span className="absolute inset-y-0 w-0.5 bg-water" style={{ left: `${pct(start)}%` }} />}
        <span className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-cave-950 ${!targeted ? 'bg-cave-400' : outside === 0 ? 'bg-hop' : 'bg-ebc-amber'}`} style={{ left: `calc(${pct(achieved)}% - 4px)` }} />
      </span>
      <span className="text-2xs text-cave-400 text-right whitespace-nowrap tabular-nums">
        {targeted ? `${range.min}–${range.max}` : '—'}
      </span>
    </li>
  );
};

export const IonComparison: React.FC<IonComparisonProps> = ({ start, achieved, style }) => (
  <div className="panel px-2.5 py-2">
    <div className={`${columns} pb-1 text-2xs text-cave-400`} aria-hidden>
      <span>Minéral</span>
      <span className="text-right">Corrigée</span>
      <span />
      <span className="text-right">Cible ppm</span>
    </div>
    <ul aria-label="Eau de départ et eau corrigée, face à la fourchette du style, en ppm">
      {IONS.map((ion) => <IonRow key={ion} ion={ion} start={start[ion]} achieved={achieved[ion]} style={style} />)}
    </ul>
    <p className="mt-1 border-t border-cave-800 pt-1.5 text-2xs leading-snug text-cave-400">
      Départ → corrigée, en ppm (mg/L).
    </p>
  </div>
);
