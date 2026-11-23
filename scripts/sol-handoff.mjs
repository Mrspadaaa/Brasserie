// Durable handoff mailbox to an existing Sol thread. This module never starts a model.
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync, mkdirSync, openSync, closeSync, readFileSync, realpathSync,
  renameSync, statSync, unlinkSync, writeFileSync, fsyncSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HANDOFF_SCHEMA = 'laffinee.sol-handoff.v1';
export const HANDOFF_RESULT_SCHEMA = 'laffinee.sol-handoff-result.v1';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESULT_STATUSES = new Set(['completed', 'needs_expert', 'blocked']);
const MAX_REQUEST_BYTES = 160 * 1024;
const MAX_RESULT_BYTES = 512 * 1024;
const MAX_OWNED_FILES = 24;
const MAX_CHECKS = 16;
const MAX_SOURCE_ARTIFACTS = 24;
const HANDOFF_SCRIPT = fileURLToPath(import.meta.url);

function byteLength(value) { return Buffer.byteLength(value, 'utf8'); }

function readBoundedText(path, maxBytes, label) {
  if (statSync(path).size > maxBytes) throw new Error(`${label} trop long : maximum ${maxBytes} octets.`);
  const bytes = readFileSync(path);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error(`${label} invalide : UTF-8 requis.`); }
}

function sha256(value) { return createHash('sha256').update(value).digest('hex'); }

function isInside(root, candidate) {
  const rest = relative(root, candidate);
  return rest === '' || (!rest.startsWith(`..${sep}`) && rest !== '..' && !isAbsolute(rest));
}

function validText(value, label, maxBytes) {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0') || byteLength(value) > maxBytes) {
    throw new Error(`${label} doit être un texte non vide, sans octet nul, de ${maxBytes} octets maximum.`);
  }
  return value;
}

function assertKnownKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`Champ inconnu dans ${label} : ${key}.`);
  }
}

function assertOwnedPath(root, input) {
  validText(input, 'ownedFiles', 1024);
  const portable = input.replaceAll('\\', '/');
  if (portable.startsWith('/') || /^[a-z]:/i.test(portable) || portable.split('/').some(part => !part || part === '.' || part === '..')
    || /[\r\n\0*?\[\]{}]/.test(portable)) {
    throw new Error(`ownedFiles doit contenir un chemin relatif ordinaire : ${input}.`);
  }
  const candidate = resolve(root, ...portable.split('/'));
  if (!isInside(root, candidate)) throw new Error(`ownedFiles sort du dossier de travail : ${input}.`);

  // Check the nearest existing ancestor so an existing symlink cannot escape cwd.
  let probe = candidate;
  while (!existsSync(probe)) {
    const parent = dirname(probe);
    if (parent === probe) throw new Error(`Impossible de vérifier le chemin : ${input}.`);
    probe = parent;
  }
  if (!isInside(root, realpathSync(probe))) throw new Error(`ownedFiles sort du dossier de travail via un lien : ${input}.`);
  return portable;
}

