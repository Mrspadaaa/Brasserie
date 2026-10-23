// La liste des routes construites en pages, lue dans src/coquille/pages.ts (source unique : vite.config.ts,
// construire.mjs et jouer-parcours.mjs la partagent ; elle était recopiée dans les outils, et la route « biere »
// ajoutée le 23.10 n'y était pas).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'coquille', 'pages.ts');
const m = fs.readFileSync(source, 'utf8').match(/ROUTES_PAGES\s*=\s*\[([^\]]*)\]/);
if (!m) throw new Error(`ROUTES_PAGES introuvable dans ${source}`);
export const ROUTES = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
