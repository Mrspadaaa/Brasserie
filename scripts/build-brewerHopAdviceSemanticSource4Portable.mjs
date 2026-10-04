import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = resolve(dirname(scriptPath), '..');
const source4Root = resolve(root, 'src/services/hopV55');
const sharedDomainRoot = resolve(root, 'src/domain');
const source4Output = resolve(root, 'functions/lib/brewerHopAdviceSemanticSource4.js');
const source4ManifestPath = resolve(root, 'source4-portable-bundle-manifest-01.json');

const source4Result = await build({
  absWorkingDir: root,
  entryPoints: ['src/services/hopV55/brewerHopAdviceSemanticSource4.ts'],
  outfile: source4Output,
  bundle: true,
  preserveSymlinks: true,
  metafile: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  plugins: [{
    name: 'source4-typescript-relative-imports',
    setup(bundler) {
      bundler.onResolve({ filter: /^\.[^/].*\.js$/ }, args => {
        if (!args.importer.startsWith(source4Root) && !args.importer.startsWith(sharedDomainRoot)) return undefined;
        const tsPath = resolve(dirname(args.importer), args.path.replace(/\.js$/, '.ts'));
        return existsSync(tsPath) ? { path: tsPath } : undefined;
      });
    },
  }],
});

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = [];
for (const inputPath of Object.keys(source4Result.metafile.inputs).sort()) {
  const absolute = resolve(root, inputPath);
  const bytes = await readFile(absolute);
  const portablePath = relative(root, absolute).split(sep).join('/');
  if (portablePath.startsWith('../') || portablePath.includes('/work/')) {
    throw Error(`Source4 portable bundle imported outside its project root: ${portablePath}`);
  }
  inputs.push({ path: portablePath, bytes: bytes.byteLength, sha256: sha256(bytes) });
}
await mkdir(dirname(source4ManifestPath), { recursive: true });
const manifest = {
  format: 'brewer-hop-advice-semantic-source4-portable-bundle-manifest-v1',
  entryPoint: 'src/services/hopV55/brewerHopAdviceSemanticSource4.ts',
  outputFile: relative(root, source4Output).split(sep).join('/'),
  outputBytes: (await stat(source4Output)).size,
  inputCount: inputs.length,
  inputs,
};
await writeFile(source4ManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Bundled portable source4 bridge: ${manifest.outputBytes} bytes; ${manifest.inputCount} hashed inputs.`);
