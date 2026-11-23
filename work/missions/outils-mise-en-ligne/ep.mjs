// Épreuve au doigt de la frise (22.11) : sert un build, pose la fixture du banc geste (fixtureGeste), joue une liste de gestes TACTILES (CDP
// Input.dispatchTouchEvent), capture après chaque geste et imprime ce qu'il lit. Usage : node ep.mjs <build> <scenario.json> <sortie> [l] [h]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const [dir, scen, sortie, L = '390', H = '660', fixtureFichier] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const { fixtureCalendrier, ajouter, lundiDe } = await import(pathToFileURL(path.join(RACINE, 'scripts/parcours/fixtures/calendrier.mjs')).href);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fixtureGeste() {
  const auj = new Date().toISOString().slice(0, 10), Lu = lundiDe(auj), s = (n, j = 0) => ajouter(Lu, n * 7 + j);
  const fx = fixtureCalendrier(auj);
  const PASSE = Number(process.env.PASSE ?? 14), pr = fx.entrees.find((e) => e.name === 'financialProfiles');
  pr.data.openingCash.date = s(-PASSE); pr.data.historyCompleteFrom = s(-PASSE);
  for (const [k, n, c, d] of [[1, -PASSE + 1, 30000, 'out'], [2, -PASSE + 3, 80000, 'in'], [3, -PASSE + 5, 45000, 'out'], [4, -3, 60000, 'in'], [5, -2, 25000, 'out']]) {
    fx.entrees.push({ name: 'transactions', id: 'T-ZZ-P' + k, data: { id: 'T-ZZ-P' + k, description: 'ZZ passé ' + k, date: s(n, 1), amountCents: c, kind: d === 'in' ? 'sale' : 'purchase', status: 'paid' } });
    fx.entrees.push({ name: 'financialPayments', id: 'PAY-ZZ-P' + k, data: { id: 'PAY-ZZ-P' + k, transactionId: 'T-ZZ-P' + k, date: s(n, 1), amountCents: c, direction: d, method: 'card', recordedAt: s(n, 1) + 'T10:00:00.000Z' } });
  }
  fx.entrees.push({ name: 'financialPlans', id: 'P-ZZ-GESTE', data: { id: 'P-ZZ-GESTE', title: 'ZZ TEST Geste', date: s(3), amountCents: 5000, direction: 'out', category: 'renovation', source: 'manual', status: 'active', createdAt: `${ajouter(auj, -30)}T08:00:00.000Z`, fenetre: { du: s(3), au: s(4, 6), joursActifs: 4 } } });
  return JSON.stringify(fx.entrees);
}

