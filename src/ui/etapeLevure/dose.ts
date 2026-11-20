// Dose de la levure au choix (#132) : aujourd'hui, choisir une autre levure effaçait la dose (`delete next.yeast.qty`). Ici la dose se
// recalcule depuis yeastPitching.ts, pour la nouvelle levure et le volume de la recette. Aucune règle neuve : le produit, le moût
// estimé et le conseil sont ceux de `yeastPitching.ts` ; ce fichier les enchaîne.
//  - un seul produit documenté pour cette référence et cette forme : il est retenu (deux produits : aucun choix muet) ;
//  - le moût à ensemencer : la mesure déjà saisie si elle existe, sinon l'estimation de la recette (volume, OG) ;
//  - la dose écrite au choix est le plus petit nombre de sachets qui couvre le besoin (taux × volume × °P), sinon le plancher du fabricant (20.11) ;
//  - l'inconnu n'est jamais 0 : sans produit documenté, ni dose ni zéro.
import type { YeastSpec } from '../../types';
import type { YeastReference } from '../../domain/yeastReferences';
import { BrewingMath } from '../../services/brewingMath';
import { inferYeastRecipeStyle } from '../../domain/yeastRecipeDesign';
import type { YeastPitchingWort, YeastSupply } from '../../../functions/src/yeastSupplySchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import {
  applyYeastPitchingAdvice, estimatePitchingWort, evaluateYeastPitching, pitchingRecipeBasis, selectYeastProduct, type YeastPitchingAdvice,
} from '../../domain/yeastPitching';

/** Le produit exact de cette levure : le seul de sa référence et de sa forme, sinon aucun. */
function produitUnique(supply: YeastSupply, yeast: YeastSpec) {
  if (!yeast.hopIndexId) return undefined;
  const produits = supply.products.filter(p => p.referenceId === yeast.hopIndexId && (!yeast.form || p.form === yeast.form));
  return produits.length === 1 ? produits[0] : undefined;
}

/**
 * Le moût de la recette quand ses fermentables ne le donnent pas (potentiels absents, ajouts de fermentation sans moment) : le volume de la recette et la
 * DI du moteur, celles du bandeau (`og` : la projection de l'étape, à défaut `ogTarget`). Une estimation, marquée comme telle ; sans l'un des deux, rien.
 */
function moutDuMoteur(recipe: TrialRecipe, og?: number | null): YeastPitchingWort | undefined {
  const sg = Number.isFinite(og) ? og! : recipe.ogTarget;
  if (!(typeof recipe.volumeL === 'number' && recipe.volumeL > 0) || !(typeof sg === 'number' && Number.isFinite(sg) && sg > 1)) return undefined;
  return { volumeL: recipe.volumeL, sg, basis: 'recipe-estimate', volumeBasis: 'recipe-estimate', sgBasis: 'recipe-estimate',
    recipeBasis: pitchingRecipeBasis(recipe), additionTiming: {}, starterContribution: 'unknown' };
}

/** La levure avec son produit et son moût, prête pour `evaluateYeastPitching`. Rien n'est écrit dans la recette. */
function preparer(recipe: TrialRecipe, supply: YeastSupply, mesure?: YeastSpec['pitching'], og?: number | null): YeastSpec {
  let yeast: YeastSpec = { ...recipe.yeast };
  if (!yeast.pitching?.product) {
    const produit = produitUnique(supply, yeast);
    if (produit) yeast = selectYeastProduct(yeast, produit);
  }
  if (!yeast.pitching?.product) return yeast;
  const wort = mesure?.wort && mesure.wort.basis !== 'recipe-estimate' ? mesure.wort : estimatePitchingWort(recipe).wort ?? moutDuMoteur(recipe, og);
  if (wort) yeast = { ...yeast, pitching: { ...yeast.pitching, version: 1, wort } };
  return yeast;
}

