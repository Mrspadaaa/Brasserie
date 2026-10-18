import { STOCK, hopRef } from './data';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { describeFamilies, styleFit, type FitClass } from './hops';
import { MOMENTS, additionIbu, gramsForIbu, recipeIbu, searchDoses, type MomentId, type Recipe } from './recipe';
import type { StyleScale } from '../style/scale';
import { valueVerdict } from '../style/verdict';
import type { Tasting } from './tasting';
import { ibuByMoment, type IbuAtMoment } from './ibuMoments';

/** Règle de l'ajout en un toucher (écrite dans ENGINE.md, testée) :
 * 1. Candidats : les houblons du stock ; disponibles (stock libre > 0) d'abord, épuisés à part.
 * 2. Classement (décision du pilote, réversible) : catégorie d'usage comme styleFit ; conflit avec la
 *    dégustation (famille jugée « trop » citée) ; familles neutres ou indésirables citées pondérées
 *    (marqué 2, cité 1, croissant) ; familles attendues citées (décroissant) ; stock libre ; nom.
 *    Égalité de toutes les clés : même rang.
 * 3. Moment et dose par défaut : si l'IBU de la recette est sous la bande du style, 60′ et la dose qui
 *    amène l'IBU au milieu de la bande (BrewingMath.hopIbu) ; sinon 10′ et la plus petite dose de
 *    recherche du solveur V5.5 à 10′ (g/L × volume), plafonnée au stock libre. */
export const QUICK_ADD_RULE = [
  'Candidats : houblons du stock ; disponibles (stock libre > 0) d’abord, épuisés à part.',
  'Classement lexicographique : 1) usage attesté, cohérent, peu documenté, non documenté, hors style (famille indésirable citée) ; 2) conflit avec la dégustation : un houblon qui cite une famille que la dégustation juge « trop » face au style passe derrière et porte le tag de cette famille ; 3) le moins de familles neutres ou indésirables citées, pondérées par niveau (marqué 2, cité 1) ; 4) le plus de familles attendues citées ; 5) stock libre, puis nom ; égalité de toutes les clés : même rang.',
  'Moment et dose : IBU de la recette sous la bande du style → 60′, dose pour atteindre le milieu de la bande ; sinon 10′, plus petite dose de recherche du solveur V5.5 à 10′ (g/L × volume), plafonnée au stock libre.',
  'IBU ajoutés : BrewingMath.hopIbu (alpha du lot, sinon plage variétale) ; aucun IBU sans alpha.',
];

export interface QuickAdd {
  rank: number; key: string; name: string; fit: FitClass;
  supports: FamilyId[]; offStyle: FamilyId[]; conflicts: string[];
  /** Familles citées par le houblon que la dégustation juge « trop » face au style. */
  tastingConflicts: FamilyId[];
  /** Étiquettes à afficher : « + boisé et résineux » pour un conflit avec la dégustation. */
  tags: string[];
  /** Familles neutres ou indésirables citées, pondérées par niveau (marqué 2, cité 1). */
  offStyleWeight: number;
  stock: { grams: number; free: number; status: 'suffisant' | 'manque' | 'épuisé' };
  moment: MomentId; momentLabel: string;
  dose: { grams: number; gramsPerLitre: number; rule: string } | null;
  ibuAdded: { value: number; min: number; max: number } | null;
  /** Familles citées (niveau, N fiches sur M) ; nom et statut dans families et cibleStyle du pack. */
  cited: { family: FamilyId; level: string; sources: number; of: number }[];
  /** IBU à la dose proposée et par gramme, pour chaque moment que V5.5 sait traiter (BrewingMath.hopIbu). */
  ibuParMoment: IbuAtMoment[];
}
const round = (x: number, n = 1) => Math.round(x * 10 ** n) / 10 ** n;
const FIT_RANK: Record<FitClass, number> = { 'usage attesté': 0, cohérent: 1, 'peu documenté': 2, 'non documenté': 3, 'hors style': 4 };

