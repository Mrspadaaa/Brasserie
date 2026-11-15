# Décisions du pilote sur les plans de la phase 2 (09.11)

uc (port de c3a) :
1. `src/domain/finance/brewBudget.ts` et `tests/unit/brewBudget.test.ts` passent au Possède de uc pour le champ facultatif `fraisParPoste`
   (d1 est fini ; d2 ne les touche pas).
2. « Prévoir » : l'état de navigation est écrit et `onOpenForecast` exposé ; le branchement App/FinancesTab viendra avec l'écran Prévisions.
3. Bloc jaune : 33,42 avant le brassage · 30,84 plus tard (emballage avant le conditionnement + impôt après), comme PLAN-METIER B1 (b).
4. Litres nets inconnus : « — », jamais un litre calculé sur le volume à brasser.
5. Pointillé « estimé » dans l'app à la place de « exemple » : écart voulu, accepté.
6. Le port reste une feuille ; son contenu suit la maquette telle quelle (sans fil d'Ariane ni barre du bas, qui sont la page).
7. `tests/unit/coutBrassinFlux.test.ts` ajouté au Possède.
