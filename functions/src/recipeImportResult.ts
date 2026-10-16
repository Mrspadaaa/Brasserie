/**
 * Validation serveur des nombres d'un import de recette lu par Gemini.
 *
 * Banc réel #91 : en 3.8 `medium`, un houblon est revenu avec `timeMin: 6e-323`.
 * Le schéma garantit un nombre, pas une valeur possible. Règle :
 *
 *   1. un nombre non fini est écarté ;
 *   2. un nombre non nul de magnitude inférieure à 1e-6 est écarté : aucune
 *      dose, durée ou mesure de brassage n'est si petite, c'est un résidu
 *      (dénormal) et non une valeur lue ;
 *   3. un nombre hors des bornes métier de son champ est écarté (`BOUNDS`) ;
 *      sans borne propre, un nombre doit être positif ou nul et inférieur à un
 *      million. Seules les températures de fermentation et de garde peuvent
 *      descendre sous zéro (garde à froid à -1 °C).
 *
 * Une valeur écartée devient absente, jamais zéro : le brasseur la complète.
 * Chaque retrait est dit en français dans `importWarnings`, que la feuille
 * d'import affiche avec ses autres avertissements.
 */

type Bounds = readonly [min: number, max: number];

const VOLUME: Bounds = [0, 10_000];   // L
const HOT: Bounds = [0, 105];         // °C, de l'empâtage à l'ébullition
const COLD: Bounds = [-5, 45];        // °C, fermentation et garde
const PCT: Bounds = [0, 100];
const ION: Bounds = [0, 2_000];       // ppm
const DOSE: Bounds = [0, 10_000];     // g ou mL réellement ajoutés
const PH: Bounds = [0, 14];
const DAYS: Bounds = [0, 730];
const MINUTES: Bounds = [0, 1_440];
const OTHER: Bounds = [0, 1_000_000];

/** Bornes par chemin du schéma `importRecipe` (`[]` pour un élément de tableau, `*` pour tous les champs d'un objet). */
export const RECIPE_IMPORT_BOUNDS: Readonly<Record<string, Bounds>> = {
  volumeL: [0.1, 10_000], efficiencyPct: [1, 100], boilMin: [0, 600],
  ogTarget: [0.98, 1.2], fgTarget: [0.98, 1.2], abvTarget: [0, 25], ibuTarget: [0, 250], colorEbc: [0, 600],
  mashWaterL: VOLUME, spargeWaterL: VOLUME, preBoilL: VOLUME, carboVolumes: [0, 6],
  'fermentables[].weightKg': [0, 10_000], 'fermentables[].fermentabilityPct': PCT, 'fermentables[].dayOffset': [0, 365],
  'fermentables[].colorEbc': [0, 4_000], 'fermentables[].potentialPpg': [0, 50],
  'hops[].alpha': [0, 70], 'hops[].weightG': [0, 100_000], 'hops[].timeMin': [0, 600], 'hops[].tempC': HOT, 'hops[].dayOffset': [0, 365],
  'yeast.qty': [0, 100_000], 'yeast.pitchTempC': COLD, 'yeast.fermTempMinC': COLD, 'yeast.fermTempMaxC': COLD,
  'yeast.attenuationPct': PCT, 'yeast.alcoholTolerancePct': [0, 25], 'yeast.fermentDays': DAYS,
  'mashSteps[].tempC': HOT, 'mashSteps[].durationMin': MINUTES,
  'mash.steps[].tempC': HOT, 'mash.steps[].durationMin': MINUTES, 'mash.ratioLPerKg': [0, 20], 'mash.mashoutTempC': HOT, 'mash.spargeTempC': HOT,
  'fermentation[].tempC': COLD, 'fermentation[].days': DAYS,
  'steps[].tempC': [-5, 105], 'steps[].durationMin': [0, 1_051_200],
  'waterPlan.sourceSnapshot.ph': PH, 'waterPlan.sourceSnapshot.*': ION, 'waterPlan.targetIons.*': ION,
  'waterPlan.diRatioPct': PCT, 'waterPlan.spargeDiRatioPct': PCT, 'waterPlan.mashWaterL': VOLUME, 'waterPlan.spargeWaterL': VOLUME,
  'waterPlan.mash.*': DOSE, 'waterPlan.sparge.*': DOSE, 'waterPlan.acid.*': DOSE, 'waterPlan.acidOverride.*': DOSE,
  'waterPlan.targetPh': PH, 'waterPlan.measuredPh': PH, 'waterPlan.measuredSpargePh': PH,
  'waterTarget.*': ION
};

