#!/usr/bin/env node
// PARCOURS GESTE (21.11) — le comportement de la frise B (R1 à R14, dépôt Brasserie work/missions/2026-11-20-frise/frise-interactive.html)
// joué AU DOIGT dans l'app, sur un BUILD de test (même config que le parcours Calendrier), pour chaque endroit porté qu'un parcours atteint.
//
//   node scripts/parcours/geste.mjs <dossier-captures> [--build <dossier>] [--largeurs 390,1280] [--themes clair,cave]
//   Sortie : « PARCOURS GESTE OK » (code 0) ou « PARCOURS GESTE ECHEC » + la liste (code 1) ; captures dans le dossier.
//
// Gestes, à 390 tactile (CDP Input.dispatchTouchEvent) et 1280 souris, clair et cave : toucher sans bouger (rien ne change, R1),
// presser loin du pouce et bouger de 8 px (pas de saut, R2), avancer/étirer (+), reculer/réduire (−), Échap pendant le glisser (retour
// exact, R10), et la valeur après rechargement.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'parcours-geste'));
fs.mkdirSync(sortie, { recursive: true });
const LARGEURS = opt('largeurs', '390,1280').split(',').map(Number);
const THEMES = opt('themes', 'clair,cave').split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

// Les endroits atteints par le parcours : l'étape de la recette, l'élément tenu, la valeur lue.
const ENDROITS = [
  { nom: 'volume-identite', etape: null, tenu: '.idv input[type=range], [data-carte="volume"] input[type=range]', repli: 0 },
  { nom: 'ebullition-identite', etape: null, tenu: 'input[type=range][aria-label*="bullition" i]', repli: 1 },
  { nom: 'ratio-eau', etape: ['Eau', 'Eau et sels'], tenu: '.ratio-track', valeur: '.ratio-track input[type=range]' },
  { nom: 'gradue-eau', etape: ['Eau', 'Eau et sels'], tenu: 'input[type=range]:not(.ratio-track input)', repli: 0 },
  { nom: 'malt-ligne', etape: ['Malts/sucres', 'Fermentescibles'], tenu: '.fer-bw', valeur: '[data-role=masse-curseur]' },
  { nom: 'levure-recap', etape: ['Récap.', 'Récap', 'Récapitulatif'], tenu: 'input[aria-label="Curseur de quantité de levure"]' },
];

function construire(dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: RACINE, env: { ...process.env, PARCOURS_RACINE: RACINE }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossier = opt('build', null); const tmp = !dossier;
try {
  if (!dossier) { dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'parcours-geste-build-')); console.log('build …'); construire(dossier); }
  await jouer(path.resolve(dossier));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 400)); }
