// Mesure d'une page construite comme sur un téléphone (voie t2-performance, mission theme-performance, 23.10).
// L'utilisateur, le 23.10 : « Aussi regarder pour les optimisation, latence ect.. ».
//
// Usage (depuis la racine du dépôt) :
//   node work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs <dossier> <id…> --page=etat.html [--cpu=4]
//   <dossier>/<id>/<page> est ouvert dans Chrome (puppeteer-core), 390 × 844, échelle 2, toucher, processeur ralenti
//   (emulateCPUThrottling : ×4 = téléphone moyen, ×6 = bas de gamme). Réseau distant coupé (polices, etc.), cache coupé,
//   un contexte neuf par passage : chaque chargement est à froid pour Chrome (le cache de fichiers du système, lui, reste).
//
// Mesures par page (chacune se lit sur une ligne ; les détails suivent, en retrait) :
//   chargement   de la navigation au premier écran utilisable : un [data-ecran] visible, hors [inert], peint, puis le fil
//                principal libre (un toucher peut être servi). Médiane de plusieurs chargements ; le plus lent est aussi noté.
//   toucher      d'un toucher sur un pont [data-role^="pont-"] (relâché : pointerup) au premier rendu de l'écran suivant
//                (un autre [data-ecran] visible, peint). Le premier toucher d'une session est « froid », les suivants
//                (retour du téléphone puis même pont) « chauds » : le cache du moteur les aide (L20). Le budget juge le plus lent.
//   glisser      un geste de doigt (CDP Input.dispatchTouchEvent, un point toutes les 16 ms) sur la frise
//                [data-role="frise"] ou la poignée [data-role="glisser-moment"] ; durée de chaque image qui a reçu un
//                mouvement. Image tenue (intervalle ≤ 25 ms) : travail du fil principal, du début d'image (horodatage
//                de requestAnimationFrame) à la fin du rendu ; image ratée : intervalle entier. Médiane et 95e centile.
//                Le raster et le GPU ne sont pas vus d'ici (Chrome sans GPU) : seulement le fil principal.
//   script       évaluation du script (EvaluateScript) et analyse du programme (V8.ParseProgram), lus dans une trace
//                Chrome d'un chargement dédié (la trace ralentit : ce chargement n'entre pas dans la médiane).
//   tâches       longues tâches (longtask, > 50 ms) : nombre et temps bloquant (somme de durée − 50 ms) de tout le passage.
//   moteur       lu dans window.__parcours (maquette), avec des entrées qui changent à chaque appel (L20) : lireBiere sur
//                16 recettes différentes, suggerer sur 3 volumes, les 28 crans de la frise ; plus le journal passif
//                (mesures()) du glisser. Sans window.__parcours : « non exposé », pas un échec.
//   tas          mémoire du tas JS après un ramasse-miettes, en fin de passage.
//   --profil     en plus : un passage par page où le premier toucher et le premier glisser (à froid) sont profilés (Profiler CDP,
//                échantillon de 250 µs) ; les fonctions qui pèsent le plus sont listées, avec l'extrait du script à l'endroit de la fonction
//                (le script est minifié : le nom ne dit rien, l'extrait oui).
//   poids        script et feuille de style, bruts, gzip (niveau 9) et brotli (qualité 11, précompressé).
//
// Budgets de MISSION.md, à ×4 seulement (modèle RAIL) : toucher ≤ 100 ms ; glisser ≤ 16 ms en médiane et ≤ 33 ms au 95e
// centile ; écran utilisable ≤ 2,5 s. Tout autre ralentissement (×6…) est mesuré et rapporté sans budget.
// Une page où rien n'est mesuré (aucun écran utilisable) est un échec, jamais un OK.
// Sortie : une ligne par page, puis PERF OK ou PERF ECHEC suivi d'une ligne par dépassement (qui commence par
// « chargement », « toucher » ou « glisser »). Code de sortie 0 (OK), 1 (échec), 2 (plantage).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(depot, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const BUDGET = { chargement: 2500, toucher: 100, glisserP50: 16, glisserP95: 33 };
const VSYNC_TENU = 25; // ms : au-delà, l'image a raté son créneau de 16,7 ms
const IMAGES_MIN = 10; // images actives minimales pour qu'un glisser compte comme mesuré

// ---------- Arguments ----------
const argv = process.argv.slice(2);
const opt = (nom) => {
  const a = argv.find((x) => x.startsWith(`--${nom}=`));
  return a ? a.slice(nom.length + 3) : null;
};
const positionnels = argv.filter((a) => !a.startsWith('--'));
const dossierArg = positionnels[0];
const ids = positionnels.slice(1);
const nomPage = opt('page') ?? 'etat.html';
const cpu = Number(opt('cpu') ?? 4);
const avecBudget = cpu === 4;
const avecProfil = argv.includes('--profil');
if (!dossierArg || !ids.length || !Number.isFinite(cpu) || cpu < 1) {
  console.log('PERF ECHEC : usage : mesure-performance.mjs <dossier> <id…> --page=etat.html [--cpu=4]');
  process.exit(2);
}
const dossier = path.resolve(depot, dossierArg);

