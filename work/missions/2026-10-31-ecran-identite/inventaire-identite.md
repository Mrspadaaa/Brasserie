# Écran « Identité 1/7 » : inventaire détaillé

Généré par `node scripts/agents/inventaire-ecrans.mjs` (voie e2-inventaire, mission 2026-10-31-systeme-ecrans). Ne pas éditer à la main : relancer le script.
Capture du brasseur : `work/missions/2026-10-31-ecran-identite/brasseur-identite-avant.jpg` (production, thème clair, 31.10).
Les numéros de ligne sont ceux du code actuel (arbre de travail) ; une ancre qui bouge fait échouer `--verifier`.

## L'écran en un coup d'œil

- Accès : Assistant de recette, première étape (ouverture par défaut).
- Racine : `src/pages/BrewWizard.tsx`, de la ligne 2335 à 2409 (75 lignes) ; le fichier entier compte 3419 lignes.
- Fichiers propres : `src/ui/BrewingStyleDetails.tsx`, `src/ui/RecipeInstallationChoice.tsx`, `src/ui/recipe-installation.css`, `src/ui/NoloPanel.tsx`, `src/ui/BrewEquipmentSummary.tsx`, `src/ui/Combobox.tsx`, `src/ui/RecipeImportSheet.tsx`.
- Tests repérés (par import ou par libellé) : 25.
- Lien avec houblons : pas du tout. L'étape Houblons (3/7) est refaite ; l'étape Identité, non.
- Données lues (détection par motifs, sur la zone et les fichiers propres) : Firestore via StorageService (getHopKnowledge) ; lecture réactive (useStorageValue) ; catalogue embarqué (styles, houblons, levures, eaux) ; Gemini (réseau, facturé).

## Blocs, du haut vers le bas de la capture

| # | bloc | composant principal | fichier : ligne |
|---:|---|---|---|
| 1 | En-tête : « ‹ Identité 1/7 », Abandonner, import, thème | mobileHeader (BrewWizard) | `src/pages/BrewWizard.tsx:2121` |
| 2 | Fil d'étapes : Identité · Malts/sucres · Houblons · Levure · Paliers · Eau · Récap. | WizardStepRail (src/ui/WizardStepBar.tsx), avec showLabels et compactLabels | `src/pages/BrewWizard.tsx:2153` |
| 3 | Bandeau « Grain · OG · IBU · EBC » | bloc .recipe-metrics (BrewWizard.tsx) | `src/pages/BrewWizard.tsx:2288` |
| 4 | « Coller une recette trouvée » | bouton dans BrewWizard.tsx | `src/pages/BrewWizard.tsx:2349` |
| 5 | Carte « Identité » et navigation au clavier | Section (src/pages/PageShell.tsx) | `src/pages/BrewWizard.tsx:2352` |
| 6 | Nom de la bière | Field et TextInput (src/ui/FormNav.tsx, src/ui/TextInput.tsx, src/ui/Input.tsx) | `src/pages/BrewWizard.tsx:2356` |
| 7 | Style | Combobox (src/ui/Combobox.tsx, 519 lignes) : recherche floue (fuse.js), création d'un style libre | `src/pages/BrewWizard.tsx:2373` |
| 8 | Repères du style · 22A · BJCP 2021 | BrewingStyleDetails (src/ui/BrewingStyleDetails.tsx, 30 lignes) : <details> | `src/pages/BrewWizard.tsx:2381` |
| 9 | Volume en fermenteur (24 L) | InlineNum (src/ui/FormNav.tsx) sur NumberInput (src/ui/NumberInput.tsx) | `src/pages/BrewWizard.tsx:2384` |
| 10 | Durée d'ébullition (60 min) | InlineNum (entier, minimum 0) | `src/pages/BrewWizard.tsx:2385` |
| 11 | « 3 L évaporés — autant d'eau à prévoir en plus dans la cuve. » | evaporationHint (BrewWizard.tsx, useMemo) | `src/pages/BrewWizard.tsx:1789` |
| 12 | Objectif NOLO · ≤ 0,5 % | NoloPanel (src/ui/NoloPanel.tsx, 222 lignes), allowEnable, chargé à la demande (lazy) | `src/pages/BrewWizard.tsx:2390` |
| 13 | Choix pour ce brassin (24 / 30 L · 6 L libres) | RecipeInstallationChoice (src/ui/RecipeInstallationChoice.tsx, 33 lignes) | `src/pages/BrewWizard.tsx:2393` |
| 14 | Matériel du plan : Royal Catering · cuve 45 L | ligne et boutons dans BrewWizard.tsx (« equipment-button ») | `src/pages/BrewWizard.tsx:2394` |
| 15 | Volumes et matériel (encadré récapitulatif sous « Matériel du plan ») | BrewEquipmentSummary (src/ui/BrewEquipmentSummary.tsx, 94 lignes), le même encadré que sur le jour de brassage | `src/pages/BrewWizard.tsx:2398` |
| 16 | Retour / « Suivant — Malts/sucres » (pied de page, sous le contenu) | stepActions (BrewWizard.tsx), passé à PageShell comme endActions | `src/pages/BrewWizard.tsx:2182` |
| 17 | Bouton « + » flottant (Actions rapides) | FloatingActions (src/ui/FloatingActions.tsx), monté par App.tsx | `src/App.tsx:990` |
| 18 | Bandeaux d'état au-dessus du contenu (invisibles dans la capture) | recipe-draft-status, wz-validation, writeAlert (BrewWizard.tsx) | `src/pages/BrewWizard.tsx:2258` |

