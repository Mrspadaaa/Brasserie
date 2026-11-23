/**
 * Test spécial Gemini réel d'IA-B (décision 68) — hors `npm test`, lancé explicitement, payant.
 *
 * Il prouve le routage serveur par usage, par le chemin de l'app, sur l'émulateur Firestore
 * d'un projet `demo-*`, avec des fixtures synthétiques. Aucun modèle n'est forcé : le serveur
 * choisit (`functions/src/models.ts`), le test vérifie le modèle envoyé et celui qui a répondu.
 * - `--scenario=coa` : lecture d'un COA fictif (`tests/fixtures/hop-coa-g38.pdf`) par `aiTask`,
 *   tâche `readHopCoa`, Rapide → 3.5 Flash-Lite `minimal` ;
 * - `--scenario=diagnostic` : diagnostic d'une fermentation bloquée (cas `diag-bloquee` du banc
 *   #91, recopié ici) par `aiTask`, tâche `diagnoseBatch`, Rapide → 3.5 Flash-Lite `low` ;
 * - `--scenario=recherche` : recherche d'une référence (`lookup_brewing_reference`) par le vrai
 *   compagnon (`runBrewerHarness`). Ses décisions et sa relecture sont simulées, sans réseau ; seule
 *   la recherche part, par le transport (`geminiTransport`) et le budget mensuel de l'app
 *   → 3.5 Flash-Lite `minimal` ;
 * - `--scenario=repli` : comme `coa`, mais la réponse Flash-Lite est remplacée localement par une
 *   réponse coupée (`MAX_TOKENS`) : aucun appel lite ne part ni n'est compté. La nouvelle tentative
 *   réelle part sur 3.8 `low` ; le registre de l'émulateur garde la tentative lite `unusable`.
 * Au plus 2 appels réels par lancement (la nouvelle tentative 3.8 comprise), 1 pour `repli` ;
 * `--cap=1` le réduit encore.
 *
 *   npx firebase emulators:exec --only firestore --project demo-iab \
 *     "npx vite-node --config vitest.config.ts scripts/ia-b-gemini-live.ts -- --scenario=coa --confirm-paid-ai"
 *
 * Répétition sans réseau ni coût : même commande avec `--simulate` au lieu de `--confirm-paid-ai`
 * (fournisseur simulé, journal temporaire).
 *
 * Garde-fous : ceux de `gemini38LiveCore.ts` (modèles résolus dans la liste blanche, compteur de
 * gemini-journal.md réservé sous verrou avant l'envoi, 5 par lancement et 40 au total, autre hôte ou
 * modèle refusé), émulateur `demo-*` obligatoire, clé lue de l'environnement ou de
 * `functions/.secret.local`, jamais affichée ni journalisée.
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';
import { appendLiveRow, guardLiveFetch, liveEndpoint, liveJournalRow, livePreflight, reserveLiveCall, type LiveCall } from './gemini38LiveCore';
import { GEMINI_LITE_MODEL, GEMINI_MODEL, geminiAttempts } from '../functions/src/models';
import { aiBudgetMonth } from '../functions/src/geminiCosts';

const WORK = 'work/finalisation-tickets-2026-10-08';
const ACCOUNT = 'ia-b-live-test@example.invalid';
const ISSUE = '#91 (IA-B)';
const COA = 'tests/fixtures/hop-coa-g38.pdf';
const QUERY = 'Fermentis SafAle S-04 : plage de température de fermentation et dose d’ensemencement publiées par le fabricant';
/** Cas `diag-bloquee` du banc #91 (tests/fixtures/gemini-usage-bench/cases.json), données fictives. */
const STUCK = {
  recipe: { name: 'Pale de banc (fictive)', style: 'American Pale Ale', volumeL: 20, ogTarget: 1.052, fgTarget: 1.012,
    yeast: { name: 'SafAle US-05', lab: 'Fermentis', attenuationPct: 81, tempMinC: 18, tempMaxC: 26 } },
  currentStep: 'fermentation primaire', phase: 'fermentation',
  readings: [
    { date: '2026-10-01', gravity: 1.052, tempC: 19, note: 'ensemencement 11.5 g réhydratés' },
    { date: '2026-10-03', gravity: 1.03, tempC: 19 },
    { date: '2026-10-05', gravity: 1.024, tempC: 14, note: 'cave refroidie par la météo' },
    { date: '2026-10-08', gravity: 1.024, tempC: 13 },
    { date: '2026-10-10', gravity: 1.024, tempC: 13 }
  ],
  notes: ['Plus d’activité au barboteur depuis le 06.10.']
};
const SCENARIOS = {
  coa: { label: 'readHopCoa (Rapide)', usage: 'readHopCoa', expected: GEMINI_LITE_MODEL, maxCalls: 2 },
  diagnostic: { label: 'diagnoseBatch (Rapide)', usage: 'diagnoseBatch', expected: GEMINI_LITE_MODEL, maxCalls: 2 },
  recherche: { label: 'lookup_brewing_reference (compagnon)', usage: 'lookup_brewing_reference', expected: GEMINI_LITE_MODEL, maxCalls: 2 },
  repli: { label: 'readHopCoa, Flash-Lite coupé simulé → 3.8 réel', usage: 'readHopCoa', expected: GEMINI_MODEL, maxCalls: 1 }
} as const;
type ScenarioName = keyof typeof SCENARIOS;
const args = process.argv.slice(2);
const simulate = args.includes('--simulate');

