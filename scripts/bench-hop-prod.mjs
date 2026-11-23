#!/usr/bin/env node
// Banc de fluidité des outils houblons sur un BUILD DE PRODUCTION (voie p1-banc-prod, décision D70).
//
// Pourquoi : les temps relevés jusqu'ici (Comparer 500 ms, Suggérer 258–344 ms) viennent du serveur de développement (React en mode
// dev, modules non groupés), donc pessimistes. Ce banc construit l'app en production, la sert avec `vite preview` et la joue dans
// Chrome (puppeteer-core), sur la fixture du banc local (`?dev-local&etape=houblons` : Stout export 16D, Nugget 46 g à 60′).
//
// Voie sûre pour `?dev-local` : le mode de build « banc » (scripts/vite-banc.config.mjs). C'est un build de production dont la seule
// différence est `import.meta.env.DEV = true` ; il s'écrit hors de `dist/` (dossier temporaire), n'est jamais déployé, et le build
// normal (`npm run build`) n'en sait rien : `scripts/check-no-dev-auth.mjs` continue de refuser toute trace de `dev-local` dans `dist/`.
// Aucune donnée réelle : fixture embarquée, et TOUTE requête hors localhost est coupée (ni Firebase, ni Gemini, ni CDN).
//
// Usage (depuis la racine) :
//   node scripts/bench-hop-prod.mjs                       construit, sert, mesure (n = 8 prises, CPU ×1 puis ×4)
//   node scripts/bench-hop-prod.mjs --n=4                 4 prises par mesure
//   node scripts/bench-hop-prod.mjs --sans-build          réutilise le build déjà fait dans --dossier
//   node scripts/bench-hop-prod.mjs --profil              ajoute un profil CPU (build à part, noms conservés) des mesures qui dépassent
//   node scripts/bench-hop-prod.mjs --sortie=<dossier>    écrit resultats.json (et profil.json) ici (défaut : dossier temporaire)
//   --profil-seul  profil CPU sans les mesures ; --ab-has  expérience A/B (pages avec et sans règles CSS :has(), en alternance) ; --sans-has  mesures sans :has()
//   --dossier=<dir> (défaut <tmp>/affinee-banc-hop-prod/dist) ; --port=4179 ; --cpu=1,4 (taux de bridage du processeur)
//
// Mesures (en page, depuis le geste jusqu'à l'image peinte : requestAnimationFrame puis tâche suivante) :
//   « image » = du geste à l'image où la condition est vraie et peinte. « posé » = du geste à la DERNIÈRE mutation du DOM, après
//   300 ms de calme (le contenu final : radar, colonnes, calculs asynchrones). Le jugement se fait sur « posé ».
//   Plancher : une action vide mesure 0 à 1 ms (le chrono s'arrête à la tâche qui suit l'image, sans attendre la vsync ni le raster).
//   Les budgets de check-hop-tools-perf mesurent le calcul seul (bench-hop-v4.ts) ; ce banc mesure le geste jusqu'à l'image (rendu compris),
//   donc plus strict : les deux lectures sont dites dans le rapport.
//   Comparaison aux budgets de scripts/check-hop-tools-perf.mjs : ce PC est supposé 4× plus rapide qu'un téléphone (hypothèse
//   écrite de ce contrôle). Au CPU ×1 on juge donc les budgets divisés par 4 (toucher 25 ms, glisser 4/8 ms, écran 625 ms) ; au
//   CPU ×4 (le PC bridé joue le téléphone) on juge ceux de l'épopée #159 non divisés (toucher 100 ms, glisser 16/33 ms, écran 2,5 s).
//   Pour les outils : ouverture = « toucher » ; changement de moment et grammes = « glisser » (un cran).
// Code de sortie : 0 si le banc a mesuré (le verdict est un rapport) ; 1 si le build, le serveur ou une mesure a échoué.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (nom, def = null) => argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? def;
const drapeau = (nom) => argv.includes(`--${nom}`);
const N = Math.max(2, Number(opt('n', 8)));
const PORT = Number(opt('port', 4179));
const TAUX = opt('cpu', '1,4').split(',').map(Number);
const DOSSIER = path.resolve(opt('dossier', path.join(os.tmpdir(), 'affinee-banc-hop-prod', 'dist')));
const SORTIE = path.resolve(opt('sortie', path.join(os.tmpdir(), 'affinee-banc-hop-prod', 'resultats')));
const MESURER = drapeau('mesurer'); // mode interne : lancé par with_server.mjs, serveur déjà debout
const PROFIL = drapeau('profil');
const SANS_HAS = drapeau('sans-has'); // EXPÉRIENCE : retire du CSSOM toutes les règles qui utilisent :has() avant de mesurer (coût de leur invalidation)
const PROFIL_SEUL = drapeau('profil-seul');
const AB_HAS = drapeau('ab-has'); // EXPÉRIENCE A/B : pages avec et sans règles :has(), mesurées en alternance (résultat dans ab-has.json) // profil seul, sans les mesures (résultat dans profil.json)
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// ---------- Budgets de scripts/check-hop-tools-perf.mjs (épopée #159 ; FACTEUR = 4 : ce PC suppose 4× plus rapide qu'un téléphone) ----------
const FACTEUR = 4;
const BUDGET = {
  toucher: { epopee: 100 },
  glisser: { epopee: 16, epopeeP95: 33 },
  ecran: { epopee: 2500 },
};
/** Budget (ms) d'une mesure à un taux de bridage donné : divisé par FACTEUR à ×1, non divisé à ×FACTEUR. */
function budgetDe(genre, taux) {
  const d = taux >= FACTEUR ? 1 : FACTEUR;
  if (genre === 'toucher') return { med: BUDGET.toucher.epopee / d, p95: BUDGET.toucher.epopee / d };
  if (genre === 'glisser') return { med: BUDGET.glisser.epopee / d, p95: BUDGET.glisser.epopeeP95 / d };
  return { med: BUDGET.ecran.epopee / d, p95: BUDGET.ecran.epopee / d };
}

