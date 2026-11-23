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
/** L'outil `url_context` lit la page lui-même et la facture en jetons d'entrée (`toolUsePromptTokenCount`), que nous ne connaissons pas avant l'appel.
 * Mesuré au banc (23.11) : 800 à 7 500 jetons pour une fiche, 30 000 pour une page de catégorie ; 111 000 vu une fois sur une page lourde. On réserve
 * 120 000 jetons d'entrée par appel : une borne de provision, PAS une limite du fournisseur ; le règlement reprend le chiffre réellement observé.
 */
export const URL_CONTEXT_RESERVED_INPUT_TOKENS = 120_000;
const MODEL_CONTEXT = 1_048_576;
/** A call is quoted and settled at the rate of the model that serves it: gemini-3.8-flash, or
 * gemini-3.5-flash-lite where models.ts routes a usage to it (LITE_ROUTES), or gemini-4-hydrogen for the
 * third invoice reading (INVOICE_STRONG_MODEL), or gemini-4-argon for a reading the user asked to redo
 * (INVOICE_ARGON_MODEL; its rate changes on 2026-12-01, see RATE_CHANGES). Older models keep their rates only to read past usage
 * and settlements; none is called anymore.
 */
const PRICES: Record<string, { input: number; output: number; largeInput?: number; largeOutput?: number; audioInput?: number }> = {
  'gemini-3.5-flash-lite': { input: 300_000, output: 2_500_000 },
  // Hydrogen: 1.50 / 7.50 USD per million tokens, output counting the reasoning (https://ai.google.dev/gemini-api/docs/pricing, read 14.11.2026).
  // Same rate as 3.8; never the free tier, whose data may be used by Google.
  'gemini-4-hydrogen': { input: 1_500_000, output: 7_500_000 },
  // Argon (relecture demandée par l'utilisateur) : 2 / 10 USD par million jusqu'au 30.11.2026 ; le tarif de ce tableau est celui d'AUJOURD'HUI, `RATE_CHANGES` porte la suite.
  'gemini-4-argon': { input: 2_000_000, output: 10_000_000 },
  'gemini-3.1-flash-lite': { input: 250_000, audioInput: 500_000, output: 1_500_000 },
  // Provision at the announced January 2027 standard rate already: never rely
  // on the temporary 50% discount, and no automatic annual maintenance cliff.
  'gemini-3.6-flash': { input: 1_500_000, output: 7_500_000 },
  'gemini-3.7-flash': { input: 1_500_000, output: 7_500_000 },
  'gemini-3.8-flash': { input: 1_500_000, output: 7_500_000 },
  'gemini-3.1-pro-preview': { input: 2_000_000, output: 12_000_000, largeInput: 4_000_000, largeOutput: 18_000_000 }
};
/** Les tarifs qui changent à une date : le tarif suit la date du devis, jamais celle du règlement ni un tarif « d'aujourd'hui » figé. Argon passe de 2 / 10 à 4 / 20 USD le 1er décembre 2026 (Europe/Zurich). */
export const RATE_CHANGES: Record<string, Array<{ from: number; input: number; output: number }>> = {
  'gemini-4-argon': [{ from: Date.parse('2026-12-01T00:00:00+01:00'), input: 4_000_000, output: 20_000_000 }]
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
function amount(model: string, input: number, output: number, audioInput = false, at = Date.now()): number {
  const base = PRICES[model];
  if (!base) throw unavailable('Tarif de ce modèle Gemini inconnu. Aucun appel non couvert par le budget.');
  // Le dernier changement déjà entré en vigueur à la date `at` remplace le tarif de base (jamais zéro : un tarif absent lève plus haut).
  const change = (RATE_CHANGES[model] ?? []).filter(c => c.from <= at).sort((a, b) => b.from - a.from)[0];
  const rate = change ? { ...base, input: change.input, output: change.output } : base;
  const inputRate = Math.max(input > 200_000 ? rate.largeInput ?? rate.input : rate.input, audioInput ? rate.audioInput ?? 0 : 0);
  const outputRate = input > 200_000 ? rate.largeOutput ?? rate.output : rate.output;
  // All operands are integers. Divide only once and round upward to micro-CHF.
  return Math.ceil((input * inputRate + output * outputRate) * 5 / 4_000_000);
}
export interface GeminiCostQuote {
  model: string; inputTokens: number; outputTokens: number; reservedMicroChf: number;
  searchQueriesReserved: number;
  audioInput: boolean;
  /** L'outil `url_context` est demandé : les pages qu'il lit sont réservées d'avance et réglées en entrée. */
  urlContext?: true;
  /** La date du devis : le règlement (`observedGeminiCostDetails`) reprend le tarif de CE jour. */
  at?: number;
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
    Object.keys(tool).some(key => !['functionDeclarations', 'googleSearch', 'google_search', 'urlContext', 'url_context'].includes(key)))))
    throw unavailable('Le coût de cet outil Gemini n’est pas couvert par le budget.');
  const urlTools = tools?.filter(tool => 'urlContext' in tool || 'url_context' in tool) ?? [];
  if (urlTools.length > 1 || urlTools.some(tool => {
    const lecture = tool.urlContext ?? tool.url_context;
    return !lecture || typeof lecture !== 'object' || Array.isArray(lecture) || Object.keys(lecture).length > 0 ||
      ('urlContext' in tool && 'url_context' in tool);
  })) throw unavailable('Cette configuration de lecture d’adresse Gemini n’a pas de provision vérifiable.');
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
  const inputTokens = media ? MODEL_CONTEXT : bytes + (urlTools.length ? URL_CONTEXT_RESERVED_INPUT_TOKENS : 0);
  return { model, inputTokens, outputTokens: requested, searchQueriesReserved, audioInput, at, ...(urlTools.length ? { urlContext: true as const } : {}),
    reservedMicroChf: amount(model, inputTokens, requested, audioInput, at) +searchQueriesReserved * GEMINI_SEARCH_COST_POLICY.microChfPerQuery,
    body: normalized };
}
export interface GeminiObservedCost {
  chargedMicroChf: number;
  tokenMicroChf: number;
  searchQueries: number;
  searchMicroChf: number;
  /** Search was not proven by the response: its full reserved allowance is charged instead. */
  searchQueriesProvisioned?: true;
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
/** Tokens are charged as reported. Unproven Search (#100: a grounded call
 * without `webSearchQueries`) is charged at its full reserved allowance, never
 * zero, so the reservation is settled instead of being kept forever. Only
 * missing token usage leaves the cost unknown (null).
 */
export function observedGeminiCostDetails(quote: GeminiCostQuote, response: any): GeminiObservedCost | null {
  const usage = response?.usageMetadata;
  if (!usage || !nonnegative(usage.promptTokenCount) || !nonnegative(usage.candidatesTokenCount) ||
      !nonnegative(usage.thoughtsTokenCount ?? 0) || (quote.urlContext && !nonnegative(usage.toolUsePromptTokenCount ?? 0)) || !nonnegative(usage.totalTokenCount)) return null;
  const proven = observedGeminiSearchQueries(quote, response);
  const searchQueries = proven ?? quote.searchQueriesReserved;
  // Les pages lues par `url_context` sont de l'entrée (`toolUsePromptTokenCount`, comprise dans le total) : jamais facturées au tarif de la sortie.
  // Seulement pour `url_context` : le règlement de la recherche ancrée reste celui d'avant (ses jetons d'outil comptés dans le total, au tarif de sortie, donc par excès).
  const input = usage.promptTokenCount + (quote.urlContext ? usage.toolUsePromptTokenCount ?? 0 : 0);
  const output = Math.max(usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0), usage.totalTokenCount - input);
  // Cached input is deliberately charged at the undiscounted input rate.
  const tokenMicroChf = amount(quote.model, input, output, quote.audioInput, quote.at);
  const searchMicroChf = searchQueries * GEMINI_SEARCH_COST_POLICY.microChfPerQuery;
  const chargedMicroChf = tokenMicroChf + searchMicroChf;
  if (!Number.isSafeInteger(chargedMicroChf)) return null;
  return { chargedMicroChf, tokenMicroChf, searchQueries, searchMicroChf, ...(proven === null ? { searchQueriesProvisioned: true as const } : {}) };
}
export function observedGeminiCost(quote: GeminiCostQuote, response: any): number | null {
  return observedGeminiCostDetails(quote, response)?.chargedMicroChf ?? null;
}
