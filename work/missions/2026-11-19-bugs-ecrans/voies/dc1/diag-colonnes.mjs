// DC-1b : scores par colonne d'une pièce (__angleColonnes). Usage : node diag-colonnes.mjs <construit> <piece.jpg> <ink|coupe>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const [construit, piece, carte] = process.argv.slice(2);
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await nav.newPage();
await page.setRequestInterception(true);
page.on('request', req => { const u = new URL(req.url()); if (u.host !== 'banc.test') return req.abort(); const f = path.join(construit, decodeURIComponent(u.pathname)); if (!fs.existsSync(f)) return req.respond({ status: 404, body: '' }); req.respond({ status: 200, contentType: f.endsWith('.html') ? 'text/html' : 'text/javascript', body: fs.readFileSync(f) }); });
await page.goto('http://banc.test/harnais.html', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__pret === true, { timeout: 60_000 });
const r = await page.evaluate((a, c) => window.__angleColonnes(a, 'image/jpeg', c), fs.readFileSync(piece).toString('base64'), carte);
console.log(JSON.stringify({ w: r.w, hh: r.hh, colonnes: r.colonnes, masses: r.masses })); console.log(r.lignes.join('\n'));
await nav.close();
