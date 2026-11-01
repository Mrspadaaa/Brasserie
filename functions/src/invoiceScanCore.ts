import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { TIERS } from './models.js';
import {
  INVOICE_FIELDS, SCAN_POINT_CODES, chf, defined, lineMathCheck, makePoint, sumCheck, toCents, totalsCheck, withinRounding,
  type ControlStatus, type InvoiceField, type ScanControls, type ScanPoint, type ScanPointCode, type ScanPointDetail, type ScanRejet, type ScanVatRow,
} from './invoiceControls.js';
// Les règles de calcul vivent dans `invoiceControls.ts` (module pur, partagé avec le client) ; elles restent exportées d'ici.
export { INVOICE_FIELDS, SCAN_POINT_CODES, lineMathCheck, sumCheck, toCents };
export type { ControlStatus, InvoiceField, ScanControls, ScanPoint, ScanPointCode, ScanPointDetail, ScanRejet, ScanVatRow };

/** v5 (31.10.2026) : le résultat porte `points`, `controls`, `vat`, `proForma`, `linesLost`… Le hachage de la lecture en dépend :
 * une lecture `invoice-v4` en cache n'est plus servie sous le nouveau format. */
export const INVOICE_SCAN_VERSION = 'invoice-v5';
export const SCAN_MODEL = TIERS.max.primary;
export const SCAN_MAX_BYTES = 4 * 1024 * 1024;
/** Pire cas du schéma invoice-v5 (35 lignes, tous champs, 6 rangées de TVA) : 4 050 jetons, soit 80 % (l1, 31.10). */
export const SCAN_MAX_OUTPUT = 5100;
export const SCAN_MAX_CALLS = 3;
export const SCAN_MAX_ITEMS = 35;
export const SCAN_MAX_VAT_ROWS = 6;
export const SCAN_KINDS = ['equipment', 'maintenance', 'stock', 'service', 'packaging', 'shipping', 'discount', 'other', 'unknown'] as const;
export interface InvoiceFieldWarning { field: InvoiceField; message: string }
export const DOCUMENT_TYPES = ['invoice', 'receipt', 'delivery_note', 'quote', 'credit_note', 'other'] as const;
export type DocumentType = typeof DOCUMENT_TYPES[number];
export interface InvoiceFile { data: string; mimeType: string }


// ---------------------------------------------------------------------------------------------------------------------
// Fichier : comptage des pages d'un PDF (P1)
// ---------------------------------------------------------------------------------------------------------------------
const PDF_MAX_STREAM = 4 * 1024 * 1024, PDF_MAX_DECODED = 16 * 1024 * 1024, PDF_MAX_STREAMS = 200;
/** Relecture n° 1 (31.10) : le travail par motif trouvé est borné (fenêtre fixe), et le nombre de motifs examinés l'est aussi ; au-delà,
 * le fichier est refusé plutôt que parcouru. Un justificatif de 4 pages en compte une poignée : 200 arbres de pages sont déjà irréels. */
const PDF_WINDOW = 4000, PDF_MAX_TREES = 200;
const PDF_UNREADABLE = 'Ce PDF compressé ne permet pas de compter ses pages. Exporte les pages utiles en images.';
const PDF_TOO_COMPLEX = 'Ce PDF ne permet pas de compter ses pages (structure trop répétitive). Exporte les pages utiles en images.';

/** Compte les pages d'un PDF, y compris celles d'un flux d'objets compressé (/ObjStm, format 1.5).
 * Lève une erreur claire si le fichier est chiffré ou si un flux ne peut pas être décodé : jamais de comptage deviné.
 * Temps linéaire en taille d'entrée : chaque recherche vers l'avant ou l'arrière tient dans une fenêtre fixe, `endstream` est mémorisé. */
