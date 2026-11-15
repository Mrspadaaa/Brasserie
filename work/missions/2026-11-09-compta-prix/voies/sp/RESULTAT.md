OK — Synthèse : « … » au bout du segment ouvre du/au ; toute plage de mois, titre et totaux suivent.

## Fichiers écrits
- `src/domain/finance/periodeSynthese.ts` : `PeriodeEntree.jusqua?`, fonction pure `dansPeriode(date, mois, jusqua?)` ; sans `jusqua`, comportement identique (Annuel, Opérations non touchés).
- `src/ui/finance/synthese/Scene.tsx` : `Periode` gagne « … » (aria-label « Autre période », même segment) et la rangée `.syn-plage` (deux `input type="month"`, du ≤ au, max = mois courant, un champ tire l'autre) ; `titrePeriode`.
- `src/ui/finance/synthese/libelles.ts` : `titrePlage` (« Juin – nov. 2026 », « Déc. 2025 – mars 2026 »).
- `src/ui/finance/FinanceOverview.tsx` : plage en état local ; un mois ou « tout » touché l'efface ; du = au revient à un mois simple.
- `src/ui/finance/synthese/Lignes.tsx` (hors liste Possède, fichier de la Synthèse sans autre voie) : `Replie` et `fournisseurs` acceptent `jusqua` pour que « Fournisseurs » suive la plage.
- `src/ui/finance/synthese.css` : 6 lignes ajoutées en fin (`.syn-seg-plus`, `.syn-plage`). Le fichier portait déjà 3 lignes d'une autre voie : intactes.
- Tests neufs : `tests/unit/periodeSynthesePlage.test.ts` (11), `tests/integration/synthesePeriode.test.tsx` (7).
- Captures : `voies/sp/captures/` (+ `capturer.mjs`), `tests.txt`.

## Critères
- Rouge d'abord : `synthesePeriode.test.tsx` 7/7 en échec avant l'écran (domaine déjà écrit, UI pas encore). Le test unitaire de plage n'a pas été rejoué sur HEAD (le domaine était déjà modifié) : il teste le nouveau paramètre, HEAD l'ignorerait.
- Tests : 9 fichiers, 106 passés (`voies/sp/tests.txt`) : neufs + `periodeSynthese`, `synthese`, `soldeDepartVisible`, `operationsCalculs`, `f2ReelAnnuel`, `f2ReelOperations`, `financeWorkspace`.
- `npx tsc --noEmit` hors les cinq modules exclus : aucune ligne. `vite build --outDir $TEMP/sp-build` : built in 14,8 s.
- Captures ouvertes (L12) : 390 tactile et 1280, clair et cave, 3 états (repos, rangée ouverte, plage juin–nov.) + après un mois touché, côte à côte avec g3a (`cote-<cfg>-<état>.png`). Vu : segment g3a intact, « … » à sa fin, rangée sous le segment, titre « Juin – nov. 2026 », rien ne déborde à 390, les deux thèmes lisibles. 0 erreur console/page. Serveur 3004 arrêté.

## Essais : 1 par critère (3 ajustements de test : dates futures de la fixture, titre de mois de l'année courante sans année, nom de la feuille « Pourquoi ? »).

## Doutes et limites
- Titre capitalisé (« Juin – nov. 2026 ») comme « Novembre » ; le brief l'écrivait en minuscules entre guillemets. Le mois de l'année courante garde sa forme de g3a (« Mai », sans année) ; la plage dit toujours l'année.
- Les touchers vers le journal (catégorie, ventes, matériel, fournisseur) sur une plage ouvrent Opérations sur toutes les dates (catégorie filtrée) : `JournalRequest` n'a pas de plage. La liste est donc plus large que le graphique.
- Démo (`?finance-demo`) : juin–nov. donne « Perdu −146,80 » car les ventes n'existent qu'en novembre ; c'est la donnée, pas un bogue.
- En caisse (Caisse.tsx), le litre et les lignes-tâches sont indépendants de la période, comme avant.

## À brancher ailleurs (voie sd, FinancesTab.tsx non touché)
La plage vit dans l'état local de `FinanceOverview` : elle est perdue en quittant l'onglet et au rechargement. Pour la garder : dans `FinancesTab.tsx` ajouter `const [plage,setPlage]=useState<{du:string;au:string}|null>(null)` à côté de `month`/`allDates` (l.61), passer `plage` et `onPlage` à `FinanceOverview` et remplacer son `useState` local. Aussi, pour un journal filtrable par plage (voie vo) : un champ `jusqua` dans `JournalRequest` et `TransactionJournal`.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
