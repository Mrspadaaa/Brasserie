// Édition exacte tolérante au CRLF. Chemins relatifs à la racine du dépôt.
const fs = require('fs');
const path = require('path');
const racine = path.resolve(__dirname, '../../../../..');
function edit(f, pairs) {
  const p = path.join(racine, f);
  let s = fs.readFileSync(p, 'utf8');
  const crlf = s.includes('\r\n');
  for (let [a, b] of pairs) {
    if (crlf) { a = a.split('\n').join('\r\n'); b = b.split('\n').join('\r\n'); }
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error(f + ' occurrences=' + n + ' : ' + a.slice(0, 90));
    s = s.replace(a, () => b);
  }
  fs.writeFileSync(p, s);
}
module.exports = { edit };

if (require.main === module) {
  edit('src/pages/RecipePage.tsx', [
    // PD-9 : l'app compte en EBC partout.
    ["— SRM {nombreFr(color.srm, 1)}.", "— {nombreFr(color.ebc, 1)} EBC."],
    // TL-17 : les parts du grain font 100 %.
    ["{grains.map((m, i) => {\n              const pct = totalGrist > 0 ? (m.weightKg / totalGrist) * 100 : 0;",
      "{grains.map((m, i) => {\n              const pct = partsGrain[i] ?? 0;"],
    ["{pct.toFixed(0)} %", "{pct} %"],
    // TL-24 : « 2 sachets ».
    ["`${recipe.yeast.qty.toLocaleString('fr-FR', { maximumFractionDigits: 20 })} ${recipe.yeast.unit ?? ''}`.trim()",
      "`${recipe.yeast.qty.toLocaleString('fr-FR', { maximumFractionDigits: 20 })} ${uniteAccordee(recipe.yeast.unit, recipe.yeast.qty)}`.trim()"],
    ["  const colorMissing = useMemo(", "  // TL-17 : parts entières qui font 100 % (plus forts restes), pas chaque part arrondie seule.\n  const partsGrain = useMemo(() => partsEntieres(grains.map((g) => g.weightKg)), [grains]);\n  const colorMissing = useMemo("],
  ]);
  console.log('ok');
}
