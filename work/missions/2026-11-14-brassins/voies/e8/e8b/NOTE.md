# e8b — tiède

Chaleur : tiède.
Idée : La frise des lots — chaque recette est une rangée sur l'année (lots placés à leur date, octobre et novembre agrandis, trait du jour), la recette ouverte déplie son historique en colonnes OG → FG face à la bande FG ; la phrase-réponse en tête dit quelle recette rebrasser (« Saison écoulée · Rebrasser »).

Fonctions : liste (rangées), nombre de lots (pastille), état du dernier lot, historique d'une recette (feuille « Brassins de … » devenue dépliage sur place), Ouvrir / Modifier (renvoi assistant), Comparer (sélection 1 et 2, bande du bas), comparaison en haltères (OG, FG en bandes, alcool, à cru, bandes IBU du style, houblons avec α). Recherche et + en tête. Filtres, tri, favoris, Ranger : non dessinés (restent dans l'app, à un toucher).
Causes c3 évitées : 1, 4 (phrase-réponse noire), 6 (la frise est pleine jusqu'au jour, pas un graphe vide d'avenir), 3.
Écarts assumés : axe non linéaire (oct.–nov. agrandis, étiquettes des mois l'attestent) pour lire les lots en cours ; « Rebrasser » est une action nouvelle (créer un brassin depuis la recette, déjà possible via « Préparer un brassin »).
Images : repos, geste, comparer en clair 390 ; repos en cave 390 et 1280 (meilleure de la série).
Baseline : jamais type=number (aucune saisie ici) ; chiffres à la virgule ; inconnu = « — » ; cibles ≥ 44 px ; FG en bande ; 5,8 % dit provisoire ; J+5 depuis le levurage ; pas de code interne, pas de bandeau d'alerte, pas de paragraphe ; classes et globales préfixées ; HTML autonome.
Données fictives (plausibles, sobres) : versions V1 à V3 ; lots passés 006, 009, 011, 014, 016 (dates et densités) ; recettes de Pale Ale (OG 1,050, FG 1,010–1,012, 5,1 %, Cascade 60 g soit 2,5 g/L), Pils (5,0 %, Saaz), Stout (Fuggle), grains en %. Réelles (BRIEF-AUTEUR) : 5 brassins, NEIPA OG 1,062, FG 1,010–1,014, 1,018 au 13.11, 5,8 % provisoire, Verdant IPA, 19/21/2 °C, Citra 100 g + Mosaic 80 g (7,5 g/L dérivé), Pils garde J+18, Stout 5,9 %, Saison 6,1 % écoulée, Pale Ale à brasser le 08.11. α : src/data/hopDatabaseBootstrap.json (Citra 10–16, Mosaic 10–15, Cascade 4–9, Saaz 2,5–6). Bandes IBU du style : src/data/brewingStylesBootstrap.json (BJCP 2021). IBU des recettes : « — » partout (aucun inventé). Couleurs de verre : SRM des styles BJCP, approchées.

## Rhabillage à l'identité (re8, 15.11)
- Trousse chargée : chrome de l'onglet (Recettes active), barre du bas et + de l'app ; le + et la loupe d'en-tête propres à e8b passent dans la ligne d'outils de l'app (« 5 recettes · 10 lots », loupe, Comparer).
- Bandeau noir de la Saison devenu un id-panneau, phrase en id-display 28/600, « Rebrasser » en bouton primaire ; frise, historique OG → FG et haltères gardés, recolorés en jetons (EBC par recette, hop, water, attention, alerte pour aujourd'hui).
- Couleurs de recette : Saison copper, NEIPA gold, Pale Ale amber, Pils gold à 50 %, Stout stout. Aucun texte ni chiffre changé.

## Retouches g2b (verdict k2, 15.11)
- Cartes de lots : la bande FG verte s'arrête à droite de la barre ; les FG 1,015, 1,012, 1,018 (et les OG) sont posées hors de la bande, à droite.
- Comparer, Amertume : bornes de la NEIPA (25, 60) au-dessus, de la Pale Ale (30, 50) au-dessous ; le « 30 » est rendu.
- Comparer : la carte NEIPA montre sa levure, Verdant IPA (BRIEF-AUTEUR).
- « lot 012 · 6,1 % » : espace fine avant %.
