// LO-2 : lance `vite build` avec vite.build.config.mjs (voir ce fichier). Usage : node construire-app.mjs [dossier de sortie]
import { fileURLToPath } from 'node:url'; import path from 'node:path'; import { createRequire } from 'node:module';
const ici = path.dirname(fileURLToPath(import.meta.url));
if (process.argv[2]) process.env.SORTIE = path.resolve(process.argv[2]);
const vite = createRequire(import.meta.url)('C:/Users/mrspa/Documents/Brasserie/node_modules/vite');
await vite.build({ configFile: path.join(ici, 'vite.build.config.mjs'), logLevel: 'warn' });
console.log('build terminé');
