// Données de l'écran : le pack des mini-prototypes (scénario S1) et le moteur v4, qui importe
// le moteur V5.5 de l'app. Aucun calcul du domaine ici : l'IBU passe par additionIbu et
// recipeIbu du moteur v4, qui appellent BrewingMath.hopIbu (src/services/brewingMath.ts).
import pack from '../../data/pack-mini-protos.json';
import {
  FAMILY_NAMES, MOMENTS, additionIbu, getStyleScale, hopRef, recipeIbu,
  type Addition, type FamilyId, type MomentId, type Recipe, type StyleScale,
} from '../../../../src/domain/hopIndex/v4';

interface AjoutRapidePack { key: string; name: string; moment: MomentId; dose: { grams: number }; stock: { free: number } }
interface DirectionPack { family: FamilyId; name: string; crans: number; targetAbsolute: number | null; targetFrom: string }
const S1 = pack.scenarios.S1 as unknown as {
  recipe: Recipe; direction: DirectionPack[]; ajoutsRapides: { disponibles: AjoutRapidePack[] };
};

export const RECETTE: Recipe = S1.recipe;
export const STYLE: StyleScale = getStyleScale(RECETTE.styleCode);
/** État B : la direction « + floral, − résineux » du scénario S1, avec ses cibles. */
export const DIRECTION_B: DirectionPack[] = S1.direction;
/** Ajouts en un toucher (règle QUICK_ADD_RULE du moteur), disponibles en stock. */
export const AJOUTS_RAPIDES: AjoutRapidePack[] = S1.ajoutsRapides.disponibles.slice(0, 3);
export { FAMILY_NAMES };

export const nomHoublon = (key: string) => hopRef(key)?.name ?? key;

// ---------- Type d'ajout et moment (présentation des moments du moteur v4) ----------
export type TypeAjout = 'premier moût' | 'ébullition' | 'whirlpool' | 'à froid';
export const TYPES: TypeAjout[] = ['premier moût', 'ébullition', 'whirlpool', 'à froid'];
const QUAND: Record<TypeAjout, MomentId[]> = {
  'premier moût': ['fwh'], ébullition: ['b60', 'b30', 'b15', 'b10', 'b5'], whirlpool: ['wp'], 'à froid': ['dryActive', 'dryPost'],
};
export function typeAjout(m: MomentId): TypeAjout {
  const t = MOMENTS[m].timing;
  return t === 'firstWort' ? 'premier moût' : t === 'boil' ? 'ébullition' : t === 'whirlpool' ? 'whirlpool' : 'à froid';
}
/** Type suivant (toucher sur la pastille du type) : premier moment de ce type. */
export const typeSuivant = (m: MomentId): MomentId => QUAND[TYPES[(TYPES.indexOf(typeAjout(m)) + 1) % TYPES.length]][0];
/** Moment suivant dans le même type (toucher sur la pastille du moment). */
export function quandSuivant(m: MomentId): MomentId {
  const liste = QUAND[typeAjout(m)];
  return liste[(liste.indexOf(m) + 1) % liste.length];
}
export function quandCourt(m: MomentId, recette: Recipe): string {
  if (m === 'fwh') return `${recette.boilMin}′`;
  if (m === 'wp') return '80 °C';
  if (m === 'dryActive') return 'pendant';
  if (m === 'dryPost') return 'après';
  return MOMENTS[m].label;
}
export const quandLong = (m: MomentId) => MOMENTS[m].label;

// ---------- IBU (BrewingMath.hopIbu via le moteur v4) ----------
const nf = (n: number, d = 0) => n.toLocaleString('fr-CH', { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const nombre = nf;

export interface IbuAffiche { texte: string; long: string; valeur: number | null }
function affiche(v: { value: number; min: number; max: number }): IbuAffiche {
  const lo = Math.round(v.min), hi = Math.round(v.max);
  const texte = lo === hi ? nf(v.value) : `${nf(lo)}–${nf(hi)}`;
  return { texte, long: `${texte} IBU`, valeur: v.value };
}
/** IBU d'un ajout à sa dose, son type et son moment. Houblonnage à cru : aucun IBU Tinseth. */
export function ibuAjout(a: Addition, recette: Recipe): IbuAffiche {
  if (typeAjout(a.moment) === 'à froid') return { texte: '—', long: 'à froid, IBU non calculé', valeur: null };
  const ibu = additionIbu(a, recette);
  if (ibu.unknown.length) return { texte: '?', long: 'alpha inconnu, IBU incalculable', valeur: null };
  return affiche(ibu);
}
export const ibuRecette = (recette: Recipe): IbuAffiche => affiche(recipeIbu(recette));
