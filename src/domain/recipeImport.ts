import { Fermentable, MashProfile, Recipe, WaterIons, WaterPlan } from '../types';
import { RecipeTextParser } from '../services/recipeParser';
import { readRecipeFields, readRecipeText, RecipeContent } from './recipeTransfer';
import { yeastRecipeDesignChanged } from './yeastRecipeDesign';

export interface ImportedRecipe extends Omit<Partial<RecipeContent>, 'waterPlan' | 'mash'> {
  fermentables: RecipeContent['fermentables'];
  hops: RecipeContent['hops'];
  mashSteps: MashProfile['steps'];
  fermentation: NonNullable<RecipeContent['fermentation']>;
  mash?: Partial<MashProfile>;
  waterPlan?: Partial<WaterPlan>;
  waterTarget?: Partial<WaterIons>;
  waterTargetName?: string;
  waterNote?: string;
  mashWaterL?: number;
  spargeWaterL?: number;
  carboVolumes?: number;
  dryHopNote?: string;
  warnings: string[];
  via: 'ia' | 'local';
  /** Full own-format imports replace empty lists too; free text only updates read fields. */
  complete: boolean;
  present: string[];
}
const number = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;
const string = (v: unknown) => (typeof v === 'string' ? v : undefined);
const unparsed = (value: unknown): string => {
  try {
    return JSON.stringify(value, (_, v) => typeof v === 'number' && !Number.isFinite(v) ? String(v) : v);
  } catch {
    return 'Données non sérialisables ; vérifier le document original.';
  }
};

