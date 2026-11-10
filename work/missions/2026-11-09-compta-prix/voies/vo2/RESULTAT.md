OK — Opérations : une seule vue v6b pour toute période, « … » du/au, « Par date » = ordre, Annuler seulement après « ✓ Payé »

## Fichiers écrits
- `src/ui/finance/TransactionJournal.tsx` : état `du`, `au` (plage) et `parJour` ; bornes uniques `[debut, fin]` (plage, exercice, tout, mois) pour la liste (`dansPeriode`) et pour les piles (`periodeSynthese({ mois, jusqua })`) ; bande + graphe pour tout (mois, plage, exercice, tout, archives) ; seul le suivi (« En retard », « À payer » sur tous les exercices) garde sa bande sans graphe ; « Par date » (`aria-pressed={parJour}`) range par jour sans toucher la période, aussi en Archives ; libellé de plage « juin – sept. 2026 » ; ‹ › reviennent au mois, « Courantes / Tout » et le mois effacent la plage.
- `src/ui/finance/PlageMois.tsx` (neuf) : la rangée « du [mois] au [mois] » extraite de la Synthèse (même rendu, mêmes bornes, du ≤ au).
- `src/ui/finance/synthese/Scene.tsx` : `Periode` emploie `PlageMois` (rendu inchangé ; tests de la Synthèse verts).
- `src/ui/finance/operations/Bande.tsx` : bouton « … » (« Autre période ») à droite de la pastille, rangée du/au dessous ; « en » de « en retard » tombe sur 390 quand le libellé est long (`data-serre`) ; `Piles.tsx` : nom accessible selon la période (« Le mois », « La période », « Tout l’historique » par catégorie).
- `src/ui/finance/TransactionRow.tsx` : « Annuler » seulement pour un paiement écrit par le geste « ✓ Payé » depuis l'ouverture de l'appli (ensemble hors composant, car la ligne change de groupe et se remonte) ; sinon « + pièce » ; plus de bouton hors maquette qui coupe le nom.
- `src/ui/finance/operations.css` : `.ops-plus`, rangée du/au aux jetons d'Opérations, `flex-wrap`, nowrap, resserrement 390.
- Tests : `tests/integration/operationsPeriode.test.tsx` (neuf, 8) ; adaptés : `operationsV6bMois.test.tsx` (« toutes les dates » garde le graphe), `financeJournalUx.test.tsx` (toutes les dates = « Tout », plus « Par date »), `tests/unit/depense/onglets/ta2-compteur.test.tsx` (le compteur mixte se lit « Par date » ; par catégorie : groupe « Annulées » à part).
- Outils : `voies/vo2/capturer.mjs`, `captures/` (app-{clair,cave}-{390,1280}-{1-tout-archives, 2-par-date, 3-plage-ouverte, 3-plage, 4-mois}.png), `tests.txt`, `tests-rouge.txt`, `tsc.txt`, `build.txt`.

## Critères
- Rouge d'abord : `tests-rouge.txt`, 6 des 8 tests neufs échouent sur HEAD 6449c986 ((a), (a bis), (b), (b bis), (c), (d)) ; les 2 qui passaient sont (c bis, d bis), qui vérifient des gestes déjà bons. Verts après : 8/8.
- `npx vitest run` 44 fichiers (grep TransactionJournal, operations/, TransactionRow, Bande, Scene, periodeSynthese, PlageMois, ops-, FinancesTab, FinanceOverview) : 44 passés, 539 tests verts (`tests.txt`).
- `npx tsc --noEmit` hors exclusions : 0 ligne. `npx vite build --outDir $TEMP/vo2-build` : « built in 16.04s ».
- Captures ouvertes (jeu `?dev-local&finance-demo=reel` + pièces 2025 et mai à nov. 2026, facture 2025 ouverte, 2 annulées, vente encaissée aujourd'hui) : clair-390 (tout/archives, plage ouverte, plage, par date), cave-390 (plage), clair-1280 (tout/archives). Gestes lus dans le DOM aux 4 configs : seulement « + pièce » et « ✓ Payé », aucun « Annuler ». Erreurs console : aucune.
- Essais : 1 par critère ; 3 passes de CSS sur la bande (voir problème 1).

## « Combien et quels problèmes ? » (390 clair, tout/archives et plage)
Corrigés (3) :
1. La pastille « Toutes les dates » passait sur deux lignes (« … » ajouté) et la loupe tombait à la ligne : nowrap, et sur libellé long « en » de « en retard » tombe et la rangée se resserre ; tient sur une ligne, chiffres relevés sur capture.
2. Le graphe et la bande disparaissaient en « Tout » (cause du pilote) : revenus.
3. « Annuler » coupait nom et pastille (« Restaur… ») : retiré hors geste.
Restent :
- A. Une pièce ouverte d'une autre période (facture 2025 en retard) reste dans une plage ou un mois, sous « En retard · 2025 » (règle déjà en place pour le mois : la pastille « en retard » ne promet pas un absent). Un filtre strict la cacherait ; à juger.
- B. En plage, « Archives comprises » reste sous la pastille : la plage couvre toutes les années, archivées ou non.
- C. Sur 390 avec libellé très long (« déc. 2025 – mars 2026 ») la loupe peut encore passer à la ligne suivante ; non capturé.
- D. En « Par date », le total d'un jour mélange ventes et charges (« −70,40 ») comme avant ; non retouché.
- E. Les captures d'élément (`-page.png`) montrent l'en-tête collant de l'app sur la liste : artefact de la capture d'élément, pas de l'écran.
- F. Palette claire plus foncée que v6b (acquis de la voie vo, inchangé).

## Choix de la voie
- « Par date » aussi en Archives (avant : caché) : la puce est devenue un ordre, pas une période.
- Les piles d'un exercice couvrent ses 12 mois ; d'Archives, l'année choisie ou toutes ; du suivi : aucune.
- La plage n'est pas remontée dans `FinancesTab` (persistance en quittant l'onglet, comme pour la Synthèse) : hors Possède.

## Besoins hors Possède
- `FinancesTab.tsx` : garder `du`/`au` et `parJour` en quittant l'onglet (aujourd'hui perdus comme le mois) ; `JournalRequest` n'a pas `du`/`au` : une plage de la Synthèse ouvre toujours « Tout ».

DÉCISION À PRENDRE : une facture ouverte d'une autre période doit-elle rester dans une plage du/au (état actuel, groupe « En retard · 2025 ») ou être cachée pour que la plage ne montre que ses pièces ? Recommandation : la laisser (cohérent avec le mois) ; un intervalle strict se demande à part.

CONNAISSANCE : « Par date » mêlait ordre et période ; la période se lit maintenant dans `[debut, fin]` de TransactionJournal, partagée par la liste et les piles.
LEÇON PROPOSÉE : aucune
