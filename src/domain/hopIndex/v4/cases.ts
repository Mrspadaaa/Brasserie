// Cas de figure de l'écran (work/refonte-frontend/v4/ecran-1/CAS.md) : recettes construites par règle.
import { STOCK, hopRef } from './data';
import { MOMENTS, additionIbu, gramsForIbu, ibuPerGram, recipeIbu, searchDoses, type Addition, type MomentId, type Recipe } from './recipe';
import { quickAdds, quickAddKey, type QuickAdd } from './quickAdd';
import { POLICY } from './data';
import { ficheLevels } from './levels';
import { ROLE_RULE } from './roles';
import { additionEffect } from './voies';
import protoData from '../../../data/hopV4/proto-data.json';
import type { StyleScale } from './style/scale';

export const LOADED_RECIPE_RULE = [
  'Quatre ajouts : amérisant à 60′, ajout à 10′, whirlpool, houblonnage à froid à J+3 (fermentation active).',
  'Ajouts d’arôme : dans l’ordre 10′, whirlpool, J+3, le premier houblon des ajouts rapides du style (règle QUICK_ADD_RULE, sans dégustation), différent des précédents, dont le stock libre couvre la dose.',
  'Doses d’arôme : la plus petite dose de recherche du solveur V5.5 pour le moment (g/L × volume).',
  'Amérisant (Nugget à 60′) : la dose qui amène l’IBU total au milieu de la bande du style, au gramme près si l’écart reste ≤ 0,5 IBU, sinon au dixième ; le dry hop n’ajoute pas d’IBU Tinseth.',
];
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Recette chargée (K3, S5) depuis une recette de base et le stock. */
export function loadedRecipe(base: Recipe, scale: StyleScale, bitteringKey = 'beermaverick-nugget'): Recipe {
  const empty: Recipe = { ...base, additions: [] };
  // L'ordre des ajouts rapides ne dépend pas du moment proposé : seulement du style et des fiches.
  const order = quickAdds(empty, scale).disponibles.map((q) => q.key);
  const additions: Addition[] = [];
  const plan: { id: string; moment: MomentId; day?: number }[] = [{ id: 'a10', moment: 'b10' }, { id: 'awp', moment: 'wp' }, { id: 'adry', moment: 'dryActive', day: 3 }];
  for (const p of plan) {
    const grams = searchDoses(p.moment)[0] * base.volumeL;
    const key = order.find((k) => k !== bitteringKey && !additions.some((a) => a.hopKey === k) && (STOCK.find((s) => s.key === k)?.grams ?? 0) >= grams);
    if (key) additions.push({ id: p.id, hopKey: key, moment: p.moment, grams: round1(grams), ...(p.day ? { day: p.day } : {}) });
  }
  const aroma = recipeIbu({ ...base, additions }).value;
  const target = scale.ibu ? (scale.ibu[0] + scale.ibu[1]) / 2 : aroma;
  const ref = hopRef(bitteringKey)!;
  const exact = gramsForIbu(Math.max(0, target - aroma), ref, 'b60', base) ?? 0;
  const k = ref.alpha ? ibuPerGram(ref.alpha.value, 'b60', base) : 0;
  const grams = [1, 0.5, 0.1].map((step) => Math.round(exact / step) * step).find((g) => Math.abs(aroma + g * k - target) <= 0.5) ?? exact;
  return { ...base, additions: [{ id: 'a60', hopKey: bitteringKey, moment: 'b60', grams: round1(grams) }, ...additions] };
}

// ---------- Recette vide : construire comme un brasseur (S4) ----------
export const CONSTRUCTION_RULE = {
  amerisants: 'Amérisants : rôle amérisant ou double, α ≥ 10 % ; classés par adéquation au style (QUICK_ADD_RULE), rôle amérisant avant double, moins de familles neutres ou indésirables citées, α décroissant, stock libre ; deux propositions, au choix : chacune seule à 60′, dosée par BrewingMath.hopIbu pour le milieu de la bande d’IBU du style.',
  momentArome: 'Moment d’arôme : premier moment d’arôme du préréglage houblon du style dans le solveur V5.5 (hopSolverBootstrap, styles[].timings : ébullition → 10′, whirlpool → whirlpool, fermentation → à froid en fermentation active, après fermentation → à froid après fermentation).',
  doseArome: 'Dose d’arôme : dose de départ du solveur V5.5 pour ce moment (hopSolverBootstrap, defaults[moment].doseGL, « presets de formulation à adapter »), × volume.',
  aromatiques: 'Aromatiques : rôle aromatique ou double, hors amérisants proposés ; classés par QUICK_ADD_RULE (adéquation au style, familles neutres pondérées, familles attendues citées, stock libre) ; trois propositions, avec leur effet établi par famille (apport V5.5 des familles citées).',
};
const TIMING_TO_MOMENT: Record<string, MomentId> = { boil: 'b10', whirlpool: 'wp', fermentation: 'dryActive', postFermentation: 'dryPost' };
const FIT_ORDER: Record<string, number> = { 'usage attesté': 0, cohérent: 1, 'peu documenté': 2, 'non documenté': 3, 'hors style': 4 };

