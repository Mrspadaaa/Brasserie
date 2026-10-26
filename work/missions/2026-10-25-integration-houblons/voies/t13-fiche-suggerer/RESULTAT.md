OK — Fiche (appui long) et Suggérer (hopSuggest, Appliquer par la porte, Comparer (n)) portés dans l'app ; entrée « Comparer (n) » de Ma bière absente de la maquette

## Fichiers écrits
- Nouveaux, dans l'app : `src/ui/hopIndex/fiche/` (FicheHoublon, Matrice, RadarFiche, Replis, Silhouette, sources, donnees-matrice, Feuille + feuille.css, fiche.css, `hote.tsx` = l'hôte, `FicheApp.tsx` = l'hôte de l'app, `comparaison.ts` = houblons retenus en mémoire) ; `src/ui/hopIndex/suggerer/` (briques, bulle, divergent, hors16d, radar, voies, vue-radar, index, css, `hote.tsx`, `EcranApp.tsx`, `CadreApp.tsx`) ; `tests/unit/hopIndexV4/ficheSuggererApp.test.tsx` (10 tests) ; `banc-t13.mjs` + `captures/` (cette voie).
- La maquette ne garde que ses hôtes : `ecrans/fiche/FicheHoublon.tsx` (pose l'état du parcours en hôte de la fiche) et `ecrans/suggerer/index.tsx` ; les autres fichiers sont des `export * from` (comme T12, T15). Le dessin n'a pas changé : un seul code d'écran.
- Modifiés dans l'app : `HopToolLayer.tsx` (hopSuggest monte Suggérer en `lazy`, drapeau hopV4 allumé seulement), `maBiere/EtapeHoublons.tsx` (la fiche en feuille par appui long ; lignes de t12c gardées), `comparer/EcranApp.tsx`, `comparer/hote.tsx`, `comparer/index.tsx` (appui long : `Fiche` + `onFermer`), `comparer/Feuilles.tsx` (champ de recherche : `Input` de l'app, audit_inputs).
- Hors Possède, nécessaires, signalés : (1) `src/ui/hopIndex/substituer/donnees.ts` (nouveau, déplacé de `ecrans/substituer/donnees.ts`, qui réexporte) : la fiche en lit les remplaçants ; (2) `src/ui/hopIndex/parcours/{calculs,calcul,useCalcul}.ts` (nouveaux) et `prototypes/.../moteur/{calculs,useCalcul,client}.ts` (réexport ; `client.ts` pose son client avec `poserClient`) : `useCalcul` n'existait que dans la maquette ; l'app prend le fil principal par défaut, la maquette garde son worker.
- Règle retirée de `suggerer.css` : `html:has(.pq-outil-suggerer) [data-page-shell]:not(.pq-outil-suggerer) { display:none }` cachait aussi la couche posée par-dessus Suggérer (Comparer, vu sur la 1re capture). L'App retire déjà la base couverte ; la maquette ne monte pas Ma bière sous un outil.
- Non touchés : `Base.tsx`, `BrewWizard.tsx`, `PageShell.tsx`, `RadarBase.tsx`.

## Critères
- `npx vitest run tests/unit/hopIndexV4 tests/integration` : 2256 passés, 23 en échec dans 10 fichiers, tous connus ou de charge : `hopV55*` (7 fichiers), `monkey` (3), `YeastRecipeChoice` (1) = #177 ; `fuzzSaisie` (1) a échoué en lot sous charge (délai) et passe seul (12/12). Ensuite `tests/unit` entier : 5364 passés, 1 échec `hopV55QualifiedAdviceController` (#177). Mes tests : `ficheSuggererApp` 10/10 ; `comparerApp` 8/8 ; `designTokens` vert ; `prototypes/houblons-v4/tests/client-async` + `worker-calculs` 16/16.
- `npm run build` : vert. `tsc` vert ; `verifier-types.mjs` : TYPES OK ; `audit_inputs.mjs` : INPUT PROTECTION AUDIT PASSED.
- Maquette reconstruite (`construire.mjs` : CONSTRUIT OK, 9 pages), rejouée après les derniers changements : `CHOIX OK (7 écrans)`, `ETATS OK (139/139)`, `RADAR-BASE OK (9 vues)`.
- Captures 390 × 844 (`VITE_HOP_V4=on`, `?dev-local&etape=houblons`), toutes ouvertes : `fiche-appui-long.png` (Nugget, g1 + matrice flb5b, ouverte par appui long dans Ma bière), `suggerer-repos.png`, `suggerer-fiche.png` (appui long sur Aurum dans Suggérer ; Suggérer reste ouvert dessous), `suggerer-apres-ajouter.png` (mode Radar, « Appliqué : Ajouter Aurum · 10′ · 10 g », IBU 60 → ~61 : écrit par la porte), `suggerer-retenues.png`, `comparer-depuis-suggerer.png` (Comparer (2) ouvert depuis « Comparer (2) »). Aucune erreur de page.

