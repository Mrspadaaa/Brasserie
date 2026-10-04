import type {
  BrewingScenarioAssumption,
  BrewingScenarioBranchRequest,
} from '../../domain/brewingScenario';
import {
  compareHopMaterials,
  type HopIntentEvidenceCriterion,
} from '../../domain/hopDecision';
import {
  availableHopUses,
  chooseHopSubstitutionDose,
  findHopSubstitutions,
  type HopSubstitutionRequest,
} from '../../domain/hopDecision/substitution';
import {
  planHopReplacement,
  selectHopReplacementPath,
  type HopPlannerRequest,
  type HopPlannerResult,
  type HopPlannerSelection,
  type HopReplacementPath,
} from '../../domain/hopDecision/planner';
import { previewHopProgramChanges, programFingerprint } from '../../domain/hopDecision/programs';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type {
  HopDecisionMaterial,
  HopDecisionProgram,
  HopMaterialComparison,
  HopProgramAddition,
  HopProgramChange,
  HopProgramProposal,
  HopReplacementBasis,
  HopUse,
} from '../../domain/hopDecision/types';

export const HOP_V55_PROGRAM_PREPARATION_VERSION = 'hop-v55-program-preparation-v1' as const;

export interface HopV55ProgramConditionsV1 {
  boilMinutes?: number | null;
  contactHours?: number | null;
  temperatureC?: number | null;
  dayOffset?: number | null;
}

export type HopV55ProgramScopeV1 = 'hotSide' | 'coldSide';

interface HopV55OperationBaseV1 {
  id: string;
  label: string;
  /** Exact excerpt from the original user text when the reader has one. */
  sourceSpan?: { start: number; end: number; text: string };
}

export type HopV55ProgramOperationV1 =
  | (HopV55OperationBaseV1 & {
      kind: 'add';
      additionId: string;
      materialId?: string;
      grams?: number | null;
      use?: HopUse;
      targetScope?: HopV55ProgramScopeV1;
      conditions?: HopV55ProgramConditionsV1;
    })
  | (HopV55OperationBaseV1 & {
      kind: 'remove';
      additionId?: string;
      sourceMaterialId?: string;
      sourceUse?: HopUse;
      sourceScope?: HopV55ProgramScopeV1;
      quantity?: { kind: 'entire' } | { kind: 'partial'; grams: number | null };
    })
  | (HopV55OperationBaseV1 & {
      kind: 'setDose';
      additionId?: string;
      sourceMaterialId?: string;
      sourceUse?: HopUse;
      sourceScope?: HopV55ProgramScopeV1;
      quantity?: { kind: 'target'; grams: number | null }
        | { kind: 'delta'; grams: number | null; direction: 'increase' | 'decrease' };
    })
  | (HopV55OperationBaseV1 & {
      kind: 'move';
      additionId?: string;
      sourceMaterialId?: string;
      sourceUse?: HopUse;
      sourceScope?: HopV55ProgramScopeV1;
      use?: HopUse;
      quantity?: { kind: 'entire' } | { kind: 'partial'; grams: number | null };
      /** Required for a partial move; identifies the new line without changing the physical source ID. */
      newAdditionId?: string;
      conditions?: HopV55ProgramConditionsV1;
    })
  | (HopV55OperationBaseV1 & {
      kind: 'replace';
      additionId?: string;
      sourceMaterialId?: string;
      sourceUse?: HopUse;
      sourceScope?: HopV55ProgramScopeV1;
      materialId?: string;
      dose?: { kind: 'explicit'; grams: number | null }
        | { kind: 'basis'; basis: HopReplacementBasis; fraction?: number; chosenGrams?: number };
    })
  | (HopV55OperationBaseV1 & {
      kind: 'replaceUnavailable';
      sourceMaterialId?: string;
      coverage?: { kind: 'allFuture' } | { kind: 'selectedLines'; additionIds: string[] };
      candidateMaterialIds?: string[];
      basisByUse?: Partial<Record<HopUse, HopPlannerRequest['basisByUse'][HopUse]>>;
      reason?: string;
      selection?: { pathId: string; dosesByAdditionId?: Record<string, number> };
    });

export type HopV55ProgramNeedField =
  | 'operations' | 'source' | 'target' | 'quantity' | 'use' | 'conditions' | 'basis'
  | 'coverage' | 'candidateMaterials' | 'replacementPath' | 'reason' | 'freshness';

export interface HopV55ProgramNeedV1 {
  operationId?: string;
  field: HopV55ProgramNeedField;
  reason: string;
  choices?: Array<{ id: string; label: string }>;
}

export interface HopV55ProgramOperationEvaluationV1 {
  operationId: string;
  status: 'ready' | 'needsInput' | 'blocked';
  needs: HopV55ProgramNeedV1[];
  reasons: string[];
  sourceCandidates: Array<{ id: string; materialId: string; label: string; use: HopUse; status: HopProgramAddition['status'] }>;
  materialCandidates: Array<{ id: string; label: string }>;
  comparison?: HopMaterialComparison;
  substitutions?: ReturnType<typeof findHopSubstitutions>;
  planner?: HopPlannerResult;
  selectedPath?: HopReplacementPath;
  selection?: HopPlannerSelection;
  changes: HopProgramChange[];
}

