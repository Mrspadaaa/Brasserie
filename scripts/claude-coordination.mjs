// Machine-wide admission of native Claude lots and interactive sessions.
// Cooperative local protocol: no model call, no credential access, and no
// automatic recovery of an owner that is alive or not proven dead.
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync, fsyncSync, mkdirSync, openSync, readdirSync, readFileSync, realpathSync,
  renameSync, statSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claudeOutputPaths } from './claude-artifacts.mjs';

export const LEASE_SCHEMA = 'laffinee.claude-lease.v1';
export const ACTIVATION_SCHEMA = 'laffinee.claude-parallel-activation.v1';
export const BARRIER_SCHEMA = 'laffinee.claude-coordination-barrier.v1';
export const DEFAULT_CLAUDE_CAPACITY = 1;
export const MAX_PARALLEL_CLAUDE_LOTS = 2;
export const MAX_ACTIVATION_MS = 72 * 60 * 60 * 1000;
export const PARALLEL_SCOPE = Object.freeze({ account: 'team', model: 'claude-opus-5-5', effort: 'xhigh' });
const START_TOLERANCE_MS = 5000;
const DEFAULT_MUTEX_TIMEOUT_MS = 15000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEASE_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i;
const ACCOUNTS = new Set(['team', 'pro']);
const KINDS = new Set(['batch', 'interactive', 'login']);
const ACTIVE_STATES = new Set(['admitted', 'spawning', 'running', 'retained']);
const RESOURCE_MODES = new Set(['exclusive', 'shared']);
const RESOURCE_ROLES = new Set(['session', 'output', 'edit', 'reference', 'profile']);
const TRANSIENT_FS = new Set(['EPERM', 'EBUSY', 'EACCES']);
const sleeper = new Int32Array(new SharedArrayBuffer(4));

function sleepSync(ms) { Atomics.wait(sleeper, 0, 0, ms); }
function sha256(value) { return createHash('sha256').update(String(value)).digest('hex'); }
function isoAt(ms) { return new Date(ms).toISOString(); }
function clock(options) { return typeof options?.now === 'function' ? options.now() : Date.now(); }
function boundedText(value, max) {
  return typeof value === 'string' && !!value.trim() && value.length <= max && !value.includes('\0');
}
function refusal(reason, message, details = {}) {
  return Object.assign(new Error(message), { coordination: { reason, ...details } });
}

export function assertTeamOnlyNewClaudeLot(account) {
  if (account === 'team') return;
  throw refusal('team_only',
    'Les nouveaux lots Claude utilisent uniquement le profil Team ; le profil Pro reste disponible pour son statut et son login explicites.');
}

export function coordinationPaths({ root, legacyLock } = {}) {
  const base = resolve(root || join(tmpdir(), 'laffinee-claude-coordination'));
  return {
    root: base,
    active: join(base, 'active'),
    released: join(base, 'released'),
    history: join(base, 'history'),
    temporary: join(base, 'tmp'),
    mutex: join(base, 'mutex.lock'),
    recovery: join(base, 'recovery.lock'),
    activation: join(base, 'activation.json'),
    // Historical single-bridge lock: its presence keeps older launchers out.
    legacyLock: resolve(legacyLock || join(tmpdir(), 'laffinee-claude-frontend.lock')),
  };
}

// ---------------------------------------------------------------------------
// Process identity: PID plus creation time, so a reused PID is not the owner.

export function currentProcessIdentity() {
  return { pid: process.pid, startedAtMs: Math.round(Date.now() - process.uptime() * 1000), hostname: hostname() };
}

function parseElapsedSeconds(value) {
  const match = String(value).trim().match(/^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)$/);
  if (!match) return undefined;
  const [, days = '0', hours = '0', minutes, seconds] = match;
  return ((Number(days) * 24 + Number(hours)) * 60 + Number(minutes)) * 60 + Number(seconds);
}

export function queryProcessStartMs(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return undefined;
  if (process.platform === 'win32') {
    const script = `$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if (-not $p) { 'absent' } else { try { [DateTimeOffset]::new($p.StartTime).ToUnixTimeMilliseconds() } catch { 'unknown' } }`;
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf8', windowsHide: true, timeout: 20000 });
    const output = result.status === 0 ? String(result.stdout || '').trim() : '';
    if (output === 'absent') return 'absent';
    return /^\d{10,16}$/.test(output) ? Number(output) : undefined;
  }
  const result = spawnSync('ps', ['-o', 'etime=', '-p', String(pid)], { encoding: 'utf8', timeout: 10000 });
  if (result.error) return undefined;
  const output = String(result.stdout || '').trim();
  if (result.status !== 0 && !output) return 'absent';
  const seconds = parseElapsedSeconds(output);
  return seconds === undefined ? undefined : Date.now() - seconds * 1000;
}

// absent / reused => proven not the recorded process; alive / unknown => keep.
export function probeProcess(identity, { query = queryProcessStartMs, toleranceMs = START_TOLERANCE_MS } = {}) {
  if (!identity || !Number.isSafeInteger(identity.pid) || identity.pid <= 0) return 'unknown';
  if (typeof identity.hostname === 'string' && identity.hostname !== hostname()) return 'unknown';
  try { process.kill(identity.pid, 0); }
  catch (error) {
    if (error?.code === 'ESRCH') return 'absent';
    if (error?.code !== 'EPERM') return 'unknown';
  }
  if (!Number.isSafeInteger(identity.startedAtMs)) return 'unknown';
  const observed = query(identity.pid);
  if (observed === 'absent') return 'absent';
  if (!Number.isFinite(observed)) return 'unknown';
  if (Math.abs(observed - identity.startedAtMs) <= toleranceMs) return 'alive';
  // A later creation is another process with the same PID; an earlier one is unexplained.
  return observed > identity.startedAtMs ? 'reused' : 'unknown';
}

