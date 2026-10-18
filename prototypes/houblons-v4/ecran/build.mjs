// Construit une version statique de l'écran houblons, ouvrable en file://.
// Usage (depuis prototypes/houblons-v4) :
//   npm run ecran:build                                   → maquettes/version-a, thème clair
//   npm run ecran:build -- --version=version-b --theme=cave [--variante=essai]
// Sortie : maquettes/<version>/index.html, etat-b.html, radar.html et assets/ (vidé à chaque fois).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const ici = path.dirname(fileURLToPath(import.meta.url));
const options = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || 'true']; }),
);
const inconnues = Object.keys(options).filter((k) => !['version', 'theme', 'variante'].includes(k));
if (inconnues.length) { console.log(`ECRAN-BUILD ECHEC : option inconnue --${inconnues.join(', --')}`); process.exit(1); }

process.env.ECRAN_VERSION = options.version ?? 'version-a';
process.env.ECRAN_THEME = options.theme ?? 'clair';
process.env.ECRAN_VARIANTE = options.variante ?? 'essai';

try {
  await build({ configFile: path.join(ici, 'vite.config.ts'), logLevel: 'warn' });
} catch (e) {
  console.log(`ECRAN-BUILD ECHEC : ${e.message}`);
  process.exit(1);
}
console.log(`ECRAN-BUILD OK ${process.env.ECRAN_VERSION} (thème ${process.env.ECRAN_THEME}, variante ${process.env.ECRAN_VARIANTE}) → maquettes/${process.env.ECRAN_VERSION}/`);