export interface PrepareHopV55DecisionProgramInput {
  branch: { id: string; label: string };
  program: HopDecisionProgram;
  materials: HopDecisionMaterial[];
  intent: { question: string; interpretation: string; criteria: HopIntentEvidenceCriterion[] };
  operations: HopV55ProgramOperationV1[];
  /** Pass the reference returned by the first evaluation to reject a later stale source. */
  expectedProgramReference?: string;
}

export interface HopV55DecisionProgramPreparationV1 {
  version: typeof HOP_V55_PROGRAM_PREPARATION_VERSION;
  status: 'ready' | 'needsInput' | 'blocked';
  programReference: string;
  operations: HopV55ProgramOperationV1[];
  evaluations: HopV55ProgramOperationEvaluationV1[];
  needs: HopV55ProgramNeedV1[];
  reasons: string[];
  changes?: HopProgramChange[];
  proposal?: HopProgramProposal;
  branch?: BrewingScenarioBranchRequest;
}

const uses: readonly HopUse[] = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
const replacementBases: readonly HopReplacementBasis[] = ['alphaLoad', 'totalOil', 'sameMass', 'manufacturer'];
const clone = <T,>(value: T): T => structuredClone(value);
const isRow = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isUse = (value: unknown): value is HopUse => uses.includes(value as HopUse);
const isProgramScope = (value: unknown): value is HopV55ProgramScopeV1 => value === 'hotSide' || value === 'coldSide';
const inProgramScope = (use: HopUse, scope: HopV55ProgramScopeV1): boolean => scope === 'hotSide'
  ? use === 'firstWort' || use === 'boil' || use === 'whirlpool'
  : use === 'fermentation' || use === 'postFermentation';
const isBlocked = (evaluation: HopV55ProgramOperationEvaluationV1): boolean => evaluation.status === 'blocked';
const isSafeId = (value: unknown): value is string => isText(value) && value.length <= 120
  && !/[\/\\]/.test(value) && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);

function need(operationId: string, field: HopV55ProgramNeedField, reason: string, choices?: HopV55ProgramNeedV1['choices']): HopV55ProgramNeedV1 {
  return { operationId, field, reason, ...(choices ? { choices: clone(choices) } : {}) };
}

function emptyEvaluation(operationId: string): HopV55ProgramOperationEvaluationV1 {
  return { operationId, status: 'ready', needs: [], reasons: [], sourceCandidates: [], materialCandidates: [], changes: [] };
}

function materialsAsChoices(materials: readonly HopDecisionMaterial[], excludedId?: string) {
  return materials.filter(material => material.id !== excludedId)
    .map(material => ({ id: material.id, label: material.name }));
}

function sourceChoices(program: HopDecisionProgram, materialId?: string, use?: HopUse, scope?: HopV55ProgramScopeV1) {
  return program.additions.filter(addition => (materialId === undefined || addition.materialId === materialId)
    && (use === undefined || addition.use === use) && (scope === undefined || inProgramScope(addition.use, scope)))
    .map(addition => ({ id: addition.id, materialId: addition.materialId,
      label: `${addition.id} · ${addition.materialId} · ${addition.use}`, use: addition.use, status: addition.status }));
}

function resolveSource(
  operation: Extract<HopV55ProgramOperationV1, { kind: 'remove' | 'setDose' | 'move' | 'replace' }>,
  program: HopDecisionProgram,
  evaluation: HopV55ProgramOperationEvaluationV1,
): HopProgramAddition | undefined {
  if (operation.sourceScope !== undefined && !isProgramScope(operation.sourceScope)) {
    evaluation.status = 'blocked'; evaluation.reasons.push('Portée physique source inconnue.'); return undefined;
  }
  const selected = operation.additionId
    ? program.additions.filter(addition => addition.id === operation.additionId)
    : sourceChoices(program, operation.sourceMaterialId, operation.sourceUse, operation.sourceScope)
      .map(row => program.additions.find(addition => addition.id === row.id)!);
  evaluation.sourceCandidates = selected.length || operation.additionId
    ? selected.map(addition => ({ id: addition.id, materialId: addition.materialId,
      label: `${addition.id} · ${addition.materialId} · ${addition.use}`, use: addition.use, status: addition.status }))
    : sourceChoices(program, operation.sourceMaterialId, operation.sourceUse, operation.sourceScope);

  if (operation.additionId && !selected.length) {
    evaluation.needs.push(need(operation.id, 'source', `La ligne de programme « ${operation.additionId} » n’existe plus.`));
    return undefined;
  }
  if (selected.length !== 1) {
    const choices = evaluation.sourceCandidates.map(row => ({ id: row.id, label: row.label }));
    evaluation.needs.push(need(operation.id, 'source', selected.length
      ? 'Plusieurs lignes correspondent ; choisir chaque ligne explicitement ou créer une opération distincte.'
      : 'Choisir la ligne source exacte dans le programme courant.', choices));
    return undefined;
  }
  const addition = selected[0];
  if (operation.sourceMaterialId !== undefined && addition.materialId !== operation.sourceMaterialId
    || operation.sourceUse !== undefined && addition.use !== operation.sourceUse
    || operation.sourceScope !== undefined && !inProgramScope(addition.use, operation.sourceScope)) {
    evaluation.reasons.push('Les identifiants de source fournis ne correspondent pas à la ligne sélectionnée.');
    evaluation.status = 'blocked';
    return undefined;
  }
  if (addition.status === 'performed') {
    evaluation.reasons.push(`La ligne ${addition.id} est déjà effectuée ; elle ne peut pas être modifiée.`);
    evaluation.status = 'blocked';
    return undefined;
  }
  return addition;
}

