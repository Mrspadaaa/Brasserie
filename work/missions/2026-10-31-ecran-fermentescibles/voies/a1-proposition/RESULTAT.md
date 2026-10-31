OK — 106 styles, 186 fermentescibles avec graphique sur 194 pages, règle : disponible, typicité (stouts voisines, bornes), épinglé, nom ; un non cité trop foncé écarté

Version corrigée après RELECTURE.md et les messages du pilote (teinte retirée du classement, bornes départagées, noms, tests, chargement, `ref`, puis la règle de plausibilité du 31.10).

## Fichiers écrits
- `src/domain/fermentables/proposition.ts` (règle écrite ; signature inchangée, un champ facultatif ajouté : `table?`)
- `src/domain/fermentables/noms.ts` (87 entrées : nom du stock, nom Beer Analytics, alias), `src/domain/fermentables/typicite.ts` (paliers, voisins, chargement à la demande)
- `scripts/collecte-malt/typicite-malts.mjs` (`--telecharger`, sans option = recalcul, `--verifier`)
- `src/data/fermentableSources/beeranalytics-fermentables.json` (relevés bruts : 194 fiches)
- `src/data/fermentables/typicite-styles.json` (table chargée par la page, 54 ko, licence en tête) et `src/data/fermentables/fermentescibles.json` (noms et tailles d'échantillon, 19 ko, pour le test de cohérence seulement : sortis de la page)
- `tests/unit/fermentables/` : `proposition.test.ts` (34), `noms.test.ts` (~50), `table.test.ts` (11), `chargement.test.ts` (2)
- `COMPRIS.md`, `temoin-avant.txt`, `temoin-avant-dispo.txt` (rouge du stock d'abord, D226), `temoin-avant-teinte.txt` (rouge de la plausibilité : 3 tests rouges sur les bonnes raisons, `expected [ 'Pilsner Malz', 'Carapils', … ] to not include 'Schokoladenmalz'`, constante absente), ce fichier

## Ce que publie Beer Analytics (adresses lues)
Oui, la même donnée que pour les houblons. Lu le 31.10.2026, une requête à la fois, 2,1 s d'écart, `robots.txt` : tout permis sauf `/wa/`.
- `https://www.beer-analytics.com/sitemap.xml` : 238 pages `/fermentables/<catégorie>/<nom>/` (grain 114, fruit 62, épices 43, sucre 17, extrait 1). Collecté : grain, sucre, extrait, fruit = 194 pages.
- Chaque page (ex. `/fermentables/grain/pilsner-malt/`) donne `Type` et `Recipes` en en-tête et cite six graphiques JSON publics (`color-histogram`, `amount-percent-range`, `popularity`, `typical-styles-relative`, `typical-styles-absolute`, `amount-used-per-style`, sous `.../charts/`).
- Lu : `.../charts/typical-styles-relative.json` seul : la part des recettes du style qui contiennent le fermentescible, pour les 16 styles où il pèse le plus (Pilsner Malt, German Pils : 0,915).
- 186 pages sur 194 ont un graphique ; 8 n'en ont pas (`no_data`, 1 à 4 recettes). Elles restent inconnues. Parts gardées à 6 décimales (à 4, l'acerola devenait 0) ; un test refuse tout 0.
- 106 des 123 lignes BJCP 2021 sont rattachées par leur nom exact ; les 17 autres sont les sous-styles de 21B et 27A (même code) : inconnus.
- LIMITE : 16 styles par fermentescible. Un style absent n'est PAS 0 : « au plus `p16` ». En German Pils, seuls 4 fermentescibles citent le style (Pilsner 92 %, Carapils 33 %, acidulé 16 %, chit 1 %).

## La règle (`PROPOSITION_RULE`) et ses raisons
Écartés ; 1) disponible avant épuisé (D226) ; 2) typicité, à l'intérieur de chaque groupe ; 3) épinglé ; 4) nom. **La teinte n'est plus une clé** (relecture 1 et 9).
- Écartés : une ligne de recette liée par la `ref` de l'article (repli sur l'`id` seulement si l'article n'a pas de `ref` : BrewWizard pose `stockItemRef = article.ref`), ou le nom entier (accents et casse ignorés). Un nom courant tapé (« Cara », « Munich ») n'écarte rien.
- Typicité par paliers de la part : 4 « dans la plupart des recettes » (50 % et plus), 3 « courant » (15 %), 2 « présent » (3 %), 1 « rare ». Constantes `PALIERS_TYPICITE` : seuils [H] à montrer au brasseur. Les stouts (15B, 15C, 16A à 16D, 20B, 20C) se lisent entre elles à moitié de poids, comme les houblons : le malt chocolat de la 16A (72 %) compte 36 % pour la 15B, que le site ne cite pas pour lui.
- Style hors des 16 premiers : borne `p16` sous 3 % = « rare » par la borne ; sinon « inconnu borné », rang 1,5 (entre rare et présent). **Les inconnus bornés se départagent par leur borne, la plus haute d'abord** (Pale Ale Malz ≤ 42,6 % devant Lactose ≤ 5,6 %, même épinglé). Sans aucune donnée (nom hors table, absent du site, style sans correspondance) : après tout le connu, jamais écarté, jamais 0.
- Pourquoi la teinte n'est pas une clé : la couleur d'un malt n'est pas celle de la bière (une stout de 70 EBC se fait avec 5 à 10 % d'un malt à 1000 EBC), et la typicité du style porte déjà la couleur. `ebcVise` reste accepté et ne change pas l'ordre ; la tuile peut l'afficher. Aucun libellé de `cles` ne parle de teinte.
- **Plausibilité (pilote, 31.10, seule exception)** : un fermentescible NON cité pour le style (aucune part, ni du style ni d'une stout voisine) dont la couleur connue dépasse `PLAFOND_TEINTE_NON_CITE` (= 10, hypothèse nommée, exportée) fois la borne haute d'EBC du style ne vient pas dans les tuiles ; la recherche le trouve. Un cité n'est jamais écarté par la teinte ; couleur inconnue, teinte du style inconnue ou table non chargée : il reste ; la teinte ne redevient pas une clé (l'ordre des tuiles restantes ne dépend pas d'`ebcVise`, testé). Le seuil est strict (700 EBC pour une borne de 70 : reste). Champ facultatif ajouté, `ebcMax?` (borne haute d'EBC du style) ; absent, `ebcVise` en tient lieu (plus strict : il est plus bas que la borne haute).
- **Disponibles d'abord, épuisés à part (D226, dernière règle)** : à l'ouverture, un épuisé ne passe jamais devant un disponible, même d'un style plus typique ; la typicité (puis l'épingle, le nom) ordonne à l'intérieur de chaque groupe. Test : German Pils, Pilsner Malz et Münchner Malz épuisés, Carapils, Carahell et Caramünch II disponibles : les trois disponibles passent avant les deux épuisés (table réelle et table de poche). Témoin rouge avant : `temoin-avant-dispo.txt` (2 tests rouges : `un disponible après un épuisé : Pilsner Malz | Carapils | Münchner Malz | Carahell | Caramünch II`).
- Épinglé avant non épinglé : l'étoile départage, elle ne fait pas passer devant le stock ni la typicité. Sans style ni table : disponible, épinglé, nom. **Changement voulu par rapport à la règle provisoire** (qui mettait l'épinglé avant le stock) : un épinglé épuisé recule. Le test « sans style » le prouve. `cles` : disponible/épuisé, typicité, épinglé, nom (la typicité est en 2e position).

