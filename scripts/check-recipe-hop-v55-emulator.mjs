#!/usr/bin/env node
/**
 * Parcours « enregistrer / rouvrir / corriger » de l'étape Houblons V5.5 du vrai créateur, sur émulateurs Firebase.
 *
 * Vraie App en dev (Vite) branchée sur les émulateurs Auth, Firestore et Functions de ce dépôt, projet `demo-wiz`,
 * utilisateur émulé, vraies règles Firestore générées depuis `firestore.rules.template` dans un dossier temporaire
 * (jamais à la racine du dépôt), Functions compilées dans ce même dossier. Chrome bloque tout hôte hors
 * 127.0.0.1/localhost ; aucune clé Gemini n'est transmise. `firebase.json`, `.firebaserc`, `firestore.rules` et
 * `firestore.indexes.json` sont vérifiés inchangés.
 *
 * Cas (issues) : persistance (#28, #30, #31), alpha (#32), brouillon-futur (#32), programme-froid (#29, #40, #48, #64),
 * brouillon-fraicheur (#97).
 * Un lot suivant ajoute ses cas dans CASES (même contexte `c`, mêmes aides) et les lance avec `--cases`. Chaque jeu finit
 * par la contre-épreuve des règles, même si aucun cas n'a créé de recette.
 *
 * Usage, depuis la racine du dépôt :
 *   node scripts/check-recipe-hop-v55-emulator.mjs --out <dossier-preuves> [--widths 390,1280]
 *        [--cases persistance,alpha,brouillon-futur,programme-froid,brouillon-fraicheur] [--lock <dossier-verrou>] [--port 5174] [--keep-tmp]
 *        [--cpu-throttle 6]   (processeur ralenti ×N dans Chrome, pour un téléphone lent)
 * Le mode `--inner` est lancé par `firebase emulators:exec`, jamais à la main.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, rmdirSync, symlinkSync, writeFileSync
} from 'node:fs';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SELF = fileURLToPath(import.meta.url);
const PROJECT = 'demo-wiz';
const USER = { sub: 'brasseur-demo-wiz', email: 'brasseur@demo-wiz.test' };
const INTRUDER = { sub: 'intrus-demo-wiz', email: 'intrus@demo-wiz.test' };
const PROTECTED = ['firebase.json', '.firebaserc', 'firestore.rules', 'firestore.indexes.json'];
const EMULATOR_PORTS = { auth: 9099, firestore: 8080, functions: 5001, hub: 4400, logging: 4500 };
const JAVA_HOME = process.env.EMU_JAVA_HOME || 'C:\\Program Files\\Microsoft\\jdk-21.0.12.101-hotspot';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const NO_ALPHA_STOCK = { id: 'emu-houblon-sans-alpha', name: 'Houblon EMU sans alpha' };
/**
 * Emulator-only rewrites of App modules served to Chrome (never written to a file). The Firestore emulator refuses
 * `orderBy(documentId(), 'desc')` (« Firestore does not support descending key scans »), so the App's audit-journal
 * listener would block the whole synchronisation; the journal is read in ascending order instead. Each rewrite must
 * match exactly `expected` times, otherwise the bench check fails and the run exits 1: the App changed and the bench
 * must be revisited.
 */
const EMULATOR_REWRITES = [{ path: '/src/services/firestoreRepo.ts', expected: 2,
  pattern: /orderBy\(\s*documentId\(\)\s*,\s*(["'])desc\1\s*\)/g, replacement: 'orderBy(documentId())' }];
const sleep = ms => new Promise(done => setTimeout(done, ms));

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index > 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : fallback;
}
const flag = name => process.argv.includes(`--${name}`);
const sha = text => createHash('sha256').update(text).digest('hex');
/** Key-order independent JSON, for comparing Firestore documents. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const portOpen = port => new Promise(done => {
  const socket = createConnection({ host: '127.0.0.1', port });
  socket.once('connect', () => { socket.destroy(); done(true); });
  socket.once('error', () => done(false));
});
function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else try { process.kill(-pid, 'SIGKILL'); } catch { /* already gone */ }
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
  if (!(template.includes('function preservesHopCatalogueMeta(before, after)')
    && template.includes('preservesHopCatalogueMeta(resource.data, request.resource.data)')
    && template.includes("resource.data.get('catalogueMeta', null) == null"))) throw Error('Garde catalogueMeta absente du gabarit.');
  const rules = template.replace(token, `        '${USER.email}'`);
  writeFileSync(join(tmp, 'firestore.rules'), rules);
  return { path: join(tmp, 'firestore.rules'), sha: sha(rules), templateSha: sha(template) };
}

/** Functions of this repository compiled into the temporary project: tsc plus the five shared bundles of the build. */
async function buildFunctions(tmp, log) {
  const target = join(tmp, 'functions'), lib = join(target, 'lib');
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
  // Same resolution as scripts/build-brewerHopAdviceSemanticSource4Portable.mjs, without its manifest at the repository root.
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
  copyFileSync(join(ROOT, 'functions/package.json'), join(target, 'package.json'));
  symlinkSync(join(ROOT, 'functions/node_modules'), join(target, 'node_modules'), 'junction');
  // Emulated account only; no GEMINI_API_KEY: any model call fails closed. A fake Drive configuration keeps the
  // emulator from asking Secret Manager for DRIVE_OAUTH_CONFIG when the App reads the Drive status.
  writeFileSync(join(target, '.env'), `AUTHORIZED_ACCOUNTS=${USER.email}\n`);
  writeFileSync(join(target, '.secret.local'), `DRIVE_OAUTH_CONFIG=${JSON.stringify({ clientId: `${PROJECT}-drive-factice`,
    clientSecret: 'factice', encryptionKey: '0'.repeat(64) })}\n`);
}

async function outer() {
  // Outside the repository by default, so evidence never lands untracked at its root.
  const out = resolve(option('out', join(tmpdir(), 'affinee-hop-v55-emulator-evidence')));
  mkdirSync(out, { recursive: true });
  const logFile = join(out, 'orchestration.log');
  const log = text => { appendFileSync(logFile, `[${new Date().toISOString()}] ${text}\n`); console.log(text); };
  const lock = option('lock');
  const before = protectedState();
  for (const port of [...Object.values(EMULATOR_PORTS), Number(option('port', '5174'))])
    if (await portOpen(port)) throw Error(`Port ${port} déjà occupé : un autre émulateur ou serveur tourne. Rien n'est lancé.`);
  if (lock) { mkdirSync(lock); log(`verrou pris : ${lock}`); }
  const tmp = mkdtempSync(join(tmpdir(), 'affinee-hop-v55-emu-'));
  let code = 1;
  try {
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
      EMU_OUT: out, EMU_TMP: tmp, EMU_WIDTHS: option('widths', '390,1280'), EMU_CASES: option('cases', Object.keys(CASES).join(',')),
      EMU_PORT: option('port', '5174'), EMU_RULES_SHA: rules.sha,
      EMU_CPU_THROTTLE: option('cpu-throttle', '1') };
    for (const secret of ['GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_API_KEY']) delete env[secret];
    const inner = `"${process.execPath}" "${SELF}" --inner`;
    const cli = join(ROOT, 'node_modules/firebase-tools/lib/bin/firebase.js');
    log(`emulators:exec --project ${PROJECT} --config ${join(tmp, 'firebase.json')}`);
    code = await new Promise(done => {
      const child = spawn(process.execPath, [cli, 'emulators:exec', '--project', PROJECT, '--config', join(tmp, 'firebase.json'),
        '--only', 'auth,firestore,functions', inner], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
      log(`firebase emulators:exec pid ${child.pid}`);
      const sink = chunk => appendFileSync(join(out, 'emulators.log'), chunk);
      child.stdout.on('data', chunk => { sink(chunk); process.stdout.write(chunk); });
      child.stderr.on('data', chunk => { sink(chunk); process.stderr.write(chunk); });
      child.on('exit', status => done(status ?? 1));
    });
    log(`emulators:exec terminé : exit ${code}`);
  } finally {
    await sleep(1500);
    const busy = [];
    for (const port of [...Object.values(EMULATOR_PORTS), Number(option('port', '5174'))]) if (await portOpen(port)) busy.push(port);
    log(busy.length ? `PORTS ENCORE OCCUPÉS : ${busy.join(', ')}` : 'ports émulateurs et serveur libérés');
    if (busy.length) code = code || 1;
    const after = protectedState();
    const unchanged = canonical(before) === canonical(after);
    log(`fichiers protégés ${unchanged ? 'inchangés' : 'MODIFIÉS'} : ${JSON.stringify(after.map(row => [row.path, row.exists, row.sha?.slice(0, 12) ?? null, row.status]))}`);
    if (!unchanged) code = code || 1;
    if (!flag('keep-tmp')) rmSync(tmp, { recursive: true, force: true });
    if (lock) { rmdirSync(lock); log(`verrou libéré : ${lock}`); }
  }
  log(code === 0 ? 'EMU-RECIPE-HOP-V55-OK' : `ÉCHEC (exit ${code})`);
  process.exit(code);
}

// ───────────────────────────── Mode interne : vraie App, Chrome, Admin SDK ─────────────────────────────

/** Clicks the first visible match, waiting for lazily loaded panels (Suspense chunks are slow on a cold dev server). */
async function click(page, selector, text, timeout = 30000) {
  const start = Date.now();
  for (;;) {
    for (const handle of await page.$$(selector)) {
      const ok = await handle.evaluate((e, wanted) => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'
        && (!wanted || (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ') === wanted), text ?? null);
      if (ok) { await handle.evaluate(e => e.scrollIntoView({ block: 'center' })); await handle.click(); return handle; }
    }
    if (Date.now() - start > timeout) throw Error(`Aucun élément visible : ${selector}${text ? ` « ${text} »` : ''}`);
    await sleep(400);
  }
}
const waitText = (page, text, timeout = 30000) => page.waitForFunction(t => document.body.innerText.includes(t), { timeout }, text);
const textOf = (page, selector) => page.$eval(selector, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
const statuses = c => c.page.$$eval('.recipe-wizard [role="status"], .recipe-wizard [role="alert"]', nodes => nodes
  .filter(e => e.getClientRects().length).map(e => `${e.getAttribute('role')}: ${e.innerText.replace(/\s+/g, ' ').trim().slice(0, 200)}`)).catch(() => []);

async function combobox(page, selector, text, match) {
  await page.waitForSelector(selector, { visible: true });
  if (await page.$eval(selector, e => e.readOnly)) { await page.click(selector); await page.click(selector); } else await page.click(selector);
  await page.type(selector, text);
  await page.waitForSelector('li[role="option"]', { visible: true, timeout: 20000 });
  for (const option of await page.$$('li[role="option"]')) {
    const label = await option.evaluate(e => e.innerText.replace(/\s+/g, ' ').trim());
    if (!match || match.test(label)) { await option.click(); return label; }
  }
  throw Error(`Aucune option ${match} pour « ${text} ».`);
}

/** Scroll the target under the sticky bars, then capture the viewport. */
async function shoot(c, label, selector, block = 'start') {
  if (c.shots === false) return null;
  if (selector) await c.page.evaluate((sel, where) => {
    const el = document.querySelector(sel); if (!el) return;
    el.scrollIntoView({ block: where, inline: 'nearest' });
    let node = el.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) { if (where === 'start') node.scrollBy(0, -48); break; }
      node = node.parentElement;
    }
  }, selector, block);
  await sleep(500);
  const name = `${c.width}-${label}.png`;
  await c.page.screenshot({ path: join(c.out, name) });
  c.entry.captures.push(name);
  return name;
}

async function gotoStep(c, label) {
  await click(c.page, `.recipe-wizard nav[aria-label="Étapes"] button[aria-label="${label}"]`);
  await sleep(400);
}
async function waitWorkshop(c) {
  await c.page.waitForSelector('[data-testid="recipe-hop-v55"] [data-testid="hop-v55"]', { timeout: 90000 });
  await sleep(1500);
}
async function scrollToTop(c) {
  await c.page.evaluate(() => {
    const start = document.querySelector('[aria-label="Bilan de houblonnage de la recette"]') ?? document.querySelector('#recipe-hop-lines');
    let node = start?.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) { node.scrollTo(0, 0); return; }
      node = node.parentElement;
    }
  });
  await sleep(300);
}
async function openLines(c) {
  const open = await c.page.$eval('#recipe-hop-lines', e => e.open).catch(() => false);
  if (!open) await click(c.page, '#recipe-hop-lines > summary');
  await sleep(300);
}
async function addHop(c, { stage, query, match, grams, index }) {
  await click(c.page, '.recipe-wizard .hop-stage-tabs button', stage);
  await combobox(c.page, '.recipe-wizard [aria-label^="Ajouter un houblon"]', query, match);
  await c.page.waitForSelector(`.recipe-wizard #wz-hop-${index}`, { visible: true });
  await c.page.$eval(`.recipe-wizard #wz-hop-${index}`, e => e.select());
  await c.page.type(`.recipe-wizard #wz-hop-${index}`, grams);
  await c.page.keyboard.press('Tab');
  await sleep(400);
}
async function typeInto(c, selector, value) {
  await c.page.$eval(selector, e => { e.scrollIntoView({ block: 'center' }); e.focus(); e.select(); });
  if (value === '') await c.page.keyboard.press('Backspace'); else await c.page.keyboard.type(value);
  await c.page.keyboard.press('Tab');
  await sleep(400);
}
/** Values of the wizard's hop lines as the brewer sees them. */
const lineValues = c => c.page.evaluate(() => [...document.querySelectorAll('.recipe-wizard [id^="wz-hop-"]')]
  .filter(e => /^wz-hop-(\d+|alpha-\d+|time-\d+|day-\d+|contact-\d+)$/.test(e.id)).map(e => [e.id, e.value]));
const alphaField = (c, index) => c.page.$eval(`#wz-hop-alpha-${index}`, e => ({ value: e.value, type: e.type, inputMode: e.getAttribute('inputmode'),
  border: getComputedStyle(e).borderColor, className: e.className }));
const balance = c => textOf(c.page, '[aria-label="Bilan de houblonnage de la recette"]');

async function openCreator(c) {
  await click(c.page, '.floating-actions button[aria-label="Actions rapides"]');
  await click(c.page, '[role="menuitem"]', 'Créer une recette');
  await c.page.waitForSelector('.recipe-wizard', { visible: true, timeout: 30000 });
}
async function startRecipe(c, name) {
  await openCreator(c);
  await c.page.waitForSelector('.recipe-wizard #wz-title', { visible: true });
  await c.page.type('.recipe-wizard #wz-title', name);
  let style = null, malt = null;
  try { style = await combobox(c.page, '.recipe-wizard [aria-label="Style de la bière"]', 'American IPA', /American IPA/u); }
  catch (error) { style = `échec : ${String(error.message).slice(0, 120)}`; }
  try {
    await gotoStep(c, 'Fermentescibles');
    malt = await combobox(c.page, '.recipe-wizard [aria-label^="Ajouter un fermentescible"]', 'Pilsner', /Pilsner/iu);
    await c.page.waitForSelector('.recipe-wizard #wz-fermentable-0', { visible: true });
    await typeInto(c, '.recipe-wizard #wz-fermentable-0', '5');
  } catch (error) { malt = `échec : ${String(error.message).slice(0, 120)}`; }
  return { style, malt };
}
async function saveFromRecap(c, name) {
  await gotoStep(c, 'Récapitulatif');
  await c.page.waitForSelector('.recipe-wizard [aria-label="État de la recette"]', { visible: true, timeout: 30000 });
  await sleep(1200);
  const state = await textOf(c.page, '.recipe-wizard [aria-label="État de la recette"]');
  await c.page.evaluate(() => window.__draftTrace?.push({ op: 'clic Enregistrer', t: Math.round(performance.now() - window.__draftT0) }));
  await click(c.page, '.recipe-wizard footer button', 'Enregistrer la recette');
  await c.page.waitForSelector(`button[aria-label="Ouvrir la recette ${name}"]`, { visible: true, timeout: 45000 });
  // The list under the creator shows the recipe from the local cache before the save settles; the creator closes once it
  // has (and has cleared its draft). Reloading earlier keeps the draft on purpose: the outcome is not known yet.
  await c.page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 45000 });
  return state;
}
async function reloadApp(c) {
  // The dev server can be slow to answer on a loaded machine; a reload is not a check.
  await c.page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitApp(c);
}
async function openRecipePage(c, name) {
  await c.page.waitForSelector(`button[aria-label="Ouvrir la recette ${name}"]`, { visible: true, timeout: 45000 });
  await click(c.page, `button[aria-label="Ouvrir la recette ${name}"]`);
  await c.page.waitForSelector('button[aria-label="Modifier la recette"]', { visible: true, timeout: 30000 });
}
async function editSaved(c, name) {
  await openRecipePage(c, name);
  await click(c.page, 'button[aria-label="Modifier la recette"]');
  await c.page.waitForSelector('.recipe-wizard #wz-title', { visible: true, timeout: 30000 });
  await gotoStep(c, 'Houblons');
  await waitWorkshop(c);
  await scrollToTop(c);
}
/** After a stopped case, drops the unfinished new-recipe draft through the creator itself, so the next case starts clean. */
async function abandonNewDraft(c) {
  await openCreator(c);
  await sleep(1000);
  if (await c.page.$('.recipe-wizard [aria-label="Abandonner le brouillon"]')) {
    await click(c.page, '.recipe-wizard [aria-label="Abandonner le brouillon"]');
    await click(c.page, '.recipe-wizard button', 'Abandonner', 5000);
    await sleep(800);
  }
  await reloadApp(c);
}
async function closeCreator(c) {
  await click(c.page, '.recipe-wizard button[aria-label="Fermer"]', undefined, 3000).catch(() => click(c.page, 'button[aria-label="Fermer"]'));
  await sleep(800);
}

