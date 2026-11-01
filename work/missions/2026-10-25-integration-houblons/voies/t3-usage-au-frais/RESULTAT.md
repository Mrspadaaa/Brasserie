OK — R4 range par la part au frais (Beer Analytics), continue, sans étiquette ni seuil ; 5 empreintes de test hors Possède à mettre à jour

(Réserve : « vitest vert » n'est pas tenu à la lettre. 5 tests d'empreinte hors de mon Possède échouent, seule cause : la clé de R4 ; voir « DEMANDE PILOTE ». Tout le reste est vert.)

## Ce qui change, après la consigne du brasseur (31.10, reçue en cours de voie)
« Warrior, Columbus et Nugget en "mixte", pas en amérisants ??? Mais mixte veut aussi dire amérisant : le rôle d'un houblon n'est jamais vraiment totalement défini. »
- **Aucune étiquette** : ni l'usage Beer Maverick (aroma, dual, bittering), ni la catégorie du site Beer Analytics. Ma première version (seuil « moitié de la médiane », repli sur `purpose === 'bittering'`) est **abandonnée**. Vérifié par un test : effacer tous les `purpose` du catalogue ne change pas l'ordre.
- **Une valeur continue** : part au frais = (recettes Aroma + Dry Hop) ÷ (somme des recettes des cinq moments Mash, First Wort, Boil, Aroma, Dry Hop), graphique `usage-types`. Dénominateur = la somme des moments, pas le champ « recettes » : une recette peut employer le houblon à deux moments, la part reste dans [0, 1]. Houblons de 1 000 recettes et plus (`MIN_RECETTES`, déjà posé pour la concentration) : 97 houblons du catalogue.
- **Clé de R4** d'une voie qui AJOUTE (ajouter, assemblage, remplacer) au whirlpool, au dry hop actif ou après : `cleFrais` = médiane du catalogue lu (0,3036) − part au frais du houblon, moyenne pondérée par la dose pour un assemblage. Négative : plus employé au frais que la médiane, la voie passe devant ; positive : après. Warrior 0,0705 → +0,233 ; Centennial 0,415 → −0,111 ; Cashmere 0,603 → −0,299.
- **Neutre sans donnée** : table non chargée, houblon hors Beer Analytics ou sous 1 000 recettes → clé absente (= 0 = la médiane). Il ne recule pas et ne monte pas. Aucun autre moment (60′, 10′) n'a de clé. Jamais une exclusion : mêmes voies avec et sans R4 (test).
- **Raison écrite** (`reculeUsage`, seulement quand la clé est positive) : « Warrior : 7 % de ses recettes l'emploient à l'arôme ou au dry hop (médiane du catalogue 30 % ; Beer Analytics, CC BY-SA 4.0) ; ajouté Dry hop actif, il passe après les houblons plus employés au frais à effet égal (jamais écarté). » Pour une voie qui passe devant, la clé `cleFrais` (négative) est la trace ; pas de phrase (aucun écran ne lisait `reculeUsage` : `grep` fait).
- Option `usageAuFrais: false` : l'ordre d'avant, sans clé. `USAGE_AU_FRAIS_DEFAUT = true`.

## Comment la part se combine avec la typicité du style
La clé de départage de Suggérer (mode `k3k1t`, défaut) est lexicographique : [famille citée par une fiche, typicité du style (palier 3/2/1), radar Beer Maverick, cascade des fiches…]. La clé de R4 entre **entre la typicité et le radar** (`COUPURE_FRAIS = { k3k1: 1, k3k1t: 2 }`, exporté dans voies.ts) :
1. distance à la visée, débordement : inchangés ;
2. famille citée, puis palier de typicité : inchangés, R4 **ne réordonne jamais** ce que ces deux étapes séparent (test) ;
3. à ce rang égal, le plus employé au frais d'abord (R4) ;
4. puis le radar Beer Maverick, qui ne départage plus que les ex æquo de R4.

