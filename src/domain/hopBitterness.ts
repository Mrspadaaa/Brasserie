import { BrewingMath } from '../services/brewingMath';
import type { HopIngredient } from '../types';
import { alphaAConfirmer, alphaProbable } from './hopAlpha';
import { BORNES, frBorne, messageEbullition, messageHoublonParLitre, ogHorsBornes, problemesLigneHoublon } from './bornesMetier';
import bootstrap from '../data/hopBitternessBootstrap.json';
import { assertHopBitternessScience, type HopBitternessScience } from '../../functions/src/hopBitternessSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

/** Saved edits, including disabled/invalid records, always win over the seed. */
export function bitternessScience(knowledge: HopKnowledge[] = []): HopBitternessScience | undefined {
  const candidate = knowledge.find(k => k.id === bootstrap[0].id) ?? bootstrap[0];
  try { assertHopBitternessScience(candidate); return candidate.enabled ? candidate : undefined; } catch { return undefined; }
}

export interface HotBitterness {
  total: number | null;
  known: number;
  additions: { ibu: number | null; missing: string[] }[];
  missing: string[];
}

/**
 * L'IBU d'une ligne de la liste : celui de l'ajout DANS la recette, pas seul. Calculé seul, 30 g/L passent la borne de houblon par litre alors
 * que la recette entière la dépasse : la ligne montrerait un nombre que l'en-tête refuse (RJ-3). `hop` est un élément de `hops` ; sinon il est pris seul.
 */
export function ibuDeLAjout(hops: HopIngredient[], hop: HopIngredient, volumeL: number, og: number | null, boilMin: number): number | null {
  const i = hops.indexOf(hop);
  return hotBitterness(i >= 0 ? hops : [hop], volumeL, og, boilMin).additions[Math.max(i, 0)].ibu;
}

/** Les raisons d'un IBU incomplet, en une phrase qui ne finit que par un point : certaines raisons (« … des kg tapés en g ?). ») portent déjà le leur (RJ-11, « .. »). */
export const phraseIbuIncomplet = (missing: readonly string[]): string => `${missing.join(' · ').replace(/[.\s]+$/, '')}.`;

/** Rounded total for existing scalar recipe fields. Only round a complete total. */
export function recipeIbu(hops: HopIngredient[], volumeL: number, og: number | null, boilMin: number): number | null {
  const total = hotBitterness(hops, volumeL, og, boilMin).total;
  return total == null ? null : Math.round(total);
}

/** Strict current recipe view around the legacy Tinseth model. Old snapshots
 * retain their numeric targets; unknown inputs do not become 0 IBU or OG 1.050. */
