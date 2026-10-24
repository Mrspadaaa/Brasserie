OK — accepté : mesures rejouées et code confrontés concordent ; 5 corrections de forme à faire avant le conseil, dont une (R6) qui change la lecture de T2.

## Rejouées
Scripts et journaux dans `%TEMP%\i0r\` (build dans `%TEMP%\i0r\dist`, jamais dans `dist/`). Machine : la même (Windows, Node v24).

- Poids du build : `npx vite build --outDir %TEMP%\i0r\dist` puis un script gzip sur `assets/*.js` et `node scripts/check-hop-budget.mjs --dist %TEMP%\i0r\dist --boot index,App,firebase --step Host` — document : 149 fichiers, 15,11 Mo, 3,39 Mo gzip, `App` 2 869,48 ko / 709,36 gzip, `Host` 1 888,04 / 478,96, démarrage 918 ko, étape +772 ko (budgets 350 / 150) ; mien : 149 fichiers, 14,41 Mio (= 15,11 Mo), 3,23 Mio gzip (= 3,39 Mo), `App` 2 802,22 Kio (= 2 869 ko) / 692,74, `Host` 1 843,79 / 467,74, script de budget « B1 918 ko DÉPASSÉ ; B2 772 ko DÉPASSÉ » — tient (le document mélange ko = 1 000 octets pour le build et 1 024 pour les JSON de `src/data` ; voir D5).
- Temps du moteur, ×1 : `ECHELLE=1 COMPLET=0 node %TEMP%\i0\mesure-moteur.mjs` — document : `simulerCas` léger chaud 0,05 ms, dose changée 0,30, complet froid 4,41, chaud 0,91 ; `substitutes` froid 91,9 / chaud 2,1 ; classement léger 478 / 85 ; `suggerer` 17,3 / 3,9 ; mien : 0,05 ; 0,30 ; 4,67 ; 0,90 ; 89,2 / 2,4 ; 480 / 84 ; 17,1 / 4,0 — tient (à ±5 %). Réserve : le « complet froid » de 4,41 dépend de l'ordre des appels, la série `COMPLET=1` du même auteur donne 0,77 (`mesure-k1-c1.txt`) ; ce n'est pas un vrai premier appel isolé.
- Mesure à ×10 : `ECHELLE=10 COMPLET=0 node %TEMP%\i0\mesure-moteur.mjs` (3 180 houblons, 160 entrées de stock) — document : classement léger froid 4 533 ms / chaud 1 567, `substitutes` froid 1 522 / chaud 45,5, `suggerer` froid 334 / dose changée 132 ; mien : 4 548 / 1 579, 1 581 / 43,4, 322 / 118 — tient (l'auteur a aussi rejoué la série : 4 343 / 1 561).
- Tests du prototype (R1) : `cd prototypes/houblons-v4 && npx vitest run` — document : 2 échecs sur 127, `Houblon inconnu du moteur : inconnu:hallertau` en `parcours/src/moteur/index.ts:214` ; mien : 2 échecs, 125 verts sur 127, même message, même ligne — tient.
- Portabilité (B3, B4, B8) : `node prototypes/houblons-v4/parcours/outils/portabilite.mjs --process|--alias|--work` — document : trois OK ; mien : SANS PROCESS OK, IMPORTS RELATIFS OK, SANS WORK OK — tient.

## Confronté au code
Classement (au moins cinq lignes) :
- Atelier V5.5 : `src/ui/hopV55/` 33 612 lignes, `Page.tsx` 5 303 (`wc -l`) ; route `hopV55` dans `useFullScreenRoute.ts:19` ; `HopV55RecipeStep` à `BrewWizard.tsx:2715` (document : 2705-2720) — tient.
- `src/ui/hopIndex/` 34 fichiers, `src/domain/hopIndex/` 17 ; `HopRecipePanel` à `RecipePage.tsx:477` ; `HopIngredientPicker` à `BrewWizard.tsx:2451` ; worker `hopSolver.worker.ts` présent — tient. 223 fichiers de tests : 226 au `grep -rlE "hopIndex|HopIndex" tests`, proche.
- Écoutes Firestore : `BUSINESS_COLLECTIONS` 30, moins `financeDocuments` (29), moins `transactions` et `financialPayments` = 27 (`firestoreRepo.ts:49`, `:520`) — tient.
- Données embarquées : `src/data/*Bootstrap.json` en Kio : 1 986 / 1 134 / 521 / 509 / 8 350 — tient.
- Navigation actuelle : `useFullScreenRoute.ts` 73 lignes ; `popstate` ramène à `tabs` hors cas `hopV55` (lignes 63-70) — tient.
- Moteur : `prototypes/houblons-v4/src/engine/` 22 fichiers ; `STEPS` du `BrewWizard` lignes 398-406, 3 287 lignes — tient.
- Registre `choix/ecrans.json` : comparer, dryhopper, substituer « choisi », levure « ouvert » — tient (mais voir D3).

Écarts B (au moins trois) :
- B1 : `useFullScreenRoute.ts` de l'app, 73 lignes, n'a pas de pile ; celui de la maquette fait 139 lignes — tient.
- B2 : `data.ts:37-57` exporte `CATALOGUE`, `STOCK`, `ENGINE_DATA`, `VARIETY_BY_ID` figés sur `proto-data.json` ; `substitution.ts:254` lit `CATALOGUE` et `STOCK` en dur et fait `STOCK.map(...).filter(k => !CATALOGUE.some(...))` ; `donnees.ts` (en-tête) avoue le singleton ; `cacheBase` en `Map` sans éviction à `profil-simule.ts:195` — tient.
- B3, B4, B8 : trois contrôles rejoués, OK (voir plus haut) ; `grep process.env` sur `src/engine` : rien de vivant — tient.
- B5 / R1 : 2 tests rouges rejoués — tient (mais voir D2).
- B9 : budget FAIL rejoué — tient.
- R3 / T3 : les deux tests de retour cités existent (`AppQuickActionReturn.behavior.test.tsx`, `fix114.test.tsx`) — tient.
- R8 : 0 `--url` dans les 71 `controle-*.mjs` de `work/refonte-frontend/v4/tournoi/outils/` — tient.
- `git status --short src functions` vide ; l'auteur n'a écrit que `ETAT-DES-LIEUX.md` et son `RESULTAT.md` — pas de sortie de périmètre.

## Défauts à corriger (aucun ne bloque ; D1 à lire avant T2)
- D1 — R6 incomplet. Le document dit « brouillon non enregistré » et laisse la perte de données plausible. Or le wizard écrit son brouillon en local : `writeRecipeDraft(draftKey, …)` aux lignes 1421, 1467, 1939, 1951 de `BrewWizard.tsx`, relu à l'ouverture par `readRecipeDraftState(props.draftKey)` (ligne 462) ; `src/services/recipeDraft.ts:544`. Correction : ajouter que le brouillon survit déjà à un démontage du wizard (stockage local), puis dire ce qui reste à vérifier (cle de brouillon conservée à la sortie de l'outil, retour à la bonne étape), pour que le conseil ne surestime pas ce risque.
- D2 — « conversion de recette : fini (maquette) » avec 2 tests rouges. L11 exige typé, testé, vert. `conversion.ts` produit les clés `inconnu:<nom>` qui font tomber l'écran (R1) ; le classer « inachevé récupérable » (manque : houblon hors catalogue sans exception). Même réserve pour `ecrans/ma-biere` classé « fini (maquette) » alors que chaque ajout d'un houblon hors catalogue le plante.
- D3 — « `ecrans.json` modifié, non commité » est faux : le fichier est propre (`git status` vide) et le registre « choisi » est dans le commit d27c1387. L'écart avec MISSION.md reste réel ; reformuler « MISSION.md est en retard sur le registre commité ».
- D4 — chiffres non reproduits : « 53 contrôles lisent `etat.html` » (je compte 34 qui citent `etat.html` ; 55 qui citent `etat`) ; « 262 fichiers de tests citent hopV55 » (je compte 178 à 192 dans `tests/`). La conclusion (0 `--url`) tient ; donner la commande de chaque compte ou corriger.
- D5 — unités mêlées : ko = 1 000 octets pour le build, 1 024 pour les JSON ; écrire une seule convention.
- D6 — « un geste sur une recette ne dépend pas de la taille du catalogue » est trop fort : `simulerCas` complet chaud passe de 0,9 à 2,2 ms et le léger dose changée de 0,30 à 0,71 ms de ×1 à ×10 (mes mesures) ; dire « reste sous 15 ms ».
- Réserve connue de l'auteur, confirmée : BATTERIE 45/45 et ETATS 141/141 non rejoués ; je ne les ai pas rejoués non plus (la maquette est en reconstruction par une autre voie). Aucune capture produite par cette voie, donc rien à ouvrir en image.

LEÇON PROPOSÉE : un classement « fini (maquette) » doit exclure toute pièce dont un test connu est rouge, même si la cause est dans la voisine ; sinon L11 est contournée par le mot « maquette ».

Verdict : ACCEPTÉ