const provenGone = state => state === 'absent' || state === 'reused';

// ---------------------------------------------------------------------------
// Resource identity: the physical original that is edited or reported.

function normalizeKey(path) {
  if (process.platform !== 'win32') return path;
  let value = path;
  if (value.startsWith('\\\\?\\UNC\\')) value = `\\\\${value.slice(8)}`;
  else if (value.startsWith('\\\\?\\')) value = value.slice(4);
  return value.toLowerCase();
}

export function canonicalPathKey(path) {
  if (typeof path !== 'string' || !path.trim() || path.includes('\0')) {
    throw refusal('invalid_request', `Chemin de ressource invalide : ${path}`);
  }
  const missing = [];
  let probe = resolve(path);
  for (;;) {
    let real;
    try { real = realpathSync.native(probe); }
    catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') throw error;
      const parent = dirname(probe);
      if (parent === probe) throw error;
      missing.unshift(basename(probe));
      probe = parent;
      continue;
    }
    // Win32 drops trailing dots/spaces when it creates a missing name; streams are refused.
    const rest = process.platform === 'win32'
      ? missing.map(segment => {
        if (segment.includes(':')) throw refusal('invalid_request', `Chemin de ressource non canonique : ${path}`);
        return segment.replace(/[. ]+$/, '');
      })
      : missing;
    if (rest.some(segment => !segment)) throw refusal('invalid_request', `Chemin de ressource non canonique : ${path}`);
    return normalizeKey(rest.length ? join(real, ...rest) : real);
  }
}

function fileIdentityKeys(path) {
  const keys = [`file:${canonicalPathKey(path)}`];
  let info;
  try { info = statSync(path, { bigint: true }); }
  catch (error) {
    if (error?.code === 'ENOENT') return keys;
    throw error;
  }
  // Volume + file index also catches hard links that realpath cannot see.
  if (info.isFile() && info.ino > 0n) keys.push(`inode:${info.dev}:${info.ino}`);
  return keys;
}

export function claudeLeaseResources(request) {
  const resources = new Map();
  const add = (key, mode, role) => {
    const previous = resources.get(key);
    if (!previous || (mode === 'exclusive' && previous.mode !== 'exclusive')) resources.set(key, { key, mode, role });
  };
  if (request.kind === 'login') add(`profile:${request.account}`, 'exclusive', 'profile');
  if (request.kind === 'batch') {
    add(`session:${request.claudeSessionId.toLowerCase()}`, 'exclusive', 'session');
    for (const path of claudeOutputPaths(request.output)) add(`file:${canonicalPathKey(path)}`, 'exclusive', 'output');
    for (const file of request.sources || []) {
      const editable = file?.readOnly !== true;
      // References stay shareable between readers but conflict with a writer.
      for (const key of fileIdentityKeys(file?.source)) {
        add(key, editable ? 'exclusive' : 'shared', editable ? 'edit' : 'reference');
      }
    }
    add(`profile:${request.account}`, 'shared', 'profile');
  }
  return [...resources.values()];
}

// ---------------------------------------------------------------------------
// Records.

function validIdentity(value) {
  return !!value && Number.isSafeInteger(value.pid) && value.pid > 0
    && Number.isSafeInteger(value.startedAtMs) && typeof value.hostname === 'string';
}

function validResource(value) {
  return !!value && typeof value.key === 'string' && value.key.length > 0 && value.key.length <= 8192
    && RESOURCE_MODES.has(value.mode) && RESOURCE_ROLES.has(value.role);
}

function sourceResourceKey(key) {
  if (key.startsWith('file:')) {
    const path = key.slice('file:'.length);
    return !!path && canonicalPathKey(path) === path;
  }
  return /^inode:\d+:\d+$/.test(key);
}

function expectedOutputResources(output) {
  try { return new Set(claudeOutputPaths(output).map(path => `file:${canonicalPathKey(path)}`)); }
  catch { return null; }
}

