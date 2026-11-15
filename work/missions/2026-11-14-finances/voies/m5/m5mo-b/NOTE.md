# m5mo-b — Modifier, froide : la différence passe à payer
**Genre** : b, froide. **Base** : m2mo-a telle quelle.
**Change** : montant en champ (inputmode décimal, plus de cadenas) ; état montré : 42,00 → 45,50.
Le paiement noté ne bouge pas ; deux pastilles sous le champ : « ✓ payé 42,00 » et, hachurée, « reste 3,50 à payer », avec « Payer 3,50 ».
Montant baissé (ex. 40,00) : la pastille devient « trop payé 2,00 » et propose l'avoir.
**Boosters** : reste-a-payer (lire). **Au port** : retirer `moneyLocked` ; le reste vient de l'état de paiement existant (remainingCents).
