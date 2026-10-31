// Captures de p7 (D220 : « et maintenant la recherche, comment elle s'affiche ? Dans la liste ? »), variante du dossier (s1, s2, s3),
// copiée de v6/p6-b2. D'abord tous les gestes de p6-b2, rejoués tels quels (barre-masse D219, moment m1, part, couleur, retrait,
// détail, ajout à 0, doublon, « Créer », piste, 8 grains, 1280). Puis la recherche, à 390, le clavier du téléphone dessiné sur les
// 300 px du bas : l'ouverture (D221 : le champ touché, rien tapé, le stock de la famille), « mu », « Munich », « pils », « Abbey Malt » pendant (premier écran, et recadrée sur le champ et ses résultats) ;
// après le toucher sur Münchner Malz ; à 1280, « mu » pendant (sans clavier). Vérifie : le premier résultat et l'aperçu disent la même
// chose ; « Munich » → Münchner Malz ; « pils » → déjà 5,0 kg ; « Abbey Malt » → Créer ; Münchner ajouté prend sa teinte (15 EBC),
// la masse à zéro et le curseur dans sa masse ; rien de la recherche au repos.
// Imprime les mesures, puis CAPTURES OK ou CAPTURES ECHEC n.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const url = 'file:///' + path.join(ICI, 'etat.html').split(path.sep).join('/');
const V = 'p7-' + path.basename(ICI);
const out = (n) => path.join(ICI, `${V}-${n}.png`);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const err = []; p.on('pageerror', (e) => err.push(e.message));
const pret = () => p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150))));
const brut = async (n) => { const t = await p.evaluate(() => document.body.innerText); if (/NaN|null|undefined|\[object/.test(t)) err.push(n + ' : valeur brute'); };
const boite = (s) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { haut: Math.round(r.top + scrollY), bas: Math.round(r.bottom + scrollY) } : null; }, s);
// Rien de tronqué : tout texte de ligne et de plateau tient dans sa boîte (masse et part sur la ligne comprises).
const tronque = () => p.evaluate(() => [...document.querySelectorAll('.r4b-li b, .r4b-bh b, .r4b-bin, .r4b-mo, .r4b-pc, .r4d-kg, .r4e-pn, .r4e-annm, .r4b-pu, .r4d-ote s')].filter((e) => e.scrollWidth > e.clientWidth + 1 || (!e.closest('.r4b-puces') && e.getBoundingClientRect().right > innerWidth)).map((e) => e.textContent || e.value));
const lignes = () => p.evaluate(() => [...document.querySelectorAll('[data-sel]')].map((li) => li.querySelector('[data-role="nom"]').textContent + ' ' + li.querySelector('[data-role="kg-ligne"]').value));
const parts = () => p.evaluate(() => [...document.querySelectorAll('[data-sel]')].map((li) => li.querySelector('.r4e-pn')?.textContent ?? ''));
const moments = () => p.evaluate(() => [...document.querySelectorAll('[data-sel]')].map((li) => li.querySelector('[data-role="moment-ligne"]').textContent.trim()));
const actif = () => p.evaluate(() => { const a = document.activeElement; return { l: a.getAttribute('aria-label'), v: a.value, ph: a.placeholder, sel: a.selectionEnd - a.selectionStart, role: a.dataset.role }; });
const plateau = () => p.evaluate(() => { const e = document.querySelector('[data-role="bal"]'); return e.hidden ? '' : e.querySelector('[data-role="bh"] b').textContent; });
const bandeau = () => p.evaluate(() => document.querySelector('[data-role="bandeau"]').innerText.replace(/\s+/g, ' '));
const compte = () => p.evaluate(() => { const m = document.body.innerText.match(/(\d+)\s*couleurs?\s*à renseigner/); return m ? +m[1] : 0; });
const tap = async (s) => { await p.tap(s); await pret(); };
const tout = async () => { await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); };

