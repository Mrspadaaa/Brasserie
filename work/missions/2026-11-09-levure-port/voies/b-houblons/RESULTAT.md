OK — 28 bugs : 8 corrigés (dont 2 en partie, atelier V5.5 compris), 7 déjà corrigés testés, 6 à trancher, 5 non jouables, 2 doublons ; captures 390 et 1280 vues.

Zone : étape Houblons, outils, index. Possède : `src/ui/hopIndex/**`, `src/domain/hopIndex/**`, `src/domain/hopDecision/**`. Les écrans de l'atelier V5.5 vivent dans `src/ui/hopV55/**` et `src/services/hopV55/**` (hors Possède) ; la carte de Stocks dans `StocksTab.tsx` (hors Possède).

| id | issue | preuve | fichiers |
|---|---|---|---|
| TE-25 | corrigé | `tests/unit/bHoublons/bilanDoses.test.tsx` : 25 g dans 30 L → « 0,83 g/L », 125 g → « 4,17 g/L », jamais « (25/6 g/L exacts) ». Rouge avant (« 0,833 g/L (5/6 g/L exacts) »), vert après. `HopRecipeGuide.test.tsx` #75 aligné. | `src/ui/hopIndex/HopRecipeSnapshot.tsx` |
| BR-41 | corrigé | idem : 2,5 g/20 L → « 0,13 g/L » ; 0,004 g → « < 0,1 g · < 0,01 g/L », plus « 0 g · 2E-4 g/L (0,0002 g/L exacts) ». Une masse 0 reste « 0 g ». | `HopRecipeSnapshot.tsx` |
| MV-50 | corrigé | même fichier de test : style « 16D » non reconnu → « 16D · style non reconnu » à côté de « Plage du style non identifiée ». Style reconnu et style vide inchangés. | `HopRecipeSnapshot.tsx` |
| PI-NOTE-3 | corrigé | `tests/unit/hopIndexV4/` : 111 fichiers, 1016 tests verts à `--maxWorkers=2` ; le plus lent 8,0 s (palierDryhop g2a) et 7,6 s (apportCDefaut) pour 15 s de `testTimeout` : ils débordaient sous suite chargée. Délai de 60 s posé sur ces deux tests de calcul (pas des tests de durée). Rouge avant 4f063301 : non vérifié, sans objet (verts aujourd'hui). | `tests/unit/hopIndexV4/palierDryhop.test.ts`, `apportCDefaut.test.ts` |
| PI-NOTE-2 | déjà corrigé (survie vérifiée) | `tests/unit/bHoublons/alphaConfirmeSurvie.test.ts` : `alphaConfirme` 80 revient de `saveRecipeConfirmed` (relecture serveur), de `normalizeRecipe`, de `captureSnapshot`, et du patch v4 quand seule la dose change ; il n'est pas reporté sur un houblon remplacé (voulu). `firestore.rules` : pas de liste de champs sur `recipes`. | aucun fichier source |
| BR-39 | déjà corrigé | VI-11 (48a02ce7) : le segment actif ne porte plus `bg-ebc-straw` (qui blanchissait le texte). `tests/unit/bHoublons/contrasteMoment.test.ts` : `.hop-stage-tabs` (et `.hop-flavor`, `.hop-tool-tabs`) ≥ 4,5:1, clair et cave (≈ 9,6:1 au clair) ; le test échoue sur 48a02ce7^ (classe `bg-ebc-straw` présente). | aucun |
| BR-40 | déjà corrigé | `pickerOptions.ts` (97a4c6cd, TE-23) : « 12,5 % α », jamais « AA » ; test `tests/unit/a1defauts/houblons-bornes.test.ts:150`. | aucun |
| BR-109 | déjà corrigé | 9c5b20d5 (08.11) : un seul bouton « Explorer les houblons dans V5.5 », sans carte de trois lignes (`StocksTab.tsx`). | aucun |
| BE-80 | doublon de BR-109 | | |
| BE-79 | déjà corrigé | 9c5b20d5 : champ fautif marqué. `tests/integration/bHoublonsDejaCorriges.test.tsx` : fiche vide → « Indique le nom de la variété. », dégustation vide → « Indique la bière dégustée. », plus de « Identité de fiche houblon invalide » ni « Dégustation invalide ». | aucun |
| BE-78 | déjà corrigé | fa57b7b9 (BR-107) : `installPack` annonce « N fiche(s) ajoutée(s) » ou « Rien à ajouter ». Test : les trois boutons (hops-json, HopDatabase, amertume à cru) + le cas zéro. Vérifié par rôle `status` ; non vu en navigateur. | aucun |
| BR-110 | à trancher : un seul nom et un seul contenu pour l'écran aux deux largeurs ? Aujourd'hui « Index houblon » + phrase au 1280 seulement, phrase en ligne de comptes au 390. Le « sans séparateur » est réglé (pastilles séparées « 137 références », « 1 lot », « 1 analysé », testé) ; le titre est un choix de forme du brasseur. | | `HopIndexPanel.tsx` |
| BE-81 | doublon de BR-110 | | |
| RO-4 | non jouable (non reproduit côté voie) | `tests/integration/bHoublonsRO4.test.tsx` : bilan, atelier de recette et guide aromatique à 99 999 g (α 100 %, 2 lignes) se rendent en 4 ms, 325 ms au total pour les deux. Le gel des captures ne vient pas de ces composants ; reste le reste de l'étape (atelier V5.5, hors voie) ou l'outil de capture. | aucun |
| BT-NOTE-2 | déjà corrigé | D368 : `scripts/check-build-flags.mjs` refuse un `dist` sans `VITE_HOP_V4:"on"` ; `HopToolLayer` est allumé en ligne par ce drapeau. Un build sans la variable (dev) reste éteint par construction (`flags.ts`). | aucun |
| TE-27 | à trancher : retirer l'atelier V5.5 de l'étape Houblons du chemin sans drapeau v4 (`BrewWizard.tsx` l. 2611) est un choix de forme, dans un fichier hors voie ; avec `VITE_HOP_V4=on` (production, D368) l'étape est déjà celle de la maquette, sans atelier. | | |
| TE-49 | à trancher : premier plan de la fiche Nelson Sauvin (quoi garder, quoi replier, quels mots : « Forme non précisée », « Classe fabricant », « 3MH cystéinylé », « Confiance faible » ×7). Choix de goût, à montrer en mini maquettes (L24). | | |
| TE-52 | à trancher : vocabulaire de « Sources et modèles » (« Installer les conventions initiales manquantes », « Documenter un modèle »…) : quels mots, quoi replier (`HopKnowledgePanel.tsx`). Goût du brasseur. | | |
| TE-53 | à trancher : prose du bandeau de l'atelier V5.5 (`src/ui/hopV55/Page.tsx`, hors Possède) ; goût. | | |
| TE-54 | à trancher : idem TE-53 (Décider / Explorer / Historique, `src/ui/hopV55/**`). | | |
| BR-38 | corrigé en partie : message lisible ; cause d'origine non reproduite | `workspaceShapeProblem` (`tests/unit/bHoublons/atelierV55.test.ts`, 11 tests) : « Le dossier local de l'atelier houblons est illisible : champ inattendu « x » / format / titre / révision / date… Rien n'a été perdu ; recharge la page, ou crée un nouveau dossier. » à la place de « Structure du workspace houblon invalide. ». Sur le banc (390 et 1280, clair et cave, « Stout export »), « Créer un dossier local pour cette exploration » réussit : « Dossier local prêt · Stout export » (capt/avant-*-dossier.png, apres-*-dossier.png). Le bouton reste parfois grisé au chargement (clic refusé 3 fois sur 8, contexte pas encore prêt). | `src/services/hopV55/workspaceRepository.ts` |
| BR-43 | corrigé | `hopV55ReglageBornes` (table `bornesMetier`) : masse ≤ 40 g/L du volume (800 g pour 20 L), ébullition ≤ 240 min, contact whirlpool ≤ 3 h, à cru ≤ 720 h, jour ≤ 60, température 0–100 °C (ébullition), 40–100 (whirlpool), −2–40 (à cru). Banc 1280, clair et cave : 99 999 g → « Hors des bornes réalistes : entre 0 et 800 g. », 99 999 min → « entre 0 et 240 min. », −1 °C → « entre 0 et 100 °C. » (capt/apres-1280-*-saisie.png, vus). Au 390, le panneau « Régler dose, matière et emploi » ne s'est pas ouvert dans mon script (toucher et clic sans effet) : bornes non vues au 390, vues au 1280 et testées en unité. Avant : aucune borne (code : `min` seul). | `src/ui/hopV55/ProgramEditor.tsx`, `ExactInput.tsx` (message) |
| BR-44 | corrigé en partie | un seul nom : « Atelier houblons » (titre et bandeau « Atelier houblons · brouillon en cours »), plus de « V5.5 » visible ; « Nugget · Ébullition · consigne 60 min · ? °C » : la température inconnue d'une ébullition n'est plus écrite (« température inconnue » pour les autres emplois). Vu au 390 (capt/apres-390-clair-bilan.png, apres-390-cave-atelier.png). Reste : le JSON brut « Contexte réel et raccords exacts » (recipeReference, sha256, yeastId) et « Aucun batch avec snapshot immuable reçu » (`src/ui/hopV55/**`, hors des 5 lignes ci-dessus) : à trancher, mots du brasseur. Le titre caché du shell (`Host.tsx`, « Atelier Houblons V5.5 ») reste : un test le cherche. | `Page.tsx`, `RecipeStep.tsx` |
| BR-45 | corrigé | `page.css` : au thème cave, l'atelier est inversé d'un bloc (inversion + demi-tour de teinte + sépia 14 %) ; le bandeau vert forêt et le bandeau de l'étape y sont remis au ton cave. Méthode choisie : 34 feuilles et 1 443 couleurs en clair, non réécrites une à une. Avant : capt/avant-390-cave-atelier.png (panneau beige). Après : capt/apres-390-cave-atelier.png, apres2/apres3-390-cave-saisie.png, apres-1280-cave-saisie.png (vus : fond brun-noir, texte clair, bandeau vert foncé). Limite : couleurs de graphiques et pastilles calculées par inversion, non mesurées une à une (contraste vérifié à l'œil). | `src/ui/hopV55/page.css` |
| BR-46 | non reproduit | au 390, clair et cave : aucun défilement latéral (`scrollWidth` = 390, 0 élément hors de l'écran) après ouverture de Ma bière, Décider, Explorer, Historique et création du dossier (capt/*-rapport.json). La saisie dans « Décider » au 390 n'a pas pu être jouée (panneau fermé, voir BR-43). Au 1280, saisie absurde jouée : pas de défilement latéral. | aucun |
| TE-NOTE-6 | non jouable | formulaires de l'atelier V5.5 (Hypothèse, Dégustation, Demander au compagnon) : `src/ui/hopV55/**`, hors voie ; aucun constat. | | |
| SU-NOTE-5 | non jouable | note de choix ouverts à montrer en maquettes (carte des outils, radar de Comparer, Substituer, Dryhopper) : demande au pilote, pas un défaut de code. | | |
| AM-NOTE-2 | non jouable | note « non audités » (écran V4 drapeau éteint, atelier V5.5 champ par champ, garde froide, `BrewThermalControl`) : un travail d'audit, pas un défaut. | | |

## Fichiers modifiés
- `src/ui/hopIndex/HopRecipeSnapshot.tsx` (doses sans fraction ni notation scientifique, masse minuscule, style non reconnu ; n'importe plus `hopV55DoseText`, qui reste pour l'atelier V5.5).
- `tests/integration/HopRecipeGuide.test.tsx` (test « #75 » remplacé : 0,83 g/L, sans « exacts »).
- `tests/unit/hopIndexV4/palierDryhop.test.ts`, `tests/unit/hopIndexV4/apportCDefaut.test.ts` (délai 60 s sur un test chacun).

## Tests ajoutés
`tests/unit/bHoublons/bilanDoses.test.tsx` (9), `contrasteMoment.test.ts` (8), `alphaConfirmeSurvie.test.ts` (4) ; `tests/integration/bHoublonsDejaCorriges.test.tsx` (7), `bHoublonsRO4.test.tsx` (2).

## Contrôles
- Tests : `npx vitest run` sur mes fichiers, le bilan, l'index, `a1defauts`, `rejeu-ff0f`, les deux tests à délai : Test Files 33 passed (33) ; Tests 197 passed (197). Avant : `tests/unit/hopIndexV4` seul, 111 fichiers, 1016 verts.
- `npx tsc --noEmit -p .` : aucune erreur dans `hopIndex` ni dans mes tests.
- `controle-virgule.mjs` : VIRGULE OK.
- `git status --short` : mes fichiers ci-dessus ; les autres lignes viennent des autres voies (Levure, Stock, Divers…).
- Essais : un par critère, sauf deux corrections de mes propres tests (jsdom manquant, une regex sans barre inverse après un `sed`, refaite à l'Edit).

## Doutes et limites
- Pas de capture navigateur : le changement du bilan est un texte, la structure ne bouge pas, mais L12 demande une capture ; à faire par un exécutant au 390 et 1280, deux thèmes, sur l'étape Houblons sans drapeau v4 (`DEMANDE EXECUTANT` ci-dessous).
- BR-39 : la capture d'origine (blanc sur gris) date d'avant VI-11 ; le contraste est vérifié par les feuilles et les jetons, pas par un rendu actuel.
- TE-25 : le texte « (… g/L exacts) » reste dans l'atelier V5.5 (`hopV55DoseText`, Comparison, Explorer…), hors Possède ; il y sert à la traçabilité. Si le brasseur le refuse aussi là, la voie propriétaire de `src/ui/hopV55/readings.ts` doit le changer (tests `hopV55Readings`, `hopV55Comparison`, `hopV55Explorer`, `hopV55AssistedColdContactCard` attendent « exacts »).
- MV-50 : la cause plus profonde est que `matchBrewingStyles` (`src/domain/brewingStyles.ts`, hors Possède) ne reconnaît pas un code BJCP (« 16D ») alors que le moteur v4 (`styleDe`) le fait. Le bilan dit maintenant « style non reconnu » ; reconnaître le code serait mieux.

DÉCISION À PRENDRE : faut-il que `resolveBrewingStyle` reconnaisse un code BJCP seul (« 16D ») comme le fait le moteur v4 ? Options : oui (ambiguïté à gérer, deux guides BJCP 2015 et 2021), non (garder « style non reconnu »). Recommandation : oui, si un seul guide actif porte ce code ; fichier hors de ma voie, au pilote.

DEMANDE EXECUTANT :
1. `PORT=5654 npm run dev` (ou la commande du dépôt) ; ouvrir `?dev-local` dans Chrome, un brouillon de recette avec style « 16D », volume 30 L, un houblon Cascade 25 g à 60 min, puis un houblon 0,004 g.
2. Captures de l'étape 3/7 « Houblons » au 390 tactile et au 1280, thèmes clair et cave : `work/missions/2026-11-09-levure-port/voies/b-houblons/capt-*.png`.
3. À ouvrir et regarder : en-tête « 16D · style non reconnu », ligne « Ébullition · … 25 g · 0,83 g/L », « < 0,1 g · < 0,01 g/L », segment « Ébullition » choisi lisible (BR-39), aucun texte coupé.
4. Arrêter le serveur.

CONNAISSANCE : le registre BUGS.md garde « ouvert » des bugs déjà corrigés par des commits du 08.11 (BR-109, BE-79, BE-78, BR-40, BR-39, BT-NOTE-2) : leur colonne « commit » est vide ; le pilote doit y reporter 9c5b20d5, fa57b7b9, 97a4c6cd, 48a02ce7, et D368.
LEÇON PROPOSÉE : aucune

## Suite : atelier V5.5 (BR-38, BR-43, BR-44, BR-45, BR-46) — Possède étendu à `src/ui/hopV55/**` et `src/services/hopV55/**`
Fichiers modifiés en plus : `src/services/hopV55/workspaceRepository.ts` (message du dossier illisible, `workspaceShapeProblem` exporté), `src/ui/hopV55/ProgramEditor.tsx` (bornes d'un réglage), `ExactInput.tsx` (message « Hors des bornes réalistes »), `Page.tsx` (titre « Atelier houblons », température d'ébullition), `RecipeStep.tsx` (bandeau), `page.css` (thème cave). Test ajouté : `tests/unit/bHoublons/atelierV55.test.ts` (11).
Contrôles : `tsc --noEmit -p .` sans erreur dans ces fichiers ; `vitest` sur `bHoublons`, `hopV55RecipeStep`, `brewWizardHopV55`, `hopV55Page*`, `hopV55PrimaryButtonSpecificity`, `hopV55Readings`, `hopV55Explorer`, `hopV55ContextualExploration` : 28 fichiers, 149 tests verts. Non rejoués : le reste de la suite hopV55 (CSS seul modifié depuis).

## Validation visuelle (banc `?dev-local&etape=houblons`, port 5654, drapeau v4 éteint, puppeteer, serveur arrêté)
Scripts : `capt.mjs`, `capt390.mjs`, `recon.mjs` ; captures et rapports JSON dans `capt/` (129 fichiers). « avant » = HEAD (bilan remis à HEAD le temps de la prise) ; « apres » = ma version ; `avant004`/`apres004` = masse 0,004 g (1280 seulement : au 390 la masse est un stepper, non saisi).
- TE-25 : mesuré par test (25 g dans 30 L). Le banc a 46 g dans 20 L : « 2,3 g/L » avant et après (pas de fraction possible avec 20 L) ; le cas à fraction n'est donc pas vu à l'écran.
- BR-41 : 1280, avant « 0 g · 2E-4 g/L (0,0002 g/L exacts) », après « < 0,1 g · < 0,01 g/L » (capt/avant004-1280-clair-bilan.png, apres004-1280-clair-bilan.png : ouvertes).
- MV-50 : 390 et 1280, avant « 16D » seul, après « 16D · style non reconnu » (avant-390-clair.png, apres-390-clair-bilan.png : ouvertes).
- PI-NOTE-3 : pas visuel.
- BR-43, BR-44, BR-45 : voir tableau ; BR-45 vu au 390 et 1280 en cave.
Doutes : le premier plan du bilan montre maintenant la ligne « OG retenue 1,066 · aucun fermentescible… », qui n'est pas de moi (autre voie). Le thème cave de l'atelier par inversion est une méthode de masse : à juger par le brasseur ; un passage couleur par couleur reste possible.

DÉCISION À PRENDRE (2) : (a) BR-45 : garder l'inversion de palette (rapide, cohérente) ou réécrire les 1 443 couleurs en jetons du thème (long, plus fin) ? Recommandation : garder, puis corriger les écarts vus par le brasseur. (b) BR-44, reste : le JSON brut de « Contexte réel et raccords exacts » et « Aucun batch avec snapshot immuable reçu » sont des mots du brasseur : à montrer en mini maquettes.
