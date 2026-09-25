// Native Claude Code subscription bridge. No SDK, token extraction or API proxy.
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, openSync, closeSync, unlinkSync, renameSync, readdirSync, readFileSync, writeFileSync, realpathSync, statSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const MAX_BRIEF_BYTES = 24 * 1024;
const DEFAULT_MAX_TURNS = 30;
const MAX_FILES = 12;
const MAX_TEXT_BYTES = 128 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_SOURCE_BYTES = 32 * 1024 * 1024;
const MAX_STREAM_EVENT_BYTES = 64 * 1024 * 1024;
const MAX_STDERR_CHARS = 8 * 1024;
const MAX_ACTIVE_TOOLS = 32;
const PROGRESS_SCHEMA = 'laffinee.claude-progress.v1';
const RECOVERY_SCHEMA = 'laffinee.claude-recovery.v1';
const PROGRESS_TOOL_NAMES = new Set(['Read', 'Edit', 'Write', 'Bash']);
const PROGRESS_COUNTERS = new Set(['reads', 'editWriteAttempts', 'toolErrors', 'permissionRefusals', 'retries']);
const PROGRESS_CATEGORIES = new Set([
  'permission_refused', 'tool_error', 'allowed', 'allowed_warning', 'rejected', 'unknown', 'conflict', 'report_error', 'result_write_error',
]);
const PROGRESS_STATUSES = new Set(['not_requested', 'pending', 'completed', 'failed', 'not_attempted']);
const PROGRESS_DELIVERY_OUTCOMES = new Set(['completed', 'conflict', 'error', 'not_attempted']);
const RECOVERY_SOURCE_STATUSES = new Set(['unchanged', 'changed', 'missing', 'unreadable']);
const RECOVERY_COPY_STATUSES = new Set(['missing', 'unreadable']);

export function subscriptionEnvironment(source = process.env) {
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (/^ANTHROPIC_/i.test(key)
      || /^CLAUDE_CODE_(USE_(BEDROCK|VERTEX|FOUNDRY|ANTHROPIC_AWS|MANTLE)|SIMPLE|PROVIDER_MANAGED_BY_HOST)$/i.test(key)
      || /^CLAUDECODE$/i.test(key)) delete env[key];
  }
  env.CLAUDE_CODE_EFFORT_LEVEL = 'xhigh';
  return env;
}

export function subscriptionStatus(status) {
  if (!status.loggedIn || status.authMethod !== 'claude.ai' || status.apiKeySource || status.apiProvider !== 'firstParty') {
    throw new Error('Une session native claude.ai est requise ; connexion API refusée.');
  }
  if (status.subscriptionType !== 'pro') throw new Error('Une session Claude Pro est requise.');
  return { loggedIn: true, authMethod: status.authMethod, subscriptionType: status.subscriptionType };
}

export function parseLauncherOptions(input) {
  const values = new Map();
  const files = [];
  const switches = new Set(['--diagnose', '--dry-run', '--with-luna']);
  const valued = new Set(['--cwd', '--brief', '--output', '--mode', '--allow-file', '--max-turns']);
  for (let i = 0; i < input.length; i++) {
    const name = input[i];
    if (switches.has(name)) {
      if (values.has(name)) throw new Error(`Option répétée : ${name}`);
      values.set(name, true);
    } else if (valued.has(name)) {
      const value = input[++i];
      if (!value || value.startsWith('--')) throw new Error(`Valeur manquante pour ${name}.`);
      if (name === '--allow-file') files.push(value);
      else {
        if (values.has(name)) throw new Error(`Option répétée : ${name}`);
        values.set(name, value);
      }
    } else throw new Error(`Option inconnue : ${name}`);
  }
  const mode = values.get('--mode') || 'review';
  if (!['review', 'edit'].includes(mode)) throw new Error('Mode attendu : review ou edit.');
  const rawTurns = values.get('--max-turns') || String(DEFAULT_MAX_TURNS);
  if (!/^[1-9]\d*$/.test(rawTurns) || !Number.isSafeInteger(Number(rawTurns))) throw new Error('--max-turns doit être un entier positif sûr.');
  if (files.length > MAX_FILES) throw new Error(`Au plus ${MAX_FILES} fichiers explicites par mission.`);
  if (values.has('--diagnose') && values.has('--dry-run')) throw new Error('Choisir --diagnose ou --dry-run.');
  if (!values.has('--diagnose') && (!values.get('--brief') || !values.get('--output'))) {
    throw new Error('--brief et --output sont requis. Vérifier dans Claude > Usage que les crédits supplémentaires sont désactivés.');
  }
  return {
    cwd: resolve(values.get('--cwd') || process.cwd()), mode, files,
    maxTurns: Number(rawTurns), brief: values.get('--brief'), output: values.get('--output'),
    luna: !!values.get('--with-luna'), dryRun: !!values.get('--dry-run'), diagnose: !!values.get('--diagnose'),
  };
}

