# Annexe r2-cout-calcul — coût de simulerCas

Mesures faites le 2026-10-22 (Node v24.19.0, Intel Core i5-14600KF, 20 cœurs, 15,8 Go de RAM, Windows 11). Léger = `complet: false` ; complet = `complet: true`. Script et sortie brute ci-dessous. Aucun fichier de `prototypes/` modifié (`git status` vide sous `prototypes/houblons-v4`).

## Méthode

- `performance.now()` autour de chaque appel de `simulerCas`. Chauffe : 5 appels par mesure, puis 30 répétitions (cas) ou 30 balayages (catalogue). Médiane, p95 (rang 0,95) et maximum.
- Le moteur garde un cache interne (`cacheBase`, clé = ajout, dose, levure, style). Les mesures « balayage » sont donc prises à cache chaud, sauf le balayage de chauffe, noté `froid`. Le cas « sans cache » fait varier la dose à chaque appel pour mesurer sans cache.
- Catalogue : 318 houblons × 5 moments (`MOMENTS_SIMULES`) = 1590 cas par balayage, dose 4 g/L, levure US-05 (complet et léger), puis Verdant, Pomona, Diamond (léger). Aucune erreur : `erreurs` vide pour les 5 balayages (7950 cas, 30 répétitions chacun).
- Variante d'écran : un houblon × 5 moments × 4 levures, somme des médianes par cas.
- Le cas stout : `s1Recipe()` (Nugget 46 g à 60′, 20 L, 16D). Un ajout : Citra 4 g/L, dry hop après fermentation (J+7, 3 j), US-05. Deux ajouts : Citra 2 g/L (J+7, 3 j) puis Galaxy 2 g/L (J+10, 3 j), dry hop après fermentation.

## Script `bench.ts` (copie du fichier voie)

