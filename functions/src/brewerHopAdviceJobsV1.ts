import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { requireBrewer } from './brewSession.js';
import { BREWER_APP_SCREENS } from './brewerAppScreens.js';
import { cleanContext } from './brewerContext.js';
import { stableJson } from './backupCore.js';
import { publicTurn } from './brewerChat.js';
import { jobError, publicJob } from './brewerJobs.js';
import { validateHopAdviceV1ChatInput } from './brewerHopAdviceSemanticAdapter.js';
import {
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_COLLECTIONS,
  HOP_ADVICE_V1_FUNCTIONS,
  hasHopAdviceV1Stamp,
  hopAdviceV1InputDigest,
  hopAdviceV1ThreadKey,
  isHopAdviceV1JobInCurrentGeneration,
  parseHopAdviceV1Wire,
  validateHopAdviceV1RetrySource,
  type HopAdviceV1ActivityReceipt,
  type HopAdviceV1ActivityRequest,
  type HopAdviceV1MarkReadReceipt,
  type HopAdviceV1MarkReadRequest,
  type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn,
  type HopAdviceV1RetryReceipt,
  type HopAdviceV1RetryRequest,
  type HopAdviceV1SubmitReceipt,
  type HopAdviceV1UnsupportedJob,
  type HopAdviceV1AnyWireInput
} from './brewerHopAdviceLaneV1.js';

const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
const validOperationId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{16,100}$/.test(value);
const terminal = (status: string) => ['done', 'error', 'cancelled'].includes(status);
const v1PublicJob = (job: any): HopAdviceV1PublicJob => ({
  ...publicJob(job), protocol: HOP_ADVICE_PROTOCOL_V1.name
});
const v1PublicTurn = (turn: any): HopAdviceV1PublicTurn => ({
  ...publicTurn(turn), protocol: HOP_ADVICE_PROTOCOL_V1.name
});

function normalizeWire(raw: unknown, ownerUid: string) {
  const parsed = parseHopAdviceV1Wire(raw);
  const input = validateHopAdviceV1ChatInput(parsed, ownerUid).input;
  const wireInput = cleanContext(parsed.wireInput) as HopAdviceV1AnyWireInput;
  // cleanContext is a persistence guard, not a way to alter the user's payload.
  if (stableJson(wireInput) !== stableJson(parsed.wireInput))
    throw new Error('La transmission contient un champ qui ne peut pas être conservé à l’identique.');
  if (input.mode !== parsed.wireInput.analysisMode || stableJson(input.scope) !== stableJson(parsed.wireInput.scope))
    throw new Error('Le mode ou la source ne correspond pas à la transmission reçue.');
  return { input, wireInput, digest: hopAdviceV1InputDigest(wireInput) };
}

