import type { ScannedInvoiceResult } from './geminiScanner';
import type { PurchaseDraft } from './purchaseEntry';
import { canonicalStockCategory } from './stockLineMatching';
import { normalize } from './search';

const MILLING_WORDS = /\b(?:schrot\w*|mouture\w*|moulage|moulu\w*|crush\w*|milling|gemahlen)\b/;
/** Une ligne de mouture : un service dont le libellé ou la référence porte un mot de mouture (liste fermée, sans accent ni casse). */
export function isMillingSurcharge(line: { kind?: string; description?: string; sourceReference?: string }): boolean {
  return line.kind === 'service' && MILLING_WORDS.test(normalize(`${line.description ?? ''} ${line.sourceReference ?? ''}`));
}

const PLURAL_FAMILIES: Record<string, string> = { Malt: 'malts', Houblon: 'houblons', Levure: 'levures', Sucre: 'sucres', Additif: 'additifs', Emballage: 'emballages', Consommable: 'consommables' };
const KIND_FAMILIES: Record<string, string> = { stock: 'ingrédients', packaging: 'emballages', shipping: 'port', equipment: 'matériel', service: 'services' };
const DESCRIPTION_MAX = 60;

/**
 * « Pour quoi ? » proposé par le code : `Fournisseur · N° · familles`, 60 caractères au plus, sans la prose du modèle.
 * Les familles viennent de la catégorie de stock lue, sinon de la nature de la ligne, uniques, dans l'ordre de première apparition ;
 * une ligne de mouture n'ajoute rien. Rien n'est inventé : fournisseur, numéro ou familles absents sont omis.
 */
export function invoicePurchaseDescription(scan: ScannedInvoiceResult): string {
  const families: string[] = [];
  for (const item of scan.items) {
    if (isMillingSurcharge({ kind: item.kind, description: item.name, sourceReference: item.reference })) continue;
    const category = canonicalStockCategory(item.stockCategory);
    const family = category ? (PLURAL_FAMILIES[category] ?? category.toLowerCase()) : (KIND_FAMILIES[item.kind] ?? '');
    if (family && !families.includes(family)) families.push(family);
  }
  const vendor = (scan.vendor ?? '').replace(/\s+/g, ' ').trim(), number = (scan.invoiceNumber ?? '').replace(/\s+/g, ' ').trim();
  const join = (parts: string[]) => parts.filter(Boolean).join(' · ');
  for (let kept = families.length; kept >= 0; kept--) {
    const text = join([vendor, number, families.slice(0, kept).join(', ')]);
    if (text.length <= DESCRIPTION_MAX) return text;
  }
  // Trop long même sans familles : le fournisseur est coupé à un mot pour que le numéro reste lisible.
  const room = DESCRIPTION_MAX - (number ? number.length + 3 : 0);
  let cut = vendor.slice(0, Math.max(room, 0));
  if (vendor.length > cut.length) cut = cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut;
  return join([cut.trim(), number]).slice(0, DESCRIPTION_MAX);
}

/**
 * Ce que la lecture propose pour « Pour quoi ? ». Une description tapée, ou d'origine inconnue et non vide, n'est jamais remplacée ;
 * vide ou venue d'une lecture, elle l'est. Rend un patch à passer à `patchPurchaseDraft`.
 */
export function applyScannedDescription(previous: PurchaseDraft, scan: ScannedInvoiceResult): Partial<PurchaseDraft> {
  const current = (previous.description ?? '').trim();
  if (current && previous.descriptionSource !== 'scan') return {};
  return { description: invoicePurchaseDescription(scan), descriptionSource: 'scan' };
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
  // D262a : « plusieurs taux, taux global fixé à null » n'est pas un doute quand le bloc de TVA imprimé par taux (≥ 2 taux) ne se contredit pas.
  const tauxImprimes = new Set((scan.vat ?? []).map(row => row.rate).filter((rate): rate is number => typeof rate === 'number')).size;
  const blocJuste = tauxImprimes >= 2 && (scan as { controls?: { vat?: { statut?: string } } }).controls?.vat?.statut !== 'ecart';
  for (const warning of scan.fieldWarnings ?? []) if (!hints[warning.field] && !(warning.field === 'tvaRate' && blocJuste)) hints[warning.field] = warning.message;
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

/**
 * Follow the purchase date unless the user has chosen a different payment date.
 * La base de la date de paiement : une clé `paymentDateBasis` dans le patch (la lecture) prime ; sans elle, une date donnée seule
 * est tapée, sauf quand le patch change aussi le statut (la date du jour substituée n'est jamais « typed » : base inconnue).
 * Une description donnée sans `descriptionSource` est tapée.
 */
export function patchPurchaseDraft(previous: PurchaseDraft, value: Partial<PurchaseDraft>, today: string): PurchaseDraft {
  const next = { ...previous, ...value, duplicateConfirmed: false };
  if (value.paymentDate !== undefined && !('paymentDateBasis' in value))
    next.paymentDateBasis = 'paymentStatus' in value ? undefined : 'typed';
  if (value.description !== undefined && !('descriptionSource' in value)) next.descriptionSource = 'typed';
  if (value.date !== undefined && value.paymentDate === undefined && previous.paymentDateBasis !== 'typed' && (!previous.paymentDate || previous.paymentDate === previous.date)) {
    next.paymentDate = value.date;
    next.paymentDateBasis = value.date ? 'document_date' : undefined;
  }
  // An ordinary purchase is paid by default, but a future payment is never recorded as completed.
  if (next.paymentStatus === 'paid' && next.paymentDate && iso(next.paymentDate) > iso(today)) next.paymentStatus = 'unpaid';
  return next;
}

/**
 * Le statut vient de la preuve de paiement lue ; la date de paiement n'est jamais imprimée : elle reprend la date du document et
 * est marquée `document_date` (supposée). Sans date lue, pas de base (la clé reste présente pour que le patch la prenne en compte).
 */
export function scannedPayment(scan: ScannedInvoiceResult, today: string): Pick<PurchaseDraft, 'paymentStatus' | 'paymentDate' | 'paymentDateBasis'> {
  // Une pro-forma sans preuve de paiement imprimée est une demande de paiement : jamais préremplie comme payée (relecture l2, point 7).
  // Le type RETENU décide (l2, relais n° 3) : une pro-forma payée lue « devis » est une facture réglée ; sans lui (ancien résultat), le type lu.
  const type = scan.documentTypeRetenu ?? scan.documentType;
  return { paymentDate: scan.date, paymentDateBasis: scan.date ? 'document_date' : undefined, paymentStatus: scan.paymentEvidence === 'unpaid' || scan.proForma && scan.paymentEvidence !== 'paid' || type === 'quote' || type === 'credit_note' || scan.date && iso(scan.date) > iso(today) ? 'unpaid' : 'paid' };
}

/**
 * Ce que la lecture propose pour le règlement. Comme pour la description, une valeur tapée n'est jamais écrasée : si le brasseur a
 * tapé une date de paiement (base `typed`, date non vide), un second scan ne touche ni la date ni sa base ; seul le statut lu suit.
 * Vide, supposée (`document_date`) ou d'origine inconnue (la date du jour par défaut), la date du scan la remplace.
 * Rend un patch à passer à `patchPurchaseDraft`.
 */
export function applyScannedPayment(previous: PurchaseDraft, scan: ScannedInvoiceResult, today: string): Partial<PurchaseDraft> {
  const proposed = scannedPayment(scan, today);
  if (previous.paymentDateBasis === 'typed' && (previous.paymentDate ?? '').trim()) return { paymentStatus: proposed.paymentStatus };
  return proposed;
}