function validateConditions(conditions: HopV55ProgramConditionsV1 | undefined,
  evaluation: HopV55ProgramOperationEvaluationV1): void {
  if (conditions === undefined) return;
  if (!isRow(conditions) || Object.keys(conditions).some(key => !['boilMinutes', 'contactHours', 'temperatureC', 'dayOffset'].includes(key))) {
    evaluation.status = 'blocked';
    evaluation.reasons.push('Les conditions de procédé contiennent un champ inconnu.');
    return;
  }
  for (const field of ['boilMinutes', 'contactHours', 'dayOffset'] as const) {
    const value = conditions[field];
    if (value !== undefined && value !== null && (!finite(value) || value < 0)) {
      evaluation.status = 'blocked'; evaluation.reasons.push(`${field} doit être une durée ou un décalage positif.`);
    }
  }
  if (conditions.temperatureC !== undefined && conditions.temperatureC !== null
    && (!finite(conditions.temperatureC) || conditions.temperatureC < -273.15)) {
    evaluation.status = 'blocked'; evaluation.reasons.push('La température de procédé est invalide.');
  }
}

function requireUseConditions(addition: HopProgramAddition, operationId: string, evaluation: HopV55ProgramOperationEvaluationV1): void {
  const missing: string[] = [];
  if (addition.use === 'boil' && addition.boilMinutes == null) missing.push('boilMinutes');
  if (addition.use === 'whirlpool' || addition.use === 'fermentation' || addition.use === 'postFermentation') {
    if (addition.contactHours == null) missing.push('contactHours');
    if (addition.temperatureC == null) missing.push('temperatureC');
  }
  if (missing.length) evaluation.needs.push(need(operationId, 'conditions',
    `Préciser ${missing.join(' et ')} pour l’emploi « ${addition.use} » ; aucune durée ou température n’est supposée.`));
}

function changeForReplacement(addition: HopProgramAddition, replacement: HopProgramAddition): HopProgramChange {
  return { kind: 'replace', additionId: addition.id, additions: [replacement] };
}

function processAdd(operation: Extract<HopV55ProgramOperationV1, { kind: 'add' }>, input: PrepareHopV55DecisionProgramInput,
  evaluation: HopV55ProgramOperationEvaluationV1): void {
  if (!isText(operation.additionId)) { evaluation.status = 'blocked'; evaluation.reasons.push('Identifiant stable de la nouvelle ligne absent.'); return; }
  if (input.program.additions.some(row => row.id === operation.additionId)) {
    evaluation.status = 'blocked'; evaluation.reasons.push(`L’identifiant de ligne ${operation.additionId} existe déjà.`); return;
  }
  if (!operation.materialId) {
    evaluation.needs.push(need(operation.id, 'target', 'Choisir une identité exacte du catalogue ; aucune matière n’est sélectionnée par nom.', materialsAsChoices(input.materials)));
  }
  const material = input.materials.find(row => row.id === operation.materialId);
  if (operation.materialId && !material) {
    evaluation.needs.push(need(operation.id, 'target', `La matière exacte « ${operation.materialId} » n’est plus chargée.`, materialsAsChoices(input.materials)));
  }
  if (operation.grams === undefined || operation.grams === null) evaluation.needs.push(need(operation.id, 'quantity', 'Saisir une masse en grammes ; aucune dose n’est proposée automatiquement.'));
  else if (!finite(operation.grams) || operation.grams < 0) { evaluation.status = 'blocked'; evaluation.reasons.push('La masse doit être un nombre fini positif ou nul.'); }
  if (operation.targetScope !== undefined && !isProgramScope(operation.targetScope)) {
    evaluation.status = 'blocked'; evaluation.reasons.push('Portée physique cible inconnue.');
  }
  if (!operation.use) {
    const choices = operation.targetScope && isProgramScope(operation.targetScope)
      ? availableHopUses(input.program.stage).filter(use => inProgramScope(use, operation.targetScope!)).map(use => ({ id: use, label: use }))
      : undefined;
    evaluation.needs.push(need(operation.id, 'use', operation.targetScope === undefined
      ? 'Choisir explicitement un emploi du programme.'
      : 'Choisir explicitement un emploi du programme; la portée ne choisit pas une phase à ta place.', choices));
  }
  else if (!isUse(operation.use)) { evaluation.status = 'blocked'; evaluation.reasons.push('Emploi de programme inconnu.'); }
  else if (operation.targetScope !== undefined && isProgramScope(operation.targetScope) && !inProgramScope(operation.use, operation.targetScope)) {
    evaluation.status = 'blocked'; evaluation.reasons.push(`L’emploi « ${operation.use} » ne correspond pas à la portée ${operation.targetScope}.`);
  }
  validateConditions(operation.conditions, evaluation);
  if (operation.use && isUse(operation.use)) {
    const candidate: HopProgramAddition = { id: operation.additionId, materialId: operation.materialId ?? '', grams: operation.grams ?? null,
      use: operation.use, status: 'planned', ...(operation.conditions ? clone(operation.conditions) : {}) };
    requireUseConditions(candidate, operation.id, evaluation);
  }
  if (evaluation.status === 'blocked' || evaluation.needs.length || !material || !isUse(operation.use) || operation.grams == null) return;
  evaluation.changes.push({ kind: 'append', addition: { id: operation.additionId, materialId: material.id, grams: operation.grams,
    use: operation.use, status: 'planned', ...(operation.conditions ? clone(operation.conditions) : {}) } });
}

