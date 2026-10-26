OK — fabrique creerMoteur, caches bornés, substitutes ×10 froid 85,9 ms, chaud 5,6 ms

## Mesures avant

Commande (racine, un processus par échelle, HEAD ac895ac3 sans la fabrique : le banc retombe sur la méthode i0, singletons mutés) :
`npx vite-node scripts/bench-hop-v4.ts -- --echelle=K --json` (K = 1, 5, 10). Journaux : `%TEMP%\t5\avant-k*.json`.
Froid = premier appel du processus (plus strict que i0, où `substitutes` passait après le balayage) ; chaud = médiane de 5 appels.

| Mesure (ms) | ×1 | ×5 | ×10 |
|---|---|---|---|
| houblons / stock | 318 / 16 | 1 590 / 80 | 3 180 / 160 |
| `substitutes` froid | 234,3 | 758,4 | 1 469,5 |
| `substitutes` chaud | 5,92 | 20,92 | 42,64 |
| `simulerCas` léger froid / chaud | 16,96 / 0,27 | 16,79 / 0,33 | 14,71 / 0,26 |
| `simulerCas` complet froid / chaud | 13,23 / 2,95 | 13,24 / 2,48 | 14,29 / 2,36 |
| `lireBiere` froid / entrées différentes | 6,13 / 0,66 | 7,09 / 0,65 | 6,46 / 0,64 |
| `suggerer` froid / dose changée (candidats) | 48,6 / 10,8 (9) | 167,3 / 58,9 (45) | 328,0 / 128,3 (90) |
| `proposer` froid (voies évaluées) | 332,3 (230) | 284,3 (794) | 493,6 (1 499) |
| `remplacants` froid | 10,6 | 23,9 | 57,4 |
| `comparer` 12 houblons | 49,7 | 37,6 | 46,0 |

Empreintes des résultats (sha1 tronqué, pour « mêmes chiffres ») : ×1 substitutes `9ef77aa53ecc`, simulerCas `afccc77cc2f5`, lireBiere `d4f7bf74a0c5`,
suggerer `85aab6303283`, proposer `b42c299e6ebf`, remplacants `81efdc544613`, comparer `e3c7a866d979` ; ×10 substitutes `fa6038e41be0`.

## Mesures après

Même commande (`npx vite-node scripts/bench-hop-v4.ts -- --echelle=K --json`), le jeu ×K est construit **par la fabrique** (aucun singleton
muté). Journaux : `%TEMP%\t5\apres-k*.json`. Le banc rend trois froids pour `substitutes` :
- `froidProcessus` : premier appel du processus (code pas encore compilé), sur un moteur neuf ;
- `froid` (lu par le critère) : médiane de trois premiers appels sur trois moteurs neufs (copies des tableaux, donc caches vides),
  code déjà compilé. C'est le froid d'un moteur recréé quand le stock change. i0 mesurait son froid après le balayage (code compilé ET
  fiches déjà lues) : ce froid est au moins aussi strict que le sien ;
- avant (HEAD) : un seul froid possible, celui du processus. La colonne à comparer à l'avant est donc `froidProcessus`.

| Mesure (ms) | ×1 avant → après | ×5 avant → après | ×10 avant → après |
|---|---|---|---|
| `substitutes` froid du processus | 234,3 → 27,1 | 758,4 → 92,0 | 1 469,5 → 150,5 |
| `substitutes` froid, moteur neuf (médiane de 3) | — → 20,3 | — → 48,6 | — → **85,9** (98,6 / 85,9 / 73,1) |
| `substitutes` chaud (médiane de 5) | 5,92 → 2,48 | 20,92 → 2,06 | 42,64 → **5,63** (max 10,9) |
| `simulerCas` léger froid / chaud | 16,96 / 0,27 → 11,9 / 0,37 | 16,79 / 0,33 → 14,4 / 0,22 | 14,71 / 0,26 → 15,3 / 0,25 |
| `simulerCas` complet froid / chaud | 13,23 / 2,95 → 14,4 / 2,64 | 13,24 / 2,48 → 14,0 / 2,55 | 14,29 / 2,36 → 13,2 / 2,62 |
| `lireBiere` froid / entrées différentes | 6,13 / 0,66 → 3,33 / 0,68 | 7,09 / 0,65 → 3,27 / 0,60 | 6,46 / 0,64 → 3,43 / 0,72 |
| `suggerer` froid / dose changée | 48,6 / 10,8 → 14,4 / 13,0 | 167,3 / 58,9 → 79,2 / 61,5 | 328,0 / 128,3 → 153,6 / 124,6 |
| `proposer` froid | 332,3 → 258,1 | 284,3 → **661,7** | 493,6 → **1 087,9** |
| `remplacants` froid | 10,6 → 1,9 | 23,9 → 3,9 | 57,4 → 4,5 |
| `comparer` 12 houblons | 49,7 → 24,2 | 37,6 → 18,3 | 46,0 → 17,7 |

