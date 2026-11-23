import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { requireBrewer } from './brewSession.js';
import { validateScope } from './brewerContext.js';
import { history, publicTurn } from './brewerChat.js';
import { publicJob } from './brewerJobs.js';
import {
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_COLLECTIONS,
  hopAdviceV1ThreadKey,
  hasHopAdviceV1Stamp,
  type HopAdviceV1ConversationReceipt,
  type HopAdviceV1ConversationRequest,
  type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn,
  type HopAdviceV1ResetReceipt,
  type HopAdviceV1ResetRequest
} from './brewerHopAdviceLaneV1.js';

const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
const validOperationId = (value: unknown) => typeof value === 'string' && /^[\w-]{16,100}$/.test(value);
const publicPending = (active: any) => active?.until > Date.now() && typeof active.operationId === 'string'
  ? { operationId: active.operationId, question: String(active.question ?? ''), until: active.until }
  : undefined;
const v1PublicJob = (job: any): HopAdviceV1PublicJob => ({ ...publicJob(job), protocol: HOP_ADVICE_PROTOCOL_V1.name });
const v1PublicTurn = (turn: any): HopAdviceV1PublicTurn => ({ ...publicTurn(turn), protocol: HOP_ADVICE_PROTOCOL_V1.name });

export const getBrewerHopAdviceConversationV1 = onCall<HopAdviceV1ConversationRequest, Promise<HopAdviceV1ConversationReceipt>>(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 2 },
  async (request) => {
    const uid = requireBrewer(request);
    let scope;
    try { scope = validateScope(request.data?.scope); }
    catch (error) { throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Source invalide.'); }
    const before = request.data?.before;
    if (before != null && (!Number.isFinite(before) || before <= 0)) throw new HttpsError('invalid-argument', 'Date invalide.');
    const threadId = hopAdviceV1ThreadKey(uid, scope), operationId = request.data?.operationId;
    const db = getFirestore();

    if (operationId != null) {
      if (!validOperationId(operationId)) throw new HttpsError('invalid-argument', 'Identifiant de message assisté invalide.');
      return db.runTransaction(async (tx) => {
        const id = hash(`${uid}:${operationId}`);
        const [turnDoc, sessionDoc, jobDoc] = await Promise.all([
          tx.get(db.doc(`${HOP_ADVICE_V1_COLLECTIONS.chats}/${id}`)),
          tx.get(db.doc(`${HOP_ADVICE_V1_COLLECTIONS.conversations}/${threadId}`)),
          tx.get(db.doc(`${HOP_ADVICE_V1_COLLECTIONS.jobs}/${id}`))
        ]);
        const turn = turnDoc.data(), job = jobDoc.data(), session = sessionDoc.data();
        const generation = session?.generation ?? 0;
        if ((request.data?.generation ?? 0) !== generation)
          throw new HttpsError('failed-precondition', 'Cette conversation assistée a été réinitialisée.', { reason: 'chat-reset', generation });
        if (session && session.protocol !== HOP_ADVICE_PROTOCOL_V1.name)
          throw new HttpsError('failed-precondition', 'La conversation ne porte pas le protocole assisté attendu.');
        if ((turn && (turn.threadId !== threadId || turn.protocol !== HOP_ADVICE_PROTOCOL_V1.name)) ||
            (job && (job.threadId !== threadId || !hasHopAdviceV1Stamp(job))))
          throw new HttpsError('invalid-argument', 'Ce message n’appartient pas à ce fil assisté.');
        const pending = publicPending(session?.active);
        return turn && (turn.generation ?? 0) === generation
          ? { turn: v1PublicTurn(turn), protocol: HOP_ADVICE_PROTOCOL_V1.name }
          : job && job.generation === generation
            ? { job: v1PublicJob(job), ...(pending ? { pending } : {}), protocol: HOP_ADVICE_PROTOCOL_V1.name }
            : pending ? { pending, protocol: HOP_ADVICE_PROTOCOL_V1.name } : { protocol: HOP_ADVICE_PROTOCOL_V1.name };
      });
    }

    const session = (await db.doc(`${HOP_ADVICE_V1_COLLECTIONS.conversations}/${threadId}`).get()).data();
    if (session && session.protocol !== HOP_ADVICE_PROTOCOL_V1.name)
      throw new HttpsError('failed-precondition', 'La conversation ne porte pas le protocole assisté attendu.');
    const generation = session?.generation ?? 0;
    const turns = (await history(threadId, before, session?.resetAt, HOP_ADVICE_V1_COLLECTIONS.chats)).map(v1PublicTurn);
    if (turns.some((turn) => turn.protocol !== HOP_ADVICE_PROTOCOL_V1.name))
      throw new HttpsError('failed-precondition', 'Le fil contient un reçu sans protocole assisté.');
    let draft;
    if (scope.kind === 'draft') {
      const last = await db.collection(HOP_ADVICE_V1_COLLECTIONS.chats).where('threadId', '==', threadId)
        .orderBy('createdAt', 'desc').limit(1).get();
      const row = last.docs[0]?.data();
      if (row?.protocol === HOP_ADVICE_PROTOCOL_V1.name && row.contextId && (row.generation ?? 0) === generation)
        draft = (await db.doc(`${HOP_ADVICE_V1_COLLECTIONS.contexts}/${row.contextId}`).get()).data()?.context?.recipe;
    }
    return { turns, generation, protocol: HOP_ADVICE_PROTOCOL_V1.name, ...(draft ? { draft } : {}) };
  }
);