// ---------- Utilitaires ----------
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const trier = (xs) => [...xs].sort((a, b) => a - b);
const centile = (xs, p) => { if (!xs.length) return null; const t = trier(xs); return t[Math.min(t.length - 1, Math.max(0, Math.ceil(p * t.length) - 1))]; };
const mediane = (xs) => { if (!xs.length) return null; const t = trier(xs), k = Math.floor(t.length / 2); return t.length % 2 ? t[k] : (t[k - 1] + t[k]) / 2; };
const nb = (x, d = 1) => (x == null || Number.isNaN(x) ? '?' : (Math.abs(x) < 100 ? x.toFixed(d) : String(Math.round(x))).split('.').join(','));
const ko = (octets) => { const k = octets / 1024; return `${k < 10 ? k.toFixed(1).split('.').join(',') : String(Math.round(k)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ko`; };
const mo = (octets) => `${(octets / 1048576).toFixed(1).split('.').join(',')} Mo`;

// ---------- Sonde injectée avant tout script de la page ----------
// Tout vit dans une fonction : aucune globale hors window.__perf (les données) et window.__perfApi (les gestes).
function sonde() {
  const P = { visible: null, usable: null, longtasks: [], evt: [], touch: null, images: false, frames: [], moves: 0, cancels: 0 };
  window.__perf = P;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) P.longtasks.push({ debut: e.startTime, duree: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch (e) { /* longtask indisponible */ }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'click' || e.name === 'pointerup') P.evt.push({ nom: e.name, duree: e.duration }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch (e) { /* event timing indisponible */ }
  const visibles = () => [...document.querySelectorAll('[data-ecran]')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.closest('[inert], [hidden]');
  }).map((el) => el.getAttribute('data-ecran'));
  // Après le rendu de l'image en cours : la tâche qui suit la mise à jour du rendu (MessageChannel).
  const apresRendu = (fn) => requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => fn(performance.now()); c.port2.postMessage(0); });

  // Premier écran utilisable.
  const guetter = () => {
    if (P.visible != null) return;
    if (visibles().length) { P.visible = performance.now(); apresRendu((t) => { P.usable = t; }); return; }
    requestAnimationFrame(guetter);
  };
  requestAnimationFrame(guetter);

  // Toucher : t0 = horodatage du pointerup (heure d'arrivée de l'entrée, même si le fil était occupé).
  const surveiller = () => {
    const T = P.touch;
    if (!T || T.fin != null || T.attend) return;
    if (visibles().some((n) => !T.src.includes(n))) {
      T.attend = true;
      T.ecran = visibles().find((n) => !T.src.includes(n));
      apresRendu((t) => { T.fin = t; });
    }
  };
  new MutationObserver(surveiller).observe(document, { subtree: true, childList: true, attributes: true });
  const sondeur = () => { surveiller(); if (P.touch && P.touch.fin == null) requestAnimationFrame(sondeur); };
  addEventListener('pointerup', (e) => { if (P.touch && P.touch.t0 == null) { P.touch.t0 = e.timeStamp; surveiller(); requestAnimationFrame(sondeur); } }, true);
  addEventListener('pointermove', () => { P.moves += 1; }, true);
  addEventListener('pointercancel', () => { P.cancels += 1; }, true);

  window.__perfApi = {
    visibles,
    armer: () => { P.touch = { src: visibles(), t0: null, fin: null, attend: false, ecran: null }; },
    imagesOn: () => {
      P.images = true; P.frames = []; P.moves = 0; P.cancels = 0;
      const boucle = (ts) => {
        if (!P.images) return;
        const m = P.moves; P.moves = 0;
        const c = new MessageChannel();
        c.port1.onmessage = () => { P.frames.push({ ts, fin: performance.now(), m }); };
        c.port2.postMessage(0);
        requestAnimationFrame(boucle);
      };
      requestAnimationFrame(boucle);
    },
    imagesOff: () => { P.images = false; },
  };
}

