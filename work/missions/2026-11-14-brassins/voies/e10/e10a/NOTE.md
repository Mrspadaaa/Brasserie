# e10a — Le calculateur remis d'aplomb

Chaleur : froide

Idée : Le calculateur remis d'aplomb. Le même écran, dans le même ordre (recette, volume, eaux, ingrédients), mais lisible : carnet en puces, curseur m2 avec la zone F1, eaux en tuiles bleues, avant → après barré au geste, moments des houblons en pastilles.

Écarts assumés : Garde la barre Brassins · Recettes · Atelier · Volumes de l'app. Défaut vu : à 390, le bas de la liste des houblons et la levure demandent de défiler.

## Baseline cochée
- [x] Curseur m2 pour le volume cible (piste, bande « F1 · 30 L » visible, valeur tapée à un toucher par le bouton ✎) ; jamais type=number ; virgule.
- [x] Inconnu = « — » (volume refusé) ; cibles ≥ 44 px ; thèmes clair et cave (jetons de s5a / DESIGN.md).
- [x] Pas de cockpit, pas de bandeau d'alerte, pas de paragraphe, pas de code interne : « Atelier Houblons V5.5 » retiré de cette vue.
- [x] Aucun α, IBU ni arôme inventé : seules les bandes de familles de Citra et Mosaic, reprises de s5a.

## Fonctions de l'écran actuel (ProductionTab.tsx l. 270-320)
Recette source : gardée. Volume cible (compteur) : devient un curseur. « × facteur » : gardé, en pastille noire. Eaux d'empâtage et de rinçage : gardées. Tableau des ingrédients (malts, houblons avec moment, adjuvants) : gardé. Volume refusé (0,5 à 2 000 L) et carnet vide : écrits dans etat.html (états refuse et vide), non capturés ici (f3c, c5c n° 4). « Empâtage plafonné par la cuve » : non dessiné (le cas ne sort pas sur ces chiffres).

## Causes c3 évitées
Pas de squelette commun aux 4 ; phrase-réponse en gros en tête ; couleur pleine ; boosters plutôt que texte ; aucune phrase grise d'aide au repos.

## Données
Vraies : NEIPA, recette 24 L, F1 30 L, Verdant IPA, dry hop Citra 100 g et Mosaic 80 g (BRIEF-AUTEUR). **Fictives** : les grains (Pale Ale 5,00 kg, avoine 0,80, froment 0,60), Citra 10 g à 60′, Citra 60 g et Mosaic 50 g au whirlpool, l'installation « Système 30 L » (seedData.ts). Calcul réel : eaux, grains, houblons et sachets sortent de scaleBrewRecipeScenario (calc.ts, rejoué avec vite-node). Constat : à 40 L, le code garde la cuve de 30 L sans le signaler (47,4 L avant ébullition).
