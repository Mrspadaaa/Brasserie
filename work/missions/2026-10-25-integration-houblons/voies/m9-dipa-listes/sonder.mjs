// Sonde m9 (lecture seule) : l'écran Suggérer de l'app sur « neipa v3 », pour chaque combinaison de f9 et chaque visée, au dry hop
// actif ; imprime les rangées rendues à côté des dix premiers de listes.json (même moment), pour vérifier qu'ils concordent.
// Usage (depuis la copie propre) : node scripts/with_server.mjs --server "npm run dev -- --port 5291 --strictPort" --port 5291 --timeout 150 --env VITE_HOP_V4=on -- node <ce fichier> [moment]
import fs from 'node:fs';
import path from 'node:path';
import { COMBOS, ouvrirEcran } from './ecran.mjs';

const ICI = import.meta.dirname;
const moment = process.argv[2] ?? 'dryActive';
const NOM_MOMENT = { dryActive: 'dry hop actif', dryPost: 'dry hop après fermentation', wp: 'whirlpool' }[moment];
const L = JSON.parse(fs.readFileSync(path.join(ICI, '..', 'f9-intensite-typicite', 'listes.json'), 'utf8'));
for (const combo of Object.keys(COMBOS)) {
  for (const famille of ['citrus', 'tropical']) {
    const { browser, page } = await ouvrirEcran({ combo, famille, moment });
    const lu = await page.evaluate(() => {
      const e = document.querySelector('[data-ecran="suggerer"]');
      return {
        objectif: e.querySelector('[data-role="objectif"]')?.getAttribute('aria-label'),
        groupes: [...e.querySelectorAll('section[data-groupe]')].filter((g) => g.getAttribute('data-groupe') !== 'levure').map((g) => `${g.getAttribute('data-groupe')} « ${g.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim()} » : ${[...g.querySelectorAll('li[data-id]')].map((l) => l.querySelector('.pq-suggerer-nom')?.textContent).join(', ')}`),
      };
    });
    const q = L.combinaisons.find((c) => c.combinaison === combo).questions.find((x) => x.famille === famille && x.moment === NOM_MOMENT);
    console.log(`\n${combo} · ${famille} · ${NOM_MOMENT}\n  app    : ${lu.groupes.join(' / ')}\n  f9     : ${q.dix.map((d) => d.houblon).join(', ')}\n  carte  : ${lu.objectif}`);
    await page.screenshot({ path: path.join(process.env.TEMP ?? '.', `m9-sonde-${combo.replace(/\W+/g, '')}-${famille}.png`) });
    await browser.close();
  }
}
