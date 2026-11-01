/**
 * Banc de lecture des factures (voie k1-banc, mission 2026-11-01-banc-lecture ; décisions D233, D234).
 *
 * La question du brasseur (01.11) : « deux lectures en parallèle de 3.5 flash et, si ça diverge, une relecture par 3.8 ? ».
 * Quatre façons de lire, mesurées sur ses 7 vraies factures (H13-reels/, hors Git) :
 *   A  production : 2 lectures 3.8 en parallèle (consignes 1 et 2), 3ᵉ lecture 3.8 (consigne 3) si elles divergent, vote ;
 *   B  une lecture d'abord (H13) : la lecture 1 seule ; un contrôle arithmétique en échec appelle la lecture 2, une divergence la 3 ;
 *      CALCULÉ HORS LIGNE à partir des appels de A (mêmes appels, mêmes consignes), durée = somme séquentielle ;
 *   C  sa proposition : 2 lectures Flash-Lite en parallèle (consignes 1 et 2), puis une lecture 3.8 (consigne 3) si elles divergent ;
 *      la 3ᵉ lecture de A est réutilisée quand elle existe ; sinon un appel 3.8 neuf ;
 *   C′ comme C, et un contrôle arithmétique en échec appelle aussi la 3.8 (hors ligne ; un appel 3.8 neuf n'est fait que
 *      si ni A ni C n'ont de 3ᵉ lecture à lui prêter).
 *
 * Rien ici ne copie une consigne ni un tarif : les consignes viennent de `functions/src/invoiceScanPrompts.ts`, la consigne système
 * et le schéma de `TASKS.scanInvoice`, le rapprochement de `invoiceVisionReview.ts`, les coûts de `geminiCosts.ts`.
 *
 * Deux modes. `--simuler` (défaut) : aucun réseau, aucune clé lue, réponses fabriquées depuis la vérité et quelques fautes
 * fabriquées pour éprouver le jugement. `--payant --budget-chf 4.5 --confirm-paid-ai` : vrais appels Gemini, clé lue par
 * `readLocalKey` (jamais affichée), coût réservé avant chaque appel (sortie au plafond), arrêt net au budget, une ligne de journal
 * par appel, juste après lui. Les sorties (réponses brutes, résultats) portent des données personnelles : H13-reels/banc-k1-*,
 * jamais ailleurs, jamais dans Git. Le journal et le tableau publiable ne contiennent aucune valeur des documents.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --simuler --out <dossier>
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 4.5 --confirm-paid-ai
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TASKS } from '../functions/src/prompts';
import { SCAN_MAX_OUTPUT, SCAN_MODEL, normalizeInvoiceScan, validateInvoiceFile, type InvoiceFile } from '../functions/src/invoiceScanCore';
import { GEMINI_LITE_MODEL, assertGeminiModel } from '../functions/src/models';
import { INVOICE_SCAN_PROMPTS } from '../functions/src/invoiceScanPrompts';
import {
  ScanReadCutError, ajouterCoupure, finirUneLecture, phraseCoupure, pointLectureCoupee, reconcileInvoiceVision,
  type CauseCoupure, type InvoiceScanResult
} from '../functions/src/invoiceVisionReview';
import { observedGeminiCostDetails, quoteGeminiCost } from '../functions/src/geminiCosts';
// @ts-ignore — module JavaScript sans déclarations
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans déclarations
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------------------------------------------------
export const STRONG_MODEL: string = SCAN_MODEL;
export const LITE_MODEL: string = GEMINI_LITE_MODEL;
/** Accord du brasseur (D234) : 5 CHF ; le banc en garde 0,5 de marge (coût réel relu après coup, tarif provisionné à 1,25 CHF/USD). */
export const BUDGET_CAP_CHF = 4.5;
/** Entrée au pire pour la réserve : ~2 000 jetons observés (image HAUTE résolution + consignes) au banc d'octobre, ×3 de marge. */
export const RESERVE_INPUT_TOKENS = 6000;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MISSION_DIR = path.join(ROOT, 'work/missions/2026-11-01-banc-lecture');
export const MISSION_JOURNAL = path.join(MISSION_DIR, 'journal-gemini.md');
export const REELS_DIR = path.join(ROOT, 'work/finalisation-tickets-2026-10-08/H13-reels');
export const CAS_FILES = ['cas.json', 'cas-2.json', 'cas-3.json'].map(name => path.join(REELS_DIR, name));
/** Points d'origine `controle` qui pèsent et qui disent « l'arithmétique de cette lecture ne tient pas » (B et C′). Jamais la date absente. */
export const ARITH_CODES: ReadonlySet<string> = new Set(['ligne-montant', 'somme-ecart', 'tva-incoherente', 'ht-tva-ttc', 'total-absent']);

