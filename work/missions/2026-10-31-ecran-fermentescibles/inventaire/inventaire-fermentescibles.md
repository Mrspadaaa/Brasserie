# Étape « Fermentescibles 2/7 » (Malts/sucres) : inventaire de l'état actuel

Voie i1, mission 2026-10-31-ecran-fermentescibles. Lecture du code de `src/pages/BrewWizard.tsx` (arbre de travail, lignes citées telles quelles) et captures de la copie de production `atelier-ecrans` (commit ae7c7a8d). Aucun changement de code. Les numéros de ligne peuvent bouger ; doute marqué « ? ».

## L'écran en un coup d'œil

- Accès : Assistant de recette, étape 2, par le fil d'étapes (`WizardStepRail`, mobile l. 2153 dans l'en-tête, bureau l. 2224). Son id : `fermentescibles` (`StepId` l. 427, `STEPS` l. 437, libellé « Fermentescibles », court « Malts/sucres »).
- Ouverture directe : `?dev-local&etape=houblons` ouvre l'étape 3 (App.tsx l. 452-468), jamais l'étape 2. L'étape 2 se tape dans le fil.
- Racine : `src/pages/BrewWizard.tsx`, bloc `step === 'fermentescibles'` l. 2410 à 2575 (`Section` « Fermentescibles »). Le fichier entier compte 3419 lignes.
- Données de l'étape : `fermentables`, état l. 660-662 (`addKind` par défaut « grain ») ; calculs l. 836-841 (grain seul, couleur), 876 (setter), 933 (`gravityWarning`), 1264-1300 (ajout, patch).
- Fichiers propres : `src/ui/MaltDetails.tsx` (détail grain, l. 3 de l'import), `src/ui/CycleTag.tsx` (pastille famille et moment), `src/ui/QuantityStepper.tsx` (poids), `src/ui/IngredientPicker.tsx` (choix dans le stock, création à la volée), `src/ui/Combobox.tsx` (liste), `src/ui/WizardStepBar.tsx` (fil), `src/ui/NumberInput.tsx` (jour d'ajout).
- Hors étape : `RecipeAutoComplete` l. 2331-2332, rendu pour `fermentescibles` et `recap` avec `scope='malt'` (contrôle de complétude, chargé à la demande, Suspense « Chargement des contrôles de complétude… »).

## Blocs, du haut vers le bas (capture mobile 390)

