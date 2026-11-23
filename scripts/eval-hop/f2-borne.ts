// Sonde de la voie f2 (D105) : pour la borne POOL_BORNE actuelle, quels phares (hors exclusion D90) manquent aux listes principales, et combien coûte un appel à chaud ?
//   npx vite-node scripts/eval-hop/f2-borne.ts
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { FAMILIES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import { citations, marquee } from '../../src/domain/hopIndex/v4/hops';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';
import { POOL_BORNE } from '../../src/domain/hopIndex/v4/voies';

const CLE = (id: string) => `beermaverick-${id}`;
const R21C: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 20 }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 46 }] };
const VISEES: [string, Recipe, Partial<Record<FamilyId, number>>][] = [['21C agrumes', R21C, { citrus: 1 }], ['16D floral', R16D, { floral: 1 }], ['16D moins résineux', R16D, { resin: -1 }]];
const PHARES = ['citra', 'nelson-sauvin', 'galaxy', 'mosaic', 'motueka', 'idaho-7', 'strata', 'simcoe', 'cascade', 'hallertau-blanc'];
const m = creerMoteur();
const OUVERT = { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
console.log(`POOL_BORNE ${POOL_BORNE}`);
for (const [nom, r, dir] of VISEES) {
  const style = getStyleScale(r.styleCode);
  const plus = FAMILIES.filter((f) => (dir[f] ?? 0) > 0), moins = FAMILIES.filter((f) => (dir[f] ?? 0) < 0);
  const exclu = (id: string) => moins.some((f) => marquee(id, f)) || FAMILIES.some((f) => style.families[f].status === 'indésirable' && marquee(id, f));
  const cite = (id: string) => (plus.length ? plus.some((f) => citations(id)[f].status === 'cité') : true);
  const res = m.proposeVoies(r, dir, OUVERT);
  const vus = new Set(res.voies.flatMap((v) => v.actions.map((a) => a.hopKey.replace(/:cryo$/, ''))));
  const attendus = PHARES.map(CLE).filter((id) => CATALOGUE.some((h) => h.id === id) && !exclu(id) && cite(id));
  console.log(nom.padEnd(20), `phares attendus ${attendus.length}, manquants : ${attendus.filter((id) => !vus.has(id)).map((id) => id.replace('beermaverick-', '')).join(', ') || 'aucun'}`);
}
const t = (r: (g: number) => Recipe, dir: Partial<Record<FamilyId, number>>) => { const xs = [21, 22, 23].map((g) => { const a = performance.now(); m.proposeVoies(r(g), dir, { assemblages: true }); return performance.now() - a; }); return (xs.reduce((s, x) => s + x, 0) / 3).toFixed(0); };
m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true });
console.log('chaud 21C agrumes', t((g) => ({ ...R21C, additions: [{ ...R21C.additions[0], grams: g }, R21C.additions[1]] }), { citrus: 1 }), 'ms ; 16D floral', t((g) => ({ ...R16D, additions: [{ ...R16D.additions[0], grams: g + 24 }] }), { floral: 1 }), 'ms');
