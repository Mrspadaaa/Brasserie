// Voie c9 : Substituer à 60′ pour Nugget (46 g, S1 16D), les 10 premiers rangs, sur un catalogue donné (base + ajouts), pour comparer avant et après.
// Lancement (depuis la racine) : node_modules/.bin/vite-node work/missions/2026-10-25-integration-houblons/voies/c9-ajouts-amertume/c9-banc.ts [proto-data.json] [catalogue-ajouts.json]
// Sans argument : les fichiers du dépôt. « Avant » : les deux fichiers de HEAD (git show HEAD:<f>) copiés dans os.tmpdir().
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const RACINE = process.cwd();
const [protoArg, ajoutsArg] = process.argv.slice(2).filter((a) => a.endsWith('.json'));
const { depliee } = await import(/* @vite-ignore */ `${RACINE}/src/domain/hopIndex/v4/data.ts`);
const { creerMoteur } = await import(/* @vite-ignore */ `${RACINE}/src/domain/hopIndex/v4/moteur.ts`);
const { poserTypicite } = await import(/* @vite-ignore */ `${RACINE}/src/domain/hopIndex/v4/typicite.ts`);
const { getStyleScale } = await import(/* @vite-ignore */ `${RACINE}/src/domain/hopIndex/v4/style/scale.ts`);
const lire = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
poserTypicite(lire(join(RACINE, 'src/data/hopV4/typicite-styles.json')));
const proto = lire(protoArg ?? join(RACINE, 'src/data/hopV4/proto-data.json'));
const ajouts = lire(ajoutsArg ?? join(RACINE, 'src/data/hopV4/catalogue-ajouts.json'));
const catalogue = [...depliee(proto), ...depliee(ajouts)];
const m = creerMoteur({ catalogue, stock: [] });
const r: any = { name: 'S1', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const res = m.substitutes('beermaverick-nugget', { moment: 'b60', grams: 46, recipe: r, style: getStyleScale('16D'), stockFirst: true, limit: 700 });
const ligne = (s: any) => `${String(s.rank).padStart(3)} ${s.name.padEnd(26)} score ${String(s.score).padStart(3)} ${s.palier.padEnd(11)} amertume ${String(s.composantes.amertume).padEnd(5)} fiabilité ${s.couverture.fiabilite}`;
const ajoutsIds = new Set(depliee(ajouts).map((v: any) => v.id));
console.log(`catalogue ${catalogue.length} (dont ${ajoutsIds.size} ajouts) ; candidats ${res.candidats}`);
for (const s of res.remplacants.slice(0, 10)) console.log(ligne(s) + (ajoutsIds.has(s.key) ? '  [ajout]' : ''));
const inconnus = res.remplacants.filter((s: any) => s.composantes.amertume === null);
const ajoutsInconnus = inconnus.filter((s: any) => ajoutsIds.has(s.key));
console.log(`amertume inconnue : ${inconnus.length} candidats sur ${res.candidats} (dont ${ajoutsInconnus.length} ajouts) ; dans les 10 premiers : ${res.remplacants.slice(0, 10).filter((s: any) => s.composantes.amertume === null).length} ; dans les 30 premiers : ${res.remplacants.slice(0, 30).filter((s: any) => s.composantes.amertume === null).length}`);
const ajoutsTop = res.remplacants.slice(0, 30).filter((s: any) => ajoutsIds.has(s.key));
console.log(`ajouts dans les 30 premiers : ${ajoutsTop.map((s: any) => `${s.rank} ${s.name}`).join(' ; ') || 'aucun'}`);
poserTypicite(null);
