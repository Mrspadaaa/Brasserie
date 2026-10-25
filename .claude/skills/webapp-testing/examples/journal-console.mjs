// Journal de la console pendant une action : ce qui est écrit, ce qui plante, ce qui n'a pas pu se charger.
// Usage : node .claude/skills/webapp-testing/examples/journal-console.mjs <url> [texte-a-cliquer] [fichier-json]
// Sort avec le code 1 s'il y a une erreur de page ou une console « error » hors liste attendue (voir ATTENDUES).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ouvrir, calme, cliquerTexte } from './_lanceur.mjs';

const [url, texte, fichier = path.join(os.tmpdir(), 'webapp-testing', 'console.json')] = process.argv.slice(2);
if (!url) { console.error('Usage : journal-console.mjs <url> [texte-a-cliquer] [fichier-json]'); process.exit(2); }
// Bruit connu et accepté, un motif par ligne, avec sa raison. Tout le reste est une erreur.
const ATTENDUES = [
  // /permission-denied|Missing or insufficient permissions/ : ?dev-local n'a pas de jeton Firestore (cerveau/agents/verification-locale.md)
];

const { browser, page, journal } = await ouvrir();
try {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await calme(page);
  if (texte) { await cliquerTexte(page, texte); await calme(page); }
} finally {
  await browser.close();
}
fs.mkdirSync(path.dirname(fichier), { recursive: true });
fs.writeFileSync(fichier, JSON.stringify(journal, null, 2));
// Une erreur dont l'URL est dans journal.bloquees est notre coupure du réseau externe, pas un défaut de l'app.
const erreurs = journal.console.filter((m) => m.type === 'error' && !journal.bloquees.includes(m.url) && !ATTENDUES.some((re) => re.test(m.texte)));
for (const m of journal.console) console.log(`[${m.type}] ${m.texte.slice(0, 200)}`);
for (const e of journal.erreurs) console.log(`[pageerror] ${e.slice(0, 200)}`);
console.log(`\n${journal.console.length} messages, ${erreurs.length} erreurs de console, ${journal.erreurs.length} erreurs de page → ${fichier}`);
process.exit(erreurs.length || journal.erreurs.length ? 1 : 0);