function validLeaseResources(record) {
  const resources = record.resources;
  const keys = new Set();
  for (const resource of resources) {
    if (!validResource(resource) || resource.key.includes('\0') || keys.has(resource.key)) return false;
    keys.add(resource.key);
    const expectedMode = resource.role === 'reference' ? 'shared'
      : resource.role === 'profile' && record.kind === 'login' ? 'exclusive'
        : ['edit', 'session', 'output'].includes(resource.role) || resource.role === 'profile' ? 'exclusive' : null;
    const profileMode = record.kind === 'login' ? 'exclusive' : 'shared';
    if (resource.role === 'profile' ? resource.mode !== profileMode : resource.mode !== expectedMode) return false;
  }

  const byRole = role => resources.filter(resource => resource.role === role);
  if (record.kind === 'login') {
    return record.state !== 'retained' && record.scope === 'declared' && record.countsTowardCapacity === false
      && record.claudeSessionId === null && record.sessionMode === 'none' && record.output === null
      && resources.length === 1 && byRole('profile').length === 1
      && byRole('profile')[0].key === `profile:${record.account}`;
  }
  if (record.kind === 'interactive') {
    return record.state !== 'retained' && record.scope === 'all' && record.countsTowardCapacity === true
      && record.claudeSessionId === null && record.sessionMode === 'unknown' && record.output === null
      && resources.length === 0;
  }
  if (record.kind !== 'batch' || record.scope !== 'declared'
    || !UUID.test(record.claudeSessionId || '') || !['new', 'resume'].includes(record.sessionMode)
    || !boundedText(record.output, 4096) || resolve(record.output) !== record.output) return false;

  if (record.state === 'retained') {
    return record.countsTowardCapacity === false
      && resources.every(resource => resource.role === 'edit' && resource.mode === 'exclusive' && sourceResourceKey(resource.key));
  }
  if (record.countsTowardCapacity !== true) return false;

  const sessions = byRole('session');
  const profiles = byRole('profile');
  if (sessions.length !== 1 || sessions[0].mode !== 'exclusive'
    || sessions[0].key !== `session:${record.claudeSessionId.toLowerCase()}`
    || profiles.length !== 1 || profiles[0].mode !== 'shared' || profiles[0].key !== `profile:${record.account}`) return false;

  const expectedOutputs = expectedOutputResources(record.output);
  const outputs = byRole('output');
  if (!expectedOutputs || outputs.length !== expectedOutputs.size
    || outputs.some(resource => resource.mode !== 'exclusive' || !expectedOutputs.has(resource.key))) return false;

  return resources.every(resource => {
    if (resource.role === 'edit') return resource.mode === 'exclusive' && sourceResourceKey(resource.key);
    if (resource.role === 'reference') return resource.mode === 'shared' && sourceResourceKey(resource.key);
    return ['session', 'output', 'profile'].includes(resource.role);
  });
}

export function validLeaseRecord(record) {
  if (!record || typeof record !== 'object' || record.schema !== LEASE_SCHEMA) return false;
  const login = record.kind === 'login';
  const validShape = UUID.test(record.leaseId || '') && /^[a-f\d]{64}$/.test(record.tokenDigest || '')
    && KINDS.has(record.kind) && ACTIVE_STATES.has(record.state)
    && ['declared', 'all'].includes(record.scope) && typeof record.countsTowardCapacity === 'boolean'
    && ACCOUNTS.has(record.account)
    && (login ? record.model === null && record.effort === null
      : boundedText(record.model, 128) && boundedText(record.effort, 32))
    && Array.isArray(record.resources) && record.resources.every(validResource)
    && validIdentity(record.owner) && (record.child === null || validIdentity(record.child));
  if (!validShape) return false;
  try { return validLeaseResources(record); } catch { return false; }
}

function leaseRecord(request, paths, tokenDigest, now) {
  if (!request || typeof request !== 'object') throw refusal('invalid_request', 'Demande d’admission Claude absente.');
  const { kind, account } = request;
  if (!KINDS.has(kind)) throw refusal('invalid_request', `Type de lot Claude inconnu : ${kind}.`);
  if (!ACCOUNTS.has(account)) throw refusal('invalid_request', 'Compte Claude attendu : team ou pro.');
  const login = kind === 'login';
  if (!login) assertTeamOnlyNewClaudeLot(account);
  if (!login && (!boundedText(request.model, 128) || !boundedText(request.effort, 32))) {
    throw refusal('invalid_request', 'Modèle et effort Claude explicites requis pour l’admission.');
  }
  if (kind === 'batch') {
    if (!UUID.test(request.claudeSessionId || '')) {
      throw refusal('invalid_request', 'UUID de conversation Claude requis avant lancement (nouvelle session ou --resume).');
    }
    if (!['new', 'resume'].includes(request.sessionMode)) throw refusal('invalid_request', 'Mode de session attendu : new ou resume.');
    if (!boundedText(request.output, 4096)) throw refusal('invalid_request', 'Sortie Claude requise pour l’admission.');
    if (request.sources !== undefined && !Array.isArray(request.sources)) throw refusal('invalid_request', 'Liste de sources invalide.');
  }
  const at = isoAt(now);
  const record = {
    schema: LEASE_SCHEMA, leaseId: randomUUID(), tokenDigest, kind, state: 'admitted',
    // An interactive TUI cannot declare its files or a later /resume: it is exclusive.
    scope: kind === 'interactive' ? 'all' : 'declared',
    countsTowardCapacity: !login,
    account, model: login ? null : request.model, effort: login ? null : request.effort,
    claudeSessionId: kind === 'batch' ? request.claudeSessionId : null,
    sessionMode: kind === 'batch' ? request.sessionMode : kind === 'interactive' ? 'unknown' : 'none',
    // Informational only: several lots of the same Sol are allowed.
    solThread: typeof request.solThread === 'string' ? request.solThread.slice(0, 64) : null,
    output: kind === 'batch' ? resolve(request.output) : null,
    resources: claudeLeaseResources(request),
    owner: currentProcessIdentity(), child: null,
    coordinationRoot: paths.root, admittedAt: at, updatedAt: at,
  };
  if (!validLeaseRecord(record)) throw refusal('invalid_request', 'Demande d’admission non représentable sans ambiguïté.');
  return record;
}

function publicLease(record) {
  const { tokenDigest, ...visible } = record;
  return visible;
}

// ---------------------------------------------------------------------------
// Atomic files and the short coordination mutex.

function renameWithRetry(from, to) {
  for (let attempt = 0; ; attempt++) {
    try { renameSync(from, to); return; }
    catch (error) {
      if (attempt >= 20 || !TRANSIENT_FS.has(error?.code)) throw error;
      sleepSync(10);
    }
  }
}

