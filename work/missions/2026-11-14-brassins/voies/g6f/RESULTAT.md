OK — 9 bloquants de k6 corrigés dans g6a, g6b, e5na, e5nb, e5nc ; images régénérées

## Bloquants (k6/VERDICT.md)
- [x] g6a n° 1 : à 1280, aide du champ « Nom, lot, houblon… » (« , malt » masqué au-dessus de 1024 px), colonne des filtres à 300 px ; plus rien de coupé (vu sur g6a-repos-1280-clair).
- [x] g6b n° 1 : la bande des 5 retirée ; la phrase de e6a en grand sur deux lignes (« 2 en cuve » vert, « 1 à brasser » ambre), puis « 1 conditionnée · 1 écoulée · 1 ★ » plus petit ; chaque compte reste touchable (souligné à la couleur de son état). Première carte à ≈ 278 px CSS (800 avant).
- [x] e5na n° 1 : Planifier replié en une ligne de réponses touchables « ● NEIPA ⌄ · 24 L ✎ · quand ? » (recette proposée déjà remplie) ; la date se pose en touchant « date ? » de l'étape Brassage ; plus de titre-formulaire, de tuiles, de curseur ni de puces de jour au premier plan ; toute la frise (Planifier → Conditionné) tient dans le premier écran.
- [x] e5na n° 2 : à 1280, Planifier à gauche en panneau (recettes en grille 3 × 2 non coupée, volume au curseur m2), la frise à droite.
- [x] e5na n° 3 : Garde « dès 01.12 » au geste, et « dès J+10 » au repos (le repos 21 °C va de J+7 à J+9).
- [x] e5nb n° 1 : la liste est celle de e6a (g6a) : phrase-réponse « 2 en cuve / 2 à brasser », 6 brassins, recherche + Plus, « À suivre d'abord », « Nov. + en cours », cartes à barre d'état, chiffre clé, action, étoile et « … » ; la carte fantôme se pose en tête de cette liste ; au geste, LOT-021 devient une carte de e6a (Planifié, « sam. 21.11 · 24 L », Préparer).
- [x] e5nc n° 1 : écrans 2 et 3 dessinés et capturés (`e5nc-quand-390-clair.png`, `e5nc-volume-390-clair.png`) : jours en grandes cases (sam. 14 aujourd'hui, dim. 15 dry hop, week-ends teintés), « À définir » et « Autre date » ; puis volume au curseur m2 (bande hachurée à 30 L, 24 recette, ≈ 22 L à tirer) et cuves F3 « après la Pils » (libre, le toucher finit), F1 et F2 hachurées.
- [x] e5nc n° 2 : verres dans l'ordre réel de couleur : Pils la plus pâle, limpide et perlée (or éclairci) ; NEIPA or voilée (voile laiteux et particules) ; Saison or ; Pale Ale ambre ; Stout. La NEIPA voilée revient dans le geste et dans la réponse « NEIPA » des écrans 2 et 3.
- [x] e5nc n° 3 : « Dans la liste » montre la carte de e6a (barre et pastille « Planifié », chiffre clé « sam. 21.11 », action « Préparer »).

## Non bloquants faits
- g6a n° 5 : Stout « 30 × 33 cl · fût 12 L » (aussi dans g6b et e5nb). n° 6 : « La Stout est conditionnée, pas en cuve ». n° 7 : la marque « Terminés/Écoulée » passe de cave-700 à cave-texte-400 / 0,7, lisible en cave (aussi dans g6b, e5nb).
- g6b n° 3 : les deux phrases grises d'aide retirées. n° 4 : « Nov. + en cours » (sous le compte, à droite de la phrase). n° 5 : « Étoiler la Pale Ale » retiré. n° 6 : au geste et au vide, la rangée pliée « 3 autres hors du filtre » / « 5 hors du filtre » de g6a, avec leurs états.
- e5na n° 4 : « stock déduit aux ajouts » en petite ligne avec l'icône stock, « Modifier » en bouton. n° 5 : plus de carrousel coupé (ligne repliée à 390, grille à 1280). n° 6 : + flottant masqué. n° 7 : sans recette, ni numéro de lot ni frise ; « Il faut une recette », Créer et Importer, centrés.
- e5nb n° 2 : fondu au bord des rangées Bière/Quand/Cuve. n° 3 : marge basse de 60 px sous la liste. n° 4 : « Terminé » devient « OK ». n° 5 : au vide, la même liste qu'au repos (Pale Ale comprise), seule la carte fantôme change. + flottant masqué.
- e5nc n° 4 : sous les verres, plus de numéro de lot ; « dernier brassin 09.11 » sous la NEIPA seulement (seule date de brassage connue). n° 5 : au geste, « Ce qui vient » : Brassage sam. 21.11, dry hop 27.11, repos 28.11 → 30.11, garde dès 01.12. n° 6 : + flottant masqué.
- Commun n° 1 (cibles) : les puces et boutons de la trousse ont déjà leur zone de 44 px par `::after` (identite.css) ; rien changé au dessin.

## Pas faits (et pourquoi)
- g6a n° 2 (« Tout l'historique » de l'en-tête à 1280) : vient de `outils/identite/chrome.js`, hors Possède.
- g6a n° 3 et n° 4 (avancement sur une rangée, style derrière « Plus », étoile après un trait) : restructuration des rangées, pas une ligne ; laissés pour la passe suivante.
- g6b n° 2 (feuille « Filtres » comptée dans une image) : demande une image neuve ; pas fait.
- g6c, e5nd : hors du contrat (variantes à montrer telles quelles).

## Critères
- G1 : voir tests.txt (COCHE OK attendu, 9 lignes).
- G2 : IMAGES OK (toutes les PNG des 5 variantes régénérées après le verdict).
- G3 : HORS OK.
- Identité : `controle-identite.mjs voies/g6` → IDENTITE OK 3/3 ; `voies/e5n` → IDENTITE OK 4/4.

## Fichiers écrits
- `voies/g6/g6a/etat.html`, `voies/g6/g6b/etat.html`, `voies/e5n/e5na/etat.html` (récrit), `voies/e5n/e5nb/etat.html`, `voies/e5n/e5nc/etat.html` (récrit), `voies/e5n/capture.mjs` (deux états ajoutés au plan de e5nc : quand, volume), NOTE.md des cinq (ligne « Corrigé k6 »), toutes leurs PNG.

## Captures (toutes régénérées)
- g6a : repos-390-clair, geste-390-clair, vide-390-clair, repos-390-cave, repos-1280-clair.
- g6b : repos-390-clair, geste-390-clair, vide-390-clair, repos-390-cave.
- e5na : repos-390-clair, geste-390-clair, vide-390-clair, repos-390-cave, repos-1280-clair, geste-390-cave.
- e5nb : repos-390-clair, geste-390-clair, vide-390-clair, repos-390-cave.
- e5nc : repos-390-clair, quand-390-clair, volume-390-clair, geste-390-clair, vide-390-clair, repos-390-cave.
- Ouvertes par moi : g6a-repos-1280-clair, g6b-repos-390-clair, g6b-geste-390-clair, e5na-repos-390-clair, e5na-geste-390-clair, e5na-repos-1280-clair, e5nb-repos-390-clair, e5nb-geste-390-clair (avant le correctif d'icône du tri), e5nc-repos-390-clair, e5nc-quand-390-clair, e5nc-volume-390-clair. Les autres : voir DEMANDE EXECUTANT (contexte à 160 k, consigne de rendre).

## DEMANDE EXECUTANT
Ouvrir (Read) et signaler tout texte coupé, chevauchement, icône absente ou contraste faible :
`voies/g6/g6a/g6a-{repos-390-clair,geste-390-clair,vide-390-clair,repos-390-cave}.png`, `voies/g6/g6b/g6b-{vide-390-clair,repos-390-cave}.png`,
`voies/e5n/e5na/e5na-{vide-390-clair,repos-390-cave,geste-390-cave}.png`, `voies/e5n/e5nb/e5nb-{repos-390-clair,geste-390-clair,vide-390-clair,repos-390-cave}.png`,
`voies/e5n/e5nc/e5nc-{geste-390-clair,vide-390-clair,repos-390-cave}.png`. Point précis : l'icône du tri dans e5nb (SVG en ligne posé après ma dernière vue).

Prédiction : « Là c'est ma liste, et le brassin naît avec ses dates sans formulaire ; les verres, enfin, la Pils est pâle. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la trousse n'a pas de jeton « paille » de bière (`--ebc-straw` est la couleur d'action, noire en clair) ; une Pils se dessine en or éclairci.
LEÇON PROPOSÉE : aucune.
