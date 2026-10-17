#!/usr/bin/env node
/**
 * JUS-0 (#105) : parcours « justificatif → revue → dépense et stock » de la vraie App, sur émulateurs Firebase.
 *
 * Vraie App en dev (Vite) branchée sur les émulateurs Auth, Firestore et Functions, projet `demo-jus`, utilisateur
 * émulé, vraies règles Firestore générées depuis `firestore.rules.template` dans un dossier temporaire, Functions de ce
 * dépôt compilées dans ce même dossier (approche de `scripts/check-recipe-hop-v55-emulator.mjs`, copie minimale).
 *
 * Deux services sont simulés **dans la page** (enveloppe de `fetch` posée avant tout script de l'App) :
 * - le callable `aiTask` de la tâche `scanInvoice` rejoue `actuel.result` d'une lecture réelle déjà obtenue (H13R,
 *   H13R-2), choisie par le cas en cours ; il peut aussi simuler un refus du serveur ou une réponse inutilisable ;
 * - Google Drive (`driveAuthorization` et l'API `drive/v3`) : un Drive factice en mémoire du banc reçoit l'original,
 *   calcule sa somme SHA-256 et le rend à la relecture. Sans lui, aucun achat avec justificatif ne s'enregistre.
 * Aucune de ces requêtes ne quitte la page. Toute autre requête **de Chrome** hors 127.0.0.1/localhost est bloquée et
 * comptée, et Chrome ne résout aucun nom hors localhost. Le processus des Functions émulées n'est pas filtré : il ne
 * reçoit aucune clé (GEMINI_API_KEY et apparentées retirées) et le banc ne sème aucun justificatif ancien qui
 * déclencherait une vérification Drive côté serveur. Les coordonnées de la brasserie (VITE_COMPANY_*) sont
 * remplacées par des valeurs synthétiques dans l'environnement de Vite.
 *
 * Données : le banc ne contient aucune valeur des documents. `--replay <manifeste.json>` (hors Git) donne, pour chaque
 * document, le chemin de l'image et celui de la sortie rejouée ; les articles de stock semés sont dérivés de ces
 * sorties au lancement. Les seules saisies écrites ici sont synthétiques (« Malterie du Banc »). Captures, rapport et
 * journaux vont dans `--out`, qui doit être un dossier ignoré par Git (vérifié au lancement).
 *
 * Manifeste : { "docs": { "doc1": { "image": "<chemin>", "output": "<final.json>", "pointer": ["doc1","actuel","result"] }, … } }
 * (chemins relatifs au manifeste). Documents attendus : doc1 à doc6.
 *
 * Usage, depuis la racine du dépôt :
 *   node scripts/check-invoice-journey-emulator.mjs --replay <manifeste.json> --out <dossier ignoré>
 *        [--widths 390,1280] [--cases etats,doc5,finances,doc6,autre-numero,rattacher,minuscules,doc1,doc4,hors-ligne,doc3,doc2] [--port 5175]
 *        [--lock <dossier-verrou>] [--keep-tmp]
 * Le mode `--inner` est lancé par `firebase emulators:exec`, jamais à la main. Chaque largeur repart d'une base
 * émulée vide (mêmes semis), dans un contexte Chrome neuf, largeur réglée avant le chargement.
 * Code de sortie : 0 si le banc a joué tous les cas sans arrêt et que ses contrôles propres (réécriture, remise à zéro,
 * absence d'écriture avant un geste) passent ; les constats OK/KO des critères sont dans
 * `report.json` (`findings`) et ne changent pas le code de sortie (JUS-0 constate, il ne corrige pas).
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, rmdirSync, symlinkSync, writeFileSync
} from 'node:fs';
import { createConnection } from 'node:net';
import { freemem, tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SELF = fileURLToPath(import.meta.url);
const PROJECT = 'demo-jus';
const USER = { sub: 'brasseur-demo-jus', email: 'brasseur@demo-jus.test' };
const PROTECTED = ['firebase.json', '.firebaserc', 'firestore.rules', 'firestore.indexes.json'];
const EMULATOR_PORTS = { auth: 9099, firestore: 8080, functions: 5001, hub: 4400, logging: 4500 };
const JAVA_HOME = process.env.EMU_JAVA_HOME || 'C:\\Program Files\\Microsoft\\jdk-21.0.12.101-hotspot';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DOCS = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6'];
const ALL_CASES = ['etats', 'doc5', 'finances', 'doc6', 'autre-numero', 'rattacher', 'minuscules', 'doc1', 'doc4', 'hors-ligne', 'doc3', 'doc2'];
/** Synthetic entries typed by the bench (never a value of a real document). */
const SYNTHETIC = { vendor: 'Malterie du Banc', description: 'Essai hors ligne JUS-0', amount: '12,30' };
/** Same emulator-only rewrite as the reference bench: the emulator refuses descending key scans. */
const EMULATOR_REWRITES = [{ path: '/src/services/firestoreRepo.ts', expected: 2,
  pattern: /orderBy\(\s*documentId\(\)\s*,\s*(["'])desc\1\s*\)/g, replacement: 'orderBy(documentId())' }];
const MEMORY_FLOOR = 3 * 1024 ** 3;
const sleep = ms => new Promise(done => setTimeout(done, ms));

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index > 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : fallback;
}
const flag = name => process.argv.includes(`--${name}`);
const sha = value => createHash('sha256').update(value).digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const listening = port => new Promise(done => {
  const socket = createConnection({ host: '127.0.0.1', port });
  socket.once('connect', () => { socket.destroy(); done(true); });
  socket.once('error', () => done(false));
});
function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else try { process.kill(-pid, 'SIGKILL'); } catch { /* already gone */ }
}
/** Accent- and case-insensitive key, the way a brewer compares two article names. */
const fold = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();
const cents = value => Math.round(Number(value) * 100);
const isoOf = swiss => (/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(swiss ?? '') ?? []).slice(1).reverse().join('-');

/** Replay manifest: images and recorded outputs read by path; nothing of them is copied into this file. */
function loadReplay(file) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  const docs = {};
  for (const id of DOCS) {
    const entry = manifest.docs?.[id];
    if (!entry) throw Error(`Manifeste : ${id} absent.`);
    const image = resolve(dirname(file), entry.image), output = resolve(dirname(file), entry.output);
    const bytes = readFileSync(image);
    let result = JSON.parse(readFileSync(output, 'utf8'));
    for (const key of entry.pointer) result = result?.[key];
    if (!result || typeof result !== 'object') throw Error(`Manifeste : sortie de ${id} introuvable (${entry.pointer.join('.')}).`);
    docs[id] = { id, image, fileName: basename(image), bytes, sha256: sha(bytes), result,
      mimeType: /\.png$/i.test(image) ? 'image/png' : /\.pdf$/i.test(image) ? 'application/pdf' : 'image/jpeg' };
  }
  return docs;
}

// ───────────────────────────── Mode externe : préparation, verrou, emulators:exec ─────────────────────────────

function protectedState() {
  return PROTECTED.map(path => {
    const file = join(ROOT, path);
    const status = spawnSync('git', ['status', '--porcelain', '--', path], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    return { path, exists: existsSync(file), sha: existsSync(file) ? sha(readFileSync(file)) : null, status };
  });
}

/** Same template, token and guards as scripts/build-rules.mjs, with the emulated account, written outside the repository. */
function generateRules(tmp) {
  const template = readFileSync(join(ROOT, 'firestore.rules.template'), 'utf8');
  const token = '__AUTHORIZED_ACCOUNTS__';
  if (!template.includes(token)) throw Error(`Le gabarit ne contient plus ${token}.`);
  const rules = template.replace(token, `        '${USER.email}'`);
  writeFileSync(join(tmp, 'firestore.rules'), rules);
  return { path: join(tmp, 'firestore.rules'), sha: sha(rules), templateSha: sha(template) };
}

/** Functions of this repository compiled into the temporary project (tsc plus the shared bundles the build adds). */
async function buildFunctions(tmp, log) {
  const functionsDir = join(tmp, 'functions'), lib = join(functionsDir, 'lib');
  mkdirSync(lib, { recursive: true });
  const tsc = existsSync(join(ROOT, 'functions/node_modules/typescript/bin/tsc'))
    ? join(ROOT, 'functions/node_modules/typescript/bin/tsc') : join(ROOT, 'node_modules/typescript/bin/tsc');
  const compiled = spawnSync(process.execPath, [tsc, '-p', join(ROOT, 'functions/tsconfig.json'), '--outDir', lib], { cwd: ROOT, encoding: 'utf8' });
  log(`tsc functions → ${lib} : exit ${compiled.status}\n${compiled.stdout}${compiled.stderr}`);
  if (compiled.status !== 0) throw Error('Compilation des Functions en échec.');
  const esbuild = await import('esbuild');
  const build = esbuild.build ?? esbuild.default.build;
  const common = { absWorkingDir: ROOT, bundle: true, platform: 'node', target: 'node22', format: 'esm', sourcemap: true, logLevel: 'silent' };
  await build({ ...common, entryPoints: ['src/domain/hopDecision/adviceContentReference.ts'], outfile: join(lib, 'hopAdviceContentReference.js') });
  await build({ ...common, entryPoints: ['src/domain/brewerTools.ts'], outfile: join(lib, 'brewerTools.js'), plugins: [{ name: 'shared-yeast-context', setup(bundler) {
    bundler.onResolve({ filter: /^\.\/yeastCompanion\.js$/ }, () => ({ path: join(ROOT, 'src/domain/yeastCompanion.ts') }));
  } }] });
  await build({ ...common, entryPoints: ['src/domain/finance/assistantContext.ts'], outfile: join(lib, 'financeContext.js') });
  await build({ ...common, entryPoints: ['src/domain/yeastCompanion.ts'], outfile: join(lib, 'yeastCompanion.js') });
  const source4Root = join(ROOT, 'src/services/hopV55'), sharedDomain = join(ROOT, 'src/domain');
  const codec = join(ROOT, 'functions/src/brewerHopAdviceWizardSourceV1.ts');
  await build({ ...common, preserveSymlinks: true, entryPoints: ['src/services/hopV55/brewerHopAdviceSemanticSource4.ts'],
    outfile: join(lib, 'brewerHopAdviceSemanticSource4.js'), plugins: [{ name: 'source4-relative', setup(bundler) {
      bundler.onResolve({ filter: /^\.\/hopAdviceContentReference\.js$/ }, args =>
        resolve(args.importer) === codec ? { path: join(sharedDomain, 'hopDecision/adviceContentReference.ts') } : undefined);
      bundler.onResolve({ filter: /^\.[^/].*\.js$/ }, args => {
        if (!args.importer.startsWith(source4Root) && !args.importer.startsWith(sharedDomain)) return undefined;
        const ts = resolve(dirname(args.importer), args.path.replace(/\.js$/, '.ts'));
        return existsSync(ts) ? { path: ts } : undefined;
      });
    } }] });
  copyFileSync(join(ROOT, 'functions/package.json'), join(functionsDir, 'package.json'));
  symlinkSync(join(ROOT, 'functions/node_modules'), join(functionsDir, 'node_modules'), 'junction');
  // Emulated account only; no GEMINI_API_KEY: a real model call would fail closed. Fake Drive configuration, as the reference bench.
  writeFileSync(join(functionsDir, '.env'), `AUTHORIZED_ACCOUNTS=${USER.email}\n`);
  writeFileSync(join(functionsDir, '.secret.local'), `DRIVE_OAUTH_CONFIG=${JSON.stringify({ clientId: `${PROJECT}-drive-factice`,
    clientSecret: 'factice', encryptionKey: '0'.repeat(64) })}\n`);
}

async function outer() {
  const replay = option('replay');
  if (!replay) throw Error('--replay <manifeste.json> requis (sorties réelles hors Git).');
  loadReplay(resolve(replay));
  const out = resolve(option('out', ''));
  if (!option('out')) throw Error('--out requis : un dossier ignoré par Git (les captures montrent des valeurs réelles).');
  mkdirSync(out, { recursive: true });
  const ignored = spawnSync('git', ['check-ignore', '-q', join(out, 'probe.png')], { cwd: ROOT }).status === 0;
  if (!ignored) throw Error(`${out} n'est pas ignoré par Git : aucune capture ne peut y aller.`);
  const logFile = join(out, 'orchestration.log');
  const log = text => { appendFileSync(logFile, `[${new Date().toISOString()}] ${text}\n`); console.log(text); };
  const lock = option('lock');
  const port = Number(option('port', '5175'));
  const before = protectedState();
  for (const used of [...Object.values(EMULATOR_PORTS), port])
    if (await listening(used)) throw Error(`Port ${used} déjà occupé : un autre émulateur ou serveur tourne. Rien n'est lancé.`);
  if (lock) { mkdirSync(lock); log(`verrou pris : ${lock}`); }
  let code = 1, child = null, lowMemory = null, tmp = null;
  const guard = setInterval(() => {
    if (freemem() >= MEMORY_FLOOR || !child) return;
    lowMemory = `${(freemem() / 1024 ** 3).toFixed(2)} Go libres`;
    log(`GARDE MÉMOIRE : ${lowMemory} < 3 Go, arrêt de l'arbre ${child.pid}`);
    killTree(child.pid);
  }, 5000);
  try {
    tmp = mkdtempSync(join(tmpdir(), 'affinee-jus0-emu-'));
    log(`dossier temporaire : ${tmp}`);
    const rules = generateRules(tmp);
    log(`règles générées depuis le gabarit (sha ${rules.templateSha.slice(0, 12)}) → ${rules.path}`);
    await buildFunctions(tmp, log);
    writeFileSync(join(tmp, 'firebase.json'), JSON.stringify({
      firestore: { rules: 'firestore.rules' },
      functions: [{ source: 'functions', codebase: 'default' }],
      emulators: { auth: { port: EMULATOR_PORTS.auth }, firestore: { port: EMULATOR_PORTS.firestore },
        functions: { port: EMULATOR_PORTS.functions }, hub: { port: EMULATOR_PORTS.hub }, logging: { port: EMULATOR_PORTS.logging },
        ui: { enabled: false }, singleProjectMode: true }
    }, null, 2));
    const env = { ...process.env, JAVA_HOME, PATH: `${join(JAVA_HOME, 'bin')}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`,
      EMU_OUT: out, EMU_TMP: tmp, EMU_WIDTHS: option('widths', '390,1280'), EMU_CASES: option('cases', ALL_CASES.join(',')),
      EMU_PORT: String(port), EMU_RULES_SHA: rules.sha, EMU_REPLAY: resolve(replay) };
    for (const secret of ['GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'GEMINI_KEY'])
      delete env[secret];
    const inner = `"${process.execPath}" "${SELF}" --inner`;
    const cli = join(ROOT, 'node_modules/firebase-tools/lib/bin/firebase.js');
    log(`emulators:exec --project ${PROJECT} --config ${join(tmp, 'firebase.json')}`);
    code = await new Promise(done => {
      child = spawn(process.execPath, [cli, 'emulators:exec', '--project', PROJECT, '--config', join(tmp, 'firebase.json'),
        '--only', 'auth,firestore,functions', inner], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
      log(`firebase emulators:exec pid ${child.pid}`);
      const sink = chunk => appendFileSync(join(out, 'emulators.log'), chunk);
      child.stdout.on('data', chunk => { sink(chunk); process.stdout.write(chunk); });
      child.stderr.on('data', chunk => { sink(chunk); process.stderr.write(chunk); });
      child.on('exit', status => done(status ?? 1));
    });
    log(`emulators:exec terminé : exit ${code}`);
  } finally {
    clearInterval(guard);
    await sleep(1500);
    const busy = [];
    for (const used of [...Object.values(EMULATOR_PORTS), port]) if (await listening(used)) busy.push(used);
    log(busy.length ? `PORTS ENCORE OCCUPÉS : ${busy.join(', ')}` : 'ports émulateurs et serveur libérés');
    if (busy.length) code = code || 1;
    const after = protectedState();
    const unchanged = canonical(before) === canonical(after);
    log(`fichiers protégés ${unchanged ? 'inchangés' : 'MODIFIÉS'} : ${JSON.stringify(after.map(row => [row.path, row.exists, row.sha?.slice(0, 12) ?? null, row.status]))}`);
    if (!unchanged) code = code || 1;
    if (lowMemory) { log(`arrêt par la garde mémoire (${lowMemory})`); code = code || 2; }
    if (tmp && !flag('keep-tmp')) rmSync(tmp, { recursive: true, force: true });
    if (lock) { rmdirSync(lock); log(`verrou libéré : ${lock}`); }
  }
  log(code === 0 ? 'EMU-INVOICE-JOURNEY-OK' : `ÉCHEC (exit ${code})`);
  process.exit(code);
}

// ───────────────────────────── Services simulés dans la page ─────────────────────────────

/**
 * Installed before any App script: `aiTask`, `driveAuthorization` and Drive v3 requests are answered by the bench
 * through `__jus0Bridge`; every other request goes to the real network stack (and is blocked if not local).
 */
function pageServices() {
  const realFetch = window.fetch.bind(window);
  const callable = /^http:\/\/127\.0\.0\.1:5001\/[^/]+\/[^/]+\/(aiTask|driveAuthorization)(?:\?|$)/;
  const drive = /^https:\/\/www\.googleapis\.com\/(?:upload\/)?drive\/v3\/files/;
  const toBase64 = bytes => { let text = ''; for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(text); };
  const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const match = callable.exec(url), isDrive = drive.test(url);
    if (!match && !isDrive) return realFetch(input, init);
    if (window.__jus0Offline) throw new TypeError('Failed to fetch');
    const headers = Object.fromEntries(new Headers(init.headers || {}).entries());
    let body = null;
    if (match && typeof init.body === 'string') {
      // The scanned file stays in the page: only its type, size and digest reach the bench.
      const data = JSON.parse(init.body).data ?? {};
      const file = data.file && typeof data.file.data === 'string'
        ? (bytes => ({ mimeType: data.file.mimeType, bytes: bytes.length }))(Uint8Array.from(atob(data.file.data), c => c.charCodeAt(0))) : null;
      if (file) file.sha256 = await digest(Uint8Array.from(atob(data.file.data), c => c.charCodeAt(0)));
      body = { json: { ...data, file } };
    } else if (typeof init.body === 'string') body = { text: init.body };
    else if (init.body) body = { base64: toBase64(new Uint8Array(await new Response(init.body).arrayBuffer())) };
    const answer = await window.__jus0Bridge({ kind: match ? match[1] : 'drive', url, method: (init.method || 'GET').toUpperCase(), headers, body });
    if (answer.networkError) throw new TypeError('Failed to fetch');
    const payload = answer.status === 204 ? null : answer.base64 ? Uint8Array.from(atob(answer.base64), c => c.charCodeAt(0)) : (answer.text ?? '');
    return new Response(payload, { status: answer.status, headers: answer.headers || {} });
  };
}

/** Callable answers (`{ result }` or `{ error }`), as the Functions emulator would send them. */
function callableAnswer(c, request) {
  const json = result => ({ status: 200, headers: { 'Content-Type': 'application/json' }, text: JSON.stringify({ result }) });
  const fail = (status, code, message) => ({ status, headers: { 'Content-Type': 'application/json' }, text: JSON.stringify({ error: { status: code, message } }) });
  const data = request.body?.json ?? {};
  if (request.kind === 'driveAuthorization') {
    c.calls.drive.push({ action: data.action });
    if (data.action === 'token') return json({ accessToken: `jus0-drive-factice-${c.width}`, expiresAt: Date.now() + 3600_000, persistent: true });
    if (data.action === 'config') return json({ clientId: `${PROJECT}-drive-factice` });
    return fail(400, 'FAILED_PRECONDITION', 'Drive simulé : action non prise en charge.');
  }
  const ai = c.ai, doc = c.docs[ai.doc];
  const call = { task: data.task, tier: data.tier, file: data.file, mode: ai.mode, doc: ai.doc, at: new Date().toISOString() };
  c.calls.ai.push(call);
  if (data.task !== 'scanInvoice') return fail(400, 'FAILED_PRECONDITION', 'Banc : seule la lecture de justificatif est rejouée.');
  call.expectedFile = doc ? data.file?.sha256 === doc.sha256 : false;
  if (ai.mode === 'refus') return fail(429, 'RESOURCE_EXHAUSTED', 'Budget IA du mois atteint.');
  if (ai.mode === 'inutilisable') return json({ ok: true, data: 'La réponse du modèle ne contient aucun champ exploitable.', model: 'rejeu-jus0', elapsedMs: 900 });
  if (!doc || !call.expectedFile) return fail(400, 'FAILED_PRECONDITION', 'Banc : fichier inattendu pour ce cas.');
  return json({ ok: true, data: doc.result, model: 'rejeu-jus0', elapsedMs: 1200, documentHash: doc.sha256 });
}

/** In-memory Google Drive v3 subset used by `driveFileStore.ts`: ids, folders, resumable upload, metadata, media. */
function driveAnswer(c, request) {
  const store = c.drive;
  const json = (status, value, headers = {}) => ({ status, headers: { 'Content-Type': 'application/json', ...headers }, text: JSON.stringify(value) });
  const notFound = () => json(404, { error: { code: 404, errors: [{ reason: 'notFound' }] } });
  const url = new URL(request.url), path = url.pathname, method = request.method;
  const meta = file => ({ id: file.id, name: file.name, mimeType: file.mimeType, size: file.size === undefined ? undefined : String(file.size),
    sha256Checksum: file.sha256Checksum, trashed: false, parents: file.parents, appProperties: file.appProperties });
  store.log.push(`${method} ${path}${url.searchParams.has('alt') ? '?alt=media' : ''}`);
  if (path === '/drive/v3/files/generateIds') return json(200, { ids: [`jus0f${String(++store.next).padStart(6, '0')}`] });
  if (path === '/drive/v3/files' && method === 'GET') {
    const q = url.searchParams.get('q') || '';
    const pairs = [...q.matchAll(/key='([^']*)' and value='([^']*)'/g)].map(m => [m[1], m[2]]);
    const mime = /mimeType = '([^']*)'/.exec(q)?.[1], parent = /'([^']*)' in parents/.exec(q)?.[1];
    const files = [...store.files.values()].filter(file => pairs.every(([key, value]) => file.appProperties?.[key] === value)
      && (!mime || file.mimeType === mime) && (!parent || file.parents?.includes(parent)));
    return json(200, { files: files.map(meta) });
  }
  if (path === '/drive/v3/files' && method === 'POST') {
    const body = JSON.parse(request.body?.text || '{}');
    if (store.files.has(body.id)) return json(409, { error: { code: 409, errors: [{ reason: 'duplicate' }] } });
    store.files.set(body.id, { id: body.id, name: body.name, mimeType: body.mimeType, parents: body.parents, appProperties: body.appProperties });
    return json(200, meta(store.files.get(body.id)));
  }
  const fileId = /^\/drive\/v3\/files\/([A-Za-z0-9_-]+)$/.exec(path)?.[1];
  if (fileId && method === 'GET') {
    const file = store.files.get(fileId);
    if (!file) return notFound();
    if (url.searchParams.get('alt') === 'media') {
      store.downloads.push(fileId);
      return { status: 200, headers: { 'Content-Type': file.mimeType, 'Content-Length': String(file.bytes.length) }, base64: file.bytes.toString('base64') };
    }
    return json(200, meta(file));
  }
  if (path === '/upload/drive/v3/files' && method === 'POST') {
    const body = JSON.parse(request.body?.text || '{}');
    if (store.files.has(body.id)) return json(409, { error: { code: 409, errors: [{ reason: 'duplicate' }] } });
    const session = `jus0s${String(++store.next).padStart(6, '0')}`;
    store.sessions.set(session, { meta: body, total: Number(request.headers['x-upload-content-length']), parts: [] });
    return json(200, {}, { Location: `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=${session}` });
  }
  if (path === '/upload/drive/v3/files' && method === 'PUT') {
    const upload = store.sessions.get(url.searchParams.get('upload_id'));
    if (!upload) return notFound();
    const range = request.headers['content-range'] || '';
    const received = () => upload.parts.reduce((sum, part) => sum + part.length, 0);
    const chunk = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(range);
    if (chunk) {
      if (Number(chunk[1]) !== received()) return json(400, { error: { code: 400, errors: [{ reason: 'badRange' }] } });
      upload.parts.push(Buffer.from(request.body?.base64 || '', 'base64'));
    }
    if (received() < upload.total) return { status: 308, headers: received() ? { Range: `bytes=0-${received() - 1}` } : {}, text: '' };
    const bytes = Buffer.concat(upload.parts);
    const file = { id: upload.meta.id, name: upload.meta.name, mimeType: upload.meta.mimeType, parents: upload.meta.parents,
      appProperties: upload.meta.appProperties, bytes, size: bytes.length, sha256Checksum: sha(bytes) };
    store.files.set(file.id, file);
    store.uploads.push({ id: file.id, bytes: bytes.length, sha256: file.sha256Checksum });
    return json(200, meta(file));
  }
  return json(400, { error: { code: 400, errors: [{ reason: 'unsupportedBySimulator' }] } });
}

// ───────────────────────────── Mode interne : vraie App, Chrome, Admin SDK ─────────────────────────────

async function click(page, selector, text, timeout = 30000) {
  const start = Date.now();
  for (;;) {
    let found = null;
    for (const handle of await page.$$(selector)) {
      const ok = !found && await handle.evaluate((e, wanted) => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'
        && (!wanted || (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').startsWith(wanted)), text ?? null);
      if (ok) found = handle; else await handle.dispose();
    }
    if (found) { await found.evaluate(e => e.scrollIntoView({ block: 'center' })); await found.click(); return found; }
    if (Date.now() - start > timeout) throw Error(`Aucun élément visible : ${selector}${text ? ` « ${text} »` : ''}`);
    await sleep(400);
  }
}
async function waitFor(check, label, timeout = 30000) {
  const start = Date.now();
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() - start > timeout) throw Error(`Délai dépassé : ${label}`);
    await sleep(500);
  }
}
async function typeInto(page, selector, value) {
  await page.$eval(selector, e => { e.scrollIntoView({ block: 'center' }); e.focus(); e.select?.(); });
  if (value === '') await page.keyboard.press('Backspace'); else await page.keyboard.type(value);
  await page.keyboard.press('Tab');
  await sleep(300);
}
/** Sets a native date input the way React sees a user change. */
async function setDate(page, selector, iso) {
  await page.$eval(selector, (e, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, value);
    e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
  }, iso);
  await sleep(300);
}
async function openDetails(page, selector) {
  await page.$eval(selector, e => { if (!e.open) e.querySelector(':scope > summary')?.click(); e.scrollIntoView({ block: 'start' }); });
  await sleep(300);
}

/** Every document of the emulated database, fingerprinted, to attribute each write to a gesture. */
async function dbSnapshot(db) {
  await sleep(1200);
  const snapshot = {};
  for (const collection of await db.listCollections())
    if (!JOURNALS.includes(collection.id)) snapshot[collection.id] = Object.fromEntries((await collection.get()).docs.map(doc => [doc.id, sha(canonical(doc.data()))]));
  return snapshot;
}
function dbWrites(before, after) {
  const writes = [];
  for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const was = before[name] ?? {}, is = after[name] ?? {};
    const added = Object.keys(is).filter(id => !(id in was)), removed = Object.keys(was).filter(id => !(id in is));
    const changed = Object.keys(is).filter(id => id in was && was[id] !== is[id]);
    if (added.length || removed.length || changed.length) writes.push({ collection: name, added, changed, removed });
  }
  return writes;
}
/** Collections a purchase may touch; journals written by the App or the Functions are not business writes. */
const JOURNALS = ['auditLogs', 'dataHistory'];
const businessWrites = writes => writes.filter(row => !JOURNALS.includes(row.collection));
const all = async (db, name) => (await db.collection(name).get()).docs.map(doc => ({ id: doc.id, ...doc.data() }));

async function waitApp(c) {
  const state = await (await c.page.waitForFunction(() => {
    const blocked = document.body.innerText.match(/Synchronisation \S+ impossible[^\n]*|Accès refusé par les règles[^\n]*/u)?.[0];
    if (blocked) return blocked;
    return !!document.querySelector('.floating-actions button[aria-haspopup="menu"]') && 'ok';
  }, { timeout: 120000 })).jsonValue();
  if (state !== 'ok') throw Error(`App bloquée : ${state}`);
  await sleep(800);
}
async function signIn(c) {
  await c.page.goto(c.base, { waitUntil: 'domcontentloaded' });
  await c.page.waitForFunction(() => document.body.innerText.includes('Continuer avec Google'), { timeout: 180000 });
  await sleep(2500);
  await c.page.waitForFunction(() => document.body.innerText.includes('Continuer avec Google'), { timeout: 180000 });
  const uid = await c.page.evaluate(async user => {
    const source = await (await fetch('/src/services/firebase.ts')).text();
    const match = source.match(/["'](\/node_modules\/\.vite\/deps\/firebase_auth\.js\?v=[\w-]+)["']/);
    if (!match) throw Error('Module firebase/auth de l’App introuvable.');
    const authSdk = await import(match[1]);
    const { auth, isUsingEmulators } = await import('/src/services/firebase.ts');
    if (!isUsingEmulators()) throw Error('L’App ne vise pas les émulateurs : connexion refusée.');
    const result = await authSdk.signInWithCredential(auth,
      authSdk.GoogleAuthProvider.credential(JSON.stringify({ sub: user.sub, email: user.email, email_verified: true })));
    return result.user.uid;
  }, USER);
  await waitApp(c);
  return uid;
}
async function reloadApp(c) {
  await c.page.reload({ waitUntil: 'domcontentloaded' });
  await waitApp(c);
}

/** Scroll the element into view inside its scroller, then capture the viewport. */
async function shoot(c, label, selector, block = 'start') {
  if (selector) await c.page.evaluate((sel, where) => {
    const el = document.querySelector(sel); if (!el) return;
    el.scrollIntoView({ block: where, inline: 'nearest' });
  }, selector, block);
  await sleep(500);
  const name = `${c.width}-${String(++c.shotIndex).padStart(2, '0')}-${label}.png`;
  await c.page.screenshot({ path: join(c.out, name) });
  c.entry.captures.push(name);
  return name;
}

/** Opens « Entrer une facture » from the action launcher; the App opens the file chooser by itself. */
async function openInvoiceEntry(c) {
  const chooser = c.page.waitForFileChooser({ timeout: 20000 }).catch(() => null);
  await click(c.page, '.floating-actions button[aria-haspopup="menu"]');
  await click(c.page, '[role="menu"] [role="menuitem"]', 'Entrer une facture');
  await c.page.waitForSelector('section[aria-label="Justificatif de la dépense"]', { visible: true, timeout: 60000 });
  return chooser;
}
/** Picks a document in an open chooser (or opens one with « Choisir le document »), then waits for the reading. */
async function scan(c, docId, { mode = 'replay', chooser, delayMs = 0, loadingShot } = {}) {
  c.ai = { mode, doc: docId, delayMs };
  const doc = c.docs[docId];
  let picker = chooser ? await chooser : null;
  if (!picker) {
    // « Choisir le document » before a reading, « Changer » after one: find the visible one, then arm the chooser.
    const label = await waitFor(() => c.page.$$eval(`${sheet} button`, buttons => {
      const shown = buttons.filter(b => b.getClientRects().length && !b.disabled).map(b => b.innerText.trim());
      return shown.find(text => text.startsWith('Choisir le document')) ?? shown.find(text => text === 'Changer') ?? false;
    }), 'bouton pour choisir un justificatif', 20000);
    [picker] = await Promise.all([c.page.waitForFileChooser({ timeout: 20000 }), click(c.page, `${sheet} button`, label)]);
  }
  await picker.accept([doc.image]);
  if (loadingShot) {
    await c.page.waitForFunction(() => document.body.innerText.includes('Lecture et vérification'), { timeout: 20000 });
    await shoot(c, loadingShot);
  }
  await c.page.waitForFunction(() => !document.body.innerText.includes('Lecture et vérification')
    && (document.querySelector('section[aria-label="Vérification du justificatif"]') || document.querySelector('.modal-shell [role="alert"], [role="dialog"] [role="alert"]')
      || document.querySelector('#purchase-total')), { timeout: 60000 });
  await sleep(600);
}
const sheet = '[role="dialog"]';
/** What the brewer reads in the sheet: review, hints, alerts, field values. */
async function readSheet(c) {
  return c.page.evaluate(() => {
    const root = document.querySelector('[role="dialog"]') || document.body;
    const value = sel => root.querySelector(sel)?.value ?? null;
    const text = sel => root.querySelector(sel)?.innerText.replace(/\s+/g, ' ').trim() ?? null;
    return {
      review: text('section[aria-label="Vérification du justificatif"]'),
      reviewDetails: [...root.querySelectorAll('section[aria-label="Vérification du justificatif"] li')].map(li => li.innerText.trim()),
      alerts: [...root.querySelectorAll('[role="alert"]')].map(e => e.innerText.replace(/\s+/g, ' ').trim()),
      hints: Object.fromEntries([...root.querySelectorAll('[id^="scan-hint-"]')].map(e => [e.id.slice(10), { text: e.innerText.replace(/\s+/g, ' ').trim(), visible: !!e.getClientRects().length && !!e.offsetParent }])),
      total: value('#purchase-total'), description: value('#purchase-description'), vendor: value('#purchase-vendor'),
      category: value('#purchase-category'), invoiceNumber: value('#purchase-invoice-number'), vat: value('#purchase-vat'), vatRate: value('#purchase-vat-rate'),
      date: text('[data-purchase-date] summary'), dateOpen: root.querySelector('[data-purchase-date]')?.open ?? null,
      payment: [...root.querySelectorAll('[aria-label="État du règlement"] button')].map(b => `${b.innerText.trim()}=${b.getAttribute('aria-pressed')}`),
      paymentSummary: text('[data-purchase-payment] summary'),
      dueDate: [...root.querySelectorAll('[data-purchase-payment] input[type="date"]')].map(e => `${e.closest('label,div')?.innerText?.split('\n')[0] ?? ''}=${e.value}`),
      lines: [...root.querySelectorAll('article[data-purchase-line]')].map(a => ({
        label: a.querySelector('[aria-label^="Libellé ligne"]')?.value ?? null, kind: a.querySelector('[aria-label^="Nature ligne"]')?.value ?? null,
        amount: a.querySelector('[aria-label^="Montant ligne"]')?.value ?? null, stock: a.querySelector('[aria-label^="Stock ligne"]')?.value ?? null,
        quantity: a.querySelector('[aria-label^="Quantité ligne"]')?.value ?? null, unit: a.querySelector('[aria-label^="Unité ligne"]')?.value ?? null,
        article: a.querySelector('[role="combobox"]')?.value ?? null, summary: a.querySelector(':scope > details > summary')?.innerText.replace(/\s+/g, ' ').trim() ?? null })),
      linesSummary: text('details[data-purchase-lines] > summary'),
      duplicate: text('#purchase-duplicate'),
      footer: [...root.querySelectorAll('footer button')].map(b => b.innerText.trim()),
      numberInputs: document.querySelectorAll('input[type="number"]').length
    };
  });
}
/** Interface measures of the open sheet at this width (DESIGN.md: 24 px cible minimale, barres 36 px). */
async function measureSheet(c) {
  return c.page.evaluate(() => {
    const root = document.querySelector('[role="dialog"]');
    if (!root) return null;
    const rect = e => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width) }; };
    const header = root.querySelector('header'), footer = root.querySelector('footer');
    const scroller = [...root.querySelectorAll('div')].find(e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight);
    const small = [...root.querySelectorAll('button, a[href], input:not([type=hidden]):not([hidden]), select, summary, [role="combobox"], [role="option"]')]
      .filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
      .map(e => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.width < 24 || r.height < 24))
      .map(({ e, r }) => `${e.tagName.toLowerCase()}${e.type ? `[${e.type}]` : ''} « ${(e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40)} » ${Math.round(r.width)}×${Math.round(r.height)}`);
    return { viewport: { width: innerWidth, height: innerHeight }, dialog: rect(root), header: header && rect(header), footer: footer && rect(footer),
      scroller: scroller && { ...rect(scroller), scrollHeight: scroller.scrollHeight },
      overflowX: document.scrollingElement.scrollWidth > innerWidth, smallControls: small,
      numberInputs: document.querySelectorAll('input[type="number"]').length };
  });
}
async function closeSheet(c) {
  if (!(await c.page.$(`${sheet} footer`))) return;
  await click(c.page, `${sheet} header button[aria-label="Fermer"]`, undefined, 3000).catch(() => c.page.keyboard.press('Escape'));
  await sleep(800);
}
/** Clicks the sheet's main action and waits for the sheet to close or an alert to appear. */
async function confirmSheet(c, timeout = 45000) {
  await click(c.page, `${sheet} footer button`);
  const outcome = await (await c.page.waitForFunction(() => {
    const dialog = document.querySelector('[role="dialog"] footer');
    if (!dialog) return 'fermée';
    const alerts = [...document.querySelectorAll('[role="dialog"] [role="alert"]')].map(e => e.innerText.trim()).filter(Boolean);
    const busy = document.querySelector('[role="dialog"] footer button')?.innerText.includes('Enregistrement');
    return !busy && alerts.length ? `alerte: ${alerts.join(' | ').replace(/\s+/g, ' ').slice(0, 500)}` : false;
  }, { timeout, polling: 500 })).jsonValue();
  await sleep(800);
  return outcome;
}
/** JUS-1 : each purchase line is a compact, closed row; its controls live in its own details. */
const toggleLine = (article, open) => article.evaluate((a, value) => { const d = a.querySelector(':scope > details'); if (d) d.open = value; }, open);
/** Chooses the stock action of each purchase line; `plan(index)` returns { action, search?, wanted? }. A proposal of
 * the reading (JUS-1) is kept when it names the wanted article, and corrected like a brewer would otherwise. */
async function setStockLines(c, plan) {
  await openDetails(c.page, `${sheet} details[data-purchase-lines]`);
  const lines = await c.page.$$(`${sheet} article[data-purchase-line]`);
  const done = [];
  for (const [index, article] of lines.entries()) {
    const stock = await article.$('select[aria-label^="Stock ligne"]');
    if (!stock) { done.push({ index, action: 'aucune option de stock' }); continue; }
    const decision = plan(index) ?? { action: 'none' };
    const shown = await article.evaluate(a => ({ action: a.querySelector('select[aria-label^="Stock ligne"]')?.value, article: a.querySelector('[role="combobox"]')?.value ?? '',
      marked: /proposé :/.test(a.querySelector(':scope > details > summary')?.innerText ?? '') }));
    const right = shown.action === 'existing' && decision.action === 'existing' && fold(shown.article).includes(fold(decision.wanted));
    const row = { index, action: decision.action, proposition: shown.action === 'existing' ? (right ? 'juste' : 'fausse') : 'aucune', marquee: shown.marked };
    if (right) { row.action = 'existing (proposition gardée)'; done.push(row); continue; }
    if (decision.action === 'none' && shown.action === 'none') { done.push(row); continue; }
    await toggleLine(article, true);
    await stock.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await stock.select(decision.action);
    await sleep(250);
    if (decision.action === 'existing') {
      const box = await article.$('[role="combobox"]');
      await box.click({ clickCount: 3 }); await sleep(200);
      await c.page.keyboard.type(decision.search);
      const option = await c.page.waitForSelector('li[role="option"]', { visible: true, timeout: 4000 }).catch(() => null);
      row.search = 'recherche saisie (sans accent)';
      row.options = await c.page.$$eval('li[role="option"]', nodes => nodes.filter(n => n.getClientRects().length).map(n => n.innerText.replace(/\s+/g, ' ').trim())).catch(() => []);
      const wanted = option ? await c.page.$$('li[role="option"]') : [];
      let picked = false;
      for (const handle of wanted) {
        const label = await handle.evaluate(e => e.innerText);
        if (fold(label).includes(fold(decision.wanted))) { await handle.click(); picked = true; break; }
      }
      row.found = picked;
      if (!picked) {
        // What a brewer would do when the article is not proposed: create it.
        await c.page.keyboard.press('Escape');
        await stock.select('new');
        row.action = 'new (article existant non proposé)';
      }
      await sleep(250);
    }
    await toggleLine(article, false);
    done.push(row);
  }
  return done;
}

/** Runtime seeds derived from the replayed doc5/doc6 readings (never written in this file). */
function seedPlan(docs) {
  const five = docs.doc5.result.items ?? [], six = docs.doc6.result.items ?? [];
  const stockLines = five.map((item, index) => ({ ...item, index })).filter(item => item.kind === 'stock');
  // Same supplier reference in both readings, same name once accents are folded, different spelling: the accent test.
  const twinOf = item => six.find(other => other.reference && other.reference === item.reference
    && fold(other.name) === fold(item.name) && other.name !== item.name);
  const accent = stockLines.find(twinOf);
  const accentTwin = accent && twinOf(accent);
  const hop = stockLines.find(item => item.index !== accent?.index && /^g$/i.test(item.unit ?? '') && /houblon/i.test(item.stockCategory ?? ''));
  const yeast = stockLines.find(item => /levure/i.test(item.stockCategory ?? ''));
  const seeds = [];
  if (accent) seeds.push({ id: 'jus0-existant-accent', line: accent.index, name: accentTwin.name.replace(/,?\s*kg$/i, '').trim(), unit: 'kg', category: 'Malt', currentStock: 2, pricePerUnit: 1, search: accent.name.split(/\s+/)[0].replace(/[^\p{L}\p{N}-]/gu, '') });
  if (hop) seeds.push({ id: 'jus0-existant-houblon', line: hop.index, name: hop.name, unit: 'g', category: 'Houblon', currentStock: 100, pricePerUnit: 1, search: hop.name.split(/\s+/)[0] });
  if (yeast) seeds.push({ id: 'jus0-existant-levure', line: yeast.index, name: yeast.name, unit: 'sachet', category: 'Levure', currentStock: 1, pricePerUnit: 1, search: yeast.name.split(/\s+/)[0] });
  return { seeds, stockLines: stockLines.map(item => item.index), accentFound: !!accent };
}

// ───────────────────────────── Cas ─────────────────────────────

/** États vide, chargement, erreur (refus), réponse inutilisable ; aucune écriture. */
async function caseEtats(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  c.check(!!(await chooser), 'le geste « Entrer une facture » ouvre le sélecteur de fichiers');
  if (await chooser) await (await chooser).cancel();
  await sleep(500);
  c.record('etat-vide', await readSheet(c));
  await shoot(c, 'etat-vide');
  await scan(c, 'doc1', { mode: 'refus', delayMs: 2500, loadingShot: 'etat-chargement' });
  const refused = await readSheet(c);
  c.record('etat-refus', refused);
  c.check(refused.alerts.some(text => /Quota|budget|réessaie/i.test(text)), 'scan refusé : message visible', { alerts: refused.alerts });
  c.check(!refused.total, 'scan refusé : aucun montant prérempli', { total: refused.total });
  await shoot(c, 'etat-erreur-refus');
  await scan(c, 'doc1', { mode: 'inutilisable' });
  const useless = await readSheet(c);
  c.record('etat-inutilisable', useless);
  await shoot(c, 'etat-reponse-inutilisable');
  c.measure('etat-inutilisable', await measureSheet(c));
  await closeSheet(c);
  const writes = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  c.check(!writes.length, 'états : aucune écriture métier sans enregistrement', { writes });
}

/** doc5 : facture fournisseur complète → revue → stock ligne par ligne → confirmation → dépense et stock. */
async function caseDoc5(c) {
  const doc = c.docs.doc5, scanned = doc.result;
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc5', { chooser, delayMs: 2000 });
  const read = await readSheet(c);
  c.record('doc5-revue', read);
  c.measure('doc5-rempli', await measureSheet(c));
  await shoot(c, 'doc5-revue');
  // Critère 9 : l'alerte de date de la lecture (conservée après le contrôle) est-elle visible ?
  const dateWarnings = (scanned.fieldWarnings ?? []).filter(w => w.field === 'date').map(w => w.message);
  const dateHint = read.hints.date;
  c.finding('C9', 'alerte de date de la lecture visible dans la revue', {
    lectureAlerteDate: dateWarnings.length, indiceDateVisible: !!dateHint?.visible, detailsDateOuverts: read.dateOpen,
    indiceRepriseDeLaLecture: !!dateHint && dateWarnings.includes(dateHint.text.replace(/^À confirmer · /, '')),
    dansLesDetails: read.reviewDetails.some(item => dateWarnings.some(w => item.includes(w))) });
  await openDetails(c.page, `${sheet} section[aria-label="Vérification du justificatif"] details`);
  await shoot(c, 'doc5-revue-details', `${sheet} section[aria-label="Vérification du justificatif"]`);
  await shoot(c, 'doc5-date', `${sheet} [data-purchase-date]`);
  await openDetails(c.page, `${sheet} details:has(#purchase-invoice-number)`);
  const vat = await readSheet(c);
  c.finding('C1-tva', 'TVA par taux telle qu’imprimée', { champsTvaDuFormulaire: await c.page.$$eval(`${sheet} #purchase-vat, ${sheet} #purchase-vat-rate`, nodes => nodes.length),
    tauxLu: vat.vatRate, montantTvaLu: vat.vat, lectureTauxUnique: scanned.tvaRate, lectureAlerteTaux: (scanned.fieldWarnings ?? []).filter(w => w.field === 'tvaRate').length });
  await shoot(c, 'doc5-tva', `${sheet} details:has(#purchase-invoice-number)`);
  // Critère 3 : stock. Lignes stock → existant (semis) ou nouvel article ; services et port sans option de stock.
  const seeds = Object.fromEntries(c.plan.seeds.map(seed => [seed.line, seed]));
  const afterScan = await dbSnapshot(c.db);
  c.check(!businessWrites(dbWrites(before, afterScan)).length, 'doc5 : la lecture seule n’écrit rien', { writes: businessWrites(dbWrites(before, afterScan)) });
  await openDetails(c.page, `${sheet} details[data-purchase-lines]`);
  c.measure('doc5-lignes-compactes', await c.page.$$eval(`${sheet} article[data-purchase-line]`, nodes => {
    const heights = nodes.map(node => Math.round(node.getBoundingClientRect().height));
    return { lignes: heights.length, moyenne: Math.round(heights.reduce((sum, h) => sum + h, 0) / Math.max(1, heights.length)), min: Math.min(...heights), max: Math.max(...heights),
      liste: Math.round((nodes.at(-1)?.getBoundingClientRect().bottom ?? 0) - (nodes[0]?.getBoundingClientRect().top ?? 0)) };
  }));
  c.measure('doc5-lignes-ouvertes', await measureSheet(c));
  c.record('doc5-propositions', (await readSheet(c)).lines.map((line, index) => ({ index, stock: line.stock, marquee: /proposé :/.test(line.summary ?? '') })));
  await shoot(c, 'doc5-articles-propositions', `${sheet} details[data-purchase-lines]`);
  const plan = await setStockLines(c, index => {
    if (!c.plan.stockLines.includes(index)) return { action: 'none' };
    const seed = seeds[index];
    if (!seed) return { action: 'new' };
    return { action: 'existing', search: seed.search, wanted: seed.name };
  });
  c.record('doc5-stock-plan', plan);
  const seededLines = c.plan.seeds.map(seed => seed.line);
  c.finding('M4-propositions', 'articles existants proposés pour les lignes lues (JUS-1)', { semis: seededLines.length,
    semisProposesJustes: plan.filter(row => seededLines.includes(row.index) && row.proposition === 'juste').length,
    propositionsFausses: plan.filter(row => row.proposition === 'fausse').map(row => row.index),
    propositionsMarquees: plan.filter(row => row.proposition && row.proposition !== 'aucune' && row.marquee).length, propositions: plan.filter(row => row.proposition && row.proposition !== 'aucune').length });
  const filled = await readSheet(c);
  c.record('doc5-lignes', filled.lines);
  await shoot(c, 'doc5-articles', `${sheet} details[data-purchase-lines]`);
  const beforeConfirm = await dbSnapshot(c.db);
  c.check(!businessWrites(dbWrites(before, beforeConfirm)).length, 'doc5 : rien n’entre en stock avant la confirmation', { writes: businessWrites(dbWrites(before, beforeConfirm)) });
  let outcome = await confirmSheet(c, 60000);
  c.record('doc5-confirmation', outcome);
  if (outcome !== 'fermée') {
    await shoot(c, 'doc5-confirmation-refusee');
    // A unit the stock does not understand (read « Stk », stock in « sachet ») is corrected by hand, as a brewer would.
    const fixes = [];
    for (const seed of c.plan.seeds.filter(seed => seed.unit === 'sachet')) {
      const unit = (await c.page.$$(`${sheet} article[data-purchase-line]`))[seed.line] && await (await c.page.$$(`${sheet} article[data-purchase-line]`))[seed.line].$('[aria-label^="Unité ligne"]');
      if (!unit) continue;
      const read = await unit.evaluate(e => e.value);
      await unit.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.focus(); e.select(); });
      await c.page.keyboard.type(seed.unit); await c.page.keyboard.press('Tab'); await sleep(300);
      fixes.push({ line: seed.line, uniteLue: read, uniteSaisie: seed.unit });
    }
    c.record('doc5-corrections-manuelles', fixes);
    if (fixes.length) { outcome = await confirmSheet(c, 60000); c.record('doc5-confirmation-2', outcome); }
    if (outcome !== 'fermée') await shoot(c, 'doc5-confirmation-refusee-2');
  }
  const after = await dbSnapshot(c.db);
  c.record('doc5-ecritures', businessWrites(dbWrites(before, after)));
  const view = await verifyPurchase(c, 'doc5', { stockPlan: plan });
  c.finding('M3-categories', 'catégorie canonique des articles créés (JUS-1)', { categories: view.stock?.categoriesNouveaux ?? null,
    minuscules: (view.stock?.categoriesNouveaux ?? []).filter(category => category && category[0] !== category[0].toUpperCase()).length,
    receptionsSurSemis: view.stock?.semis?.map(seed => ({ id: seed.id, recu: seed.apres > seed.avant })), doublonsDArticle: view.stock?.doublonsDArticle ?? null });
}

