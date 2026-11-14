# e10d — L'abaque, un seul trait

Chaleur : chaude

Idée : L'abaque, un seul trait. Un abaque à axes parallèles (volume, grain, eau, houblon, levure) : un seul trait les traverse. Quand tout suit, le trait est droit ; quand il plie, c'est ce qui ne suit pas (levure par palier : 2 sachets ; eau : pertes fixes, −1,1 L).

Écarts assumés : Genre neuf (nomogramme). Défauts vus : à 1280, colonne gauche vide ; la bulle « 24 L » cache l'étiquette F1 ; graduations de l'axe eau sous la bulle.

## Baseline cochée
- [x] Curseur m2 pour le volume cible (piste, bande « F1 · 30 L » visible, valeur tapée à un toucher par le bouton ✎) ; jamais type=number ; virgule.
- [x] Inconnu = « — » (volume refusé) ; cibles ≥ 44 px ; thèmes clair et cave (jetons de s5a / DESIGN.md).
- [x] Pas de cockpit, pas de bandeau d'alerte, pas de paragraphe, pas de code interne : « Atelier Houblons V5.5 » retiré de cette vue.
- [x] Aucun α, IBU ni arôme inventé : seules les bandes de familles de Citra et Mosaic, reprises de s5a.

## Fonctions de l'écran actuel (ProductionTab.tsx l. 270-320)
Recette source : gardée. Volume cible (compteur) : devient un curseur. « × facteur » : gardé, en pastille noire. Eaux d'empâtage et de rinçage : gardées. Tableau des ingrédients (malts, houblons avec moment, adjuvants) : gardé. Volume refusé (0,5 à 2 000 L) : gardé (état refuse). Carnet vide : gardé (état vide). « Empâtage plafonné par la cuve » : non dessiné (le cas ne sort pas sur ces chiffres).

## Causes c3 évitées
Pas de squelette commun aux 4 ; phrase-réponse en gros en tête ; couleur pleine ; boosters plutôt que texte ; aucune phrase grise d'aide au repos.

## Données
Vraies : NEIPA, recette 24 L, F1 30 L, Verdant IPA, dry hop Citra 100 g et Mosaic 80 g (BRIEF-AUTEUR). **Fictives** : les grains (Pale Ale 5,00 kg, avoine 0,80, froment 0,60), Citra 10 g à 60′, Citra 60 g et Mosaic 50 g au whirlpool, l'installation « Système 30 L » (seedData.ts). Calcul réel : eaux, grains, houblons et sachets sortent de scaleBrewRecipeScenario (calc.ts, rejoué avec vite-node). Constat : à 40 L, le code garde la cuve de 30 L sans le signaler (47,4 L avant ébullition).
