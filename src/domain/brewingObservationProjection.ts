import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import { hopSourceError } from '../../functions/src/hopIndexSchema';
import { assertBrewingNuancePlan, projectBrewingNuances, readBrewingNuanceProjection,
  type BrewingNuancePlan, type BrewingNuanceProjection } from './brewingNuanceProjection';
import { assertBrewingObservationAnchor, type BrewingObservationAnchor } from './brewingObservationAnchor';
import { assessBrewingObservedStateApplicability, brewingObservedFactPhysicalReference, brewingObservedFactSource,
  type BrewingObservedStateApplicabilityV1 } from './brewingObservedState';
import { assertBrewingObservedHopInput, assertBrewingObservationTargetInput,
  type BrewingObservedHopInput, type BrewingObservationTargetInput } from './brewingObservationInputs';
import { qualifyBrewingObservationNumerics, assertBrewingObservationArithmeticContract,
  type BrewingObservationArithmeticContract, type BrewingObservationNumericalQualification } from './brewingObservationNumerics';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import { encodeBrewingScenarioArchive, decodeBrewingScenarioArchive, type BrewingScenarioArchive } from './brewingScenarioArchive';

export interface BrewingObservationRestStability {
  status: 'adopted' | 'notEstablished';
  explanation: string;
  conditions: Array<{ id: string; status: 'declaredCompatible' | 'unknown' | 'changed'; explanation: string; sourceRefs: HopSource[] }>;
  adoptedAt?: string;
  adoptedBy?: { origin: 'user' | 'assistant' | 'model'; name: string };
}

export interface BrewingObservationProjectionRequest {
  id: string;
  anchor: BrewingObservationAnchor;
  observedInput: BrewingObservedHopInput;
  targetInput: BrewingObservationTargetInput;
  frames: Array<{ id: string; name: string; plan: BrewingNuancePlan }>;
  arithmetic: BrewingObservationArithmeticContract;
  restStability: BrewingObservationRestStability;
  createdAt: string;
  createdBy: { origin: 'user' | 'assistant' | 'model'; name: string };
}

export interface BrewingObservationProjectionFrame {
  id: string;
  name: string;
  planReference: string;
  status: 'projected' | 'outOfDomain' | 'nonComparable' | 'unknown';
  modelPair: BrewingNuanceProjection | null;
  modelReference: string | null;
  /** Inventory of declared centrals. Actual use is retained in each modelPair candidate. */
  declaredCentrals: Array<{ path: string; value: number; source: HopSource | null }>;
  observedCentral: number | null;
  targetCentral: number | null;
  delta: number | null;
  rawProjection: number | HopRange | null;
  issues: Array<{ code: string; message: string }>;
  limitations: string[];
}

export interface BrewingObservationProjection {
  format: 'brewing-observation-projection-v1';
  method: 'paired-nominal-nuance-v1';
  requestSnapshot: BrewingObservationProjectionRequest;
  questionReference: string;
  numerical: BrewingObservationNumericalQualification;
  anchorApplicability: BrewingObservedStateApplicabilityV1;
  currentApplicability: BrewingObservedStateApplicabilityV1;
  frames: BrewingObservationProjectionFrame[];
  limitations: string[];
  reference: string;
}

const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const instant = (v: unknown) => text(v) && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
const keys = (v: Record<string, any>, allowed: string[]) => Object.keys(v).every(key => allowed.includes(key));
const check: (v: unknown, message: string) => asserts v = (v, message) => { if (!v) throw Error(message); };
const hash = (kind: string, value: unknown) => hopAdviceContentReference(kind, value);
const same = (a: unknown, b: unknown) => hash('brewing-observation-value-v1', a) === hash('brewing-observation-value-v1', b);
const actor = (v: unknown) => object(v) && keys(v, ['origin', 'name']) && ['user', 'assistant', 'model'].includes(v.origin) && text(v.name);