export type VariantId = 'A' | 'B' | 'C' | 'Cp';
export const VARIANTS: readonly VariantId[] = ['A', 'B', 'C', 'Cp'];
export const VARIANT_LABEL: Record<VariantId, string> = { A: 'A production', B: 'B une lecture d’abord', C: 'C Flash-Lite ×2 puis 3.8', Cp: 'C′ C gardée par les contrôles' };

export interface BenchCase { id: string; file: string; mimeType: string; expected: Record<string, any> }
export interface BenchOptions { mode: 'simuler' | 'payant'; repeat: number; out?: string; budgetChf?: number; docs?: string[]; faults: boolean }
export class BudgetStop extends Error { constructor(message: string) { super(message); this.name = 'BudgetStop'; } }

export function loadCases(files: string[] = CAS_FILES): BenchCase[] {
  return files.flatMap(file => {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return (Array.isArray(parsed) ? parsed : parsed.cases) as BenchCase[];
  });
}

export function parseArgs(argv: string[]): BenchOptions {
  const args = argv.filter(arg => arg !== '--');
  const value = (flag: string) => { const at = args.indexOf(flag); return at >= 0 ? args[at + 1] : undefined; };
  const payant = args.includes('--payant'), simuler = args.includes('--simuler');
  if (payant && simuler) throw new Error('--payant et --simuler s’excluent.');
  const repeat = value('--repeat') === undefined ? 3 : Number(value('--repeat'));
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10) throw new Error('--repeat attend un entier de 1 à 10.');
  let budgetChf: number | undefined;
  if (payant) {
    budgetChf = Number(value('--budget-chf'));
    if (!(budgetChf > 0 && budgetChf <= BUDGET_CAP_CHF)) throw new Error(`Le mode --payant exige --budget-chf <= ${BUDGET_CAP_CHF} (accord D234 : 5 CHF, marge comprise). Aucun appel.`);
  }
  return { mode: payant ? 'payant' : 'simuler', repeat, out: value('--out'), budgetChf, docs: value('--docs')?.split(',').map(item => item.trim()).filter(Boolean), faults: !args.includes('--sans-fautes') };
}

// ---------------------------------------------------------------------------------------------------------------------
// Corps de requête et lecture d'une réponse : la même chose que scanInvoiceSafely (functions/src/ai.ts)
// ---------------------------------------------------------------------------------------------------------------------
/** Le corps de `scanInvoiceSafely` (même clés, même ordre) pour une consigne de lecture. Le test le compare à celui de la production. */
export function buildReadBody(file: InvoiceFile, prompt: string, maxOutputTokens: number = SCAN_MAX_OUTPUT): Record<string, unknown> {
  return {
    systemInstruction: { parts: [{ text: TASKS.scanInvoice.system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: file }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: TASKS.scanInvoice.schema, temperature: 0, maxOutputTokens,
      mediaResolution: 'MEDIA_RESOLUTION_HIGH', thinkingConfig: { thinkingLevel: 'LOW' } }
  };
}

/** Même lecture qu'en production : coupée (finishReason ≠ STOP) → ScanReadCutError ; vide ou hors forme → erreur. */
export function parseReadResponse(response: any): any {
  const candidate = response?.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new ScanReadCutError(candidate?.finishReason ?? null);
  const raw = candidate.content?.parts?.filter((part: any) => part.thought !== true && typeof part.text === 'string').map((part: any) => part.text).join('');
  if (!raw || raw.length > 45000) throw new Error('Lecture non exploitable.');
  const decoded = JSON.parse(raw);
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded) || !Array.isArray(decoded.items)) throw new Error('Lecture non exploitable.');
  return decoded;
}

export const causeOf = (reason: any): CauseCoupure | null =>
  reason instanceof ScanReadCutError ? 'sortie' : reason?.name === 'AbortError' || reason?.name === 'TimeoutError' ? 'delai' : null;

export interface ReadMeta { id: string; doc: string; tirage: number; variant: string; lecture: 1 | 2 | 3; model: string }
export interface Reading {
  meta: ReadMeta; ok: boolean; ms: number; normalized?: InvoiceScanResult; cause: CauseCoupure | null; error?: string;
  finishReason: string | null; inputTokens: number | null; outputTokens: number | null; costMicroChf: number | null; state: string;
}

const tokensOf = (response: any) => {
  const usage = response?.usageMetadata ?? {};
  const n = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
  const candidates = n(usage.candidatesTokenCount), thoughts = n(usage.thoughtsTokenCount);
  return { input: n(usage.promptTokenCount), output: candidates === null ? null : candidates + (thoughts ?? 0) };
};

