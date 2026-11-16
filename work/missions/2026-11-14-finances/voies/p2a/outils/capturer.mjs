// Voie p2a : capture chaque écran (figure[data-shot] .<id>-frame, ou section[data-etat]) à 390 px, échelle 2 → <id>/<id>-<état>.png
// Usage : node work/missions/2026-11-14-finances/voies/p2a/outils/capturer.mjs s2bp2,s1bp2,s2ap2
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const VOIE = join(dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = resolve(VOIE, '..', '..', '..', '..', '..');
const puppeteer = createRequire(join(RACINE, 'package.json'))('puppeteer-core');
const ids = (process.argv[2] ?? 's2bp2,s1bp2,s2ap2').split(',');
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
  // Débords : éléments dont la boîte sort de leur écran (390 px).
  const debords = await pg.evaluate((id) => {
    const out = [];
    for (const scr of document.querySelectorAll(`.${id}-frame, section[data-etat]`)) {
      const r0 = scr.getBoundingClientRect();
      for (const e of scr.querySelectorAll('*')) {
        const r = e.getBoundingClientRect();
        if (r.width && (r.right > r0.right + 0.5 || r.left < r0.left - 0.5) && getComputedStyle(e).position !== 'fixed') out.push((e.className?.baseVal ?? e.className) + ' ' + Math.round(r.right - r0.right));
      }
    }
    return out.slice(0, 6);
  }, id);
  const shots = await pg.$$('figure[data-shot], section[data-etat]');
  const faits = [];
  for (const s of shots) {
    const k = await s.evaluate((e) => e.dataset.shot || e.dataset.etat);
    const fr = (await s.$(`.${id}-frame`)) || s;
    await fr.screenshot({ path: join(VOIE, id, `${id}-${k}.png`) });
    faits.push(k);
  }
  console.log(id, faits.join(' '), '| polices', fam.length, erreurs.length ? '| ERREURS ' + erreurs.join(' ; ') : '| sans erreur', debords.length ? '| DEBORDS ' + debords.join(' ; ') : '');
  await pg.close();
}
await b.close();