/** Admin SDK views of the emulated database. */
async function recipesNamed(db, name) {
  const snap = await db.collection('recipes').where('name', '==', name).get();
  return snap.docs.map(doc => ({ id: doc.id, data: doc.data(), updateTime: doc.updateTime?.toMillis?.() ?? null }));
}
/** Fingerprint of every document of the emulated database, to attribute each write to the gesture that made it. */
async function dbSnapshot(db) {
  await sleep(1500); // queued App writes and Functions triggers land first
  const snapshot = {};
  for (const collection of await db.listCollections())
    snapshot[collection.id] = Object.fromEntries((await collection.get()).docs.map(doc => [doc.id, sha(canonical(doc.data()))]));
  return snapshot;
}
/** Added, changed and removed documents per collection; added documents carry an excerpt. */
async function dbWrites(db, before, after) {
  const writes = [];
  for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const was = before[name] ?? {}, is = after[name] ?? {};
    const added = Object.keys(is).filter(id => !(id in was)), removed = Object.keys(was).filter(id => !(id in is));
    const changed = Object.keys(is).filter(id => id in was && was[id] !== is[id]);
    if (!added.length && !removed.length && !changed.length) continue;
    const excerpts = {};
    for (const id of [...added, ...changed].slice(0, 6)) excerpts[id] = JSON.stringify((await db.doc(`${name}/${id}`).get()).data()).slice(0, 400);
    writes.push({ collection: name, added, changed, removed, excerpts });
  }
  return writes;
}
/** A saved recipe may only touch the recipe itself and the two journals (App audit log, Functions data history). */
const RECIPE_WRITES = ['recipes', 'auditLogs', 'dataHistory'];
const foreignWrites = writes => writes.filter(row => !RECIPE_WRITES.includes(row.collection));
async function waitFor(check, label, timeout = 30000) {
  const start = Date.now();
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() - start > timeout) throw Error(`Délai dépassé : ${label}`);
    await sleep(500);
  }
}

async function waitApp(c) {
  const failure = await c.page.waitForFunction(() => {
    const blocked = document.body.innerText.match(/Synchronisation \S+ impossible[^\n]*|Accès refusé par les règles[^\n]*/u)?.[0];
    if (blocked) return blocked;
    return document.body.innerText.includes('Recettes') && !!document.querySelector('.floating-actions button[aria-label="Actions rapides"]') && 'ok';
  }, { timeout: 120000 });
  const state = await failure.jsonValue();
  if (state !== 'ok') throw Error(`App bloquée : ${state}`);
  await sleep(800);
}