function processRemove(operation: Extract<HopV55ProgramOperationV1, { kind: 'remove' }>, input: PrepareHopV55DecisionProgramInput,
  evaluation: HopV55ProgramOperationEvaluationV1): void {
  if (operation.quantity === undefined) { evaluation.needs.push(need(operation.id, 'quantity', 'Préciser si toute la ligne est retirée ou indiquer une masse partielle.')); return; }
  if (!isRow(operation.quantity) || operation.quantity.kind !== 'entire' && operation.quantity.kind !== 'partial') {
    evaluation.status = 'blocked'; evaluation.reasons.push('Type de quantité de retrait inconnu.'); return;
  }
  const source = resolveSource(operation, input.program, evaluation);
  if (!source || evaluation.status === 'blocked') return;
  if (operation.quantity.kind === 'entire') { evaluation.changes.push({ kind: 'remove', additionId: source.id }); return; }
  const grams = operation.quantity.grams;
  if (grams === null || grams === undefined) { evaluation.needs.push(need(operation.id, 'quantity', 'Saisir la masse à retirer en grammes.')); return; }
  if (!finite(grams) || grams <= 0) { evaluation.status = 'blocked'; evaluation.reasons.push('Une masse partielle retirée doit être finie et strictement positive.'); return; }
  if (source.grams === null) { evaluation.needs.push(need(operation.id, 'quantity', `La masse de ${source.id} est inconnue ; une quantité restante ne peut pas être calculée.`)); return; }
  if (grams > source.grams) { evaluation.status = 'blocked'; evaluation.reasons.push(`La masse demandée (${grams} g) dépasse ${source.id} (${source.grams} g).`); return; }
  if (grams === source.grams) evaluation.changes.push({ kind: 'remove', additionId: source.id });
  else evaluation.changes.push(changeForReplacement(source, { ...clone(source), grams: source.grams - grams }));
}

function processDose(operation: Extract<HopV55ProgramOperationV1, { kind: 'setDose' }>, input: PrepareHopV55DecisionProgramInput,
  evaluation: HopV55ProgramOperationEvaluationV1): void {
  if (operation.quantity === undefined) { evaluation.needs.push(need(operation.id, 'quantity', 'Préciser une masse cible ou une variation explicite.')); return; }
  if (!isRow(operation.quantity) || operation.quantity.kind !== 'target' && operation.quantity.kind !== 'delta'
    || operation.quantity.kind === 'delta' && operation.quantity.direction !== 'increase' && operation.quantity.direction !== 'decrease') {
    evaluation.status = 'blocked'; evaluation.reasons.push('Type ou direction de quantité de programme inconnu.'); return;
  }
  const source = resolveSource(operation, input.program, evaluation);
  if (!source || evaluation.status === 'blocked') return;
  const grams = operation.quantity.grams;
  if (grams === null || grams === undefined) { evaluation.needs.push(need(operation.id, 'quantity', 'Saisir une masse en grammes.')); return; }
  if (!finite(grams) || grams < 0) { evaluation.status = 'blocked'; evaluation.reasons.push('La masse cible doit être finie et positive ou nulle.'); return; }
  let nextGrams = grams;
  if (operation.quantity.kind === 'delta') {
    if (source.grams === null) { evaluation.needs.push(need(operation.id, 'quantity', `La masse de ${source.id} est inconnue ; une variation ne peut pas être calculée.`)); return; }
    nextGrams = source.grams + (operation.quantity.direction === 'increase' ? grams : -grams);
    if (nextGrams < 0) { evaluation.status = 'blocked'; evaluation.reasons.push('La diminution dépasserait la masse source.'); return; }
  }
  evaluation.changes.push(changeForReplacement(source, { ...clone(source), grams: nextGrams }));
}