/** A distinct callable. It never writes an ordinary brewerJobs record. */
async function enqueueBrewerHopAdviceV1(uid: string, raw: unknown, retryOf?: string) {
  let normalized: ReturnType<typeof normalizeWire>;
  try { normalized = normalizeWire(raw, uid); }
  catch (error) { throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Lecture assistée invalide.'); }

  const { input, wireInput, digest } = normalized;
  const db = getFirestore();
  const id = hash(`${uid}:${input.operationId}`);
  const threadId = hopAdviceV1ThreadKey(uid, input.scope);
  const ref = db.doc(`${HOP_ADVICE_V1_COLLECTIONS.jobs}/${id}`);
  const lock = db.doc(`${HOP_ADVICE_V1_COLLECTIONS.conversations}/${threadId}`);
  const turnRef = db.doc(`${HOP_ADVICE_V1_COLLECTIONS.chats}/${id}`);
  const previousRef = retryOf ? db.doc(`${HOP_ADVICE_V1_COLLECTIONS.jobs}/${retryOf}`) : undefined;

  return db.runTransaction(async (tx) => {
    const [old, session, receipt, previous] = await Promise.all([
      tx.get(ref), tx.get(lock), tx.get(turnRef), previousRef ? tx.get(previousRef) : Promise.resolve(null)
    ]);
    const priorJob = previous?.data();
    if (retryOf && !session.exists)
      throw new HttpsError('failed-precondition', 'La session source n’existe plus; la reprise assistée est refusée.', { reason: 'chat-reset' });
    if (session.exists && session.data()?.protocol !== HOP_ADVICE_PROTOCOL_V1.name)
      throw new HttpsError('failed-precondition', 'Cette session ne porte pas le protocole assisté attendu.');
    const generation = session.data()?.generation ?? 0;
    if (retryOf) {
      if (!priorJob || priorJob.uid !== uid || priorJob.threadId !== threadId || priorJob.status !== 'error' || !hasHopAdviceV1Stamp(priorJob))
        throw new HttpsError('failed-precondition', 'Cette question assistée ne peut plus être relancée dans cette voie.');
      if (priorJob.generation !== generation)
        throw new HttpsError('failed-precondition', 'La question source appartient à une ancienne génération; aucune reprise n’a été créée.', { reason: 'chat-reset', generation });
      try {
        validateHopAdviceV1RetrySource({
          sourceJob: priorJob,
          sourceDocumentId: retryOf,
          ownerUid: uid,
          expectedThreadId: threadId,
          currentGeneration: generation,
          requestedGeneration: input.generation,
          canonicalize: (parsed) => validateHopAdviceV1ChatInput(parsed, uid).input,
          stableJson
        });
      } catch {
        throw new HttpsError('failed-precondition', 'La source assistée est altérée ou appartient à une ancienne génération; aucune reprise n’a été créée.', { reason: 'chat-reset', generation });
      }
    }
    if ((input.generation ?? 0) !== generation)
      throw new HttpsError('failed-precondition', 'Cette conversation assistée a été réinitialisée.', { reason: 'chat-reset', generation });
    if (old.exists || receipt.exists) {
      const existing = old.data() ?? receipt.data();
      const protocolMatches = old.exists
        ? hasHopAdviceV1Stamp(old.data())
        : receipt.data()?.protocol === HOP_ADVICE_PROTOCOL_V1.name;
      if (existing?.inputDigest !== digest || !protocolMatches)
        throw new HttpsError('already-exists', 'Cet identifiant correspond déjà à un autre message assisté.');
      return receipt.exists ? { turn: v1PublicTurn(receipt.data()), protocol: HOP_ADVICE_PROTOCOL_V1.name }
        : { job: v1PublicJob(old.data()), protocol: HOP_ADVICE_PROTOCOL_V1.name };
    }

    const waiting = await tx.get(db.collection(HOP_ADVICE_V1_COLLECTIONS.jobs)
      .where('threadId', '==', threadId).where('status', 'in', ['queued', 'running']));
    if (waiting.size >= 8) throw new HttpsError('resource-exhausted', 'Huit lectures assistées sont déjà en attente dans ce fil.');

    const now = Math.max(Date.now(), (session.data()?.resetAt ?? 0) + 1);
    const sequence = (session.data()?.nextSequence ?? 0) + 1;
    const job = cleanContext({
      id, uid, threadId,
      protocol: HOP_ADVICE_PROTOCOL_V1,
      input,
      wireInput,
      inputDigest: digest,
      scope: input.scope,
      operationId: input.operationId,
      catalogueNamespace: priorJob?.catalogueNamespace ?? `hopAdviceReadonlyV1:${retryOf ?? id}`,
      ...(retryOf ? { retryOf } : {}),
      generation,
      sequence,
      question: input.question,
      label: String((input.draft as any)?.name ?? (input.scope.kind === 'app' ? BREWER_APP_SCREENS[input.scope.id] : 'Lecture assistée houblon')).slice(0, 160),
      status: 'queued', stage: 'queued', createdAt: now, updatedAt: now, attempt: 0
    });
    tx.create(ref, job);
    tx.set(lock, { ...session.data(), uid, scope: input.scope, protocol: HOP_ADVICE_PROTOCOL_V1.name, generation,
      nextSequence: sequence, updatedAt: now });
    return { job: v1PublicJob(job), protocol: HOP_ADVICE_PROTOCOL_V1.name };
  });
}

export const askBrewerHopAdviceV1 = onCall<HopAdviceV1AnyWireInput, Promise<HopAdviceV1SubmitReceipt>>(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  (request) => enqueueBrewerHopAdviceV1(requireBrewer(request), request.data)
);

/** Versioned outbox trigger. The ordinary brewerJobs trigger cannot observe this collection. */
export const dispatchBrewerHopAdviceV1 = onDocumentCreated(
  { document: `${HOP_ADVICE_V1_COLLECTIONS.jobs}/{jobId}`, region: 'europe-west6', retry: true, maxInstances: 3 },
  async (event) => {
    if (!event.data) return;
    const job = event.data.data();
    if (!hasHopAdviceV1Stamp(job)) {
      if (!terminal(job?.status ?? '')) await event.data.ref.update({
        status: 'error',
        error: { code: 'invalid-protocol', message: 'Version de lecture assistée absente ou non prise en charge. Aucun modèle n’a été appelé.', retryable: false },
        finishedAt: Date.now(), updatedAt: Date.now()
      });
      return;
    }
    try {
      await getFunctions().taskQueue(`locations/europe-west6/functions/${HOP_ADVICE_V1_FUNCTIONS.process}`)
        .enqueue({ jobId: event.params.jobId }, { id: event.params.jobId, dispatchDeadlineSeconds: 360 });
    } catch (error) {
      if ((error as any)?.code !== 'functions/task-already-exists') throw error;
    }
  }
);

export const getBrewerHopAdviceActivityV1 = onCall<HopAdviceV1ActivityRequest, Promise<HopAdviceV1ActivityReceipt>>(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request), db = getFirestore();
    const rows = await db.collection(HOP_ADVICE_V1_COLLECTIONS.jobs).where('uid', '==', uid)
      .orderBy('createdAt', 'desc').limit(50).get();
    const jobs = await Promise.all(rows.docs.map(async (doc) => {
      const data = doc.data();
      if (!hasHopAdviceV1Stamp(data)) {
        if (!terminal(data.status)) await db.runTransaction(async (tx) => {
          const current = (await tx.get(doc.ref)).data();
          if (current && !terminal(current.status)) tx.update(doc.ref, {
            status: 'error',
            error: { code: 'invalid-protocol', message: 'Version de lecture assistée absente ou non prise en charge. Aucun modèle n’a été appelé.', retryable: false },
            finishedAt: Date.now(), updatedAt: Date.now()
          });
        });
        const current = (await doc.ref.get()).data() ?? data;
        return { ...publicJob(current), protocol: 'unsupported' as const } as HopAdviceV1UnsupportedJob;
      }
      const sessionRef = db.doc(`${HOP_ADVICE_V1_COLLECTIONS.conversations}/${data.threadId}`);
      const session = (await sessionRef.get()).data();
      if (!isHopAdviceV1JobInCurrentGeneration(data, session)) {
        // Keep the source payload/history; make stale jobs non-retryable while reset cleanup catches up.
        await db.runTransaction(async (tx) => {
          const [current, currentSession] = await Promise.all([tx.get(doc.ref), tx.get(sessionRef)]);
          const currentData = current.data(), currentSessionData = currentSession.data();
          if (currentData && hasHopAdviceV1Stamp(currentData) && currentData.status !== 'cancelled' &&
              !isHopAdviceV1JobInCurrentGeneration(currentData, currentSessionData))
            tx.update(doc.ref, {
              status: 'cancelled',
              error: { code: 'stale-generation', message: 'Cette ancienne question appartient à une conversation réinitialisée; relance une nouvelle lecture.', retryable: false },
              finishedAt: currentData.finishedAt ?? Date.now(),
              updatedAt: Date.now()
            });
        });
        return undefined;
      }
      if (!terminal(data.status) && Date.now() - data.createdAt > 1800000) {
        await db.runTransaction(async (tx) => {
          const current = (await tx.get(doc.ref)).data();
          if (current && hasHopAdviceV1Stamp(current) && !terminal(current.status))
            tx.update(doc.ref, { status: 'error', error: jobError(Error('deadline')), finishedAt: Date.now(), updatedAt: Date.now() });
        });
        return v1PublicJob((await doc.ref.get()).data());
      }
      return v1PublicJob(data);
    }));
    return { protocol: HOP_ADVICE_PROTOCOL_V1.name,
      jobs: jobs.flatMap((job) => job && job.status !== 'cancelled' ? [job] : []) };
  }
);