/** Signs the emulated brewer in through the App's own Firebase Auth instance (Vite module graph), then waits for the App. */
async function signIn(c) {
  await c.page.goto(c.base, { waitUntil: 'domcontentloaded' });
  // Vite may optimise dependencies and reload once: wait for a stable login screen (rendered after connectEmulators()).
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

/** #31 fixture : the brewer's local V5.5 dossier for this recipe gets an active historical copy, through the real repository. */
async function seedHistoricalCopy(c, recipeId, copyRecipe) {
  return c.page.evaluate(async ({ uid, recipeId, copyRecipe }) => {
    const { createHopV55WorkspaceRepository } = await import('/src/services/hopV55/workspaceRepository.ts');
    const repo = createHopV55WorkspaceRepository({ ownerKey: uid, databaseName: 'laffinee-hop-v55-local-workspaces-v1' });
    try {
      const all = await repo.list(uid);
      const local = [...all].reverse().find(row => row.wizardOrigin === undefined && !row.sourceBatchId && row.sourceRecipeId === recipeId);
      const now = new Date().toISOString();
      const scenarioId = local?.scenarioIds?.[0] ?? 'scenario-emu-copie-historique';
      const copy = { id: 'copy-emu-historique', recipe: copyRecipe, sourceRecipeId: recipeId, previewReference: 'emu:copie-historique',
        scenarioId, snapshotReference: 'emu:snapshot-historique', branchId: 'branch-emu-historique', branchReference: 'emu:branche-historique',
        createdAt: now, scope: 'local' };
      const next = local
        ? { ...local, scenarioIds: local.scenarioIds.includes(scenarioId) ? local.scenarioIds : [...local.scenarioIds, scenarioId],
          copies: [...local.copies, copy], activeCopyId: copy.id, updatedAt: now }
        : { format: 'hop-v55-workspace-v1', id: 'workspace-emu-copie-historique', ownerKey: uid, revision: 0, title: copyRecipe.name,
          intent: { question: 'Copie historique de contrôle', criteria: [] }, sourceRecipeId: recipeId, scenarioIds: [scenarioId],
          referenceHypotheses: [], copies: [copy], activeCopyId: copy.id, updatedAt: now };
      const saved = await repo.save(next, local ? local.revision : null);
      return { workspaceId: saved.id, revision: saved.revision, copies: saved.copies.length, activeCopyId: saved.activeCopyId,
        reusedDossier: !!local, dossiers: all.map(row => ({ id: row.id, wizardOrigin: row.wizardOrigin !== undefined, sourceRecipeId: row.sourceRecipeId ?? null })) };
    } finally { repo.close(); }
  }, { uid: c.uid, recipeId, copyRecipe });
}
async function readDossier(c, recipeId) {
  return c.page.evaluate(async ({ uid, recipeId }) => {
    const { createHopV55WorkspaceRepository } = await import('/src/services/hopV55/workspaceRepository.ts');
    const repo = createHopV55WorkspaceRepository({ ownerKey: uid, databaseName: 'laffinee-hop-v55-local-workspaces-v1' });
    try {
      const rows = (await repo.list(uid)).filter(row => row.sourceRecipeId === recipeId);
      return rows.map(row => ({ id: row.id, revision: row.revision, activeCopyId: row.activeCopyId ?? null,
        copies: row.copies.map(copy => ({ id: copy.id, hops: copy.recipe.hops.map(h => `${h.name} ${h.weightG} g`) })) }));
    } finally { repo.close(); }
  }, { uid: c.uid, recipeId });
}
/** Program of the open workshop (masses, closed details included) and whether it offers to leave an active copy. */
const workshopProgram = c => c.page.evaluate(() => {
  const root = document.querySelector('[data-testid="hop-v55"]');
  // innerText keeps the rendered separation between name, use, mass and dose (textContent glues « 99 g3,3 g/L »).
  return { program: (root?.querySelector('.hv-program')?.innerText ?? '').replace(/\s+/g, ' ').trim(),
    leaveCopy: [...(root?.querySelectorAll('button') ?? [])].some(button => /Revenir au programme précédent/u.test(button.textContent ?? '')) };
});
const hasMass = (program, grams) => new RegExp(`(^|[^\\d,])${grams}\\s?g(?![/\\w])`, 'u').test(program);

// ───────────────────────────── Cas ─────────────────────────────

/** Lignes du parcours : ébullition Cascade 30 g (alpha 6,5, 60 min) ; à cru Cascade 40 g en fermentation, 48 h à 19 °C. */
async function enterProgramLines(c) {
  await openLines(c);
  await addHop(c, { stage: 'Ébullition', query: 'Cascade', match: /Cascade/u, grams: '30', index: 0 });
  await typeInto(c, '#wz-hop-alpha-0', '6,5');
  if (await c.page.$('#wz-hop-time-0')) await typeInto(c, '#wz-hop-time-0', '60');
  await addHop(c, { stage: 'À cru', query: 'Cascade', match: /Cascade/u, grams: '40', index: 1 });
  const phase = await c.page.evaluateHandle(() => [...document.querySelectorAll('.recipe-wizard select')]
    .find(s => s.getClientRects().length && s.closest('label')?.innerText.includes('Phase de Cascade')));
  if (phase.asElement()) await phase.asElement().select('fermentation');
  await typeInto(c, '.recipe-wizard #wz-hop-contact-1', '48');
  await typeInto(c, '.recipe-wizard [aria-label="Température à cru de Cascade"]', '19');
}

/** Programme V5.5 : réglage « Essai EMU » (20 g après fermentation, 48 h, 12 °C) → comparer → choisir → aperçu prêt à appliquer. */
async function previewEssai(c) {
  await click(c.page, '[data-testid="recipe-hop-v55"] button', 'Régler ou comparer le programme');
  await c.page.waitForSelector('#hv-program-editor select[aria-label="Geste"]', { visible: true, timeout: 30000 });
  await c.page.select('#hv-program-editor select[aria-label="Geste"]', 'append');
  await c.page.$eval('#hv-program-editor [aria-label="Nom du scénario"]', e => e.select());
  await c.page.type('#hv-program-editor [aria-label="Nom du scénario"]', 'Essai EMU');
  const material = await c.page.$eval('#hv-program-editor select[aria-label="Matière du réglage"]', s => [...s.options].find(o => /Cascade/u.test(o.textContent))?.value ?? '');
  if (!material) throw Error('Aucune matière Cascade dans le réglage.');
  await c.page.select('#hv-program-editor select[aria-label="Matière du réglage"]', material);
  await c.page.$eval('#hv-program-editor [aria-label="Masse du réglage"]', e => e.select());
  await c.page.type('#hv-program-editor [aria-label="Masse du réglage"]', '20');
  await c.page.select('#hv-program-editor select[aria-label="Emploi du réglage"]', 'postFermentation');
  await c.page.$eval('#hv-program-editor [aria-label="Contact du réglage"]', e => e.select());
  await c.page.type('#hv-program-editor [aria-label="Contact du réglage"]', '48');
  await c.page.$eval('#hv-program-editor [aria-label="Température du réglage"]', e => e.select());
  await c.page.type('#hv-program-editor [aria-label="Température du réglage"]', '12');
  await click(c.page, '#hv-program-editor button', 'Comparer ce réglage');
  await c.page.waitForFunction(() => { const cmp = document.querySelector('.hv55-comparison'); const alert = document.querySelector('#hv-program-editor [role="alert"]');
    return (cmp && cmp.getClientRects().length) || (alert && alert.getClientRects().length); }, { timeout: 90000 });
  const compareError = await c.page.$$eval('#hv-program-editor [role="alert"]', nodes => nodes.filter(e => e.getClientRects().length).map(e => e.innerText.trim()));
  if (compareError.length) throw Error(`Comparaison refusée : ${compareError.join(' / ')}`);
  const essai = await c.page.evaluateHandle(() => [...document.querySelectorAll('.hv55-cmp-branch')].find(n => /Essai EMU/u.test(n.innerText))?.querySelector('.hv55-cmp-choose'));
  if (!essai.asElement()) throw Error('Branche « Essai EMU » introuvable.');
  await essai.asElement().evaluate(e => e.scrollIntoView({ block: 'center' })); await essai.asElement().click();
  await c.page.waitForSelector('[aria-label="Application au brouillon de recette"]', { visible: true, timeout: 30000 });
  await click(c.page, '.hv-draft-application button', 'Prévisualiser l’application au brouillon');
  await c.page.waitForFunction(() => ['.hv-draft-preview', '.hv-draft-alpha', '.hv-draft-application [role="alert"]']
    .some(s => { const e = document.querySelector(s); return e && e.getClientRects().length; }), { timeout: 90000 });
  if (await c.page.$('.hv-draft-alpha')) {
    await c.page.type('.hv-draft-alpha [aria-label^="Alpha de travail"]', '6,5');
    await c.page.type('.hv-draft-alpha [aria-label^="Motif du choix alpha"]', 'COA du lot 2025');
    await click(c.page, '.hv-draft-alpha button', 'Recalculer l’aperçu avec ces choix');
    await c.page.waitForSelector('.hv-draft-preview', { visible: true, timeout: 90000 });
  }
  const previewAlert = await c.page.$$eval('.hv-draft-application [role="alert"]', nodes => nodes.filter(e => e.getClientRects().length).map(e => e.innerText.trim()));
  if (!(await c.page.$('.hv-draft-preview'))) throw Error(`Aperçu bloqué : ${previewAlert.join(' / ')}`);
}

/** #28 (création puis édition), #30 (enregistrer, recharger, rouvrir, corriger sous le même ID), #31 (copie historique). */
async function casePersistance(c) {
  const name = `EMU persistance ${c.width}`;
  const atStart = await dbSnapshot(c.db);
  const identity = await startRecipe(c, name);
  await gotoStep(c, 'Houblons');
  await waitWorkshop(c);
  await scrollToTop(c);
  const mount = await c.page.evaluate(() => ({
    draftId: document.querySelector('[data-testid="recipe-hop-v55"]')?.getAttribute('data-draft-id') ?? null,
    title: document.querySelector('.recipe-wizard h1')?.textContent?.trim() ?? null,
    iframes: document.querySelectorAll('iframe').length,
    autonomousLinks: [...document.querySelectorAll('.recipe-wizard a, .recipe-wizard button')]
      .map(e => (e.getAttribute('aria-label') || e.innerText || '').trim()).filter(text => /Ouvrir l.atelier|atelier Houblons V5\.5/iu.test(text)),
  }));
  c.check(!!mount.draftId && mount.iframes === 0 && mount.autonomousLinks.length === 0, '#28 atelier natif monté sur le brouillon inédit', mount);
  c.check((await recipesNamed(c.db, name)).length === 0, '#28 brouillon inédit : rien d’enregistré avant « Enregistrer »');
  await shoot(c, '01-creation-atelier-brouillon-inedit');
  c.step('création : atelier monté', { identity, mount, balance: await balance(c) });

  await enterProgramLines(c);
  c.step('lignes saisies', { lines: await lineValues(c) });
  const afterLines = await dbSnapshot(c.db);
  // Not a #30 criterion: what choosing the malt and hops from the catalogue writes before any V5.5 gesture or save.
  c.step('écritures pendant la saisie des ingrédients (avant V5.5 et avant enregistrement)', { writes: await dbWrites(c.db, atStart, afterLines) });

  await previewEssai(c);
  await click(c.page, '.hv-draft-preview button', 'Appliquer au brouillon de recette');
  await waitText(c.page, 'Programme appliqué au brouillon', 90000);
  await sleep(800);
  await shoot(c, '02-programme-applique', '.recipe-hop-v55-scope');
  c.step('programme appliqué', { statuses: await statuses(c), lines: await lineValues(c) });

  // Preuve de contact à froid conservée (trace V5.5 du même document).
  await click(c.page, '.recipe-hop-v55-cold > summary');
  const source = await c.page.waitForSelector('.hv-cold-contact-selection select', { visible: true, timeout: 30000 });
  await c.page.waitForFunction(() => { const s = document.querySelector('.hv-cold-contact-selection select'); return s && !s.disabled && s.options.length > 1; }, { timeout: 30000 });
  await source.select(await source.evaluate(s => [...s.options].find(o => o.value)?.value));
  await c.page.waitForSelector('.hv-cold-contact-selection input[type="checkbox"]', { timeout: 30000 });
  await c.page.$eval('.hv-cold-contact-selection input[type="checkbox"]', e => { e.scrollIntoView({ block: 'center' }); e.click(); });
  await c.page.type('.hv-cold-contact-selection textarea', 'Une seule ligne à cru pendant la fermentation, retenue comme hypothèse du contact.');
  await click(c.page, '.hv-cold-contact-selection button', 'Préparer la référence de contact');
  await waitText(c.page, 'Référence préparée', 60000);
  await click(c.page, '.hv-cold-contact-evidence button', 'Conserver cette preuve avec la recette');
  await waitText(c.page, 'Source actuelle vérifiée', 60000);
  c.step('preuve froide conservée', { coldSummary: await textOf(c.page, '.recipe-hop-v55-cold > summary') });

  // Enregistrer par le service habituel ; le document est relu par l'Admin SDK.
  const recapState = await saveFromRecap(c, name);
  await shoot(c, '03-liste-apres-enregistrement');
  const saved = await waitFor(async () => { const rows = await recipesNamed(c.db, name); return rows.length ? rows : null; }, 'recette enregistrée');
  c.check(saved.length === 1, '#30 une seule recette enregistrée', { ids: saved.map(row => row.id) });
  const doc1 = saved[0];
  c.check(doc1.id === mount.draftId, '#28/#30 la recette garde l’identité du brouillon monté', { draftId: mount.draftId, id: doc1.id });
  c.check((doc1.data.hopV55Applications ?? []).length === 1, '#30 trace d’application V5.5 présente', { count: (doc1.data.hopV55Applications ?? []).length });
  c.check((doc1.data.hopV55ColdEvidenceAssociations ?? []).length === 1, '#30 preuve froide présente', { count: (doc1.data.hopV55ColdEvidenceAssociations ?? []).length });
  const afterSave = await dbSnapshot(c.db);
  const saveWrites = await dbWrites(c.db, afterLines, afterSave);
  c.check(foreignWrites(saveWrites).length === 0, '#30 appliquer V5.5, conserver la preuve froide et enregistrer : aucune écriture hors recette et journaux (ni brassin, ni stock, ni mouvement)', { saveWrites });
  c.step('écritures de l’application V5.5 et de l’enregistrement', { writes: saveWrites.map(({ collection, added, changed, removed }) => ({ collection, added, changed, removed })) });
  c.step('enregistrée', { recapState: recapState?.slice(0, 300), id: doc1.id, hops: doc1.data.hops.map(h => `${h.name} ${h.weightG} g ${h.stage} α${h.alpha} t${h.timeMin ?? '-'} c${h.aromaContactHours ?? '-'} ${h.aromaTemperatureC ?? '-'}°C`) });

  // #31 : copie historique active dans le dossier V5.5 local (99 g), contrôle positif dans l'atelier autonome.
  await reloadApp(c);
  // A stored copy is a complete recipe (named yeast, targets null or numbers): the incomplete draft is completed for it.
  const data = structuredClone(doc1.data), finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const historical = { ...data, name: `${name} · copie historique`, style: data.style || 'American IPA', volumeL: data.volumeL || 30,
    yeast: { ...(data.yeast ?? {}), name: data.yeast?.name || 'Levure de la copie EMU' },
    steps: Array.isArray(data.steps) ? data.steps : [], notes: Array.isArray(data.notes) ? data.notes : [],
    totalGristKg: finite(data.totalGristKg) ?? (data.fermentables ?? []).reduce((sum, row) => sum + (row.weightKg ?? 0), 0),
    ogTarget: finite(data.ogTarget), fgTarget: finite(data.fgTarget), abvTarget: finite(data.abvTarget),
    hops: data.hops.map((hop, index) => ({ ...hop, alpha: finite(hop.alpha) ?? 0, ...(index ? {} : { weightG: 99 }) })) };
  delete historical.hopV55Applications; delete historical.hopV55ColdEvidenceAssociations;
  const seeded = await seedHistoricalCopy(c, doc1.id, historical);
  c.step('copie historique semée (vrai dépôt local)', seeded);
  await openRecipePage(c, name);
  // The autonomous workshop is reached from the recipe sheet's « Potentiel aromatique » section, closed by default.
  const aroma = 'details[data-recipe-section="Potentiel aromatique"]';
  if (!(await c.page.$eval(aroma, e => e.open))) await click(c.page, `${aroma} > summary`);
  await click(c.page, `${aroma} button`, 'Ouvrir l’atelier Houblons V5.5', 60000);
  await c.page.waitForSelector('[data-testid="hop-v55"] .hv-program', { timeout: 90000 });
  await sleep(2500);
  const autonomous = await workshopProgram(c);
  c.check(hasMass(autonomous.program, 99) && autonomous.leaveCopy, '#31 contrôle : l’atelier autonome lit bien la copie active (99 g)', autonomous);
  await shoot(c, '04-atelier-autonome-copie-active', '[data-testid="hop-v55"] .hv-beer');
  await reloadApp(c); // a reload always returns to the tabs (useFullScreenRoute)

  // Recharger puis rouvrir en édition (#30, #28) : même brouillon, la copie n'est pas adoptée (#31).
  await editSaved(c, name);
  await c.page.waitForSelector('[data-testid="hop-v55"] .hv-program', { timeout: 90000 });
  const reopenedWorkshop = await workshopProgram(c);
  c.check(!hasMass(reopenedWorkshop.program, 99) && hasMass(reopenedWorkshop.program, doc1.data.hops[0].weightG) && !reopenedWorkshop.leaveCopy,
    '#31 le créateur garde le brouillon courant, jamais la copie (99 g absent)', reopenedWorkshop);
  await shoot(c, '05-rouverte-atelier-brouillon-courant', '[data-testid="hop-v55"] .hv-beer');
  await openLines(c);
  const reopenedLines = await lineValues(c);
  const expectedLines = doc1.data.hops.map((hop, index) => [`wz-hop-${index}`, String(hop.weightG)]);
  c.check(expectedLines.every(([id, grams]) => reopenedLines.some(([key, value]) => key === id && value.replace(',', '.') === grams)),
    '#30 masses identiques après rechargement', { reopenedLines, expectedLines });
  await shoot(c, '06-rouverte-lignes', '#recipe-hop-additions');
  c.step('rouverte', { reopenedLines, balance: await balance(c), scope: (await textOf(c.page, '.recipe-hop-v55-scope'))?.slice(0, 300) });
  const unchangedOnOpen = (await recipesNamed(c.db, name))[0];
  c.check(unchangedOnOpen.updateTime === doc1.updateTime, '#30/#31 rouvrir n’écrit rien', { before: doc1.updateTime, after: unchangedOnOpen.updateTime });

  // Correction sous le même ID : 30 → 35 g, enregistrer, relire.
  await typeInto(c, '.recipe-wizard #wz-hop-0', '35');
  await saveFromRecap(c, name);
  const corrected = await waitFor(async () => {
    const rows = await recipesNamed(c.db, name);
    return rows.length === 1 && rows[0].data.hops[0]?.weightG === 35 ? rows : null;
  }, 'correction enregistrée');
  const doc2 = corrected[0];
  c.check(doc2.id === doc1.id, '#30 correction sous le même ID', { before: doc1.id, after: doc2.id });
  c.check(canonical(doc2.data.hopV55Applications) === canonical(doc1.data.hopV55Applications)
    && canonical(doc2.data.hopV55ColdEvidenceAssociations) === canonical(doc1.data.hopV55ColdEvidenceAssociations),
  '#30 traces V5.5 inchangées après correction');
  const correctionWrites = await dbWrites(c.db, afterSave, await dbSnapshot(c.db));
  c.check(foreignWrites(correctionWrites).length === 0, '#30 rouvrir et corriger : aucune écriture hors recette et journaux (ni brassin, ni stock, ni mouvement)', { correctionWrites });
  await reloadApp(c);
  await editSaved(c, name);
  await openLines(c);
  const afterCorrection = await lineValues(c);
  c.check(afterCorrection.some(([id, value]) => id === 'wz-hop-0' && value === '35'), '#30 correction relue après rechargement', { afterCorrection });
  await shoot(c, '07-rouverte-apres-correction', '#recipe-hop-additions');
  const dossierAfter = await readDossier(c, doc1.id);
  const kept = dossierAfter.find(row => row.id === seeded.workspaceId);
  c.check(!!kept && kept.activeCopyId === 'copy-emu-historique' && kept.copies.some(copy => copy.id === 'copy-emu-historique' && copy.hops[0]?.includes('99 g')),
    '#31 copie historique conservée, jamais adoptée', { dossierAfter });
  const correctedWorkshop = await workshopProgram(c);
  c.check(!hasMass(correctedWorkshop.program, 99) && hasMass(correctedWorkshop.program, 35), '#31 après correction, toujours le brouillon courant (35 g)', correctedWorkshop);
  await closeCreator(c);
  c.step('corrigée', { id: doc2.id, hops: doc2.data.hops.map(h => `${h.name} ${h.weightG} g`), dossierAfter });
  c.recipeIds.push(doc1.id);
}

/** #32 : alpha inconnu enregistré et rouvert ; recette ancienne `alpha: 0` portant des traces V5.5 futures. */
async function caseAlpha(c) {
  const name = `EMU alpha ${c.width}`;
  await startRecipe(c, name);
  await gotoStep(c, 'Houblons');
  await waitWorkshop(c);
  await openLines(c);
  await addHop(c, { stage: 'Ébullition', query: 'Houblon EMU', match: /Houblon EMU sans alpha/u, grams: '30', index: 0 });
  if (await c.page.$('#wz-hop-time-0')) await typeInto(c, '#wz-hop-time-0', '60');
  const fresh = { alpha: await alphaField(c, 0), balance: await balance(c) };
  c.check(fresh.alpha.value === '' && fresh.alpha.type !== 'number', '#32 alpha inconnu affiché vide (jamais « 0 »)', fresh);
  c.check(/alpha du lot/u.test(fresh.balance ?? '') && !/\b0 IBU\b/u.test(fresh.balance ?? ''), '#32 bilan : IBU incomplets, alpha du lot, aucun IBU 0', { balance: fresh.balance });
  await scrollToTop(c);
  await shoot(c, '10-alpha-inconnu-saisie');
  c.step('ligne sans alpha', fresh);
  await saveFromRecap(c, name);
  const [doc] = await waitFor(async () => { const rows = await recipesNamed(c.db, name); return rows.length ? rows : null; }, 'recette alpha enregistrée');
  c.check(doc.data.hops[0].alpha === 0, '#32 document : hops[0].alpha === 0 (règle « 0 = inconnu »)', { alpha: doc.data.hops[0].alpha });
  await reloadApp(c);
  await editSaved(c, name);
  await openLines(c);
  const reopened = { alpha: await alphaField(c, 0), balance: await balance(c) };
  c.check(reopened.alpha.value === '' && reopened.alpha.border === fresh.alpha.border, '#32 rouvert : même champ vide, même repère', reopened);
  await scrollToTop(c);
  await shoot(c, '11-alpha-inconnu-rouverte');
  await typeInto(c, '#wz-hop-alpha-0', '6,5');
  const known = await balance(c);
  await typeInto(c, '#wz-hop-alpha-0', '');
  const cleared = { alpha: await alphaField(c, 0), balance: await balance(c) };
  c.check(!/alpha du lot/u.test(known ?? '') && cleared.alpha.value === '' && /alpha du lot/u.test(cleared.balance ?? ''),
    '#32 saisir 6,5 calcule, effacer revient à inconnu', { known, cleared });
  await closeCreator(c);
  c.step('rouverte', { reopened, known, cleared });

  // Recette ancienne : alpha 0 et traces écrites par une version future de l'app, semées par l'Admin SDK.
  const futureApplication = { format: 'hop-v55-recipe-draft-application-v9', id: 'application:futur-emu', payload: { nested: [{ a: 1 }, { b: [2, 3] }] } };
  const futureCold = { format: 'hop-v55-recipe-cold-evidence-association-v9', id: 'cold:futur-emu', opaque: { unknownField: true } };
  const oldName = `EMU ancienne alpha 0 ${c.width}`, oldId = `emu-ancienne-alpha-0-${c.width}`;
  const old = { ...structuredClone(doc.data), id: oldId, name: oldName,
    hops: [{ ...doc.data.hops[0], name: NO_ALPHA_STOCK.name, alpha: 0, weightG: 25 }],
    hopV55Applications: [futureApplication], hopV55ColdEvidenceAssociations: [futureCold] };
  await c.db.doc(`recipes/${oldId}`).set(old);
  const seededOld = (await c.db.doc(`recipes/${oldId}`).get());
  await reloadApp(c);
  await openRecipePage(c, oldName);
  await shoot(c, '12-ancienne-alpha-0-fiche');
  const sheet = await c.page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500));
  // The hop line must be found: a missing label is a failure, not an empty excerpt without « 0 % ».
  const sheetHop = sheet.match(/Houblon EMU sans alpha[^·]{0,80}/u)?.[0] ?? null;
  c.check(sheetHop !== null && !/\b0 ?%/u.test(sheetHop), '#32 fiche ancienne lisible, ligne trouvée, sans « 0 % »', { excerpt: sheet.match(/Houblon EMU sans alpha.{0,120}/u)?.[0] ?? null });
  await click(c.page, 'button[aria-label="Modifier la recette"]');
  await c.page.waitForSelector('.recipe-wizard #wz-title', { visible: true, timeout: 30000 });
  await gotoStep(c, 'Houblons');
  await waitWorkshop(c);
  await openLines(c);
  const oldAlpha = await alphaField(c, 0);
  const futureNotice = await c.page.evaluate(() => [...document.querySelectorAll('[data-testid="recipe-hop-v55"] [role="status"]')]
    .map(e => e.innerText.trim()).find(text => /lecture seule/u.test(text)) ?? null);
  c.check(oldAlpha.value === '' && oldAlpha.border === fresh.alpha.border, '#32 recette ancienne : même affichage (vide, repère)', oldAlpha);
  c.check(!!futureNotice, '#32 traces futures annoncées en lecture seule', { futureNotice });
  const notWritten = await c.db.doc(`recipes/${oldId}`).get();
  c.check(notWritten.updateTime.isEqual(seededOld.updateTime), '#32 ouvrir la recette ancienne n’écrit rien (aucune migration)');
  await scrollToTop(c);
  await shoot(c, '13-ancienne-alpha-0-houblons');
  await c.page.evaluate(() => [...document.querySelectorAll('[data-testid="recipe-hop-v55"] [role="status"]')]
    .find(e => /lecture seule/u.test(e.innerText))?.scrollIntoView({ block: 'center' }));
  await shoot(c, '14-ancienne-traces-futures-lecture-seule');
  await typeInto(c, '.recipe-wizard #wz-hop-0', '26');
  await saveFromRecap(c, oldName);
  const after = await waitFor(async () => { const snap = await c.db.doc(`recipes/${oldId}`).get(); return snap.data()?.hops?.[0]?.weightG === 26 ? snap : null; }, 'recette ancienne corrigée');
  c.check(after.data().hops[0].alpha === 0, '#32 recette ancienne : alpha toujours 0 (inconnu) après enregistrement');
  c.check(canonical(after.data().hopV55Applications) === canonical([futureApplication])
    && canonical(after.data().hopV55ColdEvidenceAssociations) === canonical([futureCold]), '#32 traces futures conservées brutes après « submit »', {
    applications: after.data().hopV55Applications, cold: after.data().hopV55ColdEvidenceAssociations });
  c.step('recette ancienne', { oldAlpha, futureNotice });
  c.recipeIds.push(doc.id, oldId);
}

