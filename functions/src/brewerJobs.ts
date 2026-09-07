import { createHash, randomUUID } from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { logger } from 'firebase-functions';
import { requireBrewer } from './brewSession.js';
import { GEMINI_API_KEY } from './ai.js';
import { geminiTransport, runBrewerHarness, BrewerProUnavailableError } from './brewerHarness.js';
import { cleanContext, pick, validateChatInput } from './brewerContext.js';
import { stableJson } from './backupCore.js';
import { loadBrewerContext, history, threadKey, publicTurn } from './brewerChat.js';
import type { BrewerJob, BrewerStage } from './companionTypes.js';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const terminal = (status: string) => ['done', 'error', 'cancelled'].includes(status);
export const publicJob = (job: any): BrewerJob =>
  pick(job, [
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
    'error'
  ]);
export function jobError(error: unknown): NonNullable<BrewerJob['error']> {
  if (error instanceof BrewerProUnavailableError)
    return {
      code: 'pro-unavailable',
      message:
        'Gemini 3.1 Pro est indisponible après plusieurs essais. Réessaie dans quelques instants.',
      retryable: true
    };
  const message = error instanceof Error ? error.message : '';
  if (/vérification|validé ce conseil/.test(message))
    return {
      code: 'review-rejected',
      message:
        'La réponse a été écartée à la relecture : certaines recommandations n’étaient pas assez fiables. Aucun champ n’a changé. Tu peux relancer ou préciser ta demande.',
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

/** The HTTP receipt is short. Creation is an outbox event: closing Chrome cannot cancel it. */
export const askBrewer = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request);
    let input;
    try {
      input = validateChatInput(request.data);
    } catch (e) {
      throw new HttpsError('invalid-argument', (e as Error).message);
    }
    const db = getFirestore(),
      id = hash(`${uid}:${input.operationId}`),
      threadId = threadKey(uid, input.scope);
    const ref = db.doc(`brewerJobs/${id}`),
      lock = db.doc(`brewerConversations/${threadId}`);
    const digest = hash(stableJson(input));
    return db.runTransaction(async (tx) => {
      const [old, session, receipt] = await Promise.all([
        tx.get(ref),
        tx.get(lock),
        tx.get(db.doc(`brewerChats/${id}`))
      ]);
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
        generation,
        sequence,
        question: input.question,
        label: String((input.draft as any)?.name ?? 'Compagnon brasseur').slice(0, 160),
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

/** Idempotent task, ordered per conversation; retry leases fence crashed or duplicate workers. */
export const processBrewerQuestion = onTaskDispatched(
  {
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
  },
  async (request) => {
    const id = request.data?.jobId;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) return;
    const db = getFirestore(),
      ref = db.doc(`brewerJobs/${id}`),
      fence = randomUUID();
    const claimed = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref),
        job = doc.data();
      if (!job || terminal(job.status)) return null;
      const lock = db.doc(`brewerConversations/${job.threadId}`),
        session = (await tx.get(lock)).data();
      if (job.generation !== (session?.generation ?? 0)) {
        tx.update(ref, { status: 'cancelled', updatedAt: Date.now(), input: FieldValue.delete() });
        return null;
      }
      if (session?.active?.until > Date.now()) throw Error('Une analyse est déjà en cours.');
      const waiting = await tx.get(
        db
          .collection('brewerJobs')
          .where('threadId', '==', job.threadId)
          .where('status', 'in', ['queued', 'running'])
      );
      if (
        waiting.docs.some(
          (d) => d.data().sequence < job.sequence && d.data().generation === job.generation
        )
      )
        throw Error('La réponse précédente doit se terminer.');
      if (job.attempt >= 2 || Date.now() - job.createdAt > 1800000) {
        tx.update(ref, {
          status: 'error',
          error: jobError(Error('deadline')),
          finishedAt: Date.now(),
          updatedAt: Date.now()
        });
        return null;
      }
      const now = Date.now();
      tx.update(ref, {
        status: 'running',
        stage: 'context',
        attempt: job.attempt + 1,
        startedAt: now,
        updatedAt: now,
        fence
      });
      tx.set(lock, {
        ...session,
        active: { fence, operationId: job.operationId, question: job.question, until: now + 310000 }
      });
      return { ...job, attempt: job.attempt + 1, startedAt: now };
    });
    if (!claimed) return;
    const job: Record<string, any> = claimed,
      lock = db.doc(`brewerConversations/${job.threadId}`);
    const progress = async (stage: BrewerStage, detail = '', model = '') => {
      await db.runTransaction(async (tx) => {
        const [session, current] = await Promise.all([tx.get(lock), tx.get(ref)]);
        if (
          session.data()?.active?.fence !== fence ||
          current.data()?.fence !== fence ||
          current.data()?.status !== 'running'
        )
          throw new HttpsError('aborted', 'Conversation réinitialisée.');
        tx.update(ref, { stage, detail, ...(model ? { model } : {}), updatedAt: Date.now() });
      });
    };
    try {
      const context = await loadBrewerContext(job.input),
        session = (await lock.get()).data();
      await ref.update({
        label: String(context.recipe?.name || context.batch?.name || 'Brouillon').slice(0, 160)
      });
      const past = await history(job.threadId, undefined, session?.resetAt);
      const result = await runBrewerHarness(
        context,
        job.question,
        past,
        geminiTransport(GEMINI_API_KEY.value()),
        { mode: job.input.mode, onProgress: progress }
      );
      await progress('saving', 'Enregistrement de la réponse vérifiée');
      const snapshot = cleanContext({ ...context, now: undefined }),
        contextId = hash(stableJson(snapshot));
      const contextRef = db.doc(`brewerContexts/${contextId}`),
        turnRef = db.doc(`brewerChats/${id}`);
      const turn = cleanContext({
        id,
        threadId: job.threadId,
        uid: job.uid,
        scope: job.scope,
        inputDigest: job.inputDigest,
        operationId: job.operationId,
        generation: job.generation,
        question: job.question,
        ...result,
        ...(result.proposal ? { proposal: { ...result.proposal, basis: undefined } } : {}),
        createdAt: Math.max(Date.now(), (session?.resetAt ?? 0) + 1),
        askedAt: job.createdAt,
        contextLabel: `${context.recipe?.name || context.batch?.name || 'Brouillon'} · ${context.phase}`,
        contextId,
        contextAt: context.now
      });
      if (
        Buffer.byteLength(JSON.stringify(turn)) > 650000 ||
        Buffer.byteLength(JSON.stringify(snapshot)) > 650000
      )
        throw Error('Conversation trop volumineuse.');
      await db.runTransaction(async (tx) => {
        const [current, oldContext, currentJob] = await Promise.all([
          tx.get(lock),
          tx.get(contextRef),
          tx.get(ref)
        ]);
        if (
          current.data()?.active?.fence !== fence ||
          currentJob.data()?.fence !== fence ||
          currentJob.data()?.status !== 'running'
        )
          throw new HttpsError('aborted', 'Conversation réinitialisée.');
        if (!oldContext.exists)
          tx.create(contextRef, { id: contextId, context: snapshot, createdAt: Date.now() });
        tx.create(turnRef, turn);
        tx.update(lock, { active: null, updatedAt: Date.now() });
        tx.update(ref, {
          status: 'done',
          finishedAt: Date.now(),
          updatedAt: Date.now(),
          input: FieldValue.delete()
        });
      });
      logger.info('brewer-answer', {
        jobId: id,
        model: result.model,
        reviewModel: result.reviewModel,
        elapsedMs: Date.now() - job.startedAt,
        tools: result.trace.length
      });
    } catch (error) {
      const failure = jobError(error);
      // Invalid/rejected advice needs a user decision. Transient provider errors get one automatic retry.
      const retry =
        job.attempt < 2 &&
        ['service-unavailable', 'pro-unavailable', 'deadline'].includes(failure.code);
      const recorded = await db.runTransaction(async (tx) => {
        const [session, current] = await Promise.all([tx.get(lock), tx.get(ref)]);
        if (
          session.data()?.active?.fence !== fence ||
          current.data()?.fence !== fence ||
          current.data()?.status !== 'running'
        )
          return false;
        tx.update(lock, { active: null, updatedAt: Date.now() });
        tx.update(
          ref,
          retry
            ? {
                status: 'queued',
                stage: 'retry',
                detail: 'Gemini a interrompu la première tentative. Reprise automatique.',
                updatedAt: Date.now()
              }
            : { status: 'error', error: failure, finishedAt: Date.now(), updatedAt: Date.now() }
        );
        return true;
      });
      logger.warn('brewer-answer-failed', {
        jobId: id,
        code: failure.code,
        attempt: job.attempt,
        retry: recorded && retry,
        elapsedMs: Date.now() - job.startedAt
      });
      if (recorded && retry) throw Error('Reprise du traitement Gemini.');
    }
  }
);

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
    return askBrewer.run({
      ...request,
      data: { ...job.input, operationId: request.data.operationId }
    });
  }
);
