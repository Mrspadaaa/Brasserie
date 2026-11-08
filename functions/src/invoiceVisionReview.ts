import { normalizeInvoiceScan, INVOICE_FIELDS, type InvoiceFieldWarning } from './invoiceScanCore.js';
import { lineMathCheck, makePoint, peserPoint, signerPoint, toCents, totalAbsentPoint, type ScanPoint, type ScanValue } from './invoiceControls.js';

export type InvoiceScanResult = ReturnType<typeof normalizeInvoiceScan>;
export interface InvoiceVisionReview {
  status: 'checked' | 'corrected' | 'disputed';
  findings: string[];
  readers: number;
  correctedFields: string[];
}
/** Une remarque libre du modèle : jamais jetée, jamais un point, ne pèse jamais (l2, P2). `lectures` = les lectures (1 à 3) qui l'ont levée. */
export interface InvoiceRemarque { champ: string; ligne?: number; lectures: number[]; message: string }

type Item = InvoiceScanResult['items'][number];
const headerFields = ['vendor', 'date', 'currency', 'invoiceNumber', 'orderNumber', 'amountHT', 'amountTTC', 'tvaAmount', 'tvaRate', 'category', 'documentType', 'paymentEvidence', 'proForma'] as const;
const itemFields = ['name', 'kind', 'reference', 'variant', 'quantity', 'unit', 'price', 'amountTTC', 'stockCategory', 'vatCode', 'alphaPctLu'] as const;
/** LE1 / P5 : seuls ces champs de ligne (et le nom, hors coquille) achètent une troisième lecture. */
const triggerItemFields = new Set<string>(['quantity', 'unit', 'amountTTC', 'kind', 'reference']);
/** P5 : la TVA n'entre pas dans la dépense d'une brasserie non assujettie et le bloc imprimé est contrôlé par taux ; leur désaccord est un point, pas une lecture payante. */
const noTriggerHeader = new Set<string>(['tvaAmount', 'tvaRate']);
/** P6 : une majorité 2 contre 1 sur ces champs laisse un point (la valeur écartée reste visible) ; il ne pèse pas. */
const settledHeader = new Set<string>(['amountHT', 'amountTTC', 'date', 'currency']);
const settledItem = new Set<string>(['quantity', 'unit', 'amountTTC']);
const moneyFields = new Set<string>(['amountHT', 'amountTTC', 'tvaAmount', 'price']);
const argentItem = new Set<string>(['quantity', 'price', 'amountTTC']);
const liaisonItem = new Set<string>(['name', 'unit', 'variant', 'stockCategory']);
const labels: Record<string, string> = {
  vendor: 'Fournisseur', date: 'Date', currency: 'Devise', invoiceNumber: 'Numéro de facture',
  amountHT: 'Total HT', amountTTC: 'Montant TTC', tvaAmount: 'Montant TVA', tvaRate: 'Taux TVA',
  category: 'Catégorie', subcategory: 'Sous-catégorie', name: 'Désignation', kind: 'Nature',
  quantity: 'Quantité', unit: 'Unité', price: 'Prix unitaire', stockCategory: 'Catégorie de stock',
  reference: 'Référence article', variant: 'Taille ou variante', orderNumber: 'Numéro de commande', documentType: 'Type de document', paymentEvidence: 'Paiement',
  proForma: 'Pro-forma', vat: 'Bloc TVA', vatCode: 'Code TVA', alphaPctLu: 'α lu',
};
const NON_CONCORDANT = 'Vérifie cette valeur sur le document.';

function canonicalText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function comparisonKey(field: string, value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'invalid-number';
    // Ignore binary representation noise, never round a genuine sub-cent amount.
    const cents = value * 100;
    if (['amountHT', 'amountTTC', 'tvaAmount'].includes(field) && Math.abs(cents - Math.round(cents)) <= Number.EPSILON * Math.max(1, Math.abs(cents)) * 8)
      return `cents:${Math.round(cents)}`;
    return `number:${Number(value.toPrecision(15))}`;
  }
  if (typeof value !== 'string') return `${typeof value}:${String(value)}`;
  const normalized = canonicalText(value);
  if (field === 'unit' && /^(pieces?|pces?|pcs?)\.?$/.test(normalized)) return 'text:piece';
  return `text:${normalized}`;
}

