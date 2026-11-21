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
//
//   --endroits recette,calendrier,periode : les endroits joués (défaut : recette et calendrier).
//   periode (PERIODE-PARTOUT, 21.11) : chaque écran qui choisit une période libre monte LA frise d'Opérations (`FrisePeriode`), jamais
//   deux listes de mois ; le début tiré vers le passé change la période, relue après rechargement. Rouge sur en-ligne/2026-11-21-tour8.
//   --ref <tag> : construit ce tag dans une copie temporaire (comme le parcours Calendrier) ; les étapes Calendrier y sont rouges sur
//                 en-ligne/2026-11-21-tour7 (frise d'avant la frise B) et vertes sur l'arbre.
//   navigation (V4, chasse Calendrier 21.11 : CH-N5, CH-N8, CH-N12 ; 390 tactile) : sauts vers une chose, retour, loupe. Rouge sur tour8. CHN-11 refusé (APP-ENTETE-COLLE) : pas de contrôle.
// Calendrier (fixture `fixtures/calendrier.mjs`, données simulées, plus « ZZ TEST Geste », des travaux de deux semaines) : la frise du haut (le cadre de la
// courbe : R4 au repos, toucher sans bouger, reculer et avancer le début, étirer et réduire la fin, Échap à 1280, valeur après rechargement)
// et une barre (toucher sans bouger, glisser + et −, étirer la fin prise à 18 px DEHORS (R3), réduire, Échap à 1280, valeur après rechargement).
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
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'parcours-geste'));
fs.mkdirSync(sortie, { recursive: true });
const LARGEURS = opt('largeurs', '390,1280').split(',').map(Number);
const THEMES = opt('themes', 'clair,cave').split(',');
const ENDROITS_JOUES = opt('endroits', 'recette,calendrier').split(',');
const CLE_FIXTURE = 'parcours-calendrier:fixture', CLE_CACHE = 'parcours-calendrier:cache', ID_GESTE = 'P-ZZ-GESTE';
const { fixtureCalendrier, ajouter, lundiDe } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

// Les endroits atteints par le parcours : le chemin dans la recette (textes à toucher ; « ^texte » = commence par ; une fonction = préparer
// l'état, idempotente car rejouée au rechargement), l'élément tenu, la valeur lue.
const ETAPE_EAU = ['Eau', 'Eau et sels'];
// une ligne de sucre à créer d'abord (recette vierge) : famille « Sucre » (la bascule), nom, Entrée. Sa barre règle la MASSE (réglage
// quantité, échelle vers le haut) ; celle d'un grain règle sa part du grain (immobile quand il est seul).
const SUCRE = '.fer-bw:not([data-role=part-ligne])';
const unMalt = async ({ p }) => {
  if (await p.$(SUCRE)) return;
  if (!(await p.evaluate(() => /^Sucre/.test(document.querySelector('[data-role=fam]')?.innerText.trim() ?? '')))) await p.click('[data-role=fam]');
  await p.focus('[data-role=ajout]'); await p.keyboard.type('Dextrose'); await p.keyboard.press('Enter'); await sleep(900);
  if (!(await p.$(SUCRE))) throw new Error('ligne de sucre non créée');
};
// une levure à choisir (la puce disparaît une fois choisie), puis la rangée Levure du Récap. ouverte
const uneLevure = async ({ p, toucherTexte }) => { if (await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.innerText.trim().startsWith('Pomona')))) await toucherTexte('^Pomona'); };
const rangeeLevure = async ({ p }) => {
  const c = await p.evaluate(() => {
    const d = [...document.querySelectorAll('details')].find((d) => d.querySelector('summary .rc2-titre')?.textContent.trim() === 'Levure');
    if (!d || d.open) return null; const s = d.querySelector('summary'); s.scrollIntoView({ block: 'center' }); const r = s.getBoundingClientRect(); return [r.x + 30, r.y + r.height / 2];
  });
  if (c) { await p.mouse.click(c[0], c[1]); await sleep(700); }
};
const ENDROITS = [
  { nom: 'volume-identite', etape: ['Identité'], tenu: '.idv input[type=range], [data-carte="volume"] input[type=range]', repli: 0 },
  { nom: 'ebullition-identite', etape: ['Identité'], tenu: 'input[type=range][aria-label*="bullition" i]' },
  { nom: 'ratio-eau', etape: [ETAPE_EAU, '^2. Sels'], tenu: '.ratio-track', valeur: '.ratio-track input[type=range]' },
  { nom: 'gradue-eau', etape: [ETAPE_EAU], tenu: 'input[type=range]:not(.ratio-track input)', repli: 0 },
  { nom: 'malt-ligne', etape: [['Malts/sucres', 'Fermentescibles'], unMalt], tenu: SUCRE, valeur: `${SUCRE} [data-role=masse-curseur]` },
  { nom: 'levure-recap', etape: ['Levure', uneLevure, ['Récap.', 'Récap', 'Récapitulatif'], rangeeLevure], tenu: 'input[aria-label="Curseur de quantité de levure"]' },
];

