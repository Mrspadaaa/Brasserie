// Captures de r4d (r4c, gestes sur la ligne, D209) : à 390, repos, #replie, masse pendant la frappe (2e ligne), retrait et son
// « Annuler », détail ouvert par le nom en #replie ; à 1280, le repos. Rien d'autre (D207).
// Contrôles hérités de r4c, rejoués sans capture : rien de tronqué, annexe hors du premier écran, « 0,40 », ajout à 0 sans
// surbrillance, doublon (« pils » → la masse de sa ligne), « Créer « Mangue » · fruit : … », la piste.
// Gestes r4d vérifiés ici aussi : Tab de masse en masse, Échap rend la masse d'avant, point accepté, Annuler rend la ligne à sa place.
// Imprime les mesures, puis CAPTURES OK ou CAPTURES ECHEC n.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const url = 'file:///' + path.join(ICI, 'etat.html').split(path.sep).join('/');
const out = (n) => path.join(ICI, `r4d-${n}.png`);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const err = []; p.on('pageerror', (e) => err.push(e.message));
const pret = () => p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150))));
const brut = async (n) => { const t = await p.evaluate(() => document.body.innerText); if (/NaN|null|undefined|\[object/.test(t)) err.push(n + ' : valeur brute'); };
const boite = (s) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { haut: Math.round(r.top + scrollY), bas: Math.round(r.bottom + scrollY) } : null; }, s);
// Rien de tronqué : tout texte de ligne et de plateau tient dans sa boîte (la masse sur la ligne comprise).
// (Les sacs habituels défilent à l'horizontale, comme dans r4c : une puce passée le bord est dans le défileur, pas tronquée.)
const tronque = () => p.evaluate(() => [...document.querySelectorAll('.r4b-li b, .r4b-bh b, .r4b-bin, .r4b-mo, .r4b-pc, .r4d-kg, .r4b-pu, .r4d-ote s')].filter((e) => e.scrollWidth > e.clientWidth + 1 || (!e.closest('.r4b-puces') && e.getBoundingClientRect().right > innerWidth)).map((e) => e.textContent || e.value));
const lignes = () => p.evaluate(() => [...document.querySelectorAll('[data-sel]')].map((li) => li.querySelector('[data-role="nom"]').textContent + ' ' + li.querySelector('[data-role="kg-ligne"]').value));
const actif = () => p.evaluate(() => { const a = document.activeElement; return { l: a.getAttribute('aria-label'), v: a.value, ph: a.placeholder, sel: a.selectionEnd - a.selectionStart, role: a.dataset.role }; });
const plateau = () => p.evaluate(() => { const e = document.querySelector('[data-role="bal"]'); return e.hidden ? '' : e.querySelector('[data-role="bh"] b').textContent; });
const tap = async (s) => { await p.tap(s); await pret(); };

// États du plateau, et les états hérités de r4c, sans capture pour ces derniers.
for (const h of ['', 'replie', 'sucre', 'fruit', 'huit', 'noir']) {
  await p.goto(url + (h ? '#' + h : '')); await pret();
  if (h === '' || h === 'replie') await p.screenshot({ path: out(h || 'repos') });
  await brut(h || 'repos');
  const t = await tronque(); if (t.length) err.push(`${h || 'repos'} : tronqué ${t.join(', ')}`);
  if (h === '') { const ax = await boite('.r4b-annexe'); console.log(`annexe à ${ax.haut} px (premier écran 844)`); if (ax.haut < 844) err.push('annexe dans le premier écran à 390'); }
  if (h === 'replie' && await plateau()) err.push('#replie : plateau ouvert au repos');
  if (h === '' && (await plateau()) !== 'Pilsner Malz') err.push('repos : plateau absent');
  if (h === 'huit') { const pied = await boite('[data-commun="pied"]'); console.log(`8 lignes : ${(pied.bas / 844).toFixed(2)} écran`); if (pied.bas / 844 > 1.05) err.push('8 lignes au-delà de 1,05 écran'); }
}
const sucre = await (async () => { await p.goto(url + '#sucre'); await pret(); return p.evaluate(() => [document.querySelector('[data-role="bin"]').value, document.querySelector('[data-kl="3"]').value]); })();
if (sucre[0] !== '0,40' || sucre[1] !== '0,40') err.push('lecture du sucre : ' + sucre.join(' / '));

// MASSE, pendant : un toucher sur la masse de la 2e ligne, « 2,5 » tapé ; la recette suit, le plateau reste sur Pilsner.
await p.goto(url); await pret();
await tap('[data-kl="1"]');
const m0 = await actif(); console.log('masse, toucher :', JSON.stringify(m0));
if (m0.role !== 'kg-ligne' || m0.v !== '' || m0.ph !== '1,5') err.push('masse : toucher ' + JSON.stringify(m0));
await p.keyboard.type('2,5'); await pret();
await p.screenshot({ path: out('masse-pendant') });
const bd = await p.evaluate(() => document.querySelector('[data-role="bandeau"]').innerText.replace(/\s+/g, ' '));
console.log('bandeau pendant :', bd); if (!/9,0 kg/.test(bd)) err.push('bandeau pendant la frappe : ' + bd);
if ((await plateau()) !== 'Pilsner Malz') err.push('masse : le plateau a changé');
await p.keyboard.press('Enter'); await pret();
let L = await lignes(); if (L[1] !== 'Weizenmalz hell 2,5') err.push('masse après Entrée : ' + L[1]);
// Échap rend la masse d'avant ; le point est accepté ; Tab passe à la masse suivante (ordinateur).
await tap('[data-kl="2"]'); await p.keyboard.type('9'); await p.keyboard.press('Escape'); await pret();
L = await lignes(); if (L[2] !== 'Haferflocken 1,5') err.push('Échap : ' + L[2]);
await p.focus('[data-kl="0"]'); await p.keyboard.type('4.5'); await p.keyboard.press('Tab'); await pret();
const tb = await actif(); L = await lignes();
console.log('point puis Tab :', L[0], '→', tb.l); if (L[0] !== 'Pilsner Malz 4,5' || !/Masse de Weizenmalz hell/.test(tb.l || '')) err.push('point/Tab : ' + L[0] + ' ' + tb.l);

