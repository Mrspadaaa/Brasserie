// Voie h1 : sonde du test « style qui attend l'herbacé » : une pils (3A, herbacé attendu, bande 0–68), un dry hop imposé à forte dose : l'herbacé sort-il de la bande ?
//   npx vite-node scripts/eval-hop/h1-3a.ts
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { chargerTable } from './f9-commun';
import { SATUREE } from './h1-commun';

chargerTable();
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const pils: Recipe = { ...SATUREE, styleCode: '3A', og: 1.048, name: 'pils' };
for (const dose of [6, 12, 30]) {
  const r = m.proposeVoies(pils, { citrus: 2 }, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'], dryHop: { doseGL: dose } } as never);
  const vs = r.dryHop!.actif;
  console.log('--- dose', dose, 'g/L :', vs.length, 'voies ; avant herbal', r.before.profile.herbal.central, 'green', r.before.profile.green.central, '; bandes', JSON.stringify([r.style.families.herbal.band, r.style.families.green.band]));
  for (const v of vs.slice(0, 40)) {
    const o = v.styleOverflow.filter((x) => x.family === 'herbal' || x.family === 'green');
    if (o.length) console.log(v.actions[0].hopKey.replace('beermaverick-', ''), 'herbal', v.effect.herbal.central, 'green', v.effect.green.central, JSON.stringify(o.map((x) => `${x.family}:${x.status}:${x.crans}${x.defaut ? 'D' : ''}`)));
  }
}
