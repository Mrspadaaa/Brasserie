// Profil CPU d'un geste de Ma levure (build lisible : L3_LISIBLE=1). Usage : … -- node profil.mjs <geste> <sortie.txt>
// gestes : choix-munich | ouvre-reperes | onglet-chercher | retour-paliers
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3123').split(',')[0];
const geste = process.argv[2] ?? 'choix-munich';
const sortie = process.argv[3] ?? path.join(import.meta.dirname, 'profil.txt');
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
if (geste === 'ouvre-reperes') { await p.click('[data-resultat].lv-tu'); await pause(1500); }
if (geste === 'retour-paliers') { await p.click('[data-resultat].lv-tu'); await pause(1500); await p.evaluate(() => window.scrollTo(0, 0)); await cliqueTexte('Paliers'); await pause(2500); }
if (geste === 'onglet-chercher') { await p.click('[data-resultat].lv-tu'); await pause(1500); }
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
await cdp.send('Profiler.start');
if (geste === 'choix-munich') await p.click('[data-resultat].lv-tu');
if (geste === 'ouvre-reperes') await p.click('[data-lv="act-reperes"]');
if (geste === 'onglet-chercher') await p.click('#lv-tab-chercher');
if (geste === 'retour-paliers') await cliqueTexte('Levure');
await pause(2500);
const { profile } = await cdp.send('Profiler.stop');
const noeuds = new Map(profile.nodes.map((n) => [n.id, n]));
const dt = profile.timeDeltas; const propre = new Map(); const total = dt.reduce((a, b) => a + b, 0);
profile.samples.forEach((id, i) => propre.set(id, (propre.get(id) ?? 0) + dt[i]));
const parNom = new Map();
for (const [id, us] of propre) {
  const n = noeuds.get(id); const cf = n.callFrame;
  const cle = `${cf.functionName || '(anonyme)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`;
  parNom.set(cle, (parNom.get(cle) ?? 0) + us);
}
// Inclusif : somme du temps sous chaque fonction nommée (une fois par échantillon).
const parent = new Map(); for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const incl = new Map();
for (const [id, us] of propre) {
  const vus = new Set(); let cur = id;
  while (cur != null) { const cf = noeuds.get(cur).callFrame; const cle = `${cf.functionName || '(anonyme)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; if (!vus.has(cle)) { vus.add(cle); incl.set(cle, (incl.get(cle) ?? 0) + us); } cur = parent.get(cur); }
}
const top = (m, k) => [...m].sort((a, b) => b[1] - a[1]).slice(0, k).map(([c, us]) => `${(us / 1000).toFixed(0).padStart(6)} ms  ${c}`).join('\n');
const txt = `geste ${geste}, CPU x${cpu}, total échantillonné ${(total / 1000).toFixed(0)} ms\n--- propre (self)\n${top(parNom, 25)}\n--- inclusif\n${top(incl, 45)}\n`;
fs.writeFileSync(sortie, txt);
console.log(txt);
await nav.close();
