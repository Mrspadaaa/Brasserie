import { createHash, randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { requireBrewer } from './brewSession.js';
import { GEMINI_API_KEY } from './ai.js';
import { geminiTransport, runBrewerHarness, BrewerProUnavailableError } from './brewerHarness.js';
import { normalizeRecipe } from './brewerTools.js';
import {
  BATCH_FIELDS,
  RECIPE_FIELDS,
  cleanContext,
  pick,
  scopeKey,
  validateChatInput,
  validateScope
} from './brewerContext.js';
import { stableJson } from './backupCore.js';
import type {
  BrewerChatInput,
  BrewerContext,
  BrewerScope,
  BrewerTurn,
  BrewerPending,
  BrewerReply
} from './companionTypes.js';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
// A saved recipe retains conversations held while editing its draft.
const threadKey = (uid: string, scope: BrewerScope) =>
  hash(`${uid}:${scopeKey(scope.kind === 'draft' ? { ...scope, kind: 'recipe' } : scope)}`);
const publicTurn = (d: any): BrewerTurn =>
  pick(d, [
    'id',
    'operationId',
    'question',
    'advice',
    'evidence',
    'createdAt',
    'model',
    'reviewed',
    'reviewModel',
    'reviewReason',
    'mode',
    'contextLabel'
  ]);
const publicPending = (active: any): BrewerPending | undefined =>
  active?.until > Date.now() && typeof active.operationId === 'string'
    ? {
        operationId: active.operationId,
        question: String(active.question ?? ''),
        until: active.until
      }
    : undefined;
export async function loadBrewerContext(input: BrewerChatInput): Promise<BrewerContext> {
  const db = getFirestore();
  const [config, stock, material, doc] = await Promise.all([
    db.doc('config/app').get(),
    db.collection('stockItems').limit(500).get(),
    db.collection('equipment').limit(200).get(),
    input.scope.kind === 'draft'
      ? Promise.resolve(null)
      : db.doc(`${input.scope.kind === 'batch' ? 'batches' : 'recipes'}/${input.scope.id}`).get()
  ]);
  if (doc && !doc.exists)
    throw new HttpsError('not-found', 'Cette recette ou ce lot n’existe plus.');
  const cfg = config.data(),
    batch = input.scope.kind === 'batch' ? doc?.data() : undefined;
  let recipe =
    input.scope.kind === 'draft'
      ? input.draft
      : (batch?.recipeSnapshot ?? (input.scope.kind === 'recipe' ? doc?.data() : undefined));
  const provenance = [
    input.scope.kind === 'draft'
      ? 'Brouillon non enregistré'
      : batch?.recipeSnapshot
        ? 'Recette figée au lancement du lot'
        : 'Recette enregistrée'
  ];
  if (!recipe && batch?.recipeRef) {
    const source = await db.doc(`recipes/${String(batch.recipeRef).replace(/\//g, '')}`).get();
    recipe = source.data();
    provenance.push(
      'Ancien lot sans snapshot : recette actuelle du catalogue, peut différer de ce qui a été brassé.'
    );
  }
  const current =
    cfg?.brewhouses?.find((b: any) => b.id === cfg.activeBrewhouseId) ?? cfg?.brewhouses?.[0];
  const journal = batch?.brewDay;
  const local =
    input.localJournal && stableJson(input.localJournal) !== stableJson(journal)
      ? input.localJournal
      : undefined;
  if (local)
    provenance.push(
      'Le journal affiché diffère du journal serveur : les valeurs locales sont non confirmées, les outils utilisent le serveur.'
    );
  if (!recipe)
    provenance.push(
      'Aucune recette retrouvée : ingrédients/cibles inconnus, ne pas reconstruire le lot par supposition.'
    );
  const phase =
    batch?.status && batch.status !== 'planifie'
      ? batch.status
      : (journal?.steps?.[journal.currentIndex]?.label ?? input.phase ?? input.scope.kind);
  return cleanContext({
    recipe: recipe ? normalizeRecipe(pick(recipe, RECIPE_FIELDS)) : undefined,
    journal,
    localJournal: local,
    batch: batch ? pick(batch, BATCH_FIELDS) : undefined,
    equipment: current,
    inventory: stock.docs.map((d) =>
      pick(
        { ...d.data(), id: d.id },
        'id name category currentStock unit alphaPct colorEbc potentialPpg technicalSource yeastLab yeastStrain yeastForm yeastAttenuationPct yeastTempMinC yeastTempMaxC'.split(
          ' '
        )
      )
    ),
    material: material.docs.map((d) =>
      pick(d.data(), 'name category state maintenance notes'.split(' '))
    ),
    waterSources: cfg?.waterSources ?? [],
    phase,
    now: Date.now(),
    provenance
  });
}
async function history(threadId: string, before?: number) {
  let query = getFirestore()
    .collection('brewerChats')
    .where('threadId', '==', threadId)
    .orderBy('createdAt', 'desc');
  if (before != null) query = query.where('createdAt', '<', before);
  const rows = await query.limit(20).get();
  return rows.docs.map((d) => publicTurn(d.data())).reverse();
}
export const getBrewerConversation = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 2 },
  async (request) => {
    const uid = requireBrewer(request);
    let scope: BrewerScope;
    try {
      scope = validateScope(request.data?.scope);
    } catch (e) {
      throw new HttpsError('invalid-argument', (e as Error).message);
    }
    const before = request.data?.before;
    if (before != null && (!Number.isFinite(before) || before <= 0))
      throw new HttpsError('invalid-argument', 'Date invalide.');
    const threadId = threadKey(uid, scope),
      operationId = request.data?.operationId;
    if (operationId != null) {
      if (typeof operationId !== 'string' || !/^[\w-]{16,100}$/.test(operationId))
        throw new HttpsError('invalid-argument', 'Identifiant de message invalide.');
      const db = getFirestore();
      // One consistent read: never observe an unlocked conversation without its committed answer.
      return db.runTransaction(async (tx) => {
        const [turn, session] = await Promise.all([
          tx.get(db.doc(`brewerChats/${hash(uid + ':' + operationId)}`)),
          tx.get(db.doc(`brewerConversations/${threadId}`))
        ]);
        if (turn.exists && turn.data()?.threadId !== threadId)
          throw new HttpsError(
            'invalid-argument',
            'Ce message appartient à une autre conversation.'
          );
        const pending = publicPending(session.data()?.active);
        return turn.exists ? { turn: publicTurn(turn.data()) } : pending ? { pending } : {};
      });
    }
    return { turns: await history(threadId, before) };
  }
);

