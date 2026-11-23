# Reprise — voie frise prix, 5e passe (21.11), arrêtée à 200 k (hook). Suite de REPRISE-PRIX-2.md (points 2 à 6). RIEN COMMITÉ dans cette passe.

Scratchpad : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/prix/`.
Commit : `../cal-24/commit.mjs <msg.txt> <chemin>[=<fichier préparé>] …` (index temporaire).

## Code écrit dans l'arbre (port-carnet), tout tsc propre
- Point 2 ÉCHELLE : `EnTete.tsx` `changerCadre` (dans l'An, durée < 52 → `fenAvantAnnee = null`, `onVue('semaines')`, puis `ecrire`) branché en
  `onChange` du Cadre. `echelle.ts` (mois au-delà de 26 sem. hors An) et `calendrierEchelle.test.ts` : DÉJÀ DANS HEAD, balayés par le commit
  d'une autre voie (aa67099f6 « CAL-JOUR, glisser »), avec aussi `Barre.tsx` « + à venir ». À dire dans le message de commit, rien à refaire.
- Point 3 bandeau (CFP-8) : `src/ui/PersistenceStatus.tsx` fixed, pilule opaque bg-cave-850 en haut, `pointer-events-none`, « Actualiser »
  `pointer-events-auto`. Test : `tests/integration/persistanceBandeau.test.tsx` (nouveau).
- Point 4 noms : `Courbe.tsx` (toucheLeTrace parcourt les colonnes [x(j), x(j+1)] : CHV-1 ; `obstaclesZero` exporté, passé à placerNoms :
  CHV-2 ; au plus 2 noms empilés : CHV-3) ; `entete.css` `.ent-cadre-l > span` fond opaque (CHV-1). Test : `tests/unit/calFrisePrixNoms.test.ts`.
- CHV-11 : `DetailChose.tsx`, `Marque.tsx` « + à venir » (Barre.tsx déjà dans HEAD, voir plus haut).
- geste.mjs (arbre = HEAD + mes hunks SEULEMENT, vérifié après b6e3355e0) : glisser `{ tenir, pendant }` ; R6 ; « glisser le corps »,
  « appui long lit » ; bloc noms « // CHV-1, CHV-2, CHV-3, CHV-11 » (libre puis alignée) ; bloc « // CAL-ECHELLE-FIGEE (21.11) » (An → réduire
  la fin, An décoché, 3 mois rechoisi). Scripts : `p2-6.mjs`, `geste-p2-6.mjs` (déjà appliqués, ne pas relancer).

## Preuves
- vitest : HEAD + mes seuls fichiers (worktree isolé `%TEMP%/t8u`) : 57 fichiers, 919 verts (calendrier*, cal*, persistanceBandeau). Dans
  l'arbre, 2 échecs calendrierFrise (CRITIQUE-12 n° 2, « doute Papiers en An ») viennent de `src/domain/calendrier.ts` et `Rangee.tsx` non
  commités d'une autre voie (V7) : verts sans eux.
- Rouge sur tour8 (vitest, t8u au tag) : 18 échecs (CHV-1 alignée, CHV-2, CHV-3, bandeau, échelle 40 sem.).
- geste.mjs rouge sur tour8 (`g-tour8.log`, 390 et 1280 clair) : reculer/avancer le début, glisser le corps, appui long, noms libre et alignée
  (ligne zéro, empilement, étiquette sans fond, « −69 + »), An réduire, An décoché.
- geste.mjs vert sur l'arbre isolé (build `build-iso` depuis t8u = HEAD + mes fichiers ; `g-iso.log`) : 390 clair et cave tout vert (glisser
  le corps, appui long, noms libre/alignée, An, 3 mois). 1280 : run en cours à l'arrêt, LIRE `g-iso.log` (« PARCOURS GESTE »). Avant ce run,
  seul KO arbre = l'ancien contrôle d'empilement trop strict (corrigé : compté par abscisse).
- Captures regardées : `g-iso/calendrier-390-clair-noms-alignee.png`, `390-cave-noms-libre.png` : noms propres, étiquette « S45 – S5 2027 »
  opaque, « −69 + à venir ». Non regardées : 1280.

## Reste
1. Lire `g-iso.log` (1280). Si KO, corriger. Regarder une capture 1280 de chaque thème.
2. Versions de geste.mjs par point : `decoupe-geste.mjs` (corriger d'abord : `const fin = arbre;`, le retrait du hunk « R3 » est FAUX, ce hunk
   est dans HEAD depuis b6e3355e0) → `geste-v1.mjs` (R6 + corps + appui long), `geste-v2.mjs` (+ An), `geste-v4.mjs` (= arbre). Vérifier :
   `git diff --no-index` HEAD contre chacune ne montre que mes hunks.
3. Commits (message.txt + commit.mjs) : C1 point 1 geste (`scripts/parcours/geste.mjs=geste-v1.mjs`) ; C2 ÉCHELLE (`EnTete.tsx`,
   `geste.mjs=geste-v2.mjs`, citer aa67099f6) ; C3 bandeau (`PersistenceStatus.tsx`, `tests/integration/persistanceBandeau.test.tsx`) ; C4 noms
   et CHV-11 (`Courbe.tsx`, `entete.css`, `DetailChose.tsx`, `Marque.tsx`, `tests/unit/calFrisePrixNoms.test.ts`, `geste.mjs=geste-v4.mjs`).
   Avant chaque commit : `git diff <fichier>` ne contient que mes hunks (d'autres voies écrivent ce worktree).
4. BUGS.md du dépôt Brasserie (`C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md`) : CFP-1 à CFP-8 (l. ~2187),
   CHV-1/2/3/11 (l. 2134-2144) → « corrigé » + commits ; CAL-ECHELLE-FIGEE n'a pas de ligne : l'ajouter.
5. Nettoyer : `git worktree remove --force %TEMP%/t8u` (jonction node_modules : retirer la jonction avant), build tour8 gardé
   `C:/Users/mrspa/AppData/Local/Temp/parcours-geste-build-O82816` à supprimer à la fin de la voie.
