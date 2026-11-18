import React from 'react';
import { X } from 'lucide-react';
import type { CourbeCaisse, MouvementNomme } from '../../../domain/calendrierCaisse';
import { chf, classeRangee, creuxDe, escalier, largeurTexte, MOIS_MIN, moisDeSemaine, semaineCourte, type Boite, type Geo, type SoldeSemaine } from './Courbe';
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

/** La classe du trait de la caisse dans la grande courbe : ni `ent-c-<rangée>`, ni le gris de Papiers (CRITIQUE-5 n° 16). */
export const CLASSE_CAISSE = 'ent-caisse ent-gc-caisse';

/**
 * La rangée du plus gros mouvement d'une semaine ; `autre` (neutre) quand elle n'a rien de nommé. La tendance de Finances n'est jamais un
 * mouvement nommé (`SoldeSemaine.mouvements` l'exclut) : une semaine à tendance seule reste neutre.
 */
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

/** Une série en escalier (libre ou caisse) touche-t-elle cette boîte ? Marches horizontales et contremarches comprises. */
function toucheSerie(valeurs: readonly number[], g: Geo, b: Boite): boolean {
  for (let j = 0; j < valeurs.length; j++) {
    const x0 = g.x(j), x1 = g.x(j + 1), y = g.y(valeurs[j]);
    if (x1 >= b.l && x0 <= b.r && y >= b.t && y <= b.b) return true;
    if (j > 0 && x0 >= b.l && x0 <= b.r) {
      const a = g.y(valeurs[j - 1]);
      if (Math.min(a, y) <= b.b && Math.max(a, y) >= b.t) return true;
    }
  }
  return false;
}

/** L'écart, en px, entre le centre du point du creux et le texte de son étiquette : le fond (3 px) laisse 4 px libres autour du point (r 6,5). */
const ECART_CREUX = 14;
/**
 * Les hauteurs essayées (px, ligne de base du texte sous le point), de la plus proche à la plus lointaine : d'abord la ligne du point (texte
 * centré sur lui, +4), puis de 2 en 2 px vers le haut et le bas ; jamais plus de 48 px au-dessus ni 40 px au-dessous.
 */
const HAUTEURS_CREUX = Array.from({ length: 27 }, (_, k) => 4 - 2 * k).concat(Array.from({ length: 18 }, (_, k) => 6 + 2 * k))
  .sort((a, b) => Math.abs(a - 4) - Math.abs(b - 4) || a - b);

/**
 * La place de l'étiquette « creux S43 · −3 147 » (E12, CRITIQUE-4 n° 27, CRITIQUE-9 n° 5) : ANCRÉE SUR LE POINT DU CREUX, dans toutes les
 * géométries (portrait, paysage, 1280), jamais sur le curseur ni au centre.
 * - D'abord à droite du point, à `ECART_CREUX` px ; si elle n'y tient pas dans le dessin, à gauche du point ; jamais ailleurs sur le côté.
 * - En hauteur, de la plus proche du point à la plus lointaine (48 px au plus) : la première place qui reste dans le dessin et que ni le libre ni
 *   la caisse ne traversent ; faute de mieux, la première qui tient dans le dessin, son fond la garde lisible (le tracé passe dessous).
 * Avant (critique 9, paysage-cave-21), des places à 40 et 80 px du point et jusqu'à 110 px plus haut l'emportaient sur la proximité : en
 * paysage, le libellé finissait au milieu du dessin, contre le curseur de S20.
 */
