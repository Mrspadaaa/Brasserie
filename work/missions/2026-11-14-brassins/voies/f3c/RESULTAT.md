OK — 8 bloquants de c5c corrigés (e9d, e10a-d, e11c, e11d), images régénérées et ouvertes

## Bloquants
- [x] e9d n° 1 : bulle « ↑ posée dans « à lancer » » sous le disque Lager (plus sur « À PRÉPARER » ni sur H) ; Lager descendu sous l'étiquette « Bière d'hiver » ; Saison et Pils décalés.
- [x] e10a n° 1 : à 40 L, titre-réponse « 40 L ne tiennent pas dans F1 » (rouge) + « F1 et le Système 30 L prennent 30 L au plus » ; tuiles Eau cerclées de rouge, « dépasse 30 L » et « 47,4 L avant ébullition ».
- [x] e10b n° 1 : « Ramener à 30 L » devient « Ramener à 24 L » (le volume de la recette, 6 L de marge dans F1).
- [x] e10c n° 1 : à 40 L, titre « 40 L ne tiennent pas dans F1 » + phrase Système 30 L ; piste rouge au-delà de 30, poignée rouge.
- [x] e10d n° 1 : bulles de valeur posées en rangée sous les noms d'axes (plus sur l'axe) ; F1 décalé ; graduations masquées sous un point (le « 1 » de la levure ne se lit plus à moitié).
- [x] e10d n° 2 : « 1 sachet jusqu'à 24 L » (calcul : ceil(1 × V/24), src/domain/adaptRecipeEquipment.ts l. 91).
- [x] e11c n° 1 : « F2 attend la Pale Ale depuis 6 j » sur repos et geste ; recettes : « F2 attend la Pale Ale depuis 6 j » (plus de contradiction).
- [x] e11d n° 1 : titres en interligne 1,32, cadres noirs en bloc sans débord : « Demain, », « La Pale Ale », « brassin. » ne sont plus mordus.

## Non bloquants faits
- e9d n° 4 : tuiles plus hautes (88 px), vide bas réduit.
- e10b n° 2 : tuile Eau cerclée ocre, « dépasse le Système 30 L ». n° 3 : « pouce sur la cuve ↕ » retiré. n° 4 : « + 2 470 L » sur fond plein. n° 6 : « empâtage · rinçage » coupés entre les deux segments, jamais dans un nombre.
- e10c n° 2 : aucune coche au repos. n° 3 : graduations à 10, 20, 30, 40, 50, 60 L.
- e10d n° 3 : titre du geste « 40 L ne tiennent pas dans F1 : … ». n° 4 (moitié) : nombres insécables dans le titre. n° 5 : « ↕ pouce » retiré. n° 6 : 10,66 kg en titre comme sur l'axe.
- e10a n° 4 et e10c n° 4 : NOTE.md ne coche plus « volume refusé » et « carnet vide » comme dessinés (écrits dans etat.html, non capturés).
- e11c n° 2 : tuile F1 « Citra 100 g · Mosaic 80 g » avec pictos. n° 4 : rangée « Sur Brassins : Nouveau brassin » retirée (doublon de « Préparer un brassin »).

## Non faits (et pourquoi)
- Hors une ligne : e9d n° 2-3 (dessiner le toucher et la feuille +), e10a n° 2-3 (un seul sélecteur, resserrer), e10b n° 5 (vide), e10c —, e10d n° 4 (1280 gauche vide), e11c n° 3 et 5 (têtes de tuiles, barre de l'app), e11d n° 2-6 (recherche, texte vertical, cartes, barre, + idée). Contexte à 150 k : arrêt.

## Fichiers écrits
- etat.html : e9/e9d, e10/e10a, e10/e10b, e10/e10c, e10/e10d, e11/e11c, e11/e11d ; NOTE.md : e10/e10a, e10/e10c.
- PNG régénérés par le capture.mjs de chaque série (mêmes noms), tous ouverts : e9d (3), e10a (2), e10b (6), e10c (2), e10d (4), e11c (3), e11d (3).

## Critères
Voir tests.txt (G1 COCHE OK, G2 IMAGES OK, G3 HORS OK).

Prédiction : « Là au moins il me dit que 40 L ne passent pas dans F1 » ; il reprochera encore les variantes faibles (e10a, e11d) sur le fond.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : levure à l'échelle = ceil(sachets × V / V recette) (src/domain/adaptRecipeEquipment.ts l. 91) : 1 sachet jusqu'à 24 L pour la NEIPA, 2 jusqu'à 48 L.
LEÇON PROPOSÉE : un calculateur de volume dessine toujours l'état « au-delà de la cuve » avec un titre-réponse rouge (trois variantes sur quatre l'avaient tu, L14).
