// e6 : le classement de Substituer (Nugget à 60′, stout 16D, 46 g) tel que le moteur le rend, pour attribuer les écarts d'états à D102 J1, D106 ou c7.
// Usage : RACINE=<arbre> [PLEIN=1] npx vite-node sonde-subst.ts   (RACINE : un arbre qui a src/ ; PLEIN=1 : catalogue de base + les 188 ajouts de c7)
// Hors de l'app : ne lit que le moteur. Fixtures seulement.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const racine = path.resolve(process.env.RACINE ?? '.');
const imp = (rel: string) => import(pathToFileURL(path.join(racine, 'src', 'domain', 'hopIndex', 'v4', rel)).href);
const data = await imp('data.ts');
const { creerMoteur } = await imp('moteur.ts');

const catalogue = process.env.PLEIN && data.chargerCataloguePlein ? await data.chargerCataloguePlein() : data.CATALOGUE;
const m = creerMoteur({ catalogue, stock: data.DONNEES_FIXTURE.stock });
const R16D = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const { getStyleScale } = await imp('style/scale.ts');
const res = m.substitutes('beermaverick-nugget', { moment: 'b60', grams: 46, recipe: R16D, style: getStyleScale('16D'), stockFirst: true, limit: 12 });
console.log(`catalogue ${catalogue.length} · racine ${racine}`);
console.log(res.remplacants.slice(0, 12).map((c: { name: string; score: number; stock: { etat: string } }) => `${c.name} ${Math.round(c.score)}${c.stock.etat === 'à acheter' ? '' : ' (stock)'}`).join(' | '));
