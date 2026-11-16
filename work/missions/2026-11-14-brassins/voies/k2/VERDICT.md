OK — 62 problèmes, 11 bloquants

Critique k2 (Opus, Fable interdit), 15.11.2026. 63 captures ouvertes (e5 : 14, e6 : 15, e7 : 16, e8 : 18), à côté de `liste-remplie-390-clair`,
`liste-remplie-390-cave`, `fiche-fermentation-390-clair` et `demo-390-clair`. `controle-identite.mjs` : IDENTITE OK 4/4 pour chaque série.
Identité : les 16 se lisent comme des écrans de l'app (en-tête L'Affinée, sous-onglets, barre du bas et +, Source Sans 3 / Plex Mono,
jetons clair et cave, rayons). Aucune ne retombe dans « pas du tout l'identité ». Seul écart d'habillage bloquant : le tampon rouge de e5d.
Chiffres confrontés à BRIEF-AUTEUR § Les chiffres et à DONNEES-COMMUNES.md (24 L partout, F1 à F3 de 30 L, Pils en F3, fût F-01 rempli à 12 L).
Commun à e5a, e5c, e6a, e6b, e6d : « fût 20 L » pour la Stout se lit comme 9,9 + 20 L = 29,9 L sortis de 24 L brassés. Écrire « fût F-01 · 12 L ».

