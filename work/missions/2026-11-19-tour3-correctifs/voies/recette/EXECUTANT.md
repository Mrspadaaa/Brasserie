# EXECUTANT — rejeu du banc, voie recette (19.11)

Banc : `node banc.mjs <chemin absolu>/captures` (premier essai raté : chemin relatif résolu depuis port-carnet après `chdir`, aucune mesure écrite ; relancé en chemin absolu, sortie complète dans `banc-sortie-complete.txt`). Code non modifié.

## Mesures clés (`captures/mesures.jsonl`, 6 jeux : p390, l844, d1280 × clair, cave)

- `planifier.desactive` avant geste : `true` dans les 6 jeux.
- `adapter` non nul avant geste : 6/6 (hauteur 44 px partout). Nul après « Adapter » : 6/6.
- Hauteur bouton ≥ 44 : « Adapter » 44 px et « Planifier » 44 px dans les 6 jeux.
- `alerte` : `null` dans les 24 lignes.
- `debordeX` : `false` partout ; aucune erreur de page.
- Lot créé après « Planifier » : `LOT-001`, 24 L, `mat: true` dans les 6 jeux.
- Écart de libellé : le lot après geste donne `titre: "planifie"`, la consigne disait « ferme ». Mesure brute gardée ; à trancher par le pilote. La fermeture de la feuille n'est pas mesurée directement (pas de capture `apres-planifier` ouverte).

## Captures ouvertes

1. `captures/p390-clair-avant-geste.png` (390×660, clair)
   - Vu : bloc amber « Recette à adapter… » avec « Modifier la recette › » ; bouton « Adapter à mon matériel actuel · ZZ TEST — Royal Catering » en pleine largeur, deux lignes ; « Planifier jeu. 19.11 » grisé à droite d'« Annuler ». Aucun rouge.
   - Défaut 1 : « Planifier » (y 635 à 679) dépasse le bas de l'écran (660) ; « Annuler » coupé. Le pied n'est pas visible d'emblée au premier écran.

2. `captures/p390-cave-adapte.png` (390×660, cave, après « Adapter »)
   - Vu : bloc d'alerte disparu ; ligne « Matériel de ZZ TEST — Royal Catering pris pour ce brassin · la recette enregistrée ne change pas. » ; « Planifier jeu. 19.11 » jaune plein, actif ; « Annuler » entier. Aucun rouge.
   - Défaut 2 (mineur) : la ligne « pris pour ce brassin » est petite (≈12 px) avec un filet fin : lisible mais discrète.

3. `captures/l844-clair-avant-geste.png` (844×340, clair)
   - Vu : en-tête, « À vérifier », haut du calendrier. Tout le reste est hors écran.
   - Défaut 3 : à 844×340, « Adapter » (y 530) et « Planifier » (y 584) sont sous le bord (340). La capture ne montre ni le bloc d'alerte ni les boutons : le geste « joignable au pouce » n'est pas établi par cette image ; il faut défiler dans la feuille (le clic réel défile : « Planifier » passe à y 285).

4. `captures/d1280-cave-avant-geste.png` (1280×800, cave, avant geste)
   - Vu : feuille centrée, entière ; bloc amber avec « Modifier la recette › » et « Adapter à mon matériel actuel · ZZ TEST — Royal Catering » ; « Annuler » ; « Planifier jeu. 19.11 » grisé (fond olive atténué). Aucun rouge.
   - Défaut 4 (à juger) : « Planifier » grisé a un contraste faible (texte beige sur olive sombre). Sous-titres et légende petits (≈11 px au 1x). Je ne mesure pas le contraste ; c'est une lecture à l'œil.

## Bilan

- Quatre défauts candidats sur les 4 captures : deux de position (390 pied sous le pli ; 844×340 actions hors écran), un de contraste à juger (Planifier grisé en cave 1280), un de petite taille (ligne « pris pour ce brassin »).
- Aucun rouge ni alerte dans les 24 états. Mesures conformes à la consigne sauf le libellé « ferme »/« planifie ».
- Non rejoué : `apres-planifier` en capture (la feuille reste-t-elle ouverte, à vérifier visuellement).
