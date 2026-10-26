// « autres 42 % » expliqué (t12e, #184 ; t12f) : le chiffre de la carte de Ma bière, celui de la fiche et la liste du « ? »
// viennent d'un seul calcul, celui-ci (l'adaptateur, parcours/adaptateur.ts, houblon(), le lit : partSansFamille et
// motsSansFamille). On compte des mots DISTINCTS, après traduction et normalisation (« vanille » chez Beer Maverick et
// « vanilla » chez Hopsteiner sont un seul mot), au numérateur comme au dénominateur :
//   mots sans famille = les mots distincts des fiches qu'aucune des 12 familles ne reconnaît ;
//   total = les mots distincts rattachés à une famille + ces mots sans famille ;
//   part = mots sans famille / total, arrondie au centième.
// Un mot que deux fiches disent, l'une hors famille, l'autre rattaché (après traduction), est rattaché : il ne compte qu'une fois.
// Un houblon absent des fiches du moteur : null (ni chiffre ni liste, jamais 0).
import { FAMILIES, familyWords, hopRef } from '../parcours/v4';
import { motAffiche } from './traduction';

export interface MotAutres { mot: string; fiches: string[] }
export interface AutresLu {
  /** Mots distincts sans famille. */
  n: number;
  /** Mots distincts rattachés + n. */
  total: number;
  /** n / total, au centième : le chiffre de la carte. */
  part: number;
  /** Ces n mots, traduits, chacun une fois, avec les fiches qui le disent (information, pas un poids). */
  mots: MotAutres[];
}

/** Les mots d'une variété tels que le moteur les range (familyWords). */
export interface MotsFiches {
  mots: Record<string, { source: string; mots: string[] }[]>;
  sansFamille: { source: string; mot: string }[];
}

/** La clé de comparaison : mot traduit, en minuscules, sans accents ni tirets. */
const cleDe = (mot: string) => mot.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Le calcul, pur : les mots des fiches et une fonction de traduction. Testable sans moteur. */
export function compterAutres(w: MotsFiches, traduire: (mot: string) => string, familles: readonly string[] = FAMILIES): AutresLu | null {
  const rattaches = new Set<string>();
  for (const f of familles) for (const x of w.mots[f] ?? []) for (const m of x.mots) { const k = cleDe(traduire(m).toLowerCase()); if (k) rattaches.add(k); }
  const groupes = new Map<string, MotAutres>();
  for (const x of w.sansFamille) {
    const mot = traduire(x.mot).toLowerCase().trim();
    const k = cleDe(mot);
    if (!k || rattaches.has(k)) continue;
    const g = groupes.get(k) ?? { mot, fiches: [] };
    if (!g.fiches.includes(x.source)) g.fiches.push(x.source);
    groupes.set(k, g);
  }
  const n = groupes.size;
  const total = rattaches.size + n;
  if (!total) return null;
  return { n, total, part: Math.round((n / total) * 100) / 100, mots: [...groupes.values()] };
}

export function autresDe(cle: string): AutresLu | null {
  const h = hopRef(cle);
  if (!h) return null;
  // D160 : un mot qui n'est pas un arôme (« clean bitterness ») ne compte ni parmi les mots rattachés ni parmi les autres.
  return compterAutres(familyWords(h.varietyId, h.catalogue), (m) => motAffiche(m) ?? '');
}

/** La ligne de calcul : « 4 de ses 11 mots n’entrent dans aucune des 12 familles ». */
export const ligneAutres = (a: AutresLu) =>
  `${a.n} de ses ${a.total} mots ${a.n > 1 ? 'n’entrent' : 'n’entre'} dans aucune des 12 familles`;