/** Le conseil de dose de la levure de la recette, pour l'affichage (plage de sachets) : jamais écrit dans la recette. */
export function doseDeLaLevure(recipe: TrialRecipe, supply: YeastSupply, og?: number | null): { yeast: YeastSpec; conseil: YeastPitchingAdvice } {
  const yeast = preparer(recipe, supply, recipe.yeast.pitching, og);
  return { yeast, conseil: evaluateYeastPitching({ ...recipe, yeast }) };
}

/**
 * La dose du fabricant au volume de la recette, quand sa fiche la donne en grammes par hectolitre (« 50-80 g/hL », « 500g for up to 10 hL ») :
 * une plage reste une plage, « pour au plus 10 hL » est un minimum (« ≥ »). Lue, jamais écrite dans la recette ; sans volume ni fiche, rien.
 */
export function doseDuFabricant(levure: YeastReference | undefined, volumeL: number | undefined): { min: number; max?: number; source: string } | undefined {
  if (!levure || !(typeof volumeL === 'number' && volumeL > 0)) return undefined;
  const n = (t: string) => Number(t.replace(',', '.'));
  for (const f of (levure.catalogue?.facts ?? []).filter(x => x.key === 'pitchRate')) {
    const t = f.reported;
    const plageGhl = /(\d+(?:[.,]\d+)?)\s*(?:-|–|to|à)\s*(\d+(?:[.,]\d+)?)\s*g\s*(?:\/|per)\s*hl\b/i.exec(t);
    if (plageGhl) { const a = n(plageGhl[1]) * volumeL / 100, b = n(plageGhl[2]) * volumeL / 100; return { min: Math.round(a), max: Math.round(b), source: t }; }
    const auPlus = /(\d+(?:[.,]\d+)?)\s*g\s+for up to\s+(\d+(?:[.,]\d+)?)\s*hl\b/i.exec(t);
    if (auPlus && n(auPlus[2]) > 0) return { min: Math.ceil(n(auPlus[1]) / n(auPlus[2]) * volumeL / 100), source: t };
    const seul = /(\d+(?:[.,]\d+)?)\s*g\s*(?:\/|per)\s*hl\b/i.exec(t);
    if (seul) { const a = Math.round(n(seul[1]) * volumeL / 100); return { min: a, max: a, source: t }; }
  }
  return undefined;
}

/**
 * Le calage du moteur (`BrewingMath.pitchRate`) : un sachet sec de 11,5 g ≈ 150 milliards de cellules, soit ≈ 13 milliards par gramme.
 * Un sachet dont le poids n'est pas documenté est pris à 11,5 g, et le dit (« sachet 11,5 g à confirmer »).
 */
export const SACHET_SEC_G = 11.5;
const CELLULES_PAR_G_SEC = 150 / SACHET_SEC_G;

/** Le besoin de la recette en levure (taux × volume × °P) et ce qu'apporte un sachet ; l'inconnu reste absent, jamais 0. */
export interface BesoinLevure {
  regime: 'ale' | 'lager';
  /** M cellules / mL / °P : le taux justifié de la recette, sinon celui du moteur (0,75 ale, 1,5 lager, 1,0 au-delà de 1,075). */
  taux: number; tauxDuMoteur: boolean;
  volumeL: number; sg: number; plato: number;
  /** Milliards de cellules viables à ensemencer. */
  cellules: number;
  /** Un sachet (ou un pack) : son poids quand il est connu, ses cellules ; `estime` : calage du moteur, pas une mesure du produit. */
  sachet?: { grammes?: number; poidsAConfirmer: boolean; cellules: number; estime: boolean; unite: 'sachet' | 'pack' };
  /** Le besoin en sachets, non arrondi (« besoin lager 1,7 »). */
  sachets?: number;
  /** La dose du fabricant au volume de la recette, en grammes (`min` : le plancher, `borne` : « ≥ ») ; et le nombre de sachets qui l'atteint. */
  fabricant?: { min: number; max?: number; borne: boolean };
  sachetsFabricant?: number;
}

