// Free regression replay: recorded Gemini responses, real read-only supplier HTTP.
// This never creates a Gemini transport or reads credentials. It does not establish
// that a new Gemini generation will follow a revised prompt or output schema.
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBrewerHarness } from '../functions/lib/brewerHarness.js';
import { BrewerBudgetError } from '../functions/lib/brewerLimits.js';
import { shoppingFlashEvaluationContext, SHOPPING_FLASH_EVAL_LIMITS } from './eval-brewer-shopping-flash.mjs';

const defaultInput = '.codex-remote-attachments/brewer-shopping-flash-eval/report.json';
const defaultOutput = '.codex-remote-attachments/brewer-shopping-flash-eval/replay-verified.json';
const kindOf = body => body.tools?.some(tool => tool.googleSearch || tool.google_search) ? 'research'
  : body.generationConfig?.responseSchema?.properties?.approved ? 'review' : 'analysis';

export async function replayShoppingFlashEvaluation({ inputPath = defaultInput, outputPath = defaultOutput, onEvent } = {}) {
  const sourcePath = resolve(inputPath), destination = resolve(outputPath);
  if (sourcePath.toLowerCase() === destination.toLowerCase()) throw Error('Le rapport réel original doit rester immuable.');
  const sourceText = await readFile(sourcePath, 'utf8'), recorded = JSON.parse(sourceText);
  if (recorded.scenario !== 'synthetic-cascade-pellets-100g-switzerland' || !Array.isArray(recorded.calls))
    throw Error('Ce replay exige le rapport synthétique Cascade enregistré par le test dédié.');
  const researchers = recorded.result?.evidence?.filter(entry => entry.name === 'find_brewing_suppliers')
    .flatMap(entry => entry.data?.researchers ?? []) ?? [];
  const queues = Object.fromEntries(['analysis', 'research', 'review'].map(kind => [kind,
    recorded.calls.filter(call => call.kind === kind && Array.isArray(call.output) && !call.error)]));
  const consumed = [], progress = [];
  let researchIndex = 0, failure, result;
  const began = Date.now();
  const generate = async (model, body) => {
    const kind = kindOf(body), next = queues[kind].shift();
    if (!next || consumed.length >= SHOPPING_FLASH_EVAL_LIMITS.attemptedCalls)
      throw new BrewerBudgetError('ai-question-limit', `Replay terminé : aucune réponse ${kind} enregistrée supplémentaire. Aucun appel Gemini autorisé.`);
    if (!model.includes('flash') || !next.model.includes('flash'))
      throw new BrewerBudgetError('ai-question-limit', 'Le replay de ce scénario doit rester Flash.');
    const usedResearchIndex = kind === 'research' ? researchIndex++ : -1;
    const candidate = { content: { role: 'model', parts: structuredClone(next.output) } };
    if (kind === 'research') {
      const research = researchers[usedResearchIndex];
      if (!research) throw new BrewerBudgetError('ai-question-limit', 'Métadonnées de recherche enregistrées manquantes.');
      candidate.groundingMetadata = {
        groundingChunks: (research.candidates ?? []).map(source => ({ web: { title: source.title, uri: source.url } })),
        webSearchQueries: structuredClone(next.groundingQueries ?? [])
      };
    }
    consumed.push({ recordedAttempt: next.attempt, kind, model, generated: false });
    await onEvent?.({ kind, replayed: consumed.length });
    return { candidates: [candidate], usageMetadata: structuredClone(next.usage ?? {}) };
  };
  try {
    result = await runBrewerHarness(shoppingFlashEvaluationContext(), recorded.question, [], generate, {
      mode: 'fast', deadlineMs: SHOPPING_FLASH_EVAL_LIMITS.deadlineMs,
      onProgress: async (stage, detail) => { progress.push({ stage, detail }); }
    });
  } catch (error) { failure = String(error?.message ?? error).slice(0, 1500); }
  const evidence = result?.evidence?.filter(entry => entry.name === 'find_brewing_suppliers') ?? [];
  const products = evidence.flatMap(entry => entry.products ?? []);
  const selected = result?.advice?.productUrls ?? [];
  const sourceProducts = recorded.result?.evidence?.filter(entry => entry.name === 'find_brewing_suppliers')
    .flatMap(entry => entry.products ?? []) ?? [];
  const checks = {
    completed: Boolean(result), noPaidGeminiCall: true,
    originalAllProductsMatchRequestedHop: sourceProducts.length > 0 && sourceProducts.every(product => /\bcascade\b/i.test(product.name)),
    allProductsMatchRequestedHop: products.length > 0 && products.every(product => /\bcascade\b/i.test(product.name)),
    exact100gPack: products.some(product => /\bcascade\b/i.test(product.name) && /100\s*g\b/i.test(`${product.name} ${product.packageLabel ?? ''}`)),
    onlySelectedProductUrlsDisplayed: selected.length > 0 && products.every(product => selected.includes(product.url)) &&
      selected.every(url => products.some(product => product.url === url)),
    pagesReadAgain: products.length > 0 && products.every(product => product.verifiedBy === 'product-page' && product.checkedAt >= began),
    noUnsupportedStockClaimInCards: products.every(product => product.availability !== 'in_stock' ||
      ['visible-text', 'structured-data'].includes(product.stockEvidence)),
    allRecordedStepsReplayed: consumed.length === recorded.calls.filter(call => Array.isArray(call.output) && !call.error).length,
    reviewReplayed: Boolean(result?.reviewed) && consumed.some(call => call.kind === 'review'),
    noStockOrRecipeWrite: !result?.proposal
  };
  const report = {
    executionKind: 'RECORDED_RESPONSE_REPLAY_NOT_A_REAL_PAID_RUN',
    runAt: new Date(began).toISOString(), elapsedMs: Date.now() - began,
    ok: !failure && Object.entries(checks).filter(([key]) => key !== 'originalAllProductsMatchRequestedHop').every(([, value]) => value),
    failure: failure ?? null, sourcePath, sourceSha256: createHash('sha256').update(sourceText).digest('hex'),
    originalRunAt: recorded.runAt, originalRunCostMicroChf: recorded.accounting?.observedMicroChf ?? null,
    paidGeminiCallsThisReplay: 0, paidGeminiCostMicroChfThisReplay: 0,
    limitation: `${consumed.length} réponses Gemini ont été reprises sans modification depuis le rapport réel. Les fiches vendeur sont relues par HTTP. Ce test vérifie le routage et le filtrage serveur corrigés; aucune nouvelle génération ni nouvelle relecture Gemini n’a été exécutée.`,
    checks, products, selectedProductUrls: selected,
    originalRejectedProducts: sourceProducts.filter(product => !/\bcascade\b/i.test(product.name)).map(({ name, url }) => ({ name, url })),
    supplierChecks: evidence.flatMap(entry => entry.data?.checks ?? []), result: result ?? null, consumed, progress
  };
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(report, null, 2));
  return { ...report, reportPath: destination };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const report = await replayShoppingFlashEvaluation({ inputPath: process.argv[2] ?? defaultInput, outputPath: process.argv[3] ?? defaultOutput,
    onEvent: event => console.log(`Réponse enregistrée ${event.replayed} · ${event.kind}`) });
  console.log(JSON.stringify({ executionKind: report.executionKind, ok: report.ok, checks: report.checks,
    paidGeminiCallsThisReplay: report.paidGeminiCallsThisReplay, failure: report.failure, reportPath: report.reportPath }, null, 2));
  if (!report.ok) process.exitCode = 1;
}
