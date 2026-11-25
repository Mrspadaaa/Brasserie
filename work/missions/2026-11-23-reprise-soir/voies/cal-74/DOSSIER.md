# Dossier cal-74

Constats : voies/cal-73/RESULTAT.md (5 problèmes m, mesures) ; lignes `grep -n "^| K73-" work/missions/BUGS.md`. Ses mots : « Q-4 : la vitesse du défilement au bord, à essayer sur ton téléphone. Trop lente sur le calendrier » ; « l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible ».
Mesuré en ligne (tour 73) : ouvrir le Calendrier 396–595 ms (une tâche longue 358–577 ms) ; relâcher une barre 229–278 ms (image gelée 255–339 ms) ; barre tenue au bord : images de 216–279 ms (le défilement au bord saccade : c'est sa « trop lente ») ; défiler 3 sem. ≤ 55 ms.
1. ## État de l'art au RESULTAT (L29) : problème type (rendu React coûteux pendant un glisser : re-rendu de toute la frise à chaque image ; auto-défilement au bord) ; méthode standard (profilage React/Chrome Performance, mémoïsation des lignes, mise à jour du seul élément glissé par transform hors React pendant le geste, requestAnimationFrame, virtualisation si la liste est longue) ; bibliothèque déjà au package.json de préférence.
2. Profile (Chrome Performance sur le serveur local de dev avec fixture, ou sur la mesure en ligne en lecture seule) ; nomme les 3 plus gros coûts AVANT de coder.
3. Cibles : pendant une barre tenue au bord, images ≤ 50 ms (60 % au moins ≤ 17 ms) ; relâcher ≤ 100 ms ; ouvrir le Calendrier : tâche longue ≤ 200 ms. Vitesse du défilement au bord : plus rapide qu'au tour 73 et réglée (accélère avec le temps tenu), zone de bord atteignable au pouce (sa parole).
4. Les 5 constats K73-n corrigés, chacun avec un test.
5. scripts/mesure-calendrier.mjs : mesure avant/après sur le serveur local (Chrome de débug 9222, ton onglet, jamais browser.close()) ; écris les deux tableaux au RESULTAT.
6. Porte : `npx tsc --noEmit` (2 erreurs connues), tests du Calendrier verts, virgule-transversale, proprietes verts. Commit par CHEMINS. Pas de déploiement. Aucune donnée réelle touchée.
Ligne rendue : « CAL bord <avant>→<après> ms/image ; ouvrir <avant>→<après> ms ; K73 n/5 <hash> ».
