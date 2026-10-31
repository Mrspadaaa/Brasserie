// Voie d60-diagnostic : Substituer à 60′ (lecture 2). MESURE seulement, au commit ae7c7a8d. Rien dans src/.
// Lancement (depuis la copie propre) : node_modules/.bin/vite-node dist/d60/d60-substituer.ts -- --sortie=<dossier>
// Question : à 60′, la liste de remplaçants que l'écran montre (cinq du catalogue + du stock) est-elle faite de remplaçants dont l'AMERTUME est connue ?
// Les chiffres viennent de `substitutes` (le moteur de l'app), avec les options de l'adaptateur (stockFirst, limit 8) ; la mise en forme de l'écran
// (substituer/donnees.ts composer) est refaite à l'identique pour le décompte montré.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-63130965';
const args = process.argv.slice(2);
const SORTIE = args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? '.';
const { chargerCataloguePlein, STOCK } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/data.ts`);
const { creerMoteur } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/moteur.ts`);
const { poserTypicite } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/typicite.ts`);
const { getStyleScale } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/style/scale.ts`);
const { PHARES_PAR_STYLE } = await import(/* @vite-ignore */ `${COPIE}/tests/unit/hopIndexV4/pharesParStyle.ts`);
poserTypicite(JSON.parse(readFileSync(join(COPIE, 'src/data/hopV4/typicite-styles.json'), 'utf8')));
const plein = await chargerCataloguePlein();
const MS = creerMoteur({ catalogue: plein, stock: STOCK });
const M0 = creerMoteur({ catalogue: plein, stock: [] });

type R = any;
const recette = (style: string, key: string, moment: string, g = 30): R => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: key, moment, grams: g }] });

/** Ce que composer() de substituer/donnees.ts montre : cinq hors stock au plus, trois du stock (plus le premier qui suffit). */
function montres(res: any) {
  const tous = res.remplacants;
  const catalogue = tous.filter((s: any) => s.stock.etat !== 'en stock').slice(0, 5);
  const enStock = tous.filter((s: any) => s.stock.etat === 'en stock');
  let stock = enStock.slice(0, 3);
  const suffit = enStock.find((s: any) => s.stock.suffisant !== false);
  if (suffit && !stock.includes(suffit)) stock = [...stock.slice(0, 2), suffit];
  return [...catalogue, ...stock];
}
const sansAmertume = (s: any) => s.composantes.amertume === null;

function mesure(m: any, r: R, key: string, moment: string, phares: string[] = []) {
  const a = r.additions[0];
  const opts = { moment, grams: a.grams, recipe: r, style: getStyleScale(r.styleCode), stockFirst: true };
  const res = m.substitutes(key, { ...opts, limit: 8 });
  const m8 = montres(res);
  // Tous les candidats, pour situer les phares et pour l'ordre « amertume connue d'abord » (diagnostic : rien n'est appliqué).
  const tout = m.substitutes(key, { ...opts, limit: 700 });
  const rang = (id: string) => { const i = tout.remplacants.findIndex((s: any) => s.key === id || s.key === `beermaverick-${id}`); return i < 0 ? null : i + 1; };
  const connus = tout.remplacants.filter((s: any) => !sansAmertume(s));
  const alt = connus.slice(0, 5).map((s: any) => `${s.name} ${s.score}`);
  const aucuneAmertume = tout.remplacants.filter(sansAmertume).length;
  const scoresSurUneVariable = m8.filter((s: any) => s.couverture.amertume.length === 0).length;
  return {
    original: key.replace('beermaverick-', ''), moment, contexte: res.contexte, candidats: tout.candidats, montres: m8.length,
    montresAmertumeInconnue: m8.filter(sansAmertume).length, montresSansAucuneVariableDAmertume: scoresSurUneVariable,
    candidatsAmertumeInconnue: aucuneAmertume, tete: m8.slice(0, 5).map((s: any) => `${s.name} ${s.score}${sansAmertume(s) ? ' [amertume inconnue]' : ''}`),
    teteSiAmertumeConnueDAbord: alt, rangDesPhares: Object.fromEntries(phares.map((p) => [p, rang(p)])),
    top30AmertumeInconnue: tout.remplacants.slice(0, 30).filter(sansAmertume).length,
  };
}