### 1. En-tête : « ‹ Identité 1/7 », Abandonner, import, thème

- **Ce qu'on voit** : « < » en haut à gauche, « Identité 1/7 », lien souligné « Abandonner », icône de collage, icône lune.
- **Composants** : mobileHeader (BrewWizard) ; WizardStepName (WizardStepBar.tsx) ; ThemeToggle (src/theme/ThemeToggle.tsx) ; PageShell, prop mobileHeader (src/pages/PageShell.tsx).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2121`, `src/pages/BrewWizard.tsx:2114`, `src/ui/WizardStepBar.tsx:23`, `src/theme/ThemeToggle.tsx:8`.
- **Données lues** :
  - draftKey, draftNotice, draftError, draftAside, discarding (état du brouillon, en mémoire)
  - étape courante (STEPS, stepIndex)
  - thème : localStorage (src/theme/theme.ts, clé du thème)
- **Données écrites** :
  - setImporting(true) : ouvre la feuille d'import
  - setDiscarding(true), puis clearRecipeDraft : supprime le brouillon dans localStorage
  - thème : localStorage
- **États** :
  - « Abandonner » n'existe que si un brouillon est repris ou signalé (draftNotice ou draftError) et que la version enregistrée n'est pas ouverte à côté : une recette neuve, sans brouillon, ne l'a pas
  - confirmation sous l'en-tête : « Supprimer ce brouillon ? » Garder / Abandonner
  - import désactivé en lecture seule (brouillon d'un format plus récent) ou pendant l'enregistrement
  - sur ordinateur, « Abandonner » passe par l'en-tête de la coque (actions de PageShell)
- **Gestes** :
  - appui sur « < » : ferme la page (route.close), comme le geste retour du téléphone
  - appui sur « Abandonner » : demande de confirmation, rien n'est supprimé au premier appui
  - appui sur l'icône : ouvre « Coller une recette trouvée »
  - appui sur la lune : bascule clair/cave
- **Tests** :
  - recipeWizardSafety (abandon, confirmation, pas de restauration)
  - brewWizardDraftFreshness
  - aucun test sur ThemeToggle ni sur l'icône d'import

### 2. Fil d'étapes : Identité · Malts/sucres · Houblons · Levure · Paliers · Eau · Récap.

- **Ce qu'on voit** : Sept libellés courts sous l'en-tête ; l'actif est souligné en épais, les autres en filet gris.
- **Composants** : WizardStepRail (src/ui/WizardStepBar.tsx), avec showLabels et compactLabels ; STEPS (BrewWizard.tsx).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2153`, `src/ui/WizardStepBar.tsx:50`, `src/pages/BrewWizard.tsx:435`.
- **Données lues** :
  - STEPS (7 étapes, libellé court « Malts/sucres », « Eau », « Récap. »)
  - index de l'étape
- **Données écrites** :
  - setStep(id) : change d'étape sans valider la précédente
- **États** :
  - désactivé pendant l'enregistrement ou pendant un calcul du guide houblons (hopGuideBusy)
  - le nom et la position sont annoncés aux lecteurs d'écran (aria-live)
- **Gestes** :
  - appui sur un libellé : saute directement à l'étape (aucune validation, contrairement à « Suivant »)
  - défilement horizontal local si le rail déborde
- **Tests** :
  - tests/helpers/wizard.ts s'en sert pour naviguer ; tests/unit/hopIndexV4/etapeHoublons.test.tsx
  - aucun test dédié au rail

### 3. Bandeau « Grain · OG · IBU · EBC »

