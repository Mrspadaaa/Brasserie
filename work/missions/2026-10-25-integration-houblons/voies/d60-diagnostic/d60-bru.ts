// Voie d60-diagnostic : pourquoi « Bru 100 » en tête des remplaçants de Nugget à 60′ ? Les composantes et la couverture des cinq montrés. MESURE, ae7c7a8d.
// Lancement (depuis la copie propre) : node_modules/.bin/vite-node dist/d60/d60-bru.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-63130965';
const { chargerCataloguePlein } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/data.ts`);
const { creerMoteur } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/moteur.ts`);
const { poserTypicite } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/typicite.ts`);
const { getStyleScale } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/style/scale.ts`);
poserTypicite(JSON.parse(readFileSync(join(COPIE, 'src/data/hopV4/typicite-styles.json'), 'utf8')));
const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: [] });
const r: any = { name: 'S1', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const res = m.substitutes('beermaverick-nugget', { moment: 'b60', grams: 46, recipe: r, style: getStyleScale('16D'), stockFirst: true, limit: 700 });
const ligne = (s: any) => `${String(s.rank).padStart(3)} ${s.name.padEnd(22)} score ${String(s.score).padStart(3)} palier ${s.palier.padEnd(11)} comp ${JSON.stringify(s.composantes)} couvAmertume ${JSON.stringify(s.couverture.amertume)} huiles ${s.couverture.huiles.length} arôme ${s.couverture.arome} fiabilité ${s.couverture.fiabilite} reculé ${s.amertumeDeconseillee ? 'oui' : 'non'}`;
console.log(`candidats ${res.candidats}, original Nugget @60′ (poids ${JSON.stringify(res.poids)})`);
for (const s of res.remplacants.slice(0, 8)) console.log(ligne(s));
console.log('--- les substituts classiques de Nugget (CTZ) dans la liste complète');
for (const id of ['columbus', 'warrior', 'magnum-us', 'chinook', 'zeus', 'tomahawk']) { const s = res.remplacants.find((x: any) => x.key === `beermaverick-${id}`); if (s) console.log(ligne(s)); }
const inconnus = res.remplacants.filter((s: any) => s.composantes.amertume === null);
console.log(`amertume inconnue : ${inconnus.length} candidats sur ${res.candidats}; parmi eux score >= 80 : ${inconnus.filter((s: any) => s.score >= 80).length}, score = 100 : ${inconnus.filter((s: any) => s.score === 100).length}`);
console.log(`dans les 8 premiers : ${res.remplacants.slice(0, 8).filter((s: any) => s.composantes.amertume === null).length} ; dans les 30 premiers : ${res.remplacants.slice(0, 30).filter((s: any) => s.composantes.amertume === null).length}`);
poserTypicite(null);
