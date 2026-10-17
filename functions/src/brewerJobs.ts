import { createHash, randomUUID } from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { logger } from 'firebase-functions';
import { requireBrewer } from './brewSession.js';
import { GEMINI_API_KEY } from './ai.js';
import { geminiTransport, runBrewerHarness } from './brewerHarness.js';
import { budgetedBrewerTransport } from './brewerBudget.js';
import { BrewerBudgetError } from './brewerLimits.js';
import { GeminiApiError, GeminiRequestNotSentError } from './geminiErrors.js';
import { BREWER_APP_SCREENS } from './brewerAppScreens.js';
import { cleanContext, pick, validateChatInput } from './brewerContext.js';
import { stableJson } from './backupCore.js';
import { loadBrewerContext, history, threadKey, publicTurn } from './brewerChat.js';
import { loadBrewerHopContext } from './brewerHopContext.js';
import { createBrewerCatalogueForJob } from './brewerCatalogueJob.js';
import { createBrewerScenarioForJob } from './brewerScenarioJob.js';
import { brewerContextForStorage } from './hopCompanionContext.js';
import {
  assertOrdinaryCompanionJob,
  assertOrdinaryCompanionWire,
  assertHopAdviceV1JobBinding,
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_COLLECTIONS,
  validateHopAdviceV1Job
} from './brewerHopAdviceLaneV1.js';
import { brewerHopAdviceHarnessOptions, validateBrewerHopAdviceChatInput } from './brewerHopAdviceAdapter.js';
import {
  assertHopAdviceV1SemanticRequestBinding,
  assertHopAdviceV1SemanticRequestBindingForWizardV1,
  brewerHopAdviceSemanticHarnessOptionsV6,
  brewerHopAdviceSemanticHarnessOptionsV6ForWizardV1,
  validateHopAdviceV1ChatInput,
  validateHopAdviceV1ChatInputForWizardV1,
  type ValidatedHopAdviceV1Input,
  type ValidatedHopAdviceV1InputForWizardV1,
} from './brewerHopAdviceSemanticAdapter.js';
import { validateHopAdviceV1JobForWizardV1 } from './brewerHopAdviceLaneV1.js';
import type { BrewerChatInput, BrewerJob, BrewerStage } from './companionTypes.js';
import { BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1 } from './brewerHopAdviceWizardSourceV1.js';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const terminal = (status: string) => ['done', 'error', 'cancelled'].includes(status);
export const publicJob = (job: any): BrewerJob => {
  const result: BrewerJob = pick(job, [
    'id',
    'operationId',
    'scope',
    'generation',
    'question',
    'label',
    'status',
    'stage',
    'detail',
    'model',
    'createdAt',
    'updatedAt',
    'startedAt',
    'finishedAt',
    'readAt',
    'attempt',
    'catalogueReceipts',
    'scenarioReceipts',
    'error'
  ]);
  if (job.protocol?.name === HOP_ADVICE_PROTOCOL_V1.name && job.protocol?.version === HOP_ADVICE_PROTOCOL_V1.version)
    result.protocol = HOP_ADVICE_PROTOCOL_V1.name;
  else if (job.protocol !== undefined) result.protocol = 'unsupported';
  if (result.error && result.catalogueReceipts?.length) {
    const count = result.catalogueReceipts.length;
    result.error = { ...result.error, message: `${result.error.message} ${count} opération${count > 1 ? 's' : ''} de catalogue ${count > 1 ? 'sont' : 'est'} déjà enregistrée${count > 1 ? 's' : ''}; la relance reprend leurs reçus.` };
  }
  if (result.error && result.scenarioReceipts?.length) result.error = { ...result.error,
    message: `${result.error.message} Des scénarios ou observations ont aussi été enregistrés; leurs reçus sont conservés.` };
  return result;
};
export function jobError(error: unknown): NonNullable<BrewerJob['error']> {
  if (error instanceof GeminiApiError) return error.publicError();
  // Refused before sending (missing key, body not encodable for REST): nothing was charged and a retry cannot help.
  if (error instanceof GeminiRequestNotSentError)
    return {
      code: 'request-not-sent',
      message: 'La demande à Gemini n’a pas été envoyée : la configuration du service ou le format de la requête est invalide. Aucun coût n’est engagé.',
      retryable: false
    };
  if (error instanceof BrewerBudgetError)
    return { code: error.code, message: error.message, retryable: true };
  const message = error instanceof Error ? error.message : '';
  if (/vérification|validé ce conseil/.test(message))
    return {
      code: 'review-rejected',
      message:
        'La réponse a été écartée à la relecture : certaines recommandations n’étaient pas assez fiables. Les éventuels enregistrements de catalogue restent indiqués dans leurs reçus. Tu peux relancer ou préciser ta demande.',
      retryable: true
    };
  if (/terminé|JSON|format|réponse|Unexpected token/i.test(message))
    return {
      code: 'invalid-answer',
      message:
        'Gemini n’a pas terminé une réponse exploitable. Ta question est enregistrée ; relance l’analyse.',
      retryable: true
    };
  if (/timeout|deadline|aborted/i.test(message))
    return {
      code: 'deadline',
      message:
        'Gemini a dépassé le temps disponible, même après une reprise. Ta question reste dans le fil ; tu peux relancer.',
      retryable: true
    };
  if (error instanceof HttpsError && ['not-found', 'invalid-argument'].includes(error.code))
    return { code: error.code, message: error.message, retryable: false };
  return {
    code: 'service-unavailable',
    message:
      'Le service Gemini n’a pas pu aboutir après une reprise. Ta question est enregistrée ; tu peux relancer.',
    retryable: true
  };
}