export function readBrief(path, maxBytes = MAX_BRIEF_BYTES) {
  const bytes = readFileSync(resolve(path));
  if (bytes.length > maxBytes) throw new Error(`Brief trop long : ${bytes.length} octets ; maximum ${maxBytes}. Réduire le brief sans tronquer.`);
  let brief;
  try { brief = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('Brief invalide : UTF-8 requis.'); }
  if (!brief.trim() || brief.includes('\0')) throw new Error('Brief invalide : texte non vide et sans octet nul requis.');
  return brief;
}

function inside(root, path) {
  const rest = relative(root, path);
  return !!rest && !rest.startsWith('..') && !isAbsolute(rest);
}

export function describeSources(cwd, files, mode = 'review') {
  if (!['review', 'edit'].includes(mode)) throw new Error('Mode attendu : review ou edit.');
  if (mode === 'edit' && !files.length) throw new Error('Une liste explicite de fichiers est requise pour modifier.');
  if (files.length > MAX_FILES) throw new Error(`Au plus ${MAX_FILES} fichiers explicites par mission.`);
  const root = realpathSync(cwd);
  const seen = new Set();
  let total = 0;
  return files.map((file, index) => {
    if (typeof file !== 'string' || !file.trim() || /[\r\n\0*?\[\]{}]/.test(file)) throw new Error(`Chemin de fichier invalide : ${file}`);
    if (mode === 'edit' && (isAbsolute(file) || /[()!:]/.test(file))) throw new Error(`Chemin de modification non borné : ${file}`);
    const candidate = resolve(root, file);
    if (!isAbsolute(file) && !inside(root, candidate)) throw new Error(`Chemin relatif hors du dossier de travail : ${file}`);
    const source = realpathSync(candidate);
    if (!isAbsolute(file) && !inside(root, source)) throw new Error(`Lien sortant du dossier de travail : ${file}`);
    if (mode === 'edit' && !inside(root, source)) throw new Error(`Chemin de modification non borné : ${file}`);
    const key = process.platform === 'win32' ? source.toLowerCase() : source;
    if (seen.has(key)) throw new Error(`Fichier répété : ${file}`);
    seen.add(key);
    const info = statSync(source);
    if (!info.isFile()) throw new Error(`Fichier ordinaire requis : ${file}`);
    const image = /\.(?:png|jpe?g|webp|gif|avif)$/i.test(extname(source));
    const cap = image ? MAX_IMAGE_BYTES : MAX_TEXT_BYTES;
    if (info.size > cap) throw new Error(`Fichier trop gros : ${file} (${info.size} octets ; maximum ${cap}).`);
    total += info.size;
    if (total > MAX_TOTAL_SOURCE_BYTES) throw new Error(`Fichiers fournis trop volumineux : ${total} octets ; maximum ${MAX_TOTAL_SOURCE_BYTES}.`);
    const staged = inside(root, source) ? relative(root, source).replaceAll('\\', '/') : `attachments/${String(index + 1).padStart(2, '0')}-${basename(source)}`;
    return { source, staged, size: info.size, digest: createHash('sha256').update(readFileSync(source)).digest('hex') };
  });
}

export function stageSources(directory, sources) {
  for (const file of sources) {
    const target = resolve(directory, file.staged);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(file.source, target);
    if (hashFile(target) !== file.digest) throw new Error(`Le fichier ${file.source} a changé pendant sa copie ; relancer la mission.`);
  }
}

