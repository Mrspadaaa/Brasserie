import { normalizeInvoiceScan, type InvoiceFieldWarning } from './invoiceScanCore.js';

export type InvoiceScanResult = ReturnType<typeof normalizeInvoiceScan>;
export interface InvoiceVisionReview {
  status: 'checked' | 'corrected' | 'disputed';
  findings: string[];
  readers: number;
  correctedFields: string[];
}

type Item = InvoiceScanResult['items'][number];
const headerFields = ['vendor', 'date', 'currency', 'invoiceNumber', 'orderNumber', 'amountHT', 'amountTTC', 'tvaAmount', 'tvaRate', 'category', 'documentType', 'paymentEvidence'] as const;
const itemFields = ['name', 'kind', 'reference', 'variant', 'quantity', 'unit', 'price', 'amountTTC', 'stockCategory'] as const;
const labels: Record<string, string> = {
  vendor: 'Fournisseur', date: 'Date', currency: 'Devise', invoiceNumber: 'Numéro de facture',
  amountHT: 'Total HT', amountTTC: 'Montant TTC', tvaAmount: 'Montant TVA', tvaRate: 'Taux TVA',
  category: 'Catégorie', subcategory: 'Sous-catégorie', name: 'Désignation', kind: 'Nature',
  quantity: 'Quantité', unit: 'Unité', price: 'Prix unitaire', stockCategory: 'Catégorie de stock',
  reference: 'Référence article', variant: 'Taille ou variante', orderNumber: 'Numéro de commande', documentType: 'Type de document', paymentEvidence: 'Paiement',
};

function canonicalText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
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

function structure(items: Item[]): string | undefined {
  const names = items.map(item => canonicalText(item.name));
  // Identical labels do not identify a particular line/pack/lot. Never join them by position.
  if (names.some(name => !name) || new Set(names).size !== names.length) return undefined;
  return JSON.stringify([...names].sort());
}

function identicalOrderedLines(a: Item[], b: Item[]): boolean {
  return a.length === b.length && a.every((line, index) => itemFields.every(field => comparisonKey(field, line[field]) === comparisonKey(field, b[index][field])));
}

/** Independent transcriptions only: no arithmetic inference, fuzzy OCR matching, or single-reader fill-in.
 * The third reading may settle a dispute by a two-reader majority. Unsettled fields keep the first
 * reading and remain visible as disputed. No input object is mutated.
 */
