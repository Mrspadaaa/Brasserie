OK — 13 problèmes, 2 bloquants

Version : arbre de travail non commis (base d91c5ad7), captures `voies/s1/captures/` du 15.11, 21:35 à 21:37 (après le dernier changement dit dans s1/RESULTAT.md).
Question : « combien et quels problèmes il y a ? ». Paires ouvertes : repos 390 clair, repos 390 cave, repos 1280, geste (Brasser) 390 et 1280, recette 390 clair et cave, vide 390 clair et cave. Sans paire dans r2a, ouvertes : repos-bas (clair, cave), recette 1280, recette prête, filtre, recherche, recherche vide, archives, Planifier 390 et 1280. Les fichiers « recette-bas » sont identiques à « recette » (même taille, même empreinte en 1280) : la feuille tient sans défiler.
Non comptés (ACCORD et DÉCISION de s1, bien dits) : Fermenteur libre, stock réservé, « Planifier » au lieu de « Aux besoins », « Modifier », date complète au lieu de « dernière en août », une ligne par malt, compteurs e11a, « + Recette », Comparer et bilan retirés, « Brasser » qui ouvre l'ancienne feuille (d1 la redessine), c2a non porté.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| r2a-repos (+ bas) | clair | 390 | repos | 3, 9 | 0 |
| r2a-repos (+ bas) | cave | 390 | repos | 3, 9 | 0 |
| r2a-repos | clair | 1280 | repos | 3, 9 | 0 |
| r2a-geste | clair | 390, 1280 | Brasser (Blonde) | (feuille d1, non comptée) | 0 |
| r2a-geste-planifier | clair | 390, 1280 | Planifier (NEIPA) | 8 | 0 |
| r2a-recette (+ bas) | clair, cave | 390 | feuille NEIPA | 3, 4, 5, 7, 10, 13 | 0 |
| r2a-recette | clair | 1280 | feuille NEIPA | 3, 4, 5, 7, 10, 11, 13 | 0 |
| r2a-recette-prete | clair | 390 | feuille Blonde | 1, 3, 4, 6, 10 | 1 |
| r2a-filtre | clair | 390 | feuille Filtrer | 10 | 0 |
| r2a-recherche | clair | 390 | « saaz » | 2 | 1 |
| r2a-recherche-vide | clair | 390 | aucun résultat | 2 | 1 |
| r2a-archives | clair | 390 | Archives | aucun | 0 |
| r2a-vide | clair, cave | 390 | vide | 12 | 0 |

## r2a — CORRIGER

