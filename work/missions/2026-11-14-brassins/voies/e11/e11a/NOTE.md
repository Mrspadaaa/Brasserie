# e11a — La coque remise d'aplomb
Chaleur : froide.
Idée : l'écran actuel, rangé et nommé.

- Barre segmentée gardée, compteurs en pastilles (actif : jaune) ; plus de « 5 brassins » gris.
- Phrase-réponse : « Pils à confirmer, NEIPA dry hop demain ». Pastilles-filtres « 2 en cuve », « 1 en retard ».
- Cartes : cuve, nom, lot, pastille d'état pleine, jauge densité vers la bande FG, le geste du jour en bouton noir.
- Le + dit ce qu'il crée (« + Brassin », « + Recette »).
- **Atelier Houblons V5.5 : masqué**, déplacé dans le menu du + sous « Outils houblons » (sans « V5.5 »).
- Geste : menu du + ouvert, action de l'écran en tête (« Nouveau brassin · Sur Brassins »).
Écart assumé : aucun. Boosters : segment-compteurs, pastilles-filtre, jauge-fg, plus-nomme, menu-plus.

## Fonctions de l'écran actuel (ProductionTab.tsx l. 189-241, fabActions.ts, FloatingActions.tsx)
- Quatre sous-onglets et compteurs (Brassins en cours, Recettes) : gardés.
- Recherche, filtres, analyses « bilan » de la liste : gardés (icônes).
- Bouton + selon le sous-onglet (Nouveau brassin, Nouvelle recette, Nouvelle idée ; Volumes : saisie rapide) : gardé et nommé.
- Menu du + (Compagnon brasseur, Entrer une facture, Encaisser une vente, Créer une recette, Lancer un brassin) : gardé.
- Étoile (favori) et « … » des cartes : déplacés dans la fiche (non dessinés ici).

## Causes c3 évitées
1 ressemblance : composition propre (voir les trois autres) ; 4 phrase-réponse en gros en tête ; 3 couleurs pleines d'état
(vert fermentation, bleu garde, cuivre retard, or conditionné) ; 7 aucune phrase grise d'aide au repos, écran rempli à 390.

## Données
Ses 5 brassins et chiffres de BRIEF-AUTEUR.md. Fictifs : les 5 recettes (une par brassin, noms et styles tirés des brassins),
le compteur Recettes (5) et le statut du compagnon. Aucun α, IBU ni arôme inventé ; OG « — » hors NEIPA (1,062).
Compteur Brassins : 4 en cours (Saison écoulée hors compte, comme `isCurrent`).
