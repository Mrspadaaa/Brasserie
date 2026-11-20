// DC-1 : construit le banc de découpe (pieges/harnais.ts + les modules de l'app, tels qu'ils sont dans l'arbre) avec esbuild, dans un dossier temporaire.
// Usage : node construire-banc.mjs <dossier de sortie>
// pdf.js est remplacé par un module vide (le banc ne joue que des photos). Rien dans le dépôt n'est écrit.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '../../../../..');
const sortie = path.resolve(process.argv[2] ?? path.join(process.env.TEMP ?? '.', 'dc1-banc'));
const esbuild = createRequire(path.join(racine, 'package.json'))('esbuild');

fs.rmSync(sortie, { recursive: true, force: true }); fs.mkdirSync(sortie, { recursive: true });
const plugin = {
  name: 'dc1',
  setup(build) {
    build.onResolve({ filter: /^pdfjs-dist(\/.*)?$/ }, () => ({ path: 'vide', namespace: 'dc1' }));
    build.onLoad({ filter: /^vide$/, namespace: 'dc1' }, () => ({ contents: 'export default {}; export const GlobalWorkerOptions = {};', loader: 'js' }));
  },
};
await esbuild.build({
  entryPoints: [process.argv[3] ? path.resolve(process.argv[3]) : path.join(racine, 'work/missions/2026-11-03-lecture-longue/pieges/harnais.ts')], bundle: true, format: 'esm', outdir: sortie,
  target: 'es2022', plugins: [plugin], logLevel: 'warning', entryNames: '[name]',
});
fs.writeFileSync(path.join(sortie, 'harnais.html'), '<!doctype html><meta charset="utf-8"><title>DC-1</title><script type="module" src="./harnais.js"></script>');
console.log(`construit : ${sortie}`);
