import { Recipe } from '../types';
import { recipeWaterExport } from './recipeWaterExport';
import { readIngredientFermentationFacts } from '../../functions/src/ingredientFermentationFacts';
import { assertNoloConfig } from '../../functions/src/noloSchema';
import { readYeastRecipeDesign } from './yeastRecipeDesign';
import { sameField } from '../../functions/src/brewerFields';
import { noloInputBasis, type NoloInput } from '../../functions/src/noloCore';
import { noloScenarioBasis } from '../../functions/src/noloScenario';
import { noloInput } from './nolo';
import { noloToolContext } from './noloToolContext';

/** A readable, versioned text format. Labels, units and validation share one schema.
 * Only this small indentation format is parsed here; arbitrary recipes go through
 * the existing text reader. Database identity and batch links are never imported.
 */
type Field = {
  label: string;
  /** Older labels remain readable when wording is clarified within format v1. */
  aliases?: readonly string[];
  type: 'text' | 'number' | 'boolean' | 'object' | 'array' | 'nolo' | 'fermentationFacts' | 'yeastDesign';
  fields?: Fields;
  item?: Field;
  values?: readonly string[];
  labels?: Record<string, string>;
  min?: number;
  max?: number;
  nullable?: boolean;
};
type Fields = Record<string, Field>;
const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);
const t = (label: string, values?: readonly string[]): Field => ({ label, type: 'text', values });
const n = (label: string, min = 0, max = 1e7): Field => ({ label, type: 'number', min, max });
const b = (label: string): Field => ({ label, type: 'boolean' });
const o = (label: string, fields: Fields): Field => ({ label, type: 'object', fields });
const a = (label: string, item: Field): Field => ({ label, type: 'array', item });
const ions = {
  ca: n('Ca (ppm)'),
  mg: n('Mg (ppm)'),
  na: n('Na (ppm)'),
  so4: n('SO₄ (ppm)'),
  cl: n('Cl (ppm)'),
  hco3: n('HCO₃ (ppm)')
};
const salts = {
  gypse: n('Gypse (g)'),
  cacl2: n('Chlorure de calcium (g)'),
  epsom: n('Epsom (g)'),
  mgcl2: n('Chlorure de magnésium (g)'),
  nacl: n('Chlorure de sodium (g)'),
  nahco3: n('Bicarbonate de sodium (g)'),
  caco3: n('Craie (g)'),
  chaux: n('Chaux (g)'),
  kcl: n('Chlorure de potassium (g)')
};
const saltIds = Object.keys(salts);
const acidId = t('Acidifiant', ['lactique', 'phosphorique', 'maltAcidule']);
acidId.labels = {
  lactique: 'Acide lactique 80 %',
  phosphorique: 'Acide phosphorique 75 %',
  maltAcidule: 'Malt acidulé'
};
const temp = (label: string) => n(label, -273.15, 1000);
const pct = (label: string) => n(label, 0, 100);
const ph = (label: string) => n(label, 0, 14);

