import { createHash, randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { requireBrewer } from './brewSession.js';
import { GEMINI_API_KEY } from './ai.js';
import { geminiTransport, runBrewerHarness, BrewerProUnavailableError } from './brewerHarness.js';
import { normalizeRecipe, refreshCompanionRecipe } from './brewerTools.js';
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
import { applyProposal, proposalBasis } from './brewerProposals.js';
import { stampSession } from './brewSessionCore.js';
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
    'contextLabel',
    'proposal'
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
    provenance,
    editableTargets: (input.editableTargets ?? []).filter(
      (target) => target !== 'journal' || !local
    )
  });
}
async function history(threadId: string, before?: number, resetAt = 0) {
  let query = getFirestore()
    .collection('brewerChats')
    .where('threadId', '==', threadId)
    .orderBy('createdAt', 'desc');
  if (resetAt) query = query.where('createdAt', '>', resetAt);
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
        const generation = session.data()?.generation ?? 0;
        if ((request.data?.generation ?? 0) !== generation)
          throw new HttpsError('failed-precondition', 'Cette conversation a été réinitialisée.', {
            reason: 'chat-reset',
            generation
          });
        if (turn.exists && turn.data()?.threadId !== threadId)
          throw new HttpsError(
            'invalid-argument',
            'Ce message appartient à une autre conversation.'
          );
        const pending = publicPending(session.data()?.active);
        return turn.exists && (turn.data()?.generation ?? 0) === generation
          ? { turn: publicTurn(turn.data()) }
          : pending
            ? { pending }
            : {};
      });
    }
    const session = (await getFirestore().doc(`brewerConversations/${threadId}`).get()).data();
    return {
      turns: await history(threadId, before, session?.resetAt),
      generation: session?.generation ?? 0
    };
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
      const generation = session.data()?.generation ?? 0;
      if ((input.generation ?? 0) !== generation)
        throw new HttpsError('failed-precondition', 'Cette conversation a été réinitialisée.', {
          reason: 'chat-reset',
          generation
        });
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
        ...session.data(),
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
        session = (await lock.get()).data(),
        past = await history(threadId, undefined, session?.resetAt);
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
        generation: input.generation ?? 0,
        question: input.question,
        ...result,
        // The immutable context snapshot is the baseline; don't duplicate it in every proposal.
        ...(result.proposal ? { proposal: { ...result.proposal, basis: undefined } } : {}),
        createdAt: Math.max(Date.now(), (session?.resetAt ?? 0) + 1),
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
          ...current.data(),
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

/** Reset is durable and fences in-flight requests before removing their old receipts. */
export const resetBrewerConversation = onCall(
  { region: 'europe-west6', timeoutSeconds: 60, maxInstances: 2 },
  async (request) => {
    const uid = requireBrewer(request);
    let scope: BrewerScope;
    try {
      scope = validateScope(request.data?.scope);
    } catch (e) {
      throw new HttpsError('invalid-argument', (e as Error).message);
    }
    const { operationId, generation } = request.data ?? {};
    if (
      typeof operationId !== 'string' ||
      !/^[\w-]{16,100}$/.test(operationId) ||
      !Number.isSafeInteger(generation) ||
      generation < 0
    )
      throw new HttpsError('invalid-argument', 'Remise à zéro invalide.');
    const db = getFirestore(),
      threadId = threadKey(uid, scope),
      ref = db.doc(`brewerConversations/${threadId}`);
    const reset = await db.runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (current?.resetOperationId === operationId)
        return { generation: current.generation, resetAt: current.resetAt };
      if ((current?.generation ?? 0) !== generation)
        throw new HttpsError(
          'failed-precondition',
          'Cette conversation a déjà changé. Rouvre le compagnon.',
          { reason: 'chat-reset' }
        );
      const next = { generation: generation + 1, resetAt: Date.now() };
      tx.set(ref, {
        uid,
        scope,
        ...next,
        resetOperationId: operationId,
        active: null,
        updatedAt: next.resetAt
      });
      return next;
    });
    // Old model jobs cannot commit after the fence changed. New messages are after resetAt.
    for (;;) {
      const rows = await db
        .collection('brewerChats')
        .where('threadId', '==', threadId)
        .where('createdAt', '<=', reset.resetAt)
        .orderBy('createdAt', 'desc')
        .limit(400)
        .get();
      if (rows.empty) break;
      const batch = db.batch();
      rows.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    return { generation: reset.generation };
  }
);

