/**
 * Vérifie que chaque collection synchronisée par l'application est bien
 * couverte par les règles Firestore.
 *
 * Pourquoi ce script existe : `equipment` avait été oublié dans les règles.
 * Résultat, la lecture de cette seule collection tombait dans le refus par
 * défaut — et comme la migration écrit tout en un lot atomique, c'est la
 * migration ENTIÈRE qui échouait. L'application affichait une base vide sans
 * autre explication qu'un « Missing or insufficient permissions » en console.
 */
import { readFileSync } from 'node:fs';

const repo = readFileSync('functions/src/dataSchema.ts', 'utf8');
const start = repo.indexOf('BUSINESS_COLLECTIONS');
const block = repo.slice(start, repo.indexOf('] as const', start));
const collections = [...block.matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]);

const rules = readFileSync('firestore.rules', 'utf8');

// Une collection est couverte soit par la liste `collectionsMetier()`, soit par
// un bloc `match` explicite (les registres en écriture seule).
const missing = collections.filter(
  (c) => !new RegExp(`'${c}'`).test(rules) && !rules.includes(`match /${c}/`)
);

if (collections.length === 0) {
  console.error('⛔ Impossible de lire ALL_COLLECTIONS. Le script est à réparer.');
  process.exit(1);
}

if (missing.length > 0) {
  console.error(`⛔ ${missing.length} collection(s) absente(s) des règles Firestore :`);
  missing.forEach((c) => console.error(`     ${c}`));
  console.error('\n   Ajoute-les à collectionsMetier() dans firestore.rules.');
  process.exit(1);
}

console.log(`✅ Les ${collections.length} collections sont couvertes par les règles Firestore.`);
