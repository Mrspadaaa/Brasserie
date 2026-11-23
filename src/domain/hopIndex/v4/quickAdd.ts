import { catalogue as catalogueDuMoteur, stock as stockDuMoteur, hopRef } from './data';
import { goutsSets, type Gouts } from './gouts';
import { hopAlpha, hopRole, type HopAlpha } from './roles';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { describeFamilies, styleFit, type FitClass } from './hops';
import { MOMENTS, additionIbu, gramsForIbu, recipeIbu, searchDoses, type MomentId, type Recipe } from './recipe';
import type { StyleScale } from './style/scale';
import { valueVerdict } from './style/verdict';
import type { Tasting } from './tasting';
import { ibuByMoment, type IbuAtMoment } from './ibuMoments';

/** Règle de l'ajout en un toucher (écrite dans ENGINE.md, testée) :
 * 1. Candidats : les houblons du stock ; disponibles (stock libre > 0) d'abord, épuisés à part.
 * 2. Classement (D107, K3 de f3 ; décision du pilote, réversible) : catégorie d'usage comme styleFit ; conflit avec la
 *    dégustation (famille jugée « trop » citée) ; familles indésirables citées pondérées (marqué 2, cité 1, croissant) ;
 *    familles attendues citées pondérées de même (décroissant) ; familles neutres citées pondérées (croissant, un frein :
 *    jamais devant les attendues) ; stock libre ; nom. Égalité de toutes les clés : même rang.
 *    Une forme (cryo, lupuline…) et sa variété sont deux candidats ; la forme ne passe jamais devant sa variété (D174).
 * 3. Moment et dose par défaut : si l'IBU de la recette est sous la bande du style, 60′ et la dose qui
 *    amène l'IBU au milieu de la bande (BrewingMath.hopIbu) ; sinon 10′ et la plus petite dose de
 *    recherche du solveur V5.5 à 10′ (g/L × volume), plafonnée au stock libre : dose de départ, pas une dose de style (D107, P5 A). */
const dosePlancher = `${String(searchDoses('b10')[0]).replace('.', ',')} g/L`;
export const QUICK_ADD_RULE = [
  'Candidats : houblons du stock ; disponibles (stock libre > 0) d’abord, épuisés à part ; houblons hors stock dans « catalogue », marqués « à acheter », classés par la même règle (le stock informe, il ne limite pas). Une forme en stock (cryo, lupuline…) et sa variété simple sont deux candidats : la variété simple reste proposée à l’achat.',
  'Goûts du brasseur : une variété exclue disparaît des listes ; une famille exclue compte comme un conflit avec la dégustation.',
  'Classement lexicographique : 1) usage attesté, cohérent, peu documenté, non documenté, hors style (famille indésirable citée) ; 2) conflit avec la dégustation : un houblon qui cite une famille que la dégustation juge « trop » face au style passe derrière et porte le tag de cette famille ; 3) le moins de familles indésirables du style citées, pondérées par niveau (marqué 2, cité 1) ; les familles neutres ne pénalisent pas à ce rang ; 4) le plus de familles attendues citées, pondérées par niveau (marqué 2, cité 1) ; 5) le moins de familles neutres citées, pondérées par niveau (un frein, après les attendues) ; 6) stock libre, puis nom ; égalité de toutes les clés : même rang. Ni l’α ni le stock ne mettent une forme devant sa variété.',
  `Moment et dose : IBU de la recette sous la bande du style → 60′, dose pour atteindre le milieu de la bande ; sinon 10′ et ${dosePlancher} (plus petite dose de recherche du solveur V5.5 à 10′, × volume), plafonnée au stock libre. 10′ et ${dosePlancher} : dose de départ, pas une dose de style.`,
  'IBU ajoutés : BrewingMath.hopIbu (alpha du lot, sinon plage variétale) ; aucun IBU sans alpha.',
];

