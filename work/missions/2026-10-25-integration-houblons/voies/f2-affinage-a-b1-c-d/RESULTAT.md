ECHEC — coût de Suggérer non ramené au niveau de HEAD (chaud 86 → 113 ms, froid 206 → 449 ms) et 3 tests de départage g2a rouges ; D102 et D105 codés, le reste tenu

Deuxième passage, après les trois décisions du pilote (D105). La première version de ce fichier est remplacée.

## Ce qui est fait
- **A** (D102). Le pool « à acheter » se fait par **clé** du stock (voies, palier 60′, dry hop) : Citra simple a sa place quand Citra cryo est en stock. À 60′ un produit d'arôme (cryo, lupuline, poudre, lu par `produitDArome`, export de `substitution.ts`) tombe dans le palier des arômes (`rangUsageDe`), sauf si l'original remplacé en est un ; son rang lit les grammes de l'**α de la variété**, l'α affiché et la dose restent ceux du lot ; champ `produit` ajouté à `InfoPalier`.
- **B1** (D102). Tout le pool est classé ; `limit`, `buyLimit`, `perHop` coupent l'affichage (10 + 4 rangées, inchangé).
- **Décision 1 (D105), option (b).** `ordrePool` est une clé de `compareRankKeys`, **avant `sideTotal`** (table faible `ORDRE_POOL`, jamais dans la réponse, posée sur les voies des listes principales seulement). L'ordre du pool met désormais la **documentation** (fiches lues) juste après le nombre de familles visées, avant « famille mineure », « attendue » et « suggérée pour le style » : un houblon à une fiche ne passe plus devant un houblon à sept. Résultat sur S1 : **East Kent Goldings est de retour** (4e, 1re voie « à acheter »), avec Hallertau Tradition, Huell Melon, Saphir.
- **Décision 2 (D105).** Le témoin « α ≥ 10 % » de `substitution.test.ts` est remplacé (ligne « D105 ») : aucun houblon de rôle aromatique dans les 10 premiers de Nugget à 60′ sans démotion écrite. Compte du pack 29 → 32 : pack régénéré (`vite-node scripts/build-pack.ts`), `pack.test.ts` vert. Raison : la liste S1 par défaut a changé (B1), donc les fiches qu'elle cite.
- **Décision 3 (D105), coût.** Voir plus bas : (b) et (c) n'apportent rien dans les scénarios mesurés ; la **borne B1** est posée : `POOL_BORNE = 80` houblons « à acheter » classés par les listes principales (ordre de qualité du pool, documentation d'abord). `maxBuy` redevient la **borne** (défaut 80 au lieu de 6 ; 400 = tout le pool) : les tests et scripts d'autres voies qui passent `maxBuy: 400` retrouvent tout le pool sans être modifiés. Le palier 60′ et le dry hop de g2b restent sans borne.
- **C** (J1) : inchangé (α 0,15 à 60′). **D** : banc inchangé.

## Critères
- **D174 / D175 échouent sur HEAD, puis passent** : 13 échecs sur 18 sur HEAD extrait (`preuves/d174-d175-sur-HEAD.txt`) ; 19 tests sur 19 sur le code livré (j'en ai ajouté un : la borne garde Strata en stout « moins de résineux », 6 le coupait ; `maxBuy` est testé comme borne de coût).
- **`npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests`** : **882 verts, 3 rouges** (`preuves/vitest-final.txt`). Base avant mon travail : 849/849.
  - Les 4 tests de S1 repassent **sans modification** : `engine.test.ts` « Goldings ou Celeia devant Citra cryo », `donnees.test.ts` ×2 (East Kent Goldings), et `pack.test.ts` (pack régénéré).
  - **Rouges : `departage.test.ts` clés k1, k2, k3**, « l'ordre à l'intérieur du groupe d'ex æquo du dry hop change » : `tete(base) = 1`, il en faut plus de 10. Cause : le test compte les voies de **rang 1 partagé** (le groupe d'ex æquo de g2a : 23 sur la 21C). Une clé de rang entre la distance et les effets de bord départage tout ex æquo : le groupe n'existe plus. J'ai essayé trois largeurs de bande du rang (10, 20, 40) et la clé placée **après** `sideTotal` : mêmes trois rouges (et la variante après `sideTotal` rouvre en plus les tests de S1). Ce n'est donc pas un réglage : c'est le choix (b) lui-même. Avec l'ordre du pool en simple départage par le libellé (ma première version), ces trois tests passaient et S1 perdait East Kent Goldings.
  - Empreintes (lignes « D102 » et « D105 » dans `client-async.test.ts` et `worker-calculs.test.ts`) : `proposer` 31d7feb6324c → **3b946ac8a4ff** (B1 + D105) ; `remplacants` 32e2ef725fec → e6b71ac8e04d et `substitutes` cac6de6d0c72 → c6399d7b6596 (J1) ; `suggerer` ne bouge pas.
