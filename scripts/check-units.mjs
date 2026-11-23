/**
 * Interdit les unités codées en dur dans l'affichage.
 *
 * Pourquoi ce script existe : le houblon s'affichait « 20000g » parce que
 * NEUF endroits multipliaient `currentStock` par 1000 en supposant des kilos,
 * alors que le houblon est stocké en grammes. Chaque écran refaisait sa propre
 * conversion, et chacun se trompait à sa façon.
 *
 * Toute quantité doit passer par `Units.format()` ou `Units.convert()`, qui
 * lisent l'unité réelle de l'article au lieu de la supposer.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const INTERDITS = [
  {
    // Conversion kg↔g écrite à la main sur une quantité de STOCK.
    // Restreinte aux identifiants de quantité : sans ça la règle attrapait
    // aussi les conversions de temps (millisecondes → secondes).
    re: /(currentStock|weightKg|weightG|addedQty|minStock|maxStock|finalQty)\s*[*/]\s*1000/,
    quoi: 'conversion d’unité écrite à la main',
    fix: 'utilise Units.convert(qty, from, to)'
  },
  {
    // Unité littérale accolée à une quantité dans du JSX.
    re: /\{[^}]*(currentStock|weightKg|weightG|addedQty|finalQty)[^}]*\}\s*(kg|g|L|mL)\b/,
    quoi: 'unité écrite en dur à côté d’une quantité',
    fix: 'utilise Units.format(qty, item.unit)'
  }
];

/** Ces fichiers ont le droit : ce sont eux qui DÉFINISSENT les conversions. */
const EXEMPTS = ['services/units.ts', 'services/brewingMath.ts', 'design/'];

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (/\.tsx?$/.test(e)) out.push(f);
  }
  return out;
}

const problemes = [];

for (const file of walk('src')) {
  const rel = file.replace(/\\/g, '/');
  if (EXEMPTS.some((x) => rel.includes(x))) continue;

  const lignes = readFileSync(file, 'utf8').split('\n');
  lignes.forEach((ligne, i) => {
    if (ligne.trim().startsWith('//') || ligne.trim().startsWith('*')) return;
    for (const { re, quoi, fix } of INTERDITS) {
      if (re.test(ligne)) {
        problemes.push({ fichier: rel, ligne: i + 1, quoi, fix, extrait: ligne.trim().slice(0, 90) });
      }
    }
  });
}

if (problemes.length > 0) {
  console.error(`⛔ ${problemes.length} unité(s) codée(s) en dur :\n`);
  problemes.forEach((p) => {
    console.error(`   ${p.fichier}:${p.ligne}`);
    console.error(`     ${p.quoi} — ${p.fix}`);
    console.error(`     ${p.extrait}\n`);
  });
  process.exit(1);
}

console.log('✅ Aucune unité codée en dur : toutes les quantités passent par Units.');
