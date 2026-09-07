// Opt-in live evaluation. Build Functions first; key is read from environment only.
import { runBrewerHarness, geminiTransport } from '../functions/lib/brewerHarness.js';
import { context, cases } from './fixtures/brewerCases.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
if (!process.env.GEMINI_API_KEY)
  throw Error('GEMINI_API_KEY required server-side for this opt-in evaluation');
const results = [],
  output = '.codex-remote-attachments/brewer-harness-eval';
await mkdir(output, { recursive: true });
const selected = process.env.BREWER_EVAL_CASES
  ? cases.filter((c) => process.env.BREWER_EVAL_CASES.split(',').includes(c.id))
  : cases;
let next = 0;
async function worker() {
  while (next < selected.length) {
    const scenario = selected[next++],
      c = context(),
      start = Date.now();
    if (scenario.phase) {
      c.phase = scenario.phase;
      c.batch = { status: scenario.phase, volumeL: 24, gravityLog: [] };
    }
    if (scenario.fermentables) c.recipe.fermentables = scenario.fermentables;
    try {
      const result = await runBrewerHarness(
        c,
        scenario.question,
        scenario.history ?? [],
        geminiTransport(process.env.GEMINI_API_KEY),
        { mode: process.env.BREWER_EVAL_MODE === 'deep' ? 'deep' : 'auto' }
      );
      await writeFile(
        `${output}/${scenario.id}.json`,
        JSON.stringify({ scenario, ...result }, null, 2)
      );
      if (
        scenario.id === 'supplier-followup' &&
        !result.trace.some((t) => t.name === 'find_brewing_suppliers' && t.resultId)
      )
        throw Error('La demande de fournisseur doit déclencher une recherche réelle.');
      results.push({
        id: scenario.id,
        ok: true,
        elapsedMs: Date.now() - start,
        model: result.model,
        reviewModel: result.reviewModel,
        tools: result.trace.map((t) => t.name)
      });
    } catch (e) {
      results.push({ id: scenario.id, ok: false, error: e.message });
    }
    console.log(results.at(-1));
  }
}
await Promise.all([worker(), worker()]);
await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
