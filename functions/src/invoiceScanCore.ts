import { createHash } from 'node:crypto';
import { TIERS } from './models.js';

export const INVOICE_SCAN_VERSION = 'invoice-v4';
export const SCAN_MODEL = TIERS.max.primary;
export const SCAN_MAX_BYTES = 4 * 1024 * 1024;
export const SCAN_MAX_OUTPUT = 4500;
export const SCAN_MAX_CALLS = 3;
export const SCAN_KINDS = ['equipment', 'maintenance', 'stock', 'service', 'packaging', 'shipping', 'discount', 'other', 'unknown'] as const;
export const INVOICE_FIELDS = ['vendor', 'date', 'currency', 'invoiceNumber', 'amountHT', 'amountTTC', 'tvaRate', 'tvaAmount', 'category', 'items', 'documentType', 'paymentEvidence'] as const;
export type InvoiceField = typeof INVOICE_FIELDS[number];
export interface InvoiceFieldWarning { field: InvoiceField; message: string }
export const DOCUMENT_TYPES = ['invoice', 'receipt', 'delivery_note', 'quote', 'credit_note', 'other'] as const;
export interface InvoiceFile { data: string; mimeType: string }

/** Reject unbounded inputs before acquiring a paid reservation. No client page count is trusted. */
export function validateInvoiceFile(file: unknown): InvoiceFile {
  const value = file as InvoiceFile;
  if (!value || typeof value.data !== 'string' || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(value.mimeType))
    throw new Error('Choisis une photo JPG, PNG, WebP ou un PDF de 4 pages maximum.');
  if (!value.data.length || value.data.length > Math.ceil(SCAN_MAX_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.data))
    throw new Error('Justificatif invalide ou trop volumineux (4 Mo maximum).');
  const bytes = Buffer.from(value.data, 'base64');
  if (bytes.length > SCAN_MAX_BYTES) throw new Error('Justificatif trop volumineux (4 Mo maximum).');
  const header = bytes.subarray(0, 16);
  const valid = value.mimeType === 'application/pdf' ? header.toString().startsWith('%PDF-')
    : value.mimeType === 'image/jpeg' ? header[0] === 0xff && header[1] === 0xd8
    : value.mimeType === 'image/png' ? header.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) throw new Error('Le contenu ne correspond pas au format du justificatif.');
  if (value.mimeType === 'application/pdf') {
    const pdf = bytes.toString('latin1');
    const pages = [...pdf.matchAll(/\/Type\s*\/Page\b/g)].length;
    // Compressed object streams cannot be counted safely without parsing them.
    if (/\/ObjStm\b|\/Encrypt\b/.test(pdf) || pages < 1 || pages > 4)
      throw new Error('Ce PDF ne permet pas de vérifier la limite de 4 pages. Exporte les pages utiles en images.');
    const counts = [...pdf.matchAll(/\/Count\s+(\d+)/g)].map(m => Number(m[1]));
    if (counts.some(n => n > 4)) throw new Error('Sélectionne un justificatif de 4 pages maximum.');
  }
  return value;
}

