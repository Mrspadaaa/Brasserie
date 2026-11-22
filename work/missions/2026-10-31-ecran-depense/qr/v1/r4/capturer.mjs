// Captures de r4 passe 2 (contrôle QR) : les six états à 390 × 844 (tactile) et à 1280 × 800, puis les gestes de gestes.json
// ([nom, état, sélecteur ou liste de sélecteurs à toucher dans l'ordre]).
// Usage : node work/missions/2026-10-31-ecran-depense/qr/v1/r4/capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ETATS = ['confirme', 'contredit', 'partiel', 'illisible', 'sans', 'lecture'];
const base = 'file:///' + path.join(ICI, 'etat.html').split(path.sep).join('/');
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await nav.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
const charger = async (url, w, h, mobile) => {
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));
};
for (const e of ETATS) {
  await charger(`${base}?etat=${e}`, 390, 844, true);
  await p.screenshot({ path: path.join(ICI, `r4b-${e}-390.png`) });
  await charger(`${base}?etat=${e}`, 1280, 800, false);
  await p.screenshot({ path: path.join(ICI, `r4b-${e}-1280.png`) });
}
for (const [nom, e, sel] of JSON.parse(fs.readFileSync(path.join(ICI, 'gestes.json'), 'utf8'))) {
  await charger(`${base}?etat=${e}`, 390, 844, true);
  for (const s of [].concat(sel)) {
    const el = await p.$(s);
    if (!el) { erreurs.push(`${nom} : ${s} introuvable`); continue; }
    await el.click();
    await new Promise((r) => setTimeout(r, 300));
  }
  await p.screenshot({ path: path.join(ICI, `r4b-geste-${nom}.png`) });
}
await nav.close();
console.log(erreurs.length ? `ERREURS\n${erreurs.join('\n')}` : 'CAPTURES OK');
