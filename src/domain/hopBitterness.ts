import { BrewingMath } from '../services/brewingMath';
import type { HopIngredient } from '../types';
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

/** Rounded total for existing scalar recipe fields. Only round a complete total. */
export function recipeIbu(hops: HopIngredient[], volumeL: number, og: number | null, boilMin: number): number | null {
  const total = hotBitterness(hops, volumeL, og, boilMin).total;
  return total == null ? null : Math.round(total);
}

/** Strict current recipe view around the legacy Tinseth model. Old snapshots
 * retain their numeric targets; unknown inputs do not become 0 IBU or OG 1.050. */
export function hotBitterness(hops: HopIngredient[], volumeL: number, og: number | null, boilMin: number): HotBitterness {
  const additions = hops.map(h => {
    const missing: string[] = [];
    if (h.stage === 'dryHop' || h.weightG === 0) return { ibu: 0, missing };
    if (!Number.isFinite(volumeL) || volumeL <= 0) missing.push('volume final');
    if (!Number.isFinite(h.weightG) || h.weightG < 0) missing.push('masse');
    if (!Number.isFinite(h.alpha) || h.alpha <= 0 || h.alpha > 100) missing.push('alpha du lot');
    if (og == null || !Number.isFinite(og) || og < 1) missing.push('densité initiale');
    if (!Number.isFinite(boilMin) || boilMin < 0) missing.push('durée d’ébullition');
    if (h.stage === 'boil' || h.stage === 'whirlpool') {
      if (!Number.isFinite(h.timeMin) || h.timeMin! < 0) missing.push('durée de contact');
      else if (h.stage === 'boil' && h.timeMin! > boilMin) missing.push(`ajout à ${h.timeMin} min, supérieur aux ${boilMin} min d’ébullition`);
    }
    if (h.stage === 'whirlpool' && (!Number.isFinite(h.tempC) || h.tempC! < 0 || h.tempC! > 100)) missing.push('température de whirlpool');
    if (!['firstWort', 'boil', 'whirlpool'].includes(h.stage)) missing.push('moment d’ajout');
    return { ibu: missing.length ? null : BrewingMath.hopIbu(h, volumeL, og!, boilMin), missing };
  });
  const known = additions.reduce((sum, h) => sum + (h.ibu ?? 0), 0);
  const missing = additions.flatMap((h, i) => h.missing.map(reason => `${hops[i].name} : ${reason}`));
  return { total: missing.length ? null : known, known, additions, missing };
}
