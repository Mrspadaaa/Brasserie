# Couverture après l’import Beer Maverick (#180, voie d2-import-bm)

Généré par `couverture-apres.mjs`. AVANT : `src/data/hopV4/proto-data.json` de HEAD (`git show`, 318 variétés). APRÈS : le fichier de l’arbre (318 variétés). Mêmes règles de « présent » que `d1-couverture/couverture.mjs` : une borne publiée au moins ; `null` = absent ; repli `composes-houblon.json` compté à part.

Source de l’import : les 318 pages du cache Beer Maverick relevées le 2026-09-08 (aucun accès réseau). Un champ que la page n’écrit pas, ou écrit « Unknown », reste inconnu : jamais 0.

## Par champ, avant et après

| Champ | Avant | % avant | Après | % après | Gain | via composes (après) |
|---|---:|---:|---:|---:|---:|---:|
| alpha (`alpha`) | 318 | 100,0 % | 318 | 100,0 % | +0 | 0 |
| bêta (`beta`) | 311 | 97,8 % | 311 | 97,8 % | +0 | 0 |
| cohumulone (`cohumulone`) | 0 | 0,0 % | 287 | 90,3 % | +287 | 0 |
| huile totale (`oil`) | 301 | 94,7 % | 301 | 94,7 % | +0 | 0 |
| oils.myrcene (`oils.myrcene`) | 257 | 80,8 % | 257 | 80,8 % | +0 | 0 |
| oils.humulene (`oils.humulene`) | 251 | 78,9 % | 251 | 78,9 % | +0 | 0 |
| oils.caryophyllene (`oils.caryophyllene`) | 238 | 74,8 % | 238 | 74,8 % | +0 | 0 |
| oils.farnesene (`oils.farnesene`) | 4 | 1,3 % | 249 | 78,3 % | +245 | 0 |
| linalol (`linalol`) | 67 | 21,1 % | 67 | 21,1 % | +0 | 3 |
| géraniol (`geraniol`) | 3 | 0,9 % | 3 | 0,9 % | +0 | 3 |
| tags (descripteurs) (`tags`) | 300 | 94,3 % | 300 | 94,3 % | +0 | 0 |
| origine (`origin`) | 318 | 100,0 % | 318 | 100,0 % | +0 | 0 |
| usage (fournisseurs OU Beer Maverick) (`usage`) | 64 | 20,1 % | 318 | 100,0 % | +254 | 0 |
| usage, fournisseurs seulement (champ d1) (`usage-fournisseurs`) | 64 | 20,1 % | 64 | 20,1 % | +0 | 0 |
| usage Beer Maverick (purpose) (`purpose`) | 0 | 0,0 % | 318 | 100,0 % | +318 | 0 |
| substituts (liste non vide) (`substituts`) | 0 | 0,0 % | 217 | 68,2 % | +217 | 0 |
| url (`url`) | 318 | 100,0 % | 318 | 100,0 % | +0 | 0 |
| oils.others (All Others) (`oils.others`) | 0 | 0,0 % | 258 | 81,1 % | +258 | 0 |
| styles de bière (BM) (`bm.styles`) | 0 | 0,0 % | 261 | 82,1 % | +261 | 0 |
| accords (BM) (`bm.accords`) | 0 | 0,0 % | 42 | 13,2 % | +42 | 0 |
| profil d’arôme 9 axes (BM) (`bm.arome`) | 0 | 0,0 % | 181 | 56,9 % | +181 | 0 |
| indice de stockage HSI (BM) (`bm.hsi`) | 0 | 0,0 % | 71 | 22,3 % | +71 | 0 |
| propriétaire (BM) (`bm.proprietaire`) | 0 | 0,0 % | 132 | 41,5 % | +132 | 0 |
| rapport α/β (BM) (`bm.rapportAB`) | 0 | 0,0 % | 287 | 90,3 % | +287 | 0 |

## Ce que le cache ne peut pas donner

| Champ | Manquants après | Cause |
|---|---:|---|
| `cohumulone` | 31 | Beer Maverick écrit « Unknown » |
| `oils.farnesene` | 69 | pas de ventilation de l’huile (58 pages) ou « Unknown » |
| `oils.others` | 60 | pas de ventilation de l’huile (58 pages) ou valeur illisible (« 0--1% », « 0--16% ») |
| `bm.arome` | 137 | la page n’a pas de profil (liste vide : « no aroma values ») ou une valeur illisible (« 01 ») |
| `bm.styles` | 57 | pas de section « Beer Styles » |
| `bm.accords` | 276 | pas de section « Hop Pairings » (42 pages en ont une) |
| `bm.proprietaire` | 186 | pas de ligne « Ownership » |
| `bm.hsi` | 247 | pas de ligne « Hop Storage Index » |

## Hors de la voie (le cache ne le porte pas)

- **linalol** par houblon : 67/318 (21,1 %) ; **géraniol** : 3/318 (0,9 %). Beer Maverick les range dans « All Others » (β-pinène, linalol, géraniol, sélinène). Ils viendront de fiches fournisseurs, dont la collecte attend son accord. Reste à combler : linalol 251, géraniol 315.

## Houblons phares : champs encore manquants après (parmi les champs ci-dessus)

- **Citra** : aucun
- **Mosaic** : linalol, geraniol
- **Nelson Sauvin** : geraniol, bm.hsi
- **Galaxy** : geraniol, bm.hsi
- **Motueka** : geraniol
- **Idaho 7** : bm.hsi
- **Cascade** : bm.proprietaire
- **Saaz (CZ)** : geraniol, bm.accords, bm.proprietaire
- **Nugget** : geraniol, bm.proprietaire
- **Lotus** : oils.caryophyllene, geraniol, substituts, bm.hsi

## Contrôles

- OK : présent + absent = 318 pour chaque champ, avant et après ; les champs de d1 rendent avant les mêmes chiffres que `d1-couverture/couverture.md`.
