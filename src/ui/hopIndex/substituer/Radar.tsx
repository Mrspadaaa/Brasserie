// Le radar de u4, sur le radar commun (commun/RadarBase.tsx, porté de cmc2h : « utiliser ce radar graph comme Baseline
// et l'utiliser partout dans les vue où il y en a », voie rb-radar-commun). Ses valeurs restent celles de u4 : le niveau
// de chaque famille dans les fiches, du centre vers le bord non décrit (0, le petit anneau du zéro), cité (1), marqué (2).
// L'original (Nugget) en contour seul ; le remplaçant choisi en avant, rempli ; l'autre en contour et voile léger. Une
// famille qu'aucune des fiches ne décrit rejoint le secteur « sans donnée » (D65 : l'inconnu n'est pas un zéro). Les
// familles attendues au style sont cerclées (« gras : attendu en 16D »).
// Pas de normalisation : des niveaux de fiches n'ont pas d'échelle au style ; la bascule Au style / Absolu de l'écran
// règle les barres de Ma bière, le radar garde son échelle fixe dans les deux (D68 : rien ne se rechiffre en Absolu).
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { RadarBase } from '../commun/RadarBase';

export const AXES_U4: FamilyId[] = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];

export interface SerieRadar { cle: string; nom: string; couleur: string; original: boolean; niveaux: Record<FamilyId, 0 | 1 | 2> }

export function RadarU4({ series, retenu, attendues, inconnues, nomStyle }: { series: SerieRadar[]; retenu?: string | null; attendues: Set<FamilyId>; inconnues: Set<FamilyId>; nomStyle: string }) {
  return (
    <RadarBase familles={AXES_U4} mode="absolu" objet="houblons" className="pq-substituer-radar"
      series={series.map((s) => ({
        cle: s.cle, nom: s.nom, couleur: s.couleur, role: s.original ? 'contour' : s.cle === retenu ? 'retenu' : 'autre',
        valeurs: Object.fromEntries(AXES_U4.map((f) => [f, inconnues.has(f) ? null : s.niveaux[f]])),
      }))}
      echelleAbsolue={{ pas: 1, nb: 2, etiquettes: ['0', 'cité', 'marqué'] }} trouDuZero ecarterConfondus
      marquees={AXES_U4.filter((f) => attendues.has(f))}
      label={`Radar des citations : ${series.map((s) => s.nom).join(', ')} ; cerclé : attendu en ${nomStyle}`} />
  );
}
