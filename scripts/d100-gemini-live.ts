/**
 * Test spécial Gemini 3.8 réel de #100 (D100) — hors `npm test`, lancé explicitement, payant.
 *
 * Il passe par le vrai routage de production (`aiTask`) et le vrai budget mensuel, sur
 * l'émulateur Firestore d'un projet `demo-*`, avec des fixtures synthétiques :
 * - `--scenario=levure` : fiche de la levure SafAle S-04, cas qui bouclait au banc #91
 *   (`"tempMinC": 18.000…` jusqu'à 12 000 jetons) ;
 * - `--scenario=import` : import du PDF synthétique `recette-brown-ale.pdf` en demandant
 *   Max, comme l'ancienne feuille d'import ; le serveur doit imposer le réglage Rapide.
 * Un seul appel par lancement, sans nouvelle tentative. Il vérifie le modèle observé, le
 * corps envoyé, la réponse complète, puis le solde de la réservation sur l'émulateur.
 *
 *   npx firebase emulators:exec --only firestore --project demo-d100 \
 *     "npx vite-node scripts/d100-gemini-live.ts -- --scenario=levure --confirm-paid-ai"
 *
 * Répétition sans réseau ni coût : même commande avec `--simulate` au lieu de
 * `--confirm-paid-ai` (fournisseur simulé, journal temporaire).
 *
 * Garde-fous : ceux de `gemini38LiveCore.ts` (modèle 3.8 résolu, compteur G38 de
 * gemini-journal.md réservé sous verrou avant l'envoi, autre hôte refusé), émulateur
 * `demo-*` obligatoire, clé lue de l'environnement ou de `functions/.secret.local`,
 * jamais affichée ni journalisée.
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';
import { LIVE_ENDPOINT, appendLiveRow, guardLiveFetch, liveJournalRow, livePreflight, reserveLiveCall, type LiveCall } from './gemini38LiveCore';
import { GEMINI_MODEL, TIERS, modelChain } from '../functions/src/models';
import { geminiAnswerText, unusableGeminiOutput } from '../functions/src/geminiResponse';
import { aiBudgetMonth } from '../functions/src/geminiCosts';

const WORK = 'work/finalisation-tickets-2026-10-08';
const ACCOUNT = 'd100-live-test@example.invalid';
const ISSUE = '#100 (D100)';
const PDF = 'tests/fixtures/gemini-usage-bench/recette-brown-ale.pdf';
const SCENARIOS = {
  levure: {
    label: 'fiche levure SafAle S-04 (Rapide)',
    data: () => ({ task: 'lookupIngredient', tier: 'fast', instruction: 'levure : SafAle S-04',
      context: { kind: 'levure', name: 'SafAle S-04', reviewTechnicalSheet: true } })
  },
  import: {
    label: 'import PDF brown ale (Max demandé, Rapide imposé)',
    data: () => ({ task: 'importRecipe', tier: 'max', instruction: 'Lis la recette sur ce document.',
      file: { data: readFileSync(PDF).toString('base64'), mimeType: 'application/pdf' } })
  }
} as const;
const args = process.argv.slice(2);
const simulate = args.includes('--simulate');

function stop(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

const scenarioArg = args.find(arg => arg.startsWith('--scenario'));
const scenarioName = scenarioArg?.startsWith('--scenario=') ? scenarioArg.slice('--scenario='.length) : '';
if (!Object.hasOwn(SCENARIOS, scenarioName)) stop(`Scénario inconnu : « ${scenarioArg} » (--scenario=levure ou --scenario=import). Aucun appel.`);
const scenario = SCENARIOS[scenarioName as keyof typeof SCENARIOS];
const TEST = `d100-gemini-live.ts · ${scenario.label}`;
const COMMAND = `npx firebase emulators:exec --only firestore --project demo-d100 "npx vite-node scripts/d100-gemini-live.ts -- --scenario=${scenarioName} --confirm-paid-ai"`;

function localKey(): string | undefined {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const file = 'functions/.secret.local';
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find(entry => /^\s*GEMINI_API_KEY\s*=/.test(entry));
  return line?.slice(line.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || undefined;
}

/** Réponse simulée, sans réseau ni coût : une fiche levure ou une recette lisible. */
const simulatedProvider = (async () => new Response(JSON.stringify({
  modelVersion: 'gemini-3.8-flash',
  candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: JSON.stringify(scenarioName === 'levure'
    ? { found: true, name: 'SafAle S-04', source: 'Fermentis — fiche simulée', sourceUrl: 'https://example.invalid/s-04', technicalFacts: [], tempMinC: 18, tempMaxC: 26 }
    : { name: 'Brown Ale du Banc', style: 'Brown', volumeL: 18.93, fermentables: [], hops: [{ name: 'Fuggle', weightG: 14.17, stage: 'boil', timeMin: 6e-323 }] }) }] } }],
  usageMetadata: { promptTokenCount: 1300, candidatesTokenCount: 400, totalTokenCount: 1700 }
}), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;