// États : le plateau est visible partout, l'ancien #replie compris (D212).
for (const h of ['', 'replie', 'sucre', 'fruit', 'huit', 'noir']) {
  await p.goto(url + (h ? '#' + h : '')); await pret();
  if (h === '') await p.screenshot({ path: out('repos') });
  await brut(h || 'repos');
  const t = await tronque(); if (t.length) err.push(`${h || 'repos'} : tronqué ${t.join(', ')}`);
  if (h === '') { const ax = await boite('.r4b-annexe'); console.log(`annexe à ${ax.haut} px (premier écran 844)`); if (ax.haut < 844) err.push('annexe dans le premier écran à 390'); }
  if (!(await plateau())) err.push(`${h || 'repos'} : plateau absent (il est toujours visible)`);
  if (h === '' && (await plateau()) !== 'Pilsner Malz') err.push('repos : plateau ailleurs que sur Pilsner');
  if (h === 'huit') await p.screenshot({ path: out('huit-repos') });
  if (h === 'huit') { const pied = await boite('[data-commun="pied"]'); console.log(`8 lignes : ${(pied.bas / 844).toFixed(2)} écran`); if (pied.bas / 844 > 1.05) err.push('8 lignes au-delà de 1,05 écran'); }
}
const sucre = await (async () => { await p.goto(url + '#sucre'); await pret(); return p.evaluate(() => [document.querySelector('[data-role="bin"]').value, document.querySelector('[data-kl="3"]').value]); })();
if (sucre[0] !== '0,40' || sucre[1] !== '0,40') err.push('lecture du sucre : ' + sucre.join(' / '));

// MASSE (r4d) : Échap rend la masse d'avant ; le point est accepté ; Tab passe à la masse suivante.
await p.goto(url); await pret();
await tap('[data-kl="1"]'); await p.keyboard.type('2,5'); await p.keyboard.press('Enter'); await pret();
let L = await lignes(); if (L[1] !== 'Weizenmalz hell 2,5') err.push('masse après Entrée : ' + L[1]);
await tap('[data-kl="2"]'); await p.keyboard.type('9'); await p.keyboard.press('Escape'); await pret();
L = await lignes(); if (L[2] !== 'Haferflocken 1,5') err.push('Échap : ' + L[2]);
await p.focus('[data-kl="0"]'); await p.keyboard.type('4.5'); await p.keyboard.press('Tab'); await pret();
const tb = await actif(); L = await lignes();
if (L[0] !== 'Pilsner Malz 4,5' || !/Masse de Weizenmalz hell/.test(tb.l || '')) err.push('point/Tab : ' + L[0] + ' ' + tb.l);

// PART, pendant puis après : le doigt tire la barre de Weizenmalz de son bord gauche à 30 % de sa largeur ; la masse suit
// (2,8 kg, au cran de la piste), le grain passe à 9,3 kg, Pilsner et Haferflocken gardent la leur, le plateau reste sur Pilsner.
await p.goto(url); await pret();
const bb = await p.evaluate(() => { const r = document.querySelector('[data-pl="1"]').getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; });
console.log('barre :', Math.round(bb.w), 'px de large');
await p.touchscreen.touchStart(bb.x + 2, bb.y);
for (let k = 1; k <= 8; k++) await p.touchscreen.touchMove(bb.x + 2 + (bb.w * 0.3 - 2) * k / 8, bb.y);
await pret();
await p.screenshot({ path: out('part-pendant') });
let bd = await bandeau(); L = await lignes();
console.log('part pendant :', bd, '|', L.join(' | '));
if (!/Grain 9,3 kg/.test(bd) || L[1] !== 'Weizenmalz hell 2,8' || L[0] !== 'Pilsner Malz 5,0' || L[2] !== 'Haferflocken 1,5') err.push('part pendant : ' + bd + ' ' + L.join(' | '));
if (!(await p.$('[data-sel="1"].r4e-tire'))) err.push('part pendant : la ligne ne montre pas la barre tenue');
await p.touchscreen.touchEnd(); await pret();
await p.screenshot({ path: out('part-apres') });
let P = await parts(); console.log('parts après :', P.join(' / '));
if (P[1] !== '30' || P[0] !== '54' || P[2] !== '16') err.push('part après : ' + P.join(' / '));
if ((await plateau()) !== 'Pilsner Malz') err.push('part : le plateau a bougé');
// Un toucher sans glisser ne change rien, et ne déplace pas le plateau.
await tap('[data-pl="2"]'); L = await lignes(); if (L[2] !== 'Haferflocken 1,5' || (await plateau()) !== 'Pilsner Malz') err.push('toucher la barre : ' + L[2]);
// Au clavier : ← → d'un cran de masse (1,5 → 1,6 kg).
await p.focus('[data-mk="2"]'); await p.keyboard.press('ArrowRight'); await pret();
L = await lignes(); if (L[2] !== 'Haferflocken 1,6') err.push('→ sur la barre : ' + L[2]);

