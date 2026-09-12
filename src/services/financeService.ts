import { FirestoreRepo } from './firestoreRepo';
import { StorageService } from './storage';
import type { FinanceTransaction, FinancialAsset, FinancialClosing, FinancialPayment, FinancialPlan, FinancialProfile } from '../domain/finance/types';
import { isoDate, isActiveTransaction, isOffsetRefund, paymentState, refundLinkIssue, todayISO, transactionAmount, transactionDirection, transactionKind, validPayment, validateFinanceTransaction } from '../domain/finance/ledger';
import { assetDisposalIssues, buildAnnualReport, validateAsset } from '../domain/finance/annual';
import { isUpgradePlan, mergeUpgradePlans, validateUpgrade } from '../domain/finance/upgrades';
import { buildFribourgTaxReport, taxBasisKey, validateTaxClosing } from '../domain/finance/fribourgTax';
import { prepareFinanceDocument, saveFinanceDocumentConfirmed } from './financeDocuments';

export const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' };
const clean = <T>(items: unknown[]): T[] => items.map((item: any) => { const { __docId, ...data } = item; return data as T; });
function prepareClosing(closing: FinancialClosing): FinancialClosing {
  if (!closing.id || !Number.isInteger(closing.year) || closing.year < 1900 || closing.year > 2200) throw new Error('Exercice de clôture invalide.');
  const inventory = [...closing.openingInventory, ...closing.closingInventory];
  if (inventory.some(i => !i.name.trim() || !Number.isFinite(i.quantity) || i.quantity < 0 || !Number.isSafeInteger(i.valueCents) || i.valueCents < 0)) throw new Error('Une ligne d’inventaire est invalide.');
  if (closing.adjustments.some(a => !Number.isSafeInteger(a.amountCents) || !a.label.trim() || !a.note.trim())) throw new Error('Chaque ajustement doit avoir un montant, un libellé et une justification.');
  if (closing.tax) validateTaxClosing(closing.tax);
  const json = JSON.stringify(closing);
  if (new TextEncoder().encode(json).length > 900_000) throw new Error('Cette clôture dépasse la taille prévue pour un exercice. Réduis les textes ou lignes trop détaillés avant d’enregistrer la clôture.');
  return JSON.parse(json);
}
export function validateFinancialPayment(payment: FinancialPayment): void {
  if (!payment.id || payment.id.includes('/') || !validPayment(payment) || !['bank', 'cash', 'twint', 'other'].includes(payment.method)) throw new Error('Paiement invalide. Vérifie la date et le montant positif en CHF.');
  if (isoDate(payment.date)! > todayISO()) throw new Error('Un paiement futur doit être enregistré dans les prévisions.');
  if (!payment.recordedAt || !Number.isFinite(Date.parse(payment.recordedAt))) throw new Error('Horodatage du paiement invalide.');
  if (payment.reversalOfId && payment.id !== `CONTRE-${payment.reversalOfId}`) throw new Error('La contre-écriture doit utiliser l’identifiant unique du paiement d’origine.');
}
/** These two writes share FirestoreRepo's atomic batch. The transaction may not be in its cache yet. */
export function stageNewTransactionPayment(transaction: FinanceTransaction, payment: FinancialPayment): FinanceTransaction {
  validateFinanceTransaction(transaction); validateFinancialPayment(payment);
  if (payment.transactionId !== transaction.id || !isActiveTransaction(transaction) || isOffsetRefund(transaction) || payment.reversalOfId) throw new Error('Le paiement doit appartenir à cette nouvelle pièce active.');
  if (payment.direction !== transactionDirection(transaction, StorageService.getTransactions()) || payment.amountCents > transactionAmount(transaction)) throw new Error('Le sens ou le montant du paiement ne correspond pas à cette pièce.');
  const rejected = FirestoreRepo.documentWriteState?.('financialPayments', payment.id).status === 'rejected';
  const previous = rejected ? undefined : clean<FinancialPayment>(FirestoreRepo.all('financialPayments')).find(p => p.id === payment.id);
  if (previous) {
    if (JSON.stringify(previous) !== JSON.stringify(payment)) throw new Error('Cet identifiant de paiement est déjà utilisé.');
    return StorageService.getTransactions().find(t => t.id === transaction.id) ?? transaction;
  }
  const guarded = { ...transaction, settlementBalanceCents: payment.amountCents, lastPaymentId: payment.id };
  StorageService.addTransaction(guarded);
  FirestoreRepo.put('financialPayments', payment.id, payment);
  return guarded;
}
/** Validates against the current ledger, excluding this submission during a safe retry. */
export function validateRefundTransaction(refund: FinanceTransaction, transactions: FinanceTransaction[], payments: FinancialPayment[]): void {
  validateFinanceTransaction(refund);
  if (transactionKind(refund) !== 'refund') throw new Error('Une pièce d’avoir est requise.');
  const issue = refundLinkIssue(refund, transactions);
  if (issue) throw new Error(issue);
  if (isoDate(refund.date)! > todayISO()) throw new Error('Un avoir futur doit rester dans les prévisions.');
  if (refund.finance?.refundApplication && !['cash', 'offset'].includes(refund.finance.refundApplication)) throw new Error('Choisis comment appliquer cet avoir.');
  const original = transactions.find(t => t.id === refund.finance?.refundOfId)!;
  const other = transactions.filter(t => t.id !== refund.id);
  const already = other.filter(t => isActiveTransaction(t) && transactionKind(t) === 'refund' && t.finance?.refundOfId === original.id).reduce((sum, t) => sum + transactionAmount(t), 0);
  if (already + transactionAmount(refund) > transactionAmount(original)) throw new Error('Les avoirs ne peuvent pas dépasser le montant de la pièce d’origine.');
  if (isOffsetRefund(refund)) {
    const state = paymentState(original, payments, other, todayISO());
    if (state.state === 'unknown') throw new Error('Confirme d’abord si la facture d’origine reste à régler avant d’y imputer un avoir.');
    if (transactionAmount(refund) > state.remainingCents) throw new Error('L’avoir imputé dépasse le montant restant à régler. Choisis un remboursement d’argent pour une facture déjà payée.');
  }
}
function validatePlan(plan: FinancialPlan): void {
  if (!plan.id || !plan.title.trim() || !isUpgradePlan(plan) && !isoDate(plan.date) || !Number.isSafeInteger(plan.amountCents) || plan.amountCents < 0) throw new Error('Titre, date et montant de la prévision requis.');
  if (!['draft', 'active', 'cancelled', 'completed'].includes(plan.status) || !['in', 'out'].includes(plan.direction)) throw new Error('État de la prévision invalide.');
  if (plan.recurrence && (!['monthly', 'quarterly', 'yearly'].includes(plan.recurrence.frequency) || plan.recurrence.endDate && (!isoDate(plan.recurrence.endDate) || isoDate(plan.recurrence.endDate)! < isoDate(plan.date)!))) throw new Error('Récurrence invalide.');
  if (isUpgradePlan(plan)) validateUpgrade(plan);
}
export const FinanceService = {
  stageNewTransactionPayment,
  getProfile(): FinancialProfile {
    const profile = clean<FinancialProfile>(FirestoreRepo.all('financialProfiles')).find(p => p.id === 'current');
    return { ...DEFAULT_FINANCIAL_PROFILE, ...profile };
  },
  saveProfile(profile: FinancialProfile): void {
    if (profile.id !== 'current' || profile.canton !== 'FR' || profile.accounting !== 'simplified') throw new Error('Profil comptable invalide.');
    if (profile.openingCash && (!isoDate(profile.openingCash.date) || !Number.isSafeInteger(profile.openingCash.amountCents))) throw new Error('Solde initial invalide.');
    if (profile.historyCompleteFrom && !isoDate(profile.historyCompleteFrom)) throw new Error('Début de l’historique invalide.');
    FirestoreRepo.put('financialProfiles', profile.id, profile);
  },
  getPlans(): FinancialPlan[] { return mergeUpgradePlans(clean<FinancialPlan>(FirestoreRepo.all('financialPlans')), StorageService.getCreativeItems()); },
  savePlan(plan: FinancialPlan): void { validatePlan(plan); FirestoreRepo.put('financialPlans', plan.id, plan); },
  async saveUpgrade(plan: FinancialPlan): Promise<void> {
    if (!isUpgradePlan(plan)) throw Error('Un projet de matériel est requis.');
    const updated = { ...plan, updatedAt: new Date().toISOString() };
    this.savePlan(updated);
    await FirestoreRepo.waitForDocument<FinancialPlan>('financialPlans', updated.id, 15000, value => value.updatedAt === updated.updatedAt && value.status === updated.status && value.amountCents === updated.amountCents && value.date === updated.date);
  },
  cancelPlan(id: string): void { const plan = this.getPlans().find(p => p.id === id); if (plan) this.savePlan({ ...plan, status: 'cancelled' }); },
  getPayments(): FinancialPayment[] { return clean<FinancialPayment>(FirestoreRepo.all('financialPayments')); },
  recordPayment(payment: FinancialPayment): void {
    validateFinancialPayment(payment);
    const payments = this.getPayments();
    const previous = payments.find(p => p.id === payment.id);
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(payment)) throw new Error('Ce paiement est déjà enregistré. Utilise une contre-écriture pour le corriger.');
      return;
    }
    const transactions = StorageService.getTransactions();
    const transaction = transactions.find(t => t.id === payment.transactionId);
    if (!transaction || !isActiveTransaction(transaction)) throw new Error('Le paiement doit être lié à une pièce existante et active.');
    if (isOffsetRefund(transaction)) throw new Error('Un avoir imputé règle la facture sans mouvement d’argent. Il ne reçoit pas de paiement.');
    if (payment.reversalOfId) {
      const original = payments.find(p => p.id === payment.reversalOfId);
      if (!original || original.reversalOfId || original.direction === payment.direction || original.transactionId !== payment.transactionId || original.amountCents !== payment.amountCents) throw new Error('La contre-écriture doit inverser exactement le paiement d’origine.');
      if (isoDate(payment.date)! < isoDate(original.date)!) throw new Error('La contre-écriture ne peut pas précéder le paiement d’origine.');
      if (payments.some(p => p.reversalOfId === original.id)) throw new Error('Ce paiement est déjà annulé.');
    } else {
      if (payment.direction !== transactionDirection(transaction, transactions)) throw new Error('Le sens du paiement ne correspond pas à cette pièce.');
      const remaining = paymentState(transaction, payments, transactions).remainingCents;
      if (payment.amountCents > remaining) throw new Error('Le paiement dépasse le montant restant dû.');
    }
    // The server checks the increment and new immutable payment together against
    // the current transaction, so a stale phone cannot pay a concurrently voided invoice.
    FirestoreRepo.adjustNumber('transactions', transaction.id, 'settlementBalanceCents', payment.reversalOfId ? -payment.amountCents : payment.amountCents, { lastPaymentId: payment.id });
    FirestoreRepo.put('financialPayments', payment.id, payment);
  },
  getAssets(): FinancialAsset[] { return clean<FinancialAsset>(FirestoreRepo.all('financialAssets')); },
  saveAsset(asset: FinancialAsset): void {
    validateAsset(asset);
    const transactions = StorageService.getTransactions();
    for (const id of asset.capitalAdjustmentTransactionIds ?? []) {
      const credit = transactions.find(t => t.id === id);
      if (!credit || !isActiveTransaction(credit) || transactionKind(credit) !== 'refund' || credit.finance?.refundOfId !== asset.transactionId || transactionDirection(credit, transactions) !== 'in') throw new Error('Un avoir intégré au coût doit être actif et lié à l’achat de ce matériel.');
    }
    if (asset.disposalTransactionId) {
      const issues = assetDisposalIssues(asset, transactions, this.getAssets().filter(a => a.id !== asset.id).concat(asset));
      if (issues.length) throw new Error(issues.join(' '));
    }
    FirestoreRepo.put('financialAssets', asset.id, asset);
  },
  getClosings(): FinancialClosing[] { return clean<FinancialClosing>(FirestoreRepo.all('financialClosings')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  saveClosing(closing: FinancialClosing): FinancialClosing {
    if (this.getClosings().some(c => c.id === closing.id && c.report)) throw new Error('Cette clôture est figée. Crée une nouvelle version pour la corriger.');
    const stored = prepareClosing(closing);
    FirestoreRepo.put('financialClosings', stored.id, stored);
    return stored;
  },
  async finalizeClosing(closing: FinancialClosing): Promise<FinancialClosing> {
    prepareClosing(closing);
    const transactions = StorageService.getTransactions();
    const profile = { ...this.getProfile(), vatRegistered: this.getProfile().vatRegistered || StorageService.getConfig().fiscal.isTvaRegistered };
    const report = buildAnnualReport({ year: closing.year, transactions, payments: this.getPayments(), assets: this.getAssets(), profile, closing: { ...closing, report: undefined } });
    const reviewed = closing.tax?.reviewedBasis === taxBasisKey(report);
    // Capture legacy inline originals in the immutable document collection before freezing references.
    // Never copy the large base64 values into a closing document (Firestore's 1 MiB limit).
    const prepared: ReturnType<typeof prepareFinanceDocument>[] = [];
    for (const row of [...report.documents, ...(report.supportingDocuments ?? [])]) {
      if (row.proofSource !== 'legacy-inline') continue;
      const source = transactions.find(t => t.id === row.id);
      if (!source?.proofUrl) continue;
      const mime = /^data:([^;]+);base64,/.exec(source.proofUrl)?.[1] ?? '';
      const fileName = source.proofFileName || `${row.id}.${mime === 'application/pdf' ? 'pdf' : mime.split('/')[1] || 'bin'}`;
      // Stable ID lets a retry or another annual version reuse the exact same
      // captured original, without creating duplicate files after a timeout.
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([source.proofUrl, fileName, mime])));
      const proofId = `TAXDOC-${Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')}`;
      const proof = prepareFinanceDocument(proofId, source.proofUrl, fileName, mime);
      prepared.push(proof);
      row.proofDocumentId = proof.id; row.proofSource = 'document'; row.proofFileName = proof.fileName;
    }
    const tax = closing.tax ? { ...closing.tax, reviewedBasis: reviewed ? taxBasisKey(report) : closing.tax.reviewedBasis } : undefined;
    report.tax = buildFribourgTaxReport(report, tax);
    const version = prepareClosing({ ...closing, tax, id: `CLOTURE-${closing.year}-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), report });
    // A tax year can contain many originals: commit each file separately and
    // acknowledge it before publishing the frozen references.
    for (const proof of prepared) await saveFinanceDocumentConfirmed(proof, closing.year);
    const saved = this.saveClosing(version);
    await FirestoreRepo.waitForDocument('financialClosings', saved.id, 15_000, value => value.report?.generatedAt === saved.report?.generatedAt);
    return saved;
  },
  snapshot() { return { profile: this.getProfile(), plans: this.getPlans(), payments: this.getPayments(), assets: this.getAssets(), closings: this.getClosings() }; }
};
export const FinancialService = FinanceService;
