# Voie h4 — brancher Hydrogen : mode Approfondi (moyen) et diagnostic de brassin (bas), prêts à déployer (mission 2026-11-14-gemini4)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : brasseur, 14.11 : « Oui branche où ça vaut le coup »
- Mesures : `../t2c/RESULTAT.md` § 4 (Approfondi : Hydrogen@medium, −53 % de coût, p90 71 → 23 s) et `../t2b/RESULTAT.md` § 3 (diagnoseBatch :
  Hydrogen@low 100 % contre 94 %), avec leurs diffs proposés. Méthode de déploiement : `../h2/RESULTAT.md` et `../h3/RESULTAT.md` (partir de ce qui est EN LIGNE).
- Jamais `functions/.env` ni `functions/.secret.local`. Aucun déploiement, aucun appel Gemini réel, aucun push, ni stash.

## Objectif
1. Branche courante : (a) compagnon, mode Approfondi (`deep`), rôle analyse → `gemini-4-hydrogen` MEDIUM (décision et suites), repli une fois sur
   3.8 comme aujourd'hui ; relecture et recherche inchangées. (b) `diagnoseBatch` en Rapide → Hydrogen LOW d'abord, repli Flash-Lite `low` puis
   3.8 (ou le repli le plus simple défendable, dis lequel) ; Max inchangé. Tests L13 (rouges sur HEAD, verts après). Commit par chemins.
2. `deploy/h4-aitask` depuis le tag `aitask/2026-11-14-hydrogen` (+ (b)) et `deploy/h4-compagnon` depuis `compagnon/2026-11-14-hydrogen` (+ (a)), chacun
   dans un dossier neuf `<os.tmpdir()>/deploy-h4-aitask` et `deploy-h4-compagnon` ; tsc functions, tests ciblés sans rouge nouveau contre le socle nu,
   `npm --prefix functions run build` ; `source4-portable-bundle-manifest-01.json` remis, jamais commité.

## Contrôles
- Tests : `npx vitest run tests/unit/brewerHarness.test.ts tests/unit/brewerFlashLimits.test.ts tests/unit/models* tests/unit/ai* --reporter=dot > work/missions/2026-11-14-gemini4/voies/h4/tests.txt` (fichiers absents : retire-les et dis-le ; plus la suite complète contre chaque socle nu).
- `npx tsc --noEmit -p .` et `-p functions`.

## Possède
`functions/src/models.ts`, `functions/src/brewerHarness.ts`, `functions/src/ai.ts` (route du diagnostic seulement), leurs tests, les deux dossiers et branches `deploy/h4-*`,
`work/missions/2026-11-14-gemini4/voies/h4/**`. Commits terminés par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Rendre
`RESULTAT.md` tenu au fil (à 150 k : « REPRISE : <fichier> ») : SHA, les deux commandes `firebase deploy --only functions:<nom>` exactes, tests. Une ligne.