// MOMENT, pendant puis après : un toucher sur « empâtage » de Weizenmalz → « ébullition », « Annuler » 6 s à côté ; un second
// toucher → fermentation (J+3, le jour sur la ligne) ; « Annuler » rend « empâtage » (celui d'avant la série).
await p.goto(url); await pret();
await tap('[data-ml="1"]');
let M = await moments(); console.log('moment, 1 toucher :', M.join(' / '));
if (!/^ébullition/.test(M[1]) || !(await p.$('[data-sel="1"] [data-role="annuler-moment"]'))) err.push('moment, 1 toucher : ' + M.join(' / '));
await p.screenshot({ path: out('moment-pendant') });
const tm = await tronque(); if (tm.length) err.push('moment : tronqué ' + tm.join(', '));
if ((await plateau()) !== 'Pilsner Malz') err.push('moment : le plateau a bougé');
await tap('[data-ml="1"]');
const jv = await p.evaluate(() => document.querySelector('[data-jl="1"]')?.value);
if (jv !== '3') err.push('moment, 2 touchers : pas de jour sur la ligne (' + jv + ')');
await tap('[data-sel="1"] [data-role="annuler-moment"]');
M = await moments(); if (!/^empâtage/.test(M[1])) err.push('Annuler le moment : ' + M[1]);
// Après : un toucher, puis les 6 s ; « Annuler » part, « ébullition » reste.
await tap('[data-ml="1"]'); await p.evaluate(() => new Promise((r) => setTimeout(r, 6300)));
await p.screenshot({ path: out('moment-apres') });
M = await moments(); console.log('moment après 6 s :', M.join(' / '));
if (!/^ébullition/.test(M[1]) || await p.$('[data-role="annuler-moment"]')) err.push('moment après : ' + M.join(' / '));
// Le jour se tape sur la ligne : Haferflocken passé en fermentation, « 5 », Entrée → J+5.
await tap('[data-ml="2"]'); await tap('[data-ml="2"]'); await tap('[data-jl="2"]'); await p.keyboard.type('5'); await p.keyboard.press('Enter'); await pret();
const j5 = await p.evaluate(() => document.querySelector('[data-jl="2"]')?.value); if (j5 !== '5') err.push('jour : ' + j5);

