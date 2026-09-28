// Serve the real App with local-only repository adapters and opt-in POC fixtures.
// No Firebase account, remote write, or production data is used by this build.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';

const dir = resolve(tmpdir(), 'laffinee-hop-qa-ux-mobile-serve');
if (!process.argv.includes('--reuse-build')) await buildHopRecipeQa(dir);
const port = Number(process.env.UX_POC_PORT ?? 4178);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('UX_POC_PORT doit être un port valide.');
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(dir, pathname === '/' ? 'tests/qa/hop-recipe/index.html' : `.${pathname}`);
    if (!file.startsWith(`${dir}${sep}`)) { response.writeHead(403); response.end(); return; }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`POC UX mobile (fixtures seules) : http://127.0.0.1:${port}/?ux-poc=1`);
  console.log(`Réinitialiser les fixtures : http://127.0.0.1:${port}/?ux-poc=reset (puis revenir à ?ux-poc=1 avant de recharger).`);
});