/** #32 : un brouillon local d'un format futur reste brut, en lecture seule ; ni autosave, ni submit, ni discard. */
async function caseFutureDraft(c) {
  const key = `laffinee_recipe_draft_v1:${c.uid}:new`;
  const raw = JSON.stringify({ version: 2, format: 'recipe-draft-v2', draft: { recipe: { id: 'futur-emu', name: 'Brouillon futur EMU' }, extra: { keep: [1, 2, 3] } } });
  await c.page.evaluate((k, value) => localStorage.setItem(k, value), key, raw);
  await openCreator(c);
  await c.page.waitForSelector('[aria-label="Brouillon conservé en lecture seule"]', { visible: true, timeout: 30000 });
  const state = await c.page.evaluate(() => {
    // Every visible « Enregistrer… » command of the creator, not only the footer: none may be active.
    const saves = [...document.querySelectorAll('.recipe-wizard button')].filter(b => b.getClientRects().length && /Enregistrer/u.test(b.innerText));
    return {
      alert: document.querySelector('[aria-label="Brouillon conservé en lecture seule"]')?.innerText.replace(/\s+/g, ' ').trim() ?? null,
      saveButtons: saves.length, activeSaveButtons: saves.filter(b => !b.disabled).length,
      discard: !!document.querySelector('[aria-label="Abandonner le brouillon"]'),
    };
  });
  await sleep(3000);
  const kept = await c.page.evaluate(k => localStorage.getItem(k), key);
  c.check(kept === raw && !!state.alert && state.activeSaveButtons === 0 && !state.discard,
    '#32 brouillon futur : octets inchangés, alerte de lecture seule, aucun « Enregistrer » actif (0 bouton ou tous désactivés), aucun abandon', state);
  await shoot(c, '20-brouillon-futur-lecture-seule');
  await click(c.page, '.recipe-wizard button', 'Revenir aux recettes');
  await sleep(800);
  const afterClose = await c.page.evaluate(k => localStorage.getItem(k), key);
  c.check(afterClose === raw, '#32 brouillon futur : octets inchangés après fermeture');
  c.check((await recipesNamed(c.db, 'Brouillon futur EMU')).length === 0, '#32 brouillon futur : rien d’enregistré');
  c.step('brouillon futur', { state, bytes: raw.length });
  // The bench removes its own fixture once checked: the App never discards it, and a later case creating a recipe in
  // the same browser context would otherwise open this read-only draft.
  await c.page.evaluate(k => localStorage.removeItem(k), key);
}