/** Admin-side reading of one saved purchase: transaction, payment, original, stock items and movements. */
async function verifyPurchase(c, docId, { stockPlan = [] } = {}) {
  const doc = c.docs[docId], scanned = doc.result;
  const txs = (await all(c.db, 'transactions')).filter(tx => tx.finance?.sourceDocumentHash === doc.sha256);
  const tx = txs[0];
  const proof = tx?.finance?.proofDocumentId ? (await c.db.doc(`financeDocuments/${tx.finance.proofDocumentId}`).get()).data() : null;
  const payments = [];
  for (const name of (await c.db.listCollections()).map(col => col.id).filter(id => /payment/i.test(id)))
    for (const row of await all(c.db, name)) if (row.transactionId === tx?.id) payments.push({ collection: name, id: row.id, method: row.method, date: row.date === isoOf(tx?.date) ? 'date de l’achat' : 'autre date' });
  const view = {
    transactions: txs.length, id: tx?.id,
    montantConformeALaLecture: tx ? cents(tx.amountTTC) === cents(scanned.amountTTC ?? NaN) : null,
    dateConformeALaLecture: tx ? tx.date === scanned.date : null, dateVide: tx ? !tx.date : null,
    fournisseurConformeALaLecture: tx ? (tx.finance?.vendor ?? '') === (scanned.vendor ?? '') : null,
    categorieConformeALaLecture: tx ? tx.category === scanned.category : null, categorie: tx?.category,
    statut: tx?.finance?.paymentStatus, paiements: payments,
    tva: tx && { tvaRate: tx.tvaRate, tvaAmountEgalSource: tx.tvaAmount === tx.finance?.sourceVatAmount, tvaAmountNul: tx.tvaAmount === 0,
      sourceVatRate: tx.finance?.sourceVatRate ?? null, sourceVatAmountConformeALaLecture: scanned.tvaAmount == null ? null : tx.finance?.sourceVatAmount === scanned.tvaAmount,
      champsParTaux: Object.keys(tx.finance ?? {}).filter(key => /vat|tva/i.test(key)) },
    justificatif: tx && { proofDocumentId: !!tx.finance?.proofDocumentId, original: proof ? { drive: !!proof.driveFileId, sha256Conforme: proof.sha256 === doc.sha256, bytes: proof.bytes === doc.bytes.length } : null },
    lignes: tx?.finance?.lines?.length ?? 0, lignesSansMontant: tx?.finance?.lines?.filter(line => !Number.isFinite(line.amountCents)).length ?? null,
    typeSource: tx?.finance?.sourceDocumentType, baseDuTotal: tx?.finance?.sourceTotalBasis
  };
  if (stockPlan.length && tx) {
    const items = await all(c.db, 'stockItems'), movements = (await all(c.db, 'movements')).filter(m => m.transactionId === tx.id);
    const lines = tx.finance.lines;
    const scannedItems = scanned.items ?? [];
    const stockRows = lines.map((line, index) => {
      const read = scannedItems[index] ?? {};
      const moved = movements.filter(m => m.type === 'receipt' && m.stockItemRef === line.stockItemRef && line.stockItemRef);
      const item = items.find(entry => entry.ref === line.stockItemRef);
      return { index, kind: line.kind, lectureKind: read.kind, stocke: !!line.stockItemRef, mouvements: moved.length,
        uniteLue: read.unit ?? '', uniteArticle: item?.unit ?? null, categorieArticle: item?.category ?? null, quantiteMouvement: moved[0]?.quantity ?? null,
        quantiteLue: read.quantity ?? null, prixUnitaireArticle: item?.pricePerUnit ?? null, semis: c.plan.seeds.find(seed => seed.id === item?.id)?.id ?? null };
    });
    const seeded = c.plan.seeds.map(seed => { const item = items.find(entry => entry.id === seed.id); return { id: seed.id, avant: seed.currentStock, apres: item?.currentStock, uniteArticle: item?.unit, prixAvant: seed.pricePerUnit, prixApres: item?.pricePerUnit ?? null }; });
    const groups = new Map();
    for (const item of items) { const key = fold(item.name).replace(/,?\s*kg$/, ''); groups.set(key, [...(groups.get(key) ?? []), item.id]); }
    view.stock = { lignes: stockRows, semis: seeded, doublonsDArticle: [...groups.values()].filter(ids => ids.length > 1).length,
      servicesStockes: stockRows.filter(row => ['service', 'shipping'].includes(row.kind) && row.stocke).length,
      nouveauxArticles: items.filter(item => String(item.id).startsWith('MP-')).length,
      categoriesNouveaux: [...new Set(items.filter(item => String(item.id).startsWith('MP-')).map(item => item.category))],
      unitesNouveaux: [...new Set(items.filter(item => String(item.id).startsWith('MP-')).map(item => item.unit))] };
  }
  c.record(`${docId}-emulateur`, view);
  return view;
}