const f0 = (x) => (x == null ? '—' : String(Math.round(x)));
const f1 = (x) => (x == null ? '—' : (Math.round(x * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const mediane = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** Rang le plus proche (n = 8 ou 10 : le p95 est la mesure la plus lente, comme dans check-hop-tools-perf). */
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]; };

// =====================================================================================================================
// Mode orchestrateur : build, serveur, puis relance de ce même fichier avec --mesurer
// =====================================================================================================================
if (!MESURER) {
  const vite = path.join(racine, 'node_modules', 'vite', 'bin', 'vite.js');
  const construire = (dossier, profil) => {
    console.log(`BANC-PROD : build de production (mode « banc », VITE_HOP_V4=on${profil ? ', noms conservés + cartes de source' : ''}) → ${dossier}`);
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [vite, 'build', '--mode', 'banc', '-c', 'scripts/vite-banc.config.mjs', '--logLevel', 'warn'], {
      cwd: racine, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, VITE_HOP_V4: 'on', HOP_BANC_OUT: dossier, HOP_BANC_PROFIL: profil ? '1' : '0' },
    });
    if (r.status !== 0) {
      console.log(`${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').slice(-25).join('\n'));
      console.log('BANC-PROD ECHEC : le build du mode banc a échoué');
      process.exit(1);
    }
    console.log(`  build en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  };
  if (!drapeau('sans-build')) construire(DOSSIER, false);
  if (!fs.existsSync(path.join(DOSSIER, 'index.html'))) { console.log(`BANC-PROD ECHEC : pas de build dans ${DOSSIER}`); process.exit(1); }
  let dossierProfil = null;
  if (PROFIL || PROFIL_SEUL) { dossierProfil = path.join(path.dirname(DOSSIER), 'dist-profil'); if (!drapeau('sans-build')) construire(dossierProfil, true); }

  fs.mkdirSync(SORTIE, { recursive: true });
  const lanceur = (dossier, args) => spawnSync(process.execPath, [
    path.join(racine, 'scripts', 'with_server.mjs'),
    '--server', `node node_modules/vite/bin/vite.js preview --mode banc -c scripts/vite-banc.config.mjs --outDir "${dossier}" --port ${PORT} --strictPort`,
    '--port', String(PORT), '--env', `HOP_BANC_OUT=${dossier}`, '--env', 'VITE_HOP_V4=on', '--timeout', '90',
    '--', process.execPath, path.join(racine, 'scripts', 'bench-hop-prod.mjs'), '--mesurer', ...args,
  ], { cwd: racine, stdio: 'inherit' });
  const r = lanceur(DOSSIER, [`--n=${N}`, `--port=${PORT}`, `--cpu=${TAUX.join(',')}`, `--sortie=${SORTIE}`, ...((PROFIL || PROFIL_SEUL) ? [`--dossier-profil=${dossierProfil}`] : []), ...(SANS_HAS ? ['--sans-has'] : []), ...(PROFIL_SEUL ? ['--profil-seul'] : []), ...(AB_HAS ? ['--ab-has'] : [])]);
  process.exit(r.status ?? 1);
}

// =====================================================================================================================
// Mode mesure (serveur de build déjà debout sur PORT)
// =====================================================================================================================
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const LOCAL = /^(https?|wss?):\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = `http://127.0.0.1:${PORT}`;
const HOUBLONS_A = ['beermaverick-cascade', 'beermaverick-idaho-7', 'beermaverick-galaxy'];
const HOUBLONS_B = ['beermaverick-citra', 'beermaverick-mosaic', 'beermaverick-simcoe'];
const MOMENTS = ['60', '10', 'whirlpool', 'dryhop-actif', 'dryhop-apres'];

/** EXPÉRIENCE (--sans-has) : supprime du CSSOM les règles dont le sélecteur contient « :has( », y compris dans @media / @supports. */
function purgerHas() {
  let n = 0;
  const purger = (liste) => {
    for (let i = liste.cssRules.length - 1; i >= 0; i -= 1) {
      const r = liste.cssRules[i];
      if (r.cssRules && !r.selectorText) purger(r);
      else if (r.selectorText && r.selectorText.includes(':has(')) { liste.deleteRule(i); n += 1; }
    }
  };
  for (const f of document.styleSheets) { try { purger(f); } catch { /* feuille d'une autre origine */ } }
  return n;
}

/** Installé avant tout script de la page : suit un geste jusqu'à l'image peinte et au dernier changement du DOM. */
function installerSuivi() {
  const ok = (c) => {
    if (!c) return true;
    const e = document.querySelector(c.sel);
    if (c.absent) return !e;
    if (!e) return false;
    if (c.attr) return e.getAttribute(c.attr[0]) === c.attr[1];
    if (c.texte !== undefined) return (e.textContent || '').replace(/\s+/g, ' ').trim() === c.texte;
    if (c.differe !== undefined) return (e.textContent || '').replace(/\s+/g, ' ').trim() !== c.differe;
    return true;
  };
  const peint = (f) => requestAnimationFrame(() => setTimeout(f, 0)); // après l'image où le DOM est prêt
  const mo0 = new MutationObserver(() => { if (!window.__tEtape && document.querySelector('[data-hop-v4-etape="houblons"]')) { window.__tEtape = performance.now(); mo0.disconnect(); } });
  mo0.observe(document, { childList: true, subtree: true });
  window.__banc = {
    /** spec : { depart: 'maintenant'|'pointeur', action?: {type, ...}, pret: condition, retrait?: ms }.
     *  'pointeur' : le chrono part au premier pointerdown (le geste vient de l'extérieur : appui long à la souris). */
    suivre(spec) {
      return new Promise((resolve) => {
        let t0 = null; let tPret = null; let tImage = null; let derniere = null;
        const mo = new MutationObserver(() => {
          if (t0 === null) return;
          const t = performance.now(); derniere = t;
          if (tPret === null && ok(spec.pret)) { tPret = t; peint(() => { tImage = performance.now(); }); }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
        const fin = () => {
          const maintenant = performance.now();
          if (tImage === null || maintenant - Math.max(derniere ?? 0, tImage) < 300) {
            if (maintenant - t0 < 6000) { setTimeout(fin, 40); return; }
          }
          mo.disconnect();
          const r = spec.retrait || 0;
          resolve({ atteint: tPret !== null, image: tImage === null ? null : tImage - t0 - r, pose: Math.max(derniere ?? tImage ?? t0, tImage ?? t0) - t0 - r, domPret: tPret === null ? null : tPret - t0 - r });
        };
        const demarrer = () => {
          t0 = performance.now();
          const a = spec.action;
          if (a) {
            if (a.type === 'ouvrir') window.__hopPile.open(a.route);
            else if (a.type === 'clic') document.querySelector(a.sel).click();
          }
          if (tPret === null && ok(spec.pret)) { tPret = performance.now(); peint(() => { tImage = performance.now(); }); derniere = tPret; }
          setTimeout(fin, 60);
        };
        if (spec.depart === 'pointeur') window.addEventListener('pointerdown', demarrer, { capture: true, once: true });
        else demarrer();
      });
    },
    /** Arme le suivi (écouteur posé) et garde la promesse : le geste externe ne part qu'après le retour de cet appel. */
    armer(spec) { window.__banc.promesse = window.__banc.suivre(spec); return true; },
    tas: () => performance.memory?.usedJSHeapSize ?? null,
  };
}

const sortieDe = (nom) => path.join(SORTIE, nom);
fs.mkdirSync(SORTIE, { recursive: true });
const bloquees = new Set();
const erreurs = [];
const resultats = { meta: {}, taux: {} };
const TAUX_MES = PROFIL_SEUL || AB_HAS ? [] : TAUX;

async function nouvellePage(browser, taux, dossierProfil) {
  const ctx = browser.createBrowserContext ? await browser.createBrowserContext() : await browser.createIncognitoBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(60000);
  page.on('pageerror', (e) => erreurs.push(`[×${taux}] ${String(e?.message ?? e).slice(0, 200)}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/blockedbyclient|ERR_BLOCKED_BY_CLIENT/i.test(m.text())) erreurs.push(`[×${taux}] console: ${m.text().slice(0, 200)}`); });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (LOCAL.test(u) || /^(data|blob|about):/i.test(u)) r.continue();
    else { bloquees.add(new URL(u).host); r.abort('blockedbyclient'); }
  });
  await page.evaluateOnNewDocument(installerSuivi);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: taux });
  return { ctx, page, cdp };
}

async function mesurerSerie(taux) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 90000, args: ['--mute-audio', '--disable-extensions'] });
  const { ctx, page, cdp } = await nouvellePage(browser, taux);
  const mesures = []; // { id, genre, nom, valeurs:{image,pose}[], froid? }
  const prise = (id, genre, nom, valeurs, extra = {}) => { console.log(`  [×${taux}] ${id} : ${valeurs.map((v) => f0(v.pose)).join(' / ')} ms${valeurs.every((v) => v.atteint) ? '' : ' (NON ATTEINT)'}`); mesures.push({ id, genre, nom, taux, image: valeurs.map((v) => v.image), pose: valeurs.map((v) => v.pose), domPret: valeurs.map((v) => v.domPret), atteint: valeurs.every((v) => v.atteint), ...extra }); };
  const suivre = (spec) => page.evaluate((s) => window.__banc.suivre(s), spec);
  const fermerOutil = async (sel) => {
    await page.evaluate(() => window.__hopPile.close());
    await page.waitForFunction((s) => !document.querySelector(s), {}, sel);
    await attendre(250 * Math.sqrt(taux));
  };

  // ---- Premier écran : de la navigation à l'étape Houblons montée (fixture), puis repos le temps du préchauffage ----
  const t0 = Date.now();
  await page.goto(`${BASE}/?dev-local&etape=houblons`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
  const tEtape = await page.evaluate(() => window.__tEtape ?? null);
  if (SANS_HAS) console.log(`  [×${taux}] EXPÉRIENCE sans :has() — règles retirées : ${await page.evaluate(purgerHas)}`);
  console.log(`  [×${taux}] nœuds DOM au repos (étape Houblons) : ${await page.evaluate(() => document.querySelectorAll('*').length)}`);
  prise('ecran:etape-houblons', 'ecran', 'premier écran : de la navigation à l\'étape Houblons montée (auth factice, fixture, hors préchauffage)', [{ image: tEtape, pose: tEtape, domPret: tEtape, atteint: tEtape != null }]);
  await attendre(3500 * taux); // le préchauffage « au repos » de la Coquille tourne en tranches ; on le laisse finir avant de juger les touchers
  console.log(`  [×${taux}] étape Houblons à ${f0(tEtape)} ms de la navigation (${Date.now() - t0} ms d'horloge dont repos)`);

  // ---- Plancher d'image : une action vide ----
  const vides = [];
  for (let i = 0; i < 12; i += 1) { vides.push(await suivre({ depart: 'maintenant', pret: null })); await attendre(30); }
  prise('plancher', 'info', 'plancher d\'image : une action vide (0 à 1 ms attendu)', vides);

  // ---- Ouvertures : à froid (chunk évalué pour la première fois) puis N prises ----
  const outils = [
    { id: 'comparer', nom: 'ouvrir Comparer (3 houblons : Cascade, Idaho 7, Galaxy)', route: { view: 'hopCompare', hops: HOUBLONS_A }, pret: { sel: '[data-ecran="comparer"] [data-moment]' }, ferme: '[data-ecran="comparer"]' },
    { id: 'suggerer', nom: 'ouvrir Suggérer (visée de la fixture)', route: { view: 'hopSuggest' }, pret: { sel: '[data-ecran="suggerer"] [data-role="pont-comparer"]' }, ferme: '[data-ecran="suggerer"]' },
  ];
  for (const o of outils) {
    const spec = { depart: 'maintenant', action: { type: 'ouvrir', route: o.route }, pret: o.pret };
    const froid = await suivre(spec);
    console.log(`  [×${taux}] nœuds DOM avec ${o.id} ouvert : ${await page.evaluate(() => document.querySelectorAll('*').length)}`);
    prise(`${o.id}:ouverture-froid`, 'toucher', `${o.nom} — 1re ouverture, chunk et calculs à froid`, [froid], { froid: true });
    await fermerOutil(o.ferme);
    const v = [];
    for (let i = 0; i < N; i += 1) { v.push(await suivre(spec)); await fermerOutil(o.ferme); }
    prise(`${o.id}:ouverture`, 'toucher', `${o.nom} — réouverture`, v);
  }

  // ---- Fiche d'un houblon : appui long (450 ms) à la souris sur la carte de Ma bière ; le délai de l'appui est retiré ----
  const DUREE_APPUI_LONG = 450;
  async function ficheUneFois() {
    const el = await page.waitForSelector('[data-role="ouvrir-fiche"]');
    const b = await el.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.evaluate((s) => window.__banc.armer(s), { depart: 'pointeur', pret: { sel: '[data-ecran="fiche"]' }, retrait: DUREE_APPUI_LONG });
    await page.mouse.down();
    const r = await page.evaluate(() => window.__banc.promesse);
    await page.mouse.up();
    return r;
  }
  const fermerFiche = async () => {
    await page.evaluate(() => document.querySelector('[role="dialog"] > header > button[aria-label="Fermer"]').click());
    await page.waitForFunction(() => !document.querySelector('[data-ecran="fiche"]'));
    await attendre(600 * Math.sqrt(taux));
  };
  const ficheFroid = await ficheUneFois(); await fermerFiche();
  prise('fiche:ouverture-froid', 'toucher', 'ouvrir la fiche d\'un houblon (appui long sur la carte de Ma bière) — 1re ouverture', [ficheFroid], { froid: true });
  const fiches = [];
  for (let i = 0; i < N; i += 1) { fiches.push(await ficheUneFois()); await fermerFiche(); }
  prise('fiche:ouverture', 'toucher', 'ouvrir la fiche d\'un houblon (appui long ; 450 ms d\'appui retirées, +0 à 4 ms de minuterie)', fiches);

  // ---- Comparer : changement de moment (deux ensembles de houblons : 10 moments jamais calculés), puis retours en cache ----
  const momentSpec = (m) => ({ depart: 'maintenant', action: { type: 'clic', sel: `[data-moment="${m}"]` }, pret: { sel: `[data-moment="${m}"]`, attr: ['aria-checked', 'true'] } });
  const jamaisVus = [];
  for (const ensemble of [HOUBLONS_A, HOUBLONS_B]) {
    await page.evaluate((h) => window.__hopPile.open({ view: 'hopCompare', hops: h }), ensemble);
    await page.waitForSelector('[data-ecran="comparer"] [data-moment]');
    await attendre(500 * taux);
    const courant = await page.evaluate(() => document.querySelector('[data-moment][aria-checked="true"]')?.getAttribute('data-moment'));
    for (const m of MOMENTS.filter((x) => x !== courant)) { jamaisVus.push(await suivre(momentSpec(m))); await attendre(250 * Math.sqrt(taux)); }
    if (ensemble === HOUBLONS_B) {
      const retours = [];
      for (let i = 0; i < N; i += 1) { retours.push(await suivre(momentSpec(MOMENTS[i % 2 ? 4 : 0]))); await attendre(250 * Math.sqrt(taux)); }
      prise('comparer:moment-cache', 'glisser', 'Comparer, changement de moment déjà calculé (retour sur 60′ ↔ dry hop après)', retours);
    }
    await fermerOutil('[data-ecran="comparer"]');
  }
  prise('comparer:moment', 'glisser', 'Comparer, changement de moment jamais calculé (2 ensembles × 4 moments)', jamaisVus);

  // ---- Ma bière : toucher sur + des grammes (dose du premier houblon), puis retour ----
  const dose = async () => page.evaluate(() => document.querySelector('[data-role="dose"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? null);
  const plus = [];
  for (let i = 0; i < N; i += 1) {
    const avant = await dose();
    const r = await suivre({ depart: 'maintenant', action: { type: 'clic', sel: '[data-role="dose-plus"]' }, pret: { sel: '[data-role="dose"]', differe: avant } });
    const apres = await dose();
    plus.push({ ...r, atteint: apres !== avant });
    await attendre(250 * Math.sqrt(taux));
  }
  prise('dose:plus', 'glisser', 'Ma bière, toucher sur + des grammes (pas de dose, dose jamais vue)', plus);
  const moins = [];
  for (let i = 0; i < N; i += 1) { moins.push(await suivre({ depart: 'maintenant', action: { type: 'clic', sel: '[data-role="dose-moins"]' }, pret: null })); await attendre(250 * Math.sqrt(taux)); }
  prise('dose:moins', 'info', 'Ma bière, toucher sur − des grammes (retour ; rapporté)', moins);

  const tas = await page.evaluate(() => window.__banc.tas());
  await ctx.close?.();
  await browser.close();
  return { mesures, tasMo: tas ? tas / 1048576 : null };
}

// ---------- EXPÉRIENCE A/B (--ab-has) : deux pages côte à côte dans le même Chrome, mesurées en alternance ----------
// A = l'app telle quelle ; B = la même, mais ses règles CSS qui utilisent :has() sont retirées du CSSOM après le chargement.
// L'alternance (A, B, A, B…) annule la dérive de la machine (d'autres processus tournent sur ce poste) que deux séries consécutives
// subiraient. Aucune ligne de l'app n'est changée : c'est une mesure, pas un correctif.
async function experienceAB(taux) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 120000, args: ['--mute-audio', '--disable-extensions'] });
  const pages = {};
  for (const [nom, purge] of [['A', false], ['B', true]]) {
    const p = await nouvellePage(browser, taux);
    await p.page.goto(`${BASE}/?dev-local&etape=houblons`, { waitUntil: 'load', timeout: 120000 });
    await p.page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
    if (purge) console.log(`  [×${taux}] B : règles :has() retirées : ${await p.page.evaluate(purgerHas)}`);
    pages[nom] = p;
  }
  await attendre(3500 * taux);
  const sur = async (nom, f) => { await pages[nom].page.bringToFront(); await attendre(120); return f(pages[nom].page); };
  const suivreSur = (page, spec) => page.evaluate((s) => window.__banc.suivre(s), spec);
  const pauseSur = (ms) => attendre(ms * Math.sqrt(taux));
  const ouvrirFermer = (route, pret, ferme) => async (page) => {
    const r = await suivreSur(page, { depart: 'maintenant', action: { type: 'ouvrir', route }, pret });
    await page.evaluate(() => window.__hopPile.close());
    await page.waitForFunction((s) => !document.querySelector(s), {}, ferme);
    await pauseSur(250);
    return r;
  };
  const scenarios = [
    { id: 'comparer', nom: 'ouvrir Comparer (réouverture)', prechauffe: true, f: ouvrirFermer({ view: 'hopCompare', hops: HOUBLONS_A }, { sel: '[data-ecran="comparer"] [data-moment]' }, '[data-ecran="comparer"]') },
    { id: 'suggerer', nom: 'ouvrir Suggérer (réouverture)', prechauffe: true, f: ouvrirFermer({ view: 'hopSuggest' }, { sel: '[data-ecran="suggerer"] [data-role="pont-comparer"]' }, '[data-ecran="suggerer"]') },
  ];
  const sortie = [];
  for (const sc of scenarios) {
    for (const nom of ['A', 'B']) await sur(nom, sc.f); // chauffe : chunk évalué
    const v = { A: [], B: [] };
    for (let i = 0; i < N; i += 1) for (const nom of i % 2 ? ['B', 'A'] : ['A', 'B']) v[nom].push((await sur(nom, sc.f)).pose);
    sortie.push({ id: sc.id, nom: sc.nom, A: v.A, B: v.B });
  }
  // changement de moment dans Comparer : les deux pages jouent la même suite sur deux ensembles de houblons
  {
    const v = { A: [], B: [] };
    for (const ensemble of [HOUBLONS_A, HOUBLONS_B]) {
      for (const nom of ['A', 'B']) await sur(nom, async (page) => { await page.evaluate((h) => window.__hopPile.open({ view: 'hopCompare', hops: h }), ensemble); await page.waitForSelector('[data-ecran="comparer"] [data-moment]'); await pauseSur(500); });
      const courant = await pages.A.page.evaluate(() => document.querySelector('[data-moment][aria-checked="true"]')?.getAttribute('data-moment'));
      for (const m of MOMENTS.filter((x) => x !== courant)) {
        for (const nom of v.A.length % 2 ? ['B', 'A'] : ['A', 'B']) {
          const r = await sur(nom, (page) => suivreSur(page, { depart: 'maintenant', action: { type: 'clic', sel: `[data-moment="${m}"]` }, pret: { sel: `[data-moment="${m}"]`, attr: ['aria-checked', 'true'] } }));
          v[nom].push(r.pose); await pauseSur(250);
        }
      }
      for (const nom of ['A', 'B']) await sur(nom, async (page) => { await page.evaluate(() => window.__hopPile.close()); await page.waitForFunction(() => !document.querySelector('[data-ecran="comparer"]')); await pauseSur(250); });
    }
    sortie.push({ id: 'comparer-moment', nom: 'Comparer : changement de moment (jamais calculé)', A: v.A, B: v.B });
  }
  // + des grammes
  {
    const v = { A: [], B: [] };
    for (let i = 0; i < N; i += 1) for (const nom of i % 2 ? ['B', 'A'] : ['A', 'B']) {
      const r = await sur(nom, async (page) => {
        const avant = await page.evaluate(() => document.querySelector('[data-role="dose"]').textContent.replace(/\s+/g, ' ').trim());
        const x = await suivreSur(page, { depart: 'maintenant', action: { type: 'clic', sel: '[data-role="dose-plus"]' }, pret: { sel: '[data-role="dose"]', differe: avant } });
        await pauseSur(250); return x;
      });
      v[nom].push(r.pose);
    }
    sortie.push({ id: 'dose-plus', nom: 'Ma bière : + des grammes', A: v.A, B: v.B });
  }
  await browser.close();
  return sortie;
}

// ---------- Profil CPU (build à part, noms de fonctions conservés, cartes de source) ----------
// Chaque scénario est répété ; le profil d'échantillonnage (200 µs) donne le temps propre des fonctions et le temps inclusif des
// composants React (en production, React ne fournit pas de durées par composant : ce sont les noms de fonctions du profil).
// `Performance.getMetrics` donne en plus la part script / style / mise en page de la tâche.
const SCENARIOS = [
  { id: 'comparer-ouverture', nom: 'ouvrir Comparer', reps: 4 },
  { id: 'suggerer-ouverture', nom: 'ouvrir Suggérer', reps: 4 },
  { id: 'fiche-ouverture', nom: 'ouvrir la fiche (appui long)', reps: 4 },
  { id: 'comparer-moment', nom: 'Comparer : changer de moment', reps: 8 },
  { id: 'dose-plus', nom: 'Ma bière : + / − des grammes', reps: 8 },
];

async function profiler(taux, dossierProfil) {
  const port = PORT + 1;
  const vite = path.join(racine, 'node_modules', 'vite', 'bin', 'vite.js');
  const srv = spawn(process.execPath, [vite, 'preview', '--mode', 'banc', '-c', 'scripts/vite-banc.config.mjs', '--outDir', dossierProfil, '--port', String(port), '--strictPort'], {
    cwd: racine, stdio: 'ignore', env: { ...process.env, HOP_BANC_OUT: dossierProfil, VITE_HOP_V4: 'on', HOP_BANC_PROFIL: '1' },
  });
  const arreter = () => { try { if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(srv.pid), '/T', '/F'], { stdio: 'ignore' }); else srv.kill('SIGTERM'); } catch { /* déjà arrêté */ } };
  try {
    for (let i = 0; i < 60; i += 1) { try { const r = await fetch(`http://127.0.0.1:${port}/`); if (r.ok) break; } catch { /* pas prêt */ } await attendre(500); }
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 120000, args: ['--mute-audio'] });
    const { ctx, page, cdp } = await nouvellePage(browser, taux);
    await page.goto(`http://127.0.0.1:${port}/?dev-local&etape=houblons`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
    await attendre(3500 * taux);
    await cdp.send('Profiler.enable');
    await cdp.send('Performance.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
    const pause = (ms) => attendre(ms * Math.sqrt(taux));
    const ouvrirOutil = async (route, pret) => { await page.evaluate((r) => window.__hopPile.open(r), route); await page.waitForSelector(pret); await pause(500); };
    const fermerOutil = async (ferme) => { await page.evaluate(() => window.__hopPile.close()); await page.waitForFunction((s) => !document.querySelector(s), {}, ferme); await pause(250); };
    const fiche = async () => {
      const el = await page.waitForSelector('[data-role="ouvrir-fiche"]'); const b = await el.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForSelector('[data-ecran="fiche"]'); await page.mouse.up(); await pause(400);
      await page.evaluate(() => document.querySelector('[role="dialog"] > header > button[aria-label="Fermer"]').click());
      await page.waitForFunction(() => !document.querySelector('[data-ecran="fiche"]')); await pause(500);
    };
    const METRIQUES = ['ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'TaskDuration'];
    const lireMetriques = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.filter((m) => METRIQUES.includes(m.name)).map((m) => [m.name, m.value * 1000]));
    const A = '[data-ecran="comparer"]';
    const unComparer = async () => { await ouvrirOutil({ view: 'hopCompare', hops: HOUBLONS_A }, '[data-ecran="comparer"] [data-moment]'); await fermerOutil(A); };
    const unSuggerer = async () => { await ouvrirOutil({ view: 'hopSuggest' }, '[data-ecran="suggerer"] [data-role="pont-comparer"]'); await fermerOutil('[data-ecran="suggerer"]'); };
    const faire = {
      'comparer-ouverture': { pre: unComparer, un: unComparer },
      'suggerer-ouverture': { pre: unSuggerer, un: unSuggerer },
      'fiche-ouverture': { pre: fiche, un: fiche },
      'comparer-moment': {
        pre: async () => { await ouvrirOutil({ view: 'hopCompare', hops: HOUBLONS_B }, '[data-ecran="comparer"] [data-moment]'); },
        un: async (i) => { const m = MOMENTS[i % MOMENTS.length]; await page.evaluate((x) => document.querySelector(`[data-moment="${x}"]`).click(), m); await page.waitForSelector(`[data-moment="${m}"][aria-checked="true"]`); await pause(300); },
        apres: async () => { await fermerOutil(A); },
      },
      'dose-plus': { pre: async () => {}, un: async (i) => { await page.evaluate((s) => document.querySelector(s).click(), i % 2 ? '[data-role="dose-moins"]' : '[data-role="dose-plus"]'); await pause(300); } },
    };
    const sorties = {};
    for (const sc of SCENARIOS) {
      const f = faire[sc.id];
      await f.pre(); // chauffe : chunk évalué, premier calcul fait
      const m0 = await lireMetriques();
      await cdp.send('Profiler.start');
      for (let i = 0; i < sc.reps; i += 1) await f.un(i);
      const { profile } = await cdp.send('Profiler.stop');
      const m1 = await lireMetriques();
      await f.apres?.();
      sorties[sc.id] = { profile, reps: sc.reps, nom: sc.nom, metriques: Object.fromEntries(METRIQUES.map((k) => [k, (m1[k] - m0[k]) / sc.reps])) };
    }
    await ctx.close?.(); await browser.close();
    return sorties;
  } finally { arreter(); }
}

/** Temps propre par fonction et temps inclusif par composant React, par répétition, avec les fichiers d'origine des cartes de source. */
function analyserProfil({ profile, reps }, dossierProfil) {
  let tm = null; try { tm = require('@jridgewell/trace-mapping'); } catch { /* pas de cartes */ }
  const cartes = new Map();
  const cartePour = (url) => {
    if (cartes.has(url)) return cartes.get(url);
    let c = null;
    try { c = new tm.TraceMap(fs.readFileSync(`${path.join(dossierProfil, new URL(url).pathname.replace(/^\//, ''))}.map`, 'utf8')); } catch { /* pas de carte */ }
    cartes.set(url, c); return c;
  };
  const origine = (cf) => {
    let source = path.basename(cf.url || '') || '(natif)';
    const c = cf.url && tm ? cartePour(cf.url) : null;
    if (c) { const o = tm.originalPositionFor(c, { line: cf.lineNumber + 1, column: cf.columnNumber }); if (o?.source) source = o.source.replace(/^(\.\.\/)+/, '').replace(/^.*?\/(src\/)/, '$1').replace(/^.*node_modules\//, 'node_modules/'); }
    return source;
  };
  const noeuds = new Map(profile.nodes.map((n) => [n.id, n]));
  const propre = new Map();
  for (let i = 0; i < profile.samples.length; i += 1) propre.set(profile.samples[i], (propre.get(profile.samples[i]) ?? 0) + (profile.timeDeltas[i] ?? 0));
  const parFonction = new Map();
  let actif = 0, gc = 0, programme = 0;
  for (const [id, us] of propre) {
    const n = noeuds.get(id); if (!n) continue;
    const nom = n.callFrame.functionName;
    if (nom === '(idle)') continue;
    if (nom === '(garbage collector)') { gc += us; continue; }
    if (nom === '(program)') { programme += us; continue; }
    actif += us;
    const cle = `${nom || '(anonyme)'} · ${origine(n.callFrame)}`;
    parFonction.set(cle, (parFonction.get(cle) ?? 0) + us);
  }
  // temps propre rattaché au fichier d'origine : un appel natif (getBoundingClientRect, focus…) compte pour le code qui l'appelle
  const parent = new Map();
  for (const n of profile.nodes) for (const e of n.children ?? []) parent.set(e, n.id);
  const parFichier = new Map(); const natifsDe = new Map();
  for (const [id, us] of propre) {
    const n = noeuds.get(id); if (!n || /^\((idle|garbage collector|program|root)\)$/.test(n.callFrame.functionName)) continue;
    let cur = n; while (cur && !cur.callFrame.url) cur = noeuds.get(parent.get(cur.id));
    const src = cur ? origine(cur.callFrame) : '(racine)';
    parFichier.set(src, (parFichier.get(src) ?? 0) + us);
    if (!n.callFrame.url && n.callFrame.functionName) { const k = `${n.callFrame.functionName} ← ${src}`; natifsDe.set(k, (natifsDe.get(k) ?? 0) + us); }
  }
  const incl = (id) => { const n = noeuds.get(id); let s = propre.get(id) ?? 0; for (const e of n.children ?? []) s += incl(e); n._tot = s; return s; };
  incl(profile.nodes[0].id);
  const composants = new Map();
  const parcourir = (id, ancetres) => {
    const n = noeuds.get(id); const cf = n.callFrame;
    const cleN = `${cf.functionName}|${cf.url}|${cf.lineNumber}`;
    const compo = /^[A-Z][A-Za-z0-9_$]{2,}$/.test(cf.functionName || '') && !/^(Object|Array|Map|Set|Promise|Date|Error|Math|JSON|Number|String|Symbol|Intl|Reflect|Proxy|React|Suspense|Fragment)$/.test(cf.functionName);
    if (compo && !ancetres.has(cleN)) { const cle = `${cf.functionName} · ${origine(cf)}`; composants.set(cle, (composants.get(cle) ?? 0) + (n._tot ?? 0)); }
    const suite = new Set(ancetres); suite.add(cleN);
    for (const e of n.children ?? []) parcourir(e, suite);
  };
  parcourir(profile.nodes[0].id, new Set());
  const pr = (us) => us / 1000 / reps;
  return {
    reps, fichiers: [...parFichier.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([f, us]) => ({ fichier: f, ms: pr(us) })),
    natifs: [...natifsDe.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, us]) => ({ appel: f, ms: pr(us) })),
    scriptActifMs: pr(actif), gcMs: pr(gc), programmeNatifMs: pr(programme),
    composants: [...composants.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([c, us]) => ({ composant: c, msInclusif: pr(us) })),
    fonctions: [...parFonction.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([c, us]) => ({ fonction: c, msPropre: pr(us) })),
  };
}

// =====================================================================================================================
// Programme
// =====================================================================================================================
const gitHead = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: racine, encoding: 'utf8' }).stdout?.trim();
const sale = spawnSync('git', ['status', '--short', '--', 'src', 'prototypes'], { cwd: racine, encoding: 'utf8' }).stdout?.split('\n').filter(Boolean).length ?? 0;
resultats.meta = {
  commit: gitHead, fichiersModifiesSrcEtPrototypes: sale, machine: `${os.cpus()[0]?.model?.trim()} · ${os.cpus().length} cœurs`, node: process.version,
  n: N, taux: TAUX, build: 'production (vite build --mode banc, import.meta.env.DEV=true, VITE_HOP_V4=on)', dossier: DOSSIER,
  fixture: '?dev-local&etape=houblons (Stout export 16D, Nugget 46 g à 60′, stock vide), Comparer sur Cascade/Idaho 7/Galaxy puis Citra/Mosaic/Simcoe',
};
console.log('BANC-PROD : fluidité des outils houblons sur un build de production (D70)');
console.log(`  ${resultats.meta.machine} · Node ${process.version} · HEAD ${gitHead} (+${sale} fichiers modifiés sous src/ et prototypes/ à ce moment) · ${N} prises par mesure`);

for (const taux of TAUX_MES) {
  console.log(`\n== CPU ×${taux} ==`);
  const { mesures, tasMo } = await mesurerSerie(taux);
  resultats.taux[taux] = { mesures, tasMo };
}

// ---------- Rapport ----------
const depassements = [];
for (const taux of TAUX_MES) {
  const { mesures, tasMo } = resultats.taux[taux];
  console.log(`\nCPU ×${taux}${taux >= FACTEUR ? ' (le PC bridé joue le téléphone : budgets de l\'épopée #159 non divisés)' : ' (budgets divisés par 4, hypothèse de check-hop-tools-perf)'} · tas JS ${f0(tasMo)} Mo`);
  console.log('  mesure | n | image méd · p95 | posé méd · p95 | budget méd · p95 | verdict (sur « posé »)');
  for (const m of mesures) {
    const n = m.pose.length;
    const mImg = mediane(m.image.filter((x) => x != null)), pImg = p95(m.image.filter((x) => x != null));
    const mPose = mediane(m.pose), pPose = p95(m.pose);
    let verdict = 'rapporté', bud = '—';
    if (m.genre !== 'info') {
      const b = budgetDe(m.genre === 'ecran' ? 'ecran' : m.genre, taux);
      bud = m.genre === 'glisser' ? `${f1(b.med)} · ${f1(b.p95)}` : `p95 ≤ ${f1(b.p95)}`;
      const depasse = m.genre === 'glisser' ? (mPose > b.med || pPose > b.p95) : pPose > b.p95;
      verdict = !m.atteint ? 'NON ATTEINT' : depasse ? 'DÉPASSÉ' : 'OK';
      if (verdict !== 'OK') depassements.push({ taux, id: m.id, nom: m.nom, mPose, pPose, genre: m.genre });
    }
    m.stats = { n, imageMed: mImg, imageP95: pImg, poseMed: mPose, poseP95: pPose, budget: bud, verdict };
    console.log(`  ${m.nom} | ${n} | ${f0(mImg)} · ${f0(pImg)} ms | ${f0(mPose)} · ${f0(pPose)} ms | ${bud} | ${verdict}`);
  }
}
if (erreurs.length) console.log(`\nerreurs de page : ${[...new Set(erreurs)].slice(0, 6).join(' | ')}`); else console.log('\nerreurs de page : aucune');
console.log(`requêtes hors localhost coupées : ${bloquees.size ? [...bloquees].join(', ') : 'aucune'}`);
resultats.meta.erreurs = [...new Set(erreurs)];
resultats.meta.bloquees = [...bloquees];

// ---------- Expérience A/B (--ab-has) ----------
if (AB_HAS) {
  resultats.ab = {};
  for (const taux of TAUX) {
    console.log(`\nEXPÉRIENCE A/B :has() · CPU ×${taux} (A = app telle quelle, B = règles :has() retirées ; alternance, n = ${N})`);
    const sortie = await experienceAB(taux);
    resultats.ab[taux] = sortie;
    for (const r of sortie) {
      const a = [mediane(r.A), p95(r.A)], b = [mediane(r.B), p95(r.B)];
      console.log(`  ${r.nom} : A méd ${f0(a[0])} · p95 ${f0(a[1])} ms | B méd ${f0(b[0])} · p95 ${f0(b[1])} ms | B/A = ${f1(b[0] / a[0])} (médiane)`);
    }
  }
}

// ---------- Profil CPU (--profil) : tous les scénarios, au plus fort bridage ----------
if (PROFIL || PROFIL_SEUL) {
  const dossierProfil = opt('dossier-profil');
  const tauxProfil = Math.max(...TAUX);
  console.log(`\nPROFIL CPU (build à noms conservés, CPU ×${tauxProfil}) : ${SCENARIOS.map((x) => x.id).join(', ')}`);
  const profils = await profiler(tauxProfil, dossierProfil);
  resultats.profil = {};
  for (const [cle, p] of Object.entries(profils)) {
    const a = analyserProfil(p, dossierProfil);
    a.metriquesParRepetitionMs = p.metriques;
    resultats.profil[cle] = a;
    const mt = p.metriques;
    console.log(`\n  ${p.nom} (${a.reps} répétitions) : JS actif ${f0(a.scriptActifMs)} ms · GC ${f0(a.gcMs)} ms · natif/(program) ${f0(a.programmeNatifMs)} ms par répétition ; métriques Chrome par répétition : script ${f0(mt.ScriptDuration)} · style ${f0(mt.RecalcStyleDuration)} · mise en page ${f0(mt.LayoutDuration)} · tâches ${f0(mt.TaskDuration)} ms`);
    console.log('    Temps propre par fichier source (appels natifs rattachés à leur appelant), ms par répétition :');
    for (const c of a.fichiers.slice(0, 8)) console.log(`      ${f1(c.ms).padStart(7)}  ${c.fichier}`);
    console.log('    Appels natifs les plus coûteux (← fichier appelant) :');
    for (const c of a.natifs.slice(0, 5)) console.log(`      ${f1(c.ms).padStart(7)}  ${c.appel}`);
  }
}

const fichierSortie = sortieDe(AB_HAS ? 'ab-has.json' : PROFIL_SEUL ? 'profil.json' : 'resultats.json');
fs.writeFileSync(fichierSortie, JSON.stringify(AB_HAS ? { meta: resultats.meta, ab: resultats.ab } : PROFIL_SEUL ? { meta: resultats.meta, profil: resultats.profil } : resultats, null, 2));
console.log(`\nBANC-PROD : mesuré ; ${depassements.length} dépassement(s) ; détails dans ${fichierSortie}`);
process.exit(0);