Mêmes chiffres : empreintes identiques avant/après pour `substitutes` (×1 `9ef77aa53ecc`, ×5 `2ca0acf56988`, ×10 `fa6038e41be0`),
`simulerCas`, `lireBiere`, `suggerer`, `remplacants`, `comparer` à toutes les échelles, et pour `proposer` à ×1 (`b42c299e6ebf`).
`proposer` diffère à ×5 et ×10 (×10 : 13 voies avant, 14 après) : voir Doutes.

## Critères

- G1 `node …/t5-causes/verifier.mjs` → `banc ×10 : substitutes froid 85.5 ms, chaud 3.54 ms` ; `tests du prototype : 138/138 verts` ; **CAUSES OK** (1 essai).
- G2 `node prototypes/houblons-v4/parcours/outils/batterie.mjs` → CONSTRUIT OK (9 pages), TYPES OK, FONCTIONS INTACTES OK, ROUTES OK (8/8),
  PONTS OK (recalcul médian 0,3 ms), PARCOURS OK (29 gestes à 390 et à 1280) ; **BATTERIE OK 46/46** (1 essai ; elle a reconstruit la maquette).
- G3 `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` → **ETATS OK (141/141)** ; 13 voulus non rejoués (comme avant) (1 essai).
- G4 `npm run build` → code 0, **built in 20.10s** (1 essai).
- Tests du prototype : 138/138 (131 avant + 7 neufs, `tests/fabrique.test.ts`). Aucun caractère de contrôle dans les fichiers écrits (M10).

## Fichiers écrits

