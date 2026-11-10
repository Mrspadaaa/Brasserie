# Étape « Levure 4/7 » : inventaire de l'état actuel

Voie i1, mission 2026-11-09-ecran-levure. Lecture de `src/pages/BrewWizard.tsx` et des `src/ui/Yeast*.tsx` à la copie servie `deploy-bc70` (commit 48d16402, identique à HEAD de ce dépôt). Aucun changement de code. Les lignes sont celles de 48d16402 ; doute marqué « ? ».

## L'écran en un coup d'œil

- Accès : fil d'étapes (aria-label « Levure »). Id `levure` : `StepId` l. 456, `STEPS` l. 466 (« Levure », 4e étape). Le fil est rendu à `WizardStepRail` l. 2233 et l. 2305 (deux appels ; lequel est mobile, non vérifié).
- Ouverture directe : `?dev-local&etape=houblons` ouvre l'étape Houblons (`App.tsx` l. 463-470) ; l'étape Levure se tape dans le fil.
- Racine : `src/pages/BrewWizard.tsx`, bloc `step === 'levure'` l. 2942 à 2980 (`Section` « Levure »). Il rend `YeastRecipeChoice` (l. 2946) et lui passe ses éditeurs.
- Fichiers propres : `src/ui/YeastRecipeChoice.tsx` (765 lignes, composant l. 269, racine `.yc-journey` l. 631), `src/ui/YeastCandidatePicker.tsx` (175), `src/ui/YeastIngredientPicker.tsx` (149), `src/ui/YeastRecipeDossier.tsx` (632 ; `YeastRecipeQuantity` l. 507), `src/ui/YeastChoiceComparison.tsx` (873), `src/ui/YeastRecipePlan.tsx` (847), `src/ui/YeastRecipeWorkbench.tsx` (358), `src/ui/YeastPitchingPanel.tsx`, `src/ui/YeastStarterEntry.tsx`, `src/ui/yeast-choice.css`, `yeast-pitching.css`, `yeast-recipe.css`.

## Blocs, du haut vers le bas (capture 390, levure choisie)

| # | bloc | composant | fichier : ligne |
|---:|---|---|---|
| 1 | En-tête « ‹ Levure 4/7 » | mobileHeader | `src/pages/BrewWizard.tsx:2200` |
| 2 | Fil : Identité · Malts/sucres · Houblons · Levure (souligné) · Paliers · Eau · Récap. | WizardStepRail | `BrewWizard.tsx:2233`, `:2305` |
| 3 | Bandeau « Grain · OG · IBU · EBC » (ici Grain 0 kg, OG 1,066, IBU 60, EBC —) | `.recipe-metrics` | `BrewWizard.tsx` (bandeau commun) |
| 4 | Carte « Levure » : « Brouillon non enregistré », ligne « Paliers » et « Voir la conduite » | `YeastRecipeChoice` | `YeastRecipeChoice.tsx:643` (station) ; `:650` (barre de changement) |
| 5 | Station 1 « Levure » : carte d'identité (SafAle US-05, source « Catalogue ») | `.yc-identity-card` | `YeastRecipeChoice.tsx:645-646` |
| 6 | Champ « Changer : nom, code, fabricant, arôme… » et « Parcourir le catalogue » | YeastCandidatePicker | `YeastCandidatePicker.tsx:101`, `:103` |
| 7 | « Mon stock ou saisie libre » (replié) | YeastIngredientPicker | `YeastIngredientPicker.tsx:121-124` (stock), `:147` (saisie libre) |
| 8 | « Produit exact et achat » (facultatif), offres par vendeur, « Choisir », « Corriger la fiche produit » | YeastPitchingPanel part `supply` | `YeastRecipeChoice.tsx:701` (`YeastPitchingPanel part="supply"`) |
| 9 | Fiche « Compléter ou corriger la fiche » (repliée, ouvrable) | `details.yc-sheet-fold` | `YeastRecipeChoice.tsx:703-704` (`aria-label` « Fiche de … ») |
| 10 | Station « Ensemencement et préparation » | `section.yc-pitch-station` | `YeastRecipeChoice.tsx:725` |
| 11 | Station « Objectifs » (Profil, Cible) | `section.yc-goal-station` | `YeastRecipeChoice.tsx:737` |
| 12 | « Repères pratiques, sources et programme détaillé » (replié) | `details.yc-dossier` | `YeastRecipeChoice.tsx:752` |
| 13 | Retour · Suivant — Paliers (pied commun) | PageShell | `BrewWizard.tsx` (pied, `go`) |

