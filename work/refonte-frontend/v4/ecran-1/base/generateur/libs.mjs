// Empaquette radar-entree.js en un script classique (IIFE) collé dans chaque page : les pages
// s'ouvrent en file://, sans module ni requête. Paquets et esbuild : ceux du dépôt (node_modules).
// Usage : node libs.mjs  →  lib-radar.js
import path from 'node:path';
import { createRequire } from 'node:module';
const ROOT = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const require = createRequire(ROOT + '/package.json');
const esbuild = require('esbuild');
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const r = esbuild.buildSync({
  entryPoints: [path.join(HERE, 'radar-entree.js')], bundle: true, format: 'iife', minify: true,
  define: { 'process.env.NODE_ENV': '"production"' }, outfile: path.join(HERE, 'lib-radar.js'),
  nodePaths: [ROOT + '/node_modules'], metafile: true, logLevel: 'warning',
});
const o = Object.values(r.metafile.outputs)[0];
console.log('lib-radar.js', (o.bytes / 1024).toFixed(1), 'Ko');