function processMove(operation: Extract<HopV55ProgramOperationV1, { kind: 'move' }>, input: PrepareHopV55DecisionProgramInput,
  evaluation: HopV55ProgramOperationEvaluationV1): void {
  const source = resolveSource(operation, input.program, evaluation);
  if (!source || evaluation.status === 'blocked') return;
  if (!operation.quantity) { evaluation.needs.push(need(operation.id, 'quantity', 'Préciser si toute la ligne change d’emploi ou indiquer la masse déplacée.')); return; }
  if (!isRow(operation.quantity) || operation.quantity.kind !== 'entire' && operation.quantity.kind !== 'partial') {
    evaluation.status = 'blocked'; evaluation.reasons.push('Type de quantité à déplacer inconnu.'); return;
  }
  if (!operation.use) { evaluation.needs.push(need(operation.id, 'use', 'Choisir explicitement le nouvel emploi ; « à cru » seul ne définit pas une phase.')); return; }
  if (!isUse(operation.use)) { evaluation.status = 'blocked'; evaluation.reasons.push('Emploi de programme inconnu.'); return; }
  validateConditions(operation.conditions, evaluation);
  const movedConditions = (addition: HopProgramAddition): HopProgramAddition => {
    const moved = { ...addition, use: operation.use! };
    if (source.use !== operation.use) {
      delete moved.boilMinutes; delete moved.contactHours; delete moved.temperatureC;
    }
    for (const field of ['boilMinutes', 'contactHours', 'temperatureC', 'dayOffset'] as const) {
      if (operation.conditions && Object.prototype.hasOwnProperty.call(operation.conditions, field)) moved[field] = operation.conditions[field] as never;
    }
    return moved;
  };
  if (operation.quantity.kind === 'entire') {
    const moved = movedConditions(clone(source));
    requireUseConditions(moved, operation.id, evaluation);
    if (!isBlocked(evaluation) && !evaluation.needs.length) evaluation.changes.push(changeForReplacement(source, moved));
    return;
  }
  const grams = operation.quantity.grams;
  if (grams === null || grams === undefined) { evaluation.needs.push(need(operation.id, 'quantity', 'Saisir la masse à déplacer en grammes.')); return; }
  if (!finite(grams) || grams <= 0) { evaluation.status = 'blocked'; evaluation.reasons.push('La masse déplacée doit être finie et strictement positive.'); return; }
  if (source.grams === null) { evaluation.needs.push(need(operation.id, 'quantity', `La masse de ${source.id} est inconnue ; le reliquat à l’emploi initial ne peut pas être calculé.`)); return; }
  if (grams > source.grams) { evaluation.status = 'blocked'; evaluation.reasons.push(`La masse déplacée (${grams} g) dépasse ${source.id} (${source.grams} g).`); return; }
  if (grams === source.grams) { evaluation.status = 'blocked'; evaluation.reasons.push('Cette quantité couvre la ligne entière ; confirmer explicitement quantity.kind="entire".'); return; }
  if (!isText(operation.newAdditionId)) { evaluation.needs.push(need(operation.id, 'target', 'Fournir un identifiant stable pour la nouvelle ligne déplacée.')); return; }
  if (input.program.additions.some(row => row.id === operation.newAdditionId)) {
    evaluation.status = 'blocked'; evaluation.reasons.push(`L’identifiant de nouvelle ligne ${operation.newAdditionId} existe déjà.`); return;
  }
  const moved = movedConditions({ ...clone(source), id: operation.newAdditionId, grams });
  requireUseConditions(moved, operation.id, evaluation);
  if (!isBlocked(evaluation) && !evaluation.needs.length) {
    evaluation.changes.push(changeForReplacement(source, { ...clone(source), grams: source.grams - grams }));
    evaluation.changes.push({ kind: 'append', addition: moved });
  }
}

function processReplace(operation: Extract<HopV55ProgramOperationV1, { kind: 'replace' }>, input: PrepareHopV55DecisionProgramInput,
  evaluation: HopV55ProgramOperationEvaluationV1): void {
  const source = resolveSource(operation, input.program, evaluation);
  if (!source || evaluation.status === 'blocked') return;
  if (!operation.materialId) {
    evaluation.needs.push(need(operation.id, 'target', 'Choisir une identité exacte du catalogue ; variété, lot et alias ne sont jamais fusionnés.', materialsAsChoices(input.materials, source.materialId)));
    return;
  }
  const target = input.materials.find(row => row.id === operation.materialId);
  if (!target) {
    evaluation.needs.push(need(operation.id, 'target', `La matière exacte « ${operation.materialId} » n’est plus chargée.`, materialsAsChoices(input.materials, source.materialId)));
    return;
  }
  if (target.id === source.materialId) { evaluation.status = 'blocked'; evaluation.reasons.push('La cible est la même identité exacte que la source ; aucune substitution n’est proposée.'); return; }
  const sourceMaterial = input.materials.find(row => row.id === source.materialId);
  if (!sourceMaterial) {
    evaluation.needs.push(need(operation.id, 'source', `La matière source exacte « ${source.materialId} » n’est pas chargée ; aucune identité provisoire n’est fabriquée.`));
    return;
  }
  evaluation.comparison = compareHopMaterials(sourceMaterial, target);
  if (!operation.dose) {
    evaluation.needs.push(need(operation.id, 'quantity', 'La comparaison documentaire est disponible ; choisir une masse cible explicite ou une convention de dose.'));
    evaluation.needs.push(need(operation.id, 'basis', 'Aucune convention n’est choisie implicitement.'));
    return;
  }
  if (!isRow(operation.dose) || operation.dose.kind !== 'explicit' && operation.dose.kind !== 'basis') {
    evaluation.status = 'blocked'; evaluation.reasons.push('Type de dose de remplacement inconnu.'); return;
  }
  if (operation.dose.kind === 'explicit') {
    if (operation.dose.grams === null) { evaluation.needs.push(need(operation.id, 'quantity', 'Saisir la masse cible en grammes.')); return; }
    if (!finite(operation.dose.grams) || operation.dose.grams < 0) { evaluation.status = 'blocked'; evaluation.reasons.push('La masse cible doit être finie et positive ou nulle.'); return; }
    evaluation.changes.push(changeForReplacement(source, { ...clone(source), materialId: target.id, grams: operation.dose.grams, alphaForModel: undefined }));
    return;
  }
  if (!replacementBases.includes(operation.dose.basis)) { evaluation.status = 'blocked'; evaluation.reasons.push('Convention de remplacement inconnue.'); return; }
  if (operation.dose.fraction !== undefined && (!finite(operation.dose.fraction) || operation.dose.fraction <= 0 || operation.dose.fraction > 1)) {
    evaluation.status = 'blocked'; evaluation.reasons.push('La fraction doit être comprise dans ]0, 1].'); return;
  }
  const request: HopSubstitutionRequest = { program: input.program, additionId: source.id, materials: clone(input.materials),
    candidateIds: [target.id], basis: operation.dose.basis,
    ...(operation.dose.fraction !== undefined ? { fraction: operation.dose.fraction } : {}), deferProgramCheck: true };
  evaluation.substitutions = findHopSubstitutions(request);
  const option = evaluation.substitutions.find(row => row.materialId === target.id);
  if (!option || option.applicability === 'blocked') {
    evaluation.status = 'blocked'; evaluation.reasons.push(...option?.reasons ?? ['Aucune option calculable pour la source et la cible exactes.']); return;
  }
  if (option.applicability === 'chooseDose') {
    if (operation.dose.chosenGrams === undefined) {
      evaluation.needs.push(need(operation.id, 'quantity', 'La convention donne une plage ; choisir explicitement une masse dans ses bornes.'));
      return;
    }
    try {
      const chosen = chooseHopSubstitutionDose(option, operation.dose.chosenGrams, request);
      if (!chosen.changes) { evaluation.status = 'blocked'; evaluation.reasons.push('La dose choisie n’a pas produit de changement complet.'); return; }
      evaluation.changes.push(...clone(chosen.changes));
    } catch (error) {
      evaluation.status = 'blocked'; evaluation.reasons.push(error instanceof Error ? error.message : 'La dose choisie est invalide.');
    }
    return;
  }
  if (!option.changes) {
    evaluation.needs.push(need(operation.id, 'basis', option.missing.join(' ') || option.reasons.join(' ') || 'La convention ne fournit pas une dose calculable.'));
    return;
  }
  evaluation.changes.push(...clone(option.changes));
}

