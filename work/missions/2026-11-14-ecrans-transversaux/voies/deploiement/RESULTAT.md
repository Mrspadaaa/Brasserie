OK — prêt 55d9d4fd : pile de Brassins (brassin, densité, recette), + carré, période unique ; build et banc verts, rien déployé

Copie : C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux, HEAD 55d9d4fd, arbre propre. (Passes précédentes : RESULTAT-passe6.md, -passe5.md, -passe4.md, -passe1.md.)

## Commits (copie, par chemins)
- 35bbde82 : code des passes 6 et 7 + tests adaptés (src/App.tsx, Header.tsx, ProductionTab.tsx, domain/plusEcran.ts, ui/FloatingActions.tsx, ProductionCatalog.tsx, liste/{FeuilleFiltres,ListeBrassins,listeModel}, liste.css ; tests plus-densite, plus-ecran, plus-ecran-pile, port-p6-bilan-plus, port-p7, port-q2, port-q6, port-q9, dashboardNavigation).
- 55d9d4fd : tests/integration/recipeAiWorkflow.test.tsx, parcours M20 à 30 s (voir doutes).

## Décision du pilote appliquée
`MENUS.brassins.autres = ['densite', 'recette']` dans `src/domain/plusEcran.ts` : de haut en bas, « Partout » (Écriture, Facture, Vente, Compagnon), « Sur Brassins », Créer une recette, Saisir une densité (seulement si un brassin est en fermentation : `contexte.enFermentation`), Nouveau brassin pleine contre le +. Pas de Courses. Le + garde le carré 56 px sans texte.

## Critères
1. Tests unitaires adaptés : les 14 rouges sont verts. `npx vitest run tests/unit --reporter=dot > tests-5.txt` : 2 failed (designTokens 1, rejeu-649b/virgule-transversale 1 = TE-23), 11897 passed. Seuls les rouges antérieurs connus restent. Adaptations (effet voulu, aucun comportement baissé) : Brassins = Nouveau brassin, densité conditionnelle, recette ; « seule » testé sur Bord et Finances (Brassins passe à 4 pilules, pair) ; Courses testé sur Bord ; le + de Brassins est le carré sans texte ; critères de liste `{ enCours }` et période de l'app dans le contexte ; q9 : une seule source de période (plus de masquage de l'en-tête). Ajout : un test q6 « la période de l'app juge la date » (année, plage, en cours réglable).
2. Intégration : `tests-integration-4.txt` : 13 failed / 3764 passed. dashboardNavigation 7/7 vert. Rouges connus : expenseSheet 1, fuzzSaisie 1, recipeEditing 6, yeastPitchingExecution 2, recipeAiWorkflow 2 + 1 limite de temps (corrigée au commit 55d9d4fd : relancé, il reste les 2 connus de recipeAiWorkflow, 32 verts).
3. `VITE_HOP_V4=on npm run build` : vert (build-4.txt). check-no-dev-auth : « Bundle de production propre » ; check-build-flags : 3 DRAPEAUX OK ; check-firebase-config (script du dépôt principal sur dist/assets de la copie) : « CONFIG FIREBASE OK » ; `dev-local` dans dist : 0 fichier. check-no-dev-auth et check-build-flags tournent depuis la copie : le premier lit `dist` à côté de son propre dossier, la copie n'a pas `check-firebase-config.mjs`.
4. banc3 (`node banc3.mjs`, serveur 3044 arrêté ensuite, 0 erreur de console) : 30 captures dans voies/deploiement/test-ecran-3/ (390 tactile et 1280, clair), toutes ouvertes en image pour les écrans listés ci-dessous. Journal : banc3-journal.json. Trois brassins `ZZ TEST — …` posés en mémoire dans l'app locale (?dev-local, rien en ligne) : NEIPA en fermentation J+4, Pils en garde J+16, Saison terminé en février.
   - Brassins repos (02) : 390 et 1280, + = carré 56x56 sans texte, pastille « ‹ Nov. › » visible dans l'en-tête, puce de la liste « Nov. + en cours ».
   - Pile (03), 390 : de haut en bas Partout (4 pilules), « Sur Brassins », Créer une recette, Saisir une densité « B-901 · J+4 », Nouveau brassin pleine « sera LOT-001 » contre le +. 1280 : les mêmes lignes avec leurs lettres (R, D, N, E, F, V, C). Recettes (12) : Nouvelle recette pleine, Lancer un brassin au-dessus.
   - Feuille Filtrer (04b, 05b) : segments Ce mois / Cette année / Toutes / Dates…, « Les en cours, toujours », note « Même période que l'en-tête ». « Cette année » : la pastille de l'en-tête devient « Exercice 2026 », la puce « 2026 + en cours », Saison (février) entre : « 3 brassins sur 3 ».
   - Plus (07, 08) : « Mois dernier » règle « Oct. » dans l'en-tête. Brassins (09) : « Oct. + en cours », les deux brassins en cuve restent, Saison hors période. Finances (10) : « Octobre », pastille « Oct. ».
   - Recherche (11a, 11b) depuis Brassins : « Ici » = Nouveau brassin et Saisir une densité ; « neipa » trouve B-901 avec « Mesure ». Bord (01) et en-tête vus.

## « Combien et quels problèmes ? » : 3, aucun du fait de cette passe
1. Compteur « 3 brassins » (haut droite de Brassins) = tous les brassins, alors que la période n'en montre que 2 (« Tous 2 », « 2 en cuve ») : il ne suit pas la période. Écrit dans e6a avant cette passe ; à verser à BUGS si le brasseur le juge gênant.
2. « Compagnon hors connexion · mode local » (pastille flottante) recouvre une ligne en bas de Plus et de Finances au 390 : existant, hors périmètre.
3. Plus affiche « Bord » actif dans la barre du bas : existant.
Aucun défaut sur la pile, le carré, la période ni la recherche.

## Doutes et limites
- recipeAiWorkflow « retient la fiche IA de l'essai M20 » : 14,0 à 15,3 s en local, 14,5 s avec le code de 913ccda7 (mesuré avec les fichiers src de ce commit remis le temps du test) : plafond de 15 s au bord, pas un défaut de la période. Rendu à 30 s par `it(…, 30000)` ; le comportement testé est inchangé. À défaire si le pilote préfère le garder rouge.
- Le build (dist) date de 35bbde82 ; 55d9d4fd ne change qu'un fichier de test.
- Les 2 rouges unitaires et les 12 rouges d'intégration sont ceux de passes précédentes (non réexaminés).
- Non déployé. Rien commité dans le dépôt principal (les fichiers de cette voie : banc3.mjs, tests-5.txt, tests-integration-4.txt, build-4.txt, check-*-4.txt, test-ecran-3/, banc3-journal.json, RESULTAT-passe6.md, RESULTAT.md, restent à ranger par le pilote).

DÉCISION À PRENDRE : aucune (décision 1 et 2 de la passe 6 tranchées par le pilote).
CONNAISSANCE : en `?dev-local` la liste Brassins est vide : le banc sème des brassins `ZZ TEST` par `import('/src/services/storage.ts')` puis `StorageService.addBatch` (mémoire seulement). Sans eux ni la densité ni la période ne se voient. Un test à parcours long (>14 s) tient à 1 s du plafond de 15 s de vitest.
LEÇON PROPOSÉE : aucune.
