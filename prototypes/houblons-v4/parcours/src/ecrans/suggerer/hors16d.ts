// D130 (24.10, soir), sur flb5b : « Les type spéciaux des houblons hors 16d ! C'est très important surtout dans la
// comparaison !!!! » ; sur q2b : « ajouter les spec en plus type comme matrice nettoyée flb5b ». Ce que la 16D ne dessine
// pas : les mots des fiches d'un houblon qu'aucune des 12 familles ne range (sansFamille du moteur), et, pour une levure, ce
// que sa fiche technique dit d'elle en propre. Pur : aucune vue ici. Jamais un mot inventé : un houblon sans tel mot n'a
// rien ; une levure sans fiche qui le dise a « ? » (inconnu, jamais 0).
// Même grammaire que flb5b (« Lui seul : vin blanc, raisin… ») : mots génériques et noms de famille écartés, mots anglais
// sûrs traduits. Écrit ici plutôt qu'importé de Substituer, dont le fichier est en cours de travail dans une autre voie.
import { familyWords, hopRef } from '../../../../src/engine';
import { EXTRAPOLATION } from '../../../../src/engine/data';

/** Mots génériques, qui ne disent rien de propre au houblon (flb5b : « fruité », « fruits tropicaux »). */
const GENERIQUE = /^(fruit(é|ée|y|s|ées?)?|fruits? tropicaux|tropical|aromatique|arôme|houblon|doux|léger|intense|complexe|agréable|propre|neutre|net|clean)$/i;
/** Un mot qui n'est que le nom d'une famille écrit autrement (« resiny ») : la 16D le dessine déjà. */
const NOM_DE_FAMILLE = /^(r[ée]sin|citr|agrum|flor|fleur|herb|terr|earth|[ée]pic|spic|tropic|berr|bai|melon|noyau|stone|p[ée]pin|v[ée]g[ée]tal|green|pine|pin\b)/i;
const FR: Record<string, string> = {
  tabacco: 'tabac', tobacco: 'tabac', marmalade: 'marmelade', ginger: 'gingembre', licorice: 'réglisse', onion: 'oignon', garlic: 'ail',
  catty: 'urine de chat', lilac: 'lilas', chamomile: 'camomille', gooseberry: 'groseille à maquereau', 'white wine': 'vin blanc', grape: 'raisin', grapes: 'raisin', coffee: 'café', 'passion fruit': 'fruit de la passion',
};

/** Les mots de ses fiches hors des familles, du plus cité au moins cité (nombre de fiches), sans doublon. */
export function motsHors(cle: string): { mot: string; fiches: number }[] {
  const ref = hopRef(cle);
  if (!ref) return [];
  const w = familyWords(ref.varietyId, ref.catalogue);
  const compte = new Map<string, Set<string>>();
  for (const x of w.sansFamille) {
    const brut = x.mot.toLowerCase().trim();
    const k = FR[brut] ?? brut;
    if (!k || GENERIQUE.test(k) || NOM_DE_FAMILLE.test(brut)) continue;
    compte.set(k, (compte.get(k) ?? new Set()).add(x.source));
  }
  return [...compte].map(([mot, s]) => ({ mot, fiches: s.size })).sort((a, b) => b.fiches - a.fiches);
}

/** Ce qu'une levure apporte en propre, d'après sa fiche technique (le relevé du modèle, EXTRAPOLATION.yeasts[].evidence) :
 * la première phrase, sans les noms de famille que ses traits disent déjà (« Abricot dominant, tropical et agrumes ;
 * POF négative » → « abricot dominant », « POF négative »). null : aucune fiche ne le dit (« ? »). */
export function motsLevure(id: string): string[] | null {
  const s = EXTRAPOLATION.yeasts.find((y) => y.yeastId === id);
  const fiche = s?.evidence.find((e) => e.kind === 'manufacturer' && /fiche technique/i.test(e.title));
  if (!fiche) return null;
  const phrases = fiche.locator.split(/[;.]/).map((p) => p.trim()).filter((p) => p && !/^date|publication/i.test(p));
  const mots = phrases.flatMap((p) => p.replace(/\.$/, '').split(/,|\bet\b/).map((m) => m.trim().toLowerCase()))
    .filter((m) => m && !GENERIQUE.test(m) && !NOM_DE_FAMILLE.test(m))
    .map((m) => m.replace(/^pof\b/i, 'POF'));
  return mots.length ? [...new Set(mots)] : null;
}

/** Tous les mots de ses fiches, rangés ou non (et ses étiquettes) : pour dire ce qu'il est seul à avoir face aux autres. */
export function tousMots(cle: string): Set<string> {
  const ref = hopRef(cle);
  if (!ref) return new Set();
  const w = familyWords(ref.varietyId, ref.catalogue);
  return new Set([...motsHors(cle).map((x) => x.mot), ...Object.values(w.mots).flatMap((l) => l.flatMap((r) => r.mots.map((m) => m.toLowerCase().trim()))),
    ...(ref.catalogue.tagsFr ?? []).map((m) => m.toLowerCase())]);
}

/** Pour chaque houblon montré : ses mots hors des familles, ceux qu'aucun autre houblon de l'écran n'a d'abord (« lui seul »,
 * comme flb5b), deux au plus (mots modérés, D41). */
export function horsDesFamilles(cles: string[]): Map<string, { seul: boolean; mots: string[] }> {
  const res = new Map<string, { seul: boolean; mots: string[] }>();
  const uniques = [...new Set(cles)];
  for (const c of uniques) {
    const hors = motsHors(c).map((x) => x.mot);
    if (!hors.length) continue;
    const autres = uniques.filter((o) => o !== c).map(tousMots);
    const seuls = hors.filter((m) => !autres.some((t) => t.has(m)));
    res.set(c, seuls.length ? { seul: true, mots: seuls.slice(0, 2) } : { seul: false, mots: hors.slice(0, 2) });
  }
  return res;
}
