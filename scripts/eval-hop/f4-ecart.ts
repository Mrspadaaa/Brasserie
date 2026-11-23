// Voie f4-cout-et-usage (D106) : le premier affichage de Suggérer (sans les remplacements) face à l'appel complet.
// Questions : (1) les remplacements arrivent-ils sans faire sauter la liste principale ? Les lignes ajouter/assemblage du premier affichage sont-elles celles de l'appel complet ?
// (2) l'appel sans remplacements rend-il, pour les leviers levure, exactement la même chose ?
//   npx vite-node scripts/eval-hop/f4-ecart.ts
import { createHash } from 'node:crypto';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';

const CLE = (id: string) => `beermaverick-${id}`;
const R21C: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 20 }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 46 }] };
const CAS: [string, Recipe, Partial<Record<FamilyId, number>>][] = [
  ['21C agrumes', R21C, { citrus: 1 }], ['21C floral + agrumes − résineux', R21C, { floral: 1, citrus: 1, resin: -1 }],
  ['16D floral', R16D, { floral: 1 }], ['16D moins résineux', R16D, { resin: -1 }], ['16D floral + tropical', R16D, { floral: 1, tropical: 1 }],
];
const m = creerMoteur();
const h = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const principales = (vs: { type: string; id: string }[]) => vs.filter((v) => v.type !== 'remplacer à IBU égal' && v.type !== 'remplacer à masse égale');
for (const [nom, r, dir] of CAS) {
  const rapide = m.proposeVoies(r, dir, { assemblages: true, remplacements: false });
  const complet = m.proposeVoies(r, dir, { assemblages: true });
  const a = principales(rapide.voies).map((v) => v.id), b = principales(complet.voies).map((v) => v.id);
  const manquent = b.filter((id) => !a.includes(id)), enPlus = a.filter((id) => !b.includes(id));
  const prefixe = a.slice(0, b.length).every((id, i) => id === b[i]) ;
  const remp = complet.voies.filter((v) => v.type === 'remplacer à IBU égal' || v.type === 'remplacer à masse égale').length;
  console.log(`${nom.padEnd(32)} lignes principales : premier affichage ${a.length}, complet ${b.length} ; remplacements ${remp} ; dans le complet seulement ${manquent.length}, au premier affichage seulement ${enPlus.length} ; même ordre sur les communes : ${a.filter((x) => b.includes(x)).join() === b.filter((x) => a.includes(x)).join()}${prefixe ? ' (préfixe)' : ''}`);
  // Les effets d'une voie commune sont ceux de l'appel complet, à l'octet près (les remplacements ne changent aucun calcul des autres voies).
  const parId = new Map(complet.voies.map((v) => [v.id, v]));
  const memeEffet = rapide.voies.filter((v) => parId.has(v.id)).every((v) => h({ e: v.effect, d: v.distance, i: v.ibu, o: v.overflowTotal }) === h({ e: parId.get(v.id)!.effect, d: parId.get(v.id)!.distance, i: parId.get(v.id)!.ibu, o: parId.get(v.id)!.overflowTotal }));
  console.log(`${''.padEnd(32)} effets des voies communes identiques : ${memeEffet}`);
  const levR = m.proposeVoies(r, dir, { assemblages: false, leviersLevure: true, remplacements: false, maxBuy: 0, moments: ['dryActive'] }), levC = m.proposeVoies(r, dir, { assemblages: false, leviersLevure: true });
  const lev = (res: typeof levR) => res.voies.filter((v) => v.type === 'levure');
  // `rank` et `tieWith` (rang partagé, voies à égalité de clés) dépendent des autres voies gardées, remplacements compris ; l'écran ne les lit pas (aucune lecture dans src/ui/hopIndex).
  const sansRang = (vs: ReturnType<typeof lev>) => vs.map(({ rank: _r, tieWith: _t, ...reste }) => reste);
  console.log(`${''.padEnd(32)} leviers levure : ${lev(levR).length} voies, empreinte ${h(lev(levR))} ; complet ${h(lev(levC))} ; identiques : ${h(lev(levR)) === h(lev(levC))} ; sans rank ni tieWith : ${h(sansRang(lev(levR))) === h(sansRang(lev(levC)))}`);
}
