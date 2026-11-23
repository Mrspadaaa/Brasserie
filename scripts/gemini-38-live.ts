/**
 * Test spécial Gemini 3.8 réel — hors `npm test`, lancé explicitement, payant.
 *
 * Il vérifie que `gemini-3.8-flash` sert la lecture d'un certificat d'analyse
 * de houblon (fixture locale fictive), par le routage de production (`aiTask`,
 * tâche `readHopCoa`), sans surcharge de modèle. Il mesure la latence et
 * journalise chaque appel. Deux scénarios :
 * - `--scenario=rapide` (défaut) : niveau Rapide, réflexion basse, ancien usage
 *   de 3.5 Flash-Lite ; jusqu'à 3 appels (la nouvelle tentative comprise) ;
 * - `--scenario=max` : niveau Max, réflexion haute ; un seul appel, sans
 *   nouvelle tentative.
 *
 *   npx firebase emulators:exec --only firestore --project demo-g38 \
 *     "npx vite-node scripts/gemini-38-live.ts -- --scenario=max --confirm-paid-ai"
 *
 * Répétition sans réseau ni coût (fournisseur simulé, journal temporaire) :
 *   même commande avec `--simulate` à la place de `--confirm-paid-ai`.
 *
 * Garde-fous, dans cet ordre :
 * - clé locale et émulateur `demo-*` présents, sinon arrêt sans réseau ;
 * - modèle résolu `gemini-3.8-flash` et compteur de gemini-journal.md non épuisé,
 *   contrôlés avant l'opt-in payant ;
 * - chaque appel est réservé dans le compteur, sous verrou, juste avant l'envoi :
 *   au plus 3 appels par lancement (1 en Max) et 10 au total, même après un arrêt
 *   brutal ou avec une autre session ; sa ligne est écrite juste après l'appel ;
 * - toute requête vers un autre modèle ou un autre hôte que l'émulateur local
 *   est refusée avant l'envoi ;
 * - budget mensuel et quotidien sur l'émulateur Firestore d'un projet `demo-*` seulement ;
 * - clé : `GEMINI_API_KEY` de l'environnement local ou `functions/.secret.local`.
 *   Elle n'est jamais affichée, journalisée ni copiée.
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';
import { LIVE_ENDPOINT, LIVE_LAUNCH_CAP, appendLiveRow, guardLiveFetch, liveJournalRow, livePreflight, reserveLiveCall, type LiveCall } from './gemini38LiveCore';
import { GEMINI_MODEL, TIERS, modelChain } from '../functions/src/models';

const WORK = 'work/finalisation-tickets-2026-10-08';
const FIXTURE = 'tests/fixtures/hop-coa-g38.pdf';
const ACCOUNT = 'g38-live-test@example.invalid';
const ISSUE = '#22 (G38)';
const SCENARIOS = {
  rapide: { tier: 'fast', maxCalls: LIVE_LAUNCH_CAP },
  max: { tier: 'max', maxCalls: 1 }
} as const;
const args = process.argv.slice(2);
const simulate = args.includes('--simulate');

function stop(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

// `--scenario max` without `=` must not fall back silently to a paid Rapide call.
const scenarioArg = args.find(arg => arg.startsWith('--scenario'));
const scenarioName = scenarioArg === undefined ? 'rapide' : scenarioArg.startsWith('--scenario=') ? scenarioArg.slice('--scenario='.length) : '';
if (!Object.hasOwn(SCENARIOS, scenarioName)) stop(`Scénario inconnu : « ${scenarioArg} » (--scenario=rapide ou --scenario=max). Aucun appel.`);
const scenario = SCENARIOS[scenarioName as keyof typeof SCENARIOS];
const settings = TIERS[scenario.tier];
const TEST = `gemini-38-live.ts · readHopCoa (${settings.label}, réflexion ${settings.thinkingLevel})`;
const COMMAND = `npx firebase emulators:exec --only firestore --project demo-g38 "npx vite-node scripts/gemini-38-live.ts -- --scenario=${scenarioName} --confirm-paid-ai"`;

function localKey(): string | undefined {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const file = 'functions/.secret.local';
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find(entry => /^\s*GEMINI_API_KEY\s*=/.test(entry));
  return line?.slice(line.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || undefined;
}

/** Réponse simulée d'un COA lu : aucun réseau, aucun coût. */
const simulatedProvider = (async () => new Response(JSON.stringify({
  modelVersion: 'gemini-3.8-flash',
  candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: JSON.stringify({
    found: true, lotNumber: 'G38-LOT-2025-017', harvestYear: 2025, form: 'pellet', analysis: [], note: 'Réponse simulée.'
  }) }] } }],
  usageMetadata: { promptTokenCount: 1200, candidatesTokenCount: 180, thoughtsTokenCount: 40, totalTokenCount: 1420 }
}), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;

const key = simulate ? 'simulated-key-not-a-secret' : localKey();
if (!key) stop('Aucune clé Gemini locale : ni GEMINI_API_KEY dans l’environnement, ni functions/.secret.local. Aucun appel.');
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const project = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
if (!emulator || !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(emulator) || !project?.startsWith('demo-'))
  stop('Chemin non isolé de la production : lancer sous l’émulateur Firestore d’un projet demo-*. Aucun appel.');

const journalPath = simulate
  ? join(mkdtempSync(join(tmpdir(), 'g38-live-')), 'gemini-journal.md')
  : `${WORK}/gemini-journal.md`;