// ---------- Fonctions jouées dans la page ----------
const lirePonts = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], [hidden]'); };
  const roles = [];
  for (const el of document.querySelectorAll('[data-role^="pont-"]')) {
    const r = el.getAttribute('data-role');
    if (vis(el) && el.getAttribute('aria-disabled') !== 'true' && !el.disabled && !roles.includes(r)) roles.push(r);
  }
  const frise = [...document.querySelectorAll('[data-role="glisser-moment"], [data-role="frise"]')].some(vis);
  return { roles, frise, ecrans: window.__perfApi.visibles() };
};
const placerPont = (role) => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], [hidden]'); };
  const el = [...document.querySelectorAll(`[data-role="${role}"]`)].filter(vis).at(-1);
  if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const dessus = document.elementFromPoint(x, y);
  return { x, y, libre: !!dessus && (dessus === el || el.contains(dessus) || dessus.contains(el)), recouvert: dessus ? (dessus.getAttribute('data-role') || dessus.tagName.toLowerCase()) : 'rien' };
};
const placerGlisseur = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], [hidden]'); };
  const cherche = (sel) => [...document.querySelectorAll(sel)].filter(vis)[0] ?? null;
  const el = cherche('[data-role="glisser-moment"]') ?? cherche('[data-role="frise"]');
  if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  const orient = el.getAttribute('aria-orientation') ?? el.querySelector('[aria-orientation]')?.getAttribute('aria-orientation') ?? (r.height > r.width * 1.5 ? 'vertical' : 'horizontal');
  // Où poser le doigt : le centre de l'élément s'il reçoit le toucher, sinon le centre d'un de ses descendants (le pouce).
  const recoit = (x, y) => { const d = document.elementFromPoint(x, y); return !!d && (d === el || el.contains(d)); };
  let dx = r.left + r.width / 2, dy = r.top + r.height / 2, pose = recoit(dx, dy) ? 'centre' : null;
  if (!pose) {
    for (const c of el.querySelectorAll('*')) {
      const q = c.getBoundingClientRect();
      if (q.width > 0 && q.height > 0 && recoit(q.left + q.width / 2, q.top + q.height / 2)) { dx = q.left + q.width / 2; dy = q.top + q.height / 2; pose = 'pouce'; break; }
    }
  }
  return { x: r.left, y: r.top, w: r.width, h: r.height, vertical: orient === 'vertical', role: el.getAttribute('data-role'), dx, dy, pose };
};
// Empreinte de ce que le glisser déplace : aria-valuenow / aria-valuetext et position des descendants.
const signatureGlisseur = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], [hidden]'); };
  const el = [...document.querySelectorAll('[data-role="glisser-moment"]')].find(vis) ?? [...document.querySelectorAll('[data-role="frise"]')].find(vis);
  if (!el) return null;
  const sl = el.matches('[role="slider"]') ? el : el.querySelector('[role="slider"]');
  return JSON.stringify([sl ? sl.getAttribute('aria-valuenow') : null, sl ? sl.getAttribute('aria-valuetext') : null, [...el.querySelectorAll('*')].slice(0, 60).map((c) => { const r = c.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })]);
};
const sonderMoteur = () => {
  const pc = window.__parcours;
  if (!pc || !pc.moteur) return null;
  const stats = (xs) => { const t = [...xs].sort((a, b) => a - b); return { n: t.length, p50: t[Math.floor(t.length / 2)], p95: t[Math.min(t.length - 1, Math.ceil(0.95 * t.length) - 1)], max: t.at(-1) }; };
  const m = pc.moteur, base = pc.etat.recette;
  const varier = (i) => ({ ...base, volumeL: base.volumeL * (1 + 0.007 * i), additions: base.additions.map((a, k) => (k === 0 ? { ...a, grams: a.grams * (1 + 0.011 * i) } : a)) });
  const sortie = {};
  try {
    const t = [];
    for (let i = 1; i <= 16; i++) { const t0 = performance.now(); m.lireBiere(varier(i)); t.push(performance.now() - t0); }
    sortie.lireBiere = { premier: t[0], ...stats(t) };
  } catch (e) { sortie.lireBiere = { erreur: String(e && e.message) }; }
  try {
    const t = [];
    for (let i = 1; i <= 3; i++) { const t0 = performance.now(); const r = m.suggerer(varier(20 + i), 'floral'); t.push(performance.now() - t0); sortie.candidats = r.length; }
    sortie.suggerer = { premier: t[0], ...stats(t) };
  } catch (e) { sortie.suggerer = { erreur: String(e && e.message) }; }
  try {
    const ajout = { id: 'perf', hopKey: base.additions[0].hopKey, grams: 30, moment: 'dryPost' };
    const t = []; let crans = 0;
    for (let i = 1; i <= 2; i++) {
      const r = varier(40 + i), t0 = performance.now();
      const liste = m.cransFrise(r);
      for (const q of liste) m.simulerMoment(r, ajout, q);
      t.push(performance.now() - t0); crans = liste.length;
    }
    sortie.frise = { crans, premier: t[0], max: Math.max(...t) };
  } catch (e) { sortie.frise = { erreur: String(e && e.message) }; }
  return sortie;
};
const lireJournal = () => {
  const pc = window.__parcours;
  if (!pc || !pc.mesures) return null;
  const j = pc.mesures();
  const vrais = j.filter((x) => !x.cache).map((x) => x.ms).sort((a, b) => a - b);
  return { appels: j.length, recalculs: vrais.length, cache: j.length - vrais.length, p50: vrais.length ? vrais[Math.floor(vrais.length / 2)] : null, max: vrais.length ? vrais.at(-1) : null };
};

// ---------- Poids ----------
const poidsCache = new Map();
function poidsFichier(f) {
  if (!poidsCache.has(f)) {
    const buf = fs.readFileSync(f);
    poidsCache.set(f, { nom: path.basename(f), mtime: fs.statSync(f).mtime, brut: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length, brotli: zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } }).length });
  }
  return poidsCache.get(f);
}
function poidsPage(res) {
  const somme = { js: { brut: 0, gzip: 0, brotli: 0 }, css: { brut: 0, gzip: 0, brotli: 0 }, externes: [], fichiers: [] };
  const ajouter = (cat, p) => { for (const k of ['brut', 'gzip', 'brotli']) somme[cat][k] += p[k]; };
  for (const r of res) {
    if (r.inline != null) {
      const buf = Buffer.from(r.inline, 'utf8');
      ajouter(r.type, { brut: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length, brotli: zlib.brotliCompressSync(buf).length });
    } else if (r.url.startsWith('file:')) {
      const f = fileURLToPath(r.url);
      if (fs.existsSync(f)) { const p = poidsFichier(f); ajouter(r.type, p); somme.fichiers.push(`${p.nom} ${p.brut} o, modifié ${p.mtime.toTimeString().slice(0, 8)}`); } else somme.externes.push(`${r.url} (absent)`);
    } else somme.externes.push(r.url);
  }
  return somme;
}

