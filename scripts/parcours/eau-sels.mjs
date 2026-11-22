#!/usr/bin/env node
// PARCOURS EAU-SELS (22.11, défaut EAU-SELS-UN-ECRAN) — « La seule règle: maximiser la grandeur du spidergraph (radargraph) et avoir sur
// un seul écran, sel, radargraph et acides. »
//
//   node scripts/parcours/eau-sels.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--themes clair,cave] [--captures]
//   Sortie : « PARCOURS EAU-SELS OK » (code 0) ou « PARCOURS EAU-SELS ECHEC » + la liste (code 1).
//
// Build de test (config `vite.parcours.config.mjs`, `?dev-local`, même chemin que le parcours geste) ; recette neuve de l'assistant
// (Actions rapides › Créer une recette), étape Eau, segment « 2. Sels », AU REPOS : rien n'est défilé après le toucher.
// À 390×660 et 390×844 tactile :
//   S1  le radar, chacun des 9 sels (champ de dose) et les deux acides (empâtage, rinçage) sont ENTIÈREMENT dans la fenêtre utile
//       (sous la barre d'onglets collante, au-dessus de la rangée Retour / Suivant quand elle flotte) ;
//   S2  le dessin du radar (union des tracés et étiquettes) occupe ≥ 90 % de la largeur utile (largeur de la colonne de pesée) ;
//   S3  pas de cadre vide : le dessin couvre ≥ 85 % de la hauteur de son panneau ;
//   S4  étiquettes d'ions lisibles : le symbole d'ion rendu ≥ 11 px ;
//   S5  aucun champ de dose en type="number".
// Rouge attendu sur en-ligne/2026-11-22-tour9 (radar ≈ 160 px dans un cadre de 370, acides sous le pli).
// --captures : en plus, 390×660, 390×844 et 1280×900, clair et cave, au repos (fichiers `<largeur>x<hauteur>-<thème>.png`).
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
const drapeau = (n) => args.includes(`--${n}`);
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'parcours-eau-sels'));
fs.mkdirSync(sortie, { recursive: true });
const THEMES = opt('themes', 'clair').split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);
const SELS = ['gypse', 'cacl2', 'epsom', 'mgcl2', 'nacl', 'nahco3', 'caco3', 'chaux', 'kcl'];

function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, encoding: 'utf8', shell: true });
  if (r.status !== 0) throw new Error(`build en échec : ${(r.stdout + r.stderr).slice(-600)}`);
}

