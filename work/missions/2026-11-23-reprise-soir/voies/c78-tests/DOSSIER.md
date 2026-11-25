# Dossier c78-tests — reel-78 (voies/reel-78/RESULTAT.md ; lignes R78-n et les R73/R75/R77 rouverts de BUGS.md)

Constat clé : 7 corrigés tenus sur 29 en ligne (R73 1/17, R75 0/4) alors que leurs tests étaient verts : pour CHAQUE ligne rouverte, lis au RESULTAT de reel-78 ce que l'écran montre, et écris le test qui ÉCHOUE sur ce que l'écran montre (même document, même chemin d'écran que reel-78), pas sur une variante ; un test vert sur une ligne rouverte est un faux vert : dis pourquoi au RESULTAT.
Documents RÉELS : tests/fixtures/c75/*.json (et c77/ s'il le faut).
- R107 (R78-1, B, régression du tour 78) : le nom court d'un article au tableau garde son nom lisible (jamais « 1500 x », « 1800 x ») : la RÈGLE du nom court (retirer le bruit, garder la désignation), testée sur tous les articles des documents réels.
- R108 : chaque R73-n, R75-n et R77-n rouvert par reel-78, un test par ligne, par le composant monté.
- R109 : R78-2..7 (m).
SEULEMENT des tests rouges ; aucun fichier de src/ ni functions/ modifié.
