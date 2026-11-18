REPRISE : work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/RESULTAT.md — code livré et commité (f2760dff), tsc et tests verts ; restent build, rejeu des captures, planches côte à côte (DEMANDE EXECUTANT) et le jugement des images.

## Fait (worktree C:/Users/mrspa/AppData/Local/Temp/transversaux-port, branche claude/ecrans-transversaux, commit f2760dff)
- `src/components/recherche/modele.ts` : règles pures (Ici lit `plusMenuFor`, Aller à sans l'écran courant ni Courses quand « Voir les courses » est dans Ici, récents, classement, surlignage insensible aux accents, nombres en mono). Libellé du geste courses : « Voir les courses » (il ouvre l'écran Courses, il n'ajoute rien).
- `src/components/recherche/apercu.ts` (neuf) : aperçu d'un article au 1280 : en stock, α, seuil (seulement si connus), recettes qui l'emploient (par référence, sinon par nom), dernier achat (ligne d'écriture reliée par `stockItemRef`).
- `src/ui/CommandPalette.tsx` : feuille au pouce < 1024 px, palette 1280 avec aperçu et gestes (Alt + lettre, → entre dans les gestes, Tab = archives, ⌫ sur vide sort du contexte). Textarea tactile centré (`leading-[38px]`). Les boutons « Ici » du téléphone n'affichent plus la précision (elle tronquait le libellé) : elle reste dans `aria-label`. `text-cave-300` n'existe pas dans la palette : remplacé par `text-cave-200` (garde designTokens).
- `src/App.tsx` (13 hunks de port-r3 commités par `git apply --cached` ; les 3 hunks de port-m3 restent non commités) : `commandGroups` (Stock : α ou catégorie, quantité en valeur, gestes Corriger et Courses, aperçu, ouverture de la fiche par `stockOpenRequest` ; Recettes : geste Brasser ; Brassins en fermentation ou garde : J+N si connu, geste Mesure ; Écritures avec pièce : geste Pièce ; Clients : type en valeur et dans les mots-clés), `allerA`, `InventoryCorrectionSheet` monté en lazy (même `adjustInventory` et mêmes messages que StocksTab), props `menu`, `onGeste={runPlus}`, `onCompagnon`, `onAllerA` à la palette.
- Tests : `tests/unit/recherche-modele.test.ts` (neuf, 17 tests) ; `tests/integration/CommandPalette.test.tsx` adapté : « Rien pour « … » » et, rien tapé, la feuille montre les gestes (la liste bornée à 12 se vérifie sur une saisie « Achat fictif »). Ce fichier d'intégration n'est pas dans « Possède » : adaptation obligée par la maquette r3p2.
- Captures : `captures-r3.mjs` (dans le dossier de la voie) : fixtures « banc r3 » écrites dans le cache de ?dev-local par `import('/src/services/storage.ts')`, loupe de l'en-tête touchée/cliquée, 390 (DPR 2, `keyboard=256`) et 1280, clair et cave. Premier passage ouvert en image : a-390, b-390, vide-390, geste-corriger-390 (la feuille « Corriger l'inventaire » s'ouvre bien sur Citra T90), 1280.

## Contrôles
- tsc : `tsc.txt` vide (0 erreur), rejoué après le dernier changement.
- `npx vitest run tests/unit/recherche tests/integration/CommandPalette.test.tsx` : 19 verts (`tests.txt`).
- Intégrations qui ouvrent la palette (AppEnregistrerRetourFiche, AppLanceurOutilsHoublons, AppQuickActionReturn, AppRoutePile, brewLegacyInstallationApp, dashboardNavigation, fix114, inputProtection, ModalHandoff, pageShellPerformance, recipeWizardSafety) : 65 verts, 1 sauté (`tests-integ.txt`).
- `tests/unit` complet (`tests-tout.txt`) : 11 300 verts, 2 rouges, aucun à moi : `designTokens` (restent `text-cave-300` de `ui/depense/*` et `ui/finance/controlesCroisesVue.tsx`, d'autres voies ; mes 5 lignes sont corrigées depuis) et `rejeu-649b/virgule-transversale` (26 occurrences dans `src/domain/*`, avant ma voie).
- Build : PAS FAIT (voir DEMANDE EXECUTANT).

## Problèmes relevés sur les captures (« combien et quels problèmes ? » : 4 ouverts, 3 corrigés)
Corrigés : (1) texte du champ collé en haut au téléphone ; (2) libellés « Entrer une f… », « Voir les c… » tronqués par la précision ; (3) « Houblon · α 12,8 … » tronqué dans la carte (le houblon se lit à son α, les autres à leur catégorie). Restent à juger après rejeu : (4) « Reprendre » n'avait pas été vu (recents posés par le script au prochain passage) ; (5) la puce « N de plus dans les archives » jamais vue en vrai rendu (pas d'archive dans les fixtures : à poser si FinancialArchiveService le permet, sinon couvert seulement par le test d'intégration) ; (6) 1280 : « Seuil 500 g » à côté de « 1,2 kg » (l'unité vient de `Units.format`, à confirmer sur l'écran de l'article) ; (7) comparer chaque état à la maquette (planches).

## DEMANDE EXECUTANT (Haiku), dans l'ordre
1. Serveur : `cd C:/Users/mrspa/AppData/Local/Temp/transversaux-port && npx vite --port 3035 --strictPort` (en arrière-plan).
2. `cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-ecrans-transversaux/voies/port-r3 && node captures-r3.mjs` → sortie `fixtures : [3,1,1,1]` et « ouverte par la loupe : true » ×4 ; produit dans `captures/` : a-390, b-390, c-390-ipa, geste-corriger-390, vide-390, a-390-cave, b-390-cave, 1280-vide, 1280, 1280-gestes, 1280-vide-cave, 1280-cave (.png).
3. Planches `captures/cote-a-cote-390.png`, `cote-a-cote-1280.png`, `cote-a-cote-vide.png` : copier `../port-b1/planches.mjs`, remplacer la liste PLANCHES par (app à droite, maquette à gauche, titres « Maquette r3p2 » / « App (port) ») : `a-390.png` avec `../voie-p2-r3/r3p2-a-390.png` ; `b-390.png` avec `r3p2-b-390.png` ; `vide-390.png` avec `r3p2-x-vide.png` ; `1280.png` avec `r3p2-1280.png` ; cave : `b-390-cave.png` avec `r3p2-cave-390.png`, `1280-cave.png` avec `r3p2-x-1280-cave.png`.
4. Ouvrir CHAQUE png et dire « combien et quels problèmes ? » en liste numérotée : alignement du champ, troncatures, Reprendre visible (3 lignes : Mesure/B-031, Brouwland, Citra T90), carte du meilleur résultat avec ses deux gestes, aperçu 1280 (en stock, α, seuil, recettes, dernier achat), contraste en cave.
5. Build : créer `C:/Users/mrspa/AppData/Local/Temp/transversaux-port/build.lock` (attendre s'il existe), `npm run build > <voie>/build.txt 2>&1` depuis le worktree, supprimer le lock ; attendu : build vert.
6. Arrêter le serveur du port 3035 : `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3035 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }"`.
7. Corrections éventuelles : un nouvel auteur, sur la liste des problèmes ; ne pas toucher `Header`, `plus/**`, `periode/**`.

## manque : (ce que la maquette montre et que l'app ne sait pas)
- « Retirer du stock » : le stock ne bouge que par achat, brassage et correction d'inventaire ; le geste devient « Corriger l'inventaire » (réel, journalisé).
- « Corriger l'inventaire » et « Retirer du stock » dans la zone « Ici » : absents de la table `plusMenuFor` ; non ajoutés (pas de seconde liste, critique r3p2 n° 2).
- « Agenda » dans « Aller à » : aucun écran Agenda dans l'app.
- « Dernière sortie » et « 600 g réservés » (aperçu) : l'app ne garde pas le dernier mouvement d'un article ni la réservation par brassin.
- « Nouvel article « zzk » » (nom prérempli) : `createRequest` ne porte pas de nom ; la sortie dit « Nouvel article ».
- Loupe « enfoncée » dans l'en-tête : relève de Header (port-m3).
- « Reprendre » : les 3 derniers résultats ouverts depuis la recherche (localStorage de l'appareil), pas des gestes (« Mesure de B-031 ») : l'app ne tient pas d'historique de gestes.
- « Voir les courses » n'ajoute pas l'article aux courses : l'app calcule les courses (articles à commander), sans liste manuelle.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `batchOpenRequest` (App) ouvre la fiche brassin à la section Mesures ; `stockOpenRequest` ouvre la fiche d'un article ; `brewer-companion-open` ouvre le Compagnon ; un banc ?dev-local se garnit par `import('/src/services/storage.ts')` dans la page (StorageService.saveStocks/saveRecipes/saveBatches/saveClients/saveTransactions) ; un hunk d'un fichier partagé se commite seul par `git diff -U0` filtré puis `git apply --cached --unidiff-zero --recount`.
LEÇON PROPOSÉE : aucune
