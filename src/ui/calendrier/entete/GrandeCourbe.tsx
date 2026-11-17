import React from 'react';
import { X } from 'lucide-react';
import type { CourbeCaisse, MouvementNomme } from '../../../domain/calendrierCaisse';
import { chf, classeRangee, creuxDe, escalier, MOIS_MIN, moisDeSemaine, type Geo, type SoldeSemaine } from './Courbe';
import { LectureDetail } from './LectureCourbe';

/**
 * La courbe en grand (E12, c3-a) : un appui long sur la courbe lui donne la place de la frise, avec ses axes (0 au bas, les mois). La semaine
 * sous le doigt se détaille, le doigt continue de lire, × ferme. En paysage, la courbe et le détail sont côte à côte.
 *
 * MODE GRAPH (D-173, D-188) — nouveau, à valider : chaque segment de la courbe prend la couleur de la rangée de son plus gros mouvement ; le
 * creux est marqué ; la frise reste en fine bande colorée dessous. L'analyse de g4b est appliquée : axe à 0 (pas tronqué), couleurs des
 * rangées seules (une semaine sans mouvement est neutre), pas de fond teinté, peu d'étiquettes (le creux, la semaine lue), légende une fois.
 */

const MARGE_G = 50, MARGE_D = 6, HAUT = 16, BANDE = 8, MOIS = 18;

export const NOMS_RANGEES: Record<string, string> = {
  brassin: 'Brassins', fete: 'Fêtes', vente: 'Ventes', achat: 'Achats', travaux: 'Travaux', activite: 'Activités', papier: 'Papiers'
};

/** La rangée du plus gros mouvement d'une semaine ; `autre` quand elle n'a rien de nommé. */
export function rangeeDeSemaine(s: SoldeSemaine, rangeeDe?: (m: MouvementNomme) => string | undefined): string {
  let gros: MouvementNomme | null = null;
  for (const m of s.mouvements) if (!gros || Math.abs(m.centimes) > Math.abs(gros.centimes)) gros = m;
  return gros ? classeRangee(rangeeDe?.(gros)) : 'autre';
}

/** La géométrie de la grande courbe : l'axe, 0 au bas (ou plus bas si le libre devient négatif), x par semaine. */
export function geoGrande(courbe: readonly SoldeSemaine[], largeur: number, hauteur: number): Geo & { xl: number } {
  const n = Math.max(1, courbe.length);
  const valeurs = courbe.flatMap(s => [s.libre, s.caisse]);
  const lo = Math.min(0, ...valeurs);
  const hiBrut = Math.max(1, ...valeurs);
  const bas = hauteur - BANDE - MOIS - 6;
  const unit = (largeur - MARGE_G - MARGE_D) / n;
  const hi = hiBrut + (hiBrut - lo) * 0.04;
  return { largeur, hauteur, haut: HAUT, bas, unit, lo, hi, xl: MARGE_G, x: i => MARGE_G + i * unit, y: v => bas - ((v - lo) / (hi - lo)) * (bas - HAUT) };
}

/** Largeur du dessin : toute la largeur, ou 62 % en paysage (le détail est à côté). */
export const largeurGrande = (largeur: number, paysage: boolean): number => (paysage ? Math.round(largeur * 0.62) : largeur);

const PAS = [50000, 100000, 200000, 250000, 500000, 1000000, 2000000, 2500000, 5000000];
const graduations = (g: Geo): number[] => {
  const pas = PAS.find(p => (g.hi - g.lo) / p <= 5) ?? 5000000;
  const sortie: number[] = [];
  for (let v = Math.ceil(g.lo / pas) * pas; v <= g.hi; v += pas) sortie.push(v);
  return sortie;
};

export interface GrandeCourbeProps {
  courbe: CourbeCaisse;
  /** La rangée d'un mouvement (sa couleur) : vient des choses du modèle. */
  rangeeDe?: (m: MouvementNomme) => string | undefined;
  largeur: number;
  hauteur: number;
  paysage: boolean;
  /** Semaine lue (index dans la courbe) ; par défaut le doigt qui a posé l'appui long. */
  lecture: number | null;
  onFermer: () => void;
  reference?: React.Ref<HTMLDivElement>;
  gestes?: React.HTMLAttributes<HTMLDivElement>;
}

