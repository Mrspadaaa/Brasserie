OK — 10 corrections du test d'écran commitées (5 commits), build 0, 36 captures ouvertes ; 7 rouges de tests antérieurs au port, voir « Reprise du 15.11 »

## Reprise du 15.11 (Sonnet) — worktree `transversaux-port`, branche `claude/ecrans-transversaux`
Commits (par chemins, Co-Authored-By Sonnet 5.5) : `a704708b` points 1, 2, 4, 10 · `3166722a` points 5, 6 · `509e50aa` points 3, 7, 8, 9 · `9c4eacbd` fix114 aligné · `3c771868` pastilles « à saisir » centrées (point 8, voir plus bas). `git status` : seuls npm-ci*.log et vite.log non suivis.

fix114 : le test exige maintenant chaque geste UNE seule fois dans le menu (libellé plein s'il est en tête : « Entrer une facture », « Encaisser une vente » ; court sinon), « Nouvelle écriture » une seule fois, et sur Finances Facture et Vente avant Recette. Pas d'exigence baissée : l'ancien test cherchait « Facture » en « Partout », que la règle retire.

Tests rejoués seuls : brewForecast, fix114, plus-ecran, expenseSheetMouture VERTS. ROUGES SEULS : expenseSheet (1), recipeAiWorkflow (2), recipeEditing (6), yeastPitchingExecution (2) = 11 tests. EXPLIQUÉ : ils échouent à l'identique sur `44e1fcc0` (avant mes corrections) et sur `baf75fde` (avant le port du + ; worktrees jetables, retirés) ; aucun ne touche un fichier que j'ai changé (erreur : « Found multiple elements with the text : Hypothèses et réglages complémentaires », `src/ui/YeastRecipePlan.tsx:749`, dernier changement `0df6d24a` « Levure, ses retours du 09.11 »). Le « 11 304 verts » de la fin précédente ne les couvrait pas : à vérifier côté pilote (hors voie, à router : BUGS.md). Non corrigés ici.

Build : `npm run build` « build exit 0 », DRAPEAUX OK (flags « on », enrichissement « production »). Lancé avant le dernier changement, qui ne touche que du CSS (`reglages.css`) ; `tsc` inchangé.

Captures : `voies/port-integration/correctifs/` (script `captures-correctifs.mjs`, serveur 3038 arrêté, journal `correctifs/journal.txt`), 390 tactile DPR 2 et 1280, clair et cave, 41 fichiers. OUVERTES : 01 (390 clair, cave), 02 (390 clair, cave), 03 (390 clair, cave, défilée, 1280), 04 (390), 05 Finances et Brassins (390), 05 Brassins (1280), 06 (390), 08 (390 clair, cave, + gros plan), 10 (390 clair, cave). NON ouvertes : 04/06/10 en 1280, 05 Finances en 1280, 08 en 1280, versions cave de 05/06/04, 02 et 01 en 1280.

Constats par point :
1. En-tête : clair, G blanc sur aplat encre ; cave, G encre sur aplat crème : lisibles. OK.
2. Mes conversations hors ligne : s'ouvre (390 clair et cave), « Compagnon hors connexion · mode local ». OK.
3. États à droite : « Drive à connecter », « 2 erreurs », « hors ligne », « 0 en novembre » (IA Rapide absent : Drive non connecté en banc). Au repos 390 le + flottant masque « Drive à c… » ; défilé à fond tout se lit (03b). Limite du + flottant, à juger.
4. Focus au toucher : PROUVÉ sur 390 tactile (vrai `touchscreen.tap` sur la loupe, 900 ms, aucun second toucher) : `document.activeElement` = `TEXTAREA[cmdk-input]` (clair et cave), puis « cit » tapé → valeur du champ « cit », capture 04 : Citra T90 trouvé. Plan B inutile. À 1280 : `INPUT[cmdk-input]`, « cit » aussi.
5. Pas de doublon : Finances = Écriture/Facture/Vente en « Sur cet écran », « Partout » = Recette, Brassin, Compagnon. Brassins 390 : « Partout » en grille 3 colonnes avec 5 cases (Écriture, Facture, Vente / Recette, Compagnon) → la case 6 reste VIDE (constat, à juger : b1s-a la montrait pleine). 1280 : liste sans doublon, lettres N D L E F V R C.
6. « Saisir une densité · B-031 · J+4 » : présent en 390 et 1280 ; touché, la fiche s'ouvre sur l'onglet Mesures (« Ajouter un relevé de densité »). OK.
7. Plus 390 : lignes sur une ligne, journal « 0 en novembre » sur une ligne. Tuile « Aucun en cuve » NON vue (le Bord n'a pas été capturé en entier, seulement le bandeau).
8. Pastilles « à saisir » : CONSTAT FAUX sur la première capture (texte collé en haut : au toucher le champ est un `<textarea>`, qui ne centre pas) → CORRIGÉ (`textarea.rg-todo{padding:3.5px 10px 0}`, commit `3c771868`), vérifié en gros plan ×4 et sur la planche 390 cave : centré. À 1280 (input) : non regardé.
9. Période : « Période / Novembre 2026 » en titre à deux largeurs (390 vu, 1280 vu). OK.
10. Voile : 390 clair gris .42, cave noir .6, appliqués à la recherche vide. OK. Constat de fond (r3p2, non touché) : dans la recherche vide, « Créer › Brassin » et « Ici › Nouveau brassin » répètent le même geste (idem Courses/Voir les courses) : la règle « pas de doublon » n'est pas appliquée à cette feuille.

Reste pour l'auteur : constats 3 (+ sur « Drive »), 5 (case vide), 10 (doublon dans la recherche vide), tuile « Aucun en cuve » à voir sur le Bord, 11 rouges antérieurs à router.

## Corrections du test d'écran (15.11) — worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, NON COMMITÉ
1. Avatar G : `Header.tsx`, lettre en `rgb(var(--cave-950))` (la page : blanc en clair, cave en cave) sur l'aplat d'encre. FAIT, à voir en capture.
2. Mes conversations hors ligne : `BrewerActivity.tsx` écoute `brewer-inbox-open` aussi en `localOnly` et rend `ConversationsBoite` (enLigne=false → « Compagnon hors connexion · mode local », d3p2 vue 8). FAIT, à voir.
3. États à droite : `plus/etats.ts` (pur, test `tests/unit/plus-etats.test.ts`), `PagePlus` (props `etatCloud`, `etatReglages`), `App.tsx` les lit (Drive : `FirebaseAuthService`, niveau IA : `ai_default_tier`, Réglages : `bilanReglages`). « ✓ Drive · IA Rapide » / « Drive à connecter » ; « IBAN à corriger » / « N erreurs » / « N à saisir ». FAIT, à voir.
4. Recherche, focus au toucher : `CommandPalette.tsx`, effet qui refocalise `[cmdk-input]` (rAF + 120 ms). FAIT ; À PROUVER au toucher 390 (taper « cit » sans second toucher) ; si le focus reste sur la loupe, le toucher synthétique reprend le focus après le clic : passer à un focus sur `pointerup`/délai 300 ms.
5. Pas de doublon : `PlusSheet.tsx` filtre `monte` de « Partout » (cases et lignes) ; ↑ retiré ; lettres actives conservées. FAIT. Tests probables à aligner : floatingActionsShellLayout, FloatingActions.behavior, fix114, brewerNavigation, plus-ecran (cherche ↑ / 6 cases).
6. Brassins : `plusEcran.ts` geste `densite` (« Saisir une densité », hint `B-031 · J+4`, lettre D, absent sans brassin en fermentation), chemin « Brassins », `App.tsx` (`brassinEnFermentation`, `runPlus('densite')` = `setBatchOpenRequest`, le geste « Mesure » existant), `VERBE` de la recherche, icône Droplet. « Courses » gardé. Test `tests/unit/plus-densite.test.ts` vert. FAIT.
7. Plus 390 : `plus.css` (lignes 15 px, états 12 px sur une ligne, journal « <n mono> en novembre »), tuile « Aucun en cuve ». FAIT, à voir (Journal sur une ligne ? tuile 3 lignes ?).
8. Pastilles « à saisir » : `reglages.css` `.rg-todo` en `inline-block`, hauteur 30, `line-height:20px`. FAIT, à voir (centrage).
9. Période : `PagePlus` `<h2 class="pl-lb">Période<b>{titre}</b></h2>` aux deux largeurs. FAIT, à voir.
10. Voile : `themes.css` `.palette-voile` (clair `rgba(17,17,17,.42)`, cave `rgba(0,0,0,.6)`, valeurs de r3p2), posé sur les deux voiles de `CommandPalette`. FAIT, à voir.

SUITE LUE (tests-correctifs.txt, « tests exit 1 ») : 7 fichiers rouges sur 1315. Connus : designTokens, virgule-transversale. À ALIGNER (mon changement) : `fix114.test.tsx` « finances : Nouvelle écriture en tête… (b1r) » (plus de ↑ / doublons). À REJOUER SEULS (probable charge/chrono, non lié au + : expenseSheet, recipeAiWorkflow ×2, recipeEditing ×6, yeastPitchingExecution ×2) : s'ils restent rouges seuls, comparer à la base `git stash`-free (`git worktree`/HEAD) avant de conclure.

Preuves : `npx tsc --noEmit -p .` = 0 erreur ; `plus-etats`, `plus-densite`, `plus-ecran` : 15 verts. Suite complète lancée en fond vers `voies/port-integration/tests-correctifs.txt` (« tests exit N » en dernière ligne) : à LIRE ; rouges connus seulement designTokens, virgule-transversale (+ chronomètre brewForecast sous charge). Tout autre rouge = test à aligner sur b1s-a (item 5 : plus de ↑, « Partout » sans le geste monté ; item 6 : chemin « Brassins ») ou sur le port (item 2 : BrewerActivity localOnly n'est plus `null`).

## DEMANDE EXECUTANT :
1. Lire `voies/port-integration/tests-correctifs.txt`. Si absent ou sans « tests exit », relancer depuis le worktree : `npx vitest run --reporter=dot > <ce fichier> 2>&1`. Pour chaque rouge hors connus : l'ouvrir, dire si le test attend l'ancien comportement (↑, 6 cases, « Brassins › Brassins », BrewerActivity null) ; l'aligner (Edit) et rejouer ce fichier seul.
2. `npx tsc --noEmit -p .` puis build sous verrou (`build.lock`) : `npm run build` (comme le port, drapeaux de `build.txt`) → « build exit 0 ».
3. Serveur : `npx vite --port 3038 --strictPort` (fond), `?dev-local`. Adapter `captures-r3.mjs` / `lib.mjs` (URL_APP 3038, OUT = `voies/port-integration/correctifs/`) : 390 tactile (DPR 2) et 1280, clair et cave, pour : (1) en-tête Bord ; (2) Plus › Mes conversations ouverte ; (3) Plus entière (états à droite) ; (4) 390 : toucher la loupe, taper « cit » SANS second toucher, capture + `document.activeElement` ; (5) + sur Finances et sur Brassins (1280 liste, 390 tuiles) ; (6) + sur Brassins avec B-031 en fermentation (banc semé de captures-r3) : entrée « Saisir une densité · B-031 · J+n », la toucher et capturer la fiche aux Mesures ; (7) Plus 390 ; (8) Réglages › Fiscalité 390 ; (9) Plus 1280 ; (10) recherche vide 390 clair et cave. Ouvrir chaque capture, noter ce qui reste faux. Arrêter le serveur.
4. Commits par chemins, message en français, fin `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` : (a) `src/components/Header.tsx`, `src/ui/BrewerActivity.tsx`, `src/ui/CommandPalette.tsx`, `src/theme/themes.css` (points 1, 2, 4, 10) ; (b) `src/domain/plusEcran.ts`, `src/components/navigation/PlusSheet.tsx`, `src/components/recherche/modele.ts`, `src/App.tsx`, tests 5-6 ; (c) `src/components/plus/*`, `src/components/reglages/reglages.css`, `tests/unit/plus-etats.test.ts` (points 3, 7, 8, 9). `git status --short` ensuite (seuls npm-ci*.log, vite.log non suivis).
5. Rendre à l'auteur : la liste des constats par capture ; il juge, corrige (surtout 4 au toucher) et ferme.


## Fin (build et suite lus)
- Build : « build exit 0 », drapeaux OK. Suite  : 11 304 verts, 3 rouges : designTokens et virgule-transversale (connus) ; brewForecast « grand livre sous 20 ms » = chronomètre sous charge, 44 verts rejoué seul. Worktree propre (seuls npm-ci*.log, vite.log non suivis).
- Restent à faire (DEMANDE EXECUTANT ci-dessous) : planches cave de b1 à ouvrir ; texte périmé de KegBoard.
Worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, branche `claude/ecrans-transversaux`. Serveur 3036 arrêté.

## Commits (par chemins, Co-Authored-By Sonnet 5.5)
- `beac7316` — b1 : tuiles du « Partout » au 390 aux libellés courts de b1s-a (`Écriture`, `Facture`, `Vente`, `Recette`, `Brassin` ; Compagnon inchangé), le geste courses devient « Courses » (décision du pilote : il ouvre l'écran, il n'ajoute rien). Au 1280 les lignes gardent les libellés pleins (comme b1s-a-1280). `aria-label` de la tuile = libellé plein + précision (le nom accessible contient le texte visible). `src/App.tsx` : les petits changements (JSX de `CommandPalette` refermé avant `InventoryCorrectionSheet`, ordre des clés) compilent et sont gardés ; `QuickActionModal.tsx` n'avait que des fins de ligne (restauré). Tests alignés : fix114, brewerNavigation, FloatingActions.behavior, floatingActionsShellLayout ; un test neuf dans `plus-ecran.test.ts`.
- `abb9d4c2` — r3 : date courte « 15.11 » (au lieu de « 2026-11-15 »), première ligne de l'écriture en détail (« Citra T90 1 kg ») et montant « 367,55 CHF » dans la colonne de droite (r3p2 : « 09.11 · Citra T90 1 kg » / « 352,05 CHF ») ; date de « Dernier achat » de l'aperçu en date courte. Fonctions pures `dateCourte`, `resumeLigneEcriture` (`recherche/modele.ts`) et 3 tests.

## Preuves
- `npx tsc --noEmit -p .` : 0 erreur (rejoué après chaque changement).
- Tests ciblés : plus-ecran, recherche-modele, CommandPalette et 8 intégrations du + : verts (`t1.txt` à `t3.txt`).
- Build et suite complète : lancés en fond après le dernier commit, sorties `build.txt` (« build exit 0 » attendu) et `tests-tout.txt` (« tests exit » + rouges). À LIRE : attendus rouges seulement `designTokens`, `virgule-transversale` (et `hopV55RecipeColdContactHost` sous charge). Tout autre rouge est à corriger.
- Captures rejouées sur la vraie entrée `?dev-local` : r3 (`captures/a-390, b-390, vide-390, geste-corriger-390, 1280, 1280-gestes, …-cave`, fixtures avec un exercice 2024 archivé : la puce « 1 de plus dans les archives » et « Chercher aussi dans les archives » se voient en vrai rendu) ; b1 (14 écrans × 390/1280 × clair/cave, `captures/390-clair-<écran>-menu.png`…).
- Planches ouvertes : r3 `cote-a-cote-390`, `-vide`, `-cave`, `-1280`, `-1280-cave` ; b1 `cote-a-cote-ecrans-clair-1`, `-2`, `-3` (12 écrans contre `b1s-a-vues-390.png`). NON ouvertes : `cote-a-cote-ecrans-cave-1..3.png`.
- Scripts : `captures-r3.mjs`, `captures.mjs`, `planches-r3.mjs`, `planches-b1.mjs` (port 3036), `lib.mjs`.

## « Combien et quels problèmes ? » — r3 (5 planches)
Corrigés : (1) date ISO brute dans les résultats d'écriture ; (2) montant dans le détail au lieu de la colonne de droite (le mot « Pièce » y prenait la place) ; (3) date ISO du dernier achat dans l'aperçu.
Ouverts, hors voie ou sans fonction dans l'app (déjà dans « manque » de port-r3) : (4) en-tête de l'app (période « Nov. », avatars) ≠ en-tête de la maquette : port-m3 ; (5) « Ici » du stock : Nouvel article + Voir les courses (la table du +) au lieu des quatre boutons de la maquette (Corriger / Retirer absents de `plusMenuFor`, critique r3p2 n° 2) ; (6) « Reprendre » : B-031, Brouwland, Citra T90 (pas « Mesure de B-031 ») ; (7) vide : « Nouvel article » sans le nom tapé ; (8) aperçu : « Seuil 500 g » (Units.format) au lieu de « Dernière sortie » (inconnue de l'app) ; (9) ligne choisie : fond gris, pas la barre noire à gauche de la maquette (détail).

## « Combien et quels problèmes ? » — b1 (12 écrans, clair)
Tuiles courtes et grille 3 × 2 conformes à b1s-a. Écarts voulus par la retouche du 15.11 : (1) chaque commun garde sa case, avec ↑ quand il est en tête (b1s-a le retirait : « Facture, Vente, Recette, Brassin, Compagnon ») ; (2) « sera LOT-001 » / pas de précision « froment », « pour B-032 », « Citra T90 · 2 kg » (l'app ne les calcule pas ; fixture sans données) ; (3) « Saisir une densité » absent ; (4) en-tête de l'app (port-m3). Hors voie : (5) KegBoard (Fûts vide) dit « Ajoute un fût avec le bouton « + » de la barre » alors que le + flotte (`src/ui/KegBoard.tsx:120`, tests `defautsStocksEcrans` l.143 et 151 à ajuster) ; trois commentaires de CreativeLabTab disent encore « celui de la barre ».

## DEMANDE EXECUTANT :
1. Lire `build.txt` (« build exit 0 ») et `tests-tout.txt` ; rendre toute ligne FAIL hors designTokens, virgule-transversale, hopV55RecipeColdContactHost.
2. Ouvrir `captures/cote-a-cote-ecrans-cave-1.png`, `-2`, `-3` (rejouables : `node planches-b1.mjs cave`) et lister les problèmes de contraste (+ jaune paille, tuiles, ↑).
3. `git status --short` dans le worktree : propre sauf `npm-ci*.log` non suivis.
4. Corriger le texte périmé de KegBoard (« avec le bouton « + » ») et ses deux tests, puis `npx vitest run tests/integration/defautsStocksEcrans.test.tsx`.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un exercice archivé se sème dans un banc `?dev-local` par `import('/src/services/firestoreRepo.ts')` → `FirestoreRepo.put('financialArchives', 'ARCHIVE-2024', { id, year, status: 'archived', updatedAt, archivedAt, operationId })` (operationId : 8 à 100 caractères `[A-Za-z0-9-]`) avec une écriture datée de 2024.
LEÇON PROPOSÉE : aucune