/** Ajouts rapides d'une recette vide : amérisants à 60′ puis aromatiques tardifs, chacun avec sa règle. */
export function buildFromEmpty(recipe: Recipe, scale: StyleScale) {
  const q = quickAdds(recipe, scale, null, { catalogueLimit: 10000 });
  const all = [...q.disponibles, ...q.epuises, ...q.catalogue];
  const mid = scale.ibu ? (scale.ibu[0] + scale.ibu[1]) / 2 : null;
  const etat = (k: string) => { const s = STOCK.find((x) => x.key === k); return !s ? 'hors stock' : s.grams <= 0 ? 'épuisé' : 'en stock'; };
  const base = (r: QuickAdd) => ({ key: r.key, name: r.name, alpha: r.alpha, role: r.role, fit: r.fit,
    stock: { etat: etat(r.key), grams: r.stock.grams, libre: r.stock.free }, fiches: ficheLevels(hopRef(r.key)!.varietyId, scale).map(({ family, level }) => ({ family, level })) });
  // 1. Amérisants à 60′.
  const bitter = all.filter((r) => r.alpha && r.alpha.value >= 10 && (r.role.value === 'amérisant' || r.role.value === 'double'))
    .sort((a, b) => FIT_ORDER[a.fit] - FIT_ORDER[b.fit] || Number(a.role.value === 'double') - Number(b.role.value === 'double') || a.offStyleWeight - b.offStyleWeight
      || b.alpha!.value - a.alpha!.value || b.stock.free - a.stock.free || a.name.localeCompare(b.name, 'fr'))
    .slice(0, 2).map((r) => {
      const ref = hopRef(r.key)!;
      const g = mid === null ? null : gramsForIbu(mid, ref, 'b60', recipe);
      const ibu = g === null ? null : additionIbu({ id: 'b', hopKey: r.key, moment: 'b60', grams: round1(g) }, recipe);
      return { ...base(r), moment: 'b60' as MomentId, momentLabel: MOMENTS.b60.label,
        dose: g === null ? null : { grams: round1(g), gramsPerLitre: Math.round((g / recipe.volumeL) * 100) / 100, regle: 'milieu de la bande d’IBU' },
        ibu: ibu ? { value: round1(ibu.value), min: round1(ibu.min), max: round1(ibu.max) } : null, alternative: true };
    });
  // 2. Aromatiques au moment d'arôme du préréglage du style.
  const preset = (protoData.styles as { code: string; hopPreset: string | null }[]).find((s) => s.code === scale.code)?.hopPreset ?? null;
  const policyStyle = POLICY.styles.find((p) => p.id === preset);
  const timing = policyStyle?.timings.find((t) => TIMING_TO_MOMENT[t]) ?? null;
  const moment: MomentId | null = timing ? TIMING_TO_MOMENT[timing] : null;
  const doseGL = timing ? POLICY.defaults[timing as keyof typeof POLICY.defaults].doseGL?.central ?? null : null;
  const used = new Set(bitter.map((b) => b.key));
  const aroma = moment && doseGL ? [...q.disponibles, ...q.epuises, ...q.catalogue]
    .filter((r) => !used.has(r.key) && (r.role.value === 'aromatique' || r.role.value === 'double'))
    .sort((a, b) => { const ka = quickAddKey(a), kb = quickAddKey(b); for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return a.name.localeCompare(b.name, 'fr'); })
    .slice(0, 3).map((r) => {
      const a: Addition = { id: 'a', hopKey: r.key, moment, grams: round1(doseGL * recipe.volumeL) };
      const ibu = additionIbu(a, recipe);
      const cold = MOMENTS[moment].timing === 'fermentation' || MOMENTS[moment].timing === 'postFermentation';
      const eff = additionEffect(a, recipe);
      return { ...base(r), moment, momentLabel: MOMENTS[moment].label,
        dose: { grams: a.grams, gramsPerLitre: doseGL, regle: `dose de départ du solveur V5.5 (${MOMENTS[moment].label})` },
        ibu: cold ? null : { value: round1(ibu.value), min: round1(ibu.min), max: round1(ibu.max) },
        effetEtabli: eff ? Object.values(eff).filter((e) => e.established && e.central !== null).map((e) => ({ family: e.family, points: e.central, crans: Math.round((e.central! / scale.families[e.family].cran) * 100) / 100 })) : null };
    }) : [];
  return {
    style: scale.code, mode: 'construction', ibuCible: mid,
    preset: policyStyle ? { id: policyStyle.id, name: policyStyle.name, timings: policyStyle.timings, source: policyStyle.source.title } : null,
    amerisants: bitter, aromatiques: aroma,
    regles: { role: ROLE_RULE, ...CONSTRUCTION_RULE },
    note: 'Deux amérisants au choix (un seul suffit pour l’IBU visé), puis trois aromatiques ; stock donné à titre d’information (« je fais une recette puis j’achète »).',
  };
}

