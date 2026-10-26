ECHEC — coût de Suggérer : le toucher passe sous HEAD (201 contre 220 ms) mais le 1er calcul à froid reste à 409 ms (HEAD 206) ; D106 2 et 3 faits, B5 à 163,0 ko (hors de ma voie)

## Ce qui est fait
1. **Les remplacements sortent du premier affichage (D106, 1, option c).**
   - Option neuve `remplacements: false` de `proposeVoies` (`voies.ts`). Défaut inchangé à l'octet près (testé).
   - Calcul neuf `proposerRapide` : l'adaptateur et la table des calculs (`parcours/adaptateur.ts`, `calculs.ts`). `proposer` reste l'appel complet : mêmes résultats, mêmes empreintes (3b946ac8a4ff), et c'est lui que lit Ma bière.
   - Suggérer (`suggerer/index.tsx`, `suggerer/differe.ts`) s'ouvre sur `proposerRapide`, puis demande `proposer` au repos du navigateur (`requestIdleCallback`, sinon une tâche suivante) une fois l'écran peint. Le groupe « Remplacer … » arrive alors à sa place, avant le dry hop et la levure. Tant qu'il manque, rien n'est inventé : aucune roue, aucune attente écrite.
   - **Les leviers levure** (dry hop actif du stock et souches) ne lisent ni remplacement, ni pool « à acheter », ni autre moment : l'adaptateur les calcule avec `remplacements: false, maxBuy: 0, moments: ['dryActive']`. Même sortie, aux champs `rank` et `tieWith` près, que l'écran ne lit pas (`preuves/ecart-rapide-complet.txt` : « sans rank ni tieWith : true » sur 5 visées ; test `coutD106`). Gain : leviers 114,7 ms (HEAD) → 80,1 ms.
2. **Départage, option (a) (D106, 2).** Les trois tests k1, k2, k3 de `departage.test.ts` : `tete` = les voies de la première voie qui partagent avec elle conflits, débordement, distance et clé de départage, donc avant l'ordre du pool. Le moteur ne change pas. Verts.
3. **L'usage « arôme » à 60′ dans Substituer (D106, 3).** `substitution.ts` : un remplaçant d'usage « arôme » (Beer Maverick) recule après les amérisants et doubles usages, avec la raison écrite « usage « arôme » (Beer Maverick), cher pour amériser » (même lecture que `rangUsage` de Suggérer). Même exception qu'avant pour l'original : produit d'arôme, rôle aromatique, ou usage « arôme » lui-même (choix délibéré du brasseur).
   - **Témoin D105 à la lettre** : `scripts/eval-hop/f4-top10.ts` → « usage arôme dans les 10 premiers : 0 » (Trident, Yeoman, Helios, Centennial, Magnat, Zenia, Bravo, Warrior, Millennium, Phoenix). `substitution.test.ts` lit maintenant l'usage « arôme » ET le rôle. Falconer's Flight, Altus, Akoya, Loral, Sequoia Blend portent la démotion (test `coutD106`).
   - Conséquence à connaître : dans le stock de S1, seuls Motueka et Galaxy ne sont plus démotés. Nelson Sauvin, Sabro, Idaho 7 et Hallertau Blanc (usage « arôme ») reculent derrière eux ; Citra cryo (95) vient en tête des démotés. Le test « stock d'abord » en tient compte (Motueka ouvre la liste, stock insuffisant pour 46 g : « stock d'abord » ne passe jamais devant un palier meilleur).
   - Banc D, avant (`banc/banc-avant.json` = `banc-final` de f2, sha 7e8f15d8…) et après (`banc/banc-apres.json`, sha256 8e4b7b26…) : composite 60′ 0,150 → 0,151 (sans Beer Maverick 0,107 → 0,1015) ; P1a 0,120 → 0,109 ; P1b 0,094 = ; P3 0,235 → 0,250 ; P1c dry hop 0,374 = ; P2 0,627, K4 1, K5 265 =. Pas de perte mesurée (le banc reste faible : n de 33 à 97).

