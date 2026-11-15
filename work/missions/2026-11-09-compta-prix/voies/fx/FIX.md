# Les restes à finir (10.11, « Tu termines les fix? »)

Source : `voies/AUDIT-RESTES.md` (déjà faits : « Annuler » après « ✓ Payé », volume annuel → paramètres dépliés, `nature` de l'inventaire).
Règles : sa maquette choisie reprise telle quelle (règle n° 1) ; chaque manque est un renvoi (`voies/rv/RENVOIS.md`) ; acquis de
`voies/COMMUN.md` ; test rouge d'abord pour chaque comportement ; captures 390 tactile clair et cave (1280 clair) avant/après, ouvertes (L12),
« combien et quels problèmes ? » dans le RESULTAT. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle.

## Voie fx1 — Opérations, outil d'analyse, Synthèse
1. **Opérations, palette de v6b** (`p4/v6b/etat.html`) : en thème clair, piles, liserés et cercles d'en-tête aux teintes de la maquette (Ventes vert
   vif, Fixes violet, Brassage or, Nettoyage cyan, Matériel bleu, cercles pleins) ; le thème cave garde ses jetons. Contraste des textes vérifié.
2. **Opérations, la puce IA** pose la question calculée de v6b : « ✦ Pourquoi <poste le plus lourd de la période> pèse autant ? » (le plus gros
   poste des piles) ; sans poste, le libellé actuel. `src/ui/finance/FinanceAssistant.tsx` : une prop de libellé, rien d'autre.
3. **Outil d'analyse, Budget** : « Ventes » n'est pas une dépense : sors-la de la liste des règles de dépense (une ligne « entrées 720,00 · rien
   de prévu » à part, ou rien) ; le total « dépensé » ne change pas.
4. **Outil d'analyse, Sources** : « Pas encore payé, apports +400,00 » est obscur : nomme ce que c'est (lis `src/domain/finance/analyse.ts`),
   en deux lignes si ce sont deux choses (« apports privés », « reste à payer »), chacune avec son renvoi.
5. **Synthèse, la plage du … au …** survit au changement d'onglet : l'état remonte dans `src/components/tabs/FinancesTab.tsx`
   (voir `voies/sp/RESULTAT.md` § « À brancher »).
Possède : `src/ui/finance/operations/**`, `src/ui/finance/operations.css`, `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/FinanceAssistant.tsx`
(prop de libellé), `src/ui/finance/analyse/**`, `src/ui/finance/analyse.css`, `src/domain/finance/analyse.ts`, `src/ui/finance/FinanceOverview.tsx`,
`src/ui/finance/synthese/Scene.tsx`, `src/components/tabs/FinancesTab.tsx`, tests qui les lisent, `voies/fx/fx1-*`.

## Voie fx2 — Clôture, Prévisions, litres, Dépense
1. **Clôture étape 3** (`src/ui/finance/annuel/Etapes.tsx`, Etape3 ; maquette `p3/g6/g6-3-inventaires.png`) : cases « ? » avec les hachures
   jaunes nettes de g6 ; « Emballages » avec sa petite ligne (« bouteilles, capsules » ou les articles du stock) ; petite ligne du malt
   « Pilsner Malz 10 kg +6 » sans coupe à 390 (pas de « … » au milieu d'un nom ; « aujourd'hui » retiré s'il fait couper).
2. **Prévisions** (`src/ui/finance/previsions/Previsions.tsx`) : à partir de trois bandeaux pointillés empilés (solde, tendance, rien de prévu,
   projets…), une seule ligne-tâche « N choses à compléter pour une prévision juste › » qui se déplie sur place et liste les mêmes lignes avec
   leurs renvois ; un ou deux bandeaux restent tels quels. Les tests CP-4/CP-7/CP-13 restent verts (adapte leur geste si besoin).
3. **Litres** : `src/ui/BatchDetailSheet.tsx` reçoit `focus?: 'densite' | 'volume'` ; « volume » ouvre Mesures et pose le focus sur « Saisir le
   volume conditionné » (comme `focusOg` pour la densité). Les renvois « litres » l'emploient : Prix (« Litres conditionnés de … », `src/ui/prix/PrixEcran.tsx`),
   feuille Impôt bière (« litres à noter », « Noter les litres », `src/ui/production/ImpotBiereSheet.tsx` : une prop `onNoteLitres` à côté de
   `onNoteDensity`, branchée chez ses appelants : grep), coût du brassin (« ? L nets », `src/ui/finance/CoutBrassinFlux.tsx` / `BrewBudgetSheet.tsx`).
4. **Dépense, « Autre date »** (`src/ui/finance/ExpenseSheet.tsx`) : le toucher « Autre date » montre le champ « Date du paiement » et la petite
   ligne « payé le …, autre jour que l'achat » ; « C'est la date » remet le lien. Test, puis capture (état `?dev-local&depense=medicament`).
Possède : `src/ui/finance/annuel/**`, `src/ui/finance/annuel.css`, `src/ui/finance/previsions/**`, `src/ui/BatchDetailSheet.tsx`, `src/ui/prix/PrixEcran.tsx`,
`src/ui/production/ImpotBiereSheet.tsx`, `src/ui/production/impotAnnee/ImpotAnnee.tsx`, `src/ui/finance/CoutBrassinFlux.tsx`, `src/ui/finance/BrewBudgetSheet.tsx`,
`src/ui/finance/BrewBudgetDialog.tsx`, `src/ui/prix/ChaineArgent.tsx`, `src/ui/finance/ExpenseSheet.tsx`, tests qui les lisent, `voies/fx/fx2-*`.

Tests : `npx vitest run <fichiers> --reporter=dot > voies/fx/<voie>-tests.txt 2>&1` ; `npx tsc --noEmit` hors firebase-admin, firebase-functions,
cheerio, @noble/hashes, react-zoom-pan-pinch ; `npx vite build --outDir "$TEMP/<voie>-build"` ; `tests/integration/renvoisPartout.test.tsx` vert.
Serveurs : fx1 `--port 3014`, fx2 `--port 3015`, `--strictPort`, arrêtés à la fin. RESULTAT au fil dans `voies/fx/<voie>-RESULTAT.md`.
