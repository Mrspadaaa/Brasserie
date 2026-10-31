// Captures de la série r (v0, Nouvelle dépense) : premier écran 390, page entière, 1280, et gestes.
// Usage : node work/missions/2026-10-31-ecran-depense/v0/r1/capturer.mjs r2 [r3 …]
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Gestes par concept : [nom, fonction jouée dans la page (texte d'expression), défilement vers un sélecteur ou null]
const GESTES = {
  r1: [
    ['point-tva', "document.querySelector('[data-pt=\"p1\"] [data-choix]').click()", '[data-pt="p1"]'],
    ['articles', "document.querySelector('#r1-art').open=true", '#r1-art'],
    ['tous-regles', 'window.r1Regler()', null],
    ['enregistre', "window.r1Regler();document.querySelector('#r1-go').click()", null, 2600],
  ],
  r2: [
    ['ligne-ouverte', 'window.r2Ouvrir(1)', '.r2-plat'],
    ['tva-ouverte', "document.querySelector('#r2-ttva').click()", '#r2-ptva'],
    ['moutures', "document.querySelectorAll('[data-att]')[0].click()", '.r2-mo'],
    ['tous-regles', 'window.r2Regler()', null],
    ['enregistre', "window.r2Regler();document.querySelector('#r2-go').click()", null, 2600],
  ],
  r3: [
    ['carte-2', "document.querySelector('#r3-next').click()", null],
    ['regle-1', "document.querySelector('#r3-deck [data-tva]').click()", null],
    ['tous-regles', 'window.r3Regler()', null],
    ['enregistre', "window.r3Regler();document.querySelector('#r3-go').click()", null, 2600],
  ],
  r4: [
    ['tuile-ouverte', 'window.r4Ouvrir(1)', '#r4-plat'],
    ['mouture', "document.querySelector('[data-mout]').click()", '[data-mout]'],
    ['tous-regles', 'window.r4Regler()', null],
    ['enregistre', "window.r4Regler();document.querySelector('#r4-go').click()", null, 2600],
  ],
};

const ids = process.argv.slice(2);
const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
for (const id of ids) {
  const dossier = path.resolve(ICI, '..', id);
  const url = 'file:///' + path.join(dossier, 'etat.html').replace(/\\/g, '/');
  const p = await navigateur.newPage();
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(String(e)));
  const charger = async (w, h, mobile) => {
    await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    await p.goto(url, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
  };
  await charger(390, 844, true);
  await p.screenshot({ path: path.join(dossier, `${id}-repos.png`) });
  await p.screenshot({ path: path.join(dossier, `${id}-page.png`), fullPage: true });
  await p.evaluate(() => { document.body.style.filter = 'blur(6px)'; });
  await p.screenshot({ path: path.join(dossier, `${id}-flou.png`) });
  for (const [nom, js, cible, attente] of GESTES[id] || []) {
    await charger(390, 844, true);
    await p.evaluate(js);
    await new Promise((r) => setTimeout(r, attente || 400));
    if (cible) await p.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: 'center' }); }, cible);
    await new Promise((r) => setTimeout(r, 300));
    await p.screenshot({ path: path.join(dossier, `${id}-${nom}.png`) });
  }
  await charger(1280, 800, false);
  await p.screenshot({ path: path.join(dossier, `${id}-1280.png`) });
  await charger(1280, 800, false);
  await p.evaluate(() => document.querySelector('[id$="annexe"]')?.scrollIntoView());
  await new Promise((r) => setTimeout(r, 200));
  await p.screenshot({ path: path.join(dossier, `${id}-1280-annexe.png`) });
  console.log(`${id} : captures écrites${erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : ' · 0 erreur de script'}`);
  await p.close();
}
await navigateur.close();
