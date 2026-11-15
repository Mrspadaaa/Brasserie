# m5mo-d — Modifier, libre : les lignes refont le total
**Genre** : d, libre. **Base** : m2mo-a telle quelle.
**Change** : le montant est un champ (inputmode décimal) et le total des lignes de la pièce, éditables sous lui ;
ajouter « Gants nitrile 3,50 » fait 42,00 → 45,50. Chaque ligne porte son état : ✓ payé, ou hachure = à payer (la nouvelle).
**Boosters** : lignes-refont-total (ajuster). **Au port** : retirer `moneyLocked` ; lignes = `items` existants de la pièce (sinon une ligne) ;
un paiement par ligne n'existe pas : il couvre les premières lignes jusqu'à son montant (règle à écrire).