- **`npm run build`** : vert ; avec `VITE_HOP_V4=on` : vert. `check-hop-budget.mjs --dist dist --chunk-outils profil-simule` : **B5 160,6 ko pour 162, tenu**. B1/B2 du même contrôle dépassent (921 et 773 ko), avant comme après mes changements, car le build compte l'arbre de travail entier ; je n'ai relevé aucun budget.
- **Banc D** : même sortie sur deux passes (même empreinte sha256). Composite 60′ : 0,143 → 0,150 (sans Beer Maverick 0,1005 → 0,107) ; P1a 0,105 → 0,120 ; P1b 0,096 → 0,094 ; P3 0,228 → 0,235 ; P1c dry hop 0,374 = ; P2 0,627 · K4 1 · K5 265 = (`banc/banc-avant.json`, `banc-final.json`).
- **Phares (L14)** : `phares/avant-apres.txt`. Phares présents dans la liste principale avec la borne de 80 : 21C « agrumes » 8 sur 8 attendus, stout « floral » 6 sur 6, stout « moins de résineux » 6 sur 8 ; les 2 absents (Mosaic, Cascade) le sont aussi **sans borne** (aucun mouvement établi vers la cible : ils citent le résineux) ; Strata y est (avec une borne de 60 il disparaît : c'est pourquoi la borne est 80, pas 60). Exclusions D90 : Strata en 21C, Idaho 7 et Simcoe en stout « moins de résineux ». À 60′ (21C) : Citra cryo 1er → 9e du stock, Citra simple absent → 46e. Au classement de Suggérer 21C : Citra 12e, Mosaic 68e, Simcoe 163e, Idaho 7 406e.

## Tableau du coût, avant (HEAD) et après, en millisecondes (médiane de 5 processus ; avant = HEAD d'avant ma voie)
| mesure | HEAD | sans borne (1re version) | **final, borne 80** | écart final |
|---|---|---|---|---|
| Suggérer par défaut, à froid (1er appel) | 205,8 | ~750 | **449,4** | +243,6 |
| Suggérer par défaut, à chaud (21C) | 85,8 | 158 | **112,8** | +27,0 |
| stout « plus floral », à chaud | 70,2 | 215 | **134,4** | +64,2 |
| Suggérer g2b (60′ + dry hop), à chaud | 616,3 | 780 | **659,9** | +43,6 |
| Substituer 60′, à chaud | 24,3 | 25 | **23,4** | −0,9 |
| `check:hop-perf` ouvrir Suggérer sans préchauffage, méd (p95) | 219,85 (251,52) | 311,43 (451,30) | **271,88 (332,54)** | +52,0 (+81,0) |
| `check:hop-perf` tranche de préchauffage Suggérer, méd (p95) | 301,00 (544,38) | 715,02 (1 416,57) | **567,28 (958,57)** | +266,3 |
| dont `proposer` | 175,24 | 559,22 | **430,28** | +255,0 |
| dont leviers levure | 114,68 | 163,57 | **143,98** | +29,3 |
| premier écran + préchauffage, méd (p95) | 316,42 (650,49) | 731,22 (1 503,88) | **579,98 (1 066,79)** | +263,6 |
| voies évaluées (21C, défaut) | 230 | 2 322 | **932** | ×4,1 |
| `check:hop-perf` : budgets « DÉPASSÉ » | 6 | 6 | 7 (le 7e, « Levure », est un p95 bruité : médiane 12,95 ms) | |

**Objectif non atteint** : le coût final reste au-dessus du bruit de HEAD (+27 ms chaud, +244 ms froid). La borne a coupé le surcoût de moitié environ ; les phares ne permettent pas de descendre sous 80.

## (b) et (c) : ce que j'ai mesuré, et ce que je n'ai pas fait
Profil CPU de 25 appels à chaud : le profil « après » des 14 rangées montrées (`recipeProfile`) pèse 41 % du temps (fixe, déjà dans HEAD) ; `evaluate` 51 %, dont les **prédictions V5.5 des remplacements à IBU égal** : leur dose dépend de la quantité du houblon remplacé, donc un Nugget changé crée des triplets neufs que nulle mémoire ne couvre. (b) « mémoriser l'évaluation par houblon et par moment » : l'effet d'un ajout est **déjà** mémorisé (`apport`, `predictionDe`) ; relever la borne du cache d'apports de 4 096 à 16 384 : aucun gain (annulé). Une mémoire de l'évaluation complète ne servirait qu'à un second appel de **même recette**, ce que fait déjà le préchauffage de l'app (proposer puis leviers levure : le second appel coûte 144 ms contre 430). (c) « n'évaluer que les doses utiles » : il n'y a que **3 doses** par moment (searchDosesGL) ; un arrêt anticipé sous l'hypothèse « l'effet croît avec la dose » économiserait au mieux un tiers des ajouts, sans toucher aux remplacements ni au profil « après ». Je ne les ai pas codés : le gain ne dépasse pas ce que la borne donne, pour un risque de résultat changé. À toi de les commander si tu les veux quand même.

## DÉCISION À PRENDRE 1 : le coût (critère bloquant)
Options :
- (a) **Borne de 80** (état actuel) : +27 ms chaud, +244 ms froid ; tous les phares présents. À accepter si le calcul reste asynchrone (le client async existe) ;
- (b) **Borne de 60** : environ +12 ms chaud (97 contre 86), mais Strata disparaît de la stout « moins de résineux » (exclusion non écrite : à signaler comme coupe) ;
- (c) **Calculer à l'ouverture et à l'idle seulement le groupe des remplacements** (le surcoût vient aux deux tiers des remplacements à IBU égal) : 0,5 jour, gain estimé de 60 % du surcoût.
**Recommandation : (a) maintenant, (c) ensuite.**

## DÉCISION À PRENDRE 2 : les 3 tests de départage g2a
Le groupe d'ex æquo que g2a départage n'existe plus dès que l'ordre du pool est une clé de rang. Options :
- (a) adapter les trois tests (`tete` = voies de rang 1 **à ordre de pool égal** ; `groupes` idem) : 15 minutes, pas de changement de moteur ;
- (b) revenir à l'ordre du pool en simple départage par le libellé (ma première version) : les trois tests passent, S1 perd East Kent Goldings (donnees ×2 et pack à rediscuter) ;
- (c) garder la clé hors du rang mais l'appliquer à la **coupe** `buyLimit` seulement : mêmes effets sur S1 que (b), moins de ties perdus.
**Recommandation : (a)** : la décision 1 du pilote est ce qui casse ces tests, pas un défaut du moteur.

## DÉCISION À PRENDRE 3 (à signaler) : J1 laisse entrer des houblons d'usage « arôme » dans les 10 premiers de Nugget
Falconer's Flight, Altus, Akoya, Loral, Sequoia Blend (usage « arôme » selon Beer Maverick, α de 9 à 18 %) entrent avec J1. Ils ne sont pas démotés, car le moteur lit le **rôle par l'α**, non l'usage Beer Maverick que Suggérer lit. Le témoin que le pilote a demandé, lu à la lettre (usage « arôme »), échoue : je l'ai lu comme « rôle aromatique », la lecture du moteur, et il passe. J'ai essayé d'étendre la démotion à l'usage « arôme » : trois autres tests se mettent à échouer (« amertume en brasseur : stock d'abord », pack, empreinte `moteurInchange` par le texte de la règle) ; **annulé**. Recommandation : en faire une voie à part (démotion par l'usage Beer Maverick à 60′ dans Substituer), avec le brasseur.

## Fichiers
`src/domain/hopIndex/v4/voies.ts` (c7 y a aussi ses lignes ; Edit ciblés), `palier.ts`, `substitution.ts` ; tests : `tests/unit/hopIndexV4/affinageD102.test.ts` (19 tests), `prototypes/houblons-v4/tests/{client-async,worker-calculs,substitution}.test.ts` ; hors liste, sur ordre du pilote : `prototypes/houblons-v4/data/pack-*.json` (régénérés) et `scripts/eval-hop/formuleV2.ts` (copie du poids d'amertume, une ligne) ; `scripts/eval-hop/` : `banc-justesse.ts`, `f2-phares.ts`, `f2-perf.ts`, `f2-borne.ts`, `f2-s1.ts`, `f1-poids.ts` repris. Preuves : `banc/`, `phares/`, `preuves/`.

## Doutes et limites
- `data/pack-*.json` régénérés avec l'arbre de travail : ils contiennent aussi ce que les autres voies (c7) ont changé dans les données ; `PACK-V4 TROP GROS (> 500 ko)` est un avertissement d'avant (543,8 ko, plafond du test 560 ko).
- Mes froids sont un premier appel par processus ; mes chauds changent le Nugget de la recette à chaque appel (le pire cas pour les mémoires).
- Le banc reste faible (n de 33 à 97, MRR ≤ 0,25) ; P4 (style) absent.

## DEMANDE EXECUTANT :
Après les décisions 1 à 3 :
1. `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` ; attendu : `Tests  885 passed` (si les trois tests g2a sont adaptés).
2. `for i in 1 2 3 4 5; do npx vite-node scripts/eval-hop/f2-perf.ts; done`, puis `npm run check:hop-perf` ; rendre les médianes dans le tableau ci-dessus.
3. `npx vite-node scripts/eval-hop/f2-borne.ts` ; attendu : « phares attendus 8, manquants : aucun » en 21C, 6 sur 6 en stout floral, Mosaic et Cascade seuls manquants en stout « moins de résineux ».
4. `npx vite-node scripts/eval-hop/banc-justesse.ts -- --etat=final2` et `f2-phares.ts -- --etat=final2`, deux fois chacun ; attendu : mêmes empreintes que `final` (banc 7e8f15d8…, phares 441c2c32…).
5. `VITE_HOP_V4=on npm run build` puis `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` ; attendu : B5 tenu.

CONNAISSANCE : Dans Suggérer, mettre l'ordre de qualité du pool en **clé de rang** efface les ex æquo que g2a départage ; le mettre en simple départage garde les ex æquo mais ne change pas la sélection quand les effets de bord diffèrent. Les 4 voies « à acheter » de S1 viennent de cet ordre : documentation d'abord (fiches lues), puis famille mineure, attendue, suggérée, nom. Les remplacements à IBU égal sont le gros du coût à chaud : leur dose suit la quantité remplacée, donc leurs prédictions ne se mémorisent pas d'un appel à l'autre.
LEÇON PROPOSÉE : Une clé de classement n'est pas un simple départage : en la posant dans le rang on change la définition des ex æquo, que d'autres contrôles (g2a) comptent. Avant de déplacer une clé, chercher les tests qui lisent `rank` ou les groupes d'ex æquo, et l'annoncer au pilote avec la décision. Et : une borne de coût se mesure sur les phares ET sur un scénario du brasseur (S1) ; 60 coupait un phare que 80 garde.