/** An own entry only: a key from the model such as « constructor » must never reach `Object.prototype`. */
function own<T>(table: Readonly<Record<string, T>>, key: string | undefined): T | undefined {
  return key !== undefined && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

function boundsFor(pattern: string): Bounds {
  return own(RECIPE_IMPORT_BOUNDS, pattern) ?? own(RECIPE_IMPORT_BOUNDS, pattern.replace(/\.[^.]+$/, '.*')) ?? OTHER;
}

/** The rule above: not finite, a non-zero residue under 1e-6, or outside the bounds of its field. */
function impossible(value: number, pattern: string): boolean {
  if (!Number.isFinite(value) || (value !== 0 && Math.abs(value) < 1e-6)) return true;
  const [min, max] = boundsFor(pattern);
  return value < min || value > max;
}

/*
 * L'avertissement parle au brasseur (V3 REV-D100, m9) : « Fuggle : durée d'ajout
 * impossible, valeur écartée. À compléter. » Ni clé du schéma, ni chemin, ni
 * nombre en notation scientifique. « valeur écartée » s'accorde quel que soit
 * le champ ; des espaces insécables gardent « : » sur la ligne du nom et « À compléter » d'un bloc (V2 Chrome, 390 px).
 */

const IONS: Readonly<Record<string, string>> = { ca: 'calcium', mg: 'magnésium', na: 'sodium', so4: 'sulfate', cl: 'chlorure', hco3: 'alcalinité' };
/** Same names as the water workshop (`src/domain/water/substances.ts`). */
const SALTS: Readonly<Record<string, string>> = {
  gypse: 'gypse', cacl2: 'chlorure de calcium', epsom: 'sel d’Epsom', mgcl2: 'chlorure de magnésium', nacl: 'sel de table',
  nahco3: 'bicarbonate de soude', caco3: 'craie', chaux: 'chaux éteinte', kcl: 'chlorure de potassium'
};
const SIDES: Readonly<Record<string, string>> = { mash: 'à l’empâtage', sparge: 'au rinçage' };

/** Libellé de brasseur par chemin du schéma, même notation que `RECIPE_IMPORT_BOUNDS` ; ions, sels et acides plus bas. */
const FIELD_LABELS: Readonly<Record<string, string>> = {
  volumeL: 'volume du brassin', efficiencyPct: 'rendement', boilMin: 'durée d’ébullition',
  ogTarget: 'densité initiale', fgTarget: 'densité finale', abvTarget: 'degré d’alcool', ibuTarget: 'amertume (IBU)', colorEbc: 'couleur (EBC)',
  mashWaterL: 'eau d’empâtage', spargeWaterL: 'eau de rinçage', preBoilL: 'volume avant ébullition', carboVolumes: 'carbonatation',
  'fermentables[].weightKg': 'quantité', 'fermentables[].fermentabilityPct': 'part fermentescible', 'fermentables[].dayOffset': 'jour d’ajout',
  'fermentables[].colorEbc': 'couleur (EBC)', 'fermentables[].potentialPpg': 'potentiel d’extrait',
  'hops[].alpha': 'acide alpha', 'hops[].weightG': 'quantité', 'hops[].timeMin': 'durée d’ajout', 'hops[].tempC': 'température',
  'hops[].dayOffset': 'jour d’ajout', 'adjuncts[].amount': 'quantité',
  'yeast.qty': 'quantité', 'yeast.pitchTempC': 'température d’ensemencement', 'yeast.fermTempMinC': 'température minimale',
  'yeast.fermTempMaxC': 'température maximale', 'yeast.attenuationPct': 'atténuation', 'yeast.alcoholTolerancePct': 'tolérance à l’alcool',
  'yeast.fermentDays': 'durée de fermentation', 'yeast.technicalFacts[].range.min': 'plage de la fiche technique',
  'yeast.technicalFacts[].range.max': 'plage de la fiche technique',
  'mashSteps[].tempC': 'température', 'mashSteps[].durationMin': 'durée', 'mash.steps[].tempC': 'température', 'mash.steps[].durationMin': 'durée',
  'mash.ratioLPerKg': 'ratio d’empâtage', 'mash.mashoutTempC': 'température de mash-out', 'mash.spargeTempC': 'température de rinçage',
  'fermentation[].tempC': 'température', 'fermentation[].days': 'durée', 'steps[].tempC': 'température', 'steps[].durationMin': 'durée',
  'waterPlan.sourceSnapshot.ph': 'pH de l’eau de départ', 'waterPlan.diRatioPct': 'part d’eau déminéralisée',
  'waterPlan.spargeDiRatioPct': 'part d’eau déminéralisée au rinçage', 'waterPlan.mashWaterL': 'eau d’empâtage',
  'waterPlan.spargeWaterL': 'eau de rinçage', 'waterPlan.targetPh': 'pH visé', 'waterPlan.measuredPh': 'pH mesuré',
  'waterPlan.measuredSpargePh': 'pH mesuré au rinçage'
};

/** Section of a line without a name of its own (« Houblon 2 »), or of a group of fields (« Eau »). */
const SECTIONS: Readonly<Record<string, string>> = {
  hops: 'Houblon', fermentables: 'Fermentescible', adjuncts: 'Ajout', yeast: 'Levure', mashSteps: 'Palier', mash: 'Empâtage',
  'mash.steps': 'Palier', fermentation: 'Étape de fermentation', steps: 'Étape du déroulé', waterPlan: 'Eau', waterTarget: 'Eau'
};

/** The brewer's name of a numeric field of the import schema, or undefined for a field without one. */
export function recipeImportFieldLabel(pattern: string): string | undefined {
  const exact = own(FIELD_LABELS, pattern);
  if (exact) return exact;
  const [, group, key] = /^(.*)\.([^.]+)$/.exec(pattern) ?? [];
  const ion = own(IONS, key), salt = own(SALTS, key), side = own(SIDES, key);
  if (group === 'waterPlan.sourceSnapshot' && ion) return `${ion} de l’eau de départ`;
  if ((group === 'waterPlan.targetIons' || group === 'waterTarget') && ion) return `${ion} cible`;
  if (group === 'waterPlan.mash' && salt) return `${salt} ${SIDES.mash}`;
  if (group === 'waterPlan.sparge' && salt) return `${salt} ${SIDES.sparge}`;
  if ((group === 'waterPlan.acid' || group === 'waterPlan.acidOverride') && side) return `acide ${side}`;
  return undefined;
}

function clean(node: unknown, pattern: string, who: string, warnings: string[]): unknown {
  if (Array.isArray(node)) {
    const row = own(SECTIONS, pattern);
    return node.map((item, index) => clean(item, `${pattern}[]`, row ? `${row} ${index + 1}` : who, warnings));
  }
  if (!node || typeof node !== 'object') return node;
  const record = node as Record<string, unknown>;
  // The recipe's own name tells the brewer nothing: its fields stay under « Recette ».
  const label = pattern && typeof record.name === 'string' && record.name.trim() ? record.name.trim() : who;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === '__proto__') continue; // not a schema field; assigning it would change the copy's prototype
    const childPattern = pattern ? `${pattern}.${key}` : key;
    if (typeof value === 'number' && impossible(value, childPattern)) {
      const field = recipeImportFieldLabel(childPattern);
      warnings.push(field
        ? `${label}\u00a0: ${field} impossible, valeur écartée. À\u00a0compléter.`
        : `${label}\u00a0: une valeur impossible a été écartée. À\u00a0compléter.`);
      continue;
    }
    out[key] = clean(value, childPattern, own(SECTIONS, childPattern) ?? label, warnings);
  }
  return out;
}

/** A copy of the import without impossible numbers; `importWarnings` lists each removal. */
export function sanitizeRecipeImport<T>(value: T): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const warnings: string[] = [];
  const result = clean(value, '', 'Recette', warnings) as Record<string, unknown>;
  delete result.importWarnings;
  return (warnings.length ? { ...result, importWarnings: warnings } : result) as T;
}
