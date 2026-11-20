# Voie d3 — relance des ouverts du 21.11 (M9-1, LR1-4, LR2-8, LR3-2, LT-6)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Dépense, graves : M9-1 (une ligne ingrédient « hors stock » ne s'enregistre jamais sans alerte à « Confirmer » ; cas C0 et C3, tests/unit/depense/d381/stock-repare.test.tsx) ; LR1-4, LR2-8, LR3-2 (même photo BAUHAUS : rangement « Matériel de brassage » contre « Rénovation » selon le tirage ; le rangement doit être stable, par le contexte de la pièce, src/ui/depense/familles.ts:422) ; LT-6 (lignes ajoutées par une lecture et absentes de la pièce : signalées, jamais un vert silencieux). Preuve sur les réponses enregistrées du banc (rejouées, anonymisées). Gemini réel seulement si elles ne suffisent pas : 1,50 CHF au plus pour la voie, chaque appel journalisé comme la voie g1 (voies/g1/VOIE.md), arrêt avant le plafond.
Chaque id de `BUGS-VOIE.md` (ligne complète du registre, avec son historique) reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison). Les graves (B, G) d'abord.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `voies/d3/BUGS-VOIE.md`

## Possède (seuls chemins où écrire, avec voies/d3/)
- src/ui/depense/**, src/ui/finance/controlesCroises.ts, functions/src/invoiceVisionReview.ts, src/services/purchase*.ts, src/domain/purchase*.ts, tests/unit/depense/**, tests/unit/bugs-d3-*.test.ts(x)
- les tests `tests/unit/bugs-d3-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Fichiers modifiés et non commités par d'autres sessions (n'y écris JAMAIS) : tout ce que `git status --short` montre en « M » que tu n'as pas toi-même modifié, en particulier src/components/tabs/StocksTab.tsx, src/services/storage.ts, src/ui/finance/ExpenseSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrade-plan.css, src/pages/BrewDayPage.tsx, src/ui/production/brasser/FeuilleBrasser.tsx, src/ui/production/liste/**, src/domain/brewDayBilan.ts, src/domain/brewMeasures.ts, src/types/index.ts, src/ui/StockRow.tsx, src/ui/stock/LigneStock.tsx, src/services/effetsGeste.ts, src/ui/BandeauEffets.tsx, src/components/QuickActionModal.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx. Avant chaque fichier : `git status --short <fichier>` ; occupé → verdict « ouvert — fichier occupé : <fichier>, changement exact ».
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Une valeur fausse se corrige à la source (même calcul partout, jamais un second calcul). Commit par chemins, message « Bugs relance (d3) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement ni de données réelles ; jamais stash/reset/checkout. Réponse finale : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; houblon = nom, α, rôle, arômes, moment et dose, puis IBU (L04) ; virgule décimale ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/d3/tests.txt 2>&1`.
- Captures APRÈS correctif de tout ce qui se voit : 390 tactile et 1280 (844×340 si le constat le cite), clair et cave, OUVERTES (Read), dans `voies/d3/captures/` (port 3121 via scripts/with_server.mjs, ?dev-local). Plafond : à 200 k, RESULTAT.md à jour et « REPRISE : voies/d3/RESULTAT.md ».
