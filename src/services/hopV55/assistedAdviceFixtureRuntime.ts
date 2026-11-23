import { brewerAdviceFromHopProposal, createBrewerHopAdviceProposalEnvelope, stableBrewerHopAdviceJson,
  type BrewerHopAdviceEvidenceSource, type BrewerHopAdviceRequest } from '../../../functions/src/brewerHopAdviceProposal';
import { HOP_ADVICE_PROTOCOL_V1 } from '../../../functions/src/brewerHopAdviceTransportV1';
import { mapBrewerHopAdviceLaunchSourceToScopeV1 } from '../../../functions/src/brewerHopAdviceContextBinding';
import type { BrewerChatInput, BrewerReply, BrewerScope, BrewerTurn } from '../../../functions/src/companionTypes';
import { runBrewerTool } from '../../domain/brewerTools';
import { prepareBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { readHopV55Question } from './decision';
import { readHopV55QuestionScopeDraftsV1 } from './questionScopeReading';
import { buildHopV55AssistedAdviceRequest } from './assistedAdviceProposal';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';
import type { HopV55AssistedCompanionSession } from '../../ui/hopV55/assistedAdviceUiContracts';
import type { BrewerChatAssistedRuntime, BrewerChatJobActivity } from '../../ui/BrewerChat';
import type { ClientBrewerJob } from '../brewerJobs';

export type HopV55AssistedAdviceFixtureDelay = 'immediate' | 'manual';

const COLD_DOSE_G_L = 3.86;
const COLD_EVIDENCE_ID = 'E-assistant-fixture-cold-contact';

function exactScope(left: BrewerScope, right: { kind: BrewerScope['kind']; id: string }): boolean {
  return left.kind === right.kind && left.id === right.id;
}

function matchesWireSourceFields(chatInput: BrewerChatInput, request: BrewerHopAdviceRequest): boolean {
  const scope = request.contextLaunch.scope;
  if (scope.kind !== 'draft' && Object.prototype.hasOwnProperty.call(chatInput, 'draft')) return false;
  if (scope.kind !== 'batch' && Object.prototype.hasOwnProperty.call(chatInput, 'localJournal')) return false;
  try {
    const mapped = mapBrewerHopAdviceLaunchSourceToScopeV1(request.contextLaunch.ownerKey,
      request.contextLaunch.workspaceId, request.contextLaunch.source);
    return exactScope(mapped, scope);
  } catch {
    return false;
  }
}

function storageKey(namespace: string, scope: BrewerScope): string {
  return `${namespace}:${scope.kind}:${encodeURIComponent(scope.id)}:jobs`;
}

function asJob(value: unknown): ClientBrewerJob | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Partial<ClientBrewerJob>;
  if (typeof row.operationId !== 'string' || typeof row.question !== 'string' || !row.scope?.id
    || typeof row.createdAt !== 'number' || typeof row.generation !== 'number') return undefined;
  return row as ClientBrewerJob;
}

