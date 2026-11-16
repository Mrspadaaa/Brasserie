# e11d — Le classeur à intercalaires
Chaleur : chaude.
Idée : un classeur, quatre intercalaires au bord.

- Genre neuf : plus de barre d'onglets ; quatre intercalaires colorés sur le bord droit (texte vertical), compteur en pastille.
  L'actif s'élargit, colore la page et porte le +.
- Phrase-réponse : « Demain, Citra et Mosaic dans F1. »
- La liste devient un agenda des gestes (retard, aujourd'hui, demain, la suite, fait) sur un fil vertical.
- **Atelier Houblons V5.5 : retiré** (atteint depuis les fiches, App.tsx l. 848, 861).
- Recherche, filtres et bilan : non dessinés dans cette v0 (à placer en tête de page, passe 2).
- Geste : le + de l'intercalaire ouvre un tiroir ; les autres intercalaires montrent ce que leur + crée.
Écart assumé : texte vertical (lu en penchant la tête) ; 56 px de largeur pris au contenu. Boosters : intercalaires, agenda-des-gestes, tiroir-plus.

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