## Critères
- **`npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests`** : **94 fichiers, 903 tests verts, 0 rouge** (`preuves/vitest-final.txt`). Mais le code de sortie est 1 : « Unhandled Error : [vitest-worker] Timeout calling "onTaskUpdate" » (une erreur d'IPC de vitest sous charge, vue sur toutes mes passes complètes ; aucun test n'échoue). À relancer sur une machine au repos.
  - Tests neufs : `tests/unit/hopIndexV4/coutD106.test.ts` (7), `suggererRemplacementsDifferes.test.tsx` (2, repos du navigateur piloté par le test : déterministe sur 3 passes). Contrôle négatif (L13) : avec `proposer` complet au premier rendu, le test « moins résineux » échoue (« expected [ 'remplacer', 'levure' ] to not include 'remplacer' »).
  - Empreintes mises à jour (`client-async.test.ts`, `worker-calculs.test.ts`) : `remplacants` e6b71ac8e04d → 5c602de7c804, `substitutes` c6399d7b6596 → 289ca4efaed4 (la démotion). `proposer` et `suggerer` ne bougent pas.
  - Pack régénéré (`vite-node scripts/build-pack.ts` depuis `prototypes/houblons-v4/`) : `pack.test.ts` vert. Fichiers hors de ma liste, comme pour f2.
- **`npm run build`** : vert (`tsc` compris), aussi avec `VITE_HOP_V4=on`.
- **B5** : `check-hop-budget.mjs --dist dist --chunk-outils profil-simule` → **163,0 ko pour 162 : DÉPASSÉ** (162 986 octets gzip : profil-simule 148 290 + hopExtrapolationBootstrap 8 172 + styleSelection 6 524). **Ma part : 44 octets** (148 246 sans mes deux changements du moteur ; `differe.ts`, `proposerRapide` et le reste vivent dans d'autres morceaux : même taille avec et sans). Les 2,4 ko de plus que le 160,6 ko de f2 viennent d'autres voies de l'arbre commun. Aucun budget relevé. B1 et B2 dépassent comme avant (921 et 773 ko : le build compte l'arbre entier).
- **Phares (L14)** : `scripts/eval-hop/f2-borne.ts` → « 21C agrumes : attendus 8, manquants aucun » ; « 16D floral : 6, aucun » ; « 16D moins résineux : 8, manquants Mosaic, Cascade ». Mêmes résultats que f2.
- **Fluidité** : voir le tableau. Objectif « au niveau de HEAD au premier affichage » : **tenu au toucher, non tenu au premier calcul à froid**.

## Tableau, en millisecondes (médiane de 3 processus ; HEAD = les chiffres de f2, même machine)
Banc volume (`scripts/eval-hop/f4-banc.ts`, copie de `bench-hop-v4.ts` avec `--rapide` ; `perf-leviers/`, `preuves/tableau-bench-leviers.txt`) :
| mesure | HEAD (f2) | f2 final | **f4** | écart / HEAD |
|---|---|---|---|---|
| ouvrir Suggérer sans préchauffage, méd (p95) | 219,85 (251,52) | 271,88 (332,54) | **201,01 (223,67)** | −18,8 (−27,9) |
| proposer au repos (tranche), méd | 175,24 | 430,28 | **307,70** | +132,5 |
| leviers levure au repos, méd | 114,68 | 143,98 | **80,09** | −34,6 |
| tranche « voies de Suggérer », méd (p95) | 301,00 (544,38) | 567,28 (958,57) | **397,77 (689,99)** | +96,8 (+145,6) |
| les remplacements, au repos après le premier affichage (`proposer` complet), méd (p95) | | | 228,18 (278,82) | hors du premier affichage |
| premier écran + préchauffage, sans l'appel différé, méd | 316,42 | 579,98 | **411,74** | +95,3 |
Même passe, sans `--rapide` (l'appel complet au premier affichage, avec les leviers réduits) : toucher 217,39 (282,00), tranche 511,02.

Moteur seul (`scripts/eval-hop/f4-perf.ts`, `f2-perf.ts`) :
| mesure | HEAD | f2 final | **f4 premier affichage** | f4 appel complet |
|---|---|---|---|---|
| Suggérer 21C à froid (1er appel du processus) | 205,8 | 449,4 | **409,1** | 445,8 |
| Suggérer 21C à chaud | 85,8 | 112,8 | **96,9** | 112,9 |
| stout « plus floral » à chaud | 70,2 | 134,4 | **113,9** | 132,2 |
| remplacements au repos, après le premier affichage, à froid / à chaud | | | 131,4 / 107,4 | |

## Ce que j'ai trouvé, et ce que f2 avait mal estimé
- **Les remplacements ne portent pas « deux tiers » du surcoût** : sauter leur évaluation fait gagner 11 % à froid (446 → 409) et 14 % à chaud (113 → 97). Le reste est l'évaluation des ajouts de 80 houblons × 4 moments × 3 doses (B1 elle-même).
- **Le surcoût à froid vient des apports V5.5 du pool** (`apport` → `predictionDe`, ~960 prédictions, ~250 ms). `scripts/eval-hop/f4-froid.ts` : avec les apports déjà chauffés par un premier appel (autre visée, même volume, même levure, même durée d'ébullition ; la clé de l'apport ne contient ni la direction ni les grammes du Nugget), le premier appel coûte **205 ms, comme HEAD**. Mes remplissages de familles et de citations (24 et 13 ms) ne pèsent rien.
- **Dans l'app, le froid se paie déjà au repos** quand la visée est posée dans Ma bière : Ma bière calcule `proposer` (complet, sous `useDeferredValue`) pour sa ligne de résumé, ce qui chauffe les apports du pool. Il ne reste visible que pour une entrée directe sur Suggérer.
- **Un remplacement est rare dans la liste** : en 21C (agrumes, et floral + agrumes − résineux) et en 16D (floral + tropical) l'appel complet en garde 0 (l'évaluation reste payée, la liste ne les montre pas) ; en 16D « moins résineux », 9. Le premier affichage et l'appel complet donnent donc la même liste principale dans 4 cas sur 5 ; au 5e (16D floral), le premier affichage a 14 lignes et l'appel complet 13 + 1 remplacement (`preuves/ecart-rapide-complet.txt`). Effets, ordre et barres des voies communes : identiques à l'octet.

