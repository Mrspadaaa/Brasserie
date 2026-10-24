ECHEC — G1 : verifier.mjs casse son fichier de sortie (espace) ; 19 rouges hors voie

Le livrable est fait : la pile, le wizard monté sous les couches, les tests verts, le parcours Chrome joué. Le build est vert.

## Fichiers écrits
- `src/pages/useFullScreenRoute.ts` : la pile. Même API qu'avant (`route`, `open`, `close`). Ajouts : `pile`, `base`, `layers`, `closeTo` et `replaceTop`. Le type `Route` reçoit `hopBeer`, `hopSuggest`, `hopCompare`, `hopTiming` et `hopSubstitute`, et `isLayerRoute` est exporté. Règle : une PAGE (`recipe`, `brewday`, `wizard`) se pose sur les onglets, sous la forme `[tabs, page]` ; son retour ramène aux onglets, comme avant. Une COUCHE (`hopV55` et les outils v4) s'empile, et son retour dépile un niveau. Le retour `hopV55` en est le cas particulier. Chaque entrée d'historique porte une profondeur (`affinee-parcours`, même clé que la maquette), et `popstate` garde les étages jusqu'à cette profondeur. `closeTo` saute en un seul `history.go(-n)`. Une page ouverte sans entrée poussée (lien `?brewday=`) se ferme sur place, comme avant.
- `src/App.tsx` :
  - la page de base est rendue dans un `div[data-route-base]` (`display: contents`), à la même place de l'arbre, et les couches au-dessus (`div[data-route-layer]`), chacune dans son propre `LazySurface` ;
  - couverte, la base reçoit `aria-hidden` et PageShell rend sa branche inerte. L'élément React de la base est réemployé tel quel (`frozenBase`), donc ouvrir une couche ne refait ni son rendu ni son style ;
  - la clé du wizard, `wizardDraftId`, `routedRecipe`, `routedBatch` et `RecipeSurface` se calculent sur la base, et non plus sur le sommet. Le libellé du compagnon, le bandeau d'erreur et le lanceur restent calculés sur le sommet, comme avant ;
  - un crochet sans `pile` (le faux crochet des tests existants) vaut une pile d'un seul étage.
