#!/usr/bin/env node
// PARCOURS GESTE-DATE-PARTOUT (22.11) — chaque choix de date de l'app joué AU DOIGT sur un BUILD : on glisse la frise partagée (`ChoixDate`,
// celle de la fiche v02) jusqu'à un jour, on valide par le geste propre de l'écran (Enregistrer…), puis on lit la date ÉCRITE dans le magasin.
//   node scripts/parcours/geste-date.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--seulement <motif>]
// Même méthode que stock.mjs (build du tag ou de l'arbre, serveur local, Chrome, 390 tactile par CDP). Fixture : fixtures/stock.mjs (« ZZ TEST »),
// jamais seedData.ts, jamais Gemini, jamais de donnée réelle. Sortie : « GESTE-DATE OK » ou « GESTE-DATE ECHEC (n) » + les contrôles en échec.
// Chaque écran est une étape de `geste-date-etapes.mjs` : { id, nom, aller(c), glisse(c), ecrit(c) }.
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
const { fixtureChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'chaines.mjs')).href);
const { etapes } = await import(pathToFileURL(path.join(ICI, 'geste-date-etapes.mjs')).href);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const OPTIONS = ['--build', '--ref', '--seulement'];
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !OPTIONS.includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-geste-date'));
fs.mkdirSync(sortie, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };

