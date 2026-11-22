// Rejoue au doigt (390 × 844 tactile) chaque geste corrigé après la critique du 16.11, clair puis cave.
// Contrôle : le message ne touche jamais le +, s'efface au changement d'écran ; captures dans captures/corr/.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const J = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAP = path.join(J, 'captures', 'corr');
fs.mkdirSync(CAP, { recursive: true });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
const res = [];
let page, sujet, theme;
async function ouvre(s, q = '') {
  sujet = s;
  page = await browser.newPage();
  await page.emulate({ viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile' });
  const qs = [theme === 'cave' ? 'theme=cave' : '', q].filter(Boolean).join('&');
  await page.goto(pathToFileURL(path.join(J, s, 'index.html')).href + (qs ? '?' + qs : ''), { waitUntil: 'load' });
  await pause(300);
}
async function tap(sel) {
  const h = await page.$(sel);
  if (!h) throw new Error('absent ' + sel);
  await page.evaluate((el) => el.scrollIntoView({ block: 'center' }), h);
  await pause(150);
  const b = await h.boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await pause(350);
}
const verifie = async (nom, fn, arg) => { const v = await page.evaluate(fn, arg); res.push({ sujet, theme, nom, ok: v === true, v }); };
const cap = async (nom) => page.screenshot({ path: path.join(CAP, `${sujet}-${nom}${theme === 'cave' ? '-cave' : ''}.png`) });
// Le message visible (s'il y en a un) ne recouvre pas le +, à 8 px près.
const MSG_HORS_FAB = () => {
  const vis = (e) => e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
  const m = ['jx-toast', 'toast', 's-toast'].map((i) => document.getElementById(i)).find(vis);
  const f = [...document.querySelectorAll('.fab,#fab,#s-fab,[data-fab]')].find(vis);
  if (!m) return 'aucun message';
  if (!f) return true;
  const a = m.getBoundingClientRect(), b = f.getBoundingClientRect();
  const sep = a.right + 8 <= b.left || b.right + 8 <= a.left || a.bottom + 8 <= b.top || b.bottom + 8 <= a.top;
  return sep || `chevauche : msg ${Math.round(a.left)},${Math.round(a.top)}–${Math.round(a.right)},${Math.round(a.bottom)} / + ${Math.round(b.left)},${Math.round(b.top)}–${Math.round(b.right)},${Math.round(b.bottom)}`;
};
const AUCUN_MSG = () => !['jx-toast', 'toast', 's-toast'].map((i) => document.getElementById(i)).some((e) => e && !e.hidden && getComputedStyle(e).display !== 'none');
const PETITS = () => { const r = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const el = w.currentNode.parentElement; if (!w.currentNode.textContent.trim() || !el || el.closest('script,style')) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || el.getBoundingClientRect().height === 0) continue; if (parseFloat(cs.fontSize) < 14) r.push(el.textContent.trim().slice(0, 30)); } return r.length ? r : true; };

