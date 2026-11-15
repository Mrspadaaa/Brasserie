// Écrit etat.html et NOTE.md de chaque variante, puis capture <id>.png (390 px, échelle 2, clair, page entière).
// Usage : node gen.mjs fi,do,ar,ap   (depuis n'importe où)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './commun.mjs';
import { ouvrir } from '../../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const VOIE = resolve(ICI, '..');
const vues = (process.argv[2] ?? 'fi,do,ar,ap').split(',');
const variantes = [];
for (const v of vues) variantes.push(...(await import(pathToFileURL(join(ICI, `${v}.mjs`)).href)).default);

const { browser, page: p, journal } = await ouvrir({ largeur: 390, hauteur: 844, echelle: 2 });
for (const x of variantes) {
  const dir = join(VOIE, x.id); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'etat.html'), page(x.id, x.titre, x.css, x.corps()));
  writeFileSync(join(dir, 'NOTE.md'), x.note.trim().split('&amp;').join('&') + '\n');
  await p.goto(pathToFileURL(join(dir, 'etat.html')).href, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const h = await p.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  await p.screenshot({ path: join(dir, `${x.id}.png`), fullPage: true });
  console.log(`${x.id} ${h}px`);
}
console.log('bloquees', journal.bloquees.length, 'erreurs', journal.erreurs.join(' | ') || 0);
await browser.close();