// ---------- Profil (--profil) ----------
const sourcesLues = new Map();
function extrait(url, l, c) {
  try {
    if (!url.startsWith('file:')) return '';
    if (!sourcesLues.has(url)) sourcesLues.set(url, fs.readFileSync(fileURLToPath(url), 'utf8').split('\n'));
    const ligne = sourcesLues.get(url)[l] ?? '';
    return ligne.slice(Math.max(0, c - 12), c + 90).split(/\s+/).join(' ');
  } catch (e) { return ''; }
}
async function profiler(cdp, geste) {
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  await cdp.send('Profiler.start');
  await geste();
  const { profile } = await cdp.send('Profiler.stop');
  const noeuds = new Map(profile.nodes.map((n) => [n.id, n]));
  const propre = new Map();
  let natif = 0, repos = 0, total = 0;
  profile.samples.forEach((id, i) => {
    const ms = profile.timeDeltas[i] / 1000, c = noeuds.get(id).callFrame;
    if (c.functionName === '(idle)') { repos += ms; return; }
    total += ms;
    if (c.functionName === '(program)' || c.functionName === '(garbage collector)' || !c.url) { natif += ms; return; }
    const cle = `${c.functionName || '(anonyme)'}|${c.url}|${c.lineNumber}|${c.columnNumber}`;
    propre.set(cle, (propre.get(cle) ?? 0) + ms);
  });
  const haut = [...propre.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cle, ms]) => {
    const [nom, url, l, c] = cle.split('|');
    return { ms, nom, lieu: `${url.split('/').pop()}:${l}:${c}`, extrait: extrait(url, Number(l), Number(c)) };
  });
  return { total, natif, repos, haut };
}

// ---------- Un passage ----------
const nav = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--disable-gpu', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'],
});

async function ouvrirPage(url, { trace = false } = {}) {
  const ctx = await nav.createBrowserContext();
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_BLOCKED/.test(m.text())) erreurs.push(`console : ${m.text()}`); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] });
  await cdp.send('Performance.enable');
  await page.evaluateOnNewDocument(sonde);
  if (cpu > 1) await page.emulateCPUThrottling(cpu);
  if (trace) await page.tracing.start({ categories: ['devtools.timeline', 'v8', 'disabled-by-default-v8.compile'] });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const utilisable = await page.waitForFunction(() => window.__perf && window.__perf.usable != null, { timeout: 30000, polling: 50 }).then(() => true).catch(() => false);
  let traceBrute = null;
  if (trace) traceBrute = await page.tracing.stop();
  return { ctx, page, cdp, erreurs, utilisable, traceBrute };
}

const sommeTrace = (buf) => {
  try {
    const tr = JSON.parse(Buffer.from(buf).toString('utf8'));
    const evs = tr.traceEvents ?? tr;
    const somme = (nom) => evs.filter((e) => e.ph === 'X' && e.name === nom && e.dur).reduce((s, e) => s + e.dur / 1000, 0);
    const evalMs = somme('EvaluateScript'), analyse = somme('V8.ParseProgram');
    return evalMs > 0 ? { evaluation: evalMs, analyse } : null;
  } catch (e) { return null; }
};

