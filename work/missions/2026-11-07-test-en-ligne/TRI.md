# Tri des 51 problèmes du test en ligne du 07.11 (voie c-en-ligne)

Légende :
- **CORRIGÉ-ICI** : corrigé dans cette voie (fichiers, contrôle Vitest vert au 07.11 ; rendu Chrome : DEMANDE EXECUTANT dans RESULTAT.md).
- **DÉJÀ (commit ; contrôle)** : corrigé depuis le build ancien par une autre voie. Preuve = le contrôle rejoué vert sur un build figé actuel. **Rejeu non fait ici** (série Chrome + build : DEMANDE EXECUTANT) : tant qu'il n'est pas rejoué, ces lignes sont « déjà corrigé, non reprouvé ».
- **AILLEURS** : Fermentescibles, Dépense, ExpenseSheet ou BrewWizard sont tenus par d'autres auteurs : non touché.
- **À CORRIGER (fichier)** : à faire ; le fichier est le plus probable après lecture ou recherche rapide (« probable » = non vérifié).
- **DONNÉES** : le code est sain ; à vérifier par le pilote en lecture seule.

Ma voie ne possède pas `BrewWizard.tsx` : tout problème dont la cause est dans l'assistant est classé AILLEURS avec le patch exact en RESULTAT.md quand je l'ai trouvé.

