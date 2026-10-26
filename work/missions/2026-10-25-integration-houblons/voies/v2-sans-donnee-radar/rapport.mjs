// Rapport déterministe (lecture seule) : bundle entree.ts vers os.tmpdir(), puis imprime le JSON de rapport().
import { build } from 'esbuild';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const sortie = join(tmpdir(), 'v2-sans-donnee-radar-bundle.mjs');
await build({ entryPoints: [join(ici, 'entree.ts')], bundle: true, format: 'esm', platform: 'node', outfile: sortie, logLevel: 'warning' });
const m = await import(pathToFileURL(sortie).href);
console.log(JSON.stringify(m.rapport(), null, 2));
