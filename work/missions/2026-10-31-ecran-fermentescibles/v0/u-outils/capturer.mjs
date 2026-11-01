// Captures de la série u (v0, Malts/sucres 2/7) : chaque état à 390 × 844, la page entière, 1280 px, et deux gestes joués.
// Conventions des maquettes u : champ d'ajout [data-role="q"], marque « à renseigner » [data-role="ar"],
// champ de couleur [data-role="ebc"], états par ?etat=<nom>, pied [data-commun="pied"].
// Usage : node capturer.mjs u1 [u2…]  (depuis n'importe où ; écrit dans v0/<id>/cap-*.png)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const v0 = path.resolve(ici, '..');
const RACINE = path.resolve(v0, '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2);
const ETATS = ['recette', 'couleurs', 'sucre', 'lactose', 'huit', 'vide'];
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (const id of ids) {
    const fichier = path.join(v0, id, 'etat.html').split(path.sep).join('/');
    const url = (e) => `file:///${fichier}?etat=${e}`;
    const out = (n) => path.join(v0, id, `cap-${n}.png`);
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    for (const e of ETATS) {
      await p.goto(url(e), { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: out(e) });
      const m = await p.evaluate(() => {
        const pied = document.querySelector('[data-commun="pied"]');
        return { piedBas: pied ? Math.round(pied.getBoundingClientRect().bottom + scrollY) : null, debord: document.documentElement.scrollWidth - innerWidth };
      });
      console.log(`${id} ${e.padEnd(9)} pied bas ${m.piedBas} px (${(m.piedBas / 844).toFixed(2)} écran) ; débord ${m.debord}`);
    }
    await p.goto(url('recette'), { waitUntil: 'networkidle0' });
    await p.screenshot({ path: out('page'), fullPage: true });
    // Geste 1, au clavier : nom, Entrée, masse, Entrée.
    await p.focus('[data-role="q"]');
    await p.keyboard.type('pale');
    await attendre(80);
    await p.screenshot({ path: out('clavier-pendant') });
    await p.keyboard.press('Enter');
    await attendre(80);
    const focus1 = await p.evaluate(() => document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.dataset.role));
    await p.keyboard.type('0,5');
    await p.keyboard.press('Enter');
    await attendre(80);
    const focus2 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.role);
    await p.screenshot({ path: out('clavier-apres') });
    console.log(`${id} clavier : après Entrée, focus sur « ${focus1} » ; après la masse, focus sur « ${focus2} »`);
    // Geste 2 : la marque « à renseigner », puis 3,5 EBC.
    await p.goto(url('recette'), { waitUntil: 'networkidle0' });
    const ar = await p.$('[data-role="ar"]');
    if (ar) {
      await ar.click();
      await attendre(80);
      await p.keyboard.type('3,5');
      await attendre(80);
      await p.screenshot({ path: out('couleur-pendant') });
      await p.keyboard.press('Enter');
      await p.keyboard.type('4');
      await p.keyboard.press('Enter');
      await p.keyboard.type('2');
      await p.keyboard.press('Enter');
      await attendre(80);
      await p.screenshot({ path: out('couleur-apres') });
      const ebc = await p.evaluate(() => document.querySelector('[data-role="bebc"]')?.textContent);
      console.log(`${id} couleurs 3,5 · 4 · 2 tapées : EBC du bandeau « ${ebc} »`);
    } else console.log(`${id} : pas de marque [data-role="ar"]`);
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await p.goto(url('sucre'), { waitUntil: 'networkidle0' });
    await p.screenshot({ path: out('1280') });
    console.log(`${id} erreurs de script : ${erreurs.length}${erreurs.length ? ' — ' + erreurs.join(' ; ') : ''}`);
    await p.close();
  }
} finally {
  await nav.close();
}
