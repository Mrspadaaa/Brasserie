// HTML statique (maquette, page publiée) : une URL file://, pas de serveur. Lire le HTML d'abord pour trouver les sélecteurs.
// Usage : node .claude/skills/webapp-testing/examples/html-statique.mjs <fichier.html> [texte-a-cliquer] [dossier-de-sortie]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ouvrir, calme, cliquerTexte } from './_lanceur.mjs';

const [fichier, texte, sortie = path.join(os.tmpdir(), 'webapp-testing')] = process.argv.slice(2);
if (!fichier || !fs.existsSync(fichier)) { console.error('Usage : html-statique.mjs <fichier.html> [texte-a-cliquer] [dossier]'); process.exit(2); }
fs.mkdirSync(sortie, { recursive: true });

const { browser, page, journal } = await ouvrir();
try {
  await page.goto(pathToFileURL(path.resolve(fichier)).href, { waitUntil: 'load' });
  await calme(page);
  await page.screenshot({ path: path.join(sortie, 'statique-avant.png') });
  if (texte) {
    await cliquerTexte(page, texte);
    await calme(page, 300);
    await page.screenshot({ path: path.join(sortie, 'statique-apres.png') });
  }
} finally {
  await browser.close();
}
console.log(`Captures dans ${sortie} ; ${journal.erreurs.length} erreurs de page, ${journal.console.filter((m) => m.type === 'error').length} erreurs de console.`);
