# Voie dc1 — relance des ouverts du 21.11 (DC-1)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
DC-1 (BLOQUANT) : remesurer la découpe des longues pièces (src/services/decoupe.ts, functions/src/invoiceMorceaux.ts) sur les graines 1 et 2 du banc (cherche « h0065 », « graine » dans work/missions/2026-11-01-banc-lecture, 2026-11-09-banc-gemini et tests/) depuis 365e5f16 ; zéro ligne perdue et zéro coupe silencieuse exigés. Si des pertes restent : suivre « ## État de l'art — dc1 » de MISSION.md (méthode standard, réglage sur une moitié des pièces, jugé sur l'autre, L20), test rouge d'abord. Sans Gemini (la découpe est locale).
Chaque id de `BUGS-VOIE.md` (ligne complète du registre, avec son historique) reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison). Les graves (B, G) d'abord.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `voies/dc1/BUGS-VOIE.md`

## Possède (seuls chemins où écrire, avec voies/dc1/)
- src/services/decoupe.ts, functions/src/invoiceMorceaux.ts, les scripts de mesure du banc de découpe que tu crées sous voies/dc1/, tests/unit/bugs-dc1-*.test.ts et les tests existants de la découpe (grep « decoupe » dans tests/)
- les tests `tests/unit/bugs-dc1-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Fichiers modifiés et non commités par d'autres sessions (n'y écris JAMAIS) : tout ce que `git status --short` montre en « M » que tu n'as pas toi-même modifié, en particulier src/components/tabs/StocksTab.tsx, src/services/storage.ts, src/ui/finance/ExpenseSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrade-plan.css, src/pages/BrewDayPage.tsx, src/ui/production/brasser/FeuilleBrasser.tsx, src/ui/production/liste/**, src/domain/brewDayBilan.ts, src/domain/brewMeasures.ts, src/types/index.ts, src/ui/StockRow.tsx, src/ui/stock/LigneStock.tsx, src/services/effetsGeste.ts, src/ui/BandeauEffets.tsx, src/components/QuickActionModal.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx. Avant chaque fichier : `git status --short <fichier>` ; occupé → verdict « ouvert — fichier occupé : <fichier>, changement exact ».
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Une valeur fausse se corrige à la source (même calcul partout, jamais un second calcul). Commit par chemins, message « Bugs relance (dc1) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement ni de données réelles ; jamais stash/reset/checkout. Réponse finale : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; houblon = nom, α, rôle, arômes, moment et dose, puis IBU (L04) ; virgule décimale ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/dc1/tests.txt 2>&1`.
- Captures APRÈS correctif de tout ce qui se voit : 390 tactile et 1280 (844×340 si le constat le cite), clair et cave, OUVERTES (Read), dans `voies/dc1/captures/` (port 3120 via scripts/with_server.mjs, ?dev-local). Plafond : à 200 k, RESULTAT.md à jour et « REPRISE : voies/dc1/RESULTAT.md ».