Ordre de rendu : `YeastRecipeChoice` reçoit `quantityEditor`, `identityEditor`, `factsEditor`, `aiEditor`, `trialFactsEditor`, `programEditor` (`BrewWizard.tsx` l. 2946-2978). La quantité (`quantitySlot`) est à `YeastRecipeChoice.tsx:617`.

## Fonctions

- **Choisir une levure** : (a) taper dans le champ de recherche (`YeastCandidatePicker.tsx:101`) ; (b) « Parcourir le catalogue » (l. 103) ; (c) stock : « Levures disponibles dans mon stock » (`YeastIngredientPicker.tsx:121-124`) ; (d) saisie libre : « Saisir une levure hors catalogue » (l. 147, champ « Nom de la levure personnelle »). Au choix : `onStock` l. 2950, `onCreate` l. 2956, `onReference` l. 2960 (`applyCatalogueYeast`, importé l. 119 de `src/domain/yeastCatalogue.ts`).
- **Changer une levure choisie** : le champ devient « Changer : … » ; `YeastCandidatePicker` replie la liste (`collapsed`, `YeastRecipeChoice.tsx:675-680`). « Fermer la recherche » (`YeastCandidatePicker.tsx:132`) ; « Afficher sa ligne » (note « Levure du brouillon … référence de comparaison »).
- **Comparer** : radio « Comparer <nom> » dans les résultats (`YeastCandidatePicker.tsx:164`) ; `YeastChoiceResults` (`YeastChoiceComparison.tsx`). Le lien « Comparer avec <levure> » n'apparaît qu'en essai de conduite (`YeastRecipeChoice.tsx:672`, classe `yc-compare-trial`, statut `yc-trial-status` l. 670). Non capturé : la liste de comparaison n'apparaît qu'après une recherche (doute).
- **Dose** : `YeastRecipeQuantity` (`YeastRecipeDossier.tsx:507`), zone `role=group` « Quantité prévue de levure » (`YeastRecipeChoice.tsx:617`), champ `wz-yeast-qty` (`BrewWizard.tsx` l. 2949). Unités et sachet/starter : `YeastSupplyEntry.tsx`, `YeastStarterEntry.tsx` (non relus en détail ; doute).
- **Température, atténuation, floculation, alcool** : fiche (l. 703-704) : « Corriger Température de fermentation », « Corriger Atténuation annoncée », « Corriger Tolérance à l'alcool », « Corriger Floculation » (captures : 18–26 °C ; 78–82 % ; 9–11 % vol ; floculation « Non renseignée »).
- **Recherche IA** : bouton « Rechercher la fiche avec l'IA » dans la fiche, composant `YeastSheetAssistant` (`src/ui/RecipeAutoComplete.tsx:519`). Non cliqué dans cette voie (pas d'appel IA). Gemini : doute, le chemin réel reste à vérifier.
- **Bandeau commun** : OG 1,066 et IBU 60 viennent de la recette ; EBC « — ». Aucune ligne ABV/FG dans le bandeau. La densité finale et l'atténuation sont dans la station Objectifs et la fiche (doute sur le calcul exact, non lu).
- **Biotransformation (lien houblons)** : non vérifié dans cette voie (doute).

## États

- **Levure choisie** (`data-yeast-state="chosen"`, capture `levure-choisie-390`) : SafAle US-05, « Catalogue », 2 points à vérifier.
- **Geste « choisir » ouvert** (`levure-geste-choisir-390`) : liste repliée remplacée par « Parcourir les 1 734 références », « Fermer la recherche » ; la liste de résultats n'est pas visible sans recherche.
- **Fiche ouverte** (`levure-detail-390`) : la fiche est sous le pli ; capture faite après défilement. Le dossier « Repères pratiques » n'est pas capturé.
- **Recette sans levure** (`data-yeast-state="empty"`, `levure-vide-390`) : titre « Levure · choisir », « Recette pas encore enregistrée », « Chercher un lot ou une référence », « Saisir une levure hors catalogue », bloc 2 « Conduite », « 1 point à vérifier ». Pas de bandeau (recette vide).
- **Levure inconnue du catalogue, levure en stock ou non, hors ligne, erreur** : non capturés. `choiceError` (`YeastRecipeChoice.tsx:315`, `:662`) affiche un message `role=alert` ; non déclenché. Le stock levure est vide dans le banc, donc « en stock » non observé (doute).
- **Essai de conduite** (`yc-trial-status`, l. 670) : non capturé.

