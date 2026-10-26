OK — page A contre v2 dans la vraie vue Substituer : 16 houblons à 60′, Galaxy et trois cas au dry hop (PAGE OK)

## Fichiers écrits (tous dans la voie, plus deux lignes hors voie)
- `ordres.ts` → `ordres.json` : la colonne A de chaque cas (moteur v1 figé `scripts/eval-hop/substitution-v1.ts`, style 16D, sans stock) et `v2ref` (v2 hors ligne, même demande). `explorer.ts` : rang de Saaz Late et de Spalt selon le moment et le style (v1 et v2).
- `capturer.mjs` → `img/` (44 captures, `jeux.json`, `u4-vue-390.png`, `nelson-sauvin-60-v2-long.png`) et `fidelite.json` ; `faire-page.mjs` → `page.html`.
- Hors voie : `controle-capture-fidele.mjs` accepte le champ `reference` (la colonne sans injection) en plus de `referenceA` ; une assertion de plus dans `tests/unit/hopIndexV4/substituerOrdreImpose.test.ts` (20 tests verts). Rien dans `src/` : l'ordre imposé de m3 sert tel quel.

## Ce qui est montré
- Écran : la vue Substituer de l'app, entière, 390 × 960. À 60′, son échelle u4 (50 à 100, paliers partiel, proche, très proche) ; au dry hop, son tableau « Arômes 16D » (le code de l'app).
- A · l'actuel : ordre et scores imposés (`window.__hopSubstituerOrdre`), dix rangées, en points.
- v2 · le nouveau moteur : le moteur de l'app, sans injection : cinq rangées (règle de l'app : 5 du catalogue, 3 du stock ; la fixture n'a pas de stock), avec ses plages.
- Pour les 4 cas du dry hop, une colonne de plus, « v2 · dix premiers » : les dix premiers de v2 (`v2ref`), imposés comme A, pour voir les rangs 6 à 10 que l'app ne montre pas. Les scores sont ceux du moteur.
- 60′ : le houblon entre au brouillon par le champ « Ajouter un houblon » et son « + ». La poignée de sa ligne (rail de Ma bière, `role=slider`) est tenue aux flèches jusqu'à « 60′ » : c'est le geste de l'app, sans changer son code (la puce de Substituer ne propose 60′ que si l'ajout y est déjà). Chaque capture a la puce « 60′ · recette » active (contrôlé par le script, aucun `MOMENT` en sortie). Nugget est déjà à 60′. Dry hop : la puce « dry hop », comme m3.
- Un navigateur neuf par cas : le brouillon local garde les houblons du cas d'avant (Galaxy à 60′ empêchait Galaxy au dry hop).

## Critères (sortie décisive)
- `controle-capture-fidele.mjs …/m4-listes-60/capturer.mjs` → `FIDELE OK` ; sur m2 : `FIDELE ECHEC (3)`.
- `verifier-page.mjs …/m4-listes-60/page.html --page-lot --captures <tmp>/m4` → `PAGE OK (48 images chargées, lisible à 390 et 1280 px, sans erreur)`. Une première version a échoué (bloc de 66 mots) : texte raccourci.
- Score de chaque rangée relu à l'écran (`data-houblon-rang`, `data-min`, `data-max`) : aucune ligne `ÉCART` sur les 24 colonnes imposées (A et v2 · dix) ; « aucune erreur de page ».
- v2 de l'app (rangées lues à l'écran) contre `v2ref` (hors ligne) : même ensemble des cinq premiers, 20 cas sur 20.
- Captures ouvertes : Nelson Sauvin 60′ v2 et A, Magnum (US) 60′ v2, Galaxy dry hop v2 · dix, Saaz Late dry hop v2 · dix, Spalt dry hop v2 · dix, page à 1280 px. Non ouvertes une à une : les autres 60′, Cascade, Citra (rangées lues par le script).

