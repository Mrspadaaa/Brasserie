// Captures d'états (B8) et d'un geste (B1, B9) pour chaque concept e1..e6 : #neuve, #plein, #nolo, #long,
// puis un glisser sur le booster principal, avant/après, et un passage en mouvement réduit.
// Écrit dans v0/<id>/etats/. Imprime une ligne par concept, puis ETATS OK ou ETATS ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const V0 = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-identite/v0';
const GESTE = { e1: '#e1-jf', e2: '#e2-bf', e3: '#e3-hit', e4: '#e4-in', e5: '#e5-dial', e6: '#e6-hit' };
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(GESTE);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
let echecs = 0;
for (const id of ids) {
  const dir = path.join(V0, id, 'etats'); fs.mkdirSync(dir, { recursive: true });
  const url = 'file:///' + path.join(V0, id, 'etat.html').split(path.sep).join('/');
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
  const notes = [];
  for (const h of ['neuve', 'plein', 'nolo', 'long']) {
    await p.goto(url + '#' + h); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(dir, h + '.png') });
    const t = await p.evaluate(() => document.body.innerText);
    if (/NaN|null|undefined|\[object/.test(t)) { erreurs.push(h + ' : valeur brute'); }
    if (h === 'plein' && !/Fermenteur plein/.test(t)) erreurs.push('plein : alerte absente');
    if (h === 'neuve' && !/Fermenteur plein/.test(t)) notes.push('neuve sans alerte');
  }
  await p.goto(url); await p.evaluate(() => document.fonts.ready);
  const el = await p.$(GESTE[id]); const r = await el.boundingBox();
  const lire = () => p.evaluate(() => document.querySelector('main').innerText.replace(/\s+/g, ' '));
  const avant = await lire();
  await p.screenshot({ path: path.join(dir, 'geste-avant.png') });
  // e5 : on tourne le cadran vers 90 min (gauche) ; ailleurs on glisse vers 28 L environ.
  let x0, y0, x1, y1;
  if (id === 'e5') { x0 = r.x + r.width / 2; y0 = r.y + r.height - 8; x1 = r.x + 8; y1 = r.y + r.height / 2; }
  else if (id === 'e1' || id === 'e2') { y0 = y1 = r.y + r.height / 2; x0 = r.x + r.width * 0.8; x1 = r.x + r.width * 0.93; }
  else { x0 = x1 = r.x + r.width / 2; y0 = r.y + r.height * 0.25; y1 = r.y + r.height * 0.1; }
  const t0 = Date.now();
  await p.mouse.move(x0, y0); await p.mouse.down();
  const pendant = await p.evaluate((s) => document.querySelector(s).className.baseVal ?? document.querySelector(s).className, GESTE[id]);
  for (let k = 1; k <= 8; k++) { await p.mouse.move(x0 + (x1 - x0) * k / 8, y0 + (y1 - y0) * k / 8); if (id === 'e5') { const a = Math.PI / 2 + (Math.PI / 2) * k / 8; await p.mouse.move(r.x + r.width / 2 + Math.cos(a) * r.width * 0.43, r.y + r.height / 2 + Math.sin(a) * r.height * 0.43); } }
  await p.screenshot({ path: path.join(dir, 'geste-pendant.png') });
  await p.mouse.up();
  const apres = await lire(); const ms = Date.now() - t0;
  await p.screenshot({ path: path.join(dir, 'geste-apres.png') });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(url); await p.evaluate(() => document.fonts.ready);
  const reduit = await lire();
  const change = avant !== apres;
  if (!change) erreurs.push('le geste ne change rien');
  if (reduit !== avant) erreurs.push('mouvement réduit : texte différent');
  const diff = apres.split(' ').filter((w, i) => w !== avant.split(' ')[i]).slice(0, 6).join(' ');
  console.log(`${id} : états 4 capturés${notes.length ? ' (' + notes.join(', ') + ')' : ''} ; geste ${change ? 'change' : 'NE CHANGE PAS'} (${diff}) ; retour pendant : ${/tient/.test(pendant) ? 'oui' : 'non'} ; ${erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur'}`);
  if (erreurs.length) echecs++;
  await p.close();
}
await b.close();
console.log(echecs ? 'ETATS ECHEC ' + echecs : 'ETATS OK');