export function readingFromResponse(meta: ReadMeta, response: any, ms: number, costMicroChf: number | null): Reading {
  const finishReason: string | null = response?.candidates?.[0]?.finishReason ?? null, tokens = tokensOf(response);
  const base = { meta, ms, finishReason, inputTokens: tokens.input, outputTokens: tokens.output, costMicroChf };
  try {
    return { ...base, ok: true, normalized: normalizeInvoiceScan(parseReadResponse(response)), cause: null, state: 'STOP' };
  } catch (error: any) {
    return { ...base, ok: false, cause: causeOf(error), error: String(error?.message ?? error).slice(0, 120), state: finishReason && finishReason !== 'STOP' ? `coupée (${finishReason})` : 'illisible' };
  }
}
export function readingFromError(meta: ReadMeta, error: any, ms: number, costMicroChf: number | null): Reading {
  const status = typeof error?.httpStatus === 'number' ? `HTTP ${error.httpStatus}` : causeOf(error) === 'delai' ? 'délai' : 'erreur';
  return { meta, ok: false, ms, cause: causeOf(error), error: String(error?.message ?? error).slice(0, 120), finishReason: null,
    inputTokens: null, outputTokens: null, costMicroChf, state: status };
}

// ---------------------------------------------------------------------------------------------------------------------
// Les parcours (purs : aucun réseau). Mêmes appels que la production pour A ; B, C et C′ s'en déduisent.
// ---------------------------------------------------------------------------------------------------------------------
export interface Final { result: any | null; failure?: string; used: Reading[]; ms: number; costMicroChf: number; costUnknown: number }

export const hasArithmeticFailure = (points: Array<{ code: string; origine?: string; pese?: boolean }> | undefined) =>
  (points ?? []).some(point => point.origine === 'controle' && point.pese === true && ARITH_CODES.has(point.code));

/** La 3ᵉ lecture est-elle appelée par la réconciliation de ces deux lectures ? (A, et C avant sa 3.8) */
export function needsThird(r1: Reading, r2: Reading): boolean {
  return !!(r1.normalized && r2.normalized) && reconcileInvoiceVision([r1.normalized, r2.normalized]).needsCorrection;
}
/** C′ : les deux lectures concordent mais l'arithmétique du résultat réconcilié ne tient pas. */
export function arithmeticFailsOnTwo(r1: Reading, r2: Reading): boolean {
  return !!(r1.normalized && r2.normalized) && hasArithmeticFailure(reconcileInvoiceVision([r1.normalized, r2.normalized]).result.points as any);
}

/** Une seule lecture exploitable sur deux : « unavailable », comme `scanInvoiceSafely`. */
function singleOfTwo(good: Reading, failed: Reading | undefined) {
  const why = failed?.cause ?? null;
  const finding = why ? phraseCoupure(why) : 'La double lecture n’a pas abouti. Vérifie les informations et les montants sur le justificatif.';
  const single = finirUneLecture(good.normalized!);
  return { ...single, review: { status: 'unavailable', readers: 1, correctedFields: [] as string[], findings: [finding] },
    ...(why ? { points: [...single.points, pointLectureCoupee(why, finding)] } : {}), issues: [...single.issues, finding] };
}

function finish(result: any, used: Reading[], parallel: boolean, failure?: string): Final {
  const known = used.filter(read => read.costMicroChf !== null);
  const ms = !used.length ? 0 : parallel ? Math.max(...used.filter(read => read.meta.lecture !== 3).map(read => read.ms), 0) + used.filter(read => read.meta.lecture === 3).reduce((sum, read) => sum + read.ms, 0)
    : used.reduce((sum, read) => sum + read.ms, 0);
  return { result, ...(failure ? { failure } : {}), used, ms, costMicroChf: known.reduce((sum, read) => sum + (read.costMicroChf ?? 0), 0), costUnknown: used.length - known.length };
}

/** Deux lectures en parallèle puis, si elles divergent, la 3ᵉ : le code de `scanInvoiceSafely` (ai.ts) sur des lectures déjà faites. */
export function finalOfTwo(r1: Reading, r2: Reading, third?: Reading, force = false): Final {
  const both = [r1, r2];
  const good = both.filter(read => read.normalized);
  if (!good.length) return finish(null, both, true, 'aucune lecture exploitable (production : erreur « Lecture indisponible »)');
  if (good.length === 1) return finish(singleOfTwo(good[0], both.find(read => !read.normalized)), both, true);
  let reconciled = reconcileInvoiceVision([r1.normalized!, r2.normalized!]);
  const used = [...both];
  if (reconciled.needsCorrection || (force && third)) {
    if (third) used.push(third);
    if (third?.normalized) reconciled = reconcileInvoiceVision([r1.normalized!, r2.normalized!, third.normalized]);
    else if (reconciled.needsCorrection) ajouterCoupure(reconciled.result as any, third?.cause ?? 'delai-saute', phraseCoupure('delai-saute'));
  }
  return finish({ ...reconciled.result, review: reconciled.review, issues: [...new Set([...reconciled.result.issues, ...reconciled.review.findings])] }, used, true);
}