export function reconcileInvoiceVision(readings: InvoiceScanResult[]): {
  result: InvoiceScanResult & { review: InvoiceVisionReview };
  review: InvoiceVisionReview;
  needsCorrection: boolean;
} {
  if (readings.length < 2 || readings.length > 3) throw new Error('La vérification attend deux ou trois lectures indépendantes.');
  const first = readings[0];
  const merged = { ...first, items: first.items.map(item => ({ ...item })) };
  merged.fieldWarnings = readings.flatMap(reading => reading.fieldWarnings ?? []).filter((warning, index, all) => all.findIndex(other => other.field === warning.field && other.message === warning.message) === index);
  const findings: string[] = [];
  const correctedFields: string[] = [];

  for (const field of headerFields) {
    const decision = majority(readings.map(reading => reading[field]), field);
    if (!decision) {
      findings.push(`${labels[field]} : lectures divergentes, vérifier le justificatif.`);
      if (field !== 'orderNumber') merged.fieldWarnings.push({ field, message: 'Les lectures ne concordent pas. Vérifie cette valeur sur le document.' });
    } else if (comparisonKey(field, first[field]) !== comparisonKey(field, decision.value)) {
      // The heterogeneous fields all retain their original normalized primitive type.
      (merged as Record<string, unknown>)[field] = decision.value;
      correctedFields.push(field);
    }
  }
  // This free-form editorial suggestion is not source transcription or a financial classification.
  // Keep a shared suggestion, otherwise leave the choice blank without buying an OCR arbitration.
  merged.subcategory = majority(readings.map(reading => reading.subcategory), 'subcategory')?.value ?? '';

  const signatures = readings.map(reading => structure(reading.items));
  const agreedSignature = signatures.find(signature => signature !== undefined && signatures.filter(value => value === signature).length >= 2);
  if (agreedSignature !== undefined) {
    const supportingIndexes = signatures.flatMap((signature, index) => signature === agreedSignature ? [index] : []);
    const baseIndex = supportingIndexes.includes(0) ? 0 : supportingIndexes[0];
    const base = readings[baseIndex];
    if (baseIndex !== 0) correctedFields.push('items');
    merged.items = base.items.map((baseItem, index) => {
      const name = canonicalText(baseItem.name);
      // Unique names can match across reordered scans. A differently named item cannot cast a vote.
      const aligned = readings.flatMap(reading => {
        const matches = reading.items.filter(item => canonicalText(item.name) === name);
        return matches.length === 1 ? [matches[0]] : [];
      });
      const item = { ...baseItem };
      for (const field of itemFields) {
        const decision = majority(aligned.map(candidate => candidate[field]), field);
        if (!decision) {
          findings.push(`${baseItem.name} — ${labels[field].toLowerCase()} : lectures divergentes, vérifier le justificatif.`);
        } else if (comparisonKey(field, baseItem[field]) !== comparisonKey(field, decision.value)) {
          (item as Record<string, unknown>)[field] = decision.value;
          correctedFields.push(`items.${index}.${field}`);
        }
      }
      const ambiguity = aligned.find(candidate => candidate.ambiguity)?.ambiguity;
      if (ambiguity) findings.push(`${baseItem.name} : ${ambiguity}`);
      return item;
    });
    if (readings.length === 2 && signatures[0] !== signatures[1]) findings.push('Le détail des lignes diffère entre les lectures : vérifier les articles et conditionnements.');
  } else {
    // Repeated/absent names are safe only when two complete, ordered readings agree on every field.
    const matchingPair = readings.flatMap((reading, index) => readings.slice(index + 1).flatMap(other => identicalOrderedLines(reading.items, other.items) ? [index] : []))[0];
    if (matchingPair === undefined) {
      findings.push('Les lignes ne peuvent pas être rapprochées avec certitude : vérifier les désignations, articles et conditionnements.');
    } else if (!identicalOrderedLines(first.items, readings[matchingPair].items)) {
      merged.items = readings[matchingPair].items.map(item => ({ ...item }));
      correctedFields.push('items');
    }
    for (const reading of readings) for (const item of reading.items) {
      if (item.ambiguity) findings.push(`${item.name || item.id} : ${item.ambiguity}`);
    }
  }

  const readingsNeedCorrection = findings.length > 0;
  // Recompute arithmetic warnings from the selected transcription, without fixing the source totals.
  const normalized = normalizeInvoiceScan(merged);
  // Normalization has already capped each independent reading. A second normalization cannot
  // rediscover omitted source lines, so that incompleteness warning must survive reconciliation.
  const truncationWarnings = readings.flatMap(reading => reading.issues.filter(issue => issue.startsWith('Plus de 35 lignes')));
  normalized.issues.push(...new Set(truncationWarnings));
  findings.push(...normalized.issues);
  findings.push(...normalized.fieldWarnings.map((warning: InvoiceFieldWarning) => `${labels[warning.field]} : ${warning.message}`));
  const uniqueFindings = [...new Set(findings)];
  const review: InvoiceVisionReview = {
    status: uniqueFindings.length ? 'disputed' : correctedFields.length ? 'corrected' : 'checked',
    findings: uniqueFindings.slice(0, 50), readers: readings.length, correctedFields,
  };
  // A third OCR pass cannot resolve an identically read foreign currency or an absent optional
  // amount. Spend it only on reader disagreement, explicit uncertainty, or contradictory numbers.
  const arithmeticNeedsCorrection = normalized.issues.some(issue => /totaux HT \+ TVA|somme des lignes|Taux TVA incohérent/.test(issue));
  return { result: { ...normalized, review }, review, needsCorrection: readings.length === 2 && (readingsNeedCorrection || arithmeticNeedsCorrection) };
}
