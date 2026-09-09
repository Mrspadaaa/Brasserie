import { hopSourceError, validHopRange, type HopRange, type HopSource } from './hopIndexSchema.js';

export interface BrewingStyle {
  id: string; code: string; name: string; aliases: string[]; family: string;
  stats: Partial<Record<'og' | 'fg' | 'abv' | 'ibu' | 'srm', HopRange>>;
  source: HopSource;
  /** Local suggestions, explicitly distinct from a competition specification. */
  suggestions?: { mash?: string; fermentation?: string; water?: string; hop?: string; yeast?: string[]; source: HopSource };
}
export interface BrewingStyleGuide {
  id: string; kind: 'styleGuide'; name: string; version: string; enabled: boolean;
  edition: string; retrievedAt: string; attribution: string; source: HopSource; styles: BrewingStyle[];
}
export interface BrewingStyleRef { guideId: string; version: string; styleId: string }
export function assertBrewingStyleGuide(v: any): asserts v is BrewingStyleGuide {
  const fail = () => { throw Error('Référentiel de styles invalide ou non sourcé.'); };
  if (!v || v.kind !== 'styleGuide' || !v.id || !v.name || !v.version || typeof v.enabled !== 'boolean' || !v.edition ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v.retrievedAt) || hopSourceError(v.source, true) || !Array.isArray(v.styles) || !v.styles.length) fail();
  const ids = new Set<string>();
  for (const s of v.styles) {
    if (!s.id || ids.has(s.id) || !s.name || !s.code || !s.family || !Array.isArray(s.aliases) ||
      s.aliases.some((a: unknown) => typeof a !== 'string' || !a.trim()) || hopSourceError(s.source) || !s.stats) fail();
    ids.add(s.id);
    for (const [k, r] of Object.entries(s.stats)) if (!['og', 'fg', 'abv', 'ibu', 'srm'].includes(k) || !validHopRange(r) || (r as HopRange).min < 0) fail();
    if (s.suggestions && hopSourceError(s.suggestions.source, true)) fail();
  }
}
