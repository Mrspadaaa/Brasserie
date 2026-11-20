# Voie l3 — relance des ouverts du 21.11 (BK4-1, BK4-2, LEV-8, LEV-11, T2B-3)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Levure et lancement : BK4-1 (tests/integration/yeastPitchingExecution.test.tsx, 2 rouges : décider si le test ou le code a tort, contre la maquette choisie ; corriger) ; BK4-2 (« pas au stock » dans src/ui/BrewLaunchPanel.tsx:186 et src/domain/brewLaunch.ts devient « non relié » quand l'app ne sait pas, même formule que l'aperçu CT4-B-4) ; LEV-8 (Ma levure, 390 CPU ×4, build de prod local : frappe, choix, volets, glisser sous 100 ms ; mesurer avant et après, profiler, voir work/missions/2026-11-19-ma-levure/LISTE.md) ; LEV-11 (« à confirmer · Retenir · Écarter » sur une ligne à 390 après une recherche) ; T2B-3 (comparer à T4-6, corrigé en cd1d3262b : même constat → verdict corrigé cd1d3262b avec la mesure).
Chaque id de `BUGS-VOIE.md` (ligne complète du registre, avec son historique) reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison). Les graves (B, G) d'abord.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `voies/l3/BUGS-VOIE.md`

## Possède (seuls chemins où écrire, avec voies/l3/)
- src/ui/etapeLevure/**, src/ui/YeastPitchingPanel.tsx, src/ui/YeastRecipeWorkbench.tsx, src/ui/BrewLaunchPanel.tsx, src/domain/brewLaunch.ts, src/domain/yeast*.ts, tests/integration/yeastPitchingExecution.test.tsx, tests/unit/bugs-l3-*.test.ts(x)
- les tests `tests/unit/bugs-l3-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Fichiers modifiés et non commités par d'autres sessions (n'y écris JAMAIS) : tout ce que `git status --short` montre en « M » que tu n'as pas toi-même modifié, en particulier src/components/tabs/StocksTab.tsx, src/services/storage.ts, src/ui/finance/ExpenseSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrade-plan.css, src/pages/BrewDayPage.tsx, src/ui/production/brasser/FeuilleBrasser.tsx, src/ui/production/liste/**, src/domain/brewDayBilan.ts, src/domain/brewMeasures.ts, src/types/index.ts, src/ui/StockRow.tsx, src/ui/stock/LigneStock.tsx, src/services/effetsGeste.ts, src/ui/BandeauEffets.tsx, src/components/QuickActionModal.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx. Avant chaque fichier : `git status --short <fichier>` ; occupé → verdict « ouvert — fichier occupé : <fichier>, changement exact ».
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Une valeur fausse se corrige à la source (même calcul partout, jamais un second calcul). Commit par chemins, message « Bugs relance (l3) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement ni de données réelles ; jamais stash/reset/checkout. Réponse finale : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; houblon = nom, α, rôle, arômes, moment et dose, puis IBU (L04) ; virgule décimale ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/l3/tests.txt 2>&1`.
- Captures APRÈS correctif de tout ce qui se voit : 390 tactile et 1280 (844×340 si le constat le cite), clair et cave, OUVERTES (Read), dans `voies/l3/captures/` (port 3123 via scripts/with_server.mjs, ?dev-local). Plafond : à 200 k, RESULTAT.md à jour et « REPRISE : voies/l3/RESULTAT.md ».