// COULEUR, pendant puis après : un toucher sur le « ? » de Weizenmalz, « 8 » ; la teinte est dans le champ ; Entrée : la pastille
// prend la teinte, « 3 couleurs à renseigner » passe à 2.
await p.goto(url); await pret();
const c0 = await compte();
await tap('[data-cl="1"]');
const e0 = await actif(); console.log('couleur, toucher :', JSON.stringify(e0));
if (e0.role !== 'couleur-ligne' || e0.ph !== 'EBC') err.push('couleur : toucher ' + JSON.stringify(e0));
await p.keyboard.type('8'); await pret();
await p.screenshot({ path: out('couleur-pendant') });
const fond = await p.evaluate(() => getComputedStyle(document.activeElement).backgroundColor); console.log('champ pendant :', fond);
if (!/rgb\(2[0-9]{2}, 1[0-9]{2}, /.test(fond)) err.push('couleur pendant : pas de teinte dans le champ (' + fond + ')');
await p.keyboard.press('Enter'); await pret();
await p.screenshot({ path: out('couleur-apres') });
const c1 = await compte(); console.log(`à renseigner : ${c0} → ${c1}`);
if (c1 !== c0 - 1) err.push(`couleur après : ${c0} → ${c1}`);
if ((await plateau()) !== 'Pilsner Malz') err.push('couleur : le plateau a bougé');
// Hors de 1 à 1500 : la valeur d'avant revient, sans message ; la virgule est acceptée.
await tap('[data-cl="2"]'); await p.keyboard.type('2000'); await p.keyboard.press('Enter'); await pret();
if ((await compte()) !== c1) err.push('couleur 2000 : acceptée');
await tap('[data-cl="2"]'); await p.keyboard.type('4,5'); await p.keyboard.press('Enter'); await pret();
const lab = await p.evaluate(() => document.querySelector('[data-cl="2"]').getAttribute('aria-label'));
if (!/4,5 EBC/.test(lab)) err.push('couleur 4,5 : ' + lab);
// « 1 couleur à renseigner » mène au champ de la ligne, pas au plateau ; Entrée y passe au « ? » suivant (ici, aucun).
await tap('[data-role="arens"]'); const ar = await actif();
if (ar.role !== 'couleur-ligne' || !/Pilsner/.test(ar.l || '') || (await plateau()) !== 'Pilsner Malz') err.push('à renseigner : ' + JSON.stringify(ar));
await p.keyboard.press('Escape'); await pret();
// Depuis « 3 couleurs à renseigner » : « 3,5 », Entrée → le champ du « ? » suivant (Weizenmalz) ; Échap l'arrête.
await p.goto(url); await pret();
await tap('[data-role="arens"]'); await p.keyboard.type('3,5'); await p.keyboard.press('Enter'); await pret();
const ch = await actif(); console.log('enchaîné :', ch.l);
if (ch.role !== 'couleur-ligne' || !/Weizenmalz/.test(ch.l || '') || (await compte()) !== 2) err.push('enchaîné : ' + JSON.stringify(ch));
await p.keyboard.press('Escape'); await pret(); if (await p.$('[data-ebcl]')) err.push('enchaîné : Échap ne l’arrête pas');

// RETRAIT, après : × sur la 2e ligne, « Annuler » à sa place ; puis Annuler rend la ligne ; la place disparaît après 6 s.
await p.goto(url); await pret();
await tap('[data-ret="1"]');
L = await lignes(); console.log('après retrait :', L.join(' | '));
if (L.length !== 2 || L.some((x) => /Weizen/.test(x)) || !(await p.$('[data-role="annuler"]'))) err.push('retrait : ' + L.join(' | '));
await p.screenshot({ path: out('retrait-apres') });
const tr = await tronque(); if (tr.length) err.push('retrait : tronqué ' + tr.join(', '));
await tap('[data-role="annuler"]');
L = await lignes(); if (L[1] !== 'Weizenmalz hell 1,5' || L.length !== 3) err.push('annuler : ' + L.join(' | '));
await tap('[data-ret="2"]'); await p.evaluate(() => new Promise((r) => setTimeout(r, 6300)));
if (await p.$('[data-role="annuler"]')) err.push('Annuler encore là après 6 s');

// DETAIL : un toucher sur le nom de la 2e ligne y amène le plateau.
await p.goto(url); await pret();
await tap('[data-sel="1"] [data-role="nom"]');
if ((await plateau()) !== 'Weizenmalz hell') err.push('détail : ' + (await plateau()));

// L'ajout à 0, le doublon, « Créer » (r4d).
await p.goto(url); await pret();
await p.focus('[data-role="ajout"]'); await p.keyboard.type('Cara'); await p.keyboard.press('Enter'); await pret();
const z = await actif();
if (z.role !== 'kg-ligne' || !/Masse de Carapils/.test(z.l || '') || z.v !== '' || z.ph !== '0' || z.sel !== 0) err.push('ajout à 0 : ' + JSON.stringify(z));
await p.keyboard.type('0,3'); await p.keyboard.press('Enter'); await pret();
const ra = await actif(); if (ra.role !== 'ajout') err.push('Entrée après la masse : pas de retour à l’ajout (' + ra.role + ')');
await p.keyboard.type('pils'); await pret(); await p.keyboard.press('Enter'); await pret();
const d = await actif(); const n = (await lignes()).length;
if (d.role !== 'kg-ligne' || !/Masse de Pilsner Malz/.test(d.l || '') || d.ph !== '5,0' || n !== 4) err.push('doublon : ' + JSON.stringify(d) + ' ' + n);
await p.goto(url); await pret();
for (let k = 0; k < 3; k++) await p.click('[data-role="fam"]');
await p.focus('[data-role="ajout"]'); await p.keyboard.type('Mangue'); await pret();
const c = await p.evaluate(() => document.querySelector('[data-cree]')?.textContent || '');
if (!/Créer « Mangue »[\s\S]*fruit : en fermentation, J\+3/.test(c)) err.push('créer : ' + c);
// La piste du plateau : glisser le pouce change la masse, sur le plateau et sur la ligne (réglage fin, gardé).
await p.goto(url + '#sucre'); await pret();
const r = await p.evaluate(() => { const e = document.querySelector('[data-role="piste"]').getBoundingClientRect(); return { x: e.left, y: e.top + e.height / 2, w: e.width }; });
await p.mouse.move(r.x + r.w * 0.2, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * 0.5, r.y, { steps: 5 }); await p.mouse.up(); await pret();
const g = await p.evaluate(() => [document.querySelector('[data-role="bin"]').value, document.querySelector('[data-kl="3"]').value]);
if (g[0] !== '1,0' || g[1] !== '1,0') err.push('piste : ' + g.join(' / '));
await brut('gestes');
if (await p.evaluate(() => document.querySelectorAll('input[type="number"]').length)) err.push('type="number" présent');
// D219 — la barre de chaque ligne porte la masse.
const cur = (i) => `[data-sel="${i}"] [data-role~="masse-curseur"]`;
const aria = (i) => p.evaluate((s) => { const e = document.querySelector(s); return [e.getAttribute('role'), e.getAttribute('aria-label'), e.getAttribute('aria-valuetext'), e.getAttribute('aria-valuenow')].join(' | '); }, cur(i));
const plat = () => p.evaluate(() => { const e = document.querySelector('[data-role="bal"]'); return Math.round(e.getBoundingClientRect().top) + ' ' + e.querySelector('[data-role="bh"] b').textContent; });
const boiteC = (i) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width, h: r.height }; }, cur(i));
const glisser = async (i, a, z, garder) => { const c = await boiteC(i); await p.touchscreen.touchStart(c.x + c.w * a, c.y);
  for (let k = 1; k <= 8; k++) await p.touchscreen.touchMove(c.x + c.w * (a + (z - a) * k / 8), c.y); await pret(); if (!garder) { await p.touchscreen.touchEnd(); await pret(); } };