async function toucher(cdp, x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await pause(40);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function lireToucher(page) {
  const ok = await page.waitForFunction(() => window.__perf.touch && window.__perf.touch.fin != null, { timeout: 5000, polling: 20 }).then(() => true).catch(() => false);
  const t = await page.evaluate(() => (window.__perf.touch ? { t0: window.__perf.touch.t0, fin: window.__perf.touch.fin, ecran: window.__perf.touch.ecran } : null));
  const evt = await page.evaluate(() => window.__perf.evt.map((e) => e.duree));
  const moteur = ok && t && t.t0 != null ? await page.evaluate(([a, b]) => {
    const pc = window.__parcours;
    if (!pc || !pc.mesures) return null;
    const iv = pc.mesures().filter((m) => !m.cache && m.t + m.ms >= a && m.t <= b).map((m) => [Math.max(a, m.t), Math.min(b, m.t + m.ms)]).sort((x, y) => x[0] - y[0]);
    let somme = 0, fin = -Infinity;
    for (const [d, f] of iv) { if (d > fin) { somme += f - d; fin = f; } else if (f > fin) { somme += f - fin; fin = f; } }
    return somme;
  }, [t.t0, t.fin]) : null;
  return { ok: ok && t && t.t0 != null, ms: ok && t && t.t0 != null ? t.fin - t.t0 : null, ecran: t ? t.ecran : null, evt, moteur };
}

/** Un toucher sur le pont, puis (chaud) retour du téléphone et même pont. */
async function sequenceToucher(p, role, resultat, profil = false) {
  const { page, cdp } = p;
  const tape = async (quand) => {
    const pos = await page.evaluate(placerPont, role);
    if (!pos) { resultat.notes.push(`toucher : pont ${role} introuvable (${quand})`); return null; }
    if (!pos.libre) { resultat.manques.push(`toucher ${resultat.id} : ${role} recouvert par « ${pos.recouvert} » au centre, il ne reçoit pas le doigt`); return null; }
    await pause(80);
    const ecran0 = await page.evaluate(() => window.__perfApi.visibles());
    await page.evaluate(() => window.__perfApi.armer());
    await toucher(cdp, pos.x, pos.y);
    const r = await lireToucher(page);
    if (!r.ok) { resultat.manques.push(`toucher ${resultat.id} : aucun écran suivant après le toucher sur ${role} (${quand})`); return null; }
    resultat.touchers.push({ role, quand, ms: r.ms, vers: r.ecran, evt: r.evt, moteur: r.moteur });
    return ecran0;
  };
  let ecran0;
  if (profil) {
    const pr = await profiler(cdp, async () => { ecran0 = await tape('froid'); });
    resultat.profils.push({ quoi: `toucher froid sur ${role}`, ...pr });
    return;
  }
  ecran0 = await tape('froid');
  if (!ecran0) return;
  for (let i = 0; i < 2; i++) {
    await pause(200);
    await page.evaluate(() => history.back());
    const revenu = await page.waitForFunction((src) => window.__perfApi.visibles().some((n) => src.includes(n)), { timeout: 4000, polling: 50 }, ecran0).then(() => true).catch(() => false);
    if (!revenu) { resultat.notes.push(`toucher : retour du téléphone impossible après ${role}, pas de mesure à chaud`); return; }
    await pause(300);
    if (!(await tape('chaud'))) return;
  }
}

/** Un glisser en trois temps (le doigt part du pouce : −30 %, +30 %, retour), image par image. Deux fois de suite :
 * le premier est à froid (caches du moteur vides), le second repasse les mêmes crans (chaud). */
async function sequenceGlisser(p, resultat, profil = false) {
  const { page, cdp } = p;
  const g = await page.evaluate(placerGlisseur);
  if (!g) { resultat.notes.push('glisser : ni frise ni poignée visible'); return; }
  if (!g.pose) { resultat.manques.push(`glisser ${resultat.id} : rien sous le doigt sur ${g.role} (ni l'élément ni un descendant ne reçoit le toucher)`); return; }
  const passe = (resultat.nGlisse = (resultat.nGlisse ?? 0) + 1);
  const depart = g.vertical ? g.dy : g.dx, lo = g.vertical ? g.y : g.x, long = g.vertical ? g.h : g.w;
  const pos = (v) => { const c = Math.min(lo + long, Math.max(lo, v)); return g.vertical ? { x: g.dx, y: c } : { x: c, y: g.dy }; };
  for (const quand of profil ? ['froid'] : ['froid', 'chaud']) {
    await pause(150);
    await page.evaluate(() => { if (window.__parcours?.viderMesures) window.__parcours.viderMesures(); window.__perfApi.imagesOn(); });
    await pause(100);
    const avant = await page.evaluate(signatureGlisseur);
    let pendant = null;
    const geste = async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pos(depart)] });
      let v = depart;
      for (const [vers, pas] of [[depart - 0.3 * long, 20], [depart + 0.3 * long, 20], [depart, 10]]) {
        for (let i = 1; i <= pas; i++) {
          v += (vers - v) / (pas - i + 1);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pos(v)] });
          await pause(16);
        }
        if (!pendant) pendant = await page.evaluate(signatureGlisseur);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await pause(150);
    };
    if (profil) { const pr = await profiler(cdp, geste); resultat.profils.push({ quoi: `glisser froid sur ${g.role}`, ...pr }); } else await geste();
    await page.evaluate(() => window.__perfApi.imagesOff());
    const { frames, cancels } = await page.evaluate(() => ({ frames: window.__perf.frames, cancels: window.__perf.cancels }));
    let prev = null;
    for (const im of profil ? [] : frames) {
      const intervalle = prev == null ? null : im.ts - prev;
      prev = im.ts;
      if (im.m <= 0) continue;
      const cout = im.fin - im.ts;
      resultat.images.push({ quand, passe, cout, intervalle, duree: intervalle != null && intervalle > VSYNC_TENU ? intervalle : cout });
    }
    if (profil) continue;
    if (quand === 'froid' && pendant === avant) resultat.manques.push(`glisser ${resultat.id} : ${g.role} : le geste n'a rien déplacé (ni aria-valuenow, ni position des éléments ne changent ; doigt posé sur ${g.pose})`);
    resultat.annules += cancels;
    const journal = await page.evaluate(lireJournal);
    if (journal) resultat.journal.push({ quand, ...journal });
  }
}

