// Fidélité de p6 : l'app (Ma bière, couche hopBeer) contre l'écran de la maquette jouable (route #/biere), 390 × 844, mêmes états.
// Les données diffèrent (la recette du banc de l'app, sans dégustation, contre la fixture S1 de la maquette) : on compare les blocs
// et la mise en page, pas les nombres. Écrit captures/maquette-*.png, captures/app-*.png (états rejoués ici) et cote-a-cote-*.png
// (maquette à gauche, app à droite, plein format).
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5281 --strictPort" --port 5281 --env VITE_HOP_V4=on \
//     --server "npx vite --config prototypes/houblons-v4/parcours/vite.config.ts --port 5282 --strictPort" --port 5282 \
//     -- node work/missions/2026-10-25-integration-houblons/voies/p6-ma-biere-app/cote-a-cote.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ICI = import.meta.dirname;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const [portApp, portListe] = process.env.WITH_SERVER_PORTS.split(',');
const portMaquette = process.env.PORT_MAQUETTE ?? portListe;
const sortie = path.join(ICI, 'captures');
fs.mkdirSync(sortie, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Les états rejoués des deux côtés (même nom, mêmes gestes), depuis la racine de l'écran.
const ETATS = [
  ['repos', async () => {}],
  ['visee', async (p, r) => {
    await p.evaluate((s) => document.querySelector(`${s} [data-famille-ligne="tropical"] > button`).click(), r);
    await dormir(200);
    await p.evaluate((s) => document.querySelector(`${s} [data-famille-ligne="tropical"] [data-visee="plus"]`).click(), r);
  }],
  ['absolu', async (p, r) => { await p.evaluate((s) => document.querySelector(`${s} [data-e="absolu"]`).click(), r); }],
  ['radar', async (p, r) => { await p.evaluate((s) => document.querySelector(`${s} [data-vue="radar"]`).click(), r); }],
];

async function jouer(nom, ouvrirEcran, racine) {
  const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844 });
  await ouvrirEcran(page);
  for (const [etat, geste] of ETATS) {
    // Chaque état repart d'un écran neuf (rechargé), comme sa capture de la base.
    await ouvrirEcran(page);
    await geste(page, racine);
    await dormir(500);
    await page.screenshot({ path: path.join(sortie, `${nom}-${etat}.png`) });
  }
  await browser.close();
}

await jouer('maquette', async (p) => {
  await p.goto(`http://localhost:${portMaquette}/#/biere`, { waitUntil: 'networkidle0' });
  await p.reload({ waitUntil: 'networkidle0' });
  await p.waitForSelector('[data-ecran="biere"]', { timeout: 120000 });
  await dormir(800);
}, '[data-ecran="biere"]');
await jouer('app', async (p) => {
  await p.goto(`http://localhost:${portApp}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
  await p.waitForSelector('[data-role="pont-biere"]', { timeout: 120000 });
  await dormir(500);
  await p.evaluate(() => document.querySelector('[data-role="pont-biere"]').click());
  await p.waitForSelector('[data-ecran="biere"]', { timeout: 60000 });
  await dormir(800);
}, '[data-ecran="biere"]');

// Les côte à côte : une page avec les deux images, captée en plein format.
const { browser, page } = await ouvrir({ largeur: 1600, hauteur: 1700, mobile: false, echelle: 1 });
for (const [etat] of ETATS) {
  const img = (n) => `data:image/png;base64,${fs.readFileSync(path.join(sortie, `${n}-${etat}.png`)).toString('base64')}`;
  await page.setContent(`<body style="margin:0;background:#888;display:flex;gap:16px;padding:8px;align-items:flex-start"><div><div style="font:16px sans-serif;color:#fff">maquette #/biere</div><img src="${img('maquette')}" style="width:780px"></div><div><div style="font:16px sans-serif;color:#fff">app (couche hopBeer)</div><img src="${img('app')}" style="width:780px"></div></body>`);
  await dormir(200);
  await page.screenshot({ path: path.join(sortie, `cote-a-cote-${etat}.png`), clip: { x: 0, y: 0, width: 1600, height: 1740 } });
}
await browser.close();
console.log('cote-a-cote : captures écrites dans', sortie);
