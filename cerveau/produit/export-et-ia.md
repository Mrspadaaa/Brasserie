---
name: export-et-ia
description: L'Affinée — persistance des fiches IA sur le stock, export texte de recette (avec l'eau), relecture IA consultative.
type: produit
maj: 2026-10-22
sources: mémoire locale affinee-export-et-ia.md ; src/domain/recipeText.ts ; scripts/check-units.mjs ; functions/src/prompts.ts ; src/ui/RecipeReview.tsx
---

Trois ajouts du 05.09.2026, demandés ensemble.

**Les fiches retrouvées par l'IA sont RETENUES.** « Je veux aussi que quand l'IA va chercher une info elle soit sauvegardée et réutilisable. L'EBC d'un malt ne changera jamais. » Constantes du produit, écrites seulement dans la recette en cours : chaque brassin repartait d'une fiche vide et repayait le même appel.
- Porteur correct : l'ARTICLE DE STOCK, pas la recette. Canal `onLearnIngredient(name, facts)` sur `BrewWizard`, câblé à `learnIngredient` dans `App.tsx` → `updateStockItem`. Couvre malt (colorEbc, potentialPpg), houblon (alphaPct), levure (lab, souche, forme, atténuation, plage de température).
- **On n'écrase JAMAIS une valeur déjà présente.** Ce que Gaëtan a saisi à la main, ou lu sur le sac acheté, prime sur ce qu'un modèle a trouvé en ligne : son lot peut différer de la fiche générique. On ne comble que les trous.
- Le prop est REQUIS, pas optionnel, pour ne pas re-perdre la persistance en silence en branchant l'assistant ailleurs.

**Export texte** (`src/domain/recipeText.ts`, `recipeToText()`) : bouton en bas de la fiche de brassage, copie au presse-papier (convention déjà tenue par les stocks et les commandes).
- **La section EAU y est** : sels, acide, coupe à l'osmosée, ions du moût. Une même facture de grain sur deux eaux donne deux bières.
- L'export part de `BrewWizard` et non de `BrewSheet` : OG, FG, IBU, EBC, rendement vivent dans l'assistant ; les recalculer dans la fiche les ferait diverger de l'écran.
- `scripts/check-units.mjs` a refusé la première version (`${g} g` en dur). Toute quantité passe par `Units.format`, y compris dans un rendu texte.

**Relecture IA, tâche `reviewRecipe`** (`functions/src/prompts.ts` + `src/ui/RecipeReview.tsx`).
- Elle reçoit L'EXPORT TEXTE, pas un JSON reconstruit : le modèle lit ce que Gaëtan lit, donc chaque remarque se vérifie ligne à ligne. L'export gagne une section, l'analyse la voit sans recâblage.
- **Elle ne modifie RIEN** : avis consultatif, dit explicitement à l'écran.
- Trois garde-fous contre des dérives connues : interdiction de complimenter à vide ; chaque remarque cite un CHIFFRE de la recette ; une donnée manquante se signale comme manque au lieu d'être supposée. Résultat trié par gravité (bloquant / goût / détail), avec la liste de ce qui n'a pas pu être jugé.

Voir [[design-system-historique]] et [[chimie-eau]].