export function invoiceScanId(uid: string, file: InvoiceFile): string {
  return createHash('sha256').update(INVOICE_SCAN_VERSION).update(uid).update(file.mimeType).update(Buffer.from(file.data, 'base64')).digest('hex');
}
export function invoiceDocumentHash(file: InvoiceFile): string {
  return createHash('sha256').update(Buffer.from(file.data, 'base64')).digest('hex');
}
const text = (value: unknown, max = 180) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function invoiceDate(value: unknown): string {
  const raw = text(value), swiss = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(raw), iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const y = Number(swiss?.[3] ?? iso?.[1]), m = Number(swiss?.[2] ?? iso?.[2]), d = Number(swiss?.[1] ?? iso?.[3]);
  const at = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 2200 && at.getUTCFullYear() === y && at.getUTCMonth() === m - 1 && at.getUTCDate() === d
    ? `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}` : '';
}
/** Pure transcription checks. Original totals/rates survive discrepancies. */
export function normalizeInvoiceScan(raw: any) {
  const issues: string[] = [];
  const sourceItems: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const items = sourceItems.slice(0, 35).map((item: any, index: number) => ({
    id: `line-${index + 1}`, name: text(item?.name), kind: SCAN_KINDS.includes(item?.kind) ? item.kind as typeof SCAN_KINDS[number] : 'unknown' as const,
    quantity: number(item?.quantity), unit: text(item?.unit, 30), price: number(item?.price), amountTTC: number(item?.amountTTC),
    reference: text(item?.reference, 70), variant: text(item?.variant, 80),
    stockCategory: text(item?.stockCategory, 60), evidence: text(item?.evidence, 250), ambiguity: text(item?.ambiguity, 200)
  }));
  const result = {
    documentType: DOCUMENT_TYPES.includes(raw?.documentType) ? raw.documentType as typeof DOCUMENT_TYPES[number] : 'other' as const,
    paymentEvidence: ['paid', 'unpaid', 'unknown'].includes(raw?.paymentEvidence) ? raw.paymentEvidence as 'paid'|'unpaid'|'unknown' : 'unknown' as const,
    fieldWarnings: (Array.isArray(raw?.fieldWarnings) ? raw.fieldWarnings : []).filter((warning: any) => INVOICE_FIELDS.includes(warning?.field) && text(warning?.message)).slice(0, 20).map((warning: any): InvoiceFieldWarning => ({ field: warning.field, message: text(warning.message, 200) })),
    vendor: text(raw?.vendor), date: invoiceDate(raw?.date), currency: text(raw?.currency, 5).toUpperCase(), invoiceNumber: text(raw?.invoiceNumber, 70),
    orderNumber: text(raw?.orderNumber, 70),
    amountHT: number(raw?.amountHT), tvaRate: number(raw?.tvaRate), tvaAmount: number(raw?.tvaAmount), amountTTC: number(raw?.amountTTC),
    category: ['brassage','materiel','nettoyage','chargesFixes','renovation','divers'].includes(raw?.category) ? raw.category : 'divers',
    subcategory: text(raw?.subcategory, 60), description: text(raw?.description, 300), items, issues,
    review: { status: 'not-needed' as string, findings: [] as string[] }
  };
  if (!result.date) issues.push('Date absente ou invalide : à saisir.');
  if (result.currency !== 'CHF') issues.push(result.currency ? `Document en ${result.currency} : saisir le montant réellement payé en CHF.` : 'Devise absente : à confirmer.');
  if (result.amountTTC === null || result.amountTTC <= 0) issues.push('Total TTC absent ou non positif : à saisir.');
  if (result.amountHT !== null && result.tvaAmount !== null && result.amountTTC !== null && Math.abs(result.amountHT + result.tvaAmount - result.amountTTC) > 0.02)
    issues.push('Les totaux HT + TVA ne correspondent pas au TTC du document.');
  if (result.tvaRate !== null && (result.tvaRate < 0 || result.tvaRate > 1)) issues.push('Taux TVA incohérent : vérifier le document.');
  if (items.length && items.every((item: any) => item.amountTTC !== null) && result.amountTTC !== null && Math.abs(items.reduce((sum: number, item: any) => sum + item.amountTTC, 0) - result.amountTTC) > 0.05)
    issues.push('La somme des lignes ne correspond pas au total TTC.');
  if (Array.isArray(raw?.items) && raw.items.length > 35) issues.push('Plus de 35 lignes : compléter le détail manuellement.');
  if (result.documentType === 'delivery_note') issues.push('Bordereau de livraison : le montant final facturé reste à confirmer.');
  if (result.documentType === 'quote') issues.push('Devis : vérifier que cet achat a bien été réalisé avant de l’enregistrer.');
  if (result.documentType === 'credit_note') issues.push('Avoir : enregistrer son remboursement ou son imputation, pas une nouvelle dépense.');
  for (const item of items) {
    if (['stock','packaging'].includes(item.kind) && (!(item.quantity !== null && item.quantity > 0) || !item.unit)) issues.push(`${item.name || item.id} : quantité ou unité manquante; aucun stock automatique.`);
    if (item.kind === 'unknown' || item.ambiguity) issues.push(`${item.name || item.id} : ${item.ambiguity || 'nature à préciser'}.`);
  }
  return result;
}
export function needsInvoiceReview(result: ReturnType<typeof normalizeInvoiceScan>) {
  return result.items.some(item => item.kind === 'equipment' || item.kind === 'unknown' || Boolean(item.ambiguity));
}

// Compare count-unit spelling only. Never infer an absent unit or convert quantities.
function comparisonUnit(value: string): string {
  const normalized = value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /^(pieces?|pces?|pcs?)\.?$/.test(normalized) ? 'piece' : value.trim();
}

/** A descriptive note is not a dispute. Ambiguity is explicit and mandatory;
 * a legacy or incomplete reviewer response must never silently become checked.
 * The first transcription is kept intact, including quantities and unit spelling.
 */
export function compareInvoiceReview(targets: ReturnType<typeof normalizeInvoiceScan>['items'], raw: unknown): { status: 'checked' | 'disputed'; findings: string[] } {
  const lines = (raw as any)?.lines;
  const findings: string[] = [];
  const finiteOrNull = (value: unknown) => value === null || typeof value === 'number' && Number.isFinite(value);
  for (const item of targets) {
    const matches = Array.isArray(lines) ? lines.filter(line => line?.id === item.id) : [];
    const second = matches[0];
    const complete = matches.length === 1 && SCAN_KINDS.includes(second.kind)
      && finiteOrNull(second.quantity) && typeof second.unit === 'string'
      && finiteOrNull(second.amountTTC) && typeof second.uncertain === 'boolean' && typeof second.note === 'string';
    if (!complete) {
      findings.push(`${item.name} : seconde lecture incomplète. Vérifier le document.`);
      continue;
    }
    if (second.kind !== item.kind || second.quantity !== item.quantity || comparisonUnit(second.unit) !== comparisonUnit(item.unit) || second.amountTTC !== item.amountTTC)
      findings.push(`${item.name} : lectures divergentes (nature ${text(second.kind, 30)}, quantité ${second.quantity ?? 'absente'} ${text(second.unit, 30)}, TTC ${second.amountTTC ?? 'absent'}). Vérifier le document.`);
    if (second.uncertain) findings.push(`${item.name} : ${text(second.note, 250) || 'La seconde lecture signale une ambiguïté. Vérifier le document.'}`);
  }
  return { status: findings.length ? 'disputed' : 'checked', findings: findings.slice(0, 35) };
}
