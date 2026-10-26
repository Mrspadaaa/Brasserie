OK — accepté : le port reprend son onglet « Ma bière » (base v4.10) bloc pour bloc et geste pour geste ; déployable une fois l'entrée rebranchée (`analyse = true`) et la croix de Suggérer empilée ramenée à l'étape (D118)

Critique Fable, 26.10, calibrée sur `fils21-choisir/critique/PORTRAIT.md` (v2). Voie p6-ma-biere-app.
Regardé en image : `consolide-biere-390.png` (son choix, « Ça aussi »), `cote-a-cote-{repos,visee,radar,absolu}.png`,
`app-{repos,visee,bannir,radar,absolu}.png`, `head/app-echec.png`. Lu : VOIE.md, RESULTAT.md, inventaire.md, `biere/EcranApp.tsx`,
`biere/index.tsx` (objectifs, légende), `maBiere/apercuDev.ts` (le banc : Stout 16D, Nugget 46 g à 60′, US-05 ; IBU 60 / OG 1,066 /
EBC 70 sont calculés par `Bandeau`, pas écrits en dur).

- **p6** (Ma bière dans l'app, couche hopBeer) — ACCEPTÉ. Phrase prédite : « Ça c'est bien, c'est ma maquette. Mais il manque les
  + floral − résineux en bas, et le + ... tout seul il sert à quoi ? » Correction attendue : rebrancher l'entrée (ligne donnée dans
  RESULTAT.md), régler D118 sur la croix de Suggérer empilée, et donner un mot au « + … » quand il est seul (voir § 3).

## 1. Fidélité à son écran (règle n° 1, D105)

Côte à côte, maquette `#/biere` contre app, 390 × 844 : **mêmes blocs, même ordre, mêmes gestes.**
- Tête à onglets (croix, Ma bière actif, Suggestions, Comparer) ; bandeau IBU avec jauge au style, OG, EBC ; alerte à point ;
  Barres / Radar ; décompte « n au style · m non situées » ; Au style / Absolu ; pastilles de légende et « ? » ; « zone du style ·
  au-dessus » ; 12 familles avec picto, barre l5b (zone, au-dessus en pointillé, point coloré, hachuré pour non situé, « prévu » à
  droite) ; puces d'objectif ; « Prévu avec SafAle US-05, caractérisée ». Les trois familles du style en gras (Floral, Herbacé,
  Terreux), comme chez lui.
- Gestes rejoués et vus : toucher Tropicaux → « bannir · − · sans visée · + » ; « + » → losange blanc relié en pointillé, palier
  « faible », « × », puce noire en bas (app-visee) ; « bannir » → nom barré, « bannie », losange à 0 (app-bannir) ; Absolu →
  « faible · moyen · marqué » en tête (app-absolu) ; Radar → m4 avec anneaux chiffrés en mots, pictos et « ? », grille
  « pas senti … marqué » dessous, décompte et légende repliés (app-radar). C'est la visée « en trait creux » qu'il a dite
  « Parfait » (SPEC, 18.10) et qui manquait à la maquette du 23.10 (« Aussi aucun impact sur je met plus, moins bannir ect.. »).
- Écarts, tous de données (le banc n'a pas de dégustation) : « Au style » vert au lieu de « Boisé et résineux trop marqué » ;
  pas de pastille « dégusté 18.10 » ; pas de Résineux rouge « ×2,8 » ouvert au repos ; pas de rayon orangé au radar ; pas de puces
  « + floral · − résineux ». Le test `biereAppDegustee` prouve que ces cinq choses reviennent avec une vraie dégustation : je le
  crois sur parole du test, pas sur une capture (aucune capture « dégustée » de l'app : à faire avant la mise en ligne, L12).
- Écart de dessin : l'écran commence ~9 px plus haut (PageShell). Il ne le verra pas.
- HEAD (`head/app-echec.png`) montre bien « Écran provisoire : l'outil v4 viendra ici » : sa plainte « Clicker ici ne fait plus
  rien » est reproduite, puis corrigée par le port (MA-BIERE-APP ECHEC → OK).

Verdict fidélité : il reconnaîtrait son écran. Rien d'une autre carte, rien d'inventé.

## 2. La DÉCISION À PRENDRE : pas de puces « + floral · − résineux » sans visée

Ce qu'il dirait : « il manque les + floral − résineux ??? ». Il les a vues sur sa capture, au repos. Mais :
- les tirer d'une fixture, c'est exactement D158, sa plainte du 26.10 sur l'app déployée (« encore des données et artefacts de
  test des mini maquettes »). Inventer « − résineux » sur une bière qu'il n'a pas jugée résineuse, c'est aussi « ce qui sort
  de nulle part » (PORTRAIT § 4 ; « On a un 10' qui sort de null part »). Il est plus dur avec ça qu'avec un manque.
- Donc **A tout de suite** (honnête), et **B en ticket** : dès que sa dégustation dit « trop X / plus Y », la puce se pose au trait.
  Il n'y a pas de champ structuré aujourd'hui (`tasting.quote` en texte) : c'est un ticket, pas une retouche. C (une phrase d'aide
  au repos) rejoue D1/D3 (« explication », « text inutile ») : non.
- Ce qui ne passe pas en l'état : le « + … » **seul** en bas de l'écran. Sur sa capture, « + … » suit deux puces et se lit
  « une autre » ; seul, c'est un bouton muet (« Les icône sont pas parlant du tout », PORTRAIT § 4). Je ne le rejette pas (goût
  que je ne peux pas citer mot pour mot sur ce bouton), mais je le signale : quand aucune puce n'est posée, écrire « + viser une
  famille » ou « + objectif » à la place de « + … », et revenir à « + … » dès qu'une puce existe. Le libellé change, pas la place
  ni la forme de sa puce.

