// e6 : les voies « ajouter » de Suggérer (stout 16D, Nugget 46 g à 60′, stock de fixtures) pour « plus floral » et « plus agrumes », dans l'ordre du moteur,
// afin de situer Aurum, Boadicea et Celeia avant et après D105 (B1, ordre de qualité du pool).
// Usage : depuis un arbre qui a src/ : RACINE=. npx vite-node sonde.ts   (copie de ce fichier). Fixtures seulement.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const racine = path.resolve(process.env.RACINE ?? '.');
const imp = (rel: string) => import(pathToFileURL(path.join(racine, 'src', 'domain', 'hopIndex', 'v4', rel)).href);
const data = await imp('data.ts');
const { creerMoteur } = await imp('moteur.ts');
const m = creerMoteur({ catalogue: data.CATALOGUE, stock: data.DONNEES_FIXTURE.stock });
const R16D = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const cherchees = ['Aurum', 'Boadicea', 'Celeia'];
for (const [nom, dir] of [['plus floral', { floral: 1 }], ['plus agrumes', { citrus: 1 }]] as const) {
  const rapide = process.env.RAPIDE !== '0';
  const res = m.proposeVoies(R16D, dir, { assemblages: true, ...(rapide ? { remplacements: false } : {}) });
  const ajouts = res.voies.filter((v: { type: string }) => v.type === 'ajouter');
  const noms = ajouts.map((v: { actions: Array<{ hopName: string }> }) => v.actions.map((a) => a.hopName).join('+'));
  console.log(`${nom} : ${ajouts.length} ajouts : ${noms.join(' | ')}`);
  for (const c of cherchees) console.log(`   ${c} : ${noms.some((n: string) => n.includes(c)) ? 'présent (rang ' + (noms.findIndex((n: string) => n.includes(c)) + 1) + ')' : 'absent'}`);
}