const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
  r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
});
await new Promise((o) => srv.listen(0, '127.0.0.1', o));
const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
const W = Number(L), Hh = Number(H), tactile = W < 1000;
await p.setViewport({ width: W, height: Hh, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
const fx = fixtureFichier ? fs.readFileSync(fixtureFichier, 'utf8') : fixtureGeste();
await p.evaluateOnNewDocument((j, tag) => {
  if (localStorage.getItem('geste:fixture-posee') === tag) return;
  localStorage.clear(); sessionStorage.clear(); localStorage.setItem('laffinee.theme', 'clair');
  localStorage.setItem('parcours-calendrier:fixture', j); localStorage.setItem('geste:fixture-posee', tag);
}, fx, `ep-${Date.now()}`);
const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));
const cdp = await p.createCDPSession();
const touche = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: Math.round(x), y: Math.round(y), id: 1 }] });
const tap = async (x, y) => { if (tactile) { await touche('touchStart', x, y); await sleep(70); await touche('touchEnd'); } else await p.mouse.click(x, y); await sleep(700); };
const centre = (sel) => p.evaluate((s) => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'nearest' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
const texte = (t) => p.evaluate((t) => { const e = [...document.querySelectorAll('button,a,[role=tab],[role=button],[role=menuitem],[role=option],[role=menuitemradio]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && ((e.getAttribute('aria-label') ?? '').trim() === t || e.innerText.trim().replace(/\s+/g, ' ') === t); }); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, t);
// un doigt : posé, déplacé à vitesse réelle (px/s), tenu (ms, avec tremblement), levé
const doigt = async ({ x0, y, x1, y1 = y, vitesse = 600, tenir = 0, pause = 120, tremble = 0, immobile = false, capPendant = 0 }) => {
  if (tactile && (tremble || immobile)) {
    // doigt réel : posé, mené au bord, puis tenu ; `tremble` ms entre deux touchMove d'un bruit de ±1 px (0, -1, 0, +1 : le sens change sans cesse)
    await touche('touchStart', x0, y); await sleep(pause);
    const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y) / (vitesse / 60)));
    for (let k = 1; k <= n; k++) { await touche('touchMove', x0 + ((x1 - x0) * k) / n, y + ((y1 - y) * k) / n); await sleep(16); }
    const bruit = [0, -1, 0, 1];
    if (immobile && capPendant) for (let t = 0; t < tenir; t += capPendant) { await sleep(capPendant); await p.screenshot({ path: path.join(sortie, `${String(n).padStart(2, '0')}-pendant-${t + capPendant}.png`) }); console.log(`   pendant ${t + capPendant} ms : ${JSON.stringify(await lire()).slice(0, 220)}`); }
    else if (immobile) await sleep(tenir);
    else for (let t = 0, i = 0; t < tenir; t += tremble, i++) { await sleep(tremble); await touche('touchMove', x1 + bruit[i % 4], y1); }
    await touche('touchEnd'); await sleep(900); return;
  }
  if (!tactile) { await p.mouse.move(x0, y); await p.mouse.down(); await sleep(pause); const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y) / (vitesse / 60))); for (let k = 1; k <= n; k++) { await p.mouse.move(x0 + ((x1 - x0) * k) / n, y + ((y1 - y) * k) / n); await sleep(16); } for (let t = 0; t < tenir; t += 100) { await sleep(100); await p.mouse.move(x1 + ((t / 100) % 2), y1); } await p.mouse.up(); await sleep(800); return; }
  await touche('touchStart', x0, y); await sleep(pause);
  const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y) / (vitesse / 60)));
  for (let k = 1; k <= n; k++) { await touche('touchMove', x0 + ((x1 - x0) * k) / n, y + ((y1 - y) * k) / n); await sleep(16); }
  for (let t = 0; t < tenir; t += 50) { await sleep(50); await touche('touchMove', x1 + (Math.round(t / 50) % 3) - 1, y1 + (Math.round(t / 50) % 2)); }
  await touche('touchEnd'); await sleep(900);
};
const lire = () => p.evaluate(() => {
  const cad = document.querySelector('.ent-cadre'), lab = document.querySelector('.ent-cadre')?.textContent?.trim();
  const lundis = [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].map((e) => e.getAttribute('data-lundi'));
  const per = document.querySelector('[aria-label$="période, liste, tri et filtre"]')?.innerText.trim();
  const tir = document.querySelector('[data-cadre-tirage]')?.textContent?.trim() ?? null, aria = cad?.getAttribute('aria-label') ?? null;
  return { cadre: (lab || tir || aria)?.slice(0, 60), tir, aria, echelle: per, semaines: lundis.length, du: lundis[0], au: lundis[lundis.length - 1], fiche: document.querySelector('[data-detail]')?.innerText.replace(/\s+/g, ' ').slice(0, 140) ?? null, message: document.querySelector('[data-message]')?.textContent?.slice(0, 120) ?? null, x: scrollX, y: scrollY, cadreBox: cad ? (() => { const r = cad.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; })() : null };
});
const actions = JSON.parse(fs.readFileSync(scen, 'utf8'));
let n = 0;
const aller = async () => { await p.goto(url, { waitUntil: 'load' }); await p.waitForSelector('nav button', { timeout: 90000 }); await sleep(1200); if (!(await p.$('[data-calendrier]'))) { const c = await texte('Calendrier'); if (c) await tap(...c); } await p.waitForSelector('[data-calendrier]', { timeout: 30000 }); await sleep(800); };
await aller();
for (const a of actions) {
  n++;
  try {
    if (a.menu) { const m = await centre('[aria-label$="période, liste, tri et filtre"]'); await tap(...m); const c = await texte(a.menu); if (!c) throw new Error(`menu « ${a.menu} » introuvable`); await tap(...c); }
    if (a.texte) { const c = await texte(a.texte); if (!c) throw new Error(`« ${a.texte} » introuvable`); await tap(...c); }
    if (a.sel) { const c = await centre(a.sel); if (!c) throw new Error(`${a.sel} introuvable`); await tap(c[0] + (a.dx ?? 0), c[1]); }
    if (a.xy) await tap(...a.xy);
    if (a.doigt) { const g = await p.evaluate(a.doigt); if (!g) throw new Error('points du doigt introuvables'); await doigt({ ...g, ...(a.opts ?? {}) }); }
    if (a.eval) console.log(`  eval ${JSON.stringify(await p.evaluate(a.eval)).slice(0, 600)}`);
    if (a.touche) { await p.keyboard.press(a.touche); await sleep(500); }
    if (a.recharger) await aller();
    if (a.attendre) await sleep(a.attendre);
    if (a.defiler !== undefined) { await p.evaluate((y) => window.scrollTo(0, y), a.defiler); await sleep(300); }
  } catch (e) { console.log(`  ERREUR ${n} ${a.nom ?? ''} : ${String(e.message ?? e).slice(0, 200)}`); }
  const l = await lire();
  console.log(`${String(n).padStart(2, '0')} ${a.nom ?? ''} | ${l.echelle} | cadre « ${l.cadre} » ${JSON.stringify(l.cadreBox)} | ${l.semaines} sem. ${l.du}→${l.au}${l.fiche ? ` | fiche « ${l.fiche} »` : ''}${l.message ? ` | msg « ${l.message} »` : ''}`);
  if (a.zoom) await p.screenshot({ path: path.join(sortie, `${String(n).padStart(2, '0')}-zoom.png`), clip: { x: a.zoom[0], y: a.zoom[1], width: a.zoom[2], height: a.zoom[3], scale: 3 } });
  if (a.cap !== false) await p.screenshot({ path: path.join(sortie, `${String(n).padStart(2, '0')}-${(a.nom ?? 'geste').replace(/[^\w-]+/g, '-')}.png`) });
}
if (erreurs.length) console.log('ERREURS DE PAGE', erreurs.join(' | '));
await nav.close(); srv.close();
