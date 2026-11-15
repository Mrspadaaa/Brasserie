# e8nc — tiède

Chaleur : tiède.
Idée : Le sommaire rangé par style
Ce qui change : sept styles en titres, chaque recette un jeton ; trente recettes d'un regard.
Geste : après « IPA » tapé dans la recherche (les 9 IPA s'allument, rien ne bouge).

- Repos : recherche, une ligne de clé (pointillé : jamais brassée ; bord vert, bleu, ocre : en cuve, en garde, à brasser), puis IPA 9, Blondes et lagers 6, Brunes et noires 6, Belges et saisons 5, Pale ales et bitters 4, Ambrées 3, Blanches et acidulées 2. Jeton : point à la couleur de la bière, nom, étoile si favorite, état court (J+5, garde, à brasser). Environ 30 recettes au premier écran, pas de 44 px.
- Historique : toucher NEIPA ouvre ses 3 lots sur place, sous le jeton : une piste par lot de la densité initiale à la finale (valeurs aux bouts), bande verte de la FG visée 1,010–1,014 ; LOT-019 en pointillé (en cuve, 5,8 % provisoire, FG 1,018 encore hors bande). « Ouvrir la recette » renvoie à la fiche (autre session), « Brasser à nouveau ».
- Comparer : deux jetons numérotés 1 et 2, feuille de réglettes (alcool, densité initiale, FG visée, houblon à cru, lots), puis houblons et levure en mots, « Pareil : 24 L, fermenteur 30 L ».
- Vide : les sept styles à 0, deux jetons fantômes sous les deux premiers, Nouvelle recette / Importer une recette.
- Données : 5 réelles (NEIPA, Pale Ale, Pils, Stout, Saison, chiffres de DONNEES-COMMUNES), 30 recettes d'exemple pour la densité (fictives). Le rangement par style suppose un style connu pour chaque recette (le style BeerStyleTag de la recette).
- Limite vue : à la réglette FG visée, les repères 1 et 2 se touchent (1,012 et 1,011) ; c'est la vérité des chiffres.

## Passe g9 (15.11, corrections de k9)
- n° 1 (bloquant) : réglettes du comparatif en deux pistes ; une plage est une bande (FG 1,010–1,014 et 1,010–1,012 empilées, alcool 6,3–6,8 % en bande), une valeur est un point.
- n° 2 : jetons de 36 px de haut, zone de toucher étendue à 46 px (36 + 2 × 5, pseudo-élément ::after) ; le pas vertical reste 44 px.
- n° 3 : légende retirée au repos et au geste. n° 4 : degré dans le jeton (NEIPA 6,3–6,8). n° 5 : titres de style au neutre de l'app. n° 6 : ligne d'explication de l'historique retirée. n° 7 : lots en chiffres, deux boutons Ouvrir NEIPA et Ouvrir Pale Ale. n° 8 : liseré clair sur les pastilles stout et brown en cave.
