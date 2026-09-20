import { Fermentable, HopIngredient, StockItem, YeastSpec } from '../types';

import { readIngredientFermentationFacts, type IngredientFermentationFacts } from '../../functions/src/ingredientFermentationFacts';
import { alcoholPercentUnit, readYeastTechnicalFacts, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';

export type IngredientKind = 'levure' | 'malt' | 'houblon';

export interface IngredientFacts {
  found: boolean;
  hopIndexId?: string;
  fermentation?: IngredientFermentationFacts;
  technicalFacts?: YeastTechnicalFact[];
  sourceUrl?: string;
  retrievedAt?: string;
  origin?: YeastTechnicalFact['origin'];
  name: string;
  source: string;
  note?: string;

  lab?: string;
  strain?: string;
  form?: 'sèche' | 'liquide' | 'levain';
  attenuationPct?: number;
  tempMinC?: number;
  tempMaxC?: number;
  flocculation?: string;
  alcoholTolerancePct?: number;

  colorEbc?: number;
  potentialPpg?: number;
  grainType?: string;
  diastaticPower?: number;

  alphaPct?: number;
  betaPct?: number;
  usage?: string;
  aroma?: string;
  substitutes?: string[];
}

export type LearnIngredient = (name: string, facts: Partial<StockItem>) => void;
export const ingredientKey = (kind: IngredientKind, name: string) =>
  `${kind}:${name.trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ')}`;

/** Only usable published values may reach calculations or the ingredient catalogue. */
export function sanitizeFacts(facts: IngredientFacts): IngredientFacts {
  const out = { ...facts };
  const fermentation = readIngredientFermentationFacts(facts.fermentation);
  if (fermentation) out.fermentation = fermentation; else delete out.fermentation;
  const technical = readYeastTechnicalFacts(facts.technicalFacts);
  if (technical) out.technicalFacts = technical; else delete out.technicalFacts;
  const limits: Partial<Record<keyof IngredientFacts, [number, number]>> = {
    colorEbc: [0, 5000],
    potentialPpg: [1, 50],
    alphaPct: [0.01, 100],
    betaPct: [0, 100],
    attenuationPct: [0, 100],
    tempMinC: [-5, 60],
    tempMaxC: [-5, 60],
    alcoholTolerancePct: [0, 40],
    diastaticPower: [0, 1000]
  };
  for (const [key, [min, max]] of Object.entries(limits)) {
    const v = out[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) delete out[key];
  }
  if (out.tempMinC != null && out.tempMaxC != null && out.tempMinC > out.tempMaxC) {
    delete out.tempMinC;
    delete out.tempMaxC;
  }
  for (const key of ['lab', 'strain', 'source', 'sourceUrl', 'retrievedAt', 'note', 'name', 'flocculation'] as const) {
    if (typeof out[key] !== 'string') delete out[key];
    else out[key] = out[key].trim();
  }
  if (!['sèche', 'liquide', 'levain'].includes(out.form)) delete out.form;
  if (!['manufacturer', 'personal', 'ai'].includes(out.origin)) delete out.origin;
  if (out.sourceUrl) {
    try { if (!['http:', 'https:'].includes(new URL(out.sourceUrl).protocol)) delete out.sourceUrl; }
    catch { delete out.sourceUrl; }
  }
  if (out.retrievedAt && !Number.isFinite(Date.parse(out.retrievedAt))) delete out.retrievedAt;
  // A model sometimes duplicates a published range as its midpoint. The range
  // is the evidence; never retain that unsupported pseudo-exact scalar.
  for (const [field, key] of [['attenuationPct', 'attenuation'], ['alcoholTolerancePct', 'alcoholTolerance']] as const) {
    const documented = out.technicalFacts?.filter(f => f.key === key && f.range &&
      (key === 'alcoholTolerance' ? alcoholPercentUnit(f.unit) : f.unit === '%')) ?? [];
    if (documented.length && !documented.every(f => f.qualifier === 'reportedPoint' && f.range!.min === out[field])) delete out[field];
  }
  return out;
}

/** Keep independent observations and disagreements, removing only exact repeats. */
export function mergeYeastTechnicalFacts(...groups: (YeastTechnicalFact[] | undefined)[]): YeastTechnicalFact[] | undefined {
  const facts = groups.flatMap(group => readYeastTechnicalFacts(group) ?? []);
  const unique = [...new Map(facts.map(fact => [JSON.stringify(fact), fact])).values()];
  return unique.length ? unique : undefined;
}

/** Older scalar responses remain usable without pretending they were ranges. */
export function yeastTechnicalFactsFromIngredient(facts: IngredientFacts): YeastTechnicalFact[] | undefined {
  const v = sanitizeFacts(facts), items = [...(v.technicalFacts ?? [])];
  const provenance = { origin: v.origin ?? 'ai' as const,
    ...(v.source ? { source: v.source } : {}), ...(v.sourceUrl ? { sourceUrl: v.sourceUrl } : {}),
    ...(v.retrievedAt ? { retrievedAt: v.retrievedAt } : {}) };
  const numeric = (key: YeastTechnicalFact['key'], min: number | undefined, max: number | undefined, unit: string) => {
    if (min == null || max == null || items.some(f => f.key === key)) return;
    items.push({ key, reported: `${min}${min === max ? '' : `–${max}`} ${unit}`, range: { min, max }, unit,
      qualifier: min === max ? 'reportedPoint' : 'range', ...provenance });
  };
  numeric('attenuation', v.attenuationPct, v.attenuationPct, '%');
  numeric('temperature', v.tempMinC, v.tempMaxC, '°C');
  numeric('alcoholTolerance', v.alcoholTolerancePct, v.alcoholTolerancePct, '%');
  for (const [key, reported] of [['flocculation', v.flocculation], ['form', v.form]] as const)
    if (reported && !items.some(f => f.key === key)) items.push({ key, reported, ...provenance });
  return mergeYeastTechnicalFacts(items);
}

export type YeastFactField = 'lab' | 'strain' | 'form' | 'attenuationPct' | 'fermTempMinC' | 'fermTempMaxC' | 'flocculation' | 'alcoholTolerancePct' | 'notes' | 'fermentationFacts';
export interface YeastFactChange { field: YeastFactField; label: string; current: unknown; proposed: unknown; conflict: boolean }
const yeastFactFields: [YeastFactField, keyof IngredientFacts, string][] = [
  ['lab', 'lab', 'Laboratoire'], ['strain', 'strain', 'Code de souche'], ['form', 'form', 'Forme'],
  ['attenuationPct', 'attenuationPct', 'Atténuation (%)'], ['fermTempMinC', 'tempMinC', 'Température minimale (°C)'],
  ['fermTempMaxC', 'tempMaxC', 'Température maximale (°C)'], ['flocculation', 'flocculation', 'Floculation'],
  ['alcoholTolerancePct', 'alcoholTolerancePct', 'Tolérance alcoolique (%)'], ['notes', 'note', 'Notes documentaires'],
  ['fermentationFacts', 'fermentation', 'Assimilation et domaine publié']
];
export function yeastFactChanges(yeast: YeastSpec, facts: IngredientFacts): YeastFactChange[] {
  const clean = sanitizeFacts(facts);
  return yeastFactFields.flatMap(([field, sourceField, label]) => {
    const proposed = clean[sourceField], current = yeast[field];
    if (proposed == null || proposed === '' || JSON.stringify(current) === JSON.stringify(proposed)) return [];
    return [{ field, label, current, proposed, conflict: current != null && current !== '' }];
  });
}

export function applyMaltFacts(f: Fermentable, facts: IngredientFacts): Fermentable {
  const v = sanitizeFacts(facts);
  return {
    ...f,
    colorEbc: f.colorEbc ?? v.colorEbc,
    potentialPpg: f.potentialPpg || v.potentialPpg
  };
}
export function applyHopFacts(h: HopIngredient, facts: IngredientFacts): HopIngredient {
  return { ...h, alpha: h.alpha || sanitizeFacts(facts).alphaPct };
}
export function applyYeastFacts(y: YeastSpec, facts: IngredientFacts, replaceFields: readonly YeastFactField[] = []): YeastSpec {
  const v = sanitizeFacts(facts);
  const next: YeastSpec = {
    ...y,
    hopIndexId: y.hopIndexId || v.hopIndexId,
    technicalFacts: mergeYeastTechnicalFacts(y.technicalFacts, yeastTechnicalFactsFromIngredient(v)),
    technicalSource: y.technicalSource || v.source
  };
  for (const change of yeastFactChanges(y, v)) {
    if (change.conflict && !replaceFields.includes(change.field)) continue;
    (next as unknown as Record<string, unknown>)[change.field] = change.proposed;
    if (change.field === 'attenuationPct') next.attenuationBasis = 'declared';
  }
  return next;
}

export function factsForStock(kind: IngredientKind, facts: IngredientFacts): Partial<StockItem> {
  const v = sanitizeFacts(facts);
  const fields: Partial<StockItem> =
    kind === 'malt'
      ? { colorEbc: v.colorEbc, potentialPpg: v.potentialPpg }
      : kind === 'houblon'
        ? { alphaPct: v.alphaPct }
        : {
            yeastFermentationFacts: v.fermentation,
            yeastTechnicalFacts: yeastTechnicalFactsFromIngredient(v),
            yeastFlocculation: v.flocculation,
            yeastAlcoholTolerancePct: v.alcoholTolerancePct,
            yeastNotes: v.note,
            yeastLab: v.lab,
            yeastStrain: v.strain,
            yeastForm: v.form,
            yeastAttenuationPct: v.attenuationPct,
            yeastTempMinC: v.tempMinC,
            yeastTempMaxC: v.tempMaxC
          };
  return {
    ...fields,
    category: { malt: 'Malt', houblon: 'Houblon', levure: 'Levure' }[kind],
    technicalSource: v.source
  };
}

export function factsFromStock(item: StockItem): IngredientFacts {
  return sanitizeFacts({
    found: true,
    name: item.name,
    fermentation: item.yeastFermentationFacts,
    technicalFacts: item.yeastTechnicalFacts,
    origin: 'personal',
    flocculation: item.yeastFlocculation,
    alcoholTolerancePct: item.yeastAlcoholTolerancePct,
    note: item.yeastNotes,
    source: item.technicalSource || 'Catalogue ingrédients',
    colorEbc: item.colorEbc,
    potentialPpg: item.potentialPpg,
    alphaPct: item.alphaPct,
    lab: item.yeastLab,
    strain: item.yeastStrain,
    form: item.yeastForm,
    attenuationPct: item.yeastAttenuationPct,
    tempMinC: item.yeastTempMinC,
    tempMaxC: item.yeastTempMaxC
  });
}

export interface IngredientGap {
  key: string;
  kind: IngredientKind;
  name: string;
  missing: string[];
}
export function ingredientGaps(
  fermentables: Fermentable[],
  hops: HopIngredient[],
  yeast: YeastSpec,
  nolo = false
): IngredientGap[] {
  const technical = readYeastTechnicalFacts(yeast.technicalFacts) ?? [];
  const documentedAttenuation = technical.some(f => f.key === 'attenuation' && f.unit === '%' && f.range && ['range', 'reportedPoint'].includes(f.qualifier));
  const documentedMin = technical.some(f => f.key === 'temperature' && f.unit === '°C' && f.range && f.qualifier !== 'upTo');
  const documentedMax = technical.some(f => f.key === 'temperature' && f.unit === '°C' && f.range && f.qualifier !== 'atLeast');
  const gaps = new Map<string, IngredientGap>();
  const add = (kind: IngredientKind, name: string, missing: string[]) => {
    if (!name?.trim() || !missing.length) return;
    const key = ingredientKey(kind, name);
    const old = gaps.get(key);
    gaps.set(key, {
      key,
      kind,
      name,
      missing: [...new Set([...(old?.missing ?? []), ...missing])]
    });
  };
  fermentables
    .filter((f) => f.kind === 'grain')
    .forEach((f) =>
      add(
        'malt',
        f.name,
        [f.colorEbc == null && 'couleur EBC', !f.potentialPpg && 'potentiel PPG'].filter(
          Boolean
        ) as string[]
      )
    );
  // The technical sheet remains useful at every stage. Alpha is never used as
  // a dry-hop utilization, but must survive moving the same lot to the kettle.
  hops.forEach((h) => add('houblon', h.name, h.alpha ? [] : ['acides alpha']));
  add(
    'levure',
    yeast.name,
    [
      yeast.attenuationPct == null && !documentedAttenuation && 'atténuation',
      nolo && !yeast.fermentationFacts && 'assimilation NOLO et ensemencement',
      yeast.fermTempMinC == null && !documentedMin && 'température minimale',
      yeast.fermTempMaxC == null && !documentedMax && 'température maximale',
      !yeast.lab?.trim() && 'laboratoire'
    ].filter(Boolean) as string[]
  );
  return [...gaps.values()];
}

export function fillsGap(gap: IngredientGap, facts: IngredientFacts): boolean {
  const v = sanitizeFacts(facts);
  const keys = {
    'couleur EBC': ['colorEbc'],
    'potentiel PPG': ['potentialPpg'],
    'acides alpha': ['alphaPct'],
    atténuation: ['attenuationPct'],
    'assimilation NOLO et ensemencement': ['fermentation'],
    'plage de température': ['tempMinC', 'tempMaxC'],
    'température minimale': ['tempMinC'],
    'température maximale': ['tempMaxC'],
    laboratoire: ['lab']
  };
  return gap.missing.some((label) => keys[label]?.some((key) => v[key] != null && v[key] !== '') ||
    (label === 'atténuation' && v.technicalFacts?.some(f => f.key === 'attenuation' && f.unit === '%' && f.range && ['range', 'reportedPoint'].includes(f.qualifier))) ||
    (label.startsWith('température') && v.technicalFacts?.some(f => f.key === 'temperature' && f.unit === '°C' && f.range &&
      (label === 'température minimale' ? f.qualifier !== 'upTo' : f.qualifier !== 'atLeast'))));
}