async function fermerPage(p, resultat) {
  const { page, cdp, ctx, erreurs } = p;
  try {
    const lt = await page.evaluate(() => ({ taches: window.__perf.longtasks, usable: window.__perf.usable }));
    for (const t of lt.taches) {
      const bloque = Math.max(0, t.duree - 50);
      if (lt.usable != null && t.debut < lt.usable) { resultat.ltCharge += 1; resultat.bloqCharge += bloque; } else { resultat.ltGestes += 1; resultat.bloqGestes += bloque; }
    }
    const paint = await page.evaluate(() => { const e = performance.getEntriesByName('first-contentful-paint')[0]; return e ? e.startTime : null; });
    if (paint != null) resultat.fcp.push(paint);
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.collectGarbage');
    const m = (await cdp.send('Performance.getMetrics')).metrics;
    const tas = m.find((x) => x.name === 'JSHeapUsedSize');
    if (tas) resultat.tas.push(tas.value);
  } catch (e) { resultat.notes.push(`fin de passage : ${e.message}`); }
  for (const e of erreurs) if (!resultat.erreurs.includes(e)) resultat.erreurs.push(e);
  await ctx.close().catch(() => {});
}

// ---------- Une page ----------
async function mesurerPage(id) {
  const fichier = path.join(dossier, id, nomPage);
  const res = {
    id, chargements: [], fcp: [], touchers: [], images: [], annules: 0, journal: [], moteur: [], ltCharge: 0, bloqCharge: 0, ltGestes: 0, bloqGestes: 0, tas: [], profils: [],
    script: null, poids: null, erreurs: [], notes: [], manques: [], ponts: [], frise: false, fichierAbsent: false,
  };
  if (!fs.existsSync(fichier)) { res.fichierAbsent = true; return res; }
  const url = pathToFileURL(fichier).href;

  // Passage 0 : chargement tracé (script) ; il décrit aussi la page (ponts, frise, fichiers chargés).
  const p0 = await ouvrirPage(url, { trace: true });
  if (p0.traceBrute) res.script = sommeTrace(p0.traceBrute);
  if (p0.utilisable) {
    const d = await p0.page.evaluate(lirePonts);
    res.ponts = d.roles; res.frise = d.frise;
  }
  const ressources = await p0.page.evaluate(() => [
    ...[...document.scripts].map((s) => (s.src ? { type: 'js', url: s.src } : { type: 'js', url: 'inline', inline: s.textContent })),
    ...[...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => ({ type: 'css', url: l.href })),
    ...[...document.querySelectorAll('style')].map((s) => ({ type: 'css', url: 'inline', inline: s.textContent })),
  ]).catch(() => []);
  res.poids = poidsPage(ressources.filter((r) => r.url !== 'inline' || (r.inline && r.inline.length)));
  await fermerPage(p0, { ltCharge: 0, bloqCharge: 0, ltGestes: 0, bloqGestes: 0, fcp: [], tas: [], notes: [], erreurs: res.erreurs });
  if (!p0.utilisable) { res.manques.push(`chargement ${id} : aucun écran [data-ecran] utilisable en 30 s (page vide ou script en erreur)`); return res; }

  // Passages mesurés : un par pont (trois au plus), deux pour le glisser s'il y a une frise, trois chargements au moins.
  const plan = [...res.ponts.slice(0, 3).map((role) => ({ type: 'toucher', role }))];
  if (res.frise) plan.push({ type: 'glisser' }, { type: 'glisser' });
  while (plan.length < 3) plan.push({ type: 'charge' });
  for (const etape of plan) {
    const p = await ouvrirPage(url);
    if (p.utilisable) {
      const t = await p.page.evaluate(() => window.__perf.usable);
      res.chargements.push(t);
      await pause(300);
      if (etape.type === 'toucher') await sequenceToucher(p, etape.role, res);
      else if (etape.type === 'glisser') await sequenceGlisser(p, res);
      if (etape === plan.at(-1)) { const m = await p.page.evaluate(sonderMoteur); if (m) res.moteur.push(m); }
    } else res.manques.push(`chargement ${id} : aucun écran utilisable en 30 s (passage ${res.chargements.length + 1})`);
    await fermerPage(p, res);
  }
  res.manques = [...new Set(res.manques)];
  if (avecProfil) {
    const aProfiler = [...res.ponts.slice(0, 1).map((role) => ({ type: 'toucher', role })), ...(res.frise ? [{ type: 'glisser' }] : [])];
    for (const etape of aProfiler) {
      const p = await ouvrirPage(url);
      if (p.utilisable) {
        await pause(300);
        const bidon = { id, notes: [], manques: [], touchers: [], images: [], journal: [], moteur: [], annules: 0, profils: res.profils };
        if (etape.type === 'toucher') await sequenceToucher(p, etape.role, bidon, true); else await sequenceGlisser(p, bidon, true);
      }
      await p.ctx.close().catch(() => {});
    }
  }
  return res;
}

