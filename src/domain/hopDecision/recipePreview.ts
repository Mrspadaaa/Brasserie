import { hopDecisionReference, numericBounds, readHopAnalysis } from './measurements';
import { hopAlphaObservationReference, readHopAlphaChoiceDomainForAddition } from './modelInputs';
import { hopMeasurementError } from '../../../functions/src/hopIndexSchema';
import { analyzeHopProgram } from './programAnalysis';
import { applyHopProgramProposal, previewHopProgramChanges } from './programs';
import { buildHopRecipeDraft, hopRecipeFutureProcurementCondition, validateHopRecipeDraftOptions,
  type HopRecipeBinding, type HopRecipeDraftOptions, type HopRecipeDraftResult, type HopRecipeFutureProcurementChoice, type HopRecipeLike } from './recipeAdapter';
import type { HopMeasurement, HopRange, HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopAlphaModelParameter, HopDecisionMaterial, HopProgramAddition, HopProgramApplication, HopProgramProposal } from './types';

export interface HopRecipeAlphaChoice {
  value: number;
  /** Why this working percentage was chosen; it is not a new assay. */
  reason: string;
}

export interface HopRecipeFinalPreview<T extends HopRecipeLike> {
  status: 'ready';
  format: 'hop-recipe-final-preview-v1';
  recipeReference: string;
  bindingReference: string;
  sourceProposal: HopProgramProposal;
  /** Keyed by addition ID: two additions of the same lot can retain distinct working choices. */
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  /** Explicit local declaration, scoped to this exact future programme. Omitted for historical previews. */
  futureProcurement?: HopRecipeFutureProcurementChoice;
  /** Opt-in evidence from the exact alpha-choice domain used by this preview. Omitted from legacy previews. */
  alphaChoiceWitnesses?: HopRecipeAlphaChoiceWitness[];
  /** Human-readable conditions for this local copy; omitted when no declaration was made. */
  conditions?: string[];
  draft: Extract<HopRecipeDraftResult<T>, { status: 'ready' }>;
  programApplication: HopProgramApplication;
  analysis: ReturnType<typeof analyzeHopProgram>;
  /** Deterministic content reference for the complete displayed state, not an authorization token. */
  reference: string;
}

export interface HopRecipeAlphaChoiceWitness {
  additionId: string;
  material: { id: string; name: string; form: HopDecisionMaterial['form']; stockItemRef: string | null;
    lotId: string | null; lotReferenceOnly: boolean | null; lotVarietyId: string | null; varietyId: string | null };
  domain: {
    status: 'comparable' | 'unavailable' | 'rejected';
    bounds: HopRange | null;
    analyticalBasis: HopAlphaModelParameter['analyticalBasis'];
    unit: string | null;
    /** Physical provenance is asserted only when canonical analysis returns these exact observations. */
    scope: 'lot' | 'variety' | 'declaration' | 'unknown';
    scopeReason: string | null;
    sources: HopSource[];
    observations: HopMeasurement[];
    reason: string;
    /** Null means the exact domain helper rejected the input before returning a reading. */
    reading: ReturnType<typeof readHopAlphaChoiceDomainForAddition> | null;
  };
}

export interface HopRecipePreviewOptions { includeAlphaChoiceWitness?: boolean }

export type HopRecipeFinalPreviewResult<T extends HopRecipeLike> = HopRecipeFinalPreview<T>
  | (Extract<HopRecipeDraftResult<T>, { status: 'needsAlphaSelection' }> & { alphaChoiceWitnesses?: HopRecipeAlphaChoiceWitness[] });

