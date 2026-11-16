// e10c (Adapter les volumes) : les quantités rangées par moment du jour de brassage. Aucune formule ici : tout vient de
// `scaleBrewRecipeScenario` (calc existant) ; ce module ne fait que ranger et comparer deux résultats déjà calculés.
import type { AdjunctIngredient, HopIngredient, Recipe } from '../../../types';
import type { scaleBrewRecipeScenario } from '../../../domain/finance/brewBudgetScaling';
import { nombreFr } from '../../../domain/nombreAffiche';
import { normalizeHop } from '../../../domain/hopStage';

export type Mise = ReturnType<typeof scaleBrewRecipeScenario>;
export type EtapeId = 'empatage' | 'rincage' | 'ebullition' | 'whirlpool' | 'levurage' | 'dryhop' | 'autres';

export interface LigneEtape {
  cle: string;
  nom: string;
  /** Quantité à la cible ; null = inconnue (jamais 0). */
  valeur: number | null;
  /** Écart avec la recette source, même unité ; absent quand le volume cible est celui de la recette. */
  ecart?: number;
  decimales: number;
  unite: string;
  /** Houblon : sert à chercher ses familles d'arômes. */
  houblon?: string;
}
export interface Etape { id: EtapeId; titre: string; detail: string; couleur: string; lignes: LigneEtape[] }

const COULEUR: Record<EtapeId, string> = {
  empatage: 'var(--water)', rincage: 'var(--water)', ebullition: 'var(--ebc-copper-texte)', whirlpool: 'var(--ebc-amber-texte)',
  levurage: 'var(--area-agenda)', dryhop: 'var(--hop)', autres: 'var(--cave-600)'
};
const TITRE: Record<EtapeId, string> = {
  empatage: 'Empâtage', rincage: 'Rinçage', ebullition: 'Ébullition', whirlpool: 'Whirlpool', levurage: 'Levurage', dryhop: 'Dry hop', autres: 'Autres ajouts'
};
const ORDRE: EtapeId[] = ['empatage', 'rincage', 'ebullition', 'whirlpool', 'levurage', 'dryhop', 'autres'];

/** Étape d'un adjuvant d'après son champ libre `step` (« Empattage », « Ébullition », « Whirlpool », « Fermenteur »…). */
export function etapeAdjuvant(step: string | undefined): EtapeId {
  const s = (step ?? '').toLowerCase();
  if (/emp[aâ]t/.test(s)) return 'empatage';
  if (/rin[cç]/.test(s)) return 'rincage';
  if (/whirl|flame|hop stand/.test(s)) return 'whirlpool';
  if (/[eé]bull|boil/.test(s)) return 'ebullition';
  if (/levur|ferment/.test(s)) return 'levurage';
  if (/cru|dry/.test(s)) return 'dryhop';
  return 'autres';
}
const etapeHoublon = (h: HopIngredient): EtapeId => {
  const stage = normalizeHop(h).stage;
  return stage === 'dryHop' ? 'dryhop' : stage === 'whirlpool' ? 'whirlpool' : 'ebullition';
};
/** Un fermentescible hors empâtage entre à l'ébullition ou au fermenteur. */
const etapeFermentescible = (use: string | undefined): EtapeId => use === 'ebullition' ? 'ebullition' : use === 'fermentation' ? 'levurage' : 'empatage';

const uniques = (xs: Array<string | undefined>) => [...new Set(xs.filter((x): x is string => !!x))];
const minutes = (hops: HopIngredient[]) => uniques(hops.map(h => h.timeMin != null && h.timeMin > 0 ? `${nombreFr(h.timeMin, 0)}′` : undefined));

/** Le calcul de l'eau a abouti (pas « invalid » : masse de grain ou volume manquant). */
export const eauCalculee = (m: Mise) => m.waterPlan?.planningStatus !== 'invalid';