/** B : la lecture 1 seule ; un contrôle arithmétique en échec appelle la lecture 2, une divergence la 3. Durée = somme séquentielle. */
export function finalOfB(a1: Reading, a2: Reading, a3?: Reading): Final {
  if (a1.normalized) {
    const single = finirUneLecture(a1.normalized);
    if (!hasArithmeticFailure(single.points as any)) {
      const weighing = single.points.filter(point => point.pese);
      const result = { ...single, review: { status: weighing.length ? 'disputed' : 'checked', readers: 1, correctedFields: [] as string[], findings: [...new Set(weighing.map(point => point.message))].slice(0, 50) }, issues: single.issues };
      return finish(result, [a1], false);
    }
  }
  const two = finalOfTwo(a1, a2, a3);
  return finish(two.result, two.used, false, two.failure);
}

/** C′ : comme C, et l'arithmétique en échec appelle aussi la 3.8 (vote à trois). */
export const finalOfCprime = (l1: Reading, l2: Reading, third?: Reading): Final =>
  finalOfTwo(l1, l2, third, arithmeticFailsOnTwo(l1, l2));

// ---------------------------------------------------------------------------------------------------------------------
// Budget : réservé AVANT chaque appel, au pire (sortie au plafond) ; coût réel relu après.
// ---------------------------------------------------------------------------------------------------------------------
/** Coût au pire d'un appel de ce modèle : les tarifs viennent de geminiCosts.ts (aucune copie). */
export function reservationMicro(model: string): number {
  const quote = quoteGeminiCost(model, { generationConfig: { maxOutputTokens: SCAN_MAX_OUTPUT } });
  const worst = observedGeminiCostDetails(quote, { usageMetadata: { promptTokenCount: RESERVE_INPUT_TOKENS, candidatesTokenCount: SCAN_MAX_OUTPUT, thoughtsTokenCount: 0, totalTokenCount: RESERVE_INPUT_TOKENS + SCAN_MAX_OUTPUT } });
  if (!worst) throw new Error('Réserve indisponible : tarif inconnu.');
  return worst.chargedMicroChf;
}
export class Budget {
  reserved = 0;
  constructor(readonly limitMicro: number, public spentMicro = 0) {}
  reserve(micro: number): number {
    if (this.spentMicro + this.reserved + micro > this.limitMicro)
      throw new BudgetStop(`Budget atteint : ${(this.spentMicro / 1e6).toFixed(4)} CHF dépensés, ${(this.reserved / 1e6).toFixed(4)} CHF réservés, cet appel en réserverait ${(micro / 1e6).toFixed(4)} sur ${(this.limitMicro / 1e6).toFixed(2)} CHF. Arrêt net.`);
    this.reserved += micro;
    return micro;
  }
  /** Coût inconnu (délai, réseau) : la réserve entière est comptée, jamais zéro. */
  settle(reserved: number, actual: number | null) { this.reserved -= reserved; this.spentMicro += actual ?? reserved; }
}

// ---------------------------------------------------------------------------------------------------------------------
// Journal : une ligne par appel, juste après lui, sans aucune valeur des documents
// ---------------------------------------------------------------------------------------------------------------------
const JOURNAL_HEAD = [
  '# Journal des appels Gemini du banc de lecture (k1-banc, D233 et D234)',
  '',
  'Une ligne par appel, écrite juste après lui. Aucune valeur des documents. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD, marge de sécurité), pas une facture.',
  '',
  '| date | doc | tirage | variante | lecture | modèle | durée | entrée | sortie | coût CHF | cumul CHF | état |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ''
].join('\n');
const chf4 = (micro: number) => (micro / 1e6).toFixed(4);
/** Le journal garde le franc au micro près (6 décimales) : la passe suivante en relit la dépense sans arrondi. */
const chf6 = (micro: number) => (micro / 1e6).toFixed(6);
/** `chargedMicro` : ce que le budget a compté (le coût relu, ou la réserve entière quand la réponse n'a pas dit son coût). */
export function appendJournal(file: string, read: Reading, cumulMicro: number, simulated: boolean, chargedMicro: number | null = read.costMicroChf) {
  mkdirSync(path.dirname(file), { recursive: true });
  if (!existsSync(file)) writeFileSync(file, JOURNAL_HEAD);
  const m = read.meta;
  const unknown = read.costMicroChf === null;
  appendFileSync(file, `| ${new Date().toISOString().slice(0, 19).replace('T', ' ')} | ${m.doc} | ${m.tirage} | ${m.variant === 'Cp' ? 'C′' : m.variant} | ${m.lecture} | ${m.model} | ${read.ms} ms | ${read.inputTokens ?? '?'} | ${read.outputTokens ?? '?'} | ${chf6(chargedMicro ?? 0)} | ${chf6(cumulMicro)} | ${read.state}${unknown ? ' (coût inconnu : réserve comptée)' : ''}${simulated ? ' (SIMULÉ)' : ''} |\n`);
}
/** Dépense déjà journalisée par les passes payantes précédentes (colonne « coût CHF »). */
export function spentInJournal(file: string): number {
  if (!existsSync(file)) return 0;
  let micro = 0;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const cells = line.split('|').map(cell => cell.trim());
    if (cells.length < 13 || !/^\d{4}-\d{2}-\d{2}/.test(cells[1] ?? '') || /SIMULÉ/.test(line)) continue;
    const cost = Number(cells[10]);
    if (Number.isFinite(cost)) micro += Math.round(cost * 1e6);
  }
  return micro;
}

