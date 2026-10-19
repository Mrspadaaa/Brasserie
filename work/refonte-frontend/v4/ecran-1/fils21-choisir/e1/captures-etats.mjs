// Lot 21 · e1, e2, e3 · captures des états qui comptent, à 390 px (deviceScaleFactor 2), avec les
// erreurs de la console. Chaque état est une adresse (paramètres de la page) ou un geste joué au doigt.
// Usage : node captures-etats.mjs <variante> [état…]   (états : voir ETATS ; sans état : tous)
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ici = path.dirname(fileURLToPath(import.meta.url));
const D21 = path.join(ici, '..');
const [v, ...seuls] = process.argv.slice(2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// [nom, requête, hauteur, geste]
const ETATS = {
  e1: [['390', '', 1688], ['haut', '', 844], ['tropical', '?fam=tropical', 844], ['paire', '?part=Citra&dernier=part:on', 1688], ['actif', '?moment=dryActive&levure=lalbrew-pomona&dernier=levure:lalbrew-pomona', 844], ['mesure', '?tri=mesure', 844], ['60', '?moment=b60&dernier=moment:b60', 844], ['absolu', '?abs', 844], ['preuves', '?preuves=Citra', 844, 'preuves'], ['fiche', '?fiche=Citra', 844], ['legende', '?legende', 844], ['geste', '', 844, 'dose']],
  e2: [['390', '', 1688], ['haut', '', 844], ['paire', '?b=Citra%2BGalaxy', 1688], ['nelson', '?b=Nelson%20Sauvin', 1688], ['galaxy', '?b=Galaxy', 844], ['actif', '?moment=dryActive&levure=lalbrew-pomona&dernier=levure:lalbrew-pomona', 844], ['preuves', '?preuves=tropical', 844, 'preuves'], ['fiche', '?fiche=Citra', 844], ['legende', '?legende', 844], ['absolu', '?abs', 844]],
  e3: [['390', '', 1688], ['haut', '', 844], ['actif', '?moment=dryActive&levure=lalbrew-pomona&dernier=levure:lalbrew-pomona', 1688], ['tropical', '?fam=tropical', 844], ['preuves', '?preuves=K3-citra3-galaxy7', 844, 'preuves'], ['fiche', '?fiche=Citra', 844], ['legende', '?legende', 844], ['absolu', '?abs', 844], ['moments', '?groupe=K1', 1688]],
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
fs.mkdirSync(path.join(D21, 'captures'), { recursive: true });
for (const [nom, q, h, geste] of ETATS[v].filter(([n]) => !seuls.length || seuls.includes(n))) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(D21, v, 'etat.html')).href + q, { waitUntil: 'networkidle0', timeout: 60000 });
  await wait(400);
  if (geste === 'dose') { const b = await page.$('[data-reglage="dose"]'); await b.tap(); await wait(120); }
  await page.screenshot({ path: path.join(D21, 'captures', v + '-' + nom + '.png'), fullPage: false });
  console.log('SHOT ' + v + '-' + nom + '.png' + (errs.length ? '  ERREURS : ' + errs.join(' | ') : ''));
  await page.close();
}
await browser.close();
