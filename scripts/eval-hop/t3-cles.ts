// Voie t3 : les clés de rang des premiers ajouts de la neipa saturée (pourquoi Warrior passe devant Cashmere) : distance, débordement, clé de départage (k3k1t), typicité.
//   npx vite-node scripts/eval-hop/t3-cles.ts -- [--stock]
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { STOCK } from '../../src/domain/hopIndex/v4';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { chargerTable } from './f9-commun';

const SATUREE: Recipe = { name: 'neipa v3 saturée', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
  additions: [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b15', grams: 78 }, { id: 'a2', hopKey: 'beermaverick-lotus', moment: 'dryActive', grams: 144 }] };
async function main() {
  chargerTable();
  const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: process.argv.includes('--stock') ? STOCK : [] });
  const res = m.proposeVoies(SATUREE, { citrus: 1 }, { assemblages: true, moments: ['dryActive'], typicite: true, intensite: false });
  for (const v of res.voies.filter((x) => x.type !== 'levure').slice(0, 14)) {
    console.log(v.rank, v.actions.map((a) => a.hopName).join('+').padEnd(26), 'conf', v.conflicts.length, 'dist', v.distance.total, 'ovf', v.overflowRang, 'cle', JSON.stringify(v.departage?.cle), 'typ', v.typicite ? `${v.typicite.palier}/${v.typicite.part}` : '-', 'frais', v.cleFrais ?? 0);
  }
  poserTypicite(null);
}
void main();
