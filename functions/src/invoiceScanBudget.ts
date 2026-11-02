import { randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { BrewerBudgetError, DEFAULT_BREWER_LIMITS } from './brewerLimits.js';
import { invoiceScanId, invoiceDocumentHash, LITE_SCAN_MAX_OUTPUT, SCAN_MAX_CALLS, SCAN_MAX_OUTPUT, SCAN_MODEL, type InvoiceFile } from './invoiceScanCore.js';
import { GEMINI_LITE_MODEL, assertGeminiModel } from './models.js';
import { runWithMonthlyAiBudget } from './monthlyAiBudget.js';
import { GeminiRequestNotSentError, isGeminiRequestUncharged } from './geminiErrors.js';

const controlPath = 'brewerAiControls/current';
const dayAt = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year:'numeric', month:'2-digit', day:'2-digit' }).format(Date.now());
const empty = { calls: 0, proCalls: 0, tokens: 0 };
function controls(raw: any) {
  const limits = { ...DEFAULT_BREWER_LIMITS, ...raw?.limits };
  if (raw?.paused === true) throw new Error('L’IA est suspendue dans « Limites IA ». La saisie manuelle reste disponible.');
  if ((raw?.paused != null && typeof raw.paused !== 'boolean') || Object.values(limits).some(n => !Number.isSafeInteger(n) || Number(n) < 0))
    throw new Error('Les limites IA ne peuvent pas être vérifiées. Utilise la saisie manuelle.');
  return limits;
}
/** `model` : le modèle de CET appel (défaut : la 3.8). Il fixe le tarif réservé, le plafond de sortie et l'URL du fournisseur. */
type Generate = (body: Record<string, unknown>, signal: AbortSignal, model?: string) => Promise<any>;
/** Le plafond de sortie de chaque modèle : la Flash-Lite a 8 192 jetons (C★v8), la 3.8 garde 5 100. */
const outputCap = (model: string) => model === GEMINI_LITE_MODEL ? LITE_SCAN_MAX_OUTPUT : SCAN_MAX_OUTPUT;

/** Dedicated document ledger, shared global limits. Never touches brewerJobs.
 * The byte hash is server-owned; concurrent/repeated requests never pay twice.
 * A crash/timeout deliberately retains its reservation and does not permit retry.
 */
