// LO-2 : joue des photos dans le banc construit (construire.mjs) et rend, pour chaque phase, les tâches longues du fil principal.
// Usage : node mesurer.mjs <dossier construit> <dossier de pièces> <sortie.json> [--pieces a,b] [--phases decoupe,qr,les-deux,plan] [--cpu 4] [--synthese]
// Chrome est servi par interception (aucun serveur), avec les CSP de production de firebase.json.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), positionnels = [], opt = {};
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) { const k = args[i].slice(2); opt[k] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true; } else positionnels.push(args[i]); }
const [construit, dossier, sortie] = positionnels;
const phases = String(opt.phases ?? 'decoupe,qr,les-deux,plan').split(',');
const cpu = Number(opt.cpu ?? 1);
const ici = path.dirname(fileURLToPath(import.meta.url));
const regles = JSON.parse(fs.readFileSync(path.resolve(ici, '../../../../firebase.json'), 'utf8')).hosting.headers;
const motif = glob => {
  let r = '';
  for (let i = 0; i < glob.length; i++) {
    if (glob.startsWith('**/', i)) { r += '(?:.*/)?'; i += 2; }
    else if (glob.startsWith('**', i)) { r += '.*'; i += 1; }
    else if (glob[i] === '*') r += '[^/]*';
    else if (glob.startsWith('@(', i)) { const j = glob.indexOf(')', i); r += '(?:' + glob.slice(i + 2, j) + ')'; i = j; }
    else r += glob[i].replace(/[.+^${}()|[\]\\?]/g, '\\$&');
  }
  return new RegExp('^' + r + '$');
};
const csp = chemin => { let v = null; for (const r of regles) if (motif(r.source).test(chemin)) for (const h of r.headers) if (h.key === 'Content-Security-Policy') v = h.value; return v; };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm' };
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-extensions'] });
const page = await nav.newPage();
await page.setViewport({ width: 525, height: 900 });
if (cpu > 1) await (await page.createCDPSession()).send('Emulation.setCPUThrottlingRate', { rate: cpu });
// --sans-worker : un navigateur sans Worker ni OffscreenCanvas (vieux Safari) ; l'app doit marcher sur le fil principal, en rendant la main.
if (opt['sans-worker']) await page.evaluateOnNewDocument(() => { delete window.Worker; delete window.OffscreenCanvas; });
await page.setRequestInterception(true);
page.on('pageerror', e => console.log('pageerror', String(e).slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') console.log('console.error', m.text().slice(0, 200)); });
page.on('request', req => {
  const u = new URL(req.url());
  if (u.host !== 'banc.test') return req.abort();
  const f = path.join(construit, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f)) return req.respond({ status: 404, body: '' });
  const politique = csp(decodeURIComponent(u.pathname));
  req.respond({ status: 200, contentType: TYPES[path.extname(f)] ?? 'application/octet-stream', headers: politique ? { 'Content-Security-Policy': politique } : {}, body: fs.readFileSync(f) });
});
await page.goto('http://banc.test/harnais.html', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__pret === true, { timeout: 60_000 });

const voulues = opt.pieces ? String(opt.pieces).split(',') : null;
const fichiers = fs.readdirSync(dossier).filter(f => /\.(jpe?g|png)$/i.test(f) && !/masque/.test(f) &&fs.statSync(path.join(dossier, f)).size <= 4 * 1024 * 1024 && (!voulues || voulues.some(v => f.startsWith(v))));
const resultats = [];
for (const f of fichiers) {
  const b64 = fs.readFileSync(path.join(dossier, f)).toString('base64');
  const type = /png$/i.test(f) ? 'image/png' : 'image/jpeg';
  try {
    const r = await page.evaluate((a, b, c, d) => window.__mesurer(a, b, c, d), b64, f, type, phases);
    resultats.push(r);
    const ligne = k => r[k] ? `${k} ${r[k].duree}ms max ${r[k].max} total ${r[k].total} bat ${r[k].battementMax} [${r[k].taches.slice(0, 6).join(',')}${r[k].taches.length > 6 ? '…' : ''}]` : '';
    console.log(`${f} ${r.taille} | ${['decoupe', 'qr', 'lesDeux'].map(ligne).filter(Boolean).join(' | ')}${r.qr ? ` | qr=${r.qr.statut}${r.qr.bulletins ? `/${r.qr.bulletins}` : ''} ${r.qr.montant ?? ''}` : ''}`);
  } catch (e) { console.log(`${f} ERREUR ${String(e).slice(0, 200)}`); resultats.push({ nom: f, erreur: String(e) }); }
}
fs.writeFileSync(sortie, JSON.stringify(resultats, null, 1));
await nav.close();