export function placeEtiquetteCreux(courbe: readonly SoldeSemaine[], g: Geo & { xl: number }, largSvg: number, index: number, centimes: number, w: number): { x: number; y: number; ancre: 'start' | 'end'; boite: Boite } {
  const cx = g.x(index) + g.unit / 2, cy = g.y(centimes);
  const libres = courbe.map(s => s.libre), caisses = courbe.map(s => s.caisse);
  const dedansX = (b: Boite) => b.l >= g.xl && b.r <= largSvg - MARGE_D;
  const dedansY = (b: Boite) => b.t >= 0 && b.b <= g.bas;
  const place = (ancre: 'start' | 'end', dy: number) => {
    const x = cx + (ancre === 'end' ? -ECART_CREUX : ECART_CREUX), y = cy + dy;
    const l = ancre === 'end' ? x - w : x;
    return { x, y, ancre, boite: { l: l - 3, r: l + w + 3, t: y - 13, b: y + 4 } };
  };
  // Les côtés où elle tient dans le dessin : à droite d'abord, puis à gauche ; si aucun (dessin plus étroit que le texte), celui qui déborde le
  // moins.
  const droite = place('start', 0), gauche = place('end', 0);
  const cotes = (['start', 'end'] as const).filter(a => dedansX((a === 'start' ? droite : gauche).boite));
  if (!cotes.length) cotes.push((droite.boite.r - (largSvg - MARGE_D)) <= (g.xl - gauche.boite.l) ? 'start' : 'end');
  // Contre le point, de la plus proche à la plus lointaine ; à égale distance, la droite. La gauche ne passe devant qu'avec 6 px de moins.
  const places = cotes.flatMap(a => HAUTEURS_CREUX.map(dy => ({ ...place(a, dy), cout: Math.abs(dy - 4) + (a === 'end' ? 6 : 0) })))
    .sort((p, q) => p.cout - q.cout).map(({ cout: _cout, ...p }) => p);
  // Hors du tracé si une place contre le point le permet ; sinon la plus proche, à droite si elle y tient, sur son fond (le tracé passe dessous).
  const trouvee = places.find(p => dedansY(p.boite) && !toucheSerie(libres, g, p.boite) && !toucheSerie(caisses, g, p.boite))
    ?? places.find(p => dedansY(p.boite));
  if (trouvee) return trouvee;
  // Un dessin trop bas pour toutes ces hauteurs : la ligne du point, ramenée dans le dessin.
  const p = places[0];
  const decale = Math.max(0, -p.boite.t) - Math.max(0, p.boite.b - g.bas);
  return { ...p, y: p.y + decale, boite: { ...p.boite, t: p.boite.t + decale, b: p.boite.b + decale } };
}

/** En portrait, sous le dessin : le titre (44 px) et la place fixe du détail de la semaine (4 lignes : la date, puis trois mouvements, ou deux
 * et « la semaine ») ; la place ne change pas avec la semaine lue, la légende ne bouge donc pas sous le doigt (CRITIQUE-12 n° 5). */
export const TITRE_GRANDE = 44;
export const PLACE_DETAIL = 94;
/** Une ligne de la légende : 4 px de marge haute, 20 px de texte, 2 px d'écart. */
export const LIGNE_LEGENDE = 26;

/**
 * Le haut de la légende en portrait (CRITIQUE-12 n° 5, E12, E35) : le + volant reste à sa place (D-17) ; la première ligne de la légende finit
 * au-dessus de lui, la dernière seule est à sa hauteur, et la réserve `ent-leg--plus` (la largeur du +) la garde à sa gauche. Sans + visible,
 * deux lignes tiennent au-dessus des onglets.
 */
export function hautLegende(ongletsHaut: number, plusHaut: number | null): number {
  const sansPlus = ongletsHaut - 2 * LIGNE_LEGENDE - 4;
  return plusHaut === null ? sansPlus : Math.min(sansPlus, plusHaut - LIGNE_LEGENDE);
}

