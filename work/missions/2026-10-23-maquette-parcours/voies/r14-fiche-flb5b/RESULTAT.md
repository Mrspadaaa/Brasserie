ECHEC — G4 : COMMUN échoue sur la route fiche dès HEAD (Ma bière sous la feuille) ; CHOIX OK, G1–G3 OK, G5 OK

La fiche porte maintenant :
- la matrice de flb5b sous le radar de g1 (D130) ;
- le pied de flu2b (D132) ;
- un inventaire exhaustif des données du houblon.

Tous les critères passent, sauf le COMMUN de G4. Ses trois échecs viennent de la page (Ma bière rendue sous la feuille), pas de la fiche. Sur Nelson Sauvin, le contrôle exhaustif bute sur un seul remplaçant (DÉCISION 2).

## Fichiers écrits (Possède seulement)
Dans `prototypes/houblons-v4/parcours/src/ecrans/fiche/` :
- `donnees-matrice.ts`, `Matrice.tsx` : la matrice de flb5b, le bandeau « Lui seul » (`data-role="hors-16d"`), les pictos « ? » et la légende derrière un « ? ».
- `Replis.tsx` : le pied de flu2b. `ReplisBoutons` porte les quatre pastilles, fixées en bas de la feuille sous ♡ ⊘ Comparer. `Replis` déplie la section dans le flux, sous la matrice. Les ajouts :
  - Huiles : accord des fiches, thiols de Hopsteiner ;
  - Sources : accord α/β, mon stock (ou « épuisé »), article, d'où vient l'α du lot, dans ma recette (g, moment, IBU), IBU par gramme à 60′, alias, forme « ? », « 1er chez … », textes des fiches tels qu'écrits ;
  - Substituts : calculés aussi hors de ma recette, sans moment ; scores de Beer Maverick non importés.
- `sources.ts` : accord, alias, thiol, stock, textes, premier (lus dans le catalogue du moteur).
- `FicheHoublon.tsx` : le pied flu2b ; l'icône de stock à côté de l'usage (L04).
- `fiche.css`, `jeu.mjs` (geste « matrice de flb5b »).
- `NOTE.md` : sections « Reprise D130 » et « Pied de flu2b et fiche exhaustive (D132) », avec l'inventaire champ → place de pack-fiches.json, Nugget et Nelson Sauvin.

Dans la sortie : `prototypes/houblons-v4/maquettes/parcours-fiche/fiche/nelson-sauvin.html`, une copie de `etat.html` qui ouvre `#/fiche/beermaverick-nelson-sauvin`. C'est un état de contrôle, à recréer après chaque construction.

## Critères (rejoués sur la dernière construction)
- G1 : `CONSTRUIT OK (9 pages)` ; `TYPES OK`.
- G2 : `HORS-16D OK (1 : beermaverick-nugget « Lui seul : ananas, gingembre, géranium, litchi »)`.
- G3 : `ETATS OK (16/16)`.
- G4 :
  - `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`. L'échec signalé par le pilote venait d'une construction antérieure à ma NOTE ; `REPRISE OK (10 repris, 0 en contexte, 0 en pont, 2 écartés)`.
  - `COMMUN ECHEC 3 contrôle(s)`, identique sur HEAD avant la voie. Les trois échecs ne sont pas dans ma voie :
    - mots : 194 mots, parce que Ma bière est comptée sous la feuille ;
    - fiche D25/D49 : la page s'ouvre fiche déjà ouverte ;
    - legende : `document.querySelector` prend le premier `[data-role="legende-bouton"]`. Relevé au rendu : 3 boutons de `ma-biere` (page), puis celui de la fiche (feuille).