export function GrandeCourbe({ courbe: courbeC, rangeeDe, largeur, hauteur, paysage, lecture, onFermer, reference, gestes }: GrandeCourbeProps) {
  const courbe = courbeC.semaines;
  const n = courbe.length;
  const largSvg = largeurGrande(largeur, paysage);
  const g = geoGrande(courbe, largSvg, hauteur);
  const creux = creuxDe(courbe);
  const rangees = courbe.map(s => rangeeDeSemaine(s, rangeeDe));
  const presentes = Object.keys(NOMS_RANGEES).filter(r => rangees.includes(r));
  const ticks = graduations(g);
  const y0 = g.y(0);
  const cx = lecture !== null && lecture >= 0 && lecture < n ? g.x(lecture) + g.unit / 2 : null;
  const labelsMois: { x: number; t: string }[] = [];
  let m0 = -1, fin = -Infinity;
  courbe.forEach((s, i) => {
    const m = moisDeSemaine(s.lundi);
    if (m === m0) return;
    m0 = m;
    const x = g.x(i) + 3, w = MOIS_MIN[m].length * 8;
    if (i > 0 && x > fin + 4 && x + w <= largSvg) { labelsMois.push({ x, t: MOIS_MIN[m] }); fin = x + w; }
  });
  const cteGauche = creux ? g.x(creux.index) + g.unit / 2 > largSvg / 2 : false;
  const yCreux = creux ? g.y(creux.centimes) : 0;
  return (
    <section className={paysage ? 'ent-gc ent-gc--cote' : 'ent-gc'} aria-label="La courbe en grand" data-vue="graph">
      <div className="ent-gc-h">
        <div className="ent-gc-t">Libre, sur l’année<span>caisse en gris</span></div>
        <button type="button" className="ent-x" aria-label="Revenir à la frise" onClick={e => { e.stopPropagation(); onFermer(); }}><X size={20} aria-hidden="true" /></button>
      </div>
      <div className="ent-gc-c">
        <div ref={reference} className="ent-gc-w" {...gestes}>
          <svg className="ent-svg ent-gs" width={largSvg} height={hauteur} viewBox={`0 0 ${largSvg} ${hauteur}`} role="img"
            aria-label={`La courbe libre sur ${n} semaines${creux ? `, au plus serré en S${creux.numero} : ${chf(creux.centimes)} CHF` : ''} ; chaque segment a la couleur de la rangée de son plus gros mouvement`}>
            {ticks.map(v => (
              <g key={v}><line className={v === 0 ? 'ent-grad ent-grad-zero' : 'ent-grad'} x1={g.xl} x2={largSvg - MARGE_D} y1={g.y(v)} y2={g.y(v)} /><text className="ent-axe" x={g.xl - 6} y={g.y(v) + 5} textAnchor="end">{chf(v)}</text></g>
            ))}
            {g.lo < 0 && !ticks.includes(0) && <line className="ent-grad ent-grad-zero" x1={g.xl} x2={largSvg - MARGE_D} y1={y0} y2={y0} />}
            <path className="ent-caisse" d={escalier(courbe.map(s => s.caisse), g)} />
            {courbe.map((s, i) => (
              <path key={s.lundi} className={`ent-sgm ent-c-${rangees[i]}`} d={`${i > 0 ? `M${g.x(i).toFixed(1)} ${g.y(courbe[i - 1].libre).toFixed(1)}V${g.y(s.libre).toFixed(1)}` : `M${g.x(i).toFixed(1)} ${g.y(s.libre).toFixed(1)}`}H${g.x(i + 1).toFixed(1)}`} />
            ))}
            {labelsMois.map(m => <text key={m.x} className="ent-mois" x={m.x} y={g.hauteur - BANDE - 4}>{m.t}</text>)}
            {courbe.map((s, i) => <rect key={`b${s.lundi}`} className={`ent-bd-fin ent-c-${rangees[i]}`} x={g.x(i) + 0.5} y={g.hauteur - BANDE} width={Math.max(1, g.unit - 1)} height={BANDE} />)}
            {cx !== null && lecture !== null && (
              <g className="ent-curseur" aria-hidden="true">
                <line x1={cx} x2={cx} y1={g.haut} y2={g.bas} />
                <circle cx={cx} cy={g.y(courbe[lecture].libre)} r={6} className="ent-cur-pt" />
                <text x={cx} y={g.haut - 3} textAnchor="middle" className="ent-cur-s">{`S${courbe[lecture].numero}`}</text>
              </g>
            )}
            {creux && (
              <g className="ent-gc-creux">
                <circle cx={g.x(creux.index) + g.unit / 2} cy={yCreux} r={6.5} className="ent-creux-pt" />
                <text className="ent-nom" x={g.x(creux.index) + g.unit / 2 + (cteGauche ? -10 : 10)} y={Math.max(g.haut + 12, yCreux - 12)} textAnchor={cteGauche ? 'end' : 'start'}>
                  {`creux S${creux.numero} · `}<tspan className={creux.centimes < 0 ? 'ent-m' : 'ent-creux-m'}>{chf(creux.centimes)}</tspan>
                </text>
              </g>
            )}
          </svg>
        </div>
        {lecture !== null && courbe[lecture] && <div className="ent-gc-d"><LectureDetail courbe={courbeC} index={lecture} rangeeDe={rangeeDe} libre /></div>}
      </div>
      {presentes.length > 0 && (
        <ul className="ent-leg" aria-label="Les couleurs sont celles des rangées">
          {presentes.map(r => <li key={r} className={`ent-r-${r}`}><i aria-hidden="true" />{NOMS_RANGEES[r]}</li>)}
        </ul>
      )}
    </section>
  );
}