// ---------------------------------------------------------------------------------------------------------------------
// Chemins dans un résultat (fautes fabriquées et jugement) : `date`, `items.3.unit`, `items.*.unit`
// ---------------------------------------------------------------------------------------------------------------------
export function valueAtPath(root: any, route: string): unknown {
  return route.split('.').reduce((node: any, key) => (node === null || node === undefined ? undefined : node[key]), root);
}
function expandPath(root: any, route: string): string[] {
  const keys = route.split('.');
  let paths: string[][] = [[]];
  for (const key of keys) {
    paths = paths.flatMap(prefix => {
      if (key !== '*') return [[...prefix, key]];
      const node = valueAtPath(root, prefix.join('.'));
      return Array.isArray(node) ? node.map((_: unknown, index: number) => [...prefix, String(index)]) : [];
    });
  }
  return paths.map(parts => parts.join('.'));
}
export function setAtPath(root: any, route: string, value: unknown) {
  const keys = route.split('.');
  const last = keys.pop()!;
  const parent = keys.length ? valueAtPath(root, keys.join('.')) : root;
  if (parent && typeof parent === 'object') (parent as any)[last] = value;
}

// ---------------------------------------------------------------------------------------------------------------------
// Simulation : réponses fabriquées depuis la vérité, et quelques fautes fabriquées pour éprouver le jugement
// ---------------------------------------------------------------------------------------------------------------------
export type Family = 'f1' | 'f2' | 'l1' | 'l2' | 's3';
export interface Fault { id: string; doc: string; tirage: number; families: Family[]; edits: Array<{ path: string; value?: unknown; delta?: number }>; cut?: boolean; note: string }
export interface AppliedFault { fault: string; doc: string; tirage: number; family: Family; path: string; wrongValue: unknown }

