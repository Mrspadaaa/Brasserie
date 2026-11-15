# v5c — La carte du mois : chaque opération est une tuile, sa surface est son montant

**Chaleur** : chaude. **Idée** : les piles de v4c deviennent une seule carte (treemap) : à gauche ce qui est entré (720,00), à droite
ce qui est dépensé (696,80), au franc près en surface. Chaque tuile est une opération et porte tout : quoi, qui, montant, état,
échéance, pièce. On voit d'un coup que la vente couvre juste le mois et que le loyer en prend plus de la moitié.

## Ce qui change par rapport à v4c
- Plus de liste séparée : la carte est la liste. Tuiles groupées par catégorie (charges fixes : loyer + électricité ; brassage :
  malt + nettoyant), nom de catégorie sur la tuile.
- Loyer hachuré (à payer, 25 nov., dans 16 j) avec le seul bouton noir « ✓ Payé ».
- Hors de la carte, sous elle : matériel (à part, usure du matériel) et retard 2025, en deux cartes pointillées.
- Légende nommée : « surface = montant », « plein : payé », « hachuré : à payer ».
- « En liste » au pied ramène une liste (v5a) pour un mois chargé.

## Baseline
Mois ‹ ›, recherche, En liste, Par date, Filtres ⌄, Doublons, Apport ou prélèvement privé, Archives, IA au toucher.

## Données
Fixture seule ; pièces jointes : **exemple**. Surfaces calculées : 720,00 / 1 416,80 = 50,8 % de la largeur ; dans la colonne droite,
charges fixes 468 / 696,8 de la hauteur, loyer 400 / 468, etc.

## État dessiné
`v5c-etat.png` : décembre, avant la première opération : côté entré vide (« Pas encore de vente », « + Vendre ») ; côté dépensé, le loyer
prévu le 25 déc. (Prévisions) hachuré pâle, hors « dépensé ».

## Boosters
carte-du-mois · pastille-retard · paye-sur-ligne · ia-expliquer.

## B1–B13
B1 OK · B2 OK (la carte domine) · B3 OK (43 mots) · B4 OK · B5 non mesuré · B6 OK (surfaces) · B7 OK · B8 OK · B9 s.o. · B10 OK ·
B11 « Le loyer mange la moitié du mois » · B12 OK · B13 OK.

## Contrôles
PAGE OK · MOTS 43 · COMMUN OK · PANEL OK.

## Ce qui casse
Un mois de 30 opérations donne des tuiles trop petites : au-delà d'une dizaine, la carte regroupe les petites en une tuile « N autres »
ou bascule « En liste ». Le nettoyant (42,00) tient sur deux lignes serrées.
