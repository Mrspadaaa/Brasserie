// Voie f5-ajouter-corrige (D107) : la fluidité de `quickAdds` est bloquante (D105) ; plus rapide ou égal, au ms près, avant et après.
//   npx vite-node scripts/eval-hop/f5-perf.ts -- --etiquette=avant|apres [--passes=5]
// Mesure : quickAdds sur le catalogue plein (505 variétés), stock des fixtures, comme Ajouter.tsx (catalogueLimit 10000, aromatique), sur
// trois recettes (21A, 21C, 16D), chacune 15 fois avec un og qui change (aucune mémoire du moteur ne sert : une recette nouvelle à chaque appel).
// Sortie : `perf-<etiquette>.json` dans le dossier de la voie (ms, non déterministe) et une ligne de résumé (médiane de chaque passe, puis des passes).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chargerCataloguePlein, DONNEES_FIXTURE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';

const args = process.argv.slice(2);
const opt = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const ETIQUETTE = opt('etiquette') ?? 'essai';
const PASSES = Number(opt('passes') ?? 5);
const SORTIE = resolve(opt('sortie') ?? 'work/missions/2026-10-25-integration-houblons/voies/f5-ajouter-corrige');
const NUGGET = { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60' as const };
const RECETTES: { style: string; r: Recipe }[] = [
  { style: '21A', r: { name: '21A', styleCode: '21A', volumeL: 24, og: 1.065, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ ...NUGGET, grams: 20 }] } },
  { style: '21C', r: { name: '21C', styleCode: '21C', volumeL: 24, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ ...NUGGET, grams: 20 }] } },
  { style: '16D', r: { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ ...NUGGET, grams: 46 }] } },
];
const mediane = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const plein = await chargerCataloguePlein();
const moteur = creerMoteur({ catalogue: plein, stock: DONNEES_FIXTURE.stock });
const appel = (r: Recipe, style: string) => moteur.dans(() => moteur.quickAdds(r, getStyleScale(style), null, { catalogueLimit: 10000, aromatique: true }));
for (const { r, style } of RECETTES) appel(r, style); // chauffe : premier passage à froid exclu de la médiane

const passes: { parRecette: Record<string, number>; mediane: number }[] = [];
for (let p = 0; p < PASSES; p++) {
  const parRecette: Record<string, number> = {};
  for (const { style, r } of RECETTES) {
    const t: number[] = [];
    for (let i = 0; i < 15; i++) { const rr = { ...r, og: r.og + (i + 1) / 10000 }; const a = performance.now(); appel(rr, style); t.push(performance.now() - a); }
    parRecette[style] = Math.round(mediane(t) * 100) / 100;
  }
  passes.push({ parRecette, mediane: Math.round(mediane(Object.values(parRecette)) * 100) / 100 });
}
const resume = { etiquette: ETIQUETTE, varietes: plein.length, medianeDesPasses: Math.round(mediane(passes.map((p) => p.mediane)) * 100) / 100, passes };
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, `perf-${ETIQUETTE}.json`), JSON.stringify(resume, null, 1));
console.log(`PERF ${ETIQUETTE} : ${plein.length} variétés, médiane ${resume.medianeDesPasses} ms ; passes ${passes.map((p) => p.mediane).join(' ')}`);