// ---------- Synthèse ----------
function synthese(r) {
  const s = { id: r.id, depassements: [...r.manques] };
  const c = r.chargements;
  s.chargement = mediane(c);
  s.chargementMax = c.length ? Math.max(...c) : null;
  const tc = r.touchers.map((t) => t.ms);
  s.toucher = tc.length ? Math.max(...tc) : null;
  s.touchFroid = r.touchers.filter((t) => t.quand === 'froid').map((t) => t.ms);
  s.touchChaud = r.touchers.filter((t) => t.quand === 'chaud').map((t) => t.ms);
  const froid = r.images.filter((i) => i.quand === 'froid'), chaud = r.images.filter((i) => i.quand === 'chaud');
  const du = froid.map((i) => i.duree);
  s.nImages = du.length;
  s.p50 = centile(du, 0.5); s.p95 = centile(du, 0.95);
  s.chaudP50 = centile(chaud.map((i) => i.duree), 0.5); s.chaudP95 = centile(chaud.map((i) => i.duree), 0.95); s.nChaud = chaud.length;
  s.interP95 = centile(froid.map((i) => i.intervalle).filter((x) => x != null), 0.95);
  s.ratees = froid.filter((i) => i.intervalle != null && i.intervalle > VSYNC_TENU).length;
  s.coutP50 = centile(froid.map((i) => i.cout), 0.5); s.coutP95 = centile(froid.map((i) => i.cout), 0.95);
  if (c.length === 0 && !r.fichierAbsent && !r.manques.some((m) => m.startsWith('chargement'))) s.depassements.push(`chargement ${r.id} : rien de mesuré`);
  if (r.fichierAbsent) s.depassements.push(`chargement ${r.id} : ${path.relative(depot, path.join(dossier, r.id, nomPage))} absent, rien de mesuré`);
  if (r.frise && s.nImages < IMAGES_MIN) s.depassements.push(`glisser ${r.id} : ${s.nImages} image(s) avec mouvement seulement (au moins ${IMAGES_MIN} attendues ; gestes annulés par le navigateur : ${r.annules})`);
  if (avecBudget) {
    if (s.chargement != null && s.chargement > BUDGET.chargement) s.depassements.push(`chargement ${r.id} : ${nb(s.chargement / 1000, 2)} s > ${nb(BUDGET.chargement / 1000, 1)} s (écran utilisable à froid, ×${cpu})`);
    if (s.toucher != null && s.toucher > BUDGET.toucher) {
      const pire = r.touchers.reduce((a, b) => (b.ms > a.ms ? b : a));
      s.depassements.push(`toucher ${r.id} : ${nb(s.toucher)} ms > ${BUDGET.toucher} ms (${pire.role}, ${pire.quand}, ×${cpu})`);
    }
    if (s.nImages >= IMAGES_MIN && s.p50 > BUDGET.glisserP50) s.depassements.push(`glisser ${r.id} : médiane ${nb(s.p50)} ms > ${BUDGET.glisserP50} ms (×${cpu})`);
    if (s.nImages >= IMAGES_MIN && s.p95 > BUDGET.glisserP95) s.depassements.push(`glisser ${r.id} : 95e centile ${nb(s.p95)} ms > ${BUDGET.glisserP95} ms (×${cpu})`);
  }
  return s;
}