await p.goto(url); await pret();
let A = await aria(0); console.log('slider Pilsner :', A);
if (A !== 'slider | Masse de Pilsner Malz | 5,0 kg | 5') err.push('slider : ' + A);
let cb = await boiteC(0); console.log('cible barre :', Math.round(cb.w), '×', Math.round(cb.h), 'px');
if (cb.h < 24 || cb.w < 24) err.push('cible barre : ' + cb.w + ' × ' + cb.h);
const p0 = await plat(), b0 = await bandeau();
// Pilsner, pendant : le doigt tire de 63 % à 70 % de la barre et la tient.
await glisser(0, 0.6, 0.7, true);
await p.screenshot({ path: out('barre-pendant') });
L = await lignes(); console.log('Pilsner pendant :', L.join(' | '), '|', await bandeau());
if (L[0] !== 'Pilsner Malz 7,0' || L[1] !== 'Weizenmalz hell 1,5' || L[2] !== 'Haferflocken 1,5') err.push('Pilsner pendant : ' + L.join(' | '));
if (!(await p.$('[data-sel="0"].r4e-tire'))) err.push('Pilsner pendant : la barre tenue ne se voit pas');
await p.touchscreen.touchEnd(); await pret();
await p.screenshot({ path: out('barre-apres') });
L = await lignes(); const P2 = await parts(), b1 = await bandeau(); A = await aria(0);
console.log('Pilsner après :', L.join(' | '), '|', b1, '|', P2.join('/'), '|', A);
if (L[0] !== 'Pilsner Malz 7,0' || P2.join('/') !== '70/15/15' || !/Grain 10,0 kg/.test(b1) || !/7,0 kg/.test(A)) err.push('Pilsner après : ' + L[0] + ' ' + P2.join('/') + ' ' + b1 + ' ' + A);
if ((await p.evaluate(() => document.querySelector('[data-role="bin"]').value)) !== '7,0') err.push('Pilsner après : le plateau ne suit pas');
if ((await plat()) !== p0) err.push('Pilsner : le plateau a bougé');
if (b1 === b0) err.push('Pilsner : le bandeau ne suit pas');
// Dextrose (#sucre), après : sa barre (0–2 kg) tirée de 20 % à 50 % → 1,0 kg ; le plateau, sur Dextrose, suit ; les grains restent.
await p.goto(url + '#sucre'); await pret();
A = await aria(3); console.log('slider Dextrose :', A); if (!/^slider \| Masse de Dextrose \| 0,40 kg/.test(A)) err.push('Dextrose slider : ' + A);
await glisser(3, 0.2, 0.5);
await p.screenshot({ path: out('sucre-apres') });
L = await lignes(); console.log('Dextrose après :', L.join(' | '));
if (L[3] !== 'Dextrose 1,0' || L[0] !== 'Pilsner Malz 5,0' || L[1] !== 'Weizenmalz hell 1,5') err.push('Dextrose après : ' + L.join(' | '));
if ((await p.evaluate(() => document.querySelector('[data-role="bin"]').value)) !== '1,0') err.push('Dextrose : le plateau ne suit pas');
// La plage reste : la barre de Dextrose est à moitié (1,0 sur 2 kg), elle ne saute pas au relâcher.
const wd = await p.evaluate(() => document.querySelector('[data-bar="3"]').style.width); if (wd !== '50%') err.push('Dextrose : la barre saute (' + wd + ')');
// Au clavier : → d'un cran (1,0 → 1,1), Maj+← dix crans, puis ← à 0 ne descend plus.
await p.focus(cur(3)); await p.keyboard.press('ArrowRight'); await pret();
L = await lignes(); if (L[3] !== 'Dextrose 1,1') err.push('→ Dextrose : ' + L[3]);
for (let k = 0; k < 3; k++) { await p.keyboard.down('Shift'); await p.keyboard.press('ArrowLeft'); await p.keyboard.up('Shift'); }
await p.keyboard.press('ArrowLeft'); await pret();
L = await lignes(); if (L[3] !== 'Dextrose ') err.push('← jusqu’à 0 : « ' + L[3] + ' »');
// Purée de mangue (#fruit), après : sa barre (0–2 kg) tirée de 50 % à 25 % → 0,5 kg.
await p.goto(url + '#fruit'); await pret();
await glisser(3, 0.5, 0.25);
await p.screenshot({ path: out('fruit-apres') });
L = await lignes(); console.log('Mangue après :', L.join(' | '));
if (L[3] !== 'Purée de mangue 0,50' || L[0] !== 'Pilsner Malz 5,0') err.push('Mangue après : ' + L.join(' | '));
// Un grain seul (les deux autres retirés) n'a pas de part à régler : sa barre se tire sur sa plage (0–8 kg), à moitié → 4,0 kg.
await p.goto(url); await pret();
await tap('[data-ret="2"]'); await tap('[data-ret="1"]');
await glisser(0, 0.62, 0.5);
L = await lignes(); console.log('grain seul :', L.join(' | '));
if (L[0] !== 'Pilsner Malz 4,0') err.push('grain seul : ' + L.join(' | '));
const tr2 = await tronque(); if (tr2.length) err.push('barre : tronqué ' + tr2.join(', '));
// RECHERCHE (D220), à 390.
const clavier = (on) => p.evaluate((on) => { let k = document.getElementById('p7-clavier'); if (!on) { if (k) k.remove(); return; }
  k = document.createElement('div'); k.id = 'p7-clavier'; k.setAttribute('aria-hidden', 'true');
  k.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:300px;z-index:99;pointer-events:none;background:repeating-linear-gradient(135deg,rgba(17,17,17,.14) 0 6px,rgba(17,17,17,.07) 6px 12px);border-top:2px solid rgba(17,17,17,.5);font:600 12px "IBM Plex Mono",monospace;color:#333;text-align:center;padding-top:8px';
  k.textContent = 'clavier du téléphone · 300 px'; document.body.appendChild(k); }, on);
