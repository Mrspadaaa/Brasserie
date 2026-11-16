// Capture des 12 mini maquettes : 390 px, échelle 2, page entière, thème clair.
import { ouvrir } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const ids = (process.argv[2] ?? 'm2fo-a,m2fo-b,m2fo-c,m2fo-d,m2pa-a,m2pa-b,m2pa-c,m2pa-d,m2mo-a,m2mo-b,m2mo-c,m2mo-d').split(',');
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844, echelle: 2 });
for (const id of ids) {
  await page.goto(pathToFileURL(join(ICI, id, 'etat.html')).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').length);
  await page.screenshot({ path: join(ICI, id, `${id}.png`), fullPage: true });
  console.log(id, 'h', h, 'polices', fonts);
}
console.log('bloquees', journal.bloquees.length, 'erreurs', journal.erreurs.length, journal.erreurs.slice(0, 3).join(' | '));
await browser.close();