function alphaChoiceDomain(material: HopDecisionMaterial, addition: HopProgramAddition) {
  if (material.lot?.archived || material.variety?.archived
    || material.lot && material.variety && material.lot.varietyId !== material.variety.id
    || material.lot && material.lot.form !== 'unknown' && material.lot.form !== material.form) {
    throw Error('Référence de matière contradictoire ou archivée ; qualifier la matière avant le choix alpha.');
  }
  // A recipe/working nominal is editable. Only reported data (or an exact, explicitly selected observation)
  // establish bounds for this choice; the previous working number is not a new assay.
  const reading = readHopAlphaChoiceDomainForAddition(material, addition);
  const bounds = numericBounds(reading);
  if (!bounds) {
    const raw = [...material.declaredAnalysis ?? [], ...material.lot?.analysis ?? [], ...material.variety?.analysis ?? []]
      .filter(m => m.analyte === 'alpha');
    if (raw.some(m => hopMeasurementError(m) || m.kind !== 'unknown')) {
      throw Error('La référence alpha est invalide, non comparable ou ambiguë ; sélectionner une observation identifiée avant ce choix.');
    }
  }
  const reportedBases = [...new Set(reading.observations.map(m => m.basis))];
  const analyticalBasis: HopAlphaModelParameter['analyticalBasis'] = reading.selectedParameter?.analyticalBasis
    ?? (bounds && reportedBases.length === 1 && ['asIs', 'dryMatter'].includes(reportedBases[0])
      ? reportedBases[0] as 'asIs' | 'dryMatter' : 'unknown');
  return { reading, bounds, analyticalBasis };
}

function validatePreviewOptions(value: unknown = {}): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Options de l’aperçu de recette invalides.');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw Error('Options de l’aperçu de recette invalides.');
  const options = value as Record<string, unknown>;
  if (Reflect.ownKeys(options).some(key => key !== 'includeAlphaChoiceWitness')
    || options.includeAlphaChoiceWitness !== undefined && typeof options.includeAlphaChoiceWitness !== 'boolean') {
    throw Error('Options de l’aperçu de recette invalides.');
  }
  return options.includeAlphaChoiceWitness === true;
}

function sameAlphaObservations(left: HopMeasurement[], right: HopMeasurement[]): boolean {
  return left.length === right.length && left.every((measurement, index) =>
    hopAlphaObservationReference(measurement) === hopAlphaObservationReference(right[index]));
}

function alphaChoiceWitness(material: HopDecisionMaterial, addition: HopProgramAddition,
  domain: ReturnType<typeof alphaChoiceDomain>): HopRecipeAlphaChoiceWitness {
  const physical = readHopAnalysis(material, 'alpha');
  const sameObservations = sameAlphaObservations(domain.reading.observations, physical.measurements);
  const scope = sameObservations ? physical.scope : 'unknown';
  const scopeReason = sameObservations
    ? scope === 'unknown' ? 'La lecture analytique canonique ne déclare pas de portée physique.' : null
    : 'Les observations du domaine alpha ne correspondent pas exactement au relevé analytique canonique ; portée non attribuée.';
  const reading = structuredClone(domain.reading);
  return { additionId: addition.id,
    material: { id: material.id, name: material.name, form: material.form, stockItemRef: material.stockItemRef ?? null,
      lotId: material.lot?.id ?? null, lotReferenceOnly: material.lot?.referenceOnly ?? null,
      lotVarietyId: material.lot?.varietyId ?? null, varietyId: material.variety?.id ?? null },
    domain: { status: domain.bounds ? 'comparable' : 'unavailable', bounds: domain.bounds ? structuredClone(domain.bounds) : null,
      analyticalBasis: domain.analyticalBasis, unit: reading.unit, scope, scopeReason,
      sources: structuredClone(reading.sources), observations: structuredClone(reading.observations),
      reason: reading.reasons.join(' ') || (domain.bounds ? 'Bornes alpha renvoyées par le domaine de choix.' : 'Le domaine de choix ne fournit aucune borne numérique.'),
      reading } };
}

function rejectedAlphaChoiceWitness(material: HopDecisionMaterial, addition: HopProgramAddition, error: unknown): HopRecipeAlphaChoiceWitness {
  return { additionId: addition.id,
    material: { id: material.id, name: material.name, form: material.form, stockItemRef: material.stockItemRef ?? null,
      lotId: material.lot?.id ?? null, lotReferenceOnly: material.lot?.referenceOnly ?? null,
      lotVarietyId: material.lot?.varietyId ?? null, varietyId: material.variety?.id ?? null },
    domain: { status: 'rejected', bounds: null, analyticalBasis: 'unknown', unit: null, scope: 'unknown',
      scopeReason: 'Le domaine alpha n’a pas fourni de lecture ; aucune portée ni observation n’est affirmée.',
      sources: [], observations: [], reason: error instanceof Error ? error.message : 'Domaine alpha refusé.', reading: null } };
}

