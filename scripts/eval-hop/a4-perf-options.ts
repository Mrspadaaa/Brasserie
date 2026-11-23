// Voie a4 (L20) : attribue le coût de la liste par défaut aux deux options de a4 (21C « plus d'agrumes », catalogue du moteur, sans table de typicité : comme f2-perf.ts).
//   npx vite-node scripts/eval-hop/a4-perf-options.ts
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';

const CLE = (id: string) => `beermaverick-${id}`;
const rec = (nugget: number): Recipe => ({ name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: nugget }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] });
const m = creerMoteur();
const t = <T>(f: () => T): number => { const a = performance.now(); f(); return performance.now() - a; };
const VARIANTES: [string, object][] = [['défaut', {}], ['selection documentation', { selection: 'documentation' }], ['debordementNeutre true', { debordementNeutre: true }], ['les deux d\'avant', { selection: 'documentation', debordementNeutre: true }]];
m.proposeVoies(rec(20), { citrus: 1 }, { assemblages: true }); // chauffe
for (let tour = 0; tour < 2; tour++) {
  const out: string[] = [];
  for (const [nom, o] of VARIANTES) {
    const ms = [21, 22, 23, 24, 25].map((g) => t(() => m.proposeVoies(rec(g + tour * 10), { citrus: 1 }, { assemblages: true, ...o })));
    out.push(`${nom} ${Math.round(ms.reduce((a, b) => a + b, 0) / ms.length * 10) / 10} ms`);
  }
  console.log(out.join(' | '));
}