/** Reset fences and removes only receipts in the V1 namespace. */
export const resetBrewerHopAdviceConversationV1 = onCall<HopAdviceV1ResetRequest, Promise<HopAdviceV1ResetReceipt>>(
  { region: 'europe-west6', timeoutSeconds: 60, maxInstances: 2 },
  async (request) => {
    const uid = requireBrewer(request);
    let scope;
    try { scope = validateScope(request.data?.scope); }
    catch (error) { throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Source invalide.'); }
    const { operationId, generation } = request.data ?? {};
    if (!validOperationId(operationId) || !Number.isSafeInteger(generation) || generation < 0)
      throw new HttpsError('invalid-argument', 'Remise à zéro assistée invalide.');

    const db = getFirestore(), threadId = hopAdviceV1ThreadKey(uid, scope);
    const ref = db.doc(`${HOP_ADVICE_V1_COLLECTIONS.conversations}/${threadId}`);
    const reset = await db.runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (current && current.protocol !== HOP_ADVICE_PROTOCOL_V1.name)
        throw new HttpsError('failed-precondition', 'La conversation ne porte pas le protocole assisté attendu.');
      if (current && current.resetOperationId === operationId) return { generation: current.generation, resetAt: current.resetAt };
      if ((current?.generation ?? 0) !== generation)
        throw new HttpsError('failed-precondition', 'Cette conversation assistée a déjà changé. Rouvre le fil.', { reason: 'chat-reset' });
      const next = { generation: generation + 1, resetAt: Date.now() };
      tx.set(ref, { uid, scope, protocol: HOP_ADVICE_PROTOCOL_V1.name, ...next, resetOperationId: operationId, active: null, updatedAt: next.resetAt });
      return next;
    });

    for (;;) {
      const rows = await db.collection(HOP_ADVICE_V1_COLLECTIONS.chats).where('threadId', '==', threadId)
        .where('createdAt', '<=', reset.resetAt).orderBy('createdAt', 'desc').limit(400).get();
      if (rows.empty) break;
      const batch = db.batch();
      rows.docs.forEach((row) => batch.delete(row.ref));
      await batch.commit();
    }
    const oldJobs = await db.collection(HOP_ADVICE_V1_COLLECTIONS.jobs).where('threadId', '==', threadId).get();
    for (const job of oldJobs.docs) {
      if (job.data().generation < reset.generation)
        await job.ref.delete();
    }
    return { generation: reset.generation, protocol: HOP_ADVICE_PROTOCOL_V1.name };
  }
);