/** The retry link is internal, never accepted from an untrusted chat payload. */
async function enqueueBrewerQuestion(uid: string, rawInput: unknown, retryOf?: string) {
    let input;
    try {
      assertOrdinaryCompanionWire(rawInput);
      input = validateChatInput(rawInput);
    } catch (e) {
      throw new HttpsError('invalid-argument', (e as Error).message);
    }
    const db = getFirestore(),
      id = hash(`${uid}:${input.operationId}`),
      threadId = threadKey(uid, input.scope);
    const ref = db.doc(`brewerJobs/${id}`),
      lock = db.doc(`brewerConversations/${threadId}`);
    const digest = hash(stableJson(retryOf ? { input, retryOf } : input));
    return db.runTransaction(async (tx) => {
      const [old, session, receipt, previous] = await Promise.all([
        tx.get(ref),
        tx.get(lock),
        tx.get(db.doc(`brewerChats/${id}`)),
        retryOf ? tx.get(db.doc(`brewerJobs/${retryOf}`)) : Promise.resolve(null)
      ]);
      const priorJob = previous?.data();
      if (retryOf && (!priorJob || priorJob.uid !== uid || priorJob.threadId !== threadId || priorJob.status !== 'error' || !priorJob.input))
        throw new HttpsError('failed-precondition', 'Cette question ne peut plus être relancée.');
      const generation = session.data()?.generation ?? 0;
      if ((input.generation ?? 0) !== generation)
        throw new HttpsError('failed-precondition', 'Cette conversation a été réinitialisée.', {
          reason: 'chat-reset',
          generation
        });
      if (old.exists || receipt.exists) {
        if ((old.data() ?? receipt.data())!.inputDigest !== digest)
          throw new HttpsError('already-exists', 'Ce message a déjà un autre contenu.');
        return receipt.exists
          ? { turn: publicTurn(receipt.data()) }
          : { job: publicJob(old.data()) };
      }
      const waiting = await tx.get(
        db
          .collection('brewerJobs')
          .where('threadId', '==', threadId)
          .where('status', 'in', ['queued', 'running'])
      );
      if (waiting.size >= 8)
        throw new HttpsError(
          'resource-exhausted',
          'Huit questions sont déjà en attente dans ce fil. Attends une réponse avant de réessayer cet envoi.'
        );
      const now = Math.max(Date.now(), (session.data()?.resetAt ?? 0) + 1);
      // Sequence allocated in the same transaction: each follow-up sees preceding answers.
      const sequence = (session.data()?.nextSequence ?? 0) + 1;
      const job = cleanContext({
        id,
        uid,
        threadId,
        input,
        inputDigest: digest,
        scope: input.scope,
        operationId: input.operationId,
        catalogueNamespace: priorJob?.catalogueNamespace ?? retryOf ?? id,
        ...(retryOf ? { retryOf, catalogueReceipts: priorJob?.catalogueReceipts ?? [], scenarioReceipts: priorJob?.scenarioReceipts ?? [] } : {}),
        generation,
        sequence,
        question: input.question,
        label: String((input.draft as any)?.name ?? (input.scope.kind === 'app' ? BREWER_APP_SCREENS[input.scope.id] : 'Compagnon brasseur')).slice(0, 160),
        status: 'queued',
        stage: 'queued',
        createdAt: now,
        updatedAt: now,
        attempt: 0
      });
      tx.create(ref, job);
      tx.set(lock, {
        ...session.data(),
        uid,
        scope: input.scope,
        nextSequence: sequence,
        updatedAt: now
      });
      return { job: publicJob(job) };
    });
}

