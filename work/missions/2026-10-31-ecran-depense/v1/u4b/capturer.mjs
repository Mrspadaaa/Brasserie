// Captures de u4b (passe 2 de « Nouvelle dépense ») : les 9 états (11 vues) à 390 et à 1280, puis les gestes du repos à 390.
// Usage : node work/missions/2026-10-31-ecran-depense/v1/u4b/capturer.mjs [--etats] [--gestes] (sans option : les deux)
// Sortie : une ligne par vue, puis CAPTURES OK si aucune erreur de page ni sélecteur manquant, sinon CAPTURES ECHEC.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const page0 = pathToFileURL(path.join(ici, 'etat.html')).href;
const args = process.argv.slice(2);
const faire = (o) => !args.length || args.includes(o);

const ETATS = ['1', '2', '3', '4', '4t', '5', '6', '7', '7r', '8', '9'];
// geste : nom, sélecteurs touchés dans l'ordre (sur la même page, à la suite), délai final
const GESTES = [
  ['tva-ouverte', ['[data-u4b-arg="tva"]']],
  ['tva-reglee', ['[data-u4b-act="tva-vide"]']],
  ['saut-paye', ['#u4b-cpt']],
  ['paye-reglee', ['[data-u4b-act="paye-garder"]']],
  ['saut-mouture', ['#u4b-cpt']],
  ['mouture-reglee', ['[data-u4b-act="mout-oui"]']],
  ['target-ouvert', ['[data-fl="8"]']],
  ['target-regle', ['[data-u4b-act="target-bis"]']],
  ['malts-ouverts', ['.u4b-fam[data-u4b-fold="m"]']],
  ['preuve', ['#u4b-tam']],
  ['enregistre', ['#u4b-conf'], 1500],
];

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const erreurs = [];
async function ouvrir(largeur, etat) {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(`${etat}@${largeur} : ${e.message}`));
  if (largeur === 390) await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await p.goto(page0 + '?etat=' + etat, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await attendre(250);
  return p;
}
try {
  if (faire('--etats')) for (const e of ETATS) for (const w of [390, 1280]) {
    const p = await ouvrir(w, e);
    await p.screenshot({ path: path.join(ici, `u4b-e${e}-${w}.png`) });
    console.log(`état ${e} à ${w} : u4b-e${e}-${w}.png`);
    await p.close();
  }
  if (faire('--gestes')) {
    const p = await ouvrir(390, '3');
    for (const [nom, sels, delai] of GESTES) {
      if (nom === 'malts-ouverts') { await p.reload({ waitUntil: 'networkidle0' }); await attendre(250); }
      for (const s of sels) {
        const el = await p.$(s);
        if (!el) { erreurs.push(`${nom} : ${s} introuvable`); continue; }
        await el.evaluate((x) => x.scrollIntoView({ block: 'center' }));
        await attendre(150);
        await el.click();
        await attendre(300);
      }
      if (delai) await attendre(delai);
      await attendre(300);
      await p.screenshot({ path: path.join(ici, `u4b-g-${nom}.png`) });
      console.log(`geste ${nom} : u4b-g-${nom}.png`);
    }
    await p.close();
  }
} finally {
  await nav.close();
}
console.log(erreurs.length ? 'CAPTURES ECHEC\n  - ' + erreurs.join('\n  - ') : 'CAPTURES OK');
process.exit(erreurs.length ? 1 : 0);
