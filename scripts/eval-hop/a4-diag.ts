// Voie a4 : pourquoi un houblon est où il est. Pour chaque houblon demandé, ses voies d'ajout à un moment : débordement, statut des familles, distance, clé de départage.
//   npx vite-node scripts/eval-hop/a4-diag.ts -- --viser=citrus --moment=dryActive --houblons=el-dorado,mosaic,citra [--style=22A]
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { MomentId, Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { R22A, chargerTable, houblonsDe, idCourt, listePrincipale, moteurPlein } from './f9-commun';

const arg = (n: string, d: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
async function main() {
  chargerTable();
  const m = await moteurPlein(true);
  const f = arg('viser', 'citrus') as FamilyId, mo = arg('moment', 'dryActive') as MomentId;
  const recette: Recipe = { ...R22A, styleCode: arg('style', '22A') };
  const res = m.proposeVoies(recette, { [f]: 1 }, { maxBuy: Number(arg('maxbuy', '400')), limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['wp', 'dryActive', 'b10'] });
  const liste = listePrincipale(res, mo);
  const h = houblonsDe(liste);
  for (const id of arg('houblons', 'el-dorado,mosaic').split(',')) {
    const v = liste.find((x) => idCourt(x.actions[0].hopKey) === id);
    if (!v) { console.log(`${id} : absent (${h.indexOf(id) + 1 || 'hors liste'})`); continue; }
    console.log(`${id} rang ${h.indexOf(id) + 1} | distance ${v.distance.total} | débordement ${v.overflowTotal} (rang ${v.overflowRang ?? 'idem'}) | côté ${v.sideTotal} | typicité ${v.typicite?.palier ?? 'inconnue'} | clé ${JSON.stringify(v.departage?.cle)}`);
    for (const o of v.styleOverflow) console.log(`    ${o.family} [${o.status}] +${o.crans} cran : ${o.why}`);
  }
  poserTypicite(null);
}
void main();
