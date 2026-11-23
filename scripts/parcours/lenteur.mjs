// CAL-LENT (21.11) — « Il y a beaucoup de lenteur sur les actions du calendrier... »
// Le Calendrier joué au doigt sur un build MINIFIÉ (React de production ; seul `?dev-local` est ouvert, comme pour calendrier.mjs),
// 390×844 tactile, processeur ralenti ×4 (Emulation.setCPUThrottlingRate), avec la fixture du parcours Calendrier.
// Pour chaque action : INP (Event Timing : la plus longue interaction, du geste à l'image suivante) et tâches longues (longtask, LoAF),
// plus une trace de performance (trace-<action>.json) et un profil CPU (fonctions les plus coûteuses, utile sur un build --non-minifie).
//
//   node scripts/parcours/lenteur.mjs <dossier> [--build <dossier>] [--ref <tag>] [--non-minifie] [--sans-trace] [--cpu <n>]
//   Sortie : « LENTEUR CALENDRIER OK » (code 0) ou « LENTEUR CALENDRIER ECHEC (n) » + la liste (code 1).
//   Règle : INP ≤ 200 ms pour chaque action ; aucune tâche longue > 100 ms pendant un glisser (frise, barre, lecture de la courbe).
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
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const drap = (n) => args.includes(`--${n}`);
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--cpu'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-lenteur'));
fs.mkdirSync(sortie, { recursive: true });
const CPU = Number(opt('cpu') ?? 4);
const INP_MAX = 200, TACHE_MAX = 100;
const sleep = (ms) => new Promise((o) => setTimeout(o, ms));
const echecs = [], lignes = [];
const echec = (n, d) => echecs.push(`${n} : ${d}`);

