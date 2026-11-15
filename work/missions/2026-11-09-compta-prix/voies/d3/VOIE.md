# Voie d3 — mesurer un achat de matériel futur

Agent : auteur (Sonnet), plafond 60. PLAN-METIER § 2. Lis aussi `../COMMUN.md`.
Possède : `src/domain/finance/materielFutur.ts` (neuf), `src/domain/finance/investmentScenario.ts`, `src/domain/finance/upgrades.ts`,
`src/domain/finance/types.ts`, `tests/unit/materielFutur.test.ts`, `tests/unit/equipmentUpgrades.test.ts`,
`work/missions/2026-11-09-compta-prix/voies/d3/**`.
Visé : problèmes 15, 16 ; fonction pure `mesurerAchat` (trésorerie au mois d'achat et point bas, usure par an, + coût du litre, ventes
nécessaires, meilleur mois). Exemple du brasseur : un frigo à 3 000 CHF.

RESULTAT.md tenu au fil dans `voies/d3/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/d3/tests.txt 2>&1`, puis lire la ligne `Test Files … | Tests …` (étape 2, après la revue ; à l'étape 1, rejouer sur HEAD les tests des appelants de la même façon).
