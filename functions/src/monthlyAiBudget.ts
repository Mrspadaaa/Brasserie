import { randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { BrewerBudgetError, DEFAULT_BREWER_LIMITS } from './brewerLimits.js';
import { isGeminiRequestUncharged } from './geminiErrors.js';
import { aiBudgetMonth, GEMINI_COST_POLICY, GEMINI_SEARCH_COST_POLICY, monthlyLimit, observedGeminiCostDetails, quoteGeminiCost, readMonthlyUsage, type GeminiObservedCost } from './geminiCosts.js';

/** Every provider request passes here. Reservations from concurrent scans, chat
 * workers and other tasks contend on ONE month document, before any network call.
 * Uncertain failures keep their reservation; settlement never retries Gemini.
 */
export async function runWithMonthlyAiBudget<T>(
  model: string, body: Record<string, unknown>,
  generate: (body: Record<string, unknown>) => Promise<T>,
  options: { daily?: boolean } = {}
): Promise<T> {
  const quote = quoteGeminiCost(model, body), db = getFirestore(), at = Date.now(), month = aiBudgetMonth(at);
  const monthRef = db.doc(`brewerAiCosts/${month}`), callId = randomUUID();
  const callRef = db.doc(`brewerAiCosts/${month}/calls/${callId}`);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
  const dailyRef = db.doc(`brewerAiUsage/${day}`);
  const tokenReserve = quote.inputTokens + quote.outputTokens, pro = model.includes('pro') ? 1 : 0;
  try {
    await db.runTransaction(async tx => {
      const [control, monthly, daily] = await Promise.all([
        tx.get(db.doc('brewerAiControls/current')), tx.get(monthRef), options.daily ? tx.get(dailyRef) : Promise.resolve(null)
      ]);
      const controls = control.data() ?? {};
      if (controls.paused === true) throw new BrewerBudgetError('ai-paused', 'L’IA est suspendue dans « Limites IA ». La saisie manuelle reste disponible.');
      if (controls.paused != null && controls.paused !== false) throw new BrewerBudgetError('ai-budget-unavailable', 'État des limites IA indisponible.');
      const limit = monthlyLimit(controls.monthlyLimitMicroChf), usage = readMonthlyUsage(monthly.data());
      if (limit === null) throw new BrewerBudgetError('ai-monthly-unconfigured', 'Choisis ton budget mensuel dans « Limites IA » avant le prochain appel Gemini.');
      if (usage.usedMicroChf + usage.reservedMicroChf + quote.reservedMicroChf > limit)
        throw new BrewerBudgetError('ai-monthly-limit', 'Budget mensuel IA insuffisant pour réserver cette analyse. Consulte « Limites IA » ; la saisie manuelle reste disponible.');
      if (options.daily) {
        const limits = { ...DEFAULT_BREWER_LIMITS, ...controls.limits };
        const usage = { calls: 0, proCalls: 0, tokens: 0, ...daily?.data()?.usage };
        if ([...Object.values(limits), ...Object.values(usage)].some(n => !Number.isSafeInteger(n) || Number(n) < 0))
          throw new BrewerBudgetError('ai-budget-unavailable', 'Consommation quotidienne IA indisponible.');
        if (usage.calls + 1 > limits.dailyCalls || usage.proCalls + pro > limits.dailyProCalls || usage.tokens + tokenReserve > limits.dailyTokens)
          throw new BrewerBudgetError('ai-daily-limit', 'Plafond quotidien IA atteint. Consulte « Limites IA ».');
        tx.set(dailyRef, { ...daily?.data(), day, usage: { calls: usage.calls + 1, proCalls: usage.proCalls + pro, tokens: usage.tokens + tokenReserve }, updatedAt: at });
      }
      tx.set(monthRef, { ...monthly.data(), month, ...usage, reservedMicroChf: usage.reservedMicroChf + quote.reservedMicroChf, updatedAt: at });
      tx.set(callRef, { status: 'reserved', model, reservedMicroChf: quote.reservedMicroChf, revision: GEMINI_COST_POLICY.revision,
        inputTokens: quote.inputTokens, outputTokens: quote.outputTokens, audioInput: quote.audioInput, searchQueriesReserved: quote.searchQueriesReserved,
        searchQueryMicroChf: quote.searchQueriesReserved ? GEMINI_SEARCH_COST_POLICY.microChfPerQuery : 0, createdAt: at });
    });
  } catch (error) {
    if (error instanceof BrewerBudgetError) throw error;
    throw new BrewerBudgetError('ai-budget-unavailable', 'Le budget mensuel ne peut pas être réservé. Aucun appel Gemini transmis.');
  }
  const settle = async (observed: GeminiObservedCost | null, tokens: number | null, rejected = false) => {
    if (observed === null) return; // Missing usage is an uncertain cost, never zero.
    const charged = observed.chargedMicroChf;
    await db.runTransaction(async tx => {
      const [monthly, call, daily] = await Promise.all([tx.get(monthRef), tx.get(callRef), options.daily ? tx.get(dailyRef) : Promise.resolve(null)]);
      if (call.data()?.status !== 'reserved') return;
      const usage = readMonthlyUsage(monthly.data());
      if (usage.reservedMicroChf < quote.reservedMicroChf) throw new Error('Invalid reservation ledger');
      tx.update(monthRef, { usedMicroChf: usage.usedMicroChf + charged, reservedMicroChf: usage.reservedMicroChf - quote.reservedMicroChf, updatedAt: Date.now() });
      // Provider search fan-out can exceed its allowance. Record every observed
      // query even then; the next reservation sees the full cost and may stop.
      tx.update(callRef, { status: rejected ? 'rejected' : 'completed', ...observed,
        exceededReservation: charged > quote.reservedMicroChf, finishedAt: Date.now() });
      if (options.daily && tokens !== null) tx.update(dailyRef, { 'usage.tokens': Math.max(0, daily!.data()!.usage.tokens - tokenReserve + tokens) });
    }).catch(() => logger.warn('monthly-ai-reservation-kept', { month, callId }));
  };
  try {
    const result = await generate(quote.body), reported = (result as any)?.usageMetadata?.totalTokenCount;
    await settle(observedGeminiCostDetails(quote, result), Number.isSafeInteger(reported) && reported >= 0 ? reported : null);
    return result;
  } catch (error) {
    if (isGeminiRequestUncharged(error))
      await settle({ chargedMicroChf: 0, tokenMicroChf: 0, searchQueries: 0, searchMicroChf: 0 }, 0, true);
    throw error;
  }
}
