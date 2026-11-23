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

## Reprise 2 (22.11, arrêt à ~150 k) : blocs 1 à 5 branchés au mur, non commités
Worktree `port-carnet`, fichiers neufs (à moi) : `src/ui/stock/MurAutres.tsx`, `src/ui/stock/murAutres.css`, `scripts/parcours/stock-etapes/autres-a.mjs`.
Hunks à moi dans `src/ui/stock/MurStock.tsx` (partagé avec d1a…d8a, lire le diff) : import `MurAutres` ; dans `.sv-autres`, `<MurAutres …/>` puis
seules les cartes Fûts et Matériel (`autres.filter(...)`). Commit à faire : index temporaire, ces 3 fichiers + ces 2 hunks.
- Mur : DOM `.l1e-r.sa-r`, `.l1e-n`, `.l1e-g.sa-g`, `.l1e-gb`, `.l1e-t`, `.sw-rl`, pots `.sa-p` (hauteur `--hm × --h`), épuisé `.sa-ep` 10×8, à compter `.sv-ac`,
  tiret continu = `.l1e-gb::after`, tiret de pot `u.sa-td`, bulle au toucher (nom + seuil, second toucher = fiche), légende `.sv-leg` sous le bouton « ? » de Nettoyage.
- Piège trouvé : `.sv-autres` est une grille 2 colonnes ; `.sa-mur{grid-column:1/-1}` (déjà corrigé) sinon largeur de pot à 4 px.
- Banc : `node scripts/parcours/stock.mjs $TEMP/aa --seulement autres-a --passes 390-clair` (la fixture reçoit 8 articles ZZ TEST posés par l'étape).
  Résultat à 390 clair : AA-1, AA-2, AA-3, AA-5 OK ; **AA-4 KO** : « rien ne déborde » faux (une rangée a `scrollWidth > clientWidth` : probablement `.sx-vd`
  « ○ Cartons · Consommables » ou le gabarit « seuil » de 30 px ; augmenter `fixe` dans `largeurPot` ou passer `.sx-vd` à la ligne) ; autres mesures AA-4 bonnes (13px/700, 12/14, rangées 56, mur 174).
- Pas encore faits : rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge AA-1,AA-2,AA-3,AA-4,AA-5 --seulement autres-a`), passes 390-cave et 1280-clair, captures
  (autres-a-mur, autres-a-legende dans `$TEMP/aa1`) ouvertes et comparées à `st1-captures/st1-d2a-repos-660.jpg`, 390×660.
- Reste ensuite : bloc 6 (liste : `StockRowAutre` dans `StocksTab.tsx` quand `autresStocks`, `pastilleAutre`, `etatEtSeuil`, seuil réglable `inputMode="decimal"`),
  bloc 7 (filtres), bloc 8 (1280 : grille `5fr 4fr 3fr`, tables), contrôles AA-6 à AA-8 dans `autres-a.mjs`, `stock.mjs` complet OK, BUGS.md (« Chasse Stock ») puis `controle-bugs.mjs`.
