// Voie s1-stock : fixtures réduites de la facture 372765 (ni nom ni adresse du brasseur ; le fournisseur est un commerce).
// Lancement depuis la racine : node work/missions/2026-10-31-ecran-depense/voies/s1-stock/fabriquer-fixtures.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const d1 = 'work/missions/2026-10-31-ecran-depense/diagnostic/d1/';
const out = 'tests/unit/depense/stock/fixtures/';
mkdirSync(out, { recursive: true });
const verite = JSON.parse(readFileSync(d1 + 'verite-facture-372765.json', 'utf8'));
const lignes = verite.lignes.map(l => ({
  n: l.n, code: l.code, libelle: l.libelle, quantite: l.quantite, unite: l.unite, kind: l.attendu.kind,
  nomPropre: l.attendu.nomPropre, categorieStock: l.attendu.categorieStock ?? null, alphaPct: l.attendu.alphaPct ?? null
}));
writeFileSync(out + 'lignes-372765.json', JSON.stringify({ _source: 'extrait de diagnostic/d1/verite-facture-372765.json (voie s1-stock)', fournisseur: verite.fournisseur.nom, lignes }, null, 2) + '\n');
// Stock SIMULÉ (noms d'après src/design/StockPreview.tsx, comme diagnostic/d1/mesures.ts) : ce n'est pas le stock du brasseur.
const stock = (name, unit, category) => ({ id: name, ref: 'MP-' + name, name, unit, category, currentStock: 1, minStock: 0, reorder: false });
const articles = [
  stock('Maris Otter', 'kg', 'Malt'), stock('Pilsner Malz', 'kg', 'Malt'), stock('Caramünch Typ 2', 'kg', 'Malt'), stock('Röstgerste', 'kg', 'Malt'),
  stock('Weizenmalz hell', 'kg', 'Malt'), stock('Haferflocken', 'kg', 'Malt'), stock('Gerstenflocken', 'kg', 'Malt'),
  stock('Target', 'g', 'Houblon'), stock('Galaxy', 'g', 'Houblon'), stock('Nelson Sauvin 9.6%', 'g', 'Houblon'), stock('Motueka 8.1%', 'g', 'Houblon'), stock('Sabro 13.4%', 'g', 'Houblon'),
  stock('SafAle US-05', 'sachet', 'Levure'), stock('LALLEMAND Windsor', 'sachet', 'Levure'), stock('Verdant IPA', 'sachet', 'Levure'), stock('Safale BE-256', 'sachet', 'Levure')
];
writeFileSync(out + 'stock-simule.json', JSON.stringify({ _avertissement: 'STOCK SIMULÉ (noms d’après StockPreview.tsx), pas le stock réel du brasseur', articles }, null, 2) + '\n');
writeFileSync(out + 'lecture-372765.json', readFileSync(d1 + 'lecture-simulee-372765.reconciliee.json', 'utf8'));
console.log(lignes.length + ' lignes, ' + articles.length + ' articles');
