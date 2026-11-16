# Nuit du 16.11 — état de reprise (pilote)
- Demande relayée par la session parente (carte blanche, aucune question avant 9 h) : 19 L grisé (PageShell), pied et « + » communs à l'assistant, inventaires controle-choix (Paliers, recette), images l5b et s5a, RC-9 (test d'abord). Tests, build, test d'écran, puis mise en ligne avec tag si tout est vert.
- Worktree : `.claude/worktrees/nuit-recette-1611`, branche `claude/nuit-recette-1611`, partie du tag `en-ligne/2026-11-15-recette3` (5726c4c2) ; node_modules en jonction vers epic-banach-4c4f89.
- Voies lancées : `voies/n1-moteur` (RC-9, inventaires, images) et `voies/n2-ecran` (19 L, pied et +), chacune avec son RESULTAT.md.
- Reste : à leur retour, lire les RESULTAT, regarder les captures, faire juger par une critique Opus en vues défilées, rejouer tsc, la suite et le build, puis commiter par chemins.
- Mise en ligne : l'accord de cette nuit est relayé par une autre session, pas donné ici. La commande et le tag sont à préparer, et le déploiement attend un « oui » du brasseur écrit dans la session qui déploie.
- Contexte de la session epic-banach : plein (> 500 k) ; reprendre dans une session neuve à partir de ce fichier.
- 16.11, fin de nuit : n2 fait (« 19 L » grisé, « + » seulement dans la rangée de fin de l'assistant, plus jamais flottant ; critique : 5 problèmes, 4 corrigés, le n° 5 laissé — bord de rangée collante, Houblons 1280). Les échecs de tests sont identiques au tag (7 sur 8 fichiers comparés, plus recipeEditing ×6) ; tsc et build verts.
- RC-9 non appliqué : le correctif (`voies/n1-moteur/rc9-candidat.patch`, test `waterProposition21A.test.ts.attente`) change des chiffres déjà validés (lactique 21A 5,9 → 2,2 mL ; minimum de la démo 45 → 40 %) et casse 8 tests de choix. Décision du brasseur requise.
- Inventaires controle-choix : 5 lignes ajoutées au registre ; il manque les `data-element` et les NOTE de reprise (voie à faire). Images l5b et s5a : perdues (jamais commitées) ; à ré-exporter depuis l'artefact XeAsjYdnSkosrRTTWR23Gz.
- Mise en ligne : rien de déployé ; elle attend son « oui » écrit dans cette session.
- 16.11, suite (règle b1r du 15.11 : « Et le bouton doit toujours être flottant ») : le « + » redevient flottant en bas à droite ; chaque étape réserve sa place en bas (rien n'est couvert en fin de défilement) ; menu : actions de l'étape d'abord, communes ensuite (voie n3-plus). r2, w1b et m2 ne contredisent pas cette règle (lecture dans n3-plus/RESULTAT.md).
- RC-9 appliqué (voie n4-rc9) : lactique 21A 5,9 → 2,2 mL, minimum de la démo 45 → 40 %, pH 5,55 → 5,65, RL-5 3,3 → 1,6 mL, stout 6 → 0,9 mL ; 8 tests de choix mis à jour, aucune assertion retirée. Ce sont des chiffres visibles : à montrer au brasseur.
- Suite complète : 18 échecs, tous antérieurs ou instables (recipeEditing ×6, recipeAiWorkflow ×2, expenseSheet, yeastPitchingExecution ×2, hopAdvice bundle ×2, designTokens et virgule sur des fichiers d'autres sessions, hopV55ColdContact qui passe isolé). tsc 0 erreur.

## Contrat réécrit — 16.11, matin (pilote)
- Test en ligne de la nuit (section « Jeu en ligne nuit 16.11 » du BUGS.md pilote) : RC-9 est corrigé.
- Restent ouverts :
  - 36 : aucune suppression de recette trouvée. Le 15.11, une feuille « Supprimer cette recette ? » existait : est-ce une régression ?
  - 37 : « il manque Pilsner Malz 49 kg » alors que la recette en demande 5. Stock négatif ou calcul faux ?
  - b1r : le + de l'assistant ne propose que « Partout » ; les actions de la recette doivent venir en tête.
  - « 19 L » : le défaut affiché est 24 L, à vérifier.
- Pour chacun : d'abord un test qui échoue, puis la correction, puis la mise en ligne. Supprimer ensuite les deux recettes ZZ TEST, si la suppression existe.