function assertRequest(value: unknown): asserts value is BrewingObservationProjectionRequest {
  check(object(value) && keys(value, ['id', 'anchor', 'observedInput', 'targetInput', 'frames', 'arithmetic', 'restStability', 'createdAt', 'createdBy'])
    && text(value.id) && instant(value.createdAt) && actor(value.createdBy) && Array.isArray(value.frames) && value.frames.length > 0,
  'Demande de projection ancrée incomplète.');
  assertBrewingObservationAnchor(value.anchor); assertBrewingObservedHopInput(value.observedInput);
  assertBrewingObservationTargetInput(value.targetInput); assertBrewingObservationArithmeticContract(value.arithmetic);
  check(value.anchor.observedState.resolutionReference === value.observedInput.source.state.resolutionReference,
    'L’entrée observée n’appartient pas à l’état figé avec la note.');
  const ids = new Set<string>();
  for (const frame of value.frames) {
    check(object(frame) && keys(frame, ['id', 'name', 'plan']) && text(frame.id) && text(frame.name) && !ids.has(frame.id), 'Cadre nominal absent ou répété.');
    ids.add(frame.id); assertBrewingNuancePlan(frame.plan);
    check(frame.plan.status === 'adopted', 'Adopter le cadre de travail avant le calcul ancré.');
  }
  const rest = value.restStability;
  check(object(rest) && keys(rest, ['status', 'explanation', 'conditions', 'adoptedAt', 'adoptedBy'])
    && ['adopted', 'notEstablished'].includes(rest.status) && text(rest.explanation) && Array.isArray(rest.conditions), 'Portée de stabilité du reste absente.');
  const conditionIds = new Set<string>();
  for (const condition of rest.conditions) {
    check(object(condition) && keys(condition, ['id', 'status', 'explanation', 'sourceRefs']) && text(condition.id) && !conditionIds.has(condition.id)
      && ['declaredCompatible', 'unknown', 'changed'].includes(condition.status) && text(condition.explanation)
      && Array.isArray(condition.sourceRefs) && condition.sourceRefs.every((source: unknown) => !hopSourceError(source)), 'Condition de stabilité invalide.');
    conditionIds.add(condition.id);
  }
  check(rest.status !== 'adopted' || instant(rest.adoptedAt) && actor(rest.adoptedBy) && rest.conditions.length > 0, 'Adoption de stabilité non attribuée ou vide.');
}

function declaredCentrals(model: unknown): BrewingObservationProjectionFrame['declaredCentrals'] {
  const rows: BrewingObservationProjectionFrame['declaredCentrals'] = [];
  const visit = (value: unknown, path: string, inherited: HopSource | null) => {
    if (Array.isArray(value)) { value.forEach((child, index) => visit(child, path ? `${path}.${index}` : String(index), inherited)); return; }
    if (!object(value)) return;
    const source = value.source && !hopSourceError(value.source) ? value.source : inherited;
    if (finite(value.central)) rows.push({ path: path ? `${path}.central` : 'central', value: value.central, source: structuredClone(source) });
    for (const [key, child] of Object.entries(value)) if (key !== 'source') visit(child, path ? `${path}.${key}` : key, source);
  };
  visit(model, '', null); return rows;
}

function commonDependencyMismatch(a: HopEngineData, b: HopEngineData): string[] {
  const records = (data: HopEngineData) => {
    const rows = new Map<string, string[]>();
    for (const [kind, values] of [['variety', data.varieties], ['lot', data.lots], ['knowledge', data.knowledge]] as const) {
      for (const value of values) {
        const key = `${kind}:${'kind' in value ? value.kind : ''}:${value.id}`;
        rows.set(key, [...(rows.get(key) ?? []), hash('brewing-observation-dependency-v1', value)].sort());
      }
    }
    return rows;
  };
  const before = records(a), after = records(b);
  return [...before.keys()].filter(key => after.has(key) && !same(before.get(key), after.get(key)));
}

function samePhysicalSubject(request: BrewingObservationProjectionRequest): boolean {
  const before = request.anchor.observedState.subject, after = request.targetInput.source.current.source.state.subject;
  return same(before.identity, after.identity)
    || before.kind === 'sample' && before.sourceBeer !== null && after.kind === 'beer' && same(before.sourceBeer, after.identity);
}