finally { if (tmp && dossier && !process.env.PARCOURS_GARDER) fs.rmSync(dossier, { recursive: true, force: true }); }
if (echecs.length) { console.log(`PARCOURS GESTE ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS GESTE OK');

async function jouer(dir) {
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
  });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local`;
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const vus = new Set();
  try {
    for (const L of LARGEURS) for (const theme of THEMES) {
      const tactile = L < 600, combo = `${L}-${theme}`;
      const p = await nav.newPage();
      await p.setViewport({ width: L, height: tactile ? 844 : 900, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((t) => localStorage.setItem('laffinee.theme', t), theme);
      const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 160)));
      const cdp = await p.createCDPSession();
      const toucherTexte = async (txts) => {
        for (const t of [].concat(txts)) {
          const c = await p.evaluate((t) => {
            const e = [...document.querySelectorAll('button,a,[role=tab],[role=button]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && ((e.getAttribute('aria-label') ?? '').trim() === t || e.innerText.trim().replace(/\s+/g, ' ') === t); });
            if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
          }, t);
          if (c) { if (tactile) await p.touchscreen.tap(c[0], c[1]); else await p.mouse.click(c[0], c[1]); await sleep(900); return true; }
        }
        return false;
      };
      const ouvrir = async (etape) => {
        await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(800);
        if (!(await toucherTexte('Actions rapides')) || !(await toucherTexte(['Créer une recette', 'Recette']))) throw new Error('assistant de recette introuvable');
        await sleep(1200);
        if (etape && !(await toucherTexte(etape))) throw new Error(`étape « ${[].concat(etape)[0]} » introuvable`);
        await sleep(1200);
      };
      // la boîte de l'élément tenu, mise au centre ; et la valeur
      const boite = (sel, i) => p.evaluate((s, i) => { const e = [...document.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().width > 0)[i ?? 0]; if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel, i);
      const lire = (sel, i) => p.evaluate((s, i) => { const e = [...document.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().width > 0 || e.type === 'range')[i ?? 0]; if (!e) return null; const v = e.getAttribute('aria-valuenow') ?? e.value; const n = Number(v); return { v: n, min: Number(e.min ?? e.getAttribute('aria-valuemin') ?? 0), max: Number(e.max || e.getAttribute('aria-valuemax') || 100) }; }, sel, i);
      async function glisser(x0, y, xs, { echap = false } = {}) {
        if (tactile) {
          const pt = (x) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0) }); await sleep(50);
          for (const x of xs) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await sleep(16); }
          await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await p.mouse.move(x0, y); await p.mouse.down(); await sleep(40);
          for (const x of xs) { await p.mouse.move(x, y); await sleep(16); }
          if (echap) { await p.keyboard.press('Escape'); await sleep(60); }
          await p.mouse.up();
        }
        await sleep(400);
      }
      const pas = (a, b, n = 12) => Array.from({ length: n }, (_, k) => a + ((b - a) * (k + 1)) / n);

      for (const E of ENDROITS) {
        const c = `${E.nom} ${combo}`;
        try {
          await ouvrir(E.etape);
          const i = E.repli ?? 0, vsel = E.valeur ?? E.tenu;
          const b = await boite(E.tenu, i);
          if (!b) { echec(c, `élément introuvable (${E.tenu})`); await p.screenshot({ path: path.join(sortie, `${E.nom}-${combo}-introuvable.png`) }); continue; }
          const y = b.y + b.h / 2, v0 = await lire(vsel, i);
          if (!v0 || !Number.isFinite(v0.v)) { echec(c, 'valeur illisible'); continue; }
          const etendue = Math.max(1e-9, v0.max - v0.min), pouce = b.x + ((v0.v - v0.min) / etendue) * b.w;
          const loin = pouce < b.x + b.w / 2 ? b.x + b.w * 0.85 : b.x + b.w * 0.15;
          // R1 : un toucher loin du pouce ne change rien
          await glisser(loin, y, []);
          const v1 = await lire(vsel, i);
          v1.v === v0.v ? ok(`${c} toucher`, `reste ${v0.v}`) : echec(`${c} toucher`, `${v0.v} → ${v1.v}`);
          // R2 : presser loin et bouger de 8 px : pas de saut à l'endroit touché
          await glisser(loin, y, [loin + 3, loin + 8]);
          const v2 = await lire(vsel, i), saut = Math.abs(v2.v - v1.v) / etendue;
          saut <= 8 / b.w * 1.6 + 0.02 ? ok(`${c} sans saut`, `Δ ${(saut * 100).toFixed(1)} %`) : echec(`${c} sans saut`, `Δ ${(saut * 100).toFixed(1)} % de l'échelle pour 8 px`);
          // avancer / étirer, puis reculer / réduire, depuis le milieu
          const mil = b.x + b.w / 2, d = Math.min(70, b.w * 0.3);
          await glisser(mil, y, pas(mil, mil + d));
          const v3 = await lire(vsel, i);
          if (!vus.has(E.nom + theme + L)) { vus.add(E.nom + theme + L); await p.screenshot({ path: path.join(sortie, `${E.nom}-${combo}-avance.png`) }); }
          (v3.v > v2.v || v2.v >= v0.max) ? ok(`${c} avancer`, `${v2.v} → ${v3.v}`) : echec(`${c} avancer`, `${v2.v} → ${v3.v}`);
          await glisser(mil, y, pas(mil, mil - d));
          const v4 = await lire(vsel, i);
          (v4.v < v3.v || v3.v <= v0.min) ? ok(`${c} reculer`, `${v3.v} → ${v4.v}`) : echec(`${c} reculer`, `${v3.v} → ${v4.v}`);
          // R10 : Échap pendant le glisser rend la valeur exacte (souris : le clavier existe)
          if (!tactile) {
            await glisser(mil, y, pas(mil, mil + d), { echap: true });
            const v5 = await lire(vsel, i);
            v5.v === v4.v ? ok(`${c} Échap`, `reste ${v4.v}`) : echec(`${c} Échap`, `${v4.v} → ${v5.v}`);
          }
          // la valeur après rechargement (brouillon de la recette)
          const garde = (await lire(vsel, i)).v;
          await ouvrir(E.etape); await sleep(600);
          const v6 = await lire(vsel, i);
          v6 && v6.v === garde ? ok(`${c} rechargement`, `${garde}`) : echec(`${c} rechargement`, `${garde} → ${v6?.v}`);
        } catch (e) { echec(c, String(e.message ?? e).slice(0, 160)); await p.screenshot({ path: path.join(sortie, `${E.nom}-${combo}-erreur.png`) }).catch(() => {}); }
      }
      if (erreurs.length) echec(`erreurs de page ${combo}`, erreurs.slice(0, 2).join(' | '));
      await p.close();
    }
  } finally { await nav.close(); srv.close(); }
}
