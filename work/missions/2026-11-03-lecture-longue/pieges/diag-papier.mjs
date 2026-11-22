// D381 : le papier d'une vraie pièce (trouvé ou refusé, et pourquoi) et ses cartes d'encre en PNG dans <sortie>. Aucune IA. Hors de Git.
// Usage : node diag-papier.mjs <dossier construit> <pièce> <sortie>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const [construit, piece, sortie] = process.argv.slice(2);
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
const r = await page.evaluate((b, t) => window.__diagPapier(b, t), fs.readFileSync(piece).toString('base64'), /\.png$/i.test(piece) ? 'image/png' : 'image/jpeg');
fs.mkdirSync(sortie, { recursive: true });
fs.writeFileSync(path.join(sortie, 'encre-nette.png'), Buffer.from(r.ink, 'base64'));
fs.writeFileSync(path.join(sortie, 'encre-sensible.png'), Buffer.from(r.coupe, 'base64'));
const { ink, coupe, ...reste } = r; console.log(JSON.stringify(reste));
await nav.close();
