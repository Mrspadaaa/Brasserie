# Voie v3 — relance des ouverts du 21.11 (BK3-1, BK3-3, T3-1, T3-2, T3-3, T3-4, T3B-10, CT3-51)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Finances, Vendre, Calendrier, Stocks : BK3-1 (étiquettes du graphe Opérations dans le cadre à 390, aucune traversée par le pointillé) ; BK3-3, partie Vendre seulement (« Mon mois / Encaisser » ne couvre jamais le bas du panier au repos) ; T3-1 à T3-4 (détail d'un brassin au Calendrier : phrase sur une ligne lisible à 390, brassage passé non fait dit « en retard » sans recaler les étapes en silence, deux emballages distingués ou dédoublonnés, plein écran refusé en paysage : un message) ; T3B-10 (rejouer en local le cas du constat ; non reproduit → « ouvert — à rejouer en ligne après déploiement ») ; CT3-51 (BLOQUANT : un article neuf hérite des mouvements d'un autre ; trouver la cause, piste : référence attribuée et réemployée ; test rouge d'abord).
Chaque id de `BUGS-VOIE.md` (ligne complète du registre, avec son historique) reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison). Les graves (B, G) d'abord.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `voies/v3/BUGS-VOIE.md`

## Possède (seuls chemins où écrire, avec voies/v3/)
- src/ui/finance/** sauf les fichiers occupés, src/ui/vente/** et les fichiers de Vendre (grep « Encaisser »), src/ui/calendrier/** et les fichiers du détail de brassin du Calendrier (grep « au plus tôt »), src/ui/EnTete.tsx, src/domain/stock*.ts et src/services/stock*.ts (pas storage.ts : occupé), tests/unit/bugs-v3-*.test.ts(x)
- les tests `tests/unit/bugs-v3-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Fichiers modifiés et non commités par d'autres sessions (n'y écris JAMAIS) : tout ce que `git status --short` montre en « M » que tu n'as pas toi-même modifié, en particulier src/components/tabs/StocksTab.tsx, src/services/storage.ts, src/ui/finance/ExpenseSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrade-plan.css, src/pages/BrewDayPage.tsx, src/ui/production/brasser/FeuilleBrasser.tsx, src/ui/production/liste/**, src/domain/brewDayBilan.ts, src/domain/brewMeasures.ts, src/types/index.ts, src/ui/StockRow.tsx, src/ui/stock/LigneStock.tsx, src/services/effetsGeste.ts, src/ui/BandeauEffets.tsx, src/components/QuickActionModal.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx. Avant chaque fichier : `git status --short <fichier>` ; occupé → verdict « ouvert — fichier occupé : <fichier>, changement exact ».
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Une valeur fausse se corrige à la source (même calcul partout, jamais un second calcul). Commit par chemins, message « Bugs relance (v3) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement ni de données réelles ; jamais stash/reset/checkout. Réponse finale : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; houblon = nom, α, rôle, arômes, moment et dose, puis IBU (L04) ; virgule décimale ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/v3/tests.txt 2>&1`.
- Captures APRÈS correctif de tout ce qui se voit : 390 tactile et 1280 (844×340 si le constat le cite), clair et cave, OUVERTES (Read), dans `voies/v3/captures/` (port 3124 via scripts/with_server.mjs, ?dev-local). Plafond : à 200 k, RESULTAT.md à jour et « REPRISE : voies/v3/RESULTAT.md ».