/** The HTTP receipt is short. Creation is an outbox event: closing Chrome cannot cancel it. */
export const askBrewer = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  (request) => enqueueBrewerQuestion(requireBrewer(request), request.data)
);

export const dispatchBrewerQuestion = onDocumentCreated(
  { document: 'brewerJobs/{jobId}', region: 'europe-west6', retry: true, maxInstances: 3 },
  async (event) => {
    if (!event.data) return;
    try {
      await getFunctions()
        .taskQueue('locations/europe-west6/functions/processBrewerQuestion')
        .enqueue(
          { jobId: event.params.jobId },
          { id: event.params.jobId, dispatchDeadlineSeconds: 360 }
        );
    } catch (error) {
      if ((error as any)?.code !== 'functions/task-already-exists') throw error;
    }
  }
);

type BrewerJobLane = 'ordinary' | 'hopAdviceReadonlyV1';
const jobLanePaths = (lane: BrewerJobLane) => lane === 'hopAdviceReadonlyV1'
  ? { jobs: HOP_ADVICE_V1_COLLECTIONS.jobs, conversations: HOP_ADVICE_V1_COLLECTIONS.conversations,
      chats: HOP_ADVICE_V1_COLLECTIONS.chats, contexts: HOP_ADVICE_V1_COLLECTIONS.contexts } as const
  : { jobs: 'brewerJobs', conversations: 'brewerConversations', chats: 'brewerChats', contexts: 'brewerContexts' } as const;
const brewerTaskOptions = {
    region: 'europe-west6',
    timeoutSeconds: 300,
    memory: '512MiB',
    maxInstances: 3,
    secrets: [GEMINI_API_KEY],
    retryConfig: {
      maxAttempts: 100,
      maxRetrySeconds: 2400,
      minBackoffSeconds: 10,
      maxBackoffSeconds: 45
    },
    rateLimits: { maxConcurrentDispatches: 3 }
  } satisfies Parameters<typeof onTaskDispatched>[0];

