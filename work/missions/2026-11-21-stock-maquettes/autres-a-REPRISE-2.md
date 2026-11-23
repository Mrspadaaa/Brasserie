# Reprise 2 : port d'Autres stocks A (D423, D424), 22.11, arrêt à ~150 k

Liste à suivre : `A-PORT-LISTE.md`. Worktree `port-carnet` (branche claude/port-carnet-1711). Commit par chemins : `bash $TEMP/cm.sh "message" fichier...`
(index temporaire, puis index réel aligné ; recréer le script si `$TEMP` a changé : read-tree HEAD dans GIT_INDEX_FILE, add des chemins, write-tree, commit-tree, update-ref, update-index --cacheinfo).
Messages terminés par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Ne pas toucher aux fichiers de la voie Stock d3b à d8a (liste.css, murAjustements.css, EnteteRayon, OutilsStock, StocksTab : lire `git diff` avant).

## Commits faits (3, tous Autres stocks A)
1. blocs 1 à 5 branchés (MurAutres.tsx, murAutres.css, hunk MurStock.tsx, autres-a.mjs AA-1 à AA-5).
2. AA-4 corrigé : mur dans le panneau `.l1-mur l1e-mur`, rangées `.l1-mu`, largeur de pot contre-éprouvée au rendu (le mot court d'abord, puis pot −1 px, plancher 4) ;
   mots courts ajoutés (Bout., Canet., Caps., Étiq.) ; rouge sur tour9 tenu (`ROUGE OK (5 contrôles rouges)`).
3. Bloc 6 écrit : `src/ui/stock/LigneAutre.tsx` + `ligneAutre.css` (préfixe `la-`), prop `sousNom` ajoutée à `LigneStock.tsx`, `StockRow.tsx` choisit `LigneAutre` pour les familles Additifs, Emballage, Nettoyage.
   tsc propre. 2e ligne « état · seuil » (déjà vue : « assez · seuil 500 g »), pastille utile seulement si un brassin prévu manque (jamais inventée),
   ligne ouverte (seuil −/+/champ texte `inputMode="decimal"`, fournisseur et prix connus, « Fiche › »), `saveStockItemFiche` pour `minStock`.

## État des contrôles (`node scripts/parcours/stock.mjs $TEMP/aa --seulement autres-a [--passes 390-clair,390-cave,1280-clair]`)
- AA-1 à AA-5 : verts aux trois passes 390-clair, 390-cave, 1280-clair, sauf AA-3 cave réparé (regex d'épuisé `rgb(214, 69, 61)` en sombre) : à rejouer sur les trois passes.
- AA-6 : KO d'écriture, pas de rendu. La liste est virtualisée : « Soude PBW » et « Nutriment levure » ne sont pas dans le DOM. Corriger l'étape : toucher d'abord
  le nom de rangée « Nettoyage » du mur (filtre) pour que Soude PBW soit seule, lire sa ligne, la toucher, `.la-pm:last-child` (+), relire « seuil 550 g » ; puis filtre « Additifs »
  pour « Nutriment levure » (épuisé · seuil 20 g). Attendu : ligne ouverte `[data-ligne-ouverte]`, input type=text, inputMode=decimal, 0 `input[type=number]`, liseré 3px, étoile gardée.
- Jamais ouvert en image : captures de la liste et de la ligne ouverte (`autres-a-liste-ouverte`) ; vérifier que la pastille et la 2e ligne ne font pas déborder le nom à 390.

## Reste (dans l'ordre)
1. AA-6 (ci-dessus), puis `autres-a-liste-ouverte` ouverte en image, clair et sombre.
2. Bloc 7 (AA-7) : pastilles à 390 sur une ligne, pas de « +n » tant que tout tient, « manque N » sans tasse, bord pointillé pour « à compter » seulement ; la capture actuelle montre déjà « manque 7 · épuisés 1 · brassin 4 · à compter 1 · ★ » : écrire le contrôle (mesure des puces : une seule ligne, aucun texte « +n »).
3. Bloc 8 (AA-8) : à 1280 le mur est déjà en 3 colonnes égales (`.l1-mur` grille 3 colonnes). À faire : `.sa-mur` (≥ 1024 px) en `5fr 4fr 3fr`, `column-gap:12px`, tiret, totaux ×1,5 (déjà `.l1e-t` 18 px) ;
   dans `StocksTab.tsx` (ligne ~722) : quand `grandEcran && autresStocks && vue==='etagere'` et plus d'un rayon présent, rendre `<div className="sz-tables sz-autres" data-tables>` avec une `sz-table` par groupe de `groupesVisibles`
   (calqué sur `enColonnes`), CSS `.sz-tables.sz-autres{grid-template-columns:5fr 4fr 3fr;column-gap:12px}` dans `murAutres.css` ; en-têtes « seuil | stock | jauge » ; tri épuisé, bas, à compter, alphabétique (n° 36 à 42).
4. Rouge sur tour9 pour AA-6 à AA-8 ; `node scripts/parcours/stock.mjs $TEMP/aa` complet (toutes étapes, quatre passes) : OK exigé.
5. Captures 390 tactile, 390×660, 1280, clair et sombre, légende ouverte, ouvertes et comparées à `st1-captures/st1-d2a-repos-660.jpg`, `st1-d3a-1280.jpg` et à la version A de `choix-autres.html`. Vue de 390 clair déjà ouverte : le mur tient en 168 px, même panneau que Ingrédients ; non encore comparée côte à côte.
6. `Brasserie/work/missions/BUGS.md` (section « Chasse Stock ») : ligne « Autres stocks A (D423) » ; `node scripts/agents/controle-bugs.mjs` OK.

## Doutes
- « Commander 250 ml » et « dernier achat … » (n° 31) non faits : aucune donnée de dernier achat ni action de commande unitaire dans l'app ; la ligne ouverte montre le fournisseur et le prix connus de la fiche. À signaler au pilote.
- « ≈ N brassins » (n° 29) : aucune dose par brassin dans les données d'Autres stocks : pas de pastille plutôt qu'un chiffre inventé. DDM d'Autres stocks : aucun champ hors levures.
- Bouton « ? » de légende : 28 × 28 px (liste : cible 40 px) ; la règle de l'app (`.sx-q`) donne cette taille, à trancher.
