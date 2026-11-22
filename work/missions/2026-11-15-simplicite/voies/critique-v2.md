ECHEC — 12 problèmes, 4 bloquants : nette progression, mais 390 illisible, fermenteur payé par 86,50 CHF, Tab hors v6a

Jugé : `outils/pages/2026-11-15-simplicite/index.html`, rendu avec puppeteer-core à 390 tactile et 1280, en clair et en sombre. Chaque groupe a été défilé. Deux « Choisir » et « Copier » touchés à chaque largeur : sortie « pa1 · pe2 » et « pa2 · pe4 », bouton « Copié ». Les 14 captures sont dans `%TEMP%/crit-v2/` et je les ai ouvertes.
Phrase prédite du brasseur : « Là ça part de mes trucs. Mais le Tab, je l'avais montré : v6a. Et un fermenteur payé avec une facture de malt à 86 balles ? »

La passe progresse : on passe de 17 à 12 problèmes, les fréquences inventées et le formulaire de règles ont disparu, et les citations sont réelles.

## Bloquants
1. **390 illisible** : la page n'a pas de `<meta name="viewport">`. Elle se met en page sur 980 px (clientWidth mesuré à 980), donc le texte tombe à environ 6 px sur téléphone. L'hôte des artefacts pourrait injecter cette balise : je ne l'ai pas vérifié. Correction : ajouter `width=device-width,initial-scale=1`.
2. **Ça n'existe pas en vrai** : en pe1 et pe2, la facture Brau- und Rauchshop de 86,50 CHF (des malts) passe le « Fermenteur suppl. » en « payé ». Or le fermenteur coûte 750 CHF chez Inox & Co (pl1). Correction : montrer le besoin payé sur la facture Inox & Co, ou retirer la puce.
3. **Écart à sa forme nommée** : il a écrit « je veux un Tab en bas … type un peu comme Lignes serrées v6a » (10.11, et SPEC lu : avant → après). La citation s'arrête avant « v6a », et pe1 ne montre que des écarts. Correction : dessiner pe1 en lignes serrées v6a, avant → après.
4. **Sa chaîne réduite à la facture** : il a écrit « Création de recette, met à jour les stock et besoin … Vente, met à jour les finances ». Les quatre variantes partent toutes de la dépense. Recette → besoin et vente → finances sont absents. Correction : un effet par maillon de sa chaîne, dans la même forme.

## À retoucher
5. La citation « Donne aucune info !!! » (09.11) demande les totaux attendu, trouvé et effectif, avec un drapeau. Aucune des variantes pa1 à pa3 n'y répond : il faut soit retirer la citation, soit la traiter.
6. En pa3, les tuiles +100 s'affichent sur l'unité kg : cela donne 100 kg de Caramünch. Ses mots (02.11) : « pièces 1,2,3,5,10 … grammes et houblons 1,5,10,100 ». Les tuiles doivent suivre l'unité. Le « 1,75 » n'a pas de libellé : est-ce un prix ou une quantité ?
7. En pe4, la dose se saisit dans un champ chiffré « __ ml », contre « utilise des slider plutot que … input de chiffre sur téléphone » (10.11). De plus, le Star San revient en pe3 et pe4, malgré « pas focus sur ces exemples !!! ».
8. Parcours 4 : sa plainte visait le palier (saccharification, température, pH ; SPEC lu), et la page passe à la DO pré-ébullition. La citation du curseur est coupée sans « … » (il manque « de chiffre sur téléphone »). « Le curseur de m2 » ne peut pas se vérifier, car m2 n'est pas montrée.
9. Parcours 3 : la citation est un refus de maquettes, pas un problème qu'il décrit. « Recettes : aucune » a été refusé dans le même message et manque à la page.
10. Les colonnes « Aujourd'hui » des parcours 2, 4 et 5 sont dessinées et non capturées. Elles affirment pourtant comme des faits « Brasser ou laver ne décompte rien », « la DO pré-ébullition n'est demandée nulle part » et « Lier à une dépense prévue · facultatif ». mesures.md ne le prouve pas. Il faut capturer ces écrans, ou écrire « dessiné ».
11. En pl2, À venir est une liste nue. Or il a choisi kyh1 avec « graphe de kh1r 1:1 » (15.11). Greffe possible : l'effet de pe1 se lit aussi sur la courbe kh1r (« on voit mieux les conséquences sur le graph »).
12. Aucune de ses maquettes choisies n'apparaît en référence à côté des variantes : ni m2, ni kyg1/kyh1, ni kh1r, ni b1.

Doute, non compté : la date 09.11 de « perd du coup le focus » se déduit de la section, elle n'est pas lue sur la ligne.

## Mes 5 critères
1. Une citation par parcours, sans fréquences inventées : **OK**, sauf le parcours 3 (point 9).
2. La cascade sur sa chaîne, avec un Tab des finances : **manque** (points 3 et 4).
3. Chaque « après » à côté de sa maquette choisie : **manque** (points 8, 11 et 12).
4. Zéro réglage ni jargon, une ligne par mini maquette, l'Atelier V5.5 retiré : **OK**. Pas de cockpit ni de texte en trop.
5. Côte à côte, Copier, aucun débordement à 390, deux thèmes : **manque** (point 1). Les thèmes, le défilement et les gestes sont OK.

LEÇON PROPOSÉE : une citation se coupe après la référence qu'elle nomme (« type … v6a »), jamais avant.
