/**
 * Les ingrédients d'une recette enregistrée qui n'ont pas la bonne place ou le bon nom (T3B-12, test en ligne du 20.11 sur la recette du brasseur).
 *
 * Deux défauts de DONNÉE, vus sur la fiche « Milk Stout » en ligne ; le code actuel ne les reproduit pas (l'importeur range lactose et
 * clarifiant en additifs, les accents survivent à l'aller-retour : `recipeImportRoundTrip`, `bStockVolumesNoms`, TE-38 non jouable en local).
 * La fiche et la liste les lisent donc sans toucher à la donnée du brasseur :
 *  - « Lactose 300 g » et « Whirlfloc 1 g » rangés dans `recipe.hops` : sans α, ils rendaient l'IBU inconnu (« — ») malgré Target 35 g α 11,3 et
 *    East Kent Goldings 20 g α 5,5 à 60′. Ils passent dans les additifs de l'affichage et ne comptent plus dans l'amertume ;
 *  - des noms aux lettres accentuées perdues (« Rstgerste (orge torrfie) », « Caramnch Typ 2 ») : rendus par le nom du stock quand UN SEUL nom
 *    du stock donne, une fois ses lettres non ASCII retirées, exactement le nom abîmé. Sans correspondance unique, le nom reste tel quel.
 */
import type { AdjunctIngredient, HopIngredient, Recipe } from '../types';

/** Ce qui n'est jamais un houblon : sucres, lactose, clarifiants, sels, épices, fruits. Le houblon, lui, a un α : seul un ajout sans α entre ici. */
const NOM_NON_HOUBLON =
  /\b(?:lactose|whirlfloc|protofloc|irish moss|mousse d.irlande|sucre|sugar|dextrose|miel|honey|gypse|gypsum|cacl2?|acide|acid|vanille|coriandre|cannelle|zeste|cacao|caf[eé]|coffee|pur[eé]e)\b/i;

/** Un ajout rangé parmi les houblons : un nom qui n'en est pas un ET aucun α (un houblon sans α reste un houblon à compléter : l'IBU reste inconnu). */
export function estAjoutRangeSousHoublons(h: Pick<HopIngredient, 'name' | 'alpha'>): boolean {
  return NOM_NON_HOUBLON.test(h.name ?? '') && !(Number.isFinite(h.alpha) && h.alpha > 0);
}

const etape = (h: HopIngredient): string =>
  h.stage === 'whirlpool' ? 'Whirlpool'
    : h.stage === 'dryHop' ? 'Fermenteur'
      : `Ébullition${Number.isFinite(h.timeMin) ? `, ${h.timeMin}′` : ''}`;

/** Les houblons d'un côté, les ajouts rangés à tort de l'autre (en additifs, masse en g). L'ordre est conservé. */
export function separerAjoutsDesHoublons<T extends HopIngredient>(hops: readonly T[] | undefined): { houblons: T[]; ajouts: AdjunctIngredient[] } {
  const houblons: T[] = [], ajouts: AdjunctIngredient[] = [];
  for (const h of hops ?? []) {
    if (estAjoutRangeSousHoublons(h) && h.weightG > 0) ajouts.push({ name: h.name, amount: h.weightG, unit: 'g', step: etape(h) });
    else houblons.push(h);
  }
  return { houblons, ajouts };
}

/** Le nom sans ses lettres non ASCII, en minuscules : ce qu'il reste d'un nom dont l'encodage a perdu « ö », « é », « ü »… */
const squelette = (nom: string): string => nom.normalize('NFC').replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const accentue = (nom: string): boolean => /[^\x00-\x7F]/.test(nom.normalize('NFC'));

/**
 * Le nom du stock que ce nom abîmé désigne. Garde : le nom est déjà un nom du stock → inchangé ; un seul nom accentué du stock a ce squelette
 * (« Rstgerste (orge torrfie) » ← « Röstgerste (orge torréfiée) ») → celui-là ; zéro ou plusieurs → le nom reste tel quel (jamais deviné).
 */
export function reparerNomAbime(nom: string, nomsDuStock: readonly string[]): string {
  if (!nom || accentue(nom)) return nom;
  const cle = nom.trim().toLowerCase();
  if (nomsDuStock.some(n => n.trim().toLowerCase() === cle)) return nom;
  const sq = squelette(nom);
  if (!sq) return nom;
  const candidats = [...new Set(nomsDuStock.filter(n => accentue(n) && squelette(n) === sq).map(n => n.normalize('NFC')))];
  return candidats.length === 1 ? candidats[0] : nom;
}

/**
 * La recette telle que la fiche et la liste la lisent : ajouts sortis des houblons, noms rendus. Les mêmes références quand rien ne change
 * (pas de nouveau tableau, donc pas de recalcul inutile) ; la donnée enregistrée n'est jamais modifiée.
 */
export function recetteLue(recipe: Recipe, nomsDuStock: readonly string[] = []): Recipe {
  const { houblons, ajouts } = separerAjoutsDesHoublons(recipe.hops);
  const nom = <T extends { name: string }>(l: T): T => { const n = reparerNomAbime(l.name, nomsDuStock); return n === l.name ? l : { ...l, name: n }; };
  const fermentables = recipe.fermentables?.map(nom);
  const hopsLus = houblons.map(nom);
  const changeFerm = !!fermentables && fermentables.some((f, i) => f !== recipe.fermentables![i]);
  const changeHops = ajouts.length > 0 || hopsLus.some((h, i) => h !== houblons[i]);
  if (!changeFerm && !changeHops) return recipe;
  return {
    ...recipe,
    ...(changeFerm ? { fermentables } : {}),
    ...(changeHops ? { hops: hopsLus } : {}),
    ...(ajouts.length ? { adjuncts: [...(recipe.adjuncts ?? []), ...ajouts] } : {})
  };
}
