# Reprise 3 : port d'Autres stocks A (D423, D424), 22.11, arrêt à ~150 k

Worktree `port-carnet` (branche claude/port-carnet-1711). Commit par chemins avec `bash $TEMP/cm.sh "message" fichier...` (script déjà là, index temporaire).
Message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Aucun commit fait dans cette session : TOUT est à committer.
Fichiers de cette voie, non committés (vérifier `git diff` avant ; StocksTab.tsx et LigneStock.tsx étaient propres au début) :
`scripts/parcours/stock-etapes/autres-a.mjs`, `src/ui/stock/murAutres.css`, `src/ui/stock/MurAutres.tsx`, `src/ui/stock/LigneAutre.tsx`, `src/ui/stock/LigneStock.tsx`
(props `barreAutre`, `repereAutre`, `quantiteAutre`), `src/domain/stock/murAutres.ts` (`trierAutres`, `quantitePiece`), `tests/unit/murAutres.test.ts` (6 tests verts),
`src/components/tabs/StocksTab.tsx` (3 hunks : import, tri `trierAutres` au tri par défaut, `enColonnesAutres` → `<div className="sz-tables sz-autres">`). Ne pas committer liste.css, murAjustements.css ni les fichiers Calendrier.

## Fait et prouvé (`node scripts/parcours/stock.mjs $TEMP/aa --seulement autres-a [--passes 1280-clair]`)
- AA-6 vert aux trois passes (filtre sur la rangée d'abord ; défilement pour trouver « Nutriment levure » dans la fenêtre virtualisée). `autres-a-liste-ouverte` ouverte en image (390 clair) : OK.
- AA-7 vert aux trois passes (pastilles sur une ligne, 346 px, pas de « +n », « manque » sans icône, bord pointillé « à compter » seul : règle `.sz-pu[data-f=compter]` dans murAutres.css).
  Limite : `MAX_PUCES_MOBILE = 4` (D420, voie Stock) coupe à 4 pastilles ; la fixture n'a que 4 états non nuls, donc « tout tient » prouvé seulement jusqu'à 4. Non touché.
- AA-8 : 1280 vert avant le dernier correctif (tables 5fr 4fr 3fr, mur 5fr 4fr 3fr, en-têtes « seuil » et « 0 · seuil · 1,6× » (« jauge » si la table < 400 px, requête de conteneur),
  tri épuisé/bas/à compter/alpha, nom 15, stock 16, barre 14 px à 1,6 × seuil, ligne ouverte avec fournisseur) ; dernier lancement `--passes 1280-clair` : `PARCOURS STOCK OK` (AA-4 inclus après abrègement des vides « Cons. »).
- Rouge sur tour9 lancé en arrière-plan : `$TEMP/aar.log` (dossier `$TEMP/aar`) pour AA-1 à AA-8 ; LIRE la fin du fichier : attendu `ROUGE OK (8 contrôles rouges)`.

## Reste (dans l'ordre)
1. Lire `$TEMP/aar.log` (rouge). Si un AA reste vert sur tour9, durcir le contrôle.
2. DÉFAUT VU sur `1280-clair-autres-a-liste.png` : la largeur de pot est commune au mur (`--sa-w`) ; Nettoyage (3fr, 273 px) déborde, donc la contre-épreuve réduit TOUS les pots à 4 px
   (Additifs, Emballage minces). Corriger dans `MurAutres.tsx` : abréger les vides AVANT d'amincir le pot (ordre : mot court, vides abrégés, pot −1 px), ou largeur par rangée ; relancer AA-3/AA-4 (largeurs de pot attendues : une seule valeur, 12 à 1280).
3. Passe complète : `node scripts/parcours/stock.mjs $TEMP/aa` (toutes étapes, quatre passes) : `PARCOURS STOCK OK` exigé (les autres étapes du banc : d3a, d8a… ne doivent pas casser : le mur 5fr 4fr 3fr ne touche que `.sa-mur`).
4. Captures 390 tactile, 390×660, 1280, clair et sombre, ouvertes et comparées côte à côte avec la version A de `choix-autres.html` et `st1-captures/st1-d2a-repos-660.jpg`, `st1-d3a-1280.jpg` : produites par le banc dans `$TEMP/aa` (`*-autres-a-mur|legende|liste|liste-ouverte|table-ouverte.png`) ; ouvertes jusqu'ici : 390-clair liste-ouverte, 1280-clair liste et table-ouverte. À ouvrir : les versions cave (sombre), 390×660.
5. `Brasserie/work/missions/BUGS.md` (fichier du worktree Brasserie, pas celui de port-carnet) : ajouter, en fin de fichier au format des lignes `| ID | source | écran | constat | gravité | état | commit |`, une ligne « ouvert — données manquantes » par absence :
   AUTRES-COMMANDER (« Commander N » : aucune action de commande unitaire), AUTRES-DERNIER-ACHAT (aucune donnée de dernier achat), AUTRES-BRASSINS (« ≈ N brassins » : aucune dose par brassin), AUTRES-DDM (DDM hors levures : aucun champ).
   Puis `node scripts/agents/controle-bugs.mjs` (depuis Brasserie) : `BUGS OK`. Ne pas committer BUGS.md dans port-carnet.
6. Commits par chemins (au moins deux : domaine+tests ; UI+CSS+banc), `git status --short` après.

## Décisions prises (pilote : « seulement si la donnée existe »)
- « Commander N », « dernier achat », « ≈ N brassins », DDM hors levures : absents, aucune place vide. La pastille n'apparaît que pour « manque N pour <brassin> » (dose connue via les sources de commande) ; sinon le seuil est dit dans la 2e ligne (« · seuil 500 g »), sans doublon en pastille.
- Pièces : la quantité se dit par le seul nombre (« 480 »), modèle A n° 39 ; g, ml, kg inchangés. Sans seuil : « — » dans la colonne seuil des tables (pas de barre : jamais un 0 inventé).
- Légende « ? » : 28 × 28 px (règle `.sx-q` de l'app) ; à trancher, inchangé.
- Noms de familles des tables : « Sels et additifs », « Nettoyage et gaz » (LIBELLE_FAMILLE de l'app), pas « Additifs » / « Nettoyage » du mur.
- Fichiers CRLF dans le worktree (LigneStock.tsx, StocksTab.tsx) ; HEAD est en LF : mes éditions préservent le CRLF, git normalise.
