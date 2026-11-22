#!/usr/bin/env node
// PARCOURS STOCK (21.11) — l'écran Stocks joué AU DOIGT sur un BUILD, avec des données « ZZ TEST » qui imitent celles du brasseur.
// Même méthode que scripts/parcours/carnet.mjs (build du tag ou de l'arbre, serveur local, Chrome, 390 tactile par CDP, 1280 à la souris).
//
//   node scripts/parcours/stock.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--seulement <motif>] [--passes 390-clair,1280-cave] [--rouge ID,ID]
//     sans option : construit l'arbre de travail dans un dossier temporaire ;
//     --build     : réutilise un build déjà fait par `scripts/parcours/vite.parcours.config.mjs` ;
//     --ref <tag> : construit ce tag dans une copie temporaire (git worktree dans os.tmpdir(), node_modules en jonction, retirée à la fin) ;
//     --seulement : seuls les fichiers de stock-etapes/ dont le nom contient le motif sont joués (un banc court par voie) ;
//     --passes    : parmi 390-clair, 390-cave, 1280-clair, 1280-cave (défaut : les quatre ; chaque fichier d'étapes peut en limiter la liste) ;
//     --rouge     : mode « rouge sur tour8 » : sort 0 si CHACUN de ces contrôles échoue (et dit lesquels tiennent encore), 1 sinon.
//   Sortie : « PARCOURS STOCK OK » (code 0) ou « PARCOURS STOCK ECHEC (n) » + les contrôles en échec (code 1) ; captures dans le dossier.
//
// Un fichier de stock-etapes/ (un par voie ; ceux dont le nom commence par `_` ne sont pas joués) exporte :
//   export const passes = ['390-clair'];                 // facultatif
//   export default async function (c) { await c.etape('nom', async () => { …; c.controle('STC-2', condition, 'ce qu'on a vu'); }); }
// `c` : voir `ctx` plus bas (toucher, taper, texte, cap, demarrer, versStocks, ouvrirFiche, mesure…). Un contrôle porte l'id du défaut (STC-2, STE-10…).
// Données : fixtures/stock.mjs. Jamais seedData.ts, jamais Gemini (`?dev-local`), jamais de donnée réelle.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const { fixtureStock } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'stock.mjs')).href);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const OPTIONS = ['--build', '--ref', '--seulement', '--passes', '--rouge'];
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !OPTIONS.includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-stock'));
fs.mkdirSync(sortie, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = []; const vus = new Set();
const ok = (c, m) => { vus.add(c.split(' ')[0]); console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`); };
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };

// ───────────── le build ─────────────
function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossierBuild = opt('build'); const aNettoyer = [];
let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'parcours-stock-build-'));
    aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `parcours-stock-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `du tag ${opt('ref')}` : 'de l\'arbre de travail'} …`);
    construire(racine, dossierBuild);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 500)); }
finally {
  if (copie) { try { fs.rmSync(path.join(copie, 'node_modules'), { force: true }); } catch { /* jonction déjà retirée */ } spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) { if (process.env.PARCOURS_GARDER) console.log(`build gardé : ${d}`); else fs.rmSync(d, { recursive: true, force: true }); }
}
const rouge = (opt('rouge') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
if (rouge.length) {
  const ko = (id) => echecs.some((e) => e.startsWith(`${id} `) || e.startsWith(`${id}:`));
  const tiennent = rouge.filter((id) => !ko(id));
  if (tiennent.length) { console.log(`ROUGE INCOMPLET : ${tiennent.join(', ')} ne sont pas rouges (ok : ${[...vus].filter((v) => tiennent.includes(v)).join(', ') || 'jamais joués'})`); process.exit(1); }
  console.log(`ROUGE OK (${rouge.length} contrôles rouges)`); process.exit(0);
}
if (echecs.length) { console.log(`PARCOURS STOCK ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS STOCK OK');

// ───────────── le parcours ─────────────
async function jouer(dir) {
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
  });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-chaines`;
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  try {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const fx = fixtureStock(aujourdhui);
    const erreursPage = [];
    let p = null; let tactile = true; let nomPasse = '390-clair'; let passeCourante = nomPasse; let etapeCourante = '';

    async function ouvrirPage(largeur, hauteur, tact, theme) {
      if (p) await p.close().catch(() => {});
      p = await nav.newPage(); tactile = tact; nomPasse = `${largeur}-${theme}`;
      await p.setViewport(tact ? { width: largeur, height: hauteur, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { width: largeur, height: hauteur, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((j, th) => { if (!localStorage.getItem('parcours-chaines:fixture')) localStorage.setItem('parcours-chaines:fixture', j); localStorage.setItem('laffinee.theme', th); }, JSON.stringify(fx.entrees), theme);
      p.on('pageerror', (e) => erreursPage.push(String(e).slice(0, 200)));
    }
    const cap = (nom) => p.screenshot({ path: path.join(sortie, `${nomPasse}-${nom}.png`) });

    // ── gestes : un toucher réel (CDP) à 390, un clic réel de souris à 1280 ; l'élément doit être CE qui reçoit le geste ──
    const SEL = 'button,[role=button],[role=menuitem],[role=tab],[role=option],a,textarea,input';
    const trouver = (txt, { exact = false, sel = SEL, i = 0, parent = '', defiler = true } = {}) => p.evaluate((t, ex, s, i, par, def) => {
      const n = (x) => String(x).replace(/\s+/g, ' ').trim();
      const liste = [...document.querySelectorAll(s)].filter((e) => {
        const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
        if (par && !n(e.parentElement?.innerText ?? '').includes(par)) return false;
        const l = e.getAttribute('aria-label') ?? ''; const x = n(e.innerText ?? ''); const ph = e.getAttribute('placeholder') ?? '';
        return ex ? (l === t || x === t) : (l.startsWith(t) || x.startsWith(t) || ph.startsWith(t));
      });
      const e = liste[i]; if (!e) return null;
      let r = e.getBoundingClientRect();
      if (def && (r.top < 70 || r.bottom > innerHeight - 90)) { e.scrollIntoView({ block: 'center' }); r = e.getBoundingClientRect(); }
      const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, bien: !!h && (e === h || e.contains(h) || h.contains(e)), recouvert: h ? `${h.tagName.toLowerCase()}${h.className ? '.' + String(h.className).slice(0, 30) : ''}` : null, w: r.width, h: r.height };
    }, txt, exact, sel, i, parent, defiler);
    const frapper = async (x, y) => { if (tactile) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await sleep(700); };
    async function toucher(txt, o = {}) {
      let c = await trouver(txt, o);
      if (!c) throw new Error(`introuvable : « ${txt} »`);
      await sleep(120); c = await trouver(txt, o);
      if (!c.bien) { await p.evaluate(() => window.scrollTo(0, 1e7)); await sleep(200); c = await trouver(txt, o); }
      if (!c.bien) throw new Error(`« ${txt} » est recouvert par ${c.recouvert}`);
      await frapper(c.x, c.y);
    }
    async function toucherSel(sel) {
      const c = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
      if (!c) throw new Error(`introuvable : ${sel}`);
      await sleep(150); await frapper(c.x, c.y);
    }
    const texte = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    const present = (txt, o = {}) => trouver(txt, { ...o, defiler: false }).then((c) => !!c);
    const taper = async (t) => { await p.keyboard.type(t, { delay: 8 }); await sleep(250); };
    const entree = async () => { await p.keyboard.press('Enter'); await sleep(600); };
    /** Une mesure faite dans la page : `fn` reçoit `arg` et rend un objet sérialisable. */
    const mesure = (fn, arg) => p.evaluate(fn, arg);
    /** Les rectangles (x, y, largeur, hauteur) des éléments d'un sélecteur, visibles seulement. */
    const rects = (sel) => p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height, t: (e.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 60), a: e.getAttribute('aria-label') ?? '' }; }).filter((r) => r.w > 0 && r.h > 0), sel);

    // ── les écrans ──
    const demarrer = async (garder = false) => {
      // Un départ à froid : cache de fixture ET état d'interface (sous-onglet, écran) d'une étape ou d'une passe précédente effacés AVANT le chargement
      // (la page neuve est sur about:blank, où localStorage n'existe pas : on le fait donc dans le document qui se charge, puis on retire le script).
      const nettoyage = garder ? null : await p.evaluateOnNewDocument(() => { try { localStorage.removeItem('parcours-chaines:cache'); localStorage.removeItem('laffinee_ui_state'); } catch { /* origine sans stockage */ } });
      await p.goto(url, { waitUntil: 'load' });
      if (nettoyage) await p.removeScriptToEvaluateOnNewDocument(nettoyage.identifier).catch(() => {});
      await p.waitForSelector('nav button', { timeout: 90000 }).catch(async (e) => { await cap('erreur-demarrage').catch(() => {}); throw new Error(`l'application ne démarre pas (${e.message.slice(0, 60)}) ; erreurs : ${erreursPage.slice(0, 2).join(' | ')}`); });
      await sleep(1500);
    };
    /** Stocks > Articles, sur l'étagère et la liste (l'arrivée de la chasse). */
    const versStocks = async () => { await toucher('Stocks', { exact: true, sel: 'nav button' }).catch(() => toucher('Stocks')); await sleep(900); };
    const sousOnglet = async (nom) => { await toucher(nom, { sel: 'button,[role=tab]' }); await sleep(900); };
    /** Cherche dans la barre de recherche de l'écran (le premier champ texte), après l'avoir vidée. */
    const chercher = async (q) => {
      // à 1280 le premier champ texte n'est pas la recherche de la liste (la barre du haut en a un) : on vise d'abord son texte indicatif
      const c = (await trouver('Rechercher', { sel: 'input[placeholder^="Rechercher"]' })) ?? (await trouver('', { sel: 'input[type=search],input[type=text],input:not([type])' }));
      if (!c) throw new Error('champ de recherche introuvable');
      await frapper(c.x, c.y); await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace');
      if (q) await taper(q); await sleep(500);
    };
    /** Ouvre la fiche d'un article par « Ouvrir <nom> » (liste) ; défile jusqu'à lui. */
    const ouvrirFiche = async (nom) => {
      try { await toucher(`Ouvrir ${nom}`); } catch (e) { // à 1280 le tableau n'a pas de bouton « Ouvrir » : un coup sur le nom écrit
        const pos = await p.evaluate((n) => {
          const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t;
          while ((t = w.nextNode())) if (t.textContent.includes(n.replace(/^ZZ TEST /, '')) && t.parentElement && !t.parentElement.closest('input,textarea')) {
            t.parentElement.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.selectNodeContents(t); const b = r.getBoundingClientRect();
            if (b.width > 0 && b.height > 0) return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
          }
          return null;
        }, nom);
        if (!pos) throw e;
        await sleep(200); await frapper(pos.x, pos.y);
      }
      await sleep(900);
    };
    /** Les textes de moins de 12 px (hors masqués), comme les autres bancs. */
    const petits = () => p.evaluate(() => {
      const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const vus = new Set();
      while (w.nextNode()) { const n = w.currentNode; const s = n.textContent.replace(/\s+/g, ' ').trim(); if (!s) continue; const e = n.parentElement; if (!e || vus.has(e)) continue; vus.add(e);
        const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (parseFloat(cs.fontSize) < 12) out.push(`« ${s.slice(0, 24)} » ${cs.fontSize}`); }
      return out;
    });

    const etapeJouee = async (nom, fn) => {
      etapeCourante = nom;
      try { await fn(); } catch (e) { echec(`${passeCourante} ${nom}`, String(e.message ?? e).slice(0, 300)); await cap(`KO-${nom.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}`).catch(() => {}); }
    };
    /** Un contrôle d'un défaut : `ok` vrai = tenu. L'id est le défaut de la chasse (STC-2…) ; `detail` dit ce qu'on a vu, chiffres à l'appui. */
    const controle = (id, cond, detail) => { if (cond) ok(`${id} [${passeCourante}]`, detail); else echec(`${id} [${passeCourante}]`, detail); };

    const ctx = {
      get p() { return p; }, get tactile() { return tactile; }, get passe() { return passeCourante; }, get largeur() { return Number(passeCourante.split('-')[0]); }, get theme() { return passeCourante.split('-')[1]; },
      fx, sortie, sleep, cap, trouver, frapper, toucher, toucherSel, texte, present, taper, entree, mesure, rects, demarrer, versStocks, sousOnglet, chercher, ouvrirFiche, petits,
      ok, echec, controle, erreursPage, get etapeCourante() { return etapeCourante; },
      etape: (nom, fn) => etapeJouee(nom, fn)
    };

    // ── les passes et les fichiers d'étapes ──
    const TOUTES = [['390-clair', 390, 844, true, 'clair'], ['390-cave', 390, 844, true, 'cave'], ['1280-clair', 1280, 800, false, 'clair'], ['1280-cave', 1280, 800, false, 'cave']];
    const voulues = opt('passes') ? opt('passes').split(',') : TOUTES.map((t) => t[0]);
    const seulement = opt('seulement');
    const dossierEtapes = path.join(ICI, 'stock-etapes');
    const fichiers = fs.existsSync(dossierEtapes) ? fs.readdirSync(dossierEtapes).filter((f) => f.endsWith('.mjs') && !f.startsWith('_') && (!seulement || f.includes(seulement))).sort() : [];
    const modules = [];
    for (const f of fichiers) modules.push({ f, m: await import(pathToFileURL(path.join(dossierEtapes, f)).href) });
    for (const [nom, l, h, tact, theme] of TOUTES) {
      if (!voulues.includes(nom)) continue;
      const jouables = modules.filter(({ m }) => (m.passes ?? ['390-clair']).includes(nom));
      if (!jouables.length) continue;
      passeCourante = nom; await ouvrirPage(l, h, tact, theme);
      console.log(`── passe ${nom} ──`);
      for (const { f, m } of jouables) { console.log(`  [${f}]`); await m.default(ctx); }
    }
    if (erreursPage.length) console.log(`  note : erreurs de page : ${erreursPage.slice(0, 3).join(' | ')}`);
  } finally { await nav.close().catch(() => {}); srv.close(); }
}
