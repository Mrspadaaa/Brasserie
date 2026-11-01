// Voie h1 : sonde. Le profil de la neipa saturée (avant) et la bande de l'herbacé / du végétal en 22A ; l'effet d'un dry hop actif de Cascade à 4, 8, 16 g/L ajoutés à la saturée.
//   npx vite-node scripts/eval-hop/h1-sonde.ts
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES } from '../../src/domain/hopIndex/v4/families';
import { SATUREE } from './h1-commun';
import { additionEffect } from '../../src/domain/hopIndex/v4/voies';
import { chargerTable } from './f9-commun';

async function main() {
  chargerTable();
  const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: [] });
  const res = m.proposeVoies(SATUREE, { citrus: 1 }, { moments: ['dryActive'], assemblages: false });
  console.log('avant (V5.5)    :', FAMILIES.map((f) => `${f}=${res.before.profile[f].central ?? '?'}`).join(' '));
  console.log('bandes 22A      :', FAMILIES.map((f) => `${f}[${res.style.families[f].band?.join('–') ?? '?'}]${res.style.families[f].status[0]}`).join(' '));
  console.log('cran herbal/green:', res.style.families.herbal.cran, res.style.families.green.cran);
  console.log('\nV5.5 (celui de Suggérer) : apport d\'un ajout seul, dry hop actif, selon la dose (g/L) : agrumes / herbacé / végétal');
  for (const h of ['beermaverick-cascade', 'beermaverick-citra', 'beermaverick-lotus', 'beermaverick-east-kent-goldings']) {
    const l = [1, 2, 4, 8, 16].map((d) => {
      const e = additionEffect({ id: 'x', hopKey: h, moment: 'dryActive', grams: d * SATUREE.volumeL }, SATUREE);
      return e ? `${d}: ${e.citrus.central ?? '?'}/${e.herbal.central ?? '?'}/${e.green.central ?? '?'}` : `${d}: –`;
    });
    console.log(h.replace('beermaverick-', '').padEnd(20), l.join('  '));
  }
}
void main();
