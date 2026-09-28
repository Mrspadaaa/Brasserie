# Rejouer les contrôles locaux

Exécuter depuis ce worktree et avec les dépendances installées du lockfile. Chrome local disponible, Node24.19.0 dans cette mission. Les scripts QA remplacent Firestore/auth/Functions, et bloquent les requêtes externes. Ne jamais les pointer vers l'origine de production.

## Tests et build

```powershell
npm test -- tests/unit/guideVarietiesCache.test.ts tests/unit/recipeDiagnostic.test.ts tests/unit/recipePageLoader.test.ts tests/unit/hopRecipeGuide.test.ts tests/unit/yeastRecipeReferences.test.ts tests/unit/yeastCatalogueLibrary.test.ts tests/integration/pageShellPerformance.test.tsx tests/integration/recipeDisclosureLoading.test.tsx tests/integration/recipeAccessibility.test.tsx tests/integration/HopRecipePanel.test.tsx tests/integration/hopCatalogueLoading.test.tsx tests/integration/hopKnowledgeSnapshot.test.ts tests/integration/hopIndexStorage.test.ts
npm run build
```

Le seed privé ignoré n'est pas requis pour publier les données : Vite build utilise l'exemple public. Dans ce worktree seul, une copie ignorée de seedData.example.ts a permis tsc ; ne copier aucune donnée réelle pour ce contrôle. Les fixtures ne déclenchent pas Gemini.

## Parcours complet et hors ligne

```powershell
$env:HOP_QA_BUILD_DIR = Join-Path $env:TEMP 'laffinee-hop-qa-recipe-open-verified'
node scripts/build-recipe-open-qa.mjs
$env:RECIPE_FUNCTIONAL_OUTPUT = 'work/recipe-open-performance/replay-functional'
node scripts/check-recipe-open-functional.mjs
```

Pour la bibliothèque non préparée, employer une nouvelle fenêtre PowerShell, afin de ne pas conserver les options de la série précédente :

```powershell
$env:RECIPE_OPEN_COLD_REFERENCES = '1'
$env:HOP_QA_BUILD_DIR = Join-Path $env:TEMP 'laffinee-hop-qa-recipe-open-cold-replay'
node scripts/build-recipe-open-qa.mjs
$env:RECIPE_READING_OUTPUT = 'work/recipe-open-performance/replay-reading'
node scripts/check-recipe-reading-contracts.mjs
```

Ce dernier contrôle coupe le réseau après fiche prête, ouvre les rapports non visités, vérifie notification/recette modifiée et A→Ctrl+K→B, puis NOLO. Le polling d'activité compagnon reste mocké ; aucune requête externe autorisée.

## Sonde directe de performance

Dans la fenêtre de bibliothèque froide ci-dessus :

```powershell
$env:RECIPE_OPEN_SAMPLES = '3'
$env:RECIPE_OPEN_DIRECT = '1'
$env:RECIPE_OPEN_DIRECT_SEED = '1'
$env:RECIPE_OPEN_DETAILS = '1'
$env:RECIPE_OPEN_CPU = '6'
$env:RECIPE_OPEN_WIDTH = '390'
$env:RECIPE_OPEN_OUTPUT = 'work/recipe-open-performance/replay-cold-after'
node scripts/check-recipe-open-performance.mjs
```

L'avant charge uniquement les modules applicatifs exacts de la base via plugin, sans réécrire les sources ou l'index. En conservant les mêmes options, employer un autre build dédié et `RECIPE_OPEN_BASELINE=1`, puis un autre dossier d'output. L'option ne change que le build QA ; ne l'utiliser dans aucune commande de déploiement.

La série20 historique e04 emploie la QA standard avec connaissances installées et Storage.addRecipe. Les dernières sources incluent un complément documentaire ; ne réétiqueter aucune ancienne série comme résultat exact du HEAD actuel. La sonde froide et la série20 ont des préconditions distinctes.

## Contrôles négatifs

```powershell
node node_modules/vitest/vitest.mjs run --config work/recipe-open-performance/vitest-baseline.config.ts tests/integration/pageShellPerformance.test.tsx tests/integration/hopKnowledgeSnapshot.test.ts tests/unit/hopRecipeGuide.test.ts tests/unit/yeastRecipeReferences.test.ts -t 'style reads bounded|shares unchanged knowledge|reuses normalized catalogue|restores the catalogue trigger|desktop inline presentation|command overlay directly replaces|exact immutable library rows'
```

Attendu sur base : **sept échecs**, aucune erreur de collecte. Les mêmes contrôles sont verts sur le correctif. Les gros profils/échantillons/logs restent dans ce worktree ; les résumés et chemins sont dans ARTIFACTS.json et REPORT.md. La vraie trace Android est dans Downloads, hors Git, et ne doit pas être remplacée par ces fixtures.
