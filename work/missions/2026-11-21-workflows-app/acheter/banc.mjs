// Banc de la chaîne ACHETER : build de test (config parcours de port-carnet) servi en local, 390×844 tactile, fixture simulée,
// toute requête hors localhost coupée, `aiTask` (scanInvoice) répondu par une lecture SIMULÉE dans la page (jamais Gemini).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const PORT_CARNET = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const require = createRequire(path.join(PORT_CARNET, 'package.json'));
const puppeteer = require('puppeteer-core');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function lancer({ build, fixture, lecture, sortie, largeur = 390, hauteur = 844, delaiLecture = 2500 }) {
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => { let f = path.join(build, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(build, 'index.html'); r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r); });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await nav.newPage();
  const mobile = largeur < 600;
  await p.setViewport({ width: largeur, height: hauteur, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const journal = { bloquees: [], erreurs: [], ai: [] };
  await p.setRequestInterception(true);
  p.on('request', (q) => { const u = q.url(); if (/^(http:\/\/127\.0\.0\.1|data:|blob:)/.test(u)) return q.continue(); journal.bloquees.push(u.slice(0, 120)); q.abort(); });
  p.on('pageerror', (e) => journal.erreurs.push(String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') journal.erreurs.push(`console: ${m.text().slice(0, 200)}`); });
  await p.exposeFunction('__achatAi', (t) => { journal.ai.push(t); });
  await p.evaluateOnNewDocument((fx, lec, delai) => {
    if (!localStorage.getItem('parcours-calendrier:fixture')) localStorage.setItem('parcours-calendrier:fixture', fx);
    const vrai = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const u = typeof input === 'string' ? input : input.url ?? String(input);
      if (!/\/aiTask(\?|$)/.test(u)) return vrai(input, init);
      let task = '?'; try { task = JSON.parse(init.body).data.task; } catch { /* corps illisible */ }
      window.__achatAi(task);
      if (window.__horsLigne) throw new TypeError('Failed to fetch');
      await new Promise((r) => setTimeout(r, delai));
      const result = task === 'scanInvoice' && lec ? { ok: true, data: JSON.parse(lec), model: 'simule-banc', elapsedMs: delai } : { ok: false, error: 'Banc : tâche non simulée.' };
      const accept = new Headers(init.headers || {}).get('accept') || '';
      if (/event-stream/.test(accept)) return new Response(`data: ${JSON.stringify({ result })}\n\n`, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
      return new Response(JSON.stringify({ result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
  }, JSON.stringify(fixture), lecture ? JSON.stringify(lecture) : null, delaiLecture);
  const cdp = await p.createCDPSession();
  let n = 0; const caps = [];
  const cap = async (nom) => { const f = path.join(sortie, `${String(++n).padStart(2, '0')}-${nom}.png`); await p.screenshot({ path: f }); caps.push(f); return f; };
  const SEL = 'button,[role=button],[role=tab],[role=menuitem],[role=option],[role=radio],a,label,summary,[role=switch],[role=checkbox]';
  const visible = (txt, { prefixe = false, contient = false, dans = SEL, i = 0 } = {}) => p.evaluate((t, p0, c0, d, i) => {
    const nn = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const e = [...document.querySelectorAll(d)].filter((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; if (getComputedStyle(e).visibility === 'hidden') return false; const l = nn(e.getAttribute('aria-label')); const x = nn(e.innerText); return c0 ? (l.includes(t) || x.includes(t)) : p0 ? (l.startsWith(t) || x.startsWith(t)) : (l === t || x === t); })[i];
    if (!e) return null; let r = e.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) { e.scrollIntoView({ block: 'center', inline: 'center' }); r = e.getBoundingClientRect(); }
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: Math.round(r.width), h: Math.round(r.height) };
  }, txt, prefixe, contient, dans, i);
  let gestes = 0; const traces = [];
  // attendre que le DOM se taise 250 ms (perf perçue : temps du toucher au calme)
  const calme = (max = 4000) => p.evaluate((max) => new Promise((ok) => { const t0 = performance.now(); let der = t0; const o = new MutationObserver(() => { der = performance.now(); }); o.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }); const tic = () => { const n = performance.now(); if (n - der > 250 || n - t0 > max) { o.disconnect(); ok(Math.round(der - t0)); } else setTimeout(tic, 50); }; setTimeout(tic, 50); }), max);
  async function toucher(txt, o = {}) {
    const c0 = await visible(txt, o); if (!c0) throw new Error(`introuvable : « ${txt} »`);
    await sleep(80); const c = await visible(txt, o);
    const t0 = Date.now(); await p.touchscreen.tap(c.x, c.y); gestes++;
    const ms = await calme(o.attente ?? 4000); const tc = Date.now(); await p.waitForFunction(() => !/Chargement de l.écran|Chargement…/.test(document.body.innerText), { timeout: 20000 }).catch(() => {}); if (Date.now() - tc > 100) await calme(4000); traces.push({ geste: txt, cible: `${c.w}×${c.h}`, calmeMs: ms, ms: Date.now() - t0 });
    return c;
  }
  async function taper(sel, texte) { const e = await p.$(sel); if (!e) throw new Error(`champ introuvable ${sel}`); const r = await e.boundingBox(); await p.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); gestes++; await p.keyboard.type(texte, { delay: 10 }); await calme(); }
  const texte = () => p.evaluate(() => document.body.innerText.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n'));
  const boutons = () => p.evaluate(() => [...document.querySelectorAll('button,[role=button],[role=tab],a,input,select,textarea')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }).map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}${e.type ? ':' + e.type : ''} «${(e.getAttribute('aria-label') || e.innerText || e.placeholder || e.name || '').replace(/\s+/g, ' ').trim().slice(0, 50)}» ${Math.round(r.width)}×${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`; }));
  const ouvrir = async () => { const t0 = Date.now(); await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await calme(6000); return Date.now() - t0; };
  const fin = async () => { await nav.close(); srv.close(); };
  return { p, cdp, url, journal, cap, caps, visible, toucher, taper, calme, texte, boutons, ouvrir, fin, gestes: () => gestes, traces, raz: () => { gestes = 0; traces.length = 0; } };
}
