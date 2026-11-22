# Reprise : port d'Autres stocks A (D423, D424), 22.11

Arrêt volontaire vers 100 k (consigne 130 k). Liste à suivre mot pour mot : `A-PORT-LISTE.md` (42 points, 8 blocs, contrôles AA-1 à AA-8).

## Fait
1. `A-PORT-LISTE.md` : fusion P (35) + U (29) + B (10) + N (15), sans doublons, valeurs données, arbitrages écrits en tête.
   Écart n° 1 (1280) : version d3a, une grille `5fr 4fr 3fr` pour murs et tables, ≈ 300 px de défilement accepté.
2. Domaine pur, worktree `port-carnet` : `src/domain/stock/murAutres.ts` (colonnes par famille, couleurs, silhouettes,
   pots avec tiret 14/22, pieds de colonnes, pastille D424, état et seuil de ligne) ; `tests/unit/murAutres.test.ts`
   (5 tests verts). tsc : aucune erreur sur ces fichiers. Rien d'autre touché (la voie d1a…d8a a des changements
   non commités dans `MurStock.tsx`, `murAjustements.css`, `StocksTab.tsx`, `OutilsStock.tsx`, `EnteteRayon.tsx`).

## Reste (dans l'ordre)
1. UI : dans `MurStock.tsx`, remplacer `.sv-autres` (cartes) par un mur `construireMurAutres` rendu avec les classes du
   mur des ingrédients (`.l1e-r`, `.l1e-n`, `.l1e-w`, `.l1e-gb`, `.l1e-b`, `.l1e-t`, `.sw-rl`, `.sv-leg`, pastille Légende
   sur Nettoyage) ; `--l1-k` = `RangeeAutre.k` ; largeur des pots via `murMiseEnPage` ; CSS propre dans un fichier neuf
   `src/ui/stock/murAutres.css` (préfixe `sa-`), rien dans `murAjustements.css` sauf nécessité. Fûts et Matériel : sous-onglets
   existants (`onCarte`) inchangés. Lire `git diff` des fichiers partagés avant toute écriture (voie d2a, d5a, d7a, d8a).
2. Liste : dans `StocksTab.tsx`, quand `autresStocks`, ligne A (bloc 6 : pastille `pastilleAutre`, 2e ligne `etatEtSeuil`,
   ligne ouverte sur place avec réglage du seuil `inputMode="decimal"` + − / +, `minStock` enregistré). Source du besoin
   (« manque X pour NEIPA 28.11 ») et de la dose (≈ N brassins) : à brancher sur `infoLigne`/`ArticleACommander.sources`,
   sinon `null` (jamais inventé).
3. Filtres (bloc 7) et 1280 (bloc 8 : `5fr 4fr 3fr`, tables sous les murs, colonnes seuil/stock/jauge).
4. Contrôle `scripts/parcours/stock-etapes/autres-a.mjs` (AA-1 à AA-8), rouge
   `node scripts/parcours/stock.mjs <dossier> --ref en-ligne/2026-11-22-tour9 --rouge AA-1,… --seulement autres-a`, vert sur l'arbre ;
   `stock.mjs` complet OK.
5. Captures 390, 390×660, 1280, clair et sombre, légende ouverte, côte à côte avec `st1-captures/st1-d2a-repos-660.jpg`,
   `st1-d3a-1280.jpg` et l'onglet Ingrédients ; ouvertes.
6. BUGS.md (dépôt Brasserie, section « Chasse Stock ») : ligne « Autres stocks A (D423) » ; `node scripts/agents/controle-bugs.mjs` OK.
7. Commits par chemins, index temporaire, hunks propres seulement.

## Commits de cette voie
- Voir `git log --oneline -3` dans les deux worktrees (« Autres stocks A : … »).
