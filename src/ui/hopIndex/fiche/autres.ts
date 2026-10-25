// « autres 42 % » expliqué (t12e, #184 ; ses mots du 25.10 : « Explique pas le 42% autre pour lotus par exemple ») : le chiffre
// de la carte et la liste des mots viennent d'un seul calcul, celui de l'adaptateur (parcours/adaptateur.ts, houblon()) :
//   mots sans famille = les mots des fiches (familyWords) qu'aucune des 12 familles ne reconnaît, un par fiche qui le dit ;
//   total = les mots rattachés à une famille (distincts) + ces mots sans famille ;
//   part = mots sans famille / total, arrondie au centième.
// Les mots sont traduits (traduction.versFr) comme dans la matrice. Un même mot dit par deux fiches (« vanille » chez Beer
// Maverick, « vanilla » chez Hopsteiner) compte deux fois dans ce calcul : la liste le montre (« 2 fiches ») au lieu de le cacher.
// Un houblon absent des fiches du moteur : null (ni chiffre ni liste, jamais 0).
import { FAMILIES, familyWords, hopRef } from '../parcours/v4';
import { versFr } from './traduction';

export interface MotAutres { mot: string; fiches: string[] }
export interface AutresLu {
  /** Mots sans famille, comptés par fiche. */
  n: number;
  /** Mots rattachés (distincts) + n. */
  total: number;
  /** n / total, au centième : le chiffre de la carte. */
  part: number;
  /** Les mots, traduits, un mot et ses fiches. La somme des fiches vaut n. */
  mots: MotAutres[];
}

export function autresDe(cle: string): AutresLu | null {
  const h = hopRef(cle);
  if (!h) return null;
  const w = familyWords(h.varietyId, h.catalogue);
  const rattaches = new Set(FAMILIES.flatMap((f) => w.mots[f].flatMap((x) => x.mots.map((m) => m.toLowerCase()))));
  const n = w.sansFamille.length;
  const total = rattaches.size + n;
  if (!total) return null;
  const groupes = new Map<string, MotAutres>();
  for (const x of w.sansFamille) {
    const mot = versFr(x.mot);
    const g = groupes.get(mot) ?? { mot, fiches: [] };
    g.fiches.push(x.source);
    groupes.set(mot, g);
  }
  return { n, total, part: Math.round((n / total) * 100) / 100, mots: [...groupes.values()] };
}

/** La ligne de calcul : « 5 de ses 12 mots n’entrent dans aucune des 12 familles ». */
export const ligneAutres = (a: AutresLu) =>
  `${a.n} de ses ${a.total} mots ${a.n > 1 ? 'n’entrent' : 'n’entre'} dans aucune des 12 familles`;
