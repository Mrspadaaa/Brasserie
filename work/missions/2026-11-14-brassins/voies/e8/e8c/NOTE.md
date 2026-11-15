# e8c — tiède

Chaleur : tiède.
Idée : Le duel d'abord — l'écran pose la question « Laquelle brasser ensuite ? » avec deux cases à remplir ; le carnet est une grille de tuiles à la couleur de la bière (alcool en gros, lots en capsules, état du dernier lot) ; la comparaison est un papillon en miroir.

Fonctions : liste (tuiles), tri en bascule (Récentes, Plus brassées, Alcool), nombre de lots, état, Nouvelle recette (tuile, renvoi assistant), Comparer (deux cases et VS), feuille comparée (OG, alcool, à cru, FG, IBU, grain, houblons α, levure, dernier lot fini), Ouvrir. Historique : seulement le dernier lot fini dans la comparaison (non dessiné en dépliage). Recherche, filtres, favoris, Ranger : non dessinés.
Causes c3 évitées : 1, 3 (aplats pleins), 4 (« La NEIPA : plus dense, plus forte, 3 × plus de houblon à cru »), 7.
Écarts assumés : la comparaison devient l'entrée de l'écran.
Baseline : jamais type=number (aucune saisie ici) ; chiffres à la virgule ; inconnu = « — » ; cibles ≥ 44 px ; FG en bande ; 5,8 % dit provisoire ; J+5 depuis le levurage ; pas de code interne, pas de bandeau d'alerte, pas de paragraphe ; classes et globales préfixées ; HTML autonome.
Données fictives (plausibles, sobres) : versions V1 à V3 ; lots passés 006, 009, 011, 014, 016 (dates et densités) ; recettes de Pale Ale (OG 1,050, FG 1,010–1,012, 5,1 %, Cascade 60 g soit 2,5 g/L), Pils (5,0 %, Saaz), Stout (Fuggle), grains en %. Réelles (BRIEF-AUTEUR) : 5 brassins, NEIPA OG 1,062, FG 1,010–1,014, 1,018 au 13.11, 5,8 % provisoire, Verdant IPA, 19/21/2 °C, Citra 100 g + Mosaic 80 g (7,5 g/L dérivé), Pils garde J+18, Stout 5,9 %, Saison 6,1 % écoulée, Pale Ale à brasser le 08.11. α : src/data/hopDatabaseBootstrap.json (Citra 10–16, Mosaic 10–15, Cascade 4–9, Saaz 2,5–6). Bandes IBU du style : src/data/brewingStylesBootstrap.json (BJCP 2021). IBU des recettes : « — » partout (aucun inventé). Couleurs de verre : SRM des styles BJCP, approchées.
- Retouches f3b2 (verdict c5b) : « triple dry hop » (trois ajouts) devenu « 3 × plus de houblon à cru » (un ajout, 7,5 g/L contre 2,5) ; rond VS remonté au-dessus des noms (« APA · V2 » lisible) ; pastille d'état sous le nom dans chaque tuile (« à brasser » ne mord plus sur « Pale Ale »).

## Rhabillage à l'identité (re8, 15.11)
- Trousse chargée (`identite.css`, `chrome.js`) : en-tête, sous-onglets (Recettes active), barre du bas et + de l'app ; thèmes clair et cave par jetons.
- Phrase-réponse en `id-display` (28/600) ; noms des tuiles 18/600 ; alcool en mono 24/600 ; graisses ≤ 600 ; rayons 16 (tuiles, cases) et ronds.
- Tuiles en EBC (NEIPA gold, Pils gold à 50 % sur blanc, Pale Ale amber, Stout stout, Saison copper), encre fixe 17/17/17 ou blanche sur la bière ; état en `id-pastille` (hop J+5, attention à brasser, water garde, cuivre conditionnée, éteint écoulée) ; tri en `id-segments`.
- Cases du duel en pointillé de l'app ; VS et numéros en paille de l'action ; « Comparer » en `id-btn-primaire`.
- Papillon posé dans une feuille de l'app (« Comparer deux recettes ») : sa croix remplace le bouton retour ; grain en EBC ; « Ouvrir » en `id-btn-secondaire` au pied.
- Aucun texte ni chiffre changé.
