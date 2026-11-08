// D381 : passe une vraie pièce (photo, capture) dans la VRAIE découpe de l'app (`decouperPiece`, construite par vite.banc.config.mjs) et écrit ses
// morceaux et bandes de contrôle en JPEG dans <sortie>, pour les regarder. Aucune IA, aucun réseau. Les pièces et les sorties restent hors de Git.
// Usage : node plan-piece.mjs <dossier construit> <pièce.jpg|png> <sortie> [force]
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';

const [construit, piece, sortie, force] = process.argv.slice(2);
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
const type = /\.png$/i.test(piece) ? 'image/png' : 'image/jpeg';
const r = await page.evaluate((b, t, f) => window.__plan(b, t, f), fs.readFileSync(piece).toString('base64'), type, force === 'force');
fs.mkdirSync(sortie, { recursive: true });
if (r.normalise) fs.writeFileSync(path.join(sortie, 'normalise.jpg'), Buffer.from(r.normalise, 'base64'));
for (const p of r.parties ?? []) fs.writeFileSync(path.join(sortie, `m${String(p.k).padStart(2, '0')}.jpg`), Buffer.from(p.data, 'base64'));
for (const j of r.jonctions ?? []) if (j.data) fs.writeFileSync(path.join(sortie, `j${String(j.k).padStart(2, '0')}.jpg`), Buffer.from(j.data, 'base64'));
console.log(JSON.stringify({ coupee: r.coupee, parties: (r.parties ?? []).length, lignesTexte: r.lignesTexte, haute: r.haute, image: `${r.largeur}×${r.hauteur}`, msPlan: r.msPlan, msDecoupe: r.msDecoupe, g: r.g, morceaux: r.morceaux?.map(m => [m.top, m.bottom, m.forced]), forcees: (r.parties ?? []).filter(p => p.coupeForcee).length, bandes: (r.jonctions ?? []).length, papierFinal: r.papierFinal, colonnes: r.colonnes, pas: r.pas, minCoupes: r.minCoupes }));
await nav.close();
