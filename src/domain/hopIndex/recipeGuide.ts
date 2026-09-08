import { hopSourceError } from '../../../functions/src/hopIndexSchema';
import type { HopDescription, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';

export interface RecipeGuideNamedItem {
  id: string;
  name: string;
  aliases?: readonly string[];
  archived?: boolean;
}

export interface RecipeIngredientMatch<T extends RecipeGuideNamedItem> {
  item: T;
  /** The actual catalogue name or explicitly stored alias, never a guessed synonym. */
  matchedName: string;
  via: 'name' | 'alias';
  normalizedName: string;
}

export interface HopGuideFamily {
  id: string;
  name: string;
  /** Explicit editorial vocabulary; no chemical coefficient or sensory weight. */
  terms: readonly string[];
  source: HopSource;
}

export interface DocumentaryHopEvidence {
  familyId: string;
  term: string;
  description: HopDescription;
  source: HopSource;
  /** The grouping of this word into this family is a separate, sourced claim. */
  mappingSource: HopSource;
}

export interface DocumentaryHopLead {
  variety: HopVariety;
  matchedFamilyIds: string[];
  evidence: DocumentaryHopEvidence[];
}

/** Only typography is normalized in an authoritative catalogue name. */
function identityText(text: string): string {
  return text.replace(/[®™℠]/gu, '').normalize('NFKC').toLocaleLowerCase('fr').replace(/\s+/gu, ' ').trim();
}

const decimal = '\\d+(?:[.,]\\d+)?';
const amount = `${decimal}\\s*(?:kg|mg|g|oz|lb)`;
const alphaLabel = '(?:aa|alpha(?:\\s+acids?)?|acides?\\s+alpha|α)';
const alphaPercent = `(?:${alphaLabel}\\s*[:=]?\\s*)?${decimal}\\s*%(?:\\s*${alphaLabel})?`;
const leadingAmount = new RegExp(`^${amount}(?:\\s*[:;]\\s*|\\s+)`, 'iu');
const trailingAnnotation = (annotation: string) => new RegExp(
  `(?:^|[\\s,;:]+(?:[-–—]\\s*)?|(?=[(\\[]))(?:\\(\\s*${annotation}\\s*\\)|\\[\\s*${annotation}\\s*\\]|${annotation})$`, 'iu',
);
const trailingAmount = trailingAnnotation(amount);
const trailingAlpha = trailingAnnotation(alphaPercent);

/**
 * Remove only explicit ingredient labels and package/AA annotations at the edges.
 * Numbers without units, country/form qualifiers and strain punctuation are retained.
 * The discarded AA text is NEVER an analytical observation or a recipe update.
 */
export function normalizeRecipeIngredientName(name: string, kind: 'hop' | 'yeast' = 'hop'): string {
  let value = identityText(name);
  const prefix = kind === 'hop' ? /^houblons?(?:\s*:\s*|\s+)/iu : /^levures?(?:\s*:\s*|\s+)/iu;
  let previous: string;
  do {
    previous = value;
    value = value.replace(prefix, '').replace(leadingAmount, '').replace(trailingAmount, '');
    if (kind === 'hop') value = value.replace(trailingAlpha, '');
    value = value.trim();
  } while (value !== previous);
  return value;
}

function findIngredientMatches<T extends RecipeGuideNamedItem>(
  name: string, catalogue: readonly T[], kind: 'hop' | 'yeast',
): RecipeIngredientMatch<T>[] {
  const normalizedName = normalizeRecipeIngredientName(name, kind);
  if (!normalizedName) return [];
  return catalogue.flatMap<RecipeIngredientMatch<T>>(item => {
    if (item.archived) return [];
    if (identityText(item.name) === normalizedName) return [{ item, matchedName: item.name, via: 'name' as const, normalizedName }];
    const alias = item.aliases?.find(candidate => identityText(candidate) === normalizedName);
    return alias == null ? [] : [{ item, matchedName: alias, via: 'alias' as const, normalizedName }];
  });
}

/** Returns each matching source record; the caller must request an explicit choice. */
export function findRecipeHopMatches(name: string, varieties: readonly HopVariety[]): RecipeIngredientMatch<HopVariety>[] {
  return findIngredientMatches(name, varieties, 'hop');
}

/** Works with existing HopYeast records and with optional, explicitly supplied aliases. */
export function findRecipeYeastMatches<T extends RecipeGuideNamedItem>(name: string, yeasts: readonly T[]): RecipeIngredientMatch<T>[] {
  return findIngredientMatches(name, yeasts, 'yeast');
}
/** Explicit presentations of the same manufacturer product, not strain equivalence. */
export function withDocumentedYeastNames<T extends RecipeGuideNamedItem>(yeasts: T[]): (T & { aliases?: readonly string[] })[] {
  return yeasts.map(y => y.id === 'fermentis-us05' ? { ...y, aliases: [...new Set([...(y.aliases ?? []), 'SafAle US-05', 'Fermentis SafAle US-05', 'Fermentis Levure SafAle US-05', 'US-05'])] } : y);
}

function documentaryText(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/**
 * A text index over quoted descriptions, not a prediction of the beer or a probability.
 * Sort by distinct requested families mentioned, then name/ID. Repeating a word,
 * description, source or target cannot improve the position. Missing descriptors are
 * unindexed, never evidence of aromatic absence. No catalogue is imported here.
 */
export function rankDocumentaryHopLeads(
  varieties: readonly HopVariety[], targetFamilyIds: readonly string[], families: readonly HopGuideFamily[],
): DocumentaryHopLead[] {
  const wanted = new Set(targetFamilyIds);
  const activeFamilies = families.filter(family => wanted.has(family.id) && !hopSourceError(family.source));
  if (!activeFamilies.length) return [];

  return varieties.filter(variety => !variety.archived).flatMap(variety => {
    const evidence: DocumentaryHopEvidence[] = [];
    for (const description of variety.descriptions) {
      if (hopSourceError(description.source)) continue;
      const text = ` ${documentaryText(description.text)} `;
      for (const family of activeFamilies) {
        const seen = new Set<string>();
        for (const term of family.terms) {
          const normalized = documentaryText(term);
          if (!normalized || seen.has(normalized)) continue;
          seen.add(normalized);
          if (text.includes(` ${normalized} `)) {
            evidence.push({ familyId: family.id, term, description, source: description.source, mappingSource: family.source });
          }
        }
      }
    }
    if (!evidence.length) return [];
    const matchedFamilyIds = [...new Set(evidence.map(item => item.familyId))].sort();
    return [{ variety, matchedFamilyIds, evidence }];
  }).sort((a, b) => b.matchedFamilyIds.length - a.matchedFamilyIds.length
    || a.variety.name.localeCompare(b.variety.name, 'fr') || a.variety.id.localeCompare(b.variety.id, 'fr'));
}
