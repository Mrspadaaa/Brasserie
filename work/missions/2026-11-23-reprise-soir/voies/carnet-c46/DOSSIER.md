# Dossier carnet-c46 — test en ligne du Carnet, tour 46 (voies/critique-46/RESULTAT.md)

Lignes complètes : `grep -n "^| C46-" work/missions/BUGS.md` (captures citées). Ses choix portés : voies/carnet-q/RESULTAT.md, decisions-D435-D437.txt.
- C46-1 (B, Q-1b) : sur Frigo + congel, la pastille « 400 CHF · budget » en tête est pressée ; « · budget » gris sur vert foncé illisible. Attendu : lisible (contraste AA), à sa place, comme la variante B choisie.
- C46-2 (m, Q-2 C) : la recherche coupe le mot trouvé (« … groupe fri… »). Attendu : l'extrait cite la ligne autour du mot entier, mot surligné jamais coupé.
- C46-3 (m, Q-1 A) : après Choisir à 79,95, l'avis du Calendrier dit encore « −500 CHF » avec Annuler. Attendu : l'avis dit le prix choisi (une seule source de prix).
- C46-4 (D) : le prix choisi est encore dit « estimé ». C46-5 (D) : 80 dans À venir, 79,95 ailleurs (même arrondi partout). C46-6 (D) : la lecture d'un lien compte « 6 sur 7 » puis « 6 étapes sur 6 » (un seul total).
- Exigences : 390 px d'abord ; pas de type=number ; aucune donnée réelle écrite.
