# za2 — zq1 apaisée, lecture « l'ordre » (v2, 15.11)

Lecture dominante (BRIEF-APAISE, za2) : le fil part du calme. En tête, une coche verte posée sur l'axe du fil :
« 9 appareils en ordre · prochain 01.12 ». Puis l'avenir à sa vraie distance. Tout ce qui est dû est rangé dans un seul
tiroir, « 4 gestes cette semaine », replié en bas au repos et ouvert d'un toucher. Ouvert, il garde les lignes de zq1 et
leurs gestes à droite, en 44 px.

Base : `v1/z/zq1` (règle n° 1). Le CSS, la fiche du pH-mètre, la colonne droite du 1280 et la feuille d'ajout sont repris
tels quels par `voies/v2-za2/build.mjs`, qui lit `v1/z/zq1/parts.html` en lecture seule. Préfixe `za2-`.

## Ce qui change par rapport à zq1
1. Le haut du fil n'est plus la zone du dû (rail rouge puis ambre, quatre lignes en tête). Il commence par la coche
   « 9 appareils en ordre · prochain 01.12 », centrée sur l'axe du rail : 13 − 4 dus = 9, et le prochain est le
   déshumidificateur, le 01.12, dans 17 j.
2. Les quatre dus (pompe, pH-mètre, refroidisseur, densimètre) quittent le haut. Ils vont dans un seul tiroir, ancré
   au-dessus de la barre du bas : quatre mini pictos, chacun avec un point d'état (rouge pour la panne, ambre pour les
   retards, cercle vide pour « jamais étalonné »), puis « 4 gestes cette semaine » et un chevron.
3. Le filtre « À traiter 4 » en puce rouge est retiré : le tiroir fait ce filtre (acquis gardé en fonction, pas en forme).
   La puce « Tout 13 » part avec lui. C'est un écart à un acquis, voulu : le badge rouge en tête de liste était la
   première source d'angoisse.
4. Échelle 5,5 px/j au lieu de 3,5 : la place rendue par le dû aère le fil.
   - 17 j : 79,5 px ; 30 j : 151 ; 36 j : 184 ; 44 j : 228 ; janvier (48 j) : 250 ;
   - coupure, puis mars : la cuve, dans 108 j.
5. « dans 17 j » n'est plus en ambre : ce qui n'est pas dû reste en encre.
6. Traiter : le tiroir est ouvert, juste après « Étalonné ».
   - La ligne du pH-mètre reste en place, en vert pâle : « ✓ étalonné · prochain 14.12 », avec « Annuler » à la place du
     geste. Le snack flottant de zq1 est intégré à la ligne.
   - Le titre passe à « 3 gestes ». En tête, « 10 appareils en ordre ».
   - Dans le fil, le pH-mètre descend à 30 j, surligné en vert, avec sa trace en tirets.
7. Fiche : le gros « retard 3 j » ambre (22 px) devient « ✓ 4 sur 4 dans la tolérance · prévu le 11.11 ». Les quatre
   étalonnages passés sont tous à ±0,05 ou moins ; 7,05 et 4,05 sont à la limite. Le reste de la fiche est identique.
8. 1280 : la colonne gauche reprend le calme et le fil à 3,5 px/j, la même échelle que la fiche. Le tiroir y est ouvert
   au pied, avec le pH-mètre choisi. La fiche à droite est celle de zq1, avec l'état apaisé.
9. Vide : en tête, « Aucun matériel » avec une coche en tirets ; pas de tiroir.

## Ce qui est gardé (zq1)
- Le fil vertical à vraie distance, le point « aujourd'hui 14.11 », la bande « 30 j », les mois et la coupure.
- Les gestes à droite de chaque ligne due : Réparée, Étalonner, Fait, en 44 px.
- Achat dans la barre. Déjà possédé, Projets et « 1 739 CHF · 2 prix connus » au pied.
- La grille « sans échéance 5 ».
- La fiche du pH-mètre en fil : étapes, flacons, valeurs lues, rythme, état, dépenses sur 2 prix connus,
  Payer un entretien, Étalonné.
- La feuille Nouveau matériel et son aperçu sur le fil (01.02, dans 79 j).
- La coque identique à l'app, en clair et en cave.

## Mesures (rejouées le 15.11)
- `mots-premier-ecran.mjs v2 za2 --page=etat.html --sans-lignes --profil=sans-houblons --max=60` : 60 mots, coque
  comprise, MOTS OK. Avec `--sans-coquille` : MOTS OK. zq1, par la même commande : 73.
- Aucun texte sous 12 px dans les 5 états à 390. Aucune cible de moins de 24 px. Gestes : 44 px (tiroir fermé : 60 px).
  Aucun `type="number"`. 38 `data-booster`.
- Inconnu jamais 0 : « jamais étalonné », « date et prix inconnus ». Total honnête : 2 prix connus.
- Dates calculées depuis le 14.11.2026, comme zq1.

## Boosters
- en-ordre (la coche, lire d'un coup d'œil), tiroir-gestes (déclencher : ouvrir, puis faire), fil-echeances et
  echelle-temps (suivre), frise-30-jours, descend-au-fil (retour du geste), annuler, reparee, fait, etalonner-densimetre.
- Fiche : etat-apaise, plus ceux de zq1.

## Reste ouvert
- Au repos, faire un geste coûte un toucher de plus que dans zq1 (ouvrir le tiroir). C'est le prix du calme. Si cela
  coûte trop, la variante voisine garde le tiroir ouvert par défaut, en bas : à montrer, pas à trancher ici.
- Environ 30 px de blanc sous « Moulin à malt » à 390, avant le pied.
- « Cuve fermentation 100L » tient sur deux lignes dans la grille (déjà le cas dans zq1).

Prédiction : « Là je respire : je vois d'abord que tout va bien, et mes 4 trucs à faire m'attendent en bas sans me crier
dessus. »
