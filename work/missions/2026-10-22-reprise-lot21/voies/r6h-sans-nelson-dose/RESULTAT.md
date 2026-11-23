OK — Comparer r6h : Nelson Sauvin épinglé en cible, trois candidats à 4 g/L, part « autres »

## Fichiers écrits
Tous les chemins partent de `work/refonte-frontend/v4/ecran-1/fils22-comparer/`.
- `r6h/generer.mjs` : il écrit `r6h/etat.html` depuis `donnees/comparer-stout.json` seul. Il importe le socle de v1 sans le modifier.
- `r6h/etat.html`, `r6h/NOTE.md`.
- `r6h/captures.mjs` : il joue l'appui long et les touchers.
- `r6h/sonde-mots.mjs` : il liste les mots du premier écran.
- `captures/r6h-390.png`, `r6h-premier-ecran.png`, `r6h-fiche-390.png`, `r6h-toucher-390.png`, `r6h-absolu-390.png`, `r6h-legende-390.png`.

## Critères (rejoués depuis la racine, 22.10)
- G1 : `COMMUN OK`. Couleurs, au style, survol, blocs, contraste, fiche, standard, trait, légende, parlant et brutes sont OK. Le pire contraste est 4,69:1, sur « Idaho 7 ».
- G2 : `r6h 79 mots` puis `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`. Le contexte déclare base, dose, moment et levure.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Radar, chimie et OSU sont au repos ; les valeurs s'ouvrent d'un toucher.
- G5 : `ALPHA OK`, 4 houblons avec leur α.
- G6 : `SANS-FAMILLE OK (2 houblon(s) au-dessus de 25 %, part « autres » visible)`, pour Galaxy (29 %) et Nelson Sauvin (83 %).
- G7 : `EXISTENT OK 7`.
- G8 : `NOTE OK`.
- G9 : `NOTE OK`.

Essais : G2 en a pris cinq passes de mise en page. Le compte est passé de 135 à 120, puis 96, 87, 83 et enfin 79. Ces passes n'étaient pas des échecs du critère, mais des réécritures de la page. Les autres critères sont passés au premier lancement.

## Captures ouvertes et jugées
- `r6h-premier-ecran.png`. En trois secondes, on lit :
  - Nelson « pas en stock », en colonne 1 ;
  - les trois candidats, Cascade en avant ;
  - les points d'écart : Cascade et Idaho 7 voisins, Galaxy loin ;
  - « Aucun ne remplace : vin blanc, groseille à maquereau » ;
  - le radar avec Nelson en contour graphite ;
  - les barres l5b.

  Un défaut est corrigé : les rangées de la colonne Nelson étaient décalées par rapport aux autres colonnes.
- `r6h-390.png` (page entière) :
  - la chimie s'aligne sur les colonnes, avec la plage de Nelson en fond gris ;
  - le panel OSU a un trait à 4 g/L ;
  - le pont vers Dryhopper est en bas.

  Deux défauts sont corrigés : la section des vraies valeurs s'affichait ouverte au repos (un `hidden` était écrasé par le CSS), et le linalol d'Idaho 7 lu était faux (12 au lieu de 38 µg/L, mauvaise variété).
- `r6h-fiche-390.png` : appui long réel sur Nelson Sauvin. La fiche g1 s'ouvre, et sa part « autres » est dessinée en gris avec ses quatre concepts.
- `r6h-toucher-390.png` : Galaxy touché. Le radar, les barres et le pont suivent ; Tropicaux passe en orangé. Les vraies valeurs sont ouvertes.
- `r6h-absolu-390.png` : la lentille est sur absolu, et la zone de la 16D devient irrégulière (55 pour floral, herbacé et terreux).
- `r6h-legende-390.png` : un défaut est corrigé. Deux pastilles prenaient des classes du socle et se positionnaient hors de leur place.

Prédiction : « pas mal l'idée de Nelson comme cible et le "aucun ne remplace", mais le radar de Nelson est tout petit et les flèches partout chargent ». Il retiendra sans doute la colonne cible et la chimie sur fond gris.

## Doutes et limites
- La proximité est calculée sur ce que le moteur voit de Nelson, soit 17 % de ses mots. Cascade (~0,66 cran) devance Idaho 7 (~0,81) de peu, sous de grandes incertitudes. La page montre deux points voisins et ne parle pas de « meilleur ».
- L'α de Nelson affiché est celui des fiches, 10–14 %, car il n'est pas en stock. Le « 9,6 % lu sur l'article » (douteux 2 d'ENTREES) n'est pas montré.
- La marge de mots est d'un seul mot (79 sur 80). La chimie commence au bord de l'écran.
- Les noms des sources viennent du dictionnaire de `composes-houblon.json` : ce sont des références, pas des valeurs.
- `loupe.html` et `loupe.png` à la racine ne viennent pas de cette voie.

DÉCISION À PRENDRE : quelle couleur pour Nelson Sauvin quand il est la cible d'une porte « Je n'ai pas X » ?
- Option 1 : le graphite #3f3f4a, retenu ici. Il distingue la cible des candidats, et il évite trois rouges voisins sur le radar (Cascade #781838, Idaho 7 #e80030, Nelson #a0081f).
- Option 2 : le rouge #a0081f des lots précédents, au nom de la règle « un houblon, une couleur » (D51, D83).

Ma recommandation : l'option 1, le graphite pour la cible quel que soit le houblon, à écrire comme une convention de la porte. C'est au pilote de trancher, ou au brasseur s'il compare les variantes.

CONNAISSANCE : à dose égale (dryPost, 4 g/L, 3 j, US-05), l'écart simulé au Nelson Sauvin, sur les 8 familles connues des deux, vaut ~0,66 cran pour Cascade, ~0,81 pour Idaho 7 et ~1,19 pour Galaxy. Le tropical les éloigne tous. Ce que Nelson a de propre (vin blanc, groseille à maquereau, raisin, sauvignon blanc : 78 % de ses mots) n'a d'équivalent chez aucun des trois. Dans les fiches, le meilleur pont chimique est l'humulène : Nelson 25–37 %, Cascade 8–20, Idaho 7 10–20, Galaxy 0,8–2,2. La seule étude qui compare ces houblons à 4 g/L et 3 j (E09, Sharp 2018) n'est pas chiffrée. Une note pour `cerveau/metier/` (« remplacer Nelson Sauvin ») serait utile.

LEÇON PROPOSÉE : une classe CSS d'une variante ne doit pas reprendre un nom du socle importé. Ici, `.lg-z` et `.lg-h` héritaient d'un `position: absolute` venu du socle, et les pastilles de la légende sortaient de leur place. Aucun contrôle ne l'a vu ; seule la capture ouverte l'a montré. À faire : préfixer les classes propres à la variante (par exemple `r6h-…`), ou lister les classes du socle dans le brief.
