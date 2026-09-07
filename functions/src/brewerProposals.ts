import type { BrewerContext, BrewerProposal, BrewerFieldChange } from './companionTypes.js';
import { reconcileRecipeWater, refreshCompanionRecipe, waterRelatedPath } from './brewerTools.js';
import { sameField } from './brewerFields.js';
export { sameField } from './brewerFields.js';

type Spec = {
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  values?: string[];
  shape?: string;
  text?: number;
  type?: 'boolean';
  nullable?: boolean;
  list?: Spec;
};
const n = (label: string, min: number, max: number, unit = ''): Spec => ({ label, min, max, unit });
const t = (label: string, text = 200): Spec => ({ label, text });
const choice = (label: string, values: string[]): Spec => ({ label, values });
const grain = {
  name: t('Nom'),
  weightKg: n('Quantité', 0, 300, 'kg'),
  kind: choice('Type', ['grain', 'sucre', 'extrait', 'fruit', 'lactose']),
  use: choice('Ajout', ['empatage', 'ebullition', 'fermentation']),
  colorEbc: n('Couleur', 0, 2000, 'EBC'),
  potentialPpg: n('Potentiel', 0, 50, 'PPG'),
  fermentabilityPct: n('Fermentescibilité', 0, 100, '%'),
  dayOffset: n('Jour d’ajout', 0, 365, 'j'),
  pct: n('Part du grain', 0, 100, '%')
};
const hop = {
  name: t('Nom'),
  weightG: n('Quantité', 0, 10000, 'g'),
  alpha: n('Acides alpha du lot', 0, 30, '%'),
  stage: choice('Ajout', ['firstWort', 'boil', 'whirlpool', 'dryHop']),
  timeMin: n('Temps de contact', 0, 480, 'min'),
  tempC: n('Température', 0, 110, '°C'),
  dayOffset: n('Jour d’ajout', 0, 365, 'j'),
  step: t('Ancienne indication')
};
const yeast = {
  name: t('Nom'),
  lab: t('Laboratoire'),
  strain: t('Souche'),
  form: choice('Forme', ['sèche', 'liquide', 'levain']),
  qty: n('Quantité', 0, 10000),
  unit: t('Unité', 30),
  pitchTempC: n('Ensemencement', 0, 45, '°C'),
  fermTempMinC: n('Fermentation minimum', 0, 45, '°C'),
  fermTempMaxC: n('Fermentation maximum', 0, 45, '°C'),
  attenuationPct: n('Atténuation', 0, 100, '%'),
  fermentDays: n('Durée', 1, 365, 'j'),
  notes: t('Notes', 2000)
};
const mashStep = {
  name: t('Palier'),
  tempC: n('Consigne', 0, 100, '°C'),
  durationMin: n('Maintien', 1, 480, 'min')
};
const fermentationStep = {
  kind: choice('Phase', ['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout']),
  name: t('Palier'),
  tempC: n('Consigne', -5, 45, '°C'),
  days: n('Durée', 0, 365, 'j'),
  note: t('Note', 2000)
};
const salts = Object.fromEntries(
  [
    ['gypse', 'Gypse'],
    ['cacl2', 'Chlorure de calcium'],
    ['epsom', 'Sel d’Epsom'],
    ['mgcl2', 'Chlorure de magnésium'],
    ['nacl', 'Sel de table'],
    ['nahco3', 'Bicarbonate de sodium'],
    ['caco3', 'Craie'],
    ['chaux', 'Chaux'],
    ['kcl', 'Chlorure de potassium']
  ].map(([id, label]) => [id, n(label, 0, 1000, 'g')])
);
const ions = Object.fromEntries(
  ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'].map((id) => [id, n(id.toUpperCase(), 0, 2000, 'mg/L')])
);
const acid = {
  id: choice('Acidifiant', ['lactique', 'phosphorique', 'maltAcidule']),
  mash: n('Dose empâtage', 0, 2000),
  sparge: n('Dose rinçage', 0, 2000)
};
const adjunct = {
  name: t('Nom'),
  amount: n('Quantité', 0, 10000),
  unit: t('Unité', 30),
  step: t('Ajout'),
  notes: t('Notes', 2000)
};
const recipeStep = {
  step: t('Étape'),
  tempC: n('Température', -5, 110, '°C'),
  durationMin: n('Durée', 0, 1440, 'min'),
  notes: t('Notes', 2000)
};
export const proposalValueSchemas: Record<
  string,
  { fields: Record<string, Spec>; required: string[]; array?: boolean }