## Écart à demander, à connaître : A n'est pas exactement `listes-60.json`
e2 a calculé A sans style. L'app, elle, passe le style 16D de la recette (les familles attendues comptent double dans l'arôme), à v1 comme à v2. Pour comparer à ce que l'app montre, A est recalculé avec le style : dix premiers identiques à `listes-60.json` pour 5 houblons sur 16 (Cascade, Nugget, Warrior, Summit, Target), différents pour les 11 autres (de 4 à 9 rangs sur 10 : Nelson Sauvin 7, Citra 6, Galaxy 8, Magnum 9). L'écart de chaque cas est dans `ordres.json` (`ecartAvecListes60`). La liste de v2 de e2 (sans style) n'est pas non plus celle de l'écran.

## Ce que montrent les cas (lu sur les captures et ordres.json)
- Nelson Sauvin 60′ : A TNT Blend 100, Southern Tropic 98, Boomerang 96, Zula 95 ; v2 TNT Blend 98, Southern Passion 95, Hallertau Taurus 94, Southern Tropic 94, Pacific Jade 92.
- **Galaxy au dry hop** : v2 Harlequin 65, Mosaic 60, Citra 59, Nectaron 59, Rakau 59, puis Zamba Blend 59 (6e) ; A Harlequin 92, Samba 89, HBC 630 86, Zamba Blend 86 (4e), Sabro 85, Mosaic 83, YQH-1380, Nectaron 82. Harlequin est premier dans les deux ; v2 monte Citra (3e, absent des dix de A) et laisse Nectaron et Zamba Blend dans le haut. Il ne corrige donc pas ce que e2 relevait.
- **Saaz Late et Spalt** (dry hop) : sur les fiches d'aujourd'hui, v1 les met loin l'un de l'autre : Spalt 20e de Saaz Late et Saaz Late 53e de Spalt ; v2 : 6e et 16e. Le « 1er et 1er » de v1 date d'avant d4 (`explorer.ts` : v1 sans moment 20e et 42e ; 60′ avec style 24e et 10e). Spalt 6e de Saaz Late n'est visible que dans la colonne « dix premiers ».
- **Cascade 16D au dry hop** : A Cluster 91, Taiheke 91, Loral 90 ; v2 Mandarina Bavaria 63, Taiheke 63, Cluster 62.
- **Citra 60′** : A Caliente 98, Trident 97, Zenia 96, Mosaic 95, Sabro 93 ; v2 Trident 97, Bravo 95, Mosaic 95, Loral 94, Southern Sublime 94.

## Doutes et limites
- A montre dix rangées, v2 cinq : la comparaison directe est celle des cinq premières. Option : limiter A à cinq (ce que l'app montrait). Je garde dix, comme e2.
- A et la colonne « dix premiers » sont en points ; v2 de l'app a ses plages (Petoskey 75–95 à 60′ pour Magnum). La ligne « sans inconnue », la légende « un point : tout est connu » et « Lire ces scores » sont celles de l'app, pas vraies pour une liste imposée (comme m3).
- v2 est un peu plus bas que A (Nelson Sauvin à 60′ : 92 à 98 contre 92 à 100 ; Galaxy au dry hop : 57 à 65 contre 81 à 92) : l'échelle et les paliers de l'app n'ont pas été recalés (déjà noté par e2).
- Un cas « Citra 60′ » apparaît deux fois sur la page (phares, cas douteux), mêmes images.
- Les captures sont à 390 × 960 (pas 844) : à 844 le pied cache les dernières rangées de A.

## DÉCISION À PRENDRE : A avec ou sans le style de la recette ?
- Options : (1) comme ici, avec le style 16D, ce que l'app afficherait ; (2) `listes-60.json` tel quel (sans style), pour garder les nombres de e2, mais A ne serait plus l'écran d'hier.
- Recommandation : (1). Décideur : pilote.

CONNAISSANCE : le brouillon de l'app survit à un rechargement de page dans le même navigateur (vider `localStorage` ne l'efface pas) : un script qui ajoute le même houblon à deux cas doit ouvrir un navigateur neuf. La poignée du rail de Ma bière (`[data-role="glisser-moment"]`, flèches haut et bas) est le geste qui met un ajout à 60′ sans changer le code.
LEÇON PROPOSÉE : aucune.
