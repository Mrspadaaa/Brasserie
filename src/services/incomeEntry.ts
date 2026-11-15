import type { Transaction } from '../types';
import type { FinancialPayment } from '../domain/finance/types';
import { isoDate, validateFinanceTransaction } from '../domain/finance/ledger';
import { prepareFinanceDocument, saveFinanceDocumentConfirmed, type DriveProofReceipt } from './financeDocuments';
import { FirestoreRepo, isConfirmedWriteRejection } from './firestoreRepo';
import { stageNewTransactionPayment, validateFinancialPayment } from './financeService';
import { StorageService } from './storage';
import { dropQueuedProof, enqueueProof, proofQueueAvailable, runProofQueue } from './proofQueue';

export interface IncomeEntry {
  transaction: Transaction;
  proof: ReturnType<typeof prepareFinanceDocument>;
  payment?: FinancialPayment;
}
/** Ce que l'écran peut dire de l'enregistrement : `queued` = le justificatif part au Drive plus tard (pas encore « conservé dans Drive »), `confirmed` = le serveur a accusé l'écriture. */
export interface IncomeSaveResult { receipt?: DriveProofReceipt; queued: boolean; confirmed: boolean }
interface PendingState { staged: boolean; running?: Promise<void>; receipt?: DriveProofReceipt; queued?: boolean; confirmed?: boolean }
const pending = new WeakMap<IncomeEntry, PendingState>();

/** Le temps qu'on attend l'accusé du serveur quand le justificatif est en file : au-delà (réseau lent ou coupé), la vente reste écrite sur l'appareil et l'écran le dit. */
export const INCOME_ACK_WAIT_MS = 2000;

const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/**
 * Met le PDF de la vente dans la file locale des justificatifs (la même que la Dépense) et rend l'écriture à poser : sans `proofDocumentId`
 * (le lien ne se pose qu'une fois l'envoi fait), `syncedToDrive: false` et `finance.proofUpload` en attente. `undefined` quand la file est
 * indisponible, pleine ou sans session : l'appelant suit alors le chemin synchrone, rien ne se perd.
 */
async function queueIncomeProof(entry: IncomeEntry): Promise<Transaction | undefined> {
  const tx = entry.transaction, proof = entry.proof;
  if (!proofQueueAvailable() || !/^proof-[A-Za-z0-9-]{3,}$/.test(proof.id)) return undefined;
  try {
    const uid = (await import('./firebaseAuth')).FirebaseAuthService.getCurrentUser()?.uid;
    if (!uid) return undefined;
    await enqueueProof({
      submissionId: proof.id.slice('proof-'.length), transactionId: tx.id, dataUrl: proof.parts.join(''), mimeType: proof.mimeType,
      driveName: proof.fileName, year: Number(isoDate(tx.date)!.slice(0, 4)), uid
    });
    const { proofDocumentId: _lie, ...finance } = tx.finance!;
    return { ...tx, syncedToDrive: false, finance: { ...finance, proofUpload: { state: 'queued', uid, at: new Date().toISOString() } } } as Transaction;
  } catch { return undefined; }
}