/** The creator's local draft (the App's real storage), found by recipe name. */
const localDraft = (c, name) => c.page.evaluate(({ uid, name }) => {
  for (const key of Object.keys(localStorage).filter(k => k.startsWith(`laffinee_recipe_draft_v1:${uid}:`))) {
    const raw = localStorage.getItem(key);
    let recipe;
    try { recipe = JSON.parse(raw)?.draft?.recipe; } catch { continue; }
    if (recipe?.name !== name) continue;
    return { key, raw, hops: (recipe.hops ?? []).map(h => `${h.name} ${h.weightG} g ${h.stage}`),
      applications: recipe.hopV55Applications ?? null, cold: recipe.hopV55ColdEvidenceAssociations ?? null };
  }
  return null;
}, { uid: c.uid, name });
/** #29 fixture: the App's local storage refuses once the write carrying the first application trace. */
const armDraftWriteRefusal = c => c.page.evaluate(() => {
  const native = Storage.prototype.setItem;
  window.__emuDraftRefusals = 0;
  Storage.prototype.setItem = function (key, value) {
    if (window.__emuDraftRefusals === 0 && String(key).startsWith('laffinee_recipe_draft_v1:') && String(value).includes('"hopV55Applications":[{')) {
      window.__emuDraftRefusals += 1;
      throw new Error('Banc EMU : écriture locale refusée une fois.');
    }
    return native.call(this, key, value);
  };
});
const draftRefusals = c => c.page.evaluate(() => window.__emuDraftRefusals ?? null);
/** Marks one element for a capture (attribute only; the App ignores it) and returns its selector. */
const markShot = (c, selector, position) => c.page.evaluate((sel, at) => {
  document.querySelectorAll('[data-emu-shot]').forEach(e => e.removeAttribute('data-emu-shot'));
  const all = [...document.querySelectorAll(sel)];
  (at === 'last' ? all.at(-1) : all[0])?.setAttribute('data-emu-shot', '1');
  return all.length ? '[data-emu-shot="1"]' : null;
}, selector, position);
/** « Origine du programme appliqué », opened, as the brewer reads it (closed nested details stay closed). */
async function originText(c) {
  const summary = (await c.page.evaluateHandle(() => [...document.querySelectorAll('[data-testid="recipe-hop-v55"] summary')]
    .find(s => s.textContent.trim() === 'Origine du programme appliqué'))).asElement();
  if (!summary) return null;
  await summary.evaluate(s => { s.parentElement.setAttribute('data-emu-origin', '1'); s.scrollIntoView({ block: 'center' }); });
  if (!(await summary.evaluate(s => s.parentElement.open))) { await summary.click(); await sleep(400); }
  return summary.evaluate(s => s.parentElement.innerText.replace(/\s+/g, ' ').trim());
}
async function openCold(c) {
  if (!(await c.page.$eval('.recipe-hop-v55-cold', e => e.open))) await click(c.page, '.recipe-hop-v55-cold > summary');
  // Conserved evidences are rendered once their sources are read again.
  await c.page.waitForFunction(() => { const root = document.querySelector('.recipe-hop-v55-cold');
    return root && !/Vérification des sources des preuves conservées/u.test(root.innerText) && root.querySelectorAll('.hv-cold-contact-evidence').length > 0; }, { timeout: 60000 });
  await sleep(500);
}
const coldPanels = c => c.page.$$eval('.recipe-hop-v55-cold .hv-cold-contact-evidence', nodes => nodes.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
const coldReading = c => c.page.$$eval('.recipe-hop-v55-cold .hv-cold-contact-evidence', nodes => nodes.map(panel => Object.fromEntries([...panel.querySelectorAll('dl > div')]
  .map(row => [row.querySelector('dt')?.innerText.trim(), row.querySelector('dd')?.innerText.replace(/\s+/g, ' ').trim()]))));
/** Rendered colours of a command (its own opacity composited over the first opaque ancestor) and their WCAG ratio. */
const commandContrast = (c, selector, text) => c.page.evaluate((sel, wanted) => {
  const button = [...document.querySelectorAll(sel)].find(b => b.innerText.trim() === wanted);
  if (!button) return null;
  const rgb = value => (value.match(/[\d.]+/g) ?? []).map(Number);
  let node = button.parentElement, behind = null;
  while (node && !behind) { const bg = getComputedStyle(node).backgroundColor; if (rgb(bg)[3] !== 0 && bg !== 'transparent') behind = rgb(bg); node = node.parentElement; }
  const style = getComputedStyle(button), opacity = Number(style.opacity);
  const over = (top, under, alpha) => top.slice(0, 3).map((v, i) => alpha * v + (1 - alpha) * under[i]);
  const own = rgb(style.backgroundColor), fill = over(own, behind, own[3] ?? 1);
  const textColor = over(over(rgb(style.color), fill, rgb(style.color)[3] ?? 1), behind, opacity), backColor = over(fill, behind, opacity);
  const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const [hi, lo] = [lum(textColor), lum(backColor)].sort((a, b) => b - a);
  return { disabled: button.disabled, color: style.color, background: style.backgroundColor, opacity, behind,
    text: textColor.map(Math.round), back: backColor.map(Math.round), ratio: Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100,
    height: Math.round(button.getBoundingClientRect().height) };
}, selector, text);
/** Drops the creator's local edit draft through the creator itself (« Abandonner »), so the next opening reads the saved recipe. */
async function abandonEditDraft(c) {
  if (await c.page.$('.recipe-wizard [aria-label="Abandonner le brouillon"]')) {
    await click(c.page, '.recipe-wizard [aria-label="Abandonner le brouillon"]');
    await click(c.page, '.recipe-wizard button', 'Abandonner', 5000);
    await sleep(800);
  }
  if (await c.page.$('.recipe-wizard')) await closeCreator(c);
}
const frNumber = text => { const m = String(text ?? '').match(/-?\d[\d\s]*(?:,\d+)?/u); return m ? Number(m[0].replace(/\s/gu, '').replace(',', '.')) : Number.NaN; };
/** Each saved hop value the brewer sees again (mass, alpha, time, contact), compared with the document. */
function linesAgainstDocument(lines, hops) {
  const seen = new Map(lines);
  const expected = hops.flatMap((h, i) => [[`wz-hop-${i}`, h.weightG], [`wz-hop-alpha-${i}`, h.alpha || null],
    [`wz-hop-time-${i}`, h.timeMin ?? null], [`wz-hop-contact-${i}`, h.aromaContactHours ?? null]]);
  const missing = hops.map((_, i) => `wz-hop-${i}`).filter(id => !seen.has(id));
  const differing = expected.filter(([id, value]) => value !== null && seen.has(id) && Number(String(seen.get(id)).replace(',', '.')) !== value);
  return { missing, differing };
}

/**
 * #29 : application refusée une fois par le stockage local, reprise en un seul acte, brouillon repris après rechargement.
 * #40 : sélection froide sans l'ébullition, dose liée aux lignes cochées, BU de référence distinctes des IBU de la recette.
 * #48 : origine du programme (hypothèses, conditions, limites) relue à l'identique ; preuve historique consultable.
 * #64 : journal froid du document = brouillon local, relu à l'identique ; export et restauration par les vraies Functions,
 *       entrée future brute ; brassin lancé jamais réécrit par la correction.
 */
async function caseProgramCold(c) {
  const name = `EMU programme froid ${c.width}`;
  await startRecipe(c, name);
  await gotoStep(c, 'Houblons');
  await waitWorkshop(c);
  await scrollToTop(c);
  await enterProgramLines(c);
  const linesBefore = await lineValues(c);
  const atLines = await dbSnapshot(c.db);
  c.step('lignes saisies', { lines: linesBefore });

  // #29 : la première écriture locale de l'application est refusée ; l'écran et le brouillon local ne changent pas.
  await previewEssai(c);
  const draftBefore = await localDraft(c, name);
  await armDraftWriteRefusal(c);
  await click(c.page, '.hv-draft-preview button', 'Appliquer au brouillon de recette');
  const refusal = await waitFor(() => c.page.$$eval('.hv-draft-application [role="alert"]', nodes => nodes.filter(e => e.getClientRects().length)
    .map(e => e.innerText.trim()).join(' / ')).then(text => text || null), 'erreur de stockage affichée');
  await sleep(800);
  const refused = { refusal, refusals: await draftRefusals(c), lines: await lineValues(c), draft: await localDraft(c, name),
    confirmed: await c.page.evaluate(() => document.body.innerText.includes('Programme appliqué au brouillon')),
    nextToApply: await c.page.$$eval('.hv-draft-preview [role="alert"]', nodes => nodes.some(e => e.getClientRects().length)) };
  c.check(/^Programme non appliqué : le brouillon ne peut pas être conservé sur cet appareil/u.test(refusal) && /Banc EMU : écriture locale refusée une fois/u.test(refusal)
    && refused.nextToApply && refused.refusals === 1 && !refused.confirmed && !!draftBefore
    && canonical(refused.lines) === canonical(linesBefore) && refused.draft?.raw === draftBefore.raw && refused.draft.applications === null,
  '#29 refus du stockage local : erreur en français à côté de « Appliquer », écran et brouillon local inchangés, aucune confirmation',
  { ...refused, draft: refused.draft && { hops: refused.draft.hops, applications: refused.draft.applications }, linesBefore });
  await shoot(c, '30-application-refus-local', '.hv-draft-preview [role="alert"]', 'center');

  // Un seul acte reprend le même geste : une seule trace, lignes remplacées sans doublon.
  await click(c.page, '.hv-draft-preview button', 'Appliquer au brouillon de recette');
  await waitText(c.page, 'Programme appliqué au brouillon', 90000);
  await sleep(1200);
  const applied = { refusals: await draftRefusals(c), lines: await lineValues(c), draft: await localDraft(c, name) };
  const masses = applied.lines.filter(([id]) => /^wz-hop-\d+$/u.test(id)).map(([, value]) => value);
  c.check(applied.refusals === 1 && applied.draft?.applications?.length === 1 && masses.length === 3
    && new Set(applied.draft.hops).size === applied.draft.hops.length,
  '#29 reprise en un seul acte : une seule trace d’application, lignes remplacées sans doublon',
  { refusals: applied.refusals, hops: applied.draft?.hops, applications: applied.draft?.applications?.length ?? null, masses });
  const originApplied = await originText(c);
  c.check(!!originApplied && /Hypothèses · [1-9]/u.test(originApplied) && /Conditions · [1-9]/u.test(originApplied) && /Limites · [1-9]/u.test(originApplied),
    '#48 origine du programme appliqué : hypothèses, conditions et limites distinguées', { originApplied });
  await shoot(c, '31-origine-programme-applique', '[data-emu-origin="1"]');
  c.step('programme appliqué après un refus local', { refusal, hops: applied.draft?.hops, origin: originApplied?.slice(0, 600) });

  // #29 : un rechargement avant « Enregistrer » reprend le brouillon local tel quel.
  await reloadApp(c);
  await openCreator(c);
  await gotoStep(c, 'Houblons');
  await waitWorkshop(c);
  await openLines(c);
  const resumed = { lines: await lineValues(c), draft: await localDraft(c, name), origin: await originText(c) };
  c.check(canonical(resumed.lines) === canonical(applied.lines) && canonical(resumed.draft?.applications) === canonical(applied.draft?.applications)
    && resumed.origin === originApplied, '#29 rechargement avant enregistrement : brouillon repris sans doublon, même trace, même origine',
  { lines: resumed.lines, applications: resumed.draft?.applications?.length ?? null, origin: resumed.origin });

  // #40 : sélection froide sur le programme appliqué ; une ligne d'ébullition n'est jamais une case.
  const ibuBeforeCold = await balance(c);
  await click(c.page, '.recipe-hop-v55-cold > summary');
  const source = await c.page.waitForSelector('.hv-cold-contact-selection select', { visible: true, timeout: 30000 });
  await c.page.waitForFunction(() => { const s = document.querySelector('.hv-cold-contact-selection select'); return s && !s.disabled && s.options.length > 1; }, { timeout: 30000 });
  const sourceOption = await source.evaluate(s => { const o = [...s.options].find(row => row.value); return o ? { value: o.value, label: o.textContent.trim() } : null; });
  await source.select(sourceOption.value);
  await c.page.waitForSelector('.hv-cold-contact-selection input[type="checkbox"]', { timeout: 30000 });
  const selection = await c.page.$eval('.hv-cold-contact-selection fieldset', f => ({
    boxes: [...f.querySelectorAll('label')].filter(l => l.querySelector('input[type="checkbox"]')).map(l => l.innerText.replace(/\s+/g, ' ').trim()),
    hot: [...f.querySelectorAll('p')].map(p => p.innerText.replace(/\s+/g, ' ').trim()).filter(text => /pas un contact à froid/u.test(text)) }));
  c.check(selection.boxes.length === 2 && selection.hot.length === 1 && /ébullition/iu.test(selection.hot[0]) && !selection.boxes.some(text => /ébullition/iu.test(text)),
    '#40 sélection froide : ligne d’ébullition nommée « pas un contact à froid », sans case ; 2 cases (fermentation, après fermentation)', { source: sourceOption.label, ...selection });
  await shoot(c, '32-froid-selection', '.hv-cold-contact-selection fieldset');
  // Superviseur (#40) : lisibilité du bouton inactif « Préparer la référence de contact », mesurée sur le rendu.
  const prepareInactive = await commandContrast(c, '.hv-cold-contact-selection button', 'Préparer la référence de contact');
  const picked = await c.page.evaluate(() => {
    const label = [...document.querySelectorAll('.hv-cold-contact-selection fieldset label')].find(l => /(^|\D)40\s?g/u.test(l.innerText));
    const box = label?.querySelector('input[type="checkbox"]');
    if (!box) return null;
    box.scrollIntoView({ block: 'center' }); box.click();
    return label.innerText.replace(/\s+/g, ' ').trim();
  });
  if (!picked) throw Error('Ligne à cru de 40 g introuvable dans la sélection froide.');
  await c.page.type('.hv-cold-contact-selection textarea', 'Une seule ligne à cru pendant la fermentation, retenue comme hypothèse du contact.');
  const prepareActive = await commandContrast(c, '.hv-cold-contact-selection button', 'Préparer la référence de contact');
  c.step('mesure : bouton « Préparer la référence de contact »', { inactive: prepareInactive, active: prepareActive });
  await click(c.page, '.hv-cold-contact-selection button', 'Préparer la référence de contact');
  await waitText(c.page, 'Référence préparée', 60000);
  // The proposal panel renders after the sealed association is built.
  await c.page.waitForFunction(() => [...document.querySelectorAll('.recipe-hop-v55-cold .hv-cold-contact-evidence button')]
    .some(b => b.innerText.trim() === 'Conserver cette preuve avec la recette' && b.getClientRects().length), { timeout: 60000 });
  const [proposed] = await coldReading(c);
  const grams = frNumber(proposed?.['Masse totale']), volume = frNumber(proposed?.['Volume du programme'] ?? proposed?.['Volume au contact']);
  const dose = frNumber(proposed?.['Dose dans la référence']), exact = proposed?.['Dose dans la référence']?.match(/(\d+)(?:\/(\d+))?\s?g\/hL exacts/u);
  c.check(grams === 40 && volume > 0 && Math.abs(dose - grams / volume) < 5e-4 && !!exact && Math.abs(Number(exact[1]) / Number(exact[2] ?? 1) - grams / volume * 100) < 1e-9
    && /40\s?g/u.test(proposed?.['Contact sélectionné'] ?? ''), '#40 dose de la référence = masse de la ligne cochée ÷ volume du programme, ligne nommée', { picked, proposed });
  const proposedText = (await coldPanels(c))[0] ?? '';
  c.check(/BU de référence/u.test(proposedText) && /BU cible de la bière Aucune valeur cible calculée/u.test(proposedText)
    && /ne prédit pas l.IBU de cette bière/u.test(proposedText) && !/IBU cible|Tinseth/u.test(proposedText),
  '#40 BU de référence jamais présentées comme IBU cible ni incrément Tinseth', { excerpt: proposedText.slice(0, 900) });
  await click(c.page, '.hv-cold-contact-evidence button', 'Conserver cette preuve avec la recette');
  await waitText(c.page, 'Source actuelle vérifiée', 60000);
  await openCold(c);
  const coldConserved = await coldPanels(c);
  const ibuAfterCold = await balance(c);
  c.check(coldConserved.length === 1 && /Source actuelle vérifiée/u.test(coldConserved[0]) && !!ibuBeforeCold && ibuAfterCold === ibuBeforeCold,
    '#40 preuve conservée (source actuelle vérifiée) sans changer le bilan IBU de la recette', { ibuBeforeCold, ibuAfterCold, coldConserved });
  await shoot(c, '33-froid-conservee', await markShot(c, '.recipe-hop-v55-cold .hv-cold-contact-evidence', 'first'));
  c.step('preuve froide conservée', { source: sourceOption.label, picked, reading: proposed });

  // #64 : enregistrer ; le document relu par l'Admin SDK porte exactement le journal et la trace du brouillon local.
  const local = await localDraft(c, name);
  await saveFromRecap(c, name);
  const saved = await waitFor(async () => { const rows = await recipesNamed(c.db, name); return rows.length ? rows : null; }, 'recette programme froid enregistrée');
  const doc1 = saved[0], cold1 = doc1.data.hopV55ColdEvidenceAssociations ?? [];
  c.check(saved.length === 1 && cold1.length === 1 && local?.cold?.length === 1 && canonical(cold1) === canonical(local.cold)
    && canonical(doc1.data.hopV55Applications) === canonical(local.applications),
  '#64 Firestore : journal froid et trace d’application du document identiques au brouillon local avant « Enregistrer »',
  { recipes: saved.length, documentCold: cold1.length, localCold: local?.cold?.length ?? null });
  c.check(cold1[0]?.format === 'hop-v55-recipe-cold-evidence-association-v1' && cold1[0]?.recipeId === doc1.id,
    '#40 preuve versionnée (association v1) liée à cette recette', { format: cold1[0]?.format, recipeId: cold1[0]?.recipeId, id: doc1.id });
  const saveWrites = await dbWrites(c.db, atLines, await dbSnapshot(c.db));
  c.check(foreignWrites(saveWrites).length === 0, '#29/#64 appliquer, conserver et enregistrer : aucune écriture hors recette et journaux', { saveWrites });

  // #40, #48, #64 : recharger puis rouvrir ; origine et preuve relues à l'identique, sans écriture.
  await reloadApp(c);
  await editSaved(c, name);
  const originReopened = await originText(c);
  await shoot(c, '34-rouverte-origine', '[data-emu-origin="1"]');
  await openCold(c);
  const coldReopened = await coldPanels(c);
  await shoot(c, '35-rouverte-froid', await markShot(c, '.recipe-hop-v55-cold .hv-cold-contact-evidence', 'first'));
  c.check(originReopened === originApplied, '#48/#29 origine du programme relue à l’identique après enregistrer, recharger, rouvrir', { originApplied, originReopened });
  c.check(canonical(coldReopened) === canonical(coldConserved), '#40/#64 preuve froide relue à l’identique après enregistrer, recharger, rouvrir', { coldConserved, coldReopened });
  await openLines(c);
  const reopenedLines = await lineValues(c);
  const compared = linesAgainstDocument(reopenedLines, doc1.data.hops);
  c.check(!compared.missing.length && !compared.differing.length, '#29 lignes rouvertes = document (masse, alpha, durée, contact)', { compared, reopenedLines });
  const untouched = (await recipesNamed(c.db, name))[0];
  c.check(untouched.updateTime === doc1.updateTime, '#64 rouvrir n’écrit rien', { before: doc1.updateTime, after: untouched.updateTime });
  // #97 : browsing to the hop step without any change leaves no local edit draft (it used to, and would have been
  // resumed instead of the restored recipe below). Any draft left is still dropped through « Abandonner ».
  const browsingDraft = await localDraft(c, name);
  c.check(browsingDraft === null, '#97 rouvrir et parcourir sans modifier : aucun brouillon d’édition local', { key: browsingDraft?.key ?? null });
  await abandonEditDraft(c);
  c.step('brouillon d’édition local après la seule navigation', { key: browsingDraft?.key ?? null,
    hops: browsingDraft?.hops ?? null, cold: browsingDraft?.cold?.length ?? null, afterAbandon: (await localDraft(c, name))?.key ?? null });

  // #64 : vraie sauvegarde serveur puis restauration, par les services de l'App et les Functions émulées.
  const exportedJson = await c.page.evaluate(async () => (await import('/src/services/dataBackup.ts')).exportConfirmedBackup());
  const exported = JSON.parse(exportedJson);
  const exportedRow = exported.collections?.recipes?.find(row => row.id === doc1.id);
  c.check(!!exportedRow && canonical(exportedRow.data.hopV55ColdEvidenceAssociations) === canonical(cold1)
    && canonical(exportedRow.data.hopV55Applications) === canonical(doc1.data.hopV55Applications),
  '#64 export serveur (exportBreweryData) : journal froid et trace identiques au document', { found: !!exportedRow, bytes: exportedJson.length });
  const futureCold = { format: 'hop-v55-recipe-cold-evidence-association-v9', id: `cold:futur-restauration-${c.width}`, opaque: { nested: [1, { keep: true }] } };
  exportedRow.data.hopV55ColdEvidenceAssociations = [...exportedRow.data.hopV55ColdEvidenceAssociations, futureCold];
  const restored = await c.page.evaluate(async json => (await import('/src/services/dataBackup.ts')).restoreBackup(json), JSON.stringify(exported));
  const afterRestore = await waitFor(async () => { const snap = await c.db.doc(`recipes/${doc1.id}`).get();
    return (snap.data()?.hopV55ColdEvidenceAssociations ?? []).length === 2 ? snap : null; }, 'recette restaurée');
  const coldRestored = afterRestore.data().hopV55ColdEvidenceAssociations;
  c.check(restored?.complete === true && canonical(coldRestored) === canonical([...cold1, futureCold])
    && canonical(afterRestore.data().hopV55Applications) === canonical(doc1.data.hopV55Applications),
  '#64 restauration serveur (restoreBreweryData) : journal relu tel quel, entrée future gardée brute, aucune fusion', { restored });

  // #64 : un brassin lancé porte l'instantané de la recette ; la corriger ne le réécrit pas.
  const batchId = `EMU-LOT-${c.width}`;
  const { id: _id, favorite: _favorite, batchRef: _batchRef, archivedAt: _archivedAt, ...frozen } = afterRestore.data();
  await c.db.doc(`batches/${batchId}`).set({ id: batchId, brewDate: '2026-10-10', plannedBrewDate: '2026-10-10', name, style: frozen.style ?? '',
    volumeL: frozen.volumeL ?? 30, status: 'fermentation', stockAccountingVersion: 1, recipeRef: doc1.id, gravityLog: [],
    recipeSnapshot: { ...structuredClone(frozen), sourceRecipeId: doc1.id, capturedAt: new Date().toISOString() } });
  await reloadApp(c);
  const batchBefore = await c.db.doc(`batches/${batchId}`).get();
  const atBatch = await dbSnapshot(c.db);
  await editSaved(c, name);
  await openCold(c);
  const restoredPanels = await coldPanels(c);
  c.check(restoredPanels.length === 2 && restoredPanels[0] === coldConserved[0] && /Format futur · lecture seule/u.test(restoredPanels[1]),
    '#64 après restauration : preuve relue à l’identique, entrée future annoncée en lecture seule', { restoredPanels });
  await shoot(c, '36-restauree-format-futur', await markShot(c, '.recipe-hop-v55-cold .hv-cold-contact-evidence', 'last'), 'center');
  await openLines(c);
  const dryIndex = (await lineValues(c)).find(([id, value]) => /^wz-hop-\d+$/u.test(id) && value === '40')?.[0].replace('wz-hop-', '');
  if (dryIndex === undefined) throw Error('Ligne à cru de 40 g introuvable après réouverture.');
  await typeInto(c, `.recipe-wizard #wz-hop-${dryIndex}`, '45');
  await saveFromRecap(c, name);
  const corrected = await waitFor(async () => { const rows = await recipesNamed(c.db, name);
    return rows.length === 1 && rows[0].data.hops[Number(dryIndex)]?.weightG === 45 ? rows : null; }, 'correction programme froid enregistrée');
  const doc2 = corrected[0];
  c.check(doc2.id === doc1.id && canonical(doc2.data.hopV55ColdEvidenceAssociations) === canonical(coldRestored)
    && canonical(doc2.data.hopV55Applications) === canonical(doc1.data.hopV55Applications),
  '#29/#64 correction sous le même ID : journal froid (entrée future comprise) et trace d’application inchangés');
  const batchAfter = await c.db.doc(`batches/${batchId}`).get();
  const correctionWrites = await dbWrites(c.db, atBatch, await dbSnapshot(c.db));
  c.check(sha(canonical(batchAfter.data())) === sha(canonical(batchBefore.data())) && foreignWrites(correctionWrites).length === 0,
    '#64 brassin lancé jamais réécrit : instantané identique ; rouvrir et corriger n’écrivent que recipes, auditLogs, dataHistory', { correctionWrites });

  // #48 : après correction, la preuve reste consultable comme historique avec son instantané (40 g).
  await reloadApp(c);
  await editSaved(c, name);
  await openCold(c);
  const historicalPanels = await coldPanels(c);
  c.check(historicalPanels.length === 2 && /Historique · source actuelle non vérifiée/u.test(historicalPanels[0]) && /40\s?g/u.test(historicalPanels[0])
    && /Format futur · lecture seule/u.test(historicalPanels[1]),
  '#48/#40 après correction : preuve consultable comme historique avec son instantané (40 g), entrée future brute', { historicalPanels });
  await shoot(c, '37-corrigee-froid-historique', await markShot(c, '.recipe-hop-v55-cold .hv-cold-contact-evidence', 'first'));
  c.step('corrigée à côté d’un brassin lancé', { id: doc2.id, hops: doc2.data.hops.map(h => `${h.name} ${h.weightG} g ${h.stage}`),
    origin: (await originText(c))?.slice(0, 600), restored, batch: batchId });
  await closeCreator(c);
  c.recipeIds.push(doc1.id);
}

/** Reopens a saved recipe from the list (fresh App), up to the choice screen or the editor, and says which one. */
async function reopenSaved(c, name) {
  await reloadApp(c);
  await openRecipePage(c, name);
  await click(c.page, 'button[aria-label="Modifier la recette"]');
  // The step rail exists twice (phone header, desktop progress): wait for any visible one, not the first in the DOM.
  await c.page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard #wz-draft-choice-title, .recipe-wizard nav[aria-label="Étapes"]')]
    .some(e => e.getClientRects().length), { timeout: 30000 });
  await sleep(800);
  return (await textOf(c.page, '.recipe-wizard #wz-draft-choice-title')) ?? 'éditeur';
}
const draftBase = draft => draft ? JSON.parse(draft.raw)?.draft?.serverBase ?? null : null;
/** Activates a visible creator button from the keyboard (focus, then Enter), as a brewer without a pointer does. */
async function enterOnButton(c, text) {
  const button = await c.page.waitForFunction(wanted => [...document.querySelectorAll('.recipe-wizard button')]
    .find(b => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden' && b.innerText.trim().replace(/\s+/g, ' ') === wanted), { timeout: 30000 }, text);
  await button.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.focus(); });
  await c.page.keyboard.press('Enter');
}
const atRecap = c => c.page.evaluate(() => [...document.querySelectorAll('.recipe-wizard button')]
  .some(b => b.getClientRects().length && /Enregistrer la recette/u.test(b.innerText)));
