// Captures de la série r (vue TVA, v0) : les sept états à 390 × 844 (tactile), « annee » et « si » à 1280 × 800,
// puis les gestes déclarés dans <id>/gestes.json ([nom, état, sélecteur(s) à toucher]).
// Usage : node work/missions/2026-10-31-ecran-depense/tva/v0/r1/capturer.mjs r1 [r2 …]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const V0 = path.resolve(ICI, '..');
const RACINE = path.resolve(V0, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ETATS = ['annee', 'inconnues', 'douteuse', 'etrangere', 'vide', 'si', 'horsligne'];
const ids = process.argv.slice(2);
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
for (const id of ids) {
  const dir = path.join(V0, id);
  const base = 'file:///' + path.join(dir, 'etat.html').split(path.sep).join('/');
  for (const e of ETATS) {
    await charger(`${base}?etat=${e}`, 390, 844, true);
    await p.screenshot({ path: path.join(dir, `${id}-${e}-390.png`) });
  }
  for (const e of ['annee', 'si']) {
    await charger(`${base}?etat=${e}`, 1280, 800, false);
    await p.screenshot({ path: path.join(dir, `${id}-${e}-1280.png`) });
  }
  const fGestes = path.join(dir, 'gestes.json');
  if (fs.existsSync(fGestes)) {
    for (const [nom, e, sel] of JSON.parse(fs.readFileSync(fGestes, 'utf8'))) {
      await charger(`${base}?etat=${e}`, 390, 844, true);
      for (const s of [].concat(sel)) {
        const el = await p.$(s);
        if (!el) { erreurs.push(`${id} ${nom} : ${s} introuvable`); continue; }
        await el.click();
        await new Promise((r) => setTimeout(r, 250));
      }
      await p.screenshot({ path: path.join(dir, `${id}-geste-${nom}.png`) });
    }
  }
  console.log(`${id} : captures écrites`);
}
await nav.close();
console.log(erreurs.length ? `ERREURS\n${erreurs.join('\n')}` : 'CAPTURES OK');