// RETRAIT, après : × sur la 2e ligne, « Annuler » à sa place ; puis Annuler rend la ligne.
await p.goto(url); await pret();
await tap('[data-ret="1"]');
L = await lignes(); console.log('après retrait :', L.join(' | '));
const ann = await p.$('[data-role="annuler"]');
if (L.length !== 2 || L.some((x) => /Weizen/.test(x)) || !ann) err.push('retrait : ' + L.join(' | '));
await p.screenshot({ path: out('retrait-apres') });
const tr = await tronque(); if (tr.length) err.push('retrait : tronqué ' + tr.join(', '));
await tap('[data-role="annuler"]');
L = await lignes(); if (L[1] !== 'Weizenmalz hell 1,5' || L.length !== 3) err.push('annuler : ' + L.join(' | '));
// Un retrait non annulé : la place disparaît après 6 s.
await tap('[data-ret="2"]'); await p.evaluate(() => new Promise((r) => setTimeout(r, 6300)));
if (await p.$('[data-role="annuler"]')) err.push('Annuler encore là après 6 s');

// DETAIL, en #replie : un toucher sur le nom de la 2e ligne ouvre le plateau ; le même toucher le referme ; × aussi.
await p.goto(url + '#replie'); await pret();
await tap('[data-sel="1"] [data-role="nom"]');
const dt = await plateau(); console.log('détail :', dt); if (dt !== 'Weizenmalz hell') err.push('détail : ' + dt);
await p.screenshot({ path: out('detail') });
await tap('[data-sel="1"] [data-role="nom"]'); if (await plateau()) err.push('second toucher : le détail reste ouvert');
await tap('[data-sel="2"] [data-role="nom"]'); await tap('[data-role="fermer"]'); if (await plateau()) err.push('× : le détail reste ouvert');

// L'ajout à 0 : « Cara », Entrée → la masse de la ligne Carapils, vide, « 0 » en indication, sans sélection.
await p.goto(url); await pret();
await p.focus('[data-role="ajout"]'); await p.keyboard.type('Cara'); await p.keyboard.press('Enter'); await pret();
const z = await actif(); console.log('ajout :', JSON.stringify(z));
if (z.role !== 'kg-ligne' || !/Masse de Carapils/.test(z.l || '') || z.v !== '' || z.ph !== '0' || z.sel !== 0) err.push('ajout à 0 : ' + JSON.stringify(z));
await p.keyboard.type('0,3'); await p.keyboard.press('Enter'); await pret();
const ra = await actif(); if (ra.role !== 'ajout') err.push('Entrée après la masse : pas de retour à l’ajout (' + ra.role + ')');
// Greffe u1 : « pils » renvoie à la masse de la ligne du Pilsner, sur la ligne, sans doublon.
await p.keyboard.type('pils'); await pret(); await p.keyboard.press('Enter'); await pret();
const d = await actif(); const n = (await lignes()).length;
console.log('doublon :', JSON.stringify(d), n, 'lignes');
if (d.role !== 'kg-ligne' || !/Masse de Pilsner Malz/.test(d.l || '') || d.ph !== '5,0' || n !== 4) err.push('doublon : ' + JSON.stringify(d) + ' ' + n);
// Greffe z1 : « Créer « Mangue » · fruit : en fermentation, J+3 ».
await p.goto(url); await pret();
for (let k = 0; k < 3; k++) await p.click('[data-role="fam"]');
await p.focus('[data-role="ajout"]'); await p.keyboard.type('Mangue'); await pret();
const c = await p.evaluate(() => document.querySelector('[data-cree]')?.textContent || '');
console.log('créer :', c); if (!/Créer « Mangue » · fruit : en fermentation, J\+3/.test(c)) err.push('créer : ' + c);
// La piste : glisser le pouce change la masse, sur le plateau et sur la ligne.
await p.goto(url + '#sucre'); await pret();
const r = await p.evaluate(() => { const e = document.querySelector('[data-role="piste"]').getBoundingClientRect(); return { x: e.left, y: e.top + e.height / 2, w: e.width }; });
await p.mouse.move(r.x + r.w * 0.2, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * 0.5, r.y, { steps: 5 }); await p.mouse.up(); await pret();
const g = await p.evaluate(() => [document.querySelector('[data-role="bin"]').value, document.querySelector('[data-kl="3"]').value]);
console.log('piste 0–2 kg, pouce à la moitié :', g.join(' / ')); if (g[0] !== '1,0' || g[1] !== '1,0') err.push('piste : ' + g.join(' / '));
await brut('gestes');
// Aucun type="number".
if (await p.evaluate(() => document.querySelectorAll('input[type="number"]').length)) err.push('type="number" présent');
await p.setViewport({ width: 1280, height: 900 });
await p.goto(url); await pret(); await p.screenshot({ path: out('1280') });
const ax = await boite('.r4b-annexe'); console.log(`1280 : annexe à ${ax.haut} px (écran 900)`); if (ax.haut < 900) err.push('annexe dans le premier écran à 1280');
await b.close();
console.log(err.length ? 'ERREURS ' + err.join(' | ') : 'sans erreur');
console.log(err.length ? 'CAPTURES ECHEC ' + err.length : 'CAPTURES OK');