let dossier = opt('build', null); const tmp = !dossier;
let copie = null;
try {
  if (!dossier) {
    dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'parcours-eau-sels-build-'));
    let racine = RACINE;
    if (opt('ref', null)) {
      copie = path.join(os.tmpdir(), `parcours-eau-sels-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref', null)], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^\.env(\..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      racine = copie;
    }
    console.log(`build ${opt('ref', null) ? `du tag ${opt('ref', null)}` : "de l'arbre de travail"} …`); construire(racine, dossier);
  }
  await jouer(path.resolve(dossier));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 400)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  if (tmp && dossier && !process.env.PARCOURS_GARDER) fs.rmSync(dossier, { recursive: true, force: true });
}
if (echecs.length) { console.log(`PARCOURS EAU-SELS ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS EAU-SELS OK');

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
  const fenetres = [[390, 660, true], [390, 844, true]];
  if (drapeau('captures')) fenetres.push([1280, 900, false]);
  try {
    for (const [L, H, tactile] of fenetres) for (const theme of THEMES) {
      const combo = `${L}x${H}-${theme}`;
      const p = await nav.newPage();
      await p.setViewport({ width: L, height: H, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: tactile ? 2 : 1 });
      await p.evaluateOnNewDocument((t) => localStorage.setItem('laffinee.theme', t), theme);
      const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 160)));
      const toucherTexte = async (txts) => {
        for (const t of [].concat(txts)) {
          const c = await p.evaluate((t) => {
            const debut = t.startsWith('^'), m = debut ? t.slice(1) : t, egal = (x) => (debut ? x.startsWith(m) : x === m);
            const e = [...document.querySelectorAll('button,a,[role=tab],[role=button]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (egal((e.getAttribute('aria-label') ?? '').trim()) || egal(e.innerText.trim().replace(/\s+/g, ' '))); });
            if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
          }, t);
          if (c) { if (tactile) await p.touchscreen.tap(c[0], c[1]); else await p.mouse.click(c[0], c[1]); await sleep(900); return true; }
        }
        return false;
      };
      try {
        await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(800);
        if (!(await toucherTexte('Actions rapides')) || !(await toucherTexte(['Créer une recette', 'Recette']))) throw new Error('assistant de recette introuvable');
        await sleep(1200);
        // un malt de base (5 kg) : sans grain, l'eau vaut 0 L et les acides restent vides ; avec lui, les volumes et les doses sont réels
        if (await toucherTexte(['Malts/sucres', 'Fermentescibles']) && await p.$('[data-role=ajout]')) {
          if (/^Sucre/.test(await p.evaluate(() => document.querySelector('[data-role=fam]')?.innerText.trim() ?? ''))) await p.click('[data-role=fam]');
          await p.focus('[data-role=ajout]'); await p.keyboard.type('Pilsner'); await p.keyboard.press('Enter'); await sleep(900);
          await p.keyboard.press('Escape').catch(() => {}); await sleep(300);
        }
        if (!(await toucherTexte(['Eau', 'Eau et sels']))) throw new Error('étape Eau introuvable');
        await sleep(800);
        if (!(await toucherTexte('^2. Sels'))) throw new Error('segment « 2. Sels » introuvable');
        await sleep(1500);
        const m = await p.evaluate((SELS) => {
          const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
          const boite = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, d: r.right, b: r.bottom, w: r.width, h: r.height }; };
          const racine = document.querySelector('[data-water-controls]');
          const svg = racine?.querySelector('svg[role="img"]');
          // fenêtre utile : sous la barre de segments collante, au-dessus de la rangée de fin si elle couvre la fenêtre
          const navSeg = document.querySelector('[data-water-navigation]');
          let haut = navSeg && vis(navSeg) ? navSeg.getBoundingClientRect().bottom : 0;
          let bas = innerHeight;
          const suivant = [...document.querySelectorAll('button')].find((b) => vis(b) && /^Suivant/.test(b.innerText.trim()));
          if (suivant) { const r = suivant.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) bas = Math.min(bas, r.top - 4); }
          const dedans = (e) => { if (!e || !vis(e)) return { ok: false, pourquoi: 'absent' }; const r = e.getBoundingClientRect(); const okv = r.top >= haut - 1 && r.bottom <= bas + 1 && r.left >= -1 && r.right <= innerWidth + 1; return { ok: okv, pourquoi: okv ? '' : `y ${Math.round(r.top)}–${Math.round(r.bottom)} hors ${Math.round(haut)}–${Math.round(bas)}` }; };
          const res = { haut, bas, scroll: document.querySelector('main')?.scrollTop ?? scrollY };
          res.radar = svg ? dedans(svg) : { ok: false, pourquoi: 'radar absent' };
          if (svg) {
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (const e of svg.querySelectorAll('circle, path, line, polygon, text')) { const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue; x0 = Math.min(x0, r.left); x1 = Math.max(x1, r.right); y0 = Math.min(y0, r.top); y1 = Math.max(y1, r.bottom); }
            const largeurUtile = racine.getBoundingClientRect().width;
            const panneau = svg.closest('.water-radar-panel') ?? svg.parentElement;
            const pr = panneau.getBoundingClientRect();
            const anneaux = [...svg.querySelectorAll('circle[fill="none"]')].map((c) => c.getBoundingClientRect().width);
            const echelle = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
            const symboles = [...svg.querySelectorAll('text')].filter((t) => /(Cl|SO|Ca|Mg|Na|HCO)/.test(t.textContent)).map((t) => parseFloat(getComputedStyle(t).fontSize) * Math.min(echelle, svg.getBoundingClientRect().height / svg.viewBox.baseVal.height));
            res.dessin = { w: x1 - x0, h: y1 - y0, largeurUtile, panneauH: pr.height, panneauW: pr.width, diametre: Math.max(0, ...anneaux), symboleMin: Math.min(...symboles) };
          }
          res.sels = SELS.map((id) => { const li = document.getElementById(`water-salt-${id}`); const champ = li?.querySelector('input, textarea'); return { id, ...dedans(champ ?? li), type: champ?.getAttribute('type') ?? null }; });
          const acides = [...document.querySelectorAll('[data-water-acids] input, [data-water-acids] textarea')];
          const champAcide = (mot) => acides.find((c) => (c.getAttribute('aria-label') ?? '').includes(mot));
          res.acides = [['empâtage', 'à l’empâtage'], ['rinçage', 'au rinçage']].map(([nom, mot]) => { const c = champAcide(mot); return { nom, ...dedans(c), type: c?.getAttribute('type') ?? null }; });
          res.nombre = [...(racine?.querySelectorAll('input[type=number]') ?? [])].length;
          return res;
        }, SELS);
        if (drapeau('captures')) await p.screenshot({ path: path.join(sortie, `${combo}.png`) });
        if (tactile) {
          const c = combo;
          console.log(`  · ${c} fenêtre utile ${Math.round(m.haut)}–${Math.round(m.bas)} px, défilement ${Math.round(m.scroll)}`);
          m.radar.ok ? ok(`S1 radar ${c}`) : echec(`S1 radar ${c}`, m.radar.pourquoi);
          const selsHors = m.sels.filter((s) => !s.ok);
          selsHors.length ? echec(`S1 sels ${c}`, `${selsHors.length}/9 hors fenêtre : ${selsHors.map((s) => `${s.id} (${s.pourquoi})`).join(', ')}`) : ok(`S1 sels ${c}`, '9/9 dans la fenêtre');
          for (const a of m.acides) a.ok ? ok(`S1 acide ${a.nom} ${c}`) : echec(`S1 acide ${a.nom} ${c}`, a.pourquoi);
          if (m.dessin) {
            const d = m.dessin, part = d.w / d.largeurUtile, couv = (d.w * d.h) / (d.panneauW * d.panneauH);
            part >= 0.9 ? ok(`S2 taille ${c}`, `dessin ${Math.round(d.w)} px / ${Math.round(d.largeurUtile)} (${Math.round(part * 100)} %), cercle ${Math.round(d.diametre)} px`)
              : echec(`S2 taille ${c}`, `dessin ${Math.round(d.w)} px / ${Math.round(d.largeurUtile)} utiles (${Math.round(part * 100)} % < 90 %), cercle ${Math.round(d.diametre)} px`);
            couv >= 0.75 ? ok(`S3 cadre ${c}`, `${Math.round(couv * 100)} % de la surface du panneau`) : echec(`S3 cadre ${c}`, `dessin ${Math.round(d.w)}×${Math.round(d.h)} dans un panneau ${Math.round(d.panneauW)}×${Math.round(d.panneauH)} (${Math.round(couv * 100)} % < 75 %) : cadre vide`);
            d.symboleMin >= 11 ? ok(`S4 étiquettes ${c}`, `${d.symboleMin.toFixed(1)} px`) : echec(`S4 étiquettes ${c}`, `symbole d'ion à ${d.symboleMin.toFixed(1)} px (< 11)`);
          } else echec(`S2 taille ${c}`, 'radar absent');
          const nb = m.nombre + m.sels.filter((s) => s.type === 'number').length + m.acides.filter((a) => a.type === 'number').length;
          nb ? echec(`S5 clavier ${c}`, `${nb} champ(s) type="number"`) : ok(`S5 clavier ${c}`);
        }
      } catch (e) { echec(combo, String(e.message ?? e).slice(0, 200)); await p.screenshot({ path: path.join(sortie, `${combo}-erreur.png`) }).catch(() => {}); }
      if (erreurs.length) echec(`erreurs de page ${combo}`, erreurs.slice(0, 2).join(' | '));
      await p.close();
    }
  } finally { await nav.close(); srv.close(); }
}
