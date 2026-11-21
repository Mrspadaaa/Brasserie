// Banc commun : sert le build, ouvre Chrome 390 tactile, fixture calendrier + carnet (simulées), mesure gestes et temps.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const PC = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const require = createRequire(path.join(PC, 'package.json'));
const puppeteer = require('puppeteer-core');
export const SP = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fixture() {
  const f = path.join(SP, 'fixture.json');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  return null;
}
export async function preparerFixture() {
  const { fixtureCalendrier } = await import(pathToFileURL(path.join(PC, 'scripts/parcours/fixtures/calendrier.mjs')).href);
  const { fixtureCarnet } = await import(pathToFileURL(path.join(PC, 'scripts/parcours/fixtures/carnet.mjs')).href);
  const j = new Date().toISOString().slice(0, 10);
  const vus = new Set(); const tout = [];
  for (const e of [...fixtureCalendrier(j).entrees, ...fixtureCarnet(PC, j).entrees]) { const k = `${e.name}:${e.id}`; if (!vus.has(k)) { vus.add(k); tout.push(e); } }
  fs.writeFileSync(path.join(SP, 'fixture.json'), JSON.stringify(tout));
  return tout.length;
}

export async function ouvrir({ throttle = 1, largeur = 390, hauteur = 844 } = {}) {
  if (!fixture()) await preparerFixture();
  const dir = path.join(SP, 'build');
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => { let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html'); r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r); });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await nav.newPage();
  await p.setViewport({ width: largeur, height: hauteur, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((j) => {
    if (!localStorage.getItem('parcours-calendrier:fixture')) localStorage.setItem('parcours-calendrier:fixture', j);
    window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch {}
    window.__mut = performance.now();
    const go = () => new MutationObserver(() => { window.__mut = performance.now(); }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    if (document.documentElement) go(); else document.addEventListener('readystatechange', go, { once: true });
  }, fixture());
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200))); p.on('console', (m) => { if (m.type() === 'error') erreurs.push('console: ' + m.text().slice(0, 200)); });
  const cdp = await p.createCDPSession();
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  const journal = []; let gestes = 0;
  const now = () => p.evaluate(() => performance.now());
  const b = {
    p, cdp, url, erreurs, journal, nav, srv,
    get gestes() { return gestes; }, raz() { gestes = 0; journal.length = 0; },
    async cap(nom) { await p.screenshot({ path: path.join(SP, 'cap', `${nom}.png`) }); },
    async calme(t0, max = 10000) { const d = Date.now(); await sleep(80); while (Date.now() - d < max) { const ok = await p.evaluate(() => performance.now() - window.__mut > 300); if (ok) break; await sleep(60); }
      return p.evaluate((t0) => { const l = window.__lt.filter(([s]) => s >= t0 - 5); return { ms: Math.max(0, Math.round(window.__mut - t0)), lt: Math.round(l.reduce((a, [, d]) => a + d, 0)), ltMax: Math.round(Math.max(0, ...l.map(([, d]) => d))) }; }, t0); },
    async trouver(txt, { prefixe = false, contient = false, dans = 'button,[role=button],[role=menuitem],[role=option],[role=tab],[role=switch],[role=checkbox],[role=radio],a,[data-chose-id],[data-barre],input,textarea,select,summary,label', i = 0 } = {}) {
      return p.evaluate((t, p0, c0, d, i) => { const n = (s) => String(s).replace(/\s+/g, ' ').trim();
        const e = [...document.querySelectorAll(d)].filter((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden') return false; const l = n(e.getAttribute('aria-label') ?? ''); const x = n(e.innerText ?? ''); const ph = e.getAttribute('placeholder') ?? ''; return c0 ? (l.includes(t) || x.includes(t) || ph.includes(t)) : p0 ? (l.startsWith(t) || x.startsWith(t) || ph.startsWith(t)) : (l === t || x === t || ph === t); })[i];
        if (!e) return null; let r = e.getBoundingClientRect(); if (r.top < 50 || r.bottom > innerHeight - 70 || r.left < 0 || r.right > innerWidth) { e.scrollIntoView({ block: 'center', inline: 'center' }); r = e.getBoundingClientRect(); }
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), l: r.left, r: r.right }; }, txt, prefixe, contient, dans, i);
    },
    async toucher(txt, o = {}) { const c = await b.trouver(txt, o); if (!c) throw new Error(`introuvable : « ${txt} »`); await sleep(150); const c2 = (await b.trouver(txt, o)) ?? c;
      const t0 = await now(); await p.touchscreen.tap(c2.x, c2.y); gestes++; const m = await b.calme(t0); journal.push({ geste: `toucher « ${txt.slice(0, 40)} »`, ...m, cible: `${c2.w}×${c2.h} y${Math.round(c2.y)}` }); return m; },
    async peutToucher(txt, o = {}) { if (!(await b.trouver(txt, o))) return false; await b.toucher(txt, o); return true; },
    async taperXY(x, y, nom) { const t0 = await now(); await p.touchscreen.tap(x, y); gestes++; const m = await b.calme(t0); journal.push({ geste: `toucher ${nom}`, ...m }); return m; },
    async ecrire(valeur) { const t0 = await now(); await p.keyboard.type(valeur, { delay: 25 }); gestes++; const m = await b.calme(t0); journal.push({ geste: `taper « ${valeur} »`, ...m }); return m; },
    async glisser([x0, y0], [x1, y1], { pas = 14, appuiLong = 0, nom = 'glisser' } = {}) { const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) }); await sleep(60 + appuiLong);
      for (let k = 1; k <= pas; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + ((x1 - x0) * k) / pas, y0 + ((y1 - y0) * k) / pas) }); await sleep(16); }
      await sleep(60); const tFin = await now(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); gestes++;
      const m = await b.calme(tFin); journal.push({ geste: nom, ...m }); return m; },
    async appuiLong(x, y, ms = 650) { const pt = [{ x: Math.round(x), y: Math.round(y), id: 1 }]; const t0 = await now(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt }); await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); gestes++; const m = await b.calme(t0); journal.push({ geste: 'appui long', ...m }); return m; },
    texte: () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')),
    dialogue: () => p.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog],[data-menu-periode],[role=menu]')].filter((e) => e.getBoundingClientRect().height > 0).pop(); return d ? d.innerText.replace(/\s+/g, ' ').slice(0, 900) : null; }),
    boutons: (sel = 'body') => p.evaluate((s) => [...(document.querySelector(s)?.querySelectorAll('button,[role=button],[role=tab],[role=switch],[role=menuitem],input,select,textarea,a') ?? [])].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map((e) => { const r = e.getBoundingClientRect(); return `${(e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || e.type || '').replace(/\s+/g, ' ').slice(0, 60)} [${Math.round(r.width)}×${Math.round(r.height)} @${Math.round(r.x)},${Math.round(r.y)}]`; }), sel),
    async versOnglet(nom) { await p.waitForSelector('nav button', { timeout: 90000 }); await b.toucher(nom, { dans: 'nav button' }); await sleep(300); },
    async versCalendrier() { await p.waitForSelector('nav button', { timeout: 90000 }); if (!(await p.$('[data-calendrier]'))) await b.toucher('Calendrier', { dans: 'nav button' }); await p.waitForSelector('[data-calendrier]', { timeout: 30000 }); await sleep(400); },
    async recharger() { await p.goto(url, { waitUntil: 'load' }); await sleep(800); await b.versCalendrier(); },
    async fermer() { for (let k = 0; k < 3; k++) { const f = (await b.trouver('Fermer')) ?? (await b.trouver('×')); if (!f) break; await p.touchscreen.tap(f.x, f.y); await sleep(400); } await p.keyboard.press('Escape'); await sleep(250); },
    async fin() { await nav.close(); srv.close(); }
  };
  return b;
}
