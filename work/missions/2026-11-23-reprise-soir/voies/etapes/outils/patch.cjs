// Remplacements ponctuels de la voie etapes : node patch.cjs <fichier> <remplacements.cjs> — chaque ancre doit exister une seule fois.
const fs = require('fs');
const [, , fichier, liste] = process.argv;
let t = fs.readFileSync(fichier, 'utf8');
const eol = t.includes('\r\n') ? '\r\n' : '\n';
const E = (x) => x.replace(/\r?\n/g, eol);
for (const [ancre, neuf] of require(require('path').resolve(liste))) {
  const a = E(ancre);
  const n = t.split(a).length - 1;
  if (n !== 1) throw new Error(`ancre trouvée ${n} fois : ${ancre.slice(0, 80)}`);
  t = t.replace(a, () => E(neuf));
}
fs.writeFileSync(fichier, t);
console.log('ok', fichier);
