// Gestes du prototype houblons v3 (#119), joués par touchers dans Chrome sans interface.
//
// Besoin du brasseur : « Si je fais une stout, je veux voir tous mes houblons qui correspondent
// du + au − à ma stout et pouvoir en comparer 2, 3, 4 facilement avec des infos ou des
// simulations. » Ce contrôle mesure, à 390 × 844 (tactile) sur la stout export :
//   - comparer 2 et 3 houblons choisis : 3 touchers au plus ; 4 houblons : 3 touchers au plus par un raccourci ;
//   - la comparaison montre un radar superposé (un polygone par houblon) et des barres de plage ;
//   - simulation : IBU affiché en moins d'1 s après un changement de dose (saisie) ou de moment ;
//   - remplacement : même IBU à 0,5 IBU près ;
//   - 30 questions présentes, chacune avec une réponse calculée ou « Non documenté : il manque … » ;
//   - aucun défilement horizontal à 390 et 1280 ; aucune erreur de page ; aucun input type=number.
// Usage : node scripts/check-hop-v3.mjs [--out dossier]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const require = createRequire(path.resolve('package.json'));
const puppeteer = require('puppeteer-core');
const out = path.resolve(arg('out', path.join(os.tmpdir(), 'hop-v3')));
fs.mkdirSync(out, { recursive: true });
const src = fs.readFileSync('prototypes/houblons-v3/index.html', 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hop-v3-check-'));
const file = path.join(tmp, 'index.html');
fs.writeFileSync(file, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${src}</body></html>`);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const fails = [], facts = [], errors = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, msg) => { (ok ? facts : fails).push(msg); };

async function open(w = 390, h = 844) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500, deviceScaleFactor: 1 });
  await page.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  page.taps = 0;
  return page;
}
// Un toucher sur la commande visible (au premier plan) dont le libellé commence par `label`.
async function tap(page, sel, label = '') {
  const pt = await page.evaluate((sel, label) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height || r.top < 0 || r.bottom > innerHeight) return null; const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y); return hit && (hit === e || e.contains(hit)) ? [x, y] : null; };
    for (const e of document.querySelectorAll(sel)) {
      const l = (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ');
      if (label && !l.startsWith(label)) continue;
      const p = vis(e); if (p) return p;
    }
    return null;
  }, sel, label);
  if (!pt) throw new Error(`commande non visible sans défiler : ${sel} « ${label} »`);
  await page.touchscreen.tap(pt[0], pt[1]);
  page.taps++;
  await wait(120);
}
const polygons = (page) => page.evaluate(() => document.querySelectorAll('.dock .radar svg polygon[fill-opacity]').length);
const rangeBars = (page) => page.evaluate(() => document.querySelectorAll('.dock .metric .br .b i').length);

try {
  // Comparer 2, puis 3 houblons choisis dans la liste.
  let p = await open();
  await tap(p, '.cb', 'Comparer Target'); await tap(p, '.cb', 'Comparer Galaxy');
  const n2 = await polygons(p); check(n2 === 2 && p.taps <= 3, `comparer 2 : ${p.taps} touchers, ${n2} profils superposés`);
  await tap(p, '.cb', 'Comparer Nelson');
  const n3 = await polygons(p); check(n3 === 3 && p.taps <= 3, `comparer 3 : ${p.taps} touchers, ${n3} profils superposés`);
  await p.screenshot({ path: path.join(out, 'comparer-3.png') });
  // Valeurs complètes à la demande (banque Q02) : 1 toucher de plus, au même endroit.
  await tap(p, '.dock button', 'Agrandir');
  const bars = await rangeBars(p); check(bars >= 3 * 5, `toutes les valeurs à la demande : ${p.taps} touchers, ${bars} barres de plage`);
  await p.screenshot({ path: path.join(out, 'comparer-3-agrandi.png') });
  await p.close();
  // Comparer 4 : un houblon coché, puis « ses 3 plus proches en stock ».
  p = await open();
  await tap(p, '.cb', 'Comparer Target'); await tap(p, '.note .btn', 'ses 3 plus proches');
  const n4 = await polygons(p); check(n4 === 4 && p.taps <= 3, `comparer 4 : ${p.taps} touchers, ${n4} profils superposés`);
  await p.screenshot({ path: path.join(out, 'comparer-4.png') });
  await p.close();
  p = await open();
  await tap(p, '.btn', 'Comparer les 4 premiers');
  const n4b = await polygons(p); check(n4b === 4 && p.taps <= 3, `comparer les 4 premiers : ${p.taps} toucher, ${n4b} profils superposés`);
  await p.close();
  // Choisir, puis simuler : ajout en 1 toucher, dose saisie au clavier, moment changé.
  p = await open();
  await tap(p, '.addb', 'Ajouter 35 g de Galaxy');
  check(p.taps === 1, `choisir : Galaxy ajouté en ${p.taps} toucher`);
  const ibu0 = await p.evaluate(() => window.__v3.prog().hot);
  await tap(p, '.addh', 'Galaxy');
  await p.tap('.ed input');
  await wait(60);
  const t0 = Date.now();
  await p.keyboard.type('20');
  await p.waitForFunction((v) => Math.abs(window.__v3.prog().hot - v) > 1 && /IBU/.test(document.querySelector('.addh .i')?.textContent || ''), { timeout: 2000, polling: 10 }, ibu0);
  const dtType = Date.now() - t0;
  const ibuShown = await p.evaluate(() => document.querySelector('.addh .i').textContent.trim());
  check(dtType < 1000, `simulation (dose 35 → 20 g) : ${dtType} ms, ligne « ${ibuShown} »`);
  const t1 = Date.now();
  await tap(p, '.chip', '30′');
  await p.waitForFunction(() => /30′/.test(document.querySelector('.addh .t')?.textContent || ''), { timeout: 2000, polling: 10 });
  const dtTime = Date.now() - t1;
  check(dtTime < 1000, `simulation (moment 60′ → 30′) : ${dtTime} ms`);
  await p.screenshot({ path: path.join(out, 'simuler.png') });
  await p.close();
  // Remplacer au même IBU : 2 touchers depuis la ligne d'ajout ouverte.
  p = await open();
  await tap(p, '.addb', 'Ajouter 35 g de Galaxy');
  const before = await p.evaluate(() => window.__v3.prog().hot);
  p.taps = 0;
  await tap(p, '.btn', 'Remplacer Galaxy'); await tap(p, '.sub', '');
  const after = await p.evaluate(() => ({ ibu: window.__v3.prog().hot, key: window.__v3.S.adds[0].key }));
  check(Math.abs(after.ibu - before) <= 0.5 && p.taps === 2, `remplacer : ${p.taps} touchers, ${before.toFixed(1)} → ${after.ibu.toFixed(1)} IBU (${after.key}, dose au dixième de gramme)`);
  await p.close();
  // 30 questions, chacune avec une réponse ou un « non documenté » explicite.
  p = await open();
  await tap(p, '.btn', 'Questions');
  const qs = await p.evaluate(() => [...document.querySelectorAll('.qa')].map((e) => ({ id: e.dataset.q, title: e.querySelector('.qt').textContent, text: e.querySelector('.ans').textContent.trim() })));
  const ids = new Set(qs.map((x) => x.id));
  const missing = [...Array(30)].map((_, i) => 'Q' + String(i + 1).padStart(2, '0')).filter((id) => !ids.has(id));
  const bad = qs.filter((x) => x.text.length < 20 || /Erreur|NaN|undefined|Infinity/.test(x.text) || (/Non documenté/.test(x.text) && !/il manque/.test(x.text)));
  const nd = qs.filter((x) => /^Non documenté/.test(x.text) || /Non documenté : il manque/.test(x.text) && !/\d/.test(x.text.split('Non documenté')[0]));
  check(missing.length === 0 && bad.length === 0, `questions : ${qs.length} présentes${missing.length ? `, absentes ${missing.join(', ')}` : ''}${bad.length ? `, réponses vides ou fautives ${bad.map((x) => x.id).join(', ')}` : ''} ; « non documenté » en tête : ${nd.map((x) => x.id).join(', ') || 'aucune'}`);
  fs.writeFileSync(path.join(out, 'questions.json'), JSON.stringify(qs, null, 2));
  await p.close();
  // Débordement horizontal, type=number, à 390 et 1280, avec comparaison ouverte.
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    p = await open(w, h);
    await p.evaluate(() => window.__v3.compare(['target', 'galaxy', 'nelson-sauvin', 'citra:cryo']));
    const o = await p.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, iw: innerWidth, wide: [...document.querySelectorAll('#app *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('[style*="overflow"]'); }).slice(0, 3).map((e) => e.className || e.tagName), num: document.querySelectorAll('input[type="number"]').length }));
    check(o.sw <= o.iw && o.wide.length === 0 && o.num === 0, `${w} px : largeur ${o.sw}/${o.iw}${o.wide.length ? ', dépassent : ' + o.wide.join(', ') : ''}, type=number ${o.num}`);
    await p.close();
  }
} catch (e) { fails.push('jeu interrompu : ' + e.message); }
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
if (errors.length) fails.push('erreurs de page : ' + errors.slice(0, 3).join(' | '));
const line = facts.join(' ; ');
if (!fails.length) console.log('HOP-V3 OK ' + line);
else { console.log('HOP-V3 FAIL ' + fails.join(' ; ') + (line ? ' || tenus : ' + line : '')); process.exitCode = 1; }
