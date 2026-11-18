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
const projets = [...new Set(fichiers.flatMap((f) => [...readFileSync(join(dir, f), 'utf8').matchAll(/(?:projectId|VITE_FIREBASE_PROJECT_ID):"([a-z0-9-]+)"/g)].map((m) => m[1])))];
const autres = projets.filter((p) => p !== 'brasserie-l-affinee');
if (!projets.includes('brasserie-l-affinee') || autres.length) {
  console.error(`CONFIG FIREBASE FAUSSE — projet(s) ${projets.join(', ') || 'aucun'} dans ${dir} : seul brasserie-l-affinee se déploie (18.11 : un .env de banc a cassé la connexion en ligne).`);
  process.exit(1);
}
console.log(`CONFIG FIREBASE OK — clé web présente (${avecCle[0]}).`);