export const recipeFields = {
  name: t('Nom'),
  style: t('Style'),
  fermentationIntent: o('Intention de fermentation', {version:n('Version',1,1),aroma:t('Arômes'),fruit:t('Fruits'),acidity:t('Acidité')}),
  yeastDesign: { label: 'Scénario de levure versionné', type: 'yeastDesign' } as Field,
  styleRef: o('Référence du style', {guideId:t('Référentiel'),version:t('Édition des données'),styleId:t('Identifiant du style')}),
  nolo: {label:'Configuration NOLO versionnée',type:'nolo'} as Field,
  volumeL: n('Volume fermenteur (L)'),
  brewDate: t('Date de brassage'),
  ogTarget: {...n('OG cible'),nullable:true},
  fgTarget: {...n('FG cible'),nullable:true},
  abvTarget: {...pct('ABV cible (%)'),nullable:true},
  ibuTarget: n('IBU cible'),
  colorEbc: n('Couleur annoncée (EBC)'),
  efficiencyPct: pct('Rendement (%)'),
  preBoilL: n('Volume avant ébullition (L)'),
  preBoilHotL: n('Volume avant ébullition à chaud (L)'),
  brewhouse: o('Matériel du plan', {
    id:t('Identifiant matériel'),name:t('Nom matériel'),volumeL:n('Volume visé (L)'),efficiencyPct:pct('Rendement matériel (%)'),boilOffRatePct:pct('Ancien débit (%/h)'),deadSpaceL:n('Pertes fond de cuve (L)'),mashRatioLPerKg:n('Épaisseur de maische (L/kg)'),
    equipment:o('Capacités et calibration',{
      kettleCapacityL:n('Cuve totale (L)'),kettleWorkingL:n('Cuve utile à chaud (L)'),workingVolumeConfirmed:b('Limite vérifiée'),spargeCapacityL:n('Sparger (L)'),fermenterCapacityL:n('Fermenteur total (L)'),fermenterHeadspacePct:pct('Marge de mousse (%)'),roPackL:n('Pack osmosée (L)'),boilOffLPerHour:n('Évaporation à chaud (L/h)'),grainAbsorptionLPerKg:n('Absorption (L/kg)'),grainDisplacementLPerKg:n('Déplacement grain (L/kg)'),coolingShrinkagePct:pct('Rétraction (%)'),heatingRateCPerMin:n('Chauffe (°C/min)')
    })
  }),
  carboTarget: t('Carbonatation'),
  boilMin: n('Ébullition (min)'),
  totalGristKg: n('Grain total (kg)'),
  fermentables: a(
    'Fermentescibles',
    o('', {
      name: t('Nom'),
      weightKg: n('Masse (kg)'),
      pct: pct('Part (%)'),
      kind: t('Famille', ['grain', 'sucre', 'lactose', 'fruit', 'extrait']),
      use: t('Ajout', ['empatage', 'ebullition', 'fermentation']),
      colorEbc: n('Couleur (EBC)'),
      potentialPpg: n('Potentiel (PPG)'),
      fermentabilityPct: pct('Fermentescibilité (%)'),
      dayOffset: n('Jour')
    })
  ),
  hops: a(
    'Houblons',
    o('', {
      name: t('Nom'),
      weightG: n('Masse (g)'),
      alpha: pct('Alpha (%)'),
      stage: t('Moment', ['firstWort', 'boil', 'whirlpool', 'dryHop']),
      timeMin: n('Durée (min)'),
      tempC: temp('Température (°C)'),
      dayOffset: n('Jour'),
      aromaTiming: t('Moment biologique', ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation']),
      aromaContactHours: n('Contact aromatique (h)'),
      aromaTemperatureC: temp('Température aromatique (°C)'),
      step: t('Indication d’origine')
    })
  ),
  adjuncts: a(
    'Autres ajouts',
    o('', {
      name: t('Nom'),
      amount: n('Quantité'),
      unit: t('Unité'),
      step: t('Moment'),
      notes: t('Notes')
    })
  ),
  yeast: o('Levure', {
    name: t('Nom'),
    hopIndexId: t('Souche de référence'),
    lab: t('Laboratoire'),
    strain: t('Souche'),
    fermentationFacts: {label:'Données fermentaires sourcées',type:'fermentationFacts'} as Field,
    form: t('Forme', ['sèche', 'liquide', 'levain']),
    qty: { ...n('Quantité'), nullable: true },
    unit: t('Unité'),
    pitchTempC: { ...temp('Ensemencement (°C)'), nullable: true },
    fermTempMinC: { ...temp('Fermentation minimum (°C)'), nullable: true },
    fermTempMaxC: { ...temp('Fermentation maximum (°C)'), nullable: true },
    attenuationPct: { ...pct('Atténuation (%)'), nullable: true },
    fermentDays: { ...n('Durée (jours)'), nullable: true },
    notes: t('Notes')
  }),
  mash: o('Empâtage', {
    ratioLPerKg: n('Épaisseur (L/kg)'),
    mashoutTempC: temp('Mash-out (°C)'),
    mashoutDurationMin: n('Maintien mash-out (min)'),
    heatingRateCPerMin: n('Vitesse de chauffe (°C/min)'),
    spargeTempC: temp('Rinçage (°C)'),
    spargeType: t('Méthode de rinçage', ['fly', 'batch', 'none']),
    steps: a(
      'Paliers',
      o('', { name: t('Nom'), tempC: { ...temp('Température (°C)'), nullable: true }, durationMin: { ...n('Durée (min)'), nullable: true } })
    )
  }),
  waterPlan: o('Eau', {
    roLimitL: n('Osmosée disponible au total (L)', 0, 1000),
    ratioOverride: n('Rapport sulfate chlorure choisi', 0, 20),
    autoTreatment: b('Sels et acides suivent la recette'),
    saltOverrides: o('Doses manuelles de sels', { mash: o('Empâtage', salts), sparge: o('Rinçage', salts) }),
    sourceId: t('Référence de source'),
    sourceSnapshot: o('Analyse de source', {
      id: t('Référence'),
      name: t('Nom'),
      ...ions,
      ph: ph('pH'),
      note: t('Note'),
      updatedAt: t('Analyse mise à jour')
    }),
    treatmentVersion: n('Version du traitement', 2, 2),
    diRatioPct: pct('Osmosée empâtage (%)'),
    spargeDiRatioPct: pct('Osmosée rinçage (%)'),
    targetProfileId: t('Code du profil cible'),
    targetName: t('Nom de la cible'),
    targetIons: o('Cible (ppm)', ions),
    startIons: o('Départ dilué', ions),
    wortIons: o('Eau traitée après acide', ions),
    mashWaterL: n('Eau empâtage (L)'),
    spargeWaterL: n('Eau rinçage (L)'),
    allSaltsInMash: b('Tous les sels à l’empâtage'),
    mash: o('Sels empâtage', salts),
    sparge: o('Sels rinçage', salts),
    acid: o('Acides retenus', {
      id: acidId,
      mash: n('Empâtage (mL ou g de malt acidulé)'),
      sparge: n('Rinçage (mL ou g de malt acidulé)')
    }),
    acidOverride: o('Doses manuelles d’acide', {
      mash: n('Empâtage (mL ou g)'),
      sparge: n('Rinçage (mL ou g)')
    }),
    disabled: a('Sels désactivés', t('', saltIds)),
    targetPh: { ...ph('Consigne de pH à l’empâtage (à mesurer)'), aliases: ['pH cible'] },
    measuredPh: ph('pH empâtage mesuré'),
    measuredSpargePh: ph('pH rinçage mesuré')
  }),
  fermentation: a(
    'Fermentation',
    o('', {
      kind: t('Phase', ['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout']),
      name: t('Nom'),
      tempC: { ...temp('Température (°C)'), nullable: true },
      days: { ...n('Durée (jours)'), nullable: true },
      note: t('Note')
    })
  ),
  instructions: t('Déroulé'),
  steps: a(
    'Étapes complémentaires',
    o('', {
      step: t('Étape'),
      tempC: temp('Température (°C)'),
      durationMin: n('Durée (min)'),
      notes: t('Notes')
    })
  ),
  notes: a('Notes', t('')),
  notesCreation: t('Notes de création'),
  version: n('Version'),
  parentRecipeId: t('Recette d’origine')
} satisfies Record<
  // Index IDs and local axis definitions travel with a database backup, not a standalone recipe.
  Exclude<keyof Recipe, 'id' | 'batchRef' | 'favorite' | 'archivedAt' | 'malts' | 'water' | 'hopMatrixId' | 'hopAromaTarget' | 'hopPredictionIds' | 'hopTrialId' | 'hopSolverIntent' | 'yeastGuide'>,
  Field
>;

const estimates = o('Estimations au moment de la copie', {
  yeastIntent: t('Intention levure à la copie'),
  og: n('OG estimée'),
  fg: n('FG estimée'),
  abv: pct('ABV estimé (%)'),
  ibu: n('IBU estimée'),
  ebc: n('Couleur estimée (EBC)'),
  treatedWater: o('Eau traitée recalculée (moyenne pondérée après acide)', ions),
  mashIons: o('Empâtage après acide', ions),
  spargeIons: o('Rinçage après acide', ions),
  ra: n('Alcalinité résiduelle après acide (ppm CaCO₃)', -1e7),
  mashPhEstimated: ph('pH empâtage estimé après acide'),
  mashPhUncertainty: n('Incertitude du pH estimé (±)'),
  mashPhNote: t('Limite de l’estimation du pH'),
  requestedRatio: n('Rapport SO₄/Cl visé actuellement'),
  requestedRatioNote: t('Origine du rapport visé'),
  achievedRatio: n('Rapport SO₄/Cl obtenu'),
  mineralRanges: o('Plages du profil (ppm, eau de traitement totale)',
    Object.fromEntries(Object.entries(ions).map(([ion, field]) =>
      [ion, o(field.label, { min: n('Minimum'), max: n('Maximum') })]))),
  bicarbonateReferenceNote: t('Statut du repère HCO₃'),
  waterDiagnosticNote: t('Limite du diagnostic de l’eau')
});
const root = o('', { ...recipeFields, estimates });
export type RecipeContent = Omit<Recipe, 'id' | 'batchRef' | 'favorite' | 'archivedAt' | 'malts' | 'water' | 'hopMatrixId' | 'hopAromaTarget' | 'hopPredictionIds' | 'hopTrialId' | 'hopSolverIntent' | 'yeastGuide'>;
export const RECIPE_TEXT_HEADER = 'L’AFFINÉE — RECETTE v1';

/** Shared boundary for text and AI data: finite values, known keys and enums only.
 * Strict mode rejects damaged exports instead of silently dropping their fields. */
export function readRecipeFields(value: unknown, strict = false): Partial<RecipeContent> {
  const { estimates: _, ...recipe } = (readField(root, value, strict, 'Recette') ?? {}) as Record<string, unknown>;
  rebindNoloCopy(value, recipe);
  return recipe as Partial<RecipeContent>;
}

/** The readable format reorders object keys and omits database identities.
 * Rebind only references that matched the source copy, after proving that the
 * brewing inputs still mean the same thing. Old/incompatible assays stay old. */
function rebindNoloCopy(source: any, copy: any): void {
  if (!source?.nolo || !copy?.nolo || !source.yeast || !copy.yeast ||
    !Array.isArray(source.fermentables) || !Array.isArray(copy.fermentables) ||
    !Array.isArray(source.hops) || !Array.isArray(copy.hops)) return;
  const updateLink = (operation: any) => {
    if (operation.kind !== 'sugar' || !operation.recipeAddition) return operation;
    const link = operation.recipeAddition;
    const original = source.fermentables[link.index], next = copy.fermentables[link.index];
    return original && next && link.basis === JSON.stringify(original) && sameField(original, next)
      ? { ...operation, recipeAddition: { ...link, basis: JSON.stringify(next) } } : operation;
  };
  copy.nolo.operations = copy.nolo.operations.map(updateLink);
  if (copy.nolo.inactiveOperations) copy.nolo.inactiveOperations = copy.nolo.inactiveOperations
    .map((parked: any) => ({ ...parked, operation: updateLink(parked.operation) }));
  const before = noloInput(source), after = noloInput(copy);
  const parseBasis = (basis: string) => { try { return JSON.parse(basis); } catch { return basis; } };
  const comparable = (input: NoloInput) => {
    const { measurements: _measurements, brewTools: _tools, ...config } = input.config;
    return { ...input,
      fermentableBasis: parseBasis(input.fermentableBasis!), config: { ...config,
        operations: config.operations.map(operation => operation.kind === 'sugar' && operation.recipeAddition
          ? { ...operation, recipeAddition: { ...operation.recipeAddition, basis: parseBasis(operation.recipeAddition.basis) } } : operation),
        inactiveOperations: undefined } };
  };
  if (!sameField(comparable(before), comparable(after))) return;
  copy.nolo.measurements = copy.nolo.measurements.map((measurement: any) => {
    if (measurement.basis === noloScenarioBasis(before, measurement.afterOperationId))
      return { ...measurement, basis: noloScenarioBasis(after, measurement.afterOperationId) };
    if (measurement.basis === noloInputBasis(before, measurement.afterOperationId))
      return { ...measurement, basis: noloInputBasis(after, measurement.afterOperationId) };
    return measurement;
  });
  // Bench hypotheses also depend on hops, yeast details and extraction yield.
  // Dropping a nonportable detail must not silently renew their old context.
  if (!copy.nolo.brewTools || !sameField(source.hops, copy.hops) ||
    !sameField(source.yeast, copy.yeast) ||
    !sameField(source.mash, copy.mash) ||
    source.efficiencyPct !== copy.efficiencyPct ||
    source.brewhouse?.efficiencyPct !== copy.brewhouse?.efficiencyPct) return;
  const oldContext = noloToolContext(source), nextContext = noloToolContext(copy);
  for (const key of ['baseBasis', 'ibuBasis'])
    if (source.nolo.brewTools?.[key] === oldContext) copy.nolo.brewTools[key] = nextContext;
}
function readField(field: Field, value: unknown, strict: boolean, path: string): unknown {
  // An invalid NOLO payload must never quietly become an ordinary beer recipe.
  if (field.type === 'nolo' && value !== undefined) {
    try { assertNoloConfig(value); return structuredClone(value); }
    catch { throw new Error(`Configuration NOLO invalide : ${path}.`); }
  }
  if(value===null&&field.nullable)return null;
  if (value == null && !strict) return undefined;
  const fail = () => {
    if (strict) throw new Error(`Champ invalide : ${path}.`);
    return undefined;
  };
  if (field.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
    if (strict && Object.keys(value).some((k) => !hasOwn(field.fields!, k))) return fail();
    return Object.fromEntries(
      Object.entries(field.fields!).flatMap(([k, child]) => {
        if (!hasOwn(value, k)) return [];
        const v = readField(child, value[k], strict, `${path} / ${child.label}`);
        return v === undefined ? [] : [[k, v]];
      })
    );
  }
  if (field.type === 'array') {
    if (!Array.isArray(value) || value.length > 1000) return fail();
    return value.map((v) => readField(field.item!, v, strict, path)).filter((v) => v !== undefined);
  }
  if (field.type === 'number')
    return typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= field.min! &&
      value <= field.max!
      ? value
      : fail();
  if (field.type === 'boolean') return typeof value === 'boolean' ? value : fail();
  if (field.type === 'fermentationFacts') return readIngredientFermentationFacts(value) ?? fail();
  if (field.type === 'nolo') return fail();
  if (field.type === 'yeastDesign') {
    const snapshot = readYeastRecipeDesign({ yeastDesign: value } as Recipe);
    if (!snapshot) return fail();
    const portable = structuredClone(snapshot);
    delete portable.applied.yeast.stockItemRef;
    return portable;
  }
  return typeof value === 'string' && (!field.values || field.values.includes(value))
    ? value
    : fail();
}

export function writeRecipeText(
  recipe: RecipeContent,
  calculated?: Record<string, unknown>
): string {
  const clean = readField(root, {
    ...recipe, estimates: { ...calculated, ...recipeWaterExport(recipe) }
  }, false, 'Recette');
  rebindNoloCopy(recipe, clean);
  const lines = [RECIPE_TEXT_HEADER, ''];
  function emit(field: Field, value: unknown, indent: number, label: string) {
    if (value === undefined) return;
    const prefix = ' '.repeat(indent) + label;
    if (field.type === 'object' || field.type === 'array') {
      const entries =
        field.type === 'array'
          ? (value as unknown[]).map((v) => ['-', field.item!, v] as const)
          : Object.entries(field.fields!)
              .filter(([k]) => value[k] !== undefined)
              .map(([k, f]) => [f.label + ' :', f, value[k]] as const);
      if (label)
        lines.push(prefix + (entries.length ? '' : field.type === 'array' ? ' []' : ' {}'));
      entries.forEach(([key, child, v]) => emit(child, v, indent + (label ? 2 : 0), key));
    } else if (field.type === 'text' && (value as string).includes('\n')) {
      lines.push(prefix + ' |');
      (value as string).split('\n').forEach((line) => lines.push(' '.repeat(indent + 2) + line));
    } else {
      // Quoting names avoids confusing a colon, a number or a section title with syntax.
      lines.push(prefix + ' ' + JSON.stringify(field.labels?.[String(value)] ?? value));
    }
  }
  emit(root, clean, 0, '');
  lines.push('FIN DE RECETTE');
  return lines.join('\n');
}

/** null means ordinary free text. A recognized but damaged export is an error. */
export function readRecipeText(raw: string): RecipeContent | null {
  const text = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trimEnd();
  if (!text.trimStart().startsWith('L’AFFINÉE — RECETTE v')) return null;
  if (text.length > 2_000_000) throw new Error('Recette trop volumineuse.');
  const lines = text.trimStart().split('\n');
  if (lines.shift() !== RECIPE_TEXT_HEADER)
    throw new Error('Version de recette non prise en charge.');
  if (lines[0] === '') lines.shift();
  let i = 0;
  function parse(field: Field, indent: number): unknown {
    const array = field.type === 'array';
    const out: any = array ? [] : {};
    while (i < lines.length) {
      const line = lines[i];
      const depth = line.length - line.trimStart().length;
      if (depth < indent) break;
      if (depth !== indent) throw new Error(`Indentation invalide à la ligne ${i + 3}.`);
      const content = line.slice(indent);
      const entry = array
        ? undefined
        : Object.entries(field.fields!).find(([, f]) =>
          [f.label, ...(f.aliases ?? [])].some(label => content.startsWith(label + ' :')));
      if ((!array && !entry) || (array && !/^-(?: |$)/.test(content)))
        throw new Error(`Champ non reconnu à la ligne ${i + 3}.`);
      const child = array ? field.item! : entry![1];
      const key = array ? out.length : entry![0];
      if (!array && hasOwn(out, key)) throw new Error(`Champ répété : ${child.label}.`);
      const matchedLabel = array ? '' : [child.label, ...(child.aliases ?? [])]
        .find(label => content.startsWith(label + ' :'))!;
      const scalar = content.slice(array ? 1 : matchedLabel.length + 2).trimStart();
      i++;
      if (scalar === '|') {
        const block: string[] = [];
        while (i < lines.length && lines[i].startsWith(' '.repeat(indent + 2)))
          block.push(lines[i++].slice(indent + 2));
        out[key] = block.join('\n');
      } else if (!scalar && (child.type === 'object' || child.type === 'array'))
        out[key] = parse(child, indent + 2);
      else {
        try {
          const value = JSON.parse(scalar);
          out[key] =
            Object.entries(child.labels ?? {}).find(([, label]) => label === value)?.[0] ?? value;
        } catch {
          throw new Error(`Valeur invalide : ${child.label || 'élément'}.`);
        }
      }
    }
    return out;
  }
  if (lines.pop() !== 'FIN DE RECETTE')
    throw new Error('Fin de recette manquante. Recopie le texte complet.');
  const parsed = parse(root, 0);
  if (i !== lines.length) throw new Error('Fin de recette invalide.');
  const { estimates: _, ...recipe } = readRecipeFields(parsed, true) as any;
  for (const key of [
    'name',
    'style',
    'volumeL',
    'ogTarget',
    'fgTarget',
    'abvTarget',
    'totalGristKg',
    'fermentables',
    'hops',
    'yeast',
    'steps',
    'notes'
  ]) {
    if (!hasOwn(recipe, key)) throw new Error(`Recette incomplète : ${recipeFields[key].label}.`);
  }
  const require = (value: object, keys: string[]) => {
    if (keys.some((k) => !hasOwn(value, k)))
      throw new Error('Recette incomplète : des propriétés obligatoires manquent.');
  };
  recipe.fermentables.forEach((f) => require(f, ['name', 'weightKg', 'kind', 'use']));
  recipe.hops.forEach((h) => require(h, ['name', 'weightG', 'alpha', 'stage']));
  require(recipe.yeast, ['name']);
  recipe.adjuncts?.forEach((a) => require(a, ['name', 'amount', 'unit', 'step']));
  recipe.steps.forEach((s) => require(s, ['step', 'tempC', 'durationMin', 'notes']));
  if (recipe.mash) {
    require(recipe.mash, ['steps']);
    recipe.mash.steps.forEach((s) => require(s, ['name']));
  }
  recipe.fermentation?.forEach((s) => require(s, ['name', 'kind']));
  if (recipe.waterPlan) {
    const w = recipe.waterPlan;
    require(w, [
      'sourceId',
      'diRatioPct',
      'mashWaterL',
      'spargeWaterL',
      'mash',
      'sparge',
      'targetPh'
    ]);
    if (w.sourceSnapshot) require(w.sourceSnapshot, ['id', 'name', ...Object.keys(ions)]);
    if (w.acid) require(w.acid, ['id', 'mash', 'sparge']);
    if (w.startIons) require(w.startIons, Object.keys(ions));
    if (w.wortIons) require(w.wortIons, Object.keys(ions));
  }
  return recipe;
}
