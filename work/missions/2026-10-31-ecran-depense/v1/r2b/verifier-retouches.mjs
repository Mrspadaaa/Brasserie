// Vérifie les trois retouches de la synthèse sur r2b, et le pied toujours actif.
// Usage : node work/missions/2026-10-31-ecran-depense/v1/r2b/verifier-retouches.mjs
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'file:///' + path.join(ICI, 'etat.html').replace(/\\/g, '/');
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await nav.newPage();
const ouvrir = async (w, h, m) => { await p.setViewport({ width: w, height: h, isMobile: m, hasTouch: m }); await p.goto(URL, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready); };
const res = [];
const note = (nom, ok, detail) => res.push(`${ok ? 'OK    ' : 'ECHEC '} ${nom} · ${detail}`);

// R1 : les 6 points lisibles à 390 sans défiler (au-dessus du pied).
await ouvrir(390, 844, true);
const r1 = await p.evaluate(() => {
  const pied = document.querySelector('#r2b-pied').getBoundingClientRect().top;
  const pts = [...document.querySelectorAll('.r2b-tile .r2b-no,.r2b-pc .r2b-no')].map((e) => ({ n: e.textContent, bas: Math.round(e.closest('.r2b-tile,.r2b-pc').getBoundingClientRect().bottom) }));
  return { pied: Math.round(pied), pts };
});
note('R1 six points au premier écran', r1.pts.length === 6 && r1.pts.every((x) => x.bas < r1.pied), r1.pts.map((x) => `${x.n}@${x.bas}`).join(' ') + ` < pied ${r1.pied}`);
// R1 bis : un chip saute à sa ligne, et se barre une fois réglé.
const saut = await p.evaluate(async () => {
  document.querySelector('[data-va="p4"]').click(); await new Promise((r) => setTimeout(r, 900));
  const li = document.querySelector('.r2b-li[data-n="8"]').getBoundingClientRect();
  document.querySelector('[data-bis="8"]').click();
  const c = document.querySelector('[data-va="p4"]');
  return { haut: Math.round(li.top), barre: getComputedStyle(c).textDecorationLine, fait: c.classList.contains('r2b-fait') };
});
note('R1 chip → ligne, barré une fois réglé', saut.haut > 40 && saut.haut < 800 && saut.fait && saut.barre.includes('line-through'), `ligne Target à ${saut.haut} px · ${saut.barre}`);

// R2 : chaque point se règle sans ouvrir de plateau.
await ouvrir(390, 844, true);
const r2 = await p.evaluate(() => {
  const clic = (s) => document.querySelector(s).click();
  clic('#r2b-ttva'); clic('[data-tva="vide"]'); clic('#r2b-tpay'); clic('[data-ok="p2"]');
  clic('[data-tous]'); clic('[data-bis="8"]'); clic('[data-bis="22"]'); clic('[data-u="g"]');
  return { plateaux: document.querySelectorAll('.r2b-plat').length, chipsFaits: document.querySelectorAll('.r2b-pc.r2b-fait').length, tuilesFaites: document.querySelectorAll('.r2b-tile.r2b-fait').length, doutes: document.querySelectorAll('.r2b-li.r2b-dt,.r2b-mo:not(.r2b-ok)').length, total: document.querySelector('#r2b-detv').textContent };
});
note('R2 six points réglés sans plateau', r2.plateaux === 0 && r2.chipsFaits === 4 && r2.tuilesFaites === 2 && r2.doutes === 0 && r2.total === '86,50', JSON.stringify(r2));

// R3 : la preuve à un toucher (390), et ouverte d'office à 1280 ; pas de trou à 1280.
await ouvrir(390, 844, true);
const r3 = await p.evaluate(() => { document.querySelector('#r2b-pbtn').click(); const e = document.querySelector('#r2b-preuve'); return { vu: !e.hidden, txt: e.innerText.replace(/\n/g, ' | ') }; });
note('R3 preuve à un toucher', r3.vu && /86,50/.test(r3.txt) && /23\/23/.test(r3.txt) && /2\/2/.test(r3.txt) && /page 2 coupée/.test(r3.txt), r3.txt);
await ouvrir(1280, 800, false);
const r3b = await p.evaluate(() => {
  const g = document.querySelector('.r2b-c3').getBoundingClientRect().bottom, pied = document.querySelector('#r2b-pied').getBoundingClientRect().top;
  return { preuve: !document.querySelector('#r2b-preuve').hidden, ref: document.querySelector('#r2b-ref').open, gauche: Math.round(g), pied: Math.round(pied), chips: Math.round(document.querySelector('#r2b-pts').getBoundingClientRect().bottom) };
});
note('R3 1280 : preuve, chips, référence à gauche, sans trou', r3b.preuve && r3b.ref && r3b.pied - r3b.gauche < 60, `colonne gauche jusqu'à ${r3b.gauche} px, pied à ${r3b.pied} px, chips à ${r3b.chips} px`);

// Pied : Confirmer actif avec les 6 points ouverts ; le reçu dit ce qui est laissé.
await ouvrir(390, 844, true);
const pied = await p.evaluate(async () => {
  const b = document.querySelector('#r2b-go'); const actif = !b.disabled && getComputedStyle(b).pointerEvents !== 'none';
  b.click(); await new Promise((r) => setTimeout(r, 2000));
  return { actif, recu: document.querySelector('#r2b-pi').innerText.replace(/\n/g, ' | ') };
});
note('Pied actif, points ouverts', pied.actif && /2026-04-27 Brau- und Rauchshop 372765\.jpg/.test(pied.recu) && /Ouvrir dans Drive/.test(pied.recu) && /À revoir/.test(pied.recu), pied.recu);
await nav.close();
console.log(res.join('\n'));
const ko = res.filter((l) => l.startsWith('ECHEC')).length;
console.log(ko ? `RETOUCHES ECHEC ${ko}` : `RETOUCHES OK ${res.length}/${res.length}`);
process.exitCode = ko ? 1 : 0;
