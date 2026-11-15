# Voie d1 — une seule chaîne litre → format, et l'impôt bière juste

Agent : auteur (Sonnet), plafond 60. PLAN-METIER § 3.1 et § 3.4 (calculs seulement, pas l'écran). Lis aussi `../COMMUN.md`.
Possède : `src/domain/finance/chaineLitre.ts` (neuf), `src/domain/finance/brewBudget.ts`, `src/domain/finance/swissBeerTax.ts`,
`src/domain/alcohol.ts`, `tests/unit/chaineLitre.test.ts`, `tests/unit/brewBudget.test.ts`, `tests/unit/swissBeerTax.test.ts`,
`work/missions/2026-11-09-compta-prix/voies/d1/**`.
Visé : problèmes 3, 4, 12 (calcul), 13 (assiette), 14 ; trois notions dejaPaye / aPayer / annee ; beerTaxForVolume, beerTaxPerFormat ;
°Plato unique.

RESULTAT.md tenu au fil dans `voies/d1/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/d1/tests.txt 2>&1`, puis lire la ligne `Test Files … | Tests …` (étape 2, après la revue ; à l'étape 1, rejouer sur HEAD les tests des appelants de la même façon).
