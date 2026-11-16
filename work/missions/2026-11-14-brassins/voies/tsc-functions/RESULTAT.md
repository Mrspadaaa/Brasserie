OK — Types partagés sortis des magasins serveur : le front n'atteint plus firebase-admin, tsc racine à 0 erreur, build complet vert.

## Fichiers écrits
- Nouveaux : `functions/src/brewerCatalogueTypes.ts` (BrewerCatalogueReceipt, BrewerCatalogueLookupRecord, BrewerCatalogueWriteResult), `functions/src/brewerScenarioTypes.ts` (BrewerScenarioCommand, BrewerScenarioReceipt), `tests/unit/front-sans-firebase-admin.test.ts`.
- Modifiés : `functions/src/brewerCatalogueStore.ts` et `brewerScenarioStore.ts` (importent et ré-exportent `export type { … } from './…Types.js'` ; code inchangé) ; les 7 fichiers de `src/` (brewingCatalogue, brewingScenarios, hopV55/contracts, fixtureRuntime, serverScenario, ui/hopV55/Catalogue, Page) importent depuis les modules `…Types`.
- Les dépendances des types (BrewerCatalogueKind, Entity, IdentityCandidate) viennent de `brewerCatalogueSchema`, qui n'importe pas firebase-admin.

## Sortie d'échec d'avant (test écrit d'abord)
```
FAIL tests/unit/front-sans-firebase-admin.test.ts > aucun module de functions/ atteint depuis src/ n'importe firebase-admin
AssertionError: expected [ …(2) ] to deeply equal []
+ "src/App.tsx -> src/ui/BrewerActivity.tsx -> src/services/brewerJobs.ts -> src/services/hopV55/semanticAdoptionApplicationHost.ts -> src/services/hopV55/contracts.ts -> functions/src/brewerCatalogueStore.ts importe firebase-admin/firestore"
+ "src/App.tsx -> src/pages/BrewWizard.tsx -> src/ui/hopV55/RecipeStep.tsx -> src/services/hopV55/serverScenario.ts -> functions/src/brewerScenarioStore.ts importe firebase-admin/firestore"
```
`npx tsc --noEmit` : `brewerCatalogueStore.ts(2,75)` et `brewerScenarioStore.ts(2,45)` TS2307.

## Preuves (après)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 0.
- `npx vitest run front-sans-firebase-admin brewerCatalogueStore hopV55Catalogue coutBrassinRenvois --reporter=dot` → 4 fichiers, 35 tests passés.
- `npm run build` (`tsc && vite build && check-private-research && check-build-flags`) → sortie 0, « built in 39.99s ».
- `node scripts/check-build-flags.mjs dist` → 3 `DRAPEAUX OK` (Houblons allumés, enrichissement des fiches, note du Carnet).
- `npx tsc --noEmit -p functions` : non vérifiable ici. `functions/node_modules` est absent du worktree (installation interdite) : 78 TS2307 (modules introuvables) et des TS7006 en cascade (paramètres devenus `any` faute de types firebase). Aucune de ces erreurs ne vient des nouveaux modules `…Types` ; à rejouer là où functions est installé.

## Essais, doutes
- 1 essai par critère. Le test suit les imports relatifs par regex (import/export … from, import(), import nu), pas par l'API TypeScript : un import construit dynamiquement lui échapperait. Il exige aussi que le front atteigne encore `functions/` (sinon le test ne garde rien).
- Aucun déploiement ; `functions/.env`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json` non touchés.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