/** A pair must cover the same programme and extend its realised prefix, not reinterpret or erase it. */
function transitionIssues(request: BrewingObservationProjectionRequest): BrewingObservationProjectionFrame['issues'] {
  const issues: BrewingObservationProjectionFrame['issues'] = [];
  const issue = (code: string, message: string) => issues.push({ code, message });
  const before = request.observedInput, after = request.targetInput.source.current;
  const anchorState = before.source.state, currentState = after.source.state;
  const currentAt = Date.parse(currentState.asOf);
  const observedAt = Math.max(Date.parse(request.anchor.observation.observedAt), Date.parse(anchorState.asOf));
  const horizon = request.targetInput.source.horizon;
  let horizonAt: number | null = horizon.kind === 'instant' ? Date.parse(horizon.at) : null;
  let horizonLowerBound: number | null = null;
  if (horizon.kind === 'relative') {
    if ([currentState.physicalStateReference, currentState.resolutionReference].includes(horizon.eventReference)) {
      horizonAt = currentAt + horizon.durationHours * 3600000;
    } else {
      const disposition = currentState.factDispositions.find(row => row.reference === horizon.eventReference && row.disposition === 'effective');
      const fact = disposition && brewingObservedFactSource(currentState, disposition.reference);
      if (fact) horizonAt = Date.parse(fact.effectiveAt) + horizon.durationHours * 3600000;
      else if (request.targetInput.source.future.some(row => row.id === horizon.eventReference)) {
        // A future operation has no date yet, but cannot precede the realised current state.
        horizonLowerBound = currentAt + horizon.durationHours * 3600000;
      }
    }
  }
  if (horizonAt !== null && horizonAt < observedAt) {
    issue('horizonBeforeObservation', 'La cible précède la dégustation ou son prélèvement ; elle ne peut pas être projetée comme leur futur.');
  } else if (horizonAt === null && (horizonLowerBound === null || horizonLowerBound < observedAt)) {
    issue('horizonOrderUnknown', 'L’événement relatif ne garantit pas encore un horizon après la dégustation ; son ordre doit être qualifié.');
  }
  if (currentAt < Date.parse(anchorState.asOf)) {
    issue('currentStateBeforeAnchor', 'Le préfixe courant précède l’état dégusté ; une ancienne coupe ne remplace pas le réalisé connu à l’ancre.');
  }
  if (Date.parse(before.source.scope.fromAt) !== Date.parse(after.source.scope.fromAt)
    || !same([...before.source.scope.dependencyIds].sort(), [...after.source.scope.dependencyIds].sort())) {
    issue('physicalScopeMismatch', 'Les deux calculs ne couvrent pas le même périmètre physique et la même période ; aucune omission du programme observé.');
  }
  const sourceFact = (input: BrewingObservedHopInput, reference: string) => {
    const disposition = input.source.state.factDispositions.find(row => row.reference === reference && row.disposition === 'effective');
    return disposition && brewingObservedFactSource(input.source.state, disposition.reference);
  };
  for (const used of before.used) {
    const fact = sourceFact(before, used.factReference);
    const nextUsed = fact && after.used.find(row => {
      const candidate = sourceFact(after, row.factReference);
      return candidate?.id === fact.id && same(candidate.subjectReference, fact.subjectReference);
    });
    if (!fact || !nextUsed) {
      issue('realizedPrefixMissing', 'Un fait réalisé de l’ancre manque au préfixe courant ; ni omission ni retrait physique ne sont implicites.'); continue;
    }
    const nextFact = sourceFact(after, nextUsed.factReference)!;
    if (fact.dependencyId !== nextFact.dependencyId
      || brewingObservedFactPhysicalReference(fact) !== brewingObservedFactPhysicalReference(nextFact)) {
      issue('realizedPrefixChanged', 'Le contenu physique d’un fait de l’ancre a été corrigé ; requalifier cette ancre avant de projeter sa note.');
    }
    const oldTriplet = before.input?.additions.find(row => row.id === used.additionId)?.triplet;
    const newTriplet = after.input?.additions.find(row => row.id === nextUsed.additionId)?.triplet;
    if (oldTriplet && newTriplet) {
      const { contactHours: _oldContact, ...oldFixed } = oldTriplet;
      const { contactHours: _newContact, ...newFixed } = newTriplet;
      if (used.materialId !== nextUsed.materialId || !same(oldFixed, newFixed)) {
        issue('realizedBindingChanged', 'Le même fait passé n’a plus les mêmes conditions ou liens de modèle ; ce changement n’est pas un ajout futur.');
      }
    }
    const oldContact = anchorState.contactStates.find(row => row.reference === used.contactReference);
    const newContact = currentState.contactStates.find(row => row.reference === nextUsed.contactReference);
    if (!oldContact || !newContact || oldContact.id !== newContact.id || Date.parse(oldContact.startedAt) !== Date.parse(newContact.startedAt)
      || oldContact.dependencyId !== newContact.dependencyId || !same(oldContact.material, newContact.material) || !same(oldContact.lot, newContact.lot)
      || nextUsed.elapsedHours < used.elapsedHours || used.ended && (!nextUsed.ended || nextUsed.elapsedHours !== used.elapsedHours)) {
      issue('realizedContactChanged', 'La continuité du contact passé n’est pas conservée : début, matière, écoulé ou fin déjà réalisée ont changé.');
    }
  }
  for (const used of after.used) {
    const fact = sourceFact(after, used.factReference);
    const wasKnown = fact && before.used.some(row => {
      const candidate = sourceFact(before, row.factReference);
      return candidate?.id === fact.id && same(candidate.subjectReference, fact.subjectReference);
    });
    if (fact && !wasKnown && Date.parse(fact.effectiveAt) <= Date.parse(anchorState.asOf)) {
      issue('realizedPastDiscovered', 'Un fait déjà réalisé à l’instant de l’ancre a été découvert plus tard ; il ne devient pas un ajout postérieur à la note. Requalifier l’état dégusté.');
    }
  }
  return issues;
}