export const askBrewer = onCall(
  {
    region: 'europe-west6',
    timeoutSeconds: 300,
    memory: '512MiB',
    maxInstances: 3,
    secrets: [GEMINI_API_KEY]
  },
  async (request) => {
    const uid = requireBrewer(request);
    let input: BrewerChatInput;
    try {
      input = validateChatInput(request.data);
    } catch (e) {
      throw new HttpsError('invalid-argument', (e as Error).message);
    }
    const db = getFirestore(),
      threadId = threadKey(uid, input.scope),
      digest = hash(stableJson(input));
    const turnRef = db.doc(`brewerChats/${hash(uid + ':' + input.operationId)}`),
      lock = db.doc(`brewerConversations/${threadId}`),
      fence = randomUUID();
    const startedAt = Date.now();
    const cached = await db.runTransaction(async (tx): Promise<BrewerReply | null> => {
      const [turn, session] = await Promise.all([tx.get(turnRef), tx.get(lock)]);
      if (turn.exists) {
        if (turn.data()!.inputDigest !== digest)
          throw new HttpsError('already-exists', 'Ce message a déjà un autre contenu.');
        return { turn: publicTurn(turn.data()) };
      }
      const active = session.data()?.active;
      const pending = publicPending(active);
      if (pending) {
        if (
          active.operationId === input.operationId &&
          active.inputDigest &&
          active.inputDigest !== digest
        )
          throw new HttpsError('already-exists', 'Ce message a déjà un autre contenu.');
        return { pending };
      }
      // The lease outlives the harness deadline. Fencing prevents late results overwriting a retry.
      tx.set(lock, {
        uid,
        scope: input.scope,
        active: {
          fence,
          operationId: input.operationId,
          inputDigest: digest,
          question: input.question,
          until: Date.now() + 250000
        },
        updatedAt: Date.now()
      });
      return null;
    });
    if (cached) return cached;
    let stage = 'context';
    try {
      const context = await loadBrewerContext(input),
        past = await history(threadId);
      stage = 'analysis';
      const result = await runBrewerHarness(
        context,
        input.question,
        past,
        geminiTransport(GEMINI_API_KEY.value()),
        { mode: input.mode }
      );
      stage = 'persistence';
      // Reuse identical context snapshots: repeated questions don't duplicate recipe + inventory.
      const snapshot = cleanContext({ ...context, now: undefined }),
        contextId = hash(stableJson(snapshot));
      const contextRef = db.doc(`brewerContexts/${contextId}`);
      const turn = cleanContext({
        id: turnRef.id,
        threadId,
        uid,
        scope: input.scope,
        inputDigest: digest,
        operationId: input.operationId,
        question: input.question,
        ...result,
        createdAt: Date.now(),
        contextLabel: `${context.recipe?.name || context.batch?.name || 'Brouillon'} · ${context.phase}`,
        contextId,
        contextAt: context.now
      });
      if (
        Buffer.byteLength(JSON.stringify(turn)) > 650000 ||
        Buffer.byteLength(JSON.stringify(snapshot)) > 650000
      )
        throw new Error('Conversation trop volumineuse.');
      await db.runTransaction(async (tx) => {
        const [current, previousContext] = await Promise.all([tx.get(lock), tx.get(contextRef)]);
        if (current.data()?.active?.fence !== fence)
          throw new HttpsError(
            'aborted',
            'Une nouvelle analyse a repris ce message. Réessaie pour retrouver la réponse.'
          );
        if (!previousContext.exists) tx.create(contextRef, { id: contextId, context: snapshot });
        tx.create(turnRef, turn);
        tx.set(lock, {
          uid,
          scope: input.scope,
          active: null,
          updatedAt: Date.now()
        });
      });
      logger.info('brewer-answer', {
        model: result.model,
        reviewModel: result.reviewModel,
        reviewReason: result.reviewReason,
        elapsedMs: Date.now() - startedAt,
        tools: result.trace.length,
        reviewed: true
      });
      return { turn: publicTurn(turn) };
    } catch (e) {
      await db
        .runTransaction(async (tx) => {
          const s = await tx.get(lock);
          if (s.data()?.active?.fence === fence) tx.update(lock, { active: null });
        })
        .catch(() => {});
      logger.warn('brewer-answer-failed', {
        type: e instanceof HttpsError ? e.code : 'provider-or-validation',
        stage,
        elapsedMs: Date.now() - startedAt,
        reason: /vérification/.test(String((e as Error)?.message))
          ? 'review-rejected'
          : /timeout|aborted/i.test(String((e as Error)?.message))
            ? 'deadline'
            : 'provider-or-format'
      });
      if (e instanceof HttpsError) throw e;
      if (e instanceof BrewerProUnavailableError)
        throw new HttpsError('unavailable', e.message, {
          reason: 'pro-unavailable'
        });
      throw new HttpsError(
        'unavailable',
        'Le conseil n’a pas pu être vérifié. Réessaie ; les calculateurs restent disponibles.'
      );
    }
  }
);
