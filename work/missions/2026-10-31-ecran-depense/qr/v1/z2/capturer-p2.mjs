// Captures de la passe 2 (QR, série z, v1, 01.11) : six états à 390 × 844 (premier écran), les gestes (prendre le QR en contredit ;
// ouvrir le sceau ou la section ; ouvrir la tuile Règlement ; ouvrir la preuve), puis 1280 confirme et contredit.
// Usage : node work/missions/2026-10-31-ecran-depense/qr/v1/z2/capturer-p2.mjs [z2 z4]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const v1 = path.resolve(ici, '..');
const RACINE = path.resolve(v1, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['z2', 'z4'];
const ETATS = ['confirme', 'contredit', 'partiel', 'illisible', 'sans', 'lecture'];
const GESTES = [['contredit', 'prendre-qr', 'contredit-apres'], ['confirme', 'ouvrir', 'confirme-ouvert'], ['confirme', 'tuile', 'confirme-tuile'], ['confirme', 'adopter', 'confirme-adopte'], ['confirme', 'preuve', 'confirme-preuve'], ['illisible', 'ouvrir', 'illisible-ouvert'], ['partiel', 'ouvrir', 'partiel-ouvert']];

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
try {
  for (const id of ids) {
    const page = path.join(v1, id, 'etat.html');
    const url = `file:///${page.split(path.sep).join('/')}`;
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    for (const etat of ETATS) {
      await p.goto(`${url}?etat=${etat}`, { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: path.join(v1, id, `${id}-${etat}-390.png`) });
    }
    const manques = [];
    for (const [etat, geste, nom] of GESTES) {
      await p.goto(`${url}?etat=${etat}`, { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      const ok = await p.evaluate((g) => { const b = document.querySelector(`[data-geste="${g}"]`); if (!b) return false; b.click(); return true; }, geste);
      await new Promise((r) => setTimeout(r, 400));
      if (ok) await p.screenshot({ path: path.join(v1, id, `${id}-${nom}-390.png`) }); else manques.push(geste + '@' + etat);
    }
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    for (const etat of ['confirme', 'contredit']) {
      await p.goto(`${url}?etat=${etat}`, { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: path.join(v1, id, `${id}-${etat}-1280.png`) });
    }
    const debord = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(`${id} : 6 états à 390, ${GESTES.length - manques.length} gestes${manques.length ? ' (introuvables : ' + manques.join(', ') + ')' : ''}, 1280${debord ? ' ; DÉBORD horizontal' : ''}${erreurs.length ? ' ; erreurs : ' + erreurs.join(' | ') : ''}`);
    await p.close();
  }
} finally { await nav.close(); }