function majority<T>(values: T[], field: string): { value: T; index: number } | undefined {
  for (let index = 0; index < values.length; index++) {
    const key = comparisonKey(field, values[index]);
    if (values.filter(value => comparisonKey(field, value) === key).length >= 2) return { value: values[index], index };
  }
  return undefined;
}

// ---------------------------------------------------------------------------------------------------------------------
// Valeurs, phrases, points de désaccord
// ---------------------------------------------------------------------------------------------------------------------
const valeur = (v: unknown): ScanValue['valeur'] => v === '' || v === undefined || v === null ? null : typeof v === 'string' ? v.slice(0, 120) : typeof v === 'number' || typeof v === 'boolean' ? v : String(v).slice(0, 120);
const montrer = (field: string, v: unknown): string => {
  const x = valeur(v);
  if (x === null) return 'absent';
  if (typeof x === 'number') return moneyFields.has(field) ? x.toFixed(2).replace('.', ',') : String(x).replace('.', ',');
  return String(x);
};

interface Desaccord {
  field: string; ligne: number | null; vals: unknown[]; lectures: number[]; retenues: boolean[]; motifs?: Array<ScanValue['motif'] | undefined>;
  pese: boolean; enjeu: ScanPoint['enjeu']; message: string; bloqueLiaison?: boolean;
}
function pointDesaccord(o: Desaccord): ScanPoint {
  const numerique = o.vals.some(v => typeof v === 'number');
  const valeurs: ScanValue[] = o.vals.map((v, i) => ({ lecture: o.lectures[i], valeur: valeur(v), retenue: o.retenues[i], ...(o.motifs?.[i] ? { motif: o.motifs[i] } : {}) }));
  const retenu = valeurs.find(v => v.retenue)?.valeur;
  const cellule = o.ligne === null ? o.field : `items.${o.ligne}.${o.field}`;
  const base = makePoint('lectures-divergentes', 'ecart', (o.ligne === null ? o.field : 'items') as ScanPoint['champ'], o.ligne, {
    regle: 'les lectures indépendantes lisent la même valeur', message: o.message, unite: numerique ? 'nombre' : 'texte', enjeu: o.enjeu, origine: 'lecture', champs: [cellule],
    ...(!numerique && typeof retenu === 'string' ? { luTexte: retenu } : {}),
  });
  return { ...base, cle: `lectures-divergentes:${o.ligne ?? '-'}:${o.field}`, source: 'désaccord', valeurs, pese: o.pese, ...(o.bloqueLiaison ? { bloqueLiaison: true } : {}) };
}

function editDistanceAtMost1(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}
/** Une coquille (distance d'édition 1) ou les mêmes mots dans un autre ordre : pas un autre produit (P5 a). */
function sameName(a: string, b: string): boolean {
  const x = canonicalText(a), y = canonicalText(b);
  if (editDistanceAtMost1(x, y)) return true;
  const mots = (s: string) => s.split(/[^a-z0-9]+/).filter(Boolean).sort().join(' ');
  return mots(x) === mots(y);
}

// ---------------------------------------------------------------------------------------------------------------------
// Rapprochement des lignes : jamais par la seule position (P4)
// ---------------------------------------------------------------------------------------------------------------------
const FIVE = ['quantity', 'unit', 'amountTTC', 'kind', 'reference'] as const;
const score = (a: Item, b: Item) => FIVE.filter(f => comparisonKey(f, (a as any)[f]) === comparisonKey(f, (b as any)[f])).length;
const sameFive = (a: Item, b: Item) => score(a, b) === 5;
interface Pairing { match: Map<number, number>; orphansBase: number[]; orphansOther: number[] }

