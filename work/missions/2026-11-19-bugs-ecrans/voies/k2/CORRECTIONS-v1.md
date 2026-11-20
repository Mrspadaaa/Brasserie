# Corrections v1, tour 2 (critique k2, 20.11)

Liste figée (L18) : chaque point est corrigé et prouvé seul (test si c’est une règle ; capture 390 et 1280, clair et cave, ouverte), ou écarté avec raison. Un point « hors voie » de la critique se corrige s’il est dans ton « Possède » (voies/v1/VOIE.md) ; sinon « ouvert — hors voie : fichier ». Même contrat que voies/v1/VOIE.md : COMMUN.md, test rouge d’abord, commit par chemins « Bugs T3B (v1) k2 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement ni de données réelles, jamais stash/reset/checkout.

## Problèmes (RAPPORT.md, même dossier)
24. v1 / T3B-13 / vendre-390-{clair,cave} : la tuile 75 cl dit « à vérifier · prix ? » sans dire pourquoi ni où corriger. La raison (759 CHF le litre, Atelier › Tarifs) n'est que dans une infobulle, qu'on ne peut pas ouvrir au doigt / gênant
25. v1 / T3B-13 / vendre-390-cave-clic75 : en cave, les champs de la ligne libre (« Pale Ale · 75 cl », quantité, prix) sont gris sur fond gris, difficiles à lire / gênant
26. v1 / T3B-13 / vendre-* : « à vérifier · prix ? » sert à deux causes différentes, le fût 20 L sans fût lié et le 75 cl au prix aberrant. Un seul libellé pour les deux / détail
27. v1 / T3B-10 / previsions-390-{clair,cave}-12mois : les noms de mois se touchent (« déc. janv. », « juil. août ») / détail
28. v1 / T3B-10 / previsions-* : la bulle « achats ≥ 66,40 ×2, 20.11 » est codée (« ≥ », « ×2 ») ; elle ne se lit pas en mots / détail

## Doutes à trancher
- v1, T3B-10 : les captures n'ont qu'une bulle et un solde de −66,40. Le cas du constat (« TEST −9 » sur « −703,68 ») n'est pas reproduit. Le correctif est préventif et n'est pas prouvé.


## Preuves demandées (à produire toi-même)
5. v1, T3B-10 : sur le banc `finance-demo=reel`, injecter un plan « ZZ TEST — achat » de 9 CHF au 25.12, avec un solde final d'environ −703,68. Capturer l'écran Prévisions entier (pas seulement le graphique) en 90 j, 390 clair et cave : `previsions-cas-enligne-390-{clair,cave}.png`. Rapporter la mesure de recouvrement bulle × solde.
6. v1, T3B-13 : à 390, toucher « à vérifier » sur la tuile 75 cl et capturer `vendre-390-clair-toucher-averifier.png`. La raison s'affiche-t-elle sans infobulle ?

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> / ouvert <raison> | capture ». Mettre à jour voies/v1/RESULTAT.md si un verdict change, puis tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs v1` et `--tests` OK. Réponse : une ligne.

## Fait
24 | corrigé 7d141dfa1 | vendre-390-clair-toucher-averifier.png, vendre-390-cave-toucher-averifier.png
25 | corrigé 7d141dfa1 | vendre-390-cave-toucher-averifier.png (champs lisibles, contraste 16,8)
26 | corrigé 7d141dfa1 | vendre-390-clair-toucher-averifier.png (deux libellés)
27 | corrigé 7d141dfa1 | previsions-390-cave-12mois-k2.png
28 | corrigé 7d141dfa1 | previsions-cas-enligne-390-cave.png (« achats (2 fois) au moins 66,40 »)
Doute T3B-10 | rejoué, 0 recouvrement, bulle à 12 px du solde | previsions-cas-enligne-390-{clair,cave}.png
Preuve 5 | produite : cas-enligne.txt | previsions-cas-enligne-390-{clair,cave}.png
Preuve 6 | la raison s affiche sans infobulle | vendre-390-clair-toucher-averifier.png