function stop(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

const scenarioArg = args.find(arg => arg.startsWith('--scenario'));
const scenarioName = scenarioArg?.startsWith('--scenario=') ? scenarioArg.slice('--scenario='.length) : '';
if (!Object.hasOwn(SCENARIOS, scenarioName))
  stop(`Scénario inconnu : « ${scenarioArg} » (--scenario=coa, diagnostic, recherche ou repli). Aucun appel.`);
const name = scenarioName as ScenarioName, scenario = SCENARIOS[name];
const capArg = args.find(arg => arg.startsWith('--cap'));
if (capArg !== undefined && capArg !== '--cap=1') stop(`Option inconnue : « ${capArg} » (seul --cap=1 est admis). Aucun appel.`);
const requestedCap = capArg === undefined ? scenario.maxCalls : 1;
const route = geminiAttempts(scenario.usage);
const TEST = `ia-b-gemini-live.ts · ${scenario.label}`;
const COMMAND = `npx firebase emulators:exec --only firestore --project demo-iab "npx vite-node --config vitest.config.ts scripts/ia-b-gemini-live.ts -- --scenario=${name} --confirm-paid-ai"`;

function localKey(): string | undefined {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const file = 'functions/.secret.local';
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find(entry => /^\s*GEMINI_API_KEY\s*=/.test(entry));
  return line?.slice(line.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || undefined;
}

const urlOf = (input: RequestInfo | URL) => typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
const modelOf = (input: RequestInfo | URL) => /\/models\/([^:/?]+):generateContent$/.exec(urlOf(input))?.[1];
const reply = (model: string, finishReason: string, text: string, extra: Record<string, unknown> = {}) => new Response(JSON.stringify({
  modelVersion: model,
  candidates: [{ finishReason, content: { role: 'model', parts: [{ text }] }, ...extra }],
  usageMetadata: { promptTokenCount: 1200, candidatesTokenCount: 200, totalTokenCount: 1400 }
}), { status: 200, headers: { 'Content-Type': 'application/json' } });
/** Rehearsal provider, without any network or cost. */
const simulatedProvider = (async (input: RequestInfo | URL) => {
  const model = modelOf(input) ?? '?';
  if (name === 'recherche') return reply(model, 'STOP', 'Résumé simulé : fermentation 18-26 °C, 50-80 g/hl. Source : fiche Fermentis.', {
    groundingMetadata: { webSearchQueries: ['safale s-04 fermentis'], groundingChunks: [{ web: { title: 'fermentis.com', uri: 'https://example.invalid/fermentis-s-04' } }] }
  });
  if (name === 'diagnostic') return reply(model, 'STOP', JSON.stringify({ verdict: 'Fermentation bloquée par le froid (simulé).', severity: 'agir',
    apparentAttenuationPct: 53.8, immediateAction: 'Remonter la cuve à 19 °C.', causes: [{ cause: 'Température trop basse, 13 °C', action: 'Réchauffer' }] }));
  return reply(model, 'STOP', JSON.stringify({ found: true, lotNumber: 'G38-LOT-2025-017', harvestYear: 2025, form: 'pellet', analysis: [], note: 'Réponse simulée.' }));
}) as typeof fetch;
/** `repli`: the Flash-Lite answer is cut locally; it never reaches the guard, the network or the counter. */
const cutLite = () => reply(GEMINI_LITE_MODEL, 'MAX_TOKENS', '{"found":true,"lotNumber":"G38-LOT', {});

const key = simulate ? 'simulated-key-not-a-secret' : localKey();
if (!key) stop('Aucune clé Gemini locale : ni GEMINI_API_KEY dans l’environnement, ni functions/.secret.local. Aucun appel.');
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const project = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
if (!emulator || !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(emulator) || !project?.startsWith('demo-'))
  stop('Chemin non isolé de la production : lancer sous l’émulateur Firestore d’un projet demo-*. Aucun appel.');

const journalPath = simulate ? join(mkdtempSync(join(tmpdir(), 'ia-b-live-')), 'gemini-journal.md') : `${WORK}/gemini-journal.md`;
const registerPath = simulate ? journalPath.replace(/gemini-journal\.md$/, 'registre.md') : `${WORK}/IA-B/registre-appels.md`;
const lockDir = simulate ? `${journalPath}.lock` : `${WORK}/locks/gemini-journal`;
if (simulate) writeFileSync(journalPath, readFileSync(`${WORK}/gemini-journal.md`, 'utf8'));

// Without any network: every routed model in the server whitelist, the counter, then the paid opt-in.
let launchCap = 0;
try {
  launchCap = Math.min(requestedCap, livePreflight(route.map(attempt => attempt.model), readFileSync(journalPath, 'utf8'), () => {
    if (!simulate) requirePaidAiTestOptIn({ label: `Gemini réel · IA-B · ${scenario.label}`, command: COMMAND });
  }).cap);
} catch (error) {
  stop((error as Error).message);
}
if (route[0].model !== (name === 'repli' ? GEMINI_LITE_MODEL : scenario.expected))
  stop(`Routage inattendu pour ${scenario.usage} : ${route.map(attempt => attempt.model).join(' → ')}. Aucun appel.`);

process.env.GEMINI_API_KEY = key;
process.env.AUTHORIZED_ACCOUNTS = ACCOUNT;

const fromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = await import(pathToFileURL(fromFunctions.resolve('firebase-admin/app')).href);
const { getFirestore } = await import(pathToFileURL(fromFunctions.resolve('firebase-admin/firestore')).href);
initializeApp({ projectId: project });
const db = getFirestore();
await db.doc('brewerAiControls/current').set({ paused: false, monthlyLimitMicroChf: 10_000_000 });
const month = aiBudgetMonth();
const ledgerBefore = new Set((await db.collection(`brewerAiCosts/${month}/calls`).get()).docs.map((doc: any) => doc.id));

// What was sent and received, for the checks below: settings and counts only, never the key nor search queries.
const sent: Array<{ model?: string; body: any; json?: any; injected?: true }> = [];
const realFetch = globalThis.fetch;
const provider = (simulate ? simulatedProvider : realFetch) as typeof fetch;
const observing = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const host = new URL(urlOf(input)).hostname;
  if (host === '127.0.0.1' || host === 'localhost' || host === '::1') return realFetch(input, init);
  const entry: (typeof sent)[number] = { model: modelOf(input), body: JSON.parse(String(init?.body ?? '{}')) };
  sent.push(entry);
  const response = await provider(input, init);
  entry.json = await response.clone().json().catch(() => undefined);
  return response;
}) as typeof fetch;
const record = (call: LiveCall) => {
  const outcome = call.error ? `échec réseau (${call.error})`
    : `HTTP ${call.status}, ${call.latencyMs} ms, demandé ${call.model}, réflexion ${call.thinkingLevel ?? 'non fournie'}, fin ${call.finishReason ?? 'non fournie'}${simulate ? ', simulé' : ''}`;
  appendLiveRow(journalPath, lockDir, liveJournalRow(call, ISSUE, TEST, outcome));
};
const guard = guardLiveFetch(observing, { cap: launchCap, reserve: () => reserveLiveCall(journalPath, lockDir), onCall: record });
const injecting = (async (input: RequestInfo | URL, init?: RequestInit) => {
  if (name === 'repli' && urlOf(input) === liveEndpoint(GEMINI_LITE_MODEL)) {
    sent.push({ model: GEMINI_LITE_MODEL, body: JSON.parse(String(init?.body ?? '{}')), injected: true });
    return cutLite();
  }
  return guard.fetch(input, init);
}) as typeof fetch;