type ValidatedHopAdviceWorkerInput =
  | { sourceProfile: 'classic'; validated: ValidatedHopAdviceV1Input }
  | { sourceProfile: 'wizardV1'; validated: ValidatedHopAdviceV1InputForWizardV1 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** A source candidate is taken only from the real RequestV3 archive identity. */
function hasWizardSourceCandidate(job: unknown): boolean {
  if (!isRecord(job) || !isRecord(job.wireInput) || !isRecord(job.wireInput.hopAdvice)
    || !isRecord(job.wireInput.hopAdvice.sourceView)
    || !isRecord(job.wireInput.hopAdvice.sourceView.archiveIdentity)) return false;
  const source = job.wireInput.hopAdvice.sourceView.archiveIdentity.source;
  return isRecord(source) && (source.kind === 'wizardDraft'
    || source.format === BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1
    || (typeof source.format === 'string' && source.format.startsWith('hop-v55-wizard-source-v')));
}

/** Re-run the protocol-specific job parser and owner admission; never try Wizard then fall back. */
function validateHopAdviceWorkerInput(job: unknown): ValidatedHopAdviceWorkerInput {
  const ownerUid = isRecord(job) && typeof job.uid === 'string' ? job.uid : undefined;
  if (hasWizardSourceCandidate(job)) {
    if (!ownerUid) throw new Error('Propriétaire du job Wizard absent.');
    const parsed = validateHopAdviceV1JobForWizardV1(job);
    const validated = validateHopAdviceV1ChatInputForWizardV1(parsed, ownerUid);
    assertHopAdviceV1SemanticRequestBindingForWizardV1(validated.request, validated.input.scope, ownerUid);
    return { sourceProfile: 'wizardV1', validated };
  }

  const parsed = validateHopAdviceV1Job(job);
  const validated = validateHopAdviceV1ChatInput(parsed, ownerUid);
  if (validated.requestVersion === 'request-v3') {
    if (!ownerUid) throw new Error('Propriétaire du job RequestV3 absent.');
    assertHopAdviceV1SemanticRequestBinding(validated.request, parsed.wireInput.scope, ownerUid);
  }
  return { sourceProfile: 'classic', validated };
}

function wizardContextInput(validated: ValidatedHopAdviceV1InputForWizardV1): BrewerChatInput {
  if (validated.input.scope.kind !== 'draft') throw new Error('Le contexte Wizard doit garder le scope draft validé.');
  return {
    ...validated.input,
    scope: { kind: 'draft', id: validated.input.scope.id },
    draft: validated.wizardDraft,
  };
}

/** Both handlers share the lease/fence/commit/error path; only the static lane differs. */
export const processBrewerQuestion = onTaskDispatched(
  brewerTaskOptions,
  (request) => processBrewerJobTask(request, 'ordinary')
);
export const processBrewerHopAdviceV1 = onTaskDispatched(
  brewerTaskOptions,
  (request) => processBrewerJobTask(request, 'hopAdviceReadonlyV1')
);

async function processBrewerJobTask(request: any, lane: BrewerJobLane) {
    const paths = jobLanePaths(lane);
    const assisted = lane === 'hopAdviceReadonlyV1';
    const id = request.data?.jobId;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) return;
    const db = getFirestore(),
      ref = db.doc(`${paths.jobs}/${id}`),
      fence = randomUUID();
    const claimed = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref),
        job = doc.data();
      if (!job || terminal(job.status)) return null;
      try {
        if (assisted) {
          const workerInput = validateHopAdviceWorkerInput(job);
          const validatedInput = workerInput.validated.input;
          assertHopAdviceV1JobBinding(job, validatedInput, id);
          if (stableJson(validatedInput) !== stableJson(job.input)) throw new Error('Le contenu canonique du job diffère du wire.');
        }
        else assertOrdinaryCompanionJob(job);
      } catch {
        tx.update(ref, {
          status: 'error',
          error: { code: 'invalid-protocol', message: 'Protocole ou transmission de la question non pris en charge. Aucun modèle n’a été appelé.', retryable: false },
          finishedAt: Date.now(),
          updatedAt: Date.now(),
          input: FieldValue.delete(),
          ...(assisted ? { wireInput: FieldValue.delete() } : {})
        });
        return null;
      }
      const lock = db.doc(`${paths.conversations}/${job.threadId}`),
        session = (await tx.get(lock)).data();
      if (job.generation !== (session?.generation ?? 0)) {
        tx.update(ref, { status: 'cancelled', updatedAt: Date.now(), input: FieldValue.delete(), ...(assisted ? { wireInput: FieldValue.delete() } : {}) });
        return null;
      }
      if (session?.active?.until > Date.now()) throw Error('Une analyse est déjà en cours.');
      const waiting = await tx.get(
        db
          .collection(paths.jobs)
          .where('threadId', '==', job.threadId)
          .where('status', 'in', ['queued', 'running'])
      );
      if (waiting.docs.some((d) => d.data().sequence < job.sequence && d.data().generation === job.generation))
        throw Error('La réponse précédente doit se terminer.');
      if (job.attempt >= 2 || Date.now() - job.createdAt > 1800000) {
        tx.update(ref, { status: 'error', error: jobError(Error('deadline')), finishedAt: Date.now(), updatedAt: Date.now() });
        return null;
      }
      const now = Date.now();
      tx.update(ref, { status: 'running', stage: 'context', attempt: job.attempt + 1, startedAt: now, updatedAt: now, fence });
      tx.set(lock, { ...session, active: { fence, operationId: job.operationId, question: job.question, until: now + 310000 } });
      return { ...job, attempt: job.attempt + 1, startedAt: now };
    });
    if (!claimed) return;
    const job: Record<string, any> = claimed,
      lock = db.doc(`${paths.conversations}/${job.threadId}`);
    const updateJob = async (fields: Record<string, unknown>) => {
      await db.runTransaction(async (tx) => {
        const [session, current] = await Promise.all([tx.get(lock), tx.get(ref)]);
        if (session.data()?.active?.fence !== fence || current.data()?.fence !== fence || current.data()?.status !== 'running')
          throw new HttpsError('aborted', 'Conversation réinitialisée.');
        tx.update(ref, { ...fields, updatedAt: Date.now() });
      });
    };
    const progress = (stage: BrewerStage, detail = '', model = '') => updateJob({ stage, detail, ...(model ? { model } : {}) });
    let guarded: ReturnType<typeof budgetedBrewerTransport> | undefined;
    try {
      // Revalidate the claimed snapshot before context/provider setup; the job stamp is authoritative.
      const workerInput = assisted ? validateHopAdviceWorkerInput(job) : undefined;
      const validated = workerInput?.validated;
      const input = validated ? validated.input : job.input;
      if (assisted) assertHopAdviceV1JobBinding(job, input, id);
      if (assisted && stableJson(input) !== stableJson(job.input)) throw new HttpsError('failed-precondition', 'La transmission de lecture assistée ne correspond plus au job.');
      const contextInput = workerInput?.sourceProfile === 'wizardV1'
        ? wizardContextInput(workerInput.validated)
        : input;
      guarded = budgetedBrewerTransport(geminiTransport(GEMINI_API_KEY.value()), id, fence, lane);
      const context = await loadBrewerContext(contextInput),
        session = (await lock.get()).data();
      await ref.update({ label: String(context.recipe?.name || context.batch?.name || context.workspace?.screen || 'Brouillon').slice(0, 160) });
      const past = assisted ? [] : await history(job.threadId, undefined, session?.resetAt, paths.chats);
      const catalogue = createBrewerCatalogueForJob(db, {
        id, uid: job.uid, threadId: job.threadId, generation: job.generation, fence,
        namespace: job.catalogueNamespace ?? id, lane
      });
      const harnessOptions = !assisted
        ? {
            catalogue,
            scenarios: createBrewerScenarioForJob(db, { id, uid: job.uid, threadId: job.threadId,
              generation: job.generation, fence, namespace: job.catalogueNamespace ?? id }),
            scenarioReceipts: job.scenarioReceipts ?? []
          }
        : workerInput?.sourceProfile === 'wizardV1'
          ? brewerHopAdviceSemanticHarnessOptionsV6ForWizardV1(workerInput.validated, context,
              { catalogue, ownerUid: job.uid })
          : workerInput?.sourceProfile === 'classic' && workerInput.validated.requestVersion === 'request-v2'
            ? brewerHopAdviceHarnessOptions(
                validateBrewerHopAdviceChatInput(workerInput.validated.request, input), context,
                { scope: input.scope, catalogue })
            : workerInput?.sourceProfile === 'classic' && workerInput.validated.requestVersion === 'request-v3'
              // Classic RequestV3 retains its existing explicit V6 profile.
              ? brewerHopAdviceSemanticHarnessOptionsV6(workerInput.validated.request, context,
                  { scope: input.scope, catalogue, ownerUid: job.uid })
              : (() => { throw new HttpsError('failed-precondition', 'Entrée assistée validée absente; aucun profil de repli ne sera tenté.'); })();
      const result = await runBrewerHarness(context, job.question, past, guarded.generate, {
        mode: input.mode,
        loadHopIndex: loadBrewerHopContext,
        ...harnessOptions,
        onProgress: progress,
        onDiagnostic: (diagnostics) => updateJob({ diagnostics })
      });
      await progress('saving', 'Enregistrement de la réponse vérifiée');
      const { profileResult, ...harnessResult } = result;
      const snapshot = cleanContext({ ...brewerContextForStorage(context, result.proposal), now: undefined }),
        contextId = hash(stableJson(snapshot));
      const contextRef = db.doc(`${paths.contexts}/${contextId}`),
        turnRef = db.doc(`${paths.chats}/${id}`);
      const turn = cleanContext({
        id, threadId: job.threadId, uid: job.uid, scope: job.scope, inputDigest: job.inputDigest,
        operationId: job.operationId, generation: job.generation, question: job.question,
        ...(assisted ? { protocol: HOP_ADVICE_PROTOCOL_V1.name } : {}),
        ...harnessResult,
        ...(!assisted && result.proposal ? { proposal: { ...result.proposal, basis: undefined } } : {}),
        ...(assisted && profileResult ? { hopAdviceProposal: profileResult.payload } : {}),
        createdAt: Math.max(Date.now(), (session?.resetAt ?? 0) + 1), askedAt: job.createdAt,
        contextLabel: `${context.recipe?.name || context.batch?.name || context.workspace?.screen || 'Brouillon'} · ${context.phase}`,
        contextId, contextAt: context.now
      });
      if (Buffer.byteLength(JSON.stringify(turn)) > 650000 || Buffer.byteLength(JSON.stringify(snapshot)) > 650000)
        throw Error('Conversation trop volumineuse.');
      await db.runTransaction(async (tx) => {
        const [current, oldContext, currentJob] = await Promise.all([tx.get(lock), tx.get(contextRef), tx.get(ref)]);
        if (current.data()?.active?.fence !== fence || currentJob.data()?.fence !== fence || currentJob.data()?.status !== 'running')
          throw new HttpsError('aborted', 'Conversation réinitialisée.');
        if (!oldContext.exists) tx.create(contextRef, { id: contextId, context: snapshot, createdAt: Date.now() });
        tx.create(turnRef, turn);
        tx.update(lock, { active: null, updatedAt: Date.now() });
        tx.update(ref, { status: 'done', finishedAt: Date.now(), updatedAt: Date.now(), input: FieldValue.delete(), ...(assisted ? { wireInput: FieldValue.delete() } : {}) });
      });
      logger.info('brewer-answer', { jobId: id, lane, model: result.model, reviewModel: result.reviewModel, elapsedMs: Date.now() - job.startedAt, tools: result.trace.length });
    } catch (error) {
      const failure = jobError(error);
      const retry = job.attempt < 2 && ['service-unavailable', 'deadline', 'gemini-server'].includes(failure.code);
      const recorded = await db.runTransaction(async (tx) => {
        const [session, current] = await Promise.all([tx.get(lock), tx.get(ref)]);
        if (session.data()?.active?.fence !== fence || current.data()?.fence !== fence || current.data()?.status !== 'running') return false;
        tx.update(lock, { active: null, updatedAt: Date.now() });
        tx.update(ref, retry
          ? { status: 'queued', stage: 'retry', detail: 'Gemini a interrompu la première tentative. Reprise automatique.', updatedAt: Date.now() }
          : { status: 'error', error: failure, finishedAt: Date.now(), updatedAt: Date.now() });
        return true;
      });
      logger.warn('brewer-answer-failed', { jobId: id, lane, code: failure.code, attempt: job.attempt, retry: recorded && retry,
        ...(error instanceof GeminiApiError ? { provider: error.diagnostic() } : {}), elapsedMs: Date.now() - job.startedAt });
      if (recorded && retry) throw Error('Reprise du traitement Gemini.');
    } finally {
      guarded?.close();
    }
}