/** Used for both AI output and the local reader, before anything reaches React. */
export function normalizeRecipeImport(
  raw: unknown,
  via: ImportedRecipe['via'],
  complete = false
): ImportedRecipe {
  const d: any = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const clean = readRecipeFields({
    ...d,
    notes: typeof d.notes === 'string' ? [d.notes] : d.notes,
    mash: d.mash ?? (d.mashSteps ? { steps: d.mashSteps } : undefined)
  });
  const warnings: string[] = [];
  const rejected = (message: string, label: string, value: unknown) => {
    if (complete) throw new Error(message);
    warnings.push(message);
    clean.notesCreation = [clean.notesCreation, `${label} : ${unparsed(value)}`].filter(Boolean).join('\n');
  };
  if (d.yeastDesign !== undefined && !clean.yeastDesign) {
    rejected('Scénario de levure invalide ou non reconnu : aucun scénario de remplacement créé.',
      'Scénario levure non importé', d.yeastDesign);
  }
  if (!complete) {
    // A missing identity in foreign text must not clear the recipe being edited.
    if (!clean.name?.trim()) delete clean.name;
    if (!clean.style?.trim()) delete clean.style;
  }
  for (const [key, label] of Object.entries({
    hopIndexId: 'Référence de levure', form: 'Forme de levure', qty: 'Quantité de levure',
    unit: 'Unité de levure', lab: 'Laboratoire', strain: 'Souche',
    fermentationFacts: 'Données fermentaires sourcées',
    pitchTempC: 'Température d’ensemencement', fermTempMinC: 'Température minimale de fermentation',
    fermTempMaxC: 'Température maximale de fermentation', attenuationPct: 'Atténuation', fermentDays: 'Durée de fermentation'
  })) {
    if (d.yeast?.[key] != null && clean.yeast?.[key] === undefined) {
      rejected(`${label} invalide : valeur non importée.`, label, d.yeast[key]);
    }
  }
  if (Array.isArray(d.hops)) d.hops.forEach((hop: unknown) => {
    if (!hop || typeof hop !== 'object') return;
    const supplied = hop as Record<string, unknown>;
    const accepted = readRecipeFields({ hops: [supplied] }).hops?.[0];
    for (const [key, label] of Object.entries({ aromaTiming: 'phase biologique',
      aromaContactHours: 'durée de contact', aromaTemperatureC: 'température de contact' })) {
      if (supplied[key] != null && accepted?.[key] === undefined) {
        rejected(`Contact du houblon ${string(supplied.name) ?? 'sans nom'} invalide (${label}) : valeur non importée.`,
          'Contact houblon non importé', { name: supplied.name, [key]: supplied[key] });
      }
    }
    if (!accepted?.name?.trim() || accepted.weightG == null) {
      rejected('Ajout de houblon incomplet : nom ou masse manquant ; données conservées dans les notes.',
        'Houblon non importé', supplied);
    }
  });
  const grainKg = (clean.fermentables ?? [])
    .filter((f) => f.kind === 'grain')
    .reduce((sum, f) => sum + (f.weightKg ?? 0), 0);
  const mashLitres = clean.waterPlan?.mashWaterL ?? number(d.mashWaterL);
  if (
    grainKg > 0 &&
    mashLitres > 0 &&
    clean.mash?.ratioLPerKg != null &&
    Math.abs(mashLitres / grainKg - clean.mash.ratioLPerKg) > 0.05
  ) {
    const note = `Épaisseur annoncée : ${clean.mash.ratioLPerKg} L/kg ; les volumes et le grain donnent ${(mashLitres / grainKg).toFixed(2)} L/kg. Les volumes sont conservés.`;
    warnings.push(note);
    clean.notesCreation = [clean.notesCreation, note].filter(Boolean).join('\n');
  }
  if (
    clean.waterPlan?.sourceSnapshot &&
    !['id', 'name', 'ca', 'mg', 'na', 'so4', 'cl', 'hco3'].every(
      (k) => clean.waterPlan.sourceSnapshot[k] != null
    )
  ) {
    warnings.push(
      'Analyse de source incomplète : conservée dans les notes, sans remplacer votre eau.'
    );
    clean.notesCreation = [
      clean.notesCreation,
      `Analyse partielle : ${JSON.stringify(clean.waterPlan.sourceSnapshot)}`
    ]
      .filter(Boolean)
      .join('\n');
    delete clean.waterPlan.sourceSnapshot;
  }
  if (
    (clean.waterPlan?.acid || clean.waterPlan?.acidOverride) &&
    !clean.waterPlan.acid?.id &&
    !complete
  ) {
    warnings.push(
      'Acidifiant non reconnu : dose conservée dans les notes, sans ajout automatique.'
    );
    clean.notesCreation = [
      clean.notesCreation,
      `Acide non identifié : ${JSON.stringify(d.waterPlan?.acid)}`
    ]
      .filter(Boolean)
      .join('\n');
    delete clean.waterPlan.acid;
    delete clean.waterPlan.acidOverride;
  }
  const fermentables = (clean.fermentables ?? [])
    .filter((f) => typeof f.name === 'string' && f.weightKg != null)
    .map((f) => ({ ...f, kind: f.kind ?? 'grain', use: f.use ?? 'empatage' }));
  const hops = (clean.hops ?? [])
    .filter((h) => typeof h.name === 'string' && h.weightG != null)
    .map((h) => ({ ...h, alpha: h.alpha ?? 0, stage: h.stage ?? 'boil' }));
  // Partial imported yeast data stays partial. A lab name does not imply a form,
  // packet size, viable-cell count or catalogue association.
  const yeast = clean.yeast && typeof clean.yeast.name === 'string' ? clean.yeast : undefined;
  if (d.yeast != null && !yeast) rejected('Levure incomplète : nom manquant ; données conservées dans les notes.',
    'Levure non importée', d.yeast);
  if (yeast?.name) {
    const missing = [yeast.qty == null ? 'quantité' : '', !yeast.unit?.trim() ? 'unité' : '',
      !yeast.form ? 'forme' : ''].filter(Boolean);
    if (missing.length) warnings.push(`Levure : ${missing.join(', ')} manquante(s) ; aucune valeur supposée.`);
  }
  if (!complete) {
    if (!fermentables.length) warnings.push('Aucun fermentescible reconnu.');
    if (!hops.length) warnings.push('Aucun houblon reconnu.');
    if (!yeast) warnings.push('Aucune levure reconnue.');
    const unknownAlpha = hops.filter((h) => h.stage !== 'dryHop' && !h.alpha);
    if (unknownAlpha.length)
      warnings.push(
        `Alpha absent : ${[...new Set(unknownAlpha.map((h) => h.name))].join(', ')} — l’IBU sera partiel.`
      );
    const noColor = fermentables.filter((f) => f.kind === 'grain' && f.colorEbc == null);
    if (noColor.length)
      warnings.push(`Couleur absente : ${noColor.map((f) => f.name).join(', ')}.`);
    if (string(d.source))
      clean.notesCreation = [clean.notesCreation, `Source des compléments : ${d.source}`]
        .filter(Boolean)
        .join('\n');
  }
  const waterTarget =
    d.waterTarget && typeof d.waterTarget === 'object'
      ? Object.fromEntries(
          ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'].flatMap((k) =>
            number(d.waterTarget[k]) === undefined ? [] : [[k, d.waterTarget[k]]]
          )
        )
      : undefined;
  const mashSteps = (clean.mash?.steps ?? []).filter(
    (s) => s.name != null && (complete || s.tempC != null && s.durationMin != null)
  );
  const fermentation = (clean.fermentation ?? [])
    .filter((s) => s.name != null && s.kind != null && (complete || s.tempC != null));
  const suppliedMash = d.mash?.steps ?? d.mashSteps;
  if (Array.isArray(suppliedMash) && mashSteps.length < suppliedMash.length) {
    rejected('Palier d’empâtage incomplet ou invalide : le programme original reste dans les notes.',
      'Empâtage non entièrement importé', suppliedMash);
  }
  if (Array.isArray(d.fermentation) && fermentation.length < d.fermentation.length) {
    rejected('Phase de fermentation incomplète ou invalide : le programme original reste dans les notes.',
      'Fermentation non entièrement importée', d.fermentation);
  }
  if (mashSteps.some(s => s.tempC == null || s.durationMin == null)) warnings.push('Température ou durée d’empâtage manquante : compléter les paliers avant brassage.');
  if (fermentation.some(s => s.tempC == null)) warnings.push('Température de fermentation manquante : aucune consigne supposée.');
  if (fermentation.some(s => s.days == null)) warnings.push('Durée de fermentation manquante : aucun nombre de jours supposé.');
  const result: ImportedRecipe = {
    ...clean,
    fermentables,
    hops,
    yeast,
    mashSteps,
    fermentation,
    ...(clean.mash
      ? { mash: { ...clean.mash, ...(clean.mash.steps ? { steps: mashSteps } : {}) } }
      : {}),
    adjuncts: clean.adjuncts
      ?.filter((a) => a.name != null && a.amount != null && a.unit != null)
      .map((a) => ({ ...a, step: a.step ?? '' })),
    waterTarget,
    waterTargetName: string(d.waterTargetName),
    waterNote: string(d.waterNote),
    mashWaterL: number(d.mashWaterL),
    spargeWaterL: number(d.spargeWaterL),
    carboVolumes: number(d.carboVolumes),
    dryHopNote: string(d.dryHopNote),
    warnings,
    via,
    complete,
    present: Object.keys(clean)
  };
  // This comparison reads business fields only; an import deliberately has no database id.
  if (result.yeastDesign && yeastRecipeDesignChanged(result as unknown as Recipe, result.yeastDesign)) {
    result.warnings.push('Scénario de levure ancien : la recette a été modifiée depuis son adoption. Les réglages actuels sont conservés ; comparer avant de réappliquer.');
  }
  return result;
}