/** SO₄ ⇄ Cl ratio of the water step, as its range input holds it. */
const ratioValue = c => c.page.waitForSelector('.recipe-wizard .ratio-track input[type="range"]', { timeout: 30000 })
  .then(input => input.evaluate(e => e.value)).catch(() => null);
/** Presses the ratio track at a fraction of its width, like a finger on the track. */
async function pressTrack(c, fraction) {
  const track = await c.page.waitForSelector('.recipe-wizard .ratio-track', { visible: true, timeout: 30000 });
  await track.evaluate(e => e.scrollIntoView({ block: 'center' }));
  const box = await track.boundingBox();
  if (!box) return; // Hidden again while scrolling: the unchanged ratio then fails the check instead of stopping the run.
  await c.page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
  await c.page.mouse.down();
  await sleep(150);
  await c.page.mouse.up();
  await sleep(600);
}
const malt = c => c.page.$eval('.recipe-wizard #wz-fermentable-0', e => e.value).then(frNumber);
const docColdIds = doc => (doc?.data.hopV55ColdEvidenceAssociations ?? []).map(entry => entry.id);

/**
 * #97 : un brouillon local antérieur face à une version enregistrée changée ailleurs, par la restauration des vraies
 * Functions puis par l'écriture d'un « autre appareil » (Admin SDK). Rien n'est repris ni écrit sans choix explicite ;
 * la seule navigation ne crée aucun brouillon.
 */