export interface QuickAdd {
  rank: number; key: string; name: string; fit: FitClass;
  /** Alpha retenu (lot, sinon plage variétale) et rôle (fournisseur, sinon règle rôle-α v1). */
  alpha: HopAlpha | null; role: ReturnType<typeof hopRole>;
  supports: FamilyId[]; offStyle: FamilyId[]; conflicts: string[];
  /** Familles citées par le houblon que la dégustation juge « trop » face au style. */
  tastingConflicts: FamilyId[];
  /** Étiquettes à afficher : « + boisé et résineux » pour un conflit avec la dégustation. */
  tags: string[];
  /** Familles neutres ou indésirables citées, pondérées par niveau (marqué 2, cité 1). N'entre plus dans le classement d'Ajouter (D107) : lu par la construction (cases.ts). */
  offStyleWeight: number;
  /** D107 (K3) : les familles citées pondérées par niveau (marqué 2, cité 1), selon leur statut dans le style. Les indésirables pénalisent, les attendues comptent,
   * les neutres freinent après les attendues. Tout à 0 pour un style non documenté. */
  poids: { indesirables: number; attendues: number; neutres: number };
  stock: { grams: number; free: number; status: 'suffisant' | 'manque' | 'épuisé' | 'à acheter' };
  moment: MomentId; momentLabel: string;
  dose: { grams: number; gramsPerLitre: number; rule: string } | null;
  ibuAdded: { value: number; min: number; max: number } | null;
  /** Familles citées (niveau, N fiches sur M) ; nom et statut dans families et cibleStyle du pack. */
  cited: { family: FamilyId; level: string; sources: number; of: number }[];
  /** IBU à la dose proposée et par gramme, pour chaque moment que V5.5 sait traiter (BrewingMath.hopIbu). */
  /** Présent sur les disponibles ; absent des listes longues (épuisés, catalogue) pour la taille du pack :
   * l'entrée garde ibuAdded au moment proposé, et ibuByMoment le recalcule sur demande. */
  ibuParMoment?: IbuAtMoment[];
  /** c7 (D175) : variété des sources à peu de données (une source, ou pas d'α) ; présent seulement quand c'est vrai. À égalité de toutes les
   * clés (même rang), elle passe derrière une variété documentée ; elle n'est jamais exclue. */
  peuDeDonnees?: true;
}
const round = (x: number, n = 1) => Math.round(x * 10 ** n) / 10 ** n;
const FIT_RANK: Record<FitClass, number> = { 'usage attesté': 0, cohérent: 1, 'peu documenté': 2, 'non documenté': 3, 'hors style': 4 };