function replacementRequest(operation: Extract<HopV55ProgramOperationV1, { kind: 'replaceUnavailable' }>,
  input: PrepareHopV55DecisionProgramInput): HopPlannerRequest | undefined {
  const evaluationContext = input.intent;
  if (!operation.sourceMaterialId) return undefined;
  if (!isText(operation.reason)) return undefined;
  if (!operation.candidateMaterialIds?.length) return undefined;
  if (!operation.basisByUse) return undefined;
  const knownIds = new Set(input.materials.map(row => row.id));
  if (operation.candidateMaterialIds.some(id => !knownIds.has(id))) return undefined;
  return {
    question: evaluationContext.question,
    interpretation: evaluationContext.interpretation,
    criteria: clone(evaluationContext.criteria),
    program: clone(input.program),
    unavailable: { materialId: operation.sourceMaterialId, reason: operation.reason, origin: 'user' },
    materials: clone(input.materials),
    candidateMaterialIds: [...operation.candidateMaterialIds],
    basisByUse: clone(operation.basisByUse),
    limits: { maxCandidateMaterials: Math.max(1, operation.candidateMaterialIds.length), maxAssignments: 5000, maxPrograms: 1000 },
  };
}

function processReplaceUnavailable(operation: Extract<HopV55ProgramOperationV1, { kind: 'replaceUnavailable' }>,
  input: PrepareHopV55DecisionProgramInput, evaluation: HopV55ProgramOperationEvaluationV1): void {
  if (!operation.sourceMaterialId) evaluation.needs.push(need(operation.id, 'source', 'Choisir l’identité exacte indisponible à remplacer.'));
  else if (!input.materials.some(row => row.id === operation.sourceMaterialId)) evaluation.needs.push(need(operation.id, 'source', `L’identité exacte « ${operation.sourceMaterialId} » n’est pas chargée.`));
  if (!operation.coverage) evaluation.needs.push(need(operation.id, 'coverage', 'Choisir explicitement toutes les lignes futures concernées ou décrire une opération par ligne.'));
  if (!operation.candidateMaterialIds?.length) evaluation.needs.push(need(operation.id, 'candidateMaterials', 'Choisir une ou plusieurs identités exactes candidates ; aucun premier candidat n’est sélectionné.'));
  if (operation.candidateMaterialIds && operation.candidateMaterialIds.length > 250) {
    evaluation.needs.push(need(operation.id, 'candidateMaterials', 'Le planificateur accepte au plus 250 identités candidates par recherche ; réduire explicitement le périmètre avant de relancer.'));
  }
  if (operation.candidateMaterialIds?.some(id => !input.materials.some(row => row.id === id))) {
    evaluation.needs.push(need(operation.id, 'candidateMaterials', 'Une identité candidate n’est plus chargée.'));
  }
  if (!isText(operation.reason)) evaluation.needs.push(need(operation.id, 'reason', 'Préciser pourquoi la source est indisponible.'));
  if (operation.coverage !== undefined && (!isRow(operation.coverage)
    || operation.coverage.kind !== 'allFuture' && operation.coverage.kind !== 'selectedLines'
    || operation.coverage.kind === 'selectedLines' && (!Array.isArray(operation.coverage.additionIds)
      || !operation.coverage.additionIds.every(isText)))) {
    evaluation.status = 'blocked'; evaluation.reasons.push('Portée de remplacement invalide.'); return;
  }
  if (!operation.basisByUse) evaluation.needs.push(need(operation.id, 'basis', 'Choisir explicitement une convention pour chaque emploi concerné.'));
  if (evaluation.needs.length) return;
  const request = replacementRequest(operation, input);
  if (!request) { evaluation.status = 'blocked'; evaluation.reasons.push('La portée, les candidats ou les bases de remplacement sont incohérents.'); return; }
  try { evaluation.planner = planHopReplacement(request); }
  catch (error) { evaluation.status = 'blocked'; evaluation.reasons.push(error instanceof Error ? error.message : 'Plan de remplacement impossible.'); return; }
  if (evaluation.planner.search.truncated) evaluation.reasons.push('La recherche est bornée ; les voies affichées restent choisissables une à une, mais elles ne prouvent pas que toutes les combinaisons ont été examinées.');
  if (operation.coverage?.kind === 'selectedLines') {
    const selected = [...new Set(operation.coverage.additionIds)].sort();
    const affected = [...evaluation.planner.affectedAdditionIds].sort();
    if (selected.length !== operation.coverage.additionIds.length || selected.some(id => !affected.includes(id))) {
      evaluation.status = 'blocked'; evaluation.reasons.push('Les lignes sélectionnées ne correspondent pas exactement aux lignes futures de cette identité ; crée une opération distincte pour chaque ligne voulue.'); return;
    }
    if (selected.length !== affected.length) {
      evaluation.needs.push(need(operation.id, 'coverage', 'Le planificateur couvre chaque ligne future de cette identité. Pour une sélection partielle, créer des opérations de remplacement par ligne.',
        affected.map(id => ({ id, label: id }))));
      evaluation.status = 'needsInput'; return;
    }
  }
  if (operation.coverage?.kind !== 'allFuture' && operation.coverage?.kind !== 'selectedLines') {
    evaluation.status = 'blocked'; evaluation.reasons.push('Portée de remplacement inconnue.'); return;
  }
  if (!operation.selection) {
    evaluation.needs.push(need(operation.id, 'replacementPath', 'Examiner puis choisir explicitement une voie complète.',
      evaluation.planner.paths.map(path => ({ id: path.pathId, label: `${path.kind} · ${path.assignments.map(row => row.candidateMaterialId).join(', ')}` }))));
    return;
  }
  evaluation.selectedPath = evaluation.planner.paths.find(path => path.pathId === operation.selection!.pathId);
  if (!evaluation.selectedPath) { evaluation.status = 'blocked'; evaluation.reasons.push('La voie choisie n’appartient plus au plan calculé ; réexaminer les candidats.'); return; }
  const selected = evaluation.selectedPath;
  if (!selected.complete || selected.applicability === 'unavailable') {
    evaluation.status = 'blocked'; evaluation.reasons.push(...selected.conditions); return;
  }
  const missingAssignments = selected.assignments.flatMap(assignment => {
    if (!assignment.basis || assignment.doseGrams.status === 'unknown' || assignment.doseGrams.status === 'conflict') {
      return [need(operation.id, 'basis', `${assignment.additionId} : convention ou dose calculable absente.`)];
    }
    if (assignment.status === 'choose' && operation.selection?.dosesByAdditionId?.[assignment.additionId] === undefined) {
      return [need(operation.id, 'quantity', `${assignment.additionId} : choisir une dose dans les bornes proposées.`)];
    }
    return [];
  });
  if (missingAssignments.length) { evaluation.needs.push(...missingAssignments); return; }
  try {
    evaluation.selection = selectHopReplacementPath({ request, plan: evaluation.planner, pathId: operation.selection.pathId,
      ...(operation.selection.dosesByAdditionId ? { dosesByAdditionId: clone(operation.selection.dosesByAdditionId) } : {}) });
    evaluation.changes.push(...clone(evaluation.selection.changes));
  } catch (error) {
    evaluation.status = 'blocked'; evaluation.reasons.push(error instanceof Error ? error.message : 'La voie ou ses doses ont changé.');
  }
}

