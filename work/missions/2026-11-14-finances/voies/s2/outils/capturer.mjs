// Voie s2 : capture chaque écran (figure[data-shot] .<id>-frame) à 390 px, échelle 2 → <id>/<id>-<état>.png
// Usage : node work/missions/2026-11-14-finances/voies/s2/outils/capturer.mjs s2a,s2b,s2c,s2d
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const VOIE = join(dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = resolve(VOIE, '..', '..', '..', '..', '..');
const puppeteer = createRequire(join(RACINE, 'package.json'))('puppeteer-core');
const ids = (process.argv[2] ?? 's2a,s2b,s2c,s2d').split(',');
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const id of ids) {
  const pg = await b.newPage();
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const erreurs = [];
  pg.on('pageerror', (e) => erreurs.push(e.message));
  pg.on('requestfailed', (r) => erreurs.push('requête : ' + r.url()));
  await pg.goto(pathToFileURL(join(VOIE, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
  await pg.evaluate(() => document.fonts.ready);
  const fam = await pg.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + f.weight));
  const shots = await pg.$$('figure[data-shot]');
  const faits = [];
  for (const s of shots) {
    const k = await s.evaluate((e) => e.dataset.shot);
    const fr = await s.$(`.${id}-frame`);
    await fr.screenshot({ path: join(VOIE, id, `${id}-${k}.png`) });
    faits.push(k);
  }
  console.log(id, faits.join(' '), '| polices', fam.length, erreurs.length ? '| ERREURS ' + erreurs.join(' ; ') : '| sans erreur');
  await pg.close();
}
await b.close();
