# REPRISE V-COUT (21.11, 2e passage, agent concepteur Opus) — FAIT, commité

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Commits par index temporaire, par chemins (d'autres sessions commitent sur
la même branche en parallèle : leur commit B1 43bd9224d avait repris l'étape D405 depuis l'arbre, d'où le correctif 0baf822f6).

## Commits
- 66c8a86c5 K4 : point le plus bas au Bord (forecast.ts `pointBasAVenir`, DashboardTab.tsx)
- 5d6914ad6 N6 : marge par 33 cl (prixDuStock.ts `margePar33cl`, BrewBudgetSheet.tsx)
- 790e7b17e K3 : horizon.ts lit « JJ.MM.AAAA » ; test vCout ; étape K3-COURSES touche « 1 Stocks » (la pastille précède le nom)
- 4d842f63f K4 : DashboardTab `?? []` sur plans/paiements/matériel, signe moins « − » ; mock de dashboard.test.tsx complété (getPlans, getAssets) : 9 tests rouges depuis K4
- d02813177 D405 : `budgetsDeRecette` + `BudgetRepris` dans brewForecast.ts ; `buildForecast` l'applique (2e passe seulement s'il y a une reprise),
  sorties marquées « · budget de sa recette, estimé » et `ForecastItem.repriseRecette` ; assistantContext.ts:141 passe brassins, stock, matériel ;
  useDonneesCalendrier.ts : définition retirée + une ligne d'import, rien d'autre ; fixture `reprise` ; étape D405 ; tests/unit/caisseUnique.test.ts
- 0baf822f6 étape D405 en un seul exemplaire

## Preuves
- chaines `--etape K4,N6,K3-COURSES,D405` sur l'arbre : PARCOURS CHAINES OK (D405 : Bord −533,05, Finances −533,05, Calendrier −533).
- `--ref en-ligne/2026-11-21-tour7` : K4, N6, K3-COURSES KO (ECHEC 3) ; D405 KO (Bord sans point bas). `--ref HEAD` avant D405 : D405 KO (−440, −440, −533).
- Captures (fixture caisseBasse + reprise), 390 et 1280, clair et cave, dans le scratchpad de la session (`caps/`) : les 12 disent 533,05 / 533,05 / 533.
  Bord ouvert en clair 390, cave 390, clair 1280 ; Finances et Calendrier ouverts à 390 clair. 1280 : 2 erreurs console par page, non lues.
- vitest : 6 fichiers, 100 tests verts (caisseUnique, vCout, dashboard, brewForecast, calendrierCaisse, assistantContextSansId) ; tsc 0 erreur.
- `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` : build=0, DRAPEAUX OK (avant la retouche du signe « − », une chaîne).

## DÉCISIONS / suites (pilote)
- **Calendrier (voie V-CAL)** : sa reprise ne trouve plus rien (la prévision l'a déjà faite) : la barre « budget de la recette, repris de … »
  et l'hypothèse « … pas encore dans Finances » ne s'affichent plus (le chiffre est juste). À rebrancher par V-CAL sur `item.repriseRecette`
  (texte sans « pas encore dans Finances ») ; son appel à `budgetsDeRecette` et sa 2e passe deviennent inutiles. Hors de mon périmètre (une ligne).
- Bord : « au plus −533,05 CHF · 30.01 » (partiel : une part sans montant). Le Bord dit « Stock 0,6 / seuil NaN kg » sur la fixture `manques`
  (article sans `minStock`) : constat à verser à BUGS.md.
- Erreurs console à 1280 (2 par page) : à lire.
