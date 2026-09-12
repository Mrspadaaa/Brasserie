// Voluntary real integration probe. Never imported by Vitest or normal tests.
// Build Functions first. A caller may inject the production monthly-budget wrapper;
// the guard below still applies to every provider attempt, including fallback calls.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBrewerHarness, geminiTransport } from '../functions/lib/brewerHarness.js';
import { BrewerBudgetError } from '../functions/lib/brewerLimits.js';
import { GEMINI_COST_POLICY, quoteGeminiCost, observedGeminiCostDetails } from '../functions/lib/geminiCosts.js';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

export const SHOPPING_FLASH_EVAL_LIMITS = Object.freeze({
  attemptedCalls: 10, groundedCalls: 3, outputTokens: 32_000,
  outputTokensPerCall: 3_200, provisionMicroChf: 1_500_000, deadlineMs: 120_000
});
const DEFAULT_REPORT = '.codex-remote-attachments/brewer-flash-expanded-eval/report.json';
const question = 'Je dois acheter un sachet de houblon Cascade en pellets de 100 g pour un prochain brassin en Suisse. Cherche le produit exact chez deux boutiques si possible. Donne les vrais liens directs d’achat et le conditionnement; ne confirme le stock que si la page produit le prouve. Mon stock personnel est vide. Je ne demande ni adaptation de recette ni calcul de dosage.';
const fixture = () => ({
  inventory: [{ id: 'SYNTHETIC-CASCADE', name: 'Cascade pellets', category: 'houblon', unit: 'g', currentStock: 0 }],
  material: [], waterSources: [], phase: 'Préparation des achats', now: Date.now(),
  provenance: ['Scénario d’intégration synthétique. Aucune donnée de production, aucun client, aucune écriture de stock.'],
  editableTargets: []
});
export { question as shoppingFlashEvaluationQuestion, fixture as shoppingFlashEvaluationContext };
const textParts = (response) => response?.candidates?.[0]?.content?.parts
  ?.filter(part => !part.thought)
  .map(part => part.functionCall ? { functionCall: part.functionCall } : { text: part.text }) ?? [];
const limitError = message => new BrewerBudgetError('ai-question-limit', `Test réel arrêté : ${message}`);
const sourceUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password &&
    !/(^|\.)(google|googleapis|vertexaisearch)\./i.test(url.hostname) && url.pathname !== '/'; }
  catch { return false; }
};

/** Only the caller's injected transport may contact Gemini. The monetary limit is
 * an application provision, not a Cloud billing guarantee: Google may fan out a
 * grounded request into several searches. Observed overspend is reported in full.
 * Parallel calls reserve synchronously before any await, so agents cannot spend the
 * same remaining test allowance. Unknown charges keep their whole reservation.
 */
