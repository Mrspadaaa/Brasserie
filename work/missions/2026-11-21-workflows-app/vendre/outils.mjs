import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import { createRequire } from 'node:module';
import { fixtureVendre } from './fixture.mjs';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/package.json');
const puppeteer = require('puppeteer-core');
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const BUILD = 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/build-vendre';
export async function ouvrir(sortie, { largeur = 390, hauteur = 844, cpu = 1, dir = BUILD } = {}) {
  fs.mkdirSync(sortie, { recursive: true });
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => { let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html'); r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r); });
  await new Promise(o => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await nav.newPage();
  const tactile = largeur < 800;
  await p.setViewport({ width: largeur, height: hauteur, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
  const auj = new Date().toISOString().slice(0, 10);
  await p.evaluateOnNewDocument(j => {
    if (!localStorage.getItem('parcours-calendrier:fixture')) localStorage.setItem('parcours-calendrier:fixture', j);
    window.__inp = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.duration > window.__inp) window.__inp = e.duration; }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch { /* */ }
  }, JSON.stringify(fixtureVendre(auj)));
  const err = []; p.on('pageerror', e => err.push(String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text().slice(0, 200)); });
  const cdp = await p.createCDPSession(); if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const log = []; let gestes = 0;
  const cap = async n => { await p.screenshot({ path: path.join(sortie, `${n}.png`) }); log.push(`[cap] ${n}`); };
  const trouve = (txt, i = 0, pref = true, dans = 'button,[role=button],[role=menuitem],[role=option],[role=tab],a,[data-chose-id],li,label,summary') => p.evaluate((t, i, pref, d) => {
    const n = s => String(s ?? '').replace(/\s+/g, ' ').trim();
    const ok = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const m = [...document.querySelectorAll(d)].filter(e => ok(e) && (() => { const l = n(e.getAttribute('aria-label')), x = n(e.innerText); return pref ? (l.startsWith(t) || x.startsWith(t)) : (l === t || x === t); })());
    const e = m.at(i); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, Math.round(r.width), Math.round(r.height)];
  }, txt, i, pref, dans);
  async function tap(txt, o = {}) {
    const c = await trouve(txt, o.i ?? 0, o.pref ?? true, o.dans); if (!c) { log.push(`[KO] introuvable « ${txt} »`); throw new Error(`introuvable « ${txt} »`); }
    await sleep(80); const c2 = await trouve(txt, o.i ?? 0, o.pref ?? true, o.dans);
    await p.evaluate(() => { window.__inp = 0; });
    if (tactile) await p.touchscreen.tap(c2[0], c2[1]); else await p.mouse.click(c2[0], c2[1]);
    gestes++; await sleep(o.att ?? 700);
    const inp = await p.evaluate(() => Math.round(window.__inp));
    log.push(`[g${gestes}] « ${txt} » ${c2[2]}×${c2[3]} px · INP ${inp} ms`);
  }
  async function taper(sel, val) { const e = await p.$(sel); if (!e) { log.push(`[KO] champ ${sel}`); throw new Error('champ ' + sel); } await e.click({ count: 3 }); await e.type(String(val)); gestes++; log.push(`[g${gestes}] saisie ${sel} = ${val}`); await sleep(300); }
  const texte = (max = 1500) => p.evaluate(m => document.body.innerText.replace(/\s+/g, ' ').slice(0, m), max);
  const boutons = () => p.evaluate(() => [...document.querySelectorAll('button,[role=button],[role=tab],a')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }).map(e => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean));
  const demarrer = async () => { const t0 = Date.now(); await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); log.push(`[start] ${Date.now() - t0} ms`); await sleep(1500); };
  const recharger = async () => { await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(1500); };
  const onglet = async (nom) => { await tap(nom, { pref: false, dans: 'nav button' }); };
  const raz = () => { gestes = 0; };
  const nb = () => gestes;
  const store = (col) => p.evaluate(c => { const all = JSON.parse(localStorage.getItem('parcours-calendrier:cache') || '[]'); return all.filter(e => e.name === c).map(e => e.data); }, col);
  const fermer = async () => { await nav.close(); srv.close(); };
  return { p, url, cap, tap, taper, texte, boutons, demarrer, recharger, onglet, raz, nb, log, err, fermer, trouve, cdp, auj, store };
}