/** Waits for one new finished download in this width's folder. */
async function downloaded(c, before, label) {
  return waitFor(() => {
    const files = readdirSync(c.downloads).filter(name => !name.endsWith('.crdownload') && !before.includes(name));
    return files.length ? join(c.downloads, files[0]) : false;
  }, `téléchargement ${label}`, 90000);
}
/** The purchase as the brewer finds it again: journal, detail, original, stock list, annual exports. */
async function financeViews(c, docId, { exports = true } = {}) {
  const doc = c.docs[docId];
  const tx = (await all(c.db, 'transactions')).find(row => row.finance?.sourceDocumentHash === doc.sha256);
  if (!tx) { c.finding(`C1-vues-${docId}`, 'dépense retrouvée dans Finances', { transaction: false }); return; }
  await click(c.page, 'nav button', 'Finances');
  await click(c.page, '#finance-tab-journal');
  await sleep(800);
  const visibleByDefault = await c.page.$$eval('button.finance-op', (rows, id) => rows.some(row => row.getAttribute('aria-label')?.startsWith(id)), tx.description);
  const toggle = await c.page.$('.journal-date-toggle[aria-pressed="false"]');
  if (toggle) { await toggle.click(); await sleep(800); }
  const rows = await c.page.$$eval('button.finance-op', nodes => nodes.map(node => node.getAttribute('aria-label') ?? ''));
  const row = rows.find(label => label.startsWith(tx.description));
  await shoot(c, `${docId}-journal`);
  const view = { visibleSansToutesLesDates: visibleByDefault, ligneTrouvee: !!row, ligneMontreFournisseur: !!row && !!tx.finance?.vendor && row.includes(tx.finance.vendor),
    ligneMontreCategorie: !!row, ligneMontreJustificatif: !!row && /justificatif/i.test(row) };
  if (row) {
    await click(c.page, `button.finance-op[aria-label="${row.replace(/"/g, '\\"')}"]`);
    await c.page.waitForSelector('[role="dialog"]', { visible: true, timeout: 20000 });
    await sleep(800);
    const detail = await c.page.$eval('[role="dialog"]:last-of-type', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '');
    view.detailMontreTva = /TVA/i.test(detail);
    await shoot(c, `${docId}-detail`);
    const proofButton = await c.page.$$('[role="dialog"] button').then(async buttons => {
      for (const button of buttons) if ((await button.evaluate(e => e.innerText.trim())) === 'Justificatif') return button;
      return null;
    });
    view.boutonJustificatif = !!proofButton;
    if (proofButton) {
      await proofButton.click();
      // An image original is an <img alt>, a PDF one an <iframe title> (DocumentProofLink).
      const shown = await c.page.waitForFunction(name => [...document.querySelectorAll('img')].some(img => img.alt === name && img.complete && img.naturalWidth > 0)
        || [...document.querySelectorAll('iframe')].some(frame => frame.title === name)
        || [...document.querySelectorAll('[role="dialog"] [role="alert"]')].map(e => e.innerText).join(' ') || false, { timeout: 30000 }, doc.fileName)
        .then(handle => handle.jsonValue()).catch(error => `délai: ${String(error).slice(0, 120)}`);
      view.originalRouvert = shown === true ? 'image affichée' : shown;
      view.originalTelechargeDuDrive = c.drive.downloads.length > 0;
      await shoot(c, `${docId}-original`);
      await c.page.keyboard.press('Escape'); await sleep(500);
    }
    await c.page.keyboard.press('Escape'); await sleep(600);
  }
  c.finding(`C1-vues-${docId}`, 'dépense retrouvée dans Finances (journal, détail, original)', view);
  if (!exports) return;
  // Stock list after the purchase, as the brewer reads it.
  await click(c.page, 'nav button', 'Stocks');
  await sleep(1200);
  await shoot(c, `${docId}-stocks`);
  c.record(`${docId}-stocks-groupes`, await c.page.$$eval('div[class*="backdrop-blur-sm"] > span:first-child', nodes => nodes.map(node => node.innerText.trim())).catch(() => []));
  c.record(`${docId}-stocks-visibles`, await c.page.$$eval('button[aria-label^="Ouvrir "]', nodes => nodes.map(node => node.innerText.replace(/\s+/g, ' ').trim())).catch(() => []));
  // Annual exports: Excel journal and the ZIP with originals.
  await click(c.page, 'nav button', 'Finances');
  await click(c.page, '#finance-tab-annual');
  await sleep(800);
  await click(c.page, '#tax-tab-documents');
  await sleep(600);
  await shoot(c, `${docId}-dossier-annuel`);
  const XLSX = (await import(pathToFileURL(join(ROOT, 'node_modules/xlsx/xlsx.mjs')).href));
  const { unzipSync, strFromU8 } = await import(pathToFileURL(join(ROOT, 'node_modules/fflate/esm/index.mjs')).href).catch(() => import('fflate'));
  const exportsView = {};
  let before = readdirSync(c.downloads);
  await click(c.page, 'button', 'Excel');
  const xlsx = await downloaded(c, before, 'Excel').catch(error => { exportsView.excel = String(error).slice(0, 120); return null; });
  if (xlsx) {
    const book = XLSX.read(readFileSync(xlsx));
    const journal = XLSX.utils.sheet_to_json(book.Sheets.Journal ?? {}, { header: 1 });
    const header = journal[0] ?? [];
    const line = journal.find(cells => cells[0] === tx.id);
    exportsView.excel = { feuilles: book.SheetNames.length, journal: !!line, colonnesTva: header.filter(cell => /TVA/i.test(String(cell))),
      justificatif: line ? line[header.indexOf('Justificatif')] : null, fournisseur: line ? line[header.indexOf('Fournisseur ou client')] === tx.finance?.vendor : null };
  }
  before = readdirSync(c.downloads);
  await click(c.page, 'button', 'Télécharger le dossier avec justificatifs');
  const zip = await downloaded(c, before, 'dossier ZIP').catch(error => { exportsView.zip = String(error).slice(0, 120); return null; });
  if (zip) {
    const files = unzipSync(new Uint8Array(readFileSync(zip)));
    const index = Object.entries(files).find(([name]) => /index-justificatifs\.csv$/.test(name));
    const indexText = index ? strFromU8(index[1]) : '';
    const original = Object.entries(files).find(([name, bytes]) => /justificatifs\//.test(name) && sha(Buffer.from(bytes)) === doc.sha256);
    exportsView.zip = { fichiers: Object.keys(files).length, indexMentionneLaPiece: indexText.includes(tx.id), originalIdentique: !!original,
      tvaDansIndex: /TVA/i.test(indexText.split('\n')[0] ?? '') };
  }
  await shoot(c, `${docId}-dossier-telecharge`);
  exportsView.exportTvaDedie = await c.page.evaluate(() => /décompte TVA|export TVA/i.test(document.body.innerText));
  c.finding(`C1-exports-${docId}`, 'dépense dans les exports de finances et de TVA', exportsView);
}

/** Finances : la dépense doc5 dans les vues, l'original rouvert, les exports TVA et finances. */
async function caseFinances(c) {
  await financeViews(c, 'doc5');
}

/** doc6 : la même commande vue en ligne (ni date ni numéro) après doc5 ; JUS-1 : panneau en tête, refus sans choix ;
 * correction V3 : n° côte à côte, « Même achat » choisi sans effet, puis le pied « Fermer sans rien enregistrer ». */
async function caseDoc6(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc6', { chooser });
  const read = await readSheet(c);
  c.record('doc6-revue', read);
  const existing = (await all(c.db, 'transactions')).find(tx => tx.finance?.sourceDocumentHash === c.docs.doc5.sha256);
  await shoot(c, 'doc6-doublon', read.duplicate ? `${sheet} #purchase-duplicate` : `${sheet} footer`);
  const refused = await confirmSheet(c, 30000);
  c.record('doc6-sans-choix', refused);
  await shoot(c, 'doc6-sans-choix');
  let choice = 'aucun panneau', afterChoice = null;
  if (await c.page.$(`${sheet} #purchase-duplicate`)) {
    await click(c.page, `${sheet} #purchase-duplicate button`, 'Même achat');
    await sleep(400);
    afterChoice = { footer: (await readSheet(c)).footer, writes: businessWrites(dbWrites(before, await dbSnapshot(c.db))).length };
    await shoot(c, 'doc6-meme-achat', `${sheet} #purchase-duplicate`);
    await click(c.page, `${sheet} footer button`, 'Fermer sans rien enregistrer', 5000).catch(error => { afterChoice.clickError = String(error).slice(0, 160); });
    choice = await c.page.waitForFunction(() => !document.querySelector('[role="dialog"] footer'), { timeout: 10000 }).then(() => 'feuille fermée').catch(() => 'feuille encore ouverte');
  }
  if (choice !== 'feuille fermée') { await shoot(c, 'doc6-choix'); await closeSheet(c); }
  const writes = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  const txs = (await all(c.db, 'transactions')).filter(tx => tx.finance?.kind === 'expense');
  const sameTotal = txs.filter(tx => cents(tx.amountTTC) === cents(c.docs.doc5.result.amountTTC));
  c.finding('C2', 'aucun doublon si doc6 est aussi scanné (JUS-1 : choix explicite)', { alerteDoublon: !!read.duplicate,
    montreLaDepenseExistante: !!existing && !!read.duplicate?.includes(existing.description), justificatifJointAffiche: /justificatif joint/.test(read.duplicate ?? ''),
    numerosCoteACote: /Document lu/.test(read.duplicate ?? '') && /Déjà enregistré/.test(read.duplicate ?? '') && /Facture/.test(read.duplicate ?? ''),
    piedApresChoix: afterChoice?.footer ?? null, ecrituresApresChoix: afterChoice?.writes ?? null, erreurClicPied: afterChoice?.clickError ?? null,
    sansChoix: String(refused).startsWith('alerte') && /doublon/.test(String(refused)) ? 'refusé (doublon)' : refused, choix: choice,
    depensesAuMemeTotal: sameTotal.length, nouvellesEcritures: writes.map(row => `${row.collection}+${row.added.length}~${row.changed.length}`) });
}

/** Correction V3 (B-V3-1) : commande répétée chez le même fournisseur, même total, 3 jours plus tôt, autre n° de facture
 * (dépense semée à partir de la lecture rejouée, sans original) : aucun panneau ; la feuille se ferme sans écriture et la
 * dépense semée est retirée avant « rattacher ». */
async function caseAutreNumero(c) {
  const scanned = c.docs.doc1.result, amountCents = cents(scanned.amountTTC), id = 'TX-jus1v3-autre-numero';
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(scanned.date ?? ''));
  if (!String(scanned.invoiceNumber ?? '').trim() || !match) { c.finding('B1-autre-numero', 'non applicable : doc1 sans n° ou sans date', { applicable: false }); return; }
  const day = new Date(Date.UTC(+match[3], +match[2] - 1, +match[1] - 3));
  const date = [day.getUTCDate(), day.getUTCMonth() + 1].map(n => String(n).padStart(2, '0')).join('.') + '.' + day.getUTCFullYear();
  await c.db.doc(`transactions/${id}`).set({ id, date, description: 'Commande précédente (synthétique)', category: scanned.category, subcategory: '',
    amountHT: amountCents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: amountCents / 100,
    finance: { version: 1, kind: 'expense', amountCents, lines: [{ id: 'saisie', description: 'Commande précédente', kind: 'other', amountCents }],
      vendor: String(scanned.vendor ?? ''), invoiceNumber: 'JUS1V3-AUTRE-0001', paymentStatus: 'unknown', recordedAt: new Date().toISOString() } });
  try {
    await reloadApp(c);
    const before = await dbSnapshot(c.db);
    const chooser = await openInvoiceEntry(c);
    await scan(c, 'doc1', { chooser });
    const read = await readSheet(c);
    c.record('autre-numero-revue', read);
    await shoot(c, 'autre-numero-revue');
    await closeSheet(c);
    const writes = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
    c.finding('B1-autre-numero', 'commande répétée, même fournisseur et même total, autre n° de facture : aucun panneau (correction V3)', { applicable: true,
      ecartJours: 3, panneau: !!read.duplicate, pied: read.footer, ecritures: writes.map(row => `${row.collection}+${row.added.length}~${row.changed.length}`) });
  } finally {
    // Retirée même en cas d'échec : elle fausserait les cas suivants (même fournisseur, même total).
    await c.db.doc(`transactions/${id}`).delete();
    await reloadApp(c);
  }
}

