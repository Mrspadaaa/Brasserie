import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { requireBrewer } from './brewSession.js';
import { normalizeRecipe, refreshCompanionRecipe } from './brewerTools.js';
import {
  BATCH_FIELDS,
  RECIPE_FIELDS,
  cleanContext,
  pick,
  scopeKey,
  validateScope
} from './brewerContext.js';
import { publicJob } from './brewerJobs.js';
import { stableJson } from './backupCore.js';
import { applyProposal, proposalBasis } from './brewerProposals.js';
import { stampSession } from './brewSessionCore.js';
import { loadBrewerAppContext } from './brewerAppContext.js';
import type {
  BrewerChatInput,
  BrewerContext,
  BrewerScope,
  BrewerTurn,
  BrewerPending
} from './companionTypes.js';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
// A saved recipe retains conversations held while editing its draft.
export const threadKey = (uid: string, scope: BrewerScope) =>
  hash(`${uid}:${scopeKey(scope.kind === 'draft' ? { ...scope, kind: 'recipe' } : scope)}`);
export const publicTurn = (d: any): BrewerTurn =>
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
    ['draft', 'app'].includes(input.scope.kind)
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
    input.scope.kind === 'app'
      ? 'Écran de la brasserie : données serveur de cette section, aucune recette sélectionnée. Aucun champ modifiable depuis cette vue. Les filtres locaux de période ne sont pas appliqués à cet aperçu.'
      : input.scope.kind === 'draft'
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
  if (!recipe && input.scope.kind !== 'app')
    provenance.push(
      'Aucune recette retrouvée : ingrédients/cibles inconnus, ne pas reconstruire le lot par supposition.'
    );
  const workspace = input.scope.kind === 'app' ? await loadBrewerAppContext(input.scope.id) : undefined;
  if (workspace?.truncated.length)
    provenance.push(`Aperçu limité à 80 lignes par collection : ${workspace.truncated.join(', ')}. Ne pas présenter cet échantillon comme un total exhaustif.`);
  const phase = workspace?.screen ?? (
    batch?.status && batch.status !== 'planifie'
      ? batch.status
      : (journal?.steps?.[journal.currentIndex]?.label ?? input.phase ?? input.scope.kind));
  return cleanContext({
    workspace,
    recipe: recipe ? normalizeRecipe(pick(recipe, RECIPE_FIELDS)) : undefined,
    journal,
    localJournal: local,
    batch: batch ? pick(batch, BATCH_FIELDS) : undefined,
    equipment: current,
    inventory: stock.docs.map((d) =>
      pick(
        { ...d.data(), id: d.id },
        'id name category currentStock minStock maxStock reorder supplier pricePerUnit unit alphaPct colorEbc potentialPpg technicalSource yeastLab yeastStrain yeastForm yeastAttenuationPct yeastTempMinC yeastTempMaxC'.split(
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
    editableTargets: input.scope.kind === 'app' ? [] : (input.editableTargets ?? []).filter(
      (target) => target !== 'journal' || !local
    )
  });
}
export async function history(threadId: string, before?: number, resetAt = 0) {
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
        const [turn, session, job] = await Promise.all([
          tx.get(db.doc(`brewerChats/${hash(uid + ':' + operationId)}`)),
          tx.get(db.doc(`brewerConversations/${threadId}`)),
          tx.get(db.doc(`brewerJobs/${hash(uid + ':' + operationId)}`))
        ]);
        const generation = session.data()?.generation ?? 0;
        if ((request.data?.generation ?? 0) !== generation)
          throw new HttpsError('failed-precondition', 'Cette conversation a été réinitialisée.', {
            reason: 'chat-reset',
            generation
          });
        if (
          (turn.exists && turn.data()?.threadId !== threadId) ||
          (job.exists && job.data()?.threadId !== threadId)
        )
          throw new HttpsError(
            'invalid-argument',
            'Ce message appartient à une autre conversation.'
          );
        const pending = publicPending(session.data()?.active);
        return turn.exists && (turn.data()?.generation ?? 0) === generation
          ? { turn: publicTurn(turn.data()) }
          : job.exists && job.data()?.generation === generation
            ? { job: publicJob(job.data()), ...(pending ? { pending } : {}) }
            : pending
              ? { pending }
              : {};
      });
    }
    const session = (await getFirestore().doc(`brewerConversations/${threadId}`).get()).data();
    let draft;
    if (scope.kind === 'draft') {
      const last = await getFirestore()
        .collection('brewerChats')
        .where('threadId', '==', threadId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      const row = last.docs[0]?.data();
      if (row?.contextId && (row.generation ?? 0) === (session?.generation ?? 0))
        draft = (await getFirestore().doc(`brewerContexts/${row.contextId}`).get()).data()?.context
          ?.recipe;
    }
    return {
      turns: await history(threadId, before, session?.resetAt),
      generation: session?.generation ?? 0,
      ...(draft ? { draft } : {})
    };
  }
);

export { askBrewer } from './brewerJobs.js';

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
    const oldJobs = await db.collection('brewerJobs').where('threadId', '==', threadId).get();
    for (const job of oldJobs.docs) {
      if (job.data().generation < reset.generation) await job.ref.delete();
    }
    return { generation: reset.generation };
  }
);

/** Only the explicit confirmation button calls this endpoint. The model has no write tool. */
export const applyBrewerProposal = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request);
    if (request.data?.scope?.kind === 'app')
      throw new HttpsError('failed-precondition', 'Ouvre la recette ou le brassin pour valider ses modifications.');
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
      selectedIds.length > 64 ||
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
            roots.push('preBoilL', 'preBoilHotL', 'waterPlan', 'mash');
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