function evaluateOperation(operation: HopV55ProgramOperationV1, input: PrepareHopV55DecisionProgramInput): HopV55ProgramOperationEvaluationV1 {
  const operationId = isRow(operation) && isText(operation.id) ? operation.id : '';
  const evaluation = emptyEvaluation(operationId);
  if (!isRow(operation) || !isText(operation.id) || !isText(operation.label)) {
    evaluation.status = 'blocked'; evaluation.reasons.push('Identifiant ou libellé d’opération invalide.'); return evaluation;
  }
  if (operation.sourceSpan !== undefined) {
    const span = operation.sourceSpan;
    if (!isRow(span) || !Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end)
      || (span.start as number) < 0 || (span.end as number) < (span.start as number)
      || typeof span.text !== 'string' || span.end !== span.start + span.text.length
      || input.intent.question.slice(span.start as number, span.end as number) !== span.text) {
      evaluation.status = 'blocked'; evaluation.reasons.push('L’extrait source doit rester exactement aligné sur la question d’origine.'); return evaluation;
    }
  }
  if (operation.kind === 'add') processAdd(operation, input, evaluation);
  else if (operation.kind === 'remove') processRemove(operation, input, evaluation);
  else if (operation.kind === 'setDose') processDose(operation, input, evaluation);
  else if (operation.kind === 'move') processMove(operation, input, evaluation);
  else if (operation.kind === 'replace') processReplace(operation, input, evaluation);
  else if (operation.kind === 'replaceUnavailable') processReplaceUnavailable(operation, input, evaluation);
  else { evaluation.status = 'blocked'; evaluation.reasons.push('Type d’opération inconnu.'); }
  if (evaluation.status !== 'blocked' && evaluation.needs.length) evaluation.status = 'needsInput';
  return evaluation;
}

