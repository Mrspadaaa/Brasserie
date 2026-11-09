OK — c3a porté : flux 3 notions, litre 7,51 en trois temps, feuilles de nœud ; 112 tests verts, 8 captures ouvertes

## Fichiers écrits (Possède)
`src/ui/finance/CoutBrassinFlux.tsx` (neuf), `src/ui/finance/cout-brassin.css` (neuf), `src/ui/finance/BrewBudgetSheet.tsx` (refait : flux + vues de nœud), `src/ui/finance/BrewBudgetDialog.tsx` (usure d3, `onOpenForecast`),
`src/domain/finance/brewBudget.ts` (additif : `fraisParPoste`, `quandPaye`, `netVolumeSaisi`, `reductionImpotPourAnnee`), `tests/unit/brewBudget.test.ts` (+ bloc), `tests/unit/coutBrassinFlux.test.ts` (neuf),
`tests/integration/brewBudgetSheet.test.tsx` et `brewBudgetDialog.test.tsx` (refaits : nouveau parcours, tests de règle conservés), `voies/uc/` : `PLAN.md` (§ 9 : sort de chaque constat des deux revues), `tests-head.txt`, `tests-rouge.txt`, `tests.txt`, `tests-appelants.txt`, `tsc.txt`, `capture.mjs`, `cote-a-cote.mjs`, `captures/`.
`brew-budget.css` non touché (la feuille de nœud réemploie ses classes). `git status` : mes fichiers ; `ClientsTab.tsx`, `BatchDetailSheet.tsx`, `forecast.ts`, `brewForecast.ts`, `impotBiere*` sont ceux d'up et de d2.

## Sorties décisives
- Rouge : `tests-rouge.txt` = les anciens tests de la feuille rejoués sur le nouveau code (`25 failed`), le parcours ayant changé ; les tests de domaine de `brewBudget.test.ts` ont été écrits juste après le code additif (pas de rouge enregistré pour eux : dit, pas caché).
- Vert (`tests.txt`) : `Test Files 4 passed (4)` · `Tests 112 passed (112)` (brewBudgetSheet, brewBudgetDialog, coutBrassinFlux, brewBudget).
- Appelants (`tests-appelants.txt`) : les 17 fichiers de HEAD + `chaineLitre`, `brewStockConsumption`, `contreCalculUnites`, `materielFutur`, `swissBeerTax`, `brewBudget`, `coutBrassinFlux` : `Test Files 23 passed (23)` · `Tests 354 passed (354)`. HEAD avant : 16 fichiers, 158 tests verts.
- `npx tsc --noEmit` (`tsc.txt`) : 2 erreurs, toutes `firebase-admin/firestore` introuvable (poste) ; aucune dans mes fichiers. `controle-virgule.mjs` : `VIRGULE OK` (après avoir réécrit `fr` avec `replace('.', ',')`).
- Bloquant UC-1 des revues : `netVolumeSaisi` ; test « enregistrer sans net, rouvrir » → « ? L nets », jamais 7,21.
- Fixture de c3a rejouée dans l'écran : 22,41 · 64,26 · 116,10 ; « 202,77 ÷ 27 L = 7,51 » ; 0,83 · 2,38 · 4,30 ; « À payer » : 64,26 = 33,42 avant le brassage + 30,84 plus tard.

## Captures (toutes ouvertes), `voies/uc/captures/`
`c3a-{390,1280}-{clair,cave}-{repos,a-payer,volumes,frais,malt}.png` (20), prises sur `?dev-local&finance-demo` (Finances › Coûts › Pale Ale de septembre) ; planches `cote-a-cote-390-clair.png` et `cote-a-cote-390-cave.png` (maquette | app, repos et À payer). Ouvertes : repos 390 clair et cave, À payer 390 cave, À payer 1280 clair, volumes 390 clair, frais 390 clair, malt 390 cave, planche clair. Non ouvertes une à une : les autres états de 1280 cave et volumes/frais/malt de 1280. Le jugement final revient au critique.
Pendant les captures, 3 défauts vus puis corrigés : bouton Prévoir sans fond (variables CSS hors de la feuille), libellés de destination collés aux montants (largeur en % au lieu de 250 px), parts du litre collées.

## Ce que la maquette fait, et le port (L03)
Repris tels quels : flux (3 sources, destinations, rubans, 1,62 px/CHF, nœuds ≥ 12 px), bloc noir 202,77 ÷ 27 L = 7,51, barre du litre, Expliquer + Prévoir, état « À payer » jaune avec estompage. Cas neufs rangés dans ses états : partiel (« ? », litre « — »), reproduction, rattachement, estimation enregistrée, litres nets inconnus, HT.
Écarts voulus (décisions du pilote 5 et 6) : pointillé « estimé » au lieu de « exemple » ; feuille sans fil d'Ariane ni barre du bas. Écarts à faire valider : « Emballage » sans « 33 cl » (aucune source du format dans le code) ; le bloc noir porte une 2e ligne « sans houblon ni levure » quand la recette n'en a pas ; la pastille « 27 L nets » reçoit une bordure (elle est un bouton).

## Doutes et limites
- Cibles tactiles : les nœuds de destination sont des boutons de 24 px de haut (maquette : lignes de texte de 13 px, B4 annoncé « ≥ 40 px » dans sa NOTE) ; les sources font 44 px. À juger par le critique à 390 tactile ; non mesuré au doigt.
- Sur 1280 la feuille reste une colonne de 390 px centrée (le SVG est en `preserveAspectRatio="none"` ancré à 390 px comme la maquette).
- Les vues de nœud s'ouvrent dans la même Sheet (hauteur variable selon le contenu : plus courte que le flux).
- « Expliquer » prépare la question et ouvre `BrewerChat` sans l'envoyer ; testé avec `BrewerChat` simulé, rien appelé en vrai.
- « Prévoir » : écrit `finances_workspace = forecast` et appelle `onOpenForecast({ planId, batchId })` si fourni ; aucun branchement dans `FinancesTab`/`App` (décision 2) : le brasseur ne voit pas encore la ligne dans Prévisions.
- Nœud « Impôt bière » : calcul et densité visée dits « estimé » ; le lien vers la feuille d'up viendra au branchement.
- Non rejoué ici (déjà noté par d1 et d3) : `financeAssistantContext.test.ts` (firebase-admin absent). `assistantContext.ts` ne lit pas encore `fraisParPoste`.
- Séries mécaniques : j'ai lancé moi-même les 20 captures (un script, un essai après correction du clic « Coûts ») ; aucune `DEMANDE EXECUTANT`.

DÉCISION À PRENDRE : up et d2 doivent reprendre `netVolumeSaisi` et `reductionImpotPourAnnee` (exportés de `brewBudget.ts`) pour que c3a, p2b et la prévision donnent le même litre et la même réduction. Recommandé : oui, une ligne chacun.
CONNAISSANCE : un instantané enregistré sans net saisi porte le volume à brasser (30 L) dans `netVolumeL` : seul `netVolumeSource === 'saisi'` dit que c'est un net. `fraisParPoste` et `quandPaye` (33,42 / 30,84) sont désormais dans l'instantané de `estimateBrewBudget`.
LEÇON PROPOSÉE : un script écrit par un heredoc du Bash perd encore les barres inverses (`\D` devenu `D` dans une regex de test, vu ici) : écrire le code et les tests avec Write ou Edit, comme la consigne le dit.