/** Diagnostic: every write or removal of a local draft in this page, with time, step and the caller's stack. */
const traceDrafts = c => c.page.evaluate(() => {
  const trace = window.__draftTrace = [];
  const t0 = window.__draftT0 = performance.now();
  for (const op of ['setItem', 'removeItem']) {
    const native = Storage.prototype[op];
    Storage.prototype[op] = function (key, ...rest) {
      if (String(key).startsWith('laffinee_recipe_draft_v1')) {
        let step = null; try { step = JSON.parse(rest[0])?.draft?.step ?? null; } catch { /* removal */ }
        trace.push({ op, key: String(key).slice(-24), t: Math.round(performance.now() - t0), size: rest[0]?.length ?? null, step,
          stack: new Error().stack.split('\n').slice(2, 10).map(line => line.trim().replace(/https?:\/\/[^/]+\//, '').slice(0, 140)) });
      }
      return native.call(this, key, ...rest);
    };
  }
});
async function caseDraftFreshness(c) {
  const name = `EMU fraîcheur ${c.width}`;
  await traceDrafts(c);
  const started = await startRecipe(c, name);
  await saveFromRecap(c, name);
  const creationTrace = await c.page.evaluate(() => window.__draftTrace);
  writeFileSync(join(c.out, `${c.width}-diag-trace-creation.json`), JSON.stringify(creationTrace, null, 2));
  c.step('#97 diagnostic : écritures du brouillon de création', { ops: creationTrace.map(row => `${row.t} ${row.op} ${row.step ?? ''}`).slice(-12) });
  const doc0 = (await waitFor(async () => { const rows = await recipesNamed(c.db, name); return rows.length ? rows : null; }, 'recette #97 enregistrée'))[0];
  c.recipeIds.push(doc0.id);
  c.step('#97 recette enregistrée', { started, id: doc0.id, malt: doc0.data.fermentables?.map(f => `${f.name} ${f.weightKg} kg`) });

  // (b) Ouvrir puis parcourir les étapes sans rien modifier.
  c.check(await reopenSaved(c, name) === 'éditeur', '#97 sans brouillon : l’éditeur s’ouvre directement');
  const navigation = [];
  for (const label of ['Fermentescibles', 'Houblons', 'Levure', 'Identité']) {
    await gotoStep(c, label);
    navigation.push(`${label} : ${await localDraft(c, name) ? 'brouillon' : 'aucun'}`);
  }
  await sleep(800);
  const navigationDraft = await localDraft(c, name);
  // Diagnostic of a draft nobody wrote: the draft and the saved document, whole, beside the report.
  if (navigationDraft) writeFileSync(join(c.out, `${c.width}-diag-brouillon-navigation.json`),
    JSON.stringify({ draft: JSON.parse(navigationDraft.raw), saved: doc0.data }, null, 2));
  c.check(navigationDraft === null, '#97 (b) navigation seule entre étapes : aucun brouillon local', { navigation });
  await shoot(c, '97-03-navigation-seule', '.recipe-wizard');
  await closeCreator(c);
  c.check(await localDraft(c, name) === null, '#97 (b) fermer après la seule navigation : aucun brouillon local');

  // Brouillon antérieur : une vraie modification, non enregistrée.
  await reopenSaved(c, name);
  await gotoStep(c, 'Fermentescibles');
  await typeInto(c, '.recipe-wizard #wz-fermentable-0', '6');
  const draft1 = await waitFor(async () => { const d = await localDraft(c, name); return d && /"weightKg":6[,}]/.test(d.raw) ? d : null; }, 'brouillon modifié')
    .catch(async error => {
      c.step('#97 diagnostic : brouillon modifié attendu', { malt: await malt(c).catch(() => null),
        field: await c.page.$eval('.recipe-wizard #wz-fermentable-0', e => e.value).catch(() => null),
        draftWeight: (await localDraft(c, name))?.raw.match(/"weightKg":[^,}]*/)?.[0] ?? null });
      throw error;
    });
  await closeCreator(c);
  c.check(/^recipe-server:sha256:[0-9a-f]{64}$/.test(draftBase(draft1) ?? ''), '#97 (a) le brouillon garde l’empreinte de la version enregistrée de départ', { base: draftBase(draft1) });
  c.check((await recipesNamed(c.db, name))[0].updateTime === doc0.updateTime, '#97 le brouillon local n’écrit rien au serveur');

  // Restauration serveur par les vraies Functions, avec une entrée ajoutée pendant que le brouillon attend.
  const exported = JSON.parse(await c.page.evaluate(async () => (await import('/src/services/dataBackup.ts')).exportConfirmedBackup()));
  const row = exported.collections?.recipes?.find(entry => entry.id === doc0.id);
  if (!row) throw Error('recette #97 absente de la sauvegarde serveur');
  const restoredCold = { format: 'hop-v55-recipe-cold-evidence-association-v9', id: `cold:fraicheur-restauration-${c.width}`, opaque: { nested: [1, { keep: true }] } };
  row.data.hopV55ColdEvidenceAssociations = [...(row.data.hopV55ColdEvidenceAssociations ?? []), restoredCold];
  const restored = await c.page.evaluate(async json => (await import('/src/services/dataBackup.ts')).restoreBackup(json), JSON.stringify(exported));
  const docR = await waitFor(async () => { const d = (await recipesNamed(c.db, name))[0]; return docColdIds(d).includes(restoredCold.id) ? d : null; }, 'recette #97 restaurée');
  c.step('#97 restauration serveur (restoreBreweryData) après le brouillon', { complete: restored?.complete ?? null, cold: docColdIds(docR) });

  // Réouverture : choix explicite, rien n'est repris ni écrit avant.
  const title1 = await reopenSaved(c, name);
  c.check(title1 === 'La recette enregistrée a changé', '#97 (a) serveur changé : choix proposé avant l’éditeur', { title1 });
  const layout = await c.page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
    buttons: [...document.querySelectorAll('.recipe-wizard section[aria-labelledby="wz-draft-choice-title"] button')]
      .map(b => ({ text: b.innerText.trim(), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width), primary: b.className.includes('bg-ebc-straw') })) }));
  await shoot(c, '97-01-choix', '.recipe-wizard section[aria-labelledby="wz-draft-choice-title"]');
  c.check(!layout.overflow && layout.buttons.filter(b => b.primary).length === 1 && layout.buttons.every(b => b.h >= (b.primary ? 32 : 24)), '#97 choix : une seule action principale (32 px), autres cibles ≥ 24 px, aucun débordement', layout);
  c.step('#97 écran de choix', layout);
  c.check((await localDraft(c, name))?.raw === draft1.raw && !(await c.page.$('.recipe-wizard #wz-title')),
    '#97 choix affiché : brouillon intact octet pour octet, éditeur non monté');
  c.check((await recipesNamed(c.db, name))[0].updateTime === docR.updateTime, '#97 choix affiché : rien n’est écrit au serveur');

  // « Reprendre le brouillon » : contenu du brouillon ; la version vue devient sa base.
  await click(c.page, '.recipe-wizard button', 'Reprendre le brouillon');
  await c.page.waitForSelector('.recipe-wizard #wz-fermentable-0', { visible: true, timeout: 30000 });
  const resumedMalt = await malt(c);
  const draft2 = await waitFor(async () => { const d = await localDraft(c, name); return d && draftBase(d) && draftBase(d) !== draftBase(draft1) ? d : null; }, 'base du brouillon mise à jour');
  c.check(resumedMalt === 6 && /"weightKg":6[,}]/.test(draft2.raw), '#97 « Reprendre le brouillon » : valeur du brouillon, base mise à la version vue', { resumedMalt });
  await closeCreator(c);
  c.check(await reopenSaved(c, name) === 'éditeur' && (await textOf(c.page, '.recipe-wizard .recipe-draft-status'))?.includes('Brouillon repris sur cet appareil.'),
    '#97 serveur inchangé depuis le choix : reprise silencieuse, comme avant');
  await closeCreator(c);

  // Écriture d'un « autre appareil » (Admin SDK) pendant que ce brouillon attend.
  const otherCold = { format: 'hop-v55-recipe-cold-evidence-association-v9', id: `cold:fraicheur-autre-appareil-${c.width}`, opaque: { device: 'B' } };
  await c.db.doc(`recipes/${doc0.id}`).update({ hopV55ColdEvidenceAssociations: [...(docR.data.hopV55ColdEvidenceAssociations ?? []), otherCold] });
  const docB = await waitFor(async () => { const d = (await recipesNamed(c.db, name))[0]; return docColdIds(d).includes(otherCold.id) ? d : null; }, 'écriture de l’autre appareil');
  c.check(await reopenSaved(c, name) === 'La recette enregistrée a changé', '#97 (a) écriture d’un autre appareil : choix proposé de nouveau');

  // « Ouvrir la version enregistrée » : valeur serveur ; brouillon gardé jusqu'à la première modification, puis remplacé.
  await click(c.page, '.recipe-wizard button', 'Ouvrir la version enregistrée');
  await c.page.waitForSelector('.recipe-wizard #wz-title', { visible: true, timeout: 30000 });
  const notice = await textOf(c.page, '.recipe-wizard .recipe-draft-status');
  await shoot(c, '97-02-version-enregistree', '.recipe-wizard .recipe-draft-status');
  // V3 n°1, B2 : toucher le nom sans rien taper, puis parcourir toutes les étapes, Récapitulatif compris (complément
  // automatique de la levure) : le brouillon mis de côté reste intact.
  await click(c.page, '.recipe-wizard #wz-title');
  for (const label of ['Fermentescibles', 'Houblons', 'Levure', 'Paliers', 'Eau et sels', 'Récapitulatif', 'Identité']) await gotoStep(c, label);
  await sleep(1200);
  c.check((await localDraft(c, name))?.raw === draft2.raw && !!(await textOf(c.page, '.recipe-wizard .recipe-draft-status'))?.includes('Version enregistrée ouverte'),
    '#97 V3 B2 : toucher sans saisie puis toutes les étapes, Récapitulatif compris : brouillon mis de côté intact');
  await shoot(c, '97-04-b2-toutes-etapes', '.recipe-wizard .recipe-draft-status');
  // Revue ciblée, B2-r : Entrée sur un bouton de navigation du contenu, puis complément automatique du Récapitulatif.
  await gotoStep(c, 'Eau et sels');
  await enterOnButton(c, 'Retour à la fiche de brassage');
  await sleep(1200);
  c.check(await atRecap(c) && (await localDraft(c, name))?.raw === draft2.raw
    && !!(await textOf(c.page, '.recipe-wizard .recipe-draft-status'))?.includes('Version enregistrée ouverte'),
    '#97 V3 B2-r : Entrée sur « Retour à la fiche de brassage » puis Récapitulatif : brouillon mis de côté intact');
  await shoot(c, '97-05-b2r-recapitulatif', '.recipe-wizard .recipe-draft-status');
  await gotoStep(c, 'Fermentescibles');
  const savedMalt = await malt(c);
  c.check(savedMalt === 5 && (await localDraft(c, name))?.raw === draft2.raw, '#97 « Ouvrir la version enregistrée » : valeur du serveur, brouillon gardé tant que rien n’est modifié', { savedMalt, notice });
  await typeInto(c, '.recipe-wizard #wz-fermentable-0', '7');
  const draft3 = await waitFor(async () => { const d = await localDraft(c, name); return d && /"weightKg":7[,}]/.test(d.raw) ? d : null; }, 'brouillon remplacé');
  c.check(draftBase(draft3) !== draftBase(draft2), '#97 première modification : le brouillon repart de la version enregistrée', { base: draftBase(draft3) });
  await saveFromRecap(c, name);
  const doc3 = await waitFor(async () => { const d = (await recipesNamed(c.db, name))[0]; return d && d.updateTime !== docB.updateTime ? d : null; }, 'recette #97 enregistrée');
  c.check(canonical(docColdIds(doc3)) === canonical(docColdIds(docB)) && doc3.data.fermentables?.[0]?.weightKg === 7,
    '#97 aucune entrée perdue : restauration et autre appareil conservés, modification enregistrée', { cold: docColdIds(doc3), malt: doc3.data.fermentables?.[0]?.weightKg });
  // The editor clears its draft when the save promise settles, which can come after the server already holds the write.
  const cleared = await waitFor(async () => await localDraft(c, name) === null, 'brouillon local effacé', 8000).catch(() => false);
  const leftover = cleared ? null : await localDraft(c, name);
  const leftoverDraft = leftover ? JSON.parse(leftover.raw)?.draft ?? {} : {};
  const leftoverRecipe = leftoverDraft.recipe ?? {};
  c.check(cleared, '#97 après enregistrement : brouillon local effacé', leftover ? { step: leftoverDraft.step, base: draftBase(leftover),
    differs: Object.keys({ ...leftoverRecipe, ...doc3.data }).filter(key => canonical(leftoverRecipe[key]) !== canonical(doc3.data[key])).slice(0, 12) } : {});
  await shoot(c, '97-06-enregistree-brouillon-efface');

  // V3 n°1, B1 : gestes sans clic ni saisie (flèche au clavier, appui long, piste) → fermer → rouvrir : modifications conservées.
  c.check(await reopenSaved(c, name) === 'éditeur', '#97 V3 B1 : réouverture sans brouillon');
  await gotoStep(c, 'Eau et sels');
  await enterOnButton(c, 'Retour à la fiche de brassage');
  await sleep(1200);
  c.check(await atRecap(c) && await localDraft(c, name) === null,
    '#97 V3 B2-r : Entrée sur « Retour à la fiche de brassage » puis Récapitulatif : aucun brouillon');
  await gotoStep(c, 'Paliers');
  const sparge = '.recipe-wizard [role="radiogroup"][aria-label="Type de rinçage"]';
  const spargeChecked = () => textOf(c.page, `${sparge} [role="radio"][aria-checked="true"]`);
  await c.page.waitForSelector(`${sparge} [role="radio"][aria-checked="true"]`, { visible: true, timeout: 30000 });
  const spargeBefore = await spargeChecked();
  await c.page.focus(`${sparge} [role="radio"][aria-checked="true"]`);
  await c.page.keyboard.press('ArrowRight');
  await sleep(400);
  const spargeAfter = await spargeChecked();
  await gotoStep(c, 'Fermentescibles');
  const maltBefore = await malt(c);
  const plus = await c.page.evaluateHandle(() => [...document.querySelector('.recipe-wizard #wz-fermentable-0').closest('.space-y-1')
    .querySelectorAll('button')].find(b => /^Ajouter .* kg$/u.test(b.getAttribute('aria-label') ?? '')));
  const box = await plus.boundingBox();
  await c.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await c.page.mouse.down();
  await sleep(1300);
  await c.page.mouse.up();
  await sleep(600);
  const maltAfter = await malt(c);
  await gotoStep(c, 'Eau et sels');
  // The track is shown only when the water analysis knows sulfate and chloride (WaterWorkbench) and, at 390, not in every layout;
  // when it is not visible, it is logged as not played.
  const hasTrack = await c.page.waitForSelector('.recipe-wizard .ratio-track', { visible: true, timeout: 8000 }).then(() => true).catch(() => false);
  const ratioBefore = hasTrack ? await ratioValue(c) : null;
  if (hasTrack) await pressTrack(c, 0.85);
  const ratioAfter = hasTrack ? await ratioValue(c) : null;
  await closeCreator(c);
  const heldDraft = await localDraft(c, name);
  const heldRatio = heldDraft ? JSON.parse(heldDraft.raw)?.draft?.water?.ratioOverride ?? null : null;
  c.step('#97 V3 B1 : gestes joués', { spargeBefore, spargeAfter, maltBefore, maltAfter, ratioBefore, ratioAfter, heldRatio, draft: !!heldDraft });
  c.check(spargeAfter !== spargeBefore && maltAfter > maltBefore && !!heldDraft, '#97 V3 B1 : flèche et appui long changent la recette et créent le brouillon', { spargeBefore, spargeAfter, maltBefore, maltAfter });
  if (hasTrack) c.check(ratioAfter !== null && ratioAfter !== ratioBefore && heldRatio !== null, '#97 V3 B1 : appui sur la piste SO₄ ⇄ Cl : rapport changé et conservé dans le brouillon', { ratioBefore, ratioAfter, heldRatio });
  else if (c.width >= 1280) c.check(false, '#97 V3 B1 : piste SO₄ ⇄ Cl visible à l’étape « Eau et sels » (1280)');
  else c.step('#97 V3 B1 : piste SO₄ ⇄ Cl non visible à cette largeur : non jouée');
  c.check(await reopenSaved(c, name) === 'éditeur' && !!(await textOf(c.page, '.recipe-wizard .recipe-draft-status'))?.includes('Brouillon repris sur cet appareil.'),
    '#97 V3 B1 : réouverture, serveur inchangé : brouillon repris en silence');
  await gotoStep(c, 'Paliers');
  const spargeReopened = await spargeChecked();
  await gotoStep(c, 'Fermentescibles');
  const maltReopened = await malt(c);
  c.check(spargeReopened === spargeAfter && maltReopened === maltAfter, '#97 V3 B1 : flèche et appui long conservés après fermer puis rouvrir', { spargeReopened, maltReopened });
  await shoot(c, '97-07-b1-rouverte', '.recipe-wizard .recipe-draft-status');
  await gotoStep(c, 'Eau et sels');
  const ratioReopened = hasTrack ? await ratioValue(c) : null;
  if (hasTrack) c.check(ratioReopened === ratioAfter, '#97 V3 B1 : piste SO₄ ⇄ Cl conservée après fermer puis rouvrir', { ratioAfter, ratioReopened });
  await abandonEditDraft(c);

  // Revue ciblée, B1-r : un style choisi par Entrée dans la liste crée à lui seul le brouillon, gardé après fermer puis rouvrir.
  c.check(await reopenSaved(c, name) === 'éditeur', '#97 V3 B1-r : réouverture sans brouillon après « Abandonner »');
  await gotoStep(c, 'Identité');
  const styleField = '.recipe-wizard [aria-label="Style de la bière"]';
  const styleValue = () => c.page.$eval(styleField, e => e.value).catch(() => null);
  const styleBefore = await styleValue();
  await c.page.$eval(styleField, e => { e.scrollIntoView({ block: 'center' }); e.focus(); e.select(); });
  await c.page.keyboard.type('Sai', { delay: 80 });
  await sleep(600);
  const styleOptions = await c.page.$$eval('[role="option"]', list => list.filter(o => o.getClientRects().length).map(o => o.innerText.trim()).slice(0, 4));
  const expanded = await c.page.$eval(styleField, e => e.getAttribute('aria-expanded')).catch(() => null);
  // What the page holds after the choice: draft keys, the editor notice, the focused element (diagnostic of B1-r).
  const draftState = () => c.page.evaluate(() => ({
    titleVisible: !!document.querySelector('.recipe-wizard #wz-title')?.getClientRects().length,
    loading: [...document.querySelectorAll('[role="status"]')].filter(e => e.getClientRects().length && /Chargement/u.test(e.innerText)).map(e => e.innerText.slice(0, 60)),
    notice: document.querySelector('.recipe-wizard .recipe-draft-status')?.innerText ?? null,
    active: `${document.activeElement?.tagName}:${document.activeElement?.getAttribute('aria-label') ?? ''}`,
    drafts: Object.keys(localStorage).filter(k => k.startsWith('laffinee_recipe_draft_v1')).map(k => {
      try { const d = JSON.parse(localStorage.getItem(k))?.draft; return `${k.slice(-12)} ${d?.recipe?.name} · ${d?.recipe?.style} · ${d?.step}`; } catch { return `${k.slice(-12)} illisible`; }
    }),
  }));
  await c.page.keyboard.press('Enter');
  const at0 = await draftState();
  await sleep(100);
  const soon = await draftState();
  await sleep(700);
  const later = await draftState();
  const styleAfter = await styleValue();
  const styleDraft = await localDraft(c, name);
  const draftStyle = styleDraft ? JSON.parse(styleDraft.raw)?.draft?.recipe?.style ?? null : null;
  c.check(!!styleAfter && styleAfter !== styleBefore && draftStyle === styleAfter, '#97 V3 B1-r : style choisi par Entrée dans la liste : brouillon écrit',
    { styleBefore, styleAfter, draftStyle, styleOptions, expanded, at0, soon, later });
  await closeCreator(c);
  c.check(await reopenSaved(c, name) === 'éditeur' && !!(await textOf(c.page, '.recipe-wizard .recipe-draft-status'))?.includes('Brouillon repris sur cet appareil.'),
    '#97 V3 B1-r : réouverture, serveur inchangé : brouillon repris en silence');
  await gotoStep(c, 'Identité');
  const styleReopened = await styleValue();
  c.check(styleReopened === styleAfter, '#97 V3 B1-r : style choisi par Entrée conservé après fermer puis rouvrir', { styleAfter, styleReopened });
  await shoot(c, '97-08-b1r-rouverte', '.recipe-wizard .recipe-draft-status');
  await abandonEditDraft(c);
}