function readAlphaChoiceWitness(material: HopDecisionMaterial, addition: HopProgramAddition): HopRecipeAlphaChoiceWitness {
  try { return alphaChoiceWitness(material, addition, alphaChoiceDomain(material, addition)); }
  catch (error) { return rejectedAlphaChoiceWitness(material, addition, error); }
}

function selectModelChanges<T extends HopRecipeLike>(current: T,
  proposal: HopProgramProposal, materials: HopDecisionMaterial[], choices: Record<string, HopRecipeAlphaChoice>, includeWitness: boolean) {
  const changes = structuredClone(proposal.changes);
  const alphaChoiceWitnesses: HopRecipeAlphaChoiceWitness[] = [];
  for (const [id, choice] of Object.entries(choices)) {
    const addition = proposal.program.additions.find(a => a.id === id);
    if (!addition || addition.status !== 'planned') throw Error('Le choix alpha doit désigner un ajout encore prévu du brouillon.');
    const material = materials.find(m => m.id === addition.materialId);
    if (!material || !choice || !Number.isFinite(choice.value) || choice.value < 0 || choice.value > 100
      || typeof choice.reason !== 'string' || !choice.reason.trim()) throw Error('Choix alpha invalide ou raison absente.');
    // The historical recipe field uses zero as a missing-value sentinel. It cannot store this choice losslessly.
    if (choice.value === 0) throw Error('Le champ alpha de recette utilise zéro pour une donnée manquante ; ce choix nul exige un contrat de recette distinct.');
    const { reading, bounds, analyticalBasis } = alphaChoiceDomain(material, addition);
    if (includeWitness) alphaChoiceWitnesses.push(alphaChoiceWitness(material, addition, { reading, bounds, analyticalBasis }));
    if (bounds && (choice.value < bounds.min || choice.value > bounds.max)) throw Error('Alpha choisi hors du domaine documenté.');
    const alphaForModel: HopAlphaModelParameter = { analyte: 'alpha', unit: 'percentAlpha', kind: 'point', value: choice.value,
      analyticalBasis, origin: 'workingHypothesis',
      source: { title: 'Choix alpha avant aperçu final de recette', author: 'Choix de formulation', year: null,
        kind: 'judgment', reference: `recipe-preview:${current.id}:${id}`,
        locator: bounds ? `Nominal de travail dans le domaine alpha rapporté ${bounds.min}–${bounds.max} % ; aucune nouvelle analyse physique.`
          : 'Hypothèse de travail explicite sans borne analytique disponible ; aucune teneur de lot attestée.' },
      ...(reading.selectedParameter?.observationRef ? { observationRef: reading.selectedParameter.observationRef }
        : reading.observations.length === 1 && bounds ? { observationRef: hopAlphaObservationReference(reading.observations[0]) } : {}),
      selectionReason: choice.reason };
    let replaced = false;
    for (const change of changes) {
      if (change.kind === 'append' && change.addition.id === id) {
        change.addition.alphaForModel = structuredClone(alphaForModel); replaced = true;
      } else if (change.kind === 'replace') {
        const row = change.additions.find(a => a.id === id);
        if (row) { row.alphaForModel = structuredClone(alphaForModel); replaced = true; }
      }
    }
    if (!replaced) changes.push({ kind: 'replace', additionId: id, additions: [{ ...structuredClone(addition), alphaForModel }] });
  }
  return { changes, alphaChoiceWitnesses };
}

