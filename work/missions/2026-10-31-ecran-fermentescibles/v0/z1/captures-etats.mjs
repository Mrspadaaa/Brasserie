// Captures des états joués de la série z (31.10) : couleurs renseignées (état 2), dextrose ajouté (état 3), ordinateur 1280.
// Usage : node work/missions/2026-10-31-ecran-fermentescibles/v0/z1/captures-etats.mjs z1 [z2…]
// Chaque etat.html de la série expose les mêmes rôles : [data-role="marq"] (ouvre la saisie des couleurs),
// [data-role="coul"] input (EBC par grain, Entrée passe au suivant), [data-role="nom"] (nom, Entrée crée la ligne à 0 kg
// et passe à la masse), [data-role="fam"] (la famille tourne), puis la masse reçoit le focus.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2);
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
try {
  for (const id of ids) {
    const dossier = path.join(ici, '..', id);
    const url = pathToFileURL(path.join(dossier, 'etat.html')).href;
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(url, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    // État 2 : les trois couleurs, tapées par lui : 3,5 · 4 · 2 EBC.
    await p.click('[data-role="marq"]');
    for (const v of ['3,5', '4', '2']) {
      await p.keyboard.type(v);
      await p.keyboard.press('Enter');
    }
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await new Promise((r) => setTimeout(r, 150));
    await p.screenshot({ path: path.join(dossier, `${id}-couleurs.png`) });
    // État 3 : dextrose 0,4 kg, à l'ébullition. La famille tourne de grain à sucre, puis nom, Entrée, masse.
    await p.click((await p.$('[data-role="fam-sucre"]')) ? '[data-role="fam-sucre"]' : '[data-role="fam"]');
    await p.click('[data-role="nom"]');
    await p.keyboard.type('Dextrose');
    await p.screenshot({ path: path.join(dossier, `${id}-saisie.png`) });
    await p.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 100));
    const focus = await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('aria-label'));
    await p.keyboard.type('0,4');
    await p.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 150));
    await p.screenshot({ path: path.join(dossier, `${id}-sucre.png`) });
    // Ordinateur.
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 150));
    await p.screenshot({ path: path.join(dossier, `${id}-1280.png`) });
    const grain = await p.evaluate(() => (document.querySelector('[data-role="grain"]') || {}).textContent);
    const ebc = await p.evaluate(() => (document.querySelector('[data-role="bebc"]') || {}).textContent);
    console.log(`${id} : focus après Entrée = « ${focus} » ; Grain ${grain} kg ; EBC ${ebc} ; erreurs ${erreurs.length}${erreurs.length ? ' : ' + erreurs.join(' | ') : ''}`);
    await p.close();
  }
} finally {
  await nav.close();
}