## e5a — CORRIGER
1. **Bloquant** : `e5a-repos` (tuiles Recette), Pils 25 L et Stout 30 L, contre 24 L dans DONNEES-COMMUNES. Une Stout de 30 L dans une cuve de 30 L déborde. Mettre 24 L sur les 5 tuiles.
2. **Bloquant** : `e5a-geste` (liste d'arrivée), plus d'étoile favori sur les cartes, et les états sont renommés (« fermente », « garde », « conditionnée »). C'est une fonction perdue sans rien dire. Reprendre la carte de liste de l'app telle quelle et n'ajouter que la carte LOT-021 encadrée.
3. `e5a-repos` « recette 24 L · F1 30 L » et `e5a-vide` « Cuve F1 30 L » : F1 porte la NEIPA. Écrire « cuve 30 L », comme e5c.
4. `e5a-repos` : la tuile Pale Ale ne signale pas que LOT-020 est déjà planifié, donc un doublon reste possible. Greffer la pastille « LOT-020 prévu » de e5d.
5. `e5a-geste` : « 30 × 33 cl + fût 20 L », voir l'en-tête.
6. NOTE.md : pas de ligne de rhabillage, et « Pils 25, Stout 30 » y est encore donné pour fictif. La mettre à jour.

## e5b — CORRIGER
1. **Bloquant** : `e5b-repos`, `-geste` et `-vide`. F2 est à « — L » alors que DONNEES-COMMUNES lui donne 30 L, et F4 est inventée (il y a 3 fermenteurs). La phrase-réponse « F4 vide depuis 8 jours » repose sur cette cuve qui n'existe pas. Avec les vraies cuves, F2 est libre et attend la Pale Ale. Retirer F4, mettre F2 à 30 L, et écrire en tête « F2 attend la Pale Ale depuis 6 jours ».
2. `e5b-geste`, curseur de volume : aucun repère « plein » alors que NOTE.md dit la zone hachurée gardée. Marquer la limite de la cuve comme e5c.
3. `e5b-geste` : les tuiles de recettes changent d'ordre au choix (la Saison passe en tête), donc la rangée bouge sous le doigt. Garder un ordre fixe.
4. NOTE.md : pas de ligne de rhabillage, et les fonctions sont recopiées de e5a (la zone F1 30 L n'existe pas ici).

## e5c — MONTRER
1. `e5c-repos` et `-geste` (ligne Stout) : « fût 20 L », voir l'en-tête.
2. `e5c-vide` : « Puis, ici » et « Volume » en gris pâle, ce qui ramène la phrase grise (cause c3 n° 7). Montrer la zone inactive sans texte gris.
3. `e5c-repos-1280` : la feuille n'a pas de bord bas visible et la colonne droite est courte. Fermer la feuille à la hauteur du contenu.
4. NOTE.md : pas de ligne de rhabillage.

## e5d — CORRIGER
1. **Bloquant** : `e5d-geste`, tampon « PLANIFIÉ » rouge, pivoté, en capitales espacées. Dans l'app, le rouge veut dire alerte (« en retard ») : un succès en rouge se lit comme une erreur, et cette police n'est pas celle de l'app. Le remplacer par une pastille hop « Planifié · LOT-021 · 15.11 ».
2. `e5d-repos` : le bord de la case « jour ? » touche le bas de la case NEIPA. Ajouter 8 px d'interligne.
3. `e5d-repos` et `-geste` : le panneau garde le même beige pour la NEIPA et pour la Saison, alors que NOTE.md promet « fond à la couleur EBC de la recette ». Teinter le panneau selon la recette.
4. « Touchez un trou de la phrase » vouvoie, alors que e5b et e5c tutoient. L'app doit parler d'une seule voix.
5. `e5d-geste` « dim. 15 . 11 » et `e5a-geste` « sam. 21 . 11 » : les points sont espacés par la police mono. Écrire la date en Source Sans.

## e6a — MONTRER
1. `e6a-repos` et `-geste` : la puce « Conditionnés » est coupée au bord droit sans fondu. Ajouter un fondu ou passer à la ligne.
2. `e6a-geste` : le titre « F1 et garde » mêle une cuve et une phase. Écrire « NEIPA et Pils ».
3. `e6a-repos` : l'étiquette de style « NEIPA » répète le nom. Écrire « New England IPA », comme l'app.
4. `e6a-repos` (Stout) : « fût 20 L », voir l'en-tête.

## e6b — CORRIGER
1. **Bloquant** : `e6b-repos`, `-geste`, `-cave` et `-1280`. Seule la NEIPA a une étoile, et elle n'a pas de « … ». Les autres lignes ont « … » mais pas d'étoile creuse. On ne peut donc ni mettre un brassin en favori ni ranger la NEIPA, alors que NOTE.md dit « favori, Ranger (…) gardés ». Mettre une étoile, creuse ou pleine, et « … » sur chaque ligne.
2. `e6b-geste` « restées visibles : Pils et Pale Ale, en cours » : la Pale Ale n'est pas brassée. Écrire « Pils en cours, Pale Ale en retard ».
3. `e6b-repos-1280` : deux réglages de période en même temps, « Tout l'historique » dans l'en-tête et « Ce mois » sur la frise. N'en garder qu'un ; doute si l'en-tête vient du chrome.
4. `e6b-repos` : le trait rouge du 14.11 colle à l'étiquette « 15.11 ». Retirer l'étiquette 15.11 ou la décaler.
5. `e6b-repos-1280` (Stout) : « fût 20 L », voir l'en-tête.

## e6c — CORRIGER
1. **Bloquant** : les comptes sont faux dès qu'un filtre est posé, alors que l'idée de la variante est justement « des filtres qui comptent ».
   - `e6c-geste` (En cuve posé) : les styles APA, Stout et Saison affichent 1 au lieu de 0.
   - `e6c-vide` (Stout et En cuve) : À brasser, Terminés, Mesures manquantes, Favoris, APA et Saison affichent 1 au lieu de 0.
   Correction : chaque groupe compte avec les filtres des autres groupes (facettes).
2. `e6c-vide` : « Tout effacer » en double, en tête et au pied. En garder un.
3. `e6c-repos` : la période est rognée sous le pied collant (« Ce mois… Dates… »). Laisser de l'air au-dessus du pied.

## e6d — CORRIGER
1. **Bloquant** : seule F1 porte une étoile. Aucune étoile creuse ni « … » sur les autres cuves (`e6d-repos`) ni dans la liste du geste (`e6d-geste`). Ranger se fait seulement en glissant sur le carton, ce qui n'est pas un geste pour des mains mouillées. Ajouter l'étoile et « … » à chaque brassin.
2. **Bloquant** : `e6d-repos`, `-geste` et `-vide`, cuve « Garde » au lieu de « F3 · 30 L » (DONNEES-COMMUNES met la Pils en F3). Le vide « Garde 2 °C libre » invente une cuve à température fixe. Écrire F3, 30 L.
3. `e6d-repos` : aucune entrée vers la feuille de filtres (style, houblon, période) n'est visible. La puce « Mesures manquant… » est coupée. Mettre le bouton filtres à côté du tri.
4. `e6d-repos` « fût F-01 · 20 L » : voir l'en-tête.

## e7a — MONTRER
1. `e7a-repos` (OG, 390 et 1280) : l'échelle des écarts n'est pas tenue. Pils −0,004 est dessiné vers −0,0055, et dans `e7a-geste`, la NEIPA à 1,018 vers +0,0084 au lieu de +0,006. Poser chaque point sur l'échelle écrite dessous.
2. `e7a-repos` et `-geste`, ligne Stout : deux points superposés forment « ●) ». N'en dessiner qu'un.
3. « 89,4  % » et « 48  L  →  42,9  L » : l'unité est séparée par une pleine espace mono. Mettre une espace fine.

## e7b — CORRIGER
1. **Bloquant** : `e7b-repos`, `-cave` et `-1280`. Le titre dit « 3 brassins au centre », mais la zone verte ne contient que Stout et Saison : la Pils est hors cible en OG et la NEIPA est en cours. Écrire « 2 au centre », ou titrer sur l'OG (« OG : 3 sur 4 »).
2. `e7b-geste` : la NEIPA en cours est posée sur l'anneau extérieur, à environ −0,75 % d'alcool, alors que sa cible d'alcool est « — » (e7c à 1280). Elle doit rester hors du carton, en pastille « en cours ».
3. `e7b-repos-1280` : le carton est petit et la moitié basse de la page est vide. L'agrandir.
4. `e7b-repos` : l'étiquette « Pils » est posée sur l'anneau pointillé. La décaler.

## e7c — CORRIGER
1. **Bloquant** : « alcool et amertume » (le nuage alcool × IBU de l'écran actuel) est absent à 390 comme à 1280, sans que NOTE.md le dise. La bascule Archives est aussi absente, renvoyée « à la passe 2 ». Ajouter la puce « Alcool, IBU » et Archives, comme e7d.
2. `e7c-repos` : « Stout en bouteille », alors qu'elle est conditionnée en bouteilles et en fût. Écrire « conditionnée ».
3. `e7c-repos-1280` : les dégustations « Saison · sèche, poivrée » et « Stout · corps mince » ne sont pas dites fictives dans NOTE.md. Les y dire, ou mettre « — ».

## e7d — MONTRER
1. `e7d-repos`, `-cave` et `-1280` : « Les 4 cuves pile à 24 L », alors que 2 brassins seulement sont en cuve. Écrire « Les 4 brassins pile à 24 L ».
2. `e7d-repos-1280` : la colonne droite s'arrête sous les puces et la page est à moitié vide.
3. `e7d-repos` : « pile » est écrit en mono gras dans les pastilles, un usage qu'on ne voit nulle part ailleurs dans l'app. Passer en Source Sans.

## e8a — MONTRER
1. `e8a-comparer`, ligne Alcool : la NEIPA (6,3–6,8 %) est un simple point, la Pale Ale (5,1 %) une barre pleine, et la NEIPA paraît donc la plus faible. Même forme pour les deux, une bande.
2. `e8a-repos` : pas de « … » (Ranger) sur les cartes, alors que NOTE.md dit le menu gardé. Le montrer.
3. `e8a-comparer` : le grain de la NEIPA est « Pils 70 · 20 », et les 10 % restants n'ont pas de nom.

## e8b — CORRIGER
1. **Bloquant** : `e8b-repos`, `-geste`, `-cave` et `-1280`. Dans les cartes de lots, les FG 1,015, 1,012 et 1,018 sont barrées par les traits de la bande verte (texte chevauché). Poser l'étiquette hors de la bande, à droite de la barre.
2. `e8b-comparer`, Amertume : la bande 30–50 n'a pas son « 30 ».
3. `e8b-comparer` : la carte NEIPA ne montre pas sa levure (Verdant IPA), alors que la Pale Ale montre « Levure — ».
4. `e8b-repos-1280` : le tiers bas est vide.
5. `e8b-repos` « lot 012 · 6,1  % » : espaces mono. Mettre une espace fine.

## e8c — MONTRER
1. `e8c-repos` : la tête « Laquelle brasser ensuite ? » est une question, pas une réponse (cause c3 n° 4, léger). Dire la réponse : « Pale Ale en attente depuis 6 j ».
2. `e8c-comparer` : « 2,5 » côté Pale Ale n'a pas d'unité, alors que la NEIPA a « 7,5 g/L ».
3. `e8c-comparer` : le grain de la NEIPA a 10 % en gris sans nom.

## e8d — MONTRER
1. `e8d-repos` : la hauteur de bière dit l'alcool, sauf pour la Saison, dont le verre presque vide dit « écoulée ». Deux lectures sur la même étagère. Écrire « écoulée » sous le verre et garder la hauteur pour l'alcool.
2. `e8d-comparer` : « 1,010–14 » est abrégé, alors qu'ailleurs on lit « 1,010–1,014 ».
3. `e8d-repos` (clair) : la Saison est rose pâle, alors qu'elle est cuivre partout ailleurs.

## Doutes (non comptés)
- La Saison est brassée en septembre dans e7 et le 20.07 dans e6b ; l'app la dit conditionnée le 31.08. Une seule date pour tout le lot.
- L'alcool cible de la NEIPA vaut « — » dans e7c et « 6,3–6,8 % » dans e8. Cohérent si e7 lit le brassin et e8 la recette, mais le brasseur verra les deux.
- Pils « alcool −0,4 » (4,8 ASBC contre 5,2) : juste par la formule ASBC, −0,5 par la simple.

## Classement
- e5 : **e5c** (rebrasser ce qui manque, chiffres justes, cave et 1280) > e5d (la phrase à trous, osée, une fois le tampon corrigé) > e5a (la feuille d'aplomb, mais volumes faux) > e5b (planning bâti sur une cuve inventée).
- e6 : **e6a** (la liste de l'app, propre, toutes les fonctions) > e6b (la frise répare la période, mais favori et Ranger à remettre) > e6d (le plan de cave parle, mais « Garde » et favoris manquent) > e6c (la feuille riche, mais des comptes faux).
- e7 : **e7c** (le tableau, tous les chiffres justes et lisibles) > e7a (l'écran actuel en mieux) > e7d (les cuves et les densimètres, belles, mais « 4 cuves ») > e7b (le carton de tir, titre faux).
- e8 : **e8c** (tuiles couleur bière, duel clair) > e8b (frise des lots et Rebrasser, chiffres barrés à corriger) > e8a (le carnet d'aplomb, le plus proche de l'app) > e8d (le comptoir, charmant mais deux lectures).