## Fluidité (dev, modules non groupés : pessimiste)
- Ouverture de Suggérer à froid, chunk compris : 682 à 851 ms.
- ×4 (fermer, rouvrir), sans bridage : 267 / 258 / 214 / 235 (médiane 258) ; autre prise 344 / 206 / 329 / 358 (médiane 344). Processeur ×4 plus lent : 550 / 420 / 413 / 657 (médiane 550) ; autre prise médiane 607 ms. Le 447 ms de #179 est donc du même ordre. Tas JS 108 à 122 Mo (budget 120 : à la limite, après plusieurs écrans).
- Pas de bloquant au sens de la règle ; le coût est le rendu (comme T15b), pas le moteur. Pas de compromis proposé avant mesure de production.

## Essais
Un par critère, sauf : captures (3 passes : sélecteur de voie, retenue des voies, règle CSS qui cachait Comparer), designTokens et audit_inputs (1 chacun après le message du pilote).

## Doutes et limites
- « Comparer (n) » dans Ma bière : la maquette n'en a pas (l'onglet « Comparer (n) » n'existe que dans la tête de l'onglet Ma bière analyse `hopBeer`, de Suggérer et de Comparer) ; rien ajouté.
- Le stock du banc est vide : aucune voie n'est retenue d'avance (« Comparer (0) » grisé), la visée est celle de la demande dégustée (`DEMANDE_DEGUSTEE`) : l'app n'a pas encore de visée posée. Les goûts (♡ de la fiche, de Suggérer) restent en mémoire, comme la maquette.
- La fiche est une feuille locale : le retour du téléphone ferme la couche, pas la feuille d'abord ; elle n'a pas d'entrée d'historique (le Sheet de l'app n'en a pas).
- Les houblons retenus (`fiche/comparaison.ts`) sont de session, partagés entre recettes. À vider quand le brouillon change si le brasseur le demande.
- L'onglet « Suggestions » de Comparer et « Comparer (n) » de Suggérer empilent des couches (pas de remplacement) : la pile grandit en va-et-vient.
- « Défaire » d'« Appliquer » : les identifiants de la voie sont rapprochés de ceux relus du brouillon (table d'alias) ; vérifié par la capture (Appliqué puis recette modifiée), l'annulation n'a pas été rejouée au navigateur.
- Le champ de recherche de Comparer passe par `Input` (`type="search"`) : un rendu légèrement différent est possible ; la capture de ce champ n'a pas été reprise.
- Non rejoués : `controle-appui.mjs`, contrôles de la fiche en route (`controle-fiche`), faute de tours.

DÉCISION À PRENDRE : la fiche doit-elle devenir une couche de la pile (retour du téléphone, URL) ou rester une feuille locale ? Options : (a) feuille locale (fait, simple, le Sheet n'a pas d'historique) ; (b) ajouter `hopFiche` à `LayerRoute` (touche `useFullScreenRoute.ts`, hors voie). Recommandation : (a) tant que le retour du téléphone n'est pas jugé gênant ; (b) avec T14 (URL).

CONNAISSANCE : un style CSS de la maquette écrit pour « une page seule » (`html:has(.pq-outil-x) [data-page-shell]:not(…)`) casse la pile de l'app ; les règles globales d'écran se vérifient avec deux couches empilées.
LEÇON PROPOSÉE : aucune
