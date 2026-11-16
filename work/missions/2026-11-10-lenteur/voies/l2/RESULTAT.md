REPRISE : work/missions/2026-11-10-lenteur/voies/l2/RESULTAT.md — Finances corrigée (2,1 → 1,9 s, 360 → 313 Ko), préchargement fait, trace faite ; restent la série finale sur le DERNIER build (1cd9336b), la suite complète, les captures ouvertes ; Atelier V5.5 reste +2,1 s à froid (décision).

# Voie l2 (reprise) — branche `l2/lenteur`, worktree `%TEMP%/l2-wt`, commit **1cd9336b** (sur ce8fdf16, base tag `en-ligne/2026-11-10-curseur`)

## 1. La régression Finances : cause et correction
- **Cause** : ce n'était pas un JSON devenu dynamique. `FinancesTab → FinanceAssistant → BrewerChat → functions/src/brewerHopAdviceProposal → brewerHopAdviceContextBinding → src/domain/brewerTools → yeastReferences`. `brewerHopAdviceContextBinding` n'importe de `brewerTools` que `normalizeRecipe` (ré-export de `recipeSnapshot`), mais l'alias `./brewerTools.js` de `vite.config.ts` lui donnait tout `brewerTools` (outils du chat, bibliothèque de levures comprise). Le `chaine.mjs` de la 1re passe disait « non atteint » parce que sa regex ignorait ces alias ; l'analyseur AST + alias est `%TEMP%/l2-chaine-ts.mjs` (à ne pas perdre : à copier dans `voies/l2/mesure/`).
- **Correction** : plugin Vite `binding-sans-brewertools` (`vite.config.ts`, navigateur seulement) : pour ce seul importeur, `brewerTools` devient `src/domain/recipeSnapshot.ts`, d'où vient le ré-export. Le serveur garde son `brewerTools.js` empaqueté : aucun fichier de `functions/` touché.
- **Mesuré** (banc, froid, médiane de 3, Slow 4G + CPU ×4) : Finances 2 105 → **1 865 ms**, 360 → 313 Ko (tag : 2 105 ms). Plus de requête `yeastReferences` à l'ouverture de Finances.

## 2. Préchargement à l'inactivité (fait)
`src/services/prechargeVues.ts` (neuf) + effet dans `src/App.tsx` (connecté, données prêtes, page chargée) : Brassins, bibliothèque de levures, Stocks, Finances, Clients, un morceau à la fois ; démarre 3 s après, puis attend 5 s de calme après le dernier geste ; `requestIdleCallback` ; rien hors ligne, en économie de données ou en 2G ; un échec n'arrête rien. Test : `tests/unit/prechargeVues.test.ts` (5 verts). Houblons : outils v4 déjà préchargés (`prechargerOutilsAuRepos`, #167). L'atelier V5.5 (`Host`) n'est PAS préchargé par `import()` : voir la trace.
En plus : `loadBrewingCatalogueReferences` (déjà asynchrone) charge `yeastReferences` par `import()` au premier appel ; même résultat.

## 3. Tableau, médiane de 3, mêmes conditions (build `l2-dist-apres2` = ce8fdf16 + plugin + préchargement SANS la ligne « bibliothèque au repos » ni l'`import()` du catalogue ; ces deux derniers ajouts sont dans 1cd9336b et pas encore mesurés)
| Vue | froid, touchée aussitôt (avant → après) | froid, après 25 s sur l'accueil | chaud (accueil), après 25 s |
|---|---|---|---|
| Accueil | 6 071 → **4 324 ms (−29 %)**, 972 → 634 Ko | 6 018 → **4 328 (−28 %)**, 1 241 → 904 Ko | 557 → 508 |
| Brassins | 1 614 → **924 (−43 %)**, 262 → 131 Ko | 1 636 → **401 (−75 %)**, 0 Ko | 1 640 → 361 |
| Stocks | 2 448 → **2 545 (+97 ms)** | 1 589 → **403 (−75 %)** | 1 594 → 394 |
| Finances | 2 105 → **1 865 (−11 %)** | 2 120 → **398 (−81 %)** | 2 119 → 360 |
| Clients | 449 → **512 (+63 ms)** | 452 → 408 | 448 → 360 |
| Atelier Houblons V5.5 | 3 072 → **5 183 (+2 111 ms)**, 564 → 973 Ko | 3 083 → **5 182 (+2 099)** | 3 061 → 5 245 |
Tout est en ms du toucher au contenu visible (accueil : de la navigation au contenu). Sorties : `mesure/sorties/s2-*.json`, tableau : `node mesure/resume.mjs`.