function hashFile(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

export function applyStagedEdits(directory, sources) {
  const changed = sources.filter(file => hashFile(resolve(directory, file.staged)) !== file.digest);
  for (const file of changed) {
    if (hashFile(file.source) !== file.digest) throw new Error(`Conflit : ${file.source} a changé pendant la mission. Copies conservées dans ${directory}.`);
  }
  for (const file of changed) copyFileSync(resolve(directory, file.staged), file.source);
  return changed.map(file => file.source);
}

export function applyStagedEditsWithProgress(directory, sources, tracker, recoveryManifestPath) {
  try {
    const changedFiles = applyStagedEdits(directory, sources);
    tracker.record('résultat', 'report_fichiers_termine', {
      outcome: 'completed', modelOutcome: 'completed', resultStatus: 'completed',
      deliveryStatus: 'completed', deliveryOutcome: 'completed',
    });
    return changedFiles;
  } catch (error) {
    const conflict = /^Conflit\s*:/i.test(String(error?.message || ''));
    const recovery = writeClaudeRecoveryManifest(recoveryManifestPath || join(directory, 'recovery.json'), directory, sources,
      { reportMayBePartial: !conflict });
    tracker.record('erreur', 'report_fichiers_en_erreur', {
      outcome: 'delivery_error', modelOutcome: 'completed', resultStatus: 'completed',
      deliveryStatus: 'failed', deliveryOutcome: conflict ? 'conflict' : 'error',
      category: conflict ? 'conflict' : 'report_error',
      recovery,
    });
    try { error.recovery = recovery; } catch { /* Keep the first report error intact. */ }
    throw error;
  }
}

export function claudeProgressPath(output) { return `${resolve(output)}.progress.json`; }
export function claudeRecoveryPath(output) { return `${resolve(output)}.recovery.json`; }

export function inspectStagedChanges(directory, sources) {
  const root = resolve(directory);
  const files = [];
  const unavailable = [];
  for (const file of sources.slice(0, MAX_FILES)) {
    const path = typeof file?.staged === 'string' ? file.staged : '';
    try {
      const stagedPath = resolve(root, path);
      if (!path || !inside(root, stagedPath)) throw Object.assign(new Error(), { code: 'EINVAL' });
      const info = statSync(stagedPath);
      if (!info.isFile()) throw Object.assign(new Error(), { code: 'EINVAL' });
      const digest = hashFile(stagedPath);
      if (digest === file.digest) continue;

      let sourceStatus = 'unreadable';
      let sourceDiffers = null;
      try {
        sourceDiffers = hashFile(file.source) !== file.digest;
        sourceStatus = sourceDiffers ? 'changed' : 'unchanged';
      } catch (error) { sourceStatus = error?.code === 'ENOENT' ? 'missing' : 'unreadable'; }
      files.push({ path, size: info.size, sha256: digest, sourceDiffers, sourceStatus });
    } catch (error) {
      unavailable.push({ path, status: error?.code === 'ENOENT' ? 'missing' : 'unreadable' });
    }
  }
  return { files, unavailable };
}

export function writeClaudeRecoveryManifest(manifestPath, directory, sources, { reportMayBePartial = false } = {}) {
  const inventory = inspectStagedChanges(directory, sources);
  const manifest = {
    schema: RECOVERY_SCHEMA,
    status: 'unreviewed',
    createdAt: new Date().toISOString(),
    directory: resolve(directory),
    manifestPath: resolve(manifestPath),
    validated: false,
    // An I/O failure during report can happen after another copy succeeded.
    autoApplied: reportMayBePartial ? null : false,
    reportMayBePartial,
    ...inventory,
  };
  const manifestWritten = writeJsonAtomically(manifest.manifestPath, manifest);
  return { ...manifest, manifestStatus: manifestWritten ? 'written' : 'write_failed' };
}

export function recordClaudeFailureRecovery({ manifestPath, directory, sources, tracker, outcome,
  receivedFinalResult, deliveryRequested = false }) {
  const recovery = writeClaudeRecoveryManifest(manifestPath, directory, sources);
  tracker.record('erreur', receivedFinalResult ? 'résultat_final' : 'résultat_absent', {
    outcome, modelOutcome: outcome, resultStatus: 'completed',
    deliveryStatus: deliveryRequested ? 'not_attempted' : 'not_requested',
    deliveryOutcome: deliveryRequested ? 'not_attempted' : undefined,
    recovery,
  });
  return recovery;
}

export function checkedOutputPath(output, brief, sources) {
  const destination = resolve(output);
  const progress = claudeProgressPath(destination);
  const recovery = claudeRecoveryPath(destination);
  const key = path => {
    const canonical = existsSync(path) ? realpathSync(path) : resolve(path);
    return process.platform === 'win32' ? canonical.toLowerCase() : canonical;
  };
  const protectedPaths = [resolve(brief), ...sources.map(file => file.source)];
  if ([destination, progress, recovery].some(target => protectedPaths.some(path => key(path) === key(target)))) {
    throw new Error('Le résultat, son état de progression ou son manifeste de récupération ne peut pas écraser le brief ou un fichier fourni.');
  }
  return destination;
}

function shellQuote(value) { return `'${value.replaceAll('\\', '/').replaceAll("'", "'\"'\"'")}'`; }

export function lunaRelayCommand(cwd, directory) {
  const relay = join(dirname(fileURLToPath(import.meta.url)), 'luna-review.mjs');
  return `node ${shellQuote(relay)} --tasks ${shellQuote(join(directory, 'luna-tasks.json'))} --output-dir ${shellQuote(join(directory, 'luna'))} --cwd ${shellQuote(cwd)}`;
}

export function claudeArguments({ mode = 'review', files = [], luna = false, maxTurns = DEFAULT_MAX_TURNS, relayCommand } = {}) {
  if (!['review', 'edit'].includes(mode)) throw new Error('Mode attendu : review ou edit.');
  if (!Number.isSafeInteger(maxTurns) || maxTurns < 1) throw new Error('--max-turns doit être un entier positif sûr.');
  if (mode === 'edit' && !files.length) throw new Error('Une liste explicite de fichiers est requise pour modifier.');
  if (luna && !relayCommand) throw new Error('Commande Luna ciblée requise.');
  const allowed = [];
  const tools = [];
  if (files.length || luna || mode === 'edit') tools.push('Read');
  if (mode === 'edit') {
    tools.push('Edit', 'Write');
    for (const file of files) {
      if (isAbsolute(file) || !file || /(^|\/)\.\.($|\/)|[\\*?\[\]{}()!:\r\n]/.test(file)) throw new Error(`Chemin de modification non borné : ${file}`);
      // Claude Code consults Edit(path) for both Edit and Write.
      allowed.push(`Edit(./${file})`);
    }
  }
  if (luna) {
    if (!tools.includes('Write')) tools.push('Write');
    tools.push('Bash');
    allowed.push('Edit(./luna-tasks.json)', `Bash(${relayCommand})`);
  }
  // In dontAsk mode, listing Read in --tools does not approve its use.
  // --restricted confines it to the isolated mission directory.
  if (tools.includes('Read')) allowed.unshift('Read');
  const args = ['--print', '--safe-mode', '--restricted', '--model', 'claude-opus-5-5', '--effort', 'xhigh',
    '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
    '--no-session-persistence', '--permission-mode', 'dontAsk',
    '--permission-prompts', 'none', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--disallowedTools', 'mcp__*', '--max-turns', String(maxTurns), '--tools', tools.join(',')];
  if (allowed.length) args.push('--allowedTools', ...allowed);
  return args;
}

export function classifyClaudeOutcome({ code, response, errorText = '' }) {
  const subtype = String(response?.subtype || '').toLowerCase();
  if (/max[_ -]?turns/.test(subtype)) return 'turn_budget_reached';
  if (code === 0 && response && !response.is_error && !subtype.startsWith('error')) return 'completed';
  const detail = [subtype, response?.result, errorText].filter(Boolean).join(' ').toLowerCase();
  if (/max[_ -]?turns|maximum (?:number of )?(?:agentic )?turns|turn limit|tour[s]? maximum|budget de tours/.test(detail)) return 'turn_budget_reached';
  if (/usage limit|quota|rate limit|you.ve (?:hit|reached) (?:your |the )?(?:(?:session|weekly|opus|sonnet|individual) )?limit|spend limit|credit limit|limite d.utilisation/.test(detail)) return 'quota_reached';
  return 'claude_error';
}

const CLAUDE_OUTCOMES = new Set(['completed', 'turn_budget_reached', 'quota_reached', 'claude_error']);
const PROGRESS_OUTCOMES = new Set([...CLAUDE_OUTCOMES, 'delivery_error']);

function writeJsonAtomically(path, value) {
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, JSON.stringify(value), { encoding: 'utf8', flag: 'wx' });
    renameSync(temporary, path);
    return true;
  } catch {
    try { if (existsSync(temporary)) unlinkSync(temporary); } catch { /* Preserve the original operation error. */ }
    return false;
  }
}

function sanitizeRecoverySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const shortPath = value => typeof value === 'string' ? value.slice(0, 1024) : '';
  return {
    schema: RECOVERY_SCHEMA,
    status: 'unreviewed',
    createdAt: typeof snapshot.createdAt === 'string' ? snapshot.createdAt.slice(0, 40) : '',
    directory: shortPath(snapshot.directory),
    manifestPath: shortPath(snapshot.manifestPath),
    manifestStatus: snapshot.manifestStatus === 'written' ? 'written' : 'write_failed',
    validated: false,
    autoApplied: snapshot.reportMayBePartial === true ? null : false,
    reportMayBePartial: snapshot.reportMayBePartial === true,
    files: (Array.isArray(snapshot.files) ? snapshot.files : []).slice(0, MAX_FILES).flatMap(file => {
      if (!file || typeof file.path !== 'string' || !Number.isSafeInteger(file.size) || file.size < 0
        || !/^[a-f\d]{64}$/i.test(file.sha256 || '') || !RECOVERY_SOURCE_STATUSES.has(file.sourceStatus)) return [];
      return [{
        path: file.path.slice(0, 512), size: file.size, sha256: file.sha256.toLowerCase(),
        sourceDiffers: typeof file.sourceDiffers === 'boolean' ? file.sourceDiffers : null,
        sourceStatus: file.sourceStatus,
      }];
    }),
    unavailable: (Array.isArray(snapshot.unavailable) ? snapshot.unavailable : []).slice(0, MAX_FILES).flatMap(file => {
      if (!file || typeof file.path !== 'string' || !RECOVERY_COPY_STATUSES.has(file.status)) return [];
      return [{ path: file.path.slice(0, 512), status: file.status }];
    }),
  };
}

