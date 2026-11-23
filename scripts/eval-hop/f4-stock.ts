// Voie f4 (D106) : Nugget à 60′, stock d'abord, recette S1 : les remplaçants du stock et leur démotion (le témoin « aucun cryo en tête » de substitution.test.ts).
//   npx vite-node scripts/eval-hop/f4-stock.ts   (lance-le depuis prototypes/houblons-v4 : il lit le pack)
import { substitutes } from '../../src/domain/hopIndex/v4/substitution';
import { hopRef } from '../../src/domain/hopIndex/v4';
import { s1Recipe } from '../../prototypes/houblons-v4/src/pack/buildPack';
const r = substitutes('beermaverick-nugget', { moment: 'b60', grams: 46, recipe: s1Recipe(), stockFirst: true });
for (const s of r.remplacants.filter((x) => x.stock.etat === 'en stock').slice(0, 8)) process.stdout.write(`${String(s.rank).padStart(3)} ${s.name.padEnd(24)} usage ${String(hopRef(s.key)?.catalogue.purpose).padEnd(9)} score ${s.score} suffisant ${s.stock.suffisant} | ${s.amertumeDeconseillee ?? '-'}\n`);