**Vues encore plus lentes que le tag (honnêteté, « aucune vue plus lente » non tenu) :**
1. **Atelier V5.5, +2,1 s à froid, +409 Ko.** La bibliothèque de levures (347 Ko), sortie de l'accueil, est une dépendance STATIQUE de l'atelier par `src/domain/hopIndex/predictionReferences.ts` (`guidePredictionKnowledgeQualification`, appel synchrone avec le catalogue complet, lu aussi par `brewingScenarioContext` et les outils houblons). La rendre asynchrone propage `async` dans les outils houblons et le moteur de scénario : trop large et pas sûr pour cette voie. Atténuation faite dans 1cd9336b (non mesurée) : la bibliothèque arrive au repos, avant l'ouverture. Sur le chemin complet « démarrer puis ouvrir l'atelier immédiatement », le total est équivalent (6,07 + 3,07 = 9,1 s avant ; 4,3 + 5,2 = 9,5 s après), pas meilleur. Même motif pour l'assistant de recette (`BrewWizard`), la page recette et le jour de brassage (`YeastBrewDayGuide`) : leur 1re ouverture à froid paie +347 Ko, non mesurée (pas dans le banc).
2. **Stocks +97 ms, Clients +63 ms (froid, touchées aussitôt, avant tout préchargement)** : reproductible, une requête de plus (`numericInput` 1,3 Ko, `container` 0,6 Ko) par découpe différente des chunks ; 150 ms de latence par aller-retour en Slow 4G. Après le préchargement les deux sont 75 % plus rapides. À corriger seulement si le brasseur ouvre ces vues dans les 3 premières secondes : je ne vois pas de levier simple sur la découpe de Rollup.