export function createClaudeProgressTracker(progressFile, { deliveryRequested = false } = {}) {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const state = {
    schema: PROGRESS_SCHEMA,
    status: 'initialisation',
    startedAt,
    updatedAt: startedAt,
    elapsedMs: 0,
    lastEvent: { type: 'préparation', at: startedAt, elapsedMs: 0 },
    outcome: null,
    modelOutcome: null,
    resultStatus: 'pending',
    deliveryStatus: deliveryRequested ? 'pending' : 'not_requested',
    deliveryOutcome: null,
    counters: { reads: 0, editWriteAttempts: 0, toolErrors: 0, permissionRefusals: 0, retries: 0 },
    recovery: null,
  };
  let enabled = true;
  let timer;

  const persist = () => {
    if (!enabled) return;
    if (!writeJsonAtomically(progressFile, state)) enabled = false;
  };
  const refresh = () => {
    const now = Date.now();
    state.updatedAt = new Date(now).toISOString();
    state.elapsedMs = now - startedAtMs;
    persist();
  };
  const update = (status, type, { tool, outcome, modelOutcome, resultStatus, deliveryStatus,
    deliveryOutcome, category, counters, recovery } = {}, writeImmediately = true) => {
    const now = Date.now();
    state.status = status;
    state.updatedAt = new Date(now).toISOString();
    state.elapsedMs = now - startedAtMs;
    state.lastEvent = { type, at: state.updatedAt, elapsedMs: state.elapsedMs };
    if (PROGRESS_TOOL_NAMES.has(tool)) state.lastEvent.tool = tool;
    if (PROGRESS_CATEGORIES.has(category)) state.lastEvent.category = category;
    if (PROGRESS_OUTCOMES.has(outcome)) state.outcome = outcome;
    if (CLAUDE_OUTCOMES.has(modelOutcome)) state.modelOutcome = modelOutcome;
    if (PROGRESS_STATUSES.has(resultStatus)) state.resultStatus = resultStatus;
    if (PROGRESS_STATUSES.has(deliveryStatus)) state.deliveryStatus = deliveryStatus;
    if (PROGRESS_DELIVERY_OUTCOMES.has(deliveryOutcome)) state.deliveryOutcome = deliveryOutcome;
    if (recovery) state.recovery = sanitizeRecoverySnapshot(recovery);
    for (const counter of Array.isArray(counters) ? counters : [counters]) {
      if (PROGRESS_COUNTERS.has(counter)) state.counters[counter] = Math.min(Number.MAX_SAFE_INTEGER, state.counters[counter] + 1);
    }
    if (writeImmediately) persist();
  };
  const record = (status, type, details) => update(status, type, details, true);

  persist();
  if (!enabled) throw new Error('Impossible de créer l’état de progression Claude.');
  timer = setInterval(refresh, 1000);
  timer.unref?.();
  return {
    startedAtMs,
    record,
    updateRecovery(recovery) {
      const sanitized = sanitizeRecoverySnapshot(recovery);
      if (!sanitized) return;
      state.recovery = sanitized;
      const now = Date.now();
      state.updatedAt = new Date(now).toISOString();
      state.elapsedMs = now - startedAtMs;
      persist();
    },
    activity() { update('en_cours', 'fragment_de_réponse', {}, false); },
    stopHeartbeat() { if (timer) clearInterval(timer); timer = undefined; },
  };
}

function claudeEventBlocks(event) {
  const blocks = [];
  if (Array.isArray(event?.message?.content)) blocks.push(...event.message.content);
  if (Array.isArray(event?.content)) blocks.push(...event.content);
  const streamed = event?.type === 'stream_event' ? event.event : event;
  if (streamed?.type === 'content_block_start' && streamed.content_block) blocks.push(streamed.content_block);
  return blocks;
}

function isPermissionRefusal(block) {
  const signals = [block?.error_code, block?.error_type];
  if (typeof block?.error === 'string') signals.push(block.error);
  else if (block?.error && typeof block.error === 'object') signals.push(block.error.code, block.error.type);
  if (typeof block?.content === 'string') signals.push(block.content.slice(0, 8192));
  else if (Array.isArray(block?.content)) {
    for (const part of block.content.slice(0, 8)) {
      if (typeof part?.text === 'string') signals.push(part.text.slice(0, 8192));
      else if (typeof part === 'string') signals.push(part.slice(0, 8192));
    }
  }
  return /permission(?:[_\s]+)(?:was[_\s]+)?(?:denied|refused)|permission\s+to\s+use\b.{0,256}\bdenied|(?:denied|refused)[_\s]+permission|not permitted|approval required/i
    .test(signals.filter(value => typeof value === 'string').join(' ').slice(0, 8192));
}

function rateLimitCategory(event) {
  const status = event?.rate_limit_info?.status ?? event?.status;
  return ['allowed', 'allowed_warning', 'rejected'].includes(status) ? status : 'unknown';
}