- **Ce qu'on voit** : Une ligne : Grain 8,6 kg, OG 1,080, IBU ~93 suivi d'une petite piste (bande du style et repère de la bière), EBC 9,5 avec une pastille de couleur.
- **Composants** : bloc .recipe-metrics (BrewWizard.tsx) ; IbuEnPlage (BrewWizard.tsx) et MesuresWizardV4 (src/ui/hopIndex/maBiere/MesuresWizard.tsx, chargé à la demande), drapeau hopV4 allumé ; libelleIbu (src/domain/hopIndex/v4/recipeConversion.ts) ; computeBeerColor (src/domain/beerColor.ts) ; BrewingMath (src/services/brewingMath.ts).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2288`, `src/pages/BrewWizard.tsx:133`, `src/pages/BrewWizard.tsx:2285`, `src/ui/hopIndex/maBiere/MesuresWizard.tsx:15`.
- **Données lues** :
  - fermentables, hops, yeast, volume, ébullition de la recette en cours
  - totalGrist, ogPredicted, ibu (calculés par BrewingMath), color (computeBeerColor)
  - drapeau hopV4 allumé : IBU en plage (« ~ ») tirée de la variété par le moteur v4, et bande d'IBU du style
- **Données écrites** :
  - rien : lecture seule (MesuresWizard remonte ses mesures à l'assistant par onMesures, sans les écrire dans la recette)
- **États** :
  - absent tant que la recette n'a ni grain ni houblon (hasMetrics) : une recette neuve n'a pas de bandeau
  - valeur inconnue affichée « — » (OG, IBU, EBC), jamais 0
  - masqué à l'étape Eau
  - drapeau hopV4 éteint : « IBU » simple, ou « IBU chaud » s'il y a un dry hop ; allumé : « ~93 » et une piste (la valeur exacte et sa cause sont dans l'infobulle title)
  - à l'étape Houblons, c'est l'étape qui rend l'IBU (le bandeau ne monte pas MesuresWizardV4)
- **Gestes** :
  - aucun geste propre ; le détail de l'IBU est dans un attribut title, que le toucher ne montre pas (non vérifié sur téléphone)
  - se met à jour à chaque saisie dans l'étape
- **Tests** :
  - pas de test qui vise ce bandeau par son libellé ; les calculs sont testés en domaine (brewingMath.test.ts, hopIndexV4)

### 4. « Coller une recette trouvée »

- **Ce qu'on voit** : Bouton pleine largeur, contour, icône de presse-papiers.
- **Composants** : bouton dans BrewWizard.tsx ; RecipeImportSheet (src/ui/RecipeImportSheet.tsx, 551 lignes) dans une Sheet.
- **Où dans le code** : `src/pages/BrewWizard.tsx:2349`, `src/ui/RecipeImportSheet.tsx:92`, `src/ui/RecipeImportSheet.tsx:110`.
- **Données lues** :
  - texte collé ou photo
  - copie L'Affinée : relue exactement en local (parseLocalRecipe)
  - autre texte : Gemini via AiClient.run, puis lecteur local si l'IA est indisponible
- **Données écrites** :
  - applyImport : remplace nom, style, volume, ingrédients, paliers, eau… de l'assistant (brouillon localStorage ensuite)
- **États** :
  - hors ligne : l'IA échoue, le lecteur local prend le relais ; un texte endommagé est refusé sans payer l'IA
  - chargement pendant l'appel IA ; erreur lisible dans la feuille
  - aperçu des sels, acides, adjuvants avant application
- **Gestes** :
  - appui : ouvre la feuille ; coller ; appliquer ou annuler
- **Tests** :
  - recipeImportRoundTrip, d100AiErrorsVisible, waterVolumeExplanation, brewWizardFirstSaveSourceContract, yeastTransferUi

### 5. Carte « Identité » et navigation au clavier

- **Ce qu'on voit** : La carte grise qui contient nom, style, volume, ébullition, NOLO, choix pour ce brassin et matériel.
- **Composants** : Section (src/pages/PageShell.tsx) ; FormNav (src/ui/FormNav.tsx).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2352`, `src/ui/FormNav.tsx:46`, `src/pages/PageShell.tsx:717`.
- **Données lues** :
  - rien
- **Données écrites** :
  - onSubmit du formulaire : go(1) — passe à l'étape suivante si l'étape n'a pas d'erreur
- **États** :
  - aucun état propre
- **Gestes** :
  - Entrée : champ suivant ; Entrée dans le dernier champ : « Suivant » ; Maj+Entrée : champ précédent ; Échap : rend le focus
- **Tests** :
  - dataEntry.test.tsx et inputProtection.test.tsx couvrent FormNav

### 6. Nom de la bière

