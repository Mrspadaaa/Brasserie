# e11c — La cuverie dans l'onglet
Chaleur : tiède.
Idée : la liste devient le tableau des cuves.

- Onglets soulignés, compteurs en pastilles noires.
- Phrase-réponse : « F1 dry hop demain, F2 vide depuis 6 j ».
- Quatre tuiles pleines par cuve (F1, F2 vide hachurée, garde 2 °C, bouteilles) avec niveau, valeur en gros et bouton.
- Le + est scindé : « + Brassin » (action de l'onglet) et l'éclair (Saisie rapide).
- **Atelier Houblons V5.5 : gardé**, renommé « Houblons » en pastille verte dans l'en-tête (sans « V5.5 »).
- Geste : l'éclair ouvert, la feuille « Saisie rapide » (Lire un justificatif, Saisir une dépense, Encaisser une vente,
  Préparer un brassin, Connexion et justificatifs), et l'action de l'onglet rappelée dessous.
Écart assumé : le niveau dans la tuile est décoratif (80 %), pas un volume mesuré. Boosters : tableau-cuves, plus-scinde, houblons-garde.

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
