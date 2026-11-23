// Voie k1-substituer-60 (D196) : dump du classement complet de Substituer pour chaque variété du catalogue plein posée comme original, à quatre moments d'amertume.
//   npx vite-node scripts/eval-hop/k1-ordre.ts -- --sortie=<fichier.json>   (lancé sur HEAD puis sur l'arbre modifié ; k1-compare.mjs compare les deux)
// Par original : [clé, score, amertume inconnue ?, palier] dans l'ordre rendu. Sans style ni stock (le cas pur de la règle).
import { writeFileSync } from 'node:fs';
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';

const sortie = process.argv.slice(2).find((a) => a.startsWith('--sortie='))?.slice(9);
if (!sortie) throw new Error('--sortie=<fichier> manque');
const plein = await chargerCataloguePlein();
const m = creerMoteur({ catalogue: plein, stock: [] });
const ids = plein.map((h) => h.id).sort();
const out: Record<string, [string, number, number, string][]> = {};
for (const moment of ['b60', 'b30', 'fwh', 'b15'] as const) {
  for (const id of ids) {
    const r = m.substitutes(id, { moment, grams: 20, stockFirst: true });
    out[`${id}@${moment}`] = r.remplacants.map((s) => [s.key, s.score, s.composantes.amertume === null ? 1 : 0, s.palier]);
  }
}
writeFileSync(sortie, JSON.stringify(out));
console.log(`${Object.keys(out).length} classements écrits`);
