// Captures de la série z (QR, v0, 01.11) : les six états à 390 × 844 (premier écran), « confirme » à 1280, et le geste du désaccord
// (contredit, puis « QR 110,40 » touché). Usage : node work/missions/2026-10-31-ecran-depense/qr/v0/z1/capturer-z.mjs [z1 z2 …]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const v0 = path.resolve(ici, '..');
const RACINE = path.resolve(v0, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['z1', 'z2', 'z3', 'z4'];
const ETATS = ['confirme', 'contredit', 'partiel', 'illisible', 'sans', 'lecture'];

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
try {
  for (const id of ids) {
    const page = path.join(v0, id, 'etat.html');
    const url = `file:///${page.split(path.sep).join('/')}`;
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    for (const etat of ETATS) {
      await p.goto(`${url}?etat=${etat}`, { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: path.join(v0, id, `${id}-${etat}-390.png`) });
    }
    // Le geste : en désaccord, prendre la valeur du QR.
    await p.goto(`${url}?etat=contredit`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    const ok = await p.evaluate(() => { const b = document.querySelector('[data-geste="prendre-qr"]'); if (!b) return false; b.click(); return true; });
    await new Promise((r) => setTimeout(r, 400));
    await p.screenshot({ path: path.join(v0, id, `${id}-contredit-apres-390.png`) });
    // Le second geste : ouvrir ce que le QR dit (sceau, bande, « n lignes »), sur « confirme ».
    await p.goto(`${url}?etat=confirme`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    const ouvert = await p.evaluate(() => { const b = document.querySelector('[data-geste="ouvrir"]'); if (!b) return false; b.click(); return true; });
    await new Promise((r) => setTimeout(r, 400));
    if (ouvert) await p.screenshot({ path: path.join(v0, id, `${id}-confirme-ouvert-390.png`) });
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await p.goto(`${url}?etat=confirme`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(v0, id, `${id}-confirme-1280.png`) });
    await p.goto(`${url}?etat=contredit`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(v0, id, `${id}-contredit-1280.png`) });
    const debord = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(`${id} : 6 états à 390, geste${ok ? '' : ' (introuvable)'}, 1280${debord ? ' ; DÉBORD horizontal' : ''}${erreurs.length ? ' ; erreurs : ' + erreurs.join(' | ') : ''}`);
    await p.close();
  }
} finally { await nav.close(); }