## 3. Défauts : bloquants ou non

Vérifié capture par capture (chevauchement, texte, cockpit, valeurs, sens).
- Chevauchement : aucun. Texte : trois tailles (bandeau, familles, « prévu »), lisible ; aucun texte au premier plan en plus de
  sa maquette (D1, D2, D3 tenus). Cockpit : non, c'est son écran.
- Valeurs : IBU 60, OG 1,066, EBC 70 calculés sur la recette ouverte (Stout 16D, Nugget 46 g à 60′) ; 11 familles « prévu » à
  « pas senti » et Melon « non situé » : honnête pour un seul houblon amer à 60′ (D40 : l'inconnu n'est pas à 0, il est hachuré).
  « Au style » vert sans dégustation : c'est la prévision face à la zone, acceptable ; avec dégustation, l'alerte de sa capture
  revient (test).
- **D118, à corriger avant la mise en ligne** (pas dans l'écran, dans la pile) : depuis Ma bière, « Suggestions » empile Suggérer,
  et sa croix ramène à Ma bière, pas à l'étape Houblons. C'est mot pour mot sa plainte du 23.10 : « Suivant où on est le bouton
  retour fait pas la même action. Je veux juste retour au "menu" pas principal ». Règle DEFAUTS D118 : « la croix ramène à
  l'étape Houblons (#/ma-biere), jamais ailleurs ». Correction : la croix d'une couche empilée sur hopBeer ferme toute la pile
  jusqu'à l'étape ; l'onglet « Ma bière » de Suggérer reste le chemin pour revenir à l'analyse. Hors du périmètre de la voie
  (couche hopSuggest), signalé par elle : c'est au pilote.
- « + … » seul : signalé au § 2, non bloquant.
- Légende « ? » : « Une puce pose sa visée ; la ligne dessous ouvre Suggestions » : vrai dans l'app aussi (la ligne « Plus
  tropicaux : n voies › » apparaît sous la puce après un « + »). Rien à changer.
- Fluidité : 2,3 à 2,9 s à froid et 126 à 264 ms au toucher, mesurés en dev ×4 seulement. Non prouvé en production, non
  bloquant ici (le chunk fait 7 ko gzip) ; à mesurer sur un build avant de dire « tenu » (#159).

Aucun défaut bloquant dans l'écran lui-même.

## 4. Déployable ?

Oui, à trois conditions, dans cet ordre :
1. **L'entrée** : appliquer la ligne de RESULTAT.md (`analyse = true`, import de `useHote` retiré, test `demandeReelle` aligné).
   Sans elle, l'app déployée montre toujours « Clicker ici ne fait plus rien et il y a plus le bouton pour ouvrir la vue ».
2. **D118** sur la croix de Suggérer empilée (§ 3). Sinon il retrouve une plainte déjà faite au premier parcours.
3. **La suite vitest verte** après les commits des voies voisines (g2d, c5) : la voie ne l'a pas (317/318, empreintes) et ce n'est
   pas de son fait, mais on ne déploie pas sur une suite rouge.

Et avant de lui montrer : une capture de l'app **avec une dégustation réelle** (la sienne ou une mockée), pour voir la pastille
« dégusté jj.mm », l'alerte rouge, la famille ouverte « ×n » et le rayon au radar en vrai, pas seulement au test (L12).

DEMANDE EXECUTANT : (si le pilote veut la preuve en image) rejouer `controle-ma-biere-app.mjs` avec la dégustation de
`biereAppDegustee.test.tsx` posée sur le banc, produire `captures/app-degustee.png` (repos) et `captures/app-degustee-radar.png`,
sortie attendue `MA-BIERE-APP OK`, puis les ouvrir.

LEÇON PROPOSÉE : aucune (celle de la voie, l'état initial figé sur des données asynchrones, est juste et tient en un test).
