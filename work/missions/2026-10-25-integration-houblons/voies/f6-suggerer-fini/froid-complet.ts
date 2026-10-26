// Voie f6 : le coût du premier affichage de Suggérer APRÈS la préchauffe des apports (D108), avec et sans les remplacements « à IBU égal ».
//   npx vite-node work/missions/2026-10-25-integration-houblons/voies/f6-suggerer-fini/froid-complet.ts -- --mode=rapide|complet|complet-sans-chauffe|rapide-sans-chauffe
// Un processus = un premier appel (le froid se paie une fois par processus). Les apports sont chauffés comme prechauffe.ts : proposeVoies sans remplacements, une autre visée.
import { creerMoteur } from '../../../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../../../src/domain/hopIndex/v4/recipe';

const mode = process.argv.slice(2).find((a) => a.startsWith('--mode='))?.slice(7) ?? 'rapide';
const R: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const m = creerMoteur();
const t = <T>(f: () => T): number => { const a = performance.now(); f(); return Math.round((performance.now() - a) * 10) / 10; };
const out: Record<string, number | string> = { mode };
if (!mode.endsWith('sans-chauffe')) out['chauffe-ms'] = t(() => m.proposeVoies({ ...R, additions: [R.additions[0]] }, { floral: 1 }, { assemblages: false, remplacements: false }));
const avecRemplacements = mode.startsWith('complet');
out['premier-appel-ms'] = t(() => m.proposeVoies(R, { citrus: 1, resin: -1 }, { assemblages: true, remplacements: avecRemplacements }));
process.stdout.write(JSON.stringify(out) + '\n');