const auth = { uid: 'ia-b-live-test', token: { email: ACCOUNT, email_verified: true } };
const started = performance.now();
let result: any;
globalThis.fetch = injecting;
try {
  if (name === 'recherche') {
    const { runBrewerHarness, geminiTransport } = await import('../functions/src/brewerHarness');
    const { runWithMonthlyAiBudget } = await import('../functions/src/monthlyAiBudget');
    const transport = geminiTransport(key);
    const advice = { level: 'info', summary: 'La fiche fabricant donne la plage de la S-04.', action: 'Garde la plage publiée par Fermentis.',
      why: 'La fiche du fabricant fait foi.', watch: 'Relève la température de la cuve.', question: '', evidenceIds: ['E1'] };
    let analyses = 0;
    // Only the web lookup leaves; the companion's own decisions and its review are simulated locally.
    const generate = async (model: string, body: any, signal: AbortSignal) => {
      if (body.tools?.some((tool: any) => tool.googleSearch))
        return runWithMonthlyAiBudget(model, body, normalized => transport(model, normalized, signal));
      if (body.generationConfig?.responseSchema?.properties?.approved)
        return { candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] };
      const call = ++analyses === 1 ? { name: 'lookup_brewing_reference', args: { query: QUERY } } : { name: 'finish_advice', args: advice };
      return { candidates: [{ content: { role: 'model', parts: [{ functionCall: call }] } }] };
    };
    const context = { inventory: [], material: [], waterSources: [], provenance: [], phase: 'Préparation', now: Date.now() };
    const turn = await runBrewerHarness(context as any, 'Quelle plage de fermentation pour la S-04 ?', [], generate, { mode: 'fast' });
    result = { ok: true, model: turn.evidence[0]?.model, evidence: turn.evidence[0] };
  } else {
    const { aiTask } = await import('../functions/src/ai');
    const file = { data: readFileSync(COA).toString('base64'), mimeType: 'application/pdf' };
    const data = name === 'diagnostic' ? { task: 'diagnoseBatch', tier: 'fast', context: STUCK } : { task: 'readHopCoa', file };
    result = await aiTask.run({ data, auth } as any);
  }
} catch (error) {
  result = { ok: false, error: (error as Error).message };
} finally {
  globalThis.fetch = realFetch;
}
const totalMs = Math.round(performance.now() - started);