export function countPdfPages(bytes: Buffer): { pages: number; treeCounts: number[] } {
  const pdf = bytes.toString('latin1');
  if (/\/Encrypt\b/.test(pdf)) throw new Error('Ce PDF est chiffré : exporte les pages utiles en images.');
  // Les flux d'objets se trouvent par leur annonce (/Type /ObjStm), pas en parcourant chaque « stream » du fichier. Plus de 200 : refusé.
  const announced: number[] = [];
  for (const found of pdf.matchAll(/\/Type\s*\/ObjStm\b/g)) if (announced.push(found.index) > PDF_MAX_STREAMS) throw new Error(PDF_UNREADABLE);
  let text = pdf, decodedBytes = 0, endCache = { from: -1, to: -1 };
  const endOf = (start: number) => {
    // Le premier `endstream` après `start` est aussi le premier après tout `start'` compris entre `from` et `to` : une seule recherche par tronçon.
    if (endCache.from >= 0 && start >= endCache.from && start <= endCache.to) return endCache.to;
    endCache = { from: start, to: pdf.indexOf('endstream', start) };
    return endCache.to;
  };
  const seen = new Set<number>();
  for (const at of announced) {
    const ahead = pdf.slice(at, at + PDF_WINDOW), open = /(?<!end)stream\r?\n/.exec(ahead);
    if (!open || /endobj/.test(ahead.slice(0, open.index))) throw new Error(PDF_UNREADABLE);
    const start = at + open.index + open[0].length;
    if (seen.has(start)) throw new Error(PDF_UNREADABLE);
    seen.add(start);
    const low = Math.max(0, at - PDF_WINDOW), head = pdf.slice(low, at), back = head.lastIndexOf('obj');
    const dictionary = pdf.slice(low + Math.max(0, back), at + open.index);
    const end = endOf(start);
    const filter = /\/Filter\s*(\[[^\]]*\]|\/\w+)/.exec(dictionary)?.[1]?.replace(/[\s[\]]/g, '');
    if (end < 0 || filter !== '/FlateDecode' || /\/DecodeParms/.test(dictionary)) throw new Error(PDF_UNREADABLE);
    let decoded: Buffer;
    try { decoded = inflateSync(bytes.subarray(start, end), { maxOutputLength: PDF_MAX_STREAM }); } catch { throw new Error(PDF_UNREADABLE); }
    decodedBytes += decoded.length;
    if (decodedBytes > PDF_MAX_DECODED) throw new Error(PDF_UNREADABLE);
    text += `\n${decoded.toString('latin1')}`;
  }
  let pages = 0;
  for (const _ of text.matchAll(/\/Type\s*\/Page\b/g)) pages++;
  const treeCounts: number[] = [];
  let trees = 0;
  for (const tree of text.matchAll(/\/Type\s*\/Pages\b/g)) {
    if (++trees > PDF_MAX_TREES) throw new Error(PDF_TOO_COMPLEX);
    // Le /Count se lit dans le dictionnaire même de l'arbre de pages, jamais dans celui d'un autre (signets /Outlines).
    const low = Math.max(0, tree.index - PDF_WINDOW), from = low + Math.max(0, text.slice(low, tree.index).lastIndexOf('<<'));
    const tail = text.slice(tree.index, tree.index + PDF_WINDOW), close = tail.indexOf('>>');
    const count = /\/Count\s+(\d+)/.exec(text.slice(from, tree.index + (close < 0 ? tail.length : close)));
    if (count) treeCounts.push(Number(count[1]));
  }
  return { pages, treeCounts };
}

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
    const { pages, treeCounts } = countPdfPages(bytes);
    if (pages < 1) throw new Error('Ce PDF ne permet pas de vérifier la limite de 4 pages. Exporte les pages utiles en images.');
    if (pages > 4 || treeCounts.some(n => n > 4)) throw new Error('Sélectionne un justificatif de 4 pages maximum.');
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