function unlinkWithRetry(path) {
  for (let attempt = 0; ; attempt++) {
    try { unlinkSync(path); return; }
    catch (error) {
      if (error?.code === 'ENOENT') return;
      if (attempt >= 20 || !TRANSIENT_FS.has(error?.code)) throw error;
      sleepSync(10);
    }
  }
}

function writeRecord(paths, target, value) {
  mkdirSync(paths.temporary, { recursive: true });
  const temporary = join(paths.temporary, `${basename(target)}.${process.pid}.${randomUUID()}.tmp`);
  const fd = openSync(temporary, 'wx');
  try {
    writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fsyncSync(fd);
  } finally { closeSync(fd); }
  renameWithRetry(temporary, target);
}

function writeLeaseRecord(paths, target, record) {
  // Never write a lease that a later admission would have to refuse as invalid.
  if (!validLeaseRecord(record)) throw refusal('invalid_lease', `Lease non écrite car invalide : ${target}.`);
  writeRecord(paths, target, record);
}

function readJsonQuietly(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function releaseMutex(path, token) {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      if (JSON.parse(readFileSync(path, 'utf8')).token !== token) return;
      unlinkSync(path);
      return;
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      // An unverified mutex stays for inspection instead of being removed blindly.
      if (!TRANSIENT_FS.has(error?.code)) return;
      sleepSync(10);
    }
  }
}

function withCoordinationMutex(paths, operation, options = {}) {
  const timeout = Number.isSafeInteger(options.mutexTimeoutMs) ? options.mutexTimeoutMs : DEFAULT_MUTEX_TIMEOUT_MS;
  mkdirSync(paths.root, { recursive: true });
  const token = randomUUID();
  const deadline = Date.now() + timeout;
  for (;;) {
    let fd;
    try { fd = openSync(paths.mutex, 'wx'); }
    catch (error) {
      if (error?.code !== 'EEXIST' && !TRANSIENT_FS.has(error?.code)) throw error;
      if (Date.now() >= deadline) {
        throw refusal('busy', `Coordination Claude occupée ou verrou de coordination à vérifier : ${paths.mutex}. `
          + 'Aucune suppression automatique ; inspecter avec node scripts/claude-coordination.mjs status.',
        { mutex: mutexState(paths) });
      }
      sleepSync(5 + Math.floor(Math.random() * 20));
      continue;
    }
    try {
      writeFileSync(fd, JSON.stringify({ token, owner: currentProcessIdentity(), acquiredAt: isoAt(Date.now()) }), 'utf8');
      closeSync(fd);
    } catch (error) {
      try { closeSync(fd); } catch { /* Already closed. */ }
      try { unlinkSync(paths.mutex); } catch { /* Created by this call; otherwise left for inspection. */ }
      throw error;
    }
    break;
  }
  try { return operation(); }
  finally { releaseMutex(paths.mutex, token); }
}

function mutexState(paths) {
  let raw;
  try { raw = readFileSync(paths.mutex, 'utf8'); }
  catch (error) { return error?.code === 'ENOENT' ? { present: false } : { present: true, owner: null }; }
  try {
    const value = JSON.parse(raw);
    return { present: true, owner: validIdentity(value?.owner) ? value.owner : null, acquiredAt: value?.acquiredAt ?? null };
  } catch { return { present: true, owner: null }; }
}

// ---------------------------------------------------------------------------
// State readers.

function readActiveLeases(paths) {
  let names;
  try { names = readdirSync(paths.active); }
  catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw refusal('invalid_lease', `Leases Claude illisibles : ${paths.active}. Aucune récupération automatique.`, { path: paths.active });
  }
  return names.map(name => {
    const path = join(paths.active, name);
    if (!LEASE_FILE.test(name)) {
      throw refusal('invalid_lease', `Entrée inattendue parmi les leases actives : ${path}. Aucune récupération automatique ; inspecter.`, { path });
    }
    let record;
    try { record = JSON.parse(readFileSync(path, 'utf8')); }
    catch { throw refusal('invalid_lease', `Lease illisible : ${path}. Aucune récupération automatique ; inspecter.`, { path }); }
    if (!validLeaseRecord(record) || `${record.leaseId}.json`.toLowerCase() !== name.toLowerCase()) {
      throw refusal('invalid_lease', `Lease invalide : ${path}. Aucune récupération automatique ; inspecter.`, { path });
    }
    return record;
  });
}

function validActivation(record) {
  if (!record || record.schema !== ACTIVATION_SCHEMA || record.capacity !== MAX_PARALLEL_CLAUDE_LOTS) return false;
  if (record.scope?.account !== PARALLEL_SCOPE.account || record.scope?.model !== PARALLEL_SCOPE.model
    || record.scope?.effort !== PARALLEL_SCOPE.effort) return false;
  const activatedAt = Date.parse(record.activatedAt);
  const expiresAt = Date.parse(record.expiresAt);
  return boundedText(record.authorizedBy, 512) && boundedText(record.evidence, 2048)
    && Number.isFinite(activatedAt) && Number.isFinite(expiresAt)
    && expiresAt > activatedAt && expiresAt - activatedAt <= MAX_ACTIVATION_MS;
}

function activationState(paths, now) {
  let raw;
  try { raw = readFileSync(paths.activation, 'utf8'); }
  catch (error) {
    return { status: error?.code === 'ENOENT' ? 'absent' : 'unreadable', capacity: DEFAULT_CLAUDE_CAPACITY };
  }
  let record;
  try { record = JSON.parse(raw); } catch { return { status: 'invalid', capacity: DEFAULT_CLAUDE_CAPACITY }; }
  // A malformed or widened record is not a qualification: prudent capacity.
  if (!validActivation(record)) return { status: 'invalid', capacity: DEFAULT_CLAUDE_CAPACITY };
  if (!(Date.parse(record.expiresAt) > now)) return { status: 'expired', capacity: DEFAULT_CLAUDE_CAPACITY, record };
  return { status: 'active', capacity: record.capacity, record };
}