/** Plan de fautes (tirages 1 et 2 ; le 3ᵉ reste propre : il prouve que le jugement ne crie pas au loup). */
export const FAULT_PLAN: Fault[] = [
  { id: 'date-fausse', doc: 'doc5', tirage: 2, families: ['f1', 'f2'], edits: [{ path: 'date', value: '01.01.2000' }], note: 'les deux 3.8 lisent la même fausse date (aucun contrôle ne la voit : faux vert en A et B)' },
  { id: 'unite-x', doc: 'doc5', tirage: 1, families: ['l1', 'l2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux Flash-Lite inventent l’unité « x » sur toutes les lignes (faux vert en C et C′)' },
  { id: 'lite-divergent', doc: 'doc1', tirage: 1, families: ['l2'], edits: [{ path: 'items.2.quantity', value: 7 }], note: 'une lecture lite diverge : la 3.8 tranche' },
  { id: 'ligne-fausse', doc: 'doc6', tirage: 2, families: ['f1', 'f2'], edits: [{ path: 'items.3.amountTTC', delta: 1 }], note: 'deux 3.8 lisent le même montant de ligne faux : l’arithmétique le voit (alerte juste)' },
  { id: 'ttc-diverge', doc: 'doc3', tirage: 2, families: ['f1'], edits: [{ path: 'amountTTC', delta: 10 }], note: 'une 3.8 lit un autre total : la 3ᵉ lecture tranche' },
  { id: 'coupure-lite', doc: 'doc7', tirage: 2, families: ['l2'], edits: [], cut: true, note: 'une lecture lite est coupée par la limite de sortie' }
];

const hashOf = (text: string) => createHash('sha256').update(text).digest().readUInt32BE(0);

export function truthToRaw(c: BenchCase): any {
  const e = c.expected, first = (value: any, fallback: any) => (Array.isArray(value) ? value[0] ?? fallback : value ?? fallback);
  const items: any[] = Array.isArray(e.items) ? e.items : [];
  return {
    vendor: first(e.vendor, '') || 'Fournisseur simulé', documentType: e.documentType ?? 'invoice', date: e.date ?? '', currency: e.currency ?? 'CHF',
    invoiceNumber: first(e.invoiceNumber, ''), orderNumber: e.orderNumber ?? '', amountHT: e.amountHT ?? null, tvaAmount: e.tvaAmount ?? null,
    amountTTC: e.amountTTC ?? null, tvaRate: e.tvaRate ?? null, paymentEvidence: first(e.paymentEvidence, 'unknown'), proForma: false,
    category: 'divers', subcategory: '', description: '', vat: [], printedLineCount: items.length, linesLost: 0, fieldWarnings: [], rejets: [],
    items: items.map(item => ({ name: item.name, kind: first(item.kind, 'other'), reference: '', variant: '', quantity: item.quantity ?? null, unit: item.unit ?? '',
      price: item.price ?? null, amountTTC: item.amountTTC ?? null, stockCategory: '', evidence: '', ambiguity: '', vatCode: '', alphaPctLu: null }))
  };
}

export const familyOf = (meta: ReadMeta): Family => meta.lecture === 3 ? 's3' : meta.model === LITE_MODEL ? (meta.lecture === 1 ? 'l1' : 'l2') : (meta.lecture === 1 ? 'f1' : 'f2');

/** Réponse fabriquée d'un appel : déterministe (document, tirage, famille) ; une 3ᵉ lecture est la même pour A, C et C′. */
export function simulateResponse(c: BenchCase, meta: ReadMeta, plan: Fault[], log: AppliedFault[]): { json: any; ms: number } {
  const family = familyOf(meta), seed = hashOf(`${c.id}|${meta.tirage}|${family}`);
  const raw = truthToRaw(c);
  let cut = false;
  for (const fault of plan.filter(item => item.doc === c.id && item.tirage === meta.tirage && item.families.includes(family))) {
    if (fault.cut) cut = true;
    for (const edit of fault.edits) {
      for (const route of expandPath(raw, edit.path)) {
        const wrong = edit.delta !== undefined ? Number(((valueAtPath(raw, route) as number ?? 0) + edit.delta).toFixed(2)) : edit.value;
        setAtPath(raw, route, wrong);
        if (!log.some(entry => entry.fault === fault.id && entry.family === family && entry.path === route)) log.push({ fault: fault.id, doc: c.id, tirage: meta.tirage, family, path: route, wrongValue: wrong });
      }
    }
  }
  const text = JSON.stringify(raw), outputTokens = Math.round(text.length / 3.2);
  const inputTokens = 1900 + (seed % 140);
  const strong = meta.model !== LITE_MODEL;
  const json = {
    modelVersion: meta.model,
    candidates: [{ finishReason: cut ? 'MAX_TOKENS' : 'STOP', content: { role: 'model', parts: [{ text: cut ? text.slice(0, Math.floor(text.length / 2)) : text }] } }],
    usageMetadata: { promptTokenCount: inputTokens, candidatesTokenCount: cut ? SCAN_MAX_OUTPUT : outputTokens, thoughtsTokenCount: 0, totalTokenCount: inputTokens + (cut ? SCAN_MAX_OUTPUT : outputTokens) }
  };
  return { json, ms: (strong ? 7000 : 2500) + (seed % 2600) + Math.round(outputTokens * (strong ? 1.1 : 0.4)) };
}

// ---------------------------------------------------------------------------------------------------------------------
// Le banc
// ---------------------------------------------------------------------------------------------------------------------
export type Transport = (model: string, body: Record<string, unknown>, meta: ReadMeta, signal: AbortSignal) => Promise<{ json: any; ms: number }>;
export interface BenchDeps {
  cases?: BenchCase[]; readKey?: () => string | undefined; optIn?: (label: string, command: string) => void;
  transport?: Transport; journalPath?: string; log?: (line: string) => void; readFile?: (c: BenchCase) => InvoiceFile; plan?: Fault[];
}
export interface VariantRecord { ids: string[]; calls: number; ms: number; costMicroChf: number; costUnknown: number; result: any | null; failure?: string; thirdFrom?: 'A' | 'neuf' | 'C' }
export interface DrawRecord { doc: string; tirage: number; readings: Array<Omit<Reading, 'normalized'>>; variants: Record<VariantId, VariantRecord> }

export function realTransport(key: string, fetchImpl: typeof fetch = fetch): Transport {
  return async (model, body, _meta, signal) => {
    assertGeminiModel(model);
    const started = Date.now();
    const response = await fetchImpl(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(redact(`Gemini HTTP ${response.status}`, key)), { httpStatus: response.status });
    return { json, ms: Date.now() - started };
  };
}

function stamp(date = new Date()) { return date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15); }

