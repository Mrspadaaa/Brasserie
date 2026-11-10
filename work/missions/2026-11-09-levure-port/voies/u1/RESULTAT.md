OK partiel — coque des quatre vues + Ma levure (l5b) + conduite avec « + » et × + dose au choix (#132) + banc ; reste à rejouer : captures finales, puces proposées de d1, pied à 390, Comparer (n)

## Ce qui est porté
- `src/ui/etapeLevure/EtapeLevure.tsx` : la coque. Segment « Ma levure · Chercher · Comparer · Suggérer » (s7a), barre « Annuler le changement », vue choisie. Chercher, Comparer, Suggérer reçoivent les `PropsVue` ; choisir revient sur Ma levure.
- `MaLevure.tsx` (l5b) : ligne de la levure et dose en plage de sachets (`yeastPitching.ts` : US-05 à 30 L = « 2–3 sachets », 15–24 g), bande FG + alcool en plage · °C fiche/conduite · floculation, effets en jauges (niveau publié) ou mot ou nombre + nature (« 11 g/L · mesure fabricant ») ou « ⌕ non documenté » (touché : ouvre le repli Fiche, recherche IA non lancée), champ « Changer de levure » + puces (stock, ↺ précédente, Hors catalogue), puis la conduite.
- `Conduite.tsx` : le graphe de l'app (`FermentationTemperatureChart`), plage de la levure en bande, légende « US-05 · 18–26 °C », un « + » sur chaque frontière (J0, bascules, fin), un × sur le palier touché (absent s'il ne reste qu'un palier). Ajout/retrait = `insertFermentationTimelineStep` / `removeFermentationTimelineStep` (ceux de `YeastRecipePlan.tsx` 360-372), non réécrits. Un palier ajouté reste « ? °C · ? j » (rien inféré), la recette n'est écrite que programme complet (`applyYeastRecipeDesign`, comme « Appliquer au brouillon »).
- `dose.ts` + `BrewWizard.tsx` (`choisirLevure`) : #132, voir plus bas. `domaine.ts` : lit l'API de d1 (`src/domain/levure/index.ts`, trouvée par `import.meta.glob`), lecture provisoire de repli si absente. `effets.ts` : couleurs = table des familles des houblons (`familyTokens.ts`, esters→tropical, phénols→épicé, thiols→melon, terpènes→pépins, sucres restants→terreux).
- `BrewWizard.tsx` : bloc `step === 'levure'` ; états `vueLevure`, `levuresComparees`, hook `useYeastSupply` ; pied « Comparer (n) » ajouté dans `stepActions` (entre Retour et Suivant, visible dès qu'une levure est posée). `App.tsx` : banc `?dev-local&etape=levure` (`&recette=vide`), `apercuDev.ts` (US-05, OG 1,066, 30 L, 19 °C, 4 paliers).

## Rien ne se perd (fonction actuelle → place nouvelle)
| Fonction de l'ancienne étape | Place |
|---|---|
| stock | puces de Ma levure (3 en stock) + repli « Mon stock ou saisie libre » (YeastIngredientPicker) |
| saisie libre / hors catalogue | puce « Hors catalogue » → même repli |
| offres, produit exact, « Corriger la fiche produit » | repli « Produit exact et offres » (YeastPitchingPanel part=supply) |
| Corriger la fiche | repli « Fiche » (YeastRecipeDossier) |
| recherche IA de la fiche | même repli (RecipeAutoComplete), ouvert par « ⌕ » ; jamais lancée seule ; pour une autre levure : l'atelier avec `cible` |
| ensemencement, starter, quantité | repli « Dose, ensemencement et starter » (YeastPitchingPanel part=pitching + YeastRecipeQuantity) |
| objectifs (cible de la bière) | repli « Objectifs » (YeastBeerTargetPanel) |
| dossier, repères, sources | repli « Repères et sources » (YeastStrainDetails) |
| annuler le changement | barre « Annuler » sous le segment |
| essai de conduite, profil de fermentation + « Proposer une conduite », comparaison d'offres, fiche catalogue partagée, écarts du brouillon | repli « Atelier complet » = `YeastRecipeChoice` inchangé (monté à l'ouverture) |
| mode NOLO | inchangé : le wizard garde `YeastRecipeChoice` + `NoloPanel` |
Aucun ancien composant supprimé. `YeastRecipeChoice`, `YeastCandidatePicker`, `YeastChoiceComparison`, `YeastRecipePlan`, `YeastRecipeWorkbench`… restent dans le dépôt ; ceux qui ne servent plus que dans l'atelier : YeastCandidatePicker, YeastChoiceComparison (le choix passe par Chercher). Aucun test d'ancien composant désactivé : `YeastRecipeChoice.test.tsx` passe tel quel.

## #132 (L13)
`tests/integration/etapeLevure/etapeDose.test.tsx` : rouge avant (import de `dose.ts` introuvable ; sur HEAD le choix faisait `delete next.yeast.qty` sans rien recalculer), vert après : produit unique de la référence retenu, moût estimé au volume de la recette (30 L), plage 2–3 sachets, la dose de l'ancienne levure (3) non reprise, plage jamais remplacée par son milieu, une plage réduite à un nombre est posée, sans produit documenté ni dose ni 0.

## Coquilles posées pour u2
`src/ui/etapeLevure/Comparer.tsx` et `Suggerer.tsx` (« Vue à venir. »), à u1 jusqu'à livraison de u2 (Chercher.tsx est déjà celui de u2).

## Tests
- `npx tsc --noEmit -p .` : aucune erreur dans mes fichiers ; restent des erreurs d'autres voies (`src/ui/identite/ChampNombre.tsx`, `src/services/hopV55/workspaceRepository.ts`).
- `npx vitest run tests/integration/etapeLevure tests/integration/YeastRecipeChoice.test.tsx --maxWorkers=2` : **Test Files 4 passed (4) · Tests 97 passed (97)** (relancé après les retouches puce ↺ et légende ; `Test Files 4 passed (4)`, dont les 15 tests de `vues.test.tsx` de u2).
- Captures : `voies/u1/captures/` (390 et 1280, clair et cave : repos, conduite, « + » touché, palier 2 touché, × touché, sans levure, ⌕ touché), script `capturer.mjs` ; sonde du choix `sonde-choix.mjs`. Ouvertes et lues : repos 390 clair, conduite, « + », sans levure 390 clair, ⌕ 390 clair, repos 1280 clair, repos 390 cave. Journal : 0 erreur de page, 0 requête bloquée (avant les dernières retouches).

## Écarts à la maquette
- Légende de la plage : « US-05 · 18–26 °C » (nom court de la levure) — corrigé après la dernière capture.
- Puces proposées : stock + ↺ précédente (levure d'avant le dernier changement). Les « levures proposées » de d1 ne sont pas branchées (pas d'appel à l'API de suggestion ici).
- × de la carte = « retirer la levure de la recette », annulable : lecture à confirmer (la NOTE l5b ne décrit que le × des paliers).
- Alcool en plage ajouté sous la FG (demande de la voie) ; pas de tick sur la piste FG.
- Phrases d'aide du graphe masquées visuellement (lues par le lecteur d'écran).
- Un « + » au milieu rend « ? j » les durées suivantes dans le graphe (comportement du graphe de l'app pour une durée inconnue) ; le champ du palier à compléter est posé au-dessus du graphe.
- 1280 : étape limitée à 880 px.

## À rejouer (non fait, plafond de tours)
- Recapture finale des 4 formats × 2 thèmes après la puce ↺ et la légende ; ouvrir `5-chercher-touche-*` et `4-sans-levure-*` en cave et à 1280 (déjà capturés, non tous ouverts). Dernier lancement du banc (sonde) : la page n'a pas chargé (cause non lue : journal du serveur dans `%TEMP%/with-server-*/serveur-1-5656.log`) ; à rejouer avant toute conclusion.
- Pied « Retour · Comparer (n) · Suivant — Paliers » à 390 : non vérifié à l'image (le FAB « + » est géré par `PageShell`, qui laisse son coin).
- Choix réel d'une levure par le wizard (puce, Chercher) + barre « Annuler » : non joué dans Chrome (sonde écrite, DOM du sélecteur à adapter : bouton « Ouvrir la liste »).
- Oval des « + » (24×26 px mesurés à l'œil) : à mesurer.
- BUGS-levure.md : TL-14 et GE-NOTE-5 non traités.

DÉCISION À PRENDRE : phénols de SafAle US-05 affiché « phénolique · estimé » par `valeurAxe` de d1 (la maquette dit « non documenté », US-05 est POF−) : à faire vérifier par d1 (descripteur lu dans `estimeDescripteur`).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : le Bash du poste perd aussi les barres inverses dans les heredocs `node - <<'EOF'` qui patchent des regex (vu : `\s` devenu `s`) ; écrire ces patchs avec Write/Edit.

## Tests d'intégration rouges de l'ancienne étape (message du pilote, 3e tour)
Lancement : `--reporter=dot` vers `voies/u1/tests-levure*.txt`, sur les 59 fichiers de `tests/` qui nomment le wizard ou un composant Yeast*.
- Avant : **Tests 34 failed | 623 passed | 1 skipped (658)**, 5 fichiers (YeastBeerTarget, brewWizardFirstSaveSourceContract, recipeAiWorkflow, recipeEditing, yeastCandidateWizardPersistence). Cause unique : le geste a changé de place, l'ancienne étape (`YeastRecipeChoice`) n'est plus l'écran de l'étape, elle est dans le repli « Atelier complet » de Ma levure (fermé).
- Corrections faites (rien supprimé, rien désactivé) :
  1. `BrewWizard.tsx` : `EtapeLevure` suit `syncWizardPanels` comme les autres panneaux (rendu synchrone en test).
  2. `tests/helpers/wizard.ts` (`allerEtape`) : après un clic sur « Levure », ouvre le repli « Atelier complet », comme le brasseur le toucherait (l'ancien composant est monté, ses tests le rejouent).
  3. `EtapeLevure.tsx` : la barre « Annuler » de la coque se masque quand l'atelier est ouvert (il porte la sienne ; deux boutons « Annuler le changement » faisaient doublon).
- Après : 34 -> **7 rouges**, `recipeEditing.test.tsx` (2) et `yeastCandidateWizardPersistence.test.tsx` (5). Ligne de la dernière passe (recipeEditing + yeastCandidateWizardPersistence + etapeLevure) : **Tests 7 failed | 64 passed (71)**. Les 3 autres fichiers : tous verts.
- Les 7 restants entrent dans l'étape Levure sans passer par `allerEtape` (retour d'une autre étape par un bouton, reprise d'un brouillon) : le repli est alors fermé. À faire (non fait, plafond de tours) : soit ouvrir le repli à ces endroits (`tests/integration/yeastCandidateWizardPersistence.test.tsx` lignes 206, 349, 402, 419, 451 ; `recipeEditing.test.tsx` 519 et 587, « Quantité de levure » : le repli « Dose, ensemencement et starter » ou l'atelier), soit garder le repli « Atelier complet » ouvert quand le brouillon repris le demande. Aucun de ces 7 n'est « écarté » : l'ancien composant est monté, le geste doit passer.
- Rien n'est écarté. Les 24 du coordinateur sont inclus dans ces 34 (le compte diffère : mon lot couvre 59 fichiers).

## Les 7 restants : réglés (4e tour)
- **Quantité de levure (2, `recipeEditing.test.tsx` 519 et 587)** : le champ existe dans Ma levure, repli « Dose, ensemencement et starter » ; ce n'est donc pas un manque du port, mais le retour de validation (quantité refusée, le wizard ramène à l'étape) ne l'y ouvrait pas. Corrigé dans le produit, pas dans le test : `EtapeLevure` reçoit `doseInvalide` (`fieldError('wz-yeast-qty')`) et ouvre le repli « Dose » sur le champ à corriger. Les deux tests passent inchangés.
- **Reprise d'un brouillon (5, `yeastCandidateWizardPersistence.test.tsx`)** : le repli n'est pas rouvert par le produit (règle n° 1 : le brasseur voit l'écran choisi). Les tests visent des gestes que l'atelier sert encore (champ « Chercher une autre levure », fiche M20, « État du choix de levure », message « fiches candidates invalides ») : ils l'ouvrent eux-mêmes, par `ouvrirAtelierLevure(true)` (`tests/helpers/wizard.ts`, le même assistant que `allerEtape`), après chaque `wizard(...)` qui reprend ou rouvre un brouillon (7 appels). Aucun test écarté, aucun supprimé.
- Fichiers touchés : `tests/helpers/wizard.ts` (`ouvrirAtelierLevure`), `tests/integration/yeastCandidateWizardPersistence.test.tsx`, `src/ui/etapeLevure/EtapeLevure.tsx` (`doseInvalide`), `src/pages/BrewWizard.tsx` (une prop).
- **Tests** (`--reporter=dot`, `voies/u1/tests-levure-5.txt`) : `recipeEditing` + `yeastCandidateWizardPersistence` + `etapeLevure` : **Test Files 6 passed (6) · Tests 71 passed (71)**. Les quatre autres fichiers de l'ancienne étape (`tests-levure-6.txt` : YeastBeerTarget, brewWizardFirstSaveSourceContract, recipeAiWorkflow, YeastRecipeChoice) : **Test Files 4 passed (4) · Tests 190 passed (190)**.

## Verdict du critique, Ma levure L1 à L7 (5e tour)
| Point | Fait |
|---|---|
| **L1, L2** (bloquants) | Test rouge d'abord (`etapeCoque.test.tsx`, deux frontières : entre les paliers 2 et 3, et sur la fin J12 ; échouait : pas de boîte, graphe vidé, « Calendrier partiel »). Corrigé dans le graphe lui-même, en option `inconnuDessine` de `FermentationTemperatureChart` (défaut inchangé pour le plan et l'atelier) : un palier aux valeurs inconnues est une boîte pointillée « ? °C · ? j » à largeur nominale (`NOMINAL_DAYS` 2,37, jamais écrite dans le programme : un geste la restaure inconnue), les suivants restent dessinés, « fin ? », jours après l'inconnu « J? », aucun point à 0 °C pour un inconnu, aucun paragraphe (« Calendrier partiel », cartes de texte, « programme à compléter » retirés ; la phrase du geste reste pour le lecteur d'écran, « Annuler » reste visible). × posé sur la boîte (maquette cadre 6). |
| **L3 + M4** (bloquants) | `src/ui/etapeLevure/useRechercheDonnee.tsx` : crochet partagé. « ⌕ » LANCE `lookupYeastSheet` (l'enrichissement IA existant), « recherche… · n/20 » dans la cellule (compteur du jour de Zurich, `PLAFOND_JOUR` = 20, D378 ; au plafond rien ne part et la cellule le dit), résultat « à confirmer » + « Retenir » (écrit le fait dans la recette, sa levure seule) / « Écarter » ; la vue reste (Comparer reste Comparer). Passé à u2 par `onChercherDonnee` ; **les cellules de Comparer et Suggérer doivent afficher l'état par `<CelluleRecherche levureId axe />` ou `useEtatRecherche(levureId, axe)`** (même fichier ; fournisseur posé par la coque) : non fait chez u2, `props.ts` n'a pas bougé. Tests (recherche injectée, jamais Gemini) : lancement + « 1/20 », « à confirmer », « Retenir », plafond, depuis Comparer. L'ancien repli « Fiche » ne s'ouvre plus par « ⌕ ». |
| **L4** | Puces sous « Changer de levure » : 2 levures vendues en CH · FR · DE proposées par l'API de d1 (`chercher('', {}, repères)`, rang `ici`), le stock, ↺ la précédente, « Hors catalogue » (au banc : Pomona, Verdant IPA). |
| **L5** | Bande de la levure en deux pointillés ocre 18 et 26 sur tous les paliers de fermentation (primaire ou dans la plage ±2 °C), même trait que la légende ; plus de bloc gris étiqueté. |
| **L6** | « sèche · Fermentis · 15–24 g ». Légende « US-05 · 18–26 °C ». |
| **L7** | `PageShell` : prop additive `endActionsCollant` (défaut inchangé, la rangée suit toujours le contenu ailleurs, T12b) ; l'étape Levure la pose : pied collé au bas à 390 et 1280, réserve de 4,75 rem à droite, « Suivant — Paliers » ne touche plus le +. « Comparer (n) » au pied : logique inchangée, non rejouée à l'image (aucune levure posée dans Comparer au banc). |
Fichiers touchés hors `etapeLevure/` (additifs, relire avant commit) : `src/ui/FermentationTemperatureChart.tsx` (option `inconnuDessine`, + les changements d'une autre voie sur les étiquettes déjà dans ce fichier), `src/pages/PageShell.tsx` (`endActionsCollant`), `src/pages/BrewWizard.tsx`, `tests/helpers/wizard.ts`.
Captures reprises (`voies/u1/captures/`, 390 et 1280, clair et cave, 32 images + `journal.json`, script `capturer.mjs`) : repos, conduite, « + » entre / sur la fin, palier 2 touché, × touché, sans levure, « ⌕ » touché (« recherche… 1/20 » en vol : la réponse de l'échec est retardée de 6 s au banc, le réseau étant bloqué). Ouvertes et lues : repos 390 clair et cave, « + » entre et fin 390 clair, « + » entre 1280 cave, × 390 cave, ⌕ 390 clair puis 1280 clair, comparées aux maquettes l5b c1, c2, c6. Les deux autres jeux (sans levure, palier 2 touché) ont été lus au tour précédent et n'ont pas changé de code.
- **tsc** : aucune erreur dans mes fichiers. **Tests** (`--reporter=dot`, `tests-levure-9.txt`) : mes deux fichiers `etapeCoque` + `etapeDose` : **Test Files 2 passed (2) · Tests 19 passed (19)** ; `tests/integration/etapeLevure` entier (`tests-levure-7.txt`, avant les derniers changements de u2) : Test Files 5 passed (5) · Tests 48 passed (48). Dernier passage groupé (`tests-levure-8.txt`) : 11 rouges hors de mes fichiers : 10 dans les tests de Suggérer de u2 (`vues.test.tsx`, `vues-corrections.test.tsx`, `vues-reel.test.tsx` : travail en cours de u2, fichiers qu'elle réécrit) et 1 dans `recipeEditing.test.tsx` (« lets the brewer explicitly update a saved source snapshot » : analyse d'eau « Analyse corrigée », voie b-assistant, étranger à la Levure).

## Second verdict (N1, le seul point qui touche mes fichiers)
- **N1 (bloquant, 390)** : la cellule `CelluleRecherche` était rognée (« 1/2 », texte coupé, « OK » hors cadre). Corrigé dans le composant partagé (`useRechercheDonnee.tsx`) : classe `lv-rech` (flex-wrap, `min-width: 0`, `max-width: 100%`, retour à la ligne, `overflow: visible`, aucune largeur fixe), utilisée pour « recherche… · n/20 », « à confirmer · Retenir · Écarter » et l'issue d'échec ; dans Ma levure la cellule porte alors toute la largeur de la carte (ligne sous la bande, `lv-cel-pleine`) ; dans Comparer elle s'étire en hauteur dans sa colonne (aucun changement chez u2).
- Joué à 390, clair et cave, `captures-recherche/` (12 images, `capturer-recherche.mjs`, `journal-recherche.json` : aucune cellule ne dépasse l'écran ni n'est coupée, mesure `scrollWidth` et `right`) : Ma levure en vol « recherche… 1/20 », « à confirmer » (floculation), une ligne d'effet en vol « 2/20 », issue « Service IA momentanément indisponible. OK » ; Comparer en vol et « à confirmer ». Ouvertes et lues : comparer « à confirmer » clair, Ma levure « à confirmer » cave, Ma levure issue clair, Comparer en vol cave.
- « À confirmer » est SIMULÉ au banc : `?dev-local&etape=levure&recherche=simulee` (`rechercheSimulee` dans `apercuDev.ts`, valeurs marquées « simulé », aucun appel IA ; branchée seulement sous `import.meta.env.DEV`, absente de `dist/`).
- Les autres points non bloquants du verdict (C2, N2, N3, N4, N6) sont chez u2 et d1 : aucun ne touche mes fichiers.
- Tests : `etapeCoque` + `etapeDose` (`--reporter=dot`, `tests-levure-10.txt`) ; tsc sans erreur dans mes fichiers.

## 5 régressions de la suite complète (6e tour)
- **`yeastPitchingWizardOwnership.test.tsx` (3 tests, périmés)** : ils entrent par le fil « Levure » puis jouent l'ancienne étape (région « Moût à ensemencer », `.yc-personal-fold`, sélecteur de souche), qui vit maintenant dans le repli « Atelier complet ». Réécrits sur la nouvelle place : `ouvrirAtelierLevure(true)` après chaque clic sur « Levure » (même assistant que `allerEtape`). Le geste et les attentes (moût mesuré conservé, produit et lot non repris, effacement) sont inchangés.
- **`etapeHoublons.test.tsx` « banc … reste derrière import.meta.env.DEV » (périmé dans sa forme, pas dans son but)** : il lisait 400 caractères avant `q.get('etape') !== 'houblons'`, et mon banc levure s'était inséré entre le verrou et cette ligne. Réécrit pour les DEUX bancs, sans affaiblir : un seul verrou `if (import.meta.env.DEV) { if (!isDevLocal || !isDataReady || apercuOuvert.current) return;` (exactement une occurrence) ; les deux bancs (`etape === 'levure'` et `etape !== 'houblons'`) sont lus dans le même effet, après lui ; `./ui/etapeLevure/apercuDev` n'est importé qu'une fois, depuis ce bloc ; la recherche simulée n'est lue côté étape que sous `import.meta.env.DEV`.
- **`etapeCoque.test.tsx` « ⌕ non documenté lance la recherche »** : le test dit vrai ; non reproduit ici (vert à chaque passage, y compris la suite avec les autres fichiers). Cause probable : le compte du jour (D378) vit dans `localStorage`, partagé entre fichiers d'un même lot. Durci : `beforeEach` vide `localStorage` (le test ne dépend plus de l'ordre ni d'un compte laissé par un autre).
- Rejeu (`tests-regressions.txt`) : `tests/integration/etapeLevure` + `yeastPitchingWizardOwnership` + `etapeHoublons`, deux passages : **Test Files 8 passed (8) · Tests 69 passed (69)**. Aucun test écarté.

## Verdict final : L-a et L-b
- **L-a** : la cellule d'issue dit un texte court (« IA indisponible · OK », « rien de publié », « 20/20 aujourd'hui », « recherche impossible ») ; la phrase complète va dans le `title`. Mots jamais coupés : `overflow-wrap: break-word` (un mot plus long que la ligne seulement peut se casser), y compris dans les lignes d'effets (règle plus spécifique que l'ancienne `anywhere`).
- **L-b** : dans Ma levure, la cellule pleine largeur de la floculation commence par le nom de la donnée : « floculation · recherche… 1/20 », « floculation · moyenne … à confirmer », « floculation · IA indisponible · OK » (prop `libelle` de `CelluleRecherche`, partagée ; les lignes d'effets gardent leur étiquette à gauche).
- Tests ajoutés : issue courte + title, libellé de la floculation (vol puis « à confirmer »). Captures 390, clair et cave, `captures-recherche/` (12, `journal-recherche.json` : aucune cellule coupée ni hors écran), ouvertes : issue clair, en vol cave, ligne d'effet en vol + floculation « à confirmer » clair.
- Rejeu (`tests-final.txt`) : `tests/integration/etapeLevure` + `yeastPitchingWizardOwnership` + `etapeHoublons`.

## Défaut en ligne : « ? dose à saisir » sur « ZZ TEST — Recette » (7e tour)
- **Fixture** : `recetteApercuAncienne()` (`apercuDev.ts`, banc `etape=levure`) : Double IPA 24 L, US-05 sans `form`, `qty: 0` enregistrée, sans `pitching`, fermentables sans potentiel (le moût ne s'estime pas), DI 1,085 lue par le moteur.
- **Tests rouges d'abord** : `etapeDose.test.tsx` (3 : produit retenu sans forme, DI du moteur, rien d'inventé sans DI) et `etapeCoque.test.tsx` (Ma levure montre la plage, pas « 0 » ni « dose à saisir »). Rouges avant (« ?dose à saisir » reproduit), verts après.
- **Cause** : `estimatePitchingWort` n'estime le moût que depuis les fermentables (potentiels, rendement) ; sans eux, pas de moût, donc « Non calculable ».
- **Correction** (`dose.ts`) : à défaut, le moût vient du volume de la recette et de la DI du moteur (celle du bandeau : `evaluation.projection.og`, ou `ogTarget`), marqué « estimation de la recette » ; sans volume ou sans DI, rien (jamais 0, jamais inventé). Le produit unique de la référence est retenu même sans `form` (il la pose). `doseDeLaLevure` / `doseApresChoix` reçoivent la DI du moteur en 3e/4e paramètre (facultatif : Comparer et `YeastRecipeHeading` appellent comme avant).
- **qty 0** : jamais lue comme une dose (Ma levure ne montre que `qty > 0`) ; elle affiche la plage conseillée (24 L : « 2 sachets · sèche · Fermentis · 12–19 g »). « Dose à saisir » ne s'écrit que sans conseil calculable.
- Rejeu (`tests-dose-ancienne.txt`) : `tests/integration/etapeLevure` + `YeastRecipeChoice` + `yeastPitchingWizardOwnership` : **Test Files 8 passed (8) · Tests 129 passed (129)** ; tsc sans erreur dans mes fichiers.
