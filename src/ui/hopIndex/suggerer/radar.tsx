// Vue « Radar » de Suggérer (q2b : « Barres / Radar »), sur le radar commun (commun/RadarBase.tsx, porté de cmc2h :
// « utiliser ce radar graph comme Baseline et l'utiliser partout dans les vue où il y en a », voie rb-radar-commun).
// Ses valeurs restent les siennes : ma bière (le trait noir), la zone du style, et la bière après la voie montrée (en
// plein, aux sommets). Tout en crans du style (valeur / cran de la famille), comme Comparer :
//   - Au style : chaque axe à son échelle, le plus fort de ma bière et de la voie, écrit près du picto ; la zone ;
//     orangé au-dessus du haut du style ;
//   - Absolu : l'échelle fixe et commune, 0 à 12,5 crans, plus de normalisation (D68).
// Une famille inconnue pour ma bière l'est aussi après la voie : elle rejoint le secteur « sans donnée ».
import type { FamilyId, StyleScale } from '../../../domain/hopIndex/v4';
import { ROUE, type Echelle } from './commun';
import { RadarBase, type SerieRadar } from '../commun/RadarBase';
import type { BiereLue } from '../parcours/adaptateur';

const VOIE = '#0e7490';

export function Radar({ biere, sc, echelle, series, moment }: {
  biere: BiereLue; sc: StyleScale; echelle: Echelle;
  series: { cle: string; nom: string; effets: Record<FamilyId, number | null> }[];
  /** Le moment de la voie montrée (60′, 10′…), écrit sur le radar. */
  moment?: string;
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
  return (
    <figure data-role="radar" className="pq-suggerer-radar">
      <RadarBase familles={sc.order?.length ? sc.order : ROUE} series={toutes} mode={echelle === 'absolu' ? 'absolu' : 'style'} moment={moment}
        zone={zone} reference={lues.length ? { nom: 'ma-biere', valeurs: avant } : undefined} objet="suggerer"
        label={(haut) => `Radar ${echelle === 'absolu' ? `absolu, de 0 à ${haut} crans` : 'au style'} : ma bière et ${series.map((s) => s.nom).join(', ') || 'aucune voie retenue'}`} />
      <figcaption className="pq-sg-radar-cle">
        <span><i aria-hidden="true" className="pq-sg-radar-cle-biere" />ma bière</span>
        {series.map((s) => <span key={s.cle}><i aria-hidden="true" className="pq-sg-radar-cle-voie" style={{ background: VOIE }} />{s.nom}</span>)}
      </figcaption>
    </figure>
  );
}