export function hotBitterness(hops: HopIngredient[], volumeL: number, og: number | null, boilMin: number): HotBitterness {
  // MV-47 : 99 999 g de Nugget dans 20 L. Au-delà de la borne de houblon par litre (bornesMetier.ts), pas d'IBU calculé en silence.
  const exces = messageHoublonParLitre(hops.reduce((s, h) => s + (Number.isFinite(h.weightG) && h.weightG > 0 ? h.weightG : 0), 0), volumeL);
  const additions = hops.map(h => {
    const missing: string[] = [];
    if (h.stage === 'dryHop' || h.weightG === 0) return { ibu: 0, missing };
    // RJ-3 : quand l'en-tête refuse (houblon de toute la recette au-delà de la borne), la ligne refuse aussi : un ajout ne porte qu'un nombre.
    if (exces) return { ibu: null, missing };
    if (!Number.isFinite(volumeL) || volumeL <= 0) missing.push('volume final');
    if (!Number.isFinite(h.weightG) || h.weightG < 0) missing.push('masse');
    if (!Number.isFinite(h.alpha) || h.alpha <= 0 || h.alpha > 100) missing.push('alpha du lot');
    // « 80 » pour 8,0 : au-delà de 30 %, l'IBU attend la confirmation de la valeur (AM 9, 08.11), il ne se calcule pas ×10 en silence.
    else if (alphaAConfirmer(h)) missing.push(`alpha de ${String(h.alpha).replace('.', ',')} % à confirmer (${alphaProbable(h.alpha)} % ?)`);
    if (og == null || !Number.isFinite(og) || og < 1) missing.push('densité initiale');
    // MV-44/45 : une OG de 116,808 (10 000 kg dans 20 L) ne nourrit pas un IBU : au-delà de la borne, l'IBU attend la correction.
    else if (ogHorsBornes(og)) missing.push(`densité initiale au-delà de ${frBorne(BORNES.og.max, 3)}`);
    if (!Number.isFinite(boilMin) || boilMin < 0) missing.push('durée d’ébullition');
    // AM-19 : 1 440 min d'ébullition n'existent pas ; à 0 min, un houblon d'ébullition ou de premier moût n'isomérise pas, et « 0 IBU » serait un faux nombre.
    else if (messageEbullition(boilMin) && (boilMin > 0 || h.stage === 'boil' || h.stage === 'firstWort')) missing.push('durée d’ébullition plausible');
    if (h.stage === 'boil' || h.stage === 'whirlpool') {
      if (!Number.isFinite(h.timeMin) || h.timeMin! < 0) missing.push('durée de contact');
      else if (h.stage === 'boil' && h.timeMin! > boilMin) missing.push(`ajout à ${h.timeMin} min, supérieur aux ${boilMin} min d’ébullition`);
    }
    if (h.stage === 'whirlpool' && (!Number.isFinite(h.tempC) || h.tempC! < 0 || h.tempC! > 100)) missing.push('température de whirlpool');
    // AM-17, AM-18 : un whirlpool de 600 min ou à 0 °C n'existe pas ; l'IBU attend la correction (une seule règle : `problemesLigneHoublon`).
    else if (h.stage === 'whirlpool' && problemesLigneHoublon(h).length) missing.push('durée ou température de whirlpool plausibles');
    if (!['firstWort', 'boil', 'whirlpool'].includes(h.stage)) missing.push('moment d’ajout');
    return { ibu: missing.length ? null : BrewingMath.hopIbu(h, volumeL, og!, boilMin), missing };
  });
  const known = additions.reduce((sum, h) => sum + (h.ibu ?? 0), 0);
  // Une donnée de LA RECETTE (volume, densité, durée d'ébullition) manque une seule fois, pas une fois par houblon (n° 27 :
  // « Galaxy : durée d'ébullition · Citra : durée d'ébullition… » laissait croire que chaque ajout n'avait pas sa durée).
  const DE_LA_RECETTE = ['volume final', 'densité initiale', 'durée d’ébullition'];
  const recipeLevel = DE_LA_RECETTE.filter(reason => additions.some(h => h.missing.includes(reason)))
    .map(reason => `${reason} de la recette`);
  const missing = [...(exces ? [exces] : []), ...recipeLevel,...additions.flatMap((h, i) => h.missing.filter(reason => !DE_LA_RECETTE.includes(reason)).map(reason => `${hops[i].name} : ${reason}`))];
  return { total: missing.length ? null : known, known, additions, missing };
}

/**
 * L'IBU du bandeau : un tiret quand rien ne l'a produit. « IBU 0 » sans aucun houblon à chaud dit un nombre là où OG et EBC disent « — » (B1-NOTE-1, PD-1 :
 * « Mets un tiret comme pour l'OG ») : un inconnu n'est jamais 0. Un houblon à chaud dosé qui donne vraiment 0 reste écrit 0.
 */
export function ibuEnTete(ibu: number | null, hops: ReadonlyArray<Pick<HopIngredient, 'stage' | 'weightG'>>): string {
  if (ibu == null) return '—';
  if (ibu === 0 && !hops.some(h => h.stage !== 'dryHop' && h.weightG > 0)) return '—';
  return String(ibu);
}
