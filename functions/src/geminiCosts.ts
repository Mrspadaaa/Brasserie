import { BrewerBudgetError } from './brewerLimits.js';

/** Standard Gemini Developer API prices, verified against the official table.
 * No free tier, cache discount or promotional credit is assumed.
 * Amounts use integer micro-CHF; 1 USD is provisioned as 1.25 CHF, a safety
 * allowance, NOT an exchange-rate quote or a promise about the Cloud invoice.
 */
export const GEMINI_COST_POLICY = {
  revision: '2026-09-09-provision-v2-search',
  source: 'https://ai.google.dev/gemini-api/docs/pricing',
  verifiedAt: '2026-09-09',
  validUntil: '2026-10-09T00:00:00+02:00',
  chfPerUsd: 1.25,
  microChfPerChf: 1_000_000
} as const;
/** Gemini 3 bills each unique, non-empty internal search query. Twenty queries
 * is a conservative allowance for our short search task, NOT a provider limit.
 * No free grounding quota is assumed; it is shared with the entire project.
 */
export const GEMINI_SEARCH_COST_POLICY = {
  source: 'https://ai.google.dev/gemini-api/docs/google-search#pricing',
  reservedQueriesPerCall: 20,
  microChfPerQuery: 17_500 // 14 USD / 1,000 queries × 1.25 CHF/USD
} as const;
const MODEL_CONTEXT = 1_048_576;
const PRICES: Record<string, { input: number; output: number; largeInput?: number; largeOutput?: number; audioInput?: number }> = {
  'gemini-3.5-flash-lite': { input: 300_000, output: 2_500_000 },
  'gemini-3.1-flash-lite': { input: 250_000, audioInput: 500_000, output: 1_500_000 },
  // Provision at the announced January 2027 standard rate already: never rely
  // on the temporary 50% discount, and no automatic annual maintenance cliff.
  'gemini-3.6-flash': { input: 1_500_000, output: 7_500_000 },
  'gemini-3.7-flash': { input: 1_500_000, output: 7_500_000 },
  'gemini-3.8-flash': { input: 1_500_000, output: 7_500_000 },
  'gemini-3.1-pro-preview': { input: 2_000_000, output: 12_000_000, largeInput: 4_000_000, largeOutput: 18_000_000 }
};
const unavailable = (message: string) => new BrewerBudgetError('ai-cost-unavailable', message);
export const aiBudgetMonth = (at = Date.now()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit'
}).format(at);
export const pricesCurrent = (at = Date.now()) => at >= Date.parse(`${GEMINI_COST_POLICY.verifiedAt}T00:00:00Z`) && at < Date.parse(GEMINI_COST_POLICY.validUntil);
export function monthlyLimit(raw: unknown): number | null {
  if (raw == null) return null;
  if (!Number.isSafeInteger(raw) || Number(raw) < 0 || Number(raw) > 100_000_000)
    throw unavailable('Le budget mensuel IA est invalide. Aucun nouvel appel Gemini.');
  return Number(raw);
}
const nonnegative = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
export function readMonthlyUsage(raw: any = {}) {
  const usedMicroChf = raw?.usedMicroChf ?? 0, reservedMicroChf = raw?.reservedMicroChf ?? 0;
  if (!nonnegative(usedMicroChf) || !nonnegative(reservedMicroChf)) throw unavailable('Le suivi mensuel IA est indisponible. Aucun nouvel appel Gemini.');
  return { usedMicroChf, reservedMicroChf };
}
function amount(model: string, input: number, output: number, audioInput = false): number {
  const rate = PRICES[model];
  if (!rate) throw unavailable('Tarif de ce modèle Gemini inconnu. Aucun appel non couvert par le budget.');
  const inputRate = Math.max(input > 200_000 ? rate.largeInput ?? rate.input : rate.input, audioInput ? rate.audioInput ?? 0 : 0);
  const outputRate = input > 200_000 ? rate.largeOutput ?? rate.output : rate.output;
  // All operands are integers. Divide only once and round upward to micro-CHF.
  return Math.ceil((input * inputRate + output * outputRate) * 5 / 4_000_000);
}
export interface GeminiCostQuote {
  model: string; inputTokens: number; outputTokens: number; reservedMicroChf: number;
  searchQueriesReserved: number;
  audioInput: boolean;
  body: Record<string, unknown>;
}
export function quoteGeminiCost(model: string, body: Record<string, unknown>, at = Date.now()): GeminiCostQuote {
  // Age is shown as a review warning, not a monthly maintenance requirement for
  // the brewer. These are conservative provisioning rates, not Cloud billing.
  if (!Number.isFinite(at)) throw unavailable('La date du budget IA est invalide.');
  if (!PRICES[model]) throw unavailable('Tarif de ce modèle Gemini inconnu. Aucun appel non couvert par le budget.');
  if (body.cachedContent || body.serviceTier) throw unavailable('Cette option Gemini n’a pas de budget vérifiable.');
  const tools = body.tools as any[] | undefined;
  if (tools && (!Array.isArray(tools) || tools.some(tool => !tool || typeof tool !== 'object' || Array.isArray(tool) ||
    Object.keys(tool).some(key => !['functionDeclarations', 'googleSearch', 'google_search'].includes(key)))))
    throw unavailable('Le coût de cet outil Gemini n’est pas couvert par le budget.');
  const searchTools = tools?.filter(tool => 'googleSearch' in tool || 'google_search' in tool) ?? [];
  if (searchTools.length > 1 || searchTools.some(tool => {
    const search = tool.googleSearch ?? tool.google_search;
    return !search || typeof search !== 'object' || Array.isArray(search) || Object.keys(search).length > 0 ||
      ('googleSearch' in tool && 'google_search' in tool);
  })) throw unavailable('Cette configuration de recherche Gemini n’a pas de provision vérifiable.');
  const searchQueriesReserved = searchTools.length ? GEMINI_SEARCH_COST_POLICY.reservedQueriesPerCall : 0;
  const config = (body.generationConfig ?? {}) as Record<string, unknown>;
  const requested = config.maxOutputTokens ?? 4500;
  if (!nonnegative(requested) || requested < 1 || requested > 12000 ||
      (config.responseModalities && JSON.stringify(config.responseModalities) !== '["TEXT"]'))
    throw unavailable('Cette génération IA n’a pas de limite de sortie vérifiable.');
  const normalized = { ...body, generationConfig: { ...config, maxOutputTokens: requested, candidateCount: 1 } };
  let media = false, audioInput = false;
  const json = JSON.stringify(normalized, (key, value) => {
    if (key === 'inlineData' || key === 'fileData') {
      media = true;
      // A video may include audio. Unknown file metadata cannot prove the
      // cheaper modality either. Mixed prompts use the higher input rate for
      // all tokens so settlement cannot undercount an audio-bearing fallback.
      const mime = typeof value?.mimeType === 'string' ? value.mimeType.toLowerCase() : '';
      audioInput ||= !(mime === 'application/pdf' || mime.startsWith('image/') || mime.startsWith('text/'));
      return { media: true };
    }
    return value;
  });
  // A text token cannot require fewer than one UTF-8 byte; retain framing margin.
  // Media tokenisation varies by model/document. Reserve the full model context,
  // instead of assuming that a compressed PDF/photo has a small token count.
  const bytes = Buffer.byteLength(json) + 4096;
  if (bytes > MODEL_CONTEXT) throw unavailable('Contexte trop volumineux pour estimer le coût de cette analyse.');
  const inputTokens = media ? MODEL_CONTEXT : bytes;
  return { model, inputTokens, outputTokens: requested, searchQueriesReserved, audioInput,
    reservedMicroChf: amount(model, inputTokens, requested, audioInput) + searchQueriesReserved * GEMINI_SEARCH_COST_POLICY.microChfPerQuery,
    body: normalized };
}
export interface GeminiObservedCost {
  chargedMicroChf: number;
  tokenMicroChf: number;
  searchQueries: number;
  searchMicroChf: number;
}
/** This adapter consumes a complete generateContent response, never individual
 * streaming chunks. Missing search metadata is uncertain, including when the
 * model seems to have skipped Search. Only an explicit valid array proves zero.
 * Keep raw queries out of the budget ledger: they can contain private context.
 */
