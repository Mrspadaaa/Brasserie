// Opt-in live evaluation. Build Functions first; key is read from environment only.
import { runBrewerHarness, geminiTransport } from '../functions/lib/brewerHarness.js';
import { context, cases } from './fixtures/brewerCases.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

requirePaidAiTestOptIn({
  label: 'évaluation réelle du compagnon brasseur',
  command: 'npm run test:ai:eval -- --confirm-paid-ai'
});

if (!process.env.GEMINI_API_KEY)
  throw Error('GEMINI_API_KEY required server-side for this opt-in evaluation');
const results = [],
  output = '.codex-remote-attachments/brewer-harness-eval';
await mkdir(output, { recursive: true });
const selected = process.env.BREWER_EVAL_CASES
  ? cases.filter((c) => process.env.BREWER_EVAL_CASES.split(',').includes(c.id))
  : cases;
const requestedMode = ['fast', 'auto', 'deep'].includes(process.env.BREWER_EVAL_MODE)
  ? process.env.BREWER_EVAL_MODE : 'auto';
let next = 0;
async function worker() {
  while (next < selected.length) {
    const scenario = selected[next++],
      c = context(),
      start = Date.now(),
      modelCalls = [];
    if (scenario.phase) {
      c.phase = scenario.phase;
      c.batch = { status: scenario.phase, volumeL: 24, gravityLog: [] };
    }
    if (scenario.fermentables) c.recipe.fermentables = scenario.fermentables;
    if (scenario.editableTargets) c.editableTargets = scenario.editableTargets;
    try {
      const result = await runBrewerHarness(
        c,
        scenario.question,
        scenario.history ?? [],
        async (model, body, signal) => {
          const began = Date.now();
          const response = await geminiTransport(process.env.GEMINI_API_KEY)(model, body, signal);
          modelCalls.push({
            model,
            elapsedMs: Date.now() - began,
            kind: body.tools?.[0]?.googleSearch
              ? 'web'
              : body.generationConfig?.responseSchema?.properties?.approved
                ? 'review'
                : 'analysis',
            output: response.candidates?.[0]?.content?.parts
              ?.filter((p) => !p.thought)
              .map((p) => (p.functionCall ? { functionCall: p.functionCall } : { text: p.text }))
          });
          return response;
        },
        { mode: requestedMode }
      );
      await writeFile(
        `${output}/${scenario.id}.json`,
        JSON.stringify({ scenario, modelCalls, ...result }, null, 2)
      );
      if (
        scenario.id === 'edit-recipe' &&
        (!result.proposal?.changes.some((ch) => ch.path === 'hops.0.alpha' && ch.value === 5.2) ||
          result.proposal?.status)
      )
        throw Error('La correction du champ alpha doit rester une proposition à valider.');
      if (
        scenario.id === 'supplier-followup' &&
        !result.trace.some((t) => t.name === 'find_brewing_suppliers' && t.resultId)
      )
        throw Error('La demande de fournisseur doit déclencher une recherche réelle.');
      if (
        scenario.id === 'supplier-followup' &&
        !result.evidence.some(
          (e) => e.name === 'find_brewing_suppliers' && e.model?.includes('flash')
        )
      )
        throw Error('La recherche web doit être réalisée avec Gemini Flash.');
      if (
        scenario.id === 'routing-complex' && requestedMode !== 'deep' &&
        modelCalls.some(call => !call.model.includes('flash'))
      )
        throw Error('Le compagnon doit conserver Flash, y compris pour les arbitrages en mode auto.');
      results.push({
        id: scenario.id,
        ok: true,
        elapsedMs: Date.now() - start,
        model: result.model,
        reviewModel: result.reviewModel,
        reviewReason: result.reviewReason,
        tools: result.trace.map((t) => t.name)
      });
    } catch (e) {
      await writeFile(
        `${output}/${scenario.id}-failure.json`,
        JSON.stringify({ scenario, error: e.message, modelCalls }, null, 2)
      );
      results.push({ id: scenario.id, ok: false, error: e.message });
    }
    console.log(results.at(-1));
  }
}
await Promise.all([worker(), worker()]);
await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