for (theme of ['clair', 'cave']) {
  // 1. Onglet
  await ouvre('onglet');
  await verifie('pastille Stocks = 5', () => document.querySelector('.bot .jx-pas')?.textContent === '5');
  await verifie('Bord : cette semaine = B-031 en cuve', () => document.body.innerText.includes('B-031 IPA Nelson en cuve'));
  await cap('bord');
  await tap('[data-go="bra"]');
  await verifie('En cuve → Brassins', () => document.querySelector('h1').textContent === 'Brassins' && document.body.innerText.includes('B-028'));
  await tap('[data-tab="cal"]');
  await tap('[data-ev="0"]');
  await verifie('barre IPA : message', () => document.getElementById('toast').textContent.includes('IPA Nelson'));
  await verifie('message hors du +', MSG_HORS_FAB);
  await cap('cal-message');
  await tap('[data-tab="fin"]');
  await verifie('Finances : message effacé', AUCUN_MSG);
  await verifie('259 expliqué', () => document.querySelector('.jx-exp')?.textContent.includes('3 613'));
  await verifie('rien sous 14 px', PETITS);
  await cap('finances');
  await tap('[data-tab="stk"]');
  await verifie('Stocks : 5 à commander', () => document.querySelectorAll('.row').length === 7 && document.body.innerText.includes('Soude caustique'));
  await page.close();

  // 2. Fournisseur
  await ouvre('fournisseur');
  await tap('#s-fab');
  await verifie('icône « Pourquoi lui » contrastée', () => { const ic = document.querySelector('.pi.main .ic'); if (!ic) return 'absent'; const cs = getComputedStyle(ic); return cs.backgroundColor !== cs.color || 'même couleur'; });
  await cap('plus');
  await tap('.pi[data-act="Compagnon"]');
  await verifie('Compagnon : message', () => !document.getElementById('s-toast').hidden);
  await verifie('message hors du +', MSG_HORS_FAB);
  await tap('.s-back');
  await verifie('liste : message effacé', AUCUN_MSG);
  await verifie('pastille Stocks = 5', () => document.querySelector('.s-bot .jx-pas')?.textContent === '5');
  await cap('liste');
  await tap('[data-fo="lac"]');
  await verifie('Malterie du Lac : sans message', AUCUN_MSG);
  await page.close();

  // 3. Suppression : Archiver, puis Supprimer
  await ouvre('suppression');
  await tap('[data-k="brassin"]');
  await tap('[data-del="L-014"]');
  await tap('#sh [data-archive]');
  await verifie('archive : message', () => !document.getElementById('toast').hidden);
  await verifie('archive : message hors du +', MSG_HORS_FAB);
  await verifie('« + Brassin » lisible en entier', () => { const f = document.querySelector('.fab'), r = f.getBoundingClientRect(), e = document.elementFromPoint(r.left + 12, r.top + r.height / 2); return f.contains(e) || 'couvert par ' + (e?.className || e?.tagName); });
  await cap('archive');
  await page.close();
  await ouvre('suppression');
  await tap('[data-del="F-07"]');
  await tap('#sh [data-f="0"]');
  await tap('#sh [data-f="1"]');
  await tap('#sh [data-mo="Vendus"]');
  await tap('#sh [data-jm="ok"]');
  await tap('#sh [data-f="2"]');
  await tap('#sh [data-delok]');
  await verifie('supprime : message', () => !document.getElementById('toast').hidden);
  await verifie('supprime : « Annuler » hors du +', MSG_HORS_FAB);
  await verifie('« + Fût » lisible', () => { const f = document.querySelector('.fab'), r = f.getBoundingClientRect(), e = document.elementFromPoint(r.left + 12, r.top + r.height / 2); return f.contains(e) || 'couvert'; });
  await cap('supprime');
  await tap('#list .row .tx');
  await verifie('ligne touchée : fiche (exemple)', () => document.getElementById('jx-toast')?.textContent.includes('fiche'));
  await verifie('ligne : message hors du +', MSG_HORS_FAB);
  await verifie('pastille Stocks = 5', () => document.querySelector('.bot .jx-pas')?.textContent === '5');
  await page.close();

  // 4. Lot
  await ouvre('lot');
  await verifie('lots 28 et 31, IPA en cuve', () => document.querySelector('.lots').textContent.includes('IPA Nelson · lot 31') && !document.body.innerHTML.includes('Porter'));
  await tap('[data-fab]');
  await verifie('+ sans « Qui a reçu » ni densité', () => !/Qui a reçu ce lot<small|Mesure de densité/.test(document.querySelector('[data-dial]').innerHTML));
  await tap('[data-voile]');
  await tap('.v1anon');
  await verifie('Marché : message', () => document.getElementById('jx-toast')?.textContent.includes('sans nom'));
  await verifie('message hors du +', MSG_HORS_FAB);
  await tap('.v1cave');
  await verifie('Encore en cave → Livrer F-27', () => !document.querySelector('[data-jxs]').hidden && document.querySelector('[data-jxs]').textContent.includes('Livrer F-27'));
  await cap('livrer-f27');
  await tap('[data-jxf]');
  await tap('[data-jxret]');
  await verifie('Brassins : « exemple » et « › »', () => { const b = document.getElementById('jxBra'); return b.querySelector('.ex')?.textContent === 'exemple' && b.querySelectorAll('.jxbra-c').length === 2 && b.querySelector('.jxbra-c').textContent === '›'; });
  await verifie('rien sous 14 px', PETITS);
  await cap('liste');
  await tap('[data-jxlot="42"]');
  await verifie('IPA Nelson ouverte, en cuve', () => document.querySelector('[data-titre]').textContent === 'IPA Nelson');
  await page.close();

  // 5. Pastille
  await ouvre('pastille');
  await verifie('Avant S49 trié par semaine', () => { const s = [...document.querySelectorAll('#v3l .sb em')].map((e) => e.textContent); return s.join(',') === 'S48,S49,S49,S49,S49' || s.join(','); });
  await verifie('barre = Onglet v1 (6, Calendrier, Stocks actif)', () => { const a = [...document.querySelectorAll('.nav a')]; return a.length === 6 && a[2].textContent === 'Calendrier' && a[4].classList.contains('on') && getComputedStyle(a[4]).boxShadow.includes('inset') && getComputedStyle(document.querySelector('.nav')).height === '60px'; });
  await verifie('pastille = 5', () => document.getElementById('pas').textContent === '5');
  await cap('repos');
  await tap('#v3l .row');
  await verifie('message hors du +', MSG_HORS_FAB);
  await tap('[data-h="99"]');
  await verifie('horizon changé : message effacé', AUCUN_MSG);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await pause(250);
  await verifie('rien sous 14 px', PETITS);
  await cap('tout-fin');
  await page.close();
}
await browser.close();
const ko = res.filter((r) => !r.ok);
for (const r of res) console.log((r.ok ? 'ok  ' : 'KO  ') + `${r.sujet} ${r.theme} · ${r.nom}${r.ok ? '' : ' → ' + JSON.stringify(r.v)}`);
console.log(ko.length ? `CORRECTIONS KO ${ko.length}/${res.length}` : `CORRECTIONS OK ${res.length}/${res.length}`);
