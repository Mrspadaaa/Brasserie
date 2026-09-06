import { Fermentable, HopIngredient, StockItem, YeastSpec } from '../types';

export type IngredientKind = 'levure' | 'malt' | 'houblon';

export interface IngredientFacts {
  found: boolean;
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
  const limits: Partial<Record<keyof IngredientFacts, [number, number]>> = {
    colorEbc: [0, 5000],
    potentialPpg: [1, 50],
    alphaPct: [0.01, 100],
    betaPct: [0, 100],
    attenuationPct: [1, 100],
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
  for (const key of ['lab', 'strain', 'source', 'note', 'name'] as const) {
    if (typeof out[key] !== 'string') delete out[key];
    else out[key] = out[key].trim();
  }
  if (!['sèche', 'liquide', 'levain'].includes(out.form)) delete out.form;
  return out;
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
export function applyYeastFacts(y: YeastSpec, facts: IngredientFacts): YeastSpec {
  const v = sanitizeFacts(facts);
  return {
    ...y,
    lab: y.lab || v.lab,
    strain: y.strain || v.strain,
    form: y.form || v.form,
    attenuationPct: y.attenuationPct || v.attenuationPct,
    fermTempMinC: y.fermTempMinC ?? v.tempMinC,
    fermTempMaxC: y.fermTempMaxC ?? v.tempMaxC
  };
}

export function factsForStock(kind: IngredientKind, facts: IngredientFacts): Partial<StockItem> {
  const v = sanitizeFacts(facts);
  const fields: Partial<StockItem> =
    kind === 'malt'
      ? { colorEbc: v.colorEbc, potentialPpg: v.potentialPpg }
      : kind === 'houblon'
        ? { alphaPct: v.alphaPct }
        : {
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
  yeast: YeastSpec
): IngredientGap[] {
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
  hops
    .filter((h) => h.stage !== 'dryHop')
    .forEach((h) => add('houblon', h.name, h.alpha ? [] : ['acides alpha']));
  add(
    'levure',
    yeast.name,
    [
      !yeast.attenuationPct && 'atténuation',
      yeast.fermTempMinC == null && 'température minimale',
      yeast.fermTempMaxC == null && 'température maximale',
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
    'plage de température': ['tempMinC', 'tempMaxC'],
    'température minimale': ['tempMinC'],
    'température maximale': ['tempMaxC'],
    laboratoire: ['lab']
  };
  return gap.missing.some((label) => keys[label]?.some((key) => v[key] != null && v[key] !== ''));
}