export function quickAdds(recipe: Recipe, scale: StyleScale, tasting: Tasting | null = null): { disponibles: QuickAdd[]; epuises: QuickAdd[]; rule: string[]; tastingTrop: FamilyId[] } {
  const used = (key: string) => recipe.additions.filter((a) => a.hopKey === key).reduce((s, a) => s + a.grams, 0);
  // Familles que la dégustation juge « trop » (ou hors style) face à la bande du style.
  const trop = (tasting?.axes ?? []).filter((a) => a.perceivedRange && ['trop', 'hors style'].includes(valueVerdict({ range: a.perceivedRange }, scale.families[a.family]).verdict)).map((a) => a.family);
  const ibu0 = recipeIbu(recipe).value;
  const bitter = !!scale.ibu && ibu0 < scale.ibu[0];
  const fits = new Map(styleFit(STOCK.map((s) => s.key), scale).map((r) => [r.key, r]));
  const rows = STOCK.map((s): QuickAdd => {
    const ref = hopRef(s.key)!, fit = fits.get(s.key)!, desc = describeFamilies(s.varietyId);
    const free = round(s.grams - used(s.key));
    const offStyle = scale.documented ? FAMILIES.filter((f) => scale.families[f].status !== 'attendue' && desc[f].level !== 'non décrit') : [];
    const offStyleWeight = offStyle.reduce((s, f) => s + (desc[f].level === 'marqué' ? 2 : 1), 0);
    const tastingConflicts = trop.filter((f) => desc[f].level !== 'non décrit');
    const moment: MomentId = bitter ? 'b60' : 'b10';
    let dose: QuickAdd['dose'] = null;
    if (bitter) {
      const g = gramsForIbu((scale.ibu![0] + scale.ibu![1]) / 2 - ibu0, ref, 'b60', recipe);
      if (g !== null) dose = { grams: round(g), gramsPerLitre: round(g / recipe.volumeL, 2), rule: 'milieu de la bande d’IBU' };
    } else {
      const preset = searchDoses('b10')[0] * recipe.volumeL;
      const g = free > 0 ? Math.min(preset, free) : preset;
      dose = { grams: round(g), gramsPerLitre: round(g / recipe.volumeL, 2), rule: g < preset ? 'stock libre' : 'dose de recherche 10′' };
    }
    const ibu = dose ? additionIbu({ id: 'quick', hopKey: s.key, moment, grams: dose.grams }, recipe) : null;
    return {
      rank: 0, key: s.key, name: ref.name, fit: fit.fit, supports: fit.supports, offStyle, conflicts: fit.conflicts,
      tastingConflicts, tags: tastingConflicts.map((f) => `+ ${FAMILY_NAMES[f].toLowerCase()}`), offStyleWeight,
      stock: { grams: s.grams, free, status: s.grams <= 0 ? 'épuisé' : dose && free >= dose.grams ? 'suffisant' : 'manque' },
      moment, momentLabel: MOMENTS[moment].label, dose,
      ibuAdded: ibu && !ibu.unknown.length ? { value: round(ibu.value), min: round(ibu.min), max: round(ibu.max) } : null,
      cited: FAMILIES.filter((f) => desc[f].level !== 'non décrit').map((f) => ({ family: f, level: desc[f].level, sources: desc[f].sources, of: desc[f].of })),
      ibuParMoment: ibuByMoment(s.key, dose?.grams ?? 0, recipe),
    };
  });
  const key = (r: QuickAdd) => quickAddKey(r);
  const cmp = (a: QuickAdd, b: QuickAdd) => { const ka = key(a), kb = key(b); for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; };
  const ranked = (list: QuickAdd[]) => {
    const sorted = list.sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name, 'fr'));
    sorted.forEach((r, i) => { r.rank = i > 0 && cmp(sorted[i - 1], r) === 0 ? sorted[i - 1].rank : i + 1; });
    return sorted;
  };
  return { disponibles: ranked(rows.filter((r) => r.stock.free > 0)), epuises: ranked(rows.filter((r) => r.stock.free <= 0)), rule: QUICK_ADD_RULE, tastingTrop: trop };
}
/** Clés du classement (voir QUICK_ADD_RULE), dans l'ordre lexicographique. */
export const quickAddKey = (r: QuickAdd) => [FIT_RANK[r.fit], r.tastingConflicts.length > 0 ? 1 : 0, r.offStyleWeight, -r.supports.length, -r.stock.free];