function simulatedRaw(request: BrewerHopAdviceRequest, context: HopV55AssistedCompanionSession['context']) {
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(request.question, prepared);
  const scopeDrafts = readHopV55QuestionScopeDraftsV1({ question: request.question, reading });
  const rebuilt = buildHopV55AssistedAdviceRequest({ reading, sourceReadingReference: request.sourceReadingReference,
    scopeDrafts, contextLaunch: request.contextLaunch });
  if (stableBrewerHopAdviceJson(rebuilt) !== stableBrewerHopAdviceJson(request)) {
    throw new Error('La réponse fixture exige la lecture locale canonique exacte de la question et de ses portées.');
  }
  const baseline = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'assistantFixture-baseline',
    ownerKey: request.contextLaunch.ownerKey, workspaceId: request.contextLaunch.workspaceId,
    sourceReadingReference: request.sourceReadingReference,
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière n’a encore été choisie dans cette fixture.' } })
    .requestSnapshot.propertyIntents;
  const selected = reading.criterionDrafts
    .filter(annotation => annotation.direction !== 'keep' && annotation.direction !== 'exclude')
    .map(annotation => ({ annotation, intent: baseline.find(row => row.id === annotation.id) }))
    .find(row => !!row.intent);
  const annotation = selected?.annotation;
  const intent = selected?.intent;
  const revision = annotation && intent ? {
    property: intent.property, role: 'investigation', direction: 'investigate', required: intent.required,
    basis: 'none', metric: intent.metric, subject: intent.subject.kind, subjectLabel: intent.subject.label,
    sensoryContext: intent.subject.sensoryContext, ...(intent.familyId ? { familyId: intent.familyId } : {}),
    related: [...intent.relatedIntentIds],
    compensates: intent.investigation?.kind === 'comparePerceptualCompensation' ? [...intent.investigation.observationIntentIds] : [],
    reason: `Suggestion simulée pour l’annotation exacte « ${annotation.source.text} ». Elle n’ajoute ni mesure ni action au brassin.`,
  } : undefined;
  const noRevisableAnnotation = !annotation || !intent || !revision;
  const refusals = [{ text: 'La preuve froide de cette fixture ne permet pas de conclure sur l’effet recherché dans la bière.', related: [] as string[] },
    ...(noRevisableAnnotation ? [{ text: 'Aucune annotation canonique révisable n’est disponible dans cette lecture; aucune suggestion de propriété n’est inventée.', related: [] as string[] }] : [])];
  return {
    readerReview: annotation && revision ? [{ annotationId: annotation.id, verdict: 'revise', reason: revision.reason, revision }] : [],
    annotations: [],
    answer: {
      summary: noRevisableAnnotation
        ? 'Simulation locale : aucune annotation révisable n’a été retenue; aucun objectif ni constat n’a été ajouté.'
        : 'Simulation locale : une annotation exacte est proposée à réviser; le témoin froid reste indépendant de l’objectif exprimé.',
      readingNote: 'Aucun lien entre ce protocole froid et l’effet recherché dans la question n’est établi. La preuve est un exemple de fixture, pas une réponse sensorielle au lot.',
      options: [{
        id: 'assist-fixture-cold-contact-option', kind: 'investigation',
        title: 'Consulter séparément le témoin froid de la simulation',
        rationale: 'Cette preuve canonique illustre un protocole froid. Elle ne prédit pas la bière et ne répond pas à elle seule à l’objectif formulé.',
        conditions: ['Lire le résultat dans le cadre de son protocole et de son entrée de fixture.'],
        tradeoffs: ['Aucun lien causal ou sensoriel avec la question exacte n’est établi.'],
        related: annotation ? [annotation.id] : [],
        evidenceIds: [COLD_EVIDENCE_ID]
      }],
      program: { kind: 'none', note: 'Aucun ajout ni programme n’est préparé.' },
      unknowns: [], refusals
    }
  };
}

async function simulatedTurn(input: BrewerChatInput, session: HopV55AssistedCompanionSession): Promise<BrewerTurn> {
  const request = input.hopAdvice;
  if (!request || request.question !== input.question || !exactScope(input.scope, request.contextLaunch.scope)
    || stableBrewerHopAdviceJson(session.request) !== stableBrewerHopAdviceJson(request)) {
    throw new Error('La fixture refuse une requête différente de la session et de son scope exacts.');
  }
  const cold = await runBrewerTool('cold_contact_bitterness_reference', { doseGL: COLD_DOSE_G_L }, session.context);
  const evidence = [{ id: COLD_EVIDENCE_ID, ...cold }];
  const envelope = createBrewerHopAdviceProposalEnvelope({
    request,
    raw: simulatedRaw(request, session.context),
    // Hash and retain the same complete tool result that the turn carries. Facts, limits, sources,
    // and future fields are part of the dependency identity even when the answer does not cite them.
    evidence: evidence as BrewerHopAdviceEvidenceSource[],
    readers: {},
    serverContext: {
      phase: session.context.phase,
      provenance: [...session.context.provenance, 'Transport local assistantFixture; aucune génération IA ou requête réseau.'],
      loadedAt: session.context.now,
      binding: structuredClone(request.contextLaunch.expected)
    }
  });
  return {
    id: `turn:${input.operationId}`,
    operationId: input.operationId,
    question: input.question,
    advice: brewerAdviceFromHopProposal(envelope.proposal),
    evidence,
    createdAt: Date.now(),
    model: 'Réponse assistée simulée',
    reviewed: false,
    mode: input.mode,
    contextLabel: session.label,
    hopAdviceProposal: envelope,
    protocol: HOP_ADVICE_PROTOCOL_V1.name
  };
}

