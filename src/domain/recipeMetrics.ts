/**
 * Les chiffres d'une recette ENREGISTRÉE (OG, FG, IBU), lus partout de la même façon : liste, fiche, assistant.
 *
 * Test en ligne du 07.11 : l'OG valait 1,094 dans le bandeau de l'assistant et 1,085 sur la fiche, l'IBU 65 dans la liste
 * et 57 sur la fiche, la FG 1.024 sur la fiche et 1,021 dans l'assistant. Cause : chaque écran choisissait lui-même entre
 * la valeur RETENUE de la recette (`ogTarget`, `fgTarget`) et la valeur recalculée, et la liste lisait l'IBU « annoncé »
 * là où la fiche le calcule.
 *
 * Règle unique (celle que l'assistant applique déjà, `keepOgTarget` : « jamais remplacer une OG fournie ») :
 *  - OG, FG : la valeur retenue de la recette si elle existe, sinon la valeur calculée ;
 *  - IBU : toujours CALCULÉ (l'alpha et les ajouts sont la vérité), l'IBU annoncé n'est montré qu'en note, ou
 *    quand le calcul est impossible (alpha inconnu) ;
 *  - format : virgule, trois décimales pour une densité (« 1,085 »), jamais « 1.085 ».
 */
import type { HopIngredient, Recipe } from '../types';
import { hotBitterness, type HotBitterness } from './hopBitterness';
import { ogHorsBornes } from './bornesMetier';
import { normalizeHop } from './hopStage';
import { yeastRecipeBoilOg, yeastRecipeComputedOg } from './yeastProjection';

/** Densité à la française : « 1,085 ». Valeur inconnue ou hors plage : chaîne vide (jamais « 0,000 »). */
/** Un volume de recette ou de brassin se lit au décilitre, à la virgule (« 24 L », « 23,7 L ») : jamais « 24.012 L » (test en ligne n° 15, en-tête de fiche, 08.11). */
export function formatLitres(l: number | null | undefined): string {
  if (l == null || !Number.isFinite(l)) return '— L';
  return `${l.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L`;
}

export function formatDensite(sg: number | null | undefined): string {
  if (sg == null || !Number.isFinite(sg) || sg <= 1) return '';
  return sg.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/**
 * L'OG du bandeau de mesures : « — » quand elle est hors bornes (RJ-4 : « OG 97,511 » pour 10 000 kg de grain). Le nombre n'est pas une valeur
 * de la recette mais l'effet d'une erreur de saisie ; l'alerte de l'étape le dit, avec ce nombre, et l'IBU est déjà « — » pour la même raison.
 */
export function formatOgEnTete(og: number | null | undefined): string {
  return ogHorsBornes(og) ? '—' : formatDensite(og) || '—';
}

const valide = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 1;

/** OG d'une recette non NOLO : la cible retenue, sinon le calcul sur les fermentescibles. */
export function ogRecette(recipe: Pick<Recipe, 'ogTarget' | 'fermentables' | 'volumeL'>, efficiencyPct: number): number | null {
  if (valide(recipe.ogTarget)) return recipe.ogTarget;
  return yeastRecipeComputedOg({ fermentables: recipe.fermentables, volumeL: recipe.volumeL, efficiencyPct });
}

/** FG affichée : la cible retenue, sinon la projection (le résultat de la levure, déjà calculé par l'appelant). */
export function fgRecette(recipe: Pick<Recipe, 'fgTarget'>, projetee: number | null | undefined): number | null {
  if (valide(recipe.fgTarget)) return recipe.fgTarget;
  return valide(projetee) ? projetee : null;
}

/** Amertume à chaud d'une recette : la même fonction pour la liste et la fiche. `og` imposé = NOLO ou OG déjà résolue. */
export function amertumeRecette(recipe: Recipe, efficiencyPct: number, options: { og?: number | null; nolo?: boolean } = {}): HotBitterness {
  const hops: HopIngredient[] = (recipe.hops ?? []).map(normalizeHop);
  const og = options.og !== undefined ? options.og : ogRecette(recipe, efficiencyPct);
  const boilOg = options.nolo ? og : yeastRecipeBoilOg({ ...recipe, efficiencyPct }, { og }).og;
  return hotBitterness(hops, recipe.volumeL, boilOg, recipe.boilMin ?? 60);
}

/**
 * IBU de la LISTE : le même nombre que la fiche. Si le calcul est impossible ou s'il n'y a aucun ajout à chaud,
 * on garde l'IBU annoncé de la recette (une valeur saisie), sinon rien : l'inconnu n'est jamais 0.
 */
export function ibuListe(recipe: Recipe, efficiencyPct: number): number | undefined {
  // Un IBU annoncé à 0 n'est pas une cible (TE-33 : « Amertume 0 IBU » pour un houblon sans dose) : l'inconnu n'est jamais 0.
  const annonce = typeof recipe.ibuTarget === 'number' && Number.isFinite(recipe.ibuTarget) && recipe.ibuTarget > 0 ? recipe.ibuTarget : undefined;
  if (recipe.nolo?.enabled) return annonce;
  const chauds = (recipe.hops ?? []).map(normalizeHop).filter(h => h.stage !== 'dryHop' && h.weightG > 0);
  if (!chauds.length) return annonce;
  const total = amertumeRecette(recipe, efficiencyPct).total;
  return total == null ? annonce : Math.round(total);
}

/** « 1 palier », « 2 paliers » : le pluriel s'accorde (test en ligne du 07.11, n° 12 et 24). Un pluriel irrégulier se passe en 3e argument. */
export function nombreAccorde(n: number, mot: string, pluriel = `${mot}s`): string {
  return `${n} ${n > 1 ? pluriel : mot}`;
}