- **Ce qu'on voit** : Libellé « Nom de la bière » et champ texte (« neipa v3 »).
- **Composants** : Field et TextInput (src/ui/FormNav.tsx, src/ui/TextInput.tsx, src/ui/Input.tsx).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2356`, `src/ui/TextInput.tsx:16`.
- **Données lues** :
  - name (état initial : recette reprise, brouillon, ou titre de l'idée de l'atelier R&D)
- **Données écrites** :
  - setName : état de l'assistant ; brouillon localStorage (laffinee_recipe_draft_v1:<clé>) après la première modification ; recette Firestore seulement à l'enregistrement du récapitulatif
- **États** :
  - vide : placeholder « Milk Stout #2, NEIPA Tropicale… »
  - requis : après un « Suivant » refusé, erreur rouge « Une valeur à corriger » avec lien vers le champ (wz-validation)
  - désactivé pendant l'enregistrement
- **Gestes** :
  - saisie ; Entrée passe au style
- **Tests** :
  - recipeWizardSafety, textInput, brewWizardDraftFreshness, noloRecipeSolver, brewEquipment (via le libellé « Nom de la bière »)

### 7. Style

- **Ce qu'on voit** : Liste déroulante « Double IPA » avec chevron.
- **Composants** : Combobox (src/ui/Combobox.tsx, 519 lignes) : recherche floue (fuse.js), création d'un style libre ; changeStyle (BrewWizard.tsx) ; BrewWizardEntry : knownStyles = Suggestions.recipeStyles() (src/pages/BrewWizardEntry.tsx).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2373`, `src/pages/BrewWizard.tsx:797`, `src/pages/BrewWizardEntry.tsx:5`, `src/services/suggestions.ts:226`.
- **Données lues** :
  - styles connus du carnet (Suggestions.knownStyles) + styles BJCP du catalogue (brewingStyles, avec StorageService.getHopKnowledge)
- **Données écrites** :
  - style et details.styleRef (référence BJCP résolue)
  - si le profil d'eau suit le style : water.styleCode et ratioOverride remis à zéro — le choix du style change l'étape Eau sans prévenir
- **États** :
  - vide : placeholder « NEIPA, Stout, Saison… »
  - style inconnu : proposition « Nouveau style « … » » (allowCreate)
  - si plusieurs éditions correspondent et qu'aucune n'est retenue : lien « Préciser le référentiel du style »
- **Gestes** :
  - toucher : la liste s'ouvre (sans clavier sous un seuil d'options, avec au-delà) ; taper filtre ; ↑ ↓ Entrée Échap au clavier
- **Tests** :
  - brewWizardDraftFreshness, dataEntry, stoutWaterProfile (libellé « Style de la bière ») ; aucun test sur « Préciser le référentiel du style »

### 8. Repères du style · 22A · BJCP 2021

- **Ce qu'on voit** : Ligne bleue repliée avec chevron. Dépliée : OG, FG, alcool, IBU, couleur SRM en plages, lien de source, boutons « Proposer l'empâtage… » et « Proposer la conduite… ».
- **Composants** : BrewingStyleDetails (src/ui/BrewingStyleDetails.tsx, 30 lignes) : <details> ; HopSourceLink (src/ui/hopIndex/HopTechnicalPanel.tsx) ; brewingStyles, resolveBrewingStyle (src/domain/brewingStyles.ts) ; mashProgramForStyle, fermentProgramForStyle (src/domain/brewPrograms.ts).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2381`, `src/ui/BrewingStyleDetails.tsx:18`, `src/ui/BrewingStyleDetails.tsx:24`.
- **Données lues** :
  - catalogue de styles (src/domain/brewingStyles.ts) et connaissances houblons enregistrées (StorageService.getHopKnowledge)
  - plages OG, FG, alcool, IBU, SRM avec leur source
- **Données écrites** :
  - seulement sur appui d'un bouton « Proposer… » : remplace les paliers d'empâtage, ou la conduite de fermentation (et efface yeastGuide)
  - rien au simple dépliage
- **États** :
  - absent si le style n'est pas résolu ; message « Édition du style conservée indisponible » si la référence est perdue
  - en mode NOLO : les plages décrivent le style de référence, l'objectif d'alcool reste celui du NOLO ; les boutons « Proposer » disparaissent
  - les unités SRM et SG ne suivent pas le reste de l'écran (EBC dans le bandeau, SRM ici)
- **Gestes** :
  - appui : déplie ou replie
  - appui sur « Proposer l'empâtage » : écrase les paliers sans confirmation
- **Tests** :
  - aucun test ne vise ce composant ni ses libellés

### 9. Volume en fermenteur (24 L)

- **Ce qu'on voit** : Libellé, champ chiffré encadré, unité « L ».
- **Composants** : InlineNum (src/ui/FormNav.tsx) sur NumberInput (src/ui/NumberInput.tsx) ; defaultBrewVolume (src/domain/brewEquipment.ts) pour la valeur initiale.
- **Où dans le code** : `src/pages/BrewWizard.tsx:2384`, `src/ui/FormNav.tsx:171`, `src/ui/NumberInput.tsx:62`.
- **Données lues** :
  - volumeL de la recette reprise, ou la capacité par défaut de l'installation (defaultBrewVolume)
- **Données écrites** :
  - setVolumeL : alimente l'évaporation, « Choix pour ce brassin », et le plan d'eau ; n'adapte PAS les ingrédients (seul « Adapter la recette à … L » le fait)
- **États** :
  - vide : valeur inconnue (NaN), requis, bloque l'enregistrement et « Suivant » (erreur wz-volume)
  - minimum 1 L
  - le pavé intégré demandé par `pad` n'est plus ouvert : NumberInput renomme la prop `_pad` et ne s'en sert pas (le clavier du système apparaît)
- **Gestes** :
  - saisie au clavier du système ; virgule française acceptée ; effacement possible sans remise à zéro
- **Tests** :
  - recipeWizardSafety (volume effacé reste manquant, refuse l'enregistrement), brewEquipment, brewWorkspace, uiPerformance

### 10. Durée d'ébullition (60 min)

- **Ce qu'on voit** : Libellé, champ chiffré, unité « min ».
- **Composants** : InlineNum (entier, minimum 0).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2385`.
- **Données lues** :
  - boilMin de la recette, ou 60 par défaut
