# Pièces piégées fictives (voie t-pieges, D381)

Fabrique des tickets de caisse et une facture A4 **100 % fictifs** (fournisseur « Brasserie Fictive SA »), avec leur vérité et un masque de lignes,
pour éprouver la lecture longue sur des photos abîmées. Aucun appel IA, aucun réseau (Chrome local, canvas 2D), aucune donnée réelle.
Le dossier de sortie est toujours **hors du dépôt**.

```
node work/missions/2026-11-03-lecture-longue/pieges/generer.mjs <dossier>                        # 11 pièces fixes
node work/missions/2026-11-03-lecture-longue/pieges/verifier.mjs <dossier>                       # PIÈGES OK 11/11
node .../generer.mjs <dossier> --hasard 200 --graine 1                                           # 200 pièces au hasard (h0001 à h0200)
node .../verifier.mjs <dossier>                                                                  # PIÈGES OK 200/200
```

Chaque pièce : `<nom>.jpg`, `<nom>.masque.png`, `<nom>.verite.json`. Le mode hasard écrit aussi `hasard.json` (paramètres tirés par pièce) ;
le vérificateur écrit `pieges.json`. Reproductible : même graine, mêmes fichiers (PRNG mulberry32 ; jamais Math.random).

## Vérité (`*.verite.json`)
- `articles` : dans l'ordre, `{ name, quantity, unit, price, amountTTC }`. `totalTTC` = somme exacte (en centimes) de tous les montants,
  remises négatives et ligne d'arrondi comprises. `articlesLignes` : nombre de lignes visuelles de chaque article (1, 2 ou 3).
- `lignes[i]` : rang (base 0) de l'article de la ligne visuelle `i`, ou `null` (en-tête, séparateurs, totaux). `lignesTexte[i]` : le texte.
- `params` : tout ce qui a été tiré ; `image` : taille finale.

## Masque (`*.masque.png`)
Mêmes transformations que la photo (rotation, perspective, recadrage, fond), calculées par la même fonction de correspondance, en plus proche
voisin : couleurs exactes, fond noir, sans flou, bruit ni tache. Ligne visuelle `i` = couleur `n = i + 1` : `r = n & 255`, `g = (n >> 8) & 255`, `b = 0`.
Une ligne dont le texte est caché par une tache ou un pli garde sa couleur : le masque dit où elle est, pas ce qu'on en voit.

## Pièges communs
6 (ou 3 à 8 au hasard) lignes identiques à la suite (« BIERE BLONDE 33CL » 2.50) ; articles sur 2 lignes (désignation, puis
« 2 x 31.50   63.00 ») au moins tous les 10 articles (fixes) ; articles sur 3 lignes (au hasard, ligne « REF … LOT … » au milieu) ;
remises négatives ; frais de port ; ligne d'arrondi non nulle ; poids avec 3 décimales ; unités pce, kg, l.

## Les 11 pièces fixes
1 `papier-gris` · 2 `tache-jonctions` (taches de café vers les lignes 25, 50, 75, 100) · 3 `tache-totale` (lavis, plaques effacées, taches
toutes les 12 lignes) · 4 `flou-leger` (1,2 px) · 5 `flou-fort` (2,5 px) · 6 `ombre` (dégradé fort + ombre de téléphone) · 7 `penche` (2,5° + perspective)
· 8 `pli` (pli en travers de deux lignes, coin replié) · 9 `fond-table` · 10 `tout` (flou, 1,5°, ombre, tache sur une jonction) · 11 `facture-zebre`
(1 240 px, 300 lignes de tableau, rangées grisées, page haute 9 984 px, sans bruit).
Les pièces 1 à 10 portent **le même ticket** (135 articles) : on isole l'effet d'un défaut en comparant à `papier-gris`.

## Mode hasard
Tire par pièce : papier (blanc, beige, gris, gris foncé), 0 à 6 taches (opacité, taille, position ; 1/3 sur une jonction probable = article n°
multiple de 20 à 30, 1/3 pile sur une ligne, 1/3 libres), lavis ou plaques effacées, flou 0 à 3 px, angle −4° à 4°, perspective, dégradé ou ombre,
pli, coin replié, fond de table clair ou sombre, rangées grisées, hauteur de ligne fixe 18 à 34 px (densité), largeur 500 à 1 300 px,
40 à 300 articles (borné à ≈ 5 M px pour garder des fichiers raisonnables ; 200 pièces ≈ 110 Mo), 1 à 3 lignes par article, suite identique
(70 % des pièces), 1 à 5 remises. Les factures (largeur ≥ 900 px) ont un tableau à colonnes ; une sur deux est un scan propre sans bruit.

## Contrôles du vérificateur
Taille du JPEG = taille du masque = taille déclarée ; chaque ligne de la vérité a sa couleur, sans couleur étrangère (≥ 20 px), dans l'ordre vertical ;
chaque article a au moins une ligne et le bon nombre ; quantité × prix = montant ; total = somme ; arrondi non nul ; au moins une remise ;
suite identique rompue ou absente (fixes) ; au moins un article multi-lignes ; fixes : tickets 120 à 150 articles et hauteur > 3 × largeur,
facture 300 lignes, multi-lignes au plus tous les 10 articles.