export function brewingObservationProjectionReference(value: BrewingObservationProjection): string {
  const { reference: _reference, ...body } = value;
  return hash('brewing-observation-projection-v1', body);
}

/** A finite set of explicitly adopted nominal scenarios, not an uncertainty distribution. */
export function projectBrewingObservation(request: BrewingObservationProjectionRequest, data: HopEngineData): BrewingObservationProjection {
  assertRequest(request);
  const snapshot = structuredClone(request);
  const numerical = qualifyBrewingObservationNumerics(snapshot.anchor.observation, snapshot.arithmetic);
  const observation = snapshot.anchor.observation;
  const dimension = observation.dimension.status === 'resolved' ? { status: 'resolved' as const,
    id: observation.dimension.definition.dimension.id, version: observation.dimension.definition.dimension.version }
    : { status: 'unresolved' as const, label: observation.dimension.label };
  const anchorForAssessment = { observationReference: { id: observation.id, version: String(observation.version), contentReference: snapshot.anchor.observationReference },
    observedAt: observation.observedAt, state: snapshot.anchor.observedState, dimension };
  const anchorApplicability = assessBrewingObservedStateApplicability({ use: 'projectFuture', anchor: anchorForAssessment,
    requiredDependencyIds: snapshot.observedInput.source.scope.dependencyIds });
  const currentApplicability = assessBrewingObservedStateApplicability({ use: 'describeCurrent', anchor: anchorForAssessment,
    evaluationState: snapshot.targetInput.source.current.source.state, requiredDependencyIds: snapshot.observedInput.source.scope.dependencyIds });
  const transition = transitionIssues(snapshot);
  const frames = snapshot.frames.map(frame => {
    const result: BrewingObservationProjectionFrame = { id: frame.id, name: frame.name, planReference: frame.plan.reference,
      status: 'unknown', modelPair: null, modelReference: null, declaredCentrals: [], observedCentral: null, targetCentral: null, delta: null, rawProjection: null,
      issues: [], limitations: ['Sensibilité nominale sous hypothèses adoptées, pas mesure, moyenne attendue ou intervalle statistique.',
        'Écart du programme modélisé entier ; pas une contribution isolée ni une validation des interactions de mélange.'] };
    const issue = (code: string, message: string) => result.issues.push({ code, message });
    if (transition.length) { result.issues.push(...structuredClone(transition)); return result; }
    if (!snapshot.observedInput.input || !snapshot.targetInput.input) {
      issue('physicalInputUnknown', 'Une entrée physique nécessaire reste inconnue ; aucun ajout fictif ou zéro de remplacement.'); return result;
    }
    if (!same(snapshot.observedInput.source.context.input, snapshot.targetInput.source.current.source.context.input)) {
      issue('contextChangeOutsideInitialDomain', 'La première voie porte sur le programme de houblon sous un contexte commun ; dilution/culture/contexte modifiés restent à qualifier.'); return result;
    }
    if (!frame.plan.definitions.some(definition => definition.contentReference === snapshot.arithmetic.definition.contentReference)) {
      issue('modelDefinitionMismatch', 'Le cadre ne produit pas la définition sensorielle exacte du contrat numérique.'); return result;
    }
    try {
      const pair = projectBrewingNuances(frame.plan, [
        { id: 'observed', name: 'État réellement dégusté', input: snapshot.observedInput.input, sourceReference: snapshot.observedInput.reference },
        { id: 'target', name: 'État cible au terme déclaré', input: snapshot.targetInput.input, sourceReference: snapshot.targetInput.reference },
      ], data);
      result.modelPair = pair;
      const [before, after] = pair.candidates;
      result.declaredCentrals = declaredCentrals(before.modelSnapshot);
      result.modelReference = hash('brewing-observation-coupled-model-v1', before.modelSnapshot);
      if (!same(before.modelSnapshot, after.modelSnapshot) || commonDependencyMismatch(before.dependencySnapshot, after.dependencySnapshot).length) {
        issue('uncoupledDependencies', 'Les paramètres ou dépendances communs ne sont pas identiques entre les deux états.'); return result;
      }
      const definitionRef = snapshot.arithmetic.definition.contentReference;
      const a = before.values.find(row => row.definition.contentReference === definitionRef)?.estimate?.central;
      const b = after.values.find(row => row.definition.contentReference === definitionRef)?.estimate?.central;
      result.observedCentral = finite(a) ? a : null; result.targetCentral = finite(b) ? b : null;
      if (!finite(a) || !finite(b)) { issue('centralMissing', 'Au moins une centrale nécessaire manque ; aucune moyenne de plage ou valeur zéro substituée.'); return result; }
      if (same(before.requestedInputSnapshot, after.requestedInputSnapshot) && a !== b) {
        issue('identicalInputMismatch', 'Deux entrées identiques ne donnent pas exactement la même centrale ; aucune tolérance ajoutée.'); return result;
      }
      result.delta = b - a;
      if (!finite(result.delta)) { result.delta = null; issue('nonFiniteDelta', 'La différence n’est pas représentable.'); return result; }
      if (snapshot.anchor.subjectRelation !== 'sameSubject' || !samePhysicalSubject(snapshot)) issue('subjectNotFactuallyLinked', 'Une analogie ou un autre lot ne devient pas une observation de cette bière.');
      if (['historical', 'continuityUnknown', 'unknown', 'conflicting', 'differentSubject'].includes(anchorApplicability.status)) issue('anchorNotApplicable', 'L’état ou la continuité de la note ne fournit pas cet ancrage ; faits et delta restent conservés.');
      if (numerical.status !== 'comparable') issue('numericallyNonComparable', 'La note et l’indice ne sont pas numériquement comparables sous ce contrat.');
      if (snapshot.restStability.status !== 'adopted' || snapshot.restStability.conditions.some(row => row.status !== 'declaredCompatible')) {
        issue('restStabilityNotEstablished', 'La stabilité du reste non modélisé n’est pas établie par une hypothèse adoptée ; seul le delta partiel est disponible.');
      }
      if (result.issues.length || numerical.status !== 'comparable') { result.status = 'nonComparable'; return result; }
      const value = numerical.observationValue;
      result.rawProjection = typeof value === 'number' ? value + result.delta : { min: value.min + result.delta, max: value.max + result.delta };
      const bounds = typeof result.rawProjection === 'number' ? { min: result.rawProjection, max: result.rawProjection } : result.rawProjection;
      const domain = snapshot.arithmetic.definition.scale?.domain;
      if (!finite(bounds.min) || !finite(bounds.max)) { result.rawProjection = null; issue('nonFiniteProjection', 'Projection non représentable.'); return result; }
      if (domain && (bounds.min < domain.min || bounds.max > domain.max)) {
        result.status = 'outOfDomain'; issue('projectionOutsideScale', 'Valeur brute hors domaine conservée, sans écrêtage ni cellule numérique valide fabriquée.');
      } else result.status = 'projected';
      return result;
    } catch (error) {
      issue('modelNotCalculable', error instanceof Error ? error.message : 'Le modèle ne calcule pas ce cadre.'); return result;
    }
  });
  const value: BrewingObservationProjection = { format: 'brewing-observation-projection-v1', method: 'paired-nominal-nuance-v1',
    requestSnapshot: snapshot, questionReference: hash('brewing-observation-question-v1', snapshot), numerical, anchorApplicability, currentApplicability, frames,
    limitations: ['Chaque cadre est un scénario explicitement retenu ; aucune couverture de toute l’incertitude n’est revendiquée.',
      'La note d’origine, les entrées demandées/consommées et les cadres non calculables restent archivés.',
      'L’inventaire des centrales déclarées ne prouve pas leur usage ; les candidats conservent les choix appliqués/non appliqués et leurs dépendances effectives.',
      ...numerical.limitations], reference: '' };
  value.reference = brewingObservationProjectionReference(value);
  return value;
}