const problems: string[] = [], notes: string[] = [];
const real = guard.calls, injected = sent.filter(entry => entry.injected);
const answered = sent.filter(entry => !entry.injected);
if (!real.length) problems.push('aucun appel réel n’est parti');
if (result?.model !== scenario.expected) problems.push(`modèle de la réponse : ${String(result?.model)} au lieu de ${scenario.expected}`);
for (const [index, call] of real.entries()) {
  if (call.modelVersion !== undefined && !call.modelVersion.startsWith(call.model ?? '?')) problems.push(`appel ${call.n} : demandé ${call.model}, observé ${call.modelVersion}`);
  const expected = route.find(attempt => attempt.model === call.model)?.thinkingLevel;
  if (call.thinkingLevel !== expected) problems.push(`appel ${call.n} : réflexion ${String(call.thinkingLevel)} au lieu de ${String(expected)}`);
  if (call.finishReason !== 'STOP') notes.push(`appel ${call.n} : fin ${String(call.finishReason)}`);
  if (index === 0 && name !== 'repli' && call.model !== GEMINI_LITE_MODEL) problems.push(`premier appel sur ${call.model}`);
}
if (name !== 'recherche') {
  const config = answered[0]?.body?.generationConfig ?? {};
  if (config.temperature !== 0) problems.push(`température envoyée : ${String(config.temperature)}`);
  if (config.maxOutputTokens !== 4500) problems.push(`sortie demandée : ${String(config.maxOutputTokens)}`);
}
if (name === 'repli') {
  if (injected.length !== 1) problems.push(`${injected.length} réponse(s) Flash-Lite simulée(s) au lieu d’une`);
  if (real.length !== 1 || real[0].model !== GEMINI_MODEL) problems.push('la nouvelle tentative réelle n’est pas partie sur 3.8');
  if (JSON.stringify(answered[0]?.body?.contents) !== JSON.stringify(injected[0]?.body?.contents)) problems.push('la nouvelle tentative n’a pas repris la même demande');
}
if (real.length > 1) notes.push(`nouvelle tentative réelle : ${real.map(call => call.model).join(' → ')}`);
if (!result?.ok) problems.push(`échec : ${String(result?.error)}`);

