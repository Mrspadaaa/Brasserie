// Lot 21 · e4 · la preuve du geste : « ta dose » glissée AU DOIGT (touchStart, touchMove, touchEnd sur
// le curseur, à 390 × 844), puis la levure touchée en agrumes. On relève, avant, pendant et après :
// la dose écrite, la ligne « ta dose » (sa position à l'écran), les échelons et leurs houblons, ceux
// qui sont « hors à ta dose », les valeurs simulées des pastilles, la phrase-réponse, et le nombre
// d'animations en cours (le reclassement se voit). Écrit e4/geste-e4.json.
// Usage : node jouer-e4.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ici = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
// Chrome sans tête annonce « mouvement réduit » : la page n'anime alors rien (voulu) ; on rejoue comme un téléphone ordinaire.
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await p.goto(pathToFileURL(path.join(ici, 'etat.html')).href, { waitUntil: 'networkidle0', timeout: 60000 });
await wait(400);
const releve = () => p.evaluate(() => {
  const ligne = document.querySelector('.ligne');
  return {
    dose: document.querySelector('#dose-v').textContent,
    reglages: [...document.querySelectorAll('button[data-reglage]')].map((x) => x.innerText.replace(/\s+/g, ' ').trim()),
    reponse: document.querySelector('#rep').innerText,
    ligneHaut: ligne ? Math.round(ligne.getBoundingClientRect().top) : null,
    ligneAuPremierEcran: ligne ? ligne.getBoundingClientRect().bottom < innerHeight : false,
    echelons: [...document.querySelectorAll('.er')].map((e) => ({ dose: e.querySelector('.er-d b').innerText, hors: e.classList.contains('hors'), houblons: [...e.querySelectorAll('.ch')].map((c) => c.dataset.nom + ' ' + (c.querySelector('[data-nature="simule"]') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim()), nonDepartages: !!e.querySelector('.grp-e') })),
    animations: document.getAnimations().length,
    curseurAuPremierEcran: document.querySelector('#dose').getBoundingClientRect().bottom < innerHeight,
  };
});
// Le centre du curseur à la valeur v (0 à 3), d'après sa boîte (le pouce va d'un bord à l'autre).
const xDe = async (v) => p.evaluate((v) => { const r = document.querySelector('#dose').getBoundingClientRect(); const t = 16; return { x: r.left + t / 2 + (r.width - t) * (v / 3), y: r.top + r.height / 2 }; }, v);
const avant = await releve();
// Glisser au doigt de 4 g/L (valeur 2) à 2 g/L (valeur 1), en restant posé : « pendant ».
const a = await xDe(2), m = await xDe(1), z = await xDe(3);
await p.touchscreen.touchStart(a.x, a.y);
let animPendant = 0;
for (let i = 1; i <= 6; i++) { await p.touchscreen.touchMove(a.x + ((m.x - a.x) * i) / 6, a.y); await wait(40); animPendant = Math.max(animPendant, await p.evaluate(() => document.getAnimations().length)); }
await wait(500);
const pendant = { ...(await releve()), animationsPendantLeGlisse: animPendant };
// Puis jusqu'à 8 g/L (valeur 3), et relâcher : « après ».
for (let i = 1; i <= 10; i++) { await p.touchscreen.touchMove(m.x + ((z.x - m.x) * i) / 10, a.y); await wait(30); }
await p.touchscreen.touchEnd();
await wait(120);
const apresAnim = await p.evaluate(() => document.getAnimations().length);
await wait(600);
const apres = await releve();
// La levure : agrumes, 4 g/L, US-05 puis Pomona (dry hop actif).
await p.goto(pathToFileURL(path.join(ici, 'etat.html')).href + '?fam=citrus', { waitUntil: 'networkidle0' });
await wait(300);
const us05 = await releve();
await (await p.$('button[data-reglage="levure"]')).tap();
await wait(700);
const pomona = await releve();
await b.close();
const sortent = (r) => r.echelons.filter((e) => e.hors).flatMap((e) => e.houblons.map((h) => h.split(' ~')[0].split(' ≈')[0]));
const out = {
  geste: 'ta dose glissée au doigt : 4 → 2 g/L (posé), puis → 8 g/L (relâché) ; puis la levure touchée en agrumes',
  avant, pendant, apres: { ...apres, animationsJusteApres: apresAnim }, levure: { 'US-05': us05, Pomona: pomona },
  constat: {
    sortentA4: sortent(avant), sortentA2: sortent(pendant), sortentA8: sortent(apres),
    ligneBouge: avant.ligneHaut !== pendant.ligneHaut && pendant.ligneHaut !== apres.ligneHaut,
    reclasseAvecLaLevure: JSON.stringify(us05.echelons) !== JSON.stringify(pomona.echelons),
    gesteAuPremierEcran: avant.curseurAuPremierEcran && avant.ligneAuPremierEcran,
  },
  erreurs,
};
fs.writeFileSync(path.join(ici, 'geste-e4.json'), JSON.stringify(out, null, 1) + '\n');
console.log('GESTE e4', JSON.stringify(out.constat), erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur');
