// Critique B1 n° 2 et 3 (07.11) : dans l'ajout de Fermentescibles, « Crystal 60 » ↵ doit créer « Crystal 60 » (pas 60 kg de « Crystal ») et
// « 0,2 » ↵ seul ne doit créer aucun ingrédient. Joue le vrai écran d'un build figé (servi par interception, aucun serveur), 390 tactile.
// Usage : node controle-ajout.mjs <dossier construit (vite.ferm.config.mjs)> [<capture.png>]   → AJOUT OK | AJOUT ECHEC <raisons>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const [construit, capture] = process.argv.slice(2);
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.setRequestInterception(true);
p.on('request', r => {
  const u = new URL(r.url());
  if (u.host !== 'localhost:4319') return r.abort(); // « ?dev-local » n'ouvre que sur localhost : servi par interception, sans serveur
  let f = path.join(construit, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(construit, 'index.html');
  r.respond({ status: 200, contentType: TYPES[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
});
const dormir = ms => new Promise(r => setTimeout(r, ms));
await p.goto('http://localhost:4319/?dev-local&etape=houblons&recette=vide&malts=maquette', { waitUntil: 'networkidle0' });
await p.waitForSelector('[data-etape="fermentescibles"] [data-role="ajout"]', { timeout: 60000 });
const lignes = () => p.$$eval('[data-etape="fermentescibles"] [data-role="nom"]', els => els.map(e => e.textContent.trim()));
const avant = await lignes();
const taper = async t => { await p.tap('[data-role="ajout"]'); await dormir(200); await p.keyboard.type(t, { delay: 10 }); await p.keyboard.press('Enter'); await dormir(500); };
await taper('Crystal 60');
const apresCrystal = await lignes();
// La ligne créée et sa masse : le texte de la rangée qui porte le nom.
const rangee = await p.evaluate(() => {
  const n = [...document.querySelectorAll('[data-etape="fermentescibles"] [data-role="nom"]')].find(e => /crystal/i.test(e.textContent));
  const r = n?.closest('[data-sel], li, [role="row"], .fer-l') ?? n?.parentElement?.parentElement;
  return r ? r.textContent.replace(/\s+/g, ' ').trim() : null;
});
await p.keyboard.press('Escape'); await dormir(200);
await taper('0,2');
const apresChiffre = await lignes();
// Le champ garde « 0,2 » : il ne doit pas promettre une création (bouton « 0,2 ↵ » qui ne fait rien).
const promesse = await p.evaluate(() => document.querySelector('[data-role="apercu"]')?.classList.contains('fer-vu') ?? false);
if (capture) await p.screenshot({ path: capture });
await nav.close();
const raisons = [];
if (!apresCrystal.some(n => /^crystal 60$/i.test(n))) raisons.push(`« Crystal 60 » absent (noms : ${apresCrystal.filter(n => /crystal/i.test(n)).join(' | ') || 'aucun crystal'})`);
if (rangee && /(^|[^\d])60(,0+)?\s*kg/i.test(rangee)) raisons.push(`masse 60 kg lue dans le nom (rangée : ${rangee.slice(0, 80)})`);
if (apresChiffre.some(n => /^0,2$/.test(n))) raisons.push('« 0,2 » créé comme ingrédient');
else if (promesse) raisons.push('« 0,2 ↵ » proposé sans rien faire');
console.log(JSON.stringify({ avant: avant.length, apresCrystal: apresCrystal.length, apresChiffre: apresChiffre.length, rangee }));
console.log(raisons.length ? `AJOUT ECHEC ${raisons.join(' ; ')}` : 'AJOUT OK');
