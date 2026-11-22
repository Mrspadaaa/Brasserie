# Verdict e-t5 — p3c-3 retouchée (D248)

RETENUE — quantités en gras seulement, colonnes alignées dans les trois groupes, rien d'autre changé.

Juge : critique calibré (portrait v2), agent neuf. Comparé en plein format et en zoom ×3, zone par zone : captures d'avant
(`git show HEAD~1`, ed2529e8 : `p3c-3-repos/-defile/-tous/-1280-repos.png`), captures retouchées (`v3/p3c-3/`, commit c11dac21),
sa capture entourée `brasseur/01-11-p3c-3-quantite-entouree.jpg`, et le diff d'`etat.html` (9 lignes ajoutées, 3 retirées).

## Ses mots, point par point

« mettre plus en avant la quantité, juste mettre en gras »
- Lignes : « 6 Kg » (Maris Otter), « 1 Kg », « 40 g », « 100 g », « 30 ? » (Sabro), « 2 Stk » passent en gras ; « × 2,30 », « × 0,040 »
  et le montant gardent leur graisse, leur taille et leur gris. Vu aux zooms repos-malts, repos-houblons, defile-levures, 1280-levures.
- Bandes : « 18 Kg », « 270 g + 30 ? », « 300 g » (état tous), « 7 Stk » en gras, même taille, même couleur. Rien d'autre n'a grossi
  ni changé de couleur : le montant de bande « 36,85 » est identique avant/après au pixel près.
- « juste » respecté : aucune couleur, aucune taille, aucun en-tête de colonne.

« bien alignées les champs »
- Malts : le bord droit de « 18 Kg » tombe sur celui de « 6 Kg … 2 Kg » (avant : 57 px à droite, au-dessus du prix, exactement ce qu'il
  entourait). Vu à 390 repos, 390 tous, 1280.
- Houblons : « 270 g + 30 ? » se termine sur la colonne des « 40 g / 20 g / 100 g » ; en état tous, « 300 g » idem.
- Levures : « 7 Stk » tombe sur « 2 Stk / 1 Stk » (avant : « 7 Stk = 7 sachets » débordait de deux colonnes). Prix alignés sur la
  virgule, montants sur le bord droit, dans les trois groupes.
- Contrôle de l'auteur cohérent avec ce que je vois : ALIGNE OK sur 6 vues, témoin d'avant ECHEC à 57 px.

## Les deux points vérifiés en particulier

1. « = 7 sachets » devenu pastille (écart signalé par l'auteur). Nécessaire : sans cela « 7 Stk » ne pouvait pas tomber sur « 2 Stk ».
   La pastille reprend la forme des « 2 sachets » des lignes et se place devant la quantité ; elle reste lisible sur le bleu de la bande.
   Nuance : elle est blanche quand celles des lignes sont grises (fond blanc pour tenir sur la bande teintée). Il ne l'a pas entourée ;
   je ne crois pas qu'il le relève. Pas un défaut.
2. « Rattacher les 5 » et « 18 Kg » à 390 au repos : 6 à 10 px entre le bouton plein et le « 18 Kg » en gras. Serré, mais le bouton est un
   chip rempli et foncé, le « 18 Kg » un texte nu : les deux se séparent sans se lire comme un seul libellé, et le bouton disparaît
   après le rattachement (état tous). À 1280, large. Pas un défaut ; à surveiller au port dans l'app si la bande gagne un élément.

## Rien d'autre changé

Diff limité à quatre règles CSS (`.p3a3-dq>span:first-child` en 600, `.p3a3-gh .p3a3-q` en 600 avec `margin-right:57px`, la pastille
`.p3a3-eqb`) et au sous-total Levures. Haut de page, résumé, TVA / Payé, lignes de mouture, « Target bis », « unité ? », pied : identiques
avant/après sur les quatre captures.

## Sa phrase prédite

« Nickel, là on voit bien les quantités et c'est aligné. On peut passer à l'app. »

Verdict : RETENUE. Aucune retouche demandée.
