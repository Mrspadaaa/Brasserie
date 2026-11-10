OK — Limites de cette prévision : chaque limite est une ligne-tâche « … › » qui ouvre pièce, fiche du brassin, coût, journal ou solde

## Fichiers écrits (mon Possède)
- `src/domain/finance/forecast.ts` : types `CibleLimite`, `AvertissementCible` ; `FinanceForecast.avertissements` (ajout). `warnings` et calculs inchangés (mêmes chaînes, `noter()` pousse la chaîne ET la cible). Les avertissements du grand livre (`ledger.ts`, hors Possède) reçoivent leur cible ici : « Date à corriger » (même condition que ledger.ts:167), « Montant à vérifier », solde, paiements historiques.
- `src/domain/finance/brewForecast.ts` (ajout seul) : `SortieBrassinsPlanifies.avertissements` pour les 4 limites de brassin : date illisible, déjà passée, « à compléter » (avec `manque[]`, « N ingrédients sans prix » dès 3, « N frais à compléter » dès 3), impôt des brassins conditionnés non prévu.
- `src/ui/finance/FinanceForecastSummary.tsx` : une ligne-tâche `finance-task` (acquis « Confirmer les paiements (n) › » gardé) par limite ; un brassin qui porte 2 limites ou plus se range sous son nom ; « Confirmer les paiements » et « Renseigner le solde » ne sont pas doublés. Une limite sans cible (info : « Achats … non projetés ») reste une phrase.
- `src/ui/finance/previsions/Previsions.tsx` : routage des cibles (pièce → modification de la pièce ; plan ; brassin › date → `BatchDetailSheet` en lazy (comme ImpotAnnee) ; brassin › coût → `onOpenBudget` ; journal des paiements à confirmer ; feuille du solde / paramètres de l'historique) ; parts de brassin sans montant (« Milk Stout · emballage ») structurées aussi.
- `previsions/ListeSorties.tsx` : « Échéance à préciser » : chaque pièce est un bouton qui ouvre la pièce. `previsions/FicheEtiquette.tsx` : « partiel, à compléter : … » de la fiche du brassin devient un bouton vers le budget.
- `src/components/tabs/FinancesTab.tsx` : une prop (`onCorrigerPiece={setEditing}`), routage seul.
- `tests/integration/limitesRenvois.test.tsx` (7 tests), `voies/rv/rvB-capturer.mjs`, `rvB-captures/` (16 PNG), `rvB-tests.txt`, `rvB-rouge-HEAD.txt`.

## Critères
- Rouge d'abord sur HEAD acc39f7a : `rvB-rouge-HEAD.txt` : 6 échecs sur 6 (sources remises à HEAD par `git show`, copies vérifiées `cmp`, puis restaurées).
- Vert : `limitesRenvois.test.tsx` 7/7. Lot : 46 fichiers (limitesRenvois, renvoisPartout, previsions*, projetsPrevisions, f2Reel, compactClients, libelles, brewForecast, forecast, finance) : 507 tests verts ; 2 fichiers en échec au chargement = `firebase-admin` absent (`financeDocumentHistory`, `financeDocumentMigration`), sans lien.
- `renvoisPartout` › « Prévisions (avec Limites) » : vert sur le jeu clairsemé de rvA.
- tsc (hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch) : aucune erreur. `npx vite build --outDir $TEMP/rvb-build` : OK. Serveur 3009 arrêté.
- Captures 390 clair et cave, ouvertes : avant (puces de texte, `avant-390-*-11-limites`) et après (`apres-390-*-11-limites`, `-12-limites-bas`, `-13-fiche-brassin` : fiche Ttt avec « Prévu le 08.09.2026 · Date dépassée · Changer la date », `-14-cout` : budget « 7 ingrédients sans prix »). Les six limites de la plainte y sont des lignes à chevron. Pas de 1280 (non demandé).

## Doutes et limites
- `BatchDetailSheet` : la rubrique Argent existe dans son état mais pas dans le type de sa prop `initialSection` ; je la nomme par un cast (`RUBRIQUE_ARGENT`) dans Previsions. Propre : élargir le type dans `productionInsights.ts` (hors Possède).
- Le cas « impôt non prévu » ouvre la fiche › Argent ; les « à compléter » ouvrent le coût du brassin (rvC y met les renvois ligne à ligne).
- Hors Possède de ma ligne, non touchés : la fiche projet (`FicheProjet` : « à compléter », « à renseigner » de l'usure, du litre, de « Plus bas ») garde du texte sans renvoi — `renvoisPartout` ne le voit pas sur son jeu (aucun projet de matériel daté) ; à répartir par le pilote.
- Le compteur « Limites (n) » du pli compte aussi les deux limites déjà portées plus haut dans la feuille (paiements, solde) ; l'`aria-label` de la liste compte les lignes affichées.
- La capture « cave » du cout a échoué une fois (course du script), rejouée : OK.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `BatchDetailSheet` accepte `initialSection='argent'` à l'exécution (état), pas dans son type.
LEÇON PROPOSÉE : aucune (un `cp`+`git show HEAD` suffit pour rejouer le rouge sans `git stash`).
