// Lot 21 · a3 · la preuve que le profil bouge : on relève le centre simulé de chaque famille (data-centre),
// on touche un réglage, on relève encore, on capture avant et après (premier écran, 390 × 844).
// Usage : node a3/preuve-profil.mjs [sélecteur du réglage, défaut : le plan « osé »]
// Imprime PROFIL BOUGE OK et le détail, ou PROFIL IMMOBILE ; écrit a3/preuve-profil.json et les captures.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ici = path.dirname(fileURLToPath(import.meta.url));
const cible = process.argv[2] || '[data-plan="ose"]';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(path.join(ici, 'etat.html')).href, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
const releve = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-role="barres"] .vb[data-famille]')].map((e) => [e.dataset.famille, Number(e.dataset.centre)])));
const plan = () => page.evaluate(() => ({ houblons: [...document.querySelectorAll('[data-role="ajout"] .hn[data-houblon]')].map((e) => e.dataset.houblon), moment: (document.querySelector('[data-moment][aria-checked="true"]') || {}).textContent, levure: (document.querySelector('[data-levure][aria-checked="true"]') || {}).textContent, change: document.querySelector('[data-role="change"]').innerText }));
const avant = await releve(), pa = await plan();
await page.screenshot({ path: path.join(ici, '../captures/a3-avant-390.png') });
const b = await page.$(cible); await b.tap(); await new Promise((r) => setTimeout(r, 600));
const apres = await releve(), pb = await plan();
await page.screenshot({ path: path.join(ici, '../captures/a3-apres-390.png') });
await browser.close();
const diff = Object.keys(avant).map((f) => ({ famille: f, avant: Math.round(avant[f] * 10) / 10, apres: Math.round(apres[f] * 10) / 10, ecart: Math.round((apres[f] - avant[f]) * 10) / 10 })).filter((x) => Math.abs(x.ecart) >= 1);
fs.writeFileSync(path.join(ici, 'preuve-profil.json'), JSON.stringify({ reglage: cible, avant: pa, apres: pb, familles: diff }, null, 1));
console.log('avant : ' + pa.houblons.join(' + ') + ' · ' + pa.moment + ' · ' + pa.levure);
console.log('après : ' + pb.houblons.join(' + ') + ' · ' + pb.moment + ' · ' + pb.levure);
for (const x of diff) console.log('  ' + x.famille.padEnd(10) + ' ' + x.avant + ' → ' + x.apres + ' (' + (x.ecart > 0 ? '+' : '') + x.ecart + ')');
console.log('  écrit sur la page : ' + pb.change.replace(/\s+/g, ' '));
console.log(diff.length ? 'PROFIL BOUGE OK ' + diff.length + ' famille(s)' : 'PROFIL IMMOBILE');
process.exit(diff.length ? 0 : 1);
