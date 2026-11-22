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
//   S5  aucun champ de dose en type="number" ;
//   S6  (EAU-RADAR-ETIQUETTES, 22.11, « Oula c'est pas terribles ça ») chaque étiquette d'ion à ≤ 24 px du bout de son axe,
//       sans chevaucher (2 px d'air) une autre étiquette, une graduation, la légende ni K⁺, entière dans la toile et l'écran,
//       valeur et plage ≥ 11 px. Rouge attendu sur 8172f5c3d (étiquettes dans les coins).
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
            res.dessin = { w: x1 - x0, h: y1 - y0, largeurUtile, blocH: svg.closest('.water-radar')?.getBoundingClientRect().height ?? pr.height, panneauH: pr.height, panneauW: pr.width, diametre: Math.max(0, ...anneaux), symboleMin: Math.min(...symboles) };
            // S6 (EAU-RADAR-ETIQUETTES) : chaque étiquette au bout de son axe, entière, sans chevauchement.
            const visible = (e) => vis(e) && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[data-radar-gabarit]');
            const M = svg.getScreenCTM();
            const ecran = (x, y) => { const q = new DOMPoint(x, y).matrixTransform(M); return [q.x, q.y]; };
            const ANG = { cl: -90, so4: -30, ca: 30, mg: 90, na: 150, hco3: -150 };
            const lignes = [...svg.querySelectorAll('line')].map((l) => [l.x1.baseVal.value, l.y1.baseVal.value, l.x2.baseVal.value, l.y2.baseVal.value]);
            const parCentre = {};
            for (const l of lignes) (parCentre[`${l[0].toFixed(1)},${l[1].toFixed(1)}`] ??= []).push(l);
            const axes = Object.values(parCentre).find((g) => g.length >= 6) ?? [];
            const sv = svg.getBoundingClientRect();
            const etiq = [...svg.querySelectorAll('[data-radar-etiquette]')].filter(visible).map((g) => {
              const ion = g.getAttribute('data-radar-etiquette');
              const textes = [...g.querySelectorAll('text')].filter(visible).map(boite);
              const b = { x: Math.min(...textes.map((t) => t.x)), y: Math.min(...textes.map((t) => t.y)), d: Math.max(...textes.map((t) => t.d)), b: Math.max(...textes.map((t) => t.b)) };
              const axe = axes.find((l) => { const a = Math.atan2(l[3] - l[1], l[2] - l[0]) * 180 / Math.PI; return Math.abs(((a - ANG[ion] + 540) % 360) - 180) < 5; });
              let dist = null;
              if (axe) { const [tx, ty] = ecran(axe[2], axe[3]); const dx = Math.max(b.x - tx, 0, tx - b.d), dy = Math.max(b.y - ty, 0, ty - b.b); dist = Math.hypot(dx, dy); }
              const tailles = [...g.querySelectorAll('text, tspan')].filter((t) => /\d/.test([...t.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''))).map((t) => parseFloat(getComputedStyle(t).fontSize));
              const plage = /\d+–\d+|sans cible/.test(g.textContent);
              const dehors = b.x < Math.max(0, sv.left) - 0.5 || b.d > Math.min(innerWidth, sv.right) + 0.5 || b.y < sv.top - 0.5 || b.b > sv.bottom + 0.5;
              return { ion, textes, b, dist, police: tailles.length ? Math.min(...tailles) : 0, plage, dehors, sortie: dehors ? `${Math.round(b.x)}–${Math.round(b.d)} × ${Math.round(b.y)}–${Math.round(b.b)} hors ${Math.round(sv.left)}–${Math.round(sv.right)} × ${Math.round(sv.top)}–${Math.round(sv.bottom)}` : '' };
            });
            const grads = [...svg.querySelectorAll('text')].filter((t) => visible(t) && !t.closest('[data-radar-etiquette], [data-radar-legende]') && /^\s*\d+\s*$/.test(t.textContent)).map((t) => ({ nom: `graduation ${t.textContent.trim()}`, r: boite(t) }));
            const legende = [...document.querySelectorAll('[data-radar-legende] text, [data-radar-legende] line, [data-radar-legende] rect, .water-radar-legend > span')].filter((e) => visible(e) && racine.contains(e)).map((e) => ({ nom: 'légende', r: boite(e) }));
            const potassium = [...svg.querySelectorAll('[data-radar-potassium]')].filter(visible).map((e) => ({ nom: 'K⁺', r: boite(e) }));
            const touche = (a, c) => a.x < c.d + 2 && c.x < a.d + 2 && a.y < c.b + 2 && c.y < a.b + 2;
            const chocs = [];
            etiq.forEach((e, i) => {
              const autres = [...etiq.filter((_, j) => j !== i).flatMap((o) => o.textes.map((r) => ({ nom: `étiquette ${o.ion}`, r }))), ...grads, ...legende, ...potassium];
              for (const o of autres) if (e.textes.some((t) => touche(t, o.r)) && !chocs.some((c) => c === `${o.nom.replace('étiquette ', '')} / ${e.ion}`)) chocs.push(`${e.ion} / ${o.nom.replace('étiquette ', '')}`);
            });
            res.etiquettes = { n: etiq.length, liste: etiq.map(({ textes, ...r }) => r), chocs };
            // --radar : la géométrie lue (viewBox, rayon, forme et boîte de chaque étiquette, gabarits mesurés)
            const bb = (g) => { const b = g.getBBox(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v)).join(','); };
            res.radarInfo = { viewBox: svg.getAttribute('viewBox'), R: Math.round(Math.max(0, ...anneaux) / 2 / echelle), etiq: etiq.map((e) => `${e.ion}:${svg.querySelector(`[data-radar-etiquette=${e.ion}]`)?.getAttribute('data-forme')}@${Math.round(e.b.x)},${Math.round(e.b.y)}–${Math.round(e.b.d)},${Math.round(e.b.b)}`), gabarits: [...svg.querySelectorAll('[data-radar-gabarit] > g')].map(bb) };
          }
          res.sels = SELS.map((id) => { const li = document.getElementById(`water-salt-${id}`); const champ = li?.querySelector('input, textarea'); return { id, ...dedans(champ ?? li), type: champ?.getAttribute('type') ?? null }; });
          const acides = [...document.querySelectorAll('[data-water-acids] input, [data-water-acids] textarea')];
          const champAcide = (mot) => acides.find((c) => (c.getAttribute('aria-label') ?? '').includes(mot));
          res.acides = [['empâtage', 'à l’empâtage'], ['rinçage', 'au rinçage']].map(([nom, mot]) => { const c = champAcide(mot); return { nom, ...dedans(c), type: c?.getAttribute('type') ?? null }; });
          res.nombre = [...(racine?.querySelectorAll('input[type=number]') ?? [])].length;
          return res;
        }, SELS);
        if (drapeau('captures')) await p.screenshot({ path: path.join(sortie, `${combo}.png`) });
        // --geste : réglage au doigt d'un sel (+ deux fois) et de l'acide d'empâtage (+), puis capture `<combo>-geste.png`
        // et les hauteurs mesurées (cellule de sel, nom, champ ; rangée du rapport ; bas de la ligne pH contre la fenêtre utile).
        if (drapeau('geste')) {
          const avant = await p.evaluate(() => document.querySelector('[data-water-ph]')?.innerText.trim() ?? '');
          const touches = [await toucherTexte('Ajouter 0,5 g de Gypse'), await toucherTexte('Ajouter 0,5 g de Gypse'), await toucherTexte('^Ajouter 0,5 mL — empâtage')];
          await sleep(1200);
          const g = await p.evaluate((bas) => {
            const h = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return `${Math.round(r.top)}–${Math.round(r.bottom)} (${Math.round(r.height)})`; };
            return {
              cellule: h('#water-salt-gypse'), nom: h('#water-salt-gypse .water-salt-name'), champ: h('#water-salt-gypse input, #water-salt-gypse textarea'),
              rapport: h('.water-ratio-compact'), lectures: h('.water-ratio-compact .ratio-readings'), ph: h('[data-water-ph]'), bas,
              gypse: document.querySelector('#water-salt-gypse input, #water-salt-gypse textarea')?.value,
              acide: document.querySelector('[data-water-acids] input, [data-water-acids] textarea')?.value,
              phTexte: document.querySelector('[data-water-ph]')?.innerText.trim(),
              styles: ['#water-salt-gypse .water-salt-name', '#water-salt-gypse input, #water-salt-gypse textarea', '.water-ratio-compact .ratio-readings', '.water-ratio-compact .ratio-track', '.water-ratio-compact .ratio-title']
                .map((s) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return `${e.tagName} y${Math.round(r.top)} h${Math.round(r.height)} minH ${c.minHeight} mt ${c.marginTop} pad ${c.paddingTop}/${c.paddingBottom} fs ${c.fontSize} lh ${c.lineHeight} pos ${c.position}`; }),
            };
          }, m.bas);
          console.log(`  · geste ${combo} touches ${touches.join('/')} ; pH avant « ${avant} »`);
          console.log(`    ${JSON.stringify(g)}`);
          await p.screenshot({ path: path.join(sortie, `${combo}-geste.png`) });
        }
        if (tactile) {
          const c = combo;
          console.log(`  · ${c} fenêtre utile ${Math.round(m.haut)}–${Math.round(m.bas)} px, défilement ${Math.round(m.scroll)}`);
          m.radar.ok ? ok(`S1 radar ${c}`) : echec(`S1 radar ${c}`, m.radar.pourquoi);
          const selsHors = m.sels.filter((s) => !s.ok);
          selsHors.length ? echec(`S1 sels ${c}`, `${selsHors.length}/9 hors fenêtre : ${selsHors.map((s) => `${s.id} (${s.pourquoi})`).join(', ')}`) : ok(`S1 sels ${c}`, '9/9 dans la fenêtre');
          for (const a of m.acides) a.ok ? ok(`S1 acide ${a.nom} ${c}`) : echec(`S1 acide ${a.nom} ${c}`, a.pourquoi);
          if (m.dessin) {
            const d = m.dessin, part = d.w / d.largeurUtile, couv = (d.w * d.h) / (d.panneauW * d.panneauH);
            // « mesure équivalente » (EAU-RADAR-ETIQUETTES, 22.11) : à 390×660 le disque est borné par la HAUTEUR ; les étiquettes au
            // bout de leur axe ne remplissent plus les coins. Il passe si le cercle prend ≥ 90 % de la hauteur de la toile (svg et ligne de
            // légende) et le dessin ≥ 85 % de la hauteur du panneau (pas de cadre vide).
            const parHauteur = d.diametre >= 0.9 * d.blocH && d.h >= 0.85 * d.panneauH;
            if (parHauteur && (part < 0.9 || couv < 0.75)) ok(`S2-S3 borné par la hauteur ${c}`, `cercle ${Math.round(d.diametre)} px, toile ${Math.round(d.blocH)} px (${Math.round(d.diametre / d.blocH * 100)} %), dessin ${Math.round(d.h)} / panneau ${Math.round(d.panneauH)} px`);
            else part >= 0.9 ? ok(`S2 taille ${c}`, `dessin ${Math.round(d.w)} px / ${Math.round(d.largeurUtile)} (${Math.round(part * 100)} %), cercle ${Math.round(d.diametre)} px`)
              : echec(`S2 taille ${c}`, `dessin ${Math.round(d.w)} px / ${Math.round(d.largeurUtile)} utiles (${Math.round(part * 100)} % < 90 %), cercle ${Math.round(d.diametre)} px`);
            if (!(parHauteur && (part < 0.9 || couv < 0.75))) couv >= 0.75 ? ok(`S3 cadre ${c}`, `${Math.round(couv * 100)} % de la surface du panneau`) : echec(`S3 cadre ${c}`, `dessin ${Math.round(d.w)}×${Math.round(d.h)} dans un panneau ${Math.round(d.panneauW)}×${Math.round(d.panneauH)} (${Math.round(couv * 100)} % < 75 %) : cadre vide`);
            d.symboleMin >= 11 ? ok(`S4 étiquettes ${c}`, `${d.symboleMin.toFixed(1)} px`) : echec(`S4 étiquettes ${c}`, `symbole d'ion à ${d.symboleMin.toFixed(1)} px (< 11)`);
          } else echec(`S2 taille ${c}`, 'radar absent');
          if (drapeau('radar')) console.log(`    radar ${JSON.stringify(m.radarInfo)}`);
          const E = m.etiquettes;
          if (!E || E.n !== 6) echec(`S6 étiquettes ${c}`, `${E?.n ?? 0}/6 étiquettes d'ion`);
          else {
            const loin = E.liste.filter((e) => e.dist == null || e.dist > 24);
            loin.length ? echec(`S6 bout d'axe ${c}`, loin.map((e) => `${e.ion} à ${e.dist == null ? '?' : Math.round(e.dist)} px`).join(', ') + ' (> 24)')
              : ok(`S6 bout d'axe ${c}`, E.liste.map((e) => `${e.ion} ${Math.round(e.dist)}`).join(' '));
            E.chocs.length ? echec(`S6 chevauchement ${c}`, E.chocs.join(', ')) : ok(`S6 chevauchement ${c}`, 'aucun');
            const hors = E.liste.filter((e) => e.dehors);
            hors.length ? echec(`S6 rognée ${c}`, hors.map((e) => `${e.ion} ${e.sortie}`).join(' ; ')) : ok(`S6 rognée ${c}`, 'aucune');
            const petites = E.liste.filter((e) => e.police < 11 || !e.plage);
            petites.length ? echec(`S6 valeur et plage ${c}`, petites.map((e) => `${e.ion} ${e.plage ? `${e.police} px` : 'sans plage'}`).join(', ')) : ok(`S6 valeur et plage ${c}`, '≥ 11 px');
          }
          const nb = m.nombre + m.sels.filter((s) => s.type === 'number').length + m.acides.filter((a) => a.type === 'number').length;
          nb ? echec(`S5 clavier ${c}`, `${nb} champ(s) type="number"`) : ok(`S5 clavier ${c}`);
        }
      } catch (e) { echec(combo, String(e.message ?? e).slice(0, 200)); await p.screenshot({ path: path.join(sortie, `${combo}-erreur.png`) }).catch(() => {}); }
      if (erreurs.length) echec(`erreurs de page ${combo}`, erreurs.slice(0, 2).join(' | '));
      await p.close();
    }
  } finally { await nav.close(); srv.close(); }
}
