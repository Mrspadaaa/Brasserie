ECHEC — G4 : CHOIX ECHEC (registre : dryhopper, étape) et COMMUN de la route fiche, en échec dès HEAD

La matrice de flb5b est rendue sous le radar de g1 : G1, G2 et G3 sont OK, la fiche est « conforme » pour controle-choix (REPRISE OK), et ses quatre contrôles du registre passent. G4 échoue sur des causes extérieures à mon « Possède », toutes déjà présentes avant mon changement (détail plus bas).

## Fichiers écrits (Possède seulement)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/donnees-matrice.ts` (neuf) : les mots des fiches (familyWords, traduits : étiquettes françaises de Beer Maverick, puis la table de flb5b) et l'ordre de flb5b. « classé » : la ligne « Familles déclarées » de Hopsteiner. Les colonnes : les 4 premiers de `lireRemplacants` (u4, D35), sans sa propre variété.
- `…/fiche/Matrice.tsx` (neuf) : le bandeau « Lui seul : … » (`data-role="hors-16d" data-houblon="<clé>"`), la grille, la ligne des pictos « ? » et la légende derrière un « ? ».
- `…/fiche/FicheHoublon.tsx` : le bloc gris de g1 (bande, familles, « sans famille », « non décrites ») est remplacé par `<NonDecrites>` et `<Matrice>`. Le reste de g1 ne change pas.
- `…/fiche/fiche.css` : les classes `pq-fiche-mx-*`.
- `…/fiche/jeu.mjs` : le geste « aromes et sources » devient « matrice de flb5b » (bandeau, pictos, colonnes du moteur rangées par pire cas).
- `…/fiche/NOTE.md` : section « ## Reprise D130 » ; dans « ## Reprise », g1-bande et g1-premier sont écartés avec leur raison, et g1-familles, g1-sans-famille et g1-non-decrites sont repris dans la matrice.
- Construit dans `prototypes/houblons-v4/maquettes/parcours-fiche/`. Aucune écriture à la racine ni hors du « Possède » (git status vérifié).

