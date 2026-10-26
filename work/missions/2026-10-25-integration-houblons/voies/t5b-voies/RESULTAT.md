ECHEC — G1 : proposer froid ×5 644 → 336 ms (÷1,9), tiers hors de portée sans recipe.ts ni functions/

## Mesures avant

Base : HEAD 91a8ea33 plus le travail en cours de t8-donnees (moteur.ts, commité depuis en d8baab0e), le 25.10, i5-14600KF, Node 24.
Banc : `npx vite-node scripts/bench-hop-v4.ts -- --echelle=K --json`.

proposer froid ×5 : 644.37 ms
empreinte de proposer ×1 : b42c299e6ebf

| Banc | ×1 | ×5 |
|---|---|---|
| proposer : froid · chaud · évaluées · voies · empreinte | 293,01 ms · 0,03 · 230 · 14 · `b42c299e6ebf` | 644,37 ms · 0,03 · 794 · 14 · `d1e6beb5a4a8` |
| suggerer : froid · chaud · dose changée · empreinte | 17,59 · 0,55 · 13,21 ms · `85aab6303283` | 66,05 · 1,00 · 60,12 ms · `675ac38ef712` |
| remplacants : froid · empreinte | 2,34 ms · `81efdc544613` | 3,76 ms · `d9215c80c21e` |
| substitutes : froid · empreinte | 14,32 ms · `9ef77aa53ecc` | 54,83 ms · `2ca0acf56988` |
| simulerCas · lireBiere · comparer (empreintes) | `afccc77cc2f5` · `d4f7bf74a0c5` · `e3c7a866d979` | idem |

`npm run check:hop-perf` (jeu ×1, stock 80) : PERF-OUTILS ECHEC (6). Lignes de Suggérer :
- toucher | ouvrir Suggérer par son adresse, sans préchauffage | méd 862,10 ms · p95 1 039,16 ms | DÉPASSÉ
- toucher | ouvrir Suggérer après le préchauffage (cache) | méd 0,03 ms · p95 0,07 ms | OK
- repos | tranche de préchauffage : voies de Suggérer (proposer + leviers levure) | méd 1 112,87 ms · p95 1 321,64 ms | DÉPASSÉ
- repos | dont proposer | méd 679,84 ms · p95 849,76 ms ; dont leviers levure | méd 428,07 ms · p95 526,62 ms
- repos | le tout : premier écran + tout le préchauffage | méd 1 124,48 ms · p95 1 346,37 ms | DÉPASSÉ

## Mesures après