> = {
  salts: { fields: salts, required: [] },
  ions: { fields: ions, required: [] },
  saltOverrides: {
    fields: {
      mash: { label: 'Empâtage', shape: 'salts' },
      sparge: { label: 'Rinçage', shape: 'salts' }
    },
    required: []
  },
  acid: { fields: acid, required: ['id', 'mash', 'sparge'] },
  acidOverride: { fields: { mash: acid.mash, sparge: acid.sparge }, required: [] },
  source: {
    fields: {
      ...ions,
      id: t('ID'),
      name: t('Source'),
      ph: n('pH', 0, 14),
      note: t('Provenance', 2000),
      updatedAt: t('Date')
    },
    required: ['id', 'name', ...Object.keys(ions)]
  },
  adjuncts: { fields: adjunct, required: ['name', 'amount', 'unit', 'step'], array: true },
  recipeSteps: { fields: recipeStep, required: ['step', 'tempC', 'durationMin'], array: true },
  fermentables: { fields: grain, required: ['name', 'weightKg', 'kind', 'use'], array: true },
  hops: { fields: hop, required: ['name', 'weightG', 'alpha', 'stage'], array: true },
  yeast: { fields: yeast, required: ['name', 'form', 'qty', 'unit'] },
  mash: { fields: mashStep, required: ['name', 'tempC', 'durationMin'], array: true },
  fermentation: {
    fields: fermentationStep,
    required: ['kind', 'name', 'tempC', 'days'],
    array: true
  },
  reading: {
    fields: {
      kind: choice('Mesure', ['volume', 'densite', 'temperature', 'ph']),
      value: n('Valeur', -10, 1000),
      unit: choice('Unité', ['L', 'SG', '°C', 'pH']),
      stepId: t('ID étape'),
      at: n('Date Unix en millisecondes', 1, 9999999999999),
      roomTemp: { label: 'Échantillon refroidi confirmé par le brasseur', type: 'boolean' },
      note: t('Note', 500)
    },
    required: ['kind', 'value', 'unit']
  }
};
const own = (object: any, key: string) => Object.prototype.hasOwnProperty.call(object, key);
export const readField = (value: any, path: string): any =>
  path.split('.').reduce((v, k) => v?.[k], value) ?? null;
function put(value: any, path: string, next: any) {
  const keys = path.split('.');
  let node = value;
  keys.slice(0, -1).forEach((key, i) => {
    node[key] ??= /^\d+$/.test(keys[i + 1]) ? [] : {};
    node = node[key];
  });
  if (next === null) delete node[keys.at(-1)!];
  else node[keys.at(-1)!] = structuredClone(next);
}
const stable = (v: any): string =>
  JSON.stringify(v, (_, value) =>
    value && !Array.isArray(value) && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
      : value
  );