1. [B] Feuille « ZZ Blonde de soif · v2 » (recette prête, 390 clair), ligne « OG 1,048 · **70** IBU » : la fixture dit `ibuTarget: 22` ; la feuille NEIPA, elle, montre bien la cible (40). Deux sources pour un même chiffre, et une blonde de soif à 70 IBU n'existe pas chez un brasseur. Cause probable : l'IBU recalculé depuis le Saaz de la fixture, à α 12 % (un Saaz réel est à 3 ou 4 %). Correction : la ligne montre l'IBU de la recette (celui de la fiche), le même pour toutes les lignées ; et la fixture du banc passe le Saaz à α 3,5 %. Brasseur : « 70 IBU sur ma blonde ? c'est faux ».
2. [B] Recherche (390 clair) : avec « saazzzzz », la tête dit « Rien de prêt à brasser » alors que deux recettes sont prêtes ; avec « saaz », elle dit « 2 à un achat près » (au lieu de 3) pendant que « 6 lignées / 11 recettes » ne bouge pas. La phrase-réponse de r2a parle du carnet, pas du filtre : elle devient fausse dès qu'on tape. Correction : la tête garde les comptes du carnet entier pendant une recherche ou un filtre, et le résultat se dit sous le champ (« 5 sur 11 », « Aucune recette ne correspond »).
3. Lignes et feuilles (tous thèmes, 390 et 1280), ce qui manque et ce qu'elle demande : r2a écrit « manque **levure Belle Saison**, 1 sachet » et « Levure Verdant IPA, 1 sachet » ; l'app écrit « manque **ZZ Levure Belle Saison 1 sachet** » (virgule perdue, quantité en gras, « sachet » seul à la ligne en 390) et « ZZ Levure Verdant IPA 1 sachet ». Correction : « nom, quantité », le nom seul en gras, comme sa maquette.
4. Feuilles NEIPA et Blonde, colonne de droite : « 2 sachet libres », « 3 sachet libres ». Correction : accord du pluriel (« 2 sachets libres »).
5. Feuille NEIPA, « Depuis la v2 » : « levure ZZ Levure Verdant IPA » (le mot levure en double). r2a : « levure Verdant IPA ». Correction : ne pas préfixer quand le nom commence déjà par Levure (ou retirer le mot du nom).
6. Feuille Blonde : « ZZ Malt Munich 600 g » à côté de « 2 kg libres » ; r2a écrit « Malt Munich 0,6 kg ». Correction : la quantité d'un malt reste en kg, à la virgule, dans la même unité que le stock.
7. Feuille NEIPA (390, 1280, deux thèmes) : l'encart dit « il manque ZZ Citra 250 g », mais son bouton est « Planifier le brassin », qui ne répond pas au manque et fait doublon avec « Brasser quand même » au pied (même feuille de préparation). Le libellé est couvert par l'ACCORD 1, pas ce doublon. Correction : tant que « aux besoins » n'existe pas, l'encart garde l'information sans bouton noir (ou un lien « À commander » du Stock), et un seul verbe de brassage reste au pied.
8. Planifier sur ZZ NEIPA (390 et 1280) : la feuille « Préparer un brassin » s'ouvre sans un mot sur la Citra qui manque ; « Créer le brassin à brasser » est proposé comme si tout était là. Le sens de r2a (« ce qu'il faut acheter » jusqu'au bouton) se perd au geste. Correction : la feuille ouverte depuis une recette incomplète redit « il manque ZZ Citra 250 g » ; à porter dans la feuille que d1 redessine.
9. Repos (deux thèmes, 390 et 1280), groupe Prêtes : la Pale Ale déjà planifiée (sans verbe, « ZZ-020 › ») passe en tête, la Blonde à brasser en second ; r2a met les recettes à brasser d'abord et la planifiée en dernier. Correction : trier les prêtes sans brassin planifié d'abord.
10. Feuilles recette et Filtrer (390 clair et cave, 1280) : un anneau noir épais (or en cave) entoure le × à l'ouverture, au toucher. r2a n'en a pas ; à l'œil, c'est un bouton sélectionné par erreur. Correction : focus sans anneau visible au toucher (`:focus-visible` seulement au clavier), ou focus initial sur le titre.
11. Feuille recette à 1280 : elle s'étale sur toute la largeur (le nom à gauche, « 25 kg libres » à 1 200 px), alors que « Préparer un brassin » s'ouvre en fenêtre centrée de 520 px. Correction : même gabarit centré (≈ 560 px) que les autres feuilles à 1280.
12. Vide (390, deux thèmes), barre des sous-onglets : « Brassins 0 », « Recettes 0 » dans un zéro barré à chasse fixe, qui se lit « ø ». r2a n'a pas de pastille, et un zéro n'apprend rien. Correction : pas de pastille à 0 (chiffres de la police du texte). Vient du choix e11a, hors de cette voie : à signaler à sa voie.
13. Feuille NEIPA, encart : r2a dit « tous réservés au dry hop du LOT-019 (15.11) » ; l'app dit « tous réservés au ZZ-019 », sans le moment ni la date. Le brasseur pense en moment de houblon. Correction : dire le moment et la date de la réservation quand la donnée les porte ; sinon garder la phrase courte, mais ne pas inventer.

Doutes (non comptés) :
- 1280, tête : « 11 recettes » paraît bleu, alors que « lignées » juste au-dessus est gris dans la même capture. s1 dit « antialiasing, même couleur calculée » ; à vérifier sur une capture zoomée à l'échelle 2.
- Archives : la ligne « 1 lignée aux Archives » porte l'icône de l'onglet Stocks (les cubes) ; peut se lire « stock ».
- « ‹ Retour au carnet » (Archives) : lien souligné, hauteur visible sous 44 px ; à mesurer.
- Les captures c2a (repos, vide, geste) ne sont pas jugées ici : c2a n'est pas porté (DÉCISION 1 de s1) ; `c2a-geste` est le même fichier que `r2a-geste`.
