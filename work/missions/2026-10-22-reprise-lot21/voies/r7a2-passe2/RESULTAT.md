OK — a1 passe 2 : dock-profil, pastilles, pont levure suivant le moment, 79 mots, critères verts

## Fichiers écrits
Tous dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/` :
- `a1/etat.html` ;
- `socle.mjs` : copie du socle de la série, avec les chemins à un niveau de plus, le picto épicé de la planche et
  l'écart Pomona calculé sur la grille ;
- `concepts/a1.mjs` et `generer.mjs` ;
- `captures/travail/capturer.mjs`, avec sa sortie `geste.json` ;
- `NOTE.md` ;
- les captures `a1-390.png`, `a1-premier-ecran.png` et `a1-toucher-390.png`.

La v0 (`serie-a/a1/`) n'a pas été modifiée. Rien n'a été écrit hors du périmètre possédé.

## Ce qui a changé depuis la v0
Greffes :
- dock-profil (e1) : une case par moment, hauteur de floral, trait orangé si trop amer ;
- quatre pastilles d'étape (a4) : ~+2, ~+14, ~+22, ~+23 ;
- contour de ce que la chaleur ou le CO₂ emporte (d2), en contour parce que le hachuré veut dire « inconnu » ;
- « le meilleur : actif · 2 j » quand on s'en écarte (g4) ;
- jours « sans gain » hachurés (e2) ;
- pont levure qui suit le moment (g1, g4) : « Pomona ~+13 agrumes » en actif, « rien ne change ici » ailleurs.
  L'écart est calculé sur la grille (M07) ;
- « jamais mesuré à ce moment » (c5).

Retouches :
- plus de vide : la figure s'étire jusqu'au dock (D4, D55) ;
- pastille « par floral » de y1b en lecture seule (D104) ;
- Pépins, Melon et Épicé repliés pour passer de 103 à 79 mots.

Autres changements :
- frise balisée pour les acquis Dryhopper : étapes, puis jours en fin de frise (x3b réduit) ;
- vraie valeur qui suit le moment : E03 en actif, E10 après fermentation ;
- épicé en cannelle et clou croisés ;
- départ sur actif · 2 j.

## Sorties décisives
Chaque critère est joué depuis la racine.

| critère | sortie |
|---|---|
| G1 | **COMMUN OK** (MOTS joué à part) |
| G2 | **MOTS OK**, a1 79 mots |
| G3 | **UNE-QUESTION OK (1 groupe libre : moment)**, avec `--edition` |
| G4 | **ACQUIS OK (4/4 : geste, frise, valeurs, levure)**, tous au repos |
| G5 | **PAGE OK** : 390 px, sans erreur |
| G6, G7, G8 | joués après l'écriture de ce rapport : **EXISTENT OK 5**, **NOTE OK**, **NOTE OK** |

Geste au doigt (`geste.json`) :
- avant : actif · 2 j, ~+22, 60 IBU tenue ;
- après le glissé : 20′, ≈+11, ≈119 IBU trop amer, « le meilleur : actif · 2 j » ;
- loupe à 64 px contre 11,8 px sur le rail (×5,4).

## Captures ouvertes
Dans `passe2/captures/` : a1-premier-ecran.png, a1-toucher-390.png et a1-390.png (page entière).

## Prédiction
« là c'est y1b en vraiment mieux : je vois où aller avant de glisser et le meilleur est dit. Mais les barres sont un
peu espacées, et c'est quoi le contour sur les barres ? »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE :
- Pomona contre US-05, dans la grille d'Idaho 7 à 4 g/L : agrumes +12,9 à +13,1 et floral +4,5 en dry hop actif ;
  exactement 0 à chaud (60′, 10′, whirlpool) et après fermentation.
- Le meilleur moment pour « plus floral, moins résineux, amertume dans le style » est actif · 2 j (score 8,37,
  égal à 3 j à 0,01 près).

LEÇON PROPOSÉE : une classe reprise d'un composant à l'autre dans la même page (`a1-z`, pour les segments du rail
puis pour la zone des barres) casse un rendu sans qu'aucun contrôle ne le voie. Au-delà du préfixe de variante
(L26), préfixer aussi par composant (`a1-rail-…`, `a1-barre-…`), et ouvrir la capture après chaque ajout de bloc.
