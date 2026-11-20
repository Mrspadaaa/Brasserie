// Mesure de fluidité de « Ma levure » (LEV-8, T2B-3) : build de production local, 390 tactile, CPU ralenti (L3_CPU, défaut 4).
// Pire durée « entrée → image » par geste (Event Timing, seuil 16 ms) et tâches longues (> 50 ms).
// Usage : node scripts/with_server.mjs --server "npx vite preview --config <vite.banc.config.mjs>" --port 3123 -- node mesure.mjs <sortie.json> [clair|cave] [390|1280]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3123').split(',')[0];
const sortie = process.argv[2] ?? path.join(import.meta.dirname, 'mesure.json');
const theme = process.argv[3] ?? 'clair';
const largeur = Number(process.argv[4] ?? 390);
const cpu = Number(process.env.L3_CPU ?? 4);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await nav.newPage();
await p.setViewport(largeur < 600 ? { width: largeur, height: 660, isMobile: true, hasTouch: true } : { width: largeur, height: 900 });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));
await p.evaluateOnNewDocument((t) => {
  try { localStorage.setItem('laffinee.theme', t === 'cave' ? 'cave' : 'clair'); } catch { /* ignoré */ }
  window.__ev = []; window.__lt = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ n: e.name, d: e.duration, t: e.startTime }); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ d: e.duration, t: e.startTime }); }).observe({ type: 'longtask', buffered: true });
}, theme);
await p.goto(`http://localhost:${port}/?dev-local&etape=levure&recherche=simulee`, { waitUntil: 'domcontentloaded', timeout: 150000 });
await p.waitForSelector('[data-lv="ma-levure"]', { timeout: 150000 });
await pause(1500);
const cdp = await p.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
await pause(500);

const mesures = [];
async function geste(nom, fn) {
  await p.evaluate(() => { window.__ev.length = 0; window.__lt.length = 0; });
  await fn();
  await pause(1200);
  const r = await p.evaluate(() => ({ ev: window.__ev.slice(), lt: window.__lt.slice() }));
  const pire = r.ev.reduce((m, e) => (e.d > m.d ? e : m), { d: 0, n: '-' });
  mesures.push({ geste: nom, pireMs: Math.round(pire.d), evt: pire.n, nbEvt: r.ev.length, tachesLongues: r.lt.length, pireTacheMs: Math.round(r.lt.reduce((m, e) => Math.max(m, e.d), 0)) });
}
const cliqueTexte = async (texte, selecteur = 'button') => {
  const h = await p.evaluateHandle((t, s) => [...document.querySelectorAll(s)].find((b) => b.textContent.trim() === t && b.offsetParent), texte, selecteur);
  const el = h.asElement(); if (!el) throw new Error(`introuvable : ${texte}`);
  await el.click();
};

await geste('frappe:Andechs', async () => {
  await p.click('[data-booster="ajout-levure"]'); await pause(300);
  await p.keyboard.type('Andechs', { delay: 70 });
});
await geste('choix:Andechs', async () => { await p.click('[data-resultat].lv-tu'); });
await geste('frappe:Munich Lager', async () => {
  await p.click('[data-booster="ajout-levure"]', { clickCount: 3 }); await pause(200);
  await p.keyboard.type('Munich Lager', { delay: 70 });
});
await geste('choix:Munich Lager', async () => { await p.click('[data-resultat].lv-tu'); });
const caler = await p.$('[data-lv="caler"]');
if (caler) await geste('caler', async () => { await caler.click(); });
const retab = await p.$('[data-lv="retablir"]');
if (retab) await geste('retablir', async () => { await retab.click(); });
await geste('ouvre:dose', async () => { await p.click('[data-lv="dose"]'); });
await geste('ferme:dose', async () => { await p.click('[data-repli="dose"] summary'); });
await geste('ouvre:plus (Repères)', async () => { await p.click('[data-lv="act-reperes"]'); });
await geste('ferme:plus', async () => { await p.click('[data-repli="sources"] summary'); });

// Glisser un palier (pire image entre deux mouvements).
for (const axe of ['temperature', 'duration']) {
  const poignee = await p.$(`[data-handle-axis="${axe}"]`);
  if (!poignee) { mesures.push({ geste: `glisse:${axe}`, absent: true }); continue; }
  await poignee.evaluate((e) => e.scrollIntoView({ block: 'center' })); await pause(400);
  const b = await poignee.boundingBox();
  await geste(`glisse:${axe}`, async () => {
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await p.mouse.move(b.x + b.width / 2 + (axe === 'duration' ? i * 3 : 0), b.y + b.height / 2 + (axe === 'temperature' ? i * 2 : 0));
      await pause(16);
    }
    await p.mouse.up();
  });
}

// T2B-3 : aller sur Paliers puis revenir sur Levure.
await p.evaluate(() => window.scrollTo(0, 0)); await pause(300);
let retour = null;
try {
  await cliqueTexte('Paliers', 'button, a, [role="tab"]'); await pause(2500);
  await geste('retour:Paliers→Levure', async () => { await cliqueTexte('Levure', 'button, a, [role="tab"]'); await p.waitForSelector('[data-lv="ma-levure"]', { timeout: 20000 }); });
} catch (e) { retour = String(e).slice(0, 160); }
// Onglets Chercher → Ma levure.
try {
  await geste('onglet:Chercher', async () => { await p.click('#lv-tab-chercher'); });
  await geste('onglet:Ma levure (retour)', async () => { await p.click('#lv-tab-ma-levure'); });
} catch (e) { retour = (retour ?? '') + ' ' + String(e).slice(0, 120); }

fs.writeFileSync(sortie, JSON.stringify({ largeur, theme, cpu, mesures, retour, erreurs }, null, 1));
console.log(mesures.map((m) => `${m.geste}: ${m.pireMs ?? 'absent'} ms (${m.evt ?? ''}, ${m.tachesLongues ?? 0} tâches longues, pire ${m.pireTacheMs ?? 0})`).join('\n'));
if (retour) console.log('RETOUR:', retour);
if (erreurs.length) console.log('ERREURS:', erreurs.join(' | '));
await nav.close();
