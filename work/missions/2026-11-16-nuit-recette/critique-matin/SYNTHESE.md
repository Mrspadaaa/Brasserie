OK — 11 problèmes, 1 bloquant

Version : 4067e777 + changements non commités des voies m1-recette, m2-stock, m3-plus (16.11, matin)
Banc : local, `?dev-local`, serveur de dev sur le port 5198 (le 5197 était déjà pris par un autre processus), VITE_HOP_V4=on, arrêté.
Captures du critique : `critique-matin/captures/` (banc.mjs, banc2.mjs, journal.json, journal2.json). Captures des voies ouvertes :
m1 `captures-menu/` (6), `captures-apres/` (clair 390 haut et bas), m3 `captures/` (7).

## Table

| capture | thème | largeur | état | problèmes (n° de la liste) | bloquants (n°) |
|---|---|---|---|---|---|
| m3 clair-390-houblons, cave-390-houblons-menu | clair, cave | 390 | menu ouvert, Houblons | 8 | 0 |
| clair/cave-390-houblons-apres | clair, cave | 390 | « Ajouter un houblon » touché : curseur dans « Ajouter — houblon… » | 0 | 0 |
| m3 clair-390-paliers, cave-390-paliers-menu | clair, cave | 390 | menu ouvert, Paliers | 8 | 0 |
| clair/cave-390-paliers-avant/-apres, paliers-menu | clair, cave | 390 | « Ajouter un palier » touché | 1 | 1 (n° 1) |
| m3 clair-1280-paliers | clair | 1280 | menu ouvert, Paliers | 9 | 0 |
| clair/cave-390-eau-menu | clair, cave | 390 | menu ouvert, Eau (atteinte par « Aller à ») | 8 | 0 |
| clair/cave-1280-eau-menu | clair, cave | 1280 | menu ouvert, Eau | 9 | 0 |
| m3 clair-390-recap, cave-390-recap-menu | clair, cave | 390 | menu ouvert, Récap | 8 | 0 |
| clair/cave-390-exporter-apres | clair, cave | 390 | « Exporter la recette » touché depuis Eau | 7 | 0 |
| m3 clair-390-levure, clair-390-levure-apres | clair | 390 | menu, puis « Choisir une levure » touché | 6 | 0 |
| m1 clair/cave-390-menu, cave-390-recette-menu | clair, cave | 390 | page recette, menu ouvert | 2, 3 | 0 |
| m1 clair-1280-menu, clair/cave-1280-recette-menu | clair, cave | 1280 | page recette, menu ouvert | 2, 3, 9 | 0 |
| m1 clair/cave-390-feuille, cave-390-recette-feuille, clair-1280-feuille | clair, cave | 390, 1280 | feuille de suppression | 4, 5 | 0 |
| m1 captures-apres clair-390-haut, clair-390-bas | clair | 390 | en-tête « American IPA 30 L » grisé ; bas Dupliquer / Supprimer | 11 | 0 |
| m2 (aucune capture) | — | — | carnet et feuille Brasser, « il manque Pilsner Malz 5 kg » | 10 (lu au code) | DEMANDE EXECUTANT |

Rien n'a disparu du menu : « Partout » garde Écriture, Facture, Vente, Recette, Brassin, Compagnon à chaque étape et sur la page de
la recette (journal.json) ; les onglets ne sont pas touchés (la page ne parle que si `anchor === 'page'`) ; le bouton
« Supprimer la recette » du bas de la page reste (clair-390-bas). Annuler dans la feuille ne supprime rien et la ligne revient au
menu suivant. Le « + » reste flottant partout (b1r).

## Problèmes

1. **BLOQUANT — Paliers, « Ajouter un palier » sans effet** (clair et cave 390 : paliers-avant et paliers-apres identiques,
   `journal2.json` : 0 `button[aria-label="Ajouter un palier"]` dans la page). Le geste vise un `button`, mais le « + » de la courbe
   est un `<g role="button" data-booster="ajout-frontiere" data-frontiere="fin">` en SVG (CourbeEmpatage.tsx l. 210). Le menu se
   ferme et rien ne se passe. Le test vert de m3 tourne sur un autre rendu (L11).
   Correction : viser `[data-booster="ajout-frontiere"][data-frontiere="fin"]`, lui envoyer l'événement que le « + » écoute (un
   SVGElement n'a pas `.click()`), puis vérifier dans Chrome qu'un troisième palier apparaît.
2. Page de la recette : la seule action « Sur American IPA » est « Supprimer la recette ». C'est la plus rare et la seule qui détruit,
   et elle se trouve contre le « + ». Préparer un brassin, Modifier, Dupliquer et Exporter n'y sont pas (m1 menu, 390 et 1280 ;
   b1r : « celle de l'écran actuel sont plus mis en avant »).
   Correction : déclarer Préparer un brassin (contre le +), Modifier, Dupliquer et Exporter, et mettre Supprimer le plus loin du +.