- G5 : `EXHAUSTIVE OK Nugget (pied de flu2b ; 15 catégories : nom, α, β, huile totale, composés des huiles, origine, styles, sources, stock, dans ma recette, IBU par gramme à 60′, familles citées, mots précis des familles, mots hors des 12, remplaçants)`.
- G5 sur Nelson Sauvin, avec `controle-fiche-exhaustive.mjs …/fiche/nelson-sauvin.html --houblon="Nelson Sauvin"` : `EXHAUSTIVE ECHEC Nelson Sauvin (P2 remplaçants : Pacific Jade)`. Voir DÉCISION 2.
- Autres contrôles :
  - `ETAPE OK (fiche)` ;
  - `FICHE OK 1/1` ;
  - `FICHE-RADAR OK` ;
  - `FICHE-BASELINE OK` et `SANS-FAMILLE OK` (passe précédente, la fiche n'a pas changé dans leur portée).

## Captures (ouvertes, à côté de flb5b, flu2b et g1)
Dans `prototypes/houblons-v4/maquettes/parcours-fiche/captures/` :
- `r14-nelson-sauvin.png` : premier écran, avec le bandeau et le pied de flu2b ;
- `r14-nelson-sauvin-bas.png`, `r14-motueka(-bas).png`, `r14-nugget(-bas).png`, `r14-idaho-7(-bas).png`, `r14-citra-cryo(-bas).png` ;
- `r14-nelson-sauvin-legende.png` ;
- `r14-nugget-sources.png` et `r14-nelson-sauvin-sources.png` ;
- `r14-*-huiles.png` et `r14-*-substituts.png`.

Les lignes de la matrice sont recomptées identiques à flb5b, sur Nelson Sauvin comme sur Motueka.

Prédiction : « Le footer est là, et tout y est. » Sources est dense, mais seulement à un toucher.

## Choix faits dans le contrat
- DÉCISION : l'inventaire de g1 nomme la liste elle-même par cinq éléments : g1-bande, g1-familles, g1-premier, g1-sans-famille, g1-non-decrites. flb5b les remplace par son choix :
  - g1-familles, g1-sans-famille et g1-non-decrites sont repris dans la matrice et dans la ligne des pictos « ? » ;
  - g1-bande et g1-premier sont écartés avec leur raison (D130). « 1er chez … » reste dans Sources.
  - Les autres éléments de g1 sont tous rendus.
- DÉCISION : les colonnes de la matrice et Substituts suivent le calcul de u4 en direct (D35), au style de ma recette, pas la liste figée du pack. Hors de ma recette : sans moment. Sa propre variété (Citra pour Citra cryo) ne prend pas de colonne.
- La ligne « IBU par gramme à 60′ » sort du moteur sur ma recette (Nugget 1,3, comme le pack). Les autres moments restent écartés (« Inutile »).

DÉCISION À PRENDRE :
1. G4 joue `controle-commun` sur la route fiche, où mots, fiche et legende échouent par construction. Deux voies : remplacer ce contrôle par les contrôles du registre (déjà OK), ou rendre mots-premier-ecran, controle-fiche et controle-legende conscients d'une feuille ouverte (`[data-role="fiche"]` d'abord). Ces scripts sont hors de ma voie.
2. Sur Nelson Sauvin, `controle-fiche-exhaustive` P2 exige les quatre premiers `substitutsCalcules` du pack : Boomerang, Herkules, Phoenix, Pacific Jade. Ce calcul figé n'a pas de style. La fiche suit D35 (le calcul de Substituer au style 16D de ma recette) et montre Boomerang 91, Herkules 89, Phoenix 87, CTZ 84, Marynka 84, puis le stock. Pacific Jade n'y est pas. Deux voies :
   - le contrôle lit les remplaçants du moteur au style de la recette ;
   - on revient au pack, mais alors la fiche et Substituer classeraient autrement les mêmes houblons, contre D35.
   - Je n'ai pas ajouté Pacific Jade à la main.
3. Données : l'article de stock de Nugget s'appelle « Nuget » dans le dépôt. Il est montré tel quel.

CONNAISSANCE :
- La ligne Hopsteiner « Familles déclarées » compte comme une fiche au radar (Nugget « Herbacé 2/4 »). La matrice la range « classé » (« herbacé 1/4 »). Les deux nombres se contredisent à l'œil.
- Les mots des remplaçants gardent de l'anglais non traduit (« light citrus », « dank »).

LEÇON PROPOSÉE : rejouer chaque CHECK de GATES.md sur HEAD avant de lancer une voie. Un critère déjà rouge sur la base, comme COMMUN sur la route fiche, ou qui lit une donnée figée contraire à une décision (le pack contre D35), condamne la voie sans rien dire de son travail.
