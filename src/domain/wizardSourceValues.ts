import type { WaterIons, WaterPlan, WaterSource, YeastSpec } from '../types';

/**
 * Source values the Wizard reads back on a save. Each rule keeps an author's value, a calculated estimate and a
 * documentary fact in their own role; none of them fills a missing value or borrows another source.
 */

type YeastTargetRole = 'recipe' | 'identity' | 'hypothesis' | 'documentary';

/**
 * How a yeast field bears on the FG/ABV targets stated for a recipe.
 * - recipe: what is pitched; any change makes the stated targets stale. The display name is the one exception: under
 *   the same stable owner (stock lot, else catalogue identity) a new name is a documentary rename, as in selectYeast.
 * - identity: a reference that may be resolved later; filling it in keeps the targets, replacing or removing it does not.
 * - hypothesis: the recipe's own attenuation hypothesis (a manufacturer's declared figure is documentary).
 * - documentary: sourced knowledge about the product; it refines the estimate, never the author's target.
 * Exhaustive on purpose: a new YeastSpec field must be classified here before the Wizard compiles.
 */
const YEAST_TARGET_ROLES: Record<keyof YeastSpec, YeastTargetRole> = {
  name: 'recipe', qty: 'recipe', unit: 'recipe', pitching: 'recipe', pitchTempC: 'recipe',
  stockItemRef: 'identity', hopIndexId: 'identity', strain: 'identity', form: 'identity',
  attenuationPct: 'hypothesis', attenuationBasis: 'hypothesis',
  lab: 'documentary', technicalSource: 'documentary', technicalFacts: 'documentary', technicalSelections: 'documentary',
  documentaryNotes: 'documentary', adoptedDocumentary: 'documentary', localDocumentary: 'documentary',
  fermentationFacts: 'documentary', fermTempMinC: 'documentary', fermTempMaxC: 'documentary',
  flocculation: 'documentary', alcoholTolerancePct: 'documentary', fermentDays: 'documentary', notes: 'documentary'
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** A declared attenuation is the manufacturer's figure; only a recipe, measured or legacy value is the recipe's hypothesis. */
function attenuationHypothesis(yeast: Partial<YeastSpec>) {
  return yeast.attenuationBasis === 'declared' || yeast.attenuationPct == null ? null
    : [yeast.attenuationPct, yeast.attenuationBasis ?? null];
}

/**
 * Pour la source d'une preuve froide, la levure compte par ce qui est ensemencé (name, qty, unit, pitching, pitchTempC) et par
 * l'hypothèse d'atténuation propre à la recette (attenuationPct + attenuationBasis, sauf basis `declared`). Identité de catalogue,
 * lot de stock et faits documentaires sont des lectures qui affinent, pas une modification de la recette (décision n°22).
 * Unlike sameYeastForTargets, identity fields are excluded: a fingerprint cannot tell "filled in later" from "replaced", and a
 * real replacement changes the pitched name, which is kept.
 */
export function pitchedYeastSource(yeast: YeastSpec): Partial<YeastSpec> {
  const source: Partial<YeastSpec> = {};
  for (const [field, role] of Object.entries(YEAST_TARGET_ROLES) as Array<[keyof YeastSpec, YeastTargetRole]>) {
    if (role === 'recipe' && yeast[field] !== undefined) Object.assign(source, { [field]: yeast[field] });
  }
  if (attenuationHypothesis(yeast)) Object.assign(source, { attenuationPct: yeast.attenuationPct,
    ...(yeast.attenuationBasis !== undefined ? { attenuationBasis: yeast.attenuationBasis } : {}) });
  return source;
}

/** The owner of a yeast choice, as the Wizard scopes documentary edits: the stock lot when linked, else the catalogue identity. */
function stableOwner(yeast: Partial<YeastSpec>): string | undefined {
  return yeast.stockItemRef ? `stock:${yeast.stockItemRef}` : yeast.hopIndexId ? `catalogue:${yeast.hopIndexId}` : undefined;
}

/**
 * True while `current` is still the yeast the stated FG/ABV targets were written for. `basis` is the yeast kept in
 * the Wizard's target basis (parsed JSON, possibly from an older draft); an unreadable basis counts as a change.
 * Without the same stable owner on both sides, a new name remains a change of yeast.
 */
export function sameYeastForTargets(basis: unknown, current: YeastSpec): boolean {
  if (!basis || typeof basis !== 'object' || Array.isArray(basis)) return false;
  const before = basis as Partial<YeastSpec>;
  const owner = stableOwner(before);
  const renamedUnderOwner = owner !== undefined && owner === stableOwner(current);
  for (const [field, role] of Object.entries(YEAST_TARGET_ROLES) as Array<[keyof YeastSpec, YeastTargetRole]>) {
    if (field === 'name' && renamedUnderOwner) continue;
    if (role === 'recipe' && !same(before[field], current[field])) return false;
    if (role === 'identity' && before[field] != null && !same(before[field], current[field])) return false;
  }
  return same(attenuationHypothesis(before), attenuationHypothesis(current));
}

/**
 * Mode of the water profile: `style` follows the beer style, `choice` keeps a known choice, `legacy` keeps a profile
 * whose provenance was never recorded. Only an absent profile or a recorded origin follows the style; a code or a
 * numeric target without origin (older plans, imported codes) is kept, whatever its value.
 */
export type WaterProfileMode = 'style' | 'choice' | 'legacy';

export function waterProfileModeOf(
  plan: Pick<Partial<WaterPlan>, 'targetProfileId' | 'targetIons' | 'targetProfileOrigin'> | undefined
): WaterProfileMode {
  const origin = plan?.targetProfileOrigin;
  if (plan?.targetIons) return origin === 'choice' ? 'choice' : 'legacy';
  if (!plan?.targetProfileId) return 'style';
  return origin === 'style' || origin === 'choice' ? origin : 'legacy';
}

/** What a saved plan records: the known mode, nothing when the source left it unknown. */
export function waterProfileOrigin(mode: WaterProfileMode): WaterPlan['targetProfileOrigin'] {
  return mode === 'legacy' ? undefined : mode;
}

/*
 * A water reference has three states: omitted (legacy plan, no identity), declared and blank (empty or
 * whitespace-only: names no analysis), declared and non-blank (an exact identity, found or not). A declared value is
 * kept exactly as given; it is never trimmed, emptied, nor replaced by the seed, the active or the built-in source.
 * An omitted reference stays omitted when the plan's own legacy snapshot has no usable identity.
 */

/** The reference a plan declares, or undefined when it omits one. */
export function declaredWaterSourceId(plan: Pick<Partial<WaterPlan>, 'sourceId'> | undefined): string | undefined {
  return typeof plan?.sourceId === 'string' ? plan.sourceId : undefined;
}

/** A blank identifier is present but designates no analysis; nothing resolves it. */
export function isBlankWaterSourceId(id: string): boolean {
  return !id.trim();
}

/**
 * The analysis a plan freezes for its own reference. A snapshot resolves only the identity it names; beside a blank
 * or different reference it is not the recipe's analysis. A plan that omits its reference (legacy) keeps its snapshot.
 */
export function frozenWaterSource(plan: Pick<Partial<WaterPlan>, 'sourceId' | 'sourceSnapshot'> | undefined): WaterSource | undefined {
  const snapshot = plan?.sourceSnapshot;
  const id = declaredWaterSourceId(plan);
  if (!snapshot || id === undefined) return snapshot;
  return !isBlankWaterSourceId(id) && snapshot.id === id ? snapshot : undefined;
}

/**
 * Whether an analysis carries an identity a reference can name. A legacy snapshot whose own id is missing, empty or
 * whitespace-only is still the recipe's analysis, but anonymous: saving it must not turn that blank into a declared
 * reference, which would make the same snapshot inadmissible on the next reading.
 */
export function hasUsableWaterIdentity(source: Pick<WaterSource, 'id'> | undefined): boolean {
  return typeof source?.id === 'string' && !isBlankWaterSourceId(source.id);
}

/** Calculated water belongs to a reference that can name an analysis, with no other analysis frozen beside it. */
export function waterCacheBelongsToReference(plan: Pick<Partial<WaterPlan>, 'sourceId' | 'sourceSnapshot'> | undefined): boolean {
  const id = declaredWaterSourceId(plan);
  return id !== undefined && !isBlankWaterSourceId(id) && (!plan.sourceSnapshot || plan.sourceSnapshot.id === id);
}

/**
 * Partial import of a water plan. Omitted fields keep the previous plan; a declared reference that differs drops the
 * previous analysis and what was calculated from it, which belong to the previous reference only.
 */
export function mergeImportedWaterPlan(previous: Partial<WaterPlan> | undefined, imported: Partial<WaterPlan>): Partial<WaterPlan> {
  const id = declaredWaterSourceId(imported);
  if (!previous || id === undefined || id === previous.sourceId) return { ...previous, ...imported };
  const { sourceSnapshot: _snapshot, startIons: _start, wortIons: _wort, ...decisions } = previous;
  return { ...decisions, ...imported };
}

/**
 * Admission of the analysis a partial import brings while omitting its reference. Omitting `sourceId` neither removes
 * nor replaces what the recipe holds, so the snapshot is:
 * - `update` when it carries exactly the usable identity the recipe holds (documentary update of that analysis);
 * - `new` when the recipe holds neither a reference nor an analysis (nothing is replaced);
 * - `kept` otherwise (blank or missing id, another id): it is not attributed to the held source, which stays as is.
 * `none` when nothing is to decide (complete imports, a declared reference, no snapshot): existing rules apply.
 */
export type ImportedWaterSnapshotAdmission = 'none' | 'new' | 'update' | 'kept';

export function admitImportedWaterSnapshot(heldReference: string | undefined, heldAnalysis: WaterSource | undefined,
  imported: Pick<Partial<WaterPlan>, 'sourceId' | 'sourceSnapshot'> | undefined): ImportedWaterSnapshotAdmission {
  const snapshot = imported?.sourceSnapshot;
  if (!snapshot || declaredWaterSourceId(imported) !== undefined) return 'none';
  if (heldReference === undefined && !heldAnalysis) return 'new';
  const identity = heldReference !== undefined ? heldReference : heldAnalysis?.id;
  return hasUsableWaterIdentity({ id: identity }) && snapshot.id === identity ? 'update' : 'kept';
}

/** The imported water plan without an analysis that was not admitted, nor the values calculated from it. */
export function withoutImportedAnalysis(imported: Partial<WaterPlan>): Partial<WaterPlan> {
  const { sourceSnapshot: _snapshot, startIons: _start, wortIons: _wort, ...decisions } = imported;
  return decisions;
}

export type WaterTreatmentInputs = Pick<WaterPlan, 'diRatioPct' | 'spargeDiRatioPct' | 'mashWaterL' | 'spargeWaterL' | 'mash' | 'sparge' | 'acid'>;
export interface RetainedWaterCache { treatmentVersion?: 2; startIons?: WaterIons; wortIons?: WaterIons }

/** Doses compare by salt, whatever their key order; a zero dose is no addition. */
const doses = (value: Partial<Record<string, number>> | undefined) => JSON.stringify(
  Object.entries(value ?? {}).filter(([, grams]) => grams !== 0 && grams != null).sort(([a], [b]) => a.localeCompare(b)));
const sameAcid = (a: WaterPlan['acid'], b: WaterPlan['acid']) =>
  (a?.id ?? null) === (b?.id ?? null) && (a?.mash ?? null) === (b?.mash ?? null) && (a?.sparge ?? null) === (b?.sparge ?? null);

/**
 * The calculated water of a plan whose analysis is neither frozen nor found. It is never recalculated from another
 * source: each cached value is kept, with the treatment version it was written under, only while its own inputs are
 * unchanged; otherwise it is unknown (absent).
 */
export function retainedWaterCache(source: Partial<WaterPlan> | undefined, next: WaterTreatmentInputs): RetainedWaterCache {
  const dilution = !!source && source.diRatioPct === next.diRatioPct && source.spargeDiRatioPct === next.spargeDiRatioPct &&
    source.mashWaterL === next.mashWaterL && source.spargeWaterL === next.spargeWaterL;
  const startIons = dilution ? source.startIons : undefined;
  const wortIons = dilution && doses(source.mash) === doses(next.mash) && doses(source.sparge) === doses(next.sparge) &&
    sameAcid(source.acid, next.acid) ? source.wortIons : undefined;
  return startIons || wortIons ? { treatmentVersion: source.treatmentVersion, startIons, wortIons } : { treatmentVersion: 2 };
}
