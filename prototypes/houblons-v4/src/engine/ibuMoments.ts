import { POLICY, hopRef } from './data';
import { MOMENTS, ibuPerGram, ibuPerGramAt, type MomentId, type Recipe } from './recipe';

/** Liste canonique des types d'ajout et du « quand » (unités), dans l'ordre d'affichage. */
export interface MomentInfo {
  code: MomentId; label: string;
  type: 'premier moût' | 'ébullition' | 'whirlpool' | 'à froid';
  /** Code de moment du moteur V5.5 (HopTriplet.timing). */
  v55Timing: string;
  when: { unit: string; minutes?: number; temperatureC?: number; contactHours?: number; note: string };
  ibuModel: string;
}
const wp = POLICY.defaults.whirlpool, dry = POLICY.defaults.fermentation, post = POLICY.defaults.postFermentation;
export const IBU_MOMENTS: MomentId[] = ['fwh', 'b60', 'b30', 'b15', 'b10', 'b5', 'b0', 'wp', 'dryActive', 'dryPost'];
export function momentCatalogue(boilMin = 60): MomentInfo[] {
  return IBU_MOMENTS.map((code): MomentInfo => {
    const m = MOMENTS[code];
    if (code === 'fwh') return { code, label: m.label, type: 'premier moût', v55Timing: m.timing, ibuModel: 'Tinseth sur toute l’ébullition, +10 % (BrewingMath.hopIbu)',
      when: { unit: 'minutes d’ébullition', minutes: boilMin, note: 'Présent toute l’ébullition de la recette.' } };
    if (m.timing === 'boil') return { code, label: m.label, type: 'ébullition', v55Timing: m.timing, ibuModel: 'Tinseth (BrewingMath.hopIbu)',
      when: { unit: 'minutes d’ébullition restantes', minutes: m.minutes, note: code === 'b0' ? 'Ajout à l’arrêt du feu : Tinseth à 0 min ne compte aucune isomérisation ; l’amertume pendant le refroidissement n’est pas modélisée.' : 'Durée d’ébullition restante après l’ajout.' } };
    if (code === 'wp') return { code, label: m.label, type: 'whirlpool', v55Timing: m.timing, ibuModel: 'Tinseth atténué par la température : moitié moins d’isomérisation tous les 10 °C sous l’ébullition (BrewingMath.hopIbu)',
      when: { unit: '°C et minutes de whirlpool', temperatureC: wp.temperatureC!.central, minutes: Math.round(wp.contactHours!.central * 60), note: 'Valeurs supposées : 80 °C et 20 min, repli de BrewingMath et préréglage du solveur V5.5.' } };
    const d = code === 'dryActive' ? dry : post;
    return { code, label: m.label, type: 'à froid', v55Timing: m.timing, ibuModel: 'aucun : houblonnage à cru sans IBU Tinseth. L’amertume des humulinones relève d’un modèle séparé (hopBitternessCore, Maye 2016), non branché ici ; aucun chiffre n’est donné.',
      when: { unit: 'jour de houblonnage à cru', temperatureC: d.temperatureC!.central, contactHours: d.contactHours!.central,
        note: `Jour d’ajout non modélisé ; contact supposé ${d.contactHours!.central} h à ${d.temperatureC!.central} °C (préréglage du solveur V5.5).` } };
  });
}

