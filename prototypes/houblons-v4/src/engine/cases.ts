// Cas de figure de l'écran (work/refonte-frontend/v4/ecran-1/CAS.md) : recettes construites par règle.
import { STOCK, hopRef } from './data';
import { MOMENTS, additionIbu, gramsForIbu, ibuPerGram, recipeIbu, searchDoses, type Addition, type MomentId, type Recipe } from './recipe';
import { quickAdds } from './quickAdd';
import type { StyleScale } from '../style/scale';

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
