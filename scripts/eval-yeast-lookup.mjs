// Explicit, bounded live lookup of PUBLIC yeast sheets. No brewery documents,
// Firebase business writes or persisted API key. Not part of npm test/deploy.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = new Set(process.argv.slice(2));
for (const arg of args) if (!['--preflight', '--confirm-paid-ai', '--expanded-output', '--mangrove-only'].includes(arg)) throw Error('Option inconnue ; aucun appel IA.');
const namedTargets = [
  { name: 'SafAle S-04', lab: 'Fermentis', form: 'sèche' },
  { name: 'M20 · Bavarian Wheat', lab: 'Mangrove Jack’s', form: 'sèche',
    sourceUrl: 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g' },
  { name: 'M54 · Californian Lager', lab: 'Mangrove Jack’s', form: 'sèche',
    sourceUrl: 'https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785' },
];
const mangroveOnly = args.has('--mangrove-only');
const names = mangroveOnly ? [namedTargets[2], namedTargets[1]] : namedTargets;
const maximumProviderRequests = names.length;
const expandedOutput = args.has('--expanded-output');
const maxOutputTokens = expandedOutput ? 12000 : 4500;
const reportPath = resolve(root, `work/ux-mobile-poc-2026-09-25/review/real-yeast-lookups${expandedOutput ? '-expanded' : ''}${mangroveOnly ? '-mangrove' : ''}.json`);
const preflight = args.has('--preflight');
if (!preflight) requirePaidAiTestOptIn({ label: `${maximumProviderRequests} levures publiques, ${maximumProviderRequests} appels Gemini maximum, sortie ${maxOutputTokens} jetons, aucun repli`,
  command: `node scripts/eval-yeast-lookup.mjs --confirm-paid-ai${expandedOutput ? ' --expanded-output' : ''}${mangroveOnly ? ' --mangrove-only' : ''}` });

const configuredProject = JSON.parse(await readFile(resolve(root, '.firebaserc'), 'utf8')).projects.default;
if (configuredProject !== 'brasserie-l-affinee') throw Error('Projet inattendu ; aucun appel IA.');
for (const name of ['prompts', 'models', 'yeastLookupResult']) {
  const [source, compiled] = await Promise.all([stat(resolve(root, `functions/src/${name}.ts`)), stat(resolve(root, `functions/lib/${name}.js`))]);
  if (compiled.mtimeMs < source.mtimeMs) throw Error(`Functions compilées périmées : ${name} ; aucun appel IA.`);
}
const [{ ingredientLookupDefinition }, { TIERS }, { yeastLookupResultError }] = await Promise.all([
  import('../functions/lib/prompts.js'), import('../functions/lib/models.js'), import('../functions/lib/yeastLookupResult.js')
]);
const model = TIERS.fast.primary;
const definition = ingredientLookupDefinition('levure');
if (!definition.grounded || !definition.schema || !/^gemini-3\./.test(model)) throw Error('Configuration lookup inattendue ; aucun appel IA.');
const report = { schema: 'laffinee.real-yeast-lookup.v1', fixtureOnly: true, project: configuredProject, model,
  pathway: 'prompt/schema de aiTask → Gemini direct ancré Google ; aucune écriture Firestore',
  maximumProviderRequests, maxOutputTokens, providerRequests: 0, generatedAt: new Date().toISOString(), results: [] };
if (preflight) {
  console.log(JSON.stringify({ status: 'ready-no-call', ...report, results: undefined }));
  process.exit(0);
}

// The CLI uses the already authenticated Firebase account. Capture the secret
// only in this process; never print it, place it in argv, a file or the report.
const secretCommand = 'npx firebase functions:secrets:access GEMINI_API_KEY --project brasserie-l-affinee';
const secretResult = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', secretCommand], { encoding: 'utf8', windowsHide: true })
  : spawnSync('sh', ['-c', secretCommand], { encoding: 'utf8' });
// On this Windows host the Firebase CLI may emit the value then crash during
// libuv handle teardown. Accept only that known post-output failure, with a
// single opaque key-shaped line; never print its value or the raw CLI output.
const cliFinished = secretResult.status === 0 ||
  secretResult.status === 3221226505 && /UV_HANDLE_CLOSING/.test(secretResult.stderr ?? '');
const secretLines = secretResult.stdout.trim().split(/\r?\n/);
const apiKey = cliFinished && secretLines.length === 1 ? secretLines[0] : '';
if (!/^[A-Za-z0-9._-]{25,}$/.test(apiKey)) throw Error('Secret Gemini indisponible ou inattendu ; aucun appel IA.');
const sourceDigest = createHash('sha256').update(definition.system + JSON.stringify(definition.schema)).digest('hex');
report.promptSchemaSha256 = sourceDigest;

for (const target of names) {
  if (report.providerRequests >= maximumProviderRequests) throw Error('Plafond de requêtes atteint.');
  const context = { kind: 'levure', name: target.name, reviewTechnicalSheet: true,
    known: { name: target.name, lab: target.lab, form: target.form,
      ...(target.sourceUrl ? { technicalSource: target.sourceUrl } : {}) } };
  const userText = `Demande : levure : ${target.name}\n\nDonnées :\n${JSON.stringify(context)}`;
  const body = { systemInstruction: { parts: [{ text: definition.system }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }], tools: [{ googleSearch: {} }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: definition.schema,
      temperature: TIERS.fast.temperature, maxOutputTokens } };
  const began = Date.now();
  report.providerRequests++;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body), signal: AbortSignal.timeout(100_000)
  });
  const payload = await response.json().catch(() => ({}));
  const result = { requestedName: target.name, status: response.status, elapsedMs: Date.now() - began,
    modelVersion: typeof payload.modelVersion === 'string' ? payload.modelVersion : undefined,
    usage: payload.usageMetadata ? Object.fromEntries(['promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount', 'totalTokenCount']
      .map(key => [key, payload.usageMetadata[key] ?? null])) : undefined };
  if (!response.ok) { result.error = String(payload.error?.message || 'Provider error').slice(0, 350); report.results.push(result); break; }
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    result.data = JSON.parse(raw);
    result.validationError = yeastLookupResultError(result.data) || null;
  } catch { result.error = `Réponse JSON illisible (${payload.candidates?.[0]?.finishReason || 'raison inconnue'}).`; }
  report.results.push(result);
  if (result.error || result.validationError) break; // no paid retry or fallback
}
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ reportPath, providerRequests: report.providerRequests,
  results: report.results.map(({ requestedName, status, validationError, error }) => ({ requestedName, status, validationError, error })) }));
if (report.results.length !== names.length || report.results.some(result => result.error || result.validationError)) process.exitCode = 1;