export async function captureClaudeProcess(child, tracker) {
  let pending = '';
  let discardingLargeEvent = false;
  let response;
  let responseLine;
  let errorText = '';
  let launchError = false;
  const activeTools = new Map();
  const countedPermissionRefusals = new Set();
  let pendingAnonymousPermissionRefusals = 0;
  let lastTool;

  const rememberPermissionId = toolUseId => {
    if (typeof toolUseId !== 'string' || countedPermissionRefusals.has(toolUseId)) return;
    if (countedPermissionRefusals.size >= MAX_ACTIVE_TOOLS) countedPermissionRefusals.delete(countedPermissionRefusals.values().next().value);
    countedPermissionRefusals.add(toolUseId);
  };
  const notePermissionRefusal = (toolUseId, source) => {
    if (typeof toolUseId === 'string' && countedPermissionRefusals.has(toolUseId)) return false;
    if (source === 'tool_result' && pendingAnonymousPermissionRefusals > 0) {
      pendingAnonymousPermissionRefusals--;
      rememberPermissionId(toolUseId);
      return false;
    }
    if (typeof toolUseId === 'string') rememberPermissionId(toolUseId);
    else if (source === 'system') pendingAnonymousPermissionRefusals = Math.min(MAX_ACTIVE_TOOLS, pendingAnonymousPermissionRefusals + 1);
    return true;
  };

  const observe = (event, rawLine) => {
    if (!event || typeof event !== 'object') return;
    if (event.type === 'system' && event.subtype === 'init') {
      tracker.record('attente', 'initialisation');
    } else if (event.type === 'system' && event.subtype === 'api_retry') {
      tracker.record('attente', 'réessai', { counters: 'retries' });
    } else if (event.type === 'rate_limit_event') {
      const category = rateLimitCategory(event);
      const status = category === 'rejected' ? 'erreur' : category === 'unknown' ? 'inconnu' : 'information';
      tracker.record(status, 'etat_quota', { category });
    } else if (event.type === 'system' && event.subtype === 'permission_denied') {
      let toolUseId = typeof event.tool_use_id === 'string' ? event.tool_use_id : event.tool_use?.id;
      if (typeof toolUseId !== 'string' && PROGRESS_TOOL_NAMES.has(event.tool_name)) {
        const matchingTools = [...activeTools].filter(([, name]) => name === event.tool_name);
        if (matchingTools.length === 1) [toolUseId] = matchingTools[0];
      }
      const tool = activeTools.get(toolUseId) || (PROGRESS_TOOL_NAMES.has(event.tool_name) ? event.tool_name : undefined);
      tracker.record('erreur', 'refus_permission', {
        tool, category: 'permission_refused', counters: notePermissionRefusal(toolUseId, 'system') ? 'permissionRefusals' : undefined,
      });
    } else if (event.type === 'error' || (event.type === 'system' && /^(?:error|fatal_error)$/.test(String(event.subtype || '')))) {
      tracker.record('erreur', 'erreur');
    }

    if (event.type === 'stream_event' && event.event?.type === 'content_block_delta'
      && event.event.delta?.type === 'text_delta') tracker.activity();

    for (const block of claudeEventBlocks(event)) {
      if (block?.type === 'tool_use' && PROGRESS_TOOL_NAMES.has(block.name)) {
        lastTool = block.name;
        if (typeof block.id === 'string' && activeTools.size < MAX_ACTIVE_TOOLS) activeTools.set(block.id, block.name);
        tracker.record('outil', 'outil_démarré', {
          tool: block.name,
          counters: block.name === 'Read' ? 'reads' : ['Edit', 'Write'].includes(block.name) ? 'editWriteAttempts' : undefined,
        });
      } else if (block?.type === 'tool_result') {
        const toolUseId = typeof block.tool_use_id === 'string' ? block.tool_use_id : undefined;
        const tool = toolUseId ? activeTools.get(toolUseId) : lastTool;
        if (toolUseId) activeTools.delete(toolUseId);
        if (block.is_error === true) {
          const permission = isPermissionRefusal(block);
          const counters = ['toolErrors'];
          if (permission && notePermissionRefusal(toolUseId, 'tool_result')) counters.push('permissionRefusals');
          tracker.record('erreur', 'outil_en_erreur', {
            tool, category: permission ? 'permission_refused' : 'tool_error', counters,
          });
        } else tracker.record('attente', 'retour_outil', { tool });
      }
    }

    if (event.type === 'result') {
      response = event;
      responseLine = rawLine;
    }
  };

  const acceptLine = line => {
    const clean = line.trim();
    if (!clean) return;
    if (Buffer.byteLength(clean, 'utf8') > MAX_STREAM_EVENT_BYTES) {
      tracker.record('erreur', 'événement_trop_volumineux');
      return;
    }
    try { observe(JSON.parse(clean), clean); } catch { /* Ignore non-JSON CLI output without echoing it. */ }
  };

  const onStdout = chunk => {
    if (discardingLargeEvent) {
      const newline = chunk.indexOf('\n');
      if (newline === -1) return;
      chunk = chunk.slice(newline + 1);
      discardingLargeEvent = false;
    }
    if (!chunk) return;
    pending += chunk;
    let newline;
    while ((newline = pending.indexOf('\n')) !== -1) {
      const line = pending.slice(0, newline);
      pending = pending.slice(newline + 1);
      acceptLine(line);
    }
    if (Buffer.byteLength(pending, 'utf8') > MAX_STREAM_EVENT_BYTES) {
      discardingLargeEvent = true;
      pending = '';
      tracker.record('erreur', 'événement_trop_volumineux');
    }
  };

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', onStdout);
  child.stderr.on('data', chunk => { errorText = (errorText + chunk).slice(-MAX_STDERR_CHARS); });
  tracker.record('attente', 'processus_lancé');

  const { code } = await new Promise(resolveClose => {
    child.once('error', () => {
      launchError = true;
      tracker.record('erreur', 'erreur_lancement');
    });
    child.once('close', code => resolveClose({ code }));
  });
  if (!discardingLargeEvent && pending.trim()) acceptLine(pending);
  tracker.stopHeartbeat();

  const outcome = classifyClaudeOutcome({ code: launchError ? null : code, response, errorText });
  const receivedFinalResult = !!response;
  if (!response) {
    response = {
      type: 'result', subtype: 'error_cli_stream', is_error: true,
      result: 'Aucun résultat final reçu.', num_turns: 0,
      duration_ms: Date.now() - tracker.startedAtMs,
    };
    responseLine = JSON.stringify(response);
  }
  return {
    code: launchError ? null : code,
    response,
    responseLine,
    errorText,
    outcome,
    receivedFinalResult,
    finalJson: `${responseLine.trim()}\n`,
  };
}