/** This closed list is shared by generation, preview and application. No arbitrary JSON patches. */
export function editableFields(
  c: BrewerContext,
  target: BrewerProposal['target']
): Record<string, Spec> {
  if (!c.editableTargets?.includes(target)) return {};
  const fields: Record<string, Spec> = {};
  const addRows = (root: string, rows: any[], shape: Record<string, Spec>) =>
    (rows ?? []).slice(0, 60).forEach((row, i) => {
      for (const [key, spec] of Object.entries(shape))
        fields[`${root}.${i}.${key}`] = {
          ...spec,
          label: `${row.name || `Ligne ${i + 1}`} · ${spec.label}`
        };
    });
  if (target === 'recipe' && c.recipe) {
    Object.assign(fields, {
      name: t('Nom de la recette'),
      style: t('Style'),
      volumeL: n('Volume cible', 1, 1000, 'L'),
      boilMin: n('Ébullition', 1, 480, 'min'),
      efficiencyPct: n('Rendement', 1, 100, '%'),
      instructions: t('Instructions', 8000),
      notesCreation: t('Notes de recette', 4000),
      notes: { label: 'Notes', list: t('Note', 2000) },
      ogTarget: n('Densité initiale cible', 1, 1.3, 'SG'),
      fgTarget: n('Densité finale cible', 0.98, 1.3, 'SG'),
      abvTarget: n('Alcool cible', 0, 30, '%'),
      ibuTarget: n('Amertume cible', 0, 300, 'IBU'),
      colorEbc: n('Couleur annoncée', 0, 500, 'EBC'),
      carboTarget: t('Carbonatation cible', 100),
      fermentables: { label: 'Fermentescibles', shape: 'fermentables' },
      hops: { label: 'Houblons', shape: 'hops' },
      adjuncts: { label: 'Autres ingrédients', shape: 'adjuncts' },
      steps: { label: 'Étapes complémentaires', shape: 'recipeSteps' },
      yeast: { label: 'Levure', shape: 'yeast' },
      'mash.steps': { label: 'Paliers d’empâtage', shape: 'mash' },
      fermentation: { label: 'Programme de fermentation', shape: 'fermentation' },
      'mash.mashoutTempC': n('Mashout', 65, 85, '°C'),
      'mash.mashoutDurationMin': n('Maintien mashout', 1, 60, 'min'),
      'mash.spargeTempC': n('Eau de rinçage', 20, 85, '°C'),
      'mash.spargeType': choice('Méthode de rinçage', ['batch', 'fly', 'none']),
      'mash.ratioLPerKg': n('Rapport eau / grain', 0.5, 12, 'L/kg'),
      'mash.heatingRateCPerMin': n('Vitesse de chauffe indicative', 0.01, 10, '°C/min'),
      'waterPlan.roLimitL': { ...n('Osmosée disponible · total', 0, 1000, 'L'), nullable: true },
      'waterPlan.autoTreatment': { label: 'Sels et acides suivent la recette', type: 'boolean' },
      'waterPlan.ratioOverride': { ...n('Rapport sulfate / chlorure', 0, 20), nullable: true },
      'waterPlan.sourceId': choice('Source d’eau', [
        ...new Set(
          [c.recipe.waterPlan?.sourceId, ...c.waterSources.map((s) => s.id)].filter(Boolean)
        )
      ]),
      'waterPlan.sourceSnapshot': { label: 'Analyse de l’eau', shape: 'source' },
      'waterPlan.targetProfileId': t('Profil d’eau'),
      'waterPlan.targetName': t('Nom du profil d’eau'),
      'waterPlan.targetIons': { label: 'Cible minérale', shape: 'ions', nullable: true },
      'waterPlan.mash': { label: 'Sels · empâtage', shape: 'salts' },
      'waterPlan.sparge': { label: 'Sels · rinçage', shape: 'salts' },
      'waterPlan.acid': { label: 'Acidification', shape: 'acid' },
      'waterPlan.acidOverride': {
        label: 'Doses d’acide manuelles',
        shape: 'acidOverride',
        nullable: true
      },
      'waterPlan.saltOverrides': {
        label: 'Doses de sels manuelles',
        shape: 'saltOverrides',
        nullable: true
      },
      'waterPlan.disabled': { label: 'Sels écartés', list: choice('Sel', Object.keys(salts)) },
      'waterPlan.allSaltsInMash': { label: 'Tous les sels à l’empâtage', type: 'boolean' },
      'waterPlan.mashWaterL': n('Eau d’empâtage', 1, 1000, 'L'),
      'waterPlan.spargeWaterL': n('Eau de rinçage', 0, 1000, 'L'),
      'waterPlan.diRatioPct': n('Osmosée à l’empâtage', 0, 100, '%'),
      'waterPlan.spargeDiRatioPct': { ...n('Osmosée au rinçage', 0, 100, '%'), nullable: true },
      'waterPlan.targetPh': n('pH cible à l’empâtage', 5, 5.8),
      'waterPlan.measuredPh': n('pH mesuré · empâtage', 0, 14),
      'waterPlan.measuredSpargePh': n('pH mesuré · rinçage', 0, 14)
    });
    addRows('fermentables', c.recipe.fermentables, grain);
    (c.recipe.fermentables ?? []).forEach(
      (_: unknown, i: number) => delete fields[`fermentables.${i}.pct`]
    );
    addRows('hops', c.recipe.hops, hop);
    addRows('mash.steps', c.recipe.mash?.steps, mashStep);
    addRows('fermentation', c.recipe.fermentation, fermentationStep);
    addRows('adjuncts', c.recipe.adjuncts, adjunct);
    addRows('steps', c.recipe.steps, recipeStep);
    for (const side of ['mash', 'sparge'])
      for (const [id, spec] of Object.entries(salts))
        fields[`waterPlan.${side}.${id}`] = {
          ...spec,
          label: `${spec.label} · ${side === 'mash' ? 'empâtage' : 'rinçage'}`
        };
    for (const [key, spec] of Object.entries(acid)) fields[`waterPlan.acid.${key}`] = spec;
    for (const [key, spec] of Object.entries(yeast))
      fields[`yeast.${key}`] = { ...spec, label: `Levure · ${spec.label}` };
  }
  if (target === 'journal' && c.journal && !c.journal.finishedAt) {
    Object.assign(fields, {
      newReading: { label: 'Ajouter un relevé au journal', shape: 'reading' },
      boilDurationMin: n('Ébullition du jour', 1, 480, 'min'),
      coolingWaterC: n('Eau du refroidisseur', 0, 40, '°C'),
      boilOffLPerHour: n('Évaporation observée', 0, 30, 'L/h'),
      'waterMix.mash.roL': n(
        'Osmosée versée · empâtage',
        0,
        c.recipe?.waterPlan?.mashWaterL ?? 1000,
        'L'
      ),
      'waterMix.sparge.roL': n(
        'Osmosée versée · rinçage',
        0,
        c.recipe?.waterPlan?.spargeWaterL ?? 1000,
        'L'
      )
    });
    (c.journal.steps ?? []).forEach((step: any, i: number) => {
      if (step.doneAt || step.id?.startsWith('boil')) return;
      if (step.tempC != null)
        fields[`steps.${i}.tempC`] = n(`${step.label} · consigne`, 0, 100, '°C');
      if (step.durationMin > 0)
        fields[`steps.${i}.durationMin`] = n(`${step.label} · maintien`, 1, 480, 'min');
    });
    (c.recipe?.hops ?? []).forEach((h: any, i: number) => {
      if (h.stage === 'boil' && !c.journal.additions?.[`hop-${i}`]?.doneAt)
        fields[`hopElapsedMin.hop-${i}`] = n(`${h.name} · ajout depuis le début`, 0, 480, 'min');
    });
  }
  if (target === 'batch' && c.batch)
    Object.assign(fields, {
      volumeBrewedL: n('Volume récolté mesuré', 0, 1000, 'L'),
      og: { label: 'Densité initiale mesurée', shape: 'sg' },
      fg: { label: 'Densité finale mesurée', shape: 'sg' },
      mashPhActual: n('pH mesuré à l’empâtage', 0, 14),
      notesBrewDay: t('Notes de brassage', 6000),
      notesTasting: t('Notes de dégustation', 6000),
      notesCreation: t('Notes du lot', 6000)
    });
  return fields;
}
function checked(value: any, spec: Spec, optional = true): any {
  if (value === null && (optional || spec.nullable)) return null;
  if (spec.type === 'boolean') {
    if (typeof value !== 'boolean') throw Error(`${spec.label} invalide.`);
    return value;
  }
  if (spec.list) {
    if (!Array.isArray(value) || value.length > 60) throw Error('Liste invalide.');
    value.forEach((v) => checked(v, spec.list!, false));
    return value;
  }
  if (spec.shape === 'reading') {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some(
        (k) => !['kind', 'value', 'unit', 'stepId', 'at', 'roomTemp', 'note'].includes(k)
      )
    )
      throw Error('Relevé invalide.');
    const bands: Record<string, [number, number, string]> = {
      temperature: [-10, 110, '°C'],
      volume: [0, 1000, 'L'],
      ph: [0, 14, 'pH'],
      densite: [0.98, 1.3, 'SG']
    };
    const band = bands[value.kind];
    if (
      !band ||
      typeof value.value !== 'number' ||
      !Number.isFinite(value.value) ||
      value.value < band[0] ||
      value.value > band[1] ||
      value.unit !== band[2]
    )
      throw Error('Valeur ou unité du relevé invalide.');
    if (value.at != null && (!Number.isSafeInteger(value.at) || value.at <= 0))
      throw Error('Date du relevé invalide.');
    if (value.roomTemp != null && typeof value.roomTemp !== 'boolean')
      throw Error('Échantillon invalide.');
    if (value.note != null && (typeof value.note !== 'string' || value.note.length > 500))
      throw Error('Note du relevé invalide.');
    return value;
  }
  if (spec.shape === 'sg') {
    const num = typeof value === 'string' && /^1\.\d{3}$/.test(value) ? Number(value) : NaN;
    if (!Number.isFinite(num) || num < 1 || num > 1.3)
      throw Error('Densité requise au format 1.050.');
    return value;
  }
  if (spec.shape) {
    const schema = proposalValueSchemas[spec.shape];
    const rows = schema.array ? value : [value];
    if (!Array.isArray(rows) || rows.length > 60) throw Error('Liste limitée à 60 lignes.');
    for (const row of rows) {
      if (
        !row ||
        typeof row !== 'object' ||
        Array.isArray(row) ||
        schema.required.some((k) => row[k] == null)
      )
        throw Error('Ligne incomplète.');
      for (const [key, v] of Object.entries(row)) {
        if (!own(schema.fields, key)) throw Error(`Champ non autorisé : ${key}`);
        checked(v, schema.fields[key], !schema.required.includes(key));
      }
    }
    return value;
  }
  if (spec.min != null) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < spec.min ||
      value > spec.max!
    )
      throw Error(`${spec.label} hors limites.`);
  } else if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > (spec.text ?? 200) ||
    (spec.values && !spec.values.includes(value))
  )
    throw Error(`${spec.label} invalide.`);
  return value;
}
export function proposalBasis(c: BrewerContext, target: BrewerProposal['target']): string {
  // Targets, ingredients and current process state affect calculations, even if only one field changes.
  const doc =
    target === 'recipe'
      ? c.recipe
      : target === 'journal'
        ? { recipe: c.recipe, journal: c.journal }
        : c.batch;
  return stable(doc);
}
export function prepareProposal(c: BrewerContext, args: any): BrewerProposal {
  const target = args.target as BrewerProposal['target'];
  const fields = editableFields(c, target);
  if (
    !Object.keys(fields).length ||
    !Array.isArray(args.changes) ||
    !args.changes.length ||
    args.changes.length > 20
  )
    throw Error('Modification indisponible ou liste invalide.');
  if (typeof args.title !== 'string' || !args.title.trim() || args.title.length > 160)
    throw Error('Titre de modification invalide.');
  const paths = args.changes.map((x: any) => x.path);
  if (
    paths.some(
      (p: any, i: number) =>
        typeof p !== 'string' ||
        !own(fields, p) ||
        paths.some(
          (other: string, j: number) =>
            i !== j && (other === p || (typeof other === 'string' && other.startsWith(p + '.')))
        )
    )
  )
    throw Error('Champs inconnus, doublonnés ou imbriqués.');
  let changes: BrewerFieldChange[] = args.changes
    .map((change: any, i: number) => {
      const spec = fields[change.path];
      if (
        typeof change.valueJson !== 'string' ||
        change.valueJson.length > 10000 ||
        typeof change.reason !== 'string' ||
        change.reason.length > 500
      )
        throw Error('Valeur ou explication invalide.');
      const value = checked(JSON.parse(change.valueJson), spec, false);
      if (change.path === 'newReading') {
        value.at ??= c.now;
        value.stepId ??= c.journal?.steps?.[c.journal.currentIndex]?.id;
        if (
          !c.journal?.steps?.some((s: any) => s.id === value.stepId) ||
          value.at > c.now ||
          value.at < c.now - 7 * 86400000
        )
          throw Error('Étape ou date de mesure invalide.');
      }
      return {
        id: `C${i + 1}`,
        path: change.path,
        label:
          change.path === 'newReading'
            ? `${spec.label} · ${c.journal.steps.find((s: any) => s.id === value.stepId)?.label}`
            : spec.label,
        before: readField(c[target], change.path),
        value,
        reason: change.reason,
        ...(spec.unit ? { unit: spec.unit } : {})
      };
    })
    .filter((ch: BrewerFieldChange) => !sameField(ch.before, ch.value));
  if (target === 'recipe' && changes.some((ch) => waterRelatedPath(ch.path))) {
    const raw = structuredClone(c.recipe);
    changes.forEach((ch) => put(raw, ch.path, ch.value));
    const next = reconcileRecipeWater(
      raw,
      changes.map((ch) => ch.path),
      c.waterSources
    );
    const roots = [
      'waterPlan.roLimitL',
      'waterPlan.diRatioPct',
      'waterPlan.spargeDiRatioPct',
      'waterPlan.mashWaterL',
      'waterPlan.spargeWaterL',
      'waterPlan.autoTreatment',
      'waterPlan.sourceSnapshot',
      'waterPlan.mash',
      'waterPlan.sparge',
      'waterPlan.acid',
      'waterPlan.acidOverride',
      'waterPlan.saltOverrides'
    ];
    for (const path of roots) {
      const before = readField(c.recipe, path),
        value = readField(next, path);
      const explicit = changes.filter((ch) => ch.path === path || ch.path.startsWith(path + '.'));
      if (sameField(before, value) && !explicit.length) continue;
      changes = changes.filter((ch) => !explicit.includes(ch));
      if (!sameField(before, value))
        changes.push({
          id: '',
          path,
          before,
          value,
          label: fields[path].label,
          ...(fields[path].unit ? { unit: fields[path].unit } : {}),
          reason:
            explicit.map((ch) => ch.reason).join(' ; ') || 'Recalcul lié à l’eau et à la recette.'
        });
    }
    // A water constraint and its doses are one decision, including the inputs that caused them.
    if (changes.some((ch) => ch.path.startsWith('waterPlan.'))) {
      changes.forEach((ch) => {
        if (waterRelatedPath(ch.path)) ch.group = 'water';
      });
    }
    changes.forEach((ch, i) => {
      ch.id = `C${i + 1}`;
    });
  }
  if (!changes.length) throw Error('Ces champs ont déjà les valeurs proposées.');
  for (const change of changes) {
    if (change.path === 'waterPlan.acid') {
      const id = change.value?.id as 'lactique' | 'phosphorique' | 'maltAcidule';
      const product = {
        lactique: 'Acide lactique 80 %',
        phosphorique: 'Acide phosphorique 75 %',
        maltAcidule: 'Malt acidulé'
      }[id];
      if (product) {
        change.label = `Acidification · ${product}`;
        change.unit = id === 'maltAcidule' ? 'g' : 'mL';
      }
    }
  }
  if (changes.length > 64) throw Error('Trop de champs liés dans cette proposition.');
  const proposal: BrewerProposal = {
    target,
    title: args.title,
    changes,
    basis: proposalBasis(c, target)
  };
  applyProposal(
    c,
    proposal,
    changes.map((ch) => ch.id)
  );
  return proposal;
}
export function applyProposal(c: BrewerContext, proposal: BrewerProposal, ids: string[]) {
  if (
    proposal.status ||
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !proposal.changes.some((ch) => ch.id === id))
  )
    throw Error('Sélection de modifications invalide.');
  if (proposalBasis(c, proposal.target) !== proposal.basis)
    throw Error('Les champs ont changé depuis ce conseil. Demande une proposition actualisée.');
  const fields = editableFields(c, proposal.target),
    next = structuredClone(c[proposal.target]);
  for (const ch of proposal.changes.filter((ch) => ch.group && ids.includes(ch.id))) {
    if (proposal.changes.some((other) => other.group === ch.group && !ids.includes(other.id)))
      throw Error('L’eau, ses doses et les paramètres liés doivent être validés ensemble.');
  }
  for (const change of proposal.changes.filter((ch) => ids.includes(ch.id))) {
    if (!own(fields, change.path) || !sameField(readField(next, change.path), change.before))
      throw Error('La proposition ne correspond plus à ce formulaire.');
    put(next, change.path, checked(change.value, fields[change.path], false));
  }
  if (proposal.target === 'recipe') {
    const y = next.yeast;
    if (y?.fermTempMinC != null && y?.fermTempMaxC != null && y.fermTempMinC > y.fermTempMaxC)
      throw Error('La température minimum dépasse la température maximum.');
    if (next.hops?.some((h: any) => h.stage === 'boil' && h.timeMin > (next.boilMin ?? 60)))
      throw Error('Un houblon dépasse la durée d’ébullition. Sélectionne aussi son ajustement.');
    next.totalGristKg = (next.fermentables ?? [])
      .filter((f: any) => f.kind === 'grain')
      .reduce((sum: number, f: any) => sum + f.weightKg, 0);
    const p = next.waterPlan;
    if (p?.acid && (p.acid.id == null || p.acid.mash == null || p.acid.sparge == null))
      throw Error('Acidifiant et doses des deux eaux requis ensemble.');
    if (
      p &&
      (p.spargeWaterL === 0 || p.allSaltsInMash === true) &&
      Object.values(p.sparge ?? {}).some((v) => Number(v) > 0)
    )
      throw Error('Des sels sont prévus au rinçage : adapte aussi leur répartition.');
    return refreshCompanionRecipe(next);
  }
  if (proposal.target === 'journal') {
    const duration = next.boilDurationMin ?? c.recipe?.boilMin ?? 60;
    if (
      Object.entries(next.hopElapsedMin ?? {}).some(
        ([id, v]) => !next.additions?.[id]?.doneAt && Number(v) > duration
      )
    )
      throw Error('Un ajout de houblon dépasse l’ébullition. Sélectionne aussi son ajustement.');
    if (next.newReading) {
      next.readings = [...(next.readings ?? []), next.newReading];
      delete next.newReading;
    }
  }
  return next;
}
export const proposalTool = {
  name: 'propose_changes',
  description:
    'Préparer des changements de champs à montrer au brasseur. AUCUNE écriture : il doit sélectionner puis valider. Utilise les chemins de editableFields et proposalValueSchemas. Pour compléter seulement un champ vide, garde toute valeur déjà saisie. Pour ajouter/remplacer une ligne entière, utilise la liste complète. Les quantités, mesures ou spécifications doivent avoir une preuve. Lis le preview calculé puis rappelle cet outil avec la liste COMPLÈTE des changements si une correction est nécessaire : la dernière proposition réussie remplace la précédente. Une seule version finale par réponse.',
  parameters: {
    type: 'OBJECT',
    properties: {
      target: { type: 'STRING', enum: ['recipe', 'journal', 'batch'] },
      title: { type: 'STRING' },
      changes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            path: { type: 'STRING' },
            valueJson: {
              type: 'STRING',
              description: 'Valeur JSON encodée, ex 70 ou "SafAle US-05" ou une liste complète.'
            },
            reason: { type: 'STRING' }
          },
          required: ['path', 'valueJson', 'reason']
        }
      }
    },
    required: ['target', 'title', 'changes']
  }
};