- `src/domain/hopIndex/v4/` : `moteur.ts` (neuf : `creerMoteur`, type `Moteur`), `api.ts` (neuf : l'ancien index, API du moteur par
  défaut), `index.ts` (api + fabrique + `DONNEES_FIXTURE`, `Lru`, `nombreFr`), `data.ts` (contexte par moteur : données, index, caches ;
  `CATALOGUE`/`STOCK` restent exportés comme fixtures, lus par aucun module), `lru.ts` (neuf : cache borné à deux générations),
  `nombres.ts` (neuf : `Intl.NumberFormat` en cache par jeu d'options), et `cases`, `fiches`, `hops`, `profil-simule`, `quickAdd`,
  `recipe`, `substitution`, `voies`, `yeast` (lisent le contexte actif ; caches par moteur et bornés).
- Maquette : `parcours/src/moteur/donnees.ts` (moteur créé par la fabrique ; champ neuf `fiches`), `moteur/index.ts` (11 appels via
  `moteur()`), `ecrans/dryhopper/mesures.ts` et `ecrans/comparer/valeurs.ts` (formateur en cache). `maquettes/parcours/` reconstruite par G2.
- `prototypes/houblons-v4/tests/fabrique.test.ts`, `scripts/bench-hop-v4.ts`, ce RESULTAT.md. `functions/` intact.

## Ce qui a été fait (mesuré, profil à l'appui)

1. Fabrique : chaque fonction de l'API, prise sur un moteur, pose son contexte le temps de l'appel (le moteur est synchrone). Mêmes
   tableaux = même contexte (les caches ne dépendent que des données) ; le moteur par défaut est celui des fixtures, partagé avec les écrans
   qui importent encore le moteur directement.
2. Caches bornés, clés stables : bases simulées (4 096), formes, traits de substitution, rôles, produits, familles décrites, apports des
   voies (4 096), échelles de style (64), prédicteur V5.5 préparé une fois par moteur. Le premier LRU (supprimer puis remettre à chaque
   lecture) coûtait 15 ms par appel chaud à ×10 : remplacé par deux générations (une lecture = un `Map.get`).
3. `substitutes` en deux temps : score et clés pour tous ; familles, dose et raison pour les 8 rendus seulement (la dose des candidats en
   stock reste calculée : elle décide de « stock suffisant »). Rang numérique et tri par nom des seuls ex aequo de la limite. Recouvrement
   stock × catalogue remplacé par un index.
4. t2 point 2 : l'hypothèse se vérifie, et ce n'était pas la seule cause. Les termes passaient bien un tableau stable, mais le calcul du
   « premier mot » créait une variété neuve sans cache (12 × fiches appels par houblon), et `describeFamilies` était refait par `hopRole`.
   Correction chez l'appelant (`hops.ts`) : cache par moteur, une passe par fiche (masque de familles), résultat mis en cache par variété.
   Équivalence vérifiée sur les 318 variétés × 12 familles contre `hopDescriptorEvidence` seul (test). t2 point 3 : les quatre sites
   passent par un formateur en cache.

## Doutes et limites

- `proposer` à ×5 et ×10 : empreinte différente, et froid plus lent (×10 : 494 → 1 088 ms). Cause probable, non prouvée : à HEAD le banc
  (méthode i0) ajoutait le stock cloné à `STOCK` sans l'ajouter à `ENGINE_DATA.lots` ; la fabrique, elle, construit les lots de tout le
  stock, donc le moteur connaît la forme des 160 articles. À ×1 (données réelles), `proposer` est identique, et plus rapide (332 → 258 ms).
  Autre piste à mesurer : la borne de 4 096 apports (deux générations de 2 048) pourrait faire recalculer `proposeVoies` à ×10.
- Le froid du critère (85,9 ms) est mesuré code compilé ; le premier appel du processus reste à 150 ms à ×10 (compilation à froid).
- `normaliser` (hops.ts) recopie `text` de `functions/src/hopExtrapolationCore.ts` (non exportée), pour le seul premier mot des fiches.
  Le test d'équivalence échoue si le serveur change cette règle.
- Les connaissances V5.5 (axes, levures, modèle, solveur) restent communes à tous les moteurs : seuls les fiches et le stock sont injectés.
- Les écrans hors de ma voie (fiche, suggérer, comparer…) importent encore les fonctions du moteur par défaut : sur d'autres données que
  les fixtures, ils liraient les fixtures. Ils doivent passer par `moteur()` de l'adaptateur.
- `describeFamilies` rend désormais un objet partagé, gardé en cache : il ne faut pas le modifier.

DÉCISION À PRENDRE : faut-il que les écrans de la maquette qui importent le moteur v4 directement (une vingtaine de fichiers) passent par
`moteur()` de l'adaptateur ? Options : (a) une voie dédiée les fait passer par l'adaptateur ; (b) on laisse le moteur par défaut tant que
l'app n'injecte que les fixtures. Recommandation : (a), avant que T-app injecte le vrai stock.

CONNAISSANCE : à ×10 (3 180 houblons), le coût froid de `substitutes` venait des preuves documentaires (premier mot sans cache,
`describeFamilies` refait par `hopRole`) et le coût chaud d'un LRU qui supprimait puis remettait chaque entrée à chaque lecture.
`cerveau/metier/cout-calcul-moteur.md` est à mettre à jour avec le tableau ci-dessus.

LEÇON PROPOSÉE : un banc qui mute des singletons pour grossir les données peut en oublier une partie (ici `ENGINE_DATA.lots`) : construire
le jeu agrandi par la même voie que l'app (la fabrique), sinon l'avant et l'après ne mesurent pas les mêmes données.
