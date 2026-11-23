# Reprise 2 : port D420 (Stock), 22.11, arrêt à 152 k (Sonnet)

Code : worktree `port-carnet` (branche `claude/port-carnet-1711`), HEAD b849ba5dc (d3a). RIEN de cette session n'est commité.
Un autre agent a des modifs non commitées sur MurAutres (`murAutres.ts`, `MurAutres.tsx`, `murAutres.css`, `autres-a.mjs`, hunks de `MurStock.tsx`) et le Calendrier : ne pas y toucher ; commit par chemins avec index temporaire (`GIT_INDEX_FILE`, `read-tree HEAD`), jamais `git add -A`. Les scripts `$TEMP/commit*.sh` n'existent plus : à réécrire.

## Point 1, d3a : écarts corrigés, NON commités (fichiers : `src/ui/stock/liste.css`, `src/ui/stock/murAjustements.css`)
- Bloc D3a de `liste.css` : colonnes de table `12px 1fr 78px 64px minmax(56px,.8fr)`, `padding-right:30px` (l'étoile ne recouvre plus la barre), une ligne par article (`.l1-s-sans` masqué, `min-height:34px`), repère sans pastille, étoile 28 px.
- `murAjustements.css` : colonnes du mur `1fr 1fr 1.2fr` (Levures moins coupée).
- Banc D3A-1 vert aux 2 thèmes 1280 (build `%TEMP%/p2/build`, antérieur au dernier ajustement des colonnes). Capture avant correction ouverte : étoile sur la barre, noms tronqués, « 4 sachets » qui déborde sur la DDM.
- À FAIRE : rebâtir, rouvrir `%TEMP%/p2/d3a/1280-clair-d3a-1280.png` et `…cave…` à côté de `st1-captures/st1-d3a-1280.jpg`. Encore à corriger : la colonne stock des Levures (« 4 sachets » déborde : passer la 4e colonne à 78 px et le repère à 84 px, ou raccourcir « DDM non connue »), `.sz-tables` en `1fr 1fr 1.2fr` avec `column-gap:12px` comme le mur (aujourd'hui `repeat(3,1fr)`, gap 20). Vérifier `quantite.mjs` à 1280 (il lit le pot `.l1-mk`).

## Point 2, d5a : écrit, banc vert, NON commité (390 clair et cave)
- `src/ui/StockDetailSheet.tsx` : tête = deux pastilles (`[data-pav-besoin]` ouvre le détail du besoin, `[data-pav-prix]`), plus de « 1 Pck en stock » ni de barre ; carte `.sfp-reglage` : Stock et Seuil à − et + (`.sfp-stp`, `#stock-compte`, `#stock-min` gardés), motif (`[data-motif]`) seulement une fois le stock touché ; ligne « Modifier la fiche » (`[data-modif]`) → feuille `#stock-edit` (`.sfp-feuille`, scrim `.sfp-fond`, bouton « Enregistrer la fiche »). Le bloc « Fiche » (fournisseur, dernier prix, entrée) est retiré (reste `AiAssist`, masqué sans trous). Code mort : const `barre`, `hautBarre`, `pc`, `sachets`, `ariaBarre`, `prix` à supprimer.
- `src/ui/stockFichePage.css` : fin du fichier (pastilles, réglage, feuille) + règles `max-width:899px` : Stock/Seuil avant « Ce qui a bougé ».
- `stock-etapes/d5a.mjs` : D5A-1 (pastilles, plus de qrow, détail replié, plus de rangée ±), D5A-2 (gestes − +, motif), D5A-3 (feuille). Verts sur l'arbre ; ROUGE SUR TOUR9 NON PROUVÉ : lancer `--ref en-ligne/2026-11-22-tour9 --rouge D5A-1,D5A-2,D5A-3`. Ajouter à D5A-1 l'ordre (`.sfp-reglage` au-dessus de `[data-ce-qui-a-bouge]`) et jouer à 1280 (fiche en panneau, passes `1280-clair`).
- Capture ouverte : repos clair et feuille cave 390 conformes à `st2-d5a-repos/modif.jpg` ; deux corrections faites APRÈS la capture, à rouvrir : fond des pastilles (`.sfp .sfp-pav`), « Ce qui a bougé » sous Stock/Seuil.
- Écarts à signaler : « Pck = 25 g · il en reste » non reproduit (aucune donnée de taille de paquet : on écrit « Pck · il en reste ») ; pastille prix sans date d'achat ; la maquette montre un bouton Enregistrer noir, l'app garde le jaune d'`.sfp-b1`.
- Vitest à relancer et adapter : tout ce qui lit `data-stock-besoin`, `sfp-cord`/`data-corriger` replié, `.sfp-pasr`, motif toujours visible, `Dernier prix`, `sfp-qrow`, barre (`data-barre`, `sfp-sacs`) ; `fiche.mjs` (STM-5/6/9/12, STC-6/7/19 : STC-7 lit la barre, supprimée de la tête) à rejouer aux 3 passes.

## d7a : NON commencé (sonde seule `stock-etapes/d7a.mjs`, à remplacer par un vrai contrôle)
- Maquette `st1-d7a-repos.jpg` : un groupe « Sucres 6 kg » au bout du rang Malts (après Spéciaux, avant « ○ Fumé »), pots dorés à points ; liste titrée « Malts et sucres 19 ».
- Code : `src/domain/stock/murDonnees.ts` ranges les sucres dans `speciaux` (l.194) ; ajouter `'sucres'` à `TypeMalt`, un groupe `{ id:'sucres', mot:'Sucres', ink:'#9C7A1E', fill:'#E6B84A' }` en fin de `GROUPES_MALT`, `par.set('sucres')` pour `estSucre(i) && !/^malt/.test(cat(i))` (et ôter `'Sucres'` de `videsMalts` dès qu'il existe). Pots à points : `MurStock.tsx` marque (l.47-56, `data-cer`, `data-forme`) → ajouter un motif de points via CSS (`[data-cer]` du sucre ou un attribut `data-sucre`). Titre de la liste « Malts et sucres » : `StocksTab.tsx` / `listeFiltres.ts` l.16 (titre du groupe). MurStock.tsx contient des hunks de l'autre voie : commit par hunks.
- Contrôle D7A-1 : rouge tour9 (pas de groupe « Sucres » dans `.stock-mur`, titre « Malts 19 »), vert arbre.

## d8a : NON commencé (sonde `d8a.mjs`)
- Maquette `st1-d8a-materiel.jpg` : « Parc 2 510 CHF + 1 ? », liste du parc (pictogramme, nom, « 2 projets / 1 projet / prix à saisir / aucun projet », prix à droite, ›), puis « À venir 1 » (« carnet · 3 façons », « dès 3 350 CHF »). Segments `Parc 4 | À venir 1 | Carnets | Réalisés`, recherche et panier ronds à droite du titre.
- App actuelle (`390-clair-d8a-materiel.png`) : frise « aujourd'hui », « sans échéance », boutons « Déjà possédé / Projets », « Tout 1 / À traiter 0 », « Achat » : à refaire en liste du parc (`src/ui/…` Matériel ; chercher `Déjà possédé`). Fûts : d8b écartée pour Matériel seulement ; d8b Fûts choisi (étagère + listes par état) : hors de cette reprise, à confirmer dans `port-REPRISE.md`.

## Reste
« récents » sans effet sur la fixture (mouvement < 14 j : ajouter un mouvement daté dans une étape du banc, comme `fiche.mjs`) ; teinte de la barre de Recompter (maquette `st1-d1a-recompter.jpg`) ; vitest rouges : `stockCompteursOnglet` (6), `compactStocks` (pastille « ★ épinglés » devenue rond), `stocksPaquetG` n° 6 (laissé à l'autre voie : MurAutres) ; `stock.mjs` complet aux 4 passes ; lignes dans `Brasserie/work/missions/BUGS.md` + `controle-bugs`.

## Banc
Build unique réutilisable : `PARCOURS_RACINE=$PWD npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir $TEMP/p2/build --emptyOutDir --logLevel error`, puis `node scripts/parcours/stock.mjs $TEMP/p2/<m> --build $TEMP/p2/build --seulement <m>`. `$TEMP/p2/` est partagé avec d'autres : préférer un dossier à soi.
