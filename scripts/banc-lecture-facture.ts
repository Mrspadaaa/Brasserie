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
 * Voie k2-reglages (01.11) : « 3.5 Flash-Lite, il y a pas moyen de le faire mieux fonctionner ? ». Cinq variantes de plus :
 *   C★   comme C, mais quand la 3.8 est appelée, son résultat TRANCHE SEUL (plus de vote à trois) ;
 *   C★′  comme C′ (la 3.8 aussi quand l'arithmétique échoue), puis elle tranche seule ;
 *   Lm   C★′ avec les deux lectures Flash-Lite en réflexion `medium`, plafond de sortie relevé à 8 192 ;
 *   Lh   comme Lm en `high` ;
 *   Lp   C★′, Flash-Lite `low`, avec la consigne propre à Flash-Lite (`banc-lecture-consignes-lite.ts`, jamais envoyée à A).
 * Et N : une normalisation de code (devise « Fr. », « SFr. », « CHF. » → « CHF ») appliquée à chaque lecture, pour toutes les
 * variantes (suffixe « +N »), sans appel de plus. `--reprendre <sortie k1>` prête les appels déjà payés (même document, même
 * tirage, même réglage) : ni payés une deuxième fois, ni journalisés.
 *
 * Trois modes. `--simuler` (défaut) : aucun réseau, aucune clé lue, réponses fabriquées depuis la vérité et quelques fautes
 * fabriquées pour éprouver le jugement. `--hors-ligne --reprendre <dossier>` : aucun réseau, aucune clé, les variantes se
 * recalculent depuis des appels déjà payés (une lecture absente est une erreur, jamais un appel). `--payant --budget-chf 3.5
 * --confirm-paid-ai` : vrais appels Gemini, clé lue par `readLocalKey` (jamais affichée), coût réservé avant chaque appel (sortie
 * au plafond de CET appel), arrêt net au budget, une ligne de journal par appel, juste après lui. Les sorties (réponses brutes,
 * résultats) portent des données personnelles : H13-reels/banc-k*-*, jamais ailleurs, jamais dans Git. Le journal et le tableau
 * publiable ne contiennent aucune valeur des documents.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --simuler --variantes Cs,Csp,Lm,Lh,Lp --out <dossier>
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --hors-ligne --reprendre <sortie k1> --variantes A,B,C,Cp,Cs,Csp --normaliser
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 3.5 --reprendre <sortie k1> --variantes Lm,Lh,Lp --normaliser --confirm-paid-ai
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
import { liteConsigne } from './banc-lecture-consignes-lite';
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

export type VariantId = 'A' | 'B' | 'C' | 'Cp' | 'Cs' | 'Csv' | 'Csp' | 'Lm' | 'Lh' | 'Lp';
/** Toutes les variantes connues, dans l'ordre des tableaux. */
export const VARIANTS: readonly VariantId[] = ['A', 'B', 'C', 'Cp', 'Cs', 'Csv', 'Csp', 'Lm', 'Lh', 'Lp'];
/** Les quatre de k1 : ce que le banc lit quand `--variantes` n'est pas donné. */
export const K1_VARIANTS: readonly VariantId[] = ['A', 'B', 'C', 'Cp'];
export const VARIANT_LABEL: Record<VariantId, string> = {
  A: 'A production', B: 'B une lecture d’abord', C: 'C Flash-Lite ×2 puis 3.8', Cp: 'C′ C gardée par les contrôles',
  Cs: 'C★ la 3.8 tranche seule', Csv: 'C★v valeurs de la 3.8, statut du vote', Csp: 'C★′ C★ gardée par les contrôles', Lm: 'Lm C★′ réflexion medium', Lh: 'Lh C★′ réflexion high', Lp: 'Lp C★′ consigne Flash-Lite'
};
/** Suffixe d'une variante lue avec la normalisation de code (N) : `Cs+N`. */
export const N_SUFFIX = '+N';
export const isNId = (id: string) => id.endsWith(N_SUFFIX);
export const baseOfId = (id: string): VariantId => (isNId(id) ? id.slice(0, -N_SUFFIX.length) : id) as VariantId;
export const variantLabel = (id: string) => `${VARIANT_LABEL[baseOfId(id)] ?? id}${isNId(id) ? ' + N' : ''}`;
/** Ordre d'affichage : l'ordre de VARIANTS, chaque variante suivie de sa version N. */
export function orderVariants(ids: Iterable<string>): string[] {
  const rank = (id: string) => VARIANTS.indexOf(baseOfId(id)) * 2 + (isNId(id) ? 1 : 0);
  return [...ids].sort((a, b) => rank(a) - rank(b));
}

/** Un groupe = une façon d'appeler : les variantes d'un même groupe partagent leurs lectures. */
export type Group = 'A' | 'C' | 'Lm' | 'Lh' | 'Lp';
export const GROUP_OF: Record<VariantId, Group> = { A: 'A', B: 'A', C: 'C', Cp: 'C', Cs: 'C', Csv: 'C', Csp: 'C', Lm: 'Lm', Lh: 'Lh', Lp: 'Lp' };
/** Plafond de sortie relevé de Lm et Lh seuls : la réflexion compte dans `maxOutputTokens`, `high` peut couper à 5 100. */
export const LITE_RAISED_OUTPUT = 8192;
const TIMEOUT_MS = 45_000, TIMEOUT_THINKING_MS = 90_000;
export type ThinkingLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export interface CallSpec { model: string; prompt: string; thinking: ThinkingLevel; maxOut: number; timeoutMs: number }
/** Le réglage d'un appel. La 3ᵉ lecture est toujours la 3.8 de production (consigne 3), quel que soit le groupe qui la demande. */
export function callSpec(group: string, lecture: 1 | 2 | 3): CallSpec {
  if (lecture === 3) return { model: STRONG_MODEL, prompt: INVOICE_SCAN_PROMPTS[2], thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
  const prompt = INVOICE_SCAN_PROMPTS[lecture - 1];
  switch (group) {
    case 'A': return { model: STRONG_MODEL, prompt, thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
    case 'C': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
    case 'Lm': return { model: LITE_MODEL, prompt, thinking: 'MEDIUM', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS };
    case 'Lh': return { model: LITE_MODEL, prompt, thinking: 'HIGH', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS };
    case 'Lp': return { model: LITE_MODEL, prompt: liteConsigne(lecture), thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
    default: throw new Error(`Groupe inconnu : ${group}`);
  }
}

export interface BenchCase { id: string; file: string; mimeType: string; expected: Record<string, any> }
export interface BenchOptions {
  mode: 'simuler' | 'payant' | 'hors-ligne'; repeat: number; out?: string; budgetChf?: number; docs?: string[]; faults: boolean;
  /** Variantes à lire (défaut : A, B, C, C′ comme k1). */
  variantes?: VariantId[];
  /** Dossier d'une sortie précédente dont les appels sont prêtés. */
  reprendre?: string;
  /** Ajoute, à chaque variante, sa version lue avec la normalisation de code (N). */
  normaliser?: boolean;
}
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
  const payant = args.includes('--payant'), simuler = args.includes('--simuler'), horsLigne = args.includes('--hors-ligne');
  if ([payant, simuler, horsLigne].filter(Boolean).length > 1) throw new Error('--payant, --simuler et --hors-ligne s’excluent.');
  const reprendre = value('--reprendre');
  if (horsLigne && !reprendre) throw new Error('--hors-ligne exige --reprendre <dossier d’une sortie du banc> : sans appel, il ne peut que recalculer.');
  const variantes = value('--variantes')?.split(',').map(item => item.trim()).filter(Boolean) as VariantId[] | undefined;
  const unknown = (variantes ?? []).filter(id => !VARIANTS.includes(id));
  if (unknown.length || (variantes && !variantes.length)) throw new Error(`--variantes attend une liste parmi ${VARIANTS.join(', ')} (reçu : ${unknown.join(', ') || 'rien'}).`);
  const repeat = value('--repeat') === undefined ? 3 : Number(value('--repeat'));
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10) throw new Error('--repeat attend un entier de 1 à 10.');
  let budgetChf: number | undefined;
  if (payant) {
    budgetChf = Number(value('--budget-chf'));
    if (!(budgetChf > 0 && budgetChf <= BUDGET_CAP_CHF)) throw new Error(`Le mode --payant exige --budget-chf <= ${BUDGET_CAP_CHF} (accord D234 : 5 CHF, marge comprise). Aucun appel.`);
  }
  return { mode: payant ? 'payant' : horsLigne ? 'hors-ligne' : 'simuler', repeat, out: value('--out'), budgetChf, docs: value('--docs')?.split(',').map(item => item.trim()).filter(Boolean),
    faults: !args.includes('--sans-fautes'), ...(variantes ? { variantes: [...new Set(variantes)] } : {}), ...(reprendre ? { reprendre } : {}), ...(args.includes('--normaliser') ? { normaliser: true } : {}) };
}

// ---------------------------------------------------------------------------------------------------------------------
// Corps de requête et lecture d'une réponse : la même chose que scanInvoiceSafely (functions/src/ai.ts)
// ---------------------------------------------------------------------------------------------------------------------
/** Le corps de `scanInvoiceSafely` (même clés, même ordre) pour une consigne de lecture. Le test le compare à celui de la production. */
export function buildReadBody(file: InvoiceFile, prompt: string, maxOutputTokens: number = SCAN_MAX_OUTPUT, thinkingLevel: ThinkingLevel = 'LOW'): Record<string, unknown> {
  return {
    systemInstruction: { parts: [{ text: TASKS.scanInvoice.system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: file }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: TASKS.scanInvoice.schema, temperature: 0, maxOutputTokens,
      mediaResolution: 'MEDIA_RESOLUTION_HIGH', thinkingConfig: { thinkingLevel } }
  };
}

/**
 * N : la devise comme code ISO. « Fr. », « SFr. », « CHF. » (point, espaces, casse ignorés) deviennent « CHF » ; tout autre texte
 * reste tel quel (une devise étrangère n'est jamais devinée). Dans le banc seulement : la production n'en reçoit rien.
 */
export function isoCurrency(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.replace(/[\s.]/g, '').toUpperCase();
  return key === 'FR' || key === 'SFR' || key === 'CHF' ? 'CHF' : value;
}

/** Même lecture qu'en production : coupée (finishReason ≠ STOP) → ScanReadCutError ; vide ou hors forme → erreur. `codes` : N. */
export function parseReadResponse(response: any, codes = false): any {
  const candidate = response?.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new ScanReadCutError(candidate?.finishReason ?? null);
  const raw = candidate.content?.parts?.filter((part: any) => part.thought !== true && typeof part.text === 'string').map((part: any) => part.text).join('');
  if (!raw || raw.length > 45000) throw new Error('Lecture non exploitable.');
  const decoded = JSON.parse(raw);
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded) || !Array.isArray(decoded.items)) throw new Error('Lecture non exploitable.');
  if (codes) decoded.currency = isoCurrency(decoded.currency);
  return decoded;
}

export const causeOf = (reason: any): CauseCoupure | null =>
  reason instanceof ScanReadCutError ? 'sortie' : reason?.name === 'AbortError' || reason?.name === 'TimeoutError' ? 'delai' : null;

export interface ReadMeta { id: string; doc: string; tirage: number; variant: string; lecture: 1 | 2 | 3; model: string }
export interface Reading {
  meta: ReadMeta; ok: boolean; ms: number; normalized?: InvoiceScanResult; cause: CauseCoupure | null; error?: string;
  finishReason: string | null; inputTokens: number | null; outputTokens: number | null; costMicroChf: number | null; state: string;
  /** La réponse brute, gardée en mémoire pour relire la même lecture avec N ; jamais écrite dans results.json. */
  raw?: any;
  /** Appel prêté par une sortie précédente (`--reprendre`) : ni payé ni journalisé dans cette passe. */
  lent?: boolean;
}

const tokensOf = (response: any) => {
  const usage = response?.usageMetadata ?? {};
  const n = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
  const candidates = n(usage.candidatesTokenCount), thoughts = n(usage.thoughtsTokenCount);
  return { input: n(usage.promptTokenCount), output: candidates === null ? null : candidates + (thoughts ?? 0) };
};

export function readingFromResponse(meta: ReadMeta, response: any, ms: number, costMicroChf: number | null, codes = false): Reading {
  const finishReason: string | null = response?.candidates?.[0]?.finishReason ?? null, tokens = tokensOf(response);
  const base = { meta, ms, finishReason, inputTokens: tokens.input, outputTokens: tokens.output, costMicroChf, raw: response };
  try {
    return { ...base, ok: true, normalized: normalizeInvoiceScan(parseReadResponse(response, codes)), cause: null, state: 'STOP' };
  } catch (error: any) {
    return { ...base, ok: false, cause: causeOf(error), error: String(error?.message ?? error).slice(0, 120), state: finishReason && finishReason !== 'STOP' ? `coupée (${finishReason})` : 'illisible' };
  }
}
export function readingFromError(meta: ReadMeta, error: any, ms: number, costMicroChf: number | null): Reading {
  const status = typeof error?.httpStatus === 'number' ? `HTTP ${error.httpStatus}` : causeOf(error) === 'delai' ? 'délai' : 'erreur';
  return { meta, ok: false, ms, cause: causeOf(error), error: String(error?.message ?? error).slice(0, 120), finishReason: null,
    inputTokens: null, outputTokens: null, costMicroChf, state: status };
}

/** La même lecture relue avec N (devise en code ISO) : même réponse, même durée, même coût. Une lecture sans réponse reste telle quelle. */
export function withCodesNormalized(read: Reading): Reading {
  if (!read.raw) return read;
  return { ...readingFromResponse(read.meta, read.raw, read.ms, read.costMicroChf, true), ...(read.lent ? { lent: true } : {}) };
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

/** Le résultat d'une lecture seule : « disputed » si un point pèse, « checked » sinon (B, et la 3.8 qui tranche seule). */
function singleResult(single: ReturnType<typeof finirUneLecture>, readers = 1): any {
  const weighing = single.points.filter(point => point.pese);
  return { ...single, review: { status: weighing.length ? 'disputed' : 'checked', readers, correctedFields: [] as string[], findings: [...new Set(weighing.map(point => point.message))].slice(0, 50) }, issues: single.issues };
}

/** B : la lecture 1 seule ; un contrôle arithmétique en échec appelle la lecture 2, une divergence la 3. Durée = somme séquentielle. */
export function finalOfB(a1: Reading, a2: Reading, a3?: Reading): Final {
  if (a1.normalized) {
    const single = finirUneLecture(a1.normalized);
    if (!hasArithmeticFailure(single.points as any)) return finish(singleResult(single), [a1], false);
  }
  const two = finalOfTwo(a1, a2, a3);
  return finish(two.result, two.used, false, two.failure);
}

/** C′ : comme C, et l'arithmétique en échec appelle aussi la 3.8 (vote à trois). */
export const finalOfCprime = (l1: Reading, l2: Reading, third?: Reading): Final =>
  finalOfTwo(l1, l2, third, arithmeticFailsOnTwo(l1, l2));

/**
 * C★ : deux lectures Flash-Lite ; quand la 3.8 est appelée (divergence, ou `force` : l'arithmétique échoue), son résultat TRANCHE
 * SEUL, il n'y a plus de vote à trois. Son statut est celui d'une lecture seule (comme B) : « checked » si aucun point ne pèse,
 * « disputed » sinon. Sans 3.8 exploitable (appel refusé, coupé, ou non prêté), le repli est le parcours de C (coupure comptée).
 */
export function finalOfStar(r1: Reading, r2: Reading, third?: Reading, force = false): Final {
  if (r1.normalized && r2.normalized && third?.normalized && (force || needsThird(r1, r2)))
    return finish(singleResult(finirUneLecture(third.normalized), 3), [r1, r2, third], true);
  return finalOfTwo(r1, r2, third, force);
}
/**
 * C★v : les VALEURS de la 3.8 quand elle tranche (comme C★), mais le STATUT du vote à trois (comme C) : dès que les lectures ont
 * divergé sur un champ qui pèse, le résultat reste « disputed » et garde les phrases du vote. Sans 3.8 appelée, c'est C.
 * C'est le parcours de C★ dont la revue (statut, constats) est celle du rapprochement des trois lectures ; les points du vote
 * qui sont des désaccords entre lectures s'ajoutent à ceux de la 3.8 seule.
 */
export function finalOfStarVote(r1: Reading, r2: Reading, third?: Reading, force = false): Final {
  const star = finalOfStar(r1, r2, third, force);
  if (star.used.length < 3 || !third?.normalized) return star;
  const vote = finalOfTwo(r1, r2, third, force);
  const disagreements = (vote.result.points ?? []).filter((point: any) => point.source === 'désaccord');
  return { ...star, result: { ...star.result, review: { ...vote.result.review }, issues: vote.result.issues, points: [...star.result.points, ...disagreements] } };
}

/** C★′ : comme C★, et un contrôle arithmétique en échec sur les deux lectures appelle aussi la 3.8, qui tranche seule. */
export const finalOfStarPrime = (r1: Reading, r2: Reading, third?: Reading): Final => finalOfStar(r1, r2, third, arithmeticFailsOnTwo(r1, r2));

// ---------------------------------------------------------------------------------------------------------------------
// Toutes les variantes d'un parcours, déduites des lectures (pur : la boucle du banc, le hors-ligne et N passent par ici)
// ---------------------------------------------------------------------------------------------------------------------
export type ThirdFrom = 'A' | 'neuf' | 'k1' | 'C';
export type LiteGroup = 'Lm' | 'Lh' | 'Lp';
export interface DrawReads {
  a1?: Reading; a2?: Reading; a3?: Reading;
  l1?: Reading; l2?: Reading; cThird?: Reading; cpThird?: Reading;
  lite: Partial<Record<LiteGroup, { r1: Reading; r2: Reading; third?: Reading }>>;
}
export interface Derived { final: Final; thirdFrom?: ThirdFrom }
const thirdFromOf = (third?: Reading): ThirdFrom | undefined => (!third ? undefined : third.meta.variant === 'A' ? 'A' : third.lent ? 'k1' : 'neuf');

export function mapReads(reads: DrawReads, f: (read: Reading) => Reading): DrawReads {
  const m = (read?: Reading) => (read ? f(read) : undefined);
  const lite: DrawReads['lite'] = {};
  for (const group of ['Lm', 'Lh', 'Lp'] as const) { const entry = reads.lite[group]; if (entry) lite[group] = { r1: f(entry.r1), r2: f(entry.r2), third: m(entry.third) }; }
  return { a1: m(reads.a1), a2: m(reads.a2), a3: m(reads.a3), l1: m(reads.l1), l2: m(reads.l2), cThird: m(reads.cThird), cpThird: m(reads.cpThird), lite };
}

/** Seules les variantes demandées (`want`) et dont les lectures sont là sont rendues. */
export function deriveVariants(reads: DrawReads, want: ReadonlySet<string>): Partial<Record<VariantId, Derived>> {
  const out: Partial<Record<VariantId, Derived>> = {};
  const { a1, a2, a3, l1, l2, cThird, cpThird } = reads;
  if (a1 && a2) {
    if (want.has('A')) out.A = { final: finalOfTwo(a1, a2, a3) };
    if (want.has('B')) out.B = { final: finalOfB(a1, a2, a3) };
  }
  if (l1 && l2) {
    const tf = thirdFromOf;
    if (want.has('C')) out.C = { final: finalOfTwo(l1, l2, cThird), ...(cThird ? { thirdFrom: tf(cThird) } : {}) };
    if (want.has('Cp')) out.Cp = { final: finalOfCprime(l1, l2, cpThird), ...(cpThird ? { thirdFrom: tf(cpThird) } : {}) };
    if (want.has('Cs')) out.Cs = { final: finalOfStar(l1, l2, cThird), ...(cThird ? { thirdFrom: tf(cThird) } : {}) };
    if (want.has('Csv')) out.Csv = { final: finalOfStarVote(l1, l2, cThird), ...(cThird ? { thirdFrom: tf(cThird) } : {}) };
    if (want.has('Csp')) out.Csp = { final: finalOfStarPrime(l1, l2, cpThird), ...(cpThird ? { thirdFrom: tf(cpThird) } : {}) };
  }
  for (const group of ['Lm', 'Lh', 'Lp'] as const) {
    const entry = reads.lite[group];
    if (entry && want.has(group)) out[group] = { final: finalOfStarPrime(entry.r1, entry.r2, entry.third), ...(entry.third ? { thirdFrom: thirdFromOf(entry.third) } : {}) };
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Budget : réservé AVANT chaque appel, au pire (sortie au plafond) ; coût réel relu après.
// ---------------------------------------------------------------------------------------------------------------------
/** Coût au pire d'un appel de ce modèle : les tarifs viennent de geminiCosts.ts (aucune copie). */
export function reservationMicro(model: string, maxOut: number = SCAN_MAX_OUTPUT): number {
  const quote = quoteGeminiCost(model, { generationConfig: { maxOutputTokens: maxOut } });
  const worst = observedGeminiCostDetails(quote, { usageMetadata: { promptTokenCount: RESERVE_INPUT_TOKENS, candidatesTokenCount: maxOut, thoughtsTokenCount: 0, totalTokenCount: RESERVE_INPUT_TOKENS + maxOut } });
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
export type Family = 'f1' | 'f2' | 'l1' | 'l2' | 's3' | 'm1' | 'm2' | 'h1' | 'h2' | 'p1' | 'p2';
export interface Fault { id: string; doc: string; tirage: number; families: Family[]; edits: Array<{ path: string; value?: unknown; delta?: number }>; cut?: boolean; note: string }
export interface AppliedFault { fault: string; doc: string; tirage: number; family: Family; path: string; wrongValue: unknown }

/** Plan de fautes (tirages 1 et 2 ; le 3ᵉ reste propre : il prouve que le jugement ne crie pas au loup). */
export const FAULT_PLAN: Fault[] = [
  { id: 'date-fausse', doc: 'doc5', tirage: 2, families: ['f1', 'f2'], edits: [{ path: 'date', value: '01.01.2000' }], note: 'les deux 3.8 lisent la même fausse date (aucun contrôle ne la voit : faux vert en A et B)' },
  { id: 'unite-x', doc: 'doc5', tirage: 1, families: ['l1', 'l2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux Flash-Lite inventent l’unité « x » sur toutes les lignes (faux vert en C et C′)' },
  { id: 'lite-divergent', doc: 'doc1', tirage: 1, families: ['l2'], edits: [{ path: 'items.2.quantity', value: 7 }], note: 'une lecture lite diverge : la 3.8 tranche' },
  { id: 'ligne-fausse', doc: 'doc6', tirage: 2, families: ['f1', 'f2'], edits: [{ path: 'items.3.amountTTC', delta: 1 }], note: 'deux 3.8 lisent le même montant de ligne faux : l’arithmétique le voit (alerte juste)' },
  { id: 'ttc-diverge', doc: 'doc3', tirage: 2, families: ['f1'], edits: [{ path: 'amountTTC', delta: 10 }], note: 'une 3.8 lit un autre total : la 3ᵉ lecture tranche' },
  { id: 'coupure-lite', doc: 'doc7', tirage: 2, families: ['l2'], edits: [], cut: true, note: 'une lecture lite est coupée par la limite de sortie' },
  // k2 : les fautes des nouvelles familles (réflexion medium, high, consigne Flash-Lite)
  { id: 'unite-x-medium', doc: 'doc5', tirage: 2, families: ['m1', 'm2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux Flash-Lite medium inventent l’unité « x » (faux vert en Lm : la 3.8 n’est pas appelée)' },
  { id: 'coupure-high', doc: 'doc7', tirage: 1, families: ['h1'], edits: [], cut: true, note: 'une lecture high est coupée, même au plafond relevé' },
  { id: 'ligne-fausse-lite', doc: 'doc6', tirage: 1, families: ['p1', 'p2'], edits: [{ path: 'items.3.amountTTC', delta: 1 }], note: 'les deux lectures à consigne Flash-Lite lisent un même montant de ligne faux : l’arithmétique appelle la 3.8, qui tranche seule' },
  { id: 'total-diverge-high', doc: 'doc3', tirage: 1, families: ['h2'], edits: [{ path: 'amountTTC', delta: 5 }], note: 'une lecture high lit un autre total : la 3.8 tranche seule' },
  { id: 'devise-abregee', doc: 'doc4', tirage: 3, families: ['l1', 'l2', 'm1', 'm2', 'p1', 'p2'], edits: [{ path: 'currency', value: 'Fr.' }], note: 'les deux Flash-Lite écrivent « Fr. » au lieu de « CHF » : N le rattrape, sans N le résultat est faux' }
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

const LITE_FAMILY: Record<string, string> = { Lm: 'm', Lh: 'h', Lp: 'p' };
export const familyOf = (meta: ReadMeta): Family => meta.lecture === 3 ? 's3'
  : meta.model === LITE_MODEL ? (LITE_FAMILY[meta.variant] ? `${LITE_FAMILY[meta.variant]}${meta.lecture}` : meta.lecture === 1 ? 'l1' : 'l2') as Family
  : (meta.lecture === 1 ? 'f1' : 'f2');

/** Réflexion simulée (jetons de réflexion) par groupe : la vraie mesure vient du mode payant. */
const SIM_THOUGHTS: Record<string, number> = { Lm: 450, Lh: 1500 };

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
  const thoughts = meta.lecture === 3 ? 0 : SIM_THOUGHTS[meta.variant] ?? 0, ceiling = callSpec(meta.variant, meta.lecture).maxOut;
  const json = {
    modelVersion: meta.model,
    candidates: [{ finishReason: cut ? 'MAX_TOKENS' : 'STOP', content: { role: 'model', parts: [{ text: cut ? text.slice(0, Math.floor(text.length / 2)) : text }] } }],
    usageMetadata: { promptTokenCount: inputTokens, candidatesTokenCount: cut ? ceiling - thoughts : outputTokens, thoughtsTokenCount: thoughts,
      totalTokenCount: inputTokens + (cut ? ceiling : outputTokens + thoughts) }
  };
  return { json, ms: (strong ? 7000 : 2500) + (seed % 2600) + Math.round((outputTokens + thoughts) * (strong ? 1.1 : 0.4)) };
}

// ---------------------------------------------------------------------------------------------------------------------
// Le banc
// ---------------------------------------------------------------------------------------------------------------------
export type Transport = (model: string, body: Record<string, unknown>, meta: ReadMeta, signal: AbortSignal) => Promise<{ json: any; ms: number }>;
export interface BenchDeps {
  cases?: BenchCase[]; readKey?: () => string | undefined; optIn?: (label: string, command: string) => void;
  transport?: Transport; journalPath?: string; log?: (line: string) => void; readFile?: (c: BenchCase) => InvoiceFile; plan?: Fault[];
  /** Prêt d'appels (sinon `options.reprendre`). */
  lender?: Lender;
}
export interface VariantRecord { ids: string[]; calls: number; ms: number; costMicroChf: number; costUnknown: number; result: any | null; failure?: string; thirdFrom?: ThirdFrom }
/** `variants` : les ids de variante lus (`Cs`, `Lm`…) et leurs versions N (`Cs+N`). */
export interface DrawRecord { doc: string; tirage: number; readings: Array<Omit<Reading, 'normalized' | 'raw'>>; variants: Record<string, VariantRecord> }

// ---------------------------------------------------------------------------------------------------------------------
// Prêt d'appels : une sortie précédente (k1) dont les lectures déjà payées sont rendues telles quelles
// ---------------------------------------------------------------------------------------------------------------------
export interface Loan { json: any; ms: number; costMicroChf: number | null; id: string }
/** Renvoie la première lecture prêtée parmi `ids` pour ce document et ce tirage. */
export type Lender = (doc: string, tirage: number, ids: readonly string[]) => Loan | undefined;
/** Les ids sous lesquels une 3ᵉ lecture 3.8 (consigne 3) a pu être faite : A3, C3, C′3, et celles de k2. */
export const THIRD_IDS: readonly string[] = ['A3', 'C3', 'Cp3', 'Lm3', 'Lh3', 'Lp3'];
export function loadLender(dir: string): Lender {
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { records: DrawRecord[] };
  const loans = new Map<string, Loan>();
  for (const record of file.records) {
    for (const read of record.readings) {
      const raw = path.join(dir, 'raw', `${record.doc}-t${record.tirage}-${read.meta.id}.json`);
      if (!existsSync(raw)) continue;
      loans.set(`${record.doc}|${record.tirage}|${read.meta.id}`, { json: JSON.parse(readFileSync(raw, 'utf8')), ms: read.ms, costMicroChf: read.costMicroChf, id: read.meta.id });
    }
  }
  return (doc, tirage, ids) => { for (const id of ids) { const loan = loans.get(`${doc}|${tirage}|${id}`); if (loan) return loan; } return undefined; };
}

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
  const simulated = options.mode === 'simuler', offline = options.mode === 'hors-ligne';
  const log = deps.log ?? (line => console.log(line));
  const cases = (deps.cases ?? loadCases()).filter(c => !options.docs || options.docs.includes(c.id));
  if (!cases.length) throw new Error('Aucun cas à lire.');
  const wanted: VariantId[] = options.variantes?.length ? [...options.variantes] : [...K1_VARIANTS];
  // B se déduit des lectures de A : demander B, c'est lire A.
  const want = new Set<string>(wanted);
  const groups = new Set<Group>(wanted.map(id => GROUP_OF[id]));
  const outDir = path.resolve(options.out ?? path.join(REELS_DIR, `banc-k2-${simulated ? 'sim-' : offline ? 'horsligne-' : ''}${stamp()}`));
  mkdirSync(path.join(outDir, 'raw'), { recursive: true });
  const journalPath = deps.journalPath ?? (simulated || offline ? path.join(outDir, 'journal-gemini.md') : MISSION_JOURNAL);
  const lender: Lender | undefined = deps.lender ?? (options.reprendre ? loadLender(path.resolve(options.reprendre)) : undefined);

  let transport: Transport;
  let budget: Budget;
  let restoreFetch = () => {};
  const faultLog: AppliedFault[] = [];
  const plan = options.faults ? deps.plan ?? FAULT_PLAN : [];
  if (simulated || offline) {
    // Aucun réseau, aucune clé : le fetch global lui-même est coupé pendant la simulation et le hors-ligne.
    const realFetch = globalThis.fetch;
    globalThis.fetch = (() => { throw new Error('Réseau interdit en simulation et hors ligne.'); }) as typeof fetch;
    restoreFetch = () => { globalThis.fetch = realFetch; };
    const byId = new Map(cases.map(c => [c.id, c]));
    transport = deps.transport ?? (async (_model, _body, meta) => simulateResponse(byId.get(meta.doc)!, meta, plan, faultLog));
    budget = new Budget(Number.MAX_SAFE_INTEGER);
  } else {
    (deps.optIn ?? ((label: string, command: string) => requirePaidAiTestOptIn({ label, command })))(
      `Banc de lecture des factures (${cases.length} documents × ${options.repeat} tirages, variantes ${wanted.join(',')}, budget ${options.budgetChf} CHF)`,
      `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf ${options.budgetChf} --variantes ${wanted.join(',')} --confirm-paid-ai`);
    const key = (deps.readKey ?? (() => readLocalKey()))();
    if (!key) throw new Error('Aucune clé Gemini locale : ni GEMINI_API_KEY, ni le fichier de clé du poste (lu par readLocalKey). Aucun appel.');
    transport = deps.transport ?? realTransport(key);
    const before = spentInJournal(journalPath);
    budget = new Budget(Math.round((options.budgetChf ?? 0) * 1e6), before);
    log(`Budget ${options.budgetChf} CHF, déjà journalisé ${chf4(before)} CHF.`);
  }

  const reserveByCall = new Map<string, number>();
  const reserveFor = (model: string, maxOut: number = SCAN_MAX_OUTPUT) => {
    const key = `${model}@${maxOut}`;
    if (!reserveByCall.has(key)) reserveByCall.set(key, reservationMicro(model, maxOut));
    return reserveByCall.get(key)!;
  };
  let halt: string | undefined, consecutiveFailures = 0;
  const readFile = deps.readFile ?? ((c: BenchCase): InvoiceFile => {
    const full = path.isAbsolute(c.file) ? c.file : path.join(ROOT, c.file);
    if ((simulated || offline) && !existsSync(full)) return { mimeType: c.mimeType, data: Buffer.from([255, 216, 255, 217]).toString('base64') };
    return validateInvoiceFile({ mimeType: c.mimeType, data: readFileSync(full).toString('base64') });
  });

  const records: DrawRecord[] = [];
  const reserveTable = Object.fromEntries([['a', callSpec('A', 1)], ['c', callSpec('C', 1)], ['lm', callSpec('Lm', 1)]].map(([name, spec]) => [name as string, reserveFor((spec as CallSpec).model, (spec as CallSpec).maxOut) / 1e6]));
  const meta0 = { mode: options.mode, repeat: options.repeat, startedAt: new Date().toISOString(), models: { strong: STRONG_MODEL, lite: LITE_MODEL }, budgetChf: options.budgetChf ?? null,
    variantes: wanted, normaliser: !!options.normaliser, reprendre: options.reprendre ? path.basename(path.resolve(options.reprendre)) : null,
    docs: cases.map(c => c.id), casFiles: CAS_FILES.map(file => path.basename(file)), reserve: reserveTable, faults: simulated && options.faults };
  const save = (stopped?: string) => {
    writeFileSync(path.join(outDir, 'results.json'), `${JSON.stringify({ meta: { ...meta0, finishedAt: new Date().toISOString(), stopped: stopped ?? null, spentChf: simulated || offline ? null : budget.spentMicro / 1e6 }, records }, null, 1)}\n`);
    if (simulated) writeFileSync(path.join(outDir, 'faults.json'), `${JSON.stringify({ plan, applied: faultLog }, null, 1)}\n`);
  };

  const readings: Reading[] = [];
  /** Un appel (ou son prêt). `group` règle le modèle, la consigne, la réflexion et le plafond de sortie (`callSpec`). */
  const doCall = async (c: BenchCase, file: InvoiceFile, tirage: number, group: string, lecture: 1 | 2 | 3): Promise<Reading> => {
    if (halt) throw new BudgetStop(halt);
    const spec = callSpec(group, lecture), model = spec.model;
    const meta: ReadMeta = { id: `${group}${lecture}`, doc: c.id, tirage, variant: group, lecture, model };
    // Prêt : seuls les réglages de k1 (A, C standards, 3ᵉ lecture) se prêtent ; Lm, Lh, Lp lisent toujours neuf.
    const loan = lender && (lecture === 3 ? lender(c.id, tirage, THIRD_IDS) : group === 'A' || group === 'C' ? lender(c.id, tirage, [meta.id]) : undefined);
    if (loan) {
      const lent: Reading = { ...readingFromResponse(meta, loan.json, loan.ms, loan.costMicroChf), lent: true };
      readings.push(lent);
      return lent;
    }
    if (offline) throw new Error(`Hors ligne : la lecture ${meta.id} (${meta.doc}, tirage ${tirage}) manque dans la sortie prêtée ; aucun appel n’est permis.`);
    const body = buildReadBody(file, spec.prompt, spec.maxOut, spec.thinking);
    const quote = quoteGeminiCost(model, body);
    const reserved = budget.reserve(reserveFor(model, spec.maxOut));
    const started = Date.now();
    let read: Reading;
    try {
      const signal = AbortSignal.any([AbortSignal.timeout(100_000), AbortSignal.timeout(spec.timeoutMs)]);
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
  const shortId = (id: string) => id.replace('Cp', 'C′').replace('Cs', 'C★').replace('C★p', 'C★′').replace('C★v', 'C★v');

  try {
  outer: for (let tirage = 1; tirage <= options.repeat; tirage++) {
    for (const c of cases) {
      const file = readFile(c);
      const before = readings.length;
      try {
        const reads: DrawReads = { lite: {} };
        // La 3ᵉ lecture (3.8, consigne 3) est unique par document et tirage : la première variante qui en a besoin l'obtient (prêt de k1,
        // sinon un appel neuf), les autres la réutilisent. Une 3.8 de A, quand A est lue, est la même.
        let pool: Reading | undefined;
        const third = async (group: string): Promise<Reading> => { if (!pool) pool = await doCall(c, file, tirage, group, 3); return pool; };
        if (groups.has('A')) {
          // A : exactement la production (deux lectures 3.8 en parallèle, 3ᵉ si elles divergent)
          const [a1, a2] = await parallel([doCall(c, file, tirage, 'A', 1), doCall(c, file, tirage, 'A', 2)]);
          const a3 = needsThird(a1, a2) ? await doCall(c, file, tirage, 'A', 3) : undefined;
          pool = a3;
          Object.assign(reads, { a1, a2, a3 });
        }
        if (groups.has('C')) {
          // C, C′, C★, C★′ : deux lectures lite en parallèle ; la 3.8 est prêtée par A (ou k1) si elle existe, sinon un appel neuf
          const [l1, l2] = await parallel([doCall(c, file, tirage, 'C', 1), doCall(c, file, tirage, 'C', 2)]);
          const cNeeds = needsThird(l1, l2), cpNeeds = !cNeeds && arithmeticFailsOnTwo(l1, l2);
          Object.assign(reads, { l1, l2 });
          if (cNeeds) { reads.cThird = await third('C'); reads.cpThird = reads.cThird; }
          else if (cpNeeds && (want.has('Cp') || want.has('Csp'))) reads.cpThird = await third('Cp');
        }
        for (const group of ['Lm', 'Lh', 'Lp'] as const) {
          if (!groups.has(group)) continue;
          // Lm, Lh, Lp = C★′ : divergence ou arithmétique en échec → la 3.8 tranche seule
          const [r1, r2] = await parallel([doCall(c, file, tirage, group, 1), doCall(c, file, tirage, group, 2)]);
          const needs = needsThird(r1, r2) || arithmeticFailsOnTwo(r1, r2);
          reads.lite[group] = { r1, r2, ...(needs ? { third: await third(group) } : {}) };
        }
        const variants: Record<string, VariantRecord> = {};
        const put = (suffix: string, derived: Partial<Record<VariantId, Derived>>) => {
          for (const id of orderVariants(Object.keys(derived))) { const d = derived[id as VariantId]!; variants[`${id}${suffix}`] = summary(d.final, d.thirdFrom ? { thirdFrom: d.thirdFrom } : {}); }
        };
        put('', deriveVariants(reads, want));
        // N : les mêmes lectures, la devise relue en code ISO ; aucun appel de plus (une 3.8 inutile devient simplement non demandée)
        if (options.normaliser) put(N_SUFFIX, deriveVariants(mapReads(reads, withCodesNormalized), want));
        records.push({ doc: c.id, tirage, readings: readings.slice(before).map(({ normalized: _n, raw: _r, ...rest }) => rest), variants });
        log(`${c.id} tirage ${tirage} : ${Object.keys(variants).map(id => `${shortId(id)} ${variants[id].calls} appel(s) ${Math.round(variants[id].ms / 100) / 10} s`).join(' · ')}`);
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
  log(simulated ? `Simulation terminée : ${records.length} parcours dans ${outDir} (aucun réseau).`
    : offline ? `Recalcul hors ligne terminé : ${records.length} parcours dans ${outDir} (aucun réseau, aucun appel).`
    : `Passe terminée : ${records.length} parcours, ${chf4(budget.spentMicro)} CHF au total journalisé, dossier ${outDir}.`);
  return { outDir, records, stopped, faults: faultLog };
}

/** vite-node ne laisse pas le nom du script dans process.argv : le banc se lance avec --simuler, --hors-ligne ou --payant, jamais sous vitest. */
const isMain = () => !process.env.VITEST && (process.argv.includes('--simuler') || process.argv.includes('--payant') || process.argv.includes('--hors-ligne'));
if (isMain()) {
  const options = parseArgs(process.argv.slice(2));
  const out = options.out ?? (options.mode === 'simuler' ? path.join(tmpdir(), `k2-sim-${stamp()}`) : undefined);
  runBench({ ...options, out }).then(() => process.exit(0), error => { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
}
