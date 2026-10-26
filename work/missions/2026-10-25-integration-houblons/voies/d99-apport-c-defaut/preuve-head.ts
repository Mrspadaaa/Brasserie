// Voie d99 : preuves contre HEAD (voies.ts, minoritaire.ts de HEAD copiés ici, imports réécrits en chemins absolus ; copie jetable, pas un livrable).
//  1. le contrôle de D167 (Citra, Mosaic, Nelson Sauvin dans le premier tiers) ÉCHOUE sur HEAD : leurs rangs ;
//  2. 'aucun' (code actuel) = HEAD à l'octet, sur 168 appels (la grille de g2d) ;
//  3. option absente (code actuel) contre HEAD : les voies sont les mêmes, les barres identiques voie par voie à chaque moment ; seul l'ordre change, au dry hop seulement.
// Lancement : npx vite-node work/missions/2026-10-25-integration-houblons/voies/d99-apport-c-defaut/preuve-head.ts
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { creerMoteur } from '../../../../../src/domain/hopIndex/v4/moteur';
import { CATALOGUE } from '../../../../../src/domain/hopIndex/v4/data';
import * as neuf from '../../../../../src/domain/hopIndex/v4/voies';
import type { Recipe } from '../../../../../src/domain/hopIndex/v4/recipe';

const RACINE = resolve('.').split('\\').join('/');
const DOSSIER = `${RACINE}/work/missions/2026-10-25-integration-houblons/voies/d99-apport-c-defaut/tmp-head`;
mkdirSync(DOSSIER, { recursive: true });
for (const f of ['voies', 'minoritaire']) {
  const src = execSync(`git show HEAD:src/domain/hopIndex/v4/${f}.ts`, { maxBuffer: 1 << 26 }).toString('utf8');
  writeFileSync(`${DOSSIER}/${f}-head.ts`, src.split("from './minoritaire'").join(`from './minoritaire-head'`).split("from './").join(`from '${RACINE}/src/domain/hopIndex/v4/`).split("from '../").join(`from '${RACINE}/src/domain/hopIndex/`).split(`from '${RACINE}/src/domain/hopIndex/v4/minoritaire-head'`).join(`from './minoritaire-head'`));
}
const head = (await import(/* @vite-ignore */ `${DOSSIER}/voies-head.ts`)) as typeof neuf;

const R21C: Recipe = { name: 'Hazy', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }), mStock = creerMoteur();
const dirs = [{ citrus: 1 }, { tropical: 1 }, { floral: 1 }, { resin: -1 }, { citrus: 1, resin: -1 }, {}];
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100 };
const opts = [{}, { leviersLevure: true, assemblages: false }, { ...GRAND, moments: ['dryActive' as const], assemblages: false }, { ...GRAND, moments: ['b10' as const, 'wp' as const], assemblages: true },
  { ...GRAND, moments: ['dryActive' as const], departage: 'k1' as const }, { ...GRAND, moments: ['b10' as const], departage: 'k3' as const, leviersLevure: true },
  { dryHop: true, palier60: { ibu: 10 }, maxBuy: 40, limit: 40, buyLimit: 40 }];

// 1. D167 sur HEAD.
const pos = (vs: { type: string; actions: { hopKey: string }[] }[], key: string) => vs.filter((v) => v.type === 'ajouter').findIndex((v) => v.actions[0].hopKey === key) + 1;
const dry = { ...GRAND, assemblages: false, moments: ['dryActive' as const], departage: 'k3' as const };
const lh = m.dans(() => head.proposeVoies(R21C, { citrus: 1 }, dry)).voies, ln = m.dans(() => neuf.proposeVoies(R21C, { citrus: 1 }, dry)).voies;
const n = lh.filter((v) => v.type === 'ajouter').length;
console.log(`D167 : ${n} ajouts, premier tiers = ${Math.ceil(n / 3)}`);
for (const [nom, k] of [['Citra', 'beermaverick-citra'], ['Mosaic', 'beermaverick-mosaic'], ['Nelson Sauvin', 'beermaverick-nelson-sauvin'], ['Galaxy', 'beermaverick-galaxy'], ['Hallertau Blanc', 'beermaverick-hallertau-blanc']])
  console.log(`  ${nom} : HEAD ${pos(lh, k)}e → défaut D99 ${pos(ln, k)}e`);

// 2 et 3.
let nb = 0, octets = 0, rangsChanges = 0;
const h1 = createHash('sha256'), h2 = createHash('sha256');
const lu = (v: any) => JSON.stringify({ e: v.effect, o: v.styleOverflow, t: v.overflowTotal, d: v.distance, i: v.ibu, a: v.actions, s: v.sideEffects, c: v.conflicts, k: v.stock, dose: v.dose });
let barresChangees = 0, voiesVues = 0, listesRemplacees = 0, voiesRemplacees = 0; const parOptions: Record<string, number> = {};
for (const mo of [m, mStock]) for (const r of [R21C, R16D]) for (const d of dirs) for (const o of opts) {
  const a = JSON.stringify(mo.dans(() => head.proposeVoies(r, d, o))), c = JSON.stringify(mo.dans(() => neuf.proposeVoies(r, d, { ...o, apportMinoritaire: 'aucun' })));
  h1.update(a); h2.update(c); nb++; octets += a.length;
  if (a !== c) { console.log('DIFFERENCE (aucun contre HEAD)', JSON.stringify(d), JSON.stringify(o)); process.exit(1); }
  const R = mo.dans(() => head.proposeVoies(r, d, o)), N = mo.dans(() => neuf.proposeVoies(r, d, o));
  const groupes = (x: typeof R) => [x.voies, x.palier60?.voies ?? [], x.dryHop?.actif ?? [], x.dryHop?.apres ?? []];
  const gh = groupes(R), gn = groupes(N);
  for (let i = 0; i < gh.length; i++) {
    const parId = new Map(gn[i].map((v: any) => [v.id, v]));
    // Listes tronquées (limites 10 et 4 de l'app) : le rang décide qui entre ; une voie peut en remplacer une autre. Les barres se comparent sur les voies COMMUNES.
    let remp = 0;
    for (const v of gh[i] as any[]) { voiesVues++; const w = parId.get(v.id) as any; if (!w) { remp++; continue; } if (lu(w) !== lu(v)) barresChangees++; }
    if (remp) { listesRemplacees++; const k = JSON.stringify(Object.keys(o).concat(((o as any).moments ?? []))); parOptions[k] = (parOptions[k] ?? 0) + 1; voiesRemplacees += remp; }
    if (gh[i].map((v: any) => v.id).join() !== gn[i].map((v: any) => v.id).join()) rangsChanges++;
  }
}
console.log(`'aucun' = HEAD : ${nb} appels identiques (${octets} octets) ; sha256 HEAD ${h1.digest('hex')} ; actuel 'aucun' ${h2.digest('hex')}`);
console.log(`option absente contre HEAD : ${voiesVues} voies comparées, barres/doses/débordements changés : ${barresChangees} ; listes dont l'ordre change : ${rangsChanges}`);
console.log(`listes où des voies sont remplacées (troncature par le rang) : ${listesRemplacees}, voies remplacées : ${voiesRemplacees}`, parOptions);
if (barresChangees) process.exit(1);