| n° | Gr. | Classement | Détail |
|---|---|---|---|
| 1 | B | CORRIGÉ-ICI (fiche, format) + AILLEURS (bandeau) | Règle unique `src/domain/recipeMetrics.ts` : OG retenue sinon calculée, en virgule. La fiche la suit (`RecipePage.tsx`). Cause du bandeau : `BrewWizard.tsx` l. 2314 `(step === 'levure' ? og : ogPredicted)` : 1,085 (retenue) à l'étape Levure, 1,094 (recalculée) ailleurs. Patch en RESULTAT.md. |
| 2 | B | CORRIGÉ-ICI (fiche) + AILLEURS (assistant) | `fgRecette` : cible retenue sinon projection. Assistant : l. 3034 de `BrewWizard.tsx` écrit la projection seule (patch en RESULTAT.md). |
| 3 | B | CORRIGÉ-ICI | La liste lit l'IBU calculé comme la fiche (`ibuListe`, `productionCatalog.ts`, `ProductionCatalog.tsx`). L'annoncé reste en note sur la fiche et sert de repli quand le calcul est impossible. |
| 4 | B | AILLEURS / À CORRIGER | État « à la place de X » conservé entre recettes : `BrewWizard.tsx` (état du remplacement) ou `src/ui/hopIndex/maBiere/*` (non diagnostiqué). Voir DÉCISION dans RESULTAT.md. |
| 5 | G | AILLEURS | Deux volumes de moût (31,1 L / 29,5 L) : calculs d'eau dans `BrewWizard.tsx` (Identité, Eau et sels). |
| 6 | G | AILLEURS | Deux projections d'alcool NOLO au même écran : `BrewWizard.tsx` + `src/ui/NoloPanel.tsx` (probable). |
| 7 | G | AILLEURS | « SG » / bloc NOLO répété : `BrewWizard.tsx`, `src/ui/NoloPanel.tsx` (probable). |
| 8 | G | CORRIGÉ-ICI (fiche) | Fiche : OG, FG, ABV, EBC, IBU par houblon à la virgule (`formatDensite`, `formatDecimal`). Reste : « 14.7 IBU · 14.2 % AA » du panneau `HopBitternessPanel.tsx` (probable) et le Récap de l'assistant. |
| 9 | G | À CORRIGER | Houblon hors catalogue (« Nuget », « Hallertauer Mittelfruh ») : rapprochement de nom, `src/domain/hopIndex/recipeGuide.ts` (`prepareRecipeIngredientNames`, probable). |
| 10 | G | AILLEURS | Pastilles de malts sans couleur : Fermentescibles (`bf35d73a` pour Dextrose ; les autres pastilles restent). |
| 11 | G | À CORRIGER | Carte d'en-tête de la fiche NEIPA : la cellule affiche son `hint` à la place d'un chiffre (`Metric` de `RecipePage.tsx`, l. 83–100) ; pas de section Eau/Conduite sans données. |
| 12 | G | CORRIGÉ-ICI (partiel) | « 1 paliers » / « 2 étapes » de la fiche accordés (`nombreAccorde`). Reste : noms de l'étape des grains, « Nouvelle recette » / « Créer une recette » (`src/components/` menu +, probable), Récap (AILLEURS). |
| 13 | G | À CORRIGER | « SG » → « DI » / « densité » : libellés dans `BrewWizard.tsx` (AILLEURS) et `src/ui/BatchDetailSheet.tsx`, Bord (probable). Identifiant de levure à la place du nom : `src/domain/yeastCompanion.ts` (probable). |
| 14 | G | AILLEURS | Étape Levure « Volume ? inconnu » : `BrewWizard.tsx` / `src/ui/YeastRecipeWorkbench.tsx` (probable). |
| 15 | G | À CORRIGER | Précisions absurdes (2,7021 L/kg…) : arrondir à l'affichage (`BrewWizard.tsx` AILLEURS, `src/ui/RecipeDisclosure.tsx` pour la fiche, probable). |
| 16 | G | AILLEURS | Alerte d'eau dès l'ouverture : `BrewWizard.tsx` (état `volumesEdited`). |
| 17 | G | DÉJÀ (`bf35d73a` ; `controle-12-masse.mjs`) pour Fermentescibles ; Récap/bandeau AILLEURS | Parts 101 % : arrondi des parts, à CORRIGER dans `RecipePage.tsx` (`pct.toFixed(0)`, l. 352 : plus grand reste). |
| 18 | G | AILLEURS | Assistant monté deux fois, « Fermer » inerte : `src/App.tsx` + `BrewWizard.tsx`. |
| 19 | G | DÉJÀ partiel (`b2577be6` ; `controle-14-reprise.mjs`) | Reprise du brouillon à son étape corrigée ; « Nouvelle recette » qui rouvre un brouillon sans le dire reste (`App.tsx`, `BrewWizard.tsx`). |
| 20 | D | À CORRIGER | Pastilles de style blanches sur pastel en clair : `src/ui/production/CatalogCards.tsx` / jeton de couleur de pastille (probable). |
| 21 | D | À CORRIGER | « — » et « 0 » pour le même inconnu : `CatalogCards.tsx` (`number(entry.abv)` écrit « undefined %/— % » selon le cas) ; un inconnu ne s'écrit jamais 0. |
| 22 | D | DÉJÀ (`bf35d73a` « contraste en sombre » ; `controle-8-contraste.mjs`) | |
| 23 | D | DÉJÀ partiel (`bf35d73a` « repères J lisibles ») ; repère OG du bandeau : AILLEURS | |
| 24 | D | CORRIGÉ-ICI (fiche : « 1 ajout », « 1 palier ») | « 2 sachet » : `RecipePage.tsx` l. 500 (`recipe.yeast.unit`) à CORRIGER. |
| 25 | D | AILLEURS | Fermentescibles. |
| 26 | D | AILLEURS | Fermentescibles. |
| 27 | D | À CORRIGER | Potentiel aromatique NEIPA « Calcul incomplet : durée d'ébullition » : `src/ui/hopIndex/HopRecipePanel.tsx` / `src/domain/hopIndex/*` (probable) ; cockpit = six sous-sections repliées. |
| 28 | D | À CORRIGER | Suggestions hors style : `src/ui/hopIndex/suggerer/index.tsx` (probable). |
| 29 | D | À CORRIGER | Phrase doublée du rinçage : `src/domain/brewDay.ts` ou `BrewWizard.tsx` (probable). |
| 30 | D | À CORRIGER | Nom tronqué à 500 px (champ du nom, assistant) : `BrewWizard.tsx` (AILLEURS) ; CSS `recipe-wizard.css`. |
| 31 | D | DÉJÀ partiel (`b2577be6` ; `controle-7-fab.mjs`, bas de page) ; haut de page : AILLEURS (`PageShell.tsx`) | |
| 32 | D | DONNÉES | « V2 » + « v2 » dans le nom, deux « Ttt » : données du brasseur. |
| 33 | D | À CORRIGER | Brassin planifié dans le passé non signalé : `src/domain/batchSchedule.ts` + carte du Bord (probable). |
| 34 | D | À CORRIGER | « — L en cuve » : Brassins / Bord, `src/ui/production/CatalogCards.tsx` (probable). |
| 35 | B | DONNÉES (diagnostic de code sain) | Voir DIAGNOSTIC dans RESULTAT.md ; test `tests/integration/financeJournalDoubleSomme.test.tsx`. |
| 36 | B | DONNÉES | Les 26 écritures « Paiement à confirmer » n'ont pas de `paymentStatus` : ce sont d'anciennes saisies distinctes de la facture « Soldée » (même cause que 35). |
| 37 | B | DÉJÀ (`c4c36583` ; `controle-b2-2-aller-retour.mjs`, `controle-b2-3-garde-unite.mjs`) | |
| 38 | G | AILLEURS | Détail > total sans alerte : Dépense (`Recap.tsx`, `ExpenseSheet.tsx`). `controle-b2-15-somme` couvre le « Somme = imprimé » mais pas l'alerte > total : à confirmer par l'exécutant. |
| 39 | G | AILLEURS | TVA 99999 / −1 acceptés : `ExpenseSheet.tsx`. |
| 40 | G | AILLEURS | Fermer une saisie remplie : `ExpenseSheet.tsx`. |
| 41 | G | DÉJÀ (`c4c36583` ; `controle-b2-4-montant.mjs`) | |
| 42 | G | DÉJÀ (`c4c36583` ; `controle-b2-5-casse.mjs`) | |
| 43 | G | AILLEURS | « Annuler » d'un retrait : Dépense (Fermentescibles l'a, `bf35d73a` `controle-6-retraits.mjs`). |
| 44 | D | DÉJÀ (`c4c36583` ; `controle-b2-17-compte.mjs`) | |
| 45 | D | À CORRIGER | Filtres du journal tronqués à 500 px : `src/ui/finance/TransactionJournal.tsx` + `journal.css` (probable). |
| 46 | D | AILLEURS | Chemin « Saisir sans justificatif » : produit, Dépense. |
| 47 | D | DONNÉES | Deux noms de fournisseur : saisies différentes. |
| 48 | D | À CORRIGER | Menu « + » et barre du bas sans nom accessible : `src/components/BottomNav.tsx` et menu d'actions rapides (`src/components/QuickActionModal.tsx`, probable). |
| 49 | G | À CORRIGER | Trois comptes de « manque » : Stocks (« À commander · 12 ») contre Bord/badge (« 26 articles au seuil ou en dessous · 21 ruptures ») : une seule fonction de comptage, `src/domain/` stock (probable). |
| 50 | D | À CORRIGER | « Niveau inconnu » sans moyen de fixer le seuil : `src/ui/LevelGauge.tsx` (probable). |
| 51 | – | sans objet | Aucun message console capturé. |

Décompte : CORRIGÉ-ICI 1 (partie fiche), 2 (partie fiche), 3, 8 (partie fiche), 12 (partie), 24 (partie) ; DÉJÀ 17, 19, 22, 23, 31, 37, 41, 42, 44 ; AILLEURS 4 à 7, 10, 14, 16, 18, 25, 26, 30, 38 à 40, 43, 46 ; DONNÉES 32, 35, 36, 47 ; À CORRIGER 9, 11, 13, 15, 20, 21, 27 à 29, 33, 34, 45, 48 à 50 (15 lignes, plus les restes de 17 et 24). Non traités : tous les « À CORRIGER » (le brief demandait d'abord les trois bloquants, le diagnostic et le tri).