// ---------------------------------------------------------------------------------------------------------------------
// Contrôles arithmétiques (C1 à C4, P2). Fonctions pures : aucune valeur lue n'est jamais modifiée.
// ---------------------------------------------------------------------------------------------------------------------
type CoreItem = {
  id: string; name: string; kind: typeof SCAN_KINDS[number]; quantity: number | null; unit: string; price: number | null; amountTTC: number | null;
  reference: string; variant: string; stockCategory: string; evidence: string; ambiguity: string; vatCode: string; alphaPct: number | null; alphaPctLu: number | null;
};

type VatKey = { code: string; rate: number | null };
const normalizedVatCode = (value: string) => value.trim().split(/[\s(/]/)[0].replace(/%.*$/, '').toUpperCase();
/** « N », « N 8.1% » → code N ; « 8.1% » → taux 0,081 (un « 1 » seul reste un code). */
function vatKey(value: string): VatKey {
  const percent = /^\s*(\d+(?:[.,]\d+)?)\s*%/.exec(value);
  return percent ? { code: '', rate: Number(percent[1].replace(',', '.')) / 100 } : { code: normalizedVatCode(value), rate: null };
}
const sameRate = (a: number | null, b: number | null) => a !== null && b !== null && Math.abs(a - b) < 1e-9;
function rowMatches(row: ScanVatRow, key: VatKey): boolean {
  const own = vatKey(row.code), rate = row.rate ?? own.rate;
  return (own.code !== '' && key.code !== '' && own.code === key.code) || sameRate(rate, key.rate);
}
type Relation = { relation: string; code?: string; lu: number; calcule: number; ok: boolean; arrondi: boolean };

function vatRelations(basis: 'TTC' | 'HT', rows: ScanVatRow[], items: CoreItem[], tvaAmount: number | null, amountTTC: number | null, linesLost: number): Relation[] {
  const out: Relation[] = [], label = (row: ScanVatRow, i: number) => vatKey(row.code).code || (row.rate !== null ? `${(row.rate * 100).toFixed(1)}%` : `#${i + 1}`);
  const exact = rows.map(row => ({ row, base: toCents(row.base), amount: toCents(row.amount) }));
  const keyed = items.map(item => ({ item, key: vatKey(item.vatCode), cents: toCents(item.amountTTC) }));
  exact.forEach(({ row, base, amount }, i) => {
    const members = keyed.filter(entry => entry.item.vatCode !== '' && rowMatches(row, entry.key));
    if (row.rate !== null && base !== null && amount !== null) {
      const expected = basis === 'TTC' ? base * row.rate / (1 + row.rate) : base * row.rate, tolerance = Math.ceil(Math.max(members.length, 1) / 2) + 1;
      out.push({ relation: `tva-du-taux:${label(row, i)}`, code: label(row, i), lu: amount, calcule: Math.round(expected), ok: withinRounding(amount, expected, tolerance), arrondi: !withinRounding(amount, expected) });
    }
  });
  const printed = toCents(tvaAmount);
  if (printed !== null && exact.length && exact.every(entry => entry.amount !== null)) {
    const total = exact.reduce((s, entry) => s + entry.amount!, 0);
    out.push({ relation: 'somme-tva', lu: printed, calcule: total, ok: printed === total, arrondi: false });
  }
  const ttc = toCents(amountTTC);
  if (ttc !== null && exact.length && exact.every(entry => entry.base !== null && (basis === 'TTC' || entry.amount !== null))) {
    const bases = exact.reduce((s, entry) => s + entry.base!, 0), vat = exact.reduce((s, entry) => s + (entry.amount ?? 0), 0);
    const target = basis === 'TTC' ? ttc : ttc - vat, gap = Math.abs(bases - target);
    // Relecture n° 4 : la base imprimée d'un récapitulatif TVA peut précéder l'arrondi imprimé (Rundung), ou le suivre (hypothèse non
    // confirmée sur un vrai document). Un écart d'au plus le montant des lignes d'arrondi est donc toléré, dans les deux sens ; au-delà, c'est un écart.
    const rounding = roundingCents(items);
    out.push({ relation: 'somme-bases', lu: bases, calcule: target, ok: gap <= rounding, arrondi: gap > 0 });
  }
  // Bases contre lignes, par code. Les lignes sans code (port, remise, arrondi, autre) peuvent être comprises dans une base imprimée : si l'une
  // d'elles existe, une relation qui ne tombe pas juste sur les seules lignes codées n'est pas un écart, elle n'est pas vérifiable (relecture n° 3).
  const coded = keyed.filter(entry => entry.item.vatCode !== ''), uncoded = keyed.filter(entry => entry.item.vatCode === '');
  if (linesLost === 0 && coded.every(entry => entry.cents !== null)) {
    exact.forEach(({ row, base, amount }, i) => {
      const members = coded.filter(entry => rowMatches(row, entry.key));
      if (base === null || !members.length || (basis === 'HT' && amount === null)) return;
      const gross = members.reduce((s, entry) => s + entry.cents!, 0), expected = basis === 'TTC' ? gross : gross - amount!;
      if (base !== expected && uncoded.length) return;
      out.push({ relation: `base-par-code:${label(row, i)}`, code: label(row, i), lu: base, calcule: expected, ok: base === expected, arrondi: false });
    });
  }
  return out;
}

/** Montant absolu des lignes d'arrondi : nom « Rundung », « arrondi »… ; remise ou autre, sans code de TVA, de 5 centimes au plus. */
function roundingCents(items: CoreItem[]): number {
  return items.reduce((sum, item) => {
    const cents = toCents(item.amountTTC);
    const isRounding = /rund|arrondi|rounding|rappen/i.test(item.name) && ['discount', 'other'].includes(item.kind) && item.vatCode === '' && cents !== null && Math.abs(cents) <= 5;
    return isRounding ? sum + Math.abs(cents!) : sum;
  }, 0);
}

/** C3 et A10 — la TVA imprimée se recoupe-t-elle ? Base TTC ou HT choisie une fois pour le bloc : moins de relations en échec, puis plus
 * petite somme d'écarts, puis TTC. Un seul point par document ; aucune valeur lue n'est corrigée. */
export function vatBlockCheck(items: CoreItem[], rows: ScanVatRow[], tvaAmount: number | null, amountTTC: number | null, linesLost: number): { points: ScanPoint[]; vat: ScanControls['vat'] } {
  const candidates = (['TTC', 'HT'] as const).map(basis => ({ basis, relations: vatRelations(basis, rows, items, tvaAmount, amountTTC, linesLost) }));
  if (!rows.length || !candidates[0].relations.length) return { points: [], vat: { statut: 'non-verifiable', base: null } };
  const score = (c: typeof candidates[number]) => { const bad = c.relations.filter(r => !r.ok); return [bad.length, bad.reduce((s, r) => s + Math.abs(r.lu - r.calcule), 0)]; };
  const best = candidates.reduce((a, b) => { const x = score(a), y = score(b); return y[0] < x[0] || (y[0] === x[0] && y[1] < x[1]) ? b : a; });
  const failed = best.relations.filter(r => !r.ok);
  if (!failed.length) return { points: [], vat: { statut: 'ok', base: best.basis } };
  const details: ScanPointDetail[] = best.relations.filter(r => !r.ok || r.arrondi)
    .map(r => defined({ relation: r.relation, lu: r.lu, calcule: r.calcule, ecart: r.lu - r.calcule, code: r.code, arrondiPossible: r.ok && r.arrondi ? true : undefined }))
    .sort((a, b) => Math.abs(b.ecart!) - Math.abs(a.ecart!));
  const bases = rows.every(row => toCents(row.base) !== null) ? rows.reduce((s, row) => s + toCents(row.base)!, 0) : null, ttc = toCents(amountTTC);
  const sample = details.filter(d => !d.arrondiPossible).slice(0, 2).map(d => `${d.relation} lu ${chf(d.lu!)} pour ${chf(d.calcule!)}`).join(' ; ');
  return {
    points: [makePoint('tva-incoherente', 'ecart', 'vat', null, {
      regle: 'TVA imprimée : taux, bases, montants et lignes se recoupent', unite: 'centimes', enjeu: 'info', lu: bases, calcule: ttc, details,
      champs: ['vat', 'tvaAmount', 'amountTTC'],
      message: `TVA imprimée incohérente : ${failed.length} contrôle(s) par taux ne se recoupent pas (${sample}). Rien n'est corrigé, le HT n'est pas déduit.`,
    })], vat: { statut: 'ecart', base: best.basis },
  };
}

/** Normalise une désignation de TVA dite « code » : au plus 10 caractères, le reste est tracé. */
function readRejets(value: unknown): ScanRejet[] {
  return (Array.isArray(value) ? value : []).slice(0, 40).flatMap((entry: any) => typeof entry?.champ === 'string' && typeof entry?.luTexte === 'string' && typeof entry?.raison === 'string'
    ? [{ champ: text(entry.champ, 40), ligne: Number.isInteger(entry.ligne) ? entry.ligne as number : null, luTexte: text(entry.luTexte, 60), raison: text(entry.raison, 120) }] : []);
}

/** Pure transcription checks. Original totals/rates survive discrepancies. */
export function normalizeInvoiceScan(raw: any) {
  const issues: string[] = [];
  const points: ScanPoint[] = [];
  const rejets = readRejets(raw?.rejets);
  const reject = (champ: string, ligne: number | null, luTexte: string, raison: string) => {
    if (!rejets.some(r => r.champ === champ && r.ligne === ligne && r.luTexte === luTexte.slice(0, 60))) rejets.push({ champ, ligne, luTexte: luTexte.slice(0, 60), raison });
  };
  const sourceItems: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const items: CoreItem[] = sourceItems.slice(0, SCAN_MAX_ITEMS).map((item: any, index: number) => {
    const alphaRead = number(item?.alphaPctLu ?? item?.alphaPct), alphaPct = alphaRead !== null && alphaRead > 0 && alphaRead <= 30 ? alphaRead : null;
    if (alphaRead !== null && alphaPct === null) reject('alphaPct', index + 1, String(alphaRead), 'α hors de ]0 ; 30] %');
    const code = text(item?.vatCode, 60);
    if (code.length > 10) reject('vatCode', index + 1, code, 'code de TVA coupé à 10 caractères');
    return {
      id: `line-${index + 1}`, name: text(item?.name), kind: SCAN_KINDS.includes(item?.kind) ? item.kind as typeof SCAN_KINDS[number] : 'unknown' as const,
      quantity: number(item?.quantity), unit: text(item?.unit, 30), price: number(item?.price), amountTTC: number(item?.amountTTC),
      reference: text(item?.reference, 70), variant: text(item?.variant, 80),
      stockCategory: text(item?.stockCategory, 60), evidence: text(item?.evidence, 250), ambiguity: text(item?.ambiguity, 200),
      vatCode: code.slice(0, 10), alphaPct, alphaPctLu: alphaRead,
    };
  });
  const documentType: DocumentType = DOCUMENT_TYPES.includes(raw?.documentType) ? raw.documentType as DocumentType : 'other';
  const paymentEvidence = ['paid', 'unpaid', 'unknown'].includes(raw?.paymentEvidence) ? raw.paymentEvidence as 'paid'|'unpaid'|'unknown' : 'unknown' as const;
  const proForma = raw?.proForma === true;
  const rawVat: any[] = Array.isArray(raw?.vat) ? raw.vat : [];
  if (rawVat.length > SCAN_MAX_VAT_ROWS) reject('vat', null, `${rawVat.length} rangées`, `bloc TVA coupé à ${SCAN_MAX_VAT_ROWS} rangées`);
  const vat: ScanVatRow[] = rawVat.slice(0, SCAN_MAX_VAT_ROWS).map((row: any, index: number) => {
    const code = text(row?.code, 60), rate = number(row?.rate);
    if (code.length > 10) reject('vat.code', null, code, 'code de TVA coupé à 10 caractères');
    if (rate !== null && (rate < 0 || rate > 1)) reject('vat.rate', null, `${code || index + 1} : ${rate}`, 'taux hors de 0 à 1 (fraction attendue)');
    return { code: code.slice(0, 10), rate: rate !== null && rate >= 0 && rate <= 1 ? rate : null, base: number(row?.base), amount: number(row?.amount) };
  });
  const printedRead = raw?.printedLineCount;
  const printedLineCount = typeof printedRead === 'number' && Number.isInteger(printedRead) && printedRead >= 0 ? printedRead : null;
  if (printedRead !== undefined && printedRead !== null && printedLineCount === null) reject('printedLineCount', null, String(printedRead), 'nombre de lignes invalide');
  const lostCertain = Math.max(0, sourceItems.length - SCAN_MAX_ITEMS, Number.isInteger(raw?.linesLost) && raw.linesLost > 0 ? raw.linesLost : 0);
  const announcedGap = printedLineCount !== null ? Math.max(0, printedLineCount - items.length - lostCertain) : 0;

  const result = {
    documentType, documentTypeLu: DOCUMENT_TYPES.includes(raw?.documentTypeLu) ? raw.documentTypeLu as DocumentType : documentType,
    documentTypeRetenu: (proForma && paymentEvidence === 'paid' && documentType === 'quote' ? 'invoice' : documentType) as DocumentType, proForma,
    paymentEvidence,
    fieldWarnings: (Array.isArray(raw?.fieldWarnings) ? raw.fieldWarnings : []).filter((warning: any) => INVOICE_FIELDS.includes(warning?.field) && text(warning?.message)).slice(0, 20).map((warning: any): InvoiceFieldWarning => ({ field: warning.field, message: text(warning.message, 200) })),
    vendor: text(raw?.vendor), date: invoiceDate(raw?.date), currency: text(raw?.currency, 5).toUpperCase(), invoiceNumber: text(raw?.invoiceNumber, 70),
    orderNumber: text(raw?.orderNumber, 70),
    amountHT: number(raw?.amountHT), tvaRate: number(raw?.tvaRate), tvaAmount: number(raw?.tvaAmount), amountTTC: number(raw?.amountTTC),
    vat, printedLineCount, linesLost: lostCertain,
    category: ['brassage','materiel','nettoyage','chargesFixes','renovation','divers'].includes(raw?.category) ? raw.category : 'divers',
    subcategory: text(raw?.subcategory, 60), description: text(raw?.description, 300), items, issues,
    points, controls: { lines: { checked: 0, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'non-verifiable', base: null }, vat: { statut: 'non-verifiable', base: null }, totals: { statut: 'non-verifiable' } } as ScanControls,
    rejets,
    review: { status: 'not-needed' as string, findings: [] as string[] }
  };
  const say = (point: ScanPoint) => { points.push(point); issues.push(point.message); };

  if (!result.date) issues.push('Date absente ou invalide : à saisir.');
  if (result.currency !== 'CHF') issues.push(result.currency ? `Document en ${result.currency} : saisir le montant réellement payé en CHF.` : 'Devise absente : à confirmer.');
  if (result.amountTTC === null || result.amountTTC <= 0) issues.push('Total TTC absent ou non positif : à saisir.');

  // C4 — HT + TVA = TTC (comportement d'avant : 2 centimes de tolérance, chacun des trois arrondi séparément). Un HT n'est jamais calculé.
  // (la règle vit dans `invoiceControls.ts` : le client la refait avec la même fonction)
  const totals = totalsCheck(result.amountHT, result.tvaAmount, result.amountTTC);
  if (totals.point) { result.controls.totals = totals.totals; say(totals.point); }
  else if (totals.totals.statut === 'ok') result.controls.totals = totals.totals;
  if (result.tvaRate !== null && (result.tvaRate < 0 || result.tvaRate > 1)) issues.push('Taux TVA incohérent : vérifier le document.');

  // C1 — quantité × prix.
  const lineMath = lineMathCheck(items);
  result.controls.lines = lineMath.lines;
  lineMath.points.forEach(say);

  // C2 / P2 — somme des lignes ; lignes perdues.
  let linesLost = lostCertain;
  let summed = sumCheck(items, result.amountTTC, result.amountHT, linesLost);
  if (announcedGap > 0) {
    if (summed.sum.statut === 'ok') {
      say(makePoint('lignes-annoncees', 'inverifiable', 'items', null, {
        regle: 'nombre de lignes annoncé = lignes transcrites', unite: 'lignes', enjeu: 'info', lu: printedLineCount, calcule: items.length,
        // Relecture n° 2 : ni « somme des lignes » ni « total » (le déclencheur de la 3ᵉ lecture et le routage de l'écran les lisent) ;
        // un compte de lignes ne se corrige pas par une lecture de plus.
        message: `Le modèle annonce ${printedLineCount} lignes imprimées, ${items.length} transcrites ; les montants des lignes concordent pourtant avec le document : à contrôler sur le document.`,
      }));
    } else { linesLost += announcedGap; summed = sumCheck(items, result.amountTTC, result.amountHT, linesLost); }
  }
  result.linesLost = linesLost;
  result.controls.sum = summed.sum;
  if (Array.isArray(raw?.items) && raw.items.length > SCAN_MAX_ITEMS) issues.push('Plus de 35 lignes : compléter le détail manuellement.');
  if (linesLost > 0) {
    say(makePoint('lignes-perdues', 'ecart', 'items', null, {
      regle: 'toutes les lignes du document sont conservées (35 au plus)', unite: 'lignes', enjeu: 'argent', lu: items.length, calcule: items.length + linesLost,
      message: `Détail des lignes incomplet : ${linesLost} ligne(s) non conservée(s) (35 lignes au plus) ; le total des lignes n'est pas vérifié.`,
    }));
  }
  summed.points.forEach(say);

  // C3 / A10 — TVA par taux.
  const vatCheck = vatBlockCheck(items, vat, result.tvaAmount, result.amountTTC, linesLost);
  result.controls.vat = vatCheck.vat;
  vatCheck.points.forEach(say);

  // Type de document : la valeur lue n'est jamais écrasée ; `documentTypeRetenu` dit comment le code la traite.
  if (result.documentType === 'delivery_note') issues.push('Bordereau de livraison : le montant final facturé reste à confirmer.');
  if (result.documentType === 'quote' && !proForma) {
    say(makePoint('devis', 'inverifiable', 'documentType', null, {
      regle: 'un devis n’est pas une dépense réalisée', unite: 'texte', enjeu: 'argent', luTexte: 'quote',
      message: 'Devis : vérifier que cet achat a bien été réalisé avant de l’enregistrer.',
    }));
  }
  if (proForma && paymentEvidence === 'paid' && documentType === 'quote') {
    say(makePoint('type-deduit', 'ecart', 'documentType', null, {
      regle: 'une pro-forma dont le paiement est imprimé est une facture réglée', unite: 'texte', enjeu: 'argent', luTexte: 'quote',
      message: 'Pro-forma payée lue comme devis : traitée comme facture réglée (paiement imprimé). Type lu conservé.',
    }));
  }
  if (proForma && paymentEvidence !== 'paid') {
    say(makePoint('pro-forma-non-payee', 'inverifiable', 'documentType', null, {
      regle: 'une pro-forma sans paiement imprimé est une demande de paiement', unite: 'texte', enjeu: 'argent', luTexte: documentType,
      message: 'Pro-forma sans paiement imprimé : demande de paiement, pas une dépense réglée.',
    }));
  }
  if (result.documentType === 'credit_note') issues.push('Avoir : enregistrer son remboursement ou son imputation, pas une nouvelle dépense.');

  // A9 — l'α lu se recoupe avec le seul libellé (jamais l'extrait, qui peut citer un taux de TVA).
  items.forEach((item, index) => {
    const printed = [...item.name.matchAll(/(\d{1,2}(?:[.,]\d{1,2})?)\s*%/g)].map(m => Number(m[1].replace(',', '.')));
    if (item.alphaPct !== null && printed.length && !printed.some(p => Math.abs(p - item.alphaPct!) <= 0.05)) {
      say(makePoint('alpha-libelle', 'ecart', 'items', index + 1, {
        regle: 'l’α lu égale le pourcentage imprimé dans le libellé', unite: 'pourcent', enjeu: 'stock', lu: item.alphaPct, calcule: printed[0], champs: [`items.${index + 1}.alphaPct`, `items.${index + 1}.name`],
        message: `Ligne ${index + 1} (${item.name.slice(0, 40)}) : α lu ${item.alphaPct} %, le libellé imprime ${printed[0]} % (lignes à vérifier).`,
      }));
    }
  });

  // Valeurs lues rejetées à la mise en forme : tracées, jamais avalées.
  for (const rejet of rejets) {
    say(makePoint('forme-rejetee', 'inverifiable', rejet.champ.startsWith('vat') ? 'vat' : 'items', rejet.ligne, {
      regle: 'une valeur lue est gardée telle quelle ou rejetée avec sa trace', unite: 'texte', enjeu: 'info', origine: 'forme', luTexte: rejet.luTexte, champs: [rejet.champ],
      message: `Valeur lue rejetée (${rejet.champ}${rejet.ligne ? `, ligne ${rejet.ligne}` : ''}) : ${rejet.luTexte} — ${rejet.raison}.`,
    }));
  }

  if (result.documentType === 'quote' && !proForma) issues.push('Devis : vérifier que cet achat a bien été réalisé avant de l’enregistrer.');
  items.forEach((item, index) => {
    // D213 : l'unité imprimée est gardée telle quelle ; une ligne sans unité lisible le dit, aucune unité n'est devinée.
    const stockLine = ['stock','packaging'].includes(item.kind);
    // Seules les lignes de stock et d'emballage sont concernées : un port ou une pièce de matériel sans unité est normal.
    if (stockLine && (!(item.quantity !== null && item.quantity > 0) || !item.unit)) {
      say(makePoint('unite-absente', 'inverifiable', 'items', index + 1, {
        regle: 'une quantité garde l’unité imprimée ; sans unité lisible, l’unité est à préciser par le brasseur', unite: 'texte', enjeu: 'stock', luTexte: item.unit,
        champs: [`items.${index + 1}.quantity`, `items.${index + 1}.unit`],
        message: `${item.name || item.id} : quantité ou unité manquante; aucun stock automatique.`,
      }));
    }
  });
  for (const item of items) {
    if (item.kind === 'unknown' || item.ambiguity) issues.push(`${item.name || item.id} : ${item.ambiguity || 'nature à préciser'}.`);
  }
  return result;
}
export function needsInvoiceReview(result: ReturnType<typeof normalizeInvoiceScan>) {
  return result.items.some(item => item.kind === 'equipment' || item.kind === 'unknown' || Boolean(item.ambiguity));
}

// Compare count-unit spelling only. Never infer an absent unit or convert quantities.
function comparisonUnit(value: string): string {
  const normalized = value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
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
