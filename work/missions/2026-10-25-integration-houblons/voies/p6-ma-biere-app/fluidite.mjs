// Fluidité de Ma bière dans l'app (budgets de l'épopée #159 : toucher 100 ms ; écran utilisable en 2,5 s à froid, processeur ×4).
// Mesures sur le serveur de développement (le chunk de l'écran y est transformé à la demande : un pire cas, un build de production
// est plus rapide) : (1) ouverture à froid de la couche hopBeer, du toucher du bouton à l'écran peint ; (2) réponse d'un toucher
// (famille ouverte, visée +, Radar) : du clic à deux images peintes. Processeur bridé ×4 (CDP).
// Usage (racine) : node scripts/with_server.mjs --server "npm run dev -- --port 5291 --strictPort" --port 5291 --env VITE_HOP_V4=on -- node <ce fichier>
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const port = process.env.WITH_SERVER_PORTS.split(',')[0];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844 });
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-role="pont-biere"]', { timeout: 120000 });
await dormir(1500);
// (1) Ouverture à froid : du clic du bouton à l'écran utilisable (barres peintes).
const t0 = Date.now();
await page.evaluate(() => document.querySelector('[data-role="pont-biere"]').click());
await page.waitForSelector('[data-ecran="biere"] [data-famille-ligne]', { timeout: 60000 });
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const ouverture = Date.now() - t0;
await dormir(1500);
// (2) Réponse d'un toucher : clic → deux images peintes.
// `retour` : du clic à la première image (le retour visuel du toucher, ce que le budget de 100 ms borne) ; `pose` : jusqu'à la
// deuxième image, calculs différés compris (la ligne des voies).
const toucher = async (js) => {
  const t = await page.evaluate((code) => new Promise((resolve) => {
    const d = performance.now();
    // eslint-disable-next-line no-new-func
    new Function(code)();
    requestAnimationFrame(() => {
      const retour = performance.now() - d;
      setTimeout(() => resolve({ retour, pose: performance.now() - d }), 0);
    });
  }), js);
  await dormir(600);
  return t;
};
const R = '[data-ecran="biere"]';
const mesures = { famille: [], visee: [], radar: [] };
for (let i = 0; i < 5; i++) {
  mesures.famille.push(await toucher(`document.querySelector('${R} [data-famille-ligne="${i % 2 ? 'tropical' : 'floral'}"] > button').click()`));
  mesures.visee.push(await toucher(`document.querySelector('${R} [data-famille-ligne="${i % 2 ? 'tropical' : 'floral'}"] [data-visee="plus"]').click()`));
}
for (let i = 0; i < 5; i++) {
  mesures.radar.push(await toucher(`document.querySelector('${R} [data-vue="radar"]').click()`));
  await toucher(`document.querySelector('${R} [data-vue="barres"]').click()`);
}
console.log(`ouverture à froid (×4, dev, chunk compris) : ${ouverture} ms (budget 2500)`);
for (const [k, v] of Object.entries(mesures)) console.log(`toucher « ${k} » : retour visuel médiane ${Math.round(med(v.map((x) => x.retour)))} ms, max ${Math.round(Math.max(...v.map((x) => x.retour)))} ms (budget 100) ; posé, calculs compris : médiane ${Math.round(med(v.map((x) => x.pose)))} ms`);
await browser.close();