/** JUS-1 : doc1 lu alors que le même achat a été saisi sans original (fournisseur en capitales) : « Rattacher » joint
 * l'original à cette dépense, sans nouvelle dépense, puis la dépense se rouvre avec son original. */
async function caseRattacher(c) {
  const scanned = c.docs.doc1.result, amountCents = cents(scanned.amountTTC), id = 'TX-jus1-saisie-manuelle';
  // Setup by the Admin SDK: the earlier manual entry, built from the replayed reading at run time.
  await c.db.doc(`transactions/${id}`).set({ id, date: scanned.date, description: 'Achat saisi sans justificatif', category: scanned.category, subcategory: '',
    amountHT: amountCents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: amountCents / 100,
    finance: { version: 1, kind: 'expense', amountCents, lines: [{ id: 'saisie', description: 'Achat saisi sans justificatif', kind: 'other', amountCents }],
      vendor: String(scanned.vendor ?? '').toUpperCase(), paymentStatus: 'unknown', recordedAt: new Date().toISOString() } });
  await reloadApp(c);
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc1', { chooser });
  const read = await readSheet(c);
  await shoot(c, 'rattacher-doublon', read.duplicate ? `${sheet} #purchase-duplicate` : `${sheet} footer`);
  let status = 'aucun panneau', afterChoice = null;
  if (await c.page.$(`${sheet} #purchase-duplicate`)) {
    await click(c.page, `${sheet} #purchase-duplicate button`, 'Même achat');
    await sleep(400);
    afterChoice = { footer: (await readSheet(c)).footer, writes: businessWrites(dbWrites(before, await dbSnapshot(c.db))).length };
    await shoot(c, 'rattacher-choix', `${sheet} #purchase-duplicate`);
    await click(c.page, `${sheet} footer button`, 'Rattacher le justificatif', 5000);
    status = await c.page.waitForFunction(() => document.querySelector('[role="dialog"] [role="status"]')?.innerText
      || [...document.querySelectorAll('[role="dialog"] [role="alert"]')].map(e => e.innerText).join(' | ') || false, { timeout: 45000, polling: 500 })
      .then(handle => handle.jsonValue()).catch(error => `délai: ${String(error).slice(0, 100)}`);
    await shoot(c, 'rattacher-fait');
    await click(c.page, `${sheet} footer button`, 'Terminé', 5000).catch(() => closeSheet(c));
  } else await closeSheet(c);
  await sleep(1500);
  const writes = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  const tx = (await c.db.doc(`transactions/${id}`).get()).data();
  const original = tx?.finance?.proofDocumentId ? (await c.db.doc(`financeDocuments/${tx.finance.proofDocumentId}`).get()).data() : null;
  const expenses = (await all(c.db, 'transactions')).filter(row => row.finance?.kind === 'expense' && cents(row.amountTTC) === amountCents);
  c.finding('B1-rattacher', 'justificatif rattaché à la dépense existante sans original (JUS-1)', { panneau: !!read.duplicate,
    sansJustificatifAffiche: /sans justificatif/.test(read.duplicate ?? ''), numerosCoteACote: /Document lu/.test(read.duplicate ?? '') && /Facture/.test(read.duplicate ?? ''),
    boutonRattacher: !!afterChoice?.footer?.some(label => /Rattacher le justificatif/.test(label)), ecrituresApresChoix: afterChoice?.writes ?? null,
    rattache: /^Justificatif rattaché/.test(String(status)), alerte: /^Justificatif rattaché/.test(String(status)) ? null : String(status).slice(0, 200),
    depensesAuMemeTotal: expenses.length, justificatifLie: !!tx?.finance?.proofDocumentId,
    original: original ? { drive: !!original.driveFileId, sha256Conforme: original.sha256 === c.docs.doc1.sha256 } : null,
    empreinteReprise: tx?.finance?.sourceDocumentHash === c.docs.doc1.sha256, montantInchange: cents(tx?.amountTTC ?? NaN) === amountCents,
    ecritures: writes.map(row => `${row.collection}+${row.added.length}~${row.changed.length}`) });
  if (tx?.finance?.proofDocumentId) await financeViews(c, 'doc1', { exports: false });
}