/** Global inbox, independent of a recipe page. Only the authenticated user's public job fields. */
export const getBrewerActivity = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request),
      db = getFirestore();
    const rows = await db
      .collection('brewerJobs')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    // Catch lost dispatches too: an old question must never stay "working" indefinitely.
    const jobs = await Promise.all(
      rows.docs.map(async (doc) => {
        const data = doc.data();
        if (!terminal(data.status) && Date.now() - data.createdAt > 1800000) {
          await db.runTransaction(async (tx) => {
            const current = (await tx.get(doc.ref)).data();
            if (current && !terminal(current.status))
              tx.update(doc.ref, {
                status: 'error',
                error: jobError(Error('deadline')),
                finishedAt: Date.now(),
                updatedAt: Date.now()
              });
          });
          return publicJob((await doc.ref.get()).data());
        }
        return publicJob(data);
      })
    );
    return { jobs: jobs.filter((j) => j.status !== 'cancelled') };
  }
);

export const markBrewerRead = onCall(
  { region: 'europe-west6', maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request),
      id = request.data?.jobId;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id))
      throw new HttpsError('invalid-argument', 'Message invalide.');
    const ref = getFirestore().doc(`brewerJobs/${id}`);
    await getFirestore().runTransaction(async (tx) => {
      const job = (await tx.get(ref)).data();
      if (!job || job.uid !== uid) throw new HttpsError('not-found', 'Message introuvable.');
      if (terminal(job.status)) tx.update(ref, { readAt: Date.now() });
    });
    return { ok: true };
  }
);

/** Retry the saved question from another device, including its private draft context. */
export const retryBrewerQuestion = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request),
      id = request.data?.jobId;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id))
      throw new HttpsError('invalid-argument', 'Message invalide.');
    const job = (await getFirestore().doc(`brewerJobs/${id}`).get()).data();
    if (!job || job.uid !== uid) throw new HttpsError('not-found', 'Question introuvable.');
    if (job.status !== 'error' || !job.input)
      throw new HttpsError('failed-precondition', 'Cette analyse ne peut pas être relancée.');
    return enqueueBrewerQuestion(uid, { ...job.input, operationId: request.data.operationId }, id);
  }
);
