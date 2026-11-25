// MESURE CALENDRIER (cal-74, 25.11) — avant / après, sur un build local avec la fixture du parcours Calendrier.
// Trois gestes, 390×844 tactile (CDP Input.dispatchTouchEvent), dans MON onglet du Chrome de débug 9222 (jamais browser.close()) :
//   OUVRIR : toucher « Calendrier » depuis Bord → tâche longue (longtask) et durée jusqu'au cadre visible ;
//   RELACHER : glisser une barre de 4 colonnes, relâcher → image la plus longue et tâche longue autour du relâcher ;
//   BORD : barre tenue 2 s au bord droit → intervalle des images (rAF) : médiane, p90, max, part ≤ 17 ms, colonnes/s.
//
//   node scripts/mesure-calendrier.mjs <dossier> [--build <dossier>] [--ref <tag>] [--non-minifie] [--cpu <n>] [--profil] [--n <essais>] [--json <fichier>]
//   --ref HEAD : construit le dernier commit dans une copie (git worktree dans os.tmpdir(), retirée à la fin) → le « avant ».
//   --profil   : profil CPU V8 de chaque geste (fonctions les plus coûteuses) ; utile avec --non-minifie.
//   Sortie : un tableau par geste ; le JSON contient les mesures brutes.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'parcours', 'fixtures', 'calendrier.mjs')).href);
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const drap = (n) => args.includes(`--${n}`);
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--cpu', '--n', '--json', '--css', '--sans', '--vue'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'mesure-calendrier'));
fs.mkdirSync(sortie, { recursive: true });
const CPU = Number(opt('cpu') ?? 1);
const ESSAIS = Number(opt('n') ?? 3);
const sleep = (ms) => new Promise((o) => setTimeout(o, ms));
const mediane = (t) => { const s = [...t].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };
const pct = (t, q) => { const s = [...t].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };

function construire(racine, dehors) {
  const extra = drap('non-minifie') ? ['--minify', 'false'] : [];
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'mesure-calendrier.vite.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error', ...extra],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}

let dossierBuild = opt('build'); const aNettoyer = []; let copie = null; const resultat = { cpu: CPU, essais: ESSAIS, build: opt('ref') ?? opt('build') ?? 'arbre de travail', ouvrir: [], relacher: [], bord: [] };
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'mesure-build-')); aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = fs.mkdtempSync(path.join(os.tmpdir(), 'mesure-ref-')); fs.rmSync(copie, { recursive: true, force: true });
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree : ${g.stderr.slice(0, 300)}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^\.env(\..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `de ${opt('ref')}` : "de l'arbre de travail"}${drap('non-minifie') ? ' (non minifié)' : ''} …`);
    construire(racine, dossierBuild);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { console.log(`ECHEC : ${String(e.stack ?? e).slice(0, 800)}`); process.exitCode = 1; }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) fs.rmSync(d, { recursive: true, force: true });
}
rapporter();

function rapporter() {
  const L = [];
  L.push(`Build : ${resultat.build} ; processeur ×${CPU} ; ${ESSAIS} essais`);
  L.push('', '| geste | essai | mesure |', '|---|---|---|');
  resultat.ouvrir.forEach((o, i) => L.push(`| OUVRIR | ${i + 1} | ${Math.round(o.duree)} ms jusqu'au cadre ; tâche longue max ${Math.round(o.tache)} ms (${o.taches.length} tâche(s)) |`));
  resultat.relacher.forEach((o, i) => L.push(`| RELACHER | ${i + 1} | ${Math.round(o.duree)} ms (lâcher → image suivante) ; image max ${Math.round(o.imageMax)} ms ; tâche longue max ${Math.round(o.tache)} ms |`));
  resultat.bord.forEach((o, i) => L.push(`| BORD | ${i + 1} | image médiane ${o.mediane.toFixed(1)} ms ; p90 ${o.p90.toFixed(1)} ; max ${Math.round(o.max)} ; ≤ 17 ms ${o.part17} % ; ≤ 50 ms ${o.part50} % ; ${o.images} images ; ${o.rendus ?? '?'} mises à jour du DOM ; défilement ${o.semParSec} sem./s |`));
  console.log(L.join('\n'));
  const r = (t, f) => (t.length ? mediane(t.map(f)) : NaN);
  const syn = {
    ouvrirMs: r(resultat.ouvrir, (o) => o.duree), ouvrirTacheMs: r(resultat.ouvrir, (o) => o.tache),
    relacherMs: r(resultat.relacher, (o) => o.duree), relacherImageMax: r(resultat.relacher, (o) => o.imageMax),
    bordMedianeMs: r(resultat.bord, (o) => o.mediane), bordMoyenneMs: r(resultat.bord, (o) => o.moyenne), bordMaxMs: r(resultat.bord, (o) => o.max), bordPart17: r(resultat.bord, (o) => o.part17), bordPart50: r(resultat.bord, (o) => o.part50), bordSemParSec: r(resultat.bord, (o) => o.semParSec)
  };
  console.log('\nSYNTHESE (médiane des essais) : ' + JSON.stringify(Object.fromEntries(Object.entries(syn).map(([k, v]) => [k, Number.isNaN(v) ? null : Math.round(v * 10) / 10]))));
  resultat.synthese = syn;
  if (opt('json')) fs.writeFileSync(path.resolve(opt('json')), JSON.stringify(resultat, null, 1));
  fs.writeFileSync(path.join(sortie, 'mesures.txt'), L.join('\n'));
}