/** Read-only integrity check. No model, present-time resolution or archive migration. */
export function readBrewingObservationProjection(value: unknown):
  | { status: 'readOnly'; projection: BrewingObservationProjection }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  check(object(value) && text(value.format), 'Projection d’observation illisible.');
  if (value.format !== 'brewing-observation-projection-v1') return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format de projection conservé sans recalcul.' };
  check(keys(value, ['format', 'method', 'requestSnapshot', 'questionReference', 'numerical', 'anchorApplicability', 'currentApplicability', 'frames', 'limitations', 'reference'])
    && value.method === 'paired-nominal-nuance-v1' && text(value.reference) && Array.isArray(value.frames) && Array.isArray(value.limitations), 'Projection d’observation incomplète.');
  const projection = value as BrewingObservationProjection;
  check(projection.reference === brewingObservationProjectionReference(projection), 'La projection ne correspond plus à son contenu figé.');
  check(projection.questionReference === hash('brewing-observation-question-v1', projection.requestSnapshot), 'La question archivée a changé.');
  assertBrewingObservationAnchor(projection.requestSnapshot.anchor);
  check(projection.frames.length === projection.requestSnapshot.frames.length, 'Cadres archivés incomplets.');
  for (const [index, frame] of projection.frames.entries()) {
    check(frame.id === projection.requestSnapshot.frames[index].id && frame.planReference === projection.requestSnapshot.frames[index].plan.reference,
      'Identité du cadre archivé incohérente.');
    if (frame.modelPair) {
      const read = readBrewingNuanceProjection(frame.modelPair);
      if ('status' in read) return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Projection de modèle future conservée sans recalcul.' };
    }
  }
  return { status: 'readOnly', projection: structuredClone(projection) };
}

export interface BrewingObservationProjectionArchive {
  format: 'brewing-observation-projection-archive-v1';
  projectionReference: string;
  archive: BrewingScenarioArchive;
}
export function archiveBrewingObservationProjection(projection: BrewingObservationProjection): BrewingObservationProjectionArchive {
  const read = readBrewingObservationProjection(projection);
  check(read.status === 'readOnly', 'Un format futur ne peut pas être réenregistré comme nouveau résultat.');
  return { format: 'brewing-observation-projection-archive-v1', projectionReference: projection.reference, archive: encodeBrewingScenarioArchive(projection) };
}
export function readBrewingObservationProjectionArchive(value: unknown): ReturnType<typeof readBrewingObservationProjection> {
  check(object(value) && keys(value, ['format', 'projectionReference', 'archive']) && value.format === 'brewing-observation-projection-archive-v1'
    && text(value.projectionReference), 'Archive d’ancrage invalide ; ce n’est pas un reçu J5.');
  const decoded = decodeBrewingScenarioArchive(value.archive);
  check(object(decoded) && decoded.reference === value.projectionReference, 'L’archive ne correspond pas à sa référence.');
  return readBrewingObservationProjection(decoded);
}
