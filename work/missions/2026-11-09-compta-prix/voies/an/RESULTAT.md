OK — outil d'analyse a2a (Caisse, Sources, Budget, Filtrer) branché sous Synthèse › « Revoir le mois » ; tests, tsc, build verts, captures ouvertes

## Fichiers écrits
- Neufs : `src/domain/finance/analyse.ts`, `src/ui/finance/analyse/{format.ts, Escalier.tsx, Caisse.tsx, Pourquoi.tsx, Sources.tsx, Budget.tsx, Filtrer.tsx, Analyse.tsx}`, `src/ui/finance/analyse.css` (préfixe `ana-`), `tests/unit/analyse.test.ts` (40 tests), `tests/integration/analyse.test.tsx` (5 tests).
- Modifiés dans « Possède » : `src/ui/finance/FinanceOverview.tsx` (ligne « Revoir le mois », props optionnelles `profile`, `stockItems`, `onPrevisions` ; sans `profile` la ligne n'est pas offerte), `src/components/tabs/FinancesTab.tsx` (trois props passées, rien d'autre), `tests/integration/renvoisPartout.test.tsx` (un `it` : Caisse puis Sources, Budget, Filtrer).
- Voie : `voies/an/{PLAN.md, tests.txt, capturer.mjs, captures/ (98 png)}`.

## Critères
- Les quatre corrections de la reprise : appliquées (la quatrième de Sources par Edit : le script Bash avait perdu la barre inverse de la regex, vu à « MANQUE »).
- `npx tsc --noEmit -p .` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch : aucune erreur.
- Tests (`tests.txt`) : `Test Files 19 passed (19) / Tests 261 passed (261)` (analyse unit + intégration, renvoisPartout, synthese, periodeSynthese(+Plage), financeWorkspace, tous les fichiers qui rendent FinancesTab).
- `npx vite build --outDir $TEMP/an-build` : « built in 35 s ».
- Captures : `node work/missions/2026-11-09-compta-prix/voies/an/capturer.mjs` → 98 captures, 0 erreur console, 0 débordement horizontal, 0 clic manqué. 390 tactile et 1280, clair et cave, jeux `finance-demo=reel` et `finance-demo` (riche), Synthèse + Caisse (30 j, 90 j, 12 mois) + Sources + Budget + Filtrer (+ pastille Brassage). Serveur 3011 arrêté.

## Constats de la revue visuelle (côte à côte avec a2a-v1…v5 et a2a-1280)
Corrigés pendant la voie (1 à 9) :
1. Filtrer : « janv.. », « nov.. » (point doublé après `moisCourt`) : corrigé.
2. Sources, jeu riche : graduations qui se chevauchent (« -1 0000 1 0002 000 ») : 3 graduations visées, lisibles.
3. Escalier 390 : texte « −186,80 » plus large que l'étiquette, coupé par la pastille 1 : largeur calculée sur le texte réel (libellé et nombre mono).
4. Filtrer : étiquette « nov. −186,80 » hors du cadre, sous la pastille 1 : posée au-dessus, alignée à droite près du bord.
5. Sources : libellé « Pas encore pa… » tronqué : deux lignes permises.
6. Budget : « 0 mois sur 1 au-delà » : dit « dans le prévu » à 0.
7. Clé React dupliquée `autres` (Sources, jeu riche) : renommée `mouvements`.
8. Caisse : « Fixer un budget » alors que des plans payés existaient : `fluxPrevus` ignorait les plans `completed` ; le prévu d'une période passée les compte (un test, ni brouillon ni annulé). Le brassin payé (prévu → réel) en profite aussi.
9. 1280 : l'escalier remplissait 700 px de haut, étiquettes énormes : colonne 720 px, figures 560 px.
Titre 390 : « 12.10 → 10.11 » ne passe plus à la ligne (le mot « Synthèse » du retour est caché sous 460 px, flèche et libellé accessible gardés).

Restent (acceptés ou hors voie) :
10. Jeu `reel` : toutes les opérations tombent le 10.11, la marche est un trait vertical à gauche avec 8 000 à −2 000 d'échelle (le matériel −5 500 écrase le reste) : c'est sa donnée, dite sans inventer ; la figure 5 de a2a est plus dispersée.
11. La pastille « Compagnon hors connexion · mode local » (fixe, hors de cette voie) recouvre le bas de la Caisse et de la tâche « Budget, Sources : rien de prévu » à 390 ; on la dépasse en défilant.
12. Jeu riche : la Caisse dit « Fixer un budget » (aucun prévu entre le 12.10 et aujourd'hui : le loyer récurrent commence le 25.11) pendant que Budget compte le mois de novembre entier (400 + 64,26 prévus). Cohérent par la règle « mois entiers », mais lisible comme une contradiction.
13. Filtrer en plage : tuiles + rangée native `PlageMois` (deux sélecteurs date), absente de a2a ; pastilles source/fournisseur/brassin sont des `<select>` natifs sous un chip (pas de feuille propre).
14. Cinq tuiles « rien noté » (jeu riche, janv.–avr. ; jeu reel, tout) : texte répété ; a2a les hachure pareillement.

## Décisions et écarts à connaître
- ✦ Pourquoi ? : gabarit sourcé « Calcul fait ici, sans IA » (aucun chemin IA en Synthèse : grep). DÉCISION À PRENDRE (pilote) : une vraie IA au toucher serait un lot à part, simulé en test, jamais Gemini dans `npm test`. Recommandation : le garder ainsi tant que le brasseur ne le demande pas.
- Sources, Budget, Filtrer comptent en mois entiers (`periodeSynthese` ne connaît pas le jour) ; seule la Caisse est au jour.
- Brassin prévu → réel : prévu = plan « brew » du brassin, réel = pièces rattachées. Le coût du litre (`chaineLitre`, `troisNotions`) reste dans Prix : écart avec la VOIE.
- « Poser un prévu » et « Fixer un budget » ouvrent Prévisions (pas d'éditeur de budget propre). « 12 mois » = 12 mois glissants.
- `data-renvoi="aucun"` : aucun. Le contrôle renvoisPartout passe sur les quatre vues du jeu clairsemé.
- État de l'art (L29) : graduations de Heckbert en 15 lignes (d3-scale non déclaré dans package.json ; à déclarer si le pilote préfère), étiquettes par `placerEtiquettes` glouton testé. Une seule retouche (largeur d'étiquette) sur ce module : pas de rustine répétée.
- Essais : domaine 1 round de corrections ; captures 3 passes complètes (98 captures chacune) ; aucun critère au-delà de trois essais.

CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un script Node écrit en heredoc Bash perd les `\` des regex (« MANQUE » affiché) : toujours Edit pour une chaîne à barre inverse (déjà L-poste, revenu ici).
