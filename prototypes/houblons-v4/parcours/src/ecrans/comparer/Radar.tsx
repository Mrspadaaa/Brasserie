import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { RadarBase, type SerieRadar } from '../../commun/RadarBase';
import { etape, type CodeEtape, type ColonneLue } from './calcul';

// cmc2h — le radar de son choix (« C'est quasiment parfait », sur cmc2g), devenu le radar commun (commun/RadarBase.tsx,
// voie rb-radar-commun). Cet écran ne fait que lui donner ses valeurs, comme cmc2h les lisait :
//   - au style : ce que le houblon ajoute à ta stout, en crans, (centre − ta stout) / cran (dCran du moteur, au moment
//     du sélecteur) ; la zone : ce que ta 16D laisse au-dessus de ta stout ;
//   - en Absolu : la bière entière, centre / cran, et ta stout en trait noir ; échelle fixe 0 à 12,5 crans (D68).
type Props = { axes: FamilyId[]; cols: ColonneLue[]; retenu: string; absolu: boolean; visee: FamilyId; trop: FamilyId; moment?: CodeEtape };

export function Radar({ axes, cols, retenu, absolu, moment }: Props) {
  const parFamille = (lire: (f: FamilyId) => number | null) => Object.fromEntries(axes.map((f) => [f, lire(f)])) as Record<FamilyId, number | null>;
  const valeur = (c: ColonneLue, f: FamilyId): number | null => {
    const cel = c.cellules[f]; if (cel.inconnu) return null;
    return absolu ? Math.max(0, cel.centre / cel.cran) : Math.max(0, cel.dCran ?? 0);
  };
  const c0 = cols[0];
  // Le libellé garde le repère de l'état « retenir » (controle-etats : « Radar au style : Cascade plein »).
  const nomRetenu = cols.find((c) => c.cle === retenu)?.houblon.nom;
  const zone = parFamille((f) => { const cel = c0?.cellules[f]; if (!cel || cel.bandeHaut == null) return null; return Math.max(0, (cel.bandeHaut - (cel.avant ?? 0)) / cel.cran); });
  const stout = parFamille((f) => { const a = c0?.cellules[f].avant; return a == null ? null : a / c0!.cellules[f].cran; });
  const series: SerieRadar[] = cols.map((c) => ({
    cle: c.cle, nom: c.houblon.nom, couleur: c.couleur, role: c.cle === retenu ? 'retenu' : 'autre',
    valeurs: parFamille((f) => valeur(c, f)),
    hors: Object.fromEntries(axes.map((f) => [f, !!c.cellules[f].hors])),
  }));
  return (
    <RadarBase familles={axes} series={series} mode={absolu ? 'absolu' : 'style'} moment={moment ? etape(moment).dit : undefined}
      zone={zone} reference={absolu ? { nom: 'ta stout', valeurs: stout } : undefined} objet="houblons" className="pq-comparer-radar"
      label={(haut) => `Radar ${absolu ? 'absolu' : 'au style'}${nomRetenu ? ` : ${nomRetenu} plein` : ''}, de 0 à ${haut} crans : ${cols.map((c) => c.houblon.nom).join(', ')}`} />
  );
}