export async function runShoppingFlashEvaluation({ generate, confirmPaidAi = false, reportPath = DEFAULT_REPORT, onEvent } = {}) {
  if (confirmPaidAi !== true) throw Error('Ce test réel exige confirmPaidAi: true et un budget accepté.');
  if (typeof generate !== 'function') throw Error('Un transport Gemini explicitement autorisé est requis.');
  const began = Date.now(), calls = [], progress = [], diagnostics = [];
  const scenarioContext = fixture(), contextBefore = JSON.stringify(scenarioContext);
  let groundedCalls = 0, reservedOutputTokens = 0, provisionedMicroChf = 0;
  const boundedGenerate = async (model, body, signal) => {
    if (!/^gemini-[\w.-]*flash[\w.-]*$/.test(model)) throw limitError(`modèle hors Flash (${model}).`);
    if (calls.length >= SHOPPING_FLASH_EVAL_LIMITS.attemptedCalls) throw limitError('dix appels ont déjà été tentés.');
    const grounded = (body.tools ?? []).some(tool => tool.googleSearch || tool.google_search);
    if (grounded && groundedCalls >= SHOPPING_FLASH_EVAL_LIMITS.groundedCalls) throw limitError('trois recherches ont déjà été tentées.');
    const remaining = SHOPPING_FLASH_EVAL_LIMITS.outputTokens - reservedOutputTokens;
    if (remaining < 256) throw limitError('budget cumulé de sortie épuisé.');
    const maxOutputTokens = Math.min(body.generationConfig?.maxOutputTokens ?? 3_200,
      SHOPPING_FLASH_EVAL_LIMITS.outputTokensPerCall, remaining);
    const quote = quoteGeminiCost(model, { ...body, generationConfig: { ...body.generationConfig, maxOutputTokens } });
    if (provisionedMicroChf + quote.reservedMicroChf > SHOPPING_FLASH_EVAL_LIMITS.provisionMicroChf)
      throw limitError('la provision nécessaire dépasse le budget de test de 1,50 CHF.');
    const kind = grounded ? 'research' : body.generationConfig?.responseSchema?.properties?.approved ? 'review' : 'analysis';
    const reviewRole = kind === 'review' ? ((body.systemInstruction?.parts ?? [])
      .some(part => part.text?.includes('utilité concrète pour ce brasseur')) ? 'practical' : 'technical') : undefined;
    const call = { attempt: calls.length + 1, model, kind, ...(reviewRole ? { reviewRole } : {}),
      maxOutputTokens, reservedMicroChf: quote.reservedMicroChf,
      searchQueriesReserved: quote.searchQueriesReserved, startedAt: new Date().toISOString() };
    calls.push(call);
    reservedOutputTokens += maxOutputTokens;
    provisionedMicroChf += quote.reservedMicroChf;
    if (grounded) groundedCalls++;
    await onEvent?.({ event: 'provider-attempt', attempt: call.attempt, kind: call.kind, model });
    try {
      const response = await generate(model, quote.body, signal);
      const observed = observedGeminiCostDetails(quote, response);
      Object.assign(call, { elapsedMs: Date.now() - Date.parse(call.startedAt), usage: response.usageMetadata ?? null,
        observedCost: observed, output: textParts(response),
        groundingQueries: grounded ? response.candidates?.[0]?.groundingMetadata?.webSearchQueries ?? null : [],
        costUncertain: observed === null });
      if (observed !== null) provisionedMicroChf += observed.chargedMicroChf - quote.reservedMicroChf;
      return response;
    } catch (error) {
      call.error = String(error?.message ?? error).slice(0, 1000);
      call.elapsedMs = Date.now() - Date.parse(call.startedAt);
      call.costUncertain = true;
      throw error;
    }
  };
  let result, failure;
  try {
    result = await runBrewerHarness(scenarioContext, question, [], boundedGenerate, {
      mode: 'fast', deadlineMs: SHOPPING_FLASH_EVAL_LIMITS.deadlineMs,
      onProgress: async (stage, detail, model) => { progress.push({ stage, detail, model }); },
      onDiagnostic: async value => { diagnostics.push(structuredClone(value)); }
    });
  } catch (error) { failure = String(error?.message ?? error).slice(0, 1500); }
  const supplierEvidence = result?.evidence?.filter(entry => entry.name === 'find_brewing_suppliers') ?? [];
  const products = supplierEvidence.flatMap(entry => entry.products ?? []);
  const allowedLinks = new Set(products.flatMap(product => [product.url, product.canonicalUrl].filter(Boolean)));
  const adviceLinks = [...JSON.stringify(result?.advice ?? {}).matchAll(/https:\/\/[^\s"<>\\]+/g)]
    .map(match => match[0].replace(/[).,;]+$/, ''));
  const checks = {
    completed: Boolean(result), onlyFlash: calls.length > 0 && calls.every(call => call.model.includes('flash')),
    threeIndependentSearches: calls.filter(call => call.kind === 'research' && !call.error).length === 3 &&
      new Set(supplierEvidence.flatMap(entry => entry.data?.researchers ?? []).map(researcher => researcher.role)).size === 3,
    twoIndependentReviewers: Boolean(result?.reviewed) &&
      new Set(calls.filter(call => call.kind === 'review' && !call.error).map(call => call.reviewRole)).size === 2,
    supplierToolUsed: Boolean(result?.trace?.some(entry => entry.name === 'find_brewing_suppliers' && entry.resultId)),
    realProductLink: products.some(product => sourceUrl(product.url) && product.verifiedBy === 'product-page'),
    cascadeProduct: products.some(product => /cascade/i.test(product.name)),
    allProductsMatchRequestedHop: products.length > 0 && products.every(product => /\bcascade\b/i.test(product.name)),
    requestedPackage: products.some(product => /cascade/i.test(product.name) && /100\s*g\b/i.test(`${product.name} ${product.packageLabel ?? ''}`)),
    packagingReported: products.some(product => /cascade/i.test(product.name) && Boolean(product.packageLabel?.trim())),
    allProductsVerified: products.length > 0 && products.every(product => sourceUrl(product.url) && product.verifiedBy === 'product-page' &&
      Number.isFinite(product.checkedAt) && product.checkedAt >= began &&
      (product.availability !== 'in_stock' || ['visible-text', 'structured-data'].includes(product.stockEvidence))),
    noInventedAdviceLinks: adviceLinks.every(url => allowedLinks.has(url)),
    noStockOrRecipeWrite: !result?.proposal && JSON.stringify(scenarioContext) === contextBefore,
    requestCapsRespected: calls.length <= SHOPPING_FLASH_EVAL_LIMITS.attemptedCalls && groundedCalls <= SHOPPING_FLASH_EVAL_LIMITS.groundedCalls &&
      reservedOutputTokens <= SHOPPING_FLASH_EVAL_LIMITS.outputTokens,
    provisionWithinLimit: provisionedMicroChf <= SHOPPING_FLASH_EVAL_LIMITS.provisionMicroChf
  };
  const report = {
    scenario: 'synthetic-cascade-pellets-100g-switzerland', question, runAt: new Date(began).toISOString(),
    elapsedMs: Date.now() - began, ok: !failure && Object.values(checks).every(Boolean), failure: failure ?? null,
    limits: SHOPPING_FLASH_EVAL_LIMITS, checks,
    accounting: { revision: GEMINI_COST_POLICY.revision, calls: calls.length, groundedCalls,
      outputTokensReserved: reservedOutputTokens,
      promptTokens: calls.reduce((sum, call) => sum + (call.usage?.promptTokenCount ?? 0), 0),
      totalTokens: calls.reduce((sum, call) => sum + (call.usage?.totalTokenCount ?? 0), 0),
      costMicroChfIncludingUncertainReservations: provisionedMicroChf,
      observedMicroChf: calls.reduce((sum, call) => sum + (call.observedCost?.chargedMicroChf ?? 0), 0),
      costUncertain: calls.some(call => call.costUncertain),
      note: 'Provision conservatrice au tarif de l’application, recherche incluse. Aucun crédit gratuit présumé. Ce n’est pas la facture Google; le nombre de requêtes internes Google ne se borne pas côté client.' },
    observations: { exactRequestedPackFound: products.some(product => /cascade/i.test(product.name) && /100\s*g\b/i.test(`${product.name} ${product.packageLabel ?? ''}`)),
      packageReview: 'Contrôle humain requis : une vente au gramme ou 100 unités ne constitue pas un sachet de 100 g. Une offre différente doit rester une alternative explicite.' },
    products, supplierChecks: supplierEvidence.flatMap(entry => entry.data?.checks ?? []),
    result: result ?? null, calls, progress, diagnostics
  };
  const destination = resolve(reportPath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(report, null, 2));
  return { ...report, reportPath: destination };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  requirePaidAiTestOptIn({ label: 'trois chercheurs et deux relecteurs Flash pour les achats brasseur',
    command: 'node scripts/eval-brewer-shopping-flash.mjs --confirm-paid-ai' });
  if (!process.env.GEMINI_API_KEY) throw Error('GEMINI_API_KEY requis dans l’environnement; ne jamais écrire la clé dans le script.');
  const report = await runShoppingFlashEvaluation({ confirmPaidAi: true,
    generate: geminiTransport(process.env.GEMINI_API_KEY), reportPath: process.env.BREWER_SHOPPING_REPORT ?? DEFAULT_REPORT });
  console.log(JSON.stringify({ ok: report.ok, checks: report.checks, accounting: report.accounting, reportPath: report.reportPath }, null, 2));
  if (!report.ok) process.exitCode = 1;
}