function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossierBuild = opt('build'); const aNettoyer = []; let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'parcours-gd-build-')); aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `parcours-gd-copie-${Date.now()}`);
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
  if (copie) { try { fs.rmSync(path.join(copie, 'node_modules'), { force: true }); } catch { /* jonction déjà retirée */ } spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); }
  for (const d of aNettoyer) { if (process.env.PARCOURS_GARDER) console.log(`build gardé : ${d}`); else fs.rmSync(d, { recursive: true, force: true }); }
}
if (echecs.length) { console.log(`GESTE-DATE ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('GESTE-DATE OK');

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
    /* + la cuve (brassin en fermentation, fermenteur), la caisse et les ventes de la fixture des chaînes : les écrans de date en ont besoin (ZZ TEST, simulé). */
    for (const e of fixtureChaines(aujourdhui, { cuve: true, garde: true, caisseBasse: true, achatPompe: true }).entrees) if (!fx.entrees.some((x) => x.name === e.name && x.id === e.id)) fx.entrees.push(e);
    /* levure : une recette ZZ TEST à levure liquide Wyeast 1056 (l'étape Levure propose son Activator 125 mL et son starter publié) ; simulé */
    { const g = fx.entrees.find((x) => x.name === 'recipes' && x.id === 'R-ZZ-IPA');
      if (g) fx.entrees.push({ name: 'recipes', id: 'R-ZZ-LEVURE', data: { ...structuredClone(g.data), id: 'R-ZZ-LEVURE', name: 'ZZ TEST Levure', hops: [{ name: 'ZZ TEST Citra', weightG: 400, stage: 'boil', timeMin: 10 }], yeast: { name: 'Wyeast 1056', hopIndexId: 'wyeast-1056', form: 'liquide', qty: 125, unit: 'mL' } } }); }
    const erreursPage = [];
    let p = null; let cdp = null; let etape = '';
    const ouvrirPage = async (theme) => {
      p = await nav.newPage();
      await p.setViewport({ width: 390, height: 660, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((j, th) => { try { localStorage.removeItem('parcours-chaines:cache'); localStorage.removeItem('laffinee_ui_state'); } catch { /* origine sans stockage */ } localStorage.setItem('parcours-chaines:fixture', j); localStorage.setItem('laffinee.theme', th); }, JSON.stringify(fx.entrees), theme);
      p.on('pageerror', (e) => erreursPage.push(String(e).slice(0, 200)));
      cdp = await p.createCDPSession();
      await p.goto(url, { waitUntil: 'load' });
      await p.waitForSelector('nav button', { timeout: 90000 });
      await sleep(1500);
    };
    const cap = (nom) => p.screenshot({ path: path.join(sortie, `390-${nom}.png`) });
    const texte = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    /** Le centre de l'élément (défilé au milieu) ; `bien` : c'est lui qui reçoit le toucher. */
    const point = (sel, texteSel = '') => p.evaluate((s, t) => {
      const n = (x) => String(x).replace(/\s+/g, ' ').trim();
      const tous = [...document.querySelectorAll(s)].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (!t || n(el.innerText).startsWith(t) || (el.getAttribute('aria-label') ?? '').startsWith(t)); });
      /* plusieurs boutons de ce nom (la page dessous, la feuille dessus) : celui que le doigt atteint vraiment, le plus haut dans le document */
      const atteint = (el) => { const r = el.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!h && (el === h || el.contains(h) || h.contains(el)); };
      const e = [...tous].reverse().find(atteint) ?? tous[0];
      if (!e) return null;
      /* un bouton déjà visible (barre fixe, pied de feuille) ne se défile pas : le défilement le glissait sous un autre pied */
      { const v = e.getBoundingClientRect(); if (v.top < 0 || v.bottom > window.innerHeight) e.scrollIntoView({ block: 'center' }); }
      const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, bien: !!h && (e === h || e.contains(h) || h.contains(e)), couvre: h ? `${h.tagName}.${String(h.className).slice(0, 40)} « ${(h.getAttribute('aria-label') || h.innerText || '').slice(0, 20)} »` : 'rien' };
    }, sel, texteSel);
    const toucher = async (sel, t = '') => {
      let c = await point(sel, t); if (!c) throw new Error(`introuvable : ${sel} « ${t} »`);
      await sleep(120); c = await point(sel, t);
      /* une feuille qui glisse ou une frise qui se replie déplace le bouton : on le relit jusqu'à trois fois avant de dire « recouvert » */
      for (let k = 0; k < 4 && c && !c.bien; k++) { await sleep(500); c = await point(sel, t); }
      if (!c.bien) throw new Error(`recouvert : ${sel} « ${t} » par ${c.couvre}`);
      await p.touchscreen.tap(c.x, c.y); await sleep(700);
    };
    /** Le toucher sur le plus petit élément visible qui contient ce texte (un nom de brassin dans une liste). */
    const toucherTexte = async (t) => {
      const c = await p.evaluate((txt) => {
        const n = (x) => String(x).replace(/\s+/g, ' ').trim();
        const l = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && n(e.innerText ?? '').includes(txt) && ![...e.children].some((f) => n(f.innerText ?? '').includes(txt)); });
        const e = l[0]; if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }, t);
      if (!c) throw new Error(`texte introuvable : ${t}`);
      await sleep(150); await p.touchscreen.tap(c.x, c.y); await sleep(900);
    };
    const bouton = (t) => toucher('button,[role=button],[role=tab],a', t);
    /** Glisse le doigt de (x, y) de `dx` px, en vingt pas, comme un pouce. */
    const glisser = async (x, y, dx) => {
      const pt = (xx) => [{ x: xx, y, id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x) });
      for (let k = 1; k <= 20; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x + (dx * k) / 20) }); await sleep(16); }
      await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(500);
    };
    /** Glisse le repère de la frise visible de `jours` jours (le pas en px est lu sur la frise : data-px-jour) ; rend { px, jours }. */
    const glisserFrise = async (jours) => {
      const f = await p.evaluate(() => { const e = document.querySelector('[data-choix-date-frise] .cal-f-duree-piste, [data-frise-fiche] .cal-f-duree-piste'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); const po = e.querySelector('[data-date-point]').getBoundingClientRect(); return { y: r.y + r.height * 0.3, x: po.x + po.width / 2, pxJour: Number(e.dataset.pxJour) }; });
      if (!f) throw new Error('frise introuvable');
      const px = Math.round(jours * f.pxJour);
      await glisser(f.x, f.y, px);
      return { px, pxJour: f.pxJour };
    };
    /** Les entrées d'une collection, relues dans le cache que la page tient à jour à chaque écriture. */
    const ecrit = (collection, id) => p.evaluate((c, i) => { try { const t = JSON.parse(localStorage.getItem('parcours-chaines:cache') ?? '[]'); return (t.find((e) => e.name === c && e.id === i) ?? {}).data ?? null; } catch { return null; } }, collection, id);
    const ctx = { get p() { return p; }, fx, aujourdhui, sleep, cap, texte, point, toucher, toucherTexte, bouton, glisser, glisserFrise, ecrit,
      ok, echec, controle: (id, cond, detail) => (cond ? ok(id, detail) : echec(id, detail)), erreursPage };
    const seulement = opt('seulement');
    for (const e of etapes.filter((x) => !seulement || x.id.includes(seulement))) {
      etape = e.id; console.log(`── ${e.id} : ${e.nom} ──`);
      try { if (p) await p.close().catch(() => {}); await ouvrirPage('clair'); await e.jouer(ctx); } catch (err) { echec(e.id, String(err.message ?? err).slice(0, 300)); await cap(`KO-${e.id}`).catch(() => {}); }
    }
    if (erreursPage.length) console.log(`  note : erreurs de page : ${erreursPage.slice(0, 3).join(' | ')}`);
  } finally { await nav.close().catch(() => {}); srv.close(); }
}
