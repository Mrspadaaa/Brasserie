# REPRISE — tour 9, suite (21.11)

Worktree `.../openai-clean-start/port-carnet`. Toujours un index temporaire (`GIT_INDEX_FILE`) pour commiter.

## Fait
- Point 3 commité : `1e1bf8ef0` (CAL-CUVE). Code : `corrigerBrassage` (calendrierGestes.ts, écrit `brewDate`), branché dans CalendrierTab (les 2 onDecalerDebut),
  `ecritures.ts` (patch `brewDate` seul accepté), `DetailChose.tsx` (pastille « Prête ? » fin inconnue réglable). Contrôle : `geste.mjs` section `sectionCuve`.
  Vert sur l'arbre (390/1280, clair/cave) ; rouge sur `en-ligne/2026-11-21-tour8` (`--ref`, règle non ouverte).
- Index réel : les 5 chemins remis à HEAD (`git reset -- chemins`), propres.

## Reste
1. `node scripts/parcours/calendrier.mjs $TEMP/cal-out` : lancé en arrière-plan, sortie filtrée par grep (vide tant qu'il tourne, plus de 25 min) ; relancer SANS grep dans un fichier
   si besoin (`> $TEMP/cal.log`), puis `grep -E "KO|OK|ECHEC"`. Un autre banc (stock.mjs) tournait en parallèle : conflit possible, vérifier.
2. `node scripts/parcours/geste.mjs $TEMP/geste-tout --endroits calendrier` en entier (toutes sections, dont sectionCuve), garder KO/OK.
3. BUGS.md (`Brasserie/work/missions/BUGS.md`) : lignes CAL-BARRE-BORD, build, brassin en cuve (CAL-CUVE) à la main ; `node scripts/agents/controle-bugs.mjs` → OK.
4. `git worktree remove --force %TEMP%/cal-t9` (jonctions node_modules d'abord).

## Résultat de calendrier.mjs (fini, ECHEC 5) — à diagnostiquer (non fait)
- KO C1-GLISSER : glissée d'une semaine à gauche : S7 → S4, fenêtre S6–S18 devient S4–S18 (13 → 15 col.). Suspect n° 1 : mon commit `6d22c6115` (CAL-BARRE-BORD :
  defilerFenetre sans glissement + usePointeur majDefile) — une chose glissée près du bord agrandit la fenêtre au lieu de la laisser.
- KO CAL-ENTETE ×4 (An / 3 mois : semaine sans repère sur la courbe ; rangée qui redit un montant ; haut qui bouge de 30 px courbe cachée) et KO G3 (filtres) :
  probablement antérieurs (à vérifier en rejouant sur `git stash`-free : worktree détaché au commit 5be8fe00a ou tour8).
- Lancer `calendrier.mjs` dans un fichier (`> $TEMP/cal.log`), durée > 25 min.
