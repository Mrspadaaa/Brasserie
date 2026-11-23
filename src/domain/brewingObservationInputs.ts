import { assertHopRecipeInput, type HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import { hopSourceError, type HopSource } from '../../functions/src/hopIndexSchema';
import { HOP_TIMINGS, type HopTiming } from '../../functions/src/hopPredictionSchema';
import { readNativeMassInGrams, subtractNativeMassesFromGrams, type NativeMassInGrams, type BrewingMassSubtraction } from './brewingObservationQuantity';
import { assertBrewingObservedState, brewingObservedContactSource, brewingObservedFactSource,
  type BrewingObservedKnownReferenceV1, type BrewingObservedStateV1 } from './brewingObservedState';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import type { HopDecisionMaterial } from './hopDecision/types';

export interface BrewingObservationModelContext {
  /** Explicit common model inputs. A recipe target is a hypothesis, not a measurement. */
  input: Omit<HopRecipeInput, 'additions'>;
  origin: 'recorded' | 'declaredHypothesis';
  source: HopSource;
  explanation: string;
}

export interface BrewingObservedHopBinding {
  additionId: string;
  factReference: string;
  contactReference: string;
  materialId: string;
  timing: HopTiming;
  temperatureC: number | null;
  matrixId: string | null;
  explanation: string;
}

export interface BrewingObservedHopScope {
  id: string;
  dependencyIds: string[];
  fromAt: string;
  explanation: string;
}

export interface BrewingObservedHopInputRequest {
  state: BrewingObservedStateV1;
  scope: BrewingObservedHopScope;
  context: BrewingObservationModelContext;
  bindings: BrewingObservedHopBinding[];
  materials: HopDecisionMaterial[];
}

export interface BrewingObservedHopInput {
  format: 'brewing-observed-hop-input-v1';
  source: BrewingObservedHopInputRequest;
  status: 'available' | 'unknown';
  input: HopRecipeInput | null;
  /** Known additions remain visible even if a necessary part is unresolved. */
  knownAdditions: HopRecipeInput['additions'];
  used: Array<{ additionId: string; factReference: string; contactReference: string; materialId: string;
    grams: number; massEvidence: Extract<NativeMassInGrams, { status: 'known' }>; elapsedHours: number; ended: boolean }>;
  issues: Array<{ code: string; dependencyId?: string; reference?: string; message: string }>;
  reference: string;
}

export interface BrewingFutureHopAddition {
  id: string;
  materialId: string;
  timing: HopTiming;
  contactHours: number;
  temperatureC: number | null;
  matrixId: string | null;
  quantity:
    | { kind: 'remaining'; grams: number }
    | { kind: 'totalIncludingRealized'; grams: number; realizedFactReferences: string[] };
  explanation: string;
}

export interface BrewingObservationTargetRequest {
  /** Current realised prefix, which may include operations after the anchor note. */
  current: BrewingObservedHopInput;
  future: BrewingFutureHopAddition[];
  contactTargets: Array<{ additionId: string; contactHours: number; explanation: string }>;
  horizon:
    | { kind: 'instant'; at: string; explanation: string }
    | { kind: 'relative'; eventReference: string; durationHours: number; explanation: string };
  explanation: string;
}

export interface BrewingObservationTargetInput {
  format: 'brewing-observation-target-input-v1';
  source: BrewingObservationTargetRequest;
  status: 'available' | 'unknown';
  input: HopRecipeInput | null;
  remaining: Array<{ additionId: string; plannedGrams: number; realizedGrams: number | null; remainingGrams: number | null;
    deficitGrams: number | null; arithmetic: BrewingMassSubtraction; realizedFactReferences: string[] }>;
  issues: BrewingObservedHopInput['issues'];
  reference: string;
}

const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const instant = (v: unknown) => text(v)
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(v)
  && Number.isFinite(Date.parse(v));
const check: (v: unknown, message: string) => asserts v = (v, message) => { if (!v) throw Error(message); };
const keys = (v: Record<string, any>, allowed: string[]) => Object.keys(v).every(key => allowed.includes(key));
const hash = (label: string, value: unknown) => hopAdviceContentReference(label, value);
const withoutReference = (value: { reference: string }) => { const { reference: _reference, ...body } = value; return body; };

function assertContext(value: unknown): asserts value is BrewingObservationModelContext {
  check(object(value) && keys(value, ['input', 'origin', 'source', 'explanation']) && object(value.input)
    && !Object.prototype.hasOwnProperty.call(value.input, 'additions') && ['recorded', 'declaredHypothesis'].includes(value.origin)
    && !hopSourceError(value.source) && text(value.explanation), 'Contexte du modèle absent ou confondu avec les ajouts prévus.');
  assertHopRecipeInput({ ...value.input, additions: [] });
}

function materialMap(materials: HopDecisionMaterial[]): Map<string, HopDecisionMaterial> {
  check(Array.isArray(materials), 'Matières absentes.');
  const map = new Map<string, HopDecisionMaterial>();
  for (const material of materials) {
    check(object(material) && text(material.id) && text(material.name) && !map.has(material.id), 'Identité de matière absente ou répétée.');
    map.set(material.id, material);
  }
  return map;
}

function triplet(material: HopDecisionMaterial, timing: HopTiming, grams: number, context: BrewingObservationModelContext,
  contactHours: number, temperatureC: number | null, matrixId: string | null) {
  const varietyId = material.variety?.id ?? material.lot?.varietyId ?? null;
  if (!varietyId || material.variety && material.lot && material.variety.id !== material.lot.varietyId) return null;
  const doseGL = grams / context.input.volumeL;
  if (!Number.isFinite(doseGL) || grams > 0 && doseGL === 0) return null;
  return { varietyId, lotId: material.lot?.id ?? null, yeastId: context.input.yeastId,
    timing, doseGL, contactHours, temperatureC, matrixId };
}

type PhysicalLotId = { status: 'unresolved' } | { status: 'identified'; id: string } | { status: 'invalid' };

/** New Context snapshots namespace lot IDs; unwrap only with its exact version and content hash. */
function physicalLotId(value: BrewingObservedKnownReferenceV1): PhysicalLotId {
  if (value.status !== 'identified') return { status: 'unresolved' };
  const identity = value.reference;
  if (identity.version !== 'snapshot-id-v1') return { status: 'identified', id: identity.id };
  const prefix = 'lot:';
  if (!identity.id.startsWith(prefix)) return { status: 'invalid' };
  const rawId = identity.id.slice(prefix.length);
  if (!rawId || identity.id !== `${prefix}${rawId}`
    || identity.contentReference !== hopAdviceContentReference('brewing-observed-physical-identity-v1', { kind: 'lot', id: rawId })) {
    return { status: 'invalid' };
  }
  return { status: 'identified', id: rawId };
}

function physicalLotMaterialIssue(factLot: BrewingObservedKnownReferenceV1, contactLot: BrewingObservedKnownReferenceV1,
  material: HopDecisionMaterial): { code: 'lotIdentityMismatch' | 'lotNotObserved'; message: string } | null {
  const sources = [physicalLotId(factLot), physicalLotId(contactLot)];
  if (sources.some(value => value.status === 'invalid')) return {
    code: 'lotIdentityMismatch', message: 'La référence de lot physique snapshot n’a pas son namespace ou son hash canonique.',
  };
  const physicalLotIds = sources.flatMap(value => value.status === 'identified' ? [value.id] : []);
  if (new Set(physicalLotIds).size > 1) return {
    code: 'lotIdentityMismatch', message: 'Le fait et le contact qualifient des lots physiques différents.',
  };
  const requiredLotId = physicalLotIds[0];
  if (requiredLotId && material.lot?.id !== requiredLotId) return {
    code: 'lotIdentityMismatch', message: `Le matériau de modèle ne porte pas le lot physique qualifié « ${requiredLotId} »; aucun lot voisin n’est substitué.`,
  };
  if (!requiredLotId && material.lot) return {
    code: 'lotNotObserved', message: 'Le fait et le contact ne qualifient aucun lot; le modèle doit rester au niveau variété.',
  };
  return null;
}

/** Physical facts, not a copied future recipe, supply mass and elapsed contact. */
export function buildBrewingObservedHopInput(request: BrewingObservedHopInputRequest): BrewingObservedHopInput {
  check(object(request) && keys(request, ['state', 'scope', 'context', 'bindings', 'materials']), 'Entrée physique hors contrat.');
  assertBrewingObservedState(request.state); assertContext(request.context);
  const { state, scope, context } = request;
  check(object(scope) && keys(scope, ['id', 'dependencyIds', 'fromAt', 'explanation']) && text(scope.id) && instant(scope.fromAt)
    && Date.parse(scope.fromAt) <= Date.parse(state.asOf) && text(scope.explanation) && Array.isArray(scope.dependencyIds)
    && scope.dependencyIds.length > 0 && scope.dependencyIds.every(text) && new Set(scope.dependencyIds).size === scope.dependencyIds.length,
  'Portée physique et période du modèle requises.');
  check(Array.isArray(request.bindings), 'Liens fait/contact absents.');
  const materials = materialMap(request.materials);
  const issues: BrewingObservedHopInput['issues'] = [], knownAdditions: HopRecipeInput['additions'] = [], used: BrewingObservedHopInput['used'] = [];
  const problem = (code: string, message: string, extra: { dependencyId?: string; reference?: string } = {}) => issues.push({ code, message, ...extra });
  for (const dependencyId of scope.dependencyIds) {
    const complete = state.coverage.some(row => row.dependencyId === dependencyId && row.status === 'complete'
      && Date.parse(row.fromAt) <= Date.parse(scope.fromAt) && Date.parse(row.throughAt) >= Date.parse(state.asOf)
      && state.coverageDispositions.some(disposition => disposition.id === row.id && disposition.version === row.version && disposition.disposition === 'applies'));
    if (!complete) problem('scopeNotComplete', 'Le passé de cette portée n’est pas déclaré complet ; aucun programme vide implicite.', { dependencyId });
  }
  const relevant = state.factDispositions.flatMap(disposition => {
    const fact = brewingObservedFactSource(state, disposition.reference);
    return fact && fact.kind === 'materialAdded' && scope.dependencyIds.includes(fact.dependencyId)
      && !['afterCutoff', 'notYetKnown', 'superseded', 'otherSubject'].includes(disposition.disposition) ? [{ fact, disposition }] : [];
  });
  const bindingFacts = new Set<string>(), additionIds = new Set<string>();
  for (const binding of request.bindings) {
    check(object(binding) && keys(binding, ['additionId', 'factReference', 'contactReference', 'materialId', 'timing', 'temperatureC', 'matrixId', 'explanation'])
      && text(binding.additionId) && text(binding.factReference) && text(binding.contactReference) && text(binding.materialId)
      && HOP_TIMINGS.includes(binding.timing) && (binding.temperatureC === null || finite(binding.temperatureC))
      && (binding.matrixId === null || text(binding.matrixId)) && text(binding.explanation)
      && !bindingFacts.has(binding.factReference) && !additionIds.has(binding.additionId), 'Lien physique répété ou incomplet.');
    bindingFacts.add(binding.factReference); additionIds.add(binding.additionId);
    const row = relevant.find(item => item.disposition.reference === binding.factReference);
    if (!row || row.disposition.disposition !== 'effective') {
      problem('factNotEffective', 'Le lien ne désigne pas un ajout réalisé qualifié avant la dégustation.', { reference: binding.factReference }); continue;
    }
    const fact = row.fact;
    if (Date.parse(fact.effectiveAt) < Date.parse(scope.fromAt)) {
      problem('scopeExcludesRealizedFact', 'La portée choisie commence après un ajout réalisé connu ; aucune omission silencieuse.', { reference: binding.factReference }); continue;
    }
    const material = materials.get(binding.materialId);
    if (!material || fact.material.status !== 'identified' || fact.material.reference.id !== material.id) {
      problem('materialNotLinked', 'La matière réalisée n’a pas ce lien explicite de catalogue ; aucun rapprochement par nom.', { reference: binding.factReference }); continue;
    }
    if (fact.quantity.status !== 'known') { problem('massUnknown', 'La masse réalisée est inconnue.', { reference: binding.factReference }); continue; }
    const massEvidence = readNativeMassInGrams(fact.quantity.value, fact.quantity.unit);
    if (massEvidence.status !== 'known') {
      problem('massUnitNotConvertible', massEvidence.issue.message, { reference: binding.factReference }); continue;
    }
    const grams = massEvidence.grams;
    const contact = state.contactStates.find(row => row.reference === binding.contactReference);
    const contactDisposition = state.contactDispositions.find(row => row.reference === binding.contactReference);
    const contactSource = contact && brewingObservedContactSource(state, contact.reference);
    if (!contact || !contactDisposition || !['active', 'ended'].includes(contact.status) || !finite(contact.elapsedSeconds)
      || contactDisposition?.disposition === 'otherSubject' || !contactSource || Date.parse(contactSource.started.effectiveAt) < Date.parse(fact.effectiveAt)
      || contact.material.status !== 'identified' || contact.material.reference.id !== material.id
      || fact.lot.status === 'identified' && contact.lot.status === 'identified' && fact.lot.reference.id !== contact.lot.reference.id) {
      problem('contactUnknown', 'Le contact réalisé ou sa continuité n’est pas qualifié pour cette matière.', { reference: binding.contactReference }); continue;
    }
    const lotIssue = physicalLotMaterialIssue(fact.lot, contact.lot, material);
    if (lotIssue) { problem(lotIssue.code, lotIssue.message, { reference: binding.factReference }); continue; }
    const elapsedHours = contact.elapsedSeconds / 3600;
    const modelTriplet = triplet(material, binding.timing, grams, context, elapsedHours, binding.temperatureC, binding.matrixId);
    if (!modelTriplet) { problem('catalogueOrDoseUnresolved', 'Identité variété/lot ou dose du modèle non résolue.', { reference: binding.factReference }); continue; }
    knownAdditions.push({ id: binding.additionId, name: material.name, triplet: modelTriplet });
    used.push({ additionId: binding.additionId, factReference: binding.factReference, contactReference: binding.contactReference,
      materialId: material.id, grams, massEvidence, elapsedHours, ended: contact.status === 'ended' });
  }
  for (const { disposition } of relevant) if (!bindingFacts.has(disposition.reference)) {
    problem('realizedFactUnbound', 'Un ajout de la portée demandée n’est pas représenté ; aucune masse réalisée omise.', { reference: disposition.reference });
  }
  const input = issues.length ? null : { ...structuredClone(context.input), additions: structuredClone(knownAdditions) };
  if (input) assertHopRecipeInput(input);
  const result: BrewingObservedHopInput = { format: 'brewing-observed-hop-input-v1', source: structuredClone(request),
    status: input ? 'available' : 'unknown', input, knownAdditions, used, issues, reference: '' };
  result.reference = hash('brewing-observed-hop-input-v1', withoutReference(result));
  return result;
}

export function assertBrewingObservedHopInput(value: unknown): asserts value is BrewingObservedHopInput {
  check(object(value) && keys(value, ['format', 'source', 'status', 'input', 'knownAdditions', 'used', 'issues', 'reference'])
    && value.format === 'brewing-observed-hop-input-v1' && text(value.reference), 'Entrée de modèle observé illisible.');
  // Recheck the deterministic adapter against frozen facts only, never resolve at the current time or run a model.
  const expected = buildBrewingObservedHopInput(value.source);
  check(value.reference === expected.reference && hash('brewing-observed-hop-input-v1', withoutReference(value as BrewingObservedHopInput)) === expected.reference,
    'L’entrée ne correspond pas à ses faits, liens et quantités figés.');
}

/** Keeps each realised dose once, then adds only the explicitly remaining future amount. */
export function buildBrewingObservationTarget(request: BrewingObservationTargetRequest): BrewingObservationTargetInput {
  check(object(request) && keys(request, ['current', 'future', 'contactTargets', 'horizon', 'explanation'])
    && Array.isArray(request.future) && Array.isArray(request.contactTargets) && text(request.explanation), 'Cible d’observation incomplète.');
  assertBrewingObservedHopInput(request.current);
  const horizon = request.horizon;
  check(object(horizon) && text(horizon.explanation) && (horizon.kind === 'instant'
    ? keys(horizon, ['kind', 'at', 'explanation']) && instant(horizon.at)
    : horizon.kind === 'relative' && keys(horizon, ['kind', 'eventReference', 'durationHours', 'explanation'])
      && text(horizon.eventReference) && finite(horizon.durationHours) && horizon.durationHours >= 0), 'Horizon explicite requis.');
  const issues = structuredClone(request.current.issues), remaining: BrewingObservationTargetInput['remaining'] = [];
  const problem = (code: string, message: string, reference?: string) => issues.push({ code, message, ...(reference ? { reference } : {}) });
  const currentAt = Date.parse(request.current.source.state.asOf);
  let horizonAt: number | null = horizon.kind === 'instant' ? Date.parse(horizon.at) : null;
  let relativeFutureEvent: string | null = null;
  if (horizon.kind === 'relative') {
    const state = request.current.source.state;
    let eventAt: number | null = null;
    if ([state.physicalStateReference, state.resolutionReference].includes(horizon.eventReference)) eventAt = currentAt;
    else {
      const fact = state.factDispositions.find(row => row.reference === horizon.eventReference && row.disposition === 'effective');
      const source = fact && brewingObservedFactSource(state, fact.reference);
      if (source) eventAt = Date.parse(source.effectiveAt);
      else if (request.future.some(row => row.id === horizon.eventReference)) relativeFutureEvent = horizon.eventReference;
      else problem('horizonEventUnknown', 'L’événement de référence de l’horizon n’est ni identifié dans le réalisé ni déclaré dans le futur.');
    }
    if (eventAt !== null) {
      const candidate = eventAt + horizon.durationHours * 3600000;
      if (!finite(candidate)) problem('horizonNotRepresentable', 'L’instant dérivé de l’horizon n’est pas représentable.');
      else horizonAt = candidate;
    }
  }
  if (horizonAt !== null && horizonAt < currentAt) problem('horizonBeforeCurrent', 'La cible précède l’état réalisé actuel.');
  const input = request.current.input ? structuredClone(request.current.input) : null;
  const materials = materialMap(request.current.source.materials), contactIds = new Set<string>(), futureIds = new Set<string>(), allocatedFacts = new Set<string>();
  for (const target of request.contactTargets) {
    check(object(target) && keys(target, ['additionId', 'contactHours', 'explanation']) && text(target.additionId)
      && finite(target.contactHours) && target.contactHours >= 0 && text(target.explanation) && !contactIds.has(target.additionId), 'Cible de contact invalide ou répétée.');
    contactIds.add(target.additionId);
    const actual = request.current.used.find(row => row.additionId === target.additionId);
    const addition = input?.additions.find(row => row.id === target.additionId);
    if (!actual || !addition) { problem('contactTargetMissing', 'Le contact cible n’appartient pas au préfixe réalisé.', target.additionId); continue; }
    if (target.contactHours < actual.elapsedHours || actual.ended && target.contactHours !== actual.elapsedHours) {
      problem('realizedContactChanged', 'La durée cible ne réduit pas l’écoulé réel et ne prolonge pas un contact déjà terminé.', target.additionId); continue;
    }
    const contact = request.current.source.state.contactStates.find(row => row.reference === actual.contactReference);
    const contactDisposition = request.current.source.state.contactDispositions.find(row => row.reference === actual.contactReference);
    const source = contact && brewingObservedContactSource(request.current.source.state, contact.reference);
    if (!contactDisposition || contactDisposition.disposition === 'otherSubject' || !source) {
      problem('contactTargetMissing', 'Le contact cible n’a pas de source documentaire exacte pour cet état.', actual.additionId); continue;
    }
    if (!actual.ended && horizonAt !== null && source && target.contactHours > (horizonAt - Date.parse(source.started.effectiveAt)) / 3600000) {
      problem('contactBeyondHorizon', 'Le contact cible dépasse le temps disponible jusqu’à l’horizon.', target.additionId); continue;
    }
    addition.triplet.contactHours = target.contactHours;
  }
  if (horizonAt === null || horizonAt > currentAt) for (const actual of request.current.used) {
    if (!actual.ended && !contactIds.has(actual.additionId)) problem('activeContactFutureUnspecified',
      'Déclarer la durée évaluée de ce contact actif : ni arrêt ni poursuite jusqu’à l’horizon ne sont implicites.', actual.additionId);
  }
  for (const future of request.future) {
    check(object(future) && keys(future, ['id', 'materialId', 'timing', 'contactHours', 'temperatureC', 'matrixId', 'quantity', 'explanation'])
      && text(future.id) && text(future.materialId) && !futureIds.has(future.id) && !request.current.knownAdditions.some(row => row.id === future.id)
      && HOP_TIMINGS.includes(future.timing) && finite(future.contactHours) && future.contactHours >= 0
      && (future.temperatureC === null || finite(future.temperatureC)) && (future.matrixId === null || text(future.matrixId))
      && text(future.explanation) && object(future.quantity) && finite(future.quantity.grams) && future.quantity.grams >= 0,
    'Ajout futur explicite invalide ou identifiant réalisé réutilisé.');
    futureIds.add(future.id);
    if (horizonAt !== null && future.contactHours > (horizonAt - currentAt) / 3600000
      || horizon.kind === 'relative' && relativeFutureEvent === future.id && future.contactHours > horizon.durationHours) {
      problem('futureContactBeyondHorizon', 'Un ajout encore prévu ne peut pas avoir ce contact écoulé à l’horizon choisi.', future.id);
    }
    const quantity = future.quantity;
    check(quantity.kind === 'remaining' ? keys(quantity, ['kind', 'grams'])
      : quantity.kind === 'totalIncludingRealized' && keys(quantity, ['kind', 'grams', 'realizedFactReferences'])
        && Array.isArray(quantity.realizedFactReferences) && quantity.realizedFactReferences.every(text)
        && new Set(quantity.realizedFactReferences).size === quantity.realizedFactReferences.length, 'Sens de quantité future non déclaré.');
    const refs = quantity.kind === 'totalIncludingRealized' ? quantity.realizedFactReferences : [];
    const realizedQuantities: Array<{ value: unknown; unit: unknown }> = [];
    let invalid = false;
    for (const reference of refs) {
      const actual = request.current.used.find(row => row.factReference === reference);
      if (!actual || actual.materialId !== future.materialId || allocatedFacts.has(reference)) {
        problem('realizedAllocationInvalid', 'La réalisation déduite manque, appartient à une autre matière ou est comptée deux fois.', reference); invalid = true; continue;
      }
      allocatedFacts.add(reference); realizedQuantities.push(actual.massEvidence.source);
    }
    const arithmetic = subtractNativeMassesFromGrams(quantity.grams, realizedQuantities);
    const grams = arithmetic.remainingGrams;
    remaining.push({ additionId: future.id, plannedGrams: quantity.grams, realizedGrams: arithmetic.realizedGrams,
      remainingGrams: grams, deficitGrams: arithmetic.deficitGrams, arithmetic, realizedFactReferences: [...refs] });
    if (invalid || arithmetic.status === 'unknown' || arithmetic.status === 'deficit' || grams === null) {
      problem(arithmetic.status === 'unknown' ? 'futureQuantityNotRepresentable' : 'futureTotalBelowRealized',
        arithmetic.status === 'unknown' ? arithmetic.issues.map(issue => issue.message).join(' ') : 'La quantité cible ne peut pas retirer une masse déjà réalisée.', future.id); continue;
    }
    if (grams === 0) continue;
    const material = materials.get(future.materialId);
    const modelTriplet = material ? triplet(material, future.timing, grams, request.current.source.context, future.contactHours, future.temperatureC, future.matrixId) : null;
    if (!material || !modelTriplet) { problem('futureMaterialUnresolved', 'La matière prévue ne fournit pas une identité/dose calculable.', future.id); continue; }
    input?.additions.push({ id: future.id, name: material.name, triplet: modelTriplet });
  }
  if (input) assertHopRecipeInput(input);
  const result: BrewingObservationTargetInput = { format: 'brewing-observation-target-input-v1', source: structuredClone(request),
    status: input && !issues.length ? 'available' : 'unknown', input: input && !issues.length ? input : null, remaining, issues, reference: '' };
  result.reference = hash('brewing-observation-target-input-v1', withoutReference(result));
  return result;
}

export function assertBrewingObservationTargetInput(value: unknown): asserts value is BrewingObservationTargetInput {
  check(object(value) && keys(value, ['format', 'source', 'status', 'input', 'remaining', 'issues', 'reference'])
    && value.format === 'brewing-observation-target-input-v1' && text(value.reference), 'Cible archivée illisible.');
  const expected = buildBrewingObservationTarget(value.source);
  check(value.reference === expected.reference && hash('brewing-observation-target-input-v1', withoutReference(value as BrewingObservationTargetInput)) === expected.reference,
    'La cible ne correspond plus aux quantités réalisées/prévues et horizons figés.');
}
