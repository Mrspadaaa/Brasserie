// LO-2 : construit le banc (harnais.ts + les modules de l'app) avec esbuild, dans un dossier temporaire.
// Usage : node construire.mjs <dossier de sortie>
// zxing-wasm et pdfjs-dist ne sont pas installés dans ce poste (comme pour le banc e-bout) : zxing vient de la copie `qr-deps` (hors Git, lecture seule) ;
// pdf.js est remplacé par un module vide (le banc ne joue que des photos).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ici = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.resolve(process.argv[2] ?? path.join(process.env.TEMP ?? '.', 'lo2-banc'));
const QR_DEPS = process.env.QR_DEPS ?? 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/voies/e-bout/qr-deps/node_modules';
const esbuild = createRequire(import.meta.url)(process.env.ESBUILD ?? 'C:/Users/mrspa/Documents/Brasserie/node_modules/esbuild');

fs.rmSync(sortie, { recursive: true, force: true }); fs.mkdirSync(sortie, { recursive: true });
fs.copyFileSync(path.join(QR_DEPS, 'zxing-wasm/dist/reader/zxing_reader.wasm'), path.join(sortie, 'zxing_reader.wasm'));

const plugin = {
  name: 'lo2',
  setup(build) {
    build.onResolve({ filter: /^zxing-wasm\/reader\/zxing_reader\.wasm\?url$/ }, () => ({ path: 'wasm-url', namespace: 'lo2' }));
    build.onResolve({ filter: /^zxing-wasm\/reader$/ }, () => ({ path: path.join(QR_DEPS, 'zxing-wasm/dist/es/reader/index.js') }));
    build.onResolve({ filter: /^pdfjs-dist(\/.*)?$/ }, () => ({ path: 'vide', namespace: 'lo2' }));
    build.onLoad({ filter: /^wasm-url$/, namespace: 'lo2' }, () => ({ contents: 'export default "/zxing_reader.wasm";', loader: 'js' }));
    // Vite remplace `new Worker(new URL('./x.worker.ts', import.meta.url))` par le fichier construit ; ici le banc le construit à part (entrée ci-dessous)
    // sous le nom `x.worker.js`, à la racine. Remplacement par split/join (L26), jamais par String.replace.
    build.onLoad({ filter: /src[\\/]services[\\/](decoupeTravail|qrTravail)\.ts$/ }, args => {
      const source = fs.readFileSync(args.path, 'utf8');
      return { contents: source.split("new URL('./decoupe.worker.ts', import.meta.url)").join("'/decoupe.worker.js'").split("new URL('./qr.worker.ts', import.meta.url)").join("'/qr.worker.js'"), loader: 'ts' };
    });
    build.onLoad({ filter: /^vide$/, namespace: 'lo2' }, () => ({ contents: 'export default {}; export const GlobalWorkerOptions = {};', loader: 'js' }));
  },
};
await esbuild.build({
  entryPoints: [path.join(ici, 'harnais.ts')], bundle: true, format: 'esm', outdir: sortie, splitting: true, target: 'es2022',
  plugins: [plugin], logLevel: 'warning', loader: { '.wasm': 'file' }, sourcemap: false,
  // Les `new Worker(new URL(…, import.meta.url))` de l'app : esbuild n'en fait pas d'entrée ; le banc ajoute le worker en entrée (voir `ENTREES_EXTRA`).
  entryNames: '[name]',
});
// Les Workers de l'app, un fichier chacun (format iife, comme un Worker construit par Vite), sans découpage en morceaux.
const racine = path.resolve(ici, '../../../..');
for (const nom of ['decoupe', 'qr']) {
  const source = path.join(racine, `src/services/${nom}.worker.ts`);
  if (fs.existsSync(source)) await esbuild.build({ entryPoints: [source], bundle: true, format: 'iife', outfile: path.join(sortie, `${nom}.worker.js`), target: 'es2022', plugins: [plugin], logLevel: 'warning' });
}
fs.writeFileSync(path.join(sortie, 'harnais.html'), '<!doctype html><meta charset="utf-8"><title>LO-2</title><script type="module" src="./harnais.js"></script>');
console.log(`construit : ${sortie}`);
