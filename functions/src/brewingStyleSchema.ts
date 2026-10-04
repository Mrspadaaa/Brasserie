import { hopSourceError, validHopRange, type HopRange, type HopSource } from './hopIndexSchema.js';
import { assertBrewerCatalogueMeta, type BrewerCatalogueMeta } from './brewerCatalogueSchema.js';

export interface BrewingStyle {
  id: string; code: string; name: string; aliases: string[]; family: string;
  stats: Partial<Record<'og' | 'fg' | 'abv' | 'ibu' | 'srm', HopRange>>;
  source: HopSource;
  /** Local suggestions, explicitly distinct from a competition specification. */
  suggestions?: { mash?: string; fermentation?: string; water?: string; hop?: string; yeast?: string[]; source: HopSource };
}
export interface BrewingStyleGuide {
  id: string; kind: 'styleGuide'; name: string; version: string; enabled: boolean;
  edition: string; retrievedAt: string | null; createdAt?: string; attribution: string; source: HopSource; styles: BrewingStyle[];
  /** Immutable prior styleRef versions, kept resolvable after an enrichment. */
  history?: BrewingStyleGuideRevision[];
  catalogueMeta?: BrewerCatalogueMeta;
}
export interface BrewingStyleGuideRevision {
  version: string; edition: string; enabled: boolean; retrievedAt: string | null; createdAt?: string;
  attribution: string; source: HopSource; styles: BrewingStyle[];
}
export interface BrewingStyleRef { guideId: string; version: string; styleId: string }
const date = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
function assertStyleRows(styles: unknown): asserts styles is BrewingStyle[] {
  if (!Array.isArray(styles) || !styles.length) throw Error('Référentiel de styles invalide ou non sourcé.');
  const ids = new Set<string>();
  for (const s of styles) {
    if (!s || typeof s !== 'object' || Array.isArray(s) || !s.id || ids.has(s.id) || !s.name || !s.code || !s.family || !Array.isArray(s.aliases) ||
      s.aliases.some((a: unknown) => typeof a !== 'string' || !a.trim()) || hopSourceError(s.source) || !s.stats || typeof s.stats !== 'object' || Array.isArray(s.stats)) {
      throw Error('Référentiel de styles invalide ou non sourcé.');
    }
    ids.add(s.id);
    for (const [k, r] of Object.entries(s.stats)) if (!['og', 'fg', 'abv', 'ibu', 'srm'].includes(k) || !validHopRange(r) || (r as HopRange).min < 0) throw Error('Plage de style invalide.');
    if (s.suggestions && (!s.suggestions || typeof s.suggestions !== 'object' || hopSourceError(s.suggestions.source))) throw Error('Suggestion de style non sourcée.');
  }
}
export function assertBrewingStyleGuide(v: any): asserts v is BrewingStyleGuide {
  const fail = () => { throw Error('Référentiel de styles invalide ou non sourcé.'); };
  if (!v || v.kind !== 'styleGuide' || typeof v.id !== 'string' || !v.id.trim() || !v.name || !v.version || typeof v.enabled !== 'boolean' || !v.edition ||
    (v.retrievedAt !== null && !date(v.retrievedAt)) || (v.retrievedAt === null && !date(v.createdAt)) ||
    v.createdAt !== undefined && !date(v.createdAt) || hopSourceError(v.source) || !v.attribution || typeof v.attribution !== 'string') fail();
  assertStyleRows(v.styles);
  if (v.history !== undefined) {
    if (!Array.isArray(v.history) || v.history.length > 500) fail();
    const versions = new Set<string>([v.version]);
    for (const revision of v.history) {
      if (!revision || typeof revision !== 'object' || Array.isArray(revision) || !revision.version || versions.has(revision.version) || !revision.edition ||
        typeof revision.enabled !== 'boolean' || (revision.retrievedAt !== null && !date(revision.retrievedAt)) ||
        revision.retrievedAt === null && !date(revision.createdAt) || revision.createdAt !== undefined && !date(revision.createdAt) ||
        !revision.attribution || hopSourceError(revision.source)) fail();
      assertStyleRows(revision.styles);
      versions.add(revision.version);
    }
  }
  if (v.catalogueMeta !== undefined) assertBrewerCatalogueMeta(v.catalogueMeta, 'brewingStyle');
}