export const markBrewerHopAdviceReadV1 = onCall<HopAdviceV1MarkReadRequest, Promise<HopAdviceV1MarkReadReceipt>>(
  { region: 'europe-west6', maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request), id = request.data?.jobId;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) throw new HttpsError('invalid-argument', 'Message assisté invalide.');
    const db = getFirestore(), ref = db.doc(`${HOP_ADVICE_V1_COLLECTIONS.jobs}/${id}`);
    await db.runTransaction(async (tx) => {
      const job = (await tx.get(ref)).data();
      if (!job || job.uid !== uid || !hasHopAdviceV1Stamp(job))
        throw new HttpsError('not-found', 'Message assisté introuvable dans son protocole.');
      if (terminal(job.status)) tx.update(ref, { readAt: Date.now() });
    });
    return { ok: true, protocol: HOP_ADVICE_PROTOCOL_V1.name };
  }
);

/** A retry keeps the V1 marker and original handoff; there is deliberately no ordinary enqueue fallback. */
export const retryBrewerHopAdviceQuestionV1 = onCall<HopAdviceV1RetryRequest, Promise<HopAdviceV1RetryReceipt>>(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request), id = request.data.jobId, operationId = request.data.operationId;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id) || !validOperationId(operationId))
      throw new HttpsError('invalid-argument', 'Identifiant de reprise assistée invalide.');
    const db = getFirestore(), job = (await db.doc(`${HOP_ADVICE_V1_COLLECTIONS.jobs}/${id}`).get()).data();
    if (!job || job.uid !== uid || !hasHopAdviceV1Stamp(job))
      throw new HttpsError('not-found', 'Question assistée introuvable dans son protocole.');
    if (job.status !== 'error' || !job.wireInput)
      throw new HttpsError('failed-precondition', 'Cette lecture assistée ne peut pas être relancée.');
    let validatedSource: ReturnType<typeof validateHopAdviceV1RetrySource>;
    try {
      validatedSource = validateHopAdviceV1RetrySource({
        sourceJob: job,
        sourceDocumentId: id,
        ownerUid: uid,
        expectedThreadId: job.threadId,
        currentGeneration: job.generation,
        requestedGeneration: request.data.generation == null ? undefined : request.data.generation,
        canonicalize: (parsed) => validateHopAdviceV1ChatInput(parsed, uid).input,
        stableJson
      });
    } catch {
      throw new HttpsError('failed-precondition', 'La question source est altérée ou n’appartient plus à la génération courante; aucune reprise n’a été créée.', { reason: 'chat-reset' });
    }
    const wireInput = { ...validatedSource.wireInput, operationId,
      ...(request.data.generation == null ? {} : { generation: request.data.generation }) };
    return enqueueBrewerHopAdviceV1(uid, wireInput, id);
  }
);
