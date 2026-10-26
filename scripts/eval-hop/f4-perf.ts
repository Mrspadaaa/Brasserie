// Voie f4-cout-et-usage (D106) : le coût de Suggérer au premier affichage (sans les remplacements) et celui des remplacements au repos. NON déterministe (millisecondes).
//   npx vite-node scripts/eval-hop/f4-perf.ts -- --mode=rapide|complet|leviers-rapide|leviers-complet
// Un processus = un « premier passage » : à froid = le premier appel (JIT, caches vides) ; à chaud = les appels suivants, sur une recette dont le Nugget change de grammes
// (aucun cache de voie ne le rend déjà calculé : le pire cas pour les mémoires). Comme f2-perf.ts, dont les scénarios sont repris. La médiane de 5 processus se fait dans le shell.
//   mode `rapide`   : { assemblages: true, remplacements: false } (le premier affichage de Suggérer) ; `complet` : { assemblages: true } (HEAD de f2 : B1, borne 80)
//   mode `apres`    : rapide puis, sur la MÊME recette, l'appel complet (ce que fait l'écran au repos : les ajouts sont déjà mémorisés) ; chaque durée est dite à part.
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';

const arg = process.argv.slice(2).find((a) => a.startsWith('--mode='))?.slice(7) ?? 'rapide';
const CLE = (id: string) => `beermaverick-${id}`;
const rec = (code: string, nugget: number): Recipe => code === '21C'
  ? { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: nugget }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] }
  : { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: nugget }] };
const m = creerMoteur();
const t = <T>(f: () => T): number => { const a = performance.now(); f(); return Math.round((performance.now() - a) * 10) / 10; };
const moy = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10;
const dir21: Partial<Record<FamilyId, number>> = { citrus: 1 };
const dir16: Partial<Record<FamilyId, number>> = { floral: 1 };
const out: Record<string, number> = {};
const rapide = { assemblages: true, remplacements: false } as const;
const complet = { assemblages: true } as const;
const levRapide = { assemblages: false, leviersLevure: true, remplacements: false } as const;
const levComplet = { assemblages: false, leviersLevure: true } as const;

if (arg === 'rapide' || arg === 'complet') {
  const o = arg === 'rapide' ? rapide : complet;
  out[`suggerer-${arg}-froid`] = t(() => m.proposeVoies(rec('21C', 20), dir21, o));
  out[`suggerer-${arg}-chaud`] = moy([21, 22, 23].map((g) => t(() => m.proposeVoies(rec('21C', g), dir21, o))));
  out[`suggerer-${arg}-16D-floral-chaud`] = moy([45, 47, 48].map((g) => t(() => m.proposeVoies(rec('16D', g), dir16, o))));
} else if (arg === 'apres') {
  // L'écran : premier affichage (rapide), puis au repos l'appel complet sur la même recette.
  out['premier-affichage-froid'] = t(() => m.proposeVoies(rec('21C', 20), dir21, rapide));
  out['repos-complet-apres-rapide-froid'] = t(() => m.proposeVoies(rec('21C', 20), dir21, complet));
  const ch = [21, 22, 23].map((g) => [t(() => m.proposeVoies(rec('21C', g), dir21, rapide)), t(() => m.proposeVoies(rec('21C', g), dir21, complet))]);
  out['premier-affichage-chaud'] = moy(ch.map((x) => x[0]));
  out['repos-complet-apres-rapide-chaud'] = moy(ch.map((x) => x[1]));
} else if (arg === 'leviers-rapide' || arg === 'leviers-complet') {
  const o = arg === 'leviers-rapide' ? levRapide : levComplet;
  out[`${arg}-froid`] = t(() => m.proposeVoies(rec('21C', 20), dir21, o));
  out[`${arg}-chaud`] = moy([21, 22, 23].map((g) => t(() => m.proposeVoies(rec('21C', g), dir21, o))));
}
out['houblons'] = CATALOGUE.length;
process.stdout.write(JSON.stringify({ mode: arg, ...out }) + '\n');