function blockedResult(input: PrepareHopV55DecisionProgramInput, programReference: string, reason: string): HopV55DecisionProgramPreparationV1 {
  const operations = Array.isArray(input?.operations) ? input.operations : [];
  const evaluations = operations.map(operation => {
    const row = emptyEvaluation(isRow(operation) && isText(operation.id) ? operation.id : '');
    row.status = 'blocked'; row.needs.push(need(row.operationId, 'freshness', reason)); return row;
  });
  const needs = evaluations.flatMap(row => row.needs);
  return { version: HOP_V55_PROGRAM_PREPARATION_VERSION, status: 'blocked', programReference,
    operations: clone(operations), evaluations, needs, reasons: [reason] };
}

/**
 * Resolves exact programme operations into one atomic J1 branch. It keeps
 * incomplete drafts verbatim and never mutates the source programme, recipe,
 * brew-day record, inventory, or catalogue.
 */
export function prepareHopV55DecisionProgram(input: PrepareHopV55DecisionProgramInput): HopV55DecisionProgramPreparationV1 {
  let programReference = '';
  try { programReference = programFingerprint(input.program); }
  catch (error) { return blockedResult(input, '', error instanceof Error ? error.message : 'Programme source invalide.'); }
  if (input.expectedProgramReference !== undefined && input.expectedProgramReference !== programReference) {
    return blockedResult(input, programReference, 'Le programme source a changé depuis le début de la saisie ; relire les lignes avant de préparer la branche.');
  }
  if (!isSafeId(input.branch?.id) || input.branch.id === 'baseline' || !isText(input.branch?.label)) return blockedResult(input, programReference, 'Identifiant valide et libellé de branche requis.');
  if (!Array.isArray(input.materials) || !Array.isArray(input.operations) || !Array.isArray(input.intent?.criteria)
    || typeof input.intent?.question !== 'string' || typeof input.intent?.interpretation !== 'string') {
    return blockedResult(input, programReference, 'Catalogue, opérations ou intention corrigée invalides.');
  }
  if (input.operations.length === 0) {
    return { version: HOP_V55_PROGRAM_PREPARATION_VERSION, status: 'needsInput', programReference, operations: [],
      evaluations: [], needs: [need('', 'operations', 'Ajouter au moins une opération de programme.')], reasons: [] };
  }
  if (input.operations.some(operation => !isRow(operation) || !isText(operation.id) || !isText(operation.kind))) {
    return blockedResult(input, programReference, 'Chaque opération doit être un objet typé avec un identifiant et un type valides.');
  }
  if (new Set(input.operations.map(operation => operation.id)).size !== input.operations.length) {
    return blockedResult(input, programReference, 'Chaque opération doit avoir un identifiant distinct.');
  }
  const evaluations = input.operations.map(operation => evaluateOperation(operation, input));
  const needs = evaluations.flatMap(row => row.needs);
  const reasons = evaluations.flatMap(row => row.reasons);
  const draft = { version: HOP_V55_PROGRAM_PREPARATION_VERSION, programReference,
    operations: clone(input.operations), evaluations, needs, reasons } as const;
  if (evaluations.some(row => row.status === 'blocked')) return { ...draft, status: 'blocked' };
  if (evaluations.some(row => row.status === 'needsInput') || needs.length) return { ...draft, status: 'needsInput' };
  const changes = evaluations.flatMap(row => clone(row.changes));
  if (!changes.length) return { ...draft, status: 'needsInput', needs: [need('', 'operations', 'Aucun changement de programme complet à prévisualiser.')] };

  let proposal: HopProgramProposal;
  try { proposal = previewHopProgramChanges(input.program, changes, input.materials); }
  catch (error) {
    return { ...draft, status: 'blocked', reasons: [...reasons, error instanceof Error ? error.message : 'Composition de programme invalide.'] };
  }
  if (proposal.applicability === 'unavailable') {
    return { ...draft, status: 'blocked', reasons: [...reasons, ...proposal.conditions], changes, proposal };
  }
  const assumptions: BrewingScenarioAssumption[] = [{
    id: `program-${hopAdviceContentReference('hop-v55-program-change-assumption-v1', { branchId: input.branch.id, programReference, changes }).slice(-28)}`,
    path: 'program.changes', label: 'Opérations de programme préparées', status: 'selected', origin: 'userHypothesis',
    explanation: input.operations.map(operation => operation.label).join(' ; '),
    value: hopAdviceContentReference('hop-v55-program-change-content-v1', changes),
  }];
  const branch: BrewingScenarioBranchRequest = {
    id: input.branch.id, label: input.branch.label.trim(), assumptions, programChanges: clone(changes),
  };
  return { ...draft, status: 'ready', changes: clone(changes), proposal: clone(proposal), branch };
}