function publicActivation(state) {
  return {
    status: state.status, capacity: state.capacity,
    ...(state.record ? {
      scope: state.record.scope, authorizedBy: state.record.authorizedBy, evidence: state.record.evidence,
      activatedAt: state.record.activatedAt, expiresAt: state.record.expiresAt,
    } : {}),
  };
}

const matchesParallelScope = lease => lease.account === PARALLEL_SCOPE.account
  && lease.model === PARALLEL_SCOPE.model && lease.effort === PARALLEL_SCOPE.effort;

function effectiveCapacity(activation, counted) {
  if (activation.status !== 'active') return DEFAULT_CLAUDE_CAPACITY;
  // Every counted lot, existing and requested, must be inside the authorised scope.
  return counted.every(matchesParallelScope)
    ? Math.min(activation.capacity, MAX_PARALLEL_CLAUDE_LOTS) : DEFAULT_CLAUDE_CAPACITY;
}

// ---------------------------------------------------------------------------
// Historical lock barrier.

function sameRoot(left, right) {
  const key = value => process.platform === 'win32' ? resolve(value).toLowerCase() : resolve(value);
  return typeof left === 'string' && key(left) === key(right);
}

function legacyLockState(paths) {
  let content;
  try { content = readFileSync(paths.legacyLock, 'utf8'); }
  catch (error) { return { status: error?.code === 'ENOENT' ? 'absent' : 'unreadable', path: paths.legacyLock }; }
  const trimmed = content.trim();
  if (!trimmed) return { status: 'empty', path: paths.legacyLock };
  if (/^\d+$/.test(trimmed)) return { status: 'legacy_pid', pid: Number(trimmed), path: paths.legacyLock };
  try {
    const value = JSON.parse(trimmed);
    if (value?.schema === BARRIER_SCHEMA) {
      return { status: sameRoot(value.root, paths.root) ? 'barrier' : 'foreign_barrier', path: paths.legacyLock };
    }
  } catch { /* Unknown content is reported below without being changed. */ }
  return { status: 'foreign', path: paths.legacyLock };
}

function legacyRefusal(state) {
  const detail = state.status === 'legacy_pid' ? `ancien lanceur, PID ${state.pid}`
    : state.status === 'empty' ? 'création interrompue ou en cours' : state.status;
  return refusal('legacy_lock', `Verrou Claude historique présent : ${state.path} (${detail}). Ancien lanceur actif `
    + 'ou état ambigu : admission refusée. Vérifier le processus et ses artefacts ; aucune récupération automatique.',
  { legacyLock: state });
}

function ensureLegacyBarrier(paths) {
  const state = legacyLockState(paths);
  if (state.status === 'barrier') return 'present';
  if (state.status !== 'absent') throw legacyRefusal(state);
  let fd;
  try { fd = openSync(paths.legacyLock, 'wx'); }
  catch (error) {
    if (error?.code === 'EEXIST') throw legacyRefusal(legacyLockState(paths));
    throw error;
  }
  try {
    writeFileSync(fd, JSON.stringify({ schema: BARRIER_SCHEMA, root: paths.root, createdAt: isoAt(Date.now()),
      owner: currentProcessIdentity() }), 'utf8');
    fsyncSync(fd);
  } finally { closeSync(fd); }
  return 'created';
}

function removeIdleBarrier(paths) {
  let remaining;
  try { remaining = readActiveLeases(paths); } catch { return 'kept'; }
  if (remaining.length || legacyLockState(paths).status !== 'barrier') return 'kept';
  try { unlinkWithRetry(paths.legacyLock); return 'removed'; } catch { return 'kept'; }
}

// ---------------------------------------------------------------------------
// Admission.

export function findLeaseConflicts(active, request) {
  const conflicts = [];
  for (const lease of active) {
    if (lease.scope === 'all' || request.scope === 'all') {
      conflicts.push({ leaseId: lease.leaseId, kind: lease.kind, key: '*', requested: request.kind, held: lease.kind });
      continue;
    }
    const held = new Map(lease.resources.map(resource => [resource.key, resource]));
    for (const resource of request.resources) {
      const other = held.get(resource.key);
      if (other && (other.mode === 'exclusive' || resource.mode === 'exclusive')) {
        conflicts.push({ leaseId: lease.leaseId, kind: lease.kind, key: resource.key, requested: resource.role, held: other.role });
      }
    }
  }
  return conflicts;
}

function conflictMessage(conflicts) {
  const shown = conflicts.slice(0, 6).map(conflict => conflict.key === '*'
    ? `lease ${conflict.leaseId} (${conflict.held}) contre ${conflict.requested} : portée interactive non déclarable`
    : `${conflict.key} (${conflict.requested} contre ${conflict.held}, lease ${conflict.leaseId})`);
  return `Ressource Claude déjà réservée : ${shown.join(' ; ')}${conflicts.length > 6 ? ` ; +${conflicts.length - 6}` : ''}. `
    + 'Admission refusée avant lancement : sérialiser, ou attribuer conversation, sortie et fichiers modifiables disjoints.';
}