- **Données écrites** :
  - setBoilMin : alimente l'évaporation et le calcul des IBU
- **États** :
  - vide : inconnu, requis (erreur wz-boil)
  - minimum 0 : le champ accepte 0 minute
- **Gestes** :
  - saisie ; Entrée
- **Tests** :
  - seul tests/unit/hopIndexV4/renvoisEtDemande.test.tsx cite « Durée d'ébullition » (côté houblons v4) ; aucun test de l'assistant ne vise ce champ par son libellé

### 11. « 3 L évaporés — autant d'eau à prévoir en plus dans la cuve. »

- **Ce qu'on voit** : Ligne grise sous les deux champs.
- **Composants** : evaporationHint (BrewWizard.tsx, useMemo).
- **Où dans le code** : `src/pages/BrewWizard.tsx:1789`, `src/pages/BrewWizard.tsx:2387`.
- **Données lues** :
  - volume, durée d'ébullition
  - évaporation de l'installation : boilOffLPerHour (matériel) ou boilOffRatePct du profil de cuverie, 10 % par défaut
- **Données écrites** :
  - rien
- **États** :
  - absente si l'évaporation calculée est nulle ou illisible (volume vide)
  - À SIGNALER : sans taux d'évaporation connu, le code suppose 10 % par heure sans le dire (honnêteté des données : une valeur inventée n'est pas marquée comme telle)
- **Gestes** :
  - aucun
- **Tests** :
  - waterVolumeExplanation, brewingScale (unit)

### 12. Objectif NOLO · ≤ 0,5 %

- **Ce qu'on voit** : Case à cocher dans un cadre arrondi.
- **Composants** : NoloPanel (src/ui/NoloPanel.tsx, 222 lignes), allowEnable, chargé à la demande (lazy) ; noloEquipmentPrompt (BrewWizard.tsx) : remplace le panneau si le matériel n'est pas figé.
- **Où dans le code** : `src/pages/BrewWizard.tsx:2390`, `src/ui/NoloPanel.tsx:110`, `src/pages/BrewWizard.tsx:1808`.
- **Données lues** :
  - recipe.nolo (activé, procédé, matériel disponible, analyse des sucres du moût)
- **Données écrites** :
  - applyFermentationRecipe : active NOLO et peut réécrire fermentation et levure du brouillon
- **États** :
  - décoché : un seul libellé
  - coché : le panneau se déplie (procédé, matériel disponible, sucres du moût, simulateur)
  - chargement : « Chargement de l'objectif NOLO… » (Suspense)
  - si la recette n'a pas de matériel figé : message ambre « Cette recette n'a pas de matériel figé » avec « Adapter à mon matériel actuel »
- **Gestes** :
  - appui sur la case ou son libellé (zone tactile de toute la ligne)
- **Tests** :
  - noloRecipeSolver, noloWizardApply (intégration) ; nolo.test (unit) ; aucun test sur le libellé « Objectif NOLO · ≤ 0,5 % » ni sur le chargement

### 13. Choix pour ce brassin (24 / 30 L · 6 L libres)

- **Ce qu'on voit** : Titre, fraction de remplissage, phrase de repère, champ « Espace libre choisi (%) » et « Remplissage conseillé 24 L ».
- **Composants** : RecipeInstallationChoice (src/ui/RecipeInstallationChoice.tsx, 33 lignes) ; fermenterRecommendation (src/domain/fermenterPlanning.ts) ; equipmentCheck (src/domain/brewEquipment.ts) ; NumberInput.
- **Où dans le code** : `src/pages/BrewWizard.tsx:2393`, `src/ui/RecipeInstallationChoice.tsx:21`, `src/domain/fermenterPlanning.ts:22`.
- **Données lues** :
  - capacité du fermenteur du matériel (equipment.fermenterCapacityL)
  - espace libre de l'installation, ou profil documenté de la levure (YEAST_RECIPE_PROFILES, yeastReferences)
  - plan d'eau de la recette (rinçage à chaud)
