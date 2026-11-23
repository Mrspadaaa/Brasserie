# Reprise : port D420 (Stock) dans l'app, 22.11

Arrêt à 151 k de contexte (hook ; les captures de maquettes pèsent lourd). Rien n'est commité ni joué au banc.

## Contexte vérifié
- Code : worktree `port-carnet` (branche `claude/port-carnet-1711`), HEAD = `en-ligne/2026-11-22-tour9` (3cfbf196a).
- BUGS.md à jour (section « Chasse Stock, 21.11 », STG/STM/STC) : seulement dans CE worktree `Brasserie` (branche
  `claude/refonte-houblons-v4`) ; celui de `port-carnet` est ancien (1035 lignes). Mettre à jour celui-ci, `controle-bugs` ici.
- Banc : `node scripts/parcours/stock.mjs <dossier> [--ref en-ligne/2026-11-22-tour9] [--rouge ID,…] --seulement <motif>` ;
  un fichier d'étapes par voie dans `scripts/parcours/stock-etapes/` (modèle `00-base.mjs`, `c.controle(id, cond, détail)`).
  `00-base.mjs` appelle `c.sousOnglet('Recompter')` : reste valable avec l'onglet.
- `App.tsx` et `StocksTab.tsx` sont en CRLF/LF mêlés : patcher via `%TEMP%/lf.mjs` (`patch(f, [[ancien, nouveau]…])`, normalise CRLF).

