import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const mission = resolve('work/houblons-v55-integration-app-2026-10-02');
const build = JSON.parse(await readFile(resolve(mission, 'last-qa-build.json'), 'utf8'));
const directory = resolve(process.argv[2] || build.path);
if (!directory.startsWith(mission + sep) || !directory.includes('qa-build-')) throw Error('Servir uniquement un build QA de cette mission.');
const port = Number(process.argv[3] || 5194);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
    const file = resolve(directory, path === '/' ? 'tests/qa/hop-v55/index.html' : '.' + path);
    if (!file.startsWith(directory + sep)) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(file); res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store'); res.end(bytes);
  } catch { res.writeHead(404); res.end('Fichier QA absent.'); }
}).listen(port, '127.0.0.1', () => console.log(`Fixture figée : http://127.0.0.1:${port}/tests/qa/hop-v55/index.html\n${directory}`));