export interface QuickAddOptions {
  /** Goûts du brasseur : variétés exclues retirées ; familles exclues traitées comme un conflit de dégustation. */
  gouts?: Gouts;
  /** Houblons hors stock (« à acheter ») gardés après classement (défaut 10). */
  catalogueLimit?: number;
  /** IBU par moment aussi sur les épuisés et le catalogue (défaut : disponibles seulement). */
  ibuParMomentPartout?: boolean;
  /** Toujours la proposition aromatique (10′, dose de recherche ou stock libre), même sous la bande d'IBU du style : jamais
   * de dose de compensation à 60′ (défaut : false, l'amérisant comble la bande). Maquette jouable, D40 point 1. */
  aromatique?: boolean;
}
export function quickAdds(recipe: Recipe, scale: StyleScale, tasting: Tasting | null = null, options: QuickAddOptions = {}):
  { disponibles: QuickAdd[]; epuises: QuickAdd[]; catalogue: QuickAdd[]; catalogueTotal: number; rule: string[]; tastingTrop: FamilyId[] } {
  const used = (key: string) => recipe.additions.filter((a) => a.hopKey === key).reduce((s, a) => s + a.grams, 0);
  const { excludedVarieties, excludedFamilies } = goutsSets(options.gouts);
  // Familles que la dégustation juge « trop » (ou hors style) face à la bande du style, plus celles que le brasseur exclut.
  const tasted = (tasting?.axes ?? []).filter((a) => a.perceivedRange && ['trop', 'hors style'].includes(valueVerdict({ range: a.perceivedRange }, scale.families[a.family]).verdict)).map((a) => a.family);
  const trop = [...new Set([...tasted, ...excludedFamilies])];
  const tagOf = (f: FamilyId) => (tasted.includes(f) ? `+ ${FAMILY_NAMES[f].toLowerCase()}` : `${FAMILY_NAMES[f].toLowerCase()} exclu (goût)`);
  const ibu0 = recipeIbu(recipe).value;
  const bitter = !options.aromatique && !!scale.ibu && ibu0 < scale.ibu[0];
  // D107 (P2) : la comparaison se fait par clé, non par variété : Citra simple reste candidat (à acheter) quand Citra cryo est au stock (D174).
  const inStock = new Set(stockDuMoteur().map((s) => s.key));
  const candidates = [...stockDuMoteur().map((s) => ({ key: s.key, grams: s.grams as number | null })), ...catalogueDuMoteur().filter((c) => !inStock.has(c.id)).map((c) => ({ key: c.id, grams: null }))]
    .filter((c) => !excludedVarieties.has(hopRef(c.key)!.varietyId));
  const fits = new Map(styleFit(candidates.map((c) => c.key), scale).map((r) => [r.key, r]));
  const varieteDe = new Map<string, string>();
  const rows = candidates.map((s): QuickAdd => {
    const ref = hopRef(s.key)!, fit = fits.get(s.key)!, desc = describeFamilies(ref.varietyId);
    const free = s.grams === null ? 0 : round(s.grams - used(s.key));
    const offStyle = scale.documented ? FAMILIES.filter((f) => scale.families[f].status !== 'attendue' && desc[f].level !== 'non décrit') : [];
    const niveau = (f: FamilyId) => (desc[f].level === 'marqué' ? 2 : 1);
    const offStyleWeight = offStyle.reduce((s, f) => s + niveau(f), 0);
    const poids = { indesirables: 0, attendues: 0, neutres: 0 };
    if (scale.documented) for (const f of FAMILIES) {
      if (desc[f].level === 'non décrit') continue;
      const statut = scale.families[f].status;
      poids[statut === 'attendue' ? 'attendues' : statut === 'indésirable' ? 'indesirables' : 'neutres'] += niveau(f);
    }
    varieteDe.set(s.key, ref.varietyId);
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
      rank: 0, key: s.key, name: ref.name, fit: fit.fit, alpha: hopAlpha(s.key), role: hopRole(s.key), supports: fit.supports, offStyle, conflicts: fit.conflicts,
      tastingConflicts, tags: tastingConflicts.map(tagOf), offStyleWeight,
      stock: { grams: s.grams ?? 0, free, status: s.grams === null ? 'à acheter' : s.grams <= 0 ? 'épuisé' : dose && free >= dose.grams ? 'suffisant' : 'manque' },
      moment, momentLabel: MOMENTS[moment].label, dose,
      ibuAdded: ibu && !ibu.unknown.length ? { value: round(ibu.value), min: round(ibu.min), max: round(ibu.max) } : null,
      cited: FAMILIES.filter((f) => desc[f].level !== 'non décrit').map((f) => ({ family: f, level: desc[f].level, sources: desc[f].sources, of: desc[f].of })),
      poids,
      ...(ref.catalogue.peuDeDonnees ? { peuDeDonnees: true as const } : {}),
    };
  });
  const cmpCles = (ka: number[], kb: number[]) => { for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; };
  const ranked = (list: QuickAdd[]) => {
    // D107 (P2, D174) : une forme (Citra cryo) et sa variété (Citra) sont deux candidats de la même liste ; la forme prend la plus mauvaise des deux clés
    // (ni l'α ni le stock ne la mettent devant sa variété), à égalité elle passe après, et suit sa variété pour le nom et les « peu de données ».
    const base = new Map(list.filter((r) => varieteDe.get(r.key) === r.key).map((r) => [r.key, r]));
    const lignes = list.map((r) => {
      const v = varieteDe.get(r.key)!, b = v === r.key ? undefined : base.get(v);
      const propre = quickAddKey(r), kb = b ? quickAddKey(b) : null;
      return { r, k: kb && cmpCles(kb, propre) > 0 ? kb : propre, forme: b ? 1 : 0, peu: Number(!!(b ?? r).peuDeDonnees), nom: (b ?? r).name };
    });
    // c7 (D175) : à égalité de toutes les clés, une variété à peu de données passe derrière une documentée (même rang : l'égalité reste dite), puis le nom.
    lignes.sort((a, b) => cmpCles(a.k, b.k) || a.peu - b.peu || a.nom.localeCompare(b.nom, 'fr') || a.forme - b.forme || a.r.name.localeCompare(b.r.name, 'fr'));
    lignes.forEach((l, i) => { l.r.rank = i > 0 && cmpCles(lignes[i - 1].k, l.k) === 0 ? lignes[i - 1].r.rank : i + 1; });
    return lignes.map((l) => l.r);
  };
  // D107 (P3) : ibuParMoment ne se calcule que pour les lignes rendues : les disponibles, et le reste seulement si on le demande.
  const avecIbu = (r: QuickAdd) => { r.ibuParMoment = ibuByMoment(r.key, r.dose?.grams ?? 0, recipe); return r; };
  const toBuy = ranked(rows.filter((r) => r.stock.status === 'à acheter'));
  const partout = (r: QuickAdd) => (options.ibuParMomentPartout ? avecIbu(r) : r);
  return { disponibles: ranked(rows.filter((r) => r.stock.status !== 'à acheter' && r.stock.free > 0)).map(avecIbu), epuises: ranked(rows.filter((r) => r.stock.status !== 'à acheter' && r.stock.free <= 0)).map(partout),
    catalogue: toBuy.slice(0, options.catalogueLimit ?? 10).map(partout), catalogueTotal: toBuy.length, rule: QUICK_ADD_RULE, tastingTrop: trop };
}
/** Clés du classement (voir QUICK_ADD_RULE), dans l'ordre lexicographique (D107, K3) : usage, conflit avec la dégustation, familles indésirables (poids),
 * familles attendues (poids, décroissant), familles neutres (poids, un frein après les attendues), stock libre. L'α n'y entre pas. */
export const quickAddKey = (r: QuickAdd) => [FIT_RANK[r.fit], r.tastingConflicts.length > 0 ? 1 : 0, r.poids.indesirables, -r.poids.attendues, r.poids.neutres, -r.stock.free];
