// r3b · preuve du geste au doigt (390 × 844, tactile) : le doigt prend le curseur de dose à 2 g/L, glisse
// jusqu'à 6 g/L (doigt gardé : relevé « pendant »), puis jusqu'à 8 g/L et se lève (« après »). Ensuite :
// un toucher sur « après » (moment), retour « en ferm. », un toucher sur Pomona (levure).
// On relève, houblon par houblon : la dose limite, les brassins encore dans la 16D, la position du trait
// de la dose sur la barre ; et la ligne de réponse.
// Usage : node jouer-r3b.mjs  →  r3b/geste-r3b.json, captures/r3b-geste-avant.png, -pendant, -apres
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ICI = path.dirname(fileURLToPath(import.meta.url)), CAP = path.join(ICI, '..', 'captures');
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await browser.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(ICI, 'etat.html')).href, { waitUntil: 'networkidle0' });
await attendre(400);
const releve = () => p.evaluate(() => ({
  dose: document.getElementById('dose').value + ' g/L (' + document.getElementById('dose-v').innerText.replace(/\s+/g, ' ').trim() + ')',
  moment: (document.querySelector('[data-reglage="moment"][aria-pressed="true"]') || {}).innerText,
  levure: (document.querySelector('[data-reglage="levure"][aria-pressed="true"]') || {}).innerText,
  reponse: document.getElementById('rep').innerText.replace(/\s+/g, ' ').trim(),
  houblons: [...document.querySelectorAll('.lg')].map((l) => {
    const svg = l.querySelector('svg[data-role="incertitude"]'), traits = svg ? [...svg.querySelectorAll('line')].filter((x) => x.getAttribute('stroke') === '#16161a') : [];
    return { houblon: l.dataset.voie, limite: l.querySelector('.lim').innerText.replace(/\s+/g, ' ').trim(), brassins: (l.querySelector('.l3 [data-nature="simule"]') || {}).innerText, traitDoseX: traits.length ? Number(traits[traits.length - 1].getAttribute('x1')).toFixed(1) : null };
  }),
}));
const avant = await releve();
await p.screenshot({ path: path.join(CAP, 'r3b-geste-avant.png') });
// le curseur : la position du pouce pour une dose donnée
const b = await p.$eval('#dose', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + r.height / 2, w: r.width, min: Number(e.min), max: Number(e.max) }; });
const X = (d) => b.x + 8 + ((d - b.min) / (b.max - b.min)) * (b.w - 16);
await p.touchscreen.touchStart(X(2), b.y);
for (let d = 2; d <= 6; d += 0.25) { await p.touchscreen.touchMove(X(d), b.y); await attendre(16); }
await attendre(150);
const pendant = await releve();
await p.screenshot({ path: path.join(CAP, 'r3b-geste-pendant.png') });
for (let d = 6; d <= 8; d += 0.25) { await p.touchscreen.touchMove(X(d), b.y); await attendre(16); }
await p.touchscreen.touchEnd();
await attendre(300);
const apres = await releve();
await p.screenshot({ path: path.join(CAP, 'r3b-geste-apres.png') });
// le moment, puis la levure, au toucher
const toucher = async (sel) => { const e = await p.$(sel); await e.tap(); await attendre(350); };
await toucher('[data-reglage="moment"][data-valeur="dryPost"]');
const momentApres = await releve();
await toucher('[data-reglage="moment"][data-valeur="dryActive"]');
await toucher('[data-reglage="levure"][data-valeur="Pomona"]');
const pomona = await releve();
const preuve = { geste: 'curseur de dose glissé au doigt de 2 à 8 g/L (pendant : doigt gardé à 6 g/L), puis moment « après », puis levure Pomona en fermentation', avant, pendant, apres, momentApres, pomona, erreurs };
fs.writeFileSync(path.join(ICI, 'geste-r3b.json'), JSON.stringify(preuve, null, 1));
const L = (n, v) => console.log(n.padEnd(12), v.dose.padEnd(30), v.moment + ' · ' + v.levure, '|', v.houblons.map((x) => x.houblon + ' ' + x.limite.replace('~ jusqu’à ', '') + ' [' + (x.brassins || '').replace(' dans la 16D', '') + '] x=' + x.traitDoseX).join(' · '));
L('avant', avant); L('pendant', pendant); L('après', apres); L('moment après', momentApres); L('Pomona', pomona);
console.log('erreurs', erreurs.length ? erreurs : 'aucune');
await browser.close();