const sortie: any = { commit: 'ae7c7a8d', populaires: [], styles: {}, aAro: [] };
// 1. Les amérisants et houblons courants posés à 60′, 20 houblons (une recette 22A / 16D / 18B de fixture).
const POP: [string, string][] = [['nugget', '16D'], ['magnum-us', '18B'], ['warrior', '18B'], ['columbus', '22A'], ['chinook', '18B'], ['perle-us', '3B'], ['saaz-cz', '3B'], ['east-kent-goldings', '11C'],
  ['target', '11C'], ['fuggle', '11C'], ['cascade', '18B'], ['centennial', '18B'], ['citra', '21C'], ['simcoe', '21C'], ['mosaic', '21C'], ['lotus', '22A'], ['galaxy', '21C'], ['motueka', '21C'], ['nelson-sauvin', '21C'], ['hallertau-blanc', '21C']];
const PHARES_NUGGET = ['columbus', 'magnum-us', 'warrior', 'chinook', 'zeus', 'cluster'];
for (const [id, style] of POP) {
  const key = `beermaverick-${id}`;
  try {
    const x60 = mesure(M0, recette(style, key, 'b60'), key, 'b60', id === 'nugget' ? PHARES_NUGGET : []);
    const x10 = mesure(M0, recette(style, key, 'b10'), key, 'b10');
    sortie.populaires.push({ original: id, style, a60: x60, a10: { montresAmertumeInconnue: x10.montresAmertumeInconnue, tete: x10.tete } });
    process.stdout.write(`${id}@60 : ${x60.montres} montrés, amertume inconnue ${x60.montresAmertumeInconnue}/${x60.montres} | ${x60.tete.slice(0, 3).join('; ')} | si connue d'abord : ${x60.teteSiAmertumeConnueDAbord.slice(0, 3).join('; ')}\n`);
  } catch (e) { process.stdout.write(`${id} : ${(e as Error).message}\n`); }
}
// 2. 31 styles, Nugget à 60′ (la recette de a4-general.ts) : la liste montrée.
for (const style of Object.keys(PHARES_PAR_STYLE)) {
  const r = recette(style, 'beermaverick-nugget', 'b60', 20);
  const x = mesure(M0, r, 'beermaverick-nugget', 'b60', PHARES_NUGGET);
  sortie.styles[style] = { montres: x.montres, montresAmertumeInconnue: x.montresAmertumeInconnue, tete: x.tete, siConnueDAbord: x.teteSiAmertumeConnueDAbord, phares: x.rangDesPhares };
}
const vals = Object.values(sortie.styles) as any[];
sortie.syntheseStyles = { styles: vals.length, avecUnMontreAmertumeInconnue: vals.filter((v) => v.montresAmertumeInconnue > 0).length, avecTousLesMontresAmertumeInconnue: vals.filter((v) => v.montresAmertumeInconnue === v.montres).length, montresMin: Math.min(...vals.map((v) => v.montres)) };
// 3. Stock de la fixture : Nugget à 60′ avec stock (le stock passe-t-il avant un meilleur candidat ?).
sortie.avecStockNuggetStout = mesure(MS, recette('16D', 'beermaverick-nugget', 'b60', 46), 'beermaverick-nugget', 'b60', PHARES_NUGGET);
// 4. Les houblons des quatre recettes de d60-mesure (mêmes ajouts), chacun à son moment, sans stock puis avec le stock de la fixture.
const RECETTES: [string, R][] = [
  ['neipa v3 (22A)', { name: 'neipa v3', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7, additions: [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b30', grams: 84 }] }],
  ['stout S1 (16D)', { name: 'Stout', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] }],
  ['21C hazy', { name: 'Hazy', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] }],
  ['pale ale 18B', { name: 'Pale ale', styleCode: '18B', volumeL: 20, og: 1.052, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-magnum-us', moment: 'b60', grams: 14 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'b10', grams: 20 }, { id: 'a3', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 40 }] }],
];
sortie.recettes = {};
for (const [rn, r] of RECETTES) {
  sortie.recettes[rn] = {};
  for (const [stk, m] of [['sans stock', M0], ['stock fixture', MS]] as const) {
    sortie.recettes[rn][stk] = r.additions.map((a: any) => {
      const x = mesure(m, { ...r, additions: [a] }, a.hopKey, a.moment);
      return { ajout: `${a.hopKey.replace('beermaverick-', '')} @${a.moment}`, montres: x.montres, montresAmertumeInconnue: x.montresAmertumeInconnue, tete: x.tete };
    });
  }
}
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'd60-substituer.json'), `${JSON.stringify(sortie, null, 1)}\n`);
process.stdout.write(`synthèse styles : ${JSON.stringify(sortie.syntheseStyles)}\n`);
poserTypicite(null);