function admissionDecision(paths, record, now) {
  const legacy = legacyLockState(paths);
  if (legacy.status !== 'absent' && legacy.status !== 'barrier') return { admissible: false, error: legacyRefusal(legacy), legacy };
  const active = readActiveLeases(paths);
  const conflicts = findLeaseConflicts(active, record);
  const activation = activationState(paths, now);
  const counted = active.filter(lease => lease.countsTowardCapacity);
  if (record.countsTowardCapacity) counted.push(record);
  const capacity = effectiveCapacity(activation, counted);
  const decision = { legacy, activation: publicActivation(activation), capacity, activeLeases: active.length,
    countedLots: counted.length, conflicts };
  if (conflicts.length) return { ...decision, admissible: false, error: refusal('conflict', conflictMessage(conflicts), { conflicts }) };
  if (record.countsTowardCapacity && counted.length > capacity) {
    return { ...decision, admissible: false, error: refusal('capacity',
      `Capacité Claude atteinte : ${counted.length - 1} lot(s) actif(s), capacité ${capacity} (activation ${activation.status}). `
      + 'Admission refusée ; attendre la fin d’un lot. Aucune session tierce n’est interrompue.',
      { capacity, active: counted.length - 1, activation: activation.status }) };
  }
  return { ...decision, admissible: true };
}

export function admitClaudeLease(request, options = {}) {
  const paths = coordinationPaths(options);
  const token = randomUUID();
  let record;
  withCoordinationMutex(paths, () => {
    // The lease's time and activation decision are taken only after this process owns the mutex.
    const now = clock(options);
    record = leaseRecord(request, paths, sha256(token), now);
    const decision = admissionDecision(paths, record, now);
    if (!decision.admissible) throw decision.error;
    ensureLegacyBarrier(paths);
    mkdirSync(paths.active, { recursive: true });
    writeLeaseRecord(paths, join(paths.active, `${record.leaseId}.json`), record);
  }, options);
  return leaseHandle(paths, record, token, options);
}

// Read-only snapshot for --dry-run: it reserves nothing and may be stale at launch.
export function previewClaudeAdmission(request, options = {}) {
  const paths = coordinationPaths(options);
  try {
    const now = clock(options);
    const record = leaseRecord(request, paths, '0'.repeat(64), now);
    const decision = admissionDecision(paths, record, now);
    return {
      snapshot: true, root: paths.root, legacyLock: decision.legacy.status, admissible: decision.admissible,
      reason: decision.error?.coordination?.reason || null, message: decision.error?.message || null,
      capacity: decision.capacity ?? null, activeLeases: decision.activeLeases ?? null, activation: decision.activation || null,
      resources: record.resources,
    };
  } catch (error) {
    return { snapshot: true, root: paths.root, admissible: false, reason: error?.coordination?.reason || 'error',
      message: String(error?.message || error) };
  }
}

// ---------------------------------------------------------------------------
// Owner operations.

function readLease(paths, leaseId, token) {
  const path = join(paths.active, `${leaseId}.json`);
  let record;
  try { record = JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) {
    if (error?.code === 'ENOENT') return { path, record: null };
    throw refusal('invalid_lease', `Lease illisible : ${path}. Aucune récupération automatique.`, { path });
  }
  if (!validLeaseRecord(record) || record.leaseId !== leaseId) {
    throw refusal('invalid_lease', `Lease invalide : ${path}. Aucune récupération automatique.`, { path });
  }
  if (token !== undefined && record.tokenDigest !== sha256(token)) {
    throw refusal('not_owner', `Lease ${leaseId} détenue par un autre propriétaire : opération refusée.`, { leaseId });
  }
  return { path, record };
}

function archiveLease(paths, path, record, patch) {
  const at = isoAt(Date.now());
  mkdirSync(paths.released, { recursive: true });
  writeRecord(paths, join(paths.released, `${record.leaseId}.json`), { ...record, ...patch, finishedAt: at, updatedAt: at });
  unlinkWithRetry(path);
}

function retainRecord(paths, path, record, { reason, recoveryManifestPath, archiveRoot, finalState = 'released' } = {}) {
  // After the process ends only unreported originals still need protection;
  // capacity and the conversation become available again.
  const resources = record.resources.filter(resource => resource.role === 'edit');
  if (!resources.length) {
    archiveLease(paths, path, record, { state: finalState, outcome: String(reason || 'finished').slice(0, 64) });
    return { status: finalState, leaseId: record.leaseId, barrier: removeIdleBarrier(paths) };
  }
  const at = isoAt(Date.now());
  writeLeaseRecord(paths, path, {
    ...record, state: 'retained', scope: 'declared', countsTowardCapacity: false, resources,
    retainedAt: at, updatedAt: at, retainedReason: String(reason || 'unreviewed').slice(0, 256),
    recoveryManifestPath: typeof recoveryManifestPath === 'string' ? recoveryManifestPath : null,
    archiveRoot: typeof archiveRoot === 'string' ? archiveRoot : null,
  });
  return { status: 'retained', leaseId: record.leaseId };
}

export function releaseClaudeLease(leaseId, token, final = {}, options = {}) {
  const paths = coordinationPaths(options);
  return withCoordinationMutex(paths, () => {
    const { path, record } = readLease(paths, leaseId, token);
    // Already finished or recovered: never touch another lease.
    if (!record) return { status: 'already_finished', leaseId };
    archiveLease(paths, path, record, { state: 'released',
      outcome: typeof final.outcome === 'string' ? final.outcome.slice(0, 64) : null });
    return { status: 'released', leaseId, barrier: removeIdleBarrier(paths) };
  }, options);
}

