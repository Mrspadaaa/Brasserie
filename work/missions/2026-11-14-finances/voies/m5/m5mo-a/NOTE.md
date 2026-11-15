# m5mo-a — Modifier, tiède : le paiement suit
**Genre** : a, tiède. **Base** : m2mo-a telle quelle (pièce en tête, champs, Drive, Annuler / Enregistrer).
**Change** : le montant devient un champ (texte, inputmode décimal, plus de cadenas) ; état montré : 42,00 → 45,50.
Le paiement déjà noté suit tout seul et le dit, sur une ligne verte : « ✓ payé 9 nov. · banque 45,50 » ; sa date et son moyen s'ouvrent au ⌄.
Sortie : « garder 42,00 payé » (la différence passe alors à payer). « Déjà payé : avoir ou annuler » disparaît.
**Boosters** : paiement-suit (suivre). **Au port** : retirer `moneyLocked` (EditTransactionModal) et mettre à jour le paiement unique ; plusieurs paiements : variante b.