/** Only the explicit confirmation button calls this endpoint. The model has no write tool. */
export const applyBrewerProposal = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request);
    const { turnId, selectedIds, decision, confirmed } = request.data ?? {};
    let scope: BrewerScope;
    try {
      scope = validateScope(request.data?.scope);
    } catch (e) {
      throw new HttpsError('invalid-argument', (e as Error).message);
    }
    if (
      confirmed !== true ||
      typeof turnId !== 'string' ||
      !/^[a-f0-9]{64}$/.test(turnId) ||
      !['apply', 'dismiss'].includes(decision) ||
      !Array.isArray(selectedIds) ||
      selectedIds.length > 20 ||
      selectedIds.some((x: unknown) => typeof x !== 'string')
    )
      throw new HttpsError('invalid-argument', 'Validation explicite des modifications requise.');
    const db = getFirestore(),
      threadId = threadKey(uid, scope),
      turnRef = db.doc(`brewerChats/${turnId}`),
      sessionRef = db.doc(`brewerConversations/${threadId}`);
    return db.runTransaction(async (tx) => {
      const [turnDoc, session, entity] = await Promise.all([
        tx.get(turnRef),
        tx.get(sessionRef),
        scope.kind === 'draft'
          ? Promise.resolve(null)
          : tx.get(db.doc(`${scope.kind === 'recipe' ? 'recipes' : 'batches'}/${scope.id}`))
      ]);
      const turn = turnDoc.data();
      if (
        !turn ||
        turn.uid !== uid ||
        turn.threadId !== threadId ||
        (turn.generation ?? 0) !== (session.data()?.generation ?? 0)
      )
        throw new HttpsError('not-found', 'Proposition introuvable dans cette conversation.');
      let proposal = turn.proposal;
      if (!proposal || !turn.reviewed)
        throw new HttpsError('failed-precondition', 'Aucune proposition vérifiée.');
      if (scope.kind !== 'draft' && !entity?.exists)
        throw new HttpsError('not-found', 'Recette ou lot introuvable.');
      const snapshot = (await tx.get(db.doc(`brewerContexts/${turn.contextId}`))).data()
        ?.context as BrewerContext;
      if (!snapshot)
        throw new HttpsError('failed-precondition', 'Contexte de la proposition manquant.');
      proposal = { ...proposal, basis: proposalBasis(snapshot, proposal.target) };
      const allowed = scope.kind === 'batch' ? ['batch', 'journal'] : ['recipe'];
      if (!allowed.includes(proposal.target))
        throw new HttpsError('invalid-argument', 'Cible de modification invalide.');
      const current: BrewerContext = { ...snapshot, editableTargets: [proposal.target] };
      if (proposal.target === 'recipe')
        current.recipe = normalizeRecipe(
          pick(scope.kind === 'draft' ? request.data?.draft : entity!.data(), RECIPE_FIELDS)
        );
      else {
        current.batch = pick(entity!.data(), BATCH_FIELDS);
        current.journal = entity!.data()?.brewDay;
        if (entity!.data()?.recipeSnapshot)
          current.recipe = normalizeRecipe(pick(entity!.data()?.recipeSnapshot, RECIPE_FIELDS));
      }
      if (proposal.status) {
        if (
          proposal.status !== (decision === 'apply' ? 'applied' : 'dismissed') ||
          stableJson(proposal.acceptedIds ?? []) !== stableJson(selectedIds)
        )
          throw new HttpsError('already-exists', 'Cette proposition a déjà été traitée.');
        // A lost response to a draft confirmation returns the same field values on retry.
        return {
          turn: publicTurn(turn),
          ...(scope.kind === 'draft' && decision === 'apply'
            ? {
                value: applyProposal(
                  { ...snapshot, editableTargets: ['recipe'] },
                  { ...proposal, status: undefined },
                  selectedIds
                )
              }
            : {})
        };
      }
      let next: any;
      if (decision === 'apply') {
        try {
          next = applyProposal(current, proposal, selectedIds);
        } catch (e) {
          throw new HttpsError('failed-precondition', (e as Error).message, {
            reason: 'proposal-stale'
          });
        }
        if (proposal.target === 'recipe') next = refreshCompanionRecipe(next);
      } else if (selectedIds.length)
        throw new HttpsError('invalid-argument', 'Une proposition écartée ne modifie aucun champ.');
      const now = Date.now();
      const decided = {
        ...proposal,
        status: decision === 'apply' ? 'applied' : 'dismissed',
        acceptedIds: selectedIds,
        decidedAt: now
      };
      delete decided.basis;
      if (decision === 'apply' && scope.kind !== 'draft') {
        if (proposal.target === 'journal') {
          next.notes = [
            ...(next.notes ?? []),
            {
              id: `companion-${turnId.slice(0, 16)}`,
              at: now,
              stepId: next.steps?.[next.currentIndex]?.id ?? 'notes',
              text: `Compagnon · validé : ${proposal.changes
                .filter((ch: any) => selectedIds.includes(ch.id))
                .map((ch: any) => `${ch.label} → ${JSON.stringify(ch.value)} ${ch.unit ?? ''}`)
                .join(' ; ')}`
            }
          ];
          tx.update(entity!.ref, { brewDay: stampSession(next, current.journal, now, now) });
        } else {
          const roots = [
            ...new Set<string>(
              proposal.changes
                .filter((ch: any) => selectedIds.includes(ch.id))
                .map((ch: any) => ch.path.split('.')[0])
            )
          ];
          if (proposal.target === 'recipe' && roots.includes('fermentables'))
            roots.push('totalGristKg');
          if (
            proposal.target === 'recipe' &&
            roots.some((root) => ['fermentables', 'waterPlan'].includes(root))
          )
            roots.push('preBoilL', 'preBoilHotL', 'waterPlan');
          tx.update(entity!.ref, pick(next, roots));
        }
        const auditId = `LOG-${String(now).padStart(14, '0')}-companion-${turnId.slice(0, 16)}`;
        const accepted = proposal.changes.filter((ch: any) => selectedIds.includes(ch.id));
        tx.create(db.doc(`auditLogs/${auditId}`), {
          id: auditId,
          timestamp: new Date(now).toLocaleString('fr-CH', { timeZone: 'Europe/Zurich' }),
          user: request.data.actor === 'Aricia' ? 'Aricia' : 'Gaëtan',
          approvedByUid: uid,
          action: 'Modification',
          category: 'Production',
          entityId: scope.id,
          source: 'brewer-companion',
          proposalTurnId: turnId,
          summary: `Compagnon · modifications validées : ${proposal.title}`,
          details: accepted
            .map(
              (ch: any) =>
                `${ch.label} : ${JSON.stringify(ch.before)} → ${JSON.stringify(ch.value)} ${ch.unit ?? ''}`
            )
            .join('\n'),
          changes: accepted
        });
      }
      // A wizard draft is local and can disappear on reload. Persisting "applied" here would
      // falsely claim that its fields were saved; only the live form marks this proposal applied.
      if (scope.kind !== 'draft' || decision === 'dismiss')
        tx.update(turnRef, { proposal: decided });
      return {
        turn: publicTurn({ ...turn, proposal: decided }),
        ...(scope.kind === 'draft' && decision === 'apply' ? { value: next } : {})
      };
    });
  }
);
