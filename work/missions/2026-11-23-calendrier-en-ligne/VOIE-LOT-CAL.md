# Lot Calendrier — à faire maintenant (court ; l'historique : VOIE-LOT-CAL-historique.md, ne pas le lire)

Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/lot-cal (claude/lot-cal). En ligne : tour 21 (ddb5f2d6e).
Cycle : test rouge → correction → ton test vert → commit → « PRÊT À METTRE EN LIGNE <hash> » (SendMessage to: main) →
attendre « EN LIGNE » → preuve en ligne (Chrome 9222, ta page, 390, ZZ TEST, captures entières regardées). Jamais fermer Chrome.

0. CAL-ANNULEES-COMPTEES (ARGENT FAUX, d abord) — les 2 ventes « ZZ TEST — parcours » sont annulées (« Écriture annulée », hors de Finances) mais comptées au Calendrier (+90). Les choses argent viennent de `domain/calendrier.ts` ~l. 1060 (`item.source`…), nourries par la prévision de trésorerie : filtrer les écritures annulées À LA SOURCE de cette prévision (comme Finances), pas seulement à l affichage.
1. CAL-JOUR-EXACT — `frise/usePointeur.ts:276` (`joursDe`) et `:263` (`pasDe`) arrondissent un écart relatif (Math.round) :
   jour cible = plancher de la position ABSOLUE du doigt via `entete/alignement.ts` (l. 76, 125), k = cible − jour du bout.
2. CAL-SEMAINE-ENTRE-TRAITS — semaines et mois : traits = limites (lundi, 1er), étiquette centrée entre deux traits ; jours inchangés.
3. CAL-VENTE-FICHE — toucher une vente ouvre la fiche du Calendrier (pas l'écran de la vente ; celui-ci par « Ouvrir »).
4. Bandeau « Enregistrement sur le serveur… » qui reste et couvre la période : reproduire en ligne, cause, corriger.
5. CAL-SECTIONS-VIDES-COMPACTES — rangées vides ou toutes cachées réunies en une ligne de pastilles avec leur +.
6. Tirage du bord à 10 sem. : la barre se vide de son nom (brasseur-23-11/1038-ttt-tirage.jpg).
7. « −1 663 » pousse « CHF à dépenser » sous ± ; bouton de durée en retard pendant le tirage.
8. Lenteur : mesurée en ligne (CPU ×4, INP, longues tâches) avant/après.
Lignes de contrôle : work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md (CAL-*). Captures : brasseur-23-11/.