/** A second, final preview after scalar selection. All calculations are local and have no persistence side effect. */
export function previewHopRecipeDraft<T extends HopRecipeLike>(current: T, binding: HopRecipeBinding,
  sourceProposal: HopProgramProposal, materials: HopDecisionMaterial[], alphaChoices: Record<string, HopRecipeAlphaChoice> = {},
  options: HopRecipeDraftOptions = {}, previewOptions: HopRecipePreviewOptions = {}): HopRecipeFinalPreviewResult<T> {
  const validatedOptions = validateHopRecipeDraftOptions(options);
  const includeAlphaChoiceWitness = validatePreviewOptions(previewOptions);
  const futureProcurement = validatedOptions.futureProcurement;
  const applyOptions = futureProcurement ? { allowFutureProcurement: true } : {};
  // Validate the source preview BEFORE replacing model inputs, so a stale original input cannot be hidden by a choice.
  const sourceApplication = applyHopProgramProposal(binding.program, sourceProposal, materials, applyOptions);
  const sourceDraft = buildHopRecipeDraft(current, binding, sourceApplication, materials, {}, validatedOptions);
  const selected = selectModelChanges(current, sourceProposal, materials, alphaChoices, includeAlphaChoiceWitness);
  const changes = selected.changes;
  const finalProposal = previewHopProgramChanges(binding.program, changes, materials);
  const programApplication = applyHopProgramProposal(binding.program, finalProposal, materials, applyOptions);
  const draft = buildHopRecipeDraft(current, binding, programApplication, materials, {}, validatedOptions);
  if (draft.status !== 'ready') {
    if (!includeAlphaChoiceWitness) return draft;
    const missing = new Set(draft.materialIds);
    const witnesses = finalProposal.program.additions.filter(addition => missing.has(addition.materialId) && addition.status === 'planned')
      .flatMap(addition => {
        const material = materials.find(candidate => candidate.id === addition.materialId);
        return material ? [readAlphaChoiceWitness(material, addition)] : [];
      });
    return { ...draft, alphaChoiceWitnesses: witnesses };
  }
  // A nominal analytical zero would otherwise become the old recipe's missing-value sentinel after reopening.
  const changed = new Set(programApplication.after.additions.filter(a =>
    binding.program.additions.find(b => b.id === a.id)?.materialId !== a.materialId).map(a => a.id));
  if (draft.recipe.hops.some((hop, index) => (changed.has(programApplication.after.additions[index].id)
    || programApplication.after.additions[index].alphaForModel) && hop.alpha === 0)) {
    throw Error('Un alpha nul rapporté ne peut pas être exporté sans perte dans le champ de recette historique.');
  }
  // Keep this explicit: the preliminary result may have been a range, and was not the final accepted preview.
  if (sourceDraft.status === 'needsAlphaSelection') draft.dossier.assumptions.push('Un aperçu final a été recalculé après sélection des paramètres alpha.');
  const payload: Omit<HopRecipeFinalPreview<T>, 'reference'> = { status: 'ready', format: 'hop-recipe-final-preview-v1',
    recipeReference: hopDecisionReference(current), bindingReference: hopDecisionReference(binding),
    sourceProposal: structuredClone(sourceProposal), alphaChoices: structuredClone(alphaChoices), draft,
    ...(includeAlphaChoiceWitness ? { alphaChoiceWitnesses: structuredClone(selected.alphaChoiceWitnesses) } : {}),
    ...(futureProcurement ? { futureProcurement: structuredClone(futureProcurement), conditions: [hopRecipeFutureProcurementCondition(futureProcurement)] } : {}),
    programApplication, analysis: analyzeHopProgram(programApplication.after, materials) };
  return { ...payload, reference: hopDecisionReference(payload) };
}

/** Accept only the exact final recipe/model preview. Returns a separate local draft; writes no stock, recipe or batch. */
export function applyHopRecipeDraftPreview<T extends HopRecipeLike>(current: T, binding: HopRecipeBinding,
  preview: HopRecipeFinalPreview<T>, materials: HopDecisionMaterial[]) {
  if (preview.format !== 'hop-recipe-final-preview-v1' || preview.status !== 'ready'
    || preview.recipeReference !== hopDecisionReference(current) || preview.bindingReference !== hopDecisionReference(binding)) {
    throw Error('La recette ou son raccord a changé depuis l’aperçu final.');
  }
  const expected = previewHopRecipeDraft(current, binding, preview.sourceProposal, materials, preview.alphaChoices,
    preview.futureProcurement ? { futureProcurement: preview.futureProcurement } : {},
    Object.prototype.hasOwnProperty.call(preview, 'alphaChoiceWitnesses') ? { includeAlphaChoiceWitness: true } : {});
  if (expected.status !== 'ready' || hopDecisionReference(expected) !== hopDecisionReference(preview)) {
    throw Error('Le brouillon, les choix ou les résultats ne correspondent plus à l’aperçu final ; recalculer.');
  }
  return { recipe: structuredClone(expected.draft.recipe), dossier: structuredClone(expected.draft.dossier),
    programApplication: structuredClone(expected.programApplication), analysis: structuredClone(expected.analysis),
    previewReference: expected.reference, alphaChoices: structuredClone(expected.alphaChoices) };
}