function findClaude() {
  if (process.env.CLAUDE_CLI_PATH && existsSync(process.env.CLAUDE_CLI_PATH)) return process.env.CLAUDE_CLI_PATH;
  const located = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['claude'], { encoding: 'utf8', windowsHide: true });
  const onPath = located.stdout?.trim().split(/\r?\n/).find(path => existsSync(path) && /(?:\.exe)?$/.test(path) && !/\.(?:cmd|ps1)$/.test(path));
  if (onPath) return onPath;
  const packages = join(process.env.LOCALAPPDATA || '', 'Packages');
  if (existsSync(packages)) {
    for (const pkg of readdirSync(packages).filter(name => /^Claude_/.test(name))) {
      const root = join(packages, pkg, 'LocalCache', 'Roaming', 'Claude', 'claude-code');
      if (!existsSync(root)) continue;
      const versions = readdirSync(root).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      for (const version of versions) { const exe = join(root, version, 'claude.exe'); if (existsSync(exe)) return exe; }
    }
  }
  throw new Error('Claude Code introuvable. Installer le CLI natif ou fournir CLAUDE_CLI_PATH.');
}

function cliStatus(exe, env) {
  const version = spawnSync(exe, ['--version'], { encoding: 'utf8', windowsHide: true, env });
  const numbers = version.stdout?.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number);
  if (version.status !== 0 || !numbers || numbers[0] < 2 || (numbers[0] === 2 && (numbers[1] < 1 || (numbers[1] === 1 && numbers[2] < 280)))) {
    throw new Error('Claude Code 2.1.280 ou ultérieur est requis pour Opus 5.5.');
  }
  const auth = spawnSync(exe, ['auth', 'status', '--json'], { encoding: 'utf8', windowsHide: true, env });
  if (auth.status !== 0) throw new Error('Connexion Claude indisponible. Utiliser claude auth login --claudeai.');
  return { version: numbers.join('.'), ...subscriptionStatus(JSON.parse(auth.stdout)), model: 'claude-opus-5-5', effort: 'xhigh' };
}

