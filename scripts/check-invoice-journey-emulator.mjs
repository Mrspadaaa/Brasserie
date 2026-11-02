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
 *        [--widths 390,1280] [--cases etats,doublon,doc5,finances,doc6,autre-numero,rattacher,minuscules,doc1,doc4,hors-ligne,doc3,doc2,doc14,drive-fond] [--port 5175]
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
/** Pièces facultatives du manifeste : doc14 (commande en ligne du 01.11 au soir, D261) ; les cas qui en dépendent exigent qu'elle y soit. */
const OPTIONAL_DOCS = ['doc14'];
const ALL_CASES = ['etats', 'doublon', 'doc5', 'finances', 'doc6', 'autre-numero', 'rattacher', 'minuscules', 'doc1', 'doc4', 'hors-ligne', 'doc3', 'doc2', 'doc14', 'drive-fond'];
/** Synthetic entries typed by the bench (never a value of a real document). */
const SYNTHETIC = { vendor: 'Malterie du Banc', description: 'Essai hors ligne JUS-0', amount: '12,30' };
/** Same emulator-only rewrite as the reference bench: the emulator refuses descending key scans. */
const EMULATOR_REWRITES = [{ path: '/src/services/firestoreRepo.ts', expected: 2,
  pattern: /orderBy\(\s*documentId\(\)\s*,\s*(["'])desc\1\s*\)/g, replacement: 'orderBy(documentId())' }];
/** Garde mémoire de la machine partagée : 3 Go libres par défaut ; `--memory-floor <Go>` l'abaisse (jamais sous 1,5) quand les autres sessions laissent 3 à 4 Go. */
const MEMORY_FLOOR = Math.max(1.5, Number(option('memory-floor', '3')) || 3) * 1024 ** 3;
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

/** D281 : base → nameFr d'une sortie réelle de `scripts/banc-noms-fr.ts` (`results.json`, hors Git) ; vide sans `--noms`. */
function loadNomsRejoues(file) {
  const noms = new Map();
  if (!file) return noms;
  for (const appel of JSON.parse(readFileSync(file, 'utf8')).appels ?? []) {
    const base = new Map((appel.plan?.entrees ?? []).map(e => [e.i, e.base]));
    for (const n of Array.isArray(appel.noms) ? appel.noms : []) if (base.has(n.i) && typeof n.nameFr === 'string' && n.nameFr.trim()) noms.set(base.get(n.i), n.nameFr.trim());
  }
  return noms;
}

/** Replay manifest: images and recorded outputs read by path; nothing of them is copied into this file. */
function loadReplay(file) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  const docs = {};
  for (const id of [...DOCS, ...OPTIONAL_DOCS.filter(extra => manifest.docs?.[extra])]) {
    const entry = manifest.docs?.[id];
    if (!entry) throw Error(`Manifeste : ${id} absent.`);
    const image = resolve(dirname(file), entry.image), output = resolve(dirname(file), entry.output);
    const bytes = readFileSync(image);
    let result = JSON.parse(readFileSync(output, 'utf8'));
    for (const key of entry.pointer) result = result?.[key];
    if (!result || typeof result !== 'object') throw Error(`Manifeste : sortie de ${id} introuvable (${entry.pointer.join('.')}).`);
    // Vérité d'une pièce (facultative) : `expected` du cas du même id dans le fichier `truth` du manifeste (ex. cas-5.json), jamais copiée ici.
    const truth = entry.truth ? JSON.parse(readFileSync(resolve(dirname(file), entry.truth), 'utf8')).cases?.find(row => row.id === id)?.expected ?? null : null;
    if (entry.truth && !truth) throw Error(`Manifeste : vérité de ${id} introuvable dans ${entry.truth}.`);
    docs[id] = { id, image, fileName: basename(image), bytes, sha256: sha(bytes), result, truth,
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
  const replayDocs = loadReplay(resolve(replay));
  const out = resolve(option('out', ''));
  if (!option('out')) throw Error('--out requis : un dossier ignoré par Git (les captures montrent des valeurs réelles).');
  mkdirSync(out, { recursive: true });
  const ignored = spawnSync('git', ['check-ignore', '-q', join(out, 'probe.png')], { cwd: ROOT }).status === 0;
  if (!ignored) throw Error(`${out} n'est pas ignoré par Git : aucune capture ne peut y aller.`);
  const logFile = join(out, 'orchestration.log');
  const log = text => { appendFileSync(logFile, `[${new Date().toISOString()}] ${text}\n`); console.log(text); };
  const lock = option('lock');
  const port = Number(option('port', '5175'));
  // La lecture du QR-facture (src/services/qrLecture.ts) importe zxing-wasm et pdfjs-dist : sans eux dans node_modules, Vite répond 500 sur
  // QuickActionModal.tsx et la feuille de dépense ne s'ouvre pas. Le banc le dit au lancement au lieu d'un ARRÊT par cas, et prend au besoin
  // une configuration Vite qui les trouve ailleurs (--vite-config), sans toucher au dépôt.
  const viteConfig = option('vite-config') ? resolve(option('vite-config')) : null;
  if (!viteConfig && !existsSync(join(ROOT, 'node_modules/zxing-wasm/package.json')))
    throw Error('zxing-wasm absent de node_modules (package.json le déclare) : la feuille de dépense ne se charge pas. Installer les dépendances, ou passer --vite-config <fichier> (voir voies/e-bout/vite.banc.config.mjs).');
  const before = protectedState();
  for (const used of [...Object.values(EMULATOR_PORTS), port])
    if (await listening(used)) throw Error(`Port ${used} déjà occupé : un autre émulateur ou serveur tourne. Rien n'est lancé.`);
  if (lock) { mkdirSync(lock); log(`verrou pris : ${lock}`); }
  let code = 1, child = null, lowMemory = null, tmp = null;
  const guard = setInterval(() => {
    if (freemem() >= MEMORY_FLOOR || !child) return;
    lowMemory = `${(freemem() / 1024 ** 3).toFixed(2)} Go libres`;
    log(`GARDE MÉMOIRE : ${lowMemory} < ${(MEMORY_FLOOR / 1024 ** 3).toFixed(1)} Go, arrêt de l'arbre ${child.pid}`);
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
      EMU_OUT: out, EMU_TMP: tmp, EMU_WIDTHS: option('widths', '390,1280'), EMU_CASES: option('cases', ALL_CASES.filter(name => name !== 'doc14' || replayDocs.doc14).join(',')),
      EMU_PORT: String(port), EMU_RULES_SHA: rules.sha, EMU_REPLAY: resolve(replay), EMU_VITE_CONFIG: viteConfig ?? '',
      EMU_NOMS: option('noms') ? resolve(option('noms')) : '' };
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
      // n2-pages : plusieurs pages (`files`) : type, octets et empreinte de CHAQUE page, dans l'ordre ; les base64 ne passent pas par le pont.
      const files = Array.isArray(data.files) ? await Promise.all(data.files.map(async f => {
        const bytes = Uint8Array.from(atob(f.data), c => c.charCodeAt(0));
        return { mimeType: f.mimeType, bytes: bytes.length, sha256: await digest(bytes) };
      })) : null;
      body = { json: { ...data, file, ...(files ? { files } : {}) } };
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
    // d3c : le renouvellement du jeton est indisponible (functions/unavailable) : la file attend, sans alerte.
    if (data.action === 'token' && c.tokenMode === 'unavailable') return fail(503, 'UNAVAILABLE', 'Drive simulé : fonction indisponible.');
    if (data.action === 'token') return json({ accessToken: `jus0-drive-factice-${c.width}`, expiresAt: Date.now() + 3600_000, persistent: true });
    if (data.action === 'config') return json({ clientId: `${PROJECT}-drive-factice` });
    return fail(400, 'FAILED_PRECONDITION', 'Drive simulé : action non prise en charge.');
  }
  const ai = c.ai, doc = c.docs[ai.doc];
  const call = { task: data.task, tier: data.tier, file: data.file, mode: ai.mode, doc: ai.doc, at: new Date().toISOString() };
  c.calls.ai.push(call);
  // f4-enrichir (cas `enrichir` seulement) : la recherche de fiche rejouée ; hors de ce cas, la ligne suivante refuse comme avant.
  if (c.enrichir && data.task === 'lookupIngredient') return json(enrichirAnswer(c, data.context ?? {}));
  // D281 (`--noms`) : le français des noms rejoué depuis une passe réelle du banc des noms, par nom de base ; une base inconnue reste sans réponse.
  if (c.nomsFr.size && data.task === 'traduireNoms') {
    const noms = (Array.isArray(data.context?.entrees) ? data.context.entrees : []).map(e => ({ i: e?.i, nameFr: c.nomsFr.get(e?.base) })).filter(n => n.nameFr);
    call.nomsRendus = noms.length;
    return json({ ok: true, data: { noms }, model: 'rejeu-noms', elapsedMs: 900 });
  }
  if (data.task !== 'scanInvoice') return fail(400, 'FAILED_PRECONDITION', 'Banc : seule la lecture de justificatif est rejouée.');
  // n2-pages : une lecture à plusieurs pages doit porter EXACTEMENT les pages fictives du cas (nombre, ordre, empreinte de chacune) et aucun `file` ; sinon le cas échoue (une seule image envoyée ne passe pas).
  if (Array.isArray(data.files)) {
    const attendues = c.pagesAttendues ?? [];
    call.files = data.files;
    call.expectedFiles = attendues.length > 1 && data.files.length === attendues.length && data.files.every((f, i) => f.sha256 === attendues[i]) && !data.file;
    if (!call.expectedFiles || !doc) return fail(400, 'FAILED_PRECONDITION', 'Banc : pages inattendues pour ce cas.');
    return json({ ok: true, data: doc.result, model: 'rejeu-pages', elapsedMs: 1200, pages: data.files.length, documentHash: 'banc-pages' });
  }
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
  // d3c : les réglages du Drive factice pour l'envoi en arrière-plan (lent est dans le pont ; ici les refus). Chaque requête est comptée.
  c.drive.requests = (c.drive.requests ?? 0) + 1;
  const mode = c.driveMode?.fail;
  if (mode === 'quota') return json(403, { error: { code: 403, errors: [{ reason: 'storageQuotaExceeded' }] } });
  if (mode === 'auth') return json(401, { error: { code: 401, errors: [{ reason: 'authError' }] } });
  if (mode === 'network') return { networkError: true };
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

/** p3c-3 : la pastille « Lecture …, n lignes » du bandeau (nom accessible « Lecture à confirmer, 23 lignes ») amène à la liste ; la preuve est ouverte d'office. */
async function openPreuve(c) {
  const button = await c.page.$(`${sheet} button[aria-label^="Lecture"]`);
  if (!button) throw Error('Bouton « Lecture, n lignes » absent (pas de lecture réussie ?)');
  if (!(await c.page.$eval(`${sheet} section[data-dp="preuve"]`, e => !!e.getClientRects().length))) await click(c.page, `${sheet} button[aria-label^="Lecture"]`);
  await sleep(300);
  await c.page.$eval(`${sheet} section[data-dp="preuve"]`, e => e.scrollIntoView({ block: 'center' }));
  await sleep(200);
}
/** r2b : le panneau du règlement s'ouvre au toucher de la tuile « Règlement » (il n'y a plus de <details>). */
async function openPayment(c) {
  const open = () => c.page.$eval(`${sheet} [data-purchase-payment]`, e => !e.classList.contains('hidden'));
  if (!(await open())) await click(c.page, `${sheet} [data-dp="tuile-paye"]`);
  await sleep(300);
  await c.page.$eval(`${sheet} [data-purchase-payment]`, e => e.scrollIntoView({ block: 'center' }));
  await sleep(200);
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
/** Picks a document in an open chooser (or opens one with « Un document »), then waits for the reading. */
async function scan(c, docId, { mode = 'replay', chooser, delayMs = 0, loadingShot } = {}) {
  c.ai = { mode, doc: docId, delayMs };
  const doc = c.docs[docId];
  let picker = chooser ? await chooser : null;
  if (!picker) {
    // « Un document » before a reading, « Changer » (r2b : une icône dans l'en-tête, nom accessible « Changer ») after one:
    // find the visible one by its accessible name, then arm the chooser.
    const pickable = () => c.page.$$eval(`${sheet} button`, buttons => {
      const shown = buttons.filter(b => b.getClientRects().length && !b.disabled).map(b => (b.getAttribute('aria-label') || b.innerText).trim());
      return shown.find(text => text.startsWith('Un document')) ?? shown.find(text => text === 'Changer') ?? false;
    });
    // p3c-3 : « Changer » vit dans le petit panneau du picto du justificatif (en-tête), fermé au repos : le geste du brasseur est de toucher le picto d'abord.
    if (!(await waitFor(pickable, 'bouton pour choisir un justificatif', 3000).catch(() => false)))
      await click(c.page, `${sheet} header button[aria-label^="Justificatif"]`, undefined, 5000);
    const label = await waitFor(pickable, 'bouton pour choisir un justificatif', 20000);
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
      // p3c-3 : la preuve est ouverte d'office (pastille « Lecture, n lignes » = aller à la liste) ; textContent lit aussi ce qui est replié.
      reviewDetails: [...root.querySelectorAll('section[aria-label="Vérification du justificatif"] li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()),
      preuve: root.querySelector('section[data-dp="preuve"]')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      preuveOuverte: root.querySelector('section[data-dp="preuve"]') ? String(!!root.querySelector('section[data-dp="preuve"]').getClientRects().length) : null,
      chips: [...root.querySelectorAll('[data-dp-chip],[data-dp-rond]')].map(b => b.getAttribute('aria-label')),
      tuiles: { tva: text('[data-dp="tuile-tva"]'), reglement: text('[data-dp="tuile-paye"]') },
      alerts: [...root.querySelectorAll('[role="alert"]')].map(e => e.innerText.replace(/\s+/g, ' ').trim()),
      // textContent : un indice dans une rubrique repliée (TVA, référence) a un innerText vide mais existe.
      hints: Object.fromEntries([...root.querySelectorAll('[id^="scan-hint-"]')].map(e => [e.id.slice(10), { text: e.textContent.replace(/\s+/g, ' ').trim(), visible: !!e.getClientRects().length && !!e.offsetParent }])),
      // Le rond numéroté d'une pastille posée sur la tuile TVA n'a pas de crochet : c'est le seul <span> au texte numérique de la tuile.
      tvaRond: [...(root.querySelector('[data-dp="tuile-tva"]')?.querySelectorAll('span') ?? [])].map(s => s.textContent.trim()).find(t => /^\d+$/.test(t)) ?? null,
      total: value('#purchase-total'), description: value('#purchase-description'), vendor: value('#purchase-vendor'),
      category: value('#purchase-category'), invoiceNumber: value('#purchase-invoice-number'), vat: value('#purchase-vat'), vatRate: value('#purchase-vat-rate'),
      date: text('[data-purchase-date] summary'), dateOpen: root.querySelector('[data-purchase-date]')?.open ?? null,
      payment: [...root.querySelectorAll('[aria-label="État du règlement"] button')].map(b => `${b.innerText.trim()}=${b.getAttribute('aria-pressed')}`),
      // r2b : le règlement n'est plus un <details> mais la tuile « Règlement » (le panneau [data-purchase-payment] s'ouvre à son toucher).
      paymentSummary: text('[data-dp="tuile-paye"]'),
      paymentPanelOpen: !!root.querySelector('[data-purchase-payment]:not(.hidden)'),
      dueDate: [...root.querySelectorAll('[data-purchase-payment] input[type="date"]')].map(e => `${e.closest('label,div')?.innerText?.split('\n')[0] ?? ''}=${e.value}`),
      lines: [...root.querySelectorAll('article[data-purchase-line]')].map(a => ({
        label: a.querySelector('[aria-label^="Libellé ligne"]')?.value ?? null, kind: a.querySelector('[aria-label^="Nature ligne"]')?.value ?? null,
        amount: a.querySelector('[aria-label^="Montant ligne"]')?.value ?? null, stock: a.querySelector('[aria-label^="Stock ligne"]')?.value ?? null,
        quantity: a.querySelector('[aria-label^="Quantité ligne"]')?.value ?? null, unit: a.querySelector('[aria-label^="Unité ligne"]')?.value ?? null,
        article: a.querySelector('[role="combobox"]')?.value ?? null, summary: a.querySelector(':scope > details > summary')?.innerText.replace(/\s+/g, ' ').trim() ?? null,
        stockTexte: a.querySelector('[data-dp-stock]')?.textContent.replace(/\s+/g, ' ').trim() ?? null })),
      linesSummary: text('[data-dp="propositions"]'),
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
  await click(c.page, `${sheet} footer button[data-primary]`);
  const outcome = await (await c.page.waitForFunction(() => {
    const dialog = document.querySelector('[role="dialog"] footer');
    if (!dialog) return 'fermée';
    const alerts = [...document.querySelectorAll('[role="dialog"] [role="alert"]')].map(e => e.innerText.trim()).filter(Boolean);
    const busy = document.querySelector('[role="dialog"] footer button[data-primary]')?.innerText.includes('Enregistrement');
    // r2b : un justificatif rangé laisse la feuille ouverte sur son reçu Drive jusqu'à « Terminé » (état `done` de la feuille).
    const first = document.querySelector('[role="dialog"] footer button[data-primary]')?.innerText.trim();
    if (first === 'Terminé') return 'recu';
    return !busy && alerts.length ? `alerte: ${alerts.join(' | ').replace(/\s+/g, ' ').slice(0, 3000)}` : false;
  }, { timeout, polling: 500 })).jsonValue();
  if (outcome === 'recu') {
    // Le reçu tel que le brasseur le lit, puis son geste « Terminé » : la feuille se ferme.
    c.lastReceipt = await c.page.$eval(`${sheet} footer`, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
    await shoot(c, 'recu-drive');
    await click(c.page, `${sheet} footer button[data-primary]`, 'Terminé', 5000);
    const closed = await c.page.waitForFunction(() => !document.querySelector('[role="dialog"] footer'), { timeout: 10000 }).then(() => true).catch(() => false);
    await sleep(800);
    return closed ? 'fermée' : 'alerte: la feuille reste ouverte après « Terminé »';
  }
  await sleep(800);
  return outcome;
}
/** JUS-1 : each purchase line is a compact, closed row; its controls live in its own details. */
const toggleLine = (article, open) => article.evaluate((a, value) => { const d = a.querySelector(':scope > details'); if (d) d.open = value; }, open);
/** Chooses the stock action of each purchase line; `plan(index)` returns { action, search?, wanted? }. A proposal of
 * the reading (JUS-1) is kept when it names the wanted article, and corrected like a brewer would otherwise. */
async function setStockLines(c, plan) {
  /* p3c-3 : la liste n'est plus un <details> : rien à ouvrir */
  // R1 : la liste est groupée en bandes (ordre de l'écran), jamais dans l'ordre du papier : chaque rangée se retrouve par son id `line-N`, N = rang de la lecture.
  const found = [];
  for (const article of await c.page.$$(`${sheet} article[data-purchase-line]`)) {
    const id = await article.evaluate(a => a.getAttribute('data-dp-ligne') ?? '');
    found.push({ article, index: Number(/^line-(\d+)$/.exec(id)?.[1] ?? NaN) - 1 });
  }
  if (found.some(row => !Number.isInteger(row.index))) throw Error('setStockLines : une rangée sans id « line-N ».');
  found.sort((a, b) => a.index - b.index);
  const done = [];
  for (const { article, index } of found) {
    const stock = await article.$('select[aria-label^="Stock ligne"]');
    if (!stock) { done.push({ index, action: 'aucune option de stock' }); continue; }
    const decision = plan(index) ?? { action: 'none' };
    const shown = await article.evaluate(a => ({ action: a.querySelector('select[aria-label^="Stock ligne"]')?.value, article: a.querySelector('[role="combobox"]')?.value ?? '',
      marked: /proposé/.test(a.querySelector('[data-dp-stock]')?.textContent ?? '') })); /* p3c-3 : « stock : proposé · … » vit au plateau (data-dp-stock), plus dans le summary */
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
  await openPreuve(c);
  // 'center' : le haut de la preuve ne passe pas sous la bande collante des points à régler (celle-ci couvre le haut de l'écran défilant).
  await shoot(c, 'doc5-revue-details', `${sheet} section[data-dp="preuve"]`, 'center');
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
  /* p3c-3 : la liste n'est plus un <details> : rien à ouvrir */
  c.measure('doc5-lignes-compactes', await c.page.$$eval(`${sheet} article[data-purchase-line]`, nodes => {
    const heights = nodes.map(node => Math.round(node.getBoundingClientRect().height));
    return { lignes: heights.length, moyenne: Math.round(heights.reduce((sum, h) => sum + h, 0) / Math.max(1, heights.length)), min: Math.min(...heights), max: Math.max(...heights),
      liste: Math.round((nodes.at(-1)?.getBoundingClientRect().bottom ?? 0) - (nodes[0]?.getBoundingClientRect().top ?? 0)) };
  }));
  c.measure('doc5-lignes-ouvertes', await measureSheet(c));
  c.record('doc5-propositions', (await readSheet(c)).lines.map((line, index) => ({ index, stock: line.stock, marquee: /proposé/.test(line.stockTexte ?? '') })));
  await shoot(c, 'doc5-articles-propositions', `${sheet} [data-dp="liste"]`);
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
  await shoot(c, 'doc5-articles', `${sheet} [data-dp="liste"]`);
  const beforeConfirm = await dbSnapshot(c.db);
  c.check(!businessWrites(dbWrites(before, beforeConfirm)).length, 'doc5 : rien n’entre en stock avant la confirmation', { writes: businessWrites(dbWrites(before, beforeConfirm)) });
  let outcome = await confirmSheet(c, 60000);
  c.record('doc5-confirmation', outcome);
  c.record('doc5-recu-drive', c.lastReceipt ?? null);
  if (outcome !== 'fermée') {
    await shoot(c, 'doc5-confirmation-refusee');
    // A unit the stock does not understand (read « Stk », stock in « sachet ») is corrected by hand, as a brewer would.
    const fixes = [];
    for (const seed of c.plan.seeds.filter(seed => seed.unit === 'sachet')) {
      const article = await c.page.$(`${sheet} [data-dp-ligne="line-${seed.line + 1}"]`); // R1 : par id, jamais par rang (p3c-3)
      if (article) await toggleLine(article, true); // r2b : les champs de la ligne sont dans son plateau, replié au repos
      const unit = article && await article.$('[aria-label^="Unité ligne"]');
      if (!unit) continue;
      const read = await unit.evaluate(e => e.value);
      await unit.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.focus(); e.select(); });
      await c.page.keyboard.type(seed.unit); await c.page.keyboard.press('Tab'); await sleep(300);
      c.record('doc5-correction-unite', { ligne: seed.line, lue: read, saisie: seed.unit });
      fixes.push({ line: seed.line, uniteLue: read, uniteSaisie: seed.unit });
    }
    c.record('doc5-corrections-manuelles', fixes);
    if (fixes.length) { outcome = await confirmSheet(c, 60000); c.record('doc5-confirmation-2', outcome); }
    if (outcome !== 'fermée') await shoot(c, 'doc5-confirmation-refusee-2');
  }
  // d3c : plus de reçu à l'écran ; la feuille se ferme, l'envoi part en arrière-plan et le reçu se lit dans la fiche.
  c.check(outcome === 'fermée' && c.lastReceipt == null, 'doc5 : « Confirmer » enregistre et la feuille se ferme sans reçu (l’envoi au Drive part en arrière-plan)', { outcome, recu: c.lastReceipt });
  const after = await dbSnapshot(c.db);
  c.record('doc5-ecritures', businessWrites(dbWrites(before, after)));
  const view = await verifyPurchase(c, 'doc5', { stockPlan: plan });
  // Attentes métier dures (r2b ne les change pas) : une seule dépense, au montant lu, toutes les lignes, le stock écrit pour les seules
  // lignes de stock, les articles existants seulement augmentés de la quantité reçue, l'original rangé et identique.
  const scannedItems = scanned.items ?? [];
  const stockRows = view.stock?.lignes ?? [];
  c.check(view.transactions === 1, 'doc5 : une seule dépense enregistrée', { transactions: view.transactions });
  c.check(view.montantConformeALaLecture === true, 'doc5 : montant TTC de la dépense = montant lu', { lu: scanned.amountTTC });
  c.check(view.lignes === scannedItems.length && view.lignesSansMontant === 0, 'doc5 : toutes les lignes lues sont enregistrées, chacune avec son montant', { lignes: view.lignes, lues: scannedItems.length, sansMontant: view.lignesSansMontant });
  c.check(stockRows.length > 0 && stockRows.every(row => (row.lectureKind === 'stock') === row.stocke && (row.stocke ? row.mouvements === 1 : row.mouvements === 0)),
    'doc5 : une réception par ligne de stock lue, aucun mouvement pour les services et le port', { ecarts: stockRows.filter(row => !((row.lectureKind === 'stock') === row.stocke && (row.stocke ? row.mouvements === 1 : row.mouvements === 0))).map(row => row.index) });
  c.check(stockRows.filter(row => row.stocke).every(row => row.quantiteMouvement === row.quantiteLue), 'doc5 : la quantité reçue de chaque ligne = la quantité lue', {});
  c.check((view.stock?.semis ?? []).length === c.plan.seeds.length && (view.stock?.semis ?? []).every(row => row.identiqueAuSemis && row.apres === row.avant + row.recuParMouvements && row.recuParMouvements > 0),
    'doc5 : chaque article existant garde nom, catégorie et unité et reçoit exactement ses mouvements (rien d’autre modifié)', { semis: view.stock?.semis });
  c.check(view.stock?.servicesStockes === 0 && view.stock?.doublonsDArticle === 0, 'doc5 : aucun service en stock, aucun doublon d’article', { servicesStockes: view.stock?.servicesStockes, doublons: view.stock?.doublonsDArticle });
  c.check(view.justificatif?.original?.drive === true && view.justificatif.original.sha256Conforme === true && view.justificatif.original.bytes === true,
    'doc5 : l’original est rangé dans Drive, même empreinte et même taille', { justificatif: view.justificatif });
  c.finding('M3-categories', 'catégorie canonique des articles créés (JUS-1)', { categories: view.stock?.categoriesNouveaux ?? null,
    minuscules: (view.stock?.categoriesNouveaux ?? []).filter(category => category && category[0] !== category[0].toUpperCase()).length,
    receptionsSurSemis: view.stock?.semis?.map(seed => ({ id: seed.id, recu: seed.apres > seed.avant })), doublonsDArticle: view.stock?.doublonsDArticle ?? null });
}

/** Admin-side reading of one saved purchase: transaction, payment, original, stock items and movements. */
async function verifyPurchase(c, docId, { stockPlan = [], waitTx = false } = {}) {
  const doc = c.docs[docId], scanned = doc.result;
  // d3c : l'envoi du justificatif part APRÈS la fermeture de la feuille. Attendre que le lien soit posé (60 s au plus pour la dépense, 120 s pour
  // le lien) avant de lire l'original ; une dépense sans `proofUpload` (chemin synchrone) n'attend rien.
  const mine = async () => (await all(c.db, 'transactions')).find(row => row.finance?.sourceDocumentHash === doc.sha256);
  if (waitTx) await waitFor(mine, `dépense de ${docId} sur le serveur`, 60000).catch(() => null);
  await waitFor(async () => { const row = await mine(); return !row || !row.finance?.proofUpload || !!row.finance.proofDocumentId; }, `lien du justificatif de ${docId}`, 120000)
    .catch(error => c.step(`lien du justificatif non posé (${docId})`, { error: String(error).slice(0, 200) }));
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
    const seeded = c.plan.seeds.map(seed => { const item = items.find(entry => entry.id === seed.id); return { id: seed.id, avant: seed.currentStock, apres: item?.currentStock, uniteArticle: item?.unit, prixAvant: seed.pricePerUnit, prixApres: item?.pricePerUnit ?? null,
      identiqueAuSemis: !!item && item.name === seed.name && item.category === seed.category && item.unit === seed.unit && item.kind === 'rawMaterials',
      recuParMouvements: movements.filter(m => m.type === 'receipt' && m.stockItemRef === seed.id).reduce((sum, m) => sum + (Number(m.quantity) || 0), 0) }; });
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
      // Le nom affiché est celui que Drive a rendu à l'enregistrement (« date fournisseur n°.jpg »), gardé sur le document de preuve : plus le
      // nom du fichier choisi (dépense r2b, reçu Drive). On le lit sur le document de preuve de la dépense.
      const proofName = tx.finance?.proofDocumentId ? (await c.db.doc(`financeDocuments/${tx.finance.proofDocumentId}`).get()).data()?.fileName : null;
      const shown = await c.page.waitForFunction(names => [...document.querySelectorAll('img')].some(img => names.includes(img.alt) && img.complete && img.naturalWidth > 0)
        || [...document.querySelectorAll('iframe')].some(frame => names.includes(frame.title))
        || [...document.querySelectorAll('[role="dialog"] [role="alert"]')].map(e => e.innerText).join(' ') || false, { timeout: 30000 }, [proofName, doc.fileName].filter(Boolean))
        .then(handle => handle.jsonValue()).catch(error => `délai: ${String(error).slice(0, 120)}`);
      view.originalRouvert = shown === true ? 'image affichée' : shown;
      view.nomAffiche = proofName ?? null;
      // Les octets affichés sont ceux du document : empreinte de l'image montrée (blob de la page).
      view.imageAfficheeIdentique = shown === true ? await c.page.evaluate(async (names, wanted) => {
        const img = [...document.querySelectorAll('img')].find(i => names.includes(i.alt));
        if (!img) return null;
        const bytes = await (await fetch(img.src)).arrayBuffer();
        return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('') === wanted;
      }, [proofName, doc.fileName].filter(Boolean), doc.sha256).catch(() => null) : null;
      view.originalTelechargeDuDrive = c.drive.downloads.length > 0;
      await shoot(c, `${docId}-original`);
      await c.page.keyboard.press('Escape'); await sleep(500);
    }
    await c.page.keyboard.press('Escape'); await sleep(600);
  }
  c.finding(`C1-vues-${docId}`, 'dépense retrouvée dans Finances (journal, détail, original)', view);
  c.lastFinance = { docId, view };
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
  // Après le téléchargement Excel, l'écran Annuel peut revenir à « Préparer » : on le constate (exportsView) et on rouvre « Dossier ».
  if (!(await c.page.$$eval('button', nodes => nodes.some(b => b.getClientRects().length && b.innerText.trim().startsWith('Télécharger le dossier avec justificatifs'))))) {
    exportsView.ongletDossierReinitialiseApresExcel = true;
    await shoot(c, `${docId}-annuel-reinitialise`);
    await click(c.page, '#tax-tab-documents');
    await sleep(600);
  }
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
  c.lastFinance.exportsView = exportsView;
}

/** Finances : la dépense doc5 dans les vues, l'original rouvert, les exports TVA et finances. */
async function financeChecks(c, docId, label = docId) {
  c.lastFinance = null;
  await financeViews(c, docId);
  const { view, exportsView } = c.lastFinance ?? {};
  c.check(view?.ligneTrouvee === true && view.ligneMontreFournisseur === true, `finances : la dépense ${label} est au journal, avec son fournisseur`, { view });
  c.check(view?.boutonJustificatif === true && view.originalRouvert === 'image affichée' && view.imageAfficheeIdentique === true,
    `finances : le justificatif de ${label} se rouvre, octets identiques à l’original`, { originalRouvert: view?.originalRouvert, identique: view?.imageAfficheeIdentique });
  c.check(exportsView?.excel?.journal === true && exportsView?.zip?.originalIdentique === true && exportsView?.zip?.indexMentionneLaPiece === true,
    `finances : la dépense est dans l’Excel annuel et le ZIP avec l’original identique${label === docId ? '' : ` (${label})`}`, { exportsView });
}
async function caseFinances(c) { await financeChecks(c, 'doc5'); }

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
  // Attentes dures du même cas (r2b ne les change pas) : le doublon est dit, refusé sans choix, et rien n'est écrit.
  c.check(!!read.duplicate && !!existing && read.duplicate.includes(existing.description), 'doc6 : la dépense déjà enregistrée est montrée comme doublon possible', { duplicate: read.duplicate });
  c.check(String(refused).startsWith('alerte') && /doublon/.test(String(refused)), 'doc6 : sans choix, « Confirmer » refuse (doublon)', { refused });
  c.check(afterChoice?.writes === 0 && choice === 'feuille fermée' && sameTotal.length === 1 && !writes.length, 'doc6 : « Même achat » ne crée ni dépense ni écriture, la feuille se ferme', { afterChoice, choice, depensesAuMemeTotal: sameTotal.length, writes });
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
    // Le doublon bloquant ne se lève pas pour une commande répétée d'un autre n° ; le signal S8 (« Même commande, autre numéro ») n'est qu'un signal.
    c.check(!read.duplicate && read.footer.includes('Confirmer') && !writes.length, 'autre-numero : aucun doublon bloquant, « Confirmer » proposé, aucune écriture', { duplicate: read.duplicate, footer: read.footer, writes });
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
    await click(c.page, `${sheet} footer button[data-primary]`, 'Terminé', 5000).catch(() => closeSheet(c));
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
  // Attentes dures : le justificatif rejoint la dépense existante, sans dépense, sans écriture avant le geste, montant inchangé, original identique.
  c.check(!!read.duplicate && afterChoice?.writes === 0 && /^Justificatif rattaché/.test(String(status)) && expenses.length === 1 && !!tx?.finance?.proofDocumentId
    && original?.sha256 === c.docs.doc1.sha256 && tx?.finance?.sourceDocumentHash === c.docs.doc1.sha256 && cents(tx?.amountTTC ?? NaN) === amountCents,
    'rattacher : « Même achat » joint l’original à la dépense existante, sans nouvelle dépense, montant inchangé', { panneau: !!read.duplicate, apresChoix: afterChoice, status, depenses: expenses.length, lie: !!tx?.finance?.proofDocumentId });
  // La dépense rattachée porte l'empreinte de doc1 : laissée en place, le cas « doc1 » plus loin y verrait à juste titre un doublon
  // (« Un achat similaire existe déjà »). Retirée ici, comme celle du cas « autre-numero », pour que chaque cas parte d'un registre connu.
  await c.db.doc(`transactions/${id}`).delete();
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
  c.check(groups.filter(group => /^malt$/i.test(group)).length === 1 && detail.sousTitreCanonique && detail.champsTechniques && (await c.db.doc(`stockItems/${id}`).get()).data()?.category === 'malt',
    'minuscules : un seul groupe Malt, champs techniques, article ancien non réécrit', { groupes: groups, ...detail });
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
  c.check(outcome === 'fermée' && view.transactions === 1 && view.montantConformeALaLecture === true && view.justificatif?.original?.drive === true && view.justificatif.original.sha256Conforme === true && view.lignesSansMontant === 0,
    'doc1 : « Confirmer » enregistre une dépense au montant lu, avec son original rangé (même empreinte)', { outcome, transactions: view.transactions, montant: view.montantConformeALaLecture, justificatif: view.justificatif });
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
  // d3c (T5) : l'écriture de la dépense reste en file locale et la feuille SE FERME sans attendre l'accusé ; rien n'arrive au serveur pendant la coupure ;
  // au retour du réseau la dépense se synchronise, puis le justificatif part et se lie (le lien arrive, plus tard).
  await c.setOffline(true);
  const offline = await confirmSheet(c, 40000);
  c.record('doc4-hors-ligne', offline);
  await shoot(c, 'doc4-hors-ligne');
  await sleep(1500);
  const offlineWrites = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  await c.setOffline(false);
  const online = offline === 'fermée' ? 'fermée' : await (async () => { await sleep(3000); return confirmSheet(c, 60000); })();
  c.record('doc4-en-ligne', online);
  if (online !== 'fermée') await shoot(c, 'doc4-en-ligne');
  const view = await verifyPurchase(c, 'doc4', { waitTx: true });
  c.finding('C4', 'bordereau : aucune dépense finale sans confirmation', { ecrituresAvantGeste: idle.length, typeSource: view.typeSource,
    baseDuTotal: view.baseDuTotal, statut: view.statut, depenses: view.transactions, paiementPropose: read.payment, indiceTotal: read.hints.amountTTC?.text ? 'présent' : 'absent' });
  c.check(offline === 'fermée' && !offlineWrites.length, 'doc4 : hors ligne, la feuille se ferme sans attendre l’accusé et rien n’arrive au serveur pendant la coupure', { offline, offlineWrites: offlineWrites.length });
  c.check(online === 'fermée' && view.transactions === 1 && view.justificatif?.original?.sha256Conforme === true, 'doc4 : au retour du réseau, une seule dépense est synchronisée et son original part et se lie', { online, transactions: view.transactions, justificatif: view.justificatif });
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
  c.check(serverWhileOffline === 0 && synced === 1 && (await all(c.db, 'transactions')).filter(tx => tx.description === SYNTHETIC.description && cents(tx.amountTTC) === cents(SYNTHETIC.amount.replace(',', '.'))).length === 1,
    'hors-ligne : rien au serveur pendant la coupure, exactement une dépense synchronisée au retour, au montant saisi', { serverWhileOffline, synced });
  if (closing !== 'fermée') await closeSheet(c);
}

/** doc3 : bulletins QR ; montant, échéance et paiement proposés (aucun enregistrement). */
async function caseDoc3(c) {
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc3', { chooser });
  await shoot(c, 'doc3-revue', `${sheet} section[aria-label="Vérification du justificatif"]`);
  await openPayment(c);
  const read = await readSheet(c);
  c.record('doc3-revue', read);
  await shoot(c, 'doc3-reglement', `${sheet} [data-purchase-payment]`);
  const writes = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
  c.check(!writes.length, 'doc3 : aucune écriture sans enregistrement', { writes });
  c.check(read.total !== null && cents(read.total.replace(/\s/g, '').replace(',', '.')) === cents(c.docs.doc3.result.amountTTC) && read.paymentSummary?.includes('À payer'),
    'doc3 : le total proposé = le total lu (deux bulletins) et le règlement proposé est « À payer »', { total: read.total, reglement: read.paymentSummary });
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
  await openPreuve(c).catch(() => {});
  await shoot(c, 'doc2-revue');
  const outcome = await confirmSheet(c, 30000).catch(error => `erreur: ${String(error).slice(0, 200)}`);
  const after = await readSheet(c);
  await shoot(c, 'doc2-validation');
  c.finding('C6', 'facture hors brasserie : comportement du code', { categorie: read.category, alerteHorsBrasserie: read.reviewDetails.length,
    lignesSansMontant: read.lines.filter(line => line.amount === '' || line.amount === null).length, geste: outcome, aCorriger: after.alerts,
    ecritures: businessWrites(dbWrites(before, await dbSnapshot(c.db))).length });
  await closeSheet(c);
}

// ───────────────────────────── e-bout : doc14 (D261 à D264) et le doublon historique (D264a) ─────────────────────────────

/** Comparaison sans casse, accents, espaces ni ponctuation (la même que `libelleDeLigne`, src/ui/depense/etat.ts). */
const plat = text => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const occurrences = (text, part) => (part ? text.split(part).length - 1 : 0);
/** Les rangées de la liste telles que le brasseur les voit : id, bande qui la porte (crochet `data-dp-bande`), libellé affiché et saisi, action de stock. */
const readRows = c => c.page.evaluate(() => [...document.querySelectorAll('[role="dialog"] article[data-dp-ligne]')].map(a => ({
  id: a.getAttribute('data-dp-ligne'),
  band: a.closest('[data-dp-bande]')?.getAttribute('data-dp-bande') ?? (a.closest('[data-dp="port-tiroir"]') ? 'port' : null),
  shown: (a.querySelector('summary')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  label: a.querySelector('[aria-label^="Libellé ligne"]')?.value ?? null,
  stock: a.querySelector('select[aria-label^="Stock ligne"]')?.value ?? null,
  unit: a.querySelector('[aria-label^="Unité ligne"]')?.value ?? null })));

/** La famille de chaque ligne de la pièce doc14, par son numéro sur le papier (1 à 16), d'après la vérité croisée du 01.11 (notes de cas-5.json) : levure,
 * malts, sucre, houblon, matériel de fermentation, emballage. Les lignes où deux genres se défendent (6, 12, 15, 16) n'ont qu'une exigence : pas « autres ».
 * La 12 (« Gummiring », joints de bouteilles) : la vérité admet packaging, stock, other et equipment ; la lecture dit equipment, la bande Matériel suit. */
const FAMILLES_DOC14 = { levure: [1], malt: [7, 9, 11], sucre: [8], houblon: [10], materiel: [2, 3, 4, 5], emballage: [13, 14] };
const AMBIGUES_DOC14 = [6, 12, 15, 16];
/** Les lignes que la vérité dit « stock » sans ambiguïté (levure, malts, sucre, houblon) : chacune doit entrer au stock avec son mouvement. */
const STOCK_DOC14 = [1, 7, 8, 9, 10, 11];

/**
 * doc14 (D261, D262, D263, D264) : la commande en ligne du 01.11 au soir, lecture finale de C★v8+N rejouée. Chaque critère se juge sur l'écran servi
 * contre la vérité `cas-5.json` : (a) aucun nom de ligne ne double sa variante ; (b) aucune pastille « Total » pour un total arrondi à 5 centimes ;
 * (c) aucune pastille TVA sur une TVA juste par taux ; (d) le port compte dans le total, jamais comme une ligne ; (e) chaque ligne dans la bande de sa
 * famille ; (f) confirmer : la dépense est au journal, chaque ligne de stock a son mouvement, l'article est à jour, le justificatif se rouvre, l'export annuel.
 */
async function caseDoc14(c) {
  const doc = c.docs.doc14;
  if (!doc || !doc.truth) throw Error('doc14 (ou sa vérité) absent du manifeste : utiliser rejeu-k6.json.');
  const scanned = doc.result, truth = doc.truth, items = scanned.items ?? [];
  const before = await dbSnapshot(c.db);
  const chooser = await openInvoiceEntry(c);
  await scan(c, 'doc14', { chooser, delayMs: 1500 });
  // D281 : avec `--noms`, le français rejoué se pose sur les rangées après la lecture, sans la retarder.
  if (c.nomsFr.size) {
    const valeurs = [...c.nomsFr.values()];
    await waitFor(async () => c.calls.ai.some(call => call.task === 'traduireNoms'), 'doc14 : appel traduireNoms', 15000);
    const rendus = c.calls.ai.filter(call => call.task === 'traduireNoms').reduce((n, call) => n + (call.nomsRendus ?? 0), 0);
    let fr = [];
    await waitFor(async () => { fr = (await readRows(c)).filter(r => valeurs.some(v => r.shown.includes(v))); return fr.length > 0; }, 'doc14 : noms français posés', 15000).catch(() => {});
    c.check(rendus > 0 && fr.length > 0, 'doc14 : les noms français rejoués s’affichent sur les rangées (D281)', { rendus, rangeesEnFrancais: fr.length });
  }
  const read = await readSheet(c);
  c.record('doc14-revue', read);
  await shoot(c, 'doc14-repos');
  const rows = await readRows(c);
  c.record('doc14-rangees', rows);
  await shoot(c, 'doc14-lignes', `${sheet} [data-dp="liste"]`);
  c.check(!businessWrites(dbWrites(before, await dbSnapshot(c.db))).length, 'doc14 : la lecture seule n’écrit rien');

  // Le total et le nombre de lignes lus sur l'écran contre la vérité.
  const totalCents = read.total === null ? NaN : cents(read.total.replace(/\s/g, '').replace(',', '.'));
  c.check(totalCents === cents(truth.amountTTC), 'doc14 : le total affiché est le total imprimé (vérité)', { affiche: read.total });

  // (a) aucun nom de ligne ne double sa variante (D261a).
  // La lecture finale met la variante (mouture) dans le nom et laisse `variant` vide : on juge donc le libellé affiché lui-même, pour toute rangée dont le
  // nom lu est long (mouture, conditionnement) : aucune suite de trois mots ne s'y lit deux fois, que ce soit dans la rangée ou dans le champ du libellé.
  const repete = text => { const mots = plat(text).split(' '); const vus = new Set(); for (let i = 0; i + 3 <= mots.length; i++) { const suite = mots.slice(i, i + 3).join(' '); if (vus.has(suite)) return true; vus.add(suite); } return false; };
  const longs = items.map((item, index) => ({ item, index })).filter(({ item }) => plat(item.variant) || plat(item.name).split(' ').length >= 6);
  const doubled = longs.filter(({ index }) => { const row = rows.find(r => r.id === `line-${index + 1}`); return !row || [row.shown, row.label].some(repete); }).map(({ index }) => index + 1);
  c.check(longs.length > 0 && !doubled.length, 'doc14 (a) : aucun nom de ligne ne double sa variante (D261a)', { lignesALongNom: longs.length, lignesDoublees: doubled });

  // (b) et (c) : pastilles. Une pastille est un point numéroté du bandeau (`data-dp-chip` ou rond `data-dp-rond`, nom accessible « n Nom »).
  const pastilles = read.chips.filter(Boolean);
  const pastilleTotal = pastilles.filter(label => /^\d+ Total/.test(label)), pastilleTva = pastilles.filter(label => /^\d+ TVA/.test(label));
  // L'indice sous le total peut venir d'un autre contrôle (HT + TVA) : (b) ne juge que ce qui touche la somme des lignes.
  c.check(!pastilleTotal.length && !/somme|arrondi/i.test(read.hints.amountTTC?.text ?? ''), 'doc14 (b) : aucune pastille « Total » pour un total arrondi à 5 centimes (D261b)', { pastilles: pastilleTotal, indice: read.hints.amountTTC });
  c.check(!pastilleTva.length && read.tvaRond === null && !read.hints.tvaAmount?.text && !read.hints.tvaRate?.text, 'doc14 (c) : aucune pastille TVA sur une TVA juste par taux (D262a)',
    { pastilles: pastilleTva, rondSurLaTuileTva: read.tvaRond, indices: { tvaAmount: read.hints.tvaAmount, tvaRate: read.hints.tvaRate }, pointsDeLaLecture: (scanned.points ?? []).filter(p => /tva|vat/i.test(`${p.code} ${p.champ}`)).map(p => `${p.code}${p.pese ? ' (pèse)' : ''}`) });
  // Où se lève-t-elle ? Le banc rejoue la lecture déjà rendue par le serveur (le correctif serveur n'est pas en jeu) : on dit ce que cette lecture porte encore.
  c.finding('D262a-cote', 'doc14 : ce que la lecture rejouée porte, contre ce que l’écran en fait', { serveurEnJeu: false,
    champsAvertisLus: (scanned.fieldWarnings ?? []).map(w => w.field), codesDePointsLus: (scanned.points ?? []).map(p => p.code ?? p), pastillesAffichees: pastilles.map(label => label.replace(/^\d+ /, '')),
    tvaParTauxLue: Array.isArray(scanned.vat) ? scanned.vat.length : null });

  // (d) le port compte dans le total, jamais comme une ligne (D249).
  const ports = items.filter(item => item.kind === 'shipping');
  const bandeau = await c.page.evaluate(() => ({ pastilleLignes: [...document.querySelectorAll('[role="dialog"] [data-dp="bandeau"] button[aria-label]')].map(b => b.getAttribute('aria-label')).find(label => /\d+ lignes?$/.test(label)) ?? null,
    port: document.querySelector('[role="dialog"] [data-dp="port"]')?.textContent.replace(/\s+/g, ' ').trim() ?? null }));
  const nLignesAffichees = Number(/(\d+) lignes?$/.exec(bandeau.pastilleLignes ?? '')?.[1] ?? NaN);
  const dansLesBandes = rows.filter(row => row.band && row.band !== 'port').length;
  const portCents = ports.reduce((sum, item) => sum + cents(item.amountTTC ?? NaN), 0);
  c.check(ports.length === 1 && nLignesAffichees === truth.items.length && dansLesBandes === truth.items.length && rows.filter(row => row.band === 'port').length === ports.length
    && !!bandeau.port && bandeau.port.replace(/\s/g, '').includes(String(portCents / 100).replace('.', ',')),
    'doc14 (d) : le port est dans « dont port » et le total, jamais une des lignes (16 lignes, port à part)', { lignesLuesDuPapier: truth.items.length, pastille: bandeau.pastilleLignes, dansLesBandes, ports: ports.length, rangeesDePort: rows.filter(row => row.band === 'port').length, port: bandeau.port });

  // (e) chaque ligne dans la bande de sa famille (D262d) ; les bandes se reconnaissent par `data-dp-bande`, jamais par leur texte.
  const bandOf = n => rows.find(row => row.id === `line-${n}`)?.band ?? null;
  const bandsOf = Object.fromEntries(Object.entries(FAMILLES_DOC14).map(([famille, numeros]) => [famille, [...new Set(numeros.map(bandOf))]]));
  const unies = Object.values(bandsOf).every(set => set.length === 1 && !!set[0]);
  const distinctes = unies && new Set(Object.values(bandsOf).map(set => set[0])).size === Object.keys(bandsOf).length;
  const nommees = unies && ['levure', 'malt', 'houblon'].every(famille => bandsOf[famille][0] === famille);
  const enAutres = [...Object.values(FAMILLES_DOC14).flat(), ...AMBIGUES_DOC14].filter(n => !bandOf(n) || bandOf(n) === 'autres');
  c.check(unies && distinctes && nommees && !enAutres.length, 'doc14 (e) : chaque ligne tombe dans la bande de sa famille, « autres » seulement pour l’inclassable (D262d)',
    { bandesParFamille: bandsOf, lignesEnAutres: enAutres, ambigues: Object.fromEntries(AMBIGUES_DOC14.map(n => [n, bandOf(n)])) });

  // (g) D273f : aucune quantité ne chevauche son prix unitaire. « 100 Gramm » débordait la colonne de 37 px et courait sur « 0,0101 » (390, 01.11).
  // Le texte se mesure par une plage (le bloc de la cellule garde sa largeur quand le texte déborde).
  const chevauchent = await c.page.evaluate(() => [...document.querySelectorAll('[role="dialog"] article[data-dp-ligne] .dp-p3c-dq')].filter(dq => {
    const texte = el => { if (!el) return null; const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    const q = texte(dq.querySelector('[data-dp-qte]')), x = texte(dq.querySelector('i')), p = texte(dq.querySelector('[data-dp-prix]'));
    return !!(q && x && p) && (q.right > x.left + 0.5 || x.right > p.left + 0.5);
  }).map(dq => dq.getAttribute('aria-label')));
  c.check(!chevauchent.length, 'doc14 (g) : aucune quantité ne chevauche son prix unitaire (D273f)', { chevauchent });

  // (h) à (l) : sa plainte du 01.11 au soir sur cette pièce (D275, D277), jugée sur l'écran servi au repos.
  const vue = await c.page.evaluate(() => [...document.querySelectorAll('[role="dialog"] article[data-dp-ligne]')].filter(a => !a.hidden).map(a => {
    const sum = a.querySelector('summary'), nom = a.querySelector('[data-dp-nom]'), qte = a.querySelector('[data-dp-qte]');
    return {
      id: a.getAttribute('data-dp-ligne'), groupe: a.getAttribute('data-dp-groupe'), nom: nom ? nom.textContent.trim() : '', haut: Math.round(a.getBoundingClientRect().height),
      etat: [...a.querySelectorAll('[data-dp-etat]')].map(e => (e.getAttribute('aria-label') || '') + ' ' + e.textContent).join(' '),
      creer: a.querySelectorAll('[data-dp-creer]').length, neuf: !!sum?.querySelector('svg[aria-label="nouvel article"]'),
      qte: qte ? qte.textContent.trim() : '', qteNiveau: qte?.closest('[data-dp-niveau]')?.getAttribute('data-dp-niveau') ?? qte?.getAttribute('data-dp-niveau') ?? null,
      rouges: a.querySelectorAll('summary [data-dp-niveau="inconnu"]').length,
    };
  }));
  const bandesQte = await c.page.evaluate(() => [...document.querySelectorAll('[role="dialog"] [data-dp-bande-entete]')].map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  c.record('doc14-vue-d275', { vue, bandesQte });
  const ligneDe = n => vue.find(v => v.id === `line-${n}`);
  const optionsAllemandes = vue.filter(v => /mischung|schrotung|einzelprodukt|\[\+chf/i.test(v.nom)).map(v => v.id);
  const malts = [7, 9, 11].map(ligneDe);
  c.check(!optionsAllemandes.length && malts.every(v => v && /concass/i.test(v.etat)), 'doc14 (h) : les options sortent du nom, l’état « concassé » se lit sur chaque malt (D275a)',
    { optionsAllemandes, etats: malts.map(v => v && { id: v.id, nom: v.nom, etat: v.etat }) });
  const largeur = await c.page.evaluate(() => window.innerWidth), plafond = largeur < 600 ? 52 : 36;
  const hautes = vue.filter(v => v.groupe !== 'port' && v.haut > plafond).map(v => ({ id: v.id, haut: v.haut }));
  c.check(!hautes.length, `doc14 (j) : au repos, chaque rangée tient sur une ligne, deux au plus pour un nom long (≤ ${plafond} px à ${largeur}) (D275c)`, { hautes });
  const avecCreer = vue.filter(v => v.creer).map(v => v.id), sansNeuf = STOCK_DOC14.map(ligneDe).filter(v => !v || !v.neuf).map((v, i) => v?.id ?? `line-${STOCK_DOC14[i]}`);
  c.check(!avecCreer.length && !sansNeuf.length, 'doc14 (k) : aucun bouton « Créer » au repos ; chaque ingrédient sans article est un nouvel article d’office (D275d)', { avecCreer, sansNeuf });
  const qteInconnues = vue.filter(v => /\?\s*$/.test(v.qte)).map(v => ({ id: v.id, qte: v.qte })), houblon = ligneDe(10);
  const rouges = vue.filter(v => v.rouges).map(v => v.id), bandesAvecInconnu = bandesQte.filter(t => /\d\s*\?/.test(t));
  c.check(!qteInconnues.length && !bandesAvecInconnu.length && /^85\s*g$/.test(houblon?.qte ?? '') && houblon?.qteNiveau === 'repris' && !rouges.length,
    'doc14 (l) : aucune unité « ? » quand elle se déduit ; 85 g de houblon remplis en jaune, aucun rouge sur cette pièce (D277)', { qteInconnues, bandesAvecInconnu, houblon, rouges });

  // (f) confirmer. Une ligne de stock sans action prend un nouvel article (le geste du brasseur) ; ce que l'app propose seule est gardé.
  const posees = [];
  for (const n of STOCK_DOC14) {
    const article = await c.page.$(`${sheet} [data-dp-ligne="line-${n}"]`);
    const stock = article && await article.$('select[aria-label^="Stock ligne"]');
    if (!stock) { posees.push({ n, action: 'aucune option de stock' }); continue; }
    const shown = await stock.evaluate(e => e.value);
    if (shown !== 'none') { posees.push({ n, action: shown, proposee: true }); continue; }
    await toggleLine(article, true);
    await stock.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await stock.select('new'); await sleep(250);
    await toggleLine(article, false);
    posees.push({ n, action: 'new', proposee: false });
  }
  c.record('doc14-stock-par-defaut', posees);
  const beforeConfirm = await dbSnapshot(c.db);
  c.check(!businessWrites(dbWrites(before, beforeConfirm)).length, 'doc14 : rien n’entre en stock avant la confirmation');
  // Premier geste, tel quel : la pièce n'imprime ni date ni paiement (le brasseur les complète), mais son total arrondi à 5 centimes ne doit pas, lui, bloquer.
  let outcome = await confirmSheet(c, 60000);
  c.record('doc14-confirmation', outcome);
  c.check(!/correspondre exactement au total/.test(String(outcome)), 'doc14 (b) : le total arrondi à 5 centimes n’empêche pas d’enregistrer (D261b)', { reponse: String(outcome).slice(0, 400) });
  if (outcome !== 'fermée') {
    await shoot(c, 'doc14-confirmation-refusee');
    // Les gestes d'un brasseur : une date d'achat (la pièce n'en imprime pas), « À payer » (aucun paiement visible), puis, faute de mieux, le total égal à la somme des lignes.
    await openDetails(c.page, `${sheet} [data-purchase-date]`);
    await setDate(c.page, `${sheet} [data-purchase-date] input[type="date"]`, new Date().toISOString().slice(0, 10));
    await openPayment(c);
    await click(c.page, `${sheet} [aria-label="État du règlement"] button`, 'À payer');
    await sleep(300);
    const sumCents = items.reduce((sum, item) => sum + cents(item.amountTTC ?? 0), 0);
    if (sumCents !== cents(truth.amountTTC)) {
      await typeInto(c.page, '#purchase-total', (sumCents / 100).toFixed(2).replace('.', ','));
      c.record('doc14-total-corrige-a-la-main', { ecartCentimes: sumCents - cents(truth.amountTTC) });
    }
    outcome = await confirmSheet(c, 60000);
    c.record('doc14-confirmation-geste-complet', outcome);
  }
  if (outcome !== 'fermée') {
    await shoot(c, 'doc14-confirmation-refusee-bis');
    // Une unité que le stock ne comprend pas (non imprimée) : corrigée à la main, comme un brasseur, selon la famille de la ligne.
    // La ligne 11 s'écrit « … Gramm » : un brasseur y met des grammes, pas des kilos (les autres malts sont écrits « … Kg »).
    const parFamille = { levure: 'sachet', malt: 'kg', sucre: 'pièce', houblon: 'g' };
    const unites = new Proxy({}, { get: (_target, famille) => parFamille[famille] });
    const uniteDe = (n, famille) => (n === 11 ? 'g' : unites[famille]);
    const corrections = [];
    for (const [famille, numeros] of Object.entries(FAMILLES_DOC14)) for (const n of numeros) {
      if (!STOCK_DOC14.includes(n)) continue;
      const article = await c.page.$(`${sheet} [data-dp-ligne="line-${n}"]`);
      if (article) await toggleLine(article, true);
      const unit = article && await article.$('[aria-label^="Unité ligne"]');
      if (!unit || await unit.evaluate(e => e.value.trim())) continue;
      await unit.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.focus(); e.select(); });
      await c.page.keyboard.type(uniteDe(n, famille)); await c.page.keyboard.press('Tab'); await sleep(300);
      corrections.push({ n, unite: uniteDe(n, famille) });
    }
    c.record('doc14-corrections-manuelles', corrections);
    if (corrections.length) { outcome = await confirmSheet(c, 60000); c.record('doc14-confirmation-2', outcome); }
    if (outcome !== 'fermée') await shoot(c, 'doc14-confirmation-refusee-2');
  }
  c.check(outcome === 'fermée', 'doc14 (f) : « Confirmer » enregistre et la feuille se ferme', { outcome });
  await shoot(c, 'doc14-apres-confirmation');

  const view = await verifyPurchase(c, 'doc14', { waitTx: true });
  c.check(view.transactions === 1, 'doc14 (f) : une seule dépense enregistrée', { transactions: view.transactions });
  const tx = (await all(c.db, 'transactions')).find(row => row.finance?.sourceDocumentHash === doc.sha256);
  const corrige = !!c.entry.records['doc14-total-corrige-a-la-main'];
  c.check(!!tx && cents(tx.amountTTC) === (corrige ? items.reduce((sum, item) => sum + cents(item.amountTTC ?? 0), 0) : cents(truth.amountTTC)),
    corrige ? 'doc14 (f) : le montant enregistré est celui que le brasseur a validé (somme des lignes, faute d’avoir pu enregistrer le total arrondi)' : 'doc14 (f) : le montant enregistré est le total imprimé de la vérité', { enregistre: tx?.amountTTC });
  const movements = (await all(c.db, 'movements')).filter(move => move.transactionId === tx?.id && move.type === 'receipt');
  const stockItems = await all(c.db, 'stockItems');
  const seeds = Object.fromEntries(c.plan.seeds.map(seed => [seed.id, seed.currentStock]));
  const lines = tx?.finance?.lines ?? [];
  const parLigne = STOCK_DOC14.map(n => {
    const line = lines[n - 1], item = items[n - 1], ref = line?.stockItemRef, moved = movements.filter(move => ref && move.stockItemRef === ref);
    const article = stockItems.find(entry => entry.ref === ref || entry.id === ref);
    const avant = article ? (seeds[article.id] ?? 0) : null;
    return { n, mouvements: moved.length, quantiteOk: moved.length === 1 && Number(moved[0].quantity) === Number(item?.quantity),
      uniteDuMouvement: moved[0]?.unit ?? null, articleExiste: !!article, uniteArticle: article?.unit ?? null, articleAJour: !!article && moved.length === 1 && Math.abs(article.currentStock - (avant + Number(moved[0].quantity))) < 1e-6 };
  });
  c.record('doc14-stock-par-ligne', parLigne);
  c.check(parLigne.every(row => row.mouvements === 1 && row.quantiteOk && row.articleExiste && !!row.uniteArticle), 'doc14 (f) : chaque ligne de stock a son mouvement (quantité, unité, article)',
    { lignes: parLigne.filter(row => !(row.mouvements === 1 && row.quantiteOk && row.articleExiste && !!row.uniteArticle)) });
  c.check(parLigne.every(row => row.articleAJour), 'doc14 (f) : l’article est à jour (stock avant + quantité reçue)', { lignes: parLigne.filter(row => !row.articleAJour).map(row => row.n) });
  // (n) n1-nom-fr, choix B (02.11) : un article neuf dont le français REJOUÉ (`--noms`) diffère de sa base imprimée porte ce français pour nom et garde la base dans `nomsFacture` ; sinon le nom imprimé.
  if (c.nomsFr.size) {
    const net = texte => fold(texte).replace(/[®™]/g, '').replace(/\s*:\s*$/, '').replace(/\s+/g, ' ').trim();
    const choix = STOCK_DOC14.map(n => {
      const imprime = net(items[n - 1]?.name), cle = [...c.nomsFr.keys()].filter(k => imprime.startsWith(net(k))).sort((a, b) => b.length - a.length)[0];
      const article = stockItems.find(entry => entry.ref === lines[n - 1]?.stockItemRef), francais = cle ? c.nomsFr.get(cle) : undefined;
      const different = !!francais && net(francais) !== net(cle);
      const ok = !!article && (different ? net(article.name) === net(francais) && (article.nomsFacture ?? []).some(k => net(k) === net(cle)) : !(article.nomsFacture ?? []).some(k => net(k) === net(article.name)));
      return { n, imprime: items[n - 1]?.name, base: cle ?? null, francais: francais ?? null, different, nom: article?.name ?? null, nomsFacture: article?.nomsFacture ?? null, ok };
    });
    c.record('doc14-noms-b', choix);
    c.check(choix.length > 0 && choix.every(row => row.ok), 'doc14 (n) : chaque article neuf au français rejoué différent porte ce français et garde sa base imprimée ; sinon le nom imprimé (choix B)', { lignes: choix.filter(row => !row.ok) });
  }
  const lignePort = lines.find(line => line.kind === 'shipping');
  // Les articles neufs se rangent sous une catégorie de brasseur (Malt, Houblon, Levure…), pas sous le mot anglais de la lecture (« yeast », « grain »).
  const categoriesNeuves = [...new Set(STOCK_DOC14.map(n => stockItems.find(entry => entry.ref === lines[n - 1]?.stockItemRef)?.category))];
  c.check(categoriesNeuves.every(category => category && !/^(yeast|grain|hop|additive)$/i.test(category)), 'doc14 (f) : les articles neufs prennent une catégorie de brasseur, pas le mot anglais de la lecture', { categories: categoriesNeuves });
  // (i) le concassage est l'état du malt, jamais une partie du nom d'un article (D275b).
  const nomsNeufs = STOCK_DOC14.map(n => ({ n, nom: stockItems.find(entry => entry.ref === lines[n - 1]?.stockItemRef)?.name ?? null }));
  const nomsAvecOption = nomsNeufs.filter(x => !x.nom || /mischung|schrotung|einzelprodukt|\[\+chf|·|,\s*(kg|gramm)\s*$/i.test(x.nom));
  c.check(!nomsAvecOption.length, 'doc14 (i) : chaque article neuf porte le nom de base, sans option ni unité (D275b)', { nomsNeufs });
  c.check(!lignePort?.stockItemRef &&!movements.some(move => lignePort && move.stockItemRef === lignePort.stockItemRef && lignePort.stockItemRef), 'doc14 (d) : le port n’entre jamais en stock',
    { lignesEnregistrees: lines.length, portEnregistreCommeLigne: !!lignePort });
  c.finding('doc14-enregistre', 'doc14 : ce que la dépense porte une fois enregistrée', { lignesEnregistrees: lines.length, genres: lines.map(line => line.kind), mouvements: movements.length,
    articlesNeufs: stockItems.filter(entry => String(entry.id).startsWith('MP-')).length });
  await financeChecks(c, 'doc14');
}

/**
 * D264a : la même pièce ressaisie après un achat semé sous la forme historique de l'audit (voies/e-reel/AUDIT.md : écritures `B-001`…, sans `finance`,
 * libellé qui commence par la référence d'article, même date, somme = total à l'arrondi près). Semées à partir de la lecture rejouée de doc5, retirées à la fin.
 */
async function caseDoublon(c) {
  const scanned = c.docs.doc5.result, items = (scanned.items ?? []).filter(item => String(item.reference ?? '').trim() && Number.isFinite(item.amountTTC));
  if (items.length < 2 || !scanned.date) { c.check(false, 'doublon : doc5 n’a pas assez de références et de montants pour imiter la forme historique', { lignes: items.length }); return; }
  const ids = items.map((_, index) => `B-${String(index + 1).padStart(3, '0')}`);
  const sumCents = items.reduce((sum, item) => sum + cents(item.amountTTC), 0), drift = cents(scanned.amountTTC) - sumCents;
  c.record('doublon-semis', { ecritures: ids.length, ecartRepartiSurLaDerniere: drift });
  try {
    for (const [index, item] of items.entries()) {
      const amount = (cents(item.amountTTC) + (index === items.length - 1 ? drift : 0)) / 100;
      await c.db.doc(`transactions/${ids[index]}`).set({ id: ids[index], date: scanned.date, description: `${String(item.reference).trim()} ${item.name ?? ''}`.trim(), category: scanned.category,
        subcategory: '', amountHT: amount, tvaRate: 0, tvaAmount: 0, amountTTC: amount });
    }
    await reloadApp(c);
    const before = await dbSnapshot(c.db);
    const chooser = await openInvoiceEntry(c);
    await scan(c, 'doc5', { chooser });
    const read = await readSheet(c);
    c.record('doublon-revue', read);
    await shoot(c, 'doublon-avertissement', read.duplicate ? `${sheet} #purchase-duplicate` : `${sheet} footer`);
    const titre = await c.page.$eval(`${sheet} #purchase-duplicate`, e => e.getAttribute('aria-label')).catch(() => null);
    c.check(!!read.duplicate && /déjà enregistré/i.test(`${titre ?? ''} ${read.duplicate}`), 'doublon : la même pièce ressaisie après un achat historique avertit « déjà enregistré » (D264a)', { titre, panneau: read.duplicate?.slice(0, 300) });
    c.check(/écritures? historiques?/i.test(read.duplicate ?? ''), 'doublon : l’avertissement dit que ce sont des écritures historiques (motif de la règle)', { panneau: read.duplicate?.slice(0, 300) });
    const refused = await confirmSheet(c, 30000);
    c.record('doublon-sans-choix', refused);
    c.finding('D264a-sans-choix', 'doublon historique : « Confirmer » sans choix', { refus: String(refused).startsWith('alerte'), reponse: String(refused).slice(0, 200) });
    if (refused === 'fermée') await shoot(c, 'doublon-enregistree-malgre');
    else { await shoot(c, 'doublon-sans-choix'); await closeSheet(c); }
    const writes = businessWrites(dbWrites(before, await dbSnapshot(c.db)));
    c.check(!writes.length, 'doublon : rien n’est écrit tant que le brasseur n’a pas tranché', { writes: writes.map(row => `${row.collection}+${row.added.length}~${row.changed.length}`) });
  } finally {
    // Retirées même en cas d'échec : elles fausseraient les cas suivants (mêmes références, même date).
    for (const id of ids) await c.db.doc(`transactions/${id}`).delete().catch(() => {});
    await reloadApp(c).catch(() => {});
  }
}

// ───────────────────────────── d3c : l'envoi du justificatif au Drive en arrière-plan ─────────────────────────────

/** Un PDF synthétique et distinct par essai (l'empreinte du document fait l'identité d'un achat : jamais deux saisies avec le même fichier). */
function syntheticFile(c, label, extraBytes = 0) {
  const dir = join(c.out, 'fichiers');
  mkdirSync(dir, { recursive: true });
  const body = Buffer.concat([Buffer.from(`%PDF-1.4\n% d3c ${label} largeur ${c.width}\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`), Buffer.alloc(extraBytes, 0x20)]);
  const path = join(dir, `${c.width}-${label}.pdf`);
  writeFileSync(path, body);
  return { path, sha256: sha(body), bytes: body.length, name: basename(path) };
}
/** Saisie manuelle AVEC justificatif : la lecture est refusée par le banc, le brasseur tape le total et le motif. S'arrête avant « Enregistrer ». */
async function manualWithProof(c, file, description, amount = '12,30') {
  const chooser = await openInvoiceEntry(c);
  c.ai = { mode: 'refus', doc: null, delayMs: 0 };
  const picker = await chooser;
  if (!picker) throw Error('Pas de sélecteur de fichier à l’ouverture de l’entrée.');
  await picker.accept([file.path]);
  await c.page.waitForFunction(() => !document.body.innerText.includes('Lecture et vérification') && document.querySelector('#purchase-total'), { timeout: 60000 });
  await sleep(600);
  await typeInto(c.page, '#purchase-total', amount);
  await typeInto(c.page, '#purchase-description', description);
}
/** « Enregistrer » : le temps jusqu'à la fermeture de la feuille, et ce que la feuille dit si elle reste. */
async function saveAndMeasure(c, timeout = 60000) {
  const started = Date.now();
  await click(c.page, `${sheet} footer button[data-primary]`);
  const closed = await c.page.waitForFunction(() => !document.querySelector('[role="dialog"] footer'), { timeout, polling: 100 }).then(() => true).catch(() => false);
  const ms = Date.now() - started;
  const alerts = closed ? [] : await c.page.$$eval('[role="dialog"] [role="alert"]', nodes => nodes.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  return { closed, ms, alerts };
}
const txOf = async (c, description) => (await all(c.db, 'transactions')).find(row => row.description === description);
const uploadsOf = (c, file) => c.drive.uploads.filter(row => row.sha256 === file.sha256).length;
const noticeText = c => c.page.$eval('[data-proof-notice]', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
const waitNotice = (c, timeout = 90000) => waitFor(() => noticeText(c), 'notification d’échec', timeout);
const waitLinked = (c, description, timeout = 150000) => waitFor(async () => { const row = await txOf(c, description); return row?.finance?.proofDocumentId ? row : false; }, `lien du justificatif « ${description} »`, timeout);
const goTab = async (c, label) => { await click(c.page, 'nav button', label); await sleep(900); };
/** Tab (clavier seul) atteint les boutons de la notification. */
async function keyboardReachesNotice(c) {
  await c.page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const reached = new Set();
  for (let index = 0; index < 120 && reached.size < 2; index++) {
    await c.page.keyboard.press('Tab');
    const label = await c.page.evaluate(() => { const e = document.activeElement; return e?.closest?.('[data-proof-notice]') ? (e.getAttribute('aria-label') || e.innerText || '').trim() : null; });
    if (label) reached.add(label);
  }
  return [...reached];
}
/** Les lignes de la file locale (IndexedDB de la page, base `laffinee-justificatifs`), telles que la page les garde. */
const queueRows = c => c.page.evaluate(() => new Promise(resolve => {
  const open = indexedDB.open('laffinee-justificatifs');
  open.onerror = () => resolve(null);
  open.onsuccess = () => {
    const db = open.result;
    if (!db.objectStoreNames.contains('envois')) { db.close(); resolve([]); return; }
    const request = db.transaction('envois').objectStore('envois').getAll();
    request.onsuccess = () => { db.close(); resolve(request.result.map(row => ({ id: row.submissionId, state: row.state, reason: row.reason ?? null, hasFile: !!row.dataUrl }))); };
    request.onerror = () => { db.close(); resolve(null); };
  };
}));
const resetDriveMode = c => { c.driveMode = { delayMs: 0, fail: null }; c.tokenMode = null; c.blockFirestore = false; };

/**
 * d3c (D235, D237 n° 5) : « c'est invisible, c'est à la fin en arrière-plan. Et si ça fail : grosse notification, renvoie sur la facture pour
 * upload le justificatif ou/et réparé le lien drive ». Drive factice dans la page : lent, quota plein, jeton refusé, réseau coupé, renouvellement
 * du jeton indisponible. Chaque sous-cas est numéroté comme les cas Chrome 1 à 11 du plan.
 */
async function caseDriveFond(c) {
  resetDriveMode(c);
  const rowsBefore = (await all(c.db, 'transactions')).length;

  // 1 + 7 : Drive lent (10 s par requête), réseau présent. La feuille se ferme en moins de 2 s ; on recharge la page en plein envoi : la file reprend, un seul fichier.
  c.driveMode.delayMs = 10000;
  const f1 = syntheticFile(c, 'lent'), d1 = `Essai Drive lent ${c.width}`;
  await manualWithProof(c, f1, d1);
  await shoot(c, 'drive-fond-1-feuille-avant');
  const s1 = await saveAndMeasure(c);
  await shoot(c, 'drive-fond-1-feuille-fermee');
  c.check(s1.closed && s1.ms < 2000, 'drive-fond 1 : Drive lent, la feuille se ferme en moins de 2 s après « Enregistrer »', { fermee: s1.closed, ms: s1.ms, alertes: s1.alerts });
  c.measure('drive-fond-1-fermeture-ms', s1.ms);
  const t1 = await waitFor(() => txOf(c, d1), 'dépense « lent » sur le serveur', 30000).catch(() => null);
  c.check(!!t1 && !t1.finance?.proofDocumentId && t1.finance?.proofUpload?.state === 'queued', 'drive-fond 1 : la dépense est écrite, en file, sans proofDocumentId (l’envoi n’a pas fini)', { etat: t1?.finance?.proofUpload, lien: t1?.finance?.proofDocumentId ?? null });
  c.check(!(await noticeText(c)), 'drive-fond 1 : aucune notification pendant que ça marche', { notification: await noticeText(c) });
  await sleep(3000);
  c.driveMode.delayMs = 0;
  await c.page.reload({ waitUntil: 'domcontentloaded' });
  await waitApp(c);
  c.step('page rechargée en plein envoi');
  const l1 = await waitLinked(c, d1, 240000).catch(() => null);
  c.check(!!l1 && uploadsOf(c, f1) === 1, 'drive-fond 7 : rechargement en plein envoi, la file reprend au démarrage, un seul fichier dans le Drive factice', { lien: l1?.finance?.proofDocumentId ?? null, fichiers: uploadsOf(c, f1) });
  c.check(!(await noticeText(c)), 'drive-fond 7 : aucune notification après la reprise', {});

  // 2 + 3 : Drive plein. La notification paraît (aucune feuille ouverte), reste, se lit au clavier ; « Renvoyer le justificatif » ouvre CETTE dépense ; renvoi réussi.
  c.driveMode.fail = 'quota';
  const f2 = syntheticFile(c, 'plein'), d2 = `Essai Drive plein ${c.width}`;
  await manualWithProof(c, f2, d2);
  const s2 = await saveAndMeasure(c);
  c.check(s2.closed, 'drive-fond 2 : Drive plein, la feuille se ferme quand même', { alertes: s2.alerts });
  const n2 = await waitNotice(c).catch(() => null);
  c.check(!!n2 && /espace Drive est plein/.test(n2) && /Renvoyer le justificatif/.test(n2), 'drive-fond 2 : la notification d’échec paraît, dit la cause et propose « Renvoyer le justificatif »', { notification: n2 });
  await shoot(c, 'drive-fond-2-notification-echec');
  await sleep(10000);
  c.check(!!(await noticeText(c)), 'drive-fond 2 : elle est toujours là après 10 s (persistante)', {});
  const reached = await keyboardReachesNotice(c);
  c.check(reached.includes('Renvoyer le justificatif') && reached.includes('Plus tard'), 'drive-fond 2 : le clavier (Tab) atteint ses boutons', { atteints: reached });
  await goTab(c, 'Finances');
  c.check(!!(await noticeText(c)), 'drive-fond 2 : elle est aussi sur Finances', {});
  await shoot(c, 'drive-fond-2-notification-finances');
  await goTab(c, 'Bord');
  c.check(!!(await noticeText(c)), 'drive-fond 2 : elle est aussi sur le tableau de bord', {});
  const t2 = await txOf(c, d2);
  c.check(t2?.finance?.proofUpload?.state === 'failed' && t2.finance.proofUpload.reason === 'quota' && !t2.finance.proofDocumentId, 'drive-fond 2 : l’état « failed / quota » est écrit sur la dépense (visible depuis tout appareil)', { etat: t2?.finance?.proofUpload });
  await click(c.page, '[data-proof-notice] button', 'Renvoyer le justificatif');
  const fiche = await waitFor(() => c.page.$eval('[role="dialog"]:last-of-type', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null), 'fiche de la dépense', 30000).catch(() => null);
  c.check(!!fiche && fiche.includes(d2) && /Justificatif à renvoyer/.test(fiche) && /Renvoyer maintenant/.test(fiche) && /Abandonner/.test(fiche), 'drive-fond 3 : « Renvoyer le justificatif » ouvre la fiche de CETTE dépense, avec la cause, « Renvoyer maintenant » et « Abandonner »', { fiche: fiche?.slice(0, 400) });
  await shoot(c, 'drive-fond-3-fiche-a-renvoyer');
  c.driveMode.fail = null;
  await click(c.page, '[data-proof-panel] button', 'Renvoyer maintenant');
  const l2 = await waitLinked(c, d2).catch(() => null);
  c.check(!!l2 && uploadsOf(c, f2) === 1, 'drive-fond 3 : après « Renvoyer maintenant », le justificatif est lié, un seul fichier dans le Drive factice', { lien: l2?.finance?.proofDocumentId ?? null, fichiers: uploadsOf(c, f2) });
  const shown = await waitFor(() => click(c.page, '[role="dialog"] button', 'Justificatif', 3000).then(() => true).catch(() => false), 'bouton « Justificatif » de la fiche', 30000).catch(() => false);
  const original = shown ? await c.page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"] iframe, [role="dialog"] img')].length > 0, { timeout: 30000 }).then(() => true).catch(() => false) : false;
  c.check(shown && original, 'drive-fond 3 : la fiche montre « Justificatif » et il s’ouvre', { bouton: shown, original });
  await shoot(c, 'drive-fond-3-justificatif-ouvert');
  c.check(!(await noticeText(c)), 'drive-fond 3 : plus de notification', {});
  await c.page.keyboard.press('Escape'); await sleep(500); await c.page.keyboard.press('Escape'); await sleep(500);

  // 4 : jeton refusé. « Reconnecter Drive » dans la notification ; après la reconnexion (factice) la file repart, la dépense repasse queued puis liée.
  c.driveMode.fail = 'auth';
  const f4 = syntheticFile(c, 'jeton'), d4 = `Essai jeton refusé ${c.width}`;
  await manualWithProof(c, f4, d4);
  const s4 = await saveAndMeasure(c);
  c.check(s4.closed, 'drive-fond 4 : jeton refusé, la feuille se ferme quand même', { alertes: s4.alerts });
  const n4 = await waitNotice(c).catch(() => null);
  const reconnect = await c.page.$$eval('[data-proof-notice] button', nodes => nodes.map(b => b.innerText.trim()));
  c.check(!!n4 && /plus connecté/.test(n4) && reconnect.includes('Reconnecter Drive'), 'drive-fond 4 : motif « auth » : la notification dit que Drive n’est plus connecté et offre « Reconnecter Drive »', { notification: n4, boutons: reconnect });
  await shoot(c, 'drive-fond-4-reconnecter');
  c.driveMode.fail = null;
  const seen = [];
  const poll = setInterval(async () => { const row = await txOf(c, d4).catch(() => null); const state = row?.finance?.proofDocumentId ? 'lié' : row?.finance?.proofUpload?.state; if (state && seen.at(-1) !== state) seen.push(state); }, 150);
  // La fenêtre Google ne s'ouvre pas dans le banc : la reconnexion est factice, par le même appel que le bouton (`requeueAfterReconnect`).
  const requeued = await c.page.evaluate(async () => (await import('/src/services/proofQueue.ts')).requeueAfterReconnect());
  const l4 = await waitLinked(c, d4).catch(() => null);
  clearInterval(poll);
  c.check(requeued === 1 && !!l4 && uploadsOf(c, f4) === 1, 'drive-fond 4 : après la reconnexion factice la file repart et la dépense est liée (un seul fichier)', { relances: requeued, etats: seen, fichiers: uploadsOf(c, f4) });
  c.record('drive-fond-4-etats', seen);
  c.check(!(await noticeText(c)), 'drive-fond 4 : plus de notification', {});

  // 5 : réseau coupé AVANT « Enregistrer » (T5) : la feuille se ferme sans attendre l'accusé, aucune notification, rien au serveur pendant la coupure ;
  // au retour du réseau : une dépense synchronisée, un envoi, un lien.
  const f5 = syntheticFile(c, 'hors-ligne'), d5 = `Essai hors ligne ${c.width}`;
  await manualWithProof(c, f5, d5);
  await c.setOffline(true);
  const s5 = await saveAndMeasure(c, 40000);
  await shoot(c, 'drive-fond-5-hors-ligne-fermee');
  c.check(s5.closed && s5.ms < 5000, 'drive-fond 5 : hors ligne, la feuille se ferme sans attendre l’accusé (moins de 5 s)', { fermee: s5.closed, ms: s5.ms, alertes: s5.alerts });
  await sleep(4000);
  c.check(!(await txOf(c, d5)) && !(await noticeText(c)), 'drive-fond 5 : rien au serveur pendant la coupure, aucune notification', { notification: await noticeText(c) });
  await c.setOffline(false);
  const l5 = await waitLinked(c, d5, 180000).catch(() => null);
  const count5 = (await all(c.db, 'transactions')).filter(row => row.description === d5).length;
  c.check(!!l5 && count5 === 1 && uploadsOf(c, f5) === 1, 'drive-fond 5 : au retour du réseau, une dépense synchronisée, un envoi, un lien', { depenses: count5, fichiers: uploadsOf(c, f5), lien: l5?.finance?.proofDocumentId ?? null });

  // 6 : réseau coupé PENDANT l'envoi (Drive lent), puis rétabli : aucune notification ; l'envoi reprend à `online`.
  c.driveMode.delayMs = 4000;
  const f6 = syntheticFile(c, 'coupure'), d6 = `Essai coupure en cours ${c.width}`;
  await manualWithProof(c, f6, d6);
  const s6 = await saveAndMeasure(c);
  c.check(s6.closed, 'drive-fond 6 : la feuille se ferme', { alertes: s6.alerts });
  await sleep(1500);
  await c.setOffline(true);
  await sleep(8000);
  c.check(!(await noticeText(c)), 'drive-fond 6 : réseau coupé pendant l’envoi, aucune notification', { notification: await noticeText(c) });
  const failedDuring = (await txOf(c, d6))?.finance?.proofUpload?.state === 'failed';
  c.driveMode.delayMs = 0;
  await c.setOffline(false);
  const l6 = await waitLinked(c, d6, 180000).catch(() => null);
  c.check(!!l6 && !failedDuring && uploadsOf(c, f6) === 1, 'drive-fond 6 : l’envoi reprend au retour du réseau, jamais « failed », un seul fichier', { lien: l6?.finance?.proofDocumentId ?? null, failedPendantLaCoupure: failedDuring, fichiers: uploadsOf(c, f6) });

  // 8 + 11 : Drive plein, puis un AUTRE fichier (fileNo+1) ; un fichier trop lourd est refusé clairement, rien en file.
  c.driveMode.fail = 'quota';
  const f8 = syntheticFile(c, 'premier'), f8b = syntheticFile(c, 'autre'), f8big = syntheticFile(c, 'trop-lourd', 5 * 1024 * 1024), d8 = `Essai autre fichier ${c.width}`;
  await manualWithProof(c, f8, d8);
  await saveAndMeasure(c);
  await waitNotice(c).catch(() => null);
  await click(c.page, '[data-proof-notice] button', 'Renvoyer le justificatif');
  await waitFor(() => c.page.$('[role="dialog"] [data-proof-panel]'), 'fiche de la dépense à renvoyer', 30000);
  c.driveMode.fail = null;
  const rowsBefore8 = await queueRows(c);
  const [bigPicker] = await Promise.all([c.page.waitForFileChooser({ timeout: 20000 }), click(c.page, '[data-proof-panel] button', 'Choisir un autre fichier')]);
  await bigPicker.accept([f8big.path]);
  const refusal = await waitFor(() => c.page.$eval('[data-proof-panel] [role="alert"]', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null), 'refus du fichier trop lourd', 20000).catch(() => null);
  const rowsAfter8 = await queueRows(c);
  c.check(!!refusal && /4 Mo/.test(refusal) && JSON.stringify(rowsBefore8) === JSON.stringify(rowsAfter8) && uploadsOf(c, f8big) === 0, 'drive-fond 11 : un fichier de plus de 4 Mo choisi dans la fiche est refusé clairement, rien en file', { refus: refusal, avant: rowsBefore8, apres: rowsAfter8 });
  await shoot(c, 'drive-fond-11-fichier-refuse');
  const [okPicker] = await Promise.all([c.page.waitForFileChooser({ timeout: 20000 }), click(c.page, '[data-proof-panel] button', 'Choisir un autre fichier')]);
  await okPicker.accept([f8b.path]);
  const l8 = await waitLinked(c, d8).catch(() => null);
  c.check(!!l8 && /-2$/.test(l8.finance.proofDocumentId) && uploadsOf(c, f8b) === 1 && uploadsOf(c, f8) === 0, 'drive-fond 8 : après un échec, un autre fichier prend un autre identifiant (fileNo+1) : un seul fichier lié, le premier n’est jamais parti', { lien: l8?.finance?.proofDocumentId ?? null, autre: uploadsOf(c, f8b), premier: uploadsOf(c, f8) });
  await c.page.keyboard.press('Escape'); await sleep(500);

  // 10 + 9 : le renouvellement du jeton est indisponible (functions/unavailable) : pas d'alerte, la file réessaie ; redémarrage avec Firestore injoignable : le job reste.
  await reloadApp(c);
  c.tokenMode = 'unavailable';
  const f10 = syntheticFile(c, 'jeton-indisponible'), d10 = `Essai jeton indisponible ${c.width}`;
  await manualWithProof(c, f10, d10);
  const s10 = await saveAndMeasure(c);
  c.check(s10.closed, 'drive-fond 10 : renouvellement du jeton indisponible, la feuille se ferme', { alertes: s10.alerts });
  await sleep(12000);
  const t10 = await txOf(c, d10);
  c.check(!(await noticeText(c)) && t10?.finance?.proofUpload?.state === 'queued' && !t10.finance.proofDocumentId, 'drive-fond 10 : functions/unavailable : pas d’alerte, la dépense reste « queued » (la file réessaie au réveil suivant)', { notification: await noticeText(c), etat: t10?.finance?.proofUpload });
  const before9 = await queueRows(c);
  c.blockFirestore = true;
  await c.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await sleep(8000);
  const after9 = await queueRows(c);
  c.check(Array.isArray(before9) && before9.some(row => row.hasFile) && JSON.stringify(before9) === JSON.stringify(after9), 'drive-fond 9 : redémarrage avec Firestore injoignable : aucun job effacé (IndexedDB relue)', { avant: before9, apres: after9 });
  c.record('drive-fond-9-appels-drive-pendant-le-blocage', c.drive.requests ?? 0);
  c.blockFirestore = false;
  c.tokenMode = null;
  await reloadApp(c);
  await sleep(35000);
  await c.page.evaluate(() => { window.dispatchEvent(new Event('focus')); });
  const l10 = await waitLinked(c, d10, 180000).catch(() => null);
  c.check(!!l10 && uploadsOf(c, f10) === 1, 'drive-fond 10 : le jeton revient, la file repart au réveil suivant : lié, un seul fichier', { lien: l10?.finance?.proofDocumentId ?? null, fichiers: uploadsOf(c, f10) });
  const rowsAfter = (await all(c.db, 'transactions')).length;
  c.check(rowsAfter - rowsBefore === 7, 'drive-fond : sept dépenses créées, aucune de trop (pas de doublon)', { avant: rowsBefore, apres: rowsAfter });
  resetDriveMode(c);
}

// ───────────────────────────── f4-enrichir : la fiche des articles neufs, en arrière-plan ─────────────────────────────

/** Les réponses rejouées de `lookupIngredient` (format brut d'`aiTask`) : produits synthétiques du banc ; tout autre produit → `found: false`. */
function enrichirAnswer(c, context) {
  const name = String(context.name ?? ''), kind = String(context.kind ?? '');
  c.enrichir.appels.push({ kind, name, manquant: context.manquant, supplier: context.supplier, reference: context.reference });
  if (kind === 'malt' && /ambre/i.test(name))
    // D302 puis D303 : la forme du schéma d'un malt (cinq nombres exigés et nullables) avec ce qu'un malteur publie : une plage de couleur et un
    // extrait, `colorEbc` et `potentialPpg` à `null` (non publiés), un `usage` en texte sans chiffre. Le client en déduit 60 EBC et 36,8 PPG (80 % × 0,46).
    return { ok: true, model: 'rejeu-f4', elapsedMs: 300, data: { found: true, name: 'Ambre 60', source: 'Fiche technique de la Malterie du Banc (banc)', sourceUrl: 'https://malterie-du-banc.test/ambre-60',
      colorEbc: null, colorEbcMin: 55, colorEbcMax: 65, extractPct: 80, potentialPpg: null, usage: 'Malt ambré pour bières ambrées et rousses, jusqu’à une part du mélange.' } };
  return { ok: true, model: 'rejeu-f4', elapsedMs: 300, data: { found: false } };
}
const f4Ligne = (id, description, unit, quantity, more = {}) => ({ id, description, kind: 'ingredient', amount: 10, quantity, unit, stockAction: 'new', equipmentAction: 'none', ...more });
const f4Saisie = (submissionId, lines) => ({ submissionId, date: '01.11.2026', vendor: 'Fournisseur du Banc', invoiceNumber: submissionId, description: 'Achat du banc f4',
  category: 'brassage', amount: lines.length * 10, lines, paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF', duplicateConfirmed: true });
/** « Confirmer » par la fonction de l'App (la feuille fermée : f4 ne tourne qu'ensuite) ; le module est celui que l'App a chargé. */
async function f4Confirmer(c, draft) {
  return c.page.evaluate(async value => {
    try { const m = await import('/src/services/purchaseEntry.ts'); return { ok: true, tx: (await m.savePurchaseWithProofReceipt(value)).transactionId }; }
    catch (error) { return { ok: false, error: String(error?.message ?? error).slice(0, 400) }; }
  }, draft);
}
/**
 * La file de f4 au repos (plus aucun travail `attend`), lue dans la page, PUIS ses écritures confirmées par le serveur émulé. Un travail « fait »
 * a posé son `put` (le cache local de l'app le voit), mais Firestore groupe et envoie l'écriture un peu après : lire le serveur dès que la file
 * est vide donnait un article sans fiche (02.11 : état d'écriture `pending` au contrôle, `confirmed` 6 s plus tard, l'app juste).
 */
async function f4Repos(c, timeout = 90000) {
  return waitFor(() => c.page.evaluate(async () => {
    const f = await import('/src/services/enrichissement.ts');
    await f.runEnrichissement('banc'); await f.enrichissementAuRepos();
    const r = await f.resumeEnrichissement();
    if (r.enAttente !== 0) return false;
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    try { await FirestoreRepo.waitForWrites(30000); } catch { return false; }
    return r;
  }), 'file de f4 au repos, écritures confirmées', timeout);
}
const f4Article = async (c, ref) => (await c.db.doc(`stockItems/${ref}`).get()).data() ?? null;
/** Sonde de diagnostic (02.11) : ce que la page voit (stock local, état d'écriture) contre ce que le serveur émulé porte, à l'instant. */
async function f4Sonde(c, refs) {
  const page = await c.page.evaluate(async liste => {
    const { StorageService } = await import('/src/services/storage.ts');
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    const s = StorageService.getStocks(), tous = [...s.rawMaterials, ...s.cleaning];
    return liste.map(ref => ({ ref, existe: tous.some(i => i.ref === ref), local: tous.find(i => i.ref === ref)?.fiche ?? null, ecriture: FirestoreRepo.documentWriteState('stockItems', ref).status, enLigne: navigator.onLine }));
  }, refs);
  const serveur = await Promise.all(refs.map(async ref => ({ ref, fiche: (await f4Article(c, ref))?.fiche ?? null })));
  return { le: new Date().toISOString(), page, serveur };
}

/**
 * enrichir (f4, PLAN § 9) : une dépense de cinq articles neufs, la feuille fermée. Windsor → catalogue des levures ; Target → sa variété ; l'ambre →
 * rempli en ligne (rejoué) ; la levure du Banc → cherchée, introuvable ; le malt générique sans code → aucun appel. 2 appels `lookupIngredient`.
 * Puis, réseau coupé, la même ambre en « bis » (15 EBC imprimé) : rien n'est écrit hors ligne ; au retour, 0 appel de plus, même `fiche.cle`, son EBC lu.
 */
async function caseEnrichir(c) {
  if (String(process.env.EMU_CASES) !== 'enrichir') throw Error('Le cas enrichir se lance seul (--cases enrichir) : il allume la recherche de fiche simulée.');
  c.enrichir = { appels: [] };
  const erreurs = c.entry.errors.length;
  // Chaque erreur de console avec l'adresse qui l'a causée (le texte de Chrome ne la donne pas) : le banc coupe lui-même le réseau hors localhost.
  const consoleDuCas = [];
  let coupe = false;
  const ecouteConsole = message => {
    if (message.type() !== 'error') return;
    consoleDuCas.push({ texte: message.text().slice(0, 160), url: message.location()?.url ?? '', horsLigne: coupe });
  };
  c.page.on('console', ecouteConsole);
  // Les contrôles de ce cas, comptés pour la ligne « ENRICHIR OK » (un arrêt en route laisse « ENRICHIR » absent : échec).
  const verifier = c.check, resultats = [];
  c.check = (ok, label, data) => { resultats.push(!!ok); verifier(ok, label, data); };
  const pris = new Set(c.plan.seeds.map(seed => fold(seed.name)));
  const generique = ['Maris Otter', 'Roggenmalz', 'Wiener Malz', 'Melanoidin Malz'].find(n => !pris.has(fold(n)));
  // Le houblon semé de doc5 peut déjà porter la variété (02.11 : « Target 11.3% » au stock, refus « nom déjà pris », S6) : une variété absente des semis.
  const houblon = [['Target', 11.3], ['Challenger', 7.5], ['Admiral', 14.8]].find(([v]) => ![...pris].some(n => n.includes(fold(v))));
  const sub = `f4-enrichir-${c.width}-1`;
  const lignes = [
    f4Ligne('e0', generique, 'kg', 25, { stockCategory: 'Malt' }),
    f4Ligne('e1', 'LALLEMAND Windsor 11g', 'Stk', 2, { stockCategory: 'Levure' }),
    f4Ligne('e2', `${houblon[0]} ${houblon[1]}%`, 'g', 100, { stockCategory: 'Houblon' }),
    f4Ligne('e3', 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60' }),
    f4Ligne('e4', 'Levure du Banc 7', 'Stk', 1, { stockCategory: 'Levure' }),
  ];
  const premiere = await f4Confirmer(c, f4Saisie(sub, lignes));
  c.record('enrichir-confirmation-1', premiere);
  if (!premiere.ok) throw Error(`enrichir : la première dépense est refusée : ${premiere.error}`);
  const resume1 = await f4Repos(c);
  const refs1 = [0, 1, 2, 3, 4].map(i => `MP-${sub}-${i}`);
  c.record('enrichir-sonde-1', await f4Sonde(c, refs1));
  const [malt, windsor, target, ambre, banc7] = await Promise.all([0, 1, 2, 3, 4].map(i => f4Article(c, `MP-${sub}-${i}`)));
  const appels1 = c.enrichir.appels.length;
  c.record('enrichir-articles-1', { resume1, appels: c.enrichir.appels, malt: malt?.fiche ?? null, windsor: windsor?.fiche ?? null, target: target?.fiche ?? null, ambre: ambre && { fiche: ambre.fiche, colorEbc: ambre.colorEbc, potentialPpg: ambre.potentialPpg }, banc7: banc7?.fiche ?? null });
  c.check(windsor?.fiche?.id === 'levure:lalbrew-windsor' && windsor.fiche.par === 'catalogue' && !!windsor.yeastLab && windsor.yeastLot === undefined,
    'enrichir : Windsor lié au catalogue des levures (laboratoire rempli, aucun lot)', { fiche: windsor?.fiche, yeastLab: windsor?.yeastLab });
  c.check(String(target?.fiche?.id).includes(fold(houblon[0])) && target?.alphaPct === houblon[1] && !!target?.fiche?.cle, `enrichir : ${houblon[0]} lié à sa variété, α du lot gardé`, { fiche: target?.fiche, alphaPct: target?.alphaPct });
  // D302 : l'EBC et le PPG sont DÉDUITS de la plage (55 à 65 EBC) et de l'extrait (80 %) que la réponse porte : 60 et 36,8, chacun avec sa règle.
  c.check(ambre?.fiche?.par === 'en-ligne' && ambre.colorEbc === 60 && ambre.potentialPpg === 36.8
      && ambre.fiche.remplis?.colorEbc?.niveau === 'repris' && /plage publiée 55 à 65 EBC/.test(ambre.fiche.remplis.colorEbc.deduit ?? '')
      && ambre.fiche.remplis?.potentialPpg?.niveau === 'repris' && /extrait publié 80 % × 0,46/.test(ambre.fiche.remplis.potentialPpg.deduit ?? ''),
    'enrichir : l’ambre rempli en ligne (EBC 60 et PPG 36,8 déduits de la plage et de l’extrait, règle citée, source citée)', { fiche: ambre?.fiche, colorEbc: ambre?.colorEbc, potentialPpg: ambre?.potentialPpg });
  c.check(!banc7?.fiche && banc7?.yeastLab === undefined, 'enrichir : la levure du Banc introuvable : rien d’inventé', { article: banc7 });
  c.check(appels1 === 2 && c.enrichir.appels.every(a => !/montant|CHF|adresse/i.test(JSON.stringify(a))), 'enrichir : 2 appels `lookupIngredient` exactement, sans montant ni adresse', { appels: c.enrichir.appels });
  await click(c.page, 'nav button', 'Stocks');
  await sleep(1200);
  await shoot(c, 'enrichir-stock-1');

  // La même ambre en « bis », réseau coupé : rien d'écrit hors ligne ; au retour, la fiche retenue, aucun appel de plus.
  const sub2 = `f4-enrichir-${c.width}-2`;
  await c.setOffline(true); coupe = true;
  const seconde = await f4Confirmer(c, f4Saisie(sub2, [f4Ligne('e0', 'Malterie du Banc Ambre 60 15 EBC', 'kg', 3, { stockCategory: 'Malt', sourceReference: 'MB-A60' })]));
  c.record('enrichir-confirmation-2', seconde);
  await sleep(4000);
  // L'article existe bien pour la page (la dépense est enregistrée hors ligne) et n'a aucune fiche, ni chez elle ni au serveur : ce n'est pas un vide.
  const horsLigne = await f4Sonde(c, [`MP-${sub2}-0`]);
  c.record('enrichir-hors-ligne', horsLigne);
  c.check(horsLigne.page[0].existe && !horsLigne.page[0].local && !horsLigne.serveur[0].fiche && horsLigne.page[0].enLigne === false,
    'enrichir : hors ligne, l’article est enregistré sans fiche (ni dans l’app ni au serveur)', { sonde: horsLigne });
  await c.setOffline(false); coupe = false;
  const resume2 = await f4Repos(c);
  const bis = await f4Article(c, `MP-${sub2}-0`);
  c.record('enrichir-articles-2', { resume2, bis: bis && { name: bis.name, fiche: bis.fiche, colorEbc: bis.colorEbc, potentialPpg: bis.potentialPpg } });
  // Une clé DÉFINIE des deux côtés (02.11 : `undefined === undefined` laissait passer un bis sans fiche).
  c.check(seconde.ok && !!ambre?.fiche?.cle && bis?.fiche?.cle === ambre.fiche.cle && bis.fiche.id === ambre.fiche.id && bis?.colorEbc === 15 && c.enrichir.appels.length === appels1,
    'enrichir : le « bis » reprend la fiche de l’ambre (même clé, définie), garde son EBC lu, aucun appel de plus', { seconde, bis, cleAmbre: ambre?.fiche?.cle ?? null, appels: c.enrichir.appels.length });
  await reloadApp(c);
  await click(c.page, 'nav button', 'Stocks');
  await sleep(1200);
  await shoot(c, 'enrichir-stock-2');
  c.page.off('console', ecouteConsole);
  c.record('enrichir-console', { toutes: c.entry.errors.slice(erreurs).length, duCas: consoleDuCas });
  // Ce que le banc provoque lui-même est écarté, chaque cause nommée : (1) une adresse hors localhost qu'il bloque (polices, Google Identity, sonde
  // de connexion de Firestore) ; (2) une requête locale coupée pendant la partie hors ligne (`ERR_INTERNET_DISCONNECTED`). Toute autre erreur reste.
  const dehors = e => e.url !== '' && !/^(data|blob):/.test(e.url) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(e.url);
  const parLeBanc = e => dehors(e) || (e.horsLigne && /ERR_INTERNET_DISCONNECTED/.test(e.texte));
  const nouvelles = consoleDuCas.filter(e => !parLeBanc(e));
  c.check(!nouvelles.length, 'enrichir : 0 erreur de console venue de l’app (hors réseau coupé par le banc)', { erreurs: nouvelles, ecartees: consoleDuCas.length - nouvelles.length });
  c.check = verifier;
  console.log(`${resultats.length === 8 && resultats.every(Boolean) ? 'ENRICHIR OK' : 'ENRICHIR KO'} ${c.width} · ${resultats.filter(Boolean).length}/8 · appels ${c.enrichir.appels.length}`);
}

/**
 * Voie n1-nom-fr (choix B du 02.11) : l'article en français, le nom imprimé gardé, toute facture suivante se relie. Le cas sert ses PIÈCES FICTIVES (déclarées telles : fournisseurs et lignes
 * inventés, images empruntées au manifeste, jamais Gemini) : A (« Wiener Malz … », traduit « Malt Viennois … » par `--noms`/le cas), B (« Vienna Malt … », même français, autre fournisseur).
 * Le nom des produits porte une marque de largeur (une base d'émulateur partagée par les deux largeurs). Se lance seul : `--cases nom-b`.
 */
async function caseNomB(c) {
  const marque = c.width <= 500 ? 'Alpha' : 'Beta';
  const imprimeA = `Wiener Malz ${marque}`, imprimeB = `Vienna Malt ${marque}`, francais = `Malt Viennois ${marque}`;
  c.nomsFr.set(imprimeA, francais); c.nomsFr.set(imprimeB, francais); // fictif : le français rejoué de la pièce réelle est celui de « Wiener Malz » (results.json) ; ici la même traduction des deux noms
  const modele = structuredClone((c.docs.doc14 ?? Object.values(c.docs)[0]).result);
  // Deux images à elles (jamais celles des pièces du manifeste : leur empreinte serait « déjà enregistrée » pour les cas suivants, et inversement) : deux captures de maquette du dossier de la mission.
  const emprunt = ['work/missions/2026-10-31-ecran-depense/choix-nom/img/a-depense.png', 'work/missions/2026-10-31-ecran-depense/choix-nom/img/a-stock.png'];
  const piece = (id, image, fournisseur, numero, date, nom, quantite, prix) => {
    const montant = Math.round(quantite * prix * 100) / 100;
    const result = { ...modele, vendor: fournisseur, invoiceNumber: numero, date, currency: 'CHF', amountTTC: montant, amountHT: null, tvaRate: null, tvaAmount: null, description: 'Malts fictifs', issues: [], review: undefined,
      items: [{ id: 'line-1', name: nom, variant: '', kind: 'stock', quantity: quantite, unit: 'Kg', price: prix, amountTTC: montant, stockCategory: 'malt', reference: '', evidence: '', ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null }] };
    const chemin = join(ROOT, image), bytes = readFileSync(chemin);
    c.docs[id] = { id, image: chemin, fileName: basename(chemin), bytes, sha256: sha(bytes), result, truth: null, mimeType: 'image/png' };
  };
  piece('nomb-a', emprunt[0], `Malzhaus Fiktiv ${marque}`, `NOMB-A-${marque}`, '10.09.2026', imprimeA, 10, 1.5);
  piece('nomb-b', emprunt[1], `Northfield Fiktiv ${marque}`, `NOMB-B-${marque}`, '12.09.2026', imprimeB, 25, 1.4);
  const champNom = `${sheet} [aria-label="Nom de l’article, ligne 1"]`;
  const valeurNom = () => c.page.$eval(champNom, e => e.value).catch(() => null);
  const articles = async () => (await all(c.db, 'stockItems')).filter(a => !a.deleted);
  const avant = (await articles()).length;

  // 1. La pièce A : le nom imprimé à la lecture, le français à son arrivée (sans l'attendre), « Confirmer » → l'article porte le français et garde l'imprimé.
  await scan(c, 'nomb-a', { chooser: await openInvoiceEntry(c), delayMs: 800 });
  const lu = await valeurNom();
  await waitFor(async () => (await valeurNom()) === francais, `nomb : le champ « article » dit « ${francais} »`, 20000).catch(() => {});
  const apres = await valeurNom();
  c.check(apres === francais, 'nom-b : le nouvel article se nomme en français au plateau (N1)', { auRepos: lu, apresArrivee: apres });
  await shoot(c, 'nomb-depense-a');
  // Le plateau de la première facture, ouvert : « article « … » · nouvel article » (le champ du nom, en français).
  await click(c.page, `${sheet} [data-dp-ligne="line-1"] summary`, undefined, 10000).catch(() => {});
  await sleep(400);
  await shoot(c, 'nomb-plateau-a', `${sheet} [data-dp-ligne="line-1"]`);
  const sortieA = await confirmSheet(c);
  c.check(sortieA === 'fermée', 'nom-b : « Confirmer » de la pièce A enregistre', { sortieA });
  const articleA = await waitFor(async () => (await articles()).find(a => a.name === francais) ?? false, 'nom-b : l’article de la pièce A est au stock', 30000).catch(() => null);
  c.record('nomb-article-a', articleA);
  c.check(!!articleA && JSON.stringify(articleA.nomsFacture) === JSON.stringify([imprimeA]), 'nom-b : l’article porte le français et garde le nom imprimé lu (N1, N2)', { name: articleA?.name, nomsFacture: articleA?.nomsFacture });

  // 2. La fiche de l'article : « Sur la facture : … » sous « Nom » (N5).
  await goTab(c, 'Stocks');
  await click(c.page, 'button', `Ouvrir ${francais}`);
  const vu = await waitFor(() => c.page.evaluate(() => [...document.querySelectorAll('[data-stock-noms-facture]')].map(e => e.textContent.replace(/\s+/g, ' ').trim())[0] ?? false), 'nom-b : « Sur la facture » à la fiche', 15000).catch(() => null);
  c.check(vu === `Sur la facture : ${imprimeA}`, 'nom-b : la fiche dit « Sur la facture : … » sous « Nom » (N5)', { vu });
  await shoot(c, 'nomb-fiche');
  await c.page.keyboard.press('Escape'); await sleep(500);

  // 3. La pièce B (autre langue, autre fournisseur) : la ligne se relie à l'article (proposition jaune « Garder »), aucun nouvel article ; « Confirmer » apprend « Vienna Malt … » (N3, N4).
  const avantB = (await articles()).length;
  await scan(c, 'nomb-b', { chooser: await openInvoiceEntry(c), delayMs: 800 });
  // D295 : la facture suivante se relie toute seule (cube coché, « relié à « … », nom déjà au stock », « 1 relié »), sans « Garder » ni jaune (b-suivantes.png).
  const dit = `relié à « ${francais} », nom déjà au stock`;
  const relie = await waitFor(() => c.page.evaluate(texte => (document.querySelector('[role="dialog"]')?.textContent ?? '').replace(/\s+/g, ' ').includes(texte), dit), `nom-b : « ${dit} »`, 20000).catch(() => false);
  const sansGarder = !(await c.page.$(`${sheet} [aria-label^="Garder l’article"]`));
  const recap = await c.page.evaluate(() => /1\s*relié/.test(document.querySelector('[role="dialog"]')?.textContent ?? ''));
  c.check(relie && sansGarder && recap, 'nom-b : la facture suivante se relie toute seule à l’article, sans « Garder » (N3, D295)', { dit, relie, sansGarder, recap });
  await shoot(c, 'nomb-depense-b');
  const sortieB = await confirmSheet(c);
  const apresB = await waitFor(async () => { const a = (await articles()).find(x => x.name === francais); return a && (a.nomsFacture ?? []).includes(imprimeB) ? a : false; }, 'nom-b : « Vienna Malt » appris', 30000).catch(() => null);
  const comptes = (await articles()).length;
  c.record('nomb-article-b', apresB);
  c.check(sortieB === 'fermée' && comptes === avantB, 'nom-b : la pièce B n’ajoute aucun article (une fiche par produit)', { sortieB, avantB, comptes, avantA: avant });
  c.check(!!apresB && apresB.nomsFacture.length === 2 && apresB.nomsFacture.includes(imprimeA) && apresB.nomsFacture.includes(imprimeB) && apresB.currentStock === 35,
    'nom-b : le nom imprimé de B s’ajoute (une fois), le stock reçoit les 25 Kg (N4)', { nomsFacture: apresB?.nomsFacture, currentStock: apresB?.currentStock });
  await goTab(c, 'Stocks');
  await shoot(c, 'nomb-stock');
  // La fiche après la seconde facture : les deux noms imprimés (N5).
  await click(c.page, 'button', `Ouvrir ${francais}`);
  const deux = await waitFor(() => c.page.evaluate(() => [...document.querySelectorAll('[data-stock-noms-facture]')].map(e => e.textContent.replace(/\s+/g, ' ').trim())[0] ?? false), 'nom-b : « Sur la facture » à la fiche (2 noms)', 15000).catch(() => null);
  c.check(deux === `Sur la facture : ${imprimeA} · ${imprimeB}`, 'nom-b : la fiche, après la seconde facture, dit les deux noms imprimés (N5)', { deux });
  await shoot(c, 'nomb-fiche-2');
  await c.page.keyboard.press('Escape'); await sleep(400);
}

/**
 * Voie n2-pages (son choix D291, forme 3) : une dépense de TROIS pages. Trois images FICTIVES (dessinées par un canvas dans la page, jamais une pièce à lui ; écrites sous `os.tmpdir()`), la page 2
 * est une photo PAYSAGE à tag EXIF d'orientation 6 (un téléphone tenu en travers) : le PDF doit la redresser (sa MediaBox est portrait). Geste : « Plusieurs » (page 1), deux « + page » (pages 2 et 3),
 * « Lire 3 pages », pile « 3 », « Confirmer », UN seul PDF de trois pages au Drive émulé.
 * Ce cas prouve l'écran, le PDF et le Drive ; il ne prouve PAS `functions/src/ai.ts` (la lecture est rejouée dans la page) : l'envoi des N parts au modèle est prouvé par les tests unitaires du serveur.
 * Se lance seul : `--cases pages`.
 */
async function casePages(c) {
  const dossier = mkdtempSync(join(tmpdir(), 'pages-fictives-'));
  const dessiner = (lourd) => c.page.evaluate(async (lourdQ) => {
    const sortie = [];
    for (const [n, w, h] of [[1, 600, 800], [2, 800, 600], [3, 600, 800]]) {
      const cv = document.createElement('canvas'); cv.width = lourdQ ? w * 3 : w; cv.height = lourdQ ? h * 3 : h;
      const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#222'; g.font = `bold ${28 * (lourdQ ? 3 : 1)}px sans-serif`;
      g.fillText(`Malzhaus Fiktiv — page ${n}/3`, 30, 60 * (lourdQ ? 3 : 1));
      for (let i = 0; i < 8; i++) g.fillText(`Article fictif ${n}.${i + 1}   ${(i + 1) * 1.5}`, 30, (140 + i * 50) * (lourdQ ? 3 : 1));
      if (lourdQ) { const d = g.getImageData(0, 0, cv.width, cv.height); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 60 | 0; d.data[i] ^= v; d.data[i + 1] ^= v; d.data[i + 2] ^= v; } g.putImageData(d, 0, 0); }
      sortie.push(cv.toDataURL('image/jpeg', lourdQ ? 0.55 : 0.92).split(',')[1]);
    }
    return sortie;
  }, lourd);
  const avecExif = (jpeg, orientation) => { // APP1 « Exif » minimal, juste après le SOI
    const app1 = Buffer.from([0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0]);
    return Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]);
  };
  const fabriquer = async (lourd) => {
    const bruts = (await dessiner(lourd)).map(b => Buffer.from(b, 'base64'));
    bruts[1] = avecExif(bruts[1], 6);
    return bruts.map((b, i) => { const chemin = join(dossier, `${lourd ? 'lourde' : 'page'}-${i + 1}.jpg`); writeFileSync(chemin, b); return { chemin, octets: b, sha256: sha(b) }; });
  };
  const empreinteDesPages = pages => createHash('sha256').update(Buffer.concat(pages.map(p => createHash('sha256').update(p.octets).digest()))).digest('hex');
  const modele = structuredClone((c.docs.doc14 ?? Object.values(c.docs)[0]).result);
  c.docs['pages-fictif'] = { id: 'pages-fictif', image: '', fileName: 'pages', bytes: Buffer.alloc(0), sha256: 'pages', truth: null, mimeType: 'image/jpeg',
    result: { ...modele, vendor: 'Malzhaus Fiktiv Pages', invoiceNumber: 'PAGES-3P', date: '14.10.2026', currency: 'CHF', amountTTC: 25, amountHT: null, tvaRate: null, tvaAmount: null, description: 'Pages fictives',
      issues: [], points: undefined, controls: undefined, review: { status: 'checked', findings: [], readers: 2 },
      items: [{ id: 'line-1', name: 'Wiener Malz fictif', variant: '', kind: 'stock', quantity: 10, unit: 'Kg', price: 1.5, amountTTC: 15, stockCategory: 'malt', reference: '', evidence: '', ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null },
        { id: 'line-2', name: 'Levure fictive', variant: '', kind: 'stock', quantity: 1, unit: 'sachet', price: 10, amountTTC: 10, stockCategory: 'levure', reference: '', evidence: '', ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null }] } };
  const nb = () => c.page.$$eval(`${sheet} [data-dp="rangee-pages"] [data-dp="page"]`, els => els.length).catch(() => 0);
  const frise = () => c.page.$eval(`${sheet} [data-dp="frise"]`, e => e.textContent).catch(() => null);
  const choisir = async (texte, fichier) => {
    const [picker] = await Promise.all([c.page.waitForFileChooser({ timeout: 20000 }), click(c.page, `${sheet} button`, texte)]);
    await picker.accept([fichier]);
  };
  const monter = async (pages, etiquette) => {
    c.pagesAttendues = pages.map(p => p.sha256);
    c.ai = { mode: 'replay', doc: 'pages-fictif', delayMs: etiquette === 'principal' ? 1500 : 0 };
    const premier = await openInvoiceEntry(c); (await premier)?.cancel?.();
    if (etiquette === 'principal') await shoot(c, 'pages-entree'); // l'entrée « Un document | Plusieurs », avant la première page
    await choisir('Plusieurs', pages[0].chemin);
    await waitFor(async () => (await nb()) === 1, 'première page de la rangée');
    for (const [i, p] of pages.slice(1).entries()) { await choisir('+ page', p.chemin); await waitFor(async () => (await nb()) === i + 2, `page ${i + 2} de la rangée`); }
  };
  const attendreLecture = () => c.page.waitForFunction(() => !document.body.innerText.includes('Lecture et vérification') && !document.body.innerText.includes('Préparation des pages')
    && (document.querySelector('section[aria-label="Vérification du justificatif"]') || document.querySelector('[role="dialog"] [role="alert"]') || document.querySelector('#purchase-total')), { timeout: 60000 });

  // 1. La mesure : trois pages lourdes (~3 Mo chacune), CPU ralenti ×4 ; l'assemblage du PDF doit rester court. La dépense n'est pas confirmée.
  const lourdes = await fabriquer(true);
  c.record('pages-lourdes-octets', lourdes.map(p => p.octets.length));
  await monter(lourdes, 'mesure');
  const cdp = await c.page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const debut = Date.now();
  await click(c.page, `${sheet} button`, 'Lire 3 pages');
  await c.page.waitForFunction(() => document.body.innerText.includes('Préparation des pages'), { timeout: 5000 }).catch(() => null);
  await c.page.waitForFunction(() => !document.body.innerText.includes('Préparation des pages'), { timeout: 120000 });
  c.measure('assemblage-pages-cpu-x4-ms', Date.now() - debut);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await attendreLecture(); await sleep(600);
  await closeSheet(c);
  const avantEnvois = c.drive.uploads.length;

  // 2. Le parcours : trois pages fictives légères, « Confirmer », un seul PDF au Drive.
  const pages = await fabriquer(false), hash = empreinteDesPages(pages);
  const avant = await dbSnapshot(c.db);
  await monter(pages, 'principal');
  await shoot(c, 'pages-rangee-3');
  // La frise au repos (maquettes 3 et 4) : la frise doit exister ; « 3 pages ✓ » plein, jamais « envoi », « lecture » ni pointillé.
  const friseRepos = await frise();
  const enCoursAuRepos = await c.page.$(`${sheet} [data-dp="frise"] .dp-p3c-frise-cours`);
  c.check(friseRepos !== null && friseRepos.includes('3 pages ✓') && !friseRepos.includes('envoi') && !enCoursAuRepos, 'pages : la frise au repos dit « 3 pages ✓ » (jamais « envoi »), lecture et vérification grises', { frise: friseRepos });
  await click(c.page, `${sheet} button`, 'Lire 3 pages');
  // Après « Lire » : « 3 pages ✓ » reste, « lecture » passe en gras et pointillé (dès l'assemblage du PDF).
  const lectureVue = await c.page.waitForFunction(sel => { const e = document.querySelector(sel); return !!e && e.textContent.includes('3 pages ✓') && !!e.querySelector('.dp-p3c-frise-cours'); }, { timeout: 20000, polling: 'mutation' },
    `${sheet} [data-dp="frise"]`).then(() => true, () => false);
  c.check(lectureVue, 'pages : après « Lire », « 3 pages ✓ » reste et « lecture » est en cours (pointillé)');
  await shoot(c, 'pages-lecture');
  await attendreLecture(); await sleep(600);
  const appel = c.calls.ai.at(-1);
  c.check(appel?.expectedFiles === true && !appel.file, 'pages : une seule lecture, les trois pages dans l\'ordre (empreinte de chacune), aucun fichier seul', { files: appel?.files?.length, expected: appel?.expectedFiles });
  const lecture = await readSheet(c);
  c.record('pages-revue', lecture);
  await shoot(c, 'pages-lue-repos');
  const pile = await c.page.$eval(`${sheet} header button[aria-label^="Justificatif, 3 pages"]`, e => e.textContent).catch(() => null);
  c.check(pile?.includes('3'), 'pages : la pile « 3 » remplace l\'icône du document dans l\'en-tête', { pile });
  const preuve = await c.page.$eval(`${sheet} section[aria-label="Preuve de la lecture"]`, e => e.innerText.replace(/\s+/g, ' ')).catch(() => '');
  c.check(/3 pages lues/.test(preuve) && !/Lectures/.test(preuve), 'pages : la preuve dit « ✓ 3 pages lues » (lectures d\'accord, sa maquette 6)', { preuve });
  // Aucune rangée de la preuve ne sort de sa case (« Qté × prix non contrôlé » débordait à 390 et à 1280).
  const debordent = await c.page.$$eval(`${sheet} [data-dp="preuve"] button`, els => els.map(e => ({ texte: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), scrollWidth: e.scrollWidth, clientWidth: e.clientWidth })).filter(x => x.scrollWidth > x.clientWidth + 1)).catch(() => null);
  c.check(Array.isArray(debordent) && debordent.length === 0, 'pages : aucune rangée de la preuve ne sort de sa case (scrollWidth <= clientWidth + 1)', { debordent });
  await click(c.page, `${sheet} header button[aria-label^="Justificatif, 3 pages"]`);
  await sleep(400);
  const vignettes = await c.page.$$eval(`${sheet} [data-dp="pages-panneau"] [data-dp="vignette"]`, els => els.length).catch(() => 0);
  c.check(vignettes === 3, 'pages : le toucher de la pile ouvre le panneau (3 vignettes et « Changer »)', { vignettes });
  await shoot(c, 'pages-panneau');
  await click(c.page, `${sheet} header button[aria-label^="Justificatif, 3 pages"]`);
  const outcome = await confirmSheet(c, 60000);
  c.record('pages-confirmation', outcome);
  if (outcome !== 'fermée') await shoot(c, 'pages-confirmation-refusee');
  const mine = async () => (await all(c.db, 'transactions')).find(row => row.finance?.sourceDocumentHash === hash);
  await waitFor(mine, 'la dépense des trois pages', 60000).catch(() => null);
  await waitFor(async () => { const row = await mine(); return !row || !row.finance?.proofUpload || !!row.finance.proofDocumentId; }, 'le lien du justificatif des trois pages', 120000).catch(() => null);
  const tx = await mine();
  const proof = tx?.finance?.proofDocumentId ? (await c.db.doc(`financeDocuments/${tx.finance.proofDocumentId}`).get()).data() : null;
  const fichier = proof?.driveFileId ? c.drive.files.get(proof.driveFileId) : null;
  const pdf = fichier ? fichier.bytes.toString('latin1') : '';
  const nbPagesPdf = (pdf.match(/\/Type \/Page\b/g) ?? []).length;
  const boites = [...pdf.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map(m => [Number(m[1]), Number(m[2])]);
  c.record('pages-ecritures', businessWrites(dbWrites(avant, await dbSnapshot(c.db))));
  c.check(outcome === 'fermée' && !!tx && tx.finance.sourceDocumentHash === hash, 'pages : « Confirmer » enregistre la dépense, son empreinte est celle des trois pages', { outcome, tx: !!tx });
  c.check(c.drive.uploads.length - avantEnvois === 1 && fichier?.mimeType === 'application/pdf' && nbPagesPdf === 3, 'pages : UN seul justificatif au Drive, un PDF de trois pages', { envois: c.drive.uploads.length - avantEnvois, type: fichier?.mimeType, pages: nbPagesPdf });
  c.check(proof && proof.sha256 === sha(fichier.bytes) && proof.bytes === fichier.bytes.length && fichier.bytes.length <= 4 * 1024 * 1024, 'pages : le PDF est rangé avec son empreinte, sous 4 Mo', { octets: fichier?.bytes.length });
  c.check(boites.length === 3 && boites[1][0] < boites[1][1], 'pages : la photo paysage à tag EXIF 6 est redressée dans le PDF (page 2 en portrait)', { boites });
  c.record('pages-pdf-octets', fichier?.bytes.length ?? null);
}

const CASES = { pages: casePages, 'nom-b': caseNomB, 'drive-fond': caseDriveFond, doc14: caseDoc14, doublon: caseDoublon, etats: caseEtats, doc5: caseDoc5, finances: caseFinances, doc6: caseDoc6, 'autre-numero': caseAutreNumero, doc1: caseDoc1, doc4: caseDoc4,
  'hors-ligne': caseHorsLigne, doc3: caseDoc3, doc2: caseDoc2, rattacher: caseRattacher, minuscules: caseMinuscules, enrichir: caseEnrichir };

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
  const nomsFr = loadNomsRejoues(process.env.EMU_NOMS);
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
    VITE_COMPANY_NPA: '1700 Fribourg', VITE_COMPANY_IBAN: '', VITE_COMPANY_UID: '',
    // f4-enrichir : la recherche de fiche n'est allumée (sur les émulateurs) que pour le cas `enrichir` lancé seul ; les autres cas ne changent pas.
    ...(cases.join(',') === 'enrichir' ? { VITE_ENRICHISSEMENT_IA: 'emulateur' } : {}) };
  const vite = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort',
    ...(process.env.EMU_VITE_CONFIG ? ['--config', process.env.EMU_VITE_CONFIG] : [])],
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
      const c = { width, base, out, db, docs, nomsFr, entry, downloads, shotIndex: 0, plan, page: null,
        ai: { mode: 'replay', doc: null, delayMs: 0 }, calls: { ai: [], drive: [] }, driveMode: { delayMs: 0, fail: null }, tokenMode: null,
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
          if (c.blockFirestore && new URL(url).port === String(EMULATOR_PORTS.firestore)) return request.abort();
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
          if (request.kind === 'drive') { if (c.driveMode.delayMs) await sleep(c.driveMode.delayMs); return driveAnswer(c, request); }
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
