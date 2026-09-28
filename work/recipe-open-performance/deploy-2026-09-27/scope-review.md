# Revue de périmètre avant publication — 2026-09-27

**Avis :** le candidat `codex/recipe-open-performance` porte le PoC publié et les correctifs de performance attendus, sans le travail local non commis de refonte Levure. Pour cette candidate, publier seulement Hosting suffit au périmètre applicatif. Ne pas lancer `npm run deploy` depuis `codex/levure-refonte`.

## Références vérifiées

- Worktree candidat : `codex/recipe-open-performance`, HEAD `95fb74cd133962fbc4129408519b108f9f149af0`. `b09af85` est ancêtre de HEAD. La suite depuis la publication comprend `5a49cc5` (passation), `4575a94`, `d7e015e` (outils), puis `e04b856`, `c289115`, `95fb74c` (source/perf et preuves).
- Aucun changement suivi dans le candidat ; les éléments non suivis visibles sont les artefacts de `work/recipe-open-performance/`. Aucun fichier applicatif de la refonte Levure n’y est présent.
- Checkout de comparaison : `codex/levure-refonte`, HEAD `5a49cc51ba4d37ef4300e6404c0c989d22d10425`, avec un large diff local non commis.
- Les deux références de publication consultées sont `docs/validation/ux-mobile-poc-release-2026-09-25.md` et `work/ux-mobile-poc-2026-09-25/review/deploy-final-2026-09-27/release-result.md`. Elles désignent `b09af85` publié le 27 septembre, sur `brasserie-l-affinee` / `https://brasserie-l-affinee.web.app`.

## Classement du diff local Levure

Je n’ai trouvé aucun changement applicatif hors Levure à ajouter au candidat. Les changements voisins portent sur les mêmes capacités de refonte : produit/offres et provenance, correction documentaire, confirmation de la quantité ensemencée, starter et consommation/regularisation du stock.

Preuves représentatives : `firestore.rules.template` ajoute `yeastProducts`; `functions/src/index.ts`, `dataSchema.ts`, `yeastDocumentarySheet.ts` et les nouveaux `yeastSupplySchema.ts` / `yeastDbCorrections.ts` ajoutent le stockage et les corrections Levure; `brewSessionCore.ts`, `src/domain/brewDay.ts`, `src/domain/finance/brewStockConsumption.ts`, `src/pages/BrewDayPage.tsx` et `src/ui/BatchDetailSheet.tsx` gèrent l’ensemencement, les quantités et le starter. Les ajouts aux fichiers partagés `src/domain/recipeImport.ts`, `recipeTransfer.ts`, `storage.ts`, `BrewIngredients.tsx` et `RecipeAutoComplete.tsx` sont également ciblés sur ces données Levure.

`tests/qa/hop-recipe/repo.ts` reçoit localement `adjustNumber` pour les essais de stock ; le candidat contient déjà, dans le même fichier, ses modifications distinctes de cache/immutabilité pour les mesures de performance. Ne pas recopier le fichier depuis le checkout Levure. `scripts/claude-frontend.mjs` ajoute `--resume` au lanceur Claude : c’est un changement d’outil, pas de l’application publiée. Les changements aux rôles, consignes et documents restent hors Hosting.

Le candidat modifie aussi quelques éléments Levure existants dans le cadre explicite de la série performance, dont `src/domain/yeastReferences.ts`, `src/ui/YeastRecipeHeading.tsx` et `src/ui/YeastRecipeWorkbench.tsx`. Ce sont les changements commis de lecture/chargement de recette, pas le diff local de refonte. Cette distinction suit le mandat « sans la refonte Levure », en conservant les correctifs de performance demandés.

## Hosting, Functions et règles

Comparaison Git `b09af85..HEAD` : aucun diff dans `functions/`, `firestore.rules.template`, `firestore.indexes.json`, `firebase.json`, `package.json` ou `package-lock.json`. Les objets des fichiers versionnés concordent (par ex. `firebase.json` `6973b79`, modèle de règles `855c191`, index `0d50502`, `package.json` `af81fad`, lock `1ccd039`). Les fichiers ignorés locaux `.firebaserc` et `firestore.rules` existent dans les deux worktrees et leurs octets concordent ; le registre de publication rapporte que la génération des règles avait retrouvé l’empreinte préexistante.

À l’inverse, le checkout Levure a bien un diff de modèle de règles (`yeastProducts`) et des changements Functions pour ce parcours. Le script package `npm run deploy` reconstruit les règles puis déploie Firestore, Functions **et** Hosting : il élargirait le périmètre s’il était lancé depuis ce checkout. `firebase.json` publie `dist` sur Hosting. Depuis la candidate, un build de cette branche suivi d’un déploiement `--only hosting` suffit pour livrer son changement de site ; aucune mise à jour de Functions/règles n’est requise par son diff Git.

## Limites de vérification

Audit Git et métadonnées locales uniquement. Aucun test, build, benchmark, appel distant, lecture de données métier ni déploiement n’a été fait. La comparaison ne prouve pas l’état distant actuel de Hosting, des règles ou des Functions ; les références de publication citées donnent le dernier état consigné.
