// DC-1 : diagnostic d'une pièce du banc (papier trouvé, boîte grandie, recadrage, angle) et, avec --png <dossier>, la carte d'encre en PNG.
// Usage : node diag-piece.mjs <dossier construit> <dossier de pièces> <piece> [--png <dossier de sortie>]
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const [construit, dossier, piece, opt, sortiePng] = process.argv.slice(2);
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
const b64 = fs.readFileSync(path.join(dossier, `${piece}.jpg`)).toString('base64');
const r = await page.evaluate((a, fn) => window[fn](a, 'image/jpeg'), b64, process.env.FN ?? '__diagPapier');
const { ...rest } = r;
for (const k of Object.keys(rest)) if (typeof rest[k] === 'string' && rest[k].length > 300) { if (opt === '--png') fs.writeFileSync(path.join(sortiePng, `${piece}-${k}.png`), Buffer.from(rest[k], 'base64')); rest[k] = `<png ${rest[k].length}>`; }
console.log(JSON.stringify(rest).slice(0, 9000));
await nav.close();