/** JUS-1 (M3) : un article écrit en minuscules par une ancienne lecture (synthétique) se range avec les malts et garde
 * ses champs techniques, sans être réécrit. */
async function caseMinuscules(c) {
  const id = 'jus1-ancien-minuscules', name = 'Malt ancien du Banc';
  await c.db.doc(`stockItems/${id}`).set({ id, ref: id, name, category: 'malt', kind: 'rawMaterials', currentStock: 4, minStock: 0, unit: 'kg', reorder: false });
  await reloadApp(c);
  await click(c.page, 'nav button', 'Stocks');
  await sleep(1200);
  const groups = await c.page.$$eval('div[class*="backdrop-blur-sm"] > span:first-child', nodes => nodes.map(node => node.innerText.trim())).catch(() => []);
  await shoot(c, 'stocks-minuscules');
  await click(c.page, `button[aria-label="Ouvrir ${name}"]`);
  await c.page.waitForSelector('[role="dialog"]', { visible: true, timeout: 20000 });
  await sleep(600);
  const detail = await c.page.$eval('[role="dialog"]', e => ({ sousTitreCanonique: e.innerText.includes('Malt · jus1-ancien-minuscules'), champsTechniques: /Caractéristiques techniques/.test(e.innerText) }));
  await shoot(c, 'fiche-minuscules');
  await c.page.keyboard.press('Escape'); await sleep(500);
  c.finding('M3-lecture', 'article en minuscules : un seul groupe Malt, champs techniques, aucune réécriture (JUS-1)', { groupes: groups,
    groupesMalt: groups.filter(group => /^malt$/i.test(group)).length, ...detail, categorieStockee: (await c.db.doc(`stockItems/${id}`).get()).data()?.category });
}