export interface IbuAtMoment {
  /** Code du moment ; libellé, type et « quand » dans momentCatalogue (pack : moments). */
  code: MomentId; modelled: boolean;
  /** IBU à la dose proposée : valeur (alpha retenu) et plage (alpha min–max) ; null si non modélisé ou alpha inconnu. */
  ibu: { value: number; min: number; max: number } | null;
  /** IBU par gramme, pour afficher « 5 g → +N IBU » sans calcul maison. */
  ibuPerGram: { value: number; min: number; max: number } | null;
  raison?: string;
}
const r2 = (x: number) => Math.round(x * 100) / 100, r1 = (x: number) => Math.round(x * 10) / 10;
/** Raison courte ; le détail (humulinones, Maye 2016, hopBitternessCore non branché) est dans momentCatalogue. */
export const DRY_REASON = 'À cru : non modélisé (voir moments).';
// ---------- Tables libres : tout « quand » est une variable (tranches de 5′, aucune durée figée) ----------
const steps = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
/** Minutes restantes d'ébullition : 0 à 240 par 5 (49 valeurs). La page borne avec la durée choisie. */
export const MINUTES_5 = steps(0, 240, 5);
/** Durées d'ébullition pour le premier moût : 5 à 240 par 5 (48 valeurs). */
export const BOIL_LENGTHS = steps(5, 240, 5);
/** Whirlpool : 60 à 100 °C par 5, 5 à 60 min par 5. */
export const WP_TEMPERATURES = steps(60, 100, 5);
export const WP_MINUTES = steps(5, 60, 5);
/** Densité initiale : 1,030 à 1,120 par 0,005 (facteur de Tinseth, relatif à la densité de la recette). */
export const OG_STEPS = steps(1030, 1120, 5).map((x) => x / 1000);
export const TABLES_RULE = [
  'IBU à la dose de l’ajout et à l’alpha retenu (BrewingMath.hopIbu : volume de la recette pris comme volume d’ébullition, densité initiale de la recette). L’IBU est proportionnel à l’alpha : la plage d’alpha donne la plage d’IBU.',
  'Ébullition (ibuParMinute5) : minutes restantes de 0 à 240 par 5, sans borne : la page borne avec la durée d’ébullition choisie. Tinseth ne dépend que des minutes restantes, pas de la durée totale.',
  'Premier moût (ibuPremierMout) : une valeur par durée d’ébullition, de 5 à 240 par 5 (alignée sur dureesPremierMout). Relation exacte de BrewingMath : premier moût pour la durée d = 1,10 × ibuParMinute5 à la minute d (arrondis à part).',
  'Whirlpool (ibuWhirlpool) : 60 à 100 °C par 5 et 5 à 60 min par 5. Relation exacte : whirlpool(T, m) = ibuParMinute5[m] × 2^((T − 100) / 10).',
  'Volume : à g/L égal, l’IBU ne dépend pas du volume (BrewingMath : IBU ∝ g/L) ; les tables valent pour la dose en g/L de l’ajout.',
  'Densité : facteurDensite donne, de 1,030 à 1,120 par 0,005, le rapport d’IBU à la densité de la recette (facteur de Tinseth) ; IBU à une autre densité = valeur de table × facteur.',
  'BrewingMath ne fait varier ni la densité ni le volume pendant l’ébullition.',
];
export interface IbuTables {
  alphaUtilise: number | null;
  ibuParMinute5: number[] | null;
  /** Une valeur par durée d'ébullition de BOIL_LENGTHS (5 à 240 par 5). */
  ibuPremierMout: number[] | null;
  whirlpool: { ibu: number[][] } | null;
  raison?: string;
}
/** Rapport d'IBU entre une densité et celle de la recette (BrewingMath : facteur de Tinseth). */
export function densityFactors(recipe: Recipe) {
  const ref = ibuPerGramAt(10, 'boil', 60, undefined, recipe);
  return OG_STEPS.map((og) => ({ og, facteur: Math.round((ibuPerGramAt(10, 'boil', 60, undefined, { ...recipe, og }) / ref) * 1000) / 1000 }));
}
/** Tables d'IBU d'un ajout à sa dose (voir TABLES_RULE). */
export function ibuTables(hopKey: string, grams: number | null, recipe: Recipe): IbuTables {
  const a = hopRef(hopKey)?.alpha?.value;
  if (a === undefined || grams === null) return { alphaUtilise: a ?? null, ibuParMinute5: null, ibuPremierMout: null, whirlpool: null, raison: a === undefined ? 'Alpha inconnu : IBU incalculable.' : 'Dose inconnue.' };
  const at = (stage: 'firstWort' | 'boil' | 'whirlpool', t: number | undefined, temp: number | undefined, boil = recipe.boilMin) => r1(grams * ibuPerGramAt(a, stage, t, temp, recipe, boil));
  return {
    alphaUtilise: a,
    ibuParMinute5: MINUTES_5.map((m) => at('boil', m, undefined)),
    ibuPremierMout: BOIL_LENGTHS.map((b) => at('firstWort', undefined, undefined, b)),
    whirlpool: { ibu: WP_TEMPERATURES.map((t) => WP_MINUTES.map((m) => at('whirlpool', m, t))) },
  };
}
/** Houblonnage à cru : le jour est libre ; aucune IBU ; le moteur ne relie pas le jour à la phase. */
export const DRY_HOP_DAY = {
  jours: { min: 0, max: null as number | null, accepte: 'V5.5 accepte dayOffset de 0 à 365 jours (brewerProposals, recipeImportResult)' }, ibu: null,
  regle: 'Jour libre, sans borne imposée par le moteur, sans IBU Tinseth. Le moteur V5.5 ne déduit pas la phase du jour : HopRecipeInput.dayOffset est validé mais pas utilisé pour l’arôme, et hopTripletsOfRecipe refuse explicitement de deviner la phase de fermentation à partir du jour. La phase est un choix explicite : « en fermentation active » (biotransformation possible, estimée) ou « après fermentation » ; elle dépend de la levure et du programme de fermentation, non modélisés ici.',
  source: 'functions/src/hopPredictionCore.ts (hopTripletsOfRecipe) ; functions/src/hopRecipePrediction.ts (dayOffset)',
};

/** IBU par moment pour un houblon et une dose, par BrewingMath.hopIbu (importé de l'app). */
export function ibuByMoment(hopKey: string, grams: number, recipe: Recipe): IbuAtMoment[] {
  const ref = hopRef(hopKey);
  return IBU_MOMENTS.map((code) => {
    if (MOMENTS[code].timing === 'fermentation' || MOMENTS[code].timing === 'postFermentation')
      return { code, modelled: false, ibu: null, ibuPerGram: null, raison: DRY_REASON };
    if (!ref?.alpha) return { code, modelled: true, ibu: null, ibuPerGram: null, raison: 'Alpha inconnu : IBU incalculable.' };
    const k = (a: number) => ibuPerGram(a, code, recipe);
    const perGram = { value: r2(k(ref.alpha.value)), min: r2(k(ref.alpha.min)), max: r2(k(ref.alpha.max)) };
    return { code, modelled: true, ibuPerGram: perGram,
      ibu: { value: r1(grams * k(ref.alpha.value)), min: r1(grams * k(ref.alpha.min)), max: r1(grams * k(ref.alpha.max)) } };
  });
}
