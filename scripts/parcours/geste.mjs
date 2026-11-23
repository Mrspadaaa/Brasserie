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
//   --sections sectionBarreHors,… : seulement ces sections du Calendrier (itération).
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
/* --hauteur 660 (22.11, « surtout testé en version téléphone ») : la hauteur de l'écran tactile ; 844 par défaut */
const HAUTEUR_TEL = Number(opt('hauteur', '844')) || 844;
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
      await p.setViewport({ width: L, height: tactile ? HAUTEUR_TEL : 900, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((t) => localStorage.setItem('laffinee.theme', t), theme);
      const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 160)));
      const diag = []; p.on('requestfailed', (q) => diag.push(`req ${q.url().slice(-50)} ${q.failure()?.errorText}`)); p.on('console', (m) => { if (m.type() === 'error') diag.push(`con ${m.text().slice(0, 140)}`); });
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
      // tenir : ms d'appui immobile avant de bouger (appui long) ; pendant : lu avant de lever le doigt
      async function glisser(x0, y, xs, { echap = false, tenir = 0, pendant = null } = {}) {
        if (tactile) {
          const pt = (x) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0) }); await sleep(50 + tenir);
          for (const x of xs) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await sleep(16); }
          if (pendant) await pendant();
          await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await p.mouse.move(x0, y); await p.mouse.down(); await sleep(40 + tenir);
          for (const x of xs) { await p.mouse.move(x, y); await sleep(16); }
          if (pendant) await pendant();
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
        } catch (e) { echec(c, String(e.message ?? e).slice(0, 160) + (diag.length ? ` [${diag.slice(-3).join(' ; ')}]` : '')); await p.screenshot({ path: path.join(sortie, `${E.nom}-${combo}-erreur.png`) }).catch(() => {}); }
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
  // CAL-PASSE-ECHELLE : un passé de 14 semaines (caisse ouverte plus tôt, cinq paiements passés) : tirer le début a un passé à montrer
  const PASSE = 14, pr = fx.entrees.find((e) => e.name === 'financialProfiles');
  pr.data.openingCash.date = s(-PASSE); pr.data.historyCompleteFrom = s(-PASSE);
  for (const [k, n, c, d] of [[1, -PASSE + 1, 30000, 'out'], [2, -PASSE + 3, 80000, 'in'], [3, -PASSE + 5, 45000, 'out'], [4, -3, 60000, 'in'], [5, -2, 25000, 'out']]) {
    fx.entrees.push({ name: 'transactions', id: 'T-ZZ-P' + k, data: { id: 'T-ZZ-P' + k, description: 'ZZ passé ' + k, date: s(n, 1), amountCents: c, kind: d === 'in' ? 'sale' : 'purchase', status: 'paid' } });
    fx.entrees.push({ name: 'financialPayments', id: 'PAY-ZZ-P' + k, data: { id: 'PAY-ZZ-P' + k, transactionId: 'T-ZZ-P' + k, date: s(n, 1), amountCents: c, direction: d, method: 'card', recordedAt: s(n, 1) + 'T10:00:00.000Z' } });
  }
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
  /* 22.11 : le défilement au bord, plus franc depuis armerSens (T9-1), pose les choses glissées plus loin (« ZZ TEST Geste », « lol » en
     févr. 2027) et laisse la fenêtre locale ailleurs. Une section qui en a besoin rend ces entrées à la fixture et la fenêtre par défaut (rechargé
     par versCalendrier), comme CHG-6 le fait déjà pour « NEIPA Test ». */
  const rendreFixture = (ids) => p.evaluate((kf, kc, j, ids) => {
    const fx = new Map(JSON.parse(j).filter((x) => ids.includes(x.id)).map((x) => [x.id, x]));
    for (const k of [kf, kc]) { const v = localStorage.getItem(k); if (v) localStorage.setItem(k, JSON.stringify(JSON.parse(v).map((x) => (fx.has(x.id) ? fx.get(x.id) : x)))); }
    localStorage.removeItem('laffinee.calendrier.fenetre-locale');
  }, CLE_FIXTURE, CLE_CACHE, fixtureGeste(), ids);

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
    // R3 se joue sur une prise LIBRE. Un voisin visible à moins de 18 px de la fin reçoit l'appui, à bon droit : à 1280 la marque « Hotte »
    // (9 déc., cercle de 28 px et marge de 8 px) commençait 6 px après le point d'appui quand la barre finissait le 5 déc. (fin inchangée,
    // le parcours et non le code). La barre recule d'une semaine tant que le point d'appui tombe sur autre chose qu'elle.
    for (let n = 0; n < 3; n++) {
      const bb = await barre();
      const voisin = await p.evaluate((x, y) => { const e = document.elementFromPoint(x, y); if (!e || e.closest('[aria-label^="ZZ TEST Geste,"]')) return null; return e.closest('[aria-label]')?.getAttribute('aria-label') ?? String(e.className); }, bb.r + 18, bb.y);
      if (!voisin) break;
      console.log(`  ..  ${B} prise R3 couverte par « ${voisin.slice(0, 60)} » : la barre recule d'une semaine`);
      await geste("reculer d'une semaine (prise R3 libre)", (b) => b.l + b.w / 2, -col, (a, b) => (b.du < a.du && b.au < a.au) || 'plus tôt attendu');
    }
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
    // reculer puis avancer le début (il s'étire seul, la fin reste, R6), étirer puis réduire la fin
    const tirer = async (nom, de, vers, verifie) => {
      const a = await etat(); const x0 = de === 'debut' ? a.cadre.l + 1 : a.cadre.r - 1;
      await glisser(x0, a.cb.y, pas(x0, x0 + vers)); await sleep(400);
      const b = await etat(); const r = verifie(a, b);
      r === true ? ok(`${F} ${nom}`, `${a.cle} → ${b.cle}`) : echec(`${F} ${nom}`, `${a.cle} → ${b.cle}${r ? ` (${r})` : ''}`);
      return b;
    };
    // R6 (CAL-FRISE-PRIX) : le début s'étire seul, la fin reste où elle est ; la fenêtre ne se déplace plus d'un bloc
    const finDe = (x) => (x.debut + x.n) % 53;
    await tirer('reculer le début', 'debut', -d, (a, b) => (b.debut !== null && a.debut !== null && b.debut !== a.debut && b.n > a.n && finDe(b) === finDe(a) && ((a.debut - b.debut + 53) % 53) <= 26) || 'début plus tôt, fin inchangée, durée plus longue attendus (R6)');
    // CAL-PASSE-ECHELLE (21.11) : la part passée de la courbe se lit comme la part future : même fond de cadre (uniforme, sans voile grisé), mêmes points
    // (opacité, couleur), et un tracé qui varie (une échelle écrasée par le passé l'aplatirait)
    { const m = await p.evaluate(() => {
        const cadre = document.querySelector('.ent-cadre'), cs = cadre ? getComputedStyle(cadre) : null;
        const pts = [...document.querySelectorAll('.ent-cb [data-point-semaine]')].map((c) => ({ x: c.getBoundingClientRect().x, cy: Number(c.getAttribute('cy')), s: getComputedStyle(c), n: Number(c.getAttribute('data-point-semaine')) })).sort((a, b) => a.x - b.x);
        const d = new Date(); const j = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dow = (j.getUTCDay() + 6) % 7; j.setUTCDate(j.getUTCDate() - dow + 3);
        const an = new Date(Date.UTC(j.getUTCFullYear(), 0, 4)); const nAuj = 1 + Math.round(((j - an) / 864e5 - 3 + ((an.getUTCDay() + 6) % 7)) / 7);
        const iAuj = pts.findIndex((q) => q.n === nAuj), pas = pts.slice(0, Math.max(0, iAuj)), fut = pts.slice(iAuj);
        const sig = (q) => q.s.opacity + "|" + q.s.fill, uni = (l) => new Set(l.map(sig));
        const ptsCadre = cadre ? pts.filter((q) => q.x >= cadre.getBoundingClientRect().left - 1 && q.x <= cadre.getBoundingClientRect().right) : [];
        const haut = (l) => l.length ? Math.max(...l.map((q) => q.cy)) - Math.min(...l.map((q) => q.cy)) : 0;
        return { fond: cs?.backgroundColor ?? null, image: cs?.backgroundImage ?? null, opCadre: cs?.opacity ?? null, passes: pas.length, futurs: fut.length, sigPasse: [...uni(pas)], sigFutur: [...uni(fut)], ecartPasse: haut(pas), ecartCadre: haut(ptsCadre) };
      });
      const memeStyle = m.passes > 0 && m.futurs > 0 && m.sigPasse.length === 1 && m.sigFutur.length === 1 && m.sigPasse[0] === m.sigFutur[0];
      const fondUnique = !!m.fond && m.image === 'none' && m.opCadre === '1';
      const lisible = m.ecartPasse >= 2;
      (memeStyle && fondUnique && lisible) ? ok(`${F} CAL-PASSE-ECHELLE`, `passé ${m.passes} pts, futur ${m.futurs} pts, même style ${m.sigPasse[0]}, fond ${m.fond}, relief passé ${m.ecartPasse.toFixed(1)} px`) : echec(`${F} CAL-PASSE-ECHELLE`, `${JSON.stringify(m)} (points passés et futurs de même style, fond du cadre uniforme, relief du passé ≥ 2 px attendus)`); }
    await tirer('avancer le début', 'debut', d, (a, b) => (b.debut !== null && b.debut !== a.debut && b.n < a.n && finDe(b) === finDe(a) && ((b.debut - a.debut + 53) % 53) <= 26) || 'début plus tard, fin inchangée, durée plus courte attendus (R6)');
    await tirer('étirer la fin', 'fin', d, (a, b) => (b.n > a.n && b.debut === a.debut) || 'durée plus longue, même début attendus');
    await cap('cadre-etire');
    const er = await tirer('réduire la fin', 'fin', -d, (a, b) => (b.n < a.n && b.debut === a.debut) || 'durée plus courte, même début attendus');
    // R4 après le lâcher (recalage 200 ms) : les deux bouts reviennent à 56 px
    const g1 = er.cadre.l - er.cb.l, d1 = er.cb.r - er.cadre.r;
    if (!er.alignee) (Math.abs(g1 - 56) <= 4 && Math.abs(d1 - 56) <= 4) ? ok(`${F} R4 après le geste`, `${g1.toFixed(0)} et ${d1.toFixed(0)} px`) : echec(`${F} R4 après le geste`, `bouts à ${g1.toFixed(0)} et ${d1.toFixed(0)} px`);
    // CAL-FRISE-PRIX (CFP-1) : le corps du cadre glissé déplace la fenêtre entière, même durée (R5) ; à tour8 il lisait la courbe
    { const a = await etat(); const x = (a.cadre.l + a.cadre.r) / 2;
      await glisser(x, a.cb.y, pas(x, x + d)); await sleep(400); await echap();
      const b = await etat();
      (b.debut !== null && b.debut !== a.debut && b.n === a.n && ((b.debut - a.debut + 53) % 53) <= 26) ? ok(`${F} glisser le corps`, `${a.cle} → ${b.cle}`) : echec(`${F} glisser le corps`, `${a.cle} → ${b.cle} (début plus tard, même durée attendus)`); }
    // CAL-FRISE-PRIX (R8) : le corps tenu 450 ms sans bouger lit la courbe (la tête de lecture s'ouvre et suit le doigt), la fenêtre ne bouge pas
    { const a = await etat(); const x = (a.cadre.l + a.cadre.r) / 2; let lu = null;
      await glisser(x, a.cb.y, pas(x, x + unite, 3), { tenir: 700, pendant: async () => { lu = await p.evaluate(() => ({ lu: !!document.querySelector('.ent-lu'), curseur: !!document.querySelector('[data-curseur-trait]') })); } });
      await sleep(300); const b = await etat();
      (lu?.lu && b?.cle === a.cle) ? ok(`${F} appui long lit`, `lecture ouverte, reste ${a.cle}`) : echec(`${F} appui long lit`, `lecture ${JSON.stringify(lu)}, ${a.cle} → ${b?.cle ?? "cadre perdu"} (lecture ouverte, fenêtre inchangée attendues)`);
      // CAL-BARRE-INUTILE (21.11, « barre inutile ») : le curseur de lecture (trait, colonne, barre) n'existe que pendant le geste ; doigt levé, il disparaît
      // (le chiffre et le détail de la semaine restent)
      const apres = await p.evaluate(() => ({ curseur: !!document.querySelector('[data-curseur]'), trait: !!document.querySelector('[data-curseur-trait]'), colonne: !!document.querySelector('[data-curseur-colonne]'), marche: !!document.querySelector('[data-curseur-marche]'), lu: !!document.querySelector('.ent-lu') }));
      (lu?.curseur && !apres.curseur && !apres.trait && !apres.colonne && !apres.marche) ? ok(`${F} CAL-BARRE-INUTILE`, 'curseur pendant le geste, absent au doigt levé') : echec(`${F} CAL-BARRE-INUTILE`, `pendant : ${lu?.curseur ? 'présent' : 'absent'} ; doigt levé : ${JSON.stringify(apres)} (présent pendant, absent après attendus)`);
      await echap(); if (!(await etat())) await versCalendrier(); }
    // R10 : Échap pendant le tirage rend la fenêtre d'avant (souris)
    if (!tactile) {
      const a = await etat(); await glisser(a.cadre.r - 1, a.cb.y, pas(a.cadre.r - 1, a.cadre.r - 1 + d), { echap: true });
      const b = await etat(); b.cle === a.cle ? ok(`${F} Échap`, `reste ${a.cle}`) : echec(`${F} Échap`, `${a.cle} → ${b.cle}`);
    }
    // la valeur après rechargement
    { const a = await etat(); await versCalendrier(); const b = await etat(); b?.cle === a.cle ? ok(`${F} rechargement`, a.cle) : echec(`${F} rechargement`, `${a.cle} → ${b?.cle}`); }

    // CHV-1, CHV-2, CHV-3, CHV-11 (CHASSE-visuel 21.11) : les noms de la courbe, mesurés dans la page, libre puis alignée
    const noms = (lieu) => p.evaluate(() => {
      const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'); if (!cb) return { pb: ['courbe introuvable'] };
      const pb = [];
      const vus = [...cb.querySelectorAll('text[data-nom-courbe]')].filter((t) => !t.closest('.ent-nom-cache')).map((t) => {
        const r = t.getBoundingClientRect(), y = Number(t.getAttribute('y')), m = t.getScreenCTM(), yb = m ? m.f + y * m.d : r.bottom - 5;
        return { nom: t.textContent.replace(/\s+/g, ' ').trim(), l: r.left, r: r.right, t: yb - 11, b: yb + 3 };
      });
      // CHV-1 : le tracé (libre, caisse) échantillonné au pixel ne passe dans l'encre d'aucun nom
      for (const sel of ['.ent-libre', '.ent-caisse']) for (const path of cb.querySelectorAll(sel)) {
        const m = path.getScreenCTM(); if (!m) continue; const L = path.getTotalLength();
        for (let k = 0; k <= L; k += 1) {
          const q = path.getPointAtLength(k), x = m.a * q.x + m.c * q.y + m.e, y = m.b * q.x + m.d * q.y + m.f;
          const v = vus.find((n) => x > n.l + 1 && x < n.r - 1 && y > n.t + 1 && y < n.b - 1);
          if (v) { pb.push(`le tracé ${sel} traverse « ${v.nom} »`); v.l = Infinity; }
        }
      }
      // CHV-2 : ni sur la ligne zéro ni contre le « 0 »
      const zl = cb.querySelector('[data-ligne-zero=visible]');
      if (zl) {
        const y0 = zl.getBoundingClientRect().top + zl.getBoundingClientRect().height / 2, zr = cb.querySelector('[data-sous-zero=repere]')?.getBoundingClientRect();
        for (const n of vus) {
          if (n.l !== Infinity && n.t <= y0 + 2 && n.b >= y0 - 2) pb.push(`« ${n.nom} » sur la ligne zéro`);
          if (zr && n.r > zr.left - 6 && n.l < zr.right + 6 && n.b > zr.top - 2 && n.t < zr.bottom + 2) pb.push(`« ${n.nom} » collé au « 0 »`);
        }
      }
      // CHV-3 : au plus deux noms l'un au-dessus de l'autre
      for (const n of vus) for (const x of [n.l + 1, n.r - 1]) { const sur = vus.filter((o) => o.l < x && x < o.r); if (sur.length > 2 && !pb.some((m) => m.includes('empilés'))) pb.push(`${sur.length} noms empilés à x = ${Math.round(x)} : ${sur.map((o) => o.nom).join(' | ')}`); }
      // CHV-1 : l'étiquette de la fenêtre a un fond opaque (aucun trait ne la traverse)
      for (const e of document.querySelectorAll('.ent-cadre-l > span')) { const bg = getComputedStyle(e).backgroundColor; if (!/^rgb\(/.test(bg)) pb.push(`étiquette « ${e.textContent} » sans fond opaque (${bg})`); }
      // CHV-11 : un « + » seul après un montant (barres, marques, détail) ne se lit pas
      for (const e of document.querySelectorAll('.cal-barre, .cal-lbl, .cal-marque, .cal-det-h')) {
        const t = `${e.getAttribute('aria-label') ?? ''} ${e.textContent ?? ''}`;
        if (/\d \+(?! à venir)/.test(t)) { pb.push(`« + » sans « à venir » : ${t.trim().slice(0, 60)}`); break; }
      }
      return { pb, n: vus.length };
    });
    const aligner = async () => { const c = await p.evaluate(() => { const e = document.querySelector('[data-ent-aligne]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); if (c) await toucherXY(c[0], c[1]); return !!c; };
    for (const al of [false, true]) {
      if (al && !(await aligner())) { echec(`${F} noms alignée`, 'interrupteur « Aligner » introuvable'); break; }
      await sleep(500); await etat();
      const r = await noms();
      await cap(`noms-${al ? 'alignee' : 'libre'}`);
      r.pb.length ? echec(`${F} noms ${al ? 'alignée' : 'libre'}`, r.pb.slice(0, 4).join(' ; ')) : ok(`${F} noms ${al ? 'alignée' : 'libre'}`, `${r.n} noms`);
      if (al) await aligner();
    }

    // CAL-ECHELLE-FIGEE (21.11) : dans l'An, la fin tirée au doigt pose une durée (≠ 52), « An » n'est plus coché, « 3 mois » se rechoisit
    try {
      await choisirPeriode('An'); await sleep(400);
      const a = await etat();
      const b = await tirer('An : réduire la fin', 'fin', -d, (a, b) => (a.n === 52 && b.n !== null && b.n < 52 && b.n >= 30) || 'une durée tirée de moins de 52 semaines (pas l\'An, pas la fenêtre d\'avant) attendue');
      const an = await p.evaluate(() => { const e = document.querySelector('[aria-label$="période, liste, tri et filtre"]'); e?.click(); return new Promise((r) => setTimeout(() => { const o = [...document.querySelectorAll('button[aria-pressed]')].find((x) => x.innerText.trim() === 'An'); r(o ? o.getAttribute('aria-pressed') : null); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }, 500)); });
      await echap();
      an === 'false' ? ok(`${F} An décoché`, `${a.cle} → ${b.cle}`) : echec(`${F} An décoché`, `« An » aria-pressed = ${an} après ${a.cle} → ${b.cle}`);
      await choisirPeriode('3 mois'); const c = await etat();
      c.n === 13 ? ok(`${F} 3 mois rechoisi`, c.cle) : echec(`${F} 3 mois rechoisi`, `${c.cle} (13 sem. attendues)`);
    } catch (e) { echec(`${F} An`, String(e.message ?? e).slice(0, 160)); await echap(); }

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
        const x = b.r - Math.min(8, b.w / 4);
        /* CAL-BARRE-BORD : un doigt à moins de 40 px du cadre fait défiler (R7) : le bord proche du cadre se raccourcit de 3 jours au lieu de s'allonger */
        const cadreD = await p.evaluate(() => document.querySelector('[data-frise]').getBoundingClientRect().right), sens = cadreD - (x + (3 * b.col) / 7) < 44 ? -1 : 1, dx = sens * (3 * b.col) / 7;
        await glisser(x, b.y, pas(x, x + dx)); await sleep(500); await echap();
        const c = await valeurGeste(), vise = ajouter(a.au, 3 * sens);
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
  // ── CAL-BARRE-BORD (21.11, « tirer la barre hors du cadre ») : à 390 tactile, en vue 2 sem. (obtenue en pinçant-écartant sur la fin de
  //    « ZZ TEST Geste »), le bord de la barre tiré jusqu'au bord du cadre agrandit la fenêtre (elle ne dit plus « 2 sem. »), et la fin est le
  //    jour sous le doigt (±1 j), relue après rechargement. 1280 souris : pas de pincer, section sautée ──
  const sectionBarreBord = async () => {
    const B = `barre tirée hors du cadre ${combo}`;
    const cdp = await p.createCDPSession();
    if (!tactile) { ok(`${B} (sautée : pincer = tactile seul)`); return; }
    try {
      await choisirPeriode('3 mois'); await sleep(400);
      const a = await valeurGeste(), b0 = await barreGeste();
      if (!a || !b0) { echec(B, '« ZZ TEST Geste » introuvable'); return; }
      const fr = await p.evaluate(() => { const f = document.querySelector('[data-frise]').getBoundingClientRect(); return { l: f.left, r: f.right }; });
      const pt = (x, y) => [{ x: Math.round(x - 0), y: Math.round(y), id: 1 }];
      const deux = (cx, y, d) => [{ x: Math.round(cx - d), y: Math.round(y), id: 1 }, { x: Math.round(cx + d), y: Math.round(y), id: 2 }];
      const cx = fr.l + (Math.floor((b0.r - 4 - fr.l) / b0.col) + 0.5) * b0.col; /* le milieu de la colonne de la fin : la semaine visée, quel que soit le doigt lu */
      const sem0 = await p.evaluate((x) => [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((e) => { const r = e.getBoundingClientRect(); return [e.getAttribute('data-semaine'), Math.round(r.left), Math.round(r.right)].join(':'); }), cx);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: deux(cx, b0.y, 6) }); await sleep(80);
      for (const d of [20, 40, 60, 80]) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: deux(cx, b0.y, d) }); await sleep(40); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(800);
      const periode = () => p.evaluate(() => document.querySelector('[aria-label$="période, liste, tri et filtre"]')?.getAttribute('aria-label') ?? '');
      const per0 = await periode();
      if (!/2 sem/.test(per0)) { echec(`${B} vue 2 sem.`, `le pincer n'a pas donné 2 sem. : « ${per0} »`); await choisirPeriode('3 mois'); return; }
      ok(`${B} vue 2 sem.`, per0);
      const b = await barreGeste();
      if (!b) { await cap('barre-bord-hors'); const dbg = await p.evaluate(() => ({ f: document.querySelector('[data-frise]')?.getBoundingClientRect().width, l: [...document.querySelectorAll('[aria-label*="ZZ"]')].map((e) => e.getAttribute('aria-label').slice(0, 60)), lu: [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].map((e) => e.getAttribute('data-lundi')).slice(0, 3) })); echec(B, 'barre hors champ en 2 sem. ' + JSON.stringify({ ...dbg, a: a.cle, b0, fr, cx, sem0 })); await choisirPeriode('3 mois'); return; }
      const dur = () => p.evaluate(() => document.querySelector('[data-duree]')?.textContent ?? null);
      const d0 = await dur();
      const x0 = b.r - Math.min(8, b.w / 4), xf = fr.r - 10;
      let pend = null;
      await glisser(x0, b.y, pas(x0, xf, 20), { pendant: async () => { await sleep(1000); pend = { per: await periode(), dur: await dur() }; } });
      await sleep(500); await cap('barre-bord');
      (pend && !/2 sem/.test(pend.per)) ? ok(`${B} fenêtre agrandie`, `${per0} → ${pend.per} (durée ${d0} → ${pend.dur})`) : echec(`${B} fenêtre agrandie`, `« ${pend?.per} » : la fenêtre 2 sem. est restée fixe`);
      const c = await valeurGeste();
      const jour = await p.evaluate((x) => {
        const e = [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].find((e) => { const r = e.getBoundingClientRect(); return x >= r.left && x < r.right; });
        if (!e) return null; const r = e.getBoundingClientRect(); return { lundi: e.getAttribute('data-lundi'), k: Math.floor(((x - r.left) / r.width) * 7) };
      }, xf);
      const attendu = jour ? ajouter(jour.lundi, jour.k) : null;
      const ecart = attendu && c ? Math.abs((new Date(c.au) - new Date(attendu)) / 864e5) : null;
      (ecart != null && ecart <= 1) ? ok(`${B} fin sous le doigt`, `${a.cle} → ${c.cle} (doigt : ${attendu})`) : echec(`${B} fin sous le doigt`, `${a.cle} → ${c?.cle} (doigt : ${attendu ?? 'colonne introuvable'}, écart ${ecart} j)`);
      await versCalendrier(); const d = await valeurGeste();
      d?.cle === c?.cle ? ok(`${B} rechargement`, c.cle) : echec(`${B} rechargement`, `${c?.cle} → ${d?.cle}`);
    } catch (e) { echec(B, String(e.message ?? e).slice(0, 160)); await echap(); }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  // ── CHG-4 (21.11, « tirer le début d'une barre ») : 3 mois, 390. Le doigt posé au bord gauche de « ZZ TEST Geste » (à l + min(4, w/5)) et tiré
  //    de 2 colonnes vers la gauche allonge le début de 14 j, la fin reste ; relu après rechargement. Avant : la barre entière partait ──
  const sectionChg4 = async () => {
    const C4 = `bord de début ${combo}`;
    try {
      await choisirPeriode('3 mois'); await sleep(400);
      const fr = await p.evaluate(() => { const f = document.querySelector('[data-frise]').getBoundingClientRect(); return { l: f.left, r: f.right }; });
      let b = await barreGeste();
      if (!b) { echec(C4, '« ZZ TEST Geste » introuvable'); return; }
      for (let k = 0; k < 6 && b && b.l - fr.l < 110; k++) { const x = (Math.max(fr.l, b.l) + Math.min(fr.r, b.r)) / 2; await glisser(x, b.y, pas(x, x + 4 * b.col)); await sleep(500); await echap(); b = await barreGeste(); }
      const a = await valeurGeste();
      if (!b || !a) { echec(C4, '« ZZ TEST Geste » perdue après l’avoir ramenée'); return; }
      const x0 = b.l + Math.min(4, b.w / 5);
      await glisser(x0, b.y, pas(x0, x0 - 2 * b.col, 16)); await sleep(700);
      const c = await valeurGeste();
      const jours = (u, v) => Math.round((new Date(u) - new Date(v)) / 864e5);
      (c && c.du === ajouter(a.du, -14) && c.au === a.au) ? ok(`${C4} début allongé`, `${a.cle} → ${c.cle}`) : echec(`${C4} début allongé`, `${a.cle} → ${c?.cle} (doigt à ${Math.round(x0 - fr.l)} px du cadre, attendu début −14 j, fin gardée${c ? `, vu début ${jours(c.du, a.du)} j, fin ${jours(c.au, a.au)} j` : ''})`);
      await versCalendrier(); const d = await valeurGeste();
      d?.cle === c?.cle ? ok(`${C4} rechargement`, c.cle) : echec(`${C4} rechargement`, `${c?.cle} → ${d?.cle}`);
    } catch (e) { echec(C4, String(e.message ?? e).slice(0, 160)); await echap(); }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  // ── CHG-5 (21.11, « annuler une marque en bord de cadre ») : tactile seul. La marque « Café du Pont » tirée jusqu'au bord droit du cadre
  //    (la fenêtre défile), tenue 1 s puis le geste annulé (touchCancel) : la date, la période et la place de la marque sont celles d'avant ──
  const sectionChg5 = async () => {
    const C5 = `annuler en bord de cadre ${combo}`;
    if (!tactile) { ok(`${C5} (sauté : touchCancel = tactile seul)`); return; }
    const cdp = await p.createCDPSession();
    try {
      await choisirPeriode('3 mois'); await sleep(400);
      const periode = () => p.evaluate(() => document.querySelector('[aria-label$="période, liste, tri et filtre"]')?.getAttribute('aria-label') ?? '');
      const marque = () => p.evaluate(() => { const e = document.querySelector('[aria-label^="Café du Pont,"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { l: r.left, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      const cache = () => p.evaluate((k) => JSON.stringify(JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === 'P-VENTE-1')?.data ?? null), CLE_CACHE);
      const fr = await p.evaluate(() => { const f = document.querySelector('[data-frise]').getBoundingClientRect(); return { l: f.left, r: f.right }; });
      const m0 = await marque(), per0 = await periode(), c0 = await cache();
      if (!m0) { echec(C5, '« Café du Pont » introuvable : ' + await p.evaluate(() => [...document.querySelectorAll('[data-chose]')].map((e) => (e.getAttribute('aria-label') ?? e.getAttribute('data-chose')).slice(0, 22) + '@' + Math.round(e.getBoundingClientRect().left)).join(' | '))); return; }
      const pt = (x) => [{ x: Math.round(x), y: Math.round(m0.y), id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(m0.x) }); await sleep(80);
      for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(m0.x + ((fr.r - 12 - m0.x) * k) / 12) }); await sleep(30); }
      await sleep(1000);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); await sleep(800);
      const m1 = await marque(), per1 = await periode(), c1 = await cache();
      const ecart = m1 ? Math.abs(m1.l - m0.l) : null;
      (c1 === c0) ? ok(`${C5} date inchangée`) : echec(`${C5} date inchangée`, `${c0} → ${c1}`);
      (per1 === per0) ? ok(`${C5} période inchangée`, per1) : echec(`${C5} période inchangée`, `« ${per0} » → « ${per1} »`);
      (ecart != null && ecart <= 2) ? ok(`${C5} place inchangée`, `${Math.round(m0.l)} → ${Math.round(m1.l)}`) : echec(`${C5} place inchangée`, `gauche ${Math.round(m0.l)} → ${m1 ? Math.round(m1.l) : 'introuvable'} (écart ${ecart} px)`);
    } catch (e) { echec(C5, String(e.message ?? e).slice(0, 160)); try { await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); } catch { /* geste déjà clos */ } await echap(); }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  // ── CHG-6 (21.11, « poser la fin d'un brassin en cuve ») : 3 mois, 390. Le bord droit de « NEIPA Test » (en cuve, sans fin) tiré de 6 jours pose sa
  //    fin à aujourd'hui + 6 j ; un brassin en cuve sans fin glissé par le corps ne parle plus de « jalon de fin » ──
  // ── CAL-BARRE-BORD, la chose glissée (VISION-tour9 n° 2, 21.11 : « je tire un évènement en dehors ça doit agrandir l'échelle … à un endroit, ça
  //    doit d'ajuster pour de vrai ») : en 6 sem., « lol » (Papiers, un jour) tirée jusqu'au bord droit du cadre et tenue 1,5 s. La fenêtre
  //    GRANDIT (même début, plus de 6 semaines) au lieu de glisser ; la date posée est celle que la bulle disait au lâcher, et elle est dans la
  //    fenêtre ; relue après rechargement. Rouge sur b17062ff5 : la fenêtre glissait de S47–S52 à S49–S1, bulle « S1 · 7 janv. », posée au 14 janv. ──
  const sectionBarreHors = async () => {
    const H = `chose tirée hors du cadre ${combo}`;
    const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    const datePapier = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === 'P-PAPIER')?.data.date ?? null, CLE_CACHE);
    const lundis = () => p.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].map((e) => e.getAttribute('data-lundi')));
    try {
      /* la fenêtre de la vision : « 2 sem. » la pose sur la semaine d'aujourd'hui (CHN-3), « 6 sem. » garde ce début (S47–S52 le 21.11) */
      await choisirPeriode('2 sem.'); await sleep(400); await choisirPeriode('6 sem.'); await sleep(500);
      const l0 = await lundis(), d0 = await datePapier();
      if (l0[0] !== lundiDe(new Date().toISOString().slice(0, 10))) { echec(H, `la fenêtre 6 sem. ne part pas de cette semaine : ${l0[0]}`); await choisirPeriode('3 mois'); return; }
      const m = await p.evaluate(() => { const e = document.querySelector('[data-frise] [data-chose$="P-PAPIER"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      if (!m || !l0.length || !d0) { echec(H, `« lol » introuvable (${l0.length} semaines, date ${d0})`); return; }
      const fr = await p.evaluate(() => { const f = document.querySelector('[data-frise]').getBoundingClientRect(); return { l: f.left, r: f.right }; });
      /* tenu 1,5 s au bord, puis le doigt revient hors de la bande du bord (le défilement s'arrête) : la bulle lue est celle du lâcher */
      let pend = null;
      const lirePend = async () => { pend = { ici: await p.evaluate(() => document.querySelector('[data-ici]')?.textContent ?? null), l: await lundis() }; };
      const xs = pas(m.x, fr.r - 10, 20);
      if (tactile) {
        const cdpH = await p.createCDPSession(), pt = (x) => [{ x: Math.round(x), y: Math.round(m.y), id: 1 }];
        await cdpH.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(m.x) }); await sleep(50);
        for (const x of xs) { await cdpH.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await sleep(16); }
        await sleep(1500); await cdpH.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(fr.r - 60) }); await sleep(400); await lirePend();
        await cdpH.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else await glisser(m.x, m.y, xs, { pendant: async () => { await sleep(1500); await p.mouse.move(fr.r - 60, m.y); await sleep(400); await lirePend(); } });
      await sleep(700); await cap('chose-hors');
      const l1 = await lundis(), d1 = await datePapier();
      const vu = `${l0[0]}+${l0.length} sem. → ${l1[0]}+${l1.length} sem. ; ${d0} → ${d1} ; bulle « ${pend?.ici} »`;
      (l1[0] === l0[0] && l1.length > l0.length) ? ok(`${H} fenêtre agrandie`, vu) : echec(`${H} fenêtre agrandie`, `${vu} (même début, plus de ${l0.length} semaines attendus)`);
      const b = /(\d{1,2})\s+([a-zéû]+)\.?\s+·\s+lâcher/i.exec(pend?.ici ?? '');
      const dit = b ? { j: Number(b[1]), m: MOIS.findIndex((x) => b[2].toLowerCase().startsWith(x.slice(0, 3))) } : null;
      const pose = d1 ? { j: Number(d1.slice(8, 10)), m: Number(d1.slice(5, 7)) - 1 } : null;
      (dit && pose && dit.j === pose.j && dit.m === pose.m) ? ok(`${H} posée où la bulle le dit`, vu) : echec(`${H} posée où la bulle le dit`, vu);
      const fin = l1.length ? ajouter(l1[l1.length - 1], 6) : null;
      (d1 && d1 !== d0 && d1 >= l1[0] && d1 <= fin) ? ok(`${H} dans la fenêtre`, `${d1} dans ${l1[0]} → ${fin}`) : echec(`${H} dans la fenêtre`, `${d1} hors de ${l1[0]} → ${fin} (ou pas déplacée)`);
      await versCalendrier(); const d2 = await datePapier();
      d2 === d1 ? ok(`${H} rechargement`, d1) : echec(`${H} rechargement`, `${d1} → ${d2}`);
    } catch (e) { echec(H, String(e.message ?? e).slice(0, 160)); await echap(); }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  const sectionChg6 = async () => {
    const C6 = `fin d’un brassin en cuve ${combo}`;
    const auj = new Date().toISOString().slice(0, 10);
    try {
      /* « NEIPA Test » (en cuve depuis 78 j, sans fin, déjà dans la fixture) est hors de la fenêtre de 3 mois : la période est reculée jusqu'à le voir */
      await rendreFixture(['B-NEIPA-TEST']);
      await versCalendrier(); await choisirPeriode('3 mois'); await sleep(500);
      for (let k = 0; k < 3 && !(await p.evaluate(() => !!document.querySelector('[aria-label^="NEIPA Test,"]:not([data-probable])'))); k++) { const f = await p.evaluate(() => { const e = document.querySelector('[aria-label="Période précédente"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); if (!f) break; await toucherXY(f[0], f[1]); await sleep(700); }
      const boite = (nom) => p.evaluate((n) => { const e = document.querySelector(`[aria-label^="${n},"]:not([data-probable])`); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, w: r.width, y: r.top + r.height / 2 }; }, nom);
      const col = await p.evaluate(() => { const cols = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((x) => x.getBoundingClientRect().x); return cols.length > 1 ? (cols[cols.length - 1] - cols[0]) / (cols.length - 1) : 26; });
      const fin = () => p.evaluate((k) => { const e = JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === 'B-NEIPA-TEST'); return e?.finPrevue ?? e?.data?.finPrevue ?? null; }, CLE_CACHE);
      const iso = (v) => { if (!v) return null; const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(v)); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : String(v).slice(0, 10); };
      const b = await boite('NEIPA Test');
      if (!b) { echec(C6, '« NEIPA Test » introuvable : ' + await p.evaluate(() => [...document.querySelectorAll('[data-chose]')].map((e) => (e.getAttribute('aria-label') ?? e.getAttribute('data-chose')).slice(0, 22) + '@' + Math.round(e.getBoundingClientRect().left)).join(' | '))); return; }
      const mi = await boite('NEIPA Test');
      if (!mi) { echec(`${C6} message`, '« NEIPA Test » introuvable'); }
      else {
        const x = mi.l + mi.w / 2, lire = () => p.evaluate(() => document.querySelector('[data-message]')?.textContent ?? '');
        let msg = '';
        await glisser(x, mi.y, pas(x, x + 2 * col, 10), { pendant: async () => { await sleep(300); msg = await lire(); } });
        await sleep(300); if (!msg) msg = await lire();
        (msg && !/jalon de fin/.test(msg)) ? ok(`${C6} message du corps`, msg.slice(0, 90)) : echec(`${C6} message du corps`, msg ? `« ${msg.slice(0, 120)} »` : 'aucun message');
        await echap();
      }
      const f0 = await fin();
      const x0 = b.r - Math.min(8, b.w / 4);
      /* hors de la bande de 40 px du cadre (le cadre défile sous le doigt) : 0,9 colonne, soit 6 jours */
      await glisser(x0, b.y, pas(x0, x0 + 0.9 * col, 12)); await sleep(700);
      const f1 = iso(await fin()), ecart = f1 ? Math.round((new Date(f1) - new Date(auj)) / 864e5) : null;
      (f1 && ecart >= 5 && ecart <= 7) ? ok(`${C6} fin posée`, `${f0 ?? 'aucune'} → ${f1} (aujourd’hui + ${ecart} j)`) : echec(`${C6} fin posée`, `finPrevue ${f0 ?? 'aucune'} → ${f1 ?? 'aucune'} (attendu aujourd’hui + 5 à 7 j ; barre ${JSON.stringify(b)}, col ${col}, cadre ${JSON.stringify(await p.evaluate(() => { const r = document.querySelector('[data-frise]').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; }))}, durée ${await p.evaluate(() => document.querySelector('[data-duree]')?.textContent ?? '-')}, cache ${await p.evaluate((k) => JSON.stringify(JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === 'B-NEIPA-TEST')?.data ?? null).slice(0, 400), CLE_CACHE)})`);
      await echap();
      await p.evaluate((kf, kc) => { for (const k of [kf, kc]) localStorage.setItem(k, JSON.stringify(JSON.parse(localStorage.getItem(k) ?? '[]').map((x) => (x.id === 'B-NEIPA-TEST' ? { ...x, finPrevue: null, ...(x.data ? { data: { ...x.data, finPrevue: null } } : {}) } : x)))); }, CLE_FIXTURE, CLE_CACHE);
    } catch (e) { echec(C6, String(e.message ?? e).slice(0, 160)); await echap(); }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  // ── CAL-CUVE (VISION-tour9 n° 3, 21.11, brassin en cuve « NEIPA Test » J78) : (a) la date de BRASSAGE se règle depuis sa pastille (la règle lâchée écrit
  //    `brewDate`, plus de refus « le jour de brassage ne bouge pas ») ; (b) « Prête ? » (fin inconnue) se règle depuis la fiche (écrit `finPrevue`). Rouge sur tour8 ──
  // ── CAL-RETOUR-PASSE et CAL-ECHELLE-COHERENTE (22.11) : le passé se libère, et l'étiquette du cadre, son dessin, la pastille et les graduations
  //    disent la même période, à chaque échelle et après chaque geste ──
  const lireCoherence = () => p.evaluate(() => {
    const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'), cadre = document.querySelector('.ent-cadre');
    if (!cb || !cadre) return { erreur: 'courbe ou cadre introuvable' };
    cb.scrollIntoView({ block: 'center' });
    const iso = (t0) => { const t = new Date(Date.UTC(t0.getUTCFullYear(), t0.getUTCMonth(), t0.getUTCDate())); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3); const a = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((t - a) / 864e5 - 3 + ((a.getUTCDay() + 6) % 7)) / 7); };
    const c = cadre.getBoundingClientRect();
    const dans = (e) => { const r = e.getBoundingClientRect(), x = r.left + r.width / 2; return x >= c.left - 0.5 && x <= c.right + 0.5; };
    const num = (e) => Number(e.getAttribute('data-point-semaine') ?? e.getAttribute('data-semaine'));
    const points = [...cb.querySelectorAll('[data-point-semaine]')].filter(dans).map(num);
    const grad = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left + r.width / 2 >= 0 && r.left + r.width / 2 <= innerWidth; }).map(num);
    const pt = document.querySelector('[data-periode-pastille] .pr-court')?.textContent?.trim() ?? null;
    let pastille = null;
    const m = pt && /(\d\d)\.(\d\d)(?:\.(\d\d))?\s*[–-]\s*(\d\d)\.(\d\d)(?:\.(\d\d))?/.exec(pt);
    if (m) {
      const an = new Date().getFullYear(), ya = m[3] ? 2000 + Number(m[3]) : m[6] ? 2000 + Number(m[6]) - (Number(m[2]) > Number(m[5]) ? 1 : 0) : an, yb = m[6] ? 2000 + Number(m[6]) : ya;
      const du = new Date(Date.UTC(ya, Number(m[2]) - 1, Number(m[1]))), au = new Date(Date.UTC(yb, Number(m[5]) - 1, Number(m[4])));
      const nums = []; for (let t = new Date(du.getTime() - ((du.getUTCDay() + 6) % 7) * 864e5); t <= au; t = new Date(t.getTime() + 7 * 864e5)) nums.push(iso(t));
      pastille = { du: du.toISOString().slice(0, 10), nums };
    }
    const et = (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    // « S47 – S52 », « S47 – S45 2027 », « S47 2025 – S52 2026 » (T9-2 : le début dit son année hors de l'année en cours)
    const me = /^S(\d+)(?: (\d{4}))?(?: – S(\d+)(?: (\d{4}))?)?/.exec(et);
    const etiquette = me ? { a: Number(me[1]), anA: me[2] ? Number(me[2]) : null, b: Number(me[3] ?? me[1]), anB: me[4] ? Number(me[4]) : null } : null;
    // étiquettes de la courbe : deux textes qui se recouvrent = empilées
    const tx = [...cb.querySelectorAll('text')].filter((e) => (e.textContent ?? '').trim()).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent ?? '').trim().slice(0, 18), l: r.left, r: r.right, hh: r.top, b: r.bottom }; }).filter((r) => r.r - r.l > 0);
    const empilees = []; for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i], b = tx[j], w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.hh, b.hh); if (w > 2 && h > 2 && (w * h) / Math.min((a.r - a.l) * (a.b - a.hh), (b.r - b.l) * (b.b - b.hh)) > 0.3) empilees.push(`${a.t}/${b.t}`); }
    return { pt, label: et, pastille, etiquette, points, grad, empilees };
  });
  // CAL-PERIODE-APP-FIXE (22.11, « Cette période là reste fixe, le reste peut être mobile ») : la pastille de l'app ne bouge que par ses propres ‹ ›.
  // La fenêtre du Calendrier est locale : étiquette, dessin et graduations se lisent entre eux, la pastille reste celle du départ (pt0).
  const jugerCoherence = (c, pt0) => {
    if (c.erreur) return [c.erreur];
    const pbl = [], pbs = (l) => l?.length ? `S${l[0]}–S${l[l.length - 1]} (${l.length})` : 'aucune';
    if (pt0 !== undefined && c.pt !== pt0) pbl.push(`la période de l'app a changé : « ${pt0} » → « ${c.pt} »`);
    if (c.etiquette && (c.points[0] !== c.etiquette.a || c.points[c.points.length - 1] !== c.etiquette.b)) pbl.push(`étiquette « ${c.label} » ≠ dessin du cadre ${pbs(c.points)}`);
    if (!c.etiquette && !/\d{4}|janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc/i.test(c.label)) pbl.push(`étiquette illisible (« ${c.label} »)`);
    if (!c.points.length) pbl.push('aucun point de courbe dans le cadre');
    if (c.grad.length && c.grad.join() !== c.points.join()) pbl.push(`graduations ${pbs(c.grad)} ≠ dessin du cadre ${pbs(c.points)}`);
    if (c.empilees.length) pbl.push(`étiquettes de courbe empilées : ${c.empilees.slice(0, 3).join(', ')}`);
    return pbl;
  };
  const verifierCoherence = async (F, nom, pt0) => {
    const c = await lireCoherence(), pb = jugerCoherence(c, pt0);
    pb.length ? echec(`${F} ${nom}`, pb.join(' ; ')) : ok(`${F} ${nom}`, `${c.label} · app ${c.pt}`);
    return c;
  };
  const boiteCadre = () => p.evaluate(() => { const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'), c = document.querySelector('.ent-cadre'); if (!cb || !c) return null; cb.scrollIntoView({ block: 'center' }); const a = cb.getBoundingClientRect(), r = c.getBoundingClientRect(); return { l: r.left, r: r.right, y: a.top + a.height / 2 }; });
  const sectionPasseLibre = async () => {
    const F = `retour au passé ${combo}`;
    try {
      await versCalendrier();
      const pt0 = (await lireCoherence()).pt;
      await choisirPeriode('3 mois'); await sleep(500);
      let c = await verifierCoherence(F, 'au départ', pt0);
      // glisser la frise (le corps du cadre) vers le passé, 40 semaines au moins : 26 au-delà du bord de la version rejetée (14 semaines)
      let recul = 0, prec = c.etiquette?.a ?? null, n = 0, bloque = 0;
      for (; n < 30 && recul < 40; n++) {
        const g = await boiteCadre(); if (!g) break;
        const x0 = (g.l + g.r) / 2; await glisser(x0, g.y, pas(x0, x0 - 120)); await sleep(450);
        c = await verifierCoherence(F, `glisser le corps à gauche n° ${n + 1}`, pt0);
        const a = c.etiquette?.a ?? null; if (prec !== null && a !== null) { const d = (prec - a + 53) % 53; if (d <= 30) recul += d; bloque = d === 0 ? bloque + 1 : 0; } prec = a; if (bloque >= 2) { n++; break; }
      }
      await cap('retour-passe-bord');
      recul >= 40 ? ok(`${F} CAL-RETOUR-PASSE`, `${recul} semaines de recul en ${n} gestes`) : echec(`${F} CAL-RETOUR-PASSE`, `le cadre s'arrête après ${recul} semaines de recul (40 attendues) : le passé est borné`);
      for (const [nom, x, dx] of [['tirer le début', (g) => g.l + 1, -60], ['glisser le corps à droite', (g) => (g.l + g.r) / 2, 80]]) {
        const g = await boiteCadre(); if (!g) { echec(`${F} ${nom}`, 'cadre introuvable'); continue; }
        const x0 = x(g); await glisser(x0, g.y, pas(x0, x0 + dx)); await sleep(500);
        await verifierCoherence(F, nom, pt0);
      }
      await cap('retour-passe-fin');
    } catch (e) { echec(F, String(e.message ?? e).slice(0, 200)); }
  };
  const sectionEchelles = async () => {
    const F = `échelles ${combo}`;
    try {
      let pt0;
      for (const duree of ['6 sem.', '3 mois', '6 mois', 'An']) {
        await versCalendrier(); if (pt0 === undefined) pt0 = (await lireCoherence()).pt;
        await choisirPeriode(duree); await sleep(500);
        await verifierCoherence(`${F} ${duree}`, 'repos', pt0);
        await cap(`echelle-${duree.replace(/\W+/g, '')}`);
        const g = await boiteCadre();
        if (!g) { echec(`${F} ${duree}`, 'cadre introuvable'); continue; }
        const x0 = g.l + 1; await glisser(x0, g.y, pas(x0, x0 - 40)); await sleep(500);
        await verifierCoherence(`${F} ${duree}`, 'après avoir tiré le début', pt0);
        const g2 = await boiteCadre();
        if (g2) { const x1 = g2.r - 1; await glisser(x1, g2.y, pas(x1, x1 + 40)); await sleep(500); await verifierCoherence(`${F} ${duree}`, 'après avoir tiré la fin', pt0); }
      }
    } catch (e) { echec(F, String(e.message ?? e).slice(0, 200)); }
  };
  /* CAL-FRISE-ETIQUETTES (22.11, capture 35 : « Achats −5 » sous la poignée gauche, « lol −600 » et « 0 » collés au bord, « S47 » écrit deux fois) :
     à chaque échelle, aucune étiquette de la courbe (noms de mouvement, niveau, repère zéro, mises de côté, mois) ne croise une poignée du cadre,
     l'étiquette du cadre ni une autre étiquette, ni ne sort de la courbe ; un libellé de semaine (« S47 ») ne s'écrit qu'une fois (cadre ou graduation). */
  const lireEtiquettes = () => p.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; };
    const svg = document.querySelector('.ent-cb svg.ent-svg'); const sr = svg ? svg.getBoundingClientRect() : null;
    const bx = (r) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom });
    const cache = (e) => !!e.closest('.ent-nom-cache');
    const et = [];
    for (const [sel, k] of [['[data-nom-courbe]', 'nom'], ['[data-niveau-courbe]', 'niveau'], ['[data-sous-zero="repere"]', 'zéro'], ['[data-mise-de-cote="etiquette"]', 'mise'], ['.ent-cb .ent-mois', 'mois']]) {
      for (const e of document.querySelectorAll(sel)) { if (cache(e)) continue; const r = vis(e); if (r) et.push({ k, tx: (e.textContent || '').replace(/\s+/g, ' ').trim(), ...bx(r) }); }
    }
    const cad = [...document.querySelectorAll('[data-cadre-etiquette]')].map((e) => { const r = vis(e); return r ? { k: 'cadre', tx: (e.textContent || '').replace(/\s+/g, ' ').trim(), ...bx(r) } : null; }).filter(Boolean);
    const pog = [...document.querySelectorAll('[data-poignee]')].map((e) => { const i = e.querySelector('i'); const r = i ? vis(i) : null; return r ? { k: 'poignée ' + e.getAttribute('data-poignee'), tx: '', ...bx(r) } : null; }).filter(Boolean);
    const grad = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((e) => ({ r: vis(e), t: (e.textContent || '').trim() })).filter((g) => g.r && g.r.right > 0 && g.r.left < innerWidth && /^S\d+$/.test(g.t)).map((g) => g.t);
    return { et, cad, pog, grad, svg: sr ? bx(sr) : null };
  });
  const verifierEtiquettes = async (quand) => {
    const d = await lireEtiquettes(); const fautes = [];
    const croise = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
    const nom = (a) => `« ${a.tx || a.k} »`;
    for (let i = 0; i < d.et.length; i++) {
      const a = d.et[i];
      for (const q of d.pog) if (croise(a, q)) fautes.push(`${nom(a)} croise la ${q.k}`);
      for (const c of d.cad) if (croise(a, c)) fautes.push(`${nom(a)} croise l'étiquette du cadre « ${c.tx} »`);
      for (let j = i + 1; j < d.et.length; j++) if (croise(a, d.et[j])) fautes.push(`${nom(a)} croise ${nom(d.et[j])}`);
      if (d.svg && (a.l < d.svg.l - 0.5 || a.r > d.svg.r + 0.5)) fautes.push(`${nom(a)} sort de la courbe (${Math.round(a.l - d.svg.l)} / ${Math.round(a.r - d.svg.r)} px)`);
    }
    for (const c of d.cad) if (/^S\d+$/.test(c.tx) && d.grad.includes(c.tx)) fautes.push(`« ${c.tx} » écrit deux fois (cadre et graduation)`);
    fautes.length ? echec(`${quand}`, [...new Set(fautes)].slice(0, 4).join(' ; ')) : ok(`${quand}`, `${d.et.length} étiquette(s), ${d.pog.length} poignée(s) : aucun croisement, semaine dite une fois`);
  };
  const sectionEtiquettes = async () => {
    const F = `étiquettes de la frise ${combo}`;
    try {
      for (const duree of ['6 sem.', '3 mois', '6 mois', 'An']) {
        await versCalendrier(); await choisirPeriode(duree); await sleep(600);
        await cap(`etiquettes-${duree.replace(/\W+/g, '')}`);
        await verifierEtiquettes(`${F} ${duree}`);
      }
      /* les échelles qu'aucun menu ne donne : 1 semaine (la fin tirée sur le début) et 7 semaines, 30 semaines (la fin tirée plus loin) */
      for (const [nom, depart, dx] of [['1 sem.', '6 sem.', -1000], ['7 sem.', '6 sem.', 40], ['30 sem.', '6 mois', 70]]) {
        await versCalendrier(); await choisirPeriode(depart); await sleep(500);
        const g = await boiteCadre(); if (!g) { echec(`${F} ${nom}`, 'cadre introuvable'); continue; }
        const x1 = g.r - 1; await glisser(x1, g.y, pas(x1, dx < -500 ? g.l - 3 : x1 + dx)); await sleep(600);
        await cap(`etiquettes-${nom.replace(/\W+/g, '')}`);
        await verifierEtiquettes(`${F} ${nom}`);
      }
    } catch (e) { echec(F, String(e.message ?? e).slice(0, 200)); }
  };
  /* CAL-AN-390 (22.11, capture 38 : « Toujours et encore des problèmes... », 390, échelle An) : à 390, à chaque échelle, aucun texte rogné ni chevauché
     dans l'en-tête (mois, graduations, noms, étiquette du cadre), les barres de la frise et la fiche ouverte : ni « … » écrit, ni `text-overflow: ellipsis`
     qui rogne, ni texte plus large que sa boîte coupée (`overflow` ≠ visible, scrollWidth > clientWidth), ni deux textes qui se recouvrent. */
  const lireTextes = (zone) => p.evaluate((z) => {
    /* REPRISE-3 (22.11) : la zone est l'en-tête du Calendrier lui-même (EnTete, [data-calendrier-entete], présent à toutes les échelles, An comprise),
       jamais un ancêtre commun qui remonte à la barre d'onglets ; les textes réservés aux lecteurs d'écran (.sr-only, clip 1 px) ne se voient pas. */
    const zones = { entete: document.querySelector('[data-calendrier-entete]'), frise: document.querySelector('[data-frise]'), fiche: document.querySelector('[data-detail]') };
    const r0 = zones[z]; if (!r0) return { absent: true };
    const fautes = [], boites = [];
    const cache = (e) => { for (let a = e; a && a !== r0.parentElement; a = a.parentElement) { if (a.classList?.contains('sr-only')) return true; const s = getComputedStyle(a); if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0' || (s.position === 'absolute' && /rect\(0/.test(s.clip))) return true; } return false; };
    const feuilles = [...r0.querySelectorAll('*')].filter((e) => !e.children.length && (e.textContent || '').trim() && !e.closest('svg title, .ent-nom-cache, [aria-hidden="true"]') && !(e instanceof SVGTitleElement) && !cache(e));
    for (const e of feuilles) {
      const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.right < 0 || r.left > innerWidth) continue;
      const t = (e.textContent || '').replace(/\s+/g, ' ').trim(), c = getComputedStyle(e);
      if (/…|\.\.\./.test(t)) fautes.push(`« ${t.slice(0, 24)} » écrit avec « … »`);
      /* le texte lui-même (Range : la boîte de ses glyphes), comparé à chaque boîte qui coupe : un vide de 2 px en bout de boîte (marge, pastille vide)
         n'est pas un texte rogné ; la feuille qui coupe son propre texte (ellipsis) l'est dès que son texte déborde */
      const rg = document.createRange(); rg.selectNodeContents(e); const rt = rg.getBoundingClientRect();
      for (let a = e; a && a !== r0.parentElement; a = a.parentElement) {
        if (!(a instanceof HTMLElement)) continue;
        const s = getComputedStyle(a), rogne = s.textOverflow === 'ellipsis' || s.overflowX === 'hidden' || s.overflowX === 'clip';
        if (!rogne || a.clientWidth <= 0) continue;
        const ra = a.getBoundingClientRect(), dehors = Math.max(rt.right - ra.right, ra.left - rt.left);
        if ((a === e && a.scrollWidth > a.clientWidth + 1) || dehors > 1) { fautes.push(`« ${t.slice(0, 24)} » rogné (${a === e ? `${a.scrollWidth} > ${a.clientWidth} px` : `${Math.round(dehors)} px hors de`}, ${a.tagName.toLowerCase()}.${String(a.className).split(' ')[0]})`); break; }
      }
      if (e.closest('svg') && !(e instanceof SVGTextElement || e instanceof SVGTSpanElement)) continue;
      boites.push({ t, l: r.left, r: r.right, hi: r.top, b: r.bottom });
    }
    for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) { const a = boites[i], b = boites[j]; if (Math.min(a.r, b.r) - Math.max(a.l, b.l) > -2 && Math.min(a.b, b.b) - Math.max(a.hi, b.hi) > 3) fautes.push(`« ${a.t.slice(0, 18)} » croise ou touche « ${b.t.slice(0, 18)} »`); }
    return { fautes: [...new Set(fautes)] };
  }, zone);
  const sectionAn390 = async () => {
    const F = `CAL-AN-390 ${combo}`;
    if (!tactile) return;
    try {
      for (const duree of ['1 sem.', '6 sem.', '3 mois', '6 mois', 'An']) {
        await versCalendrier();
        if (duree === '1 sem.') {
          /* 1 semaine : aucun menu ne la donne ; la fin du cadre tirée sur son début (comme sectionEtiquettes) */
          await choisirPeriode('2 sem.'); await sleep(400); await choisirPeriode('6 sem.'); await sleep(500);
          const g = await boiteCadre(); if (!g) { echec(`${F} ${duree}`, 'cadre introuvable'); continue; }
          const x1 = g.r - 1; await glisser(x1, g.y, pas(x1, g.l - 3)); await sleep(600);
        } else { await choisirPeriode(duree); await sleep(600); }
        await cap(`an390-${duree.replace(/\W+/g, '')}`);
        for (const z of ['entete', 'frise']) {
          const r = await lireTextes(z);
          r.absent ? echec(`${F} ${duree} ${z}`, 'zone introuvable') : r.fautes.length ? echec(`${F} ${duree} ${z}`, r.fautes.slice(0, 4).join(' ; ')) : ok(`${F} ${duree} ${z}`, 'aucun texte rogné ni chevauché');
        }
        /* REPRISE-4 (a) : la période posée à côté de la pastille (« prévu nov. 26–nov. 27 ») se lit d'un bloc : jamais « 27 » seul sur sa ligne,
           jamais « S47–S47 ». (b) : un picto d'étape (`.cal-jalon`) ne déborde jamais sur une autre barre (à 1 sem., celui de « Jhhh » passait
           sous sa barre, sur la ligne suivante). */
        const ra = await p.evaluate(() => {
          const fautes = [];
          for (const e of document.querySelectorAll('[data-frise] .cal-conf')) {
            const NBSP = String.fromCharCode(160), WJ = String.fromCharCode(0x2060);
            const t = e.textContent ?? '', lu = t.split(WJ).join('').split(NBSP).join(' ');
            if (/\b(S\d+)\s*–\s*\1\b/.test(lu)) fautes.push(`« ${lu} » : la même semaine deux fois`);
            const mot = /^(prévu|confirmé|à encaisser|à payer)\s/.exec(t), fin = t.indexOf(' · ') > 0 ? t.indexOf(' · ') : t.length;
            const n = e.firstChild, bloc = e.querySelector('.cal-conf-p'); if (!mot || !n || n.nodeType !== 3) continue;
            const rg = document.createRange();
            if (bloc) rg.selectNodeContents(bloc); else { rg.setStart(n, mot[0].length); rg.setEnd(n, Math.min(fin, n.length)); }
            const tops = new Set([...rg.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top)));
            if (tops.size > 1) fautes.push(`« ${lu} » : la période coupée sur ${tops.size} lignes`);
          }
          const barres = [...document.querySelectorAll('[data-frise] [data-chose]')];
          for (const j of document.querySelectorAll('[data-frise] .cal-jalon')) {
            const r = j.getBoundingClientRect(); if (r.width < 1) continue;
            const mienne = j.closest('[data-chose]');
            const autre = barres.find((b) => b !== mienne && !b.contains(j) && (() => { const q = b.getBoundingClientRect(); return Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > -1; })());
            if (autre) fautes.push(`picto ${j.getAttribute('data-jalon')} de « ${(mienne?.getAttribute('aria-label') ?? '').split(',')[0]} » sur la barre « ${(autre.getAttribute('aria-label') ?? '').split(',')[0]} »`);
          }
          return [...new Set(fautes)];
        });
        ra.length ? echec(`${F} ${duree} rangées`, ra.slice(0, 4).join(' ; ')) : ok(`${F} ${duree} rangées`, 'période d\'un bloc, aucun picto sur une autre barre');
        const b = await p.evaluate(() => { const e = [...document.querySelectorAll('[data-chose]')].find((x) => { const r = x.getBoundingClientRect(); return r.width > 20 && r.left >= 0 && r.right <= innerWidth && r.top > 0 && r.bottom < innerHeight; }); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
        if (!b) { echec(`${F} ${duree} fiche`, 'aucune barre touchable dans la vue'); continue; }
        await toucherXY(b[0], b[1]); await sleep(700);
        await cap(`an390-${duree.replace(/\W+/g, '')}-fiche`);
        const f = await lireTextes('fiche');
        f.absent ? echec(`${F} ${duree} fiche`, 'aucune fiche ouverte') : f.fautes.length ? echec(`${F} ${duree} fiche`, f.fautes.slice(0, 4).join(' ; ')) : ok(`${F} ${duree} fiche`, 'aucun texte rogné ni chevauché');
        await echap(); await sleep(300);
      }
    } catch (e) { echec(F, String(e.message ?? e).slice(0, 200)); }
  };
  /* T9 (tour 9 au doigt, en ligne, 22.11, BUGS.md T9-1 à T9-3), joués comme le testeur : le doigt TENU au bord puis levé AU BORD (pas ramené).
     T9-1 : une chose tirée hors du bord droit du cadre et tenue 2,1 s agrandit la fenêtre (même début) et reste dans la vue.
     T9-2 : la poignée de début tenue 3,6 s au bord gauche de la courbe recule d'au moins 8 semaines en un seul geste (elle butait sur S47).
     T9-3 : la fiche d'une Fête et sa feuille Modifier disent la même durée (« 1 j » contre « 1 semaine »). */
  const tenirAuBord = async (x0, y, x1, ms) => {
    const xs = pas(x0, x1, 20);
    if (tactile) {
      const cdpT = await p.createCDPSession(), pt = (x) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
      await cdpT.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0) }); await sleep(50);
      for (const x of xs) { await cdpT.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await sleep(16); }
      /* le doigt tenu bouge à peine (un vrai doigt n'est jamais immobile) : un toucher par 100 ms au même endroit */
      for (let t = 0; t < ms; t += 100) { await sleep(100); await cdpT.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x1 + ((t / 100) % 2)) }); }
      await cdpT.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await p.mouse.move(x0, y); await p.mouse.down(); await sleep(40);
      for (const x of xs) { await p.mouse.move(x, y); await sleep(16); }
      for (let t = 0; t < ms; t += 100) { await sleep(100); await p.mouse.move(x1 + ((t / 100) % 2), y); }
      await p.mouse.up();
    }
    await sleep(800);
  };
  const sectionT9 = async () => {
    const F = `T9 ${combo}`;
    const lundisT = () => p.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].map((e) => e.getAttribute('data-lundi')));
    const datePapierT = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === 'P-PAPIER')?.data.date ?? null, CLE_CACHE);
    /* les sections d'avant (CAL-BARRE-BORD) ont pu poser « lol » loin (févr. 2027) : chaque essai T9-1 part de sa date de fixture (rechargée par versCalendrier) */
    const datePapierFixture = JSON.parse(fixtureGeste()).find((x) => x.id === 'P-PAPIER')?.data?.date ?? null;
    const rendrePapier = () => p.evaluate((kf, kc, d) => { for (const k of [kf, kc]) { const v = localStorage.getItem(k); if (v) localStorage.setItem(k, JSON.stringify(JSON.parse(v).map((x) => (x.id === 'P-PAPIER' && x.data ? { ...x, data: { ...x.data, date: d } } : x)))); } }, CLE_FIXTURE, CLE_CACHE, datePapierFixture);
    /* T9-1 au doigt TREMBLANT (22.11) : un vrai doigt tenu au bord bouge de ±1 px à 60-120 Hz (0, −1, 0, +1 : le sens change sans cesse). Le sens
       armé au moindre pas de 0,5 px s'inversait, le défilement s'arrêtait. Deux variantes : bande du bord de la frise (8 ms) et bord de l'écran
       (x = largeur − 1, 16 ms). Chaque essai part de la date de la fixture (la chose posée est rendue par « Annuler »). Rouge sur tour9. */
    for (const [nom, auBordEcran, periodeMs] of [['bande', false, 8], ['écran', true, 16]]) {
      try {
        if (datePapierFixture) await rendrePapier();
        await versCalendrier(); await choisirPeriode('2 sem.'); await sleep(400); await choisirPeriode('6 sem.'); await sleep(500);
        const l0 = await lundisT(), d0 = await datePapierT();
        const m = await p.evaluate(() => { const e = document.querySelector('[data-frise] [data-chose$="P-PAPIER"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 12), y: r.top + r.height / 2 }; });
        const fr = await p.evaluate(() => { const f = document.querySelector('[data-frise]').getBoundingClientRect(); return { l: f.left, r: Math.min(f.right, innerWidth) }; });
        if (!m || !d0) { echec(`${F} T9-1 tremblant ${nom}`, `« lol » introuvable (date ${d0})`); continue; }
        const x1 = auBordEcran ? (await p.evaluate(() => innerWidth)) - 1 : fr.r - 6, xs = pas(m.x, x1, 20), bruit = [0, -1, 0, 1];
        if (tactile) {
          const cdpT = await p.createCDPSession(), pt = (x) => [{ x, y: Math.round(m.y), id: 1 }];
          await cdpT.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(Math.round(m.x)) }); await sleep(50);
          for (const x of xs) { await cdpT.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(Math.round(x)) }); await sleep(16); }
          for (let t = 0, i = 0; t < 2100; t += periodeMs, i++) { await sleep(periodeMs); await cdpT.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(Math.round(x1) + bruit[i % 4]) }); }
          await cdpT.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await p.mouse.move(m.x, m.y); await p.mouse.down(); await sleep(40);
          for (const x of xs) { await p.mouse.move(x, m.y); await sleep(16); }
          for (let t = 0, i = 0; t < 2100; t += periodeMs, i++) { await sleep(periodeMs); await p.mouse.move(x1 + bruit[i % 4], m.y); }
          await p.mouse.up();
        }
        await sleep(800);
        await cap(`t9-1-tremblant-${auBordEcran ? 'ecran' : 'bande'}`);
        const l1 = await lundisT(), d1 = await datePapierT(), fin = l1.length ? ajouter(l1[l1.length - 1], 6) : null;
        const dit = `${l0[0]}+${l0.length} sem. → ${l1[0]}+${l1.length} sem. ; ${d0} → ${d1}`;
        /* même début tant qu'elle grandit ; à 6 mois (26 sem., CAL-BARRE-BORD) elle défile comme avant : le début peut alors avancer */
        (l1.length > l0.length && (l1[0] === l0[0] || l1.length >= 26) && d1 && d1 !== d0 && d1 >= l1[0] && d1 <= fin) ? ok(`${F} T9-1 tremblant ${nom}`, dit) : echec(`${F} T9-1 tremblant ${nom}`, `${dit} : doigt tremblant (±1 px toutes les ${periodeMs} ms) tenu 2,1 s au bord, la fenêtre doit grandir et la chose y rester`);
        if (d1 !== d0) { await toucherTexte('Annuler'); await sleep(700); }
        const d2 = await datePapierT();
        if (d2 !== d0) echec(`${F} T9-1 tremblant ${nom} annuler`, `« Annuler » n'a pas rendu la date : ${d0} → ${d2}`);
      } catch (e) { echec(`${F} T9-1 tremblant ${nom}`, String(e.message ?? e).slice(0, 160)); await echap(); }
    }
    // T9-1
    try {
      if (datePapierFixture) await rendrePapier();
      await versCalendrier(); await choisirPeriode('2 sem.'); await sleep(400); await choisirPeriode('6 sem.'); await sleep(500);
      const l0 = await lundisT(), d0 = await datePapierT();
      const m = await p.evaluate(() => { const e = document.querySelector('[data-frise] [data-chose$="P-PAPIER"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 12), y: r.top + r.height / 2 }; });
      const fr = await p.evaluate(() => { const f = document.querySelector('[data-frise]').getBoundingClientRect(); return { l: f.left, r: Math.min(f.right, innerWidth) }; });
      if (!m || !d0) echec(`${F} T9-1`, `« lol » introuvable (date ${d0})`);
      else {
        await tenirAuBord(m.x, m.y, fr.r - 6, 2100);
        await cap('t9-1-barre-au-bord');
        const l1 = await lundisT(), d1 = await datePapierT(), fin = l1.length ? ajouter(l1[l1.length - 1], 6) : null;
        const vu = await p.evaluate(() => { const e = document.querySelector('[data-frise] [data-chose$="P-PAPIER"]'), f = document.querySelector('[data-frise]'); if (!e || !f) return null; const r = e.getBoundingClientRect(), g = f.getBoundingClientRect(); return r.width > 0 && r.left >= g.left - 1 && r.left < Math.min(g.right, innerWidth) - 4; });
        const dit = `${l0[0]}+${l0.length} sem. → ${l1[0]}+${l1.length} sem. ; ${d0} → ${d1} ; dans la vue : ${vu}`;
        (l1[0] === l0[0] && l1.length > l0.length) ? ok(`${F} T9-1 fenêtre agrandie`, dit) : echec(`${F} T9-1 fenêtre agrandie`, `${dit} (même début, plus de ${l0.length} semaines attendus)`);
        (d1 && d1 !== d0 && d1 >= l1[0] && d1 <= fin && vu) ? ok(`${F} T9-1 posée dans la vue`, dit) : echec(`${F} T9-1 posée dans la vue`, `${dit} (fenêtre ${l1[0]} → ${fin})`);
      }
    } catch (e) { echec(`${F} T9-1`, String(e.message ?? e).slice(0, 160)); await echap(); }
    // T9-2
    try {
      await versCalendrier(); await choisirPeriode('2 sem.'); await sleep(400); await choisirPeriode('6 sem.'); await sleep(500);
      const c0 = await lireCoherence(), g = await boiteCadre();
      const cbL = await p.evaluate(() => (document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'))?.getBoundingClientRect().left ?? null);
      if (!g || !c0.etiquette || cbL === null) echec(`${F} T9-2`, `cadre illisible (« ${c0.label} »)`);
      else {
        await tenirAuBord(g.l + 1, g.y, Math.max(2, cbL + 2), 3600);
        await cap('t9-2-debut-tenu');
        const c1 = await verifierCoherence(`${F} T9-2`, 'après le début tenu au bord', c0.pt);
        /* le début en semaines absolues : son année est celle qu'il porte, sinon celle de la fin, sinon l'année en cours (T9-2 : « S47 2025 – S46 2026 ») */
        const semAbs = (e) => { const an = e.anA ?? e.anB ?? new Date().getFullYear(), j4 = Date.UTC(an, 0, 4), l1 = j4 - ((new Date(j4).getUTCDay() + 6) % 7) * 864e5; return Math.round(l1 / (7 * 864e5)) + e.a - 1; };
        const recul = c1.etiquette ? semAbs(c0.etiquette) - semAbs(c1.etiquette) : 0;
        recul >= 8 && recul <= 52 ? ok(`${F} T9-2 recul en un geste`, `« ${c0.label} » → « ${c1.label} » (${recul} sem.)`) : echec(`${F} T9-2 recul en un geste`, `« ${c0.label} » → « ${c1.label} » : ${recul} semaine(s) de recul en 3,6 s tenues (8 au moins attendues)`);
      }
    } catch (e) { echec(`${F} T9-2`, String(e.message ?? e).slice(0, 160)); await echap(); }
    /* T9-2 doigt IMMOBILE (22.11) : un vrai doigt tenu n'émet aucun touchMove ; le toucher toutes les 100 ms de tenirAuBord masquait le défaut.
       Tenue 3 s : la fenêtre recule jusqu'au début de la courbe (un an avant aujourd'hui) ; l'étiquette doit le dire (« S47 2025 – S52 2026 »),
       jamais « S47 – S52 2026 », la même qu'avant le geste (« bute sur S47 »). Rouge sur en-ligne/2026-11-22-tour9. */
    try {
      await versCalendrier(); await choisirPeriode('2 sem.'); await sleep(400); await choisirPeriode('6 sem.'); await sleep(500);
      const c0 = await lireCoherence(), g = await boiteCadre();
      const cbL = await p.evaluate(() => (document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'))?.getBoundingClientRect().left ?? null);
      if (!g || !c0.etiquette || cbL === null) echec(`${F} T9-2 immobile`, `cadre illisible (« ${c0.label} »)`);
      else {
        const x1 = Math.max(2, cbL + 2), xs = pas(g.l + 1, x1, 20);
        if (tactile) {
          const cdpT = await p.createCDPSession(), pt = (x) => [{ x: Math.round(x), y: Math.round(g.y), id: 1 }];
          await cdpT.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(g.l + 1) }); await sleep(50);
          for (const x of xs) { await cdpT.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await sleep(16); }
          await sleep(3000);
          await cdpT.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await p.mouse.move(g.l + 1, g.y); await p.mouse.down(); await sleep(40);
          for (const x of xs) { await p.mouse.move(x, g.y); await sleep(16); }
          await sleep(3000); await p.mouse.up();
        }
        await sleep(900);
        await cap('t9-2-debut-immobile');
        const c1 = await verifierCoherence(`${F} T9-2 immobile`, 'cohérence après le début tenu immobile', c0.pt);
        /* 40 semaines au moins (comme CAL-RETOUR-PASSE) : sur tour9, le passé s'arrêtait au solde d'ouverture (S47 sur ses données, où la caisse
           s'ouvre cette semaine : « bute sur S47 » ; S34 dans la fixture) ; 3 s tenues mènent au début de la courbe, un an avant. */
        /* et jamais plus que l'An (52 semaines : au-delà, la fin suit le début ; 58 sem. sous « An » sur l'arbre du 22.11 avant correction) */
        const recul = c1.points.length - c0.points.length, recule = recul >= 40 && c1.points.length <= 52, tour = !!c1.etiquette && c1.etiquette.a > c0.etiquette.a;
        const dit = `« ${c0.label} » (${c0.points.length} pts) → « ${c1.label} » (${c1.points.length} pts)`;
        recule ? ok(`${F} T9-2 immobile recule`, `${dit}, ${recul} sem.`) : echec(`${F} T9-2 immobile recule`, `${dit} : ${recul} semaine(s) de recul sous le doigt immobile (40 au moins : le passé ne s'arrête plus au solde d'ouverture)`);
        (recule && c1.label !== c0.label && (!tour || c1.etiquette.anA !== null)) ? ok(`${F} T9-2 immobile étiquette`, dit)
          : echec(`${F} T9-2 immobile étiquette`, `${dit} : l'étiquette ne dit pas la fenêtre reculée${tour ? ' (début dans l\'année d\'avant, sans son année)' : ''}`);
      }
    } catch (e) { echec(`${F} T9-2 immobile`, String(e.message ?? e).slice(0, 160)); await echap(); }
    // T9-3 (la fenêtre locale reculée par T9-2 se garde : « 2 sem. » la ramène à cette semaine avant « 3 mois », comme T9-1)
    try {
      await versCalendrier(); await choisirPeriode('2 sem.'); await sleep(400); await choisirPeriode('3 mois'); await sleep(500);
      const b = await p.evaluate(() => { const e = document.querySelector('[aria-label^="Marché de Noël,"]') ?? document.querySelector('[data-chose$="CR-NOEL"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.left + Math.min(r.width / 2, 12), r.top + r.height / 2]; });
      if (!b) echec(`${F} T9-3`, '« Marché de Noël » introuvable');
      else {
        await toucherXY(b[0], b[1]); await sleep(600);
        const fiche = await p.evaluate(() => document.querySelector('[data-detail] [data-souche] span')?.textContent?.trim() ?? null);
        await cap('t9-3-fiche');
        await toucherTexte('Modifier'); await sleep(700);
        const feuille = await p.evaluate(() => { const e = document.querySelector('[data-mode="modifier"] [data-duree-texte]'); return e ? `${e.textContent.trim()} ${e.nextElementSibling?.textContent?.trim() ?? ''}` : null; });
        await cap('t9-3-modifier');
        const jours = (t) => { if (!t) return null; let m = /(\d+)\s*j\b/.exec(t); if (m) return Number(m[1]); m = /(\d+)\s*sem/.exec(t); if (m) return 7 * Number(m[1]); return /1 semaine/.test(t) ? 7 : null; };
        (jours(fiche) !== null && jours(fiche) === jours(feuille)) ? ok(`${F} T9-3 même durée`, `fiche « ${fiche} », Modifier « ${feuille} »`) : echec(`${F} T9-3 même durée`, `fiche « ${fiche} », Modifier « ${feuille} »`);
        await echap(); await echap();
      }
    } catch (e) { echec(`${F} T9-3`, String(e.message ?? e).slice(0, 160)); await echap(); }
    await versCalendrier(); await choisirPeriode('3 mois'); await sleep(400);
  };
  const sectionCuve = async () => {
    const CU = `brassin en cuve, fiche ${combo}`;
    const lire = () => p.evaluate((k) => { const e = JSON.parse(localStorage.getItem(k) ?? '[]').find((x) => x.id === 'B-NEIPA-TEST'); const d = e?.data ?? e ?? {}; return { brew: d.brewDate ?? null, fin: d.finPrevue ?? null, vu: JSON.stringify(e ?? null).slice(0, 260) }; }, CLE_CACHE);
    const regler = async (pastille, touches) => {
      const ouvre = await p.evaluate(async (c) => { const pa = document.querySelector(`[data-detail] [data-pastille="${c}"]`); if (!(pa instanceof HTMLButtonElement)) return false; pa.click(); await new Promise((r) => setTimeout(r, 300)); return !!document.querySelector('[data-detail] [data-date-point]'); }, pastille);
      if (!ouvre) return false;
      await p.evaluate(async (ks) => { const r = document.querySelector('[data-detail] [data-date-point]'); for (const k of ks) { r.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); await new Promise((x) => setTimeout(x, 40)); } }, touches);
      await sleep(900); return true;
    };
    try {
      await versCalendrier(); await choisirPeriode('3 mois'); await sleep(500);
      for (let k = 0; k < 3 && !(await p.evaluate(() => !!document.querySelector('[aria-label^="NEIPA Test,"]:not([data-probable])'))); k++) { const f = await p.evaluate(() => { const e = document.querySelector('[aria-label="Période précédente"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); if (!f) break; await toucherXY(f[0], f[1]); await sleep(700); }
      const ouvrirFiche = async () => {
        const b = await p.evaluate(() => { const e = document.querySelector('[aria-label^="NEIPA Test,"]:not([data-probable])'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(), f = document.querySelector('[data-frise]').getBoundingClientRect(); const g = Math.max(r.left, f.left), d = Math.min(r.right, f.right); return [(g + d) / 2, r.top + r.height / 2]; });
        if (!b) return false; await toucherXY(b[0], b[1]); await sleep(900); const q = await p.evaluate((x, y) => { const t = document.elementFromPoint(x, y); return { det: !!document.querySelector('[data-detail]'), at: t ? (t.getAttribute('aria-label') ?? t.className ?? t.tagName).toString().slice(0, 60) : null, x, y, w: innerWidth }; }, b[0], b[1]); console.log('  dbg', JSON.stringify(q)); return q.det;
      };
      if (!(await ouvrirFiche())) { echec(CU, '« NEIPA Test » ou sa fiche introuvable : ' + await p.evaluate(() => [...document.querySelectorAll('[data-chose]')].map((e) => (e.getAttribute('aria-label') ?? e.getAttribute('data-chose')).slice(0, 22)).join(' | ') + ' | detail ' + !!document.querySelector('[data-detail]'))); return; }
      const l0 = await lire();
      const okA = await regler('debut', ['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'Enter']);
      const msg = await p.evaluate(() => document.querySelector('[data-message]')?.textContent ?? '');
      const l1 = await lire();
      (okA && l1.brew && l1.brew !== l0.brew && !/ne bouge pas/.test(msg)) ? ok(`${CU} date de brassage réglée`, `${l0.brew} → ${l1.brew}`) : echec(`${CU} date de brassage réglée`, `règle ${okA}, brewDate ${l0.brew} → ${l1.brew} (${l1.vu}), message « ${msg.slice(0, 120)} »`);
      await echap(); await sleep(300);
      if (!(await p.evaluate(() => !!document.querySelector('[data-detail]'))) && !(await ouvrirFiche())) { echec(`${CU} fin`, 'fiche fermée'); return; }
      const okB = await regler('fin', ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'Enter']);
      const l2 = await lire();
      (okB && l2.fin) ? ok(`${CU} fin « Prête » réglée`, `finPrevue ${l0.fin ?? 'aucune'} → ${l2.fin}`) : echec(`${CU} fin « Prête » réglée`, `règle ${okB}, finPrevue ${l0.fin ?? 'aucune'} → ${l2.fin ?? 'aucune'}`);
      await cap('cuve-fiche'); await echap();
      await p.evaluate((kf, kc) => { for (const k of [kf, kc]) localStorage.setItem(k, JSON.stringify(JSON.parse(localStorage.getItem(k) ?? '[]').map((x) => (x.id === 'B-NEIPA-TEST' ? { ...x, finPrevue: null, ...(x.data ? { data: { ...x.data, finPrevue: null } } : {}) } : x)))); }, CLE_FIXTURE, CLE_CACHE);
    } catch (e) { echec(CU, String(e.message ?? e).slice(0, 160)); await echap(); }
    await choisirPeriode('3 mois'); await sleep(400);
  };
  // ── CAL-FICHE-FRISE (22.11, tour 9, capture 30 : « Et ça a pas le même mécanisme de la frize au doigt que l'on a vue, choisi.. ») : la date
  //    de la fiche se règle par LE composant partagé de la frise B (`DureeFenetre`, `.cal-f-duree`, un repère `[data-date-point]`), au jour
  //    (`data-pas="jour"`) ; tirer bouge la date du déplacement (R2) et le lâcher l'écrit ; l'appui tenu au bord fait défiler l'échelle (R7) ;
  //    Échap pendant le geste rend la date d'avant (R10, 1280). Fiche ≤ 120 px au repos. Rouge sur en-ligne/2026-11-22-tour9 (réglette `[data-regle]`) ──
  const sectionFicheFrise = async () => {
    const FF = `fiche frise ${combo}`;
    const jourPastille = () => p.evaluate(() => document.querySelector('[data-detail] [data-pastille="debut"] time')?.getAttribute('datetime') ?? null);
    const ecart = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) : null);
    const ouvrirFrise = () => p.evaluate(async () => {
      const pa = document.querySelector('[data-detail] [data-pastille="debut"]'); if (!(pa instanceof HTMLButtonElement)) return null;
      if (!document.querySelector('[data-detail] .cal-f-duree')) { pa.click(); await new Promise((r) => setTimeout(r, 400)); }
      const f = document.querySelector('[data-detail] .cal-f-duree'), poi = f?.querySelector('[data-date-point][role="slider"]'), piste = f?.querySelector('.cal-f-duree-piste');
      if (!poi || !piste) return { partage: false, regle: !!document.querySelector('[data-detail] [data-date-point]') };
      piste.scrollIntoView({ block: 'center' });
      const r = piste.getBoundingClientRect(), q = poi.getBoundingClientRect();
      return { partage: true, pas: f.getAttribute('data-pas'), pxJour: Number(piste.getAttribute('data-px-jour')), x: q.left + q.width / 2, y: r.top + r.height / 2, g: r.left, d: r.right, h: Math.round(document.querySelector('[data-detail]').getBoundingClientRect().height) };
    });
    try {
      await rendreFixture([ID_GESTE]); await versCalendrier(); await choisirPeriode('3 mois'); await sleep(500);
      const b = await p.evaluate(() => { const e = document.querySelector('[aria-label^="ZZ TEST Geste,"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.left + Math.min(r.width / 2, 20), r.top + r.height / 2]; });
      if (!b) { echec(FF, '« ZZ TEST Geste » introuvable'); return; }
      await toucherXY(b[0], b[1]); await sleep(600);
      const h0 = await p.evaluate(() => { const d = document.querySelector('[data-detail]'); return d ? Math.round(d.getBoundingClientRect().height) : null; });
      if (h0 === null) { echec(FF, 'aucune fiche ouverte'); return; }
      if (tactile) (h0 <= 120 ? ok(`${FF} ≤ 120 px au repos`, `${h0} px`) : echec(`${FF} ≤ 120 px au repos`, `${h0} px`));
      const j0 = await jourPastille();
      const f = await ouvrirFrise();
      if (!f?.partage) { echec(`${FF} composant partagé`, f === null ? 'aucune pastille de début touchable' : `la date se règle par ${f.regle ? 'la réglette propre [data-regle]' : 'rien'}, pas par la frise B (.cal-f-duree [data-date-point])`); await echap(); return; }
      ok(`${FF} composant partagé`, `.cal-f-duree, fiche ouverte ${f.h} px`);
      f.pas === 'jour' && f.pxJour >= 6 ? ok(`${FF} au jour`, `${f.pxJour.toFixed(1)} px par jour`) : echec(`${FF} au jour`, `pas « ${f.pas} », ${f.pxJour} px par jour (jour attendu, ≥ 6 px)`);
      await cap('fiche-frise');
      // tirer : +3,4 jours de déplacement depuis le repère (R2 : la valeur suit le déplacement), lâcher écrit
      await glisser(f.x, f.y, pas(f.x, f.x + 3.4 * f.pxJour, 10)); await sleep(700);
      const j1 = await jourPastille(), e1 = ecart(j0, j1);
      e1 === 3 ? ok(`${FF} tirer au jour`, `${j0} → ${j1}`) : echec(`${FF} tirer au jour`, `${j0} → ${j1} (+3 j attendus pour 3,4 jours de déplacement)`);
      // le lâcher écrit : la fiche se rouvre sur la même chose, frise fermée, la date écrite dessus
      await sleep(300);
      const j2 = await jourPastille();
      j2 === j1 && !(await p.evaluate(() => !!document.querySelector('[data-detail] .cal-f-duree'))) ? ok(`${FF} lâcher écrit`, j2) : echec(`${FF} lâcher écrit`, `après le lâcher ${j2} (attendu ${j1}, frise fermée)`);
      // appui tenu au bord droit (R7) : l'échelle défile, la date avance sans bouger le doigt ; à 1280, Échap rend la date d'avant (R10)
      const f2 = await ouvrirFrise();
      if (!f2?.partage) { echec(`${FF} appui au bord`, 'frise non rouverte'); await echap(); return; }
      let v1 = null, v2 = null;
      await glisser(f2.x, f2.y, pas(f2.x, f2.d - 12, 12), { echap: !tactile, pendant: async () => { await sleep(150); v1 = await jourPastille(); await sleep(1200); v2 = await jourPastille(); } });
      const e2 = ecart(v1, v2);
      e2 > 0 ? ok(`${FF} appui au bord`, `${v1} → ${v2} (+${e2} j doigt immobile)`) : echec(`${FF} appui au bord`, `${v1} → ${v2} : l'échelle ne défile pas sous le doigt tenu au bord`);
      if (!tactile) { await sleep(500); const j3 = await jourPastille(); j3 === j2 ? ok(`${FF} Échap`, j3) : echec(`${FF} Échap`, `${j3} après Échap (attendu ${j2})`); }
      await cap('fiche-frise-bord'); await echap(); await echap();
    } catch (e) { echec(FF, String(e.message ?? e).slice(0, 160)); await echap(); }
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
  // ── CAL-FICHE (D412, 21.11, fiche v02 « Pastilles chiffrées ») : « ZZ TEST Geste » touchée ; la fiche ≤ 120 px de haut au repos à 390, pleine largeur
  //    de la frise, une souche colorée, une pastille de date qui s'élargit en règle sur place, Supprimer sous « Plus d'actions » avec Annuler (rouge sur tour8) ──
  const sectionFiche = async () => {
    const F = `fiche ${combo}`;
    try {
      const b = await p.evaluate(() => { const e = document.querySelector('[aria-label^="ZZ TEST Geste,"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.left + Math.min(r.width / 2, 20), r.top + r.height / 2]; });
      if (!b) { echec(F, '« ZZ TEST Geste » introuvable'); return; }
      await toucherXY(b[0], b[1]); await sleep(600);
      const m = await p.evaluate(() => { const d = document.querySelector('[data-detail]'); const fr = document.querySelector('[data-frise]'); if (!d) return null; const r = d.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), frise: fr ? Math.round(fr.getBoundingClientRect().width) : 0, souche: !!d.querySelector('[data-souche]'), vw: window.innerWidth }; });
      await cap('fiche-repos');
      if (!m) { echec(F, 'aucune fiche ouverte'); return; }
      m.souche ? ok(`${F} souche colorée`) : echec(`${F} souche colorée`, 'aucune [data-souche] : la fiche texte de la version rejetée');
      if (m.vw <= 430) (m.h <= 120 ? ok(`${F} ≤ 120 px au repos`, `${m.h} px`) : echec(`${F} ≤ 120 px au repos`, `${m.h} px de haut à 390 (120 au plus)`));
      m.w >= m.frise - 8 ? ok(`${F} pleine largeur`, `${m.w}/${m.frise}`) : echec(`${F} pleine largeur`, `${m.w} px pour une frise de ${m.frise}`);
      const regle = await p.evaluate(async () => { const pa = document.querySelector('[data-detail] [data-pastille="debut"]'); if (!(pa instanceof HTMLButtonElement)) return false; pa.click(); await new Promise(r => setTimeout(r, 300)); return !!document.querySelector('[data-detail] [data-date-point]'); });
      regle ? ok(`${F} date réglée sur place`) : echec(`${F} date réglée sur place`, 'la pastille touchée n\'ouvre aucune règle [data-regle]');
      await p.evaluate(() => document.querySelector('[data-detail] [data-date-point]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
      const plus = await p.evaluate(async () => { const pl = document.querySelector('[data-detail] [data-plus]'); if (!pl) return null; pl.click(); await new Promise(r => setTimeout(r, 300)); return !!document.querySelector('[data-detail] [data-supprimer]'); });
      if (!plus) { echec(`${F} Supprimer`, plus === null ? 'aucun « Plus d\'actions » dans la fiche' : 'aucun [data-supprimer] sous Plus d\'actions'); await echap(); return; }
      await p.evaluate(() => document.querySelector('[data-detail] [data-supprimer]').click()); await sleep(700);
      const parti = await p.evaluate(() => !document.querySelector('[aria-label^="ZZ TEST Geste,"]'));
      await cap('fiche-supprime');
      await toucherTexte('Annuler'); await sleep(900);
      const revenu = await p.evaluate(() => !!document.querySelector('[aria-label^="ZZ TEST Geste,"]'));
      (parti && revenu) ? ok(`${F} Supprimer puis Annuler`) : echec(`${F} Supprimer puis Annuler`, `retirée ${parti}, rendue ${revenu}`);
    } catch (e) { echec(F, String(e.message ?? e).slice(0, 160)); await echap(); }
  };
  // --sections a,b : seulement ces sections du Calendrier (itération ; le défaut les joue toutes)
  const SECTIONS = opt('sections', null)?.split(',');
  let ptApp0 = await p.evaluate(() => document.querySelector('[data-periode-pastille] .pr-court')?.textContent?.trim() ?? null);
  for (const [nom, f] of Object.entries({ sectionJourBord, sectionGlisseJour, sectionBarre, sectionCadre, sectionFeuille, sectionFeuilleJour, sectionModifier, sectionFiche, sectionRangees, sectionBarreBord, sectionChg4, sectionChg5, sectionChg6, sectionBarreHors, sectionCuve, sectionFicheFrise, sectionPasseLibre, sectionEchelles, sectionEtiquettes, sectionAn390, sectionT9 })) if (!SECTIONS || SECTIONS.includes(nom)) { await f(); const pt1 = await p.evaluate(() => document.querySelector('[data-periode-pastille] .pr-court')?.textContent?.trim() ?? null); if (ptApp0 === undefined) ptApp0 = pt1; else if (pt1 !== ptApp0) echec(`CAL-PERIODE-APP-FIXE ${combo} après ${nom}`, `la période de l'app a changé : « ${ptApp0} » → « ${pt1} »`); }
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
      await p.setViewport({ width: L, height: tactile ? HAUTEUR_TEL : 900, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
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