**Trois positions mesurées** (neipa saturée, 22A, plus d'agrumes au dry hop actif, stock des fixtures ; `mesures/neipa-*.txt`) :
| position | tête | garde-fous (`s3-general`, 124 lignes) |
|---|---|---|
| fin (après toute la clé de départage, comme 4a752523) | Centennial, Amarillo, Cascade, **Warrior** (4e), Cashmere | 0 ligne change : inerte, rien à regretter, rien d'acquis |
| haut (juste après la distance) | Wai-iti, Cashmere, Lemondrop, Ella | **refusée** : meilleur phare médian 1 → 10,5 ; 79 reculs de plus de 20 places, jusqu'à 72 (Target, EKG, Willamette en stouts, 3A, 9C…) |
| **radar (gardée)** | **Cashmere, Amarillo, Centennial, Cascade**, Columbus 5e ; Warrior sorti de la tête (hors des 12 premiers) | 44 lignes sur 124 changent (26 pires, 21 meilleures), **recul maximal 15 places, aucun de plus de 20** ; meilleur phare (médiane) 1 → 2 ; phare médian 5 → 6,5 ; contradictions carte/liste 0 → 0 |

Moyenne de la part au frais des 4 premiers : 34 % (41, 52, 38, 7) → 48 % (60, 52, 41, 38). Lecture de ce que « plus aucun houblon presque jamais employé au frais dans les 4 premiers » devient, sans seuil : Warrior (7 %) sort des 4 premiers ; en bas de la liste, les clés restent à leur place.

## Garde-fous, avant → après (position radar ; « avant » = table sans `auFrais`, l'ordre d'avant t3 ; 4a752523 ne bougeait déjà rien sur ces bancs)
| contrôle | avant | après |
|---|---|---|
| `f5-phares` (31 styles, liste « Ajouter » 60′) | 18/31 dans les 10, 12/31 dans les 5, médiane des médianes 37,5, Mosaic n° 4 | **identique, ligne pour ligne** (R4 ne lit que whirlpool et dry hop) |
| East Kent Goldings premier du stout S1 (`f9-nonreg` § 3) | EKG, First Gold, Strisselspalt, Liberty | **identique** |
| Citra cryo premier (16 listes, typicité) | 2 | **1** (≤ 2 tenu) |
| `s3-general` contradictions carte/liste | 0 | 0 |
| meilleur phare, médiane de 124 lignes | 1 | **2** (régression d'une place) |
| phare médian, médiane de 124 lignes | 5 | **6,5** (régression d'une place et demie) |
| ses six (`f9-nonreg`, 22A agrumes dry hop, rang) | Nelson Sauvin 48, Galaxy 9, Mosaic 14, Motueka 25, Idaho 7 15 | 27, 12, 7, 32, 3 (mieux : Nelson Sauvin, Mosaic, Idaho 7 ; moins bien : Galaxy, Motueka) |
| **Citra, 22A agrumes dry hop actif** | 1er (Citra cryo) | **14e**, derrière Nectaron, Strata, Idaho 7, Sabro (employés 70–80 % au frais contre 60 % pour Citra) |
| Citra, 21C agrumes dry hop actif | 4e | 13e |

La régression des phares est réelle, petite en médiane, forte pour Citra au dry hop. Elle suit la consigne (« plus un houblon est employé au frais, plus il passe devant ») ; elle se retire en une ligne : `COUPURE_FRAIS = {}` rend la position « fin » (inerte). → DÉCISION ci-dessous.

## Typicité par moment (question 5 du pilote) : mesurée, non livrée
Beer Analytics ne publie **pas** la typicité par moment : `usage-types` est par houblon, sans le style ; `typical-styles-*` est par style, sans le moment. Seule approximation : part du style × part au frais (suppose que la part au frais ne dépend pas du style ; invérifiable sur la source). `mesures/typicite-moment.txt` :
- **Pourquoi Warrior paraît « typé IPA » au dry hop** : 11,6 % des recettes de 22A contiennent Warrior (palier 3, seuil 5 %), presque toutes à l'ébullition ; la typicité ne dit pas à quel moment.
- Approximation, 22A : Warrior 3 → 1, Nugget 3 → 1, Cashmere 3 → 1 ; Citra, Mosaic, Centennial, Cascade, Amarillo, Simcoe, Columbus restent à 3. C'est la correction que le pilote devinait, et elle pose Warrior en rare sans passer par R4.
- **Mais** stout 15B : Target 3 → 1, Nugget 3 → 1, Challenger 3 → 1, Willamette 3 → 2, Columbus 3 → 2, Northdown 2 → 1 ; EKG reste à 3 (36,5 % × 19 %). Target et Willamette sont des phares de stout (pharesParStyle) : le garde-fou de s3 les verrait reculer.
- Pas simple : `cleHoublon`/`cleDeVoie` (departage.ts, hors Possède) appellent `typiciteDe(variété, style)` sans moment ; il faudrait passer le moment jusqu'à la clé. Pas fait. Voir DÉCISION.

## Fichiers écrits
- `scripts/collecte-hop/typicite-styles.mjs` : `auFrais` (moments, minRecettes, médiane, parts) + `auFraisLecture` (source, licence CC BY-SA 4.0 déjà dans `source`). Table **à côté, dans le même fichier** (chargé à part, hors chunk B5).
- `src/data/hopV4/typicite-styles.json` : régénérée (254 houblons, 31 styles, 36 172 → 38 509 octets) ; les autres clés sont **inchangées** (comparées une à une à l'ancienne).
- `src/domain/hopIndex/v4/typicite-acces.ts` (`auFrais?` dans `TableTypicite`, `UsageAuFrais`, `usageAuFraisDe`, `medianeAuFrais`), `typicite.ts` (`usageAuFrais`), `voies.ts` (`cleFrais`, `reculeUsage`, `COUPURE_FRAIS`, `comparerClesFrais`, import de `raisonAmerisant` retiré ; R4 seulement).
- `tests/unit/hopIndexV4/fraisT3.test.ts` (neuf, 12 tests), `saturationD195.test.ts` (bloc R4 réécrit : 4 tests devenus faux retirés ou réécrits).
- `scripts/eval-hop/t3-neipa.ts`, `t3-cles.ts`, `t3-lanceur.ts` (lance `s3-general`, `f5-phares`, `f9-nonreg` avec ou sans la part au frais, position radar ou fin), `t3-typicite-moment.ts`.
- `mesures/` : sorties de tout ce qui précède.

## Critères
- `node scripts/collecte-hop/typicite-styles.mjs --verifier` : `TYPICITE OK`.
- **Test rouge sur 4a752523** : le test neuf rejoué sur une extraction de 4a752523 (`git archive`, scratchpad) : **10 échecs sur 12** (`mesures/rouge-4a752523.txt`) ; les 2 verts sont « l'étiquette ne change pas l'ordre » (vrai aussi avant : la règle y lisait `purpose`, mais sans effet sur ce jeu) et « pas de clé au 60′ ». Vert ensuite : `fraisT3` 12/12 + `saturationD195` 11/11 (`mesures/vert-fraisT3.txt`).
- Banc neipa : voir le tableau des positions ; `mesures/neipa-radar*.txt`.
- Garde-fous : tableau ci-dessus ; `mesures/s3-general-{radar,fin}.json`, `f5-{sans,avec}.txt`, `f9-{sans,avec,avec-fin}.txt`.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : 1115 verts, **5 échecs** (`mesures/vitest-2.txt`), tous le même : l'empreinte `proposer` `89b74f788939` → `57176985632c`, dans `prototypes/houblons-v4/tests/client-async.test.ts` ligne 47 (4 tests) et `worker-calculs.test.ts` ligne 30 (1 test). Cause établie : avec `USAGE_AU_FRAIS_DEFAUT = false` posé un instant, `worker-calculs` repasse vert avec l'ancienne empreinte (5/5). Les empreintes `suggerer`, `remplacants`, `substitutes` sont inchangées. Deux « Timeout calling onTaskUpdate » de vitest-worker (charge machine, vus aussi à la 1re passe), sans test en échec.
- `npx tsc --noEmit` : sans sortie.

## DEMANDE PILOTE (hors Possède)
Mettre à jour la seule empreinte `proposer` dans `prototypes/houblons-v4/tests/client-async.test.ts` (ligne 47) et `worker-calculs.test.ts` (ligne 30) : `89b74f788939` → `57176985632c`, avec une ligne de commentaire « t3 (31.10) : R4 lit la part au frais (cleFrais, reculeUsage) ». Précédent : s3 avait fait de même (D195). Je ne les ai pas touchés (L17). Rejouer ensuite les deux fichiers.

## DEMANDE EXECUTANT :
Depuis la racine, dans l'ordre (après la mise à jour des deux empreintes) :
1. `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : attendu, 0 échec.
2. `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-t3` : relever la taille du chunk B5 (attendu ≤ 164 ko ; le moteur gagne ~1,5 ko de code, la table est chargée à part) ; recopier dans `mesures/build.txt`.
3. `npm run check:hop-perf` (attendu : sans ECHEC) ; `npx vite-node scripts/eval-hop/f2-perf.ts` (attendu : même ordre de grandeur ; R4 ajoute un calcul de moyenne par voie) ; sorties dans `mesures/perf.txt`.
4. Les états : `node work/refonte-frontend/v4/ecran-1/fils16-radar-comparer/construire.mjs` (attendu `CONSTRUIT OK`), puis `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs` (attendu `ETATS OK`). L'état `etat-sugg-radar` (compte « Voir les N autres voies ») peut changer : un compte qui ne dépend que des données ; à ouvrir en capture s'il échoue.
Rien d'autre à produire dans le dépôt.

## Doutes et limites
- **Position radar par défaut, alors qu'elle n'est pas « sans régression »** (voir le tableau). Je l'ai gardée parce qu'elle seule agit sur la neipa, sans franchir le garde-fou fixé (aucun recul de plus de 20 places, contre 72 pour la position haute). Le choix du défaut revient au pilote.
- Cashmere passe 1er : 2 962 recettes seulement, sa typicité (palier 3) vient de la concentration IPA, pas de sa part en 22A (0,9 %). Le brasseur attendrait peut-être Centennial ou Cascade d'abord ; Cashmere est employé à 60 % au frais, la règle fait ce qu'elle dit.
- Sur le stock vide / catalogue plein, la liste de la neipa ne compte que 4 voies : Warrior en sort, non par exclusion de R4 mais parce que Cashmere le déloge de la fenêtre de 4 (comme l'écran affiche une fenêtre).
- La part au frais est une popularité de recettes de la communauté (US surtout), pas une vérité du houblon ; un houblon récent (Nectaron, Strata, Sabro) est presque toujours mis en dry hop, ce qui lui donne 70–80 %.
- Seuls 97 houblons du catalogue ont une part (1 000 recettes et rattachés) ; Saaz, Magnum, Perle, Northern Brewer, Brewer's Gold (rattachements ambigus exclus, f9) et Lotus n'en ont pas : neutres.
- `MOMENTS_AMERISANT_RECULE` (palier.ts, hors Possède) garde son nom d'avant ; `raisonAmerisant` n'est plus appelé. À renommer ou retirer par la voie qui possède palier.ts.
- Deux instances de mes bancs ont tourné en parallèle par erreur (une chaîne lancée avant la correction du lanceur) ; sorties identiques, écrasées par la seconde.
- Pas de build, pas de perf, pas d'états, pas de Chrome (consigne).

DÉCISION À PRENDRE : quelle position pour la clé de l'emploi au frais ? Options : (a) **radar** (livré) : agit, Warrior sort de la tête, phare médian 5 → 6,5, Citra 22A dry hop 1er → 14e ; (b) **fin** (`COUPURE_FRAIS = {}`) : zéro changement, la neipa ne bouge pas, R4 reste inerte ; (c) radar mais seulement hors des phares : refusé, il faudrait une liste de houblons à épargner (L20). Recommandation : (a) si le brasseur accepte de voir Nectaron, Strata, Sabro passer devant Citra au dry hop ; à lui de trancher, en mini maquettes de la tête avant/après.

DÉCISION À PRENDRE : typicité par moment (au frais contre ébullition) ? Options : (a) approximation part du style × part au frais, dans `typiciteDe` avec le moment : fait tomber Warrior, Nugget, Cashmere en « rare » à 22A, mais aussi Target, Willamette en stout ; (b) ne rien faire, R4 suffit ; (c) obtenir la vraie donnée (Beer Analytics ne la publie pas ; recettes brutes inaccessibles). Recommandation : (b) maintenant ; (a) en voie dédiée avec mesure d'abord sur les phares de stout, car elle toucherait departage.ts.

CONNAISSANCE : Beer Analytics `usage-types` donne le nombre de recettes par moment ; la part au frais médiane du catalogue lu est 0,30 (97 houblons de 1 000 recettes et plus). Les catégories du site (« bittering ») ne la prédisent pas : Krush, BRU-1, Enigma, Pacific Sunrise y sont « bittering » et employés au frais à 65–78 %. La clé de départage de Suggérer est [famille citée, typicité, radar, cascade] ; une clé de plus s'y insère par `COUPURE_FRAIS`.
LEÇON PROPOSÉE : un brief qui demande « un seuil par principe » à partir d'une étiquette contredit la parole du brasseur sur le rôle d'un houblon (un continuum) ; la mesure continue et la position dans la clé se décident avant le seuil. Et : un banc qui lit un fichier de table doit pouvoir le lire avec et sans la nouvelle donnée (`t3-lanceur.ts`) avant d'écrire « avant/après ».