const key = simulate ? 'simulated-key-not-a-secret' : localKey();
if (!key) stop('Aucune clé Gemini locale : ni GEMINI_API_KEY dans l’environnement, ni functions/.secret.local. Aucun appel.');
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const project = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
if (!emulator || !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(emulator) || !project?.startsWith('demo-'))
  stop('Chemin non isolé de la production : lancer sous l’émulateur Firestore d’un projet demo-*. Aucun appel.');

const journalPath = simulate ? join(mkdtempSync(join(tmpdir(), 'd100-live-')), 'gemini-journal.md') : `${WORK}/gemini-journal.md`;
const registerPath = simulate ? journalPath.replace(/gemini-journal\.md$/, 'registre.md') : `${WORK}/D100/registre-appels.md`;
const lockDir = simulate ? `${journalPath}.lock` : `${WORK}/locks/gemini-journal`;
if (simulate) writeFileSync(journalPath, readFileSync(`${WORK}/gemini-journal.md`, 'utf8'));

// Without any network: resolved model and G38 counter, then the paid opt-in. One call per launch.
try {
  livePreflight([GEMINI_MODEL, TIERS.fast.primary, ...modelChain('fast')], readFileSync(journalPath, 'utf8'), () => {
    if (!simulate) requirePaidAiTestOptIn({ label: `Gemini 3.8 réel · #100 · ${scenario.label}`, command: COMMAND });
  });
} catch (error) {
  stop((error as Error).message);
}

process.env.GEMINI_API_KEY = key;
process.env.AUTHORIZED_ACCOUNTS = ACCOUNT;

const fromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = await import(pathToFileURL(fromFunctions.resolve('firebase-admin/app')).href);
const { getFirestore } = await import(pathToFileURL(fromFunctions.resolve('firebase-admin/firestore')).href);
initializeApp({ projectId: project });
const db = getFirestore();
await db.doc('brewerAiControls/current').set({ paused: false, monthlyLimitMicroChf: 10_000_000 });

// What was sent and received, for the checks below: settings and counts only, never the key nor search queries.
const seen: { body?: any; json?: any } = {};
const realFetch = globalThis.fetch;
const provider = (simulate ? simulatedProvider : realFetch) as typeof fetch;
const observing = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url !== LIVE_ENDPOINT) return realFetch(input, init);
  seen.body = JSON.parse(String(init?.body ?? '{}'));
  const response = await provider(input, init);
  seen.json = await response.clone().json().catch(() => undefined);
  return response;
}) as typeof fetch;
const record = (call: LiveCall) => {
  const outcome = call.error ? `échec réseau (${call.error})`
    : `HTTP ${call.status}, ${call.latencyMs} ms, réflexion ${call.thinkingLevel ?? 'non fournie'}, fin ${call.finishReason ?? 'non fournie'}${simulate ? ', simulé' : ''}`;
  appendLiveRow(journalPath, lockDir, liveJournalRow(call, ISSUE, TEST, outcome));
};
const guard = guardLiveFetch(observing, { cap: 1, reserve: () => reserveLiveCall(journalPath, lockDir), onCall: record });

const { aiTask } = await import('../functions/src/ai');
const started = performance.now();
let result: any;
globalThis.fetch = guard.fetch;
try {
  result = await aiTask.run({ data: scenario.data(), auth: { uid: 'd100-live-test', token: { email: ACCOUNT, email_verified: true } } } as any);
} finally {
  globalThis.fetch = realFetch;
}
const totalMs = Math.round(performance.now() - started);

const problems: string[] = [], notes: string[] = [];
const call = guard.calls[0], config = seen.body?.generationConfig ?? {};
if (guard.calls.length !== 1) problems.push(`${guard.calls.length} appel(s) Gemini au lieu d’un`);
if (call?.modelVersion !== undefined && !call.modelVersion.startsWith('gemini-3.8-flash')) problems.push(`modèle observé : ${call.modelVersion}`);
if (result?.model !== undefined && result.model !== 'gemini-3.8-flash') problems.push(`champ model de la réponse : ${String(result.model)}`);
if (config.thinkingConfig?.thinkingLevel !== 'low') problems.push(`réflexion envoyée : ${String(config.thinkingConfig?.thinkingLevel)}`);
if (config.maxOutputTokens !== 4500) problems.push(`sortie demandée : ${String(config.maxOutputTokens)}`);
const unusable = seen.json ? unusableGeminiOutput(seen.json) : undefined;
if (unusable) problems.push(`réponse inutilisable (${unusable.reason})`);
if (call?.finishReason !== 'STOP') problems.push(`fin de réponse : ${String(call?.finishReason)}`);
const grounding = seen.json?.candidates?.[0]?.groundingMetadata;
notes.push(`ancrage : ${grounding ? `métadonnée présente, ${Array.isArray(grounding.webSearchQueries) ? `${grounding.webSearchQueries.length} requête(s) déclarée(s)` : 'sans webSearchQueries'}` : 'aucune groundingMetadata'}`);
notes.push(`réponse : ${geminiAnswerText(seen.json).length} caractères visibles`);

