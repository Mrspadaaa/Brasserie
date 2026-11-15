# v5a — v4c serré : les piles, puis chaque opération en entier

**Chaleur** : froide. **Idée** : v4c tel qu'il l'a aimé, en plus compact (piles de 112 px au lieu de 220), et plus aucun tiroir :
chaque catégorie reste ouverte, chaque opération dit tout sur deux étages (quoi · qui | montant ; état · date ou échéance · pièce | action).

## Ce qui change par rapport à v4c
- Piles et mois dans un seul bloc ; légende « payé 325,40 · à payer 400,00 · dépensé 696,80 » gardée.
- Tiroirs supprimés (« sans les déroulement, ouvrir ») : 7 opérations visibles, dont le retard de 2025 (groupe à part, hors novembre).
- Sur chaque ligne : qui (Atelier, Énergie, Comptoir du brasseur, Inox & Co, Marché du village), état (✓ payé 9 nov. · banque / à payer
  25 nov. · dans 16 j / à payer depuis le 20 déc. 2025), pièce (facture, ticket, sans pièce), et le geste (✓ Payé, + pièce).
- Liseré de couleur de catégorie à gauche de chaque ligne ; hachuré pour le loyer à payer (même code que la pile).
- 1280 : piles à gauche (collées), liste à droite.

## Baseline
Mois ‹ ›, recherche (en-tête), Par date, Filtres ⌄ (états), Doublons, Apport ou prélèvement privé, Archives, IA au toucher.
Fiche d'une opération : toucher la ligne (non dessiné, tout est déjà sur la ligne).

## Données
Fixture : 6 opérations de novembre + Solde atelier 2025. **Exemple** : quelles pièces sont jointes (la fixture n'en dit rien), écrit
« Pièces jointes : exemple ».

## État dessiné
`v5a-etat.png` : après « ✓ Payé » sur le loyer : pile des charges fixes pleine, payé 725,40, à payer 0,00, « Annuler » sur la ligne.

## Boosters
piles-basses · pastille-retard · lignes-entieres · paye-sur-ligne · ia-expliquer.

## B1–B13
B1 OK · B2 OK (piles puis lignes) · B3 OK (24 mots) · B4 OK (une action noire) · B5 non mesuré · B6 OK (liserés de catégorie) ·
B7 OK · B8 OK (hachuré, retard rouge) · B9 s.o. · B10 OK · B11 « Tout est payé sauf le loyer » · B12 OK (24 px au moins) · B13 OK.

## Contrôles
PAGE OK · MOTS 24 · COMMUN OK (`--sans=mots`, le compte des mots passe par `mots-premier-ecran`) · PANEL OK (avec v5b–v5d).

## Ce qui casse
Un groupe d'une seule ligne répète son montant (Ventes, Brassage…) : prix de la constance. À 1280, les piles restent petites.