## Données lues et écrites

- Lues : `yeast` (état l. 755-757) ; `recipe.yeast` ; `stockItems` (props) ; catalogue et fiches : `src/data/yeastCatalogueBootstrap.json`, `yeastCatalogueLibrary.json`, `yeastSupplyBootstrap.json` (offres), `yeastEnrichmentBelgian.json`, `yeastEnrichmentLager.json` (fiches) ; `useYeastSupply` (`src/hooks/useYeastSupply.ts`) ; `details.nolo` (mode NOLO remplace l'étape par `NoloPanel` selon l. 2944).
- Écrites (état de la recette, brouillon) : `selectYeast` l. 1631 ; `applyFermentationRecipe` l. 1787 ; `updateSelectedYeastDocumentation` l. 1974 (refus : messages l. 1977-1980 et 2032-2033) ; `applyYeastChoice` l. 2071 ; `setYeastChange` (annulation, `startYeastChoiceChange`) ; `setYeastSelection` l. 698. Rien n'est écrit sur Firestore en `?dev-local` (`firestoreRepo.ts` l. 338, 615).
- Repères levure affichés hors de cette étape : `YeastRecipeContext` (l. 2934-2935) dans le bloc de l'étape Houblons (doute sur le bloc exact).

## Tests qui couvrent l'étape

- `tests/integration/YeastRecipeChoice.test.tsx` (1515 lignes, 66 `it(`) : le composant de choix.
- `tests/integration/YeastSupplyComparison.test.tsx` : comparaison des offres (non lu en détail).
- `tests/integration/brewWizardFirstSaveSourceContract.test.tsx` : fixtures « Levure » du stock (l. 68, 89).
- `tests/unit/hopIndexV4/etapeHoublons.test.tsx` l. 85, 147 : banc `?dev-local&etape=houblons` (verrous DEV).
- Non recensés : tests de l'étape elle-même dans l'assistant (doute ; `grep -rl "Levure ·\|yc-journey"` à relancer).

## Captures (`captures/`)

Outil : `capturer-levure.mjs`, adapté de `capturer-fermentescibles.mjs`. Copie `deploy-bc70`, `npm run dev` sur le port 5641, `VITE_HOP_V4=on`, clés factices, `?dev-local`. Journal : `captures/journal.json` (erreurs page 0, requêtes bloquées 0).

- `levure-choisie-390.png` (390×844) : SafAle US-05 en carte, offres, « Parcourir le catalogue ». Ouverte, lue.
- `levure-geste-choisir-390.png` (390×844) : champ « Changer », liste pliée, « Parcourir les 1 734 références », « Fermer la recherche ». Ouverte, lue.
- `levure-detail-390.png` (390×844) : fiche « Compléter ou corriger la fiche » ouverte, températures et atténuation. Ouverte, lue.
- `levure-vide-390.png` (390×844) : recette sans levure, « Levure · choisir », pas de bandeau. Ouverte, lue.
- `levure-choisie-1280.png` (1280×900) : bureau, fil avec libellés, bandeau, carte levure, pied « Retour / Suivant — Paliers » épinglé. Ouverte, lue.
- `reference-malts-p6-b2-sucre-apres.png` (780×1688, copie de `v6/p6-b2/p6-b2-sucre-apres.png`) : étape Malts/sucres à 390, remplie (Pilsner, Weizenmalz, Haferflocken, Dextrose). Ouverte, lue. Constat : son titre dit « Fermentescibles 2/7 » ; le code dit « Malts/sucres » (B1-10). Cette référence est antérieure au changement de titre. Doute : la voie demandait « s1 sur p6-b2 » ; ce fichier est le seul « sucre » de ce dossier, choisi par lecture.

## Doutes (non tranchés)

- Aucune recette de démo n'a de levure dans le stock : la liste « Levures disponibles dans mon stock » et l'état « en stock » ne sont pas vus.
- Aucune capture de la liste de comparaison, de l'essai de conduite, ni d'état hors ligne ou d'erreur.
- La fiche sort du pli : sa position écran (après le catalogue) pousse le contenu utile sous la ligne de flottaison ; à juger en plein format.
- Gemini derrière « Rechercher la fiche avec l'IA » : non appelé, non vérifié.
