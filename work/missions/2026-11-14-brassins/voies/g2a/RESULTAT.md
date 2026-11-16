OK — 8 bloquants k2 de e5 et e6 corrigés, 31 images refaites et ouvertes

## Bloquants corrigés (k2/VERDICT.md, sections e5 et e6)
- [x] e5a n° 1 : 24 L sur les 5 tuiles de recettes (Pils 25 et Stout 30 retirés).
- [x] e5a n° 2 : liste du geste = la carte de la liste de l'app telle quelle (démo de la trousse) : étoile favori, « … », états de l'app (Fermentation, Garde froide, Planifié, Conditionné, Terminé), contexte « Température du 14.11 à renseigner » ; seule la carte LOT-021 encadrée est ajoutée (avec son étoile).
- [x] e5b n° 1 : F4 inventée retirée, F2 à 30 L ; tête « F2 attend la Pale Ale depuis 6 jours. » ; geste : la Pale Ale LOT-020 posée dans F2 le 16.11 (« LOT-020 planifié au 16.11 », pas de doublon) ; vide : « F2 est libre. Ton carnet est vide. »
- [x] e5d n° 1 : tampon rouge pivoté en capitales retiré ; pastille hop « ✓ Planifié · LOT-021 · 15.11 » sous la phrase.
- [x] e6b n° 1 : étoile (pleine pour la NEIPA, creuse ailleurs) ET « … » (Ranger) sur chaque ligne, 390, cave et 1280.
- [x] e6c n° 1 : comptes à facettes : chaque groupe compte avec les filtres des autres groupes. Geste : APA, Stout, Saison à 0. Vide : À brasser, Terminés, Mesures manquantes, Favoris, APA, Saison, Citra, Mosaic à 0 ; Conditionnés 1 (le Stout). Puces à 0 estompées.
- [x] e6d n° 1 : étoile (pleine ou creuse) et « … » sur chaque brassin : 3 cuves (sous la cuve, à côté de l'action), Stout, Saison, et les 3 lignes de la liste du geste.
- [x] e6d n° 2 : « Garde » remplacée par « F3 · 30 L » (repos, geste) ; vide « F3 30 L libre » ; tête « F1 et F3 travaillent, F2 attend la Pale Ale ».

## Non bloquants faits
- e5a n° 3 « recette 24 L · cuve 30 L », vide « Cuve 30 L » ; n° 4 pastille « LOT-020 prévu » sur la tuile Pale Ale ; n° 5 « fût F-01 · 12 L » ; n° 6 NOTE.md à jour (ligne re6, données).
- e5b n° 2 repère « plein » hachuré au bout de la jauge (« F2 · 30 L plein ») ; n° 3 ordre des tuiles fixe ; n° 4 NOTE.md à jour (F2, pas F1).
- e5d n° 2 8 px entre les lignes de la phrase ; n° 3 panneau et tuiles au jeton EBC de chaque recette (NEIPA or au repos, Saison ambre au geste) ; n° 4 « Touche un trou de la phrase » ; n° 5 « dim. 15.11 » et e5a « sam. 21.11 » en Source Sans.
- e6b n° 2 « Pils en cours, Pale Ale en retard » ; n° 4 étiquette 15.11 retirée de l'axe ; n° 5 « fût F-01 · 12 L ».
- e6c n° 2 un seul « Tout effacer » au vide (le pied, « Tout effacer · 5 ») ; n° 3 air (28 px) sous la dernière section.
- e6d n° 3 bouton filtres (style, houblon, période) à côté du tri, puces sur deux lignes ; n° 4 « fût F-01 · 12 L ».

## Pas fait, et pourquoi
- e6b n° 3 (1280) : « Tout l'historique » vient de l'en-tête de l'app (chrome.js de la trousse, hors Possède) ; doute du critique, laissé.
- e6c n° 3 : au repos, la période reste sous le pied à 844 px (contenu plus haut que l'écran) ; elle est entière dans `e6c-defile`.
- e5d n° 3 : sans EBC dans le brief, le jeton est estimé (Pils et NEIPA or, Saison ambre, Pale Ale cuivre, Stout noir) ; la teinte de style de l'app (lime, orange) rendait IDENTITE KO (couleurs hors palette), donc écartée. Les tuiles straw tombaient au noir en clair : Pils en or.
- Petits restes vus : e5a-vide « 30 L » en mono espacé ; e5b-vide montre la Pale Ale planifiée alors que le carnet est vide (déjà avant).

## Fichiers écrits
- `voies/e5/e5a|e5b|e5d/etat.html`, `NOTE.md`, PNG ; `voies/e6/e6b|e6c|e6d/etat.html`, `NOTE.md`, PNG ; `voies/g2a/RESULTAT.md`, `tests.txt`.

## Critères (sorties dans tests.txt)
- G1 COCHE OK 8 ; G2 IMAGES OK ; G3 HORS KO, seul `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, déjà modifié avant la voie (git status initial), pas par g2a ; controle-identite e5 et e6 : IDENTITE OK 4/4.

## Captures (toutes ouvertes)
- e5a : repos, geste, vide (390 clair) ; e5b : repos, geste, vide ; e5d : repos, geste, vide.
- e6b : repos, geste, vide (390 clair), repos-390-cave, repos-1280-clair ; e6c : repos, geste, vide, defile ; e6d : repos, geste, vide.
- Thème cave et 1280 : seulement là où le capture.mjs de la série les prévoit (e6b ; e5c et e6a non concernées).

Prédiction : « Là je retrouve mes cartes, mes étoiles et mes trois cuves ; les comptes tombent juste. »

DÉCISION À PRENDRE : e5b geste : poser la Pale Ale déjà planifiée (LOT-020) dans F2 plutôt qu'un nouveau LOT-021, puisque F2 est la seule cuve libre ; à confirmer par le pilote.
CONNAISSANCE : `--ebc-straw` vaut presque noir en thème clair (couleur d'action) : ne pas l'employer comme teinte de bière ; les teintes de style de l'app (`--id-style-*`) font échouer controle-identite hors des pastilles `.id-style`.
LEÇON PROPOSÉE : aucune
