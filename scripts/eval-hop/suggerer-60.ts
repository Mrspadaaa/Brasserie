// Voie g1-suggerer-moments (#181), suite : l'amertume à 60′ dans Suggérer. MESURE seulement : rien dans src/.
// Lancement : npx vite-node scripts/eval-hop/suggerer-60.ts -- --sortie=<dossier>   (sortie : suggerer-60.json, déterministe)
//  E1. « Plus d'amertume » à 60′ : pour +10 IBU, la dose de chaque variété (gramsForIbu) : l'écart entre variétés, ce qu'un jeu à 60′
//      (α, usage, cohumulone, β) pourrait lire, sa couverture dans les fiches. Aucun classement n'est proposé ici : le jeu est à valider.
//  E2. « Remplacer à IBU égal » (le seul 60′ que Suggérer propose aujourd'hui) : doses rendues, groupes d'ex æquo.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { arrondi, mediane } from './metriques';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/g1-suggerer-moments');
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const mid = (r: [number, number] | null | undefined) => (r ? (r[0] + r[1]) / 2 : null);
const quantile = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };

const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };

const E1 = [['21C', R21C], ['16D', R16D]].map(([code, r]) => {
  const recette = r as Recipe;
  const lignes = CATALOGUE.map((h) => {
    const ref = m.hopRef(h.id);
    const g = ref ? m.gramsForIbu(10, ref, 'b60', recette) : null;
    return { id: h.id, nom: h.name, alpha: mid(h.alpha), usage: h.purpose ?? null, cohu: mid(h.cohumulone ?? null), beta: mid(h.beta), grammes: g };
  }).filter((x) => x.grammes !== null && Number.isFinite(x.grammes));
  const gl = lignes.map((x) => x.grammes! / recette.volumeL);
  const parUsage = Object.fromEntries((['bittering', 'dual', 'aroma'] as const).map((u) => {
    const xs = lignes.filter((x) => x.usage === u).map((x) => x.grammes! / recette.volumeL);
    return [u, { n: xs.length, mediane_g_par_L: arrondi(mediane(xs), 2), p10: arrondi(quantile(xs, 0.1), 2), p90: arrondi(quantile(xs, 0.9), 2) }];
  }));
  const tri = [...lignes].sort((a, b) => a.grammes! - b.grammes! || (a.id < b.id ? -1 : 1));
  return {
    recette: code, ibuAjoute: 10, varietesCalculables: lignes.length, sur: CATALOGUE.length,
    g_par_L: { min: arrondi(Math.min(...gl), 2), p10: arrondi(quantile(gl, 0.1), 2), mediane: arrondi(mediane(gl), 2), p90: arrondi(quantile(gl, 0.9), 2), max: arrondi(Math.max(...gl), 2) },
    plus_de_5_g_par_L: gl.filter((x) => x > 5).length, plus_de_10_g_par_L: gl.filter((x) => x > 10).length, parUsage,
    couverture: { alpha: lignes.filter((x) => x.alpha).length, usage: lignes.filter((x) => x.usage).length, cohumulone: lignes.filter((x) => x.cohu !== null).length, beta: lignes.filter((x) => x.beta !== null).length },
    // Les dix qui demandent le moins de grammes (les plus riches en α) et les dix qui en demandent le plus : l'écart que l'écran montrerait.
    moinsDeGrammes: tri.slice(0, 10).map((x) => ({ nom: x.nom, alpha: x.alpha, usage: x.usage, cohu: x.cohu, beta: x.beta, g: arrondi(x.grammes!, 1) })),
    plusDeGrammes: tri.slice(-10).reverse().map((x) => ({ nom: x.nom, alpha: x.alpha, usage: x.usage, cohu: x.cohu, beta: x.beta, g: arrondi(x.grammes!, 1) })),
  };
});

const E2 = [['21C', R21C], ['16D', R16D]].flatMap(([code, r]) => ([['plus d’agrumes', { citrus: 1 }], ['moins de résineux', { resin: -1 }]] as const).map(([visee, dir]) => {
  const recette = r as Recipe;
  const res = m.proposeVoies(recette, dir as never, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, moments: ['b60'], assemblages: false });
  const rem = res.voies.filter((v) => v.type === 'remplacer à IBU égal');
  const gl = rem.map((v) => v.actions[0].grams / recette.volumeL);
  const groupes = new Map<number, number>();
  for (const v of rem) groupes.set(v.rank, (groupes.get(v.rank) ?? 0) + 1);
  const dansLEcran = m.proposeVoies(recette, dir as never, { assemblages: true }).voies.filter((v) => v.type === 'remplacer à IBU égal');
  return {
    recette: code, visee, remplacementsPossibles: rem.length, dansLEcranParDefaut: dansLEcran.length,
    g_par_L: { min: arrondi(Math.min(...gl), 2), mediane: arrondi(mediane(gl), 2), max: arrondi(Math.max(...gl), 2) },
    plus_de_5_g_par_L: gl.filter((x) => x > 5).length, groupesDistincts: groupes.size, premierGroupe: rem.length ? rem.filter((v) => v.rank === rem[0].rank).length : 0,
    ecran: dansLEcran.map((v) => `${v.label} (rang ${v.rank})`),
  };
}));

const json = JSON.stringify({ voie: 'g1-suggerer-moments', E1, E2 }, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'suggerer-60.json'), json);
process.stdout.write(`sha256 ${createHash('sha256').update(json).digest('hex')}\n`);
