# Levure — carte de code pour la prochaine session

Cartographie en lecture seule par Luna le 24 septembre 2026, sur
`codex/yeast-refactor-preparation`. Aucun test ni parcours navigateur exécuté
pour cette carte. Recontrôler les chemins et contrats sur `main` avant de coder ;
ce document évite une exploration générale en début de mission.

## Parcours et données

| Besoin | Points d'entrée actuels | Limite à traiter |
| --- | --- | --- |
| Étape Levure | `src/pages/BrewWizard.tsx`, `src/ui/YeastRecipeChoice.tsx`, `YeastIngredientPicker.tsx` | Choix, quantité, dossier et conduite sont séparés ; réexaminer chaque place et contrôle. |
| Alternatives | `src/ui/YeastCandidatePicker.tsx`, `YeastChoiceComparison.tsx`, `YeastRecipePlan.tsx` | Le comparateur de souches choisit une identité sans scénario chiffré préalable sur la même recette. Le plan de réglages, lui, montre un avant/essai et refuse un essai périmé. |
| Catalogue | `src/ui/YeastCataloguePanel.tsx`, `src/domain/yeastReferences.ts` | Grande bibliothèque de référence chargée à la demande, utilisable hors ligne ; tri alphabétique, pas de rang de distribution par pays. |
| Autres vues | `src/pages/RecipePage.tsx`, `BrewDayPage.tsx`, `src/ui/FermentationWorkshop.tsx`, `NoloFermentationWorkshop.tsx` | Garder les usages recette, jour de brassage et NOLO cohérents. |

`HopYeast` et ses observations sourcées sont définis par
`functions/src/hopPredictionSchema.ts` et `yeastCatalogueSchema.ts`. Une fiche
`listed` n'établit ni stock marchand ni distribution locale. Le stock personnel
est `StockItem` ; la levure de recette est `YeastSpec` (`src/types/index.ts`).
`RecipeSnapshot` et `src/domain/recipeSnapshot.ts` figent la recette au lancement
du brassin. Le cache Dexie/Firestore passe par `src/services/firestoreRepo.ts`.
Le catalogue embarqué n'est pas automatiquement copié en DB personnelle.

## Gemini : capacités réelles et extension attendue

- `functions/src/ai.ts`, `prompts.ts`, `yeastLookupResult.ts` : recherche web
  structurée et sources des faits techniques ; la validation du transport ne
  vérifie pas à elle seule chaque valeur contre la source.
- `src/domain/brewerTools.ts` : recherche locale d'une référence et conseil de
  fermentation. `functions/src/brewerResearch.ts` : recherche de références et
  fournisseurs, surtout suisses actuellement. Ne pas assimiler offre trouvée,
  stock personnel et disponibilité vérifiée.
- `src/ui/RecipeAutoComplete.tsx` : conflit « garder/reprendre » sur brouillon
  et rejet des réponses tardives. `src/services/storage.ts` :
  `learnIngredient` complète les champs scalaires absents, mais ne corrige pas
  actuellement une valeur scalaire contradictoire existante.
- `functions/src/brewerProposals.ts`, `brewerChat.ts`, `companionTypes.ts` :
  `propose_changes` produit `before`, nouvelle valeur et motif ; l'application
  confirme et audite certains champs recette/brassin, pas les champs du stock
  ou du catalogue. Une proposition au brouillon n'est pas déjà sauvegardée.
- `scripts/yeast-catalogue/import-plan.mjs` offre un précédent de comparaison
  de révision `updateTime` et de préservation des corrections manuelles ; ce
  n'est pas une capacité Gemini existante. Élargir les outils et transactions
  avec identité stable, valeur avant/après, source, portée, révision et reçu de
  sauvegarde. En cas de conflit, relire la valeur actuelle ; hors ligne,
  distinguer attente de synchronisation et confirmation serveur.

## Vérifications ciblées pour l'implémentation future

`package.json` expose `test:smoke:yeast`, `test:science:yeast` et
`test:ai:persistence`. Les tests proches des parcours et données sont
`tests/integration/YeastRecipeChoice.test.tsx`, `YeastCandidatePicker.test.tsx`,
`YeastCataloguePanel.test.tsx`, `yeastEnrichmentUi.test.tsx`, ainsi que
`tests/unit/yeastDataPersistence.test.ts`, `yeastLookupResult.test.ts`,
`yeastCatalogue.test.ts`, `brewerResearch.test.ts`, `brewerProposals.test.ts`
et `brewerApplyTransaction.test.ts`. Vérifier aussi les sauvegardes et corrections
dans un vrai parcours navigateur avec fixtures.

La carte ne couvre pas l'ensemencement/starter ; le rapport ciblé se trouve
dans [la recherche dédiée](yeast-pitch-rate-2026-09-24.md).