const estLager = (recipe: TrialRecipe, levure?: YeastReference) =>
  inferYeastRecipeStyle(recipe) === 'lager' || /\blager\b|pastorian|saflager|34\/70/i.test(`${recipe.yeast.name ?? ''} ${levure?.name ?? ''}`);

/**
 * Le besoin de la levure de la recette : taux × volume × °P (le moteur), le sachet du produit (cellules documentées, sinon son poids au calage du
 * moteur pour une levure sèche) et la dose du fabricant. Sans volume ni densité, rien : le besoin ne s'invente pas.
 */
export function besoinDeLaLevure(recipe: TrialRecipe, supply: YeastSupply, og?: number | null, levure?: YeastReference): BesoinLevure | undefined {
  const { yeast, conseil } = doseDeLaLevure(recipe, supply, og);
  const wort = yeast.pitching?.wort;
  const volumeL = wort?.volumeL ?? recipe.volumeL;
  const sg = wort?.sg ?? (typeof og === 'number' && Number.isFinite(og) ? og : recipe.ogTarget);
  if (!(typeof volumeL === 'number' && volumeL > 0) || !(typeof sg === 'number' && sg > 1)) return undefined;
  const regime = estLager(recipe, levure) ? 'lager' : 'ale';
  const moteur = BrewingMath.pitchRate(sg, volumeL, regime);
  if (!moteur) return undefined;
  const plato = BrewingMath.sgToPlato(sg);
  const tauxRecette = yeast.pitching?.rate?.value;
  const aTaux = typeof tauxRecette === 'number' && tauxRecette > 0;
  const taux = aTaux ? tauxRecette : moteur.rate;
  const cellules = taux * volumeL * plato;
  const { sachet, fabricant, sachetsFabricant } = doseFabricantDe(yeast, conseil, volumeL, levure);
  return { regime, taux, tauxDuMoteur: !aTaux, volumeL, sg, plato, cellules,
    sachet, sachets: sachet ? cellules / sachet.cellules : undefined, fabricant, sachetsFabricant };
}

/** Ce que la levure dit sans densité de moût : son sachet et la dose du fabricant (ni taux, ni cellules, ni besoin). */
export type DoseFabricant = Pick<BesoinLevure, 'sachet' | 'fabricant' | 'sachetsFabricant'>;

/** Le sachet du produit, la dose du fabricant au volume et le nombre de sachets qui l'atteint : le volume seul les donne, pas la densité du moût. */
function doseFabricantDe(yeast: YeastSpec, conseil: YeastPitchingAdvice, volumeL: number, levure?: YeastReference): DoseFabricant {
  const produit = yeast.pitching?.product;
  const forme = yeast.form ?? produit?.form ?? levure?.form;
  let sachet: BesoinLevure['sachet'];
  const cellsPack = produit?.cellsPerPack;
  const grammesProduit = produit?.format?.unit === 'g' ? produit.format.amount : undefined;
  if (cellsPack?.kind === 'viable' && ['point', 'range'].includes(cellsPack.qualifier) && cellsPack.range.min > 0) {
    sachet = { grammes: grammesProduit, poidsAConfirmer: false, cellules: cellsPack.range.min, estime: false, unite: forme === 'sèche' ? 'sachet' : 'pack' };
  } else if (forme === 'sèche' && (grammesProduit === undefined || grammesProduit <= 100)) {
    // Une brique (500 g) n'est pas un sachet : son poids ne donne pas d'unité à compter.
    const grammes = grammesProduit ?? SACHET_SEC_G;
    sachet = { grammes, poidsAConfirmer: grammesProduit === undefined, cellules: grammes * CELLULES_PAR_G_SEC, estime: true, unite: 'sachet' };
  }
  const f = doseDuFabricant(levure, volumeL);
  const fabricant: BesoinLevure['fabricant'] = conseil.unit === 'g' && conseil.range ? { min: conseil.range.min, max: conseil.range.max, borne: false }
    : conseil.unit === 'g' && conseil.bound && conseil.bound.operator.startsWith('>') ? { min: conseil.bound.value, borne: true }
    : f ? { min: f.min, max: f.max, borne: f.max === undefined } : undefined;
  const sachetsFabricant = fabricant && sachet?.grammes ? Math.max(1, Math.ceil(fabricant.min / sachet.grammes - 1e-9)) : conseil.packs?.min;
  return { sachet, fabricant, sachetsFabricant };
}

