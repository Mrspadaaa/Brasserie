// Captures de r4b (passe 2) : repos 390 et 1280, #couleurs, #sucre, #vide, #huit, #fruit, page entière,
// geste couleur sur le plateau (« ? » → 3,5), parcours au clavier (« Cara », Entrée, 0,3, Entrée) et greffe « munch 0,25 ».
// Mesure la hauteur à 8 lignes et le bas du plateau. Imprime les mesures, puis CAPTURES OK ou CAPTURES ECHEC n.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const url = 'file:///' + path.join(ICI, 'etat.html').split(path.sep).join('/');
const out = (n) => path.join(ICI, `r4b-${n}.png`);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const err = []; p.on('pageerror', (e) => err.push(e.message));
const pret = () => p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150))));
const brut = async (n) => { const t = await p.evaluate(() => document.body.innerText); if (/NaN|null|undefined|\[object/.test(t)) err.push(n + ' : valeur brute'); };
const boite = (s) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { haut: Math.round(r.top + scrollY), bas: Math.round(r.bottom + scrollY) } : null; }, s);
for (const h of ['', 'couleurs', 'sucre', 'vide', 'huit', 'fruit']) {
  await p.goto(url + (h ? '#' + h : '')); await pret();
  await p.screenshot({ path: out(h || 'haut') }); await brut(h || 'repos');
  if (h === 'huit') {
    const pied = await boite('[data-commun="pied"]'), bal = await boite('[data-role="bal"]');
    console.log(`8 lignes : ${(pied.bas / 844).toFixed(2)} écran ; plateau ${bal.haut}–${bal.bas} px (écran 844)`);
    if (pied.bas / 844 > 1.05) err.push('8 lignes au-delà de 1,05 écran');
    if (bal.bas > 844) err.push('plateau hors du premier écran à 8 lignes');
  }
}
await p.goto(url); await pret();
await p.screenshot({ path: out('page'), fullPage: true });
const bal = await boite('[data-role="bal"]'), tk = await boite('[data-role="ticket"]');
console.log(`repos : ticket ${tk.bas - tk.haut} px, plateau ${bal.bas - bal.haut} px`);
// Le geste couleur, sur le plateau.
await p.click('[data-role="bteinte"]'); await pret();
await p.screenshot({ path: out('geste-couleur-ouvert') });
await p.keyboard.type('3,5'); await p.keyboard.press('Enter'); await pret();
const lab = await p.evaluate(() => document.querySelector('[data-role="bteinte"]')?.getAttribute('aria-label') || '');
if (!/3,5 EBC/.test(lab)) err.push('couleur : ' + lab);
await p.screenshot({ path: out('geste-couleur') });
// Le clavier : nom, Entrée, masse, Entrée.
await p.focus('[data-role="ajout"]'); await p.keyboard.type('Cara'); await pret();
await p.screenshot({ path: out('clavier-nom') });
await p.keyboard.press('Enter'); await pret();
const f = await p.evaluate(() => document.activeElement?.getAttribute('aria-label') || '');
if (!/Masse de Carapils/.test(f)) err.push('après Entrée, focus sur « ' + f + ' »');
await p.screenshot({ path: out('clavier-masse') });
await p.keyboard.type('0,3'); await p.keyboard.press('Enter'); await pret();
await p.screenshot({ path: out('clavier-fin') });
// Greffe u2 : le nom et la masse d'un coup, l'aperçu avant Entrée.
await p.keyboard.type('munch 0,25'); await pret();
await p.screenshot({ path: out('clavier-apercu') });
await p.keyboard.press('Enter'); await pret();
const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
if (!/Carapils.*0,30/.test(t)) err.push('Carapils 0,30 absent');
if (!/Münchner Malz.*0,25/.test(t)) err.push('Münchner 0,25 absent');
await brut('gestes');
await p.setViewport({ width: 1280, height: 900 });
await p.goto(url); await pret(); await p.screenshot({ path: out('ordinateur') });
await p.goto(url + '#sucre'); await pret(); await p.screenshot({ path: out('ordinateur-sucre') });
await b.close();
console.log(err.length ? 'ERREURS ' + err.join(' | ') : 'sans erreur');
console.log(err.length ? 'CAPTURES ECHEC ' + err.length : 'CAPTURES OK');