```ts
// Chronomètre simulerCas (léger = complet: false, complet = complet: true) : cas stout 16D S1, cas à deux
// ajouts, tout le catalogue (chaque houblon × 5 moments, dose 4 g/L) et 4 levures en léger.
// Lecture seule : n'écrit rien (ni moteur, ni données). Chauffe : 5 appels par mesure, puis REPS répétitions.
// Usage (depuis prototypes/houblons-v4) :
//   node_modules/.bin/vite-node ../../work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/bench.ts
// Variables : BENCH_REPS (défaut 30) : nombre de balayages mesurés pour le catalogue.
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { simulerCas, MOMENTS_SIMULES, CATALOGUE } from '../../../../../prototypes/houblons-v4/src/engine';
import { s1Recipe, S1_TASTING } from '../../../../../prototypes/houblons-v4/src/pack/buildPack';

const REPS = Number(process.env.BENCH_REPS ?? 30);
const CHAUFFE = 5;
const US05 = 'fermentis-us05';
const LEVURES = [US05, 'lalbrew-verdant-ipa', 'lalbrew-pomona', 'lalbrew-diamond'];
const recette = s1Recipe();
const SEC = (m: string) => m === 'dryActive' || m === 'dryPost';
const JOUR = (m: string) => (m === 'dryActive' ? 2 : m === 'dryPost' ? 7 : null);

type Ajout = { id: string; houblon: string; dose_gL: number; moment: string; jourDebut: number | null; jours: number | null };
const ajout = (id: string, houblon: string, dose_gL: number, moment: string, jourDebut: number | null, jours: number | null): Ajout =>
  ({ id, houblon, dose_gL, moment, jourDebut, jours });

function run(ajouts: Ajout[], levure: string, complet: boolean) {
  return simulerCas({ id: 'bench', titre: 'bench', ajouts, levure, recette, degustation: S1_TASTING, complet } as any);
}

const tri = (xs: number[]) => [...xs].sort((a, b) => a - b);
const med = (xs: number[]) => { const s = tri(xs); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const p95 = (xs: number[]) => { const s = tri(xs); return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]; };
const max = (xs: number[]) => Math.max(...xs);
const r3 = (x: number) => Math.round(x * 1000) / 1000;

function mesure(fn: () => unknown, reps = REPS) {
  for (let i = 0; i < CHAUFFE; i++) fn();
  const t: number[] = [];
  for (let i = 0; i < reps; i++) { const a = performance.now(); fn(); t.push(performance.now() - a); }
  return { n: t.length, medianeMs: r3(med(t)), p95Ms: r3(p95(t)), maxMs: r3(max(t)), brutMs: t.map(r3) };
}

// ---------- Cas stout (16D S1, Nugget 46 g à 60′ de la recette de départ) ----------
const STOUT1 = [ajout('citra', 'beermaverick-citra', 4, 'dryPost', 7, 3)];
const STOUT2 = [ajout('citra', 'beermaverick-citra', 2, 'dryPost', 7, 3), ajout('galaxy', 'beermaverick-galaxy', 2, 'dryPost', 10, 3)];
const stout: Record<string, unknown> = {};
for (const [nom, ajouts] of [['un-ajout', STOUT1], ['deux-ajouts', STOUT2]] as const)
  for (const complet of [false, true]) stout[`${nom}-${complet ? 'complet' : 'leger'}`] = mesure(() => run(ajouts as Ajout[], US05, complet));
// Contrôle du cache interne (cacheBase) : la dose change à chaque appel, donc aucune clé ne se répète.
for (const complet of [false, true]) {
  let k = 0;
  stout[`un-ajout-sans-cache-${complet ? 'complet' : 'leger'}`] = mesure(() => { k++; run([ajout('citra', 'beermaverick-citra', 4 + k * 1e-7, 'dryPost', 7, 3)], US05, complet); });
}

// ---------- Balayage du catalogue ----------
const HOPS = CATALOGUE.map((h) => h.id);
function balayage(levure: string, complet: boolean) {
  const cas = [] as { hop: string; moment: string; run: () => unknown }[];
  for (const hop of HOPS) for (const m of MOMENTS_SIMULES)
    cas.push({ hop, moment: m, run: () => run([ajout('c', hop, 4, m, JOUR(m), SEC(m) ? 3 : null)], levure, complet) });
  const morts = new Set<number>();
  const erreurs: Record<string, number> = {};
  const parCas: number[][] = cas.map(() => []);
  const balayages: number[] = [];
  let froidMs = 0; // balayage de chauffe : cache interne (cacheBase) encore vide
  for (let s = 0; s <= REPS; s++) { // s = 0 : balayage de chauffe, non compté
    const t0 = performance.now();
    cas.forEach((c, i) => {
      if (morts.has(i)) return;
      const a = performance.now();
      try { c.run(); } catch (err) {
        morts.add(i);
        const msg = String((err as Error).message ?? err).slice(0, 160);
        erreurs[msg] = (erreurs[msg] ?? 0) + 1;
        return;
      }
      if (s > 0) parCas[i].push(performance.now() - a);
    });
    if (s > 0) balayages.push(performance.now() - t0); else froidMs = performance.now() - t0;
  }
  const lignes = cas.map((c, i) => ({ hop: c.hop, moment: c.moment, ok: !morts.has(i), medianeMs: morts.has(i) ? null : r3(med(parCas[i])), p95Ms: morts.has(i) ? null : r3(p95(parCas[i])), maxMs: morts.has(i) ? null : r3(max(parCas[i])) }));
  const ok = lignes.filter((l) => l.ok);
  const medianes = ok.map((l) => l.medianeMs as number);
  const parHoublon = new Map<string, number>();
  for (const l of ok) parHoublon.set(l.hop, (parHoublon.get(l.hop) ?? 0) + (l.medianeMs as number));
  const top5 = [...parHoublon.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h, v]) => ({ houblon: h, sommeMoments_ms: r3(v) }));
  return {
    levure, complet, cas: cas.length, casOk: ok.length, erreurs, froidMs: r3(froidMs),
    balayage: { n: balayages.length, medianeMs: r3(med(balayages)), p95Ms: r3(p95(balayages)), maxMs: r3(max(balayages)), brutMs: balayages.map(r3) },
    parCas: { medianeMs: r3(med(medianes)), p95Ms: r3(p95(medianes)), maxMs: r3(max(medianes)) },
    top5HoublonsLents: top5, lignes,
  };
}

const sortie: Record<string, any> = {
  conditions: {
    node: process.version, cpu: os.cpus()[0].model, coeurs: os.cpus().length,
    memoireTotaleGo: r3(os.totalmem() / 2 ** 30), memoireLibreGo: r3(os.freemem() / 2 ** 30),
    date: new Date().toISOString(), repetitionsCatalogue: REPS, repetitionsCas: REPS, chauffe: CHAUFFE,
    catalogue: HOPS.length, moments: [...MOMENTS_SIMULES],
  },
  stout,
  balayages: {} as Record<string, unknown>,
};
for (const complet of [false, true]) sortie.balayages[`us05-${complet ? 'complet' : 'leger'}`] = balayage(US05, complet);
for (const l of LEVURES.slice(1)) sortie.balayages[`${l}-leger`] = balayage(l, false);

// Variante d'écran : un houblon × 5 moments × 4 levures, en léger (somme des médianes par cas).
const leger = LEVURES.map((l) => sortie.balayages[`${l === US05 ? 'us05' : l}-leger`] ?? sortie.balayages[`${l}-leger`]);
const med4 = new Map<string, number>();
for (const b of leger) for (const l of b.lignes) if (l.ok) med4.set(l.hop, (med4.get(l.hop) ?? 0) + l.medianeMs);
const variantes = HOPS.filter((h) => med4.has(h)).map((h) => ({ houblon: h, varianteMs: r3(med4.get(h)!) }));
sortie.variante = {
  definition: 'un houblon × 5 moments × 4 levures, léger, somme des médianes par cas',
  medianeMs: r3(med(variantes.map((v) => v.varianteMs))), p95Ms: r3(p95(variantes.map((v) => v.varianteMs))), maxMs: r3(max(variantes.map((v) => v.varianteMs))),
  top5: [...variantes].sort((a, b) => b.varianteMs - a.varianteMs).slice(0, 5),
};

console.log(JSON.stringify(sortie, null, 1));
```