/** Au-delà de ce délai (le double du temps maximal d'une fonction), un document « running » est considéré comme planté. */
export const RUNNING_STALE_MS = 10 * 60 * 1000;
export async function runBudgetedInvoiceScan<T>(uid: string, file: InvoiceFile, work: (generate: Generate) => Promise<T>, provider: Generate, options?: { degraded?: (result: T) => boolean }): Promise<{ result: T; cached: boolean; documentHash: string }> {
  const db = getFirestore(), id = invoiceScanId(uid, file), ref = db.doc(`invoiceScans/${id}`), fence = randomUUID();
  let retrying = false, previous: T | undefined;
  const cached = await db.runTransaction(async tx => {
    const [prior, control] = await Promise.all([tx.get(ref), tx.get(db.doc(controlPath))]);
    const existing = prior.data();
    // Reading a completed extraction incurs no new cost, including while paused.
    if (existing?.status === 'completed') return { result: existing.result as T };
    // Une instance qui a planté pendant la relecture laisse le document « running » : passé le délai nommé, le résultat dégradé qu'on servait l'est de
    // nouveau (statut « degraded », relecture de nouveau possible). Un « running » plus récent répond toujours « déjà en cours ».
    if (existing?.status === 'running' && existing.previousResult !== undefined && Date.now() - Number(existing.createdAt ?? 0) > RUNNING_STALE_MS) {
      tx.set(ref, { uid, status:'degraded', result:existing.previousResult, retried:false, finishedAt:Date.now() });
      return { result: existing.previousResult as T };
    }
    // l2 (P8) : un résultat dégradé (lecture coupée) n'est pas figé comme complet ; le même justificatif est relu UNE fois, puis le résultat est servi tel quel.
    // Relecture déjà faite (même bloquée ou en échec : `retried` reste vrai) ou pause globale : le résultat dégradé est servi, sans erreur ni nouvel appel.
    if (existing?.status === 'degraded') {
      let allowed = existing.retried !== true;
      if (allowed) { try { controls(control.data()); } catch { allowed = false; } }
      if (!allowed) return { result: existing.result as T };
      retrying = true; previous = existing.result as T;
      tx.set(ref, { uid, fence, status:'running', calls:0, reservedTokens:0, createdAt:Date.now(), retried:true, previousResult:existing.result });
      return null;
    }
    controls(control.data());
    if (existing && existing.status !== 'blocked') throw new Error(existing.status === 'running' ? 'Ce justificatif est déjà en cours d’analyse. Patiente avant de le rouvrir.' : 'Ce justificatif a déjà été analysé sans résultat exploitable. Complète-le manuellement.');
    tx.set(ref, { uid, fence, status:'running', calls:0, reservedTokens:0, createdAt:Date.now() });
    return null;
  });
  const documentHash = invoiceDocumentHash(file);
  if (cached) return { result:cached.result, cached:true, documentHash };
  const stopped = new AbortController();
  let providerStarted = false;
  const unsubscribe = db.doc(controlPath).onSnapshot(snapshot => {
    try { controls(snapshot.data()); } catch (error) { stopped.abort(error); }
  }, () => stopped.abort(new Error('Contrôle du budget indisponible.')));
  const generate: Generate = async (body, signal, model = SCAN_MODEL) => {
    // Dernier verrou : un modèle hors de la liste blanche n'est ni réservé ni envoyé.
    assertGeminiModel(model);
    const requestSignal = AbortSignal.any([signal, stopped.signal]);
    requestSignal.throwIfAborted();
    // Read small invoice print at high resolution with a conservative daily media allowance.
    // The monthly CHF ledger separately reserves the entire model context for media.
    // Do not count base64 bytes as text tokens, or silently ignore multimodal cost.
    const requestedOutput=Number((body.generationConfig as any)?.maxOutputTokens??SCAN_MAX_OUTPUT);
    if(!Number.isSafeInteger(requestedOutput)||requestedOutput<1)throw new Error('Plafond de sortie invalide.');
    const output=Math.min(outputCap(model),requestedOutput);
    const config = { ...(body.generationConfig as object), maxOutputTokens: output, mediaResolution: 'MEDIA_RESOLUTION_HIGH' };
    const request = { ...body, generationConfig:config };
    const textBody = JSON.stringify(request, (key, value) => key === 'inlineData' ? { media:true } : value);
    const reserve = 65_536 + Buffer.byteLength(textBody) + output;
    const day = dayAt(), dailyRef = db.doc(`brewerAiUsage/${day}`), callId = randomUUID();
    requestSignal.throwIfAborted();
    await db.runTransaction(async tx => {
      requestSignal.throwIfAborted();
      const [daily, scan, control] = await Promise.all([tx.get(dailyRef), tx.get(ref), tx.get(db.doc(controlPath))]);
      const limits = controls(control.data()), current = scan.data(), usage = { ...empty, ...daily.data()?.usage };
      if (Object.values(usage).some(n => !Number.isSafeInteger(n) || Number(n) < 0)) throw new Error('Consommation IA indisponible.');
      if (current?.status !== 'running' || current.fence !== fence || current.calls >= SCAN_MAX_CALLS) throw new Error('Limite de trois lectures atteinte pour ce justificatif.');
      if (usage.calls + 1 > limits.dailyCalls || usage.tokens + reserve > limits.dailyTokens) throw new Error('Plafond quotidien IA atteint. Complète le justificatif manuellement.');
      if (current.calls + 1 > limits.questionCalls || current.reservedTokens + reserve > limits.questionTokens) throw new Error('Plafond de lecture atteint pour ce justificatif.');
      requestSignal.throwIfAborted();
      tx.set(dailyRef, { ...daily.data(), day, usage: { ...usage, calls:usage.calls + 1, tokens:usage.tokens + reserve }, updatedAt:Date.now() });
      tx.update(ref, { calls:current.calls + 1, reservedTokens:current.reservedTokens + reserve, [`reservations.${callId}`]:{ day, reserved:reserve, status:'reserved' } });
    });
    let result: any;
    try {
      if (requestSignal.aborted) throw new GeminiRequestNotSentError(requestSignal.reason);
      // Le coût réservé et réglé suit le modèle de l'appel (geminiCosts.ts) : une Flash-Lite n'est jamais provisionnée au tarif de la 3.8.
      result = await runWithMonthlyAiBudget(model, request, normalized => {
        if (requestSignal.aborted) throw new GeminiRequestNotSentError(requestSignal.reason);
        providerStarted = true;
        return provider(normalized, requestSignal, model);
      });
    } catch (error) {
      // A refused monthly reservation or proven uncharged request has no token cost. Release the daily
      // token allowance (keep the attempted-call counter to bound loops).
      if (isGeminiRequestUncharged(error) || error instanceof BrewerBudgetError && ['ai-paused', 'ai-monthly-unconfigured', 'ai-monthly-limit', 'ai-cost-unavailable', 'ai-grounding-unavailable', 'ai-budget-unavailable'].includes(error.code)) {
        await db.runTransaction(async tx => {
          const [daily, scan] = await Promise.all([tx.get(dailyRef), tx.get(ref)]);
          if (scan.data()?.reservations?.[callId]?.status !== 'reserved') return;
          tx.update(dailyRef, { 'usage.tokens': Math.max(0, daily.data()!.usage.tokens - reserve) });
          tx.update(ref, { [`reservations.${callId}`]: { day, reserved: reserve, charged: 0, status: 'rejected' } });
        }).catch(() => undefined);
      }
      throw error;
    }
    const reported = result?.usageMetadata?.totalTokenCount;
    const charged = Number.isSafeInteger(reported) && reported >= 0 ? reported : reserve;
    // Settlement failure keeps the conservative reservation; never triggers another generation.
    await db.runTransaction(async tx => {
      const [daily, scan] = await Promise.all([tx.get(dailyRef), tx.get(ref)]);
      const previous = scan.data()?.reservations?.[callId];
      if (previous?.status !== 'reserved') return;
      tx.update(dailyRef, { 'usage.tokens':Math.max(0, daily.data()!.usage.tokens - reserve + charged) });
      tx.update(ref, { [`reservations.${callId}`]:{ day, reserved:reserve, charged, status:'completed' } });
    }).catch(() => undefined);
    requestSignal.throwIfAborted();
    return result;
  };
  try {
    const result = await work(generate);
    // Work may deliberately return a partial extraction after a reviewer error. A global pause
    // still cancels the whole scan instead of being swallowed by that recovery path.
    stopped.signal.throwIfAborted();
    const degraded = !retrying && options?.degraded?.(result) === true;
    await ref.update({ status:degraded ? 'degraded' : 'completed', result, finishedAt:Date.now(), ...(degraded ? { retried:false } : {}) });
    return { result, cached:false, documentHash };
  } catch (error) {
    if (retrying && previous !== undefined) {
      // La relecture a échoué ou a été bloquée : le résultat dégradé qu'on servait reste servi (statut « degraded », jamais « completed »).
      // `retried` reste vrai (pas de troisième passe payée) sauf si une pause globale l'a arrêtée avant tout appel : la relecture reste permise.
      const paused = stopped.signal.aborted;
      await ref.update({ status:'degraded', result:previous, retried:!paused, finishedAt:Date.now() }).catch(() => undefined);
      if (paused) throw error;
      return { result:previous, cached:true, documentHash };
    }
    await ref.update({ status: providerStarted ? 'failed' : 'blocked', finishedAt:Date.now() }).catch(() => undefined);
    throw error;
  } finally { unsubscribe(); }
}