function imprimer(r, s) {
  const p = r.poids;
  const poids = p ? `js ${ko(p.js.brut)} (gzip ${ko(p.js.gzip)}, brotli ${ko(p.js.brotli)}) · css ${ko(p.css.brut)} (gzip ${ko(p.css.gzip)}, brotli ${ko(p.css.brotli)})` : 'poids ?';
  const tas = r.tas.length ? mo(mediane(r.tas)) : '?';
  const script = r.script ? `${nb(r.script.evaluation, 0)} ms` : '?';
  const glisser = s.nImages ? `glisser p50 ${nb(s.p50)} / p95 ${nb(s.p95)} ms` : 'glisser n/a';
  console.log(`${r.id} · chargement ${s.chargement != null ? nb(s.chargement, 0) : '?'} ms · toucher ${s.toucher != null ? nb(s.toucher) : 'n/a'} ms · ${glisser} · script ${script} · longues tâches au chargement ${nb(r.ltCharge / Math.max(1, r.chargements.length), 1)} en moyenne (bloquant ${nb(r.bloqCharge / Math.max(1, r.chargements.length), 0)} ms) · tas ${tas} · ${poids}`);
  const d = (t) => console.log(`  ${t}`);
  if (s.chargement != null) d(`chargement : médiane de ${r.chargements.length} chargements à froid, le plus lent ${nb(s.chargementMax, 0)} ms${r.fcp.length ? `, première peinture ${nb(mediane(r.fcp), 0)} ms` : ''}`);
  if (r.ltGestes) d(`longues tâches (> 50 ms) après l'ouverture, tous gestes des ${r.chargements.length} passages : ${r.ltGestes}, bloquant ${nb(r.bloqGestes, 0)} ms au total`);
  if (r.script) d(`script : évaluation ${nb(r.script.evaluation, 0)} ms, analyse du programme ${nb(r.script.analyse, 0)} ms (trace d'un chargement dédié)`);
  if (r.touchers.length) {
    for (const role of [...new Set(r.touchers.map((t) => t.role))]) {
      const ts = r.touchers.filter((t) => t.role === role), fr = ts.find((t) => t.quand === 'froid'), ch = ts.filter((t) => t.quand === 'chaud');
      const eng = (t) => (t.moteur != null ? ` (dont moteur ${nb(t.moteur, 0)})` : '');
      d(`toucher ${role} → ${ts[0].vers} : froid ${fr ? `${nb(fr.ms)} ms${eng(fr)}` : 'aucun'} ; chaud ${ch.length ? ch.map((t) => `${nb(t.ms)} ms${eng(t)}`).join(' / ') : 'aucun'}`);
    }
  } else if (r.ponts.length) d('toucher : aucun toucher abouti');
  else d('toucher : aucun pont [data-role^="pont-"] sur cette page');
  if (s.nImages) d(`glisser à froid (1er geste, juge le budget) : ${s.nImages} images avec mouvement, p50 ${nb(s.p50)} / p95 ${nb(s.p95)} ms ; intervalle p95 ${nb(s.interP95)} ms, ${s.ratees} image(s) ratée(s) (> ${VSYNC_TENU} ms) ; travail du fil seul p50 ${nb(s.coutP50)} / p95 ${nb(s.coutP95)} ms`);
  if (s.nImages) { const passes = [...new Set(r.images.map((i) => i.passe))]; if (passes.length > 1) d(`glisser à froid, passage par passage (le bruit de la machine s'y lit) : ${passes.map((q) => { const du = r.images.filter((i) => i.quand === 'froid' && i.passe === q).map((i) => i.duree); return `p50 ${nb(centile(du, 0.5))} / p95 ${nb(centile(du, 0.95))} ms`; }).join(' ; ')}`); }
  if (s.nChaud) d(`glisser à chaud (mêmes crans, caches remplis) : ${s.nChaud} images, p50 ${nb(s.chaudP50)} / p95 ${nb(s.chaudP95)} ms`);
  if (!r.frise) d('glisser : ni frise ni poignée sur cette page');
  for (const j of r.journal.filter((x, i, a) => a.findIndex((y) => y.quand === x.quand) === i)) d(`recalculs du moteur pendant le glisser ${j.quand} (mesures()) : ${j.recalculs} cache manqué (médiane ${nb(j.p50, 2)} ms, max ${nb(j.max, 2)} ms), ${j.cache} servis par le cache`);
  if (r.moteur.length) {
    const m = r.moteur.at(-1);
    const f = (x, dec = 1) => (x && x.erreur ? `erreur ${x.erreur}` : x ? `1er ${nb(x.premier, dec)}, médiane ${nb(x.p50 ?? x.premier, dec)}, max ${nb(x.max, dec)} ms` : '?');
    d(`moteur, entrées qui changent à chaque appel : lireBiere ${f(m.lireBiere, 2)} (16 recettes) ; suggerer ${f(m.suggerer)} (${m.candidats ?? '?'} candidats, 3 volumes) ; frise ${m.frise && !m.frise.erreur ? `${m.frise.crans} crans : 1er ${nb(m.frise.premier)}, max ${nb(m.frise.max)} ms` : '?'}`);
  } else d('moteur : window.__parcours non exposé, rien à lire (page témoin ou sans pont du moteur)');
  for (const pr of r.profils) {
    d(`profil, ${pr.quoi} : ${nb(pr.total, 0)} ms actifs échantillonnés dont ${nb(pr.natif, 0)} ms natifs (mise en page, peinture, ramasse-miettes)`);
    for (const h of pr.haut) d(`  ${nb(h.ms, 0)} ms ${h.nom} (${h.lieu}) ${h.extrait}`);
  }
  if (p && p.fichiers.length) d(`fichiers lus (une page reconstruite en cours de mesure change ces chiffres) : ${p.fichiers.join(' ; ')}`);
  if (p && p.externes.length) d(`poids : fichiers distants non comptés : ${p.externes.join(', ')}`);
  for (const n of r.notes) d(`note : ${n}`);
  for (const e of r.erreurs.slice(0, 3)) d(`note : ${e}`);
}

// ---------- Programme ----------
let tous = [];
try {
  console.log(`MESURE ×${cpu} sur ${os.cpus()[0] ? os.cpus()[0].model.trim() : 'processeur inconnu'} · 390 × 844 échelle 2, toucher · réseau distant coupé, cache coupé, contexte neuf par passage · ${avecBudget ? 'budgets ×4 (toucher ≤ 100 ms, glisser ≤ 16 / 33 ms, utilisable ≤ 2,5 s)' : 'sans budget (rapporté seulement)'}`);
  for (const id of ids) {
    const r = await mesurerPage(id);
    const s = synthese(r);
    imprimer(r, s);
    tous.push(s);
  }
} catch (e) {
  console.log(`PERF ECHEC : plantage : ${e.stack ?? e.message}`);
  await nav.close().catch(() => {});
  process.exit(2);
}
await nav.close().catch(() => {});
const deps = tous.flatMap((s) => s.depassements);
if (deps.length) {
  console.log(`PERF ECHEC (${deps.length} dépassement${deps.length > 1 ? 's' : ''}, ×${cpu})`);
  for (const d of deps) console.log(d);
  process.exit(1);
}
console.log(`PERF OK (${tous.length} page${tous.length > 1 ? 's' : ''}, ×${cpu}${avecBudget ? '' : ', sans budget'})`);
process.exit(0);