if (name === 'coa' || name === 'repli') {
  const lotRead = result?.data?.found === true && String(result?.data?.lotNumber ?? '').includes('G38-LOT-2025-017');
  if (result?.ok && !lotRead) problems.push('le numéro de lot de la fixture n’a pas été relu');
  notes.push(`COA : found ${String(result?.data?.found)}, lot ${String(result?.data?.lotNumber)}, récolte ${String(result?.data?.harvestYear)}, ${Array.isArray(result?.data?.analysis) ? result.data.analysis.length : 0} analyse(s)`);
} else if (name === 'diagnostic') {
  const r = result?.data ?? {};
  const top = Array.isArray(r.causes) ? r.causes[0] : undefined;
  const severity = String(r.severity ?? '—');
  if (result?.ok && !['agir', 'surveiller', 'urgent'].includes(severity)) problems.push(`gravité ${severity} pour une fermentation bloquée`);
  if (result?.ok && !/temp|froid|°C|13|14/i.test(JSON.stringify([r.verdict, top]))) problems.push('cause « température trop basse » absente');
  if (result?.ok && !/r[ée]chauff|remont|18|19|20|temp[ée]rature/i.test(JSON.stringify([r.immediateAction, top]))) problems.push('action « réchauffer » absente');
  notes.push(`diagnostic : gravité ${severity}, atténuation ${String(r.apparentAttenuationPct ?? '—')} %, action « ${String(r.immediateAction ?? top?.action ?? '—').slice(0, 90)} »`);
} else {
  const evidence = result?.evidence;
  const sources: Array<{ title: string; url: string }> = evidence?.sources ?? [];
  const text = (evidence?.facts ?? []).join(' ');
  if (result?.ok && !sources.length) problems.push('aucune source web ancrée');
  const facts = [/18\D{1,8}26/, /50\D{1,8}80/].filter(pattern => pattern.test(text)).length;
  notes.push(`recherche : ${sources.length} source(s) (${sources.map(source => source.title).join(', ').slice(0, 120)}), faits attendus ${facts}/2, ${text.split(/\s+/).filter(Boolean).length} mots`);
}

