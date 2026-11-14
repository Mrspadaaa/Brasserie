// Garde de déploiement (14.11) : un build fait dans un dossier neuf sans `.env` part sans configuration Firebase,
// et l'app en ligne s'arrête au démarrage (`auth/invalid-api-key`). Échoue si aucune clé web Firebase n'est dans dist/assets.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.argv[2] ?? 'dist/assets';
const fichiers = readdirSync(dir).filter((f) => f.endsWith('.js'));
const avecCle = fichiers.filter((f) => /AIza[0-9A-Za-z_-]{30,}/.test(readFileSync(join(dir, f), 'utf8')));
if (!avecCle.length) {
  console.error(`CONFIG FIREBASE ABSENTE — aucune clé web dans ${dir} : copier .env avant le build, ne pas déployer.`);
  process.exit(1);
}
console.log(`CONFIG FIREBASE OK — clé web présente (${avecCle[0]}).`);