| # | bloc | composant principal | fichier : ligne |
|---:|---|---|---|
| 1 | En-tête « ‹ Fermentescibles 2/7 », import, thème | mobileHeader (WizardStepName) | `src/pages/BrewWizard.tsx:2121` |
| 2 | Fil : Identité · Malts/sucres · Houblons · Levure · Paliers · Eau · Récap. (étape courante soulignée) | WizardStepRail, showLabels, compactLabels | `src/pages/BrewWizard.tsx:2153` |
| 3 | Bandeau « Grain · OG · IBU · EBC » (affiché si `hasMetrics`, l. 1778 : au moins un fermentescible ou un houblon) | bloc `.recipe-metrics` | `src/pages/BrewWizard.tsx:2288` |
| 4 | Carte « Fermentescibles » et sa phrase d'aide « Le lactose ne fermente pas ; le sucre fermente à 100 % » | Section (src/pages/PageShell.tsx) | `src/pages/BrewWizard.tsx:2410` |
| 5 | « Ajouter » + pastille de famille (Grain, Sucre, Lactose, Fruit, Extrait) et sa phrase d'explication | CycleTag | `src/pages/BrewWizard.tsx:2425` |
| 6 | Choix dans le stock de la famille, « Ajouter — grain… » | IngredientPicker (Combobox) | `src/pages/BrewWizard.tsx:2440` |
| 7 | Liste vide : « Rien encore. » | paragraphe | `src/pages/BrewWizard.tsx:2455` |
| 8 | Une ligne par fermentescible : nom, moment (CycleTag), « NN % du grain » ou « NN % ferm. », poids (QuantityStepper, kg), corbeille « Retirer » | li | `src/pages/BrewWizard.tsx:2464-2530` |
| 9 | Jour d'ajout en fermentation (si moment = fermentation) | Field + NumberInput | `src/pages/BrewWizard.tsx:2536` |
| 10 | « Non fermentescible : il remonte la densité finale… » (lactose avec poids > 0) | p ambre | `src/pages/BrewWizard.tsx:2553` |
| 11 | Détail de malt (couleur, classe, etc.) pour les grains | MaltDetails | `src/pages/BrewWizard.tsx:2558` |
| 12 | Avertissement de densité (ex. « À 1.066, le moût sature… ») | p ambre, `gravityWarning.note` | `src/pages/BrewWizard.tsx:2567` |
| 13 | Boutons « Retour » et « Suivant — Houblons » (pied de page commun) | PageShell | `src/pages/BrewWizard.tsx` (pied, voir `go` l. 2102) |
| — | Bouton « + » flottant (action de l'écran courant, App.tsx) | hors assistant | — |

Absent de cette étape : le panneau de comparaison. « Comparer » (T15b, l. 1528-1534) est une couche posée au-dessus du wizard pour les houblons (`poserPorteEtape`, drapeau hopV4). Il ne contient aucun panneau de malts ; l'étape 2 n'a donc pas de comparatif.

## Fonctions (gestes possibles)

- **Ajouter un fermentescible** : choisir la famille (pastille, CycleTag l. 2425, ordre `FERMENTABLE_KINDS` l. 276 : grain → sucre → lactose → fruit → extrait) ; ouvrir la liste (« Ouvrir la liste ») ou taper ; choisir une option du stock (rayon = `KIND_DEF[famille].stock`, l. 369-404 : Grain = Malt/Céréale, Sucre = Sucre, Fruit = Fruit/Additif, Extrait = Extrait/Sucre). Taper un nom absent propose « Ajouter « … » » (création d'un article à stock zéro, `onCreateStockItem`, l. 2446-2449). `addFermentable` l. 1264 : refuse un doublon (même famille et même article) ; poids 0 au départ ; moment et fermentescibilité viennent de la famille (`KIND_DEF`) ; au clavier pointeur fin, le poids prend le focus (l. 1275-1278).
- **Changer le moment** : pastille « Moment de … » (CycleTag l. 2470 ; empâtage, ébullition, fermentation). `patchFermentable`, l. 1298.
- **Changer la masse** : QuantityStepper l. 2508, unité kg, `id=wz-fermentable-<rang>`, `onChange` → `patchFermentable(i, {weightKg})`. Valeur vide = 0.
- **Jour d'ajout** (moment fermentation seulement) : NumberInput l. 2536, défaut 3 à l'ajout (l. 1290).
- **Retirer** : corbeille l. 2524, `aria-label = Retirer <nom>`, retire la ligne.
- **Comparer** : aucun geste dans cette étape.
- **Ce que montre le bandeau commun** (l. 2288-2310) : « Grain » = somme des grains en kg (`totalGrist`, l. 838) ; « OG » = `ogPredicted` (l. 2298) ou « — » ; « IBU » = `ibu` (ou plage hopV4) ; « EBC » = `color` (`computeBeerColor` sur les grains, l. 841). Le bandeau est masqué à l'étape « eau » seulement.
- **Rendement, sucres, extraits** : rendement = `details.efficiencyPct ?? brewhouse.efficiencyPct ?? 75` (l. 895 ; ? valeur par défaut 75). Sucre : `potentialPpg` et `fermentabilityPct` par famille (`KIND_DEF`). Extraits : `BrewingMath.extractPoints` pour l'OG en mode NOLO (l. 903-915). Le texte « NN % du grain » (grain) ou « NN % ferm. » (autres) est dans la ligne. L'avertissement de saturation vient de `gravityWarning` (l. 933).
- **Catalogues lus** : `stockItems` (props, rayon par famille), `knowledge` (fiches, réseau sur `useStorageValue`, l. 101 ? ce hook n'est pas relu ici), `RecipeAutoComplete` (scope malt), `MaltDetails` (`onLearnIngredient`, appris par l'app). Gemini : non vérifié dans cette étape (doute).

## États

- **Recette vide** (capture `fermentescibles-vide-390`) : bandeau absent (`hasMetrics` faux) ; « Rien encore. » ; picker « Ajouter — grain… ». Vérifiée à l'œil.
- **Recette remplie** : non capturée. La recette de démonstration (`apercuDev.ts` l. 7-13, « Stout export ») n'a aucun fermentescible (`fermentables: []`) ; et le stock du `?dev-local` ne contient aucun malt ni sucre. Donc rien ne peut être ajouté par le geste. Ce qu'on voit (« stock vide : rien à ajouter ») est l'état réel de l'étape dans ce banc, pas une recette remplie.
- **Valeur inconnue** : non observée dans cette voie (doute). Un fermentescible sans `colorEbc` (grain) ou sans `potentialPpg` reçoit la valeur de la famille (l. 1290-1292) : à confirmer.
- **Hors ligne** : non testé dans cette voie (doute).
- **Erreur** : pas d'erreur de page pendant les captures (`ERREURS PAGE : 0`, `REQUETES BLOQUEES : 0`) ; le message d'erreur de saisie passe par `fieldError` (l. 1835, `wz-fermentable-<rang>`), non déclenché ici.
- **Avertissement** : lactose avec poids > 0 (l. 2553) ; saturation (l. 2567) : visibles dans la capture 1280 (texte d'avertissement sous la liste, masqué par la liste ouverte).

## Données lues et écrites

- Lues : `fermentables` (état de la recette, l. 660) ; `stockItems` (props) ; `details.efficiencyPct`, `brewhouse` ; `details.nolo` (mode NOLO change l'OG et le libellé « Sucres : bilan NOLO », l. 2497).
- Écrites : `setFermentables` (brewerSetter, l. 876) → état de la recette, brouillon (`draftKey`). Création d'un article de stock via `onCreateStockItem` (l. 2446). En dev-local, l'écriture reste locale ; aucun appel à Firestore pour cette voie.

## Tests qui couvrent l'étape

Non recensés dans cette voie (le script d'inventaire des écrans l'a fait pour Identité ; ici la liste n'est pas faite). Doute : à relever par `grep -rl "BrewWizard"` et libellés « Fermentescibles » / « Ajouter — ».

## Captures (`captures/`)

Outil : `capturer-fermentescibles.mjs` (copie adaptée de l'outil e2, dans ce dossier). Depuis la copie `atelier-ecrans`, `with_server.mjs` sur le port 5631, `VITE_HOP_V4=on`, clés Firebase factices, `?dev-local`, contexte de navigateur jetable.

- `fermentescibles-vide-390.png` (390×844, recette vide) : « Ajouter — grain… », « Rien encore. », pas de bandeau. Ouverte et lue.
- `fermentescibles-ajout-390.png` (390×844, geste ajouter) : la famille est à « Sucre » (la famille a été passée pour le test), liste ouverte, « Aucune option », sous le champ. Le stock est vide pour cette famille. Ouverte et lue.
- `fermentescibles-pleine-390.png` (390×844) : identique à l'état vide (« Grain 0 kg », « Rien encore », liste sucre). Pas de recette remplie possible (voir États). Ouverte et lue.
- `fermentescibles-pleine-1280.png` (1280×900, bureau) : titre « Modifier « Stout export » », fil en haut, bandeau « Grain 0 kg · OG — · IBU 60 · EBC — », liste « Aucune option » ouverte. Ouverte et lue.
- `fermentescibles-pleine-390` et `fermentescibles-ajout-390` montrent le même état (stock vide, pas de ligne) ; `-ajout-390` ouvre la liste. Ce sont des états réels de stock vide, notés tels quels.
- `journal.json` : erreurs 0, requêtes bloquées 0.

## Doutes (non tranchés)

- Recette remplie : impossible sans stock de malts dans `?dev-local` ou sans fixture à fermentescibles. Une capture remplie demande un stock de démo ou une recette à fermentescibles (décision du pilote).
- Le panneau de comparaison n'existe pas pour les malts (constat, pas un doute).
- Le libellé du hook `useStorageValue` et l'usage de Gemini dans cette étape ne sont pas vérifiés.
