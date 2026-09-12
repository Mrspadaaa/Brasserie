import type { ScannedInvoiceResult } from './geminiScanner';
import type { PurchaseDraft } from './purchaseEntry';

/** The editable label describes the purchase; the document type has its own heading. */
export function invoicePurchaseDescription(scan: ScannedInvoiceResult): string {
  const description = scan.description || scan.vendor;
  const purchase = /^(?:bordereau de livraison|facture|ticket de caisse|justificatif)\b.{0,120}?\bpour\s+(.+)$/i.exec(description)?.[1];
  return purchase ? purchase.charAt(0).toUpperCase() + purchase.slice(1) : description;
}

/** A proposed sum is distinct from a total actually printed on the original. */
export function invoiceTotalProposal(scan: ScannedInvoiceResult): { amount?: number; calculated: boolean } {
  if (scan.currency !== 'CHF') return { calculated: false };
  if (typeof scan.amountTTC === 'number' && Number.isFinite(scan.amountTTC))
    return { amount: scan.amountTTC, calculated: false };
  const incomplete = [...scan.issues, ...(scan.review?.findings ?? []), ...(scan.fieldWarnings ?? []).filter(w => w.field === 'items').map(w => w.message)]
    .some(message => /35 lignes|tronqu|incomplet|manquant|coup[ée]|illisible/i.test(message));
  if (!scan.items.length || incomplete || scan.items.some(item => typeof item.amountTTC !== 'number' || !Number.isFinite(item.amountTTC)))
    return { calculated: false };
  const amount = scan.items.reduce((sum, item) => sum + Math.round(item.amountTTC! * 100), 0) / 100;
  return amount > 0 ? { amount, calculated: true } : { calculated: false };
}

export function invoiceFieldHints(scan: ScannedInvoiceResult): Record<string, string> {
  const hints: Record<string, string> = {};
  for (const warning of scan.fieldWarnings ?? []) if (!hints[warning.field]) hints[warning.field] = warning.message;
  for (const message of [...scan.issues, ...(scan.review?.findings ?? [])]) {
    const field = /^(?:Date)\s|^Date\s*:/i.test(message) ? 'date'
      : /^(?:Fournisseur)\s*:/i.test(message) ? 'vendor'
      : /total|totaux|somme des lignes|montant TTC|montant final/i.test(message) ? 'amountTTC'
      : /devise|document en [A-Z]{3}/i.test(message) ? 'currency'
      : /^Catégorie\s*:/i.test(message) ? 'category'
      : /lignes|articles|conditionnement/i.test(message) ? 'items' : '';
    if (field && !hints[field]) hints[field] = message;
  }
  for (const field of scan.review?.correctedFields ?? []) {
    const key = field.startsWith('items') ? 'items' : field;
    if (!hints[key]) hints[key] = 'Valeur corrigée après relecture. À confirmer sur le justificatif.';
  }
  if (scan.items.some(item => item.ambiguity || item.kind === 'unknown')) hints.items ||= 'La nature ou la lecture de certains articles reste à confirmer.';
  const proposal = invoiceTotalProposal(scan);
  if (proposal.calculated) hints.amountTTC = `Somme des ${scan.items.length} lignes. Le total final n’est pas imprimé.`;
  else if (proposal.amount === undefined && scan.currency === 'CHF') hints.amountTTC ||= 'Total absent ou illisible. Indique le montant facturé.';
  if (!scan.date) hints.date = 'Date absente ou illisible. Indique la date de l’achat.';
  if (scan.currency !== 'CHF') hints.amountTTC = scan.currency ? `Document en ${scan.currency}. Indique le montant réellement débité en CHF et adapte les lignes.` : 'Devise absente. Vérifie que le montant est bien en CHF.';
  if (!scan.review || scan.review.status === 'unavailable') {
    hints.amountTTC ||= 'Vérification incomplète. Confirme ce montant sur le document.';
    hints.date ||= 'Vérification incomplète. Confirme la date imprimée.';
  }
  return hints;
}

const iso = (value: string) => value.replace(/^(\d{2})\.(\d{2})\.(\d{4})$/, '$3-$2-$1');

/** Follow the purchase date unless the user has chosen a different payment date. */
export function patchPurchaseDraft(previous: PurchaseDraft, value: Partial<PurchaseDraft>, today: string): PurchaseDraft {
  const next = { ...previous, ...value, duplicateConfirmed: false };
  if (value.date !== undefined && value.paymentDate === undefined && (!previous.paymentDate || previous.paymentDate === previous.date))
    next.paymentDate = value.date;
  // An ordinary purchase is paid by default, but a future payment is never recorded as completed.
  if (next.paymentStatus === 'paid' && next.paymentDate && iso(next.paymentDate) > iso(today)) next.paymentStatus = 'unpaid';
  return next;
}

export function scannedPayment(scan: ScannedInvoiceResult, today: string): Pick<PurchaseDraft, 'paymentStatus' | 'paymentDate'> {
  return { paymentDate: scan.date, paymentStatus: scan.paymentEvidence === 'unpaid' || scan.documentType === 'quote' || scan.documentType === 'credit_note' || scan.date && iso(scan.date) > iso(today) ? 'unpaid' : 'paid' };
}