function persist(entry: IncomeEntry, background: boolean): Promise<IncomeSaveResult> {
  return (async () => {
    let state = pending.get(entry);
    if (!state) { state = { staged: false }; pending.set(entry, state); }
    const result = (): IncomeSaveResult => ({ receipt: state!.receipt, queued: Boolean(state!.queued), confirmed: state!.confirmed !== false });
    if (state.running) { await state.running; return result(); }
    const work = (async () => {
      const tx = entry.transaction;
      validateFinanceTransaction(tx);
      if (tx.finance?.kind !== 'income' || tx.finance.proofDocumentId !== entry.proof.id || tx.proofUrl)
        throw Error('La vente doit référencer son original privé, sans fichier dans l’écriture.');
      if (entry.payment) validateFinancialPayment(entry.payment);
      const date = isoDate(tx.date);
      if (!date) throw Error('Date de vente invalide.');
      state!.confirmed = true;
      if (!state!.staged) {
        // En arrière-plan : le fichier d'abord dans la file (durable), l'écriture ensuite, l'envoi Drive après la fermeture de la caisse.
        const queuedTx = background ? await queueIncomeProof(entry) : undefined;
        try {
          if (!queuedTx) state!.receipt = await saveFinanceDocumentConfirmed(entry.proof, Number(date.slice(0, 4)));
          const written = queuedTx ?? tx;
          if (entry.payment) stageNewTransactionPayment(written, entry.payment);
          else StorageService.addTransaction(written);
        } catch (error) {
          // L'écriture n'a pas eu lieu : la ligne de la file n'a plus d'objet (le fichier est encore dans la vente en attente).
          if (queuedTx) await dropQueuedProof(entry.proof.id.slice('proof-'.length));
          throw error;
        }
        state!.queued = Boolean(queuedTx);
        state!.staged = true;
        if (queuedTx) void runProofQueue('save');
      }
      const ack = async () => {
        const queued = state!.queued;
        await FirestoreRepo.waitForDocument<Transaction>('transactions', tx.id, 15000, saved =>
          saved.finance?.kind === 'income' && saved.finance.amountCents === tx.finance!.amountCents &&
          (queued || saved.finance.proofDocumentId === entry.proof.id) && saved.finance.recordedAt === tx.finance!.recordedAt &&
          saved.date === tx.date && (!entry.payment || saved.lastPaymentId === entry.payment.id));
        if (entry.payment) await FirestoreRepo.waitForDocument<FinancialPayment>('financialPayments', entry.payment.id, 15000, saved =>
          saved.transactionId === tx.id && saved.amountCents === entry.payment!.amountCents && saved.date === entry.payment!.date && saved.direction === 'in');
      };
      const fail = (error: unknown) => {
        if (isConfirmedWriteRejection(error) && error.path === `transactions/${tx.id}` &&
            error.operationId === FirestoreRepo.documentWriteState('transactions', tx.id).operationId) state!.staged = false;
        throw error;
      };
      if (!state!.queued) { try { await ack(); } catch (error) { fail(error); } return; }
      // Le justificatif est en file : on n'attend l'accusé que le temps d'un aller-retour normal, jamais hors ligne ni 15 s.
      const attente = ack();
      if (!online()) { attente.catch(() => undefined); state!.confirmed = false; return; }
      let delai: ReturnType<typeof setTimeout> | undefined;
      const trop = new Promise<'tard'>(resolve => { delai = setTimeout(() => resolve('tard'), INCOME_ACK_WAIT_MS); });
      try {
        if (await Promise.race([attente.then(() => 'ok' as const), trop]) === 'tard') { attente.catch(() => undefined); state!.confirmed = false; }
      } catch (error) { fail(error); } finally { if (delai) clearTimeout(delai); }
    })();
    state.running = work;
    try { await work; }
    finally { if (state.running === work) state.running = undefined; }
    return result();
  })();
}

/** The caller retains this exact draft/PDF on retry. Never attach a dataURL to
 * the transaction, and never replay stock/payment writes after a lost reply. */
/** Rend la preuve Drive de l'original, ou `undefined` quand il n'est resté qu'en copie locale : l'écran ne dit « dans Drive » que sur une preuve (TE-55). */
export async function saveIncomeEntry(entry: IncomeEntry): Promise<DriveProofReceipt | undefined> {
  return (await persist(entry, false)).receipt;
}

/**
 * Comme `saveIncomeEntry`, mais l'envoi au Drive part en arrière-plan (voie bg, 10.11 : « faire le job en background »). La vente s'écrit d'abord,
 * son justificatif attend dans la file locale ; `syncedToDrive` ne dit vrai qu'une fois l'envoi fait. Sans file (pas d'IndexedDB, pleine, pas de
 * session), c'est le chemin d'avant : l'envoi est confirmé avant l'écriture.
 */
export async function saveIncomeEntryInBackground(entry: IncomeEntry): Promise<IncomeSaveResult> {
  return persist(entry, true);
}
