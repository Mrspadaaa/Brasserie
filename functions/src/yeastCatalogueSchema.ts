import { hopSourceError, validHopRange, type HopRange, type HopSource } from './hopIndexSchema.js';

/** Documentary observations, not coefficients or calibrated predictions. */
export const YEAST_FACT_KEYS = ['temperature', 'attenuation', 'alcoholTolerance', 'pitchRate', 'fermentationTime', 'flocculation', 'pof', 'sta1', 'diastatic', 'betaLyase', 'biotransformation', 'species', 'aroma', 'esters', 'higherAlcohols', 'h2s', 'styles', 'application', 'form', 'availability', 'nutrientNeed', 'ph', 'residualSugar', 'fermentationRate', 'foam', 'so2', 'volatileAcidity', 'glycerol', 'malolacticCompatibility'] as const;
export type YeastFactKey = typeof YEAST_FACT_KEYS[number];
export interface YeastCatalogueFact {
  key: YeastFactKey; label: string; reported: string; source: HopSource;
  /** A range/point reported by the manufacturer, not a confidence interval. */
  range?: HopRange; unit?: '°C' | '%' | 'g/hL' | 'h' | 'd';
  qualifier?: 'range' | 'reportedPoint' | 'atLeast' | 'upTo';
  context?: string;
}
export interface YeastCatalogue {
  manufacturer: string; productId: string; productCode: string | null; aliases: string[];
  categories: string[];
  /** Listed is not equivalent to in stock or still being manufactured. */
  status: 'listed' | 'discontinued' | 'unknown';
  facts: YeastCatalogueFact[];
  documents: { title: string; url: string }[];
  retrievals: { url: string; retrievedAt: string; sha256: string; etag: string | null; lastModified: string | null }[];
  publishedAt: string | null; pageUpdatedAt: string | null;
  parserVersion: string; contentSha256: string;
  gaps: string[];
}
const obj = (v: any) => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: any) => typeof v === 'string' && !!v.trim();
const check = (v: unknown, m: string) => { if (!v) throw Error(m); };
const keys = (v: any, names: string[]) => check(obj(v) && Object.keys(v).every(k => names.includes(k)), 'Champ de catalogue de levure non reconnu.');
const url = (v: any) => { try { return str(v) && ['https:', 'http:'].includes(new URL(v).protocol); } catch { return false; } };
const date = (v: any) => str(v) && Number.isFinite(Date.parse(v));
export function assertYeastCatalogue(v: any): asserts v is YeastCatalogue {
  keys(v, ['manufacturer', 'productId', 'productCode', 'aliases', 'categories', 'status', 'facts', 'documents', 'retrievals', 'publishedAt', 'pageUpdatedAt', 'parserVersion', 'contentSha256', 'gaps']);
  check(str(v.manufacturer) && str(v.productId) && (v.productCode === null || str(v.productCode)), 'Identité fabricant requise.');
  for (const key of ['aliases', 'categories', 'gaps']) check(Array.isArray(v[key]) && v[key].every(str), 'Liste documentaire invalide.');
  check(['listed', 'discontinued', 'unknown'].includes(v.status), 'Statut de catalogue invalide.');
  check(str(v.parserVersion) && /^[a-f0-9]{64}$/.test(v.contentSha256), 'Révision de collecte absente.');
  check([v.publishedAt, v.pageUpdatedAt].every(d => d === null || date(d)), 'Date technique invalide.');
  check(Array.isArray(v.facts) && v.facts.length <= 100, 'Observations de levure invalides.');
  for (const f of v.facts) {
    keys(f, ['key', 'label', 'reported', 'source', 'range', 'unit', 'qualifier', 'context']);
    check(YEAST_FACT_KEYS.includes(f.key) && str(f.label) && str(f.reported) && f.reported.length <= 500 && (f.context === undefined || str(f.context)), 'Fait de levure incomplet.');
    const error = hopSourceError(f.source); if (error) throw Error(error);
    if (f.range !== undefined) {
      check(validHopRange(f.range) && ['°C', '%', 'g/hL', 'h', 'd'].includes(f.unit) && ['range', 'reportedPoint', 'atLeast', 'upTo'].includes(f.qualifier), 'Plage documentaire sans unité ou qualificatif.');
      check(f.range.min >= 0 && (f.unit !== '%' || f.range.max <= 100) && (f.unit !== '°C' || f.range.max <= 60), 'Plage documentaire hors limites.');
      check(f.qualifier === 'range' || f.range.min === f.range.max, 'Borne/point documentaire ambigu.');
    } else check(f.unit === undefined && f.qualifier === undefined, 'Unité numérique sans valeur.');
  }
  check(Array.isArray(v.documents) && v.documents.every((d: any) => obj(d) && str(d.title) && url(d.url) && Object.keys(d).every(k => ['title', 'url'].includes(k))), 'Lien documentaire invalide.');
  check(Array.isArray(v.retrievals) && v.retrievals.length > 0, 'Traçabilité de collecte absente.');
  for (const r of v.retrievals) {
    keys(r, ['url', 'retrievedAt', 'sha256', 'etag', 'lastModified']);
    check(url(r.url) && date(r.retrievedAt) && /^[a-f0-9]{64}$/.test(r.sha256) && [r.etag, r.lastModified].every(s => s === null || typeof s === 'string'), 'Reçu de collecte invalide.');
  }
}