- **Données écrites** :
  - recipe.installation.fermenterHeadspacePct (espace libre choisi), spargeExceptionAccepted
  - bouton « Reprendre le conseil de la levure » (n'apparaît que si une valeur a été choisie) : l'efface
- **États** :
  - absent si le matériel n'a pas d'équipement détaillé
  - volume vide : « Volume à renseigner » et « Espace libre inconnu »
  - phrase de repère selon l'origine : choisi à la main / documenté par le fabricant / repère de l'installation / « Repère provisoire : 20 % d'espace libre, à ajuster selon la recette et la levure » (celui de la capture)
  - alerte (role=alert) si le volume atteint la capacité physique ; case « Prévoir le complément avec la bouilloire annexe » si le rinçage dépasse l'habituel
- **Gestes** :
  - saisie du pourcentage ; cocher la case de dérogation ; reprendre le conseil
- **Tests** :
  - brewWizardInstallation (réouverture avec les choix de l'installation), brewWaterPlanning (unit, fermenterRecommendation) ; le composant et ses libellés n'ont pas de test propre

### 14. Matériel du plan : Royal Catering · cuve 45 L

- **Ce qu'on voit** : Une ligne de texte tout en bas de la capture ; dessous (hors capture) des boutons d'adaptation et un résumé.
- **Composants** : ligne et boutons dans BrewWizard.tsx (« equipment-button ») ; BrewEquipmentSummary (src/ui/BrewEquipmentSummary.tsx, 94 lignes) ; adaptRecipeEquipment (src/domain/adaptRecipeEquipment.ts) ; recipeInstallationIssues (src/domain/recipeInstallation.ts).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2394`, `src/pages/BrewWizard.tsx:1798`, `src/ui/BrewEquipmentSummary.tsx:12`, `src/domain/adaptRecipeEquipment.ts:10`.
- **Données lues** :
  - details.brewhouse : profil de cuverie figé dans la recette (calibration importée)
  - config.brewhouses et activeBrewhouseId : le matériel actuel (Firestore, via App)
- **Données écrites** :
  - « Adapter la recette à N L » et « Adapter à mon matériel actuel · nom » : appellent adaptRecipeEquipment puis applyImport : ingrédients, eaux, sels et acide recalculés, retour à l'étape Identité
  - aucune confirmation avant ce recalcul
- **États** :
  - absent sans équipement détaillé
  - libellé « Installation à adopter » si la recette importée n'a pas de matériel figé
  - bouton « Adapter la recette à N L » seulement si le volume diffère de celui du profil
  - bouton « Adapter à mon matériel actuel » seulement si le plan figé diffère du matériel actuel
  - message de statut après adaptation ; erreur « Adaptation impossible. »
  - le texte « · cuve 45 L » de la capture est le nom du profil de cuverie (donnée du brasseur), pas un calcul de l'écran
- **Gestes** :
  - appui sur un bouton d'adaptation : action lourde, une seule touche
- **Tests** :
  - brewEquipment, brewLegacyInstallationApp, brewLegacyInstallationLaunch, waterVolumeExplanation, noloWizardApply, batchScheduling

### 15. Volumes et matériel (encadré récapitulatif sous « Matériel du plan »)

- **Ce qu'on voit** : Sur la capture du dev local (profil « Système 30L ») : cadre arrondi « Volumes et matériel · À revoir », lignes Empâtage à froid, Avec les grains à chaud (0 / 35 L), Rinçage à chaud, Avant ébullition, Fermenteur prévu (30 / …), Espace libre, puis un message rouge. Hors de la capture du brasseur, qui s'arrête au-dessus.
- **Composants** : BrewEquipmentSummary (src/ui/BrewEquipmentSummary.tsx, 94 lignes), le même encadré que sur le jour de brassage ; equipmentCheck, roPackages (src/domain/brewEquipment.ts) ; actualWater (src/domain/brewAssist.ts).
- **Où dans le code** : `src/pages/BrewWizard.tsx:2398`, `src/ui/BrewEquipmentSummary.tsx:38`, `src/ui/BrewEquipmentSummary.tsx:83`.
- **Données lues** :
  - recette en cours (volume, plan d'eau, grains d'empâtage), profil de cuverie et son équipement (capacités, volume utile, espace libre)
  - volume à chaud avant ébullition (recipe.preBoilHotL)
- **Données écrites** :
  - rien : lecture seule
- **États** :
  - absent sans équipement détaillé
  - en-tête « À revoir » (rouge) si une limite est dépassée, « Appoint nécessaire » (ambre) pour une dérogation de rinçage, sinon « Repères prévus »
  - lignes « À renseigner » quand le plan d'eau est absent ; sur une recette neuve la capture montre « 0 L » (plan d'eau à 0, pas « À renseigner ») : à examiner, un zéro y tient la place d'un inconnu
  - messages role=alert : empâtage trop volumineux, collecte au-dessus de la limite, rinçage impossible, fermenteur plein
  - détail replié « Repères et osmosée » : packs d'osmosée, budget de rinçage, limite de cuve provisoire
- **Gestes** :
  - appui sur « Repères et osmosée » : déplie
  - bouton « Prévoir cet appoint » seulement dans le jour de brassage (pas dans l'assistant)
- **Tests** :
  - brewEquipment.test.tsx

### 16. Retour / « Suivant — Malts/sucres » (pied de page, sous le contenu)

- **Ce qu'on voit** : Non visible dans la capture (sous « Matériel du plan », en bas de la page défilante).
- **Composants** : stepActions (BrewWizard.tsx), passé à PageShell comme endActions ; requestCorrection.
- **Où dans le code** : `src/pages/BrewWizard.tsx:2182`, `src/pages/BrewWizard.tsx:2102`.
- **Données lues** :
  - readiness.invalid de l'étape (recipeReadiness, recipeValidation)
- **Données écrites** :
  - change l'étape ; si l'étape a une valeur invalide : validationRequested et focus sur le premier champ en erreur
- **États** :
  - « Retour » désactivé à la première étape
  - les deux désactivés pendant l'enregistrement
- **Gestes** :
  - appui ; Entrée dans le dernier champ du formulaire
- **Tests** :
  - recipeEditing, YeastCandidatePicker (libellé « Suivant »)

### 17. Bouton « + » flottant (Actions rapides)

- **Ce qu'on voit** : Rond noir à droite, en bas, qui recouvre le coin de « Remplissage conseillé ».
- **Composants** : FloatingActions (src/ui/FloatingActions.tsx), monté par App.tsx ; useActionDock, ActionDock (src/pages/PageShell.tsx).
- **Où dans le code** : `src/App.tsx:990`, `src/ui/FloatingActions.tsx:250`, `src/ui/floating-actions.css:6`.
- **Données lues** :
  - route : page plein écran, donc ancre « page » et aucune action propre (action = null)
  - jobs du compagnon (pastille d'attente)
- **Données écrites** :
  - ouvre le menu : facture, vente, recette, brassin, et le compagnon (BrewerChat hideLauncher, libellé « Recette en cours d'écriture »)
- **États** :
  - page plein écran, clavier fermé : flottant en bas à droite par-dessus le contenu ; la fin de la page réserve sa place (data-floating-actions-gap="page") ; clavier ouvert : dans une case de l'en-tête
  - effacé quand une modale ou une feuille est ouverte
  - la rangée Retour / Suivant lui laisse son coin
- **Gestes** :
  - appui : menu d'actions
- **Tests** :
  - FloatingActions.behavior, floatingActionsShellLayout, fix114, AppQuickActionReturn.behavior, brewerNavigation

### 18. Bandeaux d'état au-dessus du contenu (invisibles dans la capture)

- **Ce qu'on voit** : Rien dans la capture : tous conditionnels.
- **Composants** : recipe-draft-status, wz-validation, writeAlert (BrewWizard.tsx) ; section « Brouillon conservé en lecture seule ».
- **Où dans le code** : `src/pages/BrewWizard.tsx:2258`, `src/pages/BrewWizard.tsx:2263`, `src/pages/BrewWizard.tsx:2250`.
- **Données lues** :
  - draftNotice, draftError, validationRequested, saveError, writeError (App)
- **Données écrites** :
  - « Fermer l'erreur » efface saveError et writeError
- **États** :
  - « Brouillon repris sur cet appareil. » : ne s'écrit plus à l'écran (25.10), annoncé aux lecteurs d'écran seulement
  - version enregistrée ouverte : « Le brouillon reste sur cet appareil jusqu'à ta première modification »
  - valeurs à corriger : liste de liens vers les champs
  - erreur d'enregistrement : role=alert, focus pris
  - brouillon d'un format plus récent ou illisible : lecture seule, contenu conservé, aucune action
- **Gestes** :
  - appui sur une erreur : met le focus sur son champ
- **Tests** :
  - recipeWizardSafety, brewWizardDraftFreshness, hopV55WizardCorrectionRelations

## États de l'écran entier

- **Vide (recette neuve)** : Nom et style vides, volume = volumeL du profil de cuverie (30 L à défaut), ébullition 60 min, pas de bandeau Grain/OG/IBU/EBC, pas de « Abandonner ». « Choix pour ce brassin » apparaît si le matériel est détaillé.
- **Recette reprise (modifier ou dupliquer)** : Titre de coque « Modifier « nom » » ; tous les champs repris de la recette ; si elle n'a pas de matériel figé : « Installation à adopter ».
- **Brouillon repris (cas de la capture)** : Message annoncé aux lecteurs d'écran seulement ; « Abandonner » visible dans l'en-tête ; bandeau présent si le brouillon a des ingrédients.
- **Version enregistrée ouverte, brouillon mis de côté** : Message visible « Version enregistrée ouverte. Le brouillon reste sur cet appareil jusqu'à ta première modification. » ; pas de « Abandonner ».
- **Erreur** : Validation (nom, volume, ébullition manquants) : encadré rouge, liens vers les champs. Écriture refusée : encadré role=alert avec « Fermer ». Brouillon d'un format plus récent : lecture seule.
- **Hors ligne** : Aucune logique propre à l'écran. Le brouillon est dans localStorage, les données du matériel et des styles viennent du cache Firestore/IndexedDB, le catalogue de styles est dans le code. Seuls l'import par IA et le compagnon ont besoin du réseau ; l'import se replie sur le lecteur local, le compagnon n'est pas monté en développement local (localOnly).
- **Chargement** : Suspense du panneau NOLO (« Chargement de l'objectif NOLO… »), de l'autocomplétion, et de la page entière (« Ouverture de la page… »).

## Constats utiles à la refonte

- Capture du dev local (390 × 844, profil de cuverie « Système 30L », recette neuve) : l'écran rend les mêmes blocs que la capture du brasseur, mais un volume par défaut de 30 L dans un fermenteur de 30 L ouvre l'écran avec deux messages rouges (« Le volume atteint ou dépasse la capacité physique du fermenteur » et « Le volume atteint la capacité totale »). Chez le brasseur, 24 / 30 L : rien de rouge. Le défaut d'une recette neuve est le volumeL du profil (defaultBrewVolume : ici 30 L), pas le remplissage conseillé (24 L, affiché juste à côté).
- Sous « Matériel du plan », un encadré « Volumes et matériel » (BrewEquipmentSummary) double une partie de « Choix pour ce brassin » (remplissage du fermenteur, espace libre, même alerte).
- La capture est en thème clair, avec l'IBU en plage (« ~93 ») : le drapeau hopV4 est allumé en production ; l'étape Houblons v4 y est donc visible.
- Les blocs sont rendus dans cet ordre : Coller · Identité (nom, style, repères, volume et ébullition, évaporation, NOLO, choix pour ce brassin, matériel du plan). Le bandeau Grain/OG/IBU/EBC est au-dessus de tout, hors de la carte.
- Le « + » flottant recouvre le coin droit de « Remplissage conseillé » à cet endroit du défilement ; la page réserve sa place en fin de contenu seulement.
- Trois composants de l'écran n'ont aucun test qui les vise : BrewingStyleDetails (Repères du style), RecipeInstallationChoice (Choix pour ce brassin) et ThemeToggle.
- Un mot de la capture n'est pas un état du code : « 3 L évaporés » dépend d'un taux d'évaporation que le code remplace par 10 % quand l'installation n'en donne pas, sans le marquer.
- Le changement de style réécrit silencieusement le profil d'eau tant qu'il suit le style (étape Eau) ; « Proposer l'empâtage » remplace les paliers sans confirmation ; « Adapter à mon matériel actuel » recalcule ingrédients, eaux, sels et acide en un appui.
- Le pavé numérique intégré (`pad`) n'existe plus : NumberInput accepte la prop mais ne l'utilise pas ; le clavier du système s'ouvre.

## Tests de toute la zone, par import ou par libellé

- `tests/integration/AppRoutePile.test.tsx`
- `tests/integration/brewEquipment.test.tsx`
- `tests/integration/brewWizardColdContactEvidencePersistence.test.tsx`
- `tests/integration/brewWizardDraftFreshness.test.tsx`
- `tests/integration/brewWizardFirstSaveSourceContract.test.tsx`
- `tests/integration/brewWizardHopV55.test.tsx`
- `tests/integration/brewWizardHopV55FutureDraft.test.tsx`
- `tests/integration/brewWorkspace.test.tsx`
- `tests/integration/d100AiErrorsVisible.test.tsx`
- `tests/integration/dataEntry.test.tsx`
- `tests/integration/inputProtection.test.tsx`
- `tests/integration/noloRecipeSolver.test.tsx`
- `tests/integration/noloWizardApply.test.tsx`
- `tests/integration/recipeImportRoundTrip.test.tsx`
- `tests/integration/recipeWizardSafety.test.tsx`
- `tests/integration/stoutWaterProfile.test.tsx`
- `tests/integration/textInput.test.tsx`
- `tests/integration/uiPerformance.test.tsx`
- `tests/integration/waterVolumeExplanation.test.tsx`
- `tests/integration/yeastCandidateWizardPersistence.test.tsx`
- `tests/integration/yeastTransferUi.test.tsx`
- `tests/unit/brewingScale.test.ts`
- `tests/unit/hopV55FutureRecipeDraft.test.ts`
- `tests/unit/nolo.test.ts`
- `tests/unit/recipeDiagnostic.test.ts`
