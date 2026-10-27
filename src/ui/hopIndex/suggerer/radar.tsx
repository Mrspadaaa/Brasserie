// Vue « Radar » de Suggérer (q2b : « Barres / Radar »), sur le radar commun (commun/RadarBase.tsx, porté de cmc2h :
// « utiliser ce radar graph comme Baseline et l'utiliser partout dans les vue où il y en a », voie rb-radar-commun).
// Ses valeurs restent les siennes : ma bière (le trait noir), la zone du style, et la bière après la voie montrée (en
// plein, aux sommets). Tout en crans du style (valeur / cran de la famille), comme Comparer :
//   - Au style : chaque axe à son échelle, écrit près du picto ; la zone ; orangé au-dessus du haut du style. D189 (r4, 27.10,
//     « Quand je change le timing. Je vois les valeurs changé mais la taille du radar graph » ne change pas) : le bord de l'axe
//     est le plus fort de ma bière et de la voie sur TOUS ses moments (`effetsMoments`, lus par vue-radar.tsx), le même quand
//     on décale « ‹ 10′ › » : la forme grandit vers le whirlpool et rétrécit vers 60′ (le bord se donne à RadarBase par
//     `echellesAxe`, comme Comparer, r3) ;
//   - Absolu : plus de normalisation (D68), une échelle commune du 0 au plus fort de ce qui est montré (ma bière, la voie à tous
//     ses moments, haut de la plage type) au lieu de 0 à 12,5 crans où tout tenait au centre (D187, r3), et la plage type du style
//     en bande (`bande`, comme Comparer).
// Une famille inconnue pour ma bière l'est aussi après la voie : elle rejoint le secteur « sans donnée ».
import type { FamilyId, StyleScale } from '../../../domain/hopIndex/v4';
import { ROUE, type Echelle } from './commun';
import { RadarBase, echelle as echelleDe, type SerieRadar, type Valeurs } from '../commun/RadarBase';
import type { BiereLue } from '../parcours/adaptateur';

const VOIE = '#0e7490';

export function Radar({ biere, sc, echelle, series, moment, effetsMoments }: {
  biere: BiereLue; sc: StyleScale; echelle: Echelle;
  series: { cle: string; nom: string; effets: Record<FamilyId, number | null> }[];
  /** Le moment de la voie montrée (60′, 10′…), écrit sur le radar. */
  moment?: string;
  /** D189 : les effets de la voie montrée à chacun de ses moments (celui du moteur et ceux du décalage), déjà lus par l'écran. Au
   *  style, le bord de chaque axe est le plus fort de ma bière et de ces effets : il ne change plus avec le moment. Absent : le
   *  bord suit les séries montrées, comme avant. Un effet inconnu (null) ne compte pas : jamais 0. */
  effetsMoments?: Record<FamilyId, number | null>[];
  /** Mode Radar de la base v4.10 : une voie montrée, en plein, avec ses sommets (toujours le cas sur le radar commun). */
  plein?: boolean;
}) {
  const cran = (f: FamilyId) => sc.families[f].cran || 1;
  const parFamille = (lire: (f: FamilyId) => number | null) => Object.fromEntries(ROUE.map((f) => [f, lire(f)])) as Record<FamilyId, number | null>;
  const avant = parFamille((f) => { const v = biere.profil[f].valeur?.centre; return v == null ? null : v / cran(f); });
  const zone = parFamille((f) => { const b = sc.families[f].band; return b ? b[1] / cran(f) : null; });
  const lues: SerieRadar[] = series.map((s) => {
    const valeurs = parFamille((f) => (avant[f] == null ? null : Math.max(0, avant[f]! + (s.effets[f] ?? 0) / cran(f))));
    return { cle: s.cle, nom: s.nom, couleur: VOIE, role: 'retenu', valeurs,
      hors: Object.fromEntries(ROUE.map((f) => [f, valeurs[f] != null && zone[f] != null && valeurs[f]! > zone[f]! + 1e-6])) };
  });
  // Ma bière seule (aucune voie montrée) reste lisible : son trait noir sur la grille, ses inconnus regroupés.
  const toutes: SerieRadar[] = lues.length ? lues : [{ cle: 'ma-biere', nom: 'ma bière', couleur: '#3d3d47', role: 'contour', valeurs: avant }];
  // D189 : le bord de chaque axe au style : le plus fort de ma bière et de la voie sur tous ses moments (en crans, comme les valeurs).
  const absolu = echelle === 'absolu';
  const plusFort = effetsMoments?.length
    ? parFamille((f) => {
      if (avant[f] == null) return null;
      let m = avant[f]!;
      for (const e of effetsMoments) { const v = avant[f]! + (e[f] ?? 0) / cran(f); if (Number.isFinite(v) && v > m) m = v; }
      return m;
    })
    : undefined;
  // D187 (comme Comparer, r3) : en Absolu, la plage type du style dessinée en bande (bas et haut de chaque famille, en crans de la famille) et une
  // échelle du 0 au plus fort de ce qui est montré (ma bière, la voie à tous ses moments, haut de la bande) : la même à tous les moments, et lisible.
  // Une famille sans bande documentée n'en a pas (jamais 0 inventé : son bas et son haut tombent sur le 0 de la grille).
  const bande = (() => {
    if (!absolu) return undefined;
    const bas: Valeurs = {}, haut: Valeurs = {};
    let une = false;
    for (const f of ROUE) { const b = sc.families[f].band, c = sc.families[f].cran; if (!b || !(c > 0)) { bas[f] = null; haut[f] = null; continue; } bas[f] = b[0] / c; haut[f] = b[1] / c; une = true; }
    return une ? { bas, haut } : undefined;
  })();
  const echelleAbsolue = (() => {
    if (!absolu) return undefined;
    let max = 0;
    for (const f of ROUE) {
      for (const v of [plusFort?.[f], avant[f], bande?.haut[f], ...lues.map((s) => s.valeurs[f])]) if (v != null && Number.isFinite(v) && v > max) max = v;
    }
    return echelleDe(max || 0.1);
  })();
  return (
    <figure data-role="radar" className="pq-suggerer-radar">
      <RadarBase familles={sc.order?.length ? sc.order : ROUE} series={toutes} mode={absolu ? 'absolu' : 'style'} moment={moment}
        echellesAxe={absolu ? undefined : plusFort} echelleAbsolue={echelleAbsolue} bande={bande}
        zone={zone} reference={lues.length ? { nom: 'ma-biere', valeurs: avant } : undefined} objet="suggerer"
        label={(haut) => `Radar ${echelle === 'absolu' ? `absolu, de 0 à ${haut} crans` : 'au style'} : ma bière et ${series.map((s) => s.nom).join(', ') || 'aucune voie retenue'}`} />
      <figcaption className="pq-sg-radar-cle">
        <span><i aria-hidden="true" className="pq-sg-radar-cle-biere" />ma bière</span>
        {series.map((s) => <span key={s.cle}><i aria-hidden="true" className="pq-sg-radar-cle-voie" style={{ background: VOIE }} />{s.nom}</span>)}
      </figcaption>
    </figure>
  );
}