## Critères (rejoués sur la dernière construction)
- G1 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-fiche/` ; `TYPES OK`.
- G2 : `HORS-16D OK (1 : beermaverick-nugget « Lui seul : ananas, gingembre, géranium, litchi »)`.
- G3 : `ETATS OK (16/16)`.
- G4 : ECHEC.
  - `CHOIX ECHEC (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`. La fiche est conforme (`REPRISE OK (10 repris, 0 en contexte, 0 en pont, 2 écartés)`). L'échec vient de deux défauts du registre `choix/ecrans.json`, dont le contrôle rejoue tous les écrans même avec `--ecran=fiche` :
    - dryhopper : `mots` contient un commentaire (« Partir sur cette version (24.10, soir, sur p4b2f dans « Planches… ») »), introuvable tel quel dans SPEC-BRASSEUR ;
    - etape-houblons : son complément 1, même cause.
  - `COMMUN ECHEC` sur la route fiche, avec trois contrôles en échec. Les trois échouent **à l'identique sur HEAD**, sans mon changement : j'ai construit la fiche de HEAD à part, puis je l'ai supprimée.
    - mots : 194 mots, car la page compte Ma bière sous la feuille ;
    - fiche D25/D49 : la page s'ouvre fiche déjà ouverte, donc « un toucher court ouvre la fiche » ;
    - legende : `document.querySelector` prend le « ? » de Ma bière, caché sous la feuille. Celui de la fiche vient après, par le portail.
  - Avec `--sans=mots` (contrat REPRISE-D124) : COMMUN ECHEC 2 (fiche, legende).
- Contrôles du registre pour la fiche :
  - `FICHE OK 1/1` ;
  - `FICHE-BASELINE OK` ;
  - `FICHE-RADAR OK` (radar 168–510 px, liste dès 589 px) ;
  - `ETATS OK` ;
  - `ETAPE OK (fiche)` (jeu.mjs) ;
  - `SANS-FAMILLE OK`.
- `TEINTE ECHEC (6/7)` : l'écart vient de dryhopper, pas de la fiche.

## Captures (ouvertes, à côté de flb5b-premier-ecran.png, flb5b-motueka.png et consolide-fiche-390.png)
Dans `prototypes/houblons-v4/maquettes/parcours-fiche/captures/` :
- `r14-nelson-sauvin.png` (premier écran : bandeau à 613 px) et `r14-nelson-sauvin-bas.png` ;
- `r14-motueka.png` et `r14-motueka-bas.png` ;
- `r14-nelson-sauvin-legende.png` ;
- `r14-nugget(-bas).png`, `r14-idaho-7(-bas).png` (« 1 seule fiche : Beer Maverick », jamais « 1/1 ») et `r14-citra-cryo(-bas).png`.

Les lignes sont recomptées identiques à flb5b :
- Nelson Sauvin : vin blanc, raisin, groseille à maquereau (2/2), sauvignon blanc (1/2), fruité 2/2, agrumes et épicé « classé » ;
- Motueka : citron vert, mojito, zeste de citron, citron, agrumes, fruits tropicaux, floral, puis fruité « classé ».

« Lui seul » est identique aussi : « vin blanc, raisin, groseille à maquereau, sauvignon blanc » et « mojito, zeste de citron ».

Prédiction : « Oui, c'est ma matrice, et le hors 16d saute aux yeux. » Il demandera peut-être pourquoi les remplaçants ne sont plus ceux de flb5b.

## Choix faits dans le contrat
- DÉCISION : les colonnes suivent le calcul de u4 (VOIE, D35), pas pack-fiches.json comme flb5b.
  - Nelson Sauvin : Boomerang 91, Herkules 89, Phoenix 87, CTZ 84 (flb5b : …, Pacific Jade 87).
  - Motueka : Cascade 88, Taiheke 86, Mandarina Bavaria 82, Pilot 82 (flb5b : Buzz Bullets 94, Shaddock, Cascade, Southern Sublime).
  - « Lui seul » ne change pas.
  - Un houblon hors de la recette prend le contexte « défaut » du moteur : `lireRemplacants` sans moment.
- DÉCISION : sa propre variété sous une autre forme (Citra pour Citra cryo) ne prend pas de colonne : elle a les mêmes fiches, donc les mêmes mots. Sans ce choix, Citra cryo donnait « Lui seul : aucun mot ».
- Ajouts dans le coin vide de la grille de flb5b :
  - la légende de flb5b, derrière un « ? » de 24 px (cible de 44 px) ;
  - « 1 seule fiche : … » (g1) ;
  - la part « autres » (D100).
- Sans aucun mot propre, le bandeau dit « Lui seul : aucun mot, ses remplaçants disent aussi les siens », sans `data-role="hors-16d"`.

DÉCISION À PRENDRE :
1. Corriger `mots` de dryhopper et le complément 1 d'etape-houblons dans `choix/ecrans.json`, avec ses mots seuls, mot pour mot. Sans cela, `controle-choix.mjs` reste ECHEC pour tous les écrans.
2. G4 lance `controle-commun` sur la route fiche, où mots, fiche et legende échouent par construction (Ma bière sous la feuille). Il faut soit le remplacer par les contrôles du registre (controle-fiche sur ma-biere : OK), soit rendre ces trois contrôles conscients de la feuille ouverte (`[data-role="fiche"]` d'abord).

CONNAISSANCE : la ligne Hopsteiner « Familles déclarées » est comptée comme une fiche par le radar (Nugget : « Herbacé 2/4 ») mais « classé » dans la matrice (« herbacé 1/4 »). Ces deux nombres se contredisent à l'œil sur Nugget, à trancher par le pilote ou en variantes. Autre fait : les mots des remplaçants gardent de l'anglais non traduit (« light citrus », « dank », « lilac »), qui ne se croise pas avec les mots français.

LEÇON PROPOSÉE : rejouer chaque CHECK de GATES.md sur la base (HEAD) avant de lancer la voie. Un critère déjà en échec sur la base, ici COMMUN sur la route fiche et CHOIX par le registre, condamne la voie sans rien dire de son travail.
