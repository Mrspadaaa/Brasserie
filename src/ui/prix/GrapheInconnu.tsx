import React, { useId } from 'react';
import { graduations } from '../finance/previsions/escalier';
import { montantChf } from '../../domain/finance/ledger';
import { REPERE_390 } from './geometrie';

/**
 * Le graphe de c7c quand le coût du litre est INCONNU (revue du 10.11 : « l'état coût inconnu doit garder la forme de c7c, pas la remplacer par une carte de texte »).
 * Même cadre (viewBox 390 × 318, mêmes repères), mêmes pièces : colonnes, deux échelles, pente, aiguille au prix, règle « à perte · mince · il te reste », cran du prix.
 * Ce qui dépend du coût (la place des zones, la hauteur de la pente, le reste) est dessiné hachuré, avec « ? » : jamais un zéro, jamais un chiffre inventé.
 * Ce qui ne dépend pas du coût reste franc : le zéro, l'axe des prix, l'aiguille au prix saisi, le prix.
 */
const chf = (n: number) => montantChf(n);
const GRIS = '#8A8A8A';
export interface GrapheInconnuProps { prix: number | null; libelleUnite: string; an: boolean; bureau?: boolean }

/** Axe des prix : le premier cran 1-2-5 qui couvre 1,4 × le prix (7 sans prix : l'exemple de c7c). */
export function axePrixInconnu(prix: number | null): { xMax: number; crans: number[] } {
  const donnee = (prix !== null && prix > 0 ? prix : 5) * 1.4;
  const g = graduations(0, Math.round(donnee * 100), 8);
  const crans = g.ticks.map(c => c / 100);
  const pas = crans.length > 1 ? crans[1] - crans[0] : 1;
  const xMax = Math.round(Math.max(pas, Math.ceil(donnee / pas - 1e-9) * pas) * 100) / 100;
  return { xMax, crans: crans.filter(v => v <= xMax + 1e-6) };
}

export function GrapheInconnu({ prix, libelleUnite, an, bureau }: GrapheInconnuProps) {
  const uid = useId().replace(/:/g, ''), hach = `${uid}h`;
  const r = REPERE_390, { xMax: pMax, crans } = axePrixInconnu(prix);
  const x = (p: number) => r.X0 + (p / pMax) * (r.X1 - r.X0), xMax = x(pMax);
  const R = r.YB + 8, RH = 34, dessous = r.YB;
  const aigu = prix !== null && prix > 0 && prix <= pMax ? prix : null;
  const sty = (on: boolean) => ({ fontWeight: on ? 700 : 400, fill: on ? '#111' : '#666' });
  const croise = r.X0 + 56;
  // CP-18 : les « ? » du graphe sont portés par le bouton voisin « ? CHF/L · à compléter › » et par la liste « Il manque ces données ».
  return (
    <svg data-renvoi="aucun" className={bureau ? 'prx-g prx-g-bureau prx-g-inconnu' : 'prx-g prx-g-inconnu'} viewBox="0 0 390 318" role="img" aria-label={`Prix et reste, ${libelleUnite} : coût du litre inconnu, zones et reste à compléter`} data-booster="pente-sur-regle" data-inconnu="">
      <defs><pattern id={hach} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff" /><rect width="3" height="8" fill="#E4E4E4" /></pattern></defs>
      <rect x={r.X0} y={r.T} width={xMax - r.X0} height={dessous - r.T} fill={`url(#${hach})`} />
      <g data-booster="double-echelle" className="prx-ech">
        <text x="52" y="18" textAnchor="end" fontSize="13" style={sty(an)}>/an</text>
        <text x="60" y="18" fontSize="13" style={sty(!an)}>/{libelleUnite}</text>
        <text x={r.X0 - 6} y={r.Y0 + 4} textAnchor="end" className="prx-m" fontSize="13" style={sty(!an)}>0</text>
        <text x={r.X0 - 6} y={r.T + (r.Y0 - r.T) / 2 + 4} textAnchor="end" className="prx-m" fontSize="13" style={sty(!an)}>?</text>
        <text x={r.X0 - 6} y={r.T + 8} textAnchor="end" className="prx-m" fontSize="13" style={sty(!an)}>?</text>
      </g>
      <path d={`M${r.X0} ${r.Y0} H${xMax}`} stroke="#111" strokeWidth="1.2" />
      <path d={`M${r.X0} ${r.T} V${dessous}`} stroke="#111" strokeWidth="1.5" />
      <path d={`M${r.X0 + 8} ${dessous - 6} L${xMax} ${r.T + 4}`} stroke={GRIS} strokeWidth="3.5" strokeDasharray="8 6" data-inconnu-pente="" />
      <circle cx={croise} cy={r.Y0} r="5" fill="#fff" stroke={GRIS} strokeWidth="2.5" strokeDasharray="3 2" />
      {aigu !== null && (() => {
        const ax = x(aigu);
        return <g data-booster="aiguille" data-inconnu-aiguille="">
          <rect x={ax - 2.5} y={r.Y0} width="5" height={R + RH + 4 - r.Y0} rx="2" fill="#111" />
          <circle cx={ax} cy={r.Y0} r="7" fill="#fff" stroke="#111" strokeWidth="2.5" strokeDasharray="3 2" />
          <rect x={Math.min(ax + 10, 388 - 74)} y={r.Y0 - 34} width="74" height="22" rx="6" fill="#fff" stroke={GRIS} strokeDasharray="3 2" /><text x={Math.min(ax + 10, 388 - 74) + 37} y={r.Y0 - 19} textAnchor="middle" className="prx-m" fontSize="13" fontWeight="600" fill="#555">reste ?</text>
        </g>;
      })()}
      <rect x={r.X0} y={R} width={xMax - r.X0} height={RH} rx="8" fill={`url(#${hach})`} stroke="#C8C8C8" strokeDasharray="3 3" />
      <text x={(r.X0 + xMax) / 2} y={R + 22} textAnchor="middle" fontSize="13" fontWeight="600" fill="#6A6A6A">à perte · mince · il te reste</text>
      {crans.filter(v => v < pMax).map(v => <text key={v} x={x(v)} y={R + RH + 18} textAnchor="middle" className="prx-m" fontSize="12" fill="#666">{String(v).replace('.', ',')}</text>)}
      <text x={xMax} y={R + RH + 18} textAnchor="end" className="prx-m" fontSize="12" fill="#666">{String(pMax).replace('.', ',')}</text>
      {aigu !== null && <><rect x={x(aigu) - 28} y={R + RH + 4} width="56" height="22" rx="6" fill="#111" /><text x={x(aigu)} y={R + RH + 19} textAnchor="middle" className="prx-m" fontSize="13" fontWeight="600" fill="#fff">{chf(aigu)}</text></>}
      <text x={r.X0} y={R + RH + 42} className="prx-m" fontSize="13" fontWeight="600" fill="#6A6A6A">coût ?</text>
    </svg>
  );
}