async function jouer(dir) {
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
  });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
  /* MON onglet dans le Chrome de débug : jamais browser.close() ; seul mon onglet se ferme */
  const nav = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const p = await nav.newPage();
  try {
    /* --vue 1280x800 : une autre taille d'écran (cal-75 : capture du geste à 1280) ; par défaut le téléphone 390×844 */
    const [VW, VH] = (opt('vue') ?? '390x844').split('x').map(Number);
    await p.setViewport({ width: VW, height: VH, isMobile: VW < 700, hasTouch: true, deviceScaleFactor: 1 });
    const fx = fixtureCalendrier(new Date().toISOString().slice(0, 10));
    /* à chaque essai on repart de la fixture neuve (cal-75) : le glisser précédent a déplacé « Hefe », l'essai suivant ne la retrouvait plus */
    await p.evaluateOnNewDocument((j) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('parcours-calendrier:fixture', j); }, JSON.stringify(fx.entrees));
    await p.evaluateOnNewDocument(() => {
      const P = (window.__perf = { lt: [], fr: [], enregistre: false });
      try { new PerformanceObserver((l) => l.getEntries().forEach((e) => P.lt.push({ t: e.startTime, d: e.duration }))).observe({ type: 'longtask', buffered: true }); } catch { /* absent */ }
      let dernier = performance.now();
      const boucle = (t) => { P.fr.push({ t, d: t - dernier }); dernier = t; requestAnimationFrame(boucle); };
      requestAnimationFrame(boucle);
      /* mises à jour du DOM (une par tâche de commit React environ), pour dire combien de rendus par image */
      P.mu = []; document.addEventListener('DOMContentLoaded', () => new MutationObserver(() => P.mu.push(performance.now())).observe(document.documentElement, { subtree: true, childList: true, attributes: true }));
    });
    const cdp = await p.createCDPSession();
    await cdp.send('Profiler.enable');
    const cap = (nom) => p.screenshot({ path: path.join(sortie, `${nom}.png`) });
    const parTexte = (t, prefixe = false) => p.evaluate((t, p0) => {
      const n = (s) => String(s).replace(/\s+/g, ' ').trim();
      const e = [...document.querySelectorAll('button,[role=button],[role=menuitem],[data-chose-id]')].find((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0)) return false; const l = e.getAttribute('aria-label') ?? ''; const x = n(e.innerText ?? ''); return p0 ? l.startsWith(t) || x.startsWith(t) : l === t || x === t; });
      if (!e) return null; let r = e.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 70) { e.scrollIntoView({ block: 'center' }); r = e.getBoundingClientRect(); } return [r.x + r.width / 2, r.y + r.height / 2];
    }, t, prefixe);
    const tap = async ([x, y]) => { await p.touchscreen.tap(x, y); };
    const toucher = async (t, prefixe = false) => { const c = await parTexte(t, prefixe); if (!c) throw new Error(`introuvable : « ${t} »`); await sleep(100); await tap(await parTexte(t, prefixe)); await sleep(700); };
    const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
    const dep = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : pt(x, y) });
    const point = (sel, i = 0) => p.evaluate((s, i) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().width > 0)[i]; if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; }, sel, i);
    const menuDuree = async (nom) => { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await tap(m); await sleep(700); await toucher(nom); await sleep(500); };
    /* --trace (cal-75) : où va le temps hors JavaScript (mise en page, recalcul des styles, peinture) : trace Chrome « devtools.timeline », durées par genre */
    const tracer = async (nom, f) => {
      const fichier = path.join(sortie, `trace-${nom}.json`);
      await p.tracing.start({ path: fichier, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking'] }); const r = await f(); await p.tracing.stop();
      const ev = JSON.parse(fs.readFileSync(fichier, 'utf8')).traceEvents ?? [];
      const par = new Map(); const compte = new Map();
      for (const e of ev) if (e.ph === 'X' && e.dur && ['Layout', 'UpdateLayoutTree', 'Paint', 'PrePaint', 'Layerize', 'Commit', 'FunctionCall', 'EvaluateScript', 'RunTask', 'HitTest', 'IntersectionObserverController::computeIntersections', 'RunMicrotasks', 'FireAnimationFrame', 'TimerFire', 'EventDispatch', 'ParseHTML', 'UpdateLayer', 'CompositeLayers', 'RasterTask', 'GPUTask'].includes(e.name)) { par.set(e.name, (par.get(e.name) ?? 0) + e.dur); compte.set(e.name, (compte.get(e.name) ?? 0) + 1); }
      const lay = ev.filter((e) => e.name === 'Layout' && e.ph === 'X').map((e) => Math.round(e.dur / 1000)).sort((a, b) => b - a).slice(0, 8);
      console.log(`  trace ${nom} : ${[...par.entries()].sort((a, b) => b[1] - a[1]).map(([k, us]) => `${k} ${Math.round(us / 1000)} ms ×${compte.get(k)}`).join(' ; ')} ; plus longues mises en page : ${lay.join(', ')} ms`);
      const nb = ev.filter((e) => e.name === 'Layout' && e.ph === 'X' && e.args?.beginData).map((e) => e.args.beginData.dirtyObjects + '/' + e.args.beginData.totalObjects).slice(0, 6);
      if (nb.length) console.log(`  objets sales / total (premières mises en page) : ${nb.join(' ; ')}`);
      return r;
    };
    const profiler = async (nom, f) => {
      if (drap('trace')) return tracer(nom, f);
      if (!drap('profil')) return f();
      await cdp.send('Profiler.start'); const r = await f(); const { profile } = await cdp.send('Profiler.stop');
      fs.writeFileSync(path.join(sortie, `profil-${nom}.cpuprofile`), JSON.stringify(profile));
      const dt = profile.timeDeltas, parN = new Map(); profile.samples.forEach((id, i) => parN.set(id, (parN.get(id) ?? 0) + (dt[i] ?? 0)));
      const parF = new Map();
      for (const n of profile.nodes) { const us = parN.get(n.id) ?? 0; if (!us) continue; const f = n.callFrame; const cle = `${f.functionName || '(anonyme)'} ${(f.url ?? '').split('/').pop()}:${f.lineNumber + 1}`; parF.set(cle, (parF.get(cle) ?? 0) + us); }
      const top = [...parF.entries()].filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, us]) => `${k} ${Math.round(us / 1000)} ms`);
      console.log(`  profil ${nom} : ${top.join(' ; ')}`);
      return r;
    };
    const fenetre = (t0, t1) => p.evaluate((t0, t1) => ({ mu: window.__perf.mu.filter((t) => t >= t0 && t <= t1).length, lt: window.__perf.lt.filter((e) => e.t >= t0 && e.t <= t1).map((e) => e.d), fr: window.__perf.fr.filter((e) => e.t >= t0 && e.t <= t1).map((e) => e.d) }), t0, t1);
    const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    /* le jour dit par la bulle du geste (« S15 · 13 avr. · lâcher ici ») : jour de l'année, ou null */
    const jourBulle = async () => {
      const s = await p.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.children.length === 0 && /lâcher ici/.test(x.textContent ?? '')); return e[0]?.textContent ?? null; });
      const m = s && /(\d{1,2})\s*(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/.exec(s);
      return m ? [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][MOIS.indexOf(m[2])] + Number(m[1]) : null;
    };
    const horloge = () => p.evaluate(() => performance.now());

    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    for (let essai = 0; essai < ESSAIS; essai++) {
      // OUVRIR : page rechargée (à froid), sur Bord, puis toucher « Calendrier ».
      await p.goto(url, { waitUntil: 'load' });
      /* --css "<règles>" (cal-75, expérience) : ajoute une feuille de style à la page, pour mesurer ce qu'une règle coûte */
      if (opt('css')) await p.evaluate((c) => { const s = document.createElement('style'); s.textContent = c; document.head.appendChild(s); }, opt('css'));
      /* --sans-has (cal-75, expérience) : retire les règles CSS à :has() de la page, pour mesurer ce qu'elles coûtent */
      /* --sans "<regex>" : retire de la page les règles CSS dont le sélecteur correspond (ex. --sans "aria-label") */
      if (drap('sans-has') || opt('sans')) await p.evaluate((re) => {
        const net = (cont) => { const l = cont.cssRules; for (let i = l.length - 1; i >= 0; i--) { const r = l[i]; if (r.cssRules && !r.selectorText) net(r); else if (new RegExp(re).test(r.selectorText ?? '')) cont.deleteRule(i); } };
        for (const s of document.styleSheets) { try { net(s); } catch { /* feuille externe */ } }
      }, opt('sans') ?? ':has\\(');
      await p.waitForSelector('nav button', { timeout: 90000 });
      await sleep(1500);
      if (await p.$('[data-calendrier]')) { await toucher('Bord'); await sleep(1200); }
      await sleep(600);
      const cb = await parTexte('Calendrier'); if (!cb) throw new Error('bouton « Calendrier » introuvable');
      const t0 = await horloge();
      await profiler('ouvrir', async () => {
        await tap(cb);
        await p.waitForSelector('[data-calendrier] [data-chose-id], [data-calendrier] [aria-label]', { timeout: 30000 });
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      });
      const t1 = await horloge();
      const w = await fenetre(t0, t1);
      resultat.ouvrir.push({ duree: t1 - t0, tache: Math.max(0, ...w.lt), taches: w.lt.map(Math.round) });
      if (essai === 0) await cap('ouvert');
      await sleep(1200);

      // 6 sem. puis une barre à glisser (Hefe : barre de l'événement fixture)
      await menuDuree('6 sem.').catch(async () => { await menuDuree('3 mois'); });
      await sleep(800);
      await cap(`avant-glisser-${essai}`);
      const c = await point('[aria-label^="Hefe,"]');
      if (!c) throw new Error('barre « Hefe » introuvable');
      const col = await p.evaluate(() => { const g = document.querySelector('[data-bande-semaines] [data-semaine]'); return g ? g.getBoundingClientRect().width : 50; });
      const x0 = c[0], y0 = c[1];

      // RELACHER : glisser de 4 colonnes en pas de 16 ms, relâcher, mesurer l'image suivante et les tâches longues
      await dep('touchStart', x0, y0); await sleep(450);
      for (let k = 1; k <= 12; k++) { await dep('touchMove', x0 + (4 * col * k) / 12, y0); await sleep(16); }
      await sleep(250);
      if (essai === 0) await cap('pendant-relacher');
      const tL = await horloge();
      await profiler('relacher', async () => {
        await dep('touchEnd', 0, 0);
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        await sleep(500);
      });
      const tF = await horloge();
      const w2 = await fenetre(tL, tF);
      resultat.relacher.push({ duree: Math.max(0, ...w2.fr.slice(0, 4)), imageMax: Math.max(0, ...w2.fr), tache: Math.max(0, ...w2.lt) });
      if (essai === 0) await cap('apres-relacher');
      await sleep(300);
      if (await parTexte('Annuler')) await toucher('Annuler');

      // BORD : tenir la barre à 24 px du bord droit pendant 2 s
      const c2 = await point('[aria-label^="Hefe,"]');
      if (c2) {
        const bords = await p.evaluate(() => innerWidth);
        await dep('touchStart', c2[0], c2[1]); await sleep(450);
        const cible = bords - 24;
        for (let k = 1; k <= 10; k++) { await dep('touchMove', c2[0] + ((cible - c2[0]) * k) / 10, c2[1]); await sleep(16); }
        const jAvant = await jourBulle();
        const tB0 = await horloge();
        await profiler('bord', async () => { await sleep(2000); });
        const tB1 = await horloge();
        const w3 = await fenetre(tB0, tB1);
        const jApres = await jourBulle();
        await cap(`bord-${essai}`);
        await dep('touchEnd', 0, 0); await sleep(600);
        if (await parTexte('Annuler')) await toucher('Annuler');
        const f = w3.fr; const dureeS = (tB1 - tB0) / 1000;
        resultat.bord.push({ mediane: mediane(f), moyenne: f.length ? f.reduce((a, b) => a + b, 0) / f.length : 0, p90: pct(f, 0.9), max: Math.max(0, ...f), part17: f.length ? Math.round((100 * f.filter((d) => d <= 17).length) / f.length) : 0, part50: f.length ? Math.round((100 * f.filter((d) => d <= 50).length) / f.length) : 0, images: f.length, semParSec: jAvant == null || jApres == null ? null : Math.round((10 * ((((jApres - jAvant) % 365) + 365) % 365)) / 7 / dureeS) / 10, taches: w3.lt.map(Math.round), rendus: w3.mu });
      } else console.log('  barre introuvable avant le bord');
    }
  } finally { await p.close().catch(() => {}); nav.disconnect(); srv.close(); }
}