function alignLines(base: Item[], other: Item[]): Pairing {
  const match = new Map<number, number>(), taken = new Set<number>();
  const name = (item: Item) => canonicalText(item.name), ref = (item: Item) => canonicalText(item.reference ?? '');
  const tiers: Array<(a: Item, b: Item) => boolean> = [
    (a, b) => ref(a) !== '' && ref(a) === ref(b) && name(a) === name(b),
    (a, b) => ref(a) !== '' && ref(a) === ref(b),
    (a, b) => name(a) !== '' && name(a) === name(b),
  ];
  for (const same of tiers) {
    base.forEach((line, bi) => {
      if (match.has(bi)) return;
      const candidates = other.flatMap((candidate, oi) => !taken.has(oi) && same(line, candidate) ? [{ oi, s: score(line, candidate) }] : []);
      if (!candidates.length) return;
      const top = Math.max(...candidates.map(c => c.s)), best = candidates.filter(c => c.s === top);
      // À égalité, la première ne vaut que si les candidates sont identiques sur les cinq champs ; sinon la ligne reste non rapprochée.
      if (best.length > 1 && !best.every(c => sameFive(other[c.oi], other[best[0].oi]))) return;
      match.set(bi, best[0].oi); taken.add(best[0].oi);
    });
  }
  // Ancre par les chiffres : mêmes quantité, unité, montant et nature, seule candidate des deux côtés.
  const cle = (item: Item) => [comparisonKey('quantity', item.quantity), comparisonKey('unit', item.unit), comparisonKey('amountTTC', item.amountTTC), comparisonKey('kind', item.kind)].join('|');
  const libresBase = base.flatMap((_, bi) => (match.has(bi) ? [] : [bi])), libresOther = other.flatMap((_, oi) => (taken.has(oi) ? [] : [oi]));
  for (const bi of libresBase) {
    const k = cle(base[bi]);
    const cb = libresBase.filter(i => cle(base[i]) === k), co = libresOther.filter(i => cle(other[i]) === k);
    if (cb.length === 1 && co.length === 1) { match.set(bi, co[0]); taken.add(co[0]); }
  }
  return { match, orphansBase: base.flatMap((_, bi) => (match.has(bi) ? [] : [bi])), orphansOther: other.flatMap((_, oi) => (taken.has(oi) ? [] : [oi])) };
}
/** D308 : exportée sous ce nom pour rapprocher les lignes du premier écran (deux Flash-Lite) de celles de la lecture finale (`invoiceScanVote.ts`). */
export { alignLines as alignerLignes };
const complete = (p: Pairing) => !p.orphansBase.length && !p.orphansOther.length;
const holdsProduct = (item: Item) => { const r = lineMathCheck([item]); return r.lines.checked === 1 && r.lines.failed === 0; };
const lineSummary = (item: Item) => `${item.name || '?'} · ${item.quantity ?? '?'} ${item.unit} · ${item.amountTTC === null ? '?' : item.amountTTC.toFixed(2).replace('.', ',')}`;

