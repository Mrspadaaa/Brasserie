# Reprise — voie jour-2 (21.11), arrêtée à 150 k. Suite de REPRISE-CAL-26.md (conception arrêtée des points 1 à 7, à relire).

Contrat : test « resoudre », bord au jour, glisser au jour, feuille au jour, CAL-BARRE-BORD, CH-gestes-4, 5, 6. Chaque point : étape geste.mjs
rouge sur tour8 (`C:/Users/mrspa/AppData/Local/Temp/parcours-geste-build-O82816`), verte sur l'arbre, commit par chemins (index temporaire).
Ne pas toucher : courbe, frise des prix, REPRISE-PRIX*.md, principes.mjs.

## Fait
1. Test « resoudre » (`tests/unit/calendrierGestes.test.ts` l. 245) : attente `au: '2026-12-28'` (au jour, plus au dimanche). 49 verts ;
   calendrierEcritures et brewCompanion : 43 verts.
2. Commit **bf1f6bc6b** « CAL-JOUR, bord » : `allonger` au jour + test + geste.mjs `sectionJourBord` (bloc « // ── CAL-JOUR (21.11, « pourquoi »,
   appelé avant `sectionBarre`). Elle ramène d'abord la barre de 3 semaines (la fenêtre de 6 sem. part de celle de 3 mois, S−3, et ne
   contenait pas S+3), puis en 3 mois et 6 sem. à 390 tire le bord de 3 jours. tour8 : KO (fin +7 j, au dimanche) ; arbre : ok, relu au rechargement.
4. Feuille au jour (CAL-JOUR-FEUILLE) : `jourFin`/`jourFinChoisi` au brouillon, `choisirJourFin`, `peutChoisirJoursPlage`, `jourDebutPlage`/`jourFinPlage`
   (calendrierAjout.ts) ; deux rangées « Début », « Fin » dans FeuilleAjout ; « jusqu’à » de DureeFenetre dit le jour ; garde de versModification
   sautée si un jour est choisi ; 5 tests (calFeuilleJour). geste.mjs `sectionFeuilleJour` (avant sectionModifier). tour8 : KO (aucune rangée) ;
   HEAD + correctif (worktree isolé `C:/Users/mrspa/AppData/Local/Temp/w4`, sans les changements courbe de l'arbre) : ok 390/1280, deux
   thèmes, et `modifier … début dans le passé` redevient ok. 50 fichiers de tests Calendrier : 860/861 (1 échec instable, aussi hors de mes fichiers).
   Restent KO hors de moi : frise du haut R6 (courbe), barre 1280 R3. Supprimer w4 à la fin (`git worktree remove --force`, jonction node_modules).

## Constats sur l'arbre (390 clair, `--endroits calendrier`)
- `modifier … début dans le passé` KO depuis le bord au jour : fin 2026-12-12 → 2026-12-13 (la feuille arrondit `au` au dimanche). Corrigé
  par le point 4 (feuille au jour, `jourFin`) : c'est sa preuve rouge.
- `frise du haut reculer/avancer le début` KO (S44·13 → S41·16 : la durée change). Pas à moi (cadre de la courbe, R6 « étirer seul »).

## Outils (scratchpad `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/jour/`)
- `jouer.sh <nom> [largeurs] "<motif grep>"` : build de l'arbre (sauté si `SANS_BUILD=1`), geste.mjs calendrier sur tour8 et sur l'arbre en
  parallèle, 390 clair par défaut ; journaux `<nom>-t8.log`, `<nom>-arbre.log`.
- `commit-geste.sh <msg> <debutMarque> <finMarque> <appelAvant> <appelNouveau> <chemins…>` : geste.mjs = HEAD + mon bloc (régénéré à chaque
  essai), commit par `cal-24/commit.mjs`, 3 essais si HEAD bouge (d'autres voies commitent toutes les minutes). Un bloc déjà dans HEAD ne se
  ré-insère pas : chaque point suivant a son propre bloc (marque de début distincte), inséré avant `  // ── CAL-VIDE (21.11`.

## Reste (dans l'ordre, conception dans REPRISE-CAL-26.md)
3. Glisser au jour (point 1 de CAL-26). Lieux lus : `usePointeur.ts` `pasDe` l. ~183, `recul` dans `majDefile` l. ~245, option `largeurJour`
   déjà là ; `Rangee.tsx` Barre l. ~969-980 (`decalage = drag.k * largeurColonne`, l. 975), BulleIci l. 1023-1024 ; `CalendrierTab.tsx`
   `surGlisse` l. 447, `surLacheGlisse` l. 509, branche à poser avant `estPonctuel` (l. ~468 et 520) ; domaine `jourDuGlisse` l. 239 et
   `departBrassin` l. 228. Seuil : `largeurColonne / 7 >= 8` (≠ `LARGEUR_JOUR_MIN` 16 de echelle.ts, qui sert au dépliage). Étape : 6 sem. à
   390, glisser le corps de 3 jours → du et au +3 j, relu au rechargement (tour8 : +0 ou +7).
4. (fait) ; 5. CAL-BARRE-BORD (point 3), 6. CH-gestes-5, 4, 6 (points 4, 5, 6).
7. Fin : tests Calendrier entiers (liste dans REPRISE-CAL-24.md), `npm run build`, geste.mjs 390 et 1280, deux thèmes. Supprimer le build
   tour8 à la toute fin seulement.
