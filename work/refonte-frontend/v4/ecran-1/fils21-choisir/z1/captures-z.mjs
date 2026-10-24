// Captures des maquettes z1 à z5, à 390 px, avant et après les gestes qui comptent.
// Usage : node captures-z.mjs z1 [z2…]  →  fils21-choisir/captures/zN-<etat>-390.png
// Imprime aussi les erreurs de console de la page (une page qui marche au doigt n'en a pas).
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const D = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils21-choisir';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Un état : nom, hauteur, et des gestes (tap sur un sélecteur, valeur d'un curseur, appui long, défilement).
const ETATS = {
  z1: [
    { nom: 'haut', h: 844 }, { nom: 'page', h: 1900 },
    { nom: 'sachet-pris', h: 844, gestes: [{ tap: '.sachet[data-houblon="Galaxy"]' }] },
    { nom: 'pose-puis', h: 1900, gestes: [{ tap: '.sachet[data-houblon="Galaxy"]' }, { tap: '.slot[data-slot="puis"]' }] },
    { nom: 'citra-60', h: 1300, gestes: [{ tap: '[data-essai="k1a"]' }] },
    { nom: 'ensemble', h: 1900, gestes: [{ tap: '[data-essai="k5"]' }] },
    { nom: 'jours-7', h: 1300, gestes: [{ tap: '[data-essai="k2a"]' }, { range: '#jours', v: 4 }] },
    { nom: 'levure-pomona', h: 1300, gestes: [{ tap: '[data-essai="k3b"]' }, { tap: '[data-levure="Pomona"]' }] },
    { nom: 'absolu', h: 844, gestes: [{ tap: '[data-e="absolu"]' }] },
    { nom: 'fiche', h: 844, gestes: [{ appui: '.sachet[data-houblon="Citra"]' }] },
    { nom: 'legende', h: 844, gestes: [{ tap: '[data-role="legende-bouton"]' }] },
  ],
  z2: [
    { nom: 'haut', h: 844 }, { nom: 'page', h: 1700 },
    { nom: 'moment-60', h: 844, gestes: [{ range: '#moment', v: 0 }] },
    { nom: 'moment-10', h: 844, gestes: [{ range: '#moment', v: 1 }] },
    { nom: 'dose-8', h: 844, gestes: [{ range: '#dose', v: 8 }] },
    { nom: 'paire-galaxy', h: 1700, gestes: [{ tap: '[data-paire="Citra|Galaxy"]' }] },
    { nom: 'ensemble', h: 1700, gestes: [{ tap: '[data-reglage="ajout-cumule"]' }] },
    { nom: 'actif-verdant', h: 1700, gestes: [{ range: '#moment', v: 3 }, { tap: '[data-levure="Verdant"]' }] },
    { nom: 'absolu', h: 844, gestes: [{ tap: '[data-e="absolu"]' }] },
    { nom: 'fiche', h: 844, gestes: [{ appui: '[data-houblon="Cascade"]' }] },
  ],
  z3: [
    { nom: 'haut', h: 844 }, { nom: 'page', h: 1700 },
    { nom: 'dose-8', h: 844, gestes: [{ range: '#dose', v: 8 }] },
    { nom: 'dose-1', h: 844, gestes: [{ range: '#dose', v: 1 }] },
    { nom: 'deux-pions', h: 1700, gestes: [{ tap: '.pion[data-pion="Galaxy"]' }] },
    { nom: 'moment-60', h: 844, gestes: [{ tap: '[data-moment="b60"]' }] },
    { nom: 'actif-pomona', h: 1700, gestes: [{ tap: '[data-moment="dryActive"]' }, { tap: '[data-levure="Pomona"]' }] },
    { nom: 'absolu', h: 844, gestes: [{ tap: '[data-e="absolu"]' }] },
    { nom: 'fiche', h: 844, gestes: [{ appui: '.pion[data-pion="Citra"]' }] },
  ],
  z4: [
    { nom: 'haut', h: 844 }, { nom: 'page', h: 1700 },
    { nom: 'mot-ouvert', h: 844, gestes: [{ tap: '[data-mot="moment"]' }] },
    { nom: 'moment-60', h: 844, gestes: [{ tap: '[data-mot="moment"]' }, { tap: '[data-val="b60"]' }] },
    { nom: 'cascade', h: 844, gestes: [{ tap: '[data-mot="houblon"]' }, { tap: '[data-val="Cascade"]' }] },
    { nom: 'puis-galaxy', h: 1700, gestes: [{ tap: '[data-mot="deux"]' }, { tap: '[data-val="puis:Galaxy:7"]' }] },
    { nom: 'ensemble-galaxy', h: 1700, gestes: [{ tap: '[data-mot="deux"]' }, { tap: '[data-val="ens:Galaxy"]' }] },
    { nom: 'levure-verdant-actif', h: 1700, gestes: [{ tap: '[data-mot="deux"]' }, { tap: '[data-val="puis:Idaho 7:5"]' }, { tap: '[data-mot="moment"]' }, { tap: '[data-val="dryActive"]' }, { tap: '[data-mot="levure"]' }, { tap: '[data-val="Verdant"]' }] },
    { nom: 'absolu', h: 844, gestes: [{ tap: '[data-e="absolu"]' }] },
    { nom: 'fiche', h: 844, gestes: [{ appui: '[data-houblon="Citra"]' }] },
  ],
  z5: [
    { nom: 'haut', h: 844 }, { nom: 'page', h: 1700 },
    { nom: 'pari-1', h: 1700, gestes: [{ tap: '[data-pari="k1"] [data-choix="b10"]' }] },
    { nom: 'pari-2', h: 1700, gestes: [{ tap: '[data-pari="k1"] [data-choix="b10"]' }, { tap: '[data-pari="k1"] [data-suivant]' }, { tap: '[data-pari="k2"] [data-choix="Galaxy"]' }] },
    { nom: 'pari-3', h: 1700, gestes: [{ tap: '[data-pari="k1"] [data-choix="b10"]' }, { tap: '[data-pari="k1"] [data-suivant]' }, { tap: '[data-pari="k2"] [data-choix="Galaxy"]' }, { tap: '[data-pari="k2"] [data-suivant]' }, { tap: '[data-pari="k3"] [data-choix="galaxy7"]' }, { range: '#k3j', v: 2 }] },
    { nom: 'pari-4', h: 1700, gestes: [{ tap: '[data-pari="k1"] [data-choix="b10"]' }, { tap: '[data-pari="k1"] [data-suivant]' }, { tap: '[data-pari="k2"] [data-choix="Galaxy"]' }, { tap: '[data-pari="k2"] [data-suivant]' }, { tap: '[data-pari="k3"] [data-choix="galaxy7"]' }, { tap: '[data-pari="k3"] [data-suivant]' }, { tap: '[data-pari="k4"] [data-choix="non"]' }] },
    { nom: 'pari-5', h: 1700, gestes: [{ tap: '[data-pari="k1"] [data-choix="b10"]' }, { tap: '[data-pari="k1"] [data-suivant]' }, { tap: '[data-pari="k2"] [data-choix="Galaxy"]' }, { tap: '[data-pari="k2"] [data-suivant]' }, { tap: '[data-pari="k3"] [data-choix="galaxy7"]' }, { tap: '[data-pari="k3"] [data-suivant]' }, { tap: '[data-pari="k4"] [data-choix="non"]' }, { tap: '[data-pari="k4"] [data-suivant]' }, { tap: '[data-pari="k5"] [data-choix="plus"]' }] },
    { nom: 'fin', h: 1700, gestes: [{ tap: '[data-pari="k1"] [data-choix="b10"]' }, { tap: '[data-pari="k1"] [data-suivant]' }, { tap: '[data-pari="k2"] [data-choix="Galaxy"]' }, { tap: '[data-pari="k2"] [data-suivant]' }, { tap: '[data-pari="k3"] [data-choix="galaxy7"]' }, { tap: '[data-pari="k3"] [data-suivant]' }, { tap: '[data-pari="k4"] [data-choix="non"]' }, { tap: '[data-pari="k4"] [data-suivant]' }, { tap: '[data-pari="k5"] [data-choix="plus"]' }, { tap: '[data-pari="k5"] [data-suivant]' }] },
    { nom: 'fiche', h: 844, gestes: [{ appui: '.bas [data-houblon="Citra"]' }] },
  ],
};
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const seul = (process.argv.find((a) => a.startsWith('--etat=')) || '').slice(7);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) {
  for (const et of ETATS[id] || []) {
    if (seul && et.nom !== seul) continue;
    const page = await browser.newPage();
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(String(e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
    await page.setViewport({ width: 390, height: et.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(pathToFileURL(path.join(D, id, 'etat.html')).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(300);
    let ok = true;
    for (const g of et.gestes || []) {
      try {
        if (g.tap) { const h = await page.$(g.tap); if (!h) { ok = false; erreurs.push('introuvable ' + g.tap); break; } await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); try { await h.tap(); } catch { await h.click(); } }
        if (g.range) { await page.$eval(g.range, (e, v) => { e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, g.v); }
        if (g.appui) { const h = await page.$(g.appui); if (!h) { ok = false; erreurs.push('introuvable ' + g.appui); break; } const t = await h.touchStart(); await wait(650); await t.end(); }
        await wait(350);
      } catch (e) { ok = false; erreurs.push('geste ' + JSON.stringify(g) + ' : ' + e.message); break; }
    }
    if (et.gestes && !(et.gestes.some((g) => g.appui) || et.nom === 'legende')) await page.evaluate(() => window.scrollTo(0, 0));
    await wait(250);
    const out = path.join(D, 'captures', id + '-' + et.nom + '-390.png');
    await page.screenshot({ path: out });
    console.log((ok ? 'SHOT ' : 'SHOT (geste manqué) ') + path.relative(D, out) + (erreurs.length ? '  ERREURS : ' + erreurs.join(' | ').slice(0, 400) : ''));
    await page.close();
  }
}
await browser.close();