/** Les étapes à la cible ; `source` (même recette à son volume) donne l'écart. `source` null : aucun écart. */
export function etapesDe(recette: Recipe, cible: Mise, source: Mise | null): Etape[] {
  const lignes: Record<EtapeId, LigneEtape[]> = { empatage: [], rincage: [], ebullition: [], whirlpool: [], levurage: [], dryhop: [], autres: [] };
  const ecart = (a: number | null, b: number | null | undefined) => (source && a != null && b != null ? a - b : undefined);
  const grainsSrc = source?.scaledRecipe.fermentables ?? [];
  const hopsSrc = source?.scaledRecipe.hops ?? [];
  const adjSrc = source?.scaledRecipe.adjuncts ?? [];

  // Le calcul de l'eau refuse sans grain à l'empâtage (plan « invalid », tout à 0) : l'eau est alors inconnue, « — », jamais 0 L.
  const eauConnue = eauCalculee(cible);
  lignes.empatage.push({ cle: 'eau-empatage', nom: 'Eau d’empâtage', valeur: eauConnue ? cible.mashWaterL : null, ecart: ecart(cible.mashWaterL, source?.mashWaterL), decimales: 1, unite: 'L' });
  lignes.rincage.push({ cle: 'eau-rincage', nom: 'Eau de rinçage', valeur: eauConnue ? cible.spargeWaterL : null, ecart: ecart(cible.spargeWaterL, source?.spargeWaterL), decimales: 1, unite: 'L' });
  (cible.scaledRecipe.fermentables ?? []).forEach((m, i) => lignes[etapeFermentescible(m.use)].push({
    cle: `m${i}`, nom: m.name, valeur: m.weightKg, ecart: ecart(m.weightKg, grainsSrc[i]?.weightKg), decimales: 2, unite: 'kg' }));
  (cible.scaledRecipe.hops ?? []).forEach((h, i) => lignes[etapeHoublon(h)].push({
    cle: `h${i}`, nom: h.name, valeur: h.weightG, ecart: ecart(h.weightG, hopsSrc[i]?.weightG), decimales: 0, unite: 'g', houblon: h.name }));
  (cible.scaledRecipe.adjuncts ?? []).forEach((a: AdjunctIngredient, i: number) => lignes[etapeAdjuvant(a.step)].push({
    cle: `a${i}`, nom: a.name, valeur: a.amount, ecart: ecart(a.amount, adjSrc[i]?.amount), decimales: a.unit === 'g' || a.unit === 'mL' ? 0 : 2, unite: a.unit }));
  const levure = cible.scaledRecipe.yeast;
  if (levure?.name) {
    const qte = levure.qty ?? null;
    lignes.levurage.unshift({
      cle: 'levure', nom: levure.name, valeur: qte, ecart: ecart(qte, source?.scaledRecipe.yeast?.qty), decimales: qte != null && Number.isInteger(qte) ? 0 : 2,
      unite: levure.unit === 'sachet' && (qte ?? 0) > 1 ? 'sachets' : levure.unit ?? ''
    });
  }

  const hops = (cible.scaledRecipe.hops ?? []).map(normalizeHop);
  const tmash = recette.mash?.steps?.[0];
  const detail: Record<EtapeId, string> = {
    empatage: tmash ? `${nombreFr(tmash.tempC, 0)} °C · ${nombreFr(tmash.durationMin, 0)}′` : '',
    rincage: '',
    ebullition: minutes(hops.filter(h => h.stage === 'boil' || h.stage === 'firstWort')).join(' · ') || (recette.boilMin ? `${nombreFr(recette.boilMin, 0)}′` : ''),
    whirlpool: minutes(hops.filter(h => h.stage === 'whirlpool')).join(' · '),
    levurage: recette.fermentation?.[0] ? `${nombreFr(recette.fermentation[0].tempC, 0)} °C` : '',
    dryhop: uniques(hops.filter(h => h.stage === 'dryHop').map(h => h.dayOffset != null && h.dayOffset >= 0 ? `J+${nombreFr(h.dayOffset, 0)}` : undefined)).join(' · '),
    autres: ''
  };
  return ORDRE.filter(id => lignes[id].length).map(id => ({ id, titre: TITRE[id], detail: detail[id], couleur: COULEUR[id], lignes: lignes[id] }));
}

/** Les trois totaux de la tête : eau, grain, houblon (kg de grain seulement, g de houblon de toute la recette). */
export function totauxDe(m: Mise): { eauL: number | null; grainKg: number; houblonG: number } {
  const f = m.scaledRecipe.fermentables ?? [];
  return {
    eauL: !eauCalculee(m) ? null : m.mashWaterL + m.spargeWaterL,
    grainKg: f.filter(x => (x.kind ?? 'grain') === 'grain').reduce((s, x) => s + x.weightKg, 0),
    houblonG: (m.scaledRecipe.hops ?? []).reduce((s, h) => s + (h.weightG || 0), 0)
  };
}

/** L'écart à l'écran : « +3,33 », « −0,5 » (signe moins typographique) ; vide quand il s'arrondit à zéro. */
export function ecartAffiche(e: number | undefined, decimales: number): string {
  if (e === undefined || !Number.isFinite(e)) return '';
  const arrondi = Math.round(e * 10 ** decimales) / 10 ** decimales;
  if (arrondi === 0) return '';
  return `${arrondi > 0 ? '+' : '−'}${nombreFr(Math.abs(arrondi), decimales)}`;
}
