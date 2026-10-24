// Vue « Radar » de Suggérer (q2b : « Barres / Radar ») : ma bière, la zone du style, et la bière après chaque voie
// retenue pour la comparaison. Au style : chaque axe va de 0 à deux fois le haut de la bande (la zone sur la moitié du
// rayon) ; absolu : 0 → 110. Une famille inconnue pour cette bière a son nom suivi de « ? » et son secteur hachuré.
import type { FamilyId, StyleScale } from '../../../../src/engine';
import { COURT, ROUE, type Echelle } from '../../commun';
import type { BiereLue } from '../../moteur';

const R = 112, C = 150;
const TRAITS = ['6 3', '2 3', '9 3 2 3', '1 2'];

export function Radar({ biere, sc, echelle, series, plein = false }: {
  biere: BiereLue; sc: StyleScale; echelle: Echelle;
  series: { cle: string; nom: string; effets: Record<FamilyId, number | null> }[];
  /** Mode Radar de la base v4.10 : une voie montrée, en plein, avec ses sommets. */
  plein?: boolean;
}) {
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / ROUE.length;
  const max = (f: FamilyId) => (echelle === 'style' && sc.families[f].band ? 2 * sc.families[f].band![1] : 110);
  const pt = (i: number, v: number) => { const f = ROUE[i], k = Math.max(0, Math.min(1.08, v / max(f))); return [C + Math.cos(ang(i)) * R * k, C + Math.sin(ang(i)) * R * k]; };
  const bord = (i: number) => `${(C + Math.cos(ang(i)) * R).toFixed(1)},${(C + Math.sin(ang(i)) * R).toFixed(1)}`;
  const poly = (vals: (number | null)[]) => vals.map((v, i) => pt(i, v ?? 0).map((x) => x.toFixed(1)).join(',')).join(' ');
  const avant = ROUE.map((f) => biere.profil[f].valeur?.centre ?? null);
  const zone = ROUE.map((f) => sc.families[f].band?.[1] ?? null);
  const inconnue = (f: FamilyId) => biere.profil[f].valeur == null;
  return (
    <figure data-role="radar" className="pq-suggerer-radar">
      <svg data-radar="" data-objet="suggerer" viewBox="-34 -4 368 308" className="w-full max-w-[23rem] mx-auto block" role="img"
        aria-label={`Radar : ma bière et ${series.map((s) => s.nom).join(', ') || 'aucune voie retenue'}`}>
        {[0.25, 0.5, 0.75, 1].map((k) => <circle key={k} cx={C} cy={C} r={R * k} className="pq-suggerer-radar-grille" />)}
        {ROUE.map((f, i) => {
          const [x, y] = pt(i, max(f));
          return <line key={f} x1={C} y1={C} x2={x} y2={y} className="pq-suggerer-radar-grille" />;
        })}
        {ROUE.map((f, i) => inconnue(f) && (
          <path key={f} className="pq-suggerer-radar-inconnu" d={`M${C},${C} L${bord(i - 0.5)} A${R},${R} 0 0 1 ${bord(i + 0.5)} Z`} />
        ))}
        <polygon points={poly(zone)} className="pq-suggerer-radar-zone" />
        {series.map((s, j) => {
          const vals = ROUE.map((f, i) => (avant[i] == null ? null : avant[i]! + (s.effets[f] ?? 0)));
          return (
            <g key={s.cle}>
              <polygon data-serie={s.cle} points={poly(vals)} className={plein ? 'pq-sg-radar-plein' : 'pq-suggerer-radar-serie'} strokeDasharray={plein ? undefined : TRAITS[j % TRAITS.length]} />
              {plein && vals.map((v, i) => v != null && <circle key={i} cx={pt(i, v)[0]} cy={pt(i, v)[1]} r={3.2} className="pq-sg-radar-sommet" />)}
            </g>
          );
        })}
        <polygon data-serie="ma-biere" points={poly(avant)} className="pq-suggerer-radar-biere" />
        {ROUE.map((f, i) => {
          const a = ang(i), x = C + Math.cos(a) * (R + 22), y = C + Math.sin(a) * (R + 16);
          return <text key={f} x={x} y={y} textAnchor={Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end'} dominantBaseline="middle"
            className="pq-suggerer-radar-nom">{COURT[f]}{inconnue(f) ? '?' : ''}</text>;
        })}
      </svg>
      <figcaption className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-cave-200">
        <span className="inline-flex items-center gap-1"><svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" className="pq-suggerer-radar-biere" /></svg>ma bière</span>
        {series.map((s, j) => (
          <span key={s.cle} className="inline-flex items-center gap-1">
            {plein ? <svg width="14" height="10" aria-hidden="true"><rect x="1" y="1" width="12" height="8" rx="2" className="pq-sg-radar-plein" /></svg> : <svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" className="pq-suggerer-radar-serie" strokeDasharray={TRAITS[j % TRAITS.length]} /></svg>}{s.nom}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