/**
 * T4-2 : la dose du fabricant quand la densité du moût manque (recette sans DI visée ni potentiels de malt : `besoinDeLaLevure` rend alors `undefined`).
 * Elle ne dépend que du volume et de la fiche : la carte la dit au lieu de « pas de conseil · fiche absente ». Sans volume ni fiche, rien (jamais 0).
 */
export function doseDuFabricantSeule(recipe: TrialRecipe, supply: YeastSupply, og?: number | null, levure?: YeastReference): DoseFabricant | undefined {
  const { yeast, conseil } = doseDeLaLevure(recipe, supply, og);
  const volumeL = yeast.pitching?.wort?.volumeL ?? recipe.volumeL;
  if (!(typeof volumeL === 'number' && volumeL > 0)) return undefined;
  const dose = doseFabricantDe(yeast, conseil, volumeL, levure);
  // Sans dose du fabricant, rien : un sachet supposé seul ne fait pas une dose (la saisie libre garde « pas de conseil »).
  return dose.fabricant ? dose : undefined;
}

/** La dose écrite au choix d'une levure : le plus petit nombre de sachets qui couvre le besoin, sinon celui qui atteint la dose du fabricant. */
export function sachetsAuChoix(besoin: Pick<BesoinLevure, 'sachetsFabricant'> & Partial<Pick<BesoinLevure, 'sachets'>> | undefined): number | undefined {
  if (!besoin) return undefined;
  if (besoin.sachets !== undefined && Number.isFinite(besoin.sachets)) return Math.max(1, Math.ceil(besoin.sachets - 1e-9));
  return besoin.sachetsFabricant;
}

/**
 * La recette après le choix d'une levure (`recipe` porte déjà la nouvelle levure, issue de `applyCatalogueYeast`) : produit et moût
 * recalculés, puis la dose écrite (20.11, « B1 bis ») : le plus petit nombre de sachets qui couvre le besoin de la recette (taux × volume × °P),
 * sinon le plancher du fabricant ; sans l'un ni l'autre, la dose reste à saisir (jamais 0). `avant` est la levure remplacée : on n'en
 * reprend que la mesure du moût, jamais sa dose ni son produit.
 */
export function doseApresChoix(recipe: TrialRecipe, avant: YeastSpec, supply: YeastSupply, og?: number | null, levure?: YeastReference): TrialRecipe {
  const { qty: _qty, unit: _unit, ...sansDose } = recipe.yeast;
  const nue: TrialRecipe = { ...recipe, yeast: sansDose };
  const { yeast } = doseDeLaLevure(nue, supply, og);
  const mesure = avant.pitching?.wort && avant.pitching.wort.basis !== 'recipe-estimate' ? avant.pitching.wort : undefined;
  const prepared = mesure && yeast.pitching?.product ? preparer(nue, supply, { version: 1, wort: mesure }, og) : yeast;
  const ogMout = og ?? estimatePitchingWort(nue).wort?.sg;
  const avecMout = { ...nue, yeast: prepared };
  // Sans densité de moût (T4-2), la dose du fabricant au volume de la recette reste proposée.
  const n = sachetsAuChoix(besoinDeLaLevure(avecMout, supply, ogMout, levure) ?? doseDuFabricantSeule(avecMout, supply, ogMout, levure));
  if (n === undefined) return { ...nue, yeast: prepared };
  const unite = (prepared.form ?? prepared.pitching?.product?.form ?? levure?.form) === 'sèche' ? 'sachet' : 'pack';
  return { ...nue, yeast: { ...prepared, qty: n, unit: unite } };
}