const CASES = { persistance: casePersistance, alpha: caseAlpha, 'brouillon-futur': caseFutureDraft, 'programme-froid': caseProgramCold,
  'brouillon-fraicheur': caseDraftFreshness };

/** Real rules, emulated tokens: the brewer reads; another account (or an unverified one) neither reads nor writes. */
async function rulesCounterProof(recipeId) {
  const token = async user => {
    const response = await fetch(`http://127.0.0.1:${EMULATOR_PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-key`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestUri: 'http://localhost', returnSecureToken: true,
        postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub: user.sub, email: user.email, email_verified: true }))}&providerId=google.com` }) });
    const body = await response.json();
    if (!body.idToken) throw Error(`Jeton émulé refusé : ${JSON.stringify(body).slice(0, 200)}`);
    return body.idToken;
  };
  // The Auth emulator refuses a second Google account with the authorised e-mail; like @firebase/rules-unit-testing,
  // the unverified account is an unsigned token, which only the Firestore emulator accepts.
  const unsignedToken = (user, claims) => {
    const now = Math.floor(Date.now() / 1000), part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${part({ alg: 'none', typ: 'JWT' })}.${part({ iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, iat: now, exp: now + 3600,
      auth_time: now, sub: user.sub, user_id: user.sub, email: user.email, firebase: { sign_in_provider: 'google.com', identities: {} }, ...claims })}.`;
  };
  const url = `http://127.0.0.1:${EMULATOR_PORTS.firestore}/v1/projects/${PROJECT}/databases/(default)/documents/recipes/${encodeURIComponent(recipeId)}`;
  const call = async (bearer, method, body) => (await fetch(url, { method, headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}) })).status;
  const brewer = await token(USER), intruder = await token(INTRUDER);
  const unverified = unsignedToken({ ...USER, sub: `${USER.sub}-non-verifie` }, { email_verified: false });
  const intrusion = { fields: { name: { stringValue: 'Intrusion' } } };
  return {
    brewerRead: await call(brewer, 'GET'),
    intruderRead: await call(intruder, 'GET'), intruderWrite: await call(intruder, 'PATCH', intrusion), intruderDelete: await call(intruder, 'DELETE'),
    unverifiedRead: await call(unverified, 'GET'), unverifiedWrite: await call(unverified, 'PATCH', intrusion),
  };
}

async function inner() {
  const out = process.env.EMU_OUT, port = Number(process.env.EMU_PORT || 5174);
  const widths = String(process.env.EMU_WIDTHS || '390,1280').split(',').map(Number);
  const cases = String(process.env.EMU_CASES || Object.keys(CASES).join(',')).split(',').filter(Boolean);
  for (const name of cases) if (!CASES[name]) throw Error(`Cas inconnu : ${name}`);
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, `127.0.0.1:${EMULATOR_PORTS.firestore}`, 'Firestore émulé requis');
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, `127.0.0.1:${EMULATOR_PORTS.auth}`, 'Auth émulée requise');
  assert.equal(process.env.GEMINI_API_KEY, undefined, 'Aucune clé Gemini dans ce parcours');
  const cpuThrottle = Math.max(1, Number(process.env.EMU_CPU_THROTTLE) || 1);
  const report = { project: PROJECT, rulesSha: process.env.EMU_RULES_SHA, widths, cases, cpuThrottle, runs: [], checks: [], blocked: [], rewrites: [], pids: {} };
  const write = () => writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  const { initializeApp } = await import(pathToFileURL(join(ROOT, 'functions/node_modules/firebase-admin/lib/esm/app/index.js')).href);
  const { getFirestore } = await import(pathToFileURL(join(ROOT, 'functions/node_modules/firebase-admin/lib/esm/firestore/index.js')).href);
  initializeApp({ projectId: PROJECT });
  const db = getFirestore();

  // Vite dev: demo identifiers only, emulated account authorised, App Check off. Process environment only, never a file.
  const viteEnv = { ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: PROJECT, VITE_FIREBASE_API_KEY: 'demo-wiz-key',
    VITE_FIREBASE_AUTH_DOMAIN: `${PROJECT}.firebaseapp.com`, VITE_FIREBASE_STORAGE_BUCKET: `${PROJECT}.appspot.com`,
    VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000', VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
    VITE_FIREBASE_MEASUREMENT_ID: '', VITE_RECAPTCHA_SITE_KEY: '', VITE_APPCHECK_DEBUG_TOKEN: '', VITE_AUTHORIZED_ACCOUNTS: USER.email };
  const vite = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: ROOT, env: viteEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  report.pids.vite = vite.pid;
  vite.stdout.on('data', chunk => appendFileSync(join(out, 'vite.log'), chunk));
  vite.stderr.on('data', chunk => appendFileSync(join(out, 'vite.log'), chunk));
  const base = `http://127.0.0.1:${port}`;
  let browser, failed = false;
  try {
    await waitFor(async () => { try { return (await fetch(base)).ok; } catch { return false; } }, 'serveur de dev', 90000);
    const puppeteer = (await import('puppeteer-core')).default;
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-dev-shm-usage'] });
    report.pids.chrome = browser.process()?.pid;
    console.log(`pids : vite ${report.pids.vite}, chrome ${report.pids.chrome}`);
    let fixturesSeeded = false;
    const recipeIds = [];
    for (const width of widths) {
      const mobile = width < 600;
      const context = await browser.createBrowserContext();
      const entry = { width, steps: [], captures: [], errors: [] };
      report.runs.push(entry);
      /** A configured tab of this width; a fresh one per case (R-m10: one tab grew to 2.7 GB over several cases). */
      const openTab = async () => {
        const page = await context.newPage();
        page.on('pageerror', error => entry.errors.push(`pageerror: ${error.message.slice(0, 300)}`));
        page.on('console', message => { if (message.type() === 'error') entry.errors.push(`console: ${message.text().slice(0, 300)}`); });
        page.on('requestfailed', request => entry.errors.push(`requestfailed: ${request.method()} ${request.url().slice(0, 200)} ${request.failure()?.errorText ?? ''}`));
        await page.setRequestInterception(true);
        page.on('request', async request => {
          const url = request.url();
          if (!(/^(data|blob):/.test(url) || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url))) {
            report.blocked.push(`${width} ${url.slice(0, 160)}`); return request.abort();
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
        await page.evaluateOnNewDocument(() => {
          try { if (!localStorage.getItem('laffinee_ui_state')) localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })); }
          catch { /* opaque origin before navigation */ }
        });
        await page.setViewport({ width, height: mobile ? 844 : 900, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
        // A slow phone: Chrome runs the page's scripts N times slower (renders included); 1 leaves the CPU as is.
        if (cpuThrottle > 1) await page.emulateCPUThrottling(cpuThrottle);
        return page;
      };
      // Captures are taken on normal runs only: a slowed run checks behaviour.
      const c = { page: await openTab(), width, base, out, db, entry, recipeIds, uid: null, shots: cpuThrottle === 1,
        step: (label, data = {}) => { entry.steps.push({ label, ...data }); console.log(`${width} · ${label}`); write(); },
        check: (ok, label, data = {}) => { report.checks.push({ width, ok: !!ok, label, ...(ok ? {} : { data }) }); console.log(`${ok ? 'OK ' : 'KO '} ${width} · ${label}`); if (!ok) failed = true; write(); } };
      try {
        c.uid = await signIn(c);
        c.step('connexion émulée', { uid: c.uid });
        const rewritten = report.rewrites.filter(row => row.width === width);
        c.check(EMULATOR_REWRITES.every(rule => rewritten.some(row => row.path === rule.path))
          && rewritten.every(row => row.count === row.expected), 'banc : réécriture émulateur appliquée telle que prévue', { rewritten });
        if (!fixturesSeeded) {
          await waitFor(async () => (await db.doc('config/app').get()).exists, 'migration initiale de l’App', 90000);
          await db.doc(`stockItems/${NO_ALPHA_STOCK.id}`).set({ id: NO_ALPHA_STOCK.id, ref: NO_ALPHA_STOCK.id, name: NO_ALPHA_STOCK.name,
            category: 'Houblon', kind: 'rawMaterials', currentStock: 500, minStock: 0, unit: 'g', reorder: false, price: 0 });
          fixturesSeeded = true;
          await reloadApp(c);
        }
        for (const [index, name] of cases.entries()) {
          if (index > 0) {
            await c.page.close().catch(() => {});
            c.page = await openTab();
            await c.page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
            await waitApp(c);
            c.step(`onglet neuf pour ${name}`);
          }
          try { await CASES[name](c); }
          catch (error) {
            failed = true;
            c.step(`ARRÊT ${name}`, { error: String(error?.stack ?? error).slice(0, 1600), statuses: await statuses(c) });
            await c.page.screenshot({ path: join(out, `${width}-99-arret-${name}.png`) }).catch(() => {});
            await reloadApp(c).catch(() => {});
            await abandonNewDraft(c).catch(error => c.step(`abandon du brouillon impossible après ${name}`, { error: String(error).slice(0, 300) }));
          }
        }
      } catch (error) {
        failed = true;
        c.step('ARRÊT', { error: String(error?.stack ?? error).slice(0, 900) });
        await c.page.screenshot({ path: join(out, `${width}-99-arret.png`) }).catch(() => {});
      }
      await context.close();
    }
    // Every run ends with the counter-proof: on the first and the last recipe of the cases, or on a seeded recipe when
    // no case created one (a run is never declared OK without it).
    const proofIds = [...new Set([recipeIds[0], recipeIds.at(-1)].filter(Boolean))];
    if (!proofIds.length) {
      const id = 'emu-contre-epreuve';
      await db.doc(`recipes/${id}`).set({ id, name: 'EMU contre-épreuve', style: 'American IPA', volumeL: 20, hops: [], fermentables: [] });
      proofIds.push(id);
      report.checks.push({ width: null, ok: true, label: 'contre-épreuve : aucune recette créée par les cas, recette semée par l’Admin SDK', id });
    }
    for (const id of proofIds) {
      const rules = await rulesCounterProof(id).catch(error => ({ error: String(error).slice(0, 400) }));
      const ok = rules.brewerRead === 200 && [rules.intruderRead, rules.intruderWrite, rules.intruderDelete, rules.unverifiedRead, rules.unverifiedWrite].every(status => status === 403);
      report.checks.push({ width: null, ok, label: 'règles réelles : le brasseur lit ; autre compte et compte non vérifié refusés en lecture et écriture', id, rules });
      console.log(`${ok ? 'OK ' : 'KO '} règles ${id} : ${JSON.stringify(rules)}`);
      if (!ok) failed = true;
      const survived = await db.doc(`recipes/${id}`).get();
      const intact = survived.exists && survived.data().name !== 'Intrusion';
      report.checks.push({ width: null, ok: intact, label: 'contre-épreuve : document intact', id });
      if (!intact) failed = true;
    }
    if (report.blocked.length) console.log(`requêtes bloquées hors localhost : ${report.blocked.length}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    killTree(vite.pid);
    await sleep(1000);
    report.closed = { chrome: browser ? !browser.connected : true, vitePortFree: !(await portOpen(port)) };
    write();
  }
  const failures = report.checks.filter(check => !check.ok);
  console.log(`${report.checks.length - failures.length}/${report.checks.length} contrôles OK`);
  process.exit(failed || failures.length || !report.closed.vitePortFree ? 1 : 0);
}

if (flag('inner')) await inner();
else await outer();
