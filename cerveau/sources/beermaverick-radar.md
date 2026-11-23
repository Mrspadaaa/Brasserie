---
name: beermaverick-radar
description: Le radar de Beer Maverick est la référence du brasseur pour comparer des houblons — une grammaire de vrai radar, pas une forme inventée (25.10).
type: sources
maj: 2026-10-25
sources: SPEC-BRASSEUR.md (25.10, « Regarde les vrais radar graph comments c'est.... ») ; captures fils25-comparer/captures/brasseur-ref-beermaverick-1.jpg et -2.jpg
---

https://beermaverick.com/ (page d'un houblon, bloc des arômes) : le radar que le brasseur montre comme modèle le 25.10.
Il venait de rejeter quatre passes et vingt variantes du radar de Comparer. Le catalogue de l'app vient déjà de ce site
(fiches `beermaverick-*` de `src/data/hopV4/proto-data.json`).

Sa grammaire, à reprendre telle quelle :
- **Une grille d'anneaux réguliers** et son échelle chiffrée (0 à 5), lue sur l'axe du haut.
- **Le zéro sur un petit anneau intérieur**, jamais au centre : une valeur nulle ne tire pas le contour en pointe vers le
  milieu.
- **Des segments droits et un point à chaque valeur** : ni courbe, ni lobe, ni pétale.
- **Un remplissage translucide par houblon**, tous superposés (trois houblons, rouge, vert, bleu), et une légende en carrés
  de couleur dessous.
- **Des axes nommés en clair** autour du dernier anneau.
- Une phrase sous le radar dit ce que veut dire un zéro.

Ce qu'il a refusé à côté, et pourquoi : [[le-brasseur-choisit]] ; D143 à D145 dans `DEFAUTS-RECURRENTS.md`. Les courbes
(cmb4), les lobes polaires (« n'importe quoi ») et les pétales ou pointes (lot 26) remplaçaient la lecture d'un radar
par une forme à déchiffrer.
