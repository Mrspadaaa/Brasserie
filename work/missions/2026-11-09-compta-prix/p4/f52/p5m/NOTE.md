# p5m — Prévisions, 12 mois : le Gantt d'épargne (froide)

Idée : le Gantt qu'il demande. Une ligne par chose à financer, douze mois en colonnes. En haut, les 300 de chaque mois, colorés par
leur destination. La barre du frigo se remplit : ce que j'ai déjà (plein), puis une marche par mois, jusqu'au losange de l'achat.

## En une phrase (B11)
« J'ai déjà 1 567,60 pour le frigo, il m'en manque 1 432,40 : à 300 par mois, je l'achète en avril. »

## Le métier dessiné (voir `../METIER.md` § 7 et § 8)
Ses mots : « Si par exemple je fais 300chf par mois, combien je peux mettre pour prendre mon frigo, combien je dois économiser. Ça
serait plus un type de diagramme de Gantt » ; « si j'ai un coup dur… qu'est-ce que ça fait à mon année ».
- Libre aujourd'hui = trésorerie 4 181,60 − dû 460,00 − réserve 1 404,00 = 2 317,60. Le fermenteur (750,00, devis de janvier) est mis de côté.
- **Je peux mettre 1 567,60** vers le frigo aujourd'hui ; **il reste 1 432,40 à économiser** : cinq mois à 300,00, frigo en avril. Pour l'avoir en janvier : 716,20 par mois.
- Un coup dur se paie sur la réserve ; ce que je dégage sert d'abord à la refaire. Panne de 800,00 en février : frigo en juillet (+ 3 mois), fin octobre 1 367,60 au lieu de 2 167,60.

## Honnêteté
Fixture : 4 181,60, dû 460,00, charges fixes 468,00 par mois, fermenteur 750,00. Exemple, souligné en pointillé : 300,00 par mois (son
chiffre), la réserve de trois mois de charges (1 404,00, réglable), le frigo 3 000,00, la panne 800,00. Le « système » reste sans prix,
hors de tout total. « Contrôle électrique » et « Fonds de rénovation » sont des bascules dessinées, pas jouées : une dépense d'un coup
décale comme la panne ; une charge qui augmente baisse ce que je dégage chaque mois (règle dans METIER § 8, non dessinée).

## Boosters UX (boosters-ux)
- Boosters : `mensuel` (ajuster, curseur « Je dégage ») ; `horizon` (segment, 12 mois) ; `coup-dur` (comparer, trois bascules « Et si ») ; le graphe. Statique : l'état « Panne » est dessiné à côté.
- B1 OK · B2 OK (un primaire ; la réponse, le mois d'achat, est le plus gros mot du graphe ; jugé sur la capture nette) · B3 OK (57 mots hors données ; 5 blocs)
- B4 OK · B5 non mesuré · B6 ECHEC (5 tailles : 12, 13, 14, 18, 20) · B7 OK (`controle-contraste`) · B8 ~ (deux états ; pas d'état « rien de dégagé ») · B9, B10 s.o. · B12 OK · B13 lu au CSS (28 et 32 px), non mesuré.

## Contrôles
PAGE OK (390) · 1280 : débord 0 · `capturer.mjs` : aucune étiquette hors cadre ni chevauchée, 0 texte sous 12 px · MOTS 57 · COMMUN OK. Captures ouvertes : `-haut`, `-1280`.

## Tient / casse
- Tient : les deux réponses qu'il demande sont écrites sur la barre (« déjà », « encore ») ; le décalage d'un coup dur se voit (losange fantôme).
- Casse : colonnes de 23 px, les mois sont en chiffres ; l'ordre fermenteur puis frigo est fixe (glisser pour inverser : non dessiné).
