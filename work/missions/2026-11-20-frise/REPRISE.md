# REPRISE — port du comportement de la frise B partout (21.11.2026, 2e session)

Objectif : porter le COMPORTEMENT de la frise B (R1 à R14, dépôt Brasserie `work/missions/2026-11-20-frise/frise-interactive.html`)
dans toutes les frises et tous les curseurs ; dessin inchangé. Branche `claude/port-carnet-1711`, worktree `port-carnet`.
Interdits : `src/ui/carnets/**`, `CreativeLabTab*`, `StocksTab.tsx` ; `git add -A`, stash, push, déploiement, donnée réelle.
Commit par chemins, un par endroit, « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Fait
- Session 1 : module `src/ui/geste/` ; 25 endroits (tous les `<input type="range">`, malt `Ligne.tsx`, `RatioSlider.tsx`). Voir INVENTAIRE.md.
- Session 2 (commits `8e700a7b6`, `9d6f1ddf8`, `ff5a6fafe`, `e97e51993`, `c7d79362b`, + geste.mjs) :
  - R1 sur curseur vide : mesure du jour (`BrewDayMeasurements`), appel de mesure (`AppelMesure`), prix (`CurseurPrix`) : un toucher
    ne pose plus rien ; glisser ou Entrée posent ; le clic d'un lecteur d'écran (`detail === 0`) pose encore. Textes « un toucher pose »
    devenus « glisser ou Entrée pose » / « glisser le pouce part de ». 5 tests réécrits (R1).
  - Finances `operations/Frise.tsx` : réécrit sur `useGlisse` + `poserPlage` + `roleSous` + `cadrerDeuxBouts` (R1 R2 R3 R4 R5 R7 R10 R12
    R13 ; `.ops-tr` en `touch-action:none`). Le palier « un mois par 0,6 s » (FIN-FRISE-AGRANDIR) est remplacé par R7 ; tests réécrits
    (finTour2 : R1, R2, R10, R7 ; financesLot2). Piège : la ref de la piste doit être STABLE (`useCallback`), sinon chaque rendu détache
    le geste et l'annule.
  - Calendrier `entete/Fenetre.tsx` (cadre) : R1 (6 px, `aBouge`) et R10 (Échap). 209 tests du Calendrier et de l'en-tête verts.
  - `scripts/parcours/geste.mjs` : les 4 sélecteurs corrigés (ébullition : `repli` retiré ; « 2. Sels » touché par préfixe `^` ; une
    ligne de SUCRE créée — la barre d'un grain règle sa part et ne bouge pas seul ; levure Pomona choisie puis rangée Levure du Récap.
    ouverte) ; Identité touchée (le brouillon reprend à sa dernière étape) ; « Écran indisponible » (chunk non chargé, vu une fois à 1280)
    rechargé une fois.

## Preuves
- Vitest ciblé : mesures 129/129, Finances frise 52/52, Calendrier 209/209. Suite entière et build : voir la fin de ce fichier.
- geste.mjs : voir la fin de ce fichier.

## Reste (prochaine action, par ordre)
1. Ajouter à `geste.mjs` la frise de Finances (Finances › opérations, `.ops-tr`, `role=slider` « Début »/« Fin » : toucher, sans saut,
   étirer, Échap à 1280, deux bouts à 56 px au repos) et le cadre du Calendrier (`[data-poignee=fin]`, toucher sans effet, Échap).
2. CAL-ENTETE (demande du pilote, 21.11 ; ligne dans Brasserie `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, captures
   `work/missions/2026-11-21-calendrier-entete/`, dont capture-6) : écrire D'ABORD le contrôle, rouge sur `en-ligne/2026-11-21-tour7`,
   l'ajouter à `calendrier.mjs` (ou geste.mjs), puis corriger ; captures 390 avant/après :
   1) retirer le rond pointillé de la courbe (2e refus) ; 2) panneau de semaine à hauteur fixe (le haut de « Brassins » ne bouge pas de
   plus de 1 px) ; 3) en-tête ≤ 30 % de 844 px, ≤ 20 % courbe cachée ; 4) retirer la rangée « −683 » sous les mois (redit la courbe) ;
   5) barre du haut sur UNE ligne (nom, période, recherche, avatars G A) — commune à toute l'app : vérifier les autres onglets à 390.
   Non commencé.
3. Calendrier, échelle : R4/R7 sur la courbe (52 semaines fixes) avec `cadrerDeuxBouts` ; barres glissées `frise/usePointeur.ts:182`
   (seuil, Échap, bord) et `usePincement.ts` (R14). `usePointeurCourbe.ts` est une LECTURE (appui long, lire la semaine), pas un réglage :
   seulement le seuil (8 px aujourd'hui, R1 dit 6) si on veut l'aligner.
4. Curseurs dessinés restants (INVENTAIRE « Non portés ») : `fermentescibles/Plateau.tsx:91` (le grand curseur 0…2 kg de la carte
   choisie : position absolue), houblons (`maBiere/rail.ts:233`, `maBiere/Frise.tsx:163`, `dryhopper/index.tsx:403`), paliers
   (`paliers/CourbeEmpatage.tsx:113`, `production/fiche/StageLadder.tsx:59`), `FermentationTemperatureChart.tsx:262` (poignées
   `yc-chart-handle` vues à l'étape Levure), `stock/ChiffreACommander.tsx:152`, `atelier/TodoTimeline.tsx:122`, `FriseArchives.tsx:61`.
5. Rejouer : geste.mjs (4 combinaisons), `node scripts/parcours/calendrier.mjs`, vitest entière (`npx vitest run --maxWorkers=3`), build.

Build de test : `PARCOURS_RACINE=<worktree> npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <tmp> --emptyOutDir`
(sans `PARCOURS_RACINE` le build échoue), puis `node scripts/parcours/geste.mjs <captures> --build <tmp>`.

## Résultats des rejeux (session 2)
- geste.mjs : **PARCOURS GESTE OK**, 132 contrôles, 390 tactile et 1280 souris, clair et cave, Échap à 1280 (build fait AVANT les commits
  R1/Finances/Fenetre de la session 2 ; ces endroits ne sont pas encore dans geste.mjs). Captures regardées : malt 390 cave (Dextrose
  0,75 kg), SO₄/Cl 1280 clair : dessin intact.
- NON COMMITÉS à la coupure (agent arrêté à 200 k) : `scripts/parcours/geste.mjs` (les 4 sélecteurs, prêt), `INVENTAIRE.md`, ce fichier.
  Commit par chemins : `git commit -- scripts/parcours/geste.mjs`, puis `-- work/missions/2026-11-20-frise/INVENTAIRE.md work/missions/2026-11-20-frise/REPRISE.md`.
- Lancés en arrière-plan, résultat NON LU : `node scripts/parcours/calendrier.mjs`, `npx vitest run --maxWorkers=3`, `npm run build` ;
  journaux dans le scratchpad de la session 2 (`…/scratchpad/cal.log`, `vitest.log`, `build.log`, chacun finit par « exit N ») —
  s'ils sont perdus, relancer les trois.