// ---------------------------------------------------------------------------------------------------------------------
// Points sans point d'avant (les `issues` de l1 qui n'avaient pas de point) : le message est celui d'`issues`, mot pour mot.
// ---------------------------------------------------------------------------------------------------------------------
export function pointsDesIssues(r: InvoiceScanResult): ScanPoint[] {
  const out: ScanPoint[] = [];
  const add = (code: ScanPoint['code'], gravite: ScanPoint['gravite'], champ: ScanPoint['champ'], enjeu: ScanPoint['enjeu'], message: string, extra: { luTexte?: string; ligne?: number | null; source?: 'modèle'; champs?: string[] } = {}) =>
    out.push({ ...makePoint(code, gravite, champ, extra.ligne ?? null, { regle: 'le code relève ce que la lecture ne permet pas de tenir pour sûr', message, unite: 'texte', enjeu, ...(extra.luTexte ? { luTexte: extra.luTexte } : {}), ...(extra.champs ? { champs: extra.champs } : {}) }), ...(extra.source ? { source: extra.source } : {}) });
  if (!r.date) add('date-absente', 'ecart', 'date', 'info', 'Date absente ou invalide : à saisir.');
  if (r.currency !== 'CHF') add('devise-non-chf', 'ecart', 'currency', 'argent', r.currency ? `Document en ${r.currency} : saisir le montant réellement payé en CHF.` : 'Devise absente : à confirmer.', r.currency ? { luTexte: r.currency } : {});
  const totalAbsent = totalAbsentPoint(r.amountTTC); // une seule source pour la règle (le client la refait avec la même fonction)
  if (totalAbsent) out.push(totalAbsent);
  if (r.tvaRate !== null && (r.tvaRate < 0 || r.tvaRate > 1)) add('taux-tva-hors-plage', 'ecart', 'tvaRate', 'info', 'Taux TVA incohérent : vérifier le document.', { luTexte: String(r.tvaRate) });
  if (r.documentType === 'delivery_note') add('document-livraison', 'inverifiable', 'documentType', 'argent', 'Bordereau de livraison : le montant final facturé reste à confirmer.', { luTexte: 'delivery_note' });
  if (r.documentType === 'credit_note') add('avoir', 'inverifiable', 'documentType', 'argent', 'Avoir : enregistrer son remboursement ou son imputation, pas une nouvelle dépense.', { luTexte: 'credit_note' });
  r.items.forEach((item, index) => {
    if (item.kind !== 'unknown' && !item.ambiguity) return;
    add(item.ambiguity ? 'ambiguite-ligne' : 'nature-a-preciser', item.ambiguity ? 'ecart' : 'inverifiable', 'items', 'stock', `${item.name || item.id} : ${item.ambiguity || 'nature à préciser'}.`,
      { ligne: index + 1, source: 'modèle', champs: [`items.${index + 1}.ambiguity`], ...(item.ambiguity ? { luTexte: item.ambiguity } : {}) });
  });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Remarques du modèle et avertissements par champ (A1, P2)
// ---------------------------------------------------------------------------------------------------------------------
export function remarquesDe(readings: InvoiceScanResult[]): InvoiceRemarque[] {
  const out = new Map<string, InvoiceRemarque>();
  readings.forEach((reading, i) => {
    for (const w of reading.fieldWarnings ?? []) {
      const known = out.get(w.field);
      if (!known) out.set(w.field, { champ: w.field, lectures: [i + 1], message: w.message });
      else if (!known.lectures.includes(i + 1)) known.lectures.push(i + 1);
    }
  });
  return [...out.values()].slice(0, 40);
}

/** Pose `source`, `pese` et `signature` sur chaque point, et assemble avertissements (au plus un par champ) et remarques. */
export function finirResultat<T extends InvoiceScanResult>(normalized: T, extraPoints: ScanPoint[], readings: InvoiceScanResult[], warnings: InvoiceFieldWarning[] = []): T & { points: ScanPoint[]; remarques: InvoiceRemarque[] } {
  const brut = [...normalized.points, ...pointsDesIssues(normalized), ...extraPoints];
  const points = brut.map(p => { const q: ScanPoint = { ...p, source: p.source ?? 'contrôle' }; q.pese = peserPoint(q); q.signature = signerPoint(q); return q; });
  const remarques = remarquesDe(readings);
  const par = new Map<string, InvoiceFieldWarning>();
  for (const w of warnings) if (!par.has(w.field)) par.set(w.field, w);
  for (const r of remarques) if (!par.has(r.champ) && (INVOICE_FIELDS as readonly string[]).includes(r.champ)) par.set(r.champ, { field: r.champ as InvoiceFieldWarning['field'], message: r.message.slice(0, 200) });
  return { ...normalized, points, remarques, fieldWarnings: [...par.values()].slice(0, 20) };
}

/** Le chemin à une seule lecture : même tri par champ, mêmes points typés. */
export function finirUneLecture<T extends InvoiceScanResult>(reading: T) {
  return finirResultat(reading, [], [reading]);
}

// ---------------------------------------------------------------------------------------------------------------------
// Lectures coupées et journal (LE4)
// ---------------------------------------------------------------------------------------------------------------------
/** La réponse du modèle s'est arrêtée avant la fin (limite de sortie) : le message est celui d'avant l2. */
export class ScanReadCutError extends Error {
  constructor(public finishReason: string | null) { super('Lecture incomplète. Complète le justificatif manuellement.'); this.name = 'ScanReadCutError'; }
}
export type CauseCoupure = 'sortie' | 'delai' | 'delai-saute';
const PHRASE_COUPURE: Record<CauseCoupure, string> = {
  sortie: 'Une des deux lectures a été coupée (limite de sortie atteinte) : le justificatif n’est lu qu’une fois. Vérifie les informations et les montants sur le justificatif.',
  delai: 'Une des deux lectures a été interrompue (délai atteint) : le justificatif n’est lu qu’une fois. Vérifie les informations et les montants sur le justificatif.',
  'delai-saute': 'Le contrôle complémentaire n’a pas abouti. Les divergences restent à vérifier sur le justificatif.',
};
export const phraseCoupure = (cause: CauseCoupure) => PHRASE_COUPURE[cause];
export function pointLectureCoupee(cause: CauseCoupure, message: string): ScanPoint {
  const p = { ...makePoint('lecture-coupee', 'ecart', 'items', null, { regle: 'chaque lecture demandée arrive à son terme', message, unite: 'texte', enjeu: 'argent', origine: 'lecture', luTexte: cause }), source: 'contrôle' as const, pese: true };
  return { ...p, signature: signerPoint(p) };
}
/** Ajoute le point (et sa phrase) à un résultat déjà rapproché ; un point qui pèse rend la lecture « à confirmer ». */
export function ajouterCoupure<R extends { points: ScanPoint[]; issues: string[]; review: { status: string; findings: string[] } }>(result: R, cause: CauseCoupure, message: string): R {
  result.points = [...result.points, pointLectureCoupee(cause, message)];
  if (!result.issues.includes(message)) result.issues = [...result.issues, message];
  if (!result.review.findings.includes(message)) result.review.findings = [...result.review.findings, message];
  if (result.review.status !== 'unavailable') result.review.status = 'disputed';
  return result;
}
export function ligneJournalLecture(o: { lecture: number; etape: 'parallele' | 'troisieme'; elapsedMs: number; response: any }) {
  const usage = o.response?.usageMetadata ?? {}, finishReason = o.response?.candidates?.[0]?.finishReason ?? null;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return {
    lecture: o.lecture, etape: o.etape, elapsedMs: o.elapsedMs,
    promptTokens: n(usage.promptTokenCount), outputTokens: n(usage.candidatesTokenCount), thoughtsTokens: n(usage.thoughtsTokenCount), totalTokens: n(usage.totalTokenCount),
    finishReason, coupee: finishReason !== null && finishReason !== 'STOP',
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Le rapprochement
// ---------------------------------------------------------------------------------------------------------------------
/** Independent transcriptions only: no arithmetic inference, fuzzy OCR matching, or single-reader fill-in.
 * The third reading may settle a dispute by a two-reader majority. Unsettled fields keep the first reading and remain visible as
 * typed `lectures-divergentes` points that keep every competing value (l2). No input object is mutated.
 */
export function reconcileInvoiceVision(readings: InvoiceScanResult[]): {
  result: InvoiceScanResult & { review: InvoiceVisionReview };
  review: InvoiceVisionReview;
  needsCorrection: boolean;
} {
  if (readings.length < 2 || readings.length > 3) throw new Error('La vérification attend deux ou trois lectures indépendantes.');
  const first = readings[0], numeros = readings.map((_, i) => i + 1);
  const findings: string[] = [], correctedFields: string[] = [], desaccords: ScanPoint[] = [], warnings: InvoiceFieldWarning[] = [];
  const divergentCells = new Set<string>();
  let triggered = false;
  const merged: any = { ...first };

  // 1. En-tête
  for (const field of headerFields) {
    const vals = readings.map(reading => (reading as any)[field]);
    const decision = majority(vals, field);
    const unanime = vals.every(v => comparisonKey(field, v) === comparisonKey(field, vals[0]));
    const enjeu: ScanPoint['enjeu'] = field === 'amountHT' || field === 'amountTTC' ? 'argent' : 'info';
    if (!unanime && field === 'amountTTC') divergentCells.add('amountTTC');
    // D262a : aucun total de TVA n'est imprimé quand le document donne une taxe par taux. Une lecture qui écrit la somme des rangées du bloc et une autre
    // qui écrit null ne sont pas en désaccord : la valeur lue est recoupée par le bloc imprimé de sa propre lecture. Une valeur qui n'est NI null NI la
    // somme de son bloc reste un désaccord (le vrai écart n'est pas masqué).
    if (!decision && field === 'tvaAmount' && !unanime) {
      const sommeBloc = (r: InvoiceScanResult): number | null => (r.vat.length && r.vat.every(row => toCents(row.amount) !== null) ? r.vat.reduce((s, row) => s + toCents(row.amount)!, 0) : null);
      if (vals.every((v, i) => v === null || (toCents(v) !== null && toCents(v) === sommeBloc(readings[i])))) {
        const lu = vals.find(v => v !== null);
        // pas de `correctedFields` : la valeur est recoupée, elle ne doit pas non plus poser « Valeur corrigée… À confirmer » (invoiceFieldHints)
        if (lu !== undefined && lu !== null) merged[field] = lu;
        continue;
      }
    }
    if (!decision) {
      const message = `${labels[field]} : lectures divergentes (${vals.map(v => montrer(field, v)).join(' / ')}), vérifier le justificatif.`;
      findings.push(message);
      desaccords.push(pointDesaccord({ field, ligne: null, vals, lectures: numeros, retenues: vals.map((_, i) => i === 0), pese: true, enjeu, message }));
      if (field !== 'orderNumber' && field !== 'proForma') warnings.push({ field: field as InvoiceFieldWarning['field'], message: `Les lectures ne concordent pas (${vals.map(v => montrer(field, v)).join(' / ')}). ${NON_CONCORDANT}` });
      if (!noTriggerHeader.has(field)) triggered = true;
      continue;
    }
    if (comparisonKey(field, first[field as keyof typeof first]) !== comparisonKey(field, decision.value)) {
      merged[field] = decision.value;
      correctedFields.push(field);
    }
    if (!unanime && settledHeader.has(field)) {
      const key = comparisonKey(field, decision.value);
      desaccords.push(pointDesaccord({ field, ligne: null, vals, lectures: numeros, retenues: vals.map(v => comparisonKey(field, v) === key), pese: false, enjeu,
        message: `${labels[field]} : une lecture diffère des autres (${vals.map(v => montrer(field, v)).join(' / ')}).` }));
    }
  }
  // This free-form editorial suggestion is not source transcription or a financial classification.
  merged.subcategory = majority(readings.map(reading => reading.subcategory), 'subcategory')?.value ?? '';
  merged.documentTypeLu = merged.documentType;

  // Bloc TVA : comparé trié par taux, en centimes. Un désaccord est un point, jamais une lecture payante (P5).
  const vatKey = (r: InvoiceScanResult) => JSON.stringify([...r.vat].map(v => [v.code, v.rate, toCents(v.base), toCents(v.amount)]).sort((a, b) => ((a[1] as number ?? -1) - (b[1] as number ?? -1)) || String(a[0]).localeCompare(String(b[0]))));
  const vatKeys = readings.map(vatKey);
  if (!vatKeys.every(k => k === vatKeys[0])) {
    const vatDecision = majority(vatKeys, 'vat');
    const texte = (r: InvoiceScanResult) => r.vat.map(v => `${v.code || (v.rate !== null ? `${(v.rate * 100).toFixed(1)}%` : '?')} base ${montrer('amountTTC', v.base)} TVA ${montrer('amountTTC', v.amount)}`).join(' ; ') || 'absent';
    const vals = readings.map(texte);
    desaccords.push(pointDesaccord({ field: 'vat', ligne: null, vals, lectures: numeros, retenues: vals.map((_, i) => vatDecision ? vatKeys[i] === vatDecision.value : i === 0), pese: !vatDecision, enjeu: 'info',
      message: `${labels.vat} : lectures divergentes (${vals.join(' / ')}), vérifier le justificatif.` }));
    if (!vatDecision) findings.push(`${labels.vat} : lectures divergentes (${vals.join(' / ')}), vérifier le justificatif.`);
  }

  // 2. Lignes : rapprochement partiel, jamais par la seule position
  const pairing = new Map<string, Pairing>();
  const pair = (i: number, j: number) => { const k = `${i}:${j}`; if (!pairing.has(k)) pairing.set(k, alignLines(readings[i].items, readings[j].items)); return pairing.get(k)!; };
  const n = readings.length;
  let baseIndex = 0;
  const complete01 = complete(pair(0, 1)), complete02 = n === 3 && complete(pair(0, 2)), complete12 = n === 3 && complete(pair(1, 2));
  if (!complete01 && !complete02 && complete12) baseIndex = 1;
  if (baseIndex !== 0) correctedFields.push('items');
  const base = readings[baseIndex], baseItems = base.items;
  merged.items = baseItems.map(item => ({ ...item }));
  merged.vat = base.vat; merged.linesLost = base.linesLost; merged.printedLineCount = base.printedLineCount; merged.rejets = base.rejets;
  const towards = readings.flatMap((_, k) => (k === baseIndex ? [] : [{ k, p: baseIndex < k ? pair(baseIndex, k) : invert(pair(k, baseIndex), k, baseIndex) }]));
  function invert(p: Pairing, _k: number, _b: number): Pairing {
    // `p` apparie les lignes de la lecture k (en base) à celles de la lecture de base : on le retourne pour partir de la base.
    const match = new Map<number, number>();
    p.match.forEach((bi, ki) => match.set(bi, ki));
    return { match, orphansBase: p.orphansOther, orphansOther: p.orphansBase };
  }
  // Lignes sans vis-à-vis : sans majorité sur l'ensemble des lignes elles pèsent ; la lecture minoritaire seule, non (N3).
  const agree = (i: number, j: number) => { const p = pair(i, j); return complete(p) && [...p.match].every(([a, b]) => sameFive(readings[i].items[a], readings[j].items[b])); };
  const sansMajorite = n === 2 ? !complete01 : !(agree(0, 1) || agree(0, 2) || agree(1, 2));
  const orphelines: Array<{ lecture: number; ligne: number; item: Item }> = [];
  for (const { k, p } of towards) {
    p.orphansBase.forEach(bi => orphelines.push({ lecture: baseIndex + 1, ligne: bi + 1, item: baseItems[bi] }));
    p.orphansOther.forEach(oi => orphelines.push({ lecture: k + 1, ligne: oi + 1, item: readings[k].items[oi] }));
  }
  const uniques = orphelines.filter((o, i, all) => all.findIndex(x => x.lecture === o.lecture && x.ligne === o.ligne) === i);
  if (uniques.length) {
    if (sansMajorite) {
      const message = 'Les lignes ne peuvent pas être rapprochées avec certitude : vérifier les désignations, articles et conditionnements.';
      findings.push(message); triggered = true;
      desaccords.push({ ...makePoint('lignes-non-rapprochees', 'ecart', 'items', null, { regle: 'les lignes des lectures se rapprochent', message, unite: 'lignes', enjeu: 'argent', origine: 'lecture', lu: uniques.length, lignes: uniques.map(o => o.ligne), champs: ['items'] }),
        source: 'désaccord', pese: true, valeurs: uniques.map(o => ({ lecture: o.lecture, ligne: o.ligne, valeur: lineSummary(o.item).slice(0, 120), retenue: false })) });
    } else {
      // La lecture minoritaire (les deux autres s'accordent sur l'ensemble des lignes) : un point qui ne pèse pas, avec ses lignes et celles qu'elle n'a pas.
      for (const { k, p } of towards) {
        if (complete(p)) continue;
        const siennes = p.orphansOther.map(oi => ({ lecture: k + 1, ligne: oi + 1, item: readings[k].items[oi], retenue: false }));
        const retenues = p.orphansBase.map(bi => ({ lecture: baseIndex + 1, ligne: bi + 1, item: baseItems[bi], retenue: true }));
        desaccords.push({ ...makePoint('lectures-divergentes', 'ecart', 'items', null, { regle: 'les lectures indépendantes lisent les mêmes lignes', unite: 'texte', enjeu: 'argent', origine: 'lecture', champs: ['items'], lignes: siennes.map(o => o.ligne),
          message: `La lecture ${k + 1} ne s’accorde pas avec les deux autres sur ${siennes.length + retenues.length} ligne(s).` }),
          cle: `lectures-divergentes:-:items-L${k + 1}`, source: 'désaccord', pese: false, valeurs: [...siennes, ...retenues].map(o => ({ lecture: o.lecture, ligne: o.ligne, valeur: lineSummary(o.item).slice(0, 120), retenue: o.retenue })) });
      }
    }
  }

  // 3. Vote par champ de ligne, sur les lignes jointes
  baseItems.forEach((baseItem, bi) => {
    const aligned = [{ lecture: baseIndex + 1, item: baseItem }, ...towards.flatMap(({ k, p }) => (p.match.has(bi) ? [{ lecture: k + 1, item: readings[k].items[p.match.get(bi)!] }] : []))];
    const out: any = merged.items[bi];
    const ligne = bi + 1;
    if (aligned.length >= 2) {
      const holders = aligned.filter(c => holdsProduct(c.item));
      let recoupee: (typeof aligned)[number] | undefined;
      for (const field of itemFields) {
        const vals = aligned.map(c => (c.item as any)[field]);
        const decision = majority(vals, field);
        const unanime = vals.every(v => comparisonKey(field, v) === comparisonKey(field, vals[0]));
        if (!unanime && argentItem.has(field)) divergentCells.add(`items.${ligne}.${field}`);
        const enjeu: ScanPoint['enjeu'] = argentItem.has(field) ? 'argent' : 'stock';
        const commun = { field, ligne, vals, lectures: aligned.map(c => c.lecture), enjeu, bloqueLiaison: liaisonItem.has(field) };
        if (!decision) {
          // P6 : une seule des lectures tient quantité × prix = montant → c'est la valeur retenue de ce triplet.
          const gagnante = argentItem.has(field) && vals.every(v => v !== null) && holders.length === 1 ? holders[0] : undefined;
          if (gagnante) {
            recoupee = gagnante;
            // le triplet de la lecture qui tient le produit ne vaut que pour les cellules SANS majorité : une majorité n'est jamais écrasée (relecture l2, point 3)
            for (const f of ['quantity', 'price', 'amountTTC']) if (!majority(aligned.map(c => (c.item as any)[f]), f)) out[f] = (gagnante.item as any)[f];
          }
          const message = `${baseItem.name || baseItem.id} — ${(field === 'amountTTC' ? 'montant de la ligne' : labels[field].toLowerCase())} : lectures divergentes (${vals.map(v => montrer(field, v)).join(' / ')}), vérifier les articles du justificatif.`;
          findings.push(message);
          desaccords.push(pointDesaccord({ ...commun, retenues: aligned.map(c => (gagnante ? c === gagnante : c.lecture === baseIndex + 1)), motifs: aligned.map(c => (gagnante && c === gagnante ? 'recoupée' : undefined)), pese: true, message }));
          if (triggerItemFields.has(field)) triggered = true;
          else if (field === 'name') {
            const [a, ...autres] = vals as string[];
            if (autres.some(b => !sameName(a, b))) triggered = true;
          }
          continue;
        }
        if (comparisonKey(field, (baseItem as any)[field]) !== comparisonKey(field, decision.value)) {
          out[field] = decision.value;
          correctedFields.push(`items.${bi}.${field}`);
        }
        if (!unanime && settledItem.has(field)) {
          const key = comparisonKey(field, decision.value);
          desaccords.push(pointDesaccord({ ...commun, retenues: vals.map(v => comparisonKey(field, v) === key), pese: false,
            message: `${baseItem.name || baseItem.id} — ${(field === 'amountTTC' ? 'montant de la ligne' : labels[field].toLowerCase())} : une lecture diffère des autres.` }));
        }
      }
    }
    // P3 : une ambiguïté déclarée par n'importe quelle lecture est un vrai doute : elle est reprise, pèse et achète la 3e lecture.
    const ambigu = aligned.find(c => c.item.ambiguity);
    if (ambigu) { out.ambiguity = ambigu.item.ambiguity; triggered = true; }
  });
  if (n === 3 && baseIndex === 0 && !complete01 && !complete02 && !complete12) {
    // aucune paire complète : la base reste la première lecture (signalé plus haut)
  }

  // 4. Fusion : contrôles recalculés sur ce qui est retenu
  const normalized = normalizeInvoiceScan(merged);
  // Normalization has already capped each independent reading. A second normalization cannot
  // rediscover omitted source lines, so that incompleteness warning must survive reconciliation.
  const truncationWarnings = readings.flatMap(reading => reading.issues.filter(issue => /^Plus de \d+ lignes/.test(issue)));
  normalized.issues.push(...new Set(truncationWarnings));
  const result = finirResultat(normalized, desaccords, readings, warnings);
  // N1 : un point qui ne pèse pas (désaccord résolu, type déduit) vit dans `points` seulement, ni dans `issues` ni dans `findings`.
  const muets = new Set(result.points.filter(p => !p.pese).map(p => p.message));
  result.issues = normalized.issues.filter(message => !muets.has(message));
  const poids = result.points.filter(p => p.pese).map(p => p.message);
  const uniqueFindings = [...new Set([...findings, ...result.issues, ...poids])].filter(message => !muets.has(message));
  const review: InvoiceVisionReview = {
    status: result.points.some(p => p.pese) ? 'disputed' : correctedFields.length ? 'corrected' : 'checked',
    findings: uniqueFindings.slice(0, 50), readers: n, correctedFields,
  };
  // P5 : la troisième lecture ne part que sur un désaccord entre lectures, ou sur un écart de ligne / de somme dont une valeur en cause diverge.
  // Deux lectures qui lisent les mêmes valeurs ne se départagent pas : le même modèle sur la même image relirait la même chose.
  const controlTriggered = result.points.some(p => (p.code === 'ligne-montant' || p.code === 'somme-ecart') && p.champs.some(c => divergentCells.has(c)));
  return { result: { ...result, review } as any, review, needsCorrection: n === 2 && (triggered || controlTriggered) };
}
