# e10c — La pesée du jour de brassage

Chaleur : tiède

Idée : La pesée du jour de brassage. Les quantités rangées par moment du jour de brassage (empâtage, rinçage, ébullition, whirlpool, levurage, dry hop), à cocher comme dans z1 ; écart « +3,33 » en pastille jaune au geste ; curseur dans la zone du pouce, en bas.

Écarts assumés : 67 °C, 60′, 20′ et 19 °C : la levure à 19 °C est vraie, le reste est fictif. Défaut vu : les graduations de la piste ne tombent pas sur des litres ronds.

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

## Rhabillage re10 (15.11)
Trousse d’identité chargée (`../../../outils/identite/identite.css`, `chrome.js`) : en-tête, sous-onglets (Volumes) et barre du bas de l’app ; jetons des deux thèmes, Source Sans 3 et IBM Plex Mono, 28 px et graisse 600 au plus, rayons 10, 16, 24. Idée, composition, textes et chiffres inchangés. Familles d’arômes : base de `jetons-familles.json`, dessinées en SVG.

## Corrections g3 (15.11, verdict k3)
- n° 1 (bloquant) : à 1280, « Volume cible » quitte le bas d'écran et se pose dans la tête, à côté d'« À peser pour 24 L » ; il ne couvre
  plus le dry hop ni le levurage. À 390, il reste fixé en bas, au-dessus de la barre de l'app (la liste garde sa marge basse de 196 px).
- n° 4 : « recette 24 L · × 1,00 » et les repères du curseur en Source Sans.
- n° 5 : les houblons gardent leurs barres de familles, sans α : sur une liste de pesée, le brasseur pèse des grammes ; l'α vit sur la
  recette (L04 reste tenue là). Écart assumé.
- Non fait : n° 2 (lier les coches au brassin du jour demande une date et un lot neufs, hors du brief) et n° 3 (marge déjà égale au panneau).
