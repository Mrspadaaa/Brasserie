# Décisions du pilote sur PLAN.md de uo (09.11)
- D1 à D6 et « Par date » : recommandations du plan retenues. D6 : « + pièce » ouvre la modification de l'écriture via `onAddProof`
  (fourni par us dans FinancesTab), sinon la fiche.
- `inventaire-ecrans.mjs` et `journal.css` : listés pour le pilote, hors voie.
- Bloquant commun (REVUE-A) : « dépensé » et « matériel à part » ont UNE seule définition, dans `src/domain/finance/periodeSynthese.ts` (voie us, écrit en premier, avec ses tests) ; uo l'importe et ne recalcule rien. uo attend que us ait posé ce fichier (vérifie sa présence et ses tests avant de coder la barre du mois).