/** Le haut du + volant fermé, lu à l'écran (`.floating-actions > button`) ; null s'il n'est pas affiché. */
export function hautDuPlus(): number | null {
  if (typeof document === 'undefined') return null;
  for (const b of Array.from(document.querySelectorAll<HTMLElement>('.floating-actions > button'))) {
    const r = b.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r.top;
  }
  return null;
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
  // CRITIQUE-6 n° 12 : le neutre (semaine sans mouvement nommé) est nommé lui aussi ; « tendance seule » quand chacune de ces semaines ne
  // bouge que par la tendance de Finances, sinon « sans mouvement ».
  const neutres = courbe.filter((_, i) => rangees[i] === 'autre');
  const avecTendance = neutres.filter(s => s.tendance !== 0).length;
  const nomNeutre = !avecTendance ? 'sans mouvement' : avecTendance === neutres.length ? 'tendance seule' : 'rien de nommé (tendance)';
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
  const yCreux = creux ? g.y(creux.centimes) : 0;
  // CRITIQUE-6 n° 18 : la semaine du creux dite comme l'en-tête (« creux S44 ’27 · −6 397 »).
  const texteCreux = creux ? `creux ${semaineCourte(creux.lundi, courbe[0]?.lundi ?? creux.lundi)} · ` : '';
  const etCreux = creux ? placeEtiquetteCreux(courbe, g, largSvg, creux.index, creux.centimes, largeurTexte(texteCreux) + largeurTexte(chf(creux.centimes), true)) : null;
  // La légende, une fois (E12, analyse g4b) : la caisse, les seules couleurs de rangée présentes sur le tracé, puis le neutre s'il y est.
  // CRITIQUE-12 n° 5 : en portrait, sa dernière ligne finit à gauche du + volant (réserve `ent-leg--plus`), les termes restent entiers.
  const legende = (
    <ul className={paysage ? 'ent-leg' : 'ent-leg ent-leg--plus'} data-reserve-plus={paysage ? undefined : 'oui'} aria-label="Légende : la caisse, et les couleurs du tracé">
      <li className="ent-leg-caisse" data-legende="caisse"><i aria-hidden="true" />caisse</li>
      {presentes.map(r => <li key={r} className={`ent-r-${r}`} data-legende={r}><i aria-hidden="true" />{NOMS_RANGEES[r]}</li>)}
      {neutres.length > 0 && <li className="ent-r-autre ent-leg-autre" data-legende="autre"><i aria-hidden="true" />{nomNeutre}</li>}
    </ul>
  );
  return (
    <section className={paysage ? 'ent-gc ent-gc--cote' : 'ent-gc'} aria-label="La courbe en grand" data-vue="graph">
      <div className="ent-gc-h">
        <div className="ent-gc-t">Libre, sur l’année</div>
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
            {/* CRITIQUE-5 n° 16 : la caisse en pointillé, d'un jeton qui n'est la couleur d'aucune rangée ni un gris voisin de Papiers (`--repere`) */}
            <path className={CLASSE_CAISSE} data-caisse d={escalier(courbe.map(s => s.caisse), g)} />
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
            {creux && etCreux && (
              <g className="ent-gc-creux">
                <circle cx={g.x(creux.index) + g.unit / 2} cy={yCreux} r={6.5} className="ent-creux-pt" />
                {/* Posée hors du tracé, sur le fond : jamais barrée (CRITIQUE-4 n° 27). */}
                <rect className="ent-gc-fond" data-creux-fond x={etCreux.boite.l} y={etCreux.boite.t} width={etCreux.boite.r - etCreux.boite.l} height={etCreux.boite.b - etCreux.boite.t} rx={4} />
                <text className="ent-nom" data-creux-etiquette x={etCreux.x} y={etCreux.y} textAnchor={etCreux.ancre}>
                  {texteCreux}<tspan className={creux.centimes < 0 ? 'ent-m' : 'ent-creux-m'}>{chf(creux.centimes)}</tspan>
                </text>
              </g>
            )}
          </svg>
        </div>
        {paysage ? (
          // En paysage, la légende vit dans la colonne du détail, à côté de la courbe : elle reste à l'écran (CRITIQUE-6 n° 12, paysage-21).
          <div className="ent-gc-cote">
            {lecture !== null && courbe[lecture] && <div className="ent-gc-d"><LectureDetail courbe={courbeC} index={lecture} rangeeDe={rangeeDe} libre /></div>}
            {legende}
          </div>
        ) : (
          // En portrait, la place du détail est fixe : la légende dessous ne bouge pas avec la semaine lue (CRITIQUE-12 n° 5).
          <div className="ent-gc-dp" data-detail-place>
            {lecture !== null && courbe[lecture] && <div className="ent-gc-d"><LectureDetail courbe={courbeC} index={lecture} rangeeDe={rangeeDe} libre /></div>}
          </div>
        )}
      </div>
      {!paysage && legende}
    </section>
  );
}