function acquireClaudeLock() {
  const lock = join(tmpdir(), 'laffinee-claude-frontend.lock');
  if (existsSync(lock)) {
    const previous = Number(readFileSync(lock, 'utf8'));
    try { process.kill(previous, 0); throw new Error('Une revue Claude est déjà active.'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; unlinkSync(lock); }
  }
  const handle = openSync(lock, 'wx'); writeFileSync(handle, String(process.pid)); closeSync(handle);
  return () => unlinkSync(lock);
}

async function main() {
  const options = parseLauncherOptions(process.argv.slice(2));
  const env = subscriptionEnvironment();
  if (options.diagnose) {
    console.log(JSON.stringify({ ...cliStatus(findClaude(), env), cwd: options.cwd }));
    return;
  }
  const brief = readBrief(options.brief);
  const sources = describeSources(options.cwd, options.files, options.mode);
  if (options.luna && sources.some(file => file.staged === 'luna-tasks.json' || file.staged.startsWith('luna/'))) {
    throw new Error('Les fichiers fournis ne doivent pas occuper luna-tasks.json ou luna/.');
  }
  const output = checkedOutputPath(options.output, options.brief, sources);
  const progressFile = claudeProgressPath(output);
  const recoveryManifestPath = claudeRecoveryPath(output);
  const exe = findClaude();
  const status = cliStatus(exe, env);
  const previewDirectory = join(tmpdir(), 'laffinee-claude-preview');
  if (options.dryRun) {
    const relay = options.luna ? lunaRelayCommand(options.cwd, previewDirectory) : undefined;
    console.log(JSON.stringify({
      ...status, dryRun: true, cwd: options.cwd, mode: options.mode,
      maxTurns: options.maxTurns, briefBytes: Buffer.byteLength(brief),
      files: sources.map(({ source, staged, size }) => ({ source, staged, size })),
      args: claudeArguments({ mode: options.mode, files: sources.map(file => file.staged),
        luna: options.luna, maxTurns: options.maxTurns, relayCommand: relay }),
      output, progressFile, recoveryManifestPath,
    }));
    return;
  }
  const release = acquireClaudeLock();
  let directory;
  let keepDirectory = false;
  let progressTracker;
  let progressFinalized = false;
  let modelOutcome;
  let resultWritten = false;
  let recoverySnapshot;
  const ensureRecovery = () => {
    if (!directory) return undefined;
    if (!recoverySnapshot) recoverySnapshot = writeClaudeRecoveryManifest(recoveryManifestPath, directory, sources);
    return recoverySnapshot;
  };
  const logRecovery = outcome => {
    if (!recoverySnapshot) return;
    console.log(JSON.stringify({
      diagnostic: 'claude_recovery', outcome, progressFile, recoveryManifestPath, recovery: recoverySnapshot,
    }));
  };
  try {
    directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-input-'));
    progressTracker = createClaudeProgressTracker(progressFile, { deliveryRequested: options.mode === 'edit' });
    stageSources(directory, sources);
    const relay = options.luna ? lunaRelayCommand(options.cwd, directory) : undefined;
    const args = claudeArguments({ mode: options.mode, files: sources.map(file => file.staged),
      luna: options.luna, maxTurns: options.maxTurns, relayCommand: relay });
    const lines = [
      'Mission unique. Réponds brièvement et clairement en français, avec les preuves utiles.',
      'N’explore pas le dépôt. Les fichiers nommés ci-dessous sont les seules entrées prévues pour cette mission.',
      options.mode === 'edit'
        ? 'Modifie seulement les fichiers nommés. Ce sont des copies ; le lanceur reporte les changements si les originaux sont inchangés.'
        : 'Revue en lecture seule ; ne modifie aucun fichier du projet.',
      ...sources.map(file => 'Fichier fourni : ' + file.staged + ' (' + file.size + ' octets).'),
    ];
    if (options.luna) {
      lines.push('Relais Luna facultatif : écris 1 à 9 missions {id,prompt} dans luna-tasks.json, puis exécute exactement : '
        + relay + '. Lis les résultats dans luna/. Une seule consultation Claude.');
    }
    if (!sources.length && !options.luna) lines.push('Tout le contexte utile est dans le brief. Aucun outil n’est disponible.');
    const prompt = lines.join('\n') + '\n\n' + brief;
    console.log(JSON.stringify({ ...status, mode: options.mode, maxTurns: options.maxTurns,
      briefBytes: Buffer.byteLength(brief), providedFiles: sources.map(file => file.staged),
      output, progressFile, recoveryManifestPath }));
    let child;
    try {
      child = spawn(exe, args, { cwd: directory, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch {
      progressTracker.record('erreur', 'erreur_lancement', { outcome: 'claude_error' });
      progressFinalized = true;
      throw new Error('Impossible de démarrer Claude Code.');
    }
    const captured = captureClaudeProcess(child, progressTracker);
    child.stdin.on('error', () => { /* The process close and final result determine the outcome. */ });
    child.stdin.end(prompt);
    const result = await captured;
    modelOutcome = result.outcome;
    writeFileSync(output, result.finalJson, 'utf8');
    resultWritten = true;
    const outcome = result.outcome;
    if (outcome !== 'completed') {
      recoverySnapshot = recordClaudeFailureRecovery({
        manifestPath: recoveryManifestPath, directory, sources, tracker: progressTracker, outcome,
        receivedFinalResult: result.receivedFinalResult, deliveryRequested: options.mode === 'edit',
      });
      progressFinalized = true;
      keepDirectory = true;
      logRecovery(outcome);
      const label = outcome === 'turn_budget_reached' ? 'Budget de ' + options.maxTurns + ' tours atteint'
        : outcome === 'quota_reached' ? 'Quota Claude atteint' : 'Claude n’a pas terminé';
      throw new Error('[' + outcome + '] ' + label + '. Résultat : ' + output + '.'
        + (keepDirectory ? ' Copies : ' + directory + '.' : ''));
    }
    progressTracker.record('résultat', 'résultat_final', {
      outcome, modelOutcome, resultStatus: 'completed',
      deliveryStatus: options.mode === 'edit' ? 'pending' : 'not_requested',
    });
    let changedFiles = [];
    if (options.mode === 'edit') {
      try { changedFiles = applyStagedEditsWithProgress(directory, sources, progressTracker, recoveryManifestPath); }
      catch (error) {
        recoverySnapshot = error?.recovery || ensureRecovery();
        if (!error?.recovery) progressTracker.updateRecovery(recoverySnapshot);
        progressFinalized = true;
        keepDirectory = true;
        logRecovery('delivery_error');
        throw error;
      }
    }
    progressFinalized = true;
    console.log(JSON.stringify({ completed: true, output, progressFile, elapsedMs: Date.now() - progressTracker.startedAtMs,
      turns: result.response.num_turns, maxTurns: options.maxTurns,
      models: Object.keys(result.response.modelUsage || {}), changedFiles }));
  } catch (error) {
    if (!recoverySnapshot && directory) {
      recoverySnapshot = ensureRecovery();
      progressTracker?.updateRecovery(recoverySnapshot);
      logRecovery(modelOutcome || 'claude_error');
    }
    if (recoverySnapshot || options.mode === 'edit') keepDirectory = true;
    if (progressTracker && !progressFinalized) {
      progressTracker.stopHeartbeat();
      if (modelOutcome) {
        const resultWriteFailed = !resultWritten;
        progressTracker.record('erreur', resultWriteFailed ? 'fichier_resultat_en_erreur' : 'erreur', {
          outcome: resultWriteFailed ? 'delivery_error' : modelOutcome,
          modelOutcome,
          resultStatus: resultWriteFailed ? 'failed' : 'completed',
          deliveryStatus: options.mode === 'edit' ? 'not_attempted' : 'not_requested',
          deliveryOutcome: options.mode === 'edit' && resultWriteFailed ? 'not_attempted' : undefined,
          category: resultWriteFailed ? 'result_write_error' : undefined,
        });
      } else progressTracker.record('erreur', 'erreur', { outcome: 'claude_error' });
      progressFinalized = true;
    }
    throw error;
  } finally {
    try { if (directory && !keepDirectory) rmSync(directory, { recursive: true, force: true }); }
    finally { release(); }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