// Ledger on the emulator: each attempt settled at its own model's rate, the month reservation back to zero.
const monthDoc = (await db.doc(`brewerAiCosts/${month}`).get()).data() ?? {};
const ledger = (await db.collection(`brewerAiCosts/${month}/calls`).get()).docs.filter((doc: any) => !ledgerBefore.has(doc.id))
  .map((doc: any) => doc.data()).sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
if (monthDoc.reservedMicroChf !== 0) problems.push(`réservation mensuelle gardée : ${String(monthDoc.reservedMicroChf)} µCHF`);
const expectedLedger = name === 'repli' ? [GEMINI_LITE_MODEL, GEMINI_MODEL] : real.map(call => call.model);
if (JSON.stringify(ledger.map((entry: any) => entry.model)) !== JSON.stringify(expectedLedger))
  problems.push(`registre : ${ledger.map((entry: any) => `${entry.model} ${entry.status}`).join(', ') || 'vide'} au lieu de ${expectedLedger.join(', ')}`);
if (name === 'repli' && ledger[0]?.status !== 'unusable') problems.push(`tentative Flash-Lite simulée au registre : ${String(ledger[0]?.status)} au lieu de unusable`);
if (ledger.at(-1)?.status !== 'completed') problems.push(`dernier appel au registre : ${String(ledger.at(-1)?.status)}`);
notes.push(`registre émulateur : ${ledger.map((entry: any) => `${entry.model} ${entry.status} ${String(entry.chargedMicroChf)} µCHF (jetons ${String(entry.tokenMicroChf)}, recherche ${String(entry.searchQueries ?? 0)} requête(s)${entry.searchQueriesProvisioned ? ' provisionnées' : ''})`).join(' ; ')}, mois used ${String(monthDoc.usedMicroChf)} / reserved ${String(monthDoc.reservedMicroChf)}`);

const cost = real.reduce((sum, call) => sum + (call.costMicroChf ?? 0), 0);
const summary = [
  `${simulate ? 'Répétition simulée' : 'Preuve réelle'} IA-B (${scenario.label}) : ${real.length} appel(s) réel(s) n° ${real.map(call => call.n).join(', ') || '—'}${injected.length ? ` + ${injected.length} réponse Flash-Lite simulée (non comptée)` : ''}, latence ${real.map(call => `${call.latencyMs} ms`).join(' + ') || '—'} (tâche complète ${totalMs} ms)`,
  `route ${route.map(attempt => `${attempt.model} ${attempt.thinkingLevel}`).join(' → ')} ; demandé ${real.map(call => `${call.model} ${call.thinkingLevel}`).join(', ') || '—'}, observé ${real.map(call => call.modelVersion ?? 'non fourni').join(', ') || '—'}, champ model ${String(result?.model)}`,
  `tokens ${real.map(call => `${call.inputTokens ?? '?'} / ${call.outputTokens ?? '?'}`).join(', ') || '—'}, coût estimé ${(cost / 1_000_000).toFixed(4)} CHF ; ok ${String(result?.ok)}${result?.ok ? '' : ` (${String(result?.error)})`}`,
  ...notes,
  problems.length ? `ÉCHEC : ${problems.join(' ; ')}` : 'OK'
];
appendFileSync(registerPath, `- ${new Date().toISOString()} · ${summary.join(' · ')}\n`);
console.log(summary.join('\n'));
if (simulate) console.log(`Journal temporaire : ${journalPath}`);
// Close the emulator channel first: exiting with it open once tripped a libuv assertion on Windows (repli, 16.10).
await db.terminate().catch(() => undefined);
process.exit(problems.length ? 1 : 0);