const registerPath = simulate ? journalPath.replace(/gemini-journal\.md$/, 'registre.md') : `${WORK}/G38/registre.md`;
// Same lock as the usage bench (#91) for the shared journal; the rehearsal locks its temporary copy.
const lockDir = simulate ? `${journalPath}.lock` : `${WORK}/locks/gemini-journal`;
if (simulate) writeFileSync(journalPath, readFileSync(`${WORK}/gemini-journal.md`, 'utf8'));

// Still without any network: the resolved model, then the counter, before the paid opt-in.
let launchCap = 0;
try {
  launchCap = Math.min(scenario.maxCalls, livePreflight(
    [GEMINI_MODEL, settings.primary, ...modelChain(scenario.tier)],
    readFileSync(journalPath, 'utf8'),
    () => {
      if (!simulate) requirePaidAiTestOptIn({ label: `Gemini 3.8 réel · lecture de COA (niveau ${settings.label})`, command: COMMAND });
    }
  ).cap);
} catch (error) {
  stop((error as Error).message);
}

// The production path reads both from the environment; the key itself is never printed.
process.env.GEMINI_API_KEY = key;
process.env.AUTHORIZED_ACCOUNTS = ACCOUNT;

// Same firebase-admin instance as functions/src: the budget ledger lives on the demo emulator only.
const fromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = await import(pathToFileURL(fromFunctions.resolve('firebase-admin/app')).href);
const { getFirestore } = await import(pathToFileURL(fromFunctions.resolve('firebase-admin/firestore')).href);
initializeApp({ projectId: project });
await getFirestore().doc('brewerAiControls/current').set({ paused: false, monthlyLimitMicroChf: 10_000_000 });

// The counter is reserved before each send; the row follows the call, reserved number unchanged.
const record = (call: LiveCall) => {
  const versionOk = call.modelVersion === undefined || call.modelVersion.startsWith('gemini-3.8-flash');
  const outcome = call.error ? `échec réseau (${call.error})`
    : `HTTP ${call.status}, ${call.latencyMs} ms, réflexion ${call.thinkingLevel ?? 'non fournie'}${call.finishReason && call.finishReason !== 'STOP' ? `, fin ${call.finishReason}` : ''}${versionOk ? '' : ', modèle observé refusé'}${simulate ? ', simulé' : ''}`;
  appendLiveRow(journalPath, lockDir, liveJournalRow(call, ISSUE, TEST, outcome));
};
const realFetch = globalThis.fetch;
const guard = guardLiveFetch(simulate ? (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return url === LIVE_ENDPOINT ? simulatedProvider(input, init) : realFetch(input, init);
} : realFetch, { cap: launchCap, reserve: () => reserveLiveCall(journalPath, lockDir), onCall: record });

const { aiTask } = await import('../functions/src/ai');
const file = { data: readFileSync(FIXTURE).toString('base64'), mimeType: 'application/pdf' };
const started = performance.now();
let result: any;
globalThis.fetch = guard.fetch;
try {
  result = await aiTask.run({
    data: { task: 'readHopCoa', tier: scenario.tier, file },
    auth: { uid: 'g38-live-test', token: { email: ACCOUNT, email_verified: true } }
  } as any);
} finally {
  globalThis.fetch = realFetch;
}
const totalMs = Math.round(performance.now() - started);

const problems: string[] = [];
if (!guard.calls.length) problems.push('aucun appel Gemini n’est parti');
if (result?.model !== 'gemini-3.8-flash') problems.push(`champ model de la réponse : ${String(result?.model)}`);
for (const call of guard.calls) {
  if (call.modelVersion !== undefined && !call.modelVersion.startsWith('gemini-3.8-flash')) problems.push(`modèle observé : ${call.modelVersion}`);
  if (call.thinkingLevel !== settings.thinkingLevel) problems.push(`réflexion envoyée : ${String(call.thinkingLevel)} au lieu de ${settings.thinkingLevel}`);
}
if (!result?.ok) problems.push(`lecture en échec : ${String(result?.error ?? 'réponse vide')}`);
const lotRead = result?.data?.found === true && String(result?.data?.lotNumber ?? '').includes('G38-LOT-2025-017');
if (result?.ok && !lotRead) problems.push('le numéro de lot de la fixture n’a pas été relu');

const cost = guard.calls.reduce((sum, call) => sum + (call.costMicroChf ?? 0), 0);
const summary = [
  `${simulate ? 'Répétition simulée' : 'Preuve réelle'} G38 (${settings.label}) : ${guard.calls.length} appel(s) Gemini n° ${guard.calls.map(c => c.n).join(', ') || '—'}, latence ${guard.calls.map(c => `${c.latencyMs} ms`).join(' + ') || '—'} (tâche complète ${totalMs} ms)`,
  `modèle demandé ${GEMINI_MODEL}, observé ${guard.calls.map(c => c.modelVersion ?? 'non fourni').join(', ') || '—'}, champ model de la réponse ${String(result?.model)}, réflexion envoyée ${guard.calls.map(c => c.thinkingLevel ?? 'non fournie').join(', ') || '—'}`,
  `tokens ${guard.calls.map(c => `${c.inputTokens ?? '?'} / ${c.outputTokens ?? '?'}`).join(', ') || '—'}, coût estimé ${(cost / 1_000_000).toFixed(4)} CHF`,
  problems.length ? `ÉCHEC : ${problems.join(' ; ')}` : `OK : 3.8 a servi la lecture de document au niveau ${settings.label} (réflexion ${settings.thinkingLevel}).`
];
appendFileSync(registerPath, `- ${new Date().toISOString()} · ${summary.join(' · ')}\n`);
console.log(summary.join('\n'));
if (simulate) console.log(`Journal temporaire : ${journalPath}`);
process.exit(problems.length ? 1 : 0);
