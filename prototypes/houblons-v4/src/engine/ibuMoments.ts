import { POLICY, hopRef } from './data';
import { MOMENTS, ibuPerGram, type MomentId, type Recipe } from './recipe';

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
    return { code, label: m.label, type: 'à froid', v55Timing: m.timing, ibuModel: 'aucun : houblonnage à cru sans IBU Tinseth',
      when: { unit: 'jour de houblonnage à cru', temperatureC: d.temperatureC!.central, contactHours: d.contactHours!.central,
        note: `Jour d’ajout non modélisé ; contact supposé ${d.contactHours!.central} h à ${d.temperatureC!.central} °C (préréglage du solveur V5.5).` } };
  });
}

export interface IbuAtMoment {
  code: MomentId; label: string; modelled: boolean;
  /** IBU à la dose proposée : valeur (alpha retenu) et plage (alpha min–max) ; null si non modélisé ou alpha inconnu. */
  ibu: { value: number; min: number; max: number } | null;
  /** IBU par gramme, pour afficher « 5 g → +N IBU » sans calcul maison. */
  ibuPerGram: { value: number; min: number; max: number } | null;
  raison?: string;
}
const r2 = (x: number) => Math.round(x * 100) / 100, r1 = (x: number) => Math.round(x * 10) / 10;
/** IBU par moment pour un houblon et une dose, par BrewingMath.hopIbu (importé de l'app). */
export function ibuByMoment(hopKey: string, grams: number, recipe: Recipe): IbuAtMoment[] {
  const ref = hopRef(hopKey);
  return IBU_MOMENTS.map((code) => {
    const label = MOMENTS[code].label;
    if (MOMENTS[code].timing === 'fermentation' || MOMENTS[code].timing === 'postFermentation')
      return { code, label, modelled: false, ibu: null, ibuPerGram: null,
        raison: 'Houblonnage à cru : pas d’IBU Tinseth. L’amertume des humulinones relève d’un modèle séparé (hopBitternessCore, Maye 2016), non branché ici ; aucun chiffre n’est donné.' };
    if (!ref?.alpha) return { code, label, modelled: true, ibu: null, ibuPerGram: null, raison: 'Alpha inconnu : IBU incalculable.' };
    const k = (a: number) => ibuPerGram(a, code, recipe);
    const perGram = { value: r2(k(ref.alpha.value)), min: r2(k(ref.alpha.min)), max: r2(k(ref.alpha.max)) };
    return { code, label, modelled: true, ibuPerGram: perGram,
      ibu: { value: r1(grams * k(ref.alpha.value)), min: r1(grams * k(ref.alpha.min)), max: r1(grams * k(ref.alpha.max)) } };
  });
}