if (scenarioName === 'levure') {
  if (config.responseSchema?.properties?.tempMinC?.type !== 'INTEGER') problems.push('tempMinC envoyé hors entier');
  if (!result?.ok) notes.push(`fiche refusée par le contrôle de sources : ${String(result?.error)}`);
  for (const field of ['tempMinC', 'tempMaxC'])
    if (result?.data?.[field] !== undefined && !Number.isInteger(result.data[field])) problems.push(`${field} non entier : ${result.data[field]}`);
  notes.push(`fiche : found ${String(result?.data?.found)}, tempMinC ${String(result?.data?.tempMinC)}, tempMaxC ${String(result?.data?.tempMaxC)}, ${Array.isArray(result?.data?.technicalFacts) ? result.data.technicalFacts.length : 0} fait(s)`);
} else {
  if (!result?.ok) problems.push(`import en échec : ${String(result?.error)}`);
  if (result?.tier !== 'fast') problems.push(`niveau rendu : ${String(result?.tier)}`);
  if (totalMs > 40_000) problems.push(`import hors budget de 40 s : ${totalMs} ms`);
  const data = result?.data ?? {};
  notes.push(`recette : ${String(data.name)}, ${data.fermentables?.length ?? 0} fermentescible(s), ${data.hops?.length ?? 0} houblon(s), volume ${String(data.volumeL)} L, OG ${String(data.ogTarget)}`);
  notes.push(`houblons : ${(data.hops ?? []).map((h: any) => `${h.name} ${h.weightG} g ${h.stage} ${h.timeMin ?? '—'} min α ${h.alpha ?? '—'}`).join(' ; ') || '—'}`);
  if (Array.isArray(data.importWarnings)) notes.push(`valeurs écartées par le serveur : ${data.importWarnings.join(' / ')}`);
}

// The monthly reservation must be settled on the emulator, never kept.
const month = (await db.doc(`brewerAiCosts/${aiBudgetMonth()}`).get()).data() ?? {};
const ledger = (await db.collection(`brewerAiCosts/${aiBudgetMonth()}/calls`).get()).docs.map((doc: any) => doc.data());
const last = ledger.sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0)).at(-1);
if (month.reservedMicroChf !== 0) problems.push(`réservation mensuelle gardée : ${String(month.reservedMicroChf)} µCHF`);
if (!['completed', 'unusable'].includes(last?.status)) problems.push(`statut de l’appel au registre : ${String(last?.status)}`);
notes.push(`registre émulateur : statut ${String(last?.status)}, imputé ${String(last?.chargedMicroChf)} µCHF (jetons ${String(last?.tokenMicroChf)}, recherche ${String(last?.searchQueries)} requête(s)${last?.searchQueriesProvisioned ? ' provisionnées' : ''}), mois used ${String(month.usedMicroChf)} / reserved ${String(month.reservedMicroChf)}`);

const cost = guard.calls.reduce((sum, c) => sum + (c.costMicroChf ?? 0), 0);
const summary = [
  `${simulate ? 'Répétition simulée' : 'Preuve réelle'} D100 (${scenario.label}) : appel n° ${guard.calls.map(c => c.n).join(', ') || '—'}, latence ${call?.latencyMs ?? '—'} ms (tâche complète ${totalMs} ms)`,
  `modèle demandé ${GEMINI_MODEL}, observé ${call?.modelVersion ?? 'non fourni'}, champ model ${String(result?.model)}, niveau rendu ${String(result?.tier)}, réflexion ${String(config.thinkingConfig?.thinkingLevel)}, sortie ${String(config.maxOutputTokens)}, fin ${String(call?.finishReason)}`,
  `tokens ${call ? `${call.inputTokens ?? '?'} / ${call.outputTokens ?? '?'}` : '—'}, coût estimé ${(cost / 1_000_000).toFixed(4)} CHF ; ok ${String(result?.ok)}${result?.ok ? '' : ` (${String(result?.error)})`}`,
  ...notes,
  problems.length ? `ÉCHEC : ${problems.join(' ; ')}` : 'OK'
];
appendFileSync(registerPath, `- ${new Date().toISOString()} · ${summary.join(' · ')}\n`);
console.log(summary.join('\n'));
if (simulate) console.log(`Journal temporaire : ${journalPath}`);
process.exit(problems.length ? 1 : 0);