/** doc1 : facture d'écran, parcours complet puis réouverture. */
async function caseDoc1(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc1', { chooser });
  const read = await readSheet(c);
  c.record('doc1-revue', read);
  await shoot(c, 'doc1-revue');
  const outcome = await confirmSheet(c, 60000);
  c.record('doc1-confirmation', outcome);
  if (outcome !== 'fermée') await shoot(c, 'doc1-confirmation-refusee');
  c.record('doc1-ecritures', businessWrites(dbWrites(before, await dbSnapshot(c.db))));
  const view = await verifyPurchase(c, 'doc1');
  if (view.transactions === 1) await financeViews(c, 'doc1', { exports: false });
}

/** doc4 : bordereau ; rien avant le geste, hors ligne au geste, puis un seul geste en ligne. */
async function caseDoc4(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc4', { chooser });
  const read = await readSheet(c);
  c.record('doc4-revue', read);
  await shoot(c, 'doc4-revue');
  const idle = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  c.check(!idle.length, 'doc4 : aucune écriture avant la confirmation', { writes: idle });
  // Hors ligne au moment du geste (avec justificatif) : Drive et Firestore injoignables.
  await c.setOffline(true);
  const offline = await confirmSheet(c, 40000);
  c.record('doc4-hors-ligne', offline);
  await shoot(c, 'doc4-hors-ligne');
  const offlineWrites = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  await c.setOffline(false);
  await sleep(3000);
  const online = await confirmSheet(c, 60000);
  c.record('doc4-en-ligne', online);
  if (online !== 'fermée') await shoot(c, 'doc4-en-ligne');
  const view = await verifyPurchase(c, 'doc4');
  c.finding('C4', 'bordereau : aucune dépense finale sans confirmation', { ecrituresAvantGeste: idle.length, typeSource: view.typeSource,
    baseDuTotal: view.baseDuTotal, statut: view.statut, depenses: view.transactions, paiementPropose: read.payment, indiceTotal: read.hints.amountTTC?.text ? 'présent' : 'absent' });
  c.finding('C8-justificatif', 'hors ligne avec justificatif puis retour du réseau', { messageFrancais: /^alerte: Hors connexion/.test(String(offline)) && !/offline|Failed/i.test(String(offline)), horsLigne: offline, ecrituresServeurHorsLigne: offlineWrites.length, retour: online, depenses: view.transactions });
}