export function validateRequest(input, cwd) {
  let raw = input;
  if (typeof raw === 'string' || Buffer.isBuffer(raw)) {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
    if (byteLength(text) > MAX_REQUEST_BYTES) throw new Error(`Requête trop longue : maximum ${MAX_REQUEST_BYTES} octets.`);
    try { raw = JSON.parse(text); }
    catch { throw new Error('Requête invalide : JSON requis.'); }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Requête invalide : objet JSON requis.');
  assertKnownKeys(raw, new Set(['objective', 'mode', 'ownedFiles', 'checks', 'sourceArtifacts']), 'la requête');
  validText(raw.objective, 'objective', 16 * 1024);
  if (!['review', 'implement'].includes(raw.mode)) throw new Error("mode doit valoir 'review' ou 'implement'.");
  if (!Array.isArray(raw.ownedFiles) || raw.ownedFiles.length > MAX_OWNED_FILES) {
    throw new Error(`ownedFiles doit être une liste de 0 à ${MAX_OWNED_FILES} chemins.`);
  }
  if (!Array.isArray(raw.checks) || raw.checks.length < 1 || raw.checks.length > MAX_CHECKS) {
    throw new Error(`checks doit contenir de 1 à ${MAX_CHECKS} vérifications concrètes.`);
  }
  if (raw.mode === 'implement' && raw.ownedFiles.length === 0) {
    throw new Error('Le mode implement exige au moins un ownedFile explicite.');
  }
  if (raw.mode === 'implement' && raw.checks.length === 0) {
    throw new Error('Le mode implement exige au moins un contrôle explicite.');
  }

  const root = realpathSync(cwd);
  if (!statSync(root).isDirectory()) throw new Error('--cwd doit désigner un dossier existant.');
  const paths = raw.ownedFiles.map(file => assertOwnedPath(root, file));
  const pathKeys = paths.map(value => process.platform === 'win32' ? value.toLowerCase() : value);
  if (new Set(pathKeys).size !== pathKeys.length) throw new Error('ownedFiles contient un chemin répété.');
  const checks = raw.checks.map((check, index) => validText(check, `checks[${index}]`, 2048));

  let sourceArtifacts;
  if (raw.sourceArtifacts !== undefined) {
    if (!Array.isArray(raw.sourceArtifacts) || raw.sourceArtifacts.length > MAX_SOURCE_ARTIFACTS) {
      throw new Error(`sourceArtifacts doit contenir au plus ${MAX_SOURCE_ARTIFACTS} références.`);
    }
    sourceArtifacts = raw.sourceArtifacts.map((item, index) => validText(item, `sourceArtifacts[${index}]`, 2048));
  }

  const request = {
    objective: raw.objective,
    mode: raw.mode,
    ownedFiles: paths,
    checks,
    ...(sourceArtifacts === undefined ? {} : { sourceArtifacts }),
  };
  return { request, cwd: root };
}

export function validateHandoffResult(input) {
  let raw = input;
  if (typeof raw === 'string' || Buffer.isBuffer(raw)) {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
    if (byteLength(text) > MAX_RESULT_BYTES) throw new Error(`Résultat trop long : maximum ${MAX_RESULT_BYTES} octets.`);
    try { raw = JSON.parse(text); }
    catch { throw new Error('Résultat invalide : JSON requis.'); }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Résultat invalide : objet JSON requis.');
  assertKnownKeys(raw, new Set(['status', 'summary', 'evidence', 'openQuestions']), 'le résultat Sol');
  if (!RESULT_STATUSES.has(raw.status)) throw new Error('status doit valoir completed, needs_expert ou blocked.');
  validText(raw.summary, 'summary', 16 * 1024);
  if (!Array.isArray(raw.evidence) || raw.evidence.length > 64) throw new Error('evidence doit être une liste de 0 à 64 preuves.');
  if (!Array.isArray(raw.openQuestions) || raw.openQuestions.length > 32) throw new Error('openQuestions doit être une liste de 0 à 32 éléments.');
  const evidence = raw.evidence.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`evidence[${index}] doit être un objet.`);
    assertKnownKeys(item, new Set(['ref', 'detail']), `evidence[${index}]`);
    return { ref: validText(item.ref, `evidence[${index}].ref`, 2048), detail: validText(item.detail, `evidence[${index}].detail`, 4096) };
  });
  const openQuestions = raw.openQuestions.map((question, index) => validText(question, `openQuestions[${index}]`, 2048));
  if (raw.status === 'completed' && evidence.length === 0) throw new Error('Un résultat completed exige au moins une preuve.');
  if (raw.status !== 'completed' && openQuestions.length === 0) throw new Error(`${raw.status} exige au moins une question ou un blocage explicite.`);
  return { status: raw.status, summary: raw.summary, evidence, openQuestions };
}

export function codexEnvironment(source = process.env) {
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (/^ANTHROPIC_/i.test(key)
      || /^(?:OPENAI|CODEX)_(?:API_KEY|API_TOKEN|AUTH_TOKEN|[A-Z0-9_]*(?:BASE_URL|API_BASE|API_URL|ENDPOINT))$/i.test(key)) delete env[key];
  }
  return env;
}

export function parseQueueReceipt(stdout, targetThreadId) {
  const match = String(stdout ?? '').trim().match(/^Queued message ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}) for thread ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.$/i);
  if (!match) return { deliveryStatus: 'unknown', reason: 'receipt_unrecognized' };
  if (match[2].toLowerCase() !== targetThreadId.toLowerCase()) {
    return { deliveryStatus: 'unknown', reason: 'receipt_thread_mismatch', messageId: match[1], observedThreadId: match[2] };
  }
  return { deliveryStatus: 'queued', messageId: match[1], observedThreadId: match[2] };
}

