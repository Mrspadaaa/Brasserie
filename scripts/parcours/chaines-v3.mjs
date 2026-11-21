#!/usr/bin/env node
// CHASSE CALENDRIER, voie V3 (21.11) — CH-V7 (message du glisser coupé) et CH-V9 (menu d'appui long : peu de mots, plus de visuel).
// Joué AU DOIGT (390 tactile, CDP) et à la souris (1280), clair et cave, sur la fixture simulée du Calendrier (`fixtures/calendrier.mjs`,
// jamais seedData.ts, aucun Gemini). Étapes nommées comme celles de chaines.mjs (CH-V7, CH-V9) ; fichier à part pour ne pas toucher aux
// blocs des autres voies : le pilote fusionne.
//
//   node scripts/parcours/chaines-v3.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--largeurs 390,1280] [--themes clair,cave] [--etape CH-V7,CH-V9]
//   Sortie : « CHAINES V3 OK » (code 0) ou « CHAINES V3 ECHEC (n) » + la liste (code 1). Rouge sur en-ligne/2026-11-21-tour8, vert sur l'arbre.
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
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'chaines-v3'));
fs.mkdirSync(sortie, { recursive: true });
const LARGEURS = opt('largeurs', '390,1280').split(',').map(Number);
const THEMES = opt('themes', 'clair,cave').split(',');
const ETAPES = opt('etape', 'CH-V7,CH-V9').split(',');
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossier = opt('build', null); const tmp = !dossier; let copie = null;
try {
  if (!dossier) {
    dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'chaines-v3-build-'));
    let racine = RACINE;
    if (opt('ref', null)) {
      copie = path.join(os.tmpdir(), `chaines-v3-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref', null)], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      // le tag n'a pas le banc : on lui prête celui de l'arbre de travail
      fs.mkdirSync(path.join(copie, 'scripts', 'parcours', 'fixtures'), { recursive: true });
      for (const f of ['vite.parcours.config.mjs', path.join('fixtures', 'entree-app.mjs')]) fs.copyFileSync(path.join(ICI, f), path.join(copie, 'scripts', 'parcours', f));
      racine = copie;
    }
    console.log(`build ${opt('ref', null) ? `du tag ${opt('ref', null)}` : 'de l\'arbre de travail'} …`); construire(racine, dossier);
  }
  await jouer(path.resolve(dossier));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 400)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  if (tmp && dossier && !process.env.PARCOURS_GARDER) fs.rmSync(dossier, { recursive: true, force: true });
  else if (tmp && dossier) console.log(`build gardé : ${dossier}`);
}
if (echecs.length) { console.log(`CHAINES V3 ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('CHAINES V3 OK');

async function jouer(dir) {
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
  });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const auj = new Date().toISOString().slice(0, 10);
  const entrees = JSON.stringify(fixtureCalendrier(auj).entrees);
  try {
    for (const L of LARGEURS) for (const theme of THEMES) for (const etape of ETAPES) {
      const tactile = L < 600, combo = `${L}-${theme}`, C = `${etape} ${combo}`;
      const p = await nav.newPage();
      await p.setViewport({ width: L, height: tactile ? 844 : 900, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((t, j) => {
        localStorage.clear(); sessionStorage.clear(); localStorage.setItem('laffinee.theme', t); localStorage.setItem('parcours-calendrier:fixture', j);
      }, theme, entrees);
      const cdp = await p.createCDPSession();
      const cap = (nom) => p.screenshot({ path: path.join(sortie, `${nom}-${combo}.png`) });
      try {
        await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(1000);
        if (!(await p.$('[data-calendrier]'))) {
          const c = await p.evaluate(() => { const e = [...document.querySelectorAll('nav button')].find((b) => /Calendrier/.test(b.innerText + (b.getAttribute('aria-label') ?? ''))); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
          if (!c) throw new Error('onglet Calendrier introuvable');
          if (tactile) await p.touchscreen.tap(c[0], c[1]); else await p.mouse.click(c[0], c[1]);
        }
        await p.waitForSelector('[data-calendrier]', { timeout: 30000 }); await sleep(1200);
        const centre = (titre, i = 0) => p.evaluate((t, i) => {
          const e = [...document.querySelectorAll(`[aria-label^="${t},"]`)].filter((x) => x.getBoundingClientRect().width > 0)[i]; if (!e) return null;
          e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width];
        }, titre, i);
        const toucherDoigt = async (x, y, ms, dx = 0) => {
          if (tactile) {
            const pt = (xx) => [{ x: Math.round(xx), y: Math.round(y), id: 1 }];
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x) }); await sleep(ms);
            if (dx) for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x + (dx * k) / 10) }); await sleep(16); }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          } else {
            await p.mouse.move(x, y); await p.mouse.down(); await sleep(ms);
            if (dx) for (let k = 1; k <= 10; k++) { await p.mouse.move(x + (dx * k) / 10, y); await sleep(16); }
            await p.mouse.up();
          }
          await sleep(600);
        };

        if (etape === 'CH-V7') {
          // glisser « neipa v3 » en cuve : le message dit tout, et ne change pas de hauteur quand la page défile
          let mesure = null;
          for (let i = 0; i < 4 && !mesure; i++) {
            const c = await centre('neipa v3', i); if (!c) break;
            await toucherDoigt(c[0], c[1], 60, 70); await sleep(500);
            mesure = await p.evaluate(() => {
              const m = document.querySelector('[data-message]'); if (!m || !/Brassin en cuve/.test(m.innerText)) return null;
              const l = m.querySelector('.cal-msg-ligne') ?? m;
              return { texte: m.innerText.replace(/\s+/g, ' ').trim(), coupe: l.scrollHeight > l.clientHeight + 1, h: Math.round(m.getBoundingClientRect().height), bas: Math.round(m.getBoundingClientRect().bottom) };
            });
          }
          if (!mesure) { echec(C, 'aucun message « Brassin en cuve » après le glisser'); await cap('v7-sans-message'); continue; }
          await cap('v7-message');
          const defile = await p.evaluate(() => {
            const cible = [...document.querySelectorAll('*')].find((e) => { const o = getComputedStyle(e).overflowY; return (o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 40 && e.clientHeight > 300; }) ?? document.scrollingElement;
            cible.scrollTop += 140; return true;
          });
          await sleep(500);
          const apres = await p.evaluate(() => { const m = document.querySelector('[data-message]'); if (!m) return null; const l = m.querySelector('.cal-msg-ligne') ?? m; return { h: Math.round(m.getBoundingClientRect().height), coupe: l.scrollHeight > l.clientHeight + 1, texte: m.innerText.replace(/\s+/g, ' ').trim() }; });
          await cap('v7-message-apres-defilement');
          const pb = [];
          if (!/Seul le jalon de fin se glisse\./.test(mesure.texte)) pb.push(`le message ne dit pas « Seul le jalon de fin se glisse. » : « ${mesure.texte.slice(0, 120)} »`);
          if (mesure.coupe) pb.push('le texte est coupé par la limite de lignes (hauteur du texte > sa boîte)');
          if (apres && apres.coupe) pb.push('coupé après le défilement');
          if (apres && Math.abs(apres.h - mesure.h) > 1) pb.push(`hauteur ${mesure.h} → ${apres.h} px après le défilement`);
          pb.length ? echec(C, pb.join(' ; ')) : ok(C, `entier (${mesure.h} px)${defile ? '' : ''}${apres ? '' : ', message parti au défilement'}`);
        }

        if (etape === 'CH-V9') {
          // appui long sur « Ssr » : un menu court (≤ 4 lignes, ≤ 1/3 des pistes), des icônes plus que des mots, sans couvrir la barre voisine à 1280
          const c = await centre('Ssr'); if (!c) { echec(C, '« Ssr » introuvable'); continue; }
          await toucherDoigt(c[0], c[1], 750); await sleep(500);
          const m = await p.evaluate(() => {
            const menu = document.querySelector('[data-menu]'); if (!menu) return null;
            const r = menu.getBoundingClientRect();
            const tops = [];
            const w = document.createTreeWalker(menu, NodeFilter.SHOW_TEXT);
            for (let n = w.nextNode(); n; n = w.nextNode()) {
              /* un chiffre seul posé à côté d'un picto (le nombre de rangées masquées) n'est pas une ligne de texte : il en faut deux lettres */
              if (!/\p{L}{2,}/u.test(n.textContent) || n.parentElement.closest('.sr-only')) continue;
              const rg = document.createRange(); rg.selectNodeContents(n);
              for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) tops.push(Math.round(q.top));
            }
            tops.sort((a, b) => a - b);
            const lignes = tops.reduce((acc, t) => (acc.length && t - acc[acc.length - 1] < 6 ? acc : [...acc, t]), []).length;
            const ancre = document.querySelector('[aria-label^="Ssr,"]');
            const autres = [...document.querySelectorAll('[data-chose-id]')].filter((e) => e !== ancre && !e.contains(ancre) && !ancre?.contains(e)).map((e) => ({ nom: (e.getAttribute('aria-label') ?? '').slice(0, 28), r: e.getBoundingClientRect() }))
              .filter((o) => o.r.width > 0 && o.r.height > 0 && o.r.left < r.right && o.r.right > r.left && o.r.top < r.bottom && o.r.bottom > r.top).map((o) => o.nom);
            const frise = document.querySelector('[data-frise]')?.getBoundingClientRect();
            const ca = ancre?.getBoundingClientRect();
            const sur = ca ? ca.left < r.right && ca.right > r.left && ca.top < r.bottom && ca.bottom > r.top : false;
            return { h: Math.round(r.height), pistes: Math.round(frise?.height ?? 0), lignes, autres, sur, texte: menu.innerText.replace(/\s+/g, ' ').trim() };
          });
          if (!m) { echec(C, 'appui long sur « Ssr » : aucun menu'); await cap('v9-sans-menu'); continue; }
          await cap('v9-menu');
          const pb = [];
          if (m.lignes > 4) pb.push(`${m.lignes} lignes de texte (4 au plus) : « ${m.texte.slice(0, 150)} »`);
          if (m.pistes > 0 && m.h > m.pistes / 3) pb.push(`menu de ${m.h} px, plus d'un tiers des pistes (${m.pistes} px)`);
          if (m.sur) pb.push('le menu couvre la barre tenue');
          if (L >= 1024 && m.autres.length) pb.push(`à ${L} px le menu couvre ${m.autres.length} barre(s) voisine(s) : ${m.autres.slice(0, 4).join(' | ')}`);
          pb.length ? echec(C, pb.join(' ; ')) : ok(C, `menu ${m.h} px sur ${m.pistes}, ${m.lignes} lignes, aucune barre voisine couverte`);
        }
      } catch (e) { echec(C, String(e.message ?? e).slice(0, 300)); await cap('erreur').catch(() => {}); }
      await p.close();
    }
  } finally { await nav.close(); srv.close(); }
}