/** Saisie manuelle hors ligne (sans justificatif), puis synchronisation au retour du réseau. */
async function caseHorsLigne(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  if (await chooser) await (await chooser).cancel();
  await click(c.page, 'button', 'Saisir sans justificatif');
  await typeInto(c.page, '#purchase-total', SYNTHETIC.amount);
  await typeInto(c.page, '#purchase-description', SYNTHETIC.description);
  await openDetails(c.page, `${sheet} details:has(#purchase-vendor)`);
  await typeInto(c.page, '#purchase-vendor', SYNTHETIC.vendor);
  await c.setOffline(true);
  const offline = await confirmSheet(c, 40000);
  c.record('hors-ligne-geste', offline);
  await shoot(c, 'hors-ligne-geste');
  const serverWhileOffline = (await all(c.db, 'transactions')).filter(tx => tx.description === SYNTHETIC.description).length;
  await c.setOffline(false);
  const synced = await waitFor(async () => (await all(c.db, 'transactions')).filter(tx => tx.description === SYNTHETIC.description).length || false,
    'synchronisation au retour du réseau', 60000).catch(() => 0);
  let closing = offline;
  if (offline !== 'fermée') { closing = await confirmSheet(c, 45000).catch(error => `erreur: ${String(error).slice(0, 200)}`); }
  await shoot(c, 'hors-ligne-retour');
  c.finding('C8-manuel', 'saisie hors ligne puis synchronisation', { geste: offline, serveurPendantHorsLigne: serverWhileOffline,
    serveurApresRetour: synced, secondGeste: closing, ecritures: businessWrites(dbWrites(before, await dbSnapshot(c.db))).map(row => `${row.collection}+${row.added.length}`) });
  if (closing !== 'fermée') await closeSheet(c);
}

/** doc3 : bulletins QR ; montant, échéance et paiement proposés (aucun enregistrement). */
async function caseDoc3(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc3', { chooser });
  await shoot(c, 'doc3-revue', `${sheet} section[aria-label="Vérification du justificatif"]`);
  await openDetails(c.page, `${sheet} [data-purchase-payment]`);
  const read = await readSheet(c);
  c.record('doc3-revue', read);
  await shoot(c, 'doc3-reglement', `${sheet} [data-purchase-payment]`);
  const writes = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  c.check(!writes.length, 'doc3 : aucune écriture sans enregistrement', { writes });
  c.finding('C5', 'bulletins QR : montant, échéance, paiement', { totalPropose: read.total ? 'présent' : 'vide',
    totalEgalLecture: read.total !== null && cents(read.total.replace(/\s/g, '').replace(',', '.')) === cents(c.docs.doc3.result.amountTTC),
    bulletinsLus: (c.docs.doc3.result.items ?? []).length, paiement: read.payment, reglement: read.paymentSummary, echeance: read.dueDate, indiceTotal: read.hints.amountTTC?.text ?? null });
  await closeSheet(c);
}