## Sortie brute (bench.ts, BENCH_REPS=30, 2026-10-22)

Commande : depuis la racine du dépôt, `prototypes/houblons-v4/node_modules/.bin/vite-node -r . -c prototypes/houblons-v4/vite.config.ts work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/bench.ts` avec `BENCH_REPS=30`. Sortie JSON complète : 1,26 Mo (lignes par cas et temps bruts par répétition). Ici : conditions, cas stout (temps bruts), synthèse de chaque balayage, variante ; les lignes par cas sont dans le JSON complet, non recopié (taille).

```json
{
 "conditions": {
  "node": "v24.19.0",
  "cpu": "Intel(R) Core(TM) i5-14600KF",
  "coeurs": 20,
  "memoireTotaleGo": 15.836,
  "memoireLibreGo": 6.158,
  "date": "2026-10-22T11:03:44.243Z",
  "repetitionsCatalogue": 30,
  "repetitionsCas": 30,
  "chauffe": 5,
  "catalogue": 318,
  "moments": [
   "b60",
   "b10",
   "wp",
   "dryActive",
   "dryPost"
  ]
 },
 "stout": {
  "un-ajout-leger": {
   "n": 30,
   "medianeMs": 0.167,
   "p95Ms": 0.236,
   "maxMs": 0.255,
   "brutMs": [
    0.197,
    0.167,
    0.16,
    0.191,
    0.198,
    0.157,
    0.162,
    0.14,
    0.136,
    0.197,
    0.177,
    0.212,
    0.176,
    0.159,
    0.176,
    0.193,
    0.154,
    0.23,
    0.196,
    0.168,
    0.137,
    0.255,
    0.114,
    0.16,
    0.135,
    0.12,
    0.111,
    0.232,
    0.236,
    0.154
   ]
  },
  "un-ajout-complet": {
   "n": 30,
   "medianeMs": 3.941,
   "p95Ms": 4.114,
   "maxMs": 5.744,
   "brutMs": [
    3.939,
    3.904,
    3.943,
    3.958,
    3.774,
    3.785,
    3.764,
    3.843,
    4.043,
    3.968,
    4.114,
    4.034,
    4.008,
    4.107,
    4.082,
    4.023,
    3.924,
    3.977,
    3.932,
    3.955,
    3.982,
    3.872,
    3.943,
    5.744,
    3.679,
    3.704,
    3.726,
    3.585,
    3.59,
    3.618
   ]
  },
  "deux-ajouts-leger": {
   "n": 30,
   "medianeMs": 0.092,
   "p95Ms": 0.112,
   "maxMs": 0.116,
   "brutMs": [
    0.1,
    0.103,
    0.097,
    0.099,
    0.116,
    0.099,
    0.112,
    0.109,
    0.088,
    0.103,
    0.088,
    0.087,
    0.086,
    0.087,
    0.088,
    0.103,
    0.106,
    0.099,
    0.101,
    0.089,
    0.088,
    0.087,
    0.095,
    0.098,
    0.087,
    0.086,
    0.086,
    0.086,
    0.086,
    0.087
   ]
  },
  "deux-ajouts-complet": {
   "n": 30,
   "medianeMs": 5.185,
   "p95Ms": 5.996,
   "maxMs": 6.102,
   "brutMs": [
    5.203,
    5.096,
    5.455,
    4.983,
    4.972,
    4.966,
    5.996,
    4.805,
    4.879,
    4.835,
    4.909,
    4.745,
    4.823,
    5.461,
    5.322,
    5.238,
    5.287,
    5.343,
    5.3,
    5.207,
    5.226,
    5.353,
    5.168,
    5.231,
    5.401,
    6.102,
    4.866,
    4.895,
    4.869,
    4.951
   ]
  },
  "un-ajout-sans-cache-leger": {
   "n": 30,
   "medianeMs": 1.423,
   "p95Ms": 1.499,
   "maxMs": 1.53,
   "brutMs": [
    1.421,
    1.404,
    1.409,
    1.402,
    1.395,
    1.445,
    1.423,
    1.423,
    1.393,
    1.407,
    1.457,
    1.492,
    1.434,
    1.392,
    1.448,
    1.46,
    1.475,
    1.386,
    1.459,
    1.373,
    1.499,
    1.406,
    1.457,
    1.484,
    1.394,
    1.457,
    1.418,
    1.53,
    1.439,
    1.421
   ]
  },
  "un-ajout-sans-cache-complet": {
   "n": 30,
   "medianeMs": 3.917,
   "p95Ms": 4.266,
   "maxMs": 5.615,
   "brutMs": [
    3.596,
    3.753,
    3.626,
    3.66,
    3.468,
    5.615,
    4.114,
    3.627,
    4.137,
    3.98,
    3.962,
    4.04,
    3.995,
    3.917,
    3.766,
    3.862,
    3.965,
    3.913,
    4.049,
    3.783,
    3.569,
    4.159,
    3.916,
    4.034,
    3.914,
    4.266,
    4.015,
    4.006,
    3.733,
    3.576
   ]
  }
 },
 "variante": {
  "definition": "un houblon × 5 moments × 4 levures, léger, somme des médianes par cas",
  "medianeMs": 1.811,
  "p95Ms": 1.885,
  "maxMs": 1.996,
  "top5": [
   {
    "houblon": "beermaverick-nugget",
    "varianteMs": 1.996
   },
   {
    "houblon": "beermaverick-bitter-gold",
    "varianteMs": 1.929
   },
   {
    "houblon": "beermaverick-ariana",
    "varianteMs": 1.928
   },
   {
    "houblon": "beermaverick-mosaic",
    "varianteMs": 1.922
   },
   {
    "houblon": "beermaverick-galena",
    "varianteMs": 1.92
   }
  ]
 },
 "balayages": {
  "us05-leger": {
   "levure": "fermentis-us05",
   "complet": false,
   "cas": 1590,
   "casOk": 1590,
   "erreurs": {},
   "froidMs": 1238.532,
   "balayage": {
    "n": 30,
    "medianeMs": 164.682,
    "p95Ms": 191.37,
    "maxMs": 191.488,
    "brutMs": [
     115.924,
     162.764,
     162.354,
     171.472,
     162.074,
     156.499,
     175.537,
     173.645,
     168.054,
     160.784,
     191.488,
     162.286,
     191.37,
     173.555,
     160.722,
     167.451,
     177.294,
     158.257,
     165.754,
     166.318,
     179.534,
     165.726,
     159.291,
     163.461,
     171.419,
     173.386,
     163.637,
     157.81,
     157.579,
     155.029
    ]
   },
   "parCas": {
    "medianeMs": 0.091,
    "p95Ms": 0.097,
    "maxMs": 0.103
   },
   "top5HoublonsLents": [
    {
     "houblon": "beermaverick-nugget",
     "sommeMoments_ms": 0.499
    },
    {
     "houblon": "beermaverick-vista",
     "sommeMoments_ms": 0.491
    },
    {
     "houblon": "beermaverick-mosaic",
     "sommeMoments_ms": 0.486
    },
    {
     "houblon": "beermaverick-paradigm",
     "sommeMoments_ms": 0.486
    },
    {
     "houblon": "beermaverick-talus",
     "sommeMoments_ms": 0.485
    }
   ]
  },
  "us05-complet": {
   "levure": "fermentis-us05",
   "complet": true,
   "cas": 1590,
   "casOk": 1590,
   "erreurs": {},
   "froidMs": 8346.017,
   "balayage": {
    "n": 30,
    "medianeMs": 7961.043,
    "p95Ms": 8300.866,
    "maxMs": 8382.453,
    "brutMs": [
     8037.033,
     8004.19,
     8141.374,
     7937.674,
     7939.971,
     7952.376,
     7891.468,
     7969.709,
     7779.268,
     7864.873,
     8005.628,
     7880.663,
     7868.076,
     8001.142,
     7803.37,
     8382.453,
     8300.866,
     7943.162,
     8077.663,
     8002.989,
     7831.126,
     7865.218,
     8002.675,
     7897.847,
     7842.338,
     8059.309,
     7988.033,
     7925.03,
     8009.579,
     7998.585
    ]
   },
   "parCas": {
    "medianeMs": 4.595,
    "p95Ms": 5.495,
    "maxMs": 8.742
   },
   "top5HoublonsLents": [
    {
     "houblon": "beermaverick-cascade",
     "sommeMoments_ms": 37.102
    },
    {
     "houblon": "beermaverick-citra",
     "sommeMoments_ms": 32.762
    },
    {
     "houblon": "beermaverick-idaho-7",
     "sommeMoments_ms": 30.741
    },
    {
     "houblon": "beermaverick-galaxy",
     "sommeMoments_ms": 30.612
    },
    {
     "houblon": "beermaverick-nelson-sauvin",
     "sommeMoments_ms": 29.482
    }
   ]
  },
  "lalbrew-verdant-ipa-leger": {
   "levure": "lalbrew-verdant-ipa",
   "complet": false,
   "cas": 1590,
   "casOk": 1590,
   "erreurs": {},
   "froidMs": 2594.559,
   "balayage": {
    "n": 30,
    "medianeMs": 157.472,
    "p95Ms": 168.956,
    "maxMs": 171.899,
    "brutMs": [
     166.062,
     171.899,
     163.737,
     167.708,
     161.913,
     163.78,
     161.154,
     154.625,
     168.956,
     157.244,
     154.516,
     152.503,
     156.994,
     162.163,
     157.923,
     156.826,
     157.103,
     153.992,
     141.628,
     149.814,
     156.276,
     155.359,
     156.767,
     155.764,
     165.785,
     168.556,
     157.427,
     157.517,
     163.097,
     168.257
    ]
   },
   "parCas": {
    "medianeMs": 0.09,
    "p95Ms": 0.095,
    "maxMs": 0.106
   },
   "top5HoublonsLents": [
    {
     "houblon": "beermaverick-nugget",
     "sommeMoments_ms": 0.512
    },
    {
     "houblon": "beermaverick-northdown",
     "sommeMoments_ms": 0.491
    },
    {
     "houblon": "beermaverick-ariana",
     "sommeMoments_ms": 0.484
    },
    {
     "houblon": "beermaverick-bitter-gold",
     "sommeMoments_ms": 0.483
    },
    {
     "houblon": "beermaverick-mosaic",
     "sommeMoments_ms": 0.482
    }
   ]
  },
  "lalbrew-pomona-leger": {
   "levure": "lalbrew-pomona",
   "complet": false,
   "cas": 1590,
   "casOk": 1590,
   "erreurs": {},
   "froidMs": 2557.462,
   "balayage": {
    "n": 30,
    "medianeMs": 161.729,
    "p95Ms": 168.635,
    "maxMs": 176.334,
    "brutMs": [
     161.773,
     164.133,
     161.576,
     163.998,
     160.129,
     159.382,
     154.847,
     165.585,
     154.042,
     164.907,
     155.256,
     162.088,
     161.854,
     161.684,
     176.334,
     159.577,
     153.969,
     154.422,
     162.065,
     160.995,
     150.829,
     162.14,
     165.739,
     158.367,
     164.956,
     163.272,
     162.567,
     152.663,
     168.635,
     159.903
    ]
   },
   "parCas": {
    "medianeMs": 0.09,
    "p95Ms": 0.095,
    "maxMs": 0.106
   },
   "top5HoublonsLents": [
    {
     "houblon": "beermaverick-nugget",
     "sommeMoments_ms": 0.496
    },
    {
     "houblon": "beermaverick-galena",
     "sommeMoments_ms": 0.488
    },
    {
     "houblon": "beermaverick-hydra",
     "sommeMoments_ms": 0.487
    },
    {
     "houblon": "beermaverick-idaho-7",
     "sommeMoments_ms": 0.487
    },
    {
     "houblon": "beermaverick-mosaic",
     "sommeMoments_ms": 0.482
    }
   ]
  },
  "lalbrew-diamond-leger": {
   "levure": "lalbrew-diamond",
   "complet": false,
   "cas": 1590,
   "casOk": 1590,
   "erreurs": {},
   "froidMs": 2444.2,
   "balayage": {
    "n": 30,
    "medianeMs": 159.343,
    "p95Ms": 171.628,
    "maxMs": 177.296,
    "brutMs": [
     177.296,
     156.48,
     157.554,
     162.213,
     160.618,
     149.998,
     158.542,
     155.406,
     154.929,
     171.628,
     161.44,
     159.864,
     154.326,
     155.77,
     163.448,
     163.363,
     153.579,
     154.499,
     158.157,
     153.493,
     165.486,
     164.377,
     161.908,
     159.89,
     158.821,
     171.472,
     160.302,
     162.795,
     149.974,
     157.445
    ]
   },
   "parCas": {
    "medianeMs": 0.09,
    "p95Ms": 0.096,
    "maxMs": 0.101
   },
   "top5HoublonsLents": [
    {
     "houblon": "beermaverick-bitter-gold",
     "sommeMoments_ms": 0.489
    },
    {
     "houblon": "beermaverick-nugget",
     "sommeMoments_ms": 0.489
    },
    {
     "houblon": "beermaverick-ariana",
     "sommeMoments_ms": 0.487
    },
    {
     "houblon": "beermaverick-cashmere",
     "sommeMoments_ms": 0.485
    },
    {
     "houblon": "beermaverick-celeia",
     "sommeMoments_ms": 0.481
    }
   ]
  }
 }
}
```
