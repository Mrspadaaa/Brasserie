ECHEC — en cours (mesures avant prises, changement non fait)

## Mesures avant

HEAD 91a8ea33 plus le travail en cours de t8-donnees (moteur.ts), le 25.10, i5-14600KF, Node 24. Banc `npx vite-node scripts/bench-hop-v4.ts -- --echelle=K --json`.

proposer froid ×5 : 644.37 ms
empreinte de proposer ×1 : b42c299e6ebf

| Banc | ×1 | ×5 |
|---|---|---|
| proposer : froid · chaud · évaluées · voies · empreinte | 293,01 ms · 0,03 · 230 · 14 · `b42c299e6ebf` | 644,37 ms · 0,03 · 794 · 14 · `d1e6beb5a4a8` |
| suggerer : froid · chaud · dose changée · empreinte | 17,59 · 0,55 · 13,21 ms · `85aab6303283` | 66,05 · 1,00 · 60,12 ms · `675ac38ef712` |
| remplacants : froid · empreinte | 2,34 ms · `81efdc544613` | 3,76 ms · `d9215c80c21e` |
| substitutes : froid · empreinte | 14,32 ms · `9ef77aa53ecc` | 54,83 ms · `2ca0acf56988` |
| simulerCas · lireBiere · comparer (empreintes) | `afccc77cc2f5` · `d4f7bf74a0c5` · `e3c7a866d979` | `afccc77cc2f5` · `d4f7bf74a0c5` · `e3c7a866d979` |

`npm run check:hop-perf` (jeu ×1, stock 80) : PERF-OUTILS ECHEC (6). Lignes de Suggérer :
- toucher | ouvrir Suggérer par son adresse, sans préchauffage | méd 862,10 ms · p95 1 039,16 ms | DÉPASSÉ
- toucher | ouvrir Suggérer après le préchauffage (cache) | méd 0,03 ms · p95 0,07 ms | OK
- repos | tranche de préchauffage : voies de Suggérer (proposer + leviers levure) | méd 1 112,87 ms · p95 1 321,64 ms | DÉPASSÉ
- repos | dont proposer | méd 679,84 ms · p95 849,76 ms ; dont leviers levure | méd 428,07 ms · p95 526,62 ms
- repos | le tout : premier écran + tout le préchauffage | méd 1 124,48 ms · p95 1 346,37 ms | DÉPASSÉ

## Mesures après

(à venir)