## La table des noms (`noms.ts`)
Une entrée = nom du stock → identifiant Beer Analytics + alias. Pilsner Malz → `pilsner-malt` (Pils) ; Pale Ale Malz (Pale) ; Münchner Malz → `munich-malt` (Munich) ; Weizenmalz hell → `wheat-malt` (Weizen, Wheat, Blé) ; Haferflocken → `flaked-oats` (Avoine) ; Carapils → `carapils-carafoam` (Cara) ; Carahell, Caramünch I/II/III, Carafa, Carafa Special, Röstgerste, Schokoladenmalz, Schwarzmalz ; sucres (Dextrose → `corn-sugar`, Sirop de glucose → `corn-syrup`, Sucre candi, Lactose, Miel, Extrait sec clair…) ; 22 fruits.
- `nomCanonique("Munich")` = « Münchner Malz » ; Pils → Pilsner Malz ; Pale → Pale Ale Malz ; Weizen / Wheat / Blé → Weizenmalz hell ; Cara → Carapils ; Avoine → Haferflocken ; inconnu → `null`.
- Retirés (relecture 3 et 8) : « groseille » (≠ cassis), « glucose » de Dextrose (devient l'alias du Sirop de glucose, entrée propre), « carafa weizen », « brumalt », « rapadura », « bleuet » ; « Sucre complet » devient « Turbinado ». Test : liste de paires interdites (cassis/groseille, dextrose/glucose, malt/flocons, hell/dunkel, I/II/III…) ; ces noms retirés rendent `null`.

## TEMOIN AVANT (règle provisoire de HEAD, mêmes tests, avant ce code — L13)
`git show HEAD:src/domain/fermentables/proposition.ts` remis en place le temps du rejeu, puis restauré (identité vérifiée). Reporter verbose avec les messages d'assertion : `temoin-avant.txt`. Résumé : `Tests 17 failed | 5 passed (22)`. Rouges pour la bonne raison, par exemple :
- German Pils : `expected 'Caramünch II' to be 'Pilsner Malz'` (le caramel épinglé passe en tête)
- Hazy IPA : `expected 'Carapils' to be 'Haferflocken'`
- stout, jeu complet de 6 tuiles : `expected 'Carapils' to be 'Schokoladenmalz'` ; `15B : Röstgerste est dans les 6 tuiles: expected -1 to be >= 0`
- sans donnée : `expected 'Pilsner Malz' to be 'Malt de la maison'` ; bornes : `expected [ 'Lactose', 'Carahell', … ] to deeply equal [ 'Pale Ale Malz', … ]`
- épuisé / épinglé : `expected [ 'Münchner Malz', 'Carapils' ] to deeply equal [ 'Carapils', 'Münchner Malz' ]`
- écartement : `expected [ 'Münchner Malz', 'Weizenmalz hell' ] to deeply equal [ 'Weizenmalz hell' ]` (la ligne liée par `ref` n'est pas vue)
Verts avant comme après (non-régression) : « Cara » n'écarte pas Carapils ; ebcVise sans effet ; style sans correspondance ; `max`. Après : tous verts.

## German Pils et Stout : l'ordre obtenu (table réelle)
- German Pils (5D), avec la plausibilité (`ebcMax` 7,9, stock de 15 articles dont Schokoladenmalz 700, Röstgerste 1000, Schwarzmalz 1300, Caramünch II 120, Carahell 25) : Pilsner Malz, Carapils, Weizenmalz hell, Pale Ale Malz, Münchner Malz, Wiener Malz, Haferflocken, Carahell. Ni Schokoladenmalz, ni Röstgerste, ni Schwarzmalz, ni Caramünch II (120 > 79) : écartés, trouvables par la recherche. Sans `ebcVise` ni `ebcMax`, l'ordre par bornes met Schokoladenmalz (≤ 47,4 %) et Röstgerste (≤ 37,2 %) en 3e et 6e place : c'est ce que la plausibilité corrige. Pilsner Malz (91,5 %), Carapils (32,7 %). Caramünch II (≤ 6,5 %) est derrière Pilsner Malz ; Lactose et Sucre candi (≤ 5,6 % et 4,2 %) derrière Pale Ale et Münchner.
- Irish Stout (15B, `ebcMax` 100) : Röstgerste, Haferflocken, Lactose, Schokoladenmalz, Schwarzmalz restent (cités ou voisins), puis Pilsner Malz, Weizenmalz hell, Pale Ale Malz ; sans teinte : Gerstenflocken (51,9 %), Röstgerste (75,5 %), Haferflocken, Schokoladenmalz et Lactose (voisines, à moitié), Schwarzmalz (23,9 %).
- Sweet Stout (16A) : Lactose, Röstgerste, Schokoladenmalz, Haferflocken, Schwarzmalz, Gerstenflocken. Oatmeal Stout (16B) : Haferflocken (87,6 %), Röstgerste, Schokoladenmalz, Schwarzmalz.
- Hazy IPA (21C) : Haferflocken (74,8 %), Pale Ale Malz (44,6 %), Carapils (28,5 %), Weizenflocken (26,2 %). American IPA (21A) : Carapils (27,8 %), Pilsner Malz (≤ 78,5 %) devant Weizenmalz hell (≤ 46,9 %) ; Pale Ale Malz (≤ 42,6 %) vient après Weizenmalz par la borne seule. Weissbier (10A) : Weizenmalz hell. Belgian Tripel (26C) : Pilsner Malz, Sucre candi.

## Critères (rejoués après correction)
- G1 `COMPRIS OK (5 doutes)` ; G2 `TESTS PROPOSITION OK` (4 fichiers de la voie ; les 32 tests de `tests/unit/fermentescibles` du port passent aussi) ; G3 `TYPICITE MALTS OK` (recalcule table et noms depuis les relevés, sans réseau) ; G4 `TYPES OK` ; G5 `NOTE OK` ; G6 `NOTE OK` (cette note contient `TEMOIN AVANT`, `German Pils`, `Stout`, `CC BY-SA`, `inconnu`).

## Licence
Beer Analytics (www.beer-analytics.com), **CC BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0/). Relevés, table et fichier des noms la portent en en-tête (`source.licence`) ; à citer et à partager dans les mêmes conditions. L'inconnu reste inconnu : un style absent d'une liste de 16 n'est jamais 0. Mention dans les crédits de l'app : plus tard (relecture 10, rien à faire ici).

## Pour le port
Signature inchangée. `table?` facultatif ; sans lui, la règle lit la table posée par `chargerTypicite()` (import dynamique, morceau à part ; testé : succès, échec puis reprise). Hors ligne, le morceau n'arrive que s'il est dans le cache du navigateur (pas de service worker pour les assets) ; sinon les tuiles retombent sur disponible, épinglé, nom, sans signe. `stockItemRef` = `ref` de l'article.

## Doutes et limites
- Seuils des paliers (50, 15, 3 %) et voisinage des stouts à moitié : [H], à montrer au brasseur ; constantes `PALIERS_TYPICITE` et `POIDS_VOISIN`. Deux malts à 52 % et 75 % sont au même palier (Gerstenflocken et Röstgerste en 15B) : départagés par le stock, l'épingle, le nom.
- Les voisines peuvent promouvoir un peu trop (Haferflocken, Lactose en Irish Stout par les stouts sucrées) : demi-poids, palier « courant », jamais « dans la plupart ».
- L'effet de borne (Schokoladenmalz, Röstgerste en German Pils) est corrigé par la plausibilité. Elle ne s'applique qu'avec une borne d'EBC (`ebcMax` ou `ebcVise`) et une table chargée : avant l'arrivée de la table, le malt chocolat peut apparaître une fraction de seconde. **Le port doit passer `ebcMax = ebcPlage.max`** (aujourd'hui `Ajout.tsx` ne passe que `ebcVise`, le milieu de la plage : la règle est alors un peu plus stricte que voulu ; en German Pils, 59 au lieu de 79 EBC). Hypothèse [H] : le plafond de 10 fois.
- `parts` garde environ 100 identifiants que `NOMS` n'atteint pas (noms et recettes sont sortis de la page, pas ces parts) : elles servent dès qu'on ajoute un nom à `noms.ts`.
- Les 17 lignes BJCP à sous-styles (21B, 27A) n'ont pas de typicité. Noms du stock réel que je n'ai pas vus : inconnus tant qu'ils ne sont pas dans `noms.ts`, jamais écartés.
- Build complet et suite entière non rejoués ; `tsc` vert.

DÉCISION À PRENDRE : aucune bloquante. Décidé par le pilote : les seuils 50 / 15 / 3 % et le demi-poids des stouts sont acceptés ; la plausibilité (10 ×, non cités seulement) est posée. Reste au port : passer `ebcMax` (ligne ci-dessus).

CONNAISSANCE : Beer Analytics publie, pour chaque fermentescible (grain, sucre, fruit, extrait), le graphique `typical-styles-relative` des 16 styles où il pèse le plus ; 238 pages au sitemap. Un style absent d'une liste n'est pas 0 : la part y est au plus la 16e. En German Pils, seuls 4 fermentescibles citent le style dans leurs 16 premiers.

LEÇON PROPOSÉE : la couleur brute d'un composant n'est pas celle du produit fini ; ne jamais comparer `colorEbc` d'un malt à l'EBC de la bière (un clé de rang doit se prouver sur des cas où le métier connaît la réponse : 15B, 16B, 5D, 21C, avant d'être livrée).