function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossier = opt('build', null); const tmp = !dossier;
let copie = null;
try {
  if (!dossier) {
    dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'parcours-geste-build-'));
    let racine = RACINE;
    if (opt('ref', null)) {
      // même copie que le parcours Calendrier : git worktree détaché dans os.tmpdir(), node_modules en jonction, .env repris
      copie = path.join(os.tmpdir(), `parcours-geste-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref', null)], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      racine = copie;
    }
    console.log(`build ${opt('ref', null) ? `du tag ${opt('ref', null)}` : 'de l\'arbre de travail'} …`); construire(racine, dossier);
  }
  await jouer(path.resolve(dossier));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 400)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  if (tmp && dossier && !process.env.PARCOURS_GARDER) fs.rmSync(dossier, { recursive: true, force: true });
}
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
            const debut = t.startsWith('^'), m = debut ? t.slice(1) : t, egal = (x) => (debut ? x.startsWith(m) : x === m);
            const e = [...document.querySelectorAll('button,a,[role=tab],[role=button]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (egal((e.getAttribute('aria-label') ?? '').trim()) || egal(e.innerText.trim().replace(/\s+/g, ' '))); });
            if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
          }, t);
          if (c) { if (tactile) await p.touchscreen.tap(c[0], c[1]); else await p.mouse.click(c[0], c[1]); await sleep(900); return true; }
        }
        return false;
      };
      const ouvrir = async (etape, essai = 0) => {
        await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(800);
        if (!(await toucherTexte('Actions rapides')) || !(await toucherTexte(['Créer une recette', 'Recette']))) throw new Error('assistant de recette introuvable');
        await sleep(1200);
        for (const pas of etape ?? []) {
          if (typeof pas === 'function') { await pas({ p, toucherTexte }); continue; }
          if (!(await toucherTexte(pas))) { if (!essai && (await p.evaluate(() => document.body.innerText.includes('Écran indisponible')))) return ouvrir(etape, 1); throw new Error(`« ${[].concat(pas)[0]} » introuvable`); }
          await sleep(600);
        }
        await sleep(600);
        if (!essai && (await p.evaluate(() => document.body.innerText.includes('Écran indisponible')))) { console.log('  (écran indisponible : rechargé)'); return ouvrir(etape, 1); }
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

      for (const E of ENDROITS_JOUES.includes('recette') ? ENDROITS : []) {
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
      if (ENDROITS_JOUES.includes('calendrier')) {
        try { await jouerCalendrier({ p, base: url, combo, tactile, glisser, pas }); }
        catch (e) { echec(`calendrier ${combo}`, String(e.message ?? e).slice(0, 200)); await p.screenshot({ path: path.join(sortie, `calendrier-${combo}-erreur.png`) }).catch(() => {}); }
      }
      if (ENDROITS_JOUES.includes('periode')) await jouerPeriode({ nav, base: url, L, theme });
      if (ENDROITS_JOUES.includes('navigation')) await jouerNavigation({ nav, base: url, L, theme });
      if (erreurs.length) echec(`erreurs de page ${combo}`, erreurs.slice(0, 2).join(' | '));
      await p.close();
    }
  } finally { await nav.close(); srv.close(); }
}

// ───────────── Calendrier : la frise du haut (cadre de la courbe) et une barre ─────────────
// Données simulées : la fixture du parcours Calendrier, plus « ZZ TEST Geste » : des travaux de deux semaines (S+3 à S+4),
// une barre à poignée comme « Sols : colle et joints » (une activité n'est qu'un picto, sans bord à tirer).
// Chaque combinaison repart de la fixture (le cache du parcours est vidé) : rien d'une combinaison ne passe à la suivante.
function fixtureGeste() {
  const auj = new Date().toISOString().slice(0, 10), L = lundiDe(auj), s = (n, j = 0) => ajouter(L, n * 7 + j);
  const fx = fixtureCalendrier(auj);
  fx.entrees.push({ name: 'financialPlans', id: ID_GESTE, data: { id: ID_GESTE, title: 'ZZ TEST Geste', date: s(3), amountCents: 5000, direction: 'out', category: 'renovation', source: 'manual', status: 'active', createdAt: `${ajouter(auj, -30)}T08:00:00.000Z`, fenetre: { du: s(3), au: s(4, 6), joursActifs: 4 } } });
  return JSON.stringify(fx.entrees);
}

async function jouerCalendrier({ p, base, combo, tactile, glisser, pas }) {
  const url = `${base}&finance-demo=parcours-calendrier`;
  const cap = (nom) => p.screenshot({ path: path.join(sortie, `calendrier-${combo}-${nom}.png`) });
  const toucherXY = async (x, y) => { if (tactile) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await sleep(650); };
  const toucherTexte = async (t) => {
    const c = await p.evaluate((t) => {
      const e = [...document.querySelectorAll('button,a,[role=tab],[role=button],[role=menuitem],[role=option]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && ((e.getAttribute('aria-label') ?? '').trim() === t || e.innerText.trim().replace(/\s+/g, ' ') === t); });
      if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
    }, t);
    if (!c) throw new Error(`« ${t} » introuvable`);
    await toucherXY(c[0], c[1]);
  };
  const versCalendrier = async () => {
    await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(1000);
    if (!(await p.$('[data-calendrier]'))) await toucherTexte('Calendrier');
    await p.waitForSelector('[data-calendrier]', { timeout: 30000 }); await sleep(700);
  };
  const echap = async () => { await p.keyboard.press('Escape'); await sleep(400); };

  // la fixture neuve, puis « 3 mois » (la fenêtre de 13 semaines, cadre et barres lisibles à 390)
  // posée avant le code de la page, une fois par combinaison (le rechargement garde ce que les gestes ont écrit)
  await p.evaluateOnNewDocument((kf, kc, j, tag) => {
    if (localStorage.getItem('geste:fixture-posee') === tag) return;
    // tout le stockage remis à neuf (la fenêtre de la combinaison d'avant restait : S35 en 1280-cave, la barre hors champ), le thème gardé
    const theme = localStorage.getItem('laffinee.theme'); localStorage.clear(); sessionStorage.clear(); if (theme) localStorage.setItem('laffinee.theme', theme);
    localStorage.removeItem(kc); localStorage.setItem(kf, j); localStorage.setItem('geste:fixture-posee', tag);
  }, CLE_FIXTURE, CLE_CACHE, fixtureGeste(), `${combo}-${Date.now()}`);
  await versCalendrier();
  const menu = await p.evaluate(() => { const e = document.querySelector('[aria-label$="période, liste, tri et filtre"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  if (!menu) throw new Error('bouton du menu de période introuvable');
  await toucherXY(menu[0], menu[1]); await toucherTexte('3 mois'); await sleep(600);

  // la barre d'abord : les gestes du cadre déplacent la fenêtre, la barre pourrait en sortir
  const sectionBarre = async () => {
    // ── une barre : « ZZ TEST Geste » ──
    const B = `barre ${combo}`;
    const valeur = () => p.evaluate((k, id) => { const e = JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === id); if (!e) return null; const f = e.data.fenetre; return { du: f?.du ?? e.data.date, au: f?.au ?? e.data.date, cle: `${f?.du ?? e.data.date}→${f?.au ?? e.data.date}` }; }, CLE_CACHE, ID_GESTE);
    const barre = () => p.evaluate(() => {
      const e = document.querySelector('[aria-label^="ZZ TEST Geste,"]'); if (!e) return null;
      e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect();
      const cols = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((x) => x.getBoundingClientRect().x);
      return { l: r.left, r: r.right, w: r.width, y: r.top + r.height / 2, col: cols.length > 1 ? (cols[cols.length - 1] - cols[0]) / (cols.length - 1) : 26 };
    });
    const v0 = await valeur(), b0 = await barre();
    if (!v0 || !b0) { echec(B, `« ZZ TEST Geste » ${v0 ? 'absente de la frise' : 'absente du cache'}`); await cap('barre-introuvable'); return; }
    // R1 : toucher sans bouger (corps, puis bord) : aucune date ne change (la fiche peut s'ouvrir : Échap la ferme)
    // un geste sur une barre ne touche jamais au reste de l'écran : l'interrupteur d'alignement de la courbe reste comme il était
    const aligne = () => p.evaluate(() => document.querySelector('[aria-label="Aligner la courbe sur la frise"]')?.getAttribute('aria-pressed') ?? null);
    const memeAlignement = async (nom, avant) => { const apres = await aligne(); if (apres !== avant) echec(`${B} ${nom}`, `l'alignement de la courbe a basculé (${avant} → ${apres})`); };
    for (const [nom, x] of [['corps', b0.l + b0.w / 2], ['bord', b0.r]]) {
      const al = await aligne();
      await glisser(x, b0.y, []); await echap();
      await memeAlignement(`toucher ${nom}`, al);
      const v = await valeur(); v.cle === v0.cle ? ok(`${B} toucher ${nom}`, `reste ${v0.cle}`) : echec(`${B} toucher ${nom}`, `${v0.cle} → ${v.cle}`);
    }
    const geste = async (nom, x0, dx, verifie, o = {}) => {
      const a = await valeur(), bb = await barre(), al = await aligne(); const x = typeof x0 === 'function' ? x0(bb) : x0;
      await glisser(x, bb.y, pas(x, x + dx), o); await sleep(500); await echap();
      await memeAlignement(nom, al);
      const b = await valeur(); const r = verifie(a, b);
      r === true ? ok(`${B} ${nom}`, `${a.cle} → ${b.cle}`) : echec(`${B} ${nom}`, `${a.cle} → ${b.cle}${r ? ` (${r})` : ''}`);
    };
    const col = b0.col;
    await geste('glisser +', (bb) => bb.l + bb.w / 2, 2 * col, (a, b) => (b.du > a.du && b.au > a.au) || 'plus tard attendu');
    await geste('glisser −', (bb) => bb.l + bb.w / 2, -2 * col, (a, b) => (b.du < a.du && b.au < a.au) || 'plus tôt attendu');
    // R3 : la fin se prend à 18 px DEHORS (zone de 22 px de chaque côté du trait)
    await geste('étirer la fin prise à 18 px dehors (R3)', (bb) => bb.r + 18, 2 * col, (a, b) => (b.au > a.au && b.du === a.du) || 'fin plus tard, même début attendus');
    await cap('barre-etiree');
    await geste('réduire la fin', (bb) => bb.r - Math.min(8, bb.w / 4), -col, (a, b) => (b.au < a.au && b.du === a.du) || 'fin plus tôt, même début attendus');
    if (!tactile) await geste('Échap pendant le glisser', (bb) => bb.l + bb.w / 2, 2 * col, (a, b) => b.cle === a.cle || 'dates d\'avant attendues', { echap: true });
    { const a = await valeur(); await versCalendrier(); const b = await valeur(); const vu = await barre(); (b?.cle === a.cle && vu) ? ok(`${B} rechargement`, a.cle) : echec(`${B} rechargement`, `${a.cle} → ${b?.cle}${vu ? '' : ', barre absente'}`); }
  };
  const sectionCadre = async () => {
    // ── la frise du haut : le cadre de la courbe ──
    // l'état lu : la semaine du début (poignée de début) et la durée (texte du bouton de période), les boîtes du cadre et de la courbe
    const etat = () => p.evaluate(() => {
      const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'), cadre = document.querySelector('.ent-cadre');
      const deb = document.querySelector('[data-poignee=debut]'), per = document.querySelector('[aria-label$="période, liste, tri et filtre"]');
      if (!cb || !cadre || !deb) return null;
      cb.scrollIntoView({ block: 'center' });
      const t = (per?.innerText ?? '').replace(/\s+/g, ' ');
      const m = /(\d+) sem\./.exec(t), n = m ? Number(m[1]) : /3 mois/.test(t) ? 13 : /6 mois/.test(t) ? 26 : /\bAn\b/.test(t) ? 52 : null;
      const s = /commence en S(\d+)/.exec(deb.getAttribute('aria-label') ?? '');
      const a = cb.getBoundingClientRect(), c = cadre.getBoundingClientRect();
      return { debut: s ? Number(s[1]) : null, n, cle: `S${s?.[1]}·${n}`, cb: { l: a.left, r: a.right, y: a.top + a.height / 2, h: a.height }, cadre: { l: c.left, r: c.right, w: c.width }, alignee: cb.hasAttribute('data-courbe-alignee') };
    });
    const e0 = await etat();
    if (!e0) {
      const vu = await p.evaluate(() => ({ courbe: !!document.querySelector('.ent-cb'), cadre: !!document.querySelector('.ent-cadre'), poignee: !!document.querySelector('[data-poignee=debut]'), aligne: document.querySelector('[data-ent-aligne]')?.getAttribute('aria-pressed') ?? null, cachee: document.querySelector('[data-ent-cacher]')?.getAttribute('aria-pressed') ?? null }));
      await cap('cadre-introuvable');
      throw new Error(`courbe ou cadre de la fenêtre introuvable (${JSON.stringify(vu)})`);
    }
    await cap('repos');
    const F = `frise du haut ${combo}`;
    // R4 : au repos, le début à 56 px du bord gauche de la courbe, la fin à 56 px du bord droit
    const g0 = e0.cadre.l - e0.cb.l, d0 = e0.cb.r - e0.cadre.r;
    if (e0.alignee) echec(`${F} R4`, 'la courbe est alignée sur la frise au départ (fixture : éteint attendu)');
    else (Math.abs(g0 - 56) <= 4 && Math.abs(d0 - 56) <= 4) ? ok(`${F} R4`, `bouts à ${g0.toFixed(0)} et ${d0.toFixed(0)} px`) : echec(`${F} R4`, `bouts à ${g0.toFixed(0)} et ${d0.toFixed(0)} px des bords (56 attendus)`);
    const unite = e0.n ? e0.cadre.w / e0.n : 20, y = e0.cb.y, d = Math.max(2 * unite, 24);
    // R1 : toucher sans bouger, au milieu du cadre puis sur le début et sur la fin : rien ne change
    // les points relus avant chaque toucher : la page défile entre deux (etat() recentre la courbe), un point de e0 tombait sur la règle
    for (const [nom, ou] of [['milieu', (c) => (c.l + c.r) / 2], ['début', (c) => c.l + 1], ['fin', (c) => c.r - 1]]) {
      const ei = await etat(); const x = ou(ei.cadre), y = ei.cb.y;
      const sous = await p.evaluate((x, y) => { const e = document.elementFromPoint(x, y); return e ? `${e.tagName}.${String(e.className?.baseVal ?? e.className ?? '').slice(0, 30)}${e.closest('[data-poignee]') ? ` [poignée ${e.closest('[data-poignee]').getAttribute('data-poignee')}]` : ''}` : 'rien'; }, x, y);
      await glisser(x, y, []);
      const juste = await p.evaluate(() => ({ cadre: !!document.querySelector('.ent-cadre'), alignee: !!document.querySelector('[data-courbe-alignee]'), aligne: document.querySelector('[data-ent-aligne]')?.getAttribute('aria-pressed') ?? null, dialogue: [...document.querySelectorAll('[role=dialog]')].filter((d) => d.getBoundingClientRect().width > 0).length }));
      await echap();
      const e = await etat();
      if (!e) { await cap(`toucher-${nom}-perdu`); echec(`${F} toucher ${nom}`, `cadre perdu après le toucher (sous le doigt : ${sous} ; juste après : ${JSON.stringify(juste)})`); continue; }
      e.cle === e0.cle ? ok(`${F} toucher ${nom}`, `reste ${e0.cle}`) : echec(`${F} toucher ${nom}`, `${e0.cle} → ${e.cle} (sous le doigt : ${sous})`);
    }
    // reculer puis avancer le début (la fenêtre entière se déplace, R5), étirer puis réduire la fin (R6)
    const tirer = async (nom, de, vers, verifie) => {
      const a = await etat(); const x0 = de === 'debut' ? a.cadre.l + 1 : a.cadre.r - 1;
      await glisser(x0, a.cb.y, pas(x0, x0 + vers)); await sleep(400);
      const b = await etat(); const r = verifie(a, b);
      r === true ? ok(`${F} ${nom}`, `${a.cle} → ${b.cle}`) : echec(`${F} ${nom}`, `${a.cle} → ${b.cle}${r ? ` (${r})` : ''}`);
      return b;
    };
    await tirer('reculer le début', 'debut', -d, (a, b) => (b.debut !== null && a.debut !== null && b.debut !== a.debut && b.n === a.n && ((a.debut - b.debut + 53) % 53) <= 26) || 'début plus tôt, même durée attendus');
    await tirer('avancer le début', 'debut', d, (a, b) => (b.debut !== null && b.debut !== a.debut && b.n === a.n && ((b.debut - a.debut + 53) % 53) <= 26) || 'début plus tard, même durée attendus');
    await tirer('étirer la fin', 'fin', d, (a, b) => (b.n > a.n && b.debut === a.debut) || 'durée plus longue, même début attendus');
    await cap('cadre-etire');
    const er = await tirer('réduire la fin', 'fin', -d, (a, b) => (b.n < a.n && b.debut === a.debut) || 'durée plus courte, même début attendus');
    // R4 après le lâcher (recalage 200 ms) : les deux bouts reviennent à 56 px
    const g1 = er.cadre.l - er.cb.l, d1 = er.cb.r - er.cadre.r;
    if (!er.alignee) (Math.abs(g1 - 56) <= 4 && Math.abs(d1 - 56) <= 4) ? ok(`${F} R4 après le geste`, `${g1.toFixed(0)} et ${d1.toFixed(0)} px`) : echec(`${F} R4 après le geste`, `bouts à ${g1.toFixed(0)} et ${d1.toFixed(0)} px`);
    // R10 : Échap pendant le tirage rend la fenêtre d'avant (souris)
    if (!tactile) {
      const a = await etat(); await glisser(a.cadre.r - 1, a.cb.y, pas(a.cadre.r - 1, a.cadre.r - 1 + d), { echap: true });
      const b = await etat(); b.cle === a.cle ? ok(`${F} Échap`, `reste ${a.cle}`) : echec(`${F} Échap`, `${a.cle} → ${b.cle}`);
    }
    // la valeur après rechargement
    { const a = await etat(); await versCalendrier(); const b = await etat(); b?.cle === a.cle ? ok(`${F} rechargement`, a.cle) : echec(`${F} rechargement`, `${a.cle} → ${b?.cle}`); }

  };
  const choisirPeriode = async (t) => {
    const m = await p.evaluate(() => { const e = document.querySelector('[aria-label$="période, liste, tri et filtre"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    if (!m) throw new Error('bouton du menu de période introuvable');
    await toucherXY(m[0], m[1]); await toucherTexte(t); await sleep(700);
  };
  // ── capture-11 et capture-12 (21.11) : la frise de la feuille d'ajout. Durée : le début se tire vers le passé, la fin reste ; une chose à
  //    une seule date (Ventes) : un repère seul, tiré dans le passé ──
  const sectionFeuille = async () => {
    const lireFeuille = () => p.evaluate(() => {
      const s = document.querySelector('[data-feuille-semaine]')?.getAttribute('data-feuille-semaine') ?? null;
      const fin = (document.querySelector('[data-fin-duree]')?.getAttribute('aria-valuetext') ?? '').split('jusqu’à ')[1] ?? null;
      const n = Number(document.querySelector('[data-fin-duree]')?.getAttribute('aria-valuenow') ?? 1);
      const pi = document.querySelector('.cal-f-duree-piste');
      if (!pi) return { s, fin, n, piste: null };
      pi.scrollIntoView({ block: 'center' });
      const r = pi.getBoundingClientRect(), barre = pi.querySelector('.cal-f-duree-barre')?.getBoundingClientRect(), point = pi.querySelector('[data-date-point]')?.getBoundingClientRect();
      return { s, fin, n, seule: !!document.querySelector('[data-date-seule]'), piste: { y: r.top + r.height / 2, xa: barre ? barre.left : null, xp: point ? point.left + point.width / 2 : null, px: Number(pi.getAttribute('data-px-semaine')) } };
    });
    for (const [rangee, seule] of [['activites', false], ['ventes', true]]) {
      const nom = `feuille ${rangee} ${combo}`;
      try {
        const plus = await p.evaluate((r) => { const e = document.querySelector(`[data-plus="${r}"]`); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, rangee);
        if (!plus) { echec(nom, 'le + de la rangée introuvable'); continue; }
        await toucherXY(plus[0], plus[1]); await sleep(700);
        const a = await lireFeuille();
        if (!a.piste || (seule && !a.seule)) { await cap(`feuille-${rangee}-sans-frise`); echec(`${nom} ${seule ? 'date dans le passé' : 'début dans le passé'}`, seule ? 'aucune frise de date (un seul repère) dans la feuille' : 'frise de durée introuvable'); await echap(); continue; }
        const x0 = seule ? a.piste.xp : a.piste.xa;
        if (x0 == null) { echec(nom, 'repère introuvable'); await echap(); continue; }
        await glisser(x0, a.piste.y, pas(x0, x0 - 2.2 * a.piste.px)); await sleep(500);
        const b = await lireFeuille();
        await cap(`feuille-${rangee}-passe`);
        if (seule) (b.s && a.s && b.s < a.s) ? ok(`${nom} date dans le passé`, `${a.s} → ${b.s}`) : echec(`${nom} date dans le passé`, `${a.s} → ${b.s} (plus tôt attendu)`);
        else (b.s && a.s && b.s < a.s && b.fin === a.fin && b.n > a.n) ? ok(`${nom} début dans le passé`, `${a.s} → ${b.s}, ${a.n} → ${b.n} sem., fin ${b.fin}`) : echec(`${nom} début dans le passé`, `${a.s} → ${b.s}, ${a.n} → ${b.n} sem., fin ${a.fin} → ${b.fin} (début plus tôt, même fin attendus)`);
        await echap();
      } catch (e) { echec(nom, String(e.message ?? e).slice(0, 160)); await echap(); }
    }
  };
  // ── CAL-MODIFIER (21.11, « Pareil, la modification est horrible ») : Modifier reprend la feuille d'ajout. « ZZ TEST Geste » rouverte :
  //    aucun carrousel de semaines (.cal-f-semaines), la frise Durée présente ; le début tiré dans le passé, Enregistrer : la fenêtre écrite
  //    commence plus tôt et finit au même endroit, relue après rechargement ──
  const sectionModifier = async () => {
    const M = `modifier ${combo}`;
    const valeur = () => p.evaluate((k, id) => { const e = JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === id); if (!e) return null; const f = e.data.fenetre; return { du: f?.du ?? e.data.date, au: f?.au ?? e.data.date, cle: `${f?.du ?? e.data.date}→${f?.au ?? e.data.date}` }; }, CLE_CACHE, ID_GESTE);
    try {
      const v0 = await valeur();
      const b = await p.evaluate(() => { const e = document.querySelector('[aria-label^="ZZ TEST Geste,"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      if (!v0 || !b) { echec(M, '« ZZ TEST Geste » introuvable'); return; }
      await toucherXY(b[0], b[1]); await sleep(600);
      await toucherTexte('Modifier'); await sleep(700);
      const f = await p.evaluate(() => {
        const pi = document.querySelector('[data-mode="modifier"] .cal-f-duree-piste');
        const r = pi?.getBoundingClientRect(); if (pi) pi.scrollIntoView({ block: 'center' });
        const deb = document.querySelector('[data-mode="modifier"] [data-debut-duree]')?.getBoundingClientRect();
        return { mode: !!document.querySelector('[data-mode="modifier"]'), carrousel: document.querySelectorAll('[data-mode="modifier"] .cal-f-semaines').length, piste: !!r, x: deb ? deb.left + deb.width / 2 : null, y: deb ? deb.top + deb.height / 2 : null, px: Number(pi?.getAttribute('data-px-semaine') ?? 0) };
      });
      await cap('modifier-ouvert');
      if (!f.mode) { echec(M, 'la feuille Modifier ne s\'ouvre pas'); await echap(); return; }
      f.carrousel ? echec(`${M} sans carrousel`, `${f.carrousel} carrousel de semaines (S36 31, S37 7…)`) : ok(`${M} sans carrousel`);
      if (!f.piste || f.x == null) { echec(`${M} frise Durée`, 'aucune frise Durée avec un début à tirer'); await echap(); return; }
      ok(`${M} frise Durée`);
      await glisser(f.x, f.y, pas(f.x, f.x - 2.2 * f.px)); await sleep(500);
      await cap('modifier-passe');
      await toucherTexte('Enregistrer'); await sleep(900);
      const v1 = await valeur();
      (v1.du < v0.du && v1.au === v0.au) ? ok(`${M} début dans le passé`, `${v0.cle} → ${v1.cle}`) : echec(`${M} début dans le passé`, `${v0.cle} → ${v1.cle} (début plus tôt, même fin attendus)`);
      await versCalendrier(); const v2 = await valeur();
      v2?.cle === v1.cle ? ok(`${M} rechargement`, v1.cle) : echec(`${M} rechargement`, `${v1.cle} → ${v2?.cle}`);
    } catch (e) { echec(M, String(e.message ?? e).slice(0, 160)); await echap(); }
  };
  // ── CAL-JOUR (21.11, « pourquoi à certains événements je peux pas leur donner un jour précis… ? ») : en 6 sem. et 3 mois à 390, le bord de
  //    « ZZ TEST Geste » tiré de 3 jours pose sa fin 3 jours plus loin (plus au dimanche de sa semaine), début inchangé, relu après
  //    rechargement. Puis retour en 3 mois (la barre de sectionBarre l'attend) ──
  const valeurGeste = () => p.evaluate((k, id) => { const e = JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === id); if (!e) return null; const f = e.data.fenetre; return { du: f?.du ?? e.data.date, au: f?.au ?? e.data.date, cle: `${f?.du ?? e.data.date}→${f?.au ?? e.data.date}` }; }, CLE_CACHE, ID_GESTE);
  const barreGeste = () => p.evaluate(() => {
    const e = document.querySelector('[aria-label^="ZZ TEST Geste,"]'); if (!e) return null;
    e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect();
    const cols = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((x) => x.getBoundingClientRect().x);
    return { l: r.left, r: r.right, w: r.width, y: r.top + r.height / 2, col: cols.length > 1 ? (cols[cols.length - 1] - cols[0]) / (cols.length - 1) : 26 };
  });
  const sectionJourBord = async () => {
    // la barre ramenée de 3 semaines (S+3 → S0) : la fenêtre de 6 sem. part de celle de 3 mois (trois semaines avant aujourd'hui) et ne l'aurait pas
    { const b = await barreGeste(); if (b) { const x = b.l + b.w / 2; await glisser(x, b.y, pas(x, x - 3 * b.col)); await sleep(500); await echap(); } }
    for (const per of ['3 mois', '6 sem.']) {
      const J = `bord au jour ${per} ${combo}`;
      try {
        await choisirPeriode(per); await sleep(400);
        const a = await valeurGeste(), b = await barreGeste();
        if (!a || !b) { echec(J, '« ZZ TEST Geste » introuvable'); continue; }
        const x = b.r - Math.min(8, b.w / 4), dx = (3 * b.col) / 7;
        await glisser(x, b.y, pas(x, x + dx)); await sleep(500); await echap();
        const c = await valeurGeste(), vise = ajouter(a.au, 3);
        (c.au === vise && c.du === a.du) ? ok(`${J} 3 jours`, `${a.cle} → ${c.cle}`) : echec(`${J} 3 jours`, `${a.cle} → ${c.cle} (fin au ${vise}, même début attendus ; ${(dx / (b.col / 7)).toFixed(2)} jours tirés)`);
        if (per === '6 sem.') await cap('bord-au-jour');
        await versCalendrier(); const d = await valeurGeste();
        d?.cle === c.cle ? ok(`${J} rechargement`, c.cle) : echec(`${J} rechargement`, `${c.cle} → ${d?.cle}`);
      } catch (e) { echec(J, String(e.message ?? e).slice(0, 160)); await echap(); }
    }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  // ── CAL-JOUR-FEUILLE (21.11, « pourquoi à certains événements je peux pas leur donner un jour précis… ? ») : « ZZ TEST Geste » rouverte par
  //    Modifier montre deux rangées des jours (Début, Fin) ; un autre jour touché dans chacune, Enregistrer : la fenêtre écrite commence et
  //    finit à ces jours (plus au lundi ni au dimanche), relue après rechargement ──
  const sectionFeuilleJour = async () => {
    const J = `feuille au jour ${combo}`;
    try {
      const a = await valeurGeste(), b = await barreGeste();
      if (!a || !b) { echec(J, '« ZZ TEST Geste » introuvable'); return; }
      await toucherXY(b.l + b.w / 2, b.y); await sleep(600);
      await toucherTexte('Modifier'); await sleep(700);
      /* une rangée des jours, défilée puis lue (l'autre rangée peut bouger au défilement : chacune se relit avant son toucher) */
      const rangee = (bord) => p.evaluate((bord) => {
        const g = document.querySelector(`[data-mode="modifier"] [data-feuille-jours="${bord}"]`); if (!g) return null;
        g.scrollIntoView({ block: 'center' });
        return [...g.querySelectorAll('[data-jour]')].map((x) => { const r = x.getBoundingClientRect(); return { j: x.getAttribute('data-jour'), on: x.getAttribute('aria-pressed') === 'true', off: x.disabled, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      }, bord);
      if (!(await rangee('debut')) || !(await rangee('fin'))) { await cap('feuille-jour-absente'); echec(J, `aucune rangée des jours Début et Fin dans Modifier (fenêtre ${a.cle})`); await echap(); return; }
      /* un autre jour : le voisin du jour posé (après pour le début, avant pour la fin), sinon de l'autre côté */
      const autre = (l, sens) => { const i = l.findIndex((d) => d.on); return [l[i + sens], l[i - sens]].find((d) => d && !d.off) ?? null; };
      const d0 = autre(await rangee('debut'), 1); if (!d0) { echec(J, 'aucun autre jour de début à toucher'); await echap(); return; }
      await toucherXY(d0.x, d0.y); await sleep(400);
      const f0 = autre(await rangee('fin'), -1); if (!f0) { echec(J, 'aucun autre jour de fin à toucher'); await echap(); return; }
      await toucherXY(f0.x, f0.y); await sleep(400);
      await cap('feuille-jour');
      await toucherTexte('Enregistrer'); await sleep(900);
      const c = await valeurGeste();
      (c?.du === d0.j && c?.au === f0.j) ? ok(`${J} début et fin`, `${a.cle} → ${c.cle}`) : echec(`${J} début et fin`, `${a.cle} → ${c?.cle} (${d0.j}→${f0.j} attendus)`);
      await versCalendrier(); const d = await valeurGeste();
      d?.cle === c?.cle ? ok(`${J} rechargement`, c.cle) : echec(`${J} rechargement`, `${c?.cle} → ${d?.cle}`);
    } catch (e) { echec(J, String(e.message ?? e).slice(0, 160)); await echap(); }
  };
  // ── CAL-JOUR-GLISSE (21.11, « pourquoi à certains événements je peux pas leur donner un jour précis… ? ») : en 6 sem. à 390, le corps de
  //    « ZZ TEST Geste » glissé de 3 jours pose son début et sa fin 3 jours plus loin (plus à la semaine : +0 ou +7), relu après rechargement ──
  const sectionGlisseJour = async () => {
    const J = `glisser au jour 6 sem. ${combo}`;
    try {
      await choisirPeriode('6 sem.'); await sleep(400);
      const a = await valeurGeste(), b = await barreGeste();
      if (!a || !b) { echec(J, '« ZZ TEST Geste » introuvable'); return; }
      const x = b.l + b.w / 2, dx = (3 * b.col) / 7;
      await glisser(x, b.y, pas(x, x + dx)); await sleep(500); await echap();
      const c = await valeurGeste(), du = ajouter(a.du, 3), au = ajouter(a.au, 3);
      (c?.du === du && c?.au === au) ? ok(`${J} 3 jours`, `${a.cle} → ${c.cle}`) : echec(`${J} 3 jours`, `${a.cle} → ${c?.cle} (${du}→${au} attendus ; un jour : ${(b.col / 7).toFixed(1)} px)`);
      await cap('glisser-au-jour');
      await versCalendrier(); const d = await valeurGeste();
      d?.cle === c?.cle ? ok(`${J} rechargement`, c.cle) : echec(`${J} rechargement`, `${c?.cle} → ${d?.cle}`);
    } catch (e) { echec(J, String(e.message ?? e).slice(0, 160)); await echap(); }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  // ── CAL-VIDE (21.11, « Il y a un espace vide énorme ici ??? ») et CAL-VIDES-EN-LIGNE (« les mettre en vertical pas les entassés à
  //    l'horizontal ») : en 6 sem., 3 mois et An, une rangée prend la hauteur de ses lignes (écart ≤ 24 px jusqu'à l'en-tête suivant) ; les
  //    rangées vides se posent l'une sous l'autre ──
  const sectionRangees = async () => {
    for (const per of ['6 sem.', '3 mois', 'An', '6 sem.']) {
      const R = `rangées ${per} ${combo}`;
      await choisirPeriode(per); await sleep(500);
      const m = await p.evaluate(() => {
        const secs = [...document.querySelectorAll('[data-frise] section[data-rangee]')].filter((s) => s.getBoundingClientRect().height > 0);
        const ecarts = [];
        for (let i = 0; i < secs.length - 1; i++) {
          const s = secs[i]; if (s.closest('[data-rangees-vides]')) continue;
          let bas = -1e9;
          for (const e of s.querySelectorAll('*')) { if (e.closest('[aria-hidden="true"]') || e.closest('svg')) continue; const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && (e.children.length === 0 || e.matches('button,[data-chose]'))) bas = Math.max(bas, r.bottom); }
          const suiv = secs[i + 1].querySelector('.cal-rh') ?? secs[i + 1];
          ecarts.push({ r: s.getAttribute('data-rangee'), ecart: Math.round(suiv.getBoundingClientRect().top - bas) });
        }
        const lignes = [...document.querySelectorAll('[data-rangees-vides]')].map((g) => { const tops = [...g.querySelectorAll(':scope > section')].map((s) => Math.round(s.getBoundingClientRect().top)); return { g: g.getAttribute('data-rangees-vides'), tops }; });
        return { ecarts, lignes };
      });
      const trop = m.ecarts.filter((e) => e.ecart > 24);
      trop.length ? echec(`${R} hauteur des rangées`, trop.map((e) => `${e.r} ${e.ecart} px`).join(', ') + ' de vide avant la rangée suivante (≤ 24 attendus)') : ok(`${R} hauteur des rangées`, m.ecarts.map((e) => `${e.r} ${e.ecart}`).join(', '));
      const enLigne = m.lignes.filter((l) => l.tops.some((t, i) => i > 0 && t <= l.tops[i - 1] + 4));
      enLigne.length ? echec(`${R} rangées vides`, enLigne.map((l) => `« ${l.g} » côte à côte (${l.tops.join(', ')})`).join(' ; ')) : ok(`${R} rangées vides`, m.lignes.map((l) => l.g).join(' | ') || 'aucune');
      if (per === 'An') await cap('rangees-an');
    }
  };
  await sectionJourBord();
  await sectionGlisseJour();
  await sectionBarre();
  await sectionCadre();
  await sectionFeuille();
  await sectionFeuilleJour();
  await sectionModifier();
  await sectionRangees();
  await cap('fin');
}

// ───────────── PERIODE-PARTOUT (21.11, « ça trigger pas la frise editavlble de l'autre vue ») ─────────────
// Chaque écran qui choisit une période libre monte la frise d'Opérations (`[data-frise-periode] [data-testid=frise]`), sans champ mois ni
// liste ; la poignée « Début » tirée vers le passé change la période (titre et valeur gardée), et la période tient au rechargement.
// Une page à part par écran et combinaison (sa fixture, son stockage) : rien ne passe au Calendrier ni à la recette.
// une fonction, pas une constante : jouer() tourne (await de haut niveau) avant que la fin du module soit évaluée
function lieuxPeriode() { return [
  {
    nom: 'synthese', racine: '.syn',
    aller: async ({ toucherTexte }) => { await toucherTexte(['Finances']); await toucherTexte(['Synthèse'], false); },
    ouvrir: async ({ toucherTexte }) => toucherTexte(['Autre période']),
    titre: () => document.querySelector('.syn h2')?.innerText.trim() ?? null,
    garde: () => { try { return JSON.parse(localStorage.getItem('laffinee_ui_state') ?? '{}').app_global_time_filter ?? null; } catch { return null; } },
  },
  {
    // Synthèse › Revoir le mois › Filtrer, mode « Du … au » : ses listes de source, fournisseur, brassin restent (ce ne sont pas des périodes).
    // L'état de l'analyse est local à l'écran : rien à relire au rechargement (signalé).
    nom: 'analyse', racine: '.ana', interdits: 'input[type=month], input[type=date]', recharge: false,
    aller: async ({ toucherTexte }) => { await toucherTexte(['Finances']); await toucherTexte(['Synthèse'], false); await toucherTexte(['^Revoir le mois']); await toucherTexte(['Filtrer']); },
    ouvrir: async ({ toucherTexte }) => toucherTexte(['Du … au']),
    titre: () => document.querySelector('.ana .ana-dit')?.innerText.split(' : ')[0].trim() ?? null,
    garde: () => null,
  },
  {
    // Brassins › Filtrer, segment « Dates… » : la période de l'app (« Même période que l'en-tête »), relue au rechargement. Le tri reste une liste.
    nom: 'brassins', racine: '.lst-sheet', interdits: 'input[type=month], input[type=date]',
    aller: async ({ toucherTexte }) => { await toucherTexte(['Brassins']); await toucherTexte(['^Filtrer']); },
    ouvrir: async ({ toucherTexte }) => toucherTexte(['Dates…']),
    titre: () => document.querySelector('button[aria-label^="Période :"]')?.getAttribute('aria-label') ?? null,
    garde: () => { try { return JSON.parse(localStorage.getItem('laffinee_ui_state') ?? '{}').app_global_time_filter ?? null; } catch { return null; } },
  },
]; }

async function jouerPeriode({ nav, base, L, theme }) {
  const tactile = L < 600, combo = `${L}-${theme}`, url = `${base}&finance-demo=parcours-calendrier`;
  for (const lieu of lieuxPeriode()) {
    const N = `période ${lieu.nom} ${combo}`;
    const p = await nav.newPage();
    const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 160)));
    try {
      await p.setViewport({ width: L, height: tactile ? 844 : 900, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((kf, kc, j, tag, t) => {
        if (localStorage.getItem('geste:fixture-posee') === tag) return;
        localStorage.clear(); sessionStorage.clear(); localStorage.setItem('laffinee.theme', t);
        localStorage.removeItem(kc); localStorage.setItem(kf, j); localStorage.setItem('geste:fixture-posee', tag);
      }, CLE_FIXTURE, CLE_CACHE, JSON.stringify(fixtureCalendrier(new Date().toISOString().slice(0, 10)).entrees), `periode-${lieu.nom}-${combo}-${Date.now()}`, theme);
      const cdp = await p.createCDPSession();
      const cap = (n) => p.screenshot({ path: path.join(sortie, `periode-${lieu.nom}-${combo}-${n}.png`) });
      const toucherXY = async (x, y) => { if (tactile) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await sleep(700); };
      const toucherTexte = async (txts, exige = true) => {
        for (const t of [].concat(txts)) {
          const c = await p.evaluate((t) => {
            const debut = t.startsWith('^'), m = debut ? t.slice(1) : t, egal = (x) => (debut ? x.startsWith(m) : x === m);
            const e = [...document.querySelectorAll('button,a,[role=tab],[role=button]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (egal((e.getAttribute('aria-label') ?? '').trim()) || egal(e.innerText.trim().replace(/\s+/g, ' '))); });
            if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
          }, t);
          if (c) { await toucherXY(c[0], c[1]); return true; }
        }
        if (exige) throw new Error(`« ${[].concat(txts)[0]} » introuvable`);
        return false;
      };
      const glisser = async (x0, y, x1) => {
        const xs = Array.from({ length: 12 }, (_, k) => x0 + ((x1 - x0) * (k + 1)) / 12);
        if (tactile) {
          const pt = (x) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0) }); await sleep(50);
          for (const x of xs) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await sleep(16); }
          await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await p.mouse.move(x0, y); await p.mouse.down(); await sleep(40);
          for (const x of xs) { await p.mouse.move(x, y); await sleep(16); }
          await p.mouse.up();
        }
        await sleep(700);
      };
      const aller = async () => {
        await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(1000);
        await lieu.aller({ p, toucherTexte }); await p.waitForSelector(lieu.racine, { timeout: 30000 }); await sleep(600);
      };
      const lire = () => p.evaluate((racine, titreSrc, gardeSrc, interdits) => {
        const R = document.querySelector(racine);
        const f = R?.querySelector('[data-frise-periode] [data-testid=frise]');
        const h = R?.querySelector('[data-frise-periode] [role=slider][aria-label="Début"]');
        let hb = null; if (h) { h.scrollIntoView({ block: 'center' }); const r = h.getBoundingClientRect(); hb = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
        const fb = f?.getBoundingClientRect();
        const anciens = R ? [...R.querySelectorAll(interdits)].filter((e) => e.getClientRects().length && !e.closest('[data-frise-periode]')).length : 0;
        return { frise: !!f, anciens, debut: h?.getAttribute('aria-valuetext') ?? null, n: Number(h?.getAttribute('aria-valuenow') ?? NaN), hb, fw: fb?.width ?? 0,
          deborde: fb ? Math.round(Math.max(0, fb.right - document.documentElement.clientWidth, -fb.left)) : 0,
          titre: (0, eval)(`(${titreSrc})`)(), garde: (0, eval)(`(${gardeSrc})`)() };
      }, lieu.racine, lieu.titre.toString(), lieu.garde.toString(), lieu.interdits ?? 'input[type=month], input[type=date], select');
      await aller();
      await lieu.ouvrir({ p, toucherTexte }); await sleep(600);
      const a = await lire(); await cap('ouverte');
      if (!a.frise) { echec(`${N} frise`, `aucune frise d'Opérations${a.anciens ? ` (${a.anciens} champ(s) mois ou liste à la place)` : ''}`); continue; }
      a.anciens ? echec(`${N} sans liste de mois`, `${a.anciens} champ(s) mois ou liste encore visibles`) : ok(`${N} frise`, `${Math.round(a.fw)} px, aucun champ mois`);
      a.deborde > 1 ? echec(`${N} débord`, `la frise sort de l'écran de ${a.deborde} px`) : ok(`${N} dans l'écran`);
      if (!a.hb) { echec(`${N} poignée`, 'poignée « Début » introuvable'); continue; }
      await glisser(a.hb.x, a.hb.y, a.hb.x - Math.min(90, a.fw * 0.25));
      const b = await lire(); await cap('tiree');
      (b.n < a.n && b.titre !== a.titre && (lieu.recharge === false || JSON.stringify(b.garde) !== JSON.stringify(a.garde)))
        ? ok(`${N} début tiré vers le passé`, `${a.debut} → ${b.debut} ; « ${a.titre} » → « ${b.titre} »`)
        : echec(`${N} début tiré vers le passé`, `${a.debut} → ${b.debut} ; « ${a.titre} » → « ${b.titre} » ; gardé ${JSON.stringify(a.garde)} → ${JSON.stringify(b.garde)}`);
      if (lieu.recharge === false) { ok(`${N} rechargement`, 'état local à l\'écran, non relu (signalé)'); continue; }
      await aller(); await lieu.ouvrir({ p, toucherTexte }); await sleep(600);
      const c = await lire();
      (c.titre === b.titre && c.debut === b.debut && JSON.stringify(c.garde) === JSON.stringify(b.garde))
        ? ok(`${N} rechargement`, `« ${c.titre} », début ${c.debut}`)
        : echec(`${N} rechargement`, `« ${b.titre} » / ${b.debut} → « ${c.titre} » / ${c.debut}`);
    } catch (e) { echec(N, String(e.message ?? e).slice(0, 200)); await p.screenshot({ path: path.join(sortie, `periode-${lieu.nom}-${combo}-erreur.png`) }).catch(() => {}); }
    finally { if (erreurs.length) echec(`erreurs de page ${N}`, erreurs.slice(0, 2).join(' | ')); await p.close(); }
  }
}

// ───────────── V4 : sauts vers une chose, retour, recherche (chasse Calendrier 21.11 : CHN-5, 6, 8, 12) ─────────────
// 390 tactile seulement. Fixture du Calendrier (Jhhh, Hefe en retard, « Marché de Noël », « ZZ TEST Projet chambre froide » du Carnet), une
// page neuve par étape. Rouge sur en-ligne/2026-11-21-tour8 : Calendrier en février sans la chose, « Févr. » dans la barre de l'app, la croix
// de la fiche d'un retard sur Brassins, la fête de la loupe ni sélectionnée ni ouverte.
function etapesNavigation() { return [
  {
    id: 'CH-N5',
    jouer: async ({ s, N }) => {
      const barre = () => s.p.evaluate(() => document.querySelector('[data-periode-pastille] .pr-ce')?.getAttribute('aria-label') ?? null);
      await s.aller(); await sleep(600);
      const avant = await barre();
      await s.cliquer('nav button', 'Brassins'); await s.cliquer('button,a,[role=tab],[role=button]', 'Atelier', true);
      await s.cliquer('button,[role=button],a,[data-carnet-id],li,article', 'ZZ TEST Projet chambre froide', true);
      await s.cliquer('button,a,[role=button]', 'Au calendrier', true);
      await s.p.waitForSelector('[data-calendrier]', { timeout: 8000 }); await sleep(1500); await s.cap('N5-au-calendrier');
      const vu = await s.p.evaluate(() => {
        const dansEcran = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
        const texte = [...document.querySelectorAll('[data-calendrier] *')].filter((e) => e.children.length === 0 && /chambre froide/i.test(e.textContent ?? '') && dansEcran(e)).length;
        const ampoule = [...document.querySelectorAll('[data-bande-semaines] svg.lucide-lightbulb')].filter(dansEcran).length;
        return { texte, ampoule };
      });
      (vu.texte > 0 && vu.ampoule > 0) ? ok(`${N} N5 la chose est visible`, `texte ${vu.texte}, ampoule ${vu.ampoule}`)
        : echec(`${N} N5 la chose est visible`, `« chambre froide » à l'écran : ${vu.texte} fois ; ampoule de sa semaine : ${vu.ampoule} (sans toucher ±)`);
      const apres = await barre();
      apres === avant ? ok(`${N} N6 barre de l'app au saut`, `« ${apres} »`) : echec(`${N} N6 barre de l'app au saut`, `« ${avant} » → « ${apres} »`);
      await s.p.evaluate(() => history.back()); await sleep(1200); await s.cap('N6-retour');
      const retour = await barre();
      retour === avant ? ok(`${N} N6 barre de l'app au retour`, `« ${retour} »`) : echec(`${N} N6 barre de l'app au retour`, `« ${avant} » → « ${retour} »`);
    }
  },
  {
    id: 'CH-N8',
    jouer: async ({ s, N }) => {
      await s.aller(); await s.cliquer('nav button', 'Calendrier');
      await s.p.waitForSelector('.ent-ret-b', { timeout: 15000 });
      await s.cliquer('.ent-ret-b', ''); await sleep(500);
      await s.cliquer('.ent-ret-l', 'Hefe'); await sleep(1500); await s.cap('N8-fiche');
      await s.cliquer('button[aria-label="Fermer"]', ''); await sleep(1500); await s.cap('N8-apres-croix');
      const ou = await s.p.evaluate(() => ({ calendrier: [...document.querySelectorAll('[data-calendrier]')].some((e) => e.getBoundingClientRect().width > 0), titre: document.querySelector('h1,h2')?.textContent?.trim().slice(0, 40) ?? null }));
      ou.calendrier ? ok(`${N} N8 la croix ramène au Calendrier`) : echec(`${N} N8 la croix ramène au Calendrier`, `le Calendrier n'est plus là (écran : « ${ou.titre} »)`);
    }
  },
  {
    id: 'CH-N12',
    jouer: async ({ s, N }) => {
      await s.aller(); await s.cliquer('button[aria-label^="Rechercher"]', ''); await sleep(600);
      await s.p.keyboard.type('Marché', { delay: 40 }); await sleep(700); await s.cap('N12-palette');
      await s.p.keyboard.press('Enter'); await sleep(1800); await s.cap('N12-apres-entree');
      const f = await s.p.evaluate(() => { const e = [...document.querySelectorAll('[data-detail]')].find((x) => x.getBoundingClientRect().width > 0); return e ? e.getAttribute('aria-label') : null; });
      /Marché/.test(f ?? '') ? ok(`${N} N12 la fête est ouverte`, `« ${f} »`) : echec(`${N} N12 la fête est ouverte`, `aucune fiche « Marché de Noël » (${f ?? 'aucune fiche'})`);
    }
  },
]; }

async function jouerNavigation({ nav, base, L, theme }) {
  if (L >= 600) return;
  const url = `${base}&finance-demo=parcours-calendrier`, combo = `${L}-${theme}`;
  for (const etape of etapesNavigation()) {
    const N = `${etape.id} ${combo}`;
    const p = await nav.newPage();
    const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 160)));
    try {
      await p.setViewport({ width: L, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((kf, kc, j, tag, t) => {
        if (localStorage.getItem('geste:fixture-posee') === tag) return;
        localStorage.clear(); sessionStorage.clear(); localStorage.setItem('laffinee.theme', t);
        localStorage.removeItem(kc); localStorage.setItem(kf, j); localStorage.setItem('geste:fixture-posee', tag);
      }, CLE_FIXTURE, CLE_CACHE, JSON.stringify(fixtureCalendrier(new Date().toISOString().slice(0, 10)).entrees), `${etape.id}-${combo}-${Date.now()}`, theme);
      const s = {
        p,
        cap: (n) => p.screenshot({ path: path.join(sortie, `navigation-${etape.id}-${combo}-${n}.png`) }),
        aller: async () => { await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(1200); },
        /** Touche au doigt le premier élément visible de `sel` dont le texte (ou l'aria-label) est `texte` (ou le commence : `debut`) ; `texte` vide : le premier. */
        cliquer: async (sel, texte, debut = false) => {
          const c = await p.evaluate((sel, texte, debut) => {
            const e = [...document.querySelectorAll(sel)].find((x) => {
              const r = x.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
              if (!texte) return true;
              const t = [(x.getAttribute('aria-label') ?? '').trim(), (x.innerText ?? '').replace(/\s+/g, ' ').trim()];
              return t.some((v) => (debut ? v.startsWith(texte) : v === texte || v.includes(texte)));
            });
            if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
          }, sel, texte, debut);
          if (!c) throw new Error(`« ${texte || sel} » introuvable`);
          await p.touchscreen.tap(c[0], c[1]); await sleep(800);
        },
      };
      await etape.jouer({ s, N });
    } catch (e) { echec(N, String(e.message ?? e).slice(0, 200)); await p.screenshot({ path: path.join(sortie, `navigation-${etape.id}-${combo}-erreur.png`) }).catch(() => {}); }
    finally { if (erreurs.length) echec(`erreurs de page ${N}`, erreurs.slice(0, 2).join(' | ')); await p.close(); }
  }
}