export function parseLocalRecipe(raw: string): ImportedRecipe {
  // A recognized export must use its versioned reader. A damaged own-format copy
  // must surface its error rather than becoming plausible free-text ingredients.
  const own = readRecipeText(raw);
  if (own) return normalizeRecipeImport(own, 'local', true);
  const p = RecipeTextParser.parse(raw);
  const fermentables: Fermentable[] = p.malts.map((m) => ({
    ...m,
    kind: m.kind ?? 'grain',
    use: m.use ?? 'empatage'
  }));
  const adjuncts = p.adjuncts.filter((a) => {
    const kind = /lactose/i.test(a.name)
      ? 'lactose'
      : /sugar|sucre|candi|miel|honey|sirop/i.test(a.name)
        ? 'sucre'
        : /purée|puree|fruit/i.test(a.name)
          ? 'fruit'
          : undefined;
    if (!kind || !['g', 'kg'].includes(a.unit)) return true;
    fermentables.push({
      name: a.name,
      weightKg: a.amount / (a.unit === 'g' ? 1000 : 1),
      kind,
      use: /ferment/i.test(a.step) ? 'fermentation' : 'ebullition',
      ...(kind === 'lactose' ? { fermentabilityPct: 0 } : {})
    });
    return false;
  });
  const result = normalizeRecipeImport({ ...p, fermentables, adjuncts }, 'local');
  result.warnings = [...new Set([...p.warnings, ...result.warnings])];
  // Preserve prose the fallback reader cannot structure, so omissions remain reviewable.
  result.notesCreation = raw;
  return result;
}
