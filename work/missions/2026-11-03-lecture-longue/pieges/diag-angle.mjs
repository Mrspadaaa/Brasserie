// D381 : les scores de l'angle d'une pièce (global et par colonnes), de -5° à 5°. Aucune IA. Hors de Git.
// Usage : node diag-angle.mjs <dossier construit> <pièce>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const [construit, piece] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm' };
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await nav.newPage();
await page.setRequestInterception(true);
page.on('request', req => {
  const u = new URL(req.url());
  if (u.host !== 'banc.test') return req.abort();
  const f = path.join(construit, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f)) return req.respond({ status: 404, body: '' });
  req.respond({ status: 200, contentType: TYPES[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
});
await page.goto('http://banc.test/harnais.html', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__pret === true, { timeout: 60_000 });
const r = await page.evaluate((b, t) => window.__diagAngle(b, t), fs.readFileSync(piece).toString('base64'), /\.png$/i.test(piece) ? 'image/png' : 'image/jpeg');
const { lignes, ...reste } = r; console.log(JSON.stringify(reste)); console.log(lignes.join(String.fromCharCode(10)));
await nav.close();
