# Voie v-pm1-suite — finir pm1 (reprise de v-pm1)

- Agent : auteur · Modèle : sonnet · Plafond : 50 tours · Décideur : pilote
- Racine : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`. Lire d'abord `voies/v-pm1/RESULTAT.md` (état, « Reste à faire » 1 à 6) et `voies/v-pm1/VOIE.md` (consignes et exigences transversales : elles valent ici, mot pour mot).

## Décisions du pilote
- Frise « Relevés » : alignée sur 15′ (une seule heure du pH dans l'app) ; `src/domain/brewMeasures.ts` (ou le fichier qui porte `phDes`) t'est donné pour cette constante seule, réutilisant `PH_APRES_MIN`. Rejouer ses tests.
- Règle validée : température confirmée par « Relever » ; pH écrit seulement si le curseur a été touché ; « Relever » inactif s'il n'y a rien à écrire. États ajoutés (replié warn après « Plus tard », ligne verte « ✓ Relevé … ») : gardés.

## Possède
- `src/domain/appelMesure.ts`, `src/ui/brassage/AppelMesure.tsx`, `src/pages/BrewDayPage.tsx` (zone du palier), `src/ui/BrewThermalControl.tsx`, le fichier de `phDes` (constante seule), `tests/unit/appelMesure.test.ts`, `tests/unit/appelMesureVue.test.tsx`, les tests de `phDes` si l'heure y est figée
- `work/missions/2026-11-20-port-simplicite/voies/v-pm1/`

## À faire
« Reste à faire » 1 à 6 de v-pm1/RESULTAT.md, plus la décision frise. Interdits : StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx, tout hors Possède ; aucun commit, stash, checkout ; pas de npm run build.

## Rendre
- `RESULTAT.md` tenu au fil (ici `voies/v-pm1/RESULTAT.md`), mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- Ligne « Tests » écrite dans un fichier : `npx vitest run tests/unit/appelMesure.test.ts tests/unit/appelMesureVue.test.tsx <tests de phDes et de BrewDayPage/BrewThermalControl> --reporter=dot > work/missions/2026-11-20-port-simplicite/voies/v-pm1/tests.txt`
- Captures 390 tactile et 1280, clair et cave, OUVERTES, écarts écrits à côté de `maquette/captures/pm1-*.png`. Réponse finale : une ligne.