/** doc2 : facture hors brasserie ; ce que fait le code (aucun enregistrement réussi attendu sans correction). */
async function caseDoc2(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc2', { chooser });
  const read = await readSheet(c);
  c.record('doc2-revue', read);
  await openDetails(c.page, `${sheet} section[aria-label="Vérification du justificatif"] details`);
  await shoot(c, 'doc2-revue');
  const outcome = await confirmSheet(c, 30000).catch(error => `erreur: ${String(error).slice(0, 200)}`);
  const after = await readSheet(c);
  await shoot(c, 'doc2-validation');
  c.finding('C6', 'facture hors brasserie : comportement du code', { categorie: read.category, alerteHorsBrasserie: read.reviewDetails.length,
    lignesSansMontant: read.lines.filter(line => line.amount === '' || line.amount === null).length, geste: outcome, aCorriger: after.alerts,
    ecritures: businessWrites(dbWrites(before, await dbSnapshot(c.db))).length });
  await closeSheet(c);
}

const CASES = { etats: caseEtats, doc5: caseDoc5, finances: caseFinances, doc6: caseDoc6, 'autre-numero': caseAutreNumero, doc1: caseDoc1, doc4: caseDoc4,
  'hors-ligne': caseHorsLigne, doc3: caseDoc3, doc2: caseDoc2, rattacher: caseRattacher, minuscules: caseMinuscules };

async function inner() {
  process.on('unhandledRejection', error => console.log(`rejet non attendu (consigné) : ${String(error?.stack ?? error).slice(0, 600)}`));
  const out = process.env.EMU_OUT, port = Number(process.env.EMU_PORT || 5175);
  const widths = String(process.env.EMU_WIDTHS || '390,1280').split(',').map(Number);
  const cases = String(process.env.EMU_CASES || ALL_CASES.join(',')).split(',').filter(Boolean);
  for (const name of cases) if (!CASES[name]) throw Error(`Cas inconnu : ${name}`);
  if (process.env.FIRESTORE_EMULATOR_HOST !== `127.0.0.1:${EMULATOR_PORTS.firestore}`) throw Error('Firestore émulé requis');
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== `127.0.0.1:${EMULATOR_PORTS.auth}`) throw Error('Auth émulée requise');
  if (process.env.GEMINI_API_KEY !== undefined) throw Error('Aucune clé Gemini dans ce parcours');
  const docs = loadReplay(process.env.EMU_REPLAY);
  const plan = seedPlan(docs);
  const report = { project: PROJECT, rulesSha: process.env.EMU_RULES_SHA, widths, cases, startedAt: new Date().toISOString(),
    replay: Object.fromEntries(Object.values(docs).map(doc => [doc.id, { fichier: relative(dirname(process.env.EMU_REPLAY), doc.image), sha256: doc.sha256.slice(0, 12) }])),
    seeds: { derivesDeLaLecture: plan.seeds.map(seed => ({ id: seed.id, unit: seed.unit, category: seed.category })), accentTrouve: plan.accentFound },
    runs: [], checks: [], findings: [], blocked: [], rewrites: [], pids: {} };
  const write = () => writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  const { initializeApp } = await import(pathToFileURL(join(ROOT, 'functions/node_modules/firebase-admin/lib/esm/app/index.js')).href);
  const { getFirestore } = await import(pathToFileURL(join(ROOT, 'functions/node_modules/firebase-admin/lib/esm/firestore/index.js')).href);
  initializeApp({ projectId: PROJECT });
  const db = getFirestore();

  const viteEnv = { ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: PROJECT, VITE_FIREBASE_API_KEY: 'demo-jus-key',
    VITE_FIREBASE_AUTH_DOMAIN: `${PROJECT}.firebaseapp.com`, VITE_FIREBASE_STORAGE_BUCKET: `${PROJECT}.appspot.com`,
    VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000', VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
    VITE_FIREBASE_MEASUREMENT_ID: '', VITE_RECAPTCHA_SITE_KEY: '', VITE_APPCHECK_DEBUG_TOKEN: '', VITE_AUTHORIZED_ACCOUNTS: USER.email,
    // The process environment wins over a local .env: the emulated App never shows the brewery's real coordinates.
    VITE_COMPANY_NAME: 'Brasserie du Banc', VITE_COMPANY_OWNER: 'Brasseur du Banc', VITE_COMPANY_ADDRESS: 'Rue du Banc 1',
    VITE_COMPANY_NPA: '1700 Fribourg', VITE_COMPANY_IBAN: '', VITE_COMPANY_UID: '' };
  const vite = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: ROOT, env: viteEnv, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  report.pids.vite = vite.pid;
  vite.stdout.on('data', chunk => appendFileSync(join(out, 'vite.log'), chunk));
  vite.stderr.on('data', chunk => appendFileSync(join(out, 'vite.log'), chunk));
  const base = `http://127.0.0.1:${port}`;
  let browser, stopped = false;
  try {
    await waitFor(async () => { try { return (await fetch(base)).ok; } catch { return false; } }, 'serveur de dev', 90000);
    const puppeteer = (await import('puppeteer-core')).default;
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
      args: ['--mute-audio', '--disable-dev-shm-usage', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'] });
    report.pids.chrome = browser.process()?.pid;
    console.log(`pids : vite ${report.pids.vite}, chrome ${report.pids.chrome}`);
    for (const [widthIndex, width] of widths.entries()) {
      if (widthIndex > 0) {
        // Each width starts from an empty emulated database with the same seeds.
        const reset = await fetch(`http://127.0.0.1:${EMULATOR_PORTS.firestore}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
        report.checks.push({ width, ok: reset.ok, label: 'base émulée remise à zéro avant cette largeur' });
      }
      const mobile = width < 600;
      const context = await browser.createBrowserContext();
      const entry = { width, steps: [], captures: [], errors: [], records: {}, measures: {} };
      report.runs.push(entry);
      const downloads = join(out, `telechargements-${width}`);
      mkdirSync(downloads, { recursive: true });
      const cdp = await browser.target().createCDPSession();
      await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, browserContextId: context.id });
      const c = { width, base, out, db, docs, entry, downloads, shotIndex: 0, plan, page: null,
        ai: { mode: 'replay', doc: null, delayMs: 0 }, calls: { ai: [], drive: [] },
        drive: { files: new Map(), sessions: new Map(), next: 0, log: [], uploads: [], downloads: [] },
        step: (label, data = {}) => { entry.steps.push({ label, at: new Date().toISOString(), ...data }); console.log(`${width} · ${label}`); write(); },
        check: (ok, label, data = {}) => { report.checks.push({ width, ok: !!ok, label, ...(ok ? {} : { data }) }); console.log(`${ok ? 'OK ' : 'KO '} ${width} · ${label}`); write(); },
        finding: (criterion, label, data) => { report.findings.push({ width, criterion, label, data }); console.log(`CONSTAT ${width} · ${criterion} · ${JSON.stringify(data).slice(0, 400)}`); write(); },
        record: (key, value) => { entry.records[key] = value; write(); },
        measure: (key, value) => { entry.measures[key] = value; write(); } };
      c.setOffline = async offline => {
        await c.page.setOfflineMode(offline);
        await c.page.evaluate(value => { window.__jus0Offline = value; }, offline);
        c.step(offline ? 'réseau coupé' : 'réseau rétabli');
      };
      /** A fresh tab of this width, viewport set before the first navigation; services simulated in the page. */
      const openTab = async () => {
        const page = await context.newPage();
        page.on('pageerror', error => entry.errors.push(`pageerror: ${error.message.slice(0, 300)}`));
        page.on('console', message => { if (message.type() === 'error') entry.errors.push(`console: ${message.text().slice(0, 300)}`); });
        await page.setRequestInterception(true);
        page.on('request', async request => {
          const url = request.url();
          if (!(/^(data|blob):/.test(url) || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url))) {
            report.blocked.push(`${width} ${request.method()} ${url.slice(0, 120)}`); return request.abort();
          }
          const rewrite = url.startsWith(base) ? EMULATOR_REWRITES.find(row => new URL(url).pathname === row.path) : null;
          if (!rewrite) return request.continue();
          try {
            const response = await fetch(url);
            const body = await response.text();
            const count = body.match(rewrite.pattern)?.length ?? 0;
            report.rewrites.push({ width, path: rewrite.path, count, expected: rewrite.expected });
            await request.respond({ status: response.status, contentType: response.headers.get('content-type') ?? 'text/javascript',
              headers: { 'cache-control': 'no-cache' }, body: body.replace(rewrite.pattern, rewrite.replacement) });
          } catch (error) {
            report.rewrites.push({ width, path: rewrite.path, error: String(error).slice(0, 200) });
            await request.abort().catch(() => {});
          }
        });
        await page.exposeFunction('__jus0Bridge', async request => {
          if (request.kind === 'drive') return driveAnswer(c, request);
          if (request.kind === 'aiTask' && c.ai.delayMs) await sleep(c.ai.delayMs);
          return callableAnswer(c, request);
        });
        await page.evaluateOnNewDocument(pageServices);
        await page.setViewport({ width, height: mobile ? 844 : 900, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
        return page;
      };
      try {
        c.page = await openTab();
        const uid = await signIn(c);
        c.step('connexion émulée', { uid });
        const rewritten = report.rewrites.filter(row => row.width === width);
        c.check(EMULATOR_REWRITES.every(rule => rewritten.some(row => row.path === rule.path)) && rewritten.every(row => row.count === row.expected),
          'banc : réécriture émulateur appliquée telle que prévue', { rewritten });
        await waitFor(async () => (await db.doc('config/app').get()).exists, 'migration initiale de l’App', 90000);
        for (const seed of plan.seeds)
          await db.doc(`stockItems/${seed.id}`).set({ id: seed.id, ref: seed.id, name: seed.name, category: seed.category, kind: 'rawMaterials',
            currentStock: seed.currentStock, minStock: 0, unit: seed.unit, reorder: false, pricePerUnit: seed.pricePerUnit });
        c.step('semis du stock (dérivés de la lecture rejouée)', { seeds: plan.seeds.map(seed => seed.id) });
        await reloadApp(c);
        for (const [index, name] of cases.entries()) {
          if (index > 0) {
            await c.page.close().catch(() => {});
            c.page = await openTab();
            await c.page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
            await waitApp(c);
          }
          c.step(`cas ${name}`);
          try { await CASES[name](c); }
          catch (error) {
            stopped = true;
            c.step(`ARRÊT ${name}`, { error: String(error?.stack ?? error).slice(0, 1600) });
            await c.page.screenshot({ path: join(out, `${width}-99-arret-${name}.png`) }).catch(() => {});
            entry.captures.push(`${width}-99-arret-${name}.png`);
            await c.setOffline(false).catch(() => {});
          }
        }
      } catch (error) {
        stopped = true;
        c.step('ARRÊT', { error: String(error?.stack ?? error).slice(0, 900) });
        await c.page?.screenshot({ path: join(out, `${width}-99-arret.png`) }).catch(() => {});
      }
      entry.services = { ai: c.calls.ai, driveAuthorization: c.calls.drive, drive: { uploads: c.drive.uploads, downloads: c.drive.downloads.length, requests: c.drive.log.length } };
      write();
      await context.close();
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    killTree(vite.pid);
    await sleep(1000);
    report.closed = { chrome: browser ? !browser.connected : true, vitePortFree: !(await listening(port)) };
    report.endedAt = new Date().toISOString();
    write();
  }
  const failures = report.checks.filter(check => !check.ok);
  console.log(`${report.checks.length - failures.length}/${report.checks.length} contrôles du banc OK · ${report.findings.length} constats · ${report.blocked.length} requêtes bloquées hors localhost`);
  process.exit(stopped || failures.length || !report.closed.vitePortFree ? 1 : 0);
}

if (flag('inner')) await inner();
else await outer();