## Point 1, d1a : code écrit, NON vérifié au banc, NON commité (tsc : aucune erreur sur ces fichiers)
- `src/components/tabs/StocksTab.tsx` : `SubTab` = stock | recompter | courses | futs | materiel (`SOUS_ONGLETS`, un ancien
  « hops » rouvre Articles) ; onglet « Recompter » (icône ClipboardCheck) après Articles ; onglet Houblons et `HopIndexPanel`
  retirés ; `vue` dérivée de l'onglet (plus de `stock_vue`) ; `BasculeVue` ôtée de `blocOutils` ; « Comparer une recette »
  seulement sur Articles (d1a-recompter ne l'a pas).
- `src/App.tsx` : `+ houblon` → Articles + `newStockItem` ; « Aller à Houblons » → `setUiState('stocks_filtre','Houblons')` puis Articles.
- RESTE pour d1a :
  1. Lire `stocks_filtre` dans StocksTab (initialiseur pur de `filtre`, effacé dans un `useEffect` au montage) — sinon le
     filtre posé par App n'agit pas.
  2. ★ dans son rond à droite des pastilles (36 px, `margin-left:auto`, d1a) au lieu de la pastille « ★ épinglés »
     (`OutilsStock.tsx` `Pastilles`, lucide `Star`, `aria-pressed`, filtre `epingles`).
  3. `BasculeVue` reste exportée dans `OutilsStock.tsx` (inutilisée) : la retirer avec son CSS `.sz-seg` si rien d'autre ne l'emploie (grep).
  4. Choix de portée (L01, lecture étroite) : l'intérieur de Recompter reste l'existant (tuiles), D6 n'étant pas choisi ;
     d1a-recompter montre le segment Ingrédients | Autres stocks à la place des tuiles : à signaler au pilote.
  5. Index houblon (`HopIndexWorkspace` : index, dégustations, savoir) n'a plus aucune entrée dans l'app (fichiers gardés) : à signaler.
  6. Contrôle `stock-etapes/d420.mjs` : D420-1 (onglets = Articles, Recompter, Courses, Fûts, Matériel ; pas de « Houblons » ;
     pas de `[data-vue-btn]` ; ★ rond à droite des pastilles), rouge avec `--ref en-ligne/2026-11-22-tour9 --rouge D420-1`, vert sur l'arbre.

## Point 2, filtres dynamiques : conçu, pas écrit
- Candidats (domaine pur, `listeFiltres.ts`, testé Vitest) : manque, épuisés, DDM, bas, à compter (existants) + « récents »
  (mouvement < 14 j, `movements`) + « prochain brassin » (`ArticleACommander.sources` d'un brassin planifié, à vérifier).
- Règle : seulement n > 0 (le filtre actif toujours montré) ; ordre de pertinence fixe pondéré (manque > épuisés > DDM >
  brassin > bas > à compter > récents) ; une seule ligne (`.sz-puces` nowrap), 4 au plus à 390, 6 à ≥ 768 ; ★ rond au bout.
- Contrôle D420-2 : une seule rangée de pastilles (même `top`), ≥ 1 filtre hors manque/bas/DDM quand la fixture en a.

## Points 3 à 7 : non commencés (d2a, d3b/d3a, d5a, d7a, d8a). Maquettes : `st1-build.mjs`, `st2-build.mjs`, captures `st1-captures/`, `st2-captures/`.

## Prochaine action
Finir d1a (RESTE 1 à 3 et 6), `npm test -- <tests stock>`, `npm run build`, banc `--seulement d420` aux 4 passes, captures
390/1280 deux thèmes ouvertes côte à côte avec `st1-captures/st1-d1a-repos.jpg`, puis commit par chemins avec index temporaire
(`GIT_INDEX_FILE`), `stock.mjs` complet OK, BUGS.md (ce worktree) et `controle-bugs` OK.

## MAJ fin de contexte (Sonnet, 22.11) : points 1 et 2 faits dans port-carnet, voir commit « D420 »
- d1a fini (D422) : onglets Articles | Recompter | Courses | Fûts | Matériel ; ★ en rond (`.sz-etoile`) ; BasculeVue et `.sz-seg` retirés ; catalogue des houblons par le titre du rayon (`button.l1-cat` dans EnteteRayon) et par « Aller à Houblons » (`stocks_catalogue`) ; Recompter = segment Ingrédients | Autres stocks (plus de tuiles), barre de progression, rond « compté » en fin de ligne (390).
- Point 2 fait : `src/domain/stock/filtresDynamiques.ts` (+ test Vitest), pastilles n > 0, ordre fixe, 4 à 390 / 6 au-delà, filtres « brassin » et « récents ».
- Contrôles `stock-etapes/d420.mjs` : D420-1, D420-1c, D420-2 rouges sur tour9, verts sur l'arbre. Captures : `port-captures/`.
- Reste : points 3 à 7 (d2a, d3b/d3a, d5a, d7a, d8a). Écarts à signaler : « récents » et « brassin » sans effet sur la fixture (brassin 4 = manque) ; en Recompter les barres de niveau des lignes restent (la maquette ne les montre pas).

## MAJ 22.11 (Sonnet, ~115 k) : d2a commité, d3b écrit non commité
- d2a commité `165ac9ecc` (port-carnet) : Comparer en rond (`[data-comparer]`, panneau `[data-comparer-panneau]` sous les outils), « ? » rond, `PuceTri` dans EnteteRayon (plus de `LigneTri`), rayon touché encadré + encoche. Contrôle `stock-etapes/d2a.mjs` D2A-1 à 4 : rouge tour9, vert arbre (390 clair et cave). Captures : `%TEMP%/d2a/` (390-clair-d2a-*.png), à ouvrir à côté de `st1-captures/st1-d2a-repos-660.jpg`. Tests adaptés (ct4c-g1-etagere, stocksPaquetG, stockCompteursOnglet l.121).
- Écarts d2a à signaler : barre de rayon garde ⓘ, chevron de pli et la règle graduée (la maquette n'a que « 0 · 1 · 5 kg ⫽ 200 ») ; défaut = tous les rayons (la maquette montre Malts actif) ; lignes de liste inchangées (barres longues, la maquette a une pastille de niveau).
- Pré-existant (commit D420, pas d2a) : `tests/integration/stockCompteursOnglet.test.tsx` 6 tests rouges (Recompter n'est plus un segment `tab`, pastilles dynamiques) à réécrire.
- d3b ÉCRIT, NON COMMITÉ : `MurStock.tsx` (BulleLegende 5 lignes, anciennes légendes par rangée supprimées), `murAjustements.css`, `stock-etapes/d3b.mjs` (D3B-1, filtre `.filter(Boolean)` ajouté, à rejouer : arbre aux 2 thèmes, rouge `--ref en-ligne/2026-11-22-tour9 --rouge D3B-1`). Capture 390 vue : bulle conforme. RESTE : 2 vitest rouges (`mur du stock : mise en page (c25)` c26 n° 1 tirets en sombre, `CT4C-3 la légende des levures dit… brique et sa lettre`) à adapter ; commit par chemins : `$TEMP/commit.sh "msg" chemins…` (index temporaire).
- Non commencés : d3a (1280 : trois rayons côte à côte, une table par rayon, capture `st1-captures/st1-d3a-1280.jpg`), d5a, d7a, d8a ; correctifs « récents » (sans effet sur la fixture) et teinte de la barre de Recompter ; stock.mjs complet, BUGS.md (worktree Brasserie) + controle-bugs.

## MAJ 22.11 (Sonnet, ~100 k) : d3b et d3a commités
- d3b commité `f31d0b0ef` (vitest corrigés : tirets via color-mix, test bulle de 5 lignes ; D3B-1 rouge tour9 / vert arbre, 390 clair + cave ; capture ouverte conforme). Commit par hunks : `$TEMP/commit-h.sh "msg" fichier "n,m" autres-chemins…` (index temporaire ; MurStock.tsx portait des hunks MurAutres de l'autre voie, exclus).
- d3a commité `b849ba5dc` : `StocksTab.tsx` (`listeDe`, `.sz-tables` > `.sz-table[data-table]` pour Malts/Houblons/Levures dès 1024 px, autres groupes en liste dessous), `liste.css`, `murAjustements.css` (3 cartes), `stock-etapes/d3a.mjs` D3A-1 : rouge tour9, vert arbre aux 2 thèmes 1280. Captures : `%TEMP%/d3a-v/1280-*-d3a-1280.png`, vues ; à comparer encore côte à côte avec `st1-d3a-1280.jpg` (écarts : cartes du mur plus étroites que la maquette, Levures coupée à droite, règle d'échelle de table masquée, colonnes Dernier mouvement/Fournisseur masquées).
- Vitest rouges hors de mes changements : `stockCompteursOnglet` (6, connus), `compactStocks` (pastille « ★ épinglés » devenue rond, d1a), `stocksPaquetG` n° 6 (`[data-autre=Additifs]` : MurAutres de la voie Autres stocks, non commité). À réécrire.
- RESTE : d5a, d7a, d8a ; « récents » sans effet sur la fixture ; teinte de la barre de Recompter ; stock.mjs complet OK ; BUGS.md (worktree Brasserie) + controle-bugs OK.
