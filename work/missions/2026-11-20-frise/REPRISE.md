# REPRISE — port du comportement de la frise B partout (21.11.2026)

Objectif : porter le COMPORTEMENT de la frise B (R1 à R14, dépôt Brasserie `work/missions/2026-11-20-frise/frise-interactive.html`)
dans toutes les frises et tous les curseurs ; dessin inchangé. Branche `claude/port-carnet-1711`, worktree `port-carnet`.
Interdits : `src/ui/carnets/**`, `CreativeLabTab*`, `StocksTab.tsx`. Calendrier : `node scripts/parcours/calendrier.mjs` doit rester OK.

## Fait (commits)
- `eff6ccf6f`, `386d2e43a` : module `src/ui/geste/` (moteur pur, `useGlisse`, `useCurseurNatif`, `refCurseurNatif`) ; 11 tests verts
  (`tests/unit/geste/geste.test.ts`).
- 23 commits, un par fichier : tous les `<input type="range">` de l'app branchés par `ref={refCurseurNatif}` (liste et lignes :
  `INVENTAIRE.md`). `847c77939` remet trois commentaires.
- `c73a5c825` : curseur de malt `fermentescibles/Ligne.tsx` (relatif, 6 px, Échap, échelle vers le haut).
- `1ec9ce1bb` : `RatioSlider.tsx` (eau, SO₄/Cl) + deux tests qui décrivaient « le premier appui pose » mis à R1.
- tsc : 0 erreur. Tests ciblés verts (geste, fermentescibles 93, ratio/perf/brouillon 51). Suite complète lancée, résultat non lu
  (journal dans le scratchpad de la session, perdu) : à relancer `npx vitest run --maxWorkers=3`.

## Preuve au doigt (partielle)
`scripts/parcours/geste.mjs` (non commité au moment d'écrire ? voir `git log -- scripts/parcours/geste.mjs`). Premier jeu, 390 tactile clair :
volume (Identité) et curseurs gradués de l'eau : toucher, sans saut, avancer, reculer, rechargement OK ; capture regardée
(`gradue-eau-390-clair-avance.png`, Empâtage 11,9 L, dessin intact). KO à corriger dans le script, pas dans l'app :
- ébullition : sélecteur faux (trouver l'aria-label réel de `CarteEbullition.tsx:68`) ;
- SO₄/Cl : sous l'onglet « 2. Sels » de l'étape Eau (toucher ce bouton avant) ;
- malt : recette vierge sans ligne ; ajouter un malt (bouton d'ajout de l'étape Malts/sucres) avant ;
- levure (Récap) : 0 sans levure choisie ; choisir une levure à l'étape Levure, ou prendre un autre endroit.
Restent 1280 souris (Échap) et thème cave : `node scripts/parcours/geste.mjs <dossier> --build <build>` sans `--largeurs/--themes`.
Build de test : `npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <tmp> --emptyOutDir`.

## Reste (prochaine action, par ordre)
1. Finir `geste.mjs` (4 KO ci-dessus), le jouer aux 4 combinaisons, ouvrir les captures, viser « PARCOURS GESTE OK ».
2. Rejouer `node scripts/parcours/calendrier.mjs` (aucun fichier du Calendrier touché, mais à prouver).
3. Frises du TEMPS (réglage deux bords, R3 R4 R5 R7 R14), non portées : Finances `finance/operations/Frise.tsx:102`
   (position absolue, toucher pose un jour) puis Calendrier `calendrier/entete/Fenetre.tsx:171` et `usePointeurCourbe.ts`
   (échelle 52 semaines fixe ; R4 avec `cadrerDeuxBouts`), barres `calendrier/frise/usePointeur.ts`.
4. Curseurs dessinés restants : `fermentescibles/Plateau.tsx:91`, houblons (`maBiere/rail.ts:233`, `maBiere/Frise.tsx:163`,
   `dryhopper/index.tsx:403`), paliers (`paliers/CourbeEmpatage.tsx:113`, `production/fiche/StageLadder.tsx:59`),
   `FermentationTemperatureChart.tsx:262`, `stock/ChiffreACommander.tsx:152`, `atelier/TodoTimeline.tsx:122`. Voir INVENTAIRE.md.

## Risques
- Curseurs natifs : `touchstart` empêché sur l'input (le natif sautait au toucher) ; la page ne défile plus en partant d'un curseur
  (R13 voulu). Les écrans qui posaient une valeur au toucher d'un curseur VIDE (`onPointerUp`, mesures, prix) le font toujours :
  choix existant gardé, à confirmer contre R1.
- R7 (échelle vers le haut) absent des curseurs natifs : leur `max` appartient à l'écran.
