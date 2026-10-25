// Les barres divergentes de q2b (lot 15, s5 puis l5b : « Les bar de ce type sont plus informative donc meilleur »,
// D92), autour d'un axe central noir qui traverse toute la liste des voies :
// - à droite de l'axe, ce qui monte ; à gauche, ce qui baisse ; une demi-piste = 3 crans du style (au style) ou
//   50 points (absolu), comme generateur-q2b.mjs (pctBar) ;
// - un couloir par objectif : les « plus » en haut, les « moins » à gauche du couloir du bas (q2b : floral en haut,
//   agrumes à droite et résineux à gauche en bas) ;
// - la barre pleine si les fiches marquent la famille, pâle et cernée si elles la citent, blanche cernée sinon ou
//   quand elle baisse ; l'orangé au-delà du style ; hachures quand l'effet n'est pas établi (jamais 0) ;
// - le trait fin de la zone : de ma bière au haut de la bande du style, avec son repère ;
// - la visée en tirets verticaux sur toute la hauteur (Graphe).
// La bande « ‹ visée | visée › » et ses flèches d'axe ne reviennent pas : « Ça c'est inutile » (D91).
import type { CSSProperties, ReactNode } from 'react';
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { COULEURS, COURT, nombre, type Echelle } from '../../commun';
import type { Objectif } from './voies';

/** Fraction (0 à 1) d'une demi-piste pour un écart de `e` points. */
export const demi = (e: number, cran: number, echelle: Echelle) => Math.abs(e) / (echelle === 'style' ? 3 * cran : 50);
const pc = (k: number) => `${(Math.max(0, Math.min(1, k)) * 100).toFixed(2)}%`;
/** Position horizontale, dans le graphe, d'un point à k demi-piste de l'axe (k < 0 : à gauche). L'axe est au milieu
 * d'une gouttière de 22 px. */
export const xGraphe = (k: number) => {
  const c = Math.max(-1, Math.min(1, k));
  return c >= 0 ? `calc(50% + 11px + (50% - 11px) * ${c.toFixed(4)})` : `calc(50% - 11px - (50% - 11px) * ${(-c).toFixed(4)})`;
};

export type NiveauBarre = 'mq' | 'ci' | 'sf';
/** Le texte d'un effet en crans, comme q2b : « +1 cran », « +2 crans », « ≈ + » sous le demi-cran. */
export const enCrans = (c: number) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : `${c > 0 ? '+' : '−'}${Math.round(Math.abs(c))} cran${Math.round(Math.abs(c)) >= 2 ? 's' : ''}`);

interface Item { o: Objectif; cote: 'd' | 'g'; couloir: number }
/** Les couloirs : un par objectif « plus » (en haut), les « moins » à gauche des derniers ; un effet de sens contraire
 * passe de l'autre côté de son couloir, ou dans un couloir de plus s'il y a déjà quelqu'un. */
function couloirs(objectifs: Objectif[], effets: Record<FamilyId, number | null>): { items: Item[]; n: number } {
  const plus = objectifs.filter((o) => o.sens > 0), moins = objectifs.filter((o) => o.sens < 0);
  let n = Math.max(1, plus.length, moins.length);
  const pris = new Set<string>();
  const items: Item[] = [];
  const poser = (o: Objectif, voulu: number) => {
    const e = effets[o.f];
    const cote: 'd' | 'g' = e == null ? (o.sens > 0 ? 'd' : 'g') : e >= 0 ? 'd' : 'g';
    let c = voulu;
    while (pris.has(`${c}${cote}`)) c += 1;
    n = Math.max(n, c + 1);
    pris.add(`${c}${cote}`);
    items.push({ o, cote, couloir: c });
  };
  plus.forEach((o, i) => poser(o, i));
  moins.forEach((o, j) => poser(o, Math.max(0, Math.max(1, plus.length) - moins.length + j)));
  return { items, n };
}

