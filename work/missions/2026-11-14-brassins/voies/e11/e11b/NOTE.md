# e11b — Sous-onglets sous le pouce
Chaleur : tiède.
Idée : les sous-onglets descendent sous le pouce.

- Les quatre sous-onglets quittent le haut pour un dock au-dessus de la barre du bas ; l'onglet actif s'élargit, prend sa
  couleur et porte son propre + (le + flottant disparaît : un seul +, attaché à ce qu'il crée).
- Tête noire : « 2 gestes aujourd'hui », deux tuiles pleines (Pils Confirmer FG, Pale Ale Brasser +6 j).
- Liste par moment : Demain (NEIPA avec frise J+1 à J+11, dry hop marqué), La semaine (6 jours, consigne 21 °C et garde
  tirées de la consigne), Au calme (Stout, Saison).
- **Atelier Houblons V5.5 : retiré** de la coque. Il reste atteint depuis la fiche recette et la fiche brassin (App.tsx l. 848, 861).
- Geste : le + de l'onglet ouvert ; au-dessus des autres onglets, ce que leur + créerait (+ recette, + idée, saisie rapide).
- Meilleure : cave et 1280 (poste de cave : rail à gauche, tête en colonne, dock en haut à droite).
Écart assumé : sous-onglets en bas (la baseline les met en haut) : le pouce atteint l'onglet et son + sans se déplacer.
Boosters : onglets-au-pouce, frise-cuve, semaine, plus-de-l-onglet.

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