## 4. Trace CPU ×4, en chaud (`mesure/trace.mjs`, `sorties/trace-apres2.json`)
- **Accueil** : somme des tâches du fil principal 646 ms, aucune tâche ≥ 50 ms (la plus longue 48 ms), `index` (React, fonction `At`) 124 ms, Firebase IndexedDB ~55 ms. L'accueil est limité par le RÉSEAU (octets, requêtes en série), pas par le CPU : aucune cause CPU à corriger.
- **Atelier V5.5** : 1 375 ms de tâches, 3 tâches ≥ 50 ms, la plus longue 581 ms ; 924 ms en `RunMicrotasks` (évaluation des modules du chunk `Host` et de ses JSON), 122 ms de styles, 57 ms de mise en page, ~70 ms d'analyse en arrière-plan. Cause = évaluation du chunk, pas un calcul ni un rendu : d'où la décision de ne pas le précharger par `import()` (il bloquerait l'entrée ~0,6 s, en CPU ×4, sur un repos).

## 5. Contrôles sur 1cd9336b (propre : aucun patch de banc dans le commit)
- `npx tsc --noEmit -p .` : seules les erreurs `firebase-admin/firestore` (module absent du worktree, connu), rien dans les fichiers touchés.
- `VITE_HOP_V4=on npx vite build` : exit 0 ; `check-build-flags.mjs dist` : DRAPEAUX OK (flags → "on", enrichissement → "production") ; `check-no-dev-auth.mjs` : exit 0. (`npm run build` échoue dès `tsc` sur `firebase-admin`, environnement.)
- Tests : `prechargeVues` 5/5 ; `hopV55RecipeStep` vert ; `brewerHarness.test.ts` non collecté (`cheerio/slim` absent : environnement, comme sur le tag).
- **Suite complète : non lancée** (voir DEMANDE EXECUTANT). **BatchDetailSheet en `lazy` : non exercé au geste.**

DEMANDE EXECUTANT :
1. Build de banc à jour : `sh %TEMP%/l2-build2.sh` en changeant la sortie en `l2-dist-apres3` (le script applique `mesure/patch-banc.mjs apply .`, lance `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/l2-dist-apres3 --emptyOutDir`, puis `revert` : `git status --short` dans `%TEMP%/l2-wt` doit rester propre). Attendu : `BUILD-EXIT 0`, `REVERTED`.
2. Série : dans `mesure/serie2.sh` remplacer `l2-dist-apres2` par `l2-dist-apres3`, puis `sh mesure/serie2.sh` (≈ 25 min, rien d'autre en parallèle), `node mesure/resume.mjs`. Attendu : `SERIE-FIN`, 18 lignes `ACCUEIL`, aucune vue `false`. Juger : V5.5 doit repasser ≈ 3 s dans « après 25 s » ; Stocks/Clients ≈ ±50 ms en « touchée aussitôt ».
3. `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-lenteur/voies/l2/tests.txt` dans `%TEMP%/l2-wt` (en arrière-plan, attendre) ; comparer à `%TEMP%/l2-wt-avant` : zéro nouveau rouge (connus : fuzzSaisie, recipeAiWorkflow, recipeEditing, designTokens, virgule-transversale ; collectes `firebase-admin`/`cheerio` identiques).
4. Captures : `node mesure/banc-local.mjs 4175 froid 1 x.json sonde` (serveur `serveur.mjs` sur `l2-dist-apres3`, port 4175) écrit `%TEMP%/l2-accueil-4175.png`, `l2-vue-<nom>-4175.png` : à OUVRIR (accueil, Brassins, Stocks, Finances, Clients, V5.5 : sans « Chargement de l'écran… » ni cassure). Je ne les ai pas ouvertes sur apres2/apres3.
5. À la main, données de test : ouvrir une fiche de brassin (BatchDetailSheet lazy), la fermer, la rouvrir.

DÉCISION À PRENDRE : (a) ne PAS déployer 1cd9336b tant que l'atelier V5.5 est +2,1 s à froid ; ou (b) voie l3 « bibliothèque de levures asynchrone » (`predictionReferences.guidePredictionKnowledgeQualification` et ses appelants : `brewingScenarioContext`, `guideData`, panneaux houblons) puis tout est gagnant. Je recommande (b), après la série finale (qui dira si le préchargement suffit à ramener V5.5 à ≈ 3 s dans l'usage normal).

CONNAISSANCE : (1) un alias de `vite.config.ts` (`./brewerTools.js` → `src/domain/brewerTools.ts`) donne à tout importeur de `functions/src` le module entier ; une analyse d'imports doit appliquer les alias (`%TEMP%/l2-chaine-ts.mjs`). (2) L'accueil est limité par le réseau, pas par le CPU : 646 ms de tâches, aucune ≥ 50 ms, en CPU ×4. (3) L'atelier V5.5 coûte 1,4 s de CPU ×4 à l'évaluation du chunk (924 ms de microtâches). (4) Le patch de banc ne se commite jamais ; `npm run build` ne passe pas dans un worktree sans `functions/node_modules` : utiliser `npx vite build` + les `check-*`.

LEÇON PROPOSÉE : un outil de chaîne d'imports écrit à la main doit lire les alias du bundler et être validé sur la vraie sortie du build (URL chargées par vue) avant d'écrire « non atteint » ; la 1re passe de l2 a conclu à tort sur une regex (même famille que L29 : méthode standard = AST, pas regex).