function atomicWriteJson(path, value) {
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  const fd = openSync(temp, 'r+');
  try { fsyncSync(fd); }
  finally { closeSync(fd); }
  renameSync(temp, path);
}

function syncFile(path) {
  const fd = openSync(path, 'r+');
  try { fsyncSync(fd); }
  finally { closeSync(fd); }
}

function writeImmutable(path, bytes) {
  try {
    writeFileSync(path, bytes, { flag: 'wx' });
    syncFile(path);
  }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const existing = readFileSync(path);
    if (!existing.equals(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes))) throw new Error(`Artefact immuable déjà présent et différent : ${path}.`);
    syncFile(path);
  }
}

function requestBytesAndValue(input, maxBytes, label) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(typeof input === 'string' ? input : `${JSON.stringify(input, null, 2)}\n`, 'utf8');
  if (bytes.length > maxBytes) throw new Error(`${label} trop long : maximum ${maxBytes} octets.`);
  if (!Buffer.isBuffer(input) && typeof input !== 'string') return { bytes, value: input };
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error(`${label} invalide : UTF-8 requis.`); }
  let value;
  try { value = JSON.parse(text); }
  catch { throw new Error(`${label} invalide : JSON requis.`); }
  return { bytes, value };
}

function appendHistory(manifest, event, actorThreadId) {
  const at = new Date().toISOString();
  return {
    ...manifest,
    updatedAt: at,
    history: [...manifest.history, { event, at, ...(actorThreadId ? { actorThreadId } : {}) }],
  };
}

function requestDirectory(outputDir, requestId) {
  if (!UUID.test(requestId)) throw new Error('Identifiant de demande invalide.');
  const root = resolve(outputDir);
  const directory = resolve(root, requestId);
  if (!isInside(root, directory)) throw new Error('Dossier de demande hors de output-dir.');
  return { root, directory };
}

function manifestPath(requestDir) { return join(requestDir, 'manifest.json'); }
function requestPath(requestDir) { return join(requestDir, 'request.json'); }
function resultPath(requestDir) { return join(requestDir, 'result.json'); }

function readManifest(requestDir) {
  const directory = realpathSync(requestDir);
  const id = directory.split(/[\\/]/).at(-1);
  if (!UUID.test(id)) throw new Error('Dossier de demande invalide : UUID absent.');
  let manifest;
  try { manifest = JSON.parse(readFileSync(manifestPath(directory), 'utf8')); }
  catch { throw new Error('État de relais absent ou corrompu ; les artefacts sont conservés.'); }
  // Early v1 bundles did not duplicate their own path. Derive only this field;
  // all destination, request digest and identity checks below still apply.
  if (manifest?.schema === HANDOFF_SCHEMA && manifest.manifestPath === undefined) {
    manifest.manifestPath = manifestPath(directory);
  }
  if (manifest?.schema !== HANDOFF_SCHEMA || manifest.requestId !== id || manifest.requestPath !== requestPath(directory)
    || manifest.requestDir !== directory || manifest.manifestPath !== manifestPath(directory)
    || !UUID.test(manifest.targetThreadId || '') || !/^[0-9a-f]{64}$/i.test(manifest.requestDigest || '')
    || !Array.isArray(manifest.history)) throw new Error('Manifeste de relais invalide ; les artefacts sont conservés.');
  if (!['pending', 'sending', 'queued', 'returned_to_parent', 'unknown', 'failed'].includes(manifest.deliveryStatus)
    || !['pending', 'accepted', 'completed', 'needs_expert', 'blocked'].includes(manifest.workStatus)) {
    throw new Error('Statut de relais invalide ; les artefacts sont conservés.');
  }
  let bytes;
  try { bytes = readFileSync(requestPath(directory)); }
  catch { throw new Error('Requête durable absente ; les autres artefacts sont conservés.'); }
  if (sha256(bytes) !== manifest.requestDigest) throw new Error('Requête durable altérée ; le relais est bloqué et les artefacts sont conservés.');
  let request;
  try { request = JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error('Requête durable corrompue ; les artefacts sont conservés.'); }
  if (request.mode !== manifest.mode || !['review', 'implement'].includes(manifest.mode)) {
    throw new Error('Mode du manifeste incohérent avec la requête durable.');
  }
  const requestArtifacts = Array.isArray(request.sourceArtifacts) ? request.sourceArtifacts : [];
  if (JSON.stringify(requestArtifacts) !== JSON.stringify(manifest.sourceArtifacts || [])) {
    throw new Error('Références source incohérentes avec la requête durable.');
  }
  return { directory, manifest };
}

