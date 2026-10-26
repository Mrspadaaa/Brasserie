// e6 (point 3) : peut-on découper la préchauffe de Suggérer (proposerRapide : proposeVoies sans remplacements) en tranches de moins de 50 ms SANS toucher au moteur ?
// Le seul levier du moteur qui borne le travail d'un appel : `moments` (quels moments sont évalués) et `maxBuy` (combien de houblons « à acheter » sont classés).
// On mesure, moteur neuf (caches vides) à chaque scénario, après un échauffement du JIT : le temps de chaque appel, sa part fixe, et ce que le premier appel complet paie ensuite.
// Usage : RACINE=<arbre> npx vite-node sonde-tranches.ts   (depuis la racine du dépôt). Fixtures seulement. Mesure à ×1 (ce PC) ; un téléphone est supposé ×4 (hypothèse écrite).
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const racine = path.resolve(process.env.RACINE ?? '.');
const imp = (rel: string) => import(pathToFileURL(path.join(racine, 'src', 'domain', 'hopIndex', 'v4', rel)).href);
const data = await imp('data.ts');
const { creerMoteur } = await imp('moteur.ts');
const R16D = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const DIR = { floral: 1 };
const BASE = { assemblages: true, remplacements: false };
const neuf = () => creerMoteur({ catalogue: data.CATALOGUE, stock: data.DONNEES_FIXTURE.stock });
const chrono = <T>(f: () => T): [T, number] => { const t = performance.now(); const r = f(); return [r, performance.now() - t]; };
const f1 = (x: number) => Math.round(x * 10) / 10;

// Échauffement du JIT (moteurs jetés) : on mesure des caches vides, pas un code jamais exécuté.
for (let i = 0; i < 3; i++) neuf().proposeVoies(R16D, DIR, BASE);

const ids = (r: { voies: Array<{ id: number | string }> }) => r.voies.map((v) => String(v.id)).join(',');
const MOMENTS = ['b10', 'wp', 'dryActive', 'dryPost'] as const;
const REP = 5;
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

// A. Un seul appel (l'état actuel de la préchauffe).
const A: number[] = [];
let completRef = '';
for (let i = 0; i < REP; i++) { const m = neuf(); const [r, t] = chrono(() => m.proposeVoies(R16D, DIR, BASE)); A.push(t); completRef = ids(r); }
console.log(`A. un appel (proposerRapide, visée {floral:1}) : médiane ${f1(med(A))} ms (min ${f1(Math.min(...A))}, max ${f1(Math.max(...A))}, n=${REP}) ; ${completRef.split(',').length} voies`);

// B. Par moment : quatre appels, chacun avec `moments: [m]`.
const B: Record<string, number[]> = {};
for (let i = 0; i < REP; i++) {
  const m = neuf();
  for (const mo of MOMENTS) { const [, t] = chrono(() => m.proposeVoies(R16D, DIR, { ...BASE, moments: [mo] })); (B[mo] ??= []).push(t); }
}
console.log('B. un appel par moment (même moteur, appels à la suite) : ' + MOMENTS.map((mo) => `${mo} ${f1(med(B[mo]))} ms`).join(' · ') + ` · somme ${f1(MOMENTS.reduce((s, mo) => s + med(B[mo]), 0))} ms`);

// C. Par fenêtre du pool « à acheter » (maxBuy) : 10, 20, … 80 ; chaque appel reclasse tout ce qui précède (les apports sont gardés).
const PAS = [10, 20, 30, 40, 50, 60, 70, 80];
const C: Record<number, number[]> = {};
for (let i = 0; i < REP; i++) {
  const m = neuf();
  for (const k of PAS) { const [, t] = chrono(() => m.proposeVoies(R16D, DIR, { ...BASE, maxBuy: k })); (C[k] ??= []).push(t); }
}
console.log('C. un appel par taille de pool (maxBuy croissant, même moteur) : ' + PAS.map((k) => `${k} → ${f1(med(C[k]))} ms`).join(' · ') + ` · somme ${f1(PAS.reduce((s, k) => s + med(C[k]), 0))} ms`);

// D. Ce que le premier appel complet paie ensuite, après la préchauffe par tranches de moment (B) ou en un bloc (A), sur une AUTRE visée.
const D = (prechauffe: ((m: ReturnType<typeof neuf>) => void) | null) => { const xs: number[] = []; for (let i = 0; i < REP; i++) { const m = neuf(); prechauffe?.(m); const [, t] = chrono(() => m.proposeVoies(R16D, { citrus: 1 }, BASE)); xs.push(t); } return med(xs); };
console.log(`D. premier appel sur une autre visée {citrus:1} : sans préchauffe ${f1(D(null))} ms · après un bloc (A) ${f1(D((m) => { m.proposeVoies(R16D, DIR, BASE); }))} ms · après quatre appels par moment (B) ${f1(D((m) => { for (const mo of MOMENTS) m.proposeVoies(R16D, DIR, { ...BASE, moments: [mo] }); }))} ms`);
