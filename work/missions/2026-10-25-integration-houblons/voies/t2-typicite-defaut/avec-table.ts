// t2 (D120) : lance un script de mesure (scripts/eval-hop/*.ts) avec la table de typicité posée, comme l'app à l'ouverture de l'étape.
// Sans ce lanceur, ces scripts créent un moteur sans table : la typicité y est inconnue et le rang est celui de k3k1 (= l'ordre d'avant D120, f9Typicite.test.ts).
// Usage : npx vite-node work/missions/2026-10-25-integration-houblons/voies/t2-typicite-defaut/avec-table.ts -- <script relatif à scripts/eval-hop/> [options du script]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { poserTypicite, type TableTypicite } from '../../../../../src/domain/hopIndex/v4/typicite';

// vite-node rend process.argv = [node, ce fichier, ...arguments] (le « -- » est consommé).
const [script, ...options] = process.argv.slice(2).filter((a) => a !== '--');
if (!script) { console.error('usage : avec-table.ts -- <script.ts> [options]'); process.exit(2); }
poserTypicite(JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json'), 'utf8')) as TableTypicite);
process.argv = [process.argv[0], script, '--', ...options];
await import(pathToFileURL(join(process.cwd(), 'scripts', 'eval-hop', script)).href);
