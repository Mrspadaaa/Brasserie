// Trace Chrome d'un geste de Ma levure : temps par type d'événement (style, mise en page, peinture, script) et éléments touchés.
// Usage : … -- node trace.mjs <choix-munich|ouvre-reperes|onglet-chercher|retour-paliers> <sortie.txt>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3123').split(',')[0];
const geste = process.argv[2] ?? 'choix-munich';
const sortie = process.argv[3] ?? path.join(import.meta.dirname, 'trace.txt');
const cpu = Number(process.env.L3_CPU ?? 4);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 660, isMobile: true, hasTouch: true });
await p.goto(`http://localhost:${port}/?dev-local&etape=levure&recherche=simulee`, { waitUntil: 'domcontentloaded', timeout: 150000 });
await p.waitForSelector('[data-lv="ma-levure"]', { timeout: 150000 });
await pause(1500);
const cdp = await p.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const cliqueTexte = async (texte) => {
  const h = await p.evaluateHandle((t) => [...document.querySelectorAll('button, [role="tab"]')].find((b) => b.textContent.trim() === t && b.offsetParent), texte);
  await h.asElement().click();
};
const saisir = async (texte) => { await p.click('[data-booster="ajout-levure"]', { clickCount: 3 }); await pause(200); await p.keyboard.type(texte, { delay: 70 }); await pause(800); };
await saisir('Andechs'); await p.click('[data-resultat].lv-tu'); await pause(1500);
await saisir('Munich Lager');
if (geste !== 'choix-munich') { await p.click('[data-resultat].lv-tu'); await pause(1500); }
if (geste === 'retour-paliers') { await p.evaluate(() => window.scrollTo(0, 0)); await cliqueTexte('Paliers'); await pause(2500); }
const tfichier = path.join(import.meta.dirname, '_trace.json');
await p.tracing.start({ path: tfichier, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
if (geste === 'choix-munich') await p.click('[data-resultat].lv-tu');
if (geste === 'ouvre-reperes') await p.click('[data-lv="act-reperes"]');
if (geste === 'onglet-chercher') await p.click('#lv-tab-chercher');
if (geste === 'retour-paliers') await cliqueTexte('Levure');
await pause(2500);
await p.tracing.stop();
const ev = JSON.parse(fs.readFileSync(tfichier, 'utf8')).traceEvents;
fs.unlinkSync(tfichier);
const parNom = new Map();
for (const e of ev) if (e.ph === 'X' && e.dur) {
  const m = parNom.get(e.name) ?? { n: 0, dur: 0, max: 0, el: 0 };
  m.n++; m.dur += e.dur; m.max = Math.max(m.max, e.dur);
  m.el = Math.max(m.el, e.args?.elementCount ?? e.args?.beginData?.totalObjects ?? e.args?.totalObjects ?? 0);
  parNom.set(e.name, m);
}
const noms = ['RunTask', 'FunctionCall', 'EvaluateScript', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Commit', 'Layerize', 'RunMicrotasks', 'v8.run', 'ParseHTML', 'HitTest', 'EventDispatch', 'TimerFire', 'FireAnimationFrame', 'MinorGC', 'MajorGC'];
const lignes = noms.filter((n) => parNom.has(n)).map((n) => { const m = parNom.get(n); return `${n.padEnd(20)} n=${String(m.n).padStart(4)}  total ${(m.dur / 1000).toFixed(0).padStart(6)} ms  max ${(m.max / 1000).toFixed(0).padStart(5)} ms  éléments≤${m.el}`; });
const txt = `geste ${geste}, CPU x${cpu}\n${lignes.join('\n')}\n`;
fs.writeFileSync(sortie, txt);
console.log(txt);
await nav.close();