/** Liste d'achats : la recette d'abord, le stock informe (« je fais une recette puis j'achète »).
 * Par ajout : besoin, stock libre restant avant cet ajout, manque (g) ; par variété : total. */
export function shoppingList(recipe: Recipe) {
  const left = new Map(STOCK.map((s) => [s.key, Math.max(0, s.grams)]));
  const lignes = recipe.additions.map((a) => {
    const free = left.get(a.hopKey) ?? 0;
    left.set(a.hopKey, Math.max(0, free - a.grams));
    return { additionId: a.id, hopKey: a.hopKey, name: hopRef(a.hopKey)?.name ?? a.hopKey, moment: a.moment, besoin: round1(a.grams), stockLibre: round1(free), manque: round1(Math.max(0, a.grams - free)) };
  });
  const keys = [...new Set(recipe.additions.map((a) => a.hopKey))];
  const parVariete = keys.map((k) => {
    const besoin = recipe.additions.filter((a) => a.hopKey === k).reduce((s, a) => s + a.grams, 0);
    const stock = Math.max(0, STOCK.find((s) => s.key === k)?.grams ?? 0);
    return { hopKey: k, name: hopRef(k)?.name ?? k, besoin: round1(besoin), stock: round1(stock), manque: round1(Math.max(0, besoin - stock)), enStock: STOCK.some((s) => s.key === k) };
  });
  return { unite: 'g', lignes, parVariete, aAcheter: parVariete.filter((v) => v.manque > 0), totalManque: round1(parVariete.reduce((s, v) => s + v.manque, 0)) };
}

/** Ligne de recette prête à dessiner : type d'ajout, moment, dose, IBU à son moment, stock. */
export function recipeLines(recipe: Recipe) {
  const type = (m: MomentId) => (MOMENTS[m].timing === 'whirlpool' ? 'whirlpool' : MOMENTS[m].timing === 'firstWort' ? 'premier moût' : MOMENTS[m].timing === 'boil' ? 'ébullition' : 'à froid');
  return recipe.additions.map((a) => {
    const s = STOCK.find((x) => x.key === a.hopKey);
    const used = recipe.additions.filter((x) => x.hopKey === a.hopKey).reduce((t, x) => t + x.grams, 0);
    const ibu = additionIbu(a, recipe);
    return { additionId: a.id, hopKey: a.hopKey, name: hopRef(a.hopKey)?.name ?? a.hopKey, type: type(a.moment), moment: a.moment, momentLabel: MOMENTS[a.moment].label,
      ...(a.day ? { day: a.day, dayLabel: `J+${a.day}` } : {}), grams: a.grams, gramsPerLitre: Math.round((a.grams / recipe.volumeL) * 100) / 100,
      ibu: MOMENTS[a.moment].timing === 'fermentation' || MOMENTS[a.moment].timing === 'postFermentation' ? null : { value: round1(ibu.value), min: round1(ibu.min), max: round1(ibu.max) },
      stock: { grams: s?.grams ?? 0, status: !s || s.grams <= 0 ? 'épuisé' : s.grams >= used ? 'suffisant' : 'manque', missing: s && s.grams > 0 && s.grams < used ? round1(used - s.grams) : !s || s.grams <= 0 ? round1(used) : 0 } };
  });
}
