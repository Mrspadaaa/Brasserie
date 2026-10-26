// Voie f5 : sonde, les premiers de la liste d'achats d'un style (stock vide) avec leurs clés, pour comprendre un style où les phares restent loin.
//   npx vite-node scripts/eval-hop/f5-sonde.ts -- 20C 16C 23A
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { quickAddKey } from '../../src/domain/hopIndex/v4/quickAdd';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';
import { PHARES_PAR_STYLE } from '../../tests/unit/hopIndexV4/pharesParStyle';

const plein = await chargerCataloguePlein();
const m = creerMoteur({ catalogue: plein, stock: [] });
for (const style of process.argv.slice(2).filter((a) => a !== '--')) {
  const sc = getStyleScale(style);
  const r = { name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60' as const, grams: 20 }] };
  const q = m.dans(() => m.quickAdds(r, sc, null, { catalogueLimit: 10000, aromatique: true }));
  console.log(`\n${style} ${sc.name} : statuts ${sc.order.map((f) => `${f}=${sc.families[f].status}`).join(' ')}`);
  const montre = (x: (typeof q.catalogue)[number], i: number) => console.log(`  ${i + 1} ${x.name} [${quickAddKey(x).join(',')}] ${x.fit} cités ${x.cited.length}${x.peuDeDonnees ? ' peu de données' : ''}`);
  q.catalogue.slice(0, 6).forEach(montre);
  for (const id of PHARES_PAR_STYLE[style] ?? []) { const i = q.catalogue.findIndex((x) => x.key === id); if (i >= 0) montre(q.catalogue[i], i); }
}