/** Une rangée de barres divergentes (sous une voie, ou une fois pour un groupe au même effet). */
export function Divergent({ objectifs, effets, hors, niveau, echelle, cran, bande, etiquettes = false, etat }: {
  objectifs: Objectif[]; effets: Record<FamilyId, number | null>; hors: FamilyId[]; niveau: (f: FamilyId, e: number) => NiveauBarre;
  echelle: Echelle; cran: (f: FamilyId) => number; bande: (f: FamilyId) => [number, number] | null; etiquettes?: boolean; etat?: string;
}) {
  const { items, n } = couloirs(objectifs, effets);
  const cotes: Record<'g' | 'd', ReactNode[]> = { g: [], d: [] };
  for (const { o, cote, couloir } of items) {
    const e = effets[o.f], c = cran(o.f), b = bande(o.f), top = couloir * 16;
    const coul = COULEURS[o.f];
    const style = { top, ['--pq-c' as string]: coul.base } as CSSProperties;
    // La zone : de ma bière au bord de la bande du style, du côté où l'objectif va (q2b : rien pour le « moins »).
    const zoneK = o.avant == null || !b || o.sens < 0 ? null : cote === 'd' ? (b[1] - o.avant) / (echelle === 'style' ? 3 * c : 50) : (o.avant - b[0]) / (echelle === 'style' ? 3 * c : 50);
    const zone = zoneK != null && zoneK > 0 ? (
      <i key={`z${o.f}`} data-role="zone" aria-hidden="true" className={`pq-sg-zt ${zoneK <= 1 ? 'pq-sg-zt-repere' : ''}`} style={{ ...style, width: pc(zoneK) }} />
    ) : null;
    if (zone) cotes[cote].push(zone);
    if (e == null) {
      cotes[cote].push(<i key={o.f} data-role="effet" data-famille={o.f} data-inconnu="" role="img" aria-label={`${COURT[o.f]} : effet non établi`} className="pq-sg-bar pq-sg-bar-inconnu pq-hachure" style={style} />);
      continue;
    }
    const k = demi(e, c, echelle), nv = niveau(o.f, e);
    const crans = e / c;
    const lab = etiquettes ? (echelle === 'style' ? enCrans(crans) : `${e >= 0 ? '+' : '−'}${nombre(Math.abs(e), 0)}`) : null;
    cotes[cote].push(
      <i key={o.f} data-role="effet" data-famille={o.f} data-effet={e.toFixed(2)} role="img"
        aria-label={`${COURT[o.f]} ${e >= 0 ? '+' : '−'}${nombre(Math.abs(crans), 1)} cran${hors.includes(o.f) ? ', hors style' : ''}`}
        className={`pq-sg-bar pq-sg-bar-${nv} ${k > 1 ? 'pq-sg-bar-depasse' : ''}`} style={{ ...style, width: pc(k) }} />,
    );
    if (hors.includes(o.f)) {
      // L'orangé « hors style » : du bord de la bande (ou des 5 derniers %) jusqu'au bout de la barre.
      const debut = zoneK != null && zoneK > 0 && zoneK < k ? zoneK : Math.max(0, Math.min(1, k) - 0.05);
      cotes[cote].push(<i key={`h${o.f}`} aria-hidden="true" className="pq-sg-hs" style={{ ...style, ['--pq-d' as string]: pc(debut), width: pc(Math.min(1, k) - debut) }} />);
    }
    if (lab) cotes[cote].push(<span key={`l${o.f}`} className="pq-sg-lab" style={{ top: top - 3, ['--pq-k' as string]: pc(k), color: coul.texte }}>{lab}</span>);
  }
  return (
    <div className="pq-sg-bars" style={{ height: n * 16 - 6 }} {...(etat ? { 'data-etat': etat } : {})}>
      <div className="pq-sg-m pq-sg-m-g">{cotes.g}</div>
      <div className="pq-sg-gut" aria-hidden="true" />
      <div className="pq-sg-m pq-sg-m-d">{cotes.d}</div>
    </div>
  );
}

/** Le graphe de q2b : l'axe noir central sur toute la liste et la visée de chaque objectif « plus » en tirets. */
export function Graphe({ objectifs, echelle, cran, children }: { objectifs: Objectif[]; echelle: Echelle; cran: (f: FamilyId) => number; children: ReactNode }) {
  const xs = [...new Set(objectifs.filter((o) => o.sens > 0).map((o) => xGraphe(demi(o.visee != null && o.avant != null ? o.visee - o.avant : o.requis, cran(o.f), echelle))))];
  return (
    <div className="pq-sg-graphe" data-role="graphe">
      <i aria-hidden="true" className="pq-sg-axe" />
      {xs.map((x) => <i key={x} aria-hidden="true" data-role="visee" className="pq-sg-vl" style={{ left: x }} />)}
      {children}
    </div>
  );
}
