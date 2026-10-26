# Voie r177-tests-rouges — les 14 tests déjà rouges de la suite (#177)

Agent : auteur (Sonnet), pour diagnostiquer et corriger. Lis l'issue : `gh issue view 177 --repo Mrspadaaa/Brasserie`.

## Le constat (pilote, 25.10)
Sur un arbre détaché, sans aucun changement de voie, cette commande donne 183 sur 197, avec 14 échecs :
`npx vitest run hopV55Page hopV55PropertyAdviceDecision monkey YeastRecipeChoice hopV55QualifiedAdviceController hopV55QualifiedStudyController --maxWorkers=2`

Les fichiers en cause : `YeastRecipeChoice`, `hopV55PageAssistedAdvice`, `hopV55PageExplorationTrial`,
`hopV55PageQualifiedAdviceFullCatalogue`, `hopV55PageQualifiedAdviceSemanticV4`, `hopV55PageQualifiedAdviceStudy`,
`hopV55PageQualifiedProductStudy`, `hopV55PropertyAdviceDecision`, `hopV55QualifiedAdviceController` et `monkey` (graines 11 et 99).
Un ou deux sont instables.

## À faire
1. Rejoue d'abord la commande sur HEAD et note le compte exact. Il a pu changer depuis le 25.10.
2. Classe chaque échec, preuve à l'appui :
   - un défaut réel du code ;
   - un délai trop court sous charge (le test passe seul, échoue en suite) ;
   - un test périmé, qui attend un texte ou un comportement qu'une décision récente a changé. Cite la décision ou le commit.
3. Corrige :
   - un défaut réel : dans le code, avec le test qui le garde ;
   - un délai : rends le test déterministe (attente d'un état, horloge simulée) plutôt que d'allonger le délai ;
   - un test périmé : mets-le à jour sur le comportement voulu, et dis lequel.

   **N'efface ni ne saute aucun test** (`skip`, `todo`, suppression) : ça demande l'accord de l'utilisateur. Si un test te
   semble à retirer, écris-le en DÉCISION À PRENDRE, avec la raison.
4. Monkey (graines 11 et 99) : trouve l'action qui casse et sa cause. Une vraie panne de l'app se corrige dans l'app.

## Critères
- La commande ci-dessus : 0 échec, deux fois de suite.
- `npm test -- --maxWorkers=2` en entier : vert, deux fois de suite. Note la durée et le compte. Si un test hors de cette liste
  échoue, dis s'il échoue aussi sur HEAD.
- Le contrôle de T3, `node work/missions/2026-10-25-integration-houblons/voies/t3-pile/verifier.mjs`, rend `PILE OK`, s'il existe.
- `npm run build` vert. Gemini n'est jamais appelé dans un test : simulé partout.

## Possède
- Les dix fichiers de test cités, et les sources qu'un défaut réel oblige à corriger : `src/services/hopV55/`, l'atelier V5.5, et le
  choix de levure de la recette. Dis lesquels dans RESULTAT.md.
- `work/missions/2026-10-25-integration-houblons/voies/r177-tests-rouges/`.

Une autre voie (d2-import-bm) possède en ce moment :
- `src/domain/hopIndex/v4/data.ts`, `src/ui/hopIndex/fiche/`, `src/ui/hopIndex/comparer/valeurs.ts` ;
- `src/data/hopV4/proto-data.json`, `src/data/hopBeerMaverickBootstrap.json` ;
- `tests/unit/hopIndexV4/`, et les scripts de collecte.

N'y touche pas. Si un échec en vient, écris-le. Pas de `git mv`. Fichiers de travail dans `os.tmpdir()`. Sous la charge d'autres voies,
un test instable peut échouer : rejoue-le seul avant de conclure.

Retour en une ligne ; RESULTAT.md avec le classement de chaque échec, ses preuves et ce qui reste.