export function retainClaudeLease(leaseId, token, details = {}, options = {}) {
  const paths = coordinationPaths(options);
  return withCoordinationMutex(paths, () => {
    const { path, record } = readLease(paths, leaseId, token);
    if (!record) return { status: 'already_finished', leaseId };
    return retainRecord(paths, path, record, details);
  }, options);
}

function updateOwnedLease(paths, leaseId, token, patch, options) {
  return withCoordinationMutex(paths, () => {
    const { path, record } = readLease(paths, leaseId, token);
    if (!record) throw refusal('not_owner', `Lease ${leaseId} absente : mise à jour refusée.`, { leaseId });
    if (record.state === 'retained') throw refusal('retained', `Lease ${leaseId} déjà retenue : mise à jour refusée.`, { leaseId });
    writeLeaseRecord(paths, path, { ...record, ...patch, updatedAt: isoAt(Date.now()) });
  }, options);
}

function leaseHandle(paths, record, token, options) {
  let finished = false;
  const settle = operation => {
    if (finished) return { status: 'already_finished', leaseId: record.leaseId };
    const result = operation();
    finished = true;
    return result;
  };
  return {
    leaseId: record.leaseId,
    claudeSessionId: record.claudeSessionId,
    record: publicLease(record),
    // Written before spawn: a crash after this point is an unresolved child.
    markSpawning: () => updateOwnedLease(paths, record.leaseId, token, { state: 'spawning' }, options),
    markRunning: pid => {
      if (!Number.isSafeInteger(pid) || pid <= 0) throw refusal('invalid_request', 'PID Claude invalide : lease inchangée.');
      return updateOwnedLease(paths, record.leaseId, token,
        { state: 'running', child: { pid, startedAtMs: Date.now(), hostname: hostname() } }, options);
    },
    release: (final = {}) => settle(() => releaseClaudeLease(record.leaseId, token, final, options)),
    retain: (details = {}) => settle(() => retainClaudeLease(record.leaseId, token, details, options)),
  };
}

// ---------------------------------------------------------------------------
// Controller operations (manual, explicit, never automatic).

export function recoverClaudeLease(leaseId, options = {}) {
  if (!UUID.test(leaseId || '')) throw refusal('invalid_request', '--lease attend l’UUID d’une lease.');
  const { probe = probeProcess, confirmNoChild = false } = options;
  const paths = coordinationPaths(options);
  return withCoordinationMutex(paths, () => {
    const { path, record } = readLease(paths, leaseId);
    if (!record) throw refusal('not_found', `Lease active introuvable : ${leaseId}.`);
    if (record.state === 'retained') {
      throw refusal('retained', 'Lease déjà retenue après la fin du processus : inspecter copies et manifeste, puis utiliser release.');
    }
    const owner = probe(record.owner);
    if (!provenGone(owner)) {
      throw refusal('owner_alive', `Propriétaire de la lease ${leaseId} vivant ou non résolu (${owner}) : récupération refusée.`, { owner });
    }
    let child = null;
    if (record.state === 'running') {
      child = record.child ? probe(record.child) : 'unknown';
      if (!provenGone(child)) {
        throw refusal('child_alive', `Processus Claude de la lease ${leaseId} vivant ou non résolu (${child}) : récupération refusée.`, { child });
      }
    } else if (record.state === 'spawning' && confirmNoChild !== true) {
      throw refusal('child_unknown', `Lancement de la lease ${leaseId} interrompu sans PID enregistré : vérifier qu’aucun `
        + 'processus Claude correspondant ne tourne, puis relancer avec --confirm-no-child.');
    }
    return { ...retainRecord(paths, path, record, { reason: 'owner_gone_recovered', finalState: 'recovered' }), owner, child };
  }, options);
}

export function releaseRetainedClaudeLease(leaseId, options = {}) {
  if (!UUID.test(leaseId || '')) throw refusal('invalid_request', '--lease attend l’UUID d’une lease.');
  if (!boundedText(options.reason, 1024)) {
    throw refusal('invalid_request', '--reason requis : résumer l’inspection des copies et du manifeste de récupération.');
  }
  const paths = coordinationPaths(options);
  return withCoordinationMutex(paths, () => {
    const { path, record } = readLease(paths, leaseId);
    if (!record) throw refusal('not_found', `Lease active introuvable : ${leaseId}.`);
    if (record.state !== 'retained') {
      throw refusal('not_retained', 'Seule une lease retenue (processus terminé) se libère manuellement ; pour un propriétaire disparu, utiliser recover.');
    }
    archiveLease(paths, path, record, { state: 'released', releasedManually: true, releaseReason: options.reason.slice(0, 1024) });
    return { status: 'released', leaseId, barrier: removeIdleBarrier(paths) };
  }, options);
}

export function recoverCoordinationMutex(options = {}) {
  const { probe = probeProcess } = options;
  const paths = coordinationPaths(options);
  mkdirSync(paths.root, { recursive: true });
  let fd;
  try { fd = openSync(paths.recovery, 'wx'); }
  catch (error) {
    if (error?.code === 'EEXIST') throw refusal('busy', `Récupération déjà en cours ou verrou à vérifier : ${paths.recovery}.`);
    throw error;
  }
  closeSync(fd);
  try {
    let current;
    try { current = JSON.parse(readFileSync(paths.mutex, 'utf8')); }
    catch (error) {
      if (error?.code === 'ENOENT') return { status: 'absent' };
      throw refusal('invalid_mutex', `Verrou de coordination illisible : ${paths.mutex}. Vérifier manuellement ; aucune suppression automatique.`);
    }
    const owner = probe(current?.owner);
    if (!provenGone(owner)) {
      throw refusal('owner_alive', `Détenteur du verrou de coordination vivant ou non résolu (${owner}) : récupération refusée.`, { owner });
    }
    mkdirSync(paths.history, { recursive: true });
    const movedTo = join(paths.history, `mutex-${Date.now()}-${randomUUID()}.json`);
    renameWithRetry(paths.mutex, movedTo);
    if (readJsonQuietly(movedTo)?.token !== current.token) {
      throw refusal('race', `Le verrou déplacé ne correspond pas à celui inspecté ; conservé dans ${movedTo}. Vérifier manuellement.`);
    }
    return { status: 'recovered', owner, movedTo };
  } finally {
    try { unlinkSync(paths.recovery); } catch { /* Left for inspection. */ }
  }
}

