# État de reprise — 10.11 (pilote)

## En ligne
- Hébergement c76481aa (index-Bm7Esjph.js) : DP-2 (totaux faux en rouge, renvois utiles, rangées sans chevauchement) et D382 (un seul
  bouton « Documents »). Jeu en ligne 4 : rouge, gestes et « Documents » tiennent.
- aiTask : afb30756 (champ `retirees` additif, redressement d'un décalage d'un rang de la 3.8) ; sans effet visible sur c76481aa.
- Branche poussée jusqu'à afb30756 (p2, p3 et sa relance) ; hébergement revenu deux fois à c76481aa (jeux 5 et 7 : régressions).

## Ouvert — fusion des lectures (provisoire des deux Flash-Lite / 3.8)
- Jeux en ligne 5, 6, 7 : chaque passe corrige des bloquants et en révèle d'autres dans le même module (`rangsProvisoires`,
  `alignerLignes`, `retirees`, payé, comptage) : doublons « vues par une seule lecture », quantités perdues, corrections décalées,
  payé 14,60, « 13 comptés ». Verdicts : `critique/VERDICT-EN-LIGNE-5.md` à `-7.md`.
- L29 atteinte (trois rustines sur un module) : arrêt. Suite : une mission dédiée, « ## État de l'art » d'abord (problème type :
  alignement de séquences / affectation des lignes entre lectures — Needleman-Wunsch, Hungarian, vote par champ), banc réel.
- La 3.8 ne rend que la page 2 de deux tickets d'un même règlement : cause probable `MULTI_PAGE_NOTE` (ai.ts) ; non mesuré.
- Coût Gemini cumulé 10,94 CHF > plafond D234 (5 CHF) : toute lecture réelle attend son accord.

## Leçon proposée (LECONS au plafond : fusionner avant)
- Un jeu en ligne qui révèle un nouveau bloquant dans le même module à chaque passe : à la deuxième, arrêter les relances et passer
  par L29 (état de l'art, banc), pas une troisième rustine.

## Déploiements et retours arrière (10.11, après-midi)
- Hébergement : f18be5cc (tag `en-ligne/2026-11-10-1355`) = df7929f6 (c76481aa + DP-3 « Documents » au doigt + « Suivant › ») + loupe ddff27d2
  + compta-prix e272aa33 (branche claude/jolly-mahavira-cc0cc2), fusion faite dans la copie de déploiement seulement.
- aiTask : functions/src de c76481aa (tag `en-ligne/2026-11-10-avant-p2`), remis pour aller avec le client (le brasseur voyait des
  régressions client c76481aa / serveur afb30756).
- Retour arrière : `git checkout --detach <tag>` dans la copie de déploiement, build, hébergement ; aiTask : `git checkout <tag> -- functions/src`
  dans ce worktree, déploiement, puis `git checkout HEAD -- functions/src`.
- En cours : voie p4 (DP-4 Idaho 7) ; défilement de la ligne ajoutée (ExpenseSheet `focaliser`, non commis, attend p4).