export async function runBench(options: BenchOptions, deps: BenchDeps = {}): Promise<{ outDir: string; records: DrawRecord[]; stopped?: string; faults: AppliedFault[] }> {
  const simulated = options.mode === 'simuler';
  const log = deps.log ?? (line => console.log(line));
  const cases = (deps.cases ?? loadCases()).filter(c => !options.docs || options.docs.includes(c.id));
  if (!cases.length) throw new Error('Aucun cas à lire.');
  const outDir = path.resolve(options.out ?? path.join(REELS_DIR, `banc-k1-${simulated ? 'sim-' : ''}${stamp()}`));
  mkdirSync(path.join(outDir, 'raw'), { recursive: true });
  const journalPath = deps.journalPath ?? (simulated ? path.join(outDir, 'journal-gemini.md') : MISSION_JOURNAL);

  let transport: Transport;
  let budget: Budget;
  let restoreFetch = () => {};
  const faultLog: AppliedFault[] = [];
  const plan = options.faults ? deps.plan ?? FAULT_PLAN : [];
  if (simulated) {
    // Aucun réseau, aucune clé : le fetch global lui-même est coupé pendant la simulation.
    const realFetch = globalThis.fetch;
    globalThis.fetch = (() => { throw new Error('Réseau interdit en simulation.'); }) as typeof fetch;
    restoreFetch = () => { globalThis.fetch = realFetch; };
    const byId = new Map(cases.map(c => [c.id, c]));
    transport = deps.transport ?? (async (_model, _body, meta) => simulateResponse(byId.get(meta.doc)!, meta, plan, faultLog));
    budget = new Budget(Number.MAX_SAFE_INTEGER);
  } else {
    (deps.optIn ?? ((label: string, command: string) => requirePaidAiTestOptIn({ label, command })))(
      `Banc de lecture des factures (${cases.length} documents × ${options.repeat} tirages, budget ${options.budgetChf} CHF)`,
      'npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 4.5 --confirm-paid-ai');
    const key = (deps.readKey ?? (() => readLocalKey()))();
    if (!key) throw new Error('Aucune clé Gemini locale : ni GEMINI_API_KEY, ni le fichier de clé du poste (lu par readLocalKey). Aucun appel.');
    transport = deps.transport ?? realTransport(key);
    const before = spentInJournal(journalPath);
    budget = new Budget(Math.round((options.budgetChf ?? 0) * 1e6), before);
    log(`Budget ${options.budgetChf} CHF, déjà journalisé ${chf4(before)} CHF.`);
  }

  const reserveByModel = new Map<string, number>();
  const reserveFor = (model: string) => { if (!reserveByModel.has(model)) reserveByModel.set(model, reservationMicro(model)); return reserveByModel.get(model)!; };
  let halt: string | undefined, consecutiveFailures = 0;
  const readFile = deps.readFile ?? ((c: BenchCase): InvoiceFile => {
    const full = path.isAbsolute(c.file) ? c.file : path.join(ROOT, c.file);
    if (simulated && !existsSync(full)) return { mimeType: c.mimeType, data: Buffer.from([255, 216, 255, 217]).toString('base64') };
    return validateInvoiceFile({ mimeType: c.mimeType, data: readFileSync(full).toString('base64') });
  });

  const records: DrawRecord[] = [];
  const meta0 = { mode: options.mode, repeat: options.repeat, startedAt: new Date().toISOString(), models: { strong: STRONG_MODEL, lite: LITE_MODEL }, budgetChf: options.budgetChf ?? null,
    docs: cases.map(c => c.id), casFiles: CAS_FILES.map(file => path.basename(file)), reserve: Object.fromEntries([STRONG_MODEL, LITE_MODEL].map(model => [model, reserveFor(model) / 1e6])), faults: simulated && options.faults };
  const save = (stopped?: string) => {
    writeFileSync(path.join(outDir, 'results.json'), `${JSON.stringify({ meta: { ...meta0, finishedAt: new Date().toISOString(), stopped: stopped ?? null, spentChf: simulated ? null : budget.spentMicro / 1e6 }, records }, null, 1)}\n`);
    if (simulated) writeFileSync(path.join(outDir, 'faults.json'), `${JSON.stringify({ plan, applied: faultLog }, null, 1)}\n`);
  };

  const readings: Reading[] = [];
  const doCall = async (c: BenchCase, file: InvoiceFile, tirage: number, variant: string, lecture: 1 | 2 | 3, model: string): Promise<Reading> => {
    if (halt) throw new BudgetStop(halt);
    const meta: ReadMeta = { id: `${variant}${lecture}`, doc: c.id, tirage, variant, lecture, model };
    const body = buildReadBody(file, INVOICE_SCAN_PROMPTS[lecture - 1]);
    const quote = quoteGeminiCost(model, body);
    const reserved = budget.reserve(reserveFor(model));
    const started = Date.now();
    let read: Reading;
    try {
      const signal = AbortSignal.any([AbortSignal.timeout(100_000), AbortSignal.timeout(45_000)]);
      const answer = await transport(model, quote.body, meta, signal);
      const cost = observedGeminiCostDetails(quote, answer.json)?.chargedMicroChf ?? null;
      read = readingFromResponse(meta, answer.json, answer.ms, cost);
      writeFileSync(path.join(outDir, 'raw', `${c.id}-t${tirage}-${meta.id}.json`), JSON.stringify(answer.json));
    } catch (error: any) {
      // HTTP refusé : rien n'est facturé. Délai ou coupure réseau : la réponse a pu être facturée, la réserve est comptée.
      read = readingFromError(meta, error, Date.now() - started, typeof error?.httpStatus === 'number' ? 0 : null);
    }
    budget.settle(reserved, read.costMicroChf);
    appendJournal(journalPath, read, budget.spentMicro, simulated, read.costMicroChf ?? reserved);
    consecutiveFailures = read.ok ? 0 : consecutiveFailures + 1;
    if (consecutiveFailures >= 3) halt = 'Trois appels en échec d’affilée : arrêt net (un fournisseur qui refuse en boucle ne se mesure pas).';
    readings.push(read);
    return read;
  };
  const parallel = async (jobs: Array<Promise<Reading>>): Promise<Reading[]> => {
    const settled = await Promise.allSettled(jobs);
    const failed = settled.find(item => item.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) throw failed.reason;
    return settled.map(item => (item as PromiseFulfilledResult<Reading>).value);
  };

  let stopped: string | undefined;
  const summary = (final: Final, extra: Partial<VariantRecord> = {}): VariantRecord => ({ ids: final.used.map(read => read.meta.id), calls: final.used.length, ms: final.ms,
    costMicroChf: final.costMicroChf, costUnknown: final.costUnknown, result: final.result, ...(final.failure ? { failure: final.failure } : {}), ...extra });

  try {
  outer: for (let tirage = 1; tirage <= options.repeat; tirage++) {
    for (const c of cases) {
      const file = readFile(c);
      const before = readings.length;
      try {
        // A : exactement la production (deux lectures 3.8 en parallèle, 3ᵉ si elles divergent)
        const [a1, a2] = await parallel([doCall(c, file, tirage, 'A', 1, STRONG_MODEL), doCall(c, file, tirage, 'A', 2, STRONG_MODEL)]);
        const a3 = needsThird(a1, a2) ? await doCall(c, file, tirage, 'A', 3, STRONG_MODEL) : undefined;
        // C : deux lectures lite en parallèle ; la 3.8 de A est prêtée si elle existe, sinon un appel neuf
        const [l1, l2] = await parallel([doCall(c, file, tirage, 'C', 1, LITE_MODEL), doCall(c, file, tirage, 'C', 2, LITE_MODEL)]);
        const cNeeds = needsThird(l1, l2), cpNeeds = !cNeeds && arithmeticFailsOnTwo(l1, l2);
        let cThird: Reading | undefined, cThirdFrom: VariantRecord['thirdFrom'];
        if (cNeeds) { cThird = a3 ?? await doCall(c, file, tirage, 'C', 3, STRONG_MODEL); cThirdFrom = a3 ? 'A' : 'neuf'; }
        let cpThird: Reading | undefined, cpThirdFrom: VariantRecord['thirdFrom'];
        if (cNeeds) { cpThird = cThird; cpThirdFrom = cThirdFrom; }
        else if (cpNeeds) { cpThird = a3 ?? await doCall(c, file, tirage, 'Cp', 3, STRONG_MODEL); cpThirdFrom = a3 ? 'A' : 'neuf'; }
        const variants: Record<VariantId, VariantRecord> = {
          A: summary(finalOfTwo(a1, a2, a3)),
          B: summary(finalOfB(a1, a2, a3)),
          C: summary(finalOfTwo(l1, l2, cThird), cThirdFrom ? { thirdFrom: cThirdFrom } : {}),
          Cp: summary(finalOfCprime(l1, l2, cpThird), cpThirdFrom ? { thirdFrom: cpThirdFrom } : {})
        };
        records.push({ doc: c.id, tirage, readings: readings.slice(before).map(({ normalized: _n, ...rest }) => rest), variants });
        log(`${c.id} tirage ${tirage} : ${VARIANTS.map(v => `${v === 'Cp' ? 'C′' : v} ${variants[v].calls} appel(s) ${Math.round(variants[v].ms / 100) / 10} s`).join(' · ')}`);
        save();
      } catch (error: any) {
        if (!(error instanceof BudgetStop)) throw error;
        stopped = error.message;
        log(`ARRÊT : ${stopped}`);
        break outer;
      }
    }
  }
  } finally { restoreFetch(); }
  save(stopped);
  log(simulated ? `Simulation terminée : ${records.length} parcours dans ${outDir} (aucun réseau).` : `Passe terminée : ${records.length} parcours, ${chf4(budget.spentMicro)} CHF au total journalisé, dossier ${outDir}.`);
  return { outDir, records, stopped, faults: faultLog };
}

/** vite-node ne laisse pas le nom du script dans process.argv : le banc se lance avec --simuler ou --payant, jamais sous vitest. */
const isMain = () => !process.env.VITEST && (process.argv.includes('--simuler') || process.argv.includes('--payant'));
if (isMain()) {
  const options = parseArgs(process.argv.slice(2));
  const out = options.out ?? (options.mode === 'simuler' ? path.join(tmpdir(), `k1-sim-${stamp()}`) : undefined);
  runBench({ ...options, out }).then(() => process.exit(0), error => { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
}
