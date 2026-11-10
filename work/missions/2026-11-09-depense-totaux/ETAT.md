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

## 10.11, fin d'après-midi
- En ligne : 85de7802 (tag `en-ligne/2026-11-10-cat`) = ed9eb964 (DP-4) + DP-6 (b1d3991f) + DP-5 jeu 8 (f4743c85) + partie client de afb30756
  (BAUHAUS en Rénovation sans stock, plus de mots bruts). Tags précédents : `en-ligne/2026-11-10-dp56`, `-dp4`, `-1355`, `-avant-p2`.
- aiTask : la session fusion-lectures déploie son serveur (aligneur NW, payé = terminal, comptage écarté si la 3.8 le contredit).
- Jeu en ligne 8 (`critique/VERDICT-EN-LIGNE-8.md`) : bloquants 1, 3, 4, 6 = lecture (fusion-lectures) ; 2 = classement (porté) ; 5 = ajout de
  ligne (porté). Non rejoué en ligne après ces deux ports : vérifiés au banc (390, cave) et par 3 054 tests de la copie de déploiement.
- Doutes du critique à vérifier au doigt : double toucher de la loupe (échelle 1,06 en émulation), « Suivant » sous filtre à 1280.
- 10.11 soir : hébergement 7458f19e (tag `en-ligne/2026-11-10-compta2`) = 85de7802 + compta-prix 12da1b9e, ca01f350, d347ccef repris seuls
  (la branche claude/jolly-mahavira-cc0cc2 a fusionné ma branche avec le client p2/p3 retiré : jamais la déployer telle quelle). 3 167 tests verts.
- Voie f2 (auteur) dans le worktree epic-banach-4c4f89 (branche claude/happy-satoshi-f3f2c1) : les 5 bloquants de lecture du jeu 8 ;
  le pilote déploie aiTask après rejeu, puis jeu en ligne 9.
- 10.11 nuit : hébergement 27d20e50 (tag `en-ligne/2026-11-10-dp7`) = compta2 + DP-7 ; aiTask 30d393d6 (tag `aitask/2026-11-10-f2`, retour :
  `aitask/2026-11-10-avant-f2`). Jeu en ligne 10 : 0 bloquant, 7 non bloquants (`critique/VERDICT-EN-LIGNE-10.md`), dont trio sous le pied
  à 1280 après la frappe et « g | kg | Stk » sur une ligne fermée sans unité.
