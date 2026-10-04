import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { createBrewerCatalogueStore } from './brewerCatalogueStore.js';
import { loadBrewingCatalogueReferences } from './brewerTools.js';
import { hasHopAdviceV1Stamp, HOP_ADVICE_V1_COLLECTIONS } from './brewerHopAdviceLaneV1.js';

type BrewerCatalogueLane = 'ordinary' | 'hopAdviceReadonlyV1';
const lanePaths = (lane: BrewerCatalogueLane) => lane === 'hopAdviceReadonlyV1'
  ? { jobs: HOP_ADVICE_V1_COLLECTIONS.jobs, conversations: HOP_ADVICE_V1_COLLECTIONS.conversations }
  : { jobs: 'brewerJobs', conversations: 'brewerConversations' };

export interface BrewerCatalogueJobIdentity {
  id: string;
  uid: string;
  threadId: string;
  generation: number;
  fence: string;
  /** Preserved across automatic attempts AND a new job made by retryBrewerQuestion. */
  namespace: string;
  /** Static server-selected namespace; never copied from a task or client field. */
  lane?: BrewerCatalogueLane;
}

export async function guardBrewerJobMutation(database: Firestore, tx: Transaction, identity: BrewerCatalogueJobIdentity) {
  const paths = lanePaths(identity.lane ?? 'ordinary');
  const [jobSnapshot, conversationSnapshot] = await Promise.all([
    tx.get(database.doc(`${paths.jobs}/${identity.id}`)), tx.get(database.doc(`${paths.conversations}/${identity.threadId}`))
  ]);
  const job = jobSnapshot.data(), conversation = conversationSnapshot.data();
  if (identity.lane === 'hopAdviceReadonlyV1' && !hasHopAdviceV1Stamp(job))
    throw new HttpsError('aborted', 'Le protocole assisté du travail a changé : aucune mutation autorisée.');
  if (!job || job.uid !== identity.uid || job.threadId !== identity.threadId || job.status !== 'running'
    || job.fence !== identity.fence || job.generation !== identity.generation
    || (conversation?.generation ?? 0) !== identity.generation
    || conversation?.active?.fence !== identity.fence || !(conversation?.active?.until > Date.now())) {
    throw new HttpsError('aborted', 'L’analyse a changé ou son bail a expiré : aucune nouvelle mutation autorisée.');
  }
  return job;
}

/** Mutation and receipt are fenced in the same transaction as the catalogue write. */
export function createBrewerCatalogueForJob(database: Firestore, identity: BrewerCatalogueJobIdentity) {
  const paths = lanePaths(identity.lane ?? 'ordinary');
  const jobRef = database.doc(`${paths.jobs}/${identity.id}`);
  const observed = new WeakMap<object, { receipts: Array<Record<string, unknown>> }>();
  return createBrewerCatalogueStore({
    database, ownerKey: identity.uid, namespace: identity.namespace, loadReferences: loadBrewingCatalogueReferences,
    guard: async (tx) => {
      const job = await guardBrewerJobMutation(database, tx, identity);
      observed.set(tx, { receipts: Array.isArray(job.catalogueReceipts) ? job.catalogueReceipts : [] });
    },
    attachReceipt: (tx, receipt) => {
      const state = observed.get(tx);
      if (!state) throw Error('Le reçu de catalogue exige une analyse courante.');
      const summary = {
        operationId: receipt.operationId, kind: receipt.kind, targetId: receipt.targetId,
        revision: receipt.revision, fingerprint: receipt.fingerprint,
        committedAt: receipt.committedAt, status: receipt.status
      };
      const receipts = [...state.receipts.filter(previous => previous.operationId !== receipt.operationId), summary];
      tx.update(jobRef, { catalogueReceipts: receipts, updatedAt: Date.now() });
      observed.set(tx, { receipts });
    }
  });
}
