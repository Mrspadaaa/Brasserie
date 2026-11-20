// DC-1b : joue `__angleEtude` (ou la fonction de FN) sur toutes les pièces d'un dossier ; écrit un JSON { nom: { rot, k, ...résultat } } et résume l'erreur.
// Usage : node etude-angle.mjs <dossier construit> <dossier de pièces> <sortie.json> [pair|impair]
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const [construit, dossier, sortie, moitie] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };
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
const fn = process.env.FN ?? '__angleEtude';
let pieces = fs.readdirSync(dossier).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4)).sort();
if (moitie) pieces = pieces.filter((_, i) => (i % 2 === 0) === (moitie === 'pair'));
const out = {};
for (const nom of pieces) {
  const vf = path.join(dossier, `${nom}.verite.json`);
  const p = fs.existsSync(vf) ? JSON.parse(fs.readFileSync(vf, 'utf8')).params ?? {} : {};
  const r = await page.evaluate((a, f) => window[f](a, 'image/jpeg'), fs.readFileSync(path.join(dossier, `${nom}.jpg`)).toString('base64'), fn);
  out[nom] = { rot: p.rot ?? 0, k: p.k ?? 0, ...r };
}
fs.writeFileSync(sortie, JSON.stringify(out, null, 1));
const parMoitie = {};
const cles = Object.keys(Object.values(out)[0]).filter(k => !['rot', 'k'].includes(k) && typeof Object.values(out)[0][k] === 'number' && /^(ink|coupe|mix|a\d)/.test(k));
for (const k of cles) {
  const err = Object.values(out).map(r => Math.abs(r[k] - r.rot));
  const faux = err.filter(e => e > 0.35).length, moy = err.reduce((a, b) => a + b, 0) / err.length;
  console.log(`${k} : ${pieces.length} pièces, erreur moyenne ${moy.toFixed(3)}°, > 0,35° : ${faux}, > 1° : ${err.filter(e => e > 1).length}`);
}
await nav.close();
