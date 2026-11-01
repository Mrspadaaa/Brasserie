# z4 — le pont facture ↔ stock (v0, série z, 31.10)

**Chaleur : chaude.** Une seule idée : l'écran est un **pont à deux rives**. À gauche, la facture (quantité, unité imprimée, article
tapable) ; à droite, le stock (ce que la ligne y fait : « +6 kg », « nouveau · Malt », « Target bis », « 2 sachets ») ; au milieu, le
lien en icône (chaîne, cercle pointillé +, deux carrés bis, ↑ pour un service à rattacher). Ses mots : « Les liens avec le stock et
tout se font pas correctement », « Attention au mapping, on veut pas se retrouver avec plein de fiches du même produit » : le mapping
est l'écran. La TVA imprimée, hors stock, est la première ligne du pont (2,80 · 4,15 · vide, le calcul dessous). Le haut tient la
somme (tapable), « 23 lignes », le compteur « 3 points » et trois chips qui descendent au point.

**Axes** : A3 à fond (une icône par ligne : relié, nouveau, bis, service ; le toucher de la tuile droite choisit l'article ; la
mouture ×5 se rattache d'un seul ↑ aux cinq malts du dessus, qui prennent « · mouture ») ; A1 (chips + ligne ambre) ; A2 (repliées
sauf les douteuses : « 2 autres », « 6 autres », « 4 · Stk = sachets » avec leurs icônes) ; A5 (compteur). Stock simulé.

## Baseline cochée
- [x] justificatif : nom, Voir, Changer (dans le tiroir) ; Drive prêt · [x] Total TTC (en-tête, tapable) · [x] Pour quoi ? (proposé)
  · [x] Achat du · [x] Déjà payé / À payer (segment dans le tiroir, visible replié) · [x] Payé le « supposée » (= date de facture, non
  imprimée) + moyen · [x] Échéance · [x] Fournisseur et catégorie · [x] Lier à une dépense prévue · [x] lignes (article, quantité,
  unité, lien, stock) ; montant par ligne dans les lignes dépliées et par famille · [x] + ligne · [x] regrouper · [x] 86,50 / 86,50
  · [x] n° facture, commande, TVA, taux · [x] Confirmer et enregistrer · [x] ×
- matériel : non montré ; retirer une ligne : non dessiné. Le montant de chaque ligne n'est pas au premier plan (place prise par
  la rive stock) : à un toucher.

## Boosters UX (boosters-ux)
- Boosters : `pont-facture-stock` — lire / choisir ; deux rives et un lien ; le ↑ fait passer « — » à « dans les malts · 2,40/kg » et
  ajoute « · mouture » aux cinq tuiles. `compteur-points` — suivre ; chips → barrées. `deux-valeurs` — choisir. `edition-sur-place`
  — ajuster. `bascule-reglement` — choisir. `action-unique` — déclencher.
- B1 OK (haut / regle : TVA en vert « TVA laissée vide · HT vide », chip TVA barrée, « 2 points ») · B2 OK (le pont domine, un primary)
  · B3 OK : 98 mots (≤ 98, à la limite) · B4 OK (familles par filets de couleur) · B5 OK · B6 OK (12 / 14 / 22) · B7 OK (CONTRASTE OK,
  pire 4,85:1) · B8 OK (9 états) · B9 OK · B10 OK · B11 : « 86,50, 23 lignes, 3 points ; chaque ligne de la facture est reliée ou
  non au stock, et ce qu'elle y ajoute » · B12 OK · B13 OK (↑ 28 px, tuiles 30 px).
- Écarts voulus : le montant par ligne cède sa place à la rive stock au premier plan ; les tuiles de stock vertes (#EEF3E6, rubrique
  stocks) pour que la rive droite se lise comme « le stock ».

## Contrôles (sorties)
PAGE OK · COMMUN OK (mots 98 modéré) · mots 98 · CONTRASTE OK · panel (4 z) : remplissage 0,42 ; ressemblance 0,90.

## Ce qui tient, ce qui casse
Tient : la question « est-ce que ça va au bon endroit ? » a sa réponse ligne par ligne, et le doublon est impossible à rater (bis).
Casse : 98 mots, pas de marge pour une facture plus bavarde ; à 390 px, la rive droite serre les noms longs (« Hallertauer Blanc CH »).