function archiveActivation(paths) {
  try { readFileSync(paths.activation); }
  catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
  mkdirSync(paths.history, { recursive: true });
  const target = join(paths.history, `activation-${Date.now()}-${randomUUID()}.json`);
  renameWithRetry(paths.activation, target);
  return target;
}

export function activateParallelClaude(options = {}) {
  const { until, authorizedBy, evidence } = options;
  const now = clock(options);
  const expiresAt = typeof until === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(until) ? Date.parse(until) : NaN;
  if (!Number.isFinite(expiresAt)) throw refusal('invalid_request', '--until attend une date ISO 8601 explicite.');
  if (expiresAt <= now) throw refusal('invalid_request', '--until est déjà passée : aucune activation.');
  if (expiresAt - now > MAX_ACTIVATION_MS) throw refusal('invalid_request', 'Activation limitée à 72 h ; la renouveler explicitement.');
  if (!boundedText(authorizedBy, 512)) throw refusal('invalid_request', '--authorized-by requis : référence de l’autorisation humaine.');
  if (!boundedText(evidence, 2048)) throw refusal('invalid_request', '--evidence requis : référence de la qualification locale.');
  const paths = coordinationPaths(options);
  const record = {
    schema: ACTIVATION_SCHEMA, capacity: MAX_PARALLEL_CLAUDE_LOTS, scope: { ...PARALLEL_SCOPE },
    authorizedBy, evidence, activatedAt: isoAt(now), expiresAt: isoAt(expiresAt), activatedBy: currentProcessIdentity(),
  };
  const archived = withCoordinationMutex(paths, () => {
    const previous = archiveActivation(paths);
    writeRecord(paths, paths.activation, record);
    return previous;
  }, options);
  return { ...publicActivation({ status: 'active', capacity: record.capacity, record }), archivedPrevious: archived };
}

export function deactivateParallelClaude(options = {}) {
  const paths = coordinationPaths(options);
  return withCoordinationMutex(paths, () => ({ status: 'deactivated', archived: archiveActivation(paths) }), options);
}

export function coordinationStatus(options = {}) {
  const paths = coordinationPaths(options);
  let leases = [];
  let leaseError = null;
  try { leases = readActiveLeases(paths); } catch (error) { leaseError = String(error.message); }
  const probe = typeof options.probe === 'function' ? options.probe : undefined;
  return {
    root: paths.root,
    legacyLock: legacyLockState(paths),
    mutex: mutexState(paths),
    activation: publicActivation(activationState(paths, clock(options))),
    leaseError,
    active: leases.map(lease => ({
      ...publicLease(lease),
      ...(probe ? { ownerProbe: probe(lease.owner), childProbe: lease.child ? probe(lease.child) : null } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// Controller CLI.

function parseCommand(input) {
  const [command, ...rest] = input;
  const allowed = {
    status: [], activate: ['--until', '--authorized-by', '--evidence'], deactivate: [],
    recover: ['--lease', '--confirm-no-child'], release: ['--lease', '--reason'], 'recover-mutex': [],
  };
  if (!Object.hasOwn(allowed, command || '')) {
    throw new Error('Commande attendue : status, activate, deactivate, recover, release ou recover-mutex.');
  }
  const values = new Map();
  for (let i = 0; i < rest.length; i++) {
    const name = rest[i];
    if (!allowed[command].includes(name)) throw new Error(`Option inconnue pour ${command} : ${name}`);
    if (values.has(name)) throw new Error(`Option répétée : ${name}`);
    if (name === '--confirm-no-child') { values.set(name, true); continue; }
    const value = rest[++i];
    if (!value || value.startsWith('--')) throw new Error(`Valeur manquante pour ${name}.`);
    values.set(name, value);
  }
  for (const name of allowed[command]) {
    if (name !== '--confirm-no-child' && !values.has(name)) throw new Error(`${name} est requis pour ${command}.`);
  }
  return { command, values };
}

export function main(input = process.argv.slice(2), options = {}) {
  const { command, values } = parseCommand(input);
  let result;
  if (command === 'status') result = coordinationStatus({ ...options, probe: options.probe || probeProcess });
  else if (command === 'activate') {
    result = activateParallelClaude({ ...options, until: values.get('--until'),
      authorizedBy: values.get('--authorized-by'), evidence: values.get('--evidence') });
  } else if (command === 'deactivate') result = deactivateParallelClaude(options);
  else if (command === 'recover') {
    result = recoverClaudeLease(values.get('--lease'), { ...options, confirmNoChild: values.get('--confirm-no-child') === true });
  } else if (command === 'release') {
    result = releaseRetainedClaudeLease(values.get('--lease'), { ...options, reason: values.get('--reason') });
  } else result = recoverCoordinationMutex(options);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