function construire(racine, dehors) {
  const extra = drap('non-minifie') ? ['--minify', 'false'] : [];
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error', ...extra],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}

let dossierBuild = opt('build'); const aNettoyer = []; let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'lenteur-build-')); aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = fs.mkdtempSync(path.join(os.tmpdir(), 'lenteur-ref-')); fs.rmSync(copie, { recursive: true, force: true });
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree : ${g.stderr.slice(0, 300)}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      /* la configuration Firebase publique (.env non suivis) : sans elle, l'application ne démarre pas */
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `du tag ${opt('ref')}` : "de l'arbre de travail"}${drap('non-minifie') ? ' (non minifié)' : ''} …`);
    construire(racine, dossierBuild);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 500)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) fs.rmSync(d, { recursive: true, force: true });
}
for (const l of lignes) console.log(l);
fs.writeFileSync(path.join(sortie, 'mesures.txt'), lignes.join('\n') + '\n' + echecs.join('\n'));
if (echecs.length) { console.log(`LENTEUR CALENDRIER ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('LENTEUR CALENDRIER OK');

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
  try {
    const p = await nav.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const fx = fixtureCalendrier(new Date().toISOString().slice(0, 10));
    await p.evaluateOnNewDocument((j) => { if (!localStorage.getItem('parcours-calendrier:fixture')) localStorage.setItem('parcours-calendrier:fixture', j); }, JSON.stringify(fx.entrees));
    // Les mesures du navigateur, prises dès le chargement.
    await p.evaluateOnNewDocument(() => {
      const P = (window.__perf = { ev: [], lt: [], lf: [] });
      const obs = (type, f, o = {}) => { try { new PerformanceObserver((l) => l.getEntries().forEach(f)).observe({ type, buffered: true, ...o }); } catch { /* type absent */ } };
      obs('event', (e) => { if (e.interactionId) P.ev.push({ id: e.interactionId, n: e.name, t: e.startTime, d: e.duration, pr: e.processingEnd - e.processingStart, att: e.processingStart - e.startTime }); }, { durationThreshold: 16 });
      obs('longtask', (e) => P.lt.push({ t: e.startTime, d: e.duration }));
      obs('long-animation-frame', (e) => P.lf.push({ t: e.startTime, d: e.duration, bl: e.blockingDuration, sc: (e.scripts ?? []).map((s) => ({ f: s.sourceFunctionName, u: (s.sourceURL ?? '').split('/').pop(), i: s.invoker, d: Math.round(s.duration) })).sort((a, b) => b.d - a.d).slice(0, 3) }));
    });
    const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));
    const cdp = await p.createCDPSession();
    await cdp.send('Profiler.enable');
    const cap = (nom) => p.screenshot({ path: path.join(sortie, `${nom}.png`) });
    const point = (sel, i = 0) => p.evaluate((s, i) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().width > 0)[i]; if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; }, sel, i);
    const parTexte = (t, prefixe = false) => p.evaluate((t, p0) => {
      const n = (s) => String(s).replace(/\s+/g, ' ').trim();
      const e = [...document.querySelectorAll('button,[role=button],[role=menuitem],[data-chose-id]')].find((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0)) return false; const l = e.getAttribute('aria-label') ?? ''; const x = n(e.innerText ?? ''); return p0 ? l.startsWith(t) || x.startsWith(t) : l === t || x === t; });
      if (!e) return null; let r = e.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 70) { e.scrollIntoView({ block: 'center' }); r = e.getBoundingClientRect(); } return [r.x + r.width / 2, r.y + r.height / 2];
    }, t, prefixe);
    const tap = async ([x, y]) => { await p.touchscreen.tap(x, y); };
    async function toucher(t, prefixe = false) { const c = await parTexte(t, prefixe); if (!c) throw new Error(`introuvable : « ${t} »`); await sleep(100); await tap(await parTexte(t, prefixe)); await sleep(700); }
    async function glisser([x0, y0], [x1, y1], { pas = 20, appui = 60 } = {}) {
      const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) }); await sleep(appui);
      for (let k = 1; k <= pas; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + ((x1 - x0) * k) / pas, y0 + ((y1 - y0) * k) / pas) }); await sleep(16); }
      await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    const menuDuree = async (nom) => { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await tap(m); await sleep(700); await toucher(nom); await sleep(500); };

    // Une action mesurée : fenêtre de temps, trace, profil ; puis lecture des entrées de cette fenêtre.
    async function mesurer(nom, glisse, geste) {
      await sleep(400);
      const t0 = await p.evaluate(() => performance.now());
      if (!drap('sans-trace')) await p.tracing.start({ path: path.join(sortie, `trace-${nom}.json`), screenshots: false, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing', 'loading', 'latencyInfo', ...(drap('selecteurs') ? ['disabled-by-default-blink.debug'] : []), ...(drap('invalidations') ? ['disabled-by-default-devtools.timeline.invalidationTracking', 'disabled-by-default-devtools.timeline.stack'] : [])] });
      await cdp.send('Profiler.start');
      let erreur = null; try { await geste(); } catch (e) { erreur = String(e.message ?? e).slice(0, 160); }
      await sleep(1200);
      const { profile } = await cdp.send('Profiler.stop');
      if (!drap('sans-trace')) await p.tracing.stop();
      const t1 = await p.evaluate(() => performance.now());
      const m = await p.evaluate((t0, t1) => {
        const P = window.__perf, dans = (e) => e.t >= t0 && e.t <= t1;
        const parId = new Map(); for (const e of P.ev.filter(dans)) { const v = parId.get(e.id); if (!v || e.d > v.d) parId.set(e.id, e); }
        const inter = [...parId.values()].sort((a, b) => b.d - a.d);
        return { inp: inter[0]?.d ?? 0, pire: inter[0] ?? null, n: inter.length, lt: P.lt.filter(dans).map((e) => Math.round(e.d)).sort((a, b) => b - a), lf: P.lf.filter(dans).sort((a, b) => b.d - a.d).slice(0, 2) };
      }, t0, t1);
      // Profil CPU : temps propre par fonction (nom, fichier:ligne).
      const pas = new Map(); const dt = profile.timeDeltas; const parNoeud = new Map();
      profile.samples.forEach((id, i) => parNoeud.set(id, (parNoeud.get(id) ?? 0) + (dt[i] ?? 0)));
      for (const n of profile.nodes) { const us = parNoeud.get(n.id) ?? 0; if (!us) continue; const f = n.callFrame; const cle = `${f.functionName || '(anonyme)'} ${(f.url ?? '').split('/').pop()}:${f.lineNumber + 1}`; pas.set(cle, (pas.get(cle) ?? 0) + us); }
      // Les natifs (getBoundingClientRect, focus…) : leur temps propre revient à la fonction JS qui les appelle (mise en page forcée).
      const parent = new Map(); for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
      const noeud = new Map(profile.nodes.map((n) => [n.id, n])); const appelants = new Map();
      for (const n of profile.nodes) {
        const us = parNoeud.get(n.id) ?? 0; if (!us || n.callFrame.url) continue; const nat = n.callFrame.functionName; if (!nat || /^\(/.test(nat)) continue;
        let q = noeud.get(parent.get(n.id)); const pile = [];
        while (q && pile.length < 3) { if (q.callFrame.url) pile.push(`${q.callFrame.functionName || '(anonyme)'}:${q.callFrame.lineNumber + 1}`); q = noeud.get(parent.get(q.id)); }
        const cle = `${nat} ← ${pile.join(' ← ')}`; appelants.set(cle, (appelants.get(cle) ?? 0) + us);
      }
      const topNat = [...appelants.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, us]) => `${k} ${Math.round(us / 1000)} ms`);
      const top = [...pas.entries()].filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, us]) => `${k} ${Math.round(us / 1000)} ms`);
      fs.writeFileSync(path.join(sortie, `profil-${nom}.cpuprofile`), JSON.stringify(profile));
      const tacheMax = m.lt[0] ?? 0;
      const bon = !erreur && m.n > 0 && m.inp <= INP_MAX && (!glisse || tacheMax <= TACHE_MAX);
      lignes.push(`${bon ? ' ok ' : ' KO '} ${nom.padEnd(18)} INP ${String(Math.round(m.inp)).padStart(4)} ms (${m.n} interaction(s)${m.pire ? `, pire « ${m.pire.n} » : attente ${Math.round(m.pire.att)}, traitement ${Math.round(m.pire.pr)}` : ''}) ; tâches longues ${m.lt.length} (max ${tacheMax} ms${m.lt.length > 1 ? ` ; ${m.lt.slice(0, 6).join(', ')}` : ''})${erreur ? ` ; ERREUR ${erreur}` : ''}`);
      for (const f of m.lf) lignes.push(`        LoAF ${Math.round(f.d)} ms (bloquant ${Math.round(f.bl)}) : ${f.sc.map((s) => `${s.i} → ${s.f || '?'} ${s.u} ${s.d} ms`).join(' | ')}`);
      lignes.push(`        profil : ${top.join(' ; ')}`);
      if (topNat.length) lignes.push(`        natifs : ${topNat.join(' ; ')}`);
      if (erreur) echec(nom, erreur);
      else if (m.n === 0) echec(nom, 'aucune interaction mesurée (le geste n’a rien touché)');
      else {
        if (m.inp > INP_MAX) echec(nom, `INP ${Math.round(m.inp)} ms > ${INP_MAX}`);
        if (glisse && tacheMax > TACHE_MAX) echec(nom, `tâche longue de ${tacheMax} ms pendant le glisser (> ${TACHE_MAX})`);
      }
      await cap(`lent-${nom}`);
    }

    await p.goto(url, { waitUntil: 'load' });
    await p.waitForSelector('nav button', { timeout: 90000 });
    if (!(await p.$('[data-calendrier]'))) await toucher('Calendrier');
    await p.waitForSelector('[data-calendrier]', { timeout: 30000 });
    await menuDuree('3 mois');
    await sleep(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    lignes.push(`390×844 tactile, processeur ×${CPU}, build ${drap('non-minifie') ? 'non minifié' : 'minifié'}${opt('ref') ? ` du tag ${opt('ref')}` : opt('build') ? ` ${opt('build')}` : " de l'arbre de travail"}`);

    // 1. toucher une semaine de la bande (la lecture de la semaine s'ouvre)
    await mesurer('semaine', false, async () => { const c = await point('[data-bande-semaines] [data-semaine]', 4); if (!c) throw new Error('bande des semaines introuvable'); await tap(c); });
    await p.keyboard.press('Escape'); await sleep(500);
    // 2. glisser la frise du haut : la poignée de début, d'un quart de la largeur
    await mesurer('frise', true, async () => {
      const poi = await point('[aria-label^="Poignée de début"]'); const fr = await p.evaluate(() => document.querySelector('[data-ent-periode]')?.getBoundingClientRect().width ?? 0);
      if (!poi || !fr) throw new Error('poignée de début introuvable'); await glisser([poi[0], poi[1]], [poi[0] - fr / 4, poi[1]]);
    });
    await menuDuree('3 mois'); await sleep(500);
    // 3. glisser une barre de 4 semaines
    await mesurer('barre', true, async () => {
      const col = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; return b.length > 1 ? b[1].getBoundingClientRect().x - b[0].getBoundingClientRect().x : 26; });
      const c = await point('[aria-label^="Hefe,"]'); if (!c) throw new Error('barre « Hefe » introuvable');
      const x = c[0] - Math.min(c[2] / 2 - 6, 10); await glisser([x, c[1]], [x + 4 * col, c[1]]);
    });
    if (await parTexte('Annuler')) { await toucher('Annuler'); }
    // 4. la courbe : lire au doigt (appui puis glisser le long de la courbe), puis la cacher
    await mesurer('courbe-lecture', true, async () => {
      const b = await p.evaluate(() => { window.scrollTo(0, 0); const s = document.querySelector('[data-calendrier-entete] .ent-cb'); const r = s?.getBoundingClientRect(); return r ? [r.x, r.y, r.width, r.height] : null; });
      if (!b) throw new Error('courbe introuvable'); const y = b[1] + b[3] * 0.6; await glisser([b[0] + b[2] * 0.2, y], [b[0] + b[2] * 0.75, y], { appui: 450, pas: 24 });
    });
    await p.keyboard.press('Escape'); await sleep(500);
    await mesurer('courbe-cacher', false, async () => { const c = await point('[data-ent-cacher]'); if (!c) throw new Error('« Cacher la courbe » introuvable'); await tap(c); });
    await sleep(300); { const c = await point('[data-ent-cacher]'); if (c) { await tap(c); await sleep(700); } }
    // 5. ouvrir un événement, Modifier, la semaine d'avant, Enregistrer. Le glisser de la frise (2) laisse la période à « 3 sem. » : « Marché de Noël »
    // sort de la fenêtre et les quatre dernières actions échouaient pour cette cause (22.11) ; on revient à 3 mois, puis on le cherche sans l'inventer.
    await menuDuree('3 mois'); await sleep(500);
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-chose-id],button,[role=button]')].find((x) => (x.getAttribute('aria-label') ?? '').startsWith('Marché de Noël,')); e?.scrollIntoView({ block: 'center', inline: 'center' }); });
    await mesurer('evenement-ouvrir', false, async () => { await toucher('Marché de Noël,', true); });
    await mesurer('evenement-modifier', false, async () => { await toucher('Modifier'); });
    await mesurer('evenement-semaine', false, async () => {
      const c = await p.evaluate(() => {
        const puces = [...document.querySelectorAll('[role=dialog] button')].map((b) => ({ b, m: /^S(\d+)\s+(\d+)$/.exec(b.innerText.replace(/\s+/g, ' ').trim()) })).filter((x) => x.m);
        const i = puces.findIndex((x) => ['aria-pressed', 'aria-checked', 'aria-selected'].some((a) => x.b.getAttribute(a) === 'true'));
        if (i < 1) return null; puces[i - 1].b.scrollIntoView({ inline: 'center', block: 'nearest' }); const r = puces[i - 1].b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
      });
      if (!c) throw new Error('puce de la semaine précédente introuvable'); await tap(c);
    });
    await mesurer('evenement-enregistrer', false, async () => { await toucher('Enregistrer'); });
    if (erreurs.length) echec('erreurs de la page', erreurs.slice(0, 3).join(' | '));
  } finally { await nav.close(); srv.close(); }
}