Code final, mêmes commandes, après le commit de T8 (le banc n'a pas bougé pour autant : mêmes jeux, mêmes empreintes).

| Banc | ×1 | ×5 |
|---|---|---|
| proposer : froid · chaud · évaluées · voies · empreinte | 165,23 ms · 0,03 · 230 · 14 · `b42c299e6ebf` | 352,86 ms (verifier : 335,88) · 0,05 · 794 · 14 · `d1e6beb5a4a8` |
| suggerer : froid · empreinte | 14,39 ms · `85aab6303283` | 84,81 ms · `675ac38ef712` |
| remplacants · substitutes (empreintes) | `81efdc544613` · `9ef77aa53ecc` | `d9215c80c21e` · `2ca0acf56988` |
| simulerCas · lireBiere · comparer (empreintes) | `afccc77cc2f5` · `d4f7bf74a0c5` · `e3c7a866d979` | idem |

**Toutes les empreintes sont identiques** à l'avant, à ×1 et à ×5.

`npm run check:hop-perf` : PERF-OUTILS ECHEC (6), les mêmes six dépassements. Lignes de Suggérer :
- toucher | ouvrir Suggérer sans préchauffage | méd 204,03 ms · p95 305,60 ms | DÉPASSÉ (862 → 204 ms, ÷4,2)
- repos | tranche voies de Suggérer | méd 327,82 ms · p95 587,61 ms | DÉPASSÉ (1 113 → 328 ms, ÷3,4)
- repos | dont proposer | méd 227,30 · p95 463,38 ms (680 → 227, ÷3) ; dont leviers levure | méd 107,70 · p95 129,20 ms (428 → 108, ÷4)
- repos | le tout | méd 340,40 ms · p95 648,03 ms | DÉPASSÉ (budget 625 : manqué de 23 ms au p95)

## Ce qui a changé (52 lignes de diff)

- `src/domain/hopIndex/v4/yeast.ts` : `predictionDe(triplet)`, la prédiction V5.5 d'un triplet (houblon, lot, levure, moment, dose,
  température, contact) en cache `Lru` **dans le moteur** (`local('levure:predictions')`, contexte de ses données ; aucun état
  global), borne `bornePredictions()` = 8 × borneHoublons (8 192 au moins). Clé : le triplet entier en JSON. La levure seule
  (`yeastOnly`) y passe. Placé ici parce que voies.ts importe déjà yeast.ts (pas d'import circulaire).
- `src/domain/hopIndex/v4/voies.ts` : l'apport d'un ajout (à sa dose et à dose nulle) et les conflits d'une voie lisent
  `predictionDe` (un même triplet était prédit deux fois : l'apport puis les conflits ; la dose nulle une fois par dose).
  Les familles citées d'une variété : un masque en cache dans le moteur (`citations` lu une fois au lieu de 12 × par appel).
  Le tri des houblons à acheter : une fois par appel (il était refait pour chaque ajout remplacé).
- Ainsi les leviers levure (un second `proposeVoies`) relisent tout ce que proposer a calculé : 428 → 108 ms.
- Essayé puis retiré : un `Intl.Collator('fr')` partagé à la place de `localeCompare(…, 'fr')` (aucun gain mesuré).

## Pourquoi le tiers n'est pas atteint (mesuré, L20)

Moteur neuf, ×5, proposer seul, à froid (`diagnostic-proposer.ts` et profil CPU, dossier de la voie) :
- 1 050 prédictions V5.5 encore nécessaires (une par houblon × moment × dose essayée, plus la dose nulle), ≈ 0,16 ms chacune :
  ≈ 165 ms, dans `predictPrepared` (functions/, intact par consigne). Aucune n'est en double : chaque dose est évaluée pour
  choisir la meilleure, et la sauter changerait le classement.
- 15 `recipeProfile` (avant, puis le profil après chacune des 14 voies retenues), ≈ 4 ms chacun quelle que soit la taille du
  catalogue (`mesure-profil.ts`) : ≈ 60 ms. `predictHopRecipe` (functions/) prépare ses données et un prédicteur neuf à chaque
  appel ; `recipe.ts` n'est pas dans « Possède ».
- `citations` sur 1 590 fiches du catalogue (tri des achats) ≈ 25 ms (hops.ts, hors « Possède ») ; le reste de voies.ts ≈ 60 ms.
- Plancher à résultats égaux sans toucher recipe.ts, hops.ts ni functions/ : ≈ 250 ms ; le critère demande 214,8.
- Chaud (cache du moteur rempli), proposer tombe à ≈ 70 ms : le cache tient son rôle dès le second appel.

## Critères

- G1 `verifier.mjs` : **VOIES ECHEC (1)** — « proposer froid ×5 335.88 ms > 214.8 (le tiers de 644.37) » ; empreinte ×1 tenue
  (aucune faute), « tests du prototype : 152/152 verts » (dont le test neuf). 1 essai (le seuil ne dépend pas d'un réglage).
- G2 `batterie.mjs` : **BATTERIE OK 46/46** (1 essai). Construite avec la version au collateur, retiré ensuite : même ordre ;
  maquette reconstruite ensuite sur le code final (`construire.mjs` : CONSTRUIT OK, 9 pages).
- G3 `controle-etats.mjs` : **ETATS OK (141/141)** ; 13 voulu(s) non rejoué(s) (1 essai).
- `npm run build` : sortie 0 (avertissement de taille de chunk, préexistant).

## Fichiers écrits

- `src/domain/hopIndex/v4/voies.ts`, `src/domain/hopIndex/v4/yeast.ts`
- `prototypes/houblons-v4/tests/voies-cache.test.ts` (neuf, 3 tests : les leviers ne prédisent de neuf que la levure seule ;
  mêmes voies quel que soit l'ordre proposer/leviers ; borné et propre à chaque moteur)
- `prototypes/houblons-v4/maquettes/parcours/` (reconstruite, aucun fichier suivi modifié)
- Dossier de la voie : `RESULTAT.md`, `diagnostic-proposer.ts`, `mesure-profil.ts` ; journaux dans `%TEMP%/t5b/`.
- Non touchés : moteur.ts, src/ui/hopIndex, profil-simule.ts, lru.ts, functions/. Ni Gemini ni donnée réelle.

## Doutes et limites

- Mesures prises pendant que t8 tournait (son commit est tombé entre l'avant et l'après) ; le froid ×5 a varié de 327 à 353 ms
  sur quatre passes : l'écart au seuil (≥ 110 ms) dépasse le bruit.
- Le test neuf ajoute une ligne de stock vide par moteur pour qu'un moteur réutilisé par empreinte (T8) ne lui donne pas un
  cache déjà rempli.
- Le cache rend le même objet de prédiction à plusieurs lecteurs : `checkHopExclusions` et l'apport le lisent sans le modifier
  (vérifié dans le code) ; un futur lecteur qui le modifierait corromprait le cache.

DÉCISION À PRENDRE : le tiers de G1 demande de toucher hors de « Possède ». Options : (a) accepter ÷1,9 à froid (÷4 sur
Suggérer sans préchauffage, ÷3,4 sur la tranche) et laisser T7 (worker) sortir le reste du fil principal ; (b) ouvrir
`recipe.ts` à une voie suivante pour que `recipeProfile` réutilise le prédicteur préparé du moteur (≈ −50 ms, à vérifier
contre `predictHopRecipe` à résultats égaux), plus un cache des citations dans hops.ts (≈ −25 ms) : on approcherait 250 ms,
toujours au-dessus de 215 ; (c) moins de doses essayées par houblon et moment, ce qui change les voies (empreinte). Je
recommande (a), plus (b) seulement si le worker tarde : aucune option propre n'atteint le tiers à résultats égaux.

CONNAISSANCE : proposeVoies à froid (×5, 794 voies) se divise ainsi après #178 : ≈ 1 050 prédictions V5.5 à 0,16 ms (dans
functions/), 15 recipeProfile à ≈ 4 ms (prédicteur reconstruit par predictHopRecipe à chaque appel), citations ≈ 25 ms ;
plancher ≈ 250 ms à résultats égaux. Chaud : ≈ 70 ms. Les leviers levure, qui relisent le cache de proposer : 108 ms.

LEÇON PROPOSÉE : avant de fixer un seuil de gain (« divisé par trois »), mesurer la part du temps qui reste dans les fichiers
que la voie possède ; ici le plancher hors « Possède » (≈ 250 ms) dépassait déjà le seuil (215 ms).