## DÉCISION À PRENDRE 1 : le premier calcul à froid (409 ms contre 206)
Options :
- (a) **Chauffer les apports au repos, là où la recette est connue** : à l'affichage de l'étape Houblons ou de Ma bière, une tâche au repos `calcul().prechauffer('proposerRapide', recette, direction)` (la direction n'importe pas, la clé de l'apport n'en dépend pas). `precharge.ts` n'a pas de recette : l'appel vient d'un écran qui n'est pas dans ma voie (`maBiere/` ou `EtapeHoublons`). Ramène le froid à ~205 ms ; le coût passe au repos (~300 ms, hors du toucher) ;
- (b) accepter : l'entrée directe sur Suggérer paie ~200 ms de plus une seule fois par session et par volume/levure ; Ma bière avec visée l'a déjà chauffé ;
- (c) borner le pool à moins de 80 : refusé tant que Strata (stout « moins de résineux ») compte (f2).
**Recommandation : (a)**, une ligne dans l'étape Houblons, avec la mesure de `f4-froid.ts` (`--chauffe=apports`) comme témoin.

## DÉCISION À PRENDRE 2 : B5 à 163,0 ko pour 162
Hors de ma voie : mes changements pèsent 44 octets. L'arbre commun a pris 2,4 ko depuis les 160,6 ko de f2 (une autre voie, ou des données). Le pilote tranche : relever (l'utilisateur a déjà dit « C'est ok » pour 160,6 → 162, D104) ou trouver ce qui a grossi (`git diff --stat` des fichiers du morceau profil-simule).

## DÉCISION À PRENDRE 3 : le banc de fluidité mesure `proposer`, pas le premier affichage
`scripts/bench-hop-v4.ts` (lignes 207, 225, 226) appelle `adapter.proposer`, donc `npm run check:hop-perf` ne voit pas le gain du premier affichage (il voit l'appel complet). Remplacer ces trois appels par `adapter.proposerRapide` (une ligne : `PROPOSER` dans `scripts/eval-hop/f4-banc.ts`). Le banc n'est pas dans ma liste : je ne l'ai pas modifié ; ma copie donne les chiffres ci-dessus. Même remarque pour la Coquille de la maquette (`prototypes/houblons-v4/parcours/src/coquille/Coquille.tsx`), qui préchauffe `proposer`.

## Écarts, doutes et limites
- **Fichiers hors de ma liste que j'ai touchés** : `src/ui/hopIndex/parcours/adaptateur.ts` et `calculs.ts` (le client des calculs : `proposerRapide`, leviers réduits) ; `prototypes/houblons-v4/tests/{substitution,client-async,worker-calculs}.test.ts` et les deux `pack-*.json` (régénérés), tous pour la démotion.
- **Ma bière** (`biere/index.tsx`) garde `proposer` complet : sa ligne « Plus floral : 8 voies, 2 faibles » compte aussi les remplacements ; la changer ferait varier ce nombre.
- **Verdicts de Suggérer** (« Atteint / Approche ») : ils lisent toutes les lignes, remplacements compris. Quand le groupe « Remplacer » arrive, un verdict peut changer (une meilleure voie plus loin). Je n'ai pas mesuré combien de fois ; en 16D « moins résineux », la liste principale n'a que 2 lignes. À regarder sur capture.
- **Place réservée** : je n'ai pas réservé de hauteur pour le groupe « Remplacer » ; il s'insère avant le dry hop et la levure, qui descendent. La fenêtre de ma voie s'arrête au code : **aucune capture prise**, la vérification visuelle (le groupe qui arrive, le saut éventuel du dry hop) n'est pas faite.
- **Aucune requête au worker** : le hook `useCalculApres` passe par `useCalcul` (fil principal ou worker) ; non éprouvé avec `?calcul=differe` ni le worker.
- Le chaud est mesuré en changeant le Nugget à chaque appel (le pire cas pour les mémoires), le froid est un premier appel par processus.

## Fichiers
Écrits : `src/domain/hopIndex/v4/voies.ts` (option `remplacements`), `substitution.ts` (démotion) ; `src/ui/hopIndex/parcours/adaptateur.ts`, `calculs.ts` ; `src/ui/hopIndex/suggerer/index.tsx`, `differe.ts` (neuf) ; `tests/unit/hopIndexV4/departage.test.ts`, `coutD106.test.ts` (neuf), `suggererRemplacementsDifferes.test.tsx` (neuf) ; `prototypes/houblons-v4/tests/{substitution,client-async,worker-calculs}.test.ts`, `data/pack-*.json` ; `scripts/eval-hop/f4-{top10,perf,froid,ecart,stock,banc,tableau}.*` ; cette voie : `banc/`, `perf/`, `perf-leviers/`, `preuves/`.

## DEMANDE EXECUTANT :
Rejeu après les décisions 1 et 3 (sur une machine au repos) :
1. `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` ; attendu : `Tests  903 passed (903)` et un code de sortie 0 (sans « Timeout calling onTaskUpdate »).
2. Si le banc est changé (décision 3) : `npm run check:hop-perf` ; rendre « ouvrir Suggérer sans préchauffage », la tranche « voies de Suggérer » et le premier écran, médiane et p95, dans le tableau ci-dessus.
3. `for i in 1 2 3 4 5; do npx vite-node scripts/eval-hop/f4-perf.ts -- --mode=apres; done` ; rendre la médiane de « premier-affichage-froid » (attendu après la décision 1 (a) : ~205).
4. `npx vite-node scripts/eval-hop/f2-borne.ts` ; attendu : « 21C agrumes phares attendus 8, manquants : aucun », « 16D floral … 6 … aucun », « 16D moins résineux … manquants : mosaic, cascade ».
5. `VITE_HOP_V4=on npm run build` puis `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` ; B5 attendu ≤ 162 ko après la décision 2.
6. Capture, téléphone puis ordinateur, de Suggérer avec la visée « moins résineux » : avant l'arrivée du groupe « Remplacer » et après ; ouvrir les deux images et regarder si le dry hop saute.

CONNAISSANCE : Les remplacements « à IBU égal » de Suggérer ne pèsent que ~11 % du coût de `proposeVoies` (446 → 409 ms à froid, 113 → 97 ms à chaud) : le coût de B1 est l'évaluation des ajouts du pool de 80. Son surcoût à froid (~250 ms) est celui des apports V5.5 du pool, dont la clé (`voies:apport`) ne contient que houblon, moment, grammes, volume, levure et durée d'ébullition : ni la visée ni le Nugget. Chauffés une fois pour un volume et une levure, ils ramènent le premier appel à celui de HEAD (205 ms). Dans le stock de S1, l'usage « arôme » démote Nelson Sauvin, Sabro, Idaho 7 et Hallertau Blanc à 60′ : il ne reste que Motueka et Galaxy.
LEÇON PROPOSÉE : Une estimation de gain dans un RESULTAT (« les remplacements portent les deux tiers du surcoût ») se mesure avant de devenir une décision : f2 a proposé un travail de 0,5 jour sur une part de 11 %. Avant de commander l'option, faire dire à l'auteur la mesure qui isole la part (une option qui saute le groupe, chronométrée), comme `remplacements: false` ici.
