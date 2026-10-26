// Voie f2-affinage-a-b1-c-d (L20) : le coût de proposeVoies et de substitutes, à froid et à chaud. NON déterministe (millisecondes) : jamais dans une empreinte.
//   npx vite-node scripts/eval-hop/f2-perf.ts -- --etat=<nom>     un processus = un « premier passage » : à froid = le premier appel de ce processus (JIT, caches vides) ;
//   à chaud = les appels suivants, sur une recette dont le Nugget change de grammes (aucun cache de voie ne le rend déjà calculé).
//   Le lancement répété (5 processus) et la médiane se font dans le shell : voir RESULTAT.md.
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';

const CLE = (id: string) => `beermaverick-${id}`;
const rec = (code: string, nugget: number): Recipe => code === '21C'
  ? { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: nugget }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] }
  : { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: nugget }] };
const m = creerMoteur();
const t = <T>(f: () => T): number => { const a = performance.now(); f(); return Math.round((performance.now() - a) * 10) / 10; };
const dir21: Partial<Record<FamilyId, number>> = { citrus: 1 };
const dir16: Partial<Record<FamilyId, number>> = { floral: 1 };
const out: Record<string, number> = {};
// Ce que fait l'app : la liste par défaut (adaptateur.ts, assemblages) ; puis les groupes g2b (palier 60′ et dry hop).
out['suggerer-defaut-froid'] = t(() => m.proposeVoies(rec('21C', 20), dir21, { assemblages: true }));
out['suggerer-defaut-chaud'] = Math.round([21, 22, 23].map((g) => t(() => m.proposeVoies(rec('21C', g), dir21, { assemblages: true }))).reduce((a, b) => a + b, 0) / 3 * 10) / 10;
out['suggerer-defaut-16D-floral-chaud'] = Math.round([45, 47, 48].map((g) => t(() => m.proposeVoies(rec('16D', g), dir16, { assemblages: true }))).reduce((a, b) => a + b, 0) / 3 * 10) / 10;
out['suggerer-g2b-chaud'] = Math.round([21, 22, 23].map((g) => t(() => m.proposeVoies(rec('21C', g), dir21, { assemblages: true, palier60: { ibu: 10 }, dryHop: true }))).reduce((a, b) => a + b, 0) / 3 * 10) / 10;
out['substituer-60-chaud'] = Math.round([21, 22, 23].map((g) => t(() => m.substitutes(CLE('nugget'), { moment: 'b60', grams: g, recipe: rec('21C', 20) }))).reduce((a, b) => a + b, 0) / 3 * 10) / 10;
out['houblons'] = CATALOGUE.length;
process.stdout.write(JSON.stringify(out) + '\n');