- `src/ui/hopIndex/flags.ts` : `hopV4Enabled()`, éteint par défaut (`VITE_HOP_V4=on` au build seulement). Rien ne le lit encore : aucun bouton ne l'utilise tant que T12 n'est pas porté.
- `src/ui/hopIndex/devHook.ts` : `window.__hopPile` (`open` limité aux couches, `close`, `closeTo`, `pile`), posé seulement si `import.meta.env.DEV`.
- `src/ui/hopIndex/HopToolLayer.tsx` : couche provisoire, sans contenu métier (titre de l'outil, niveau). Chargée à la demande.
- `tests/integration/routePile.test.tsx` (5 tests, crochet) et `tests/integration/AppRoutePile.test.tsx` (2 tests, vraie App, vrai crochet, vrai wizard).
- Dossier de la voie : 10 captures `pile-*.png`, `parcours.mjs` (script Chrome), `parcours-journal.json`.

## Preuves des tests
- `routePile` : pile de 4 couches sur le wizard, puis retour niveau par niveau (téléphone et « ‹ ») ; les retours existants (page → onglets, atelier → page) ; `closeTo` en un saut ; `replaceTop` ; `?brewday=` fermé sur place sans reculer dans l'historique.
- `AppRoutePile` :
  - wizard d'une recette enregistrée, étape Houblons, puis 4 couches. Pendant ce temps, la recette enregistrée change (instantané simulé). Après 4 retours : même nœud DOM de PageShell, même étape, `readRecipeDraftState` toujours appelé 1 fois (aucune relecture), brouillon identique, aucun `DraftFreshnessChoice` ;
  - témoin dans le même test : fermer puis rouvrir le wizard (le chemin remonté) fait apparaître « La recette enregistrée a changé » ;
  - RecipePage → atelier V5.5 → retour, puis RecipePage → outil v4 → retour : l'état local (compteur) est conservé et c'est la même instance.
- Témoin par mutation : une clé qui force le remontage de la base (`key={layerRoutes.length ? …}`) fait échouer les 2 tests d'App (« expected <div data-page-shell> to be <div data-page-shell> »). La mutation a été retirée.
- Tests de retour existants (`AppQuickActionReturn.behavior`, `fix114`, `brewLegacyInstallationApp`) : 10/10 verts avant et après. Un premier essai les avait cassés : leur faux crochet n'exporte que `useFullScreenRoute`, et App importait `isLayerRoute`. App n'importe plus que `useFullScreenRoute`, et le découpage base/couches vient du crochet.

## Cas `DraftFreshnessChoice` sur une recette enregistrée
Le choix ne surgit qu'à la relecture du brouillon par un wizard remonté, quand l'empreinte serveur a changé (`recipeDraftResumeCheck`). Avec la pile, le wizard n'est jamais remonté sous une couche : pas de relecture, donc pas de choix, même si la recette change pendant l'outil. C'est prouvé en Vitest (voir ci-dessus) et dans Chrome (étape 4 ci-dessous), avec chaque fois le témoin du chemin remonté qui, lui, fait surgir le choix.

## Parcours Chrome
App locale `vite` (port 3418, `?dev-local`), contexte Chrome neuf, téléphone 420×900. Fixtures injectées dans le navigateur (recette `REC-PILE`, brassin `LOT-PILE`). Réseau hors localhost bloqué : aucune donnée réelle, aucun Gemini. Script : `work/missions/2026-10-25-integration-houblons/voies/t3-pile/parcours.mjs`. 27 vérifications, `PARCOURS OK`, aucune erreur de page. Captures ouvertes en image :
1. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-01-atelier-v55.png` : Brassins → « Atelier Houblons V5.5 ». L'atelier s'ouvre plein écran (« Explorer sans recette »), pile `tabs>hopV55`.
2. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-02-retour-atelier-onglets.png` : le retour du téléphone ramène à l'onglet Brassins (inchangé).
3. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-03-recette-apres-atelier.png` : recette « Pale de la pile » → atelier → retour. La section « Potentiel aromatique », ouverte avant, l'est encore (même instance, ce qui est nouveau : avant, la page était remontée). Un retour de plus ramène aux onglets.
4. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-04-brassage.png` : brassin « Lot de la pile » ouvert par la recherche. Le retour ramène aux onglets (inchangé).
5. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-05-wizard-avant.png` : wizard de la recette enregistrée, étape « Houblons 3/7 », titre modifié (brouillon écrit), contenu défilé de 160 px.
6. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-06-couche-ma-biere.png` : couche « Ma bière », niveau 1, posée sur le wizard.
7. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-07-couche-suggerer.png` : couche « Suggérer », niveau 2, « Brouillon de la recette ouverte dessous ». Pendant cette couche, la recette enregistrée est modifiée (cache local).
8. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-08-wizard-apres.png` : après deux retours, la capture est identique à la n° 5. Même nœud DOM (marque posée avant), étape Houblons, défilement 160 → 160, brouillon identique octet pour octet, aucun `DraftFreshnessChoice`.
9. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-09-quatre-couches.png` : pile `tabs>wizard>hopBeer>hopSuggest>hopCompare>hopTiming`. Quatre retours ramènent au même wizard, à la même étape.
10. `work/missions/2026-10-25-integration-houblons/voies/t3-pile/pile-10-temoin-remonte.png` : témoin. Wizard fermé puis rouvert (remonté) : « La recette enregistrée a changé », le choix que la pile évite.

## Mesures : ouverture d'une couche (ms, de `open` à deux images peintes)
Serveur de DÉVELOPPEMENT (React en mode dev, modules non groupés), Chrome sans écran, 420×900 :
| Ouverture | CPU ×1 | CPU ×4 |
|---|---|---|
| couche sur les onglets (rien à garder dessous) | 60 à 68 | 404 à 537 |
| couche sur la recette | 90 à 105 | 409 à 787 |
| couche sur le wizard | 59 à 61 | 420 à 473 (1249 une fois, première couche à l'étape Houblons) |
| couche sur une couche | — | 306 à 409 |
| première couche à froid (chargement du module) | — | 1375 à 1644 |

- Avant le gel de la base, une couche sur le wizard coûtait 1116 à 1256 ms (×4) et 126 à 132 ms (×1) : React refaisait le rendu du wizard, et `visibility: hidden` en recalculait tout le style. Après le gel, une couche sur le wizard coûte autant qu'une couche sur les onglets. La pile n'ajoute rien de mesurable au plancher actuel d'une page PageShell.
- `aria-hidden` sur la branche du wizard (760 éléments) : 0 ms. `inert` (posé par l'isolation de PageShell, existante) : 44 à 70 ms à ×4.
- **Budget ≤ 100 ms ×4 : non démontré.** En dev, même une couche vide sur les onglets coûte 400 ms à ×4 (profil : rendu dev de React `jsxDEV`, `check` et `focus` de PageShell, travail natif de style et de mise en page). L'app de production ne s'ouvre pas en `?dev-local`, donc je n'ai pas mesuré le build. Voir DÉCISION.

## Critères
- **G2** `npm run build` → `✓ built in 26.69s`, code 0. `__hopPile` est absent de `dist/assets/*.js` : le crochet de dev ne part pas au build.
- **G1** `node work/missions/2026-10-25-integration-houblons/voies/t3-pile/verifier.mjs` → `- pile et retours : vitest n'a rien rendu` puis `PILE ECHEC (1)` (2 essais). La cause est dans le vérificateur, pas dans le code :
  - le nom de son lot, `'pile et retours'`, contient des espaces. `spawnSync(..., { shell: true })` ne cite pas les arguments sous Windows, si bien que `--outputFile=%TEMP%	3-pile et retours.json` est coupé en trois ;
  - vitest écrit donc dans `%TEMP%	3-pile`, sans extension, et prend « et » et « retours.json » pour des filtres. Le vérificateur cherche `t3-pile et retours.json` et ne le trouve jamais. Au premier essai, `%TEMP%	3-pile` était même mon dossier de travail ; je l'ai renommé, sans effet ;
  - le fichier écrit par vitest montre que le lot lui-même est vert : **414/414**, 0 échec, dont `routePile`, `AppRoutePile`, `AppQuickActionReturn.behavior` et `fix114` ;
  - correctif à faire par le pilote (je n'ai pas touché au critère) : un nom sans espace (`pile-retours`), ou des arguments cités.
- **Suite complète** (`npx vitest run`, rapport JSON) : 7475/7494, **19 échecs dans 11 fichiers**, tous hors de la voie : 6 `hopV55Page*`, `hopV55PropertyAdviceDecision`, `monkey`, `YeastRecipeChoice`, `hopV55QualifiedAdviceController` et `hopV55QualifiedStudyController`.
  - Rejoués seuls (`--maxWorkers=2`), ils restent rouges : 15 échecs, 102 verts.
  - Aucun n'importe `src/App` ni `useFullScreenRoute`, seuls modules existants que j'ai modifiés. `useFullScreenRoute` n'est importé que par `App.tsx`, et App seulement par `main.tsx` et des tests d'App. Mes fichiers neufs ne sont importés que par App.
  - Lecture probable : défauts ou délais déjà présents dans l'arbre (le dépôt porte d'autres modifications non commitées) et non causés par la pile. Je n'ai pas pu le prouver sur HEAD : pas de second arbre avec `node_modules`.

## Essais, doutes et limites
- Essais : G1, 2 essais du vérificateur et 1 correction du code (faux crochets des tests existants) ; G2, 1 essai ; script Chrome, ajustements de sélecteurs seulement.
- Comportement nouveau, invisible : sous l'atelier V5.5, la recette (ou le brassin) reste montée au lieu d'être remontée au retour. L'état ouvert de la page est donc gardé (capture 3). Ses props sont figées tant que l'atelier la couvre, puis rafraîchies au retour.
- `closeTo` sans cible pose `fallback` sur le fond. Il n'est employé que par le crochet de dev, qui ne l'appelle que si la cible existe.
- Une entrée d'historique « en avant » (bouton avancer) ne rouvre pas la couche, comme avant (l'ancien crochet reposait `tabs`).
- Le titre saisi dans Chrome s'est ajouté au nom (« Pale de la pilePale du brouillon ») : c'est un artefact du script de saisie, sans effet sur la preuve.

DÉCISION À PRENDRE : (1) G1. Le vérificateur ne peut pas rendre « PILE OK » tant que le nom de son lot contient des espaces, et la suite complète a 19 rouges hors de la voie. Options : (a) corriger le vérificateur puis comparer les rouges à HEAD sur un arbre détaché ; (b) accepter la voie sur le lot vert (414/414) et le parcours Chrome. Recommandation : (a), puis (b) si les 19 rouges existent sur HEAD.
(2) Budget « ouvrir une couche ≤ 100 ms ×4 ». Il n'est pas mesurable en dev, où le plancher d'une page PageShell vide est d'environ 400 ms à ×4. Options : (a) le mesurer sur un build de production avec un accès de test (banc T17) ; (b) alléger le plancher de PageShell, hors de ma portée : `check` de l'en-tête, `focus`, `inert` sur la branche, rendu des onglets sous les pages. Recommandation : (a) d'abord, dans T17, puis (b) si le build dépasse le budget.
CONNAISSANCE : dans l'app, une couche (`hopV55`, outils v4) s'empile et garde la page dessous montée (même instance, défilement, étape) ; une page remplace tout au-dessus des onglets. Une couche vide coûte environ 60 ms à ×1 et environ 400 ms à ×4 en dev, quelle que soit la base, une fois la base gelée.
LEÇON PROPOSÉE : un faux module (`vi.mock`) des tests existants ne fournit que les exports d'hier ; un nouvel export importé par App les casse tous. Avant d'ajouter un export à un module souvent remplacé par un faux, chercher ses `vi.mock` et faire passer la nouveauté par la valeur que le faux renvoie déjà (ici le crochet).
