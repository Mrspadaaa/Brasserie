// Capture des mini maquettes m4 : 390 px, échelle 2, clair, page entière. Usage : node capture.mjs [ids…]
import { ouvrir } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ici = dirname(fileURLToPath(import.meta.url));
const tous = ['m4bb-a','m4bb-b','m4bb-c','m4bb-d','m4pf-a','m4pf-b','m4pf-c','m4pf-d','m4ia-a','m4ia-b','m4ia-c','m4ia-d'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : tous.filter(i => existsSync(join(ici, i, 'etat.html')));
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844, echelle: 2 });
for (const id of ids) {
  await page.goto(pathToFileURL(join(ici, id, 'etat.html')).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const h = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  await page.screenshot({ path: join(ici, id, `${id}.png`), fullPage: true });
  console.log(id, 'h', h);
}
console.log('bloquées', journal.bloquees.length, 'erreurs', journal.erreurs.length, journal.echecsReseau.slice(0,3));
await browser.close();