const vus = () => p.evaluate(() => [...document.querySelectorAll('[data-role~="resultat"],[data-role~="creer"],[data-deja]')].filter((e) => e.getBoundingClientRect().width > 0)
  .map((e) => { const r = e.getBoundingClientRect(); return { nom: e.dataset.nom || '', deja: e.hasAttribute('data-deja'), creer: /creer/.test(e.dataset.role || ''), t: e.textContent.replace(/\s+/g, ' ').trim(), haut: Math.round(r.top), bas: Math.round(r.bottom) }; }));
const zone = () => p.evaluate(() => { const els = [document.querySelector('.r4b-aj'), ...document.querySelectorAll('[data-role~="resultat"],[data-role~="creer"],[data-deja]')].filter((e) => e && e.getBoundingClientRect().width > 0);
  let h = 1e9, b = -1e9; for (const e of els) { const r = e.getBoundingClientRect(); h = Math.min(h, r.top); b = Math.max(b, r.bottom); }
  return { x: 0, y: Math.max(0, h - 14 + scrollY), width: innerWidth, height: Math.round(b - h + 28) }; });
const chercher = async (txt, souris) => { await p.goto(url); await pret(); if (souris) await p.click('[data-role="ajout"]'); else await p.tap('[data-role="ajout"]'); await p.keyboard.type(txt, { delay: 15 }); await pret(); };
const ap = () => p.evaluate(() => document.querySelector('[data-role="apercu"]').textContent.replace(/\s+/g, ' ').trim());
await p.goto(url); await pret();
if ((await vus()).some((r) => r.creer || r.deja) || (await ap())) err.push('repos : la recherche se voit');
for (const [txt, nom] of [['', 'ouverture'], ['mu', 'mu'], ['Munich', 'munich'], ['pils', 'pils'], ['Abbey Malt', 'abbey']]) {
  await chercher(txt);
  const rs = await vus(), a = await ap();
  console.log(`« ${txt} » : aperçu « ${a} » | ${rs.map((r) => r.t + ' @' + r.haut + '–' + r.bas).join(' | ')}`);
  const prem = rs.find((r) => r.creer || r.nom);
  const offres = rs.filter((r) => !r.creer && !r.deja);
  if (!txt && offres.length < 3) err.push('ouverture : ' + offres.length + ' article(s)');
  for (const r of offres) if (!/en stock|stock épuisé/.test(r.t)) err.push('« ' + txt + ' » : sans stock « ' + r.t + ' »');
  if (txt === 'mu' && !/^Münchner/.test(prem?.nom || '')) err.push('mu : premier résultat ' + prem?.nom);
  if (txt === 'Munich' && (!/^Münchner/.test(prem?.nom || '') || !/Münchner/.test(a))) err.push('Munich : ' + prem?.nom + ' / aperçu ' + a);
  if (txt === 'pils' && !rs.some((r) => r.deja && /déjà 5,0 kg/.test(r.t))) err.push('pils : pas de « déjà 5,0 kg »');
  if (txt === 'Abbey Malt' && (!rs.some((r) => r.creer && /Créer « Abbey Malt »/.test(r.t)) || !/Abbey/.test(a))) err.push('Abbey Malt : ' + rs.map((r) => r.t).join(' | ') + ' / ' + a);
  for (const r of rs) if (r.bas > 844 - 300 || r.haut < 0) console.log(`  sous le clavier ou hors vue : ${r.t} @${r.haut}–${r.bas}`);
  await clavier(true); await p.screenshot({ path: out(nom + '-pendant') }); await clavier(false);
  await p.screenshot({ path: out(nom + '-zoom'), clip: await zone() });
  await brut(nom);
}
await chercher('mu');
const avantM = (await lignes()).length;
await p.tap('[data-role~="resultat"][data-nom="Münchner Malz"]'); await pret();
await clavier(true); await p.screenshot({ path: out('munchner-apres') }); await clavier(false);
L = await lignes(); const am = await actif();
const ebcM = await p.evaluate(() => { const li = [...document.querySelectorAll('[data-sel]')].find((x) => /Münchner/.test(x.textContent)); return li?.querySelector('[data-role="couleur-ligne"]')?.getAttribute('aria-label') || ''; });
console.log('Münchner après :', L.join(' | '), '|', am.l, '|', ebcM);
if (L.length !== avantM + 1 || L[L.length - 1] !== 'Münchner Malz ' || am.role !== 'kg-ligne' || !/Masse de Münchner Malz/.test(am.l || '') || !/15 EBC|15,0 EBC/.test(ebcM)) err.push('Münchner après : ' + L.join(' | ') + ' ' + am.l + ' ' + ebcM);
if ((await vus()).some((r) => r.creer || r.deja) || (await ap())) err.push('après : la recherche reste ouverte');
await p.setViewport({ width: 1280, height: 900 });
await p.goto(url); await pret(); await p.screenshot({ path: out('1280') });
const ax = await boite('.r4b-annexe'); console.log(`1280 : annexe à ${ax.haut} px (écran 900)`); if (ax.haut < 900) err.push('annexe dans le premier écran à 1280');
await chercher('mu', true); console.log('1280 « mu » :', (await vus()).map((r) => r.t).join(' | '), '| aperçu', await ap()); await p.screenshot({ path: out('1280-mu-pendant') });
await b.close();
console.log(err.length ? 'ERREURS ' + err.join(' | ') : 'sans erreur');
console.log(err.length ? 'CAPTURES ECHEC ' + err.length : 'CAPTURES OK');
