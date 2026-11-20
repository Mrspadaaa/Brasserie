# Voie r3 — relance des ouverts du 21.11 (TE-13, BR-91, BE-15, B1-NOTE-3, BK4-3, T3B-12, T4-4, TL-10, BK3-3)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Recettes et assistant : TE-13 (correctif décrit au registre : « OG visée … · calculée … avec tes malts » et son title) ; BR-91 et BE-15 (un seul nom d'écran, « Eau ») ; B1-NOTE-3 (« Abandonner » présent dès l'ouverture, avant le premier geste) ; BK4-3 (13 tests brewWizard* en it.skip depuis TE-27 : réécrits contre l'écran actuel ou retirés avec raison, aucun skip restant) ; T3B-12 et T4-4 (noms sans accents « Rstgerste », « Caramnch » : le même nom partout, avec accents, sur la feuille et la fiche, rendu par le nom du catalogue ou du stock quand il est unique ; la recette Milk Stout enregistrée n'est pas modifiée : données réelles) ; TL-10 (comparer à T4-5, corrigé en 7c1c01741 : si c'est le même constat, verdict corrigé 7c1c01741 avec la preuve) ; BK3-3, partie Assistant seulement (la barre « Retour / Suivant » ne couvre jamais le bas des cartes au repos : réserve de place, pas un filet).
Chaque id de `BUGS-VOIE.md` (ligne complète du registre, avec son historique) reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison). Les graves (B, G) d'abord.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `voies/r3/BUGS-VOIE.md`

## Possède (seuls chemins où écrire, avec voies/r3/)
- src/pages/BrewWizard.tsx, src/ui/wizard/**, src/ui/water/WaterSummary.tsx, src/pages/RecipePage.tsx, src/ui/recette/**, src/ui/production/recettes/**, src/domain/recipe*.ts, src/services/nomsIngredients*.ts (si tu le crées), tests/integration/brewWizard*.test.tsx, tests/unit/bugs-r3-*.test.ts(x). FeuilleBrasser.tsx est occupé : si la feuille demande un changement là, rends « ouvert — fichier occupé » avec le changement exact, et corrige à la source partagée si elle existe.
- les tests `tests/unit/bugs-r3-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Fichiers modifiés et non commités par d'autres sessions (n'y écris JAMAIS) : tout ce que `git status --short` montre en « M » que tu n'as pas toi-même modifié, en particulier src/components/tabs/StocksTab.tsx, src/services/storage.ts, src/ui/finance/ExpenseSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrade-plan.css, src/pages/BrewDayPage.tsx, src/ui/production/brasser/FeuilleBrasser.tsx, src/ui/production/liste/**, src/domain/brewDayBilan.ts, src/domain/brewMeasures.ts, src/types/index.ts, src/ui/StockRow.tsx, src/ui/stock/LigneStock.tsx, src/services/effetsGeste.ts, src/ui/BandeauEffets.tsx, src/components/QuickActionModal.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx. Avant chaque fichier : `git status --short <fichier>` ; occupé → verdict « ouvert — fichier occupé : <fichier>, changement exact ».
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Une valeur fausse se corrige à la source (même calcul partout, jamais un second calcul). Commit par chemins, message « Bugs relance (r3) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement ni de données réelles ; jamais stash/reset/checkout. Réponse finale : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; houblon = nom, α, rôle, arômes, moment et dose, puis IBU (L04) ; virgule décimale ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/r3/tests.txt 2>&1`.
- Captures APRÈS correctif de tout ce qui se voit : 390 tactile et 1280 (844×340 si le constat le cite), clair et cave, OUVERTES (Read), dans `voies/r3/captures/` (port 3122 via scripts/with_server.mjs, ?dev-local). Plafond : à 200 k, RESULTAT.md à jour et « REPRISE : voies/r3/RESULTAT.md ».
