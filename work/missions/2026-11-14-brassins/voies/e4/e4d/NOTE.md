# e4d — chaude
Chaleur : chaude (genre neuf : le bon de tirage).
Idée : Le bon de tirage, à tamponner.
Tout l'écran prend la couleur de la bière (Pils dorée, Stout brune). Compteur à rouleaux pour les bouteilles, curseur m2 dessous, fûts vus de dessus à toucher ; un bon de tirage se remplit ligne à ligne et se « tamponne » CONDITIONNÉ. Le retour arrière devient « Décoller le tampon ? » (tampon en pointillés). Abandon et retour depuis le menu ⋯.
Boosters : compteur-bouteilles, curseur-bouteilles, futs-dessus, bon-tirage.
## Baseline
- [x] geste m2 (piste, bande verte = bouteilles qui tiennent, ±, valeur tapée à un toucher) ; pas de type=number ; virgule
- [x] grammaire z1 (en-tête de lot, cartes) ; jetons DESIGN.md ; clair et cave
- [x] inconnu = « — » ; aucun chiffre inventé (OG, alcool)
- [x] cibles ≥ 44 px ; pas de cockpit, pas de bandeau d'alerte, pas de code interne, pas de paragraphe
- [x] classes préfixées, HTML autonome
## Causes c3 évitées
- 1 pas de squelette commun (voir les trois autres) ; 2 le héros est le passage, pas une corvée ; 3 couleur pleine (bière dorée, Stout brune, bleu garde, ocre F2) ; 4 phrase-réponse en tête ; 7 aucune phrase grise au repos.
## Fonctions de l'écran actuel
- Gardées : volume conditionné (ici calculé des bouteilles et fûts, borné par le volume en cuve), date (Aujourd'hui en raccourci), passage d'étape suivante, retour arrière confirmé avec ses conséquences (transitionConsequence : stock non remis en rayon, mesures et dates gardées), abandon, conflit de fermenteur, clôture (Terminé), FG et alcool calculé (alcool « — » sans OG).
- Déplacées : la liste déroulante « Étape du brassin » devient le geste propre à la variante ; le texte d'aide (taxe, bilan de pertes) disparaît au repos.
- Perdue : rien. Budget, Compagnon, Supprimer restent dans la fiche (hors de cette vue).
## Écarts assumés
- Fond plein couleur bière : écart voulu aux jetons de page (idée chaude) ; cave : fond brun foncé.
- Titres en capitales (ON TIRE, TIRÉE) : ton d'atelier, à juger.
## Données fictives
- Volumes et fermenteur repris de `DONNEES-COMMUNES.md` (pilote, 14.11, voie f3a4) : Pils LOT-017, **24 L brassés en F3**, **≈ 22 L en cuve** à conditionner ; fût libre **F-02 (20 L)** ; F-03 10 L (fictif, gardé) ; levurée le **27.10** (déduit de J+18) ; geste : **6 × 33 cl (1,98 L) + F-02 20 L** = 21,98 L, pertes 2,02 L sur 24 L. Après le tirage, F3 se libère ; la Pale Ale en retard peut y aller.
- Stout LOT-015 (DONNEES-COMMUNES) : 30 × 33 cl (9,9 L) + fût **F-01 de 20 L rempli à 12 L** = 21,9 L conditionnés, pertes 2,1 L sur 24 L.
- Réels (BRIEF-AUTEUR) : Pils 1,010 stable depuis le 06.11, garde 2 °C depuis le 03.11 ; Stout conditionnée le 06.11, 30 × 33 cl + fût 20 L F-01, 5,9 % ; Pale Ale LOT-020 en retard de 6 j, F2.
- OG de la Pils absente du brief : OG et alcool restent « — », avec « poser » (aucun chiffre inventé).
## Corrections f3a4 (14.11)
- Bloquants c5a 1 et 2 ; aussi n° 3 (date soulignée, touchable ; liste non dessinée), 4, 5, 7 ; cave capturée. Volumes : DONNEES-COMMUNES. « Garder » devient « Laisser conditionnée ».