/** Fixture-only local transport. It calls the canonical proposal and evidence readers, never Firebase or a model. */
export function createHopV55AssistedAdviceFixtureRuntime(input: {
  namespace: string;
  delay: HopV55AssistedAdviceFixtureDelay;
}) {
  if (!input.namespace.trim()) throw new Error('Namespace assistantFixture requis.');
  const storeNamespace = `assistantFixture:hopAdviceReadonlyV1:${encodeURIComponent(input.namespace)}`;
  const listeners = new Set<() => void>();
  const contextsByOperation = new Map<string, HopV55AssistedCompanionSession>();
  const knownScopes = new Map<string, BrewerScope>();
  const liveJobsByOperation = new Map<string, ClientBrewerJob>();
  let session: HopV55AssistedCompanionSession | undefined;
  let activeScope: BrewerScope | undefined;
  let state: BrewerChatJobActivity = { jobs: [], connectionError: '' };
  let pendingSnapshot: ClientBrewerJob[] = [];
  let activeKey = '';
  let startedKey = '';
  let historyGeneration = 0;

  const notify = () => listeners.forEach(listener => listener());
  const serializeScope = (scope: BrewerScope) => `${scope.kind}:${scope.id}`;
  const isPending = (job: ClientBrewerJob) => !!job.input?.hopAdvice && !job.turn
    && job.status === 'running' && !job.sendError;
  const updatePendingSnapshot = () => {
    pendingSnapshot = [...liveJobsByOperation.values()].filter(isPending);
  };
  const rememberIndexedScopes = () => {
    try {
      const keys = JSON.parse(localStorage.getItem(`${storeNamespace}:scope-index`) ?? '[]');
      if (!Array.isArray(keys)) return;
      for (const key of keys) {
        if (typeof key !== 'string' || !key.startsWith(`${storeNamespace}:`) || !key.endsWith(':jobs')) continue;
        const encoded = key.slice(storeNamespace.length + 1, -':jobs'.length);
        const separator = encoded.indexOf(':');
        if (separator <= 0) continue;
        const kind = encoded.slice(0, separator);
        if (!['recipe', 'batch', 'draft', 'app'].includes(kind)) continue;
        const scope = { kind: kind as BrewerScope['kind'], id: decodeURIComponent(encoded.slice(separator + 1)) };
        if (scope.id && storageKey(storeNamespace, scope) === key) knownScopes.set(key, scope);
      }
    } catch {
      // Malformed or unavailable fixture storage never broadens the search namespace.
    }
  };
  const persistScope = (scope: BrewerScope, jobs: readonly ClientBrewerJob[], generation = historyGeneration) => {
    const key = storageKey(storeNamespace, scope);
    knownScopes.set(key, scope);
    try {
      localStorage.setItem(key, JSON.stringify({ generation, jobs: [...jobs].slice(-30) }));
      localStorage.setItem(`${storeNamespace}:scope-index`, JSON.stringify([...knownScopes.keys()]));
    } catch {
      // The browser fixture remains usable in private storage; reload recovery is then unavailable.
    }
  };
  const readScope = (scope: BrewerScope) => {
    const key = storageKey(storeNamespace, scope);
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as { generation?: unknown; jobs?: unknown } | null;
      const jobs = Array.isArray(parsed?.jobs) ? parsed.jobs.map(asJob).filter((job): job is ClientBrewerJob => !!job) : [];
      return { generation: Number.isSafeInteger(parsed?.generation) ? parsed!.generation as number : 0,
        jobs: jobs.map(job => job.input?.hopAdvice && !job.turn && !job.sendError
          ? { ...job, sending: false, sendError: 'Réponse simulée non reçue; réessaie le même operationId.' }
          : { ...job, sending: false }) };
    } catch {
      return { generation: 0, jobs: [] as ClientBrewerJob[] };
    }
  };
  const activate = (scope: BrewerScope) => {
    activeScope = structuredClone(scope);
    activeKey = storageKey(storeNamespace, scope);
    knownScopes.set(activeKey, structuredClone(scope));
    const loaded = readScope(scope);
    historyGeneration = loaded.generation;
    state = { jobs: loaded.jobs, connectionError: '' };
    notify();
  };
  const publish = (job: ClientBrewerJob) => {
    const scope = job.scope;
    liveJobsByOperation.set(job.operationId, structuredClone(job));
    const rows = readScope(scope).jobs;
    const next = new Map(rows.map(row => [row.operationId, row]));
    next.set(job.operationId, job);
    const sorted = [...next.values()].sort((left, right) => left.createdAt - right.createdAt);
    persistScope(scope, sorted, Math.max(readScope(scope).generation, job.generation));
    if (activeKey === storageKey(storeNamespace, scope)) {
      state = { jobs: sorted, connectionError: '' };
    } else state = { ...state, jobs: [...state.jobs] };
    updatePendingSnapshot();
    notify();
  };
  const buildJob = (jobInput: BrewerChatInput, label: string): ClientBrewerJob => ({
    id: jobInput.operationId,
    operationId: jobInput.operationId,
    input: structuredClone(jobInput),
    scope: structuredClone(jobInput.scope),
    question: jobInput.question,
    generation: jobInput.generation ?? 0,
    label,
    status: 'running',
    stage: 'analysis',
    detail: input.delay === 'manual' ? 'En attente de la commande visible du fixture.' : 'Calcul local à partir des outils canoniques.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attempt: 1,
    sending: input.delay === 'immediate'
  });
  const finish = async (job: ClientBrewerJob) => {
    const originalInput = job.input;
    const ownerSession = originalInput && contextsByOperation.get(job.operationId);
    if (!originalInput || !ownerSession) return false;
    try {
      const turn = await simulatedTurn(originalInput, ownerSession);
      publish({ ...job, id: turn.id, status: 'done', stage: 'saving', detail: 'Réponse assistée simulée reçue.',
        turn, sending: false, sendError: undefined, finishedAt: Date.now(), updatedAt: Date.now() });
      return true;
    } catch (error) {
      publish({ ...job, status: 'error', sending: false, sendError: (error as Error).message,
        error: { code: 'assistant-fixture', message: (error as Error).message, retryable: true }, updatedAt: Date.now() });
      return false;
    }
  };
  const requireMatchingSession = (chatInput: BrewerChatInput): HopV55AssistedCompanionSession => {
    if (!session || !chatInput.hopAdvice || chatInput.question !== chatInput.hopAdvice.question
      || !exactScope(chatInput.scope, chatInput.hopAdvice.contextLaunch.scope)
      || !matchesWireSourceFields(chatInput, chatInput.hopAdvice)
      || stableBrewerHopAdviceJson(session.request) !== stableBrewerHopAdviceJson(chatInput.hopAdvice)) {
      throw new Error('assistantFixture refuse une requête, une source, un champ wire ou un scope différent de la session exacte.');
    }
    return session;
  };
  const runtime: BrewerChatAssistedRuntime = {
    mode: 'hopAdviceReadonlyV1',
    storeNamespace,
    history: async (scope, before) => {
      const loaded = readScope(scope);
      return Object.assign(loaded.jobs.map(job => job.turn).filter((turn): turn is BrewerTurn => !!turn
        && (before === undefined || turn.createdAt < before)), { generation: loaded.generation });
    },
    reset: async (scope, generation) => {
      const nextGeneration = Math.max(readScope(scope).generation + 1, generation + 1);
      persistScope(scope, [], nextGeneration);
      for (const [operationId, job] of liveJobsByOperation) if (exactScope(job.scope, scope)) liveJobsByOperation.delete(operationId);
      updatePendingSnapshot();
      if (activeKey === storageKey(storeNamespace, scope)) {
        state = { jobs: [], connectionError: '' };
        historyGeneration = nextGeneration;
      } else state = { ...state, jobs: [...state.jobs] };
      notify();
      return { generation: nextGeneration };
    },
    jobs: {
      retainInputUntilRead: true,
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      snapshot: () => state,
      start: async () => {
        rememberIndexedScopes();
        if (activeScope && startedKey !== activeKey) {
          startedKey = activeKey;
          activate(activeScope);
        }
      },
      refresh: async () => {
        if (activeScope) activate(activeScope);
      },
      submit: (chatInput, label) => {
        const owner = requireMatchingSession(chatInput);
        const existing = readScope(chatInput.scope).jobs.find(job => job.operationId === chatInput.operationId);
        if (existing) {
          if (!existing.input || stableBrewerHopAdviceJson(existing.input) !== stableBrewerHopAdviceJson(chatInput)) {
            throw new Error('Le operationId de fixture existe déjà avec une entrée différente.');
          }
          return;
        }
        contextsByOperation.set(chatInput.operationId, owner);
        const job = buildJob(chatInput, label);
        publish(job);
        if (input.delay === 'immediate') void finish(job);
      },
      retry: (job) => {
        const old = readScope(job.scope).jobs.find(row => row.operationId === job.operationId);
        if (!old?.input || !job.input || stableBrewerHopAdviceJson(old.input) !== stableBrewerHopAdviceJson(job.input)) return;
        const owner = requireMatchingSession(old.input);
        contextsByOperation.set(old.operationId, owner);
        const retrying: ClientBrewerJob = { ...old, input: structuredClone(old.input), status: 'running', stage: 'analysis',
          sending: input.delay === 'immediate', sendError: undefined, error: undefined, attempt: old.attempt + 1, updatedAt: Date.now() };
        publish(retrying);
        if (input.delay === 'immediate') void finish(retrying);
      },
      markRead: job => {
        const found = readScope(job.scope).jobs.find(row => row.operationId === job.operationId);
        if (found && !found.readAt) publish({ ...found, readAt: Date.now(),
          input: found.status === 'done' ? undefined : found.input, updatedAt: Date.now() });
      },
      forget: (scope, generation) => {
        const read = readScope(scope);
        const kept = read.jobs.filter(job => job.generation >= generation);
        persistScope(scope, kept, Math.max(read.generation, generation));
        for (const [operationId, job] of liveJobsByOperation) {
          if (exactScope(job.scope, scope) && job.generation < generation) liveJobsByOperation.delete(operationId);
        }
        updatePendingSnapshot();
        if (activeKey === storageKey(storeNamespace, scope)) {
          historyGeneration = Math.max(historyGeneration, generation);
          state = { jobs: kept, connectionError: '' };
        } else state = { ...state, jobs: [...state.jobs] };
        notify();
      }
    }
  };
  return {
    runtime,
    setSession(value: HopV55AssistedCompanionSession) {
      session = value;
      const scope = value.request.contextLaunch.scope;
      const nextKey = storageKey(storeNamespace, scope);
      if (nextKey !== activeKey) activate(scope);
      for (const job of readScope(scope).jobs) {
        if (job.input?.hopAdvice && stableBrewerHopAdviceJson(job.input.hopAdvice) === stableBrewerHopAdviceJson(value.request)) {
          contextsByOperation.set(job.operationId, value);
        }
      }
    },
    pending: () => pendingSnapshot,
    async releaseNext() {
      const pending = pendingSnapshot[0];
      return pending ? finish(pending) : false;
    },
    fixtureDoseGL: COLD_DOSE_G_L
  };
}
