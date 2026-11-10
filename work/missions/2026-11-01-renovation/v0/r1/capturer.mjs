// Captures de la série r (rénovation, v0) : les huit états à 390 × 844 (tactile), « encours » à 1280 × 800, les gestes
// de <id>/gestes.json ([nom, état, sélecteur(s) à toucher]), puis une planche <id>-planche.png des huit états côte à côte.
// Usage : node work/missions/2026-11-01-renovation/v0/r1/capturer.mjs r1 [r2 …]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const V0 = path.resolve(ICI, '..');
const RACINE = path.resolve(V0, '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ETATS = ['jour1', 'encours', 'ajout', 'ouvert', 'depasse', 'caisse', 'fini', 'horsligne'];
const ids = process.argv.slice(2);
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await nav.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
const url = (f) => 'file:///' + f.split(path.sep).join('/');
const charger = async (u, w, h, mobile) => {
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await p.goto(u, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));
};
for (const id of ids) {
  const dir = path.join(V0, id);
  const base = url(path.join(dir, 'etat.html'));
  for (const e of ETATS) {
    await charger(`${base}?etat=${e}`, 390, 844, true);
    await p.screenshot({ path: path.join(dir, `${id}-${e}-390.png`) });
  }
  await charger(`${base}?etat=encours`, 1280, 800, false);
  await p.screenshot({ path: path.join(dir, `${id}-encours-1280.png`) });
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
  // Planche : les huit états en deux rangées, pour un premier regard (puis chaque capture en plein format).
  const cases = ETATS.map((e) => `<figure><img src="${url(path.join(dir, `${id}-${e}-390.png`))}"><figcaption>${e}</figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#ddd;font:600 22px system-ui}main{display:grid;grid-template-columns:repeat(4,390px);gap:10px;padding:10px}figure{margin:0}img{display:block;width:390px;height:844px}figcaption{padding:4px}</style><main>${cases}</main>`;
  const fPl = path.join(os.tmpdir(), `reno-${id}-planche.html`);
  fs.writeFileSync(fPl, html);
  await charger(url(fPl), 1610, 1800, false);
  await p.screenshot({ path: path.join(dir, `${id}-planche.png`), fullPage: true });
  console.log(`${id} : captures écrites`);
}
await nav.close();
console.log(erreurs.length ? `ERREURS\n${erreurs.join('\n')}` : 'CAPTURES OK');
