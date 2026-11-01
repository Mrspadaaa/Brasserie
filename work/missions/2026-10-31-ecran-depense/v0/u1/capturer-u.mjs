// Captures de la série u (v0 de « Nouvelle dépense ») : repos 390, gestes joués (avant / après), 1280.
// Usage : node work/missions/2026-10-31-ecran-depense/v0/u1/capturer-u.mjs <id> [<id>…]
// Les gestes de chaque concept sont décrits dans GESTES : un sélecteur à toucher, puis une capture.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const V0 = path.resolve(ici, '..');

const GESTES = {
  u1: [['regle-paye', ['[data-u1-open="paye"]', '[data-u1-ok="paye"]']], ['saut-mouture', ['#u1-cpt']], ['mouture-rattachee', ['[data-u1-ok="mout"]']], ['preuve', ['#u1-pvb']], ['enregistre', ['#u1-conf'], 1500]],
  u2: [['regle-1', ['[data-u2-act="tva-vide"]']], ['regle-2', ['[data-u2-act="paye-garder"]']], ['reste', ['#u2-restb']], ['enregistre', ['#u2-conf'], 1500]],
  u3: [['segment-levures', ['[data-u3-fam="lev"]']], ['point-tva', ['[data-u3-pin="tva"]']], ['tva-reglee', ['[data-u3-act="tva-vide"]']], ['enregistre', ['#u3-conf'], 1500]],
  u4: [['argent-tva', ['[data-u4-arg="tva"]']], ['cable-mouture', ['#u4-droite [data-u4-row="mout"]']], ['mouture-reglee', ['[data-u4-act="mout-oui"]']], ['cable-target', ['#u4-gauche [data-u4-row="8"]']], ['target-regle', ['[data-u4-act="bis-8"]']], ['enregistre', ['#u4-conf'], 1500]],
};

const ids = process.argv.slice(2);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (const id of ids) {
    const fichier = pathToFileURL(path.join(V0, id, 'etat.html')).href;
    const sortie = (nom) => path.join(V0, id, `${id}-${nom}.png`);
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(fichier, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: sortie('repos') });
    for (const [nom, sels, delai] of GESTES[id] || []) {
      for (const s of sels) {
        const el = await p.$(s);
        if (!el) { erreurs.push(`${nom} : ${s} introuvable`); continue; }
        await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
        await attendre(150);
        await el.click();
        await attendre(250);
      }
      if (delai) await attendre(delai);
      await attendre(400);
      await p.screenshot({ path: sortie(nom) });
    }
    await p.close();
    const o = await nav.newPage();
    await o.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await o.goto(fichier, { waitUntil: 'networkidle0' });
    await o.evaluate(() => document.fonts.ready);
    await o.screenshot({ path: sortie('1280') });
    await o.close();
    console.log(`${id} : ${erreurs.length ? 'ERREURS ' + erreurs.join(' ; ') : 'captures OK'} (${[...(GESTES[id] || []).map((g) => g[0]), 'repos', '1280'].join(', ')})`);
  }
} finally {
  await nav.close();
}
