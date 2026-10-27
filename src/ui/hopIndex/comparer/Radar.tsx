import { useMemo } from 'react';
import { termes, useRecette } from './hote';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { RadarBase, echelle, type SerieRadar, type Valeurs } from '../commun/RadarBase';
import { style } from '../parcours/adaptateur';
import { ETAPES, etape, lireColonnes, type CodeEtape, type ColonneLue } from './calcul';

// cmc2h — le radar de son choix (« C'est quasiment parfait », sur cmc2g), devenu le radar commun (commun/RadarBase.tsx,
// voie rb-radar-commun). Cet écran ne fait que lui donner ses valeurs, comme cmc2h les lisait :
//   - au style : ce que le houblon ajoute à ta stout, en crans, (centre − ta stout) / cran (dCran du moteur, au moment
//     du sélecteur) ; la zone : ce que ta 16D laisse au-dessus de ta stout ;
//   - en Absolu : la bière entière, centre / cran, et ta stout en trait noir.
// Les deux échelles (r3, 27.10, D68 conciliée avec D187 et D189) :
//   - au style : « elle est en terme de style et de timing toujours de style mais dynamique en terme de timing » (D68). Le
//     bord de chaque axe est le plus fort apport de la famille sur TOUS les moments (60′, 10′, whirlpool, dry hop) et tous les
//     houblons comparés : il ne change pas avec le moment (D189 : « je vois les valeurs changé mais la taille du radar
//     graph » ne change pas). La forme grandit vers le dry hop et rétrécit à 60′ ;
//   - en Absolu : « plus de normalisation » (D68), mais une échelle du 0 au plus fort de ce qui est montré : les houblons, ta
//     stout et le haut de la plage type du style (D187 : « il faudrait montrer la plage type du style […] c'est illisible »,
//     les séries tassées au centre sous 12,5 crans). La plage type du style est dessinée en bande (bas et haut de la bande de
//     la famille, en crans de la famille). Le 0 reste un petit anneau, jamais le centre (D114).
type Props = { axes: FamilyId[]; cols: ColonneLue[]; retenu: string; absolu: boolean; moment?: CodeEtape };

/** Le plus fort apport de chaque famille, en crans (dCran, celui que le radar dessine), sur tous les moments et tous les houblons : le
 *  bord de l'axe au style. Un apport inconnu à tous les moments reste null (jamais 0). `parMoment` : les colonnes lues à chaque moment. */
export function bordsAuStyle(axes: FamilyId[], parMoment: ColonneLue[][]): Record<FamilyId, number | null> {
  return Object.fromEntries(axes.map((f) => {
    let m: number | null = null;
    for (const cols of parMoment) for (const c of cols) { const v = c.cellules[f]?.dCran; if (v != null && Number.isFinite(v) && (m == null || v > m)) m = Math.max(0, v); }
    return [f, m];
  })) as Record<FamilyId, number | null>;
}

export function Radar({ axes, cols, retenu, absolu, moment }: Props) {
  const recette = useRecette();
  const cles = cols.map((c) => c.cle);
  const cle = cles.join('|');
  // Aux cinq moments : une simulation par houblon et par moment (celles de l'écran, mais la sienne : l'écran ne garde que le moment lu).
  // Mémoïsé sur la recette et les houblons : changer de moment ne relance rien, et l'Absolu n'en a pas besoin.
  const parMoment = useMemo(() => (absolu ? null : ETAPES.map((e) => lireColonnes(recette, cles, undefined, e.quand))), [absolu, recette, cle]); // eslint-disable-line react-hooks/exhaustive-deps
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

  // D187 : la plage type du style, en crans de chaque famille (le même cran que les valeurs). Un style sans bande documentée : pas de bande.
  const sc = absolu && recette.styleCode ? style(recette.styleCode) : null;
  const bande = (() => {
    if (!sc) return undefined;
    const bas: Valeurs = {}, haut: Valeurs = {};
    let une = false;
    for (const f of axes) { const fs = sc.families[f]; if (!fs?.band || !(fs.cran > 0)) { bas[f] = null; haut[f] = null; continue; } bas[f] = fs.band[0] / fs.cran; haut[f] = fs.band[1] / fs.cran; une = true; }
    return une ? { bas, haut } : undefined;
  })();
  // D187 : en Absolu, l'échelle va du 0 au plus fort de ce qui est montré (houblons, ta stout, haut de la bande).
  const echelleAbsolue = (() => {
    if (!absolu) return undefined;
    let max = 0;
    for (const s of series) for (const f of axes) { const v = s.valeurs[f]; if (v != null && v > max) max = v; }
    for (const f of axes) { const v = stout[f]; if (v != null && v > max) max = v; const h = bande?.haut[f]; if (h != null && h > max) max = h; }
    return echelle(max || 0.1);
  })();
  // D189 : au style, le bord de chaque axe vaut le plus fort apport sur tous les moments (le même à 60′ et au dry hop).
  const echellesAxe = parMoment ? bordsAuStyle(axes, parMoment) : undefined;
  return (
    <RadarBase familles={axes} series={series} mode={absolu ? 'absolu' : 'style'} moment={moment ? etape(moment).dit : undefined}
      zone={zone} reference={absolu ? { nom: `ta ${termes().biere}`, valeurs: stout } : undefined} objet="houblons" className="pq-comparer-radar" trouDuZero ecarterConfondus
      echelleAbsolue={echelleAbsolue} echellesAxe={echellesAxe} bande={bande}
      label={(haut) => `Radar ${absolu ? 'absolu' : 'au style'}${nomRetenu ? ` : ${nomRetenu} plein` : ''}, de 0 à ${haut} crans : ${cols.map((c) => c.houblon.nom).join(', ')}`} />
  );
}
