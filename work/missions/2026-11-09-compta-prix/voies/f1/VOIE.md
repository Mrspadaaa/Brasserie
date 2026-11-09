# Voie f1 — une vraie QR-facture et un numéro continu

Agent : auteur (Sonnet), plafond 60. PLAN-METIER § 3.3 (calcul et PDF seulement, pas l'écran) et § 4 (QR-facture). Lis aussi `../COMMUN.md`.
Possède : `src/services/swissQrBill.ts`, `src/domain/finance/numeroFacture.ts` (neuf), `tests/unit/factureQr.test.ts`,
`work/missions/2026-11-09-compta-prix/voies/f1/**`.
Visé : problèmes 9, 10, 11 (données d'adresse lues, pas l'écran Réglages), 21 (échéance par défaut, libellé de tous les articles).
Vérifie la version et l'API réelles de `swissqrbill` dans node_modules, et la règle d'adresse structurée de la norme SIX à la source
(WebSearch si besoin) ; écris-les dans le plan.

RESULTAT.md tenu au fil dans `voies/f1/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/f1/tests.txt 2>&1`, puis lire la ligne `Test Files … | Tests …` (étape 2, après la revue ; à l'étape 1, rejouer sur HEAD les tests des appelants de la même façon).