function acquireTransitionLock(directory) {
  const path = join(directory, 'transition.lock');
  const token = randomUUID();
  let handle;
  try { handle = openSync(path, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Une transition est déjà active ou son verrou doit être vérifié manuellement.');
    throw error;
  }
  writeFileSync(handle, token, 'utf8');
  closeSync(handle);
  return () => {
    try { if (readFileSync(path, 'utf8') === token) unlinkSync(path); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  };
}

export function acceptHandoff({ requestDir, actorThreadId = process.env.CODEX_THREAD_ID } = {}) {
  const { directory } = readManifest(requestDir);
  const release = acquireTransitionLock(directory);
  try {
    const { manifest } = readManifest(directory);
    if (!UUID.test(actorThreadId || '') || actorThreadId.toLowerCase() !== manifest.targetThreadId.toLowerCase()) {
      throw new Error('Seul le thread Sol cible peut accuser réception (CODEX_THREAD_ID ne correspond pas).');
    }
    if (!['queued', 'unknown', 'returned_to_parent'].includes(manifest.deliveryStatus)) {
      throw new Error(`Réception interdite depuis deliveryStatus=${manifest.deliveryStatus}.`);
    }
    if (manifest.workStatus !== 'pending') throw new Error(`Réception déjà traitée : workStatus=${manifest.workStatus}.`);
    const next = appendHistory({ ...manifest, workStatus: 'accepted', acceptedAt: new Date().toISOString(), requestDigest: sha256(readFileSync(requestPath(directory))) }, 'accepted', actorThreadId);
    atomicWriteJson(manifestPath(directory), next);
    return next;
  } finally { release(); }
}

export function completeHandoff({ requestDir, actorThreadId = process.env.CODEX_THREAD_ID, result } = {}) {
  const { directory } = readManifest(requestDir);
  const release = acquireTransitionLock(directory);
  try {
    const { manifest } = readManifest(directory);
    if (!UUID.test(actorThreadId || '') || actorThreadId.toLowerCase() !== manifest.targetThreadId.toLowerCase()) {
      throw new Error('Seul le thread Sol cible peut terminer cette demande (CODEX_THREAD_ID ne correspond pas).');
    }
    if (manifest.workStatus !== 'accepted') throw new Error('La demande doit être acceptée avant son résultat.');
    const { bytes, value } = requestBytesAndValue(result, MAX_RESULT_BYTES, 'Résultat');
    const validated = validateHandoffResult(value);
    // Preserve Sol's exact JSON when supplied as text; the schema check is separate.
    const resultBytes = Buffer.isBuffer(result) || typeof result === 'string'
      ? bytes
      : Buffer.from(`${JSON.stringify(validated, null, 2)}\n`, 'utf8');
    writeImmutable(resultPath(directory), resultBytes);
    const next = appendHistory({
      ...manifest,
      workStatus: validated.status,
      resultPath: resultPath(directory),
      resultDigest: sha256(resultBytes),
      resultRecordedAt: new Date().toISOString(),
    }, validated.status, actorThreadId);
    atomicWriteJson(manifestPath(directory), next);
    return next;
  } finally { release(); }
}

export function statusHandoff(requestDir) {
  const { directory, manifest } = readManifest(requestDir);
  const hasResult = existsSync(resultPath(directory));
  const resultWorkStatus = ['completed', 'needs_expert', 'blocked'].includes(manifest.workStatus);
  if (resultWorkStatus !== !!manifest.resultPath || (hasResult && !manifest.resultPath)) {
    throw new Error('État du résultat incomplet ou orphelin ; les artefacts sont conservés.');
  }
  if (manifest.resultPath) {
    if (manifest.resultPath !== resultPath(directory) || !/^[0-9a-f]{64}$/i.test(manifest.resultDigest || '')) {
      throw new Error('Référence du résultat invalide ; les artefacts sont conservés.');
    }
    let bytes;
    try { bytes = readFileSync(resultPath(directory)); }
    catch { throw new Error('Résultat référencé absent ; les artefacts sont conservés.'); }
    if (sha256(bytes) !== manifest.resultDigest) throw new Error('Résultat durable altéré ; les artefacts sont conservés.');
    const result = validateHandoffResult(bytes);
    if (result.status !== manifest.workStatus) throw new Error('Statut du résultat incohérent avec le manifeste ; les artefacts sont conservés.');
  }
  return manifest;
}

export function queueArguments({ targetThreadId, cwd, mode, message }) {
  if (!UUID.test(targetThreadId || '')) throw new Error('--thread doit être un UUID explicite.');
  if (!['review', 'implement'].includes(mode)) throw new Error('Mode de relais inconnu.');
  // Do not change the sandbox of an existing Sol thread while queuing work.
  return ['queue', '--profile', 'sol-full', '--thread', targetThreadId, '--cd', cwd, '--message', message];
}

export function findCodex(env = process.env) {
  if (env.CODEX_CLI_PATH) {
    if (!existsSync(env.CODEX_CLI_PATH)) throw new Error('CODEX_CLI_PATH ne désigne aucun exécutable.');
    return env.CODEX_CLI_PATH;
  }
  const locator = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['codex'], {
    encoding: 'utf8', windowsHide: true, env: codexEnvironment(env),
  });
  const exe = locator.stdout?.trim().split(/\r?\n/).find(candidate => existsSync(candidate) && !/\.(?:cmd|ps1)$/i.test(candidate));
  if (!exe) throw new Error('CLI Codex natif introuvable ; aucune demande n’a été envoyée.');
  return exe;
}

export function runCodexCommand(exe, args, env = process.env) {
  return new Promise((resolvePromise, rejectPromise) => {
    let child;
    try { child = spawn(exe, args, { windowsHide: true, env: codexEnvironment(env), stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error) { rejectPromise(error); return; }
    let stdout = '';
    let stderr = '';
    let settled = false;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => { if (!settled) { settled = true; rejectPromise(error); } });
    child.once('close', code => { if (!settled) { settled = true; resolvePromise({ code: code ?? -1, stdout, stderr }); } });
  });
}

function summarize(manifest) {
  return {
    requestId: manifest.requestId,
    requestDir: manifest.requestDir,
    requestPath: manifest.requestPath,
    manifestPath: manifest.manifestPath,
    targetThreadId: manifest.targetThreadId,
    configuredProfile: manifest.configuredProfile,
    mode: manifest.mode,
    deliveryStatus: manifest.deliveryStatus,
    workStatus: manifest.workStatus,
    transitionLockNeedsInspection: existsSync(join(manifest.requestDir, 'transition.lock')),
    ...(manifest.messageId ? { messageId: manifest.messageId } : {}),
    ...(manifest.deliveryReason ? { deliveryReason: manifest.deliveryReason } : {}),
    ...(manifest.failureKind ? { failureKind: manifest.failureKind } : {}),
    ...(typeof manifest.authStatusExitCode === 'number' ? { authStatusExitCode: manifest.authStatusExitCode } : {}),
    ...(typeof manifest.queueExitCode === 'number' ? { queueExitCode: manifest.queueExitCode } : {}),
    permissionsChanged: false,
    ...(manifest.resultPath ? { resultPath: manifest.resultPath } : {}),
    ...(['failed', 'unknown'].includes(manifest.deliveryStatus) ? {
      fallback: 'Le relais Luna existant reste une solution manuelle si le queue échoue vraiment ; aucun fallback ne démarre automatiquement.',
    } : {}),
  };
}

/** Creates an immutable request bundle. delivery=queue sends exactly one message; returned_to_parent never queues. */
export async function createHandoff({ request, targetThreadId, outputDir, cwd, delivery, env = process.env, runCommand = runCodexCommand, cliPath } = {}) {
  if (!['queue', 'returned_to_parent'].includes(delivery)) throw new Error("delivery doit valoir 'queue' ou 'returned_to_parent'.");
  if (!UUID.test(targetThreadId || '')) throw new Error('targetThreadId doit être un UUID explicite.');
  if (delivery === 'queue' && env.LAFFINEE_CLAUDE_CALLED_BY_SOL === '1') {
    throw new Error('Claude a été appelé par Sol : rendre needs_sol au thread parent, sans créer de nouveau relais.');
  }
  const { bytes, value } = requestBytesAndValue(request, MAX_REQUEST_BYTES, 'Requête');
  const validated = validateRequest(value, cwd);
  const root = realpathSync(cwd);
  const out = resolve(outputDir);
  mkdirSync(out, { recursive: true });
  const outputRoot = realpathSync(out);
  const requestId = randomUUID();
  const { directory } = requestDirectory(outputRoot, requestId);
  mkdirSync(directory, { recursive: false });
  const savedRequest = Buffer.isBuffer(request) || typeof request === 'string'
    ? bytes
    : Buffer.from(`${JSON.stringify(validated.request, null, 2)}\n`, 'utf8');
  const digest = sha256(savedRequest);
  writeImmutable(requestPath(directory), savedRequest);
  const now = new Date().toISOString();
  let manifest = {
    schema: HANDOFF_SCHEMA,
    requestId,
    requestDir: directory,
    manifestPath: manifestPath(directory),
    requestPath: requestPath(directory),
    requestDigest: digest,
    sourceArtifacts: validated.request.sourceArtifacts || [],
    cwd: root,
    mode: validated.request.mode,
    targetThreadId,
    configuredProfile: 'sol-full',
    permissionsChanged: false,
    delivery: delivery,
    deliveryStatus: delivery === 'queue' ? 'pending' : 'returned_to_parent',
    workStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    history: [{ event: 'created', at: now }],
  };
  atomicWriteJson(manifestPath(directory), manifest);

  if (delivery === 'returned_to_parent') return manifest;

  let attemptedQueue = false;
  const childEnv = codexEnvironment(env);
  try {
    const exe = cliPath || findCodex(env);
    const auth = await runCommand(exe, ['login', 'status'], childEnv);
    manifest = { ...manifest, authStatusExitCode: auth.code };
    if (auth.code !== 0 || !/^Logged in using ChatGPT\s*$/mi.test(`${auth.stdout || ''}\n${auth.stderr || ''}`)) {
      const failureKind = auth.code !== 0 ? 'native_auth' : 'non_chatgpt_auth';
      manifest = appendHistory({ ...manifest, deliveryStatus: 'failed', failureKind }, 'queue_not_attempted');
      atomicWriteJson(manifestPath(directory), manifest);
      return manifest;
    }
    const message = [
      `Demande durable L’Affinée ${requestId}. Lis request.json : ${requestPath(directory)}.`,
      `SHA-256 : ${digest}. Thread cible : ${targetThreadId}. Accuse réception avec : node '${HANDOFF_SCRIPT}' accept --request-dir '${directory}'.`,
      `Mode ${validated.request.mode}. En review, ne modifie aucun fichier. En implement, travaille seulement dans le périmètre déclaré : ${validated.request.ownedFiles.length ? validated.request.ownedFiles.join(', ') : '(aucun fichier imposé)'}. Ce périmètre est une consigne de travail, pas une frontière système par fichier ; le sandbox et les permissions du thread existant ne changent pas.`,
      'Traite une seule demande dans ce thread Sol existant. Ne crée pas de nouveau thread Sol, ne rappelle pas Claude et ne relance pas ce relais. Si une expertise supplémentaire est nécessaire, termine avec status=needs_expert et rends la main au parent.',
      `Après le travail, produis un JSON conforme à ${join(dirname(HANDOFF_SCRIPT), 'sol-handoff-result.schema.json')} puis enregistre-le avec : node '${HANDOFF_SCRIPT}' complete --request-dir '${directory}' --result '<fichier-json>'. completed exige une preuve précise ; needs_expert ou blocked exige une question ouverte.`,
      'La livraison de queue atteste seulement que le message a été mis en file ; ne la considère pas comme prise en charge ou terminée.',
    ].join('\n');
    const args = queueArguments({ targetThreadId, cwd: root, mode: validated.request.mode, message });
    attemptedQueue = true;
    manifest = appendHistory({ ...manifest, deliveryStatus: 'sending' }, 'queue_started');
    atomicWriteJson(manifestPath(directory), manifest);
    const queued = await runCommand(exe, args, childEnv);
    const receipt = queued.code === 0 ? parseQueueReceipt(`${queued.stdout || ''}\n${queued.stderr || ''}`, targetThreadId) : { deliveryStatus: 'unknown', reason: 'queue_nonzero_exit' };
    manifest = appendHistory({
      ...manifest,
      ...receipt,
      deliveryStatus: receipt.deliveryStatus,
      queueExitCode: queued.code,
      ...(receipt.reason ? { deliveryReason: receipt.reason } : {}),
    }, receipt.deliveryStatus === 'queued' ? 'queue_receipt' : 'queue_outcome_unknown');
    atomicWriteJson(manifestPath(directory), manifest);
    return manifest;
  } catch (error) {
    manifest = appendHistory({
      ...manifest,
      deliveryStatus: attemptedQueue ? 'unknown' : 'failed',
      failureKind: attemptedQueue ? 'queue_outcome_unknown' : 'cli_unavailable',
      failureMessage: String(error?.message || 'Échec CLI').slice(0, 1024),
    }, attemptedQueue ? 'queue_outcome_unknown' : 'queue_not_attempted');
    atomicWriteJson(manifestPath(directory), manifest);
    return manifest;
  }
}

function parseArguments(args) {
  const action = args[0];
  if (!['send', 'status', 'accept', 'complete'].includes(action)) throw new Error('Action attendue : send, status, accept ou complete.');
  const values = new Map();
  let dryRun = false;
  const valued = new Set(['--request', '--output-dir', '--cwd', '--thread', '--request-dir', '--result']);
  for (let i = 1; i < args.length; i++) {
    const name = args[i];
    if (name === '--dry-run') {
      if (dryRun) throw new Error('Option répétée : --dry-run.');
      dryRun = true;
      continue;
    }
    if (!valued.has(name)) throw new Error(`Option inconnue : ${name}.`);
    if (values.has(name)) throw new Error(`Option répétée : ${name}.`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Valeur manquante pour ${name}.`);
    values.set(name, value);
  }
  const allowedByAction = {
    send: new Set(['--request', '--output-dir', '--cwd', '--thread']),
    status: new Set(['--request-dir']),
    accept: new Set(['--request-dir']),
    complete: new Set(['--request-dir', '--result']),
  };
  for (const name of values.keys()) if (!allowedByAction[action].has(name)) throw new Error(`${name} ne s’applique pas à ${action}.`);
  if (dryRun && action !== 'send') throw new Error('--dry-run ne s’applique qu’à send.');
  for (const required of allowedByAction[action]) if (!values.has(required)) throw new Error(`${required} est requis pour ${action}.`);
  return { action, values, dryRun };
}

export async function main(args = process.argv.slice(2), dependencies = {}) {
  const { action, values, dryRun } = parseArguments(args);
  const env = dependencies.env || process.env;
  if (action === 'send') {
    if (env.LAFFINEE_CLAUDE_CALLED_BY_SOL === '1') throw new Error('Claude a été appelé par Sol : rendre needs_sol au parent, sans créer de relais.');
    const requestText = readBoundedText(resolve(values.get('--request')), MAX_REQUEST_BYTES, 'Requête');
    const validated = validateRequest(requestText, values.get('--cwd'));
    if (dryRun) {
      const preview = queueArguments({ targetThreadId: values.get('--thread'), cwd: validated.cwd, mode: validated.request.mode, message: '<requête durable>' });
      return { dryRun: true, targetThreadId: values.get('--thread'), configuredProfile: 'sol-full', mode: validated.request.mode, permissionsChanged: false, command: preview };
    }
    const manifest = await createHandoff({
      request: requestText,
      targetThreadId: values.get('--thread'),
      outputDir: values.get('--output-dir'),
      cwd: values.get('--cwd'),
      delivery: 'queue',
      env,
      ...(dependencies.runCommand ? { runCommand: dependencies.runCommand } : {}),
      ...(dependencies.cliPath ? { cliPath: dependencies.cliPath } : {}),
    });
    return summarize(manifest);
  }
  const requestDir = values.get('--request-dir');
  if (action === 'status') return summarize(statusHandoff(requestDir));
  if (action === 'accept') return summarize(acceptHandoff({ requestDir, actorThreadId: env.CODEX_THREAD_ID }));
  const resultText = readBoundedText(resolve(values.get('--result')), MAX_RESULT_BYTES, 'Résultat');
  return summarize(completeHandoff({ requestDir, actorThreadId: env.CODEX_THREAD_ID, result: resultText }));
}

if (process.argv[1] && resolve(process.argv[1]) === HANDOFF_SCRIPT) {
  main().then(result => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result?.deliveryStatus === 'failed' || result?.deliveryStatus === 'unknown') process.exitCode = 1;
  }).catch(error => {
    process.stderr.write(`${error?.message || 'Échec du relais Sol.'}\n`);
    process.exitCode = 1;
  });
}