export function observedGeminiSearchQueries(quote: GeminiCostQuote, response: any): number | null {
  if (!quote.searchQueriesReserved) return 0;
  if (!Array.isArray(response?.candidates) || response.candidates.length !== 1) return null;
  const queries = response.candidates[0]?.groundingMetadata?.webSearchQueries;
  if (!Array.isArray(queries) || queries.some(query => typeof query !== 'string')) return null;
  return new Set(queries.map(query => query.trim()).filter(Boolean)).size;
}
export function observedGeminiCostDetails(quote: GeminiCostQuote, response: any): GeminiObservedCost | null {
  const usage = response?.usageMetadata;
  if (!usage || !nonnegative(usage.promptTokenCount) || !nonnegative(usage.candidatesTokenCount) ||
      !nonnegative(usage.thoughtsTokenCount ?? 0) || !nonnegative(usage.totalTokenCount)) return null;
  const searchQueries = observedGeminiSearchQueries(quote, response);
  if (searchQueries === null) return null;
  const output = Math.max(usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0), usage.totalTokenCount - usage.promptTokenCount);
  // Cached input is deliberately charged at the undiscounted input rate.
  const tokenMicroChf = amount(quote.model, usage.promptTokenCount, output, quote.audioInput);
  const searchMicroChf = searchQueries * GEMINI_SEARCH_COST_POLICY.microChfPerQuery;
  const chargedMicroChf = tokenMicroChf + searchMicroChf;
  if (!Number.isSafeInteger(chargedMicroChf)) return null;
  return { chargedMicroChf, tokenMicroChf, searchQueries, searchMicroChf };
}
export function observedGeminiCost(quote: GeminiCostQuote, response: any): number | null {
  return observedGeminiCostDetails(quote, response)?.chargedMicroChf ?? null;
}