3. Page de la recette : la ligne « Supprimer la recette » a la même teinte que les actions ordinaires (Brassins), sans rouge. Le
   bouton du bas, lui, a un bord rouge.
   Correction : bord et icône rouges sur cette ligne, comme le bouton du bas.
4. Feuille de suppression : le nom est répété, « American IPA — American IPA, 30 L » (le nom et le style sont identiques ; 390 et
   1280, deux thèmes).
   Correction : n'afficher le style que s'il diffère du nom.
5. Feuille de suppression : Annuler et « Supprimer la recette » font 28 px de haut (journal : 182×28 à y 814 sur 844) et touchent le
   bord bas de l'écran. C'est trop petit pour le pouce, et c'est un geste destructif.
   Correction : 44 px de haut et marge du bas (safe-area), comme les « Garder / Annuler » d'Atelier.
6. Levure : le menu propose « Choisir une levure » alors que SafAle US-05 est déjà posée. Le geste ouvre « Chercher » sans curseur
   dans « Nom, fabricant ou code », alors qu'Houblons met le curseur dans son champ (clair-390-levure-apres).
   Correction : « Changer de levure » quand une levure est posée, et focus dans le champ de recherche.
7. « Exporter la recette » depuis Eau ou Paliers : le geste saute au Récap et copie le texte en silence. Le presse-papier est rempli,
   mais le « Copié » vit sur le bouton « Texte » au bas du Récap, hors de vue, et aucun toast ne le dit (exporter-apres, 2 thèmes).
   Correction : un toast « Recette copiée », et rester à l'étape en cours.
8. « Aller à » : 7 pastilles sur 2 lignes doublent le fil d'étapes déjà visible en haut de l'écran. Le menu fait 450 px sur 844,
   plus de la moitié de l'écran (toutes les étapes, 390, deux thèmes).
   Correction : retirer « Aller à », ou le réduire à « ‹ Précédente · Suivante › » sur une ligne.
9. 1280 : le voile du menu coupe l'écran net à mi-colonne. On voit une bande claire ou sombre à bord franc, « Préparer un brassin »
   tronqué en « Préparer ur », la carte Rinçage à moitié floue (Eau) et la courbe des paliers coupée (m3 clair-1280-paliers, critique
   clair et cave 1280 eau et recette). C'était probablement déjà là avant les voies.
   Correction : voile sur toute la largeur, ou panneau borné au menu, avec un dégradé.
10. m2, lu au code et non vu : pour un même malt, la recette dit « manque 5 kg » (carnet, feuille Brasser) et la fiche Stock dit
    toujours « manque 49 kg » (StockDetailSheet l. 324), sans dire pourquoi.
    Correction : sur la fiche Stock, « manque 49 kg, dont 44 pour d'autres brassins » (option recommandée par m2).
11. Hors des voies, mais sur les écrans pris : le même Citra (60 g à 20′) est dit « amérisant » sur la page de la recette et
    « aromatique » dans l'assistant (Houblons). Ce sont deux mots contraires pour un seul ajout (clair-390-haut, cave-390-houblons-menu).
    Correction : un seul rôle, celui de l'ajout, calculé au même endroit pour les deux écrans.

## Doutes (non comptés)

- La première ligne du menu (la plus proche du +) est cerclée de noir en clair, de blanc en cave, à l'ouverture. Sur la page de la
  recette, c'est donc « Supprimer » qui est cerclée. Le cercle peut venir du clic simulé du banc (focus visible) : à revoir au vrai
  toucher.
- Récap : « Enregistrer la recette » et « Enregistrer et préparer un brassin » sont à la fois dans le menu et dans le pied de page.
  Le doublon est voulu (b1r : toujours possible) ; à surveiller.
- m2 : la règle `min(manque À commander, besoin)` est juste au calcul (stock 0, 44 kg ailleurs : 5 kg). Le libellé « stock négatif :
  à corriger » n'a été vu nulle part.

## DEMANDE EXECUTANT (m2, captures manquantes)

1. Fixture locale (aucune donnée réelle) : une recette de 5 kg de Pilsner Malz, l'article « Pilsner Malz » à 0 kg en stock et 44 kg
   réservés par des brassins planifiés ; une variante avec un stock à −2 kg.
2. Banc `?dev-local`, serveur `node scripts/with_server.mjs --server "npm run dev -- --port 5198 --strictPort" --port 5198 --env
   VITE_HOP_V4=on -- node <banc>` : prendre en capture le carnet (Recettes, lignée de la recette) et la feuille Brasser ouverte,
   en clair et en cave à 390 tactile, puis en clair à 1280 ; enfin la fiche Stock de Pilsner Malz.
3. Sorties attendues : « il manque Pilsner Malz 5 kg » (jamais 49) dans le carnet et dans la feuille ; « stock négatif : à corriger »
   pour la variante à −2 kg ; la fiche Stock telle quelle.
4. Fichiers : `critique-matin/captures-m2/*.png` et `journal.json`. Ensuite, me renvoyer les captures pour jugement.
