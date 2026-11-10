# Décisions du pilote sur PLAN.md de us (09.11)
- D1 : accepté (catégories pour le payé, libellé de la pièce pour le hachuré).
- D2 : `periodeSynthese` dans `src/domain/finance/periodeSynthese.ts` (neuf, ajouté au Possède, avec son test unitaire) ; le Bord et l'Annuel
  l'appelleront plus tard (hors voie, listé).
- Compromis § 8 acceptés et listés pour le brasseur, dont les deux à regarder.
- FinancesTab (à toi) : fournis aussi au journal ce que demande uo (`onAddProof`, `onPay`, `assistant`, retrait du `{financeAssistant}` après
  le journal), voir uo/RESULTAT.md.
- Bloquant commun (REVUE-A) : « dépensé » et « matériel à part » ont UNE seule définition, dans `src/domain/finance/periodeSynthese.ts` (voie us, écrit en premier, avec ses tests) ; uo l'importe et ne recalcule rien. uo attend que us ait posé ce fichier (vérifie sa présence et ses tests avant de coder la barre du mois).
