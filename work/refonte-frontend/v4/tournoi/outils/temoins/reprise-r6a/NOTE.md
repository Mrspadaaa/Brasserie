# r6a · Trois colonnes côte à côte

Comparer, lot 22 : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Page `etat.html`, générée par
`generer.mjs` depuis `../donnees/comparer-stout.json` ; captures par `captures.mjs`.

## Choix portés

- Radar : r2
- Base : dose égale
- Porte : non
- Descripteurs : A

Descripteurs A : « groseille à maquereau » et « gooseberry » sont rangés dans Petits fruits dans la fiche (appui
long). Seul Nelson Sauvin change. Sans porte, Nelson Sauvin n'est pas sur la page : **A ne se voit pas ici**.
Cascade, Idaho 7 et Galaxy n'ont pas ce mot. La légende le dit.

## Ce que j'ai fait de l'angle

Point de départ : la manière de w2, les barres de l5b, le radar r2 au-dessus, les vraies valeurs de v1 sous un
toucher. Je l'ai poussé vers un vrai tableau à trois colonnes. Chaque houblon tient une colonne, de la tête au pied.
Chaque famille tient une rangée de trois barres de l5b côte à côte, et l'œil compare en travers. w2 mettait trois
repères sur une seule piste. Ici, chaque houblon garde sa barre entière : la zone de ta 16D, la barre simulée,
l'orangé au-dessus du style, sa bande d'incertitude et le trait de ta stout.

Ce qui a été ajouté au plancher :
- une colonne « Ta stout » à gauche, avec sa dégustation du 18.10 : résineux « trop », floral « plus ». Les deux
  rangées de sa demande portent une flèche et l'écart chiffré (~+0,9 / ~+1,3 / ~+0,9 cran de floral ; ~+1,9 /
  ~+2 / ~+2 de résineux). Ce qu'on apprend : **les trois houblons ajoutent ~+2 crans de résineux** à une stout
  déjà trop résineuse ;
- la tête de colonne dans l'ordre du brasseur : nom, α (lot, sinon fiches ; ≠ pour Galaxy 17,2 % hors de 11–16),
  rôle en mot, ses familles en couleur (marquées grandes, citées petites), « ~ dans / ~ hors » de la 16D, stock
  en icône ;
- les vraies valeurs de v1 dans les mêmes trois colonnes, sous un seul toucher : α, β, huile, puis la chimie,
  rangée par famille (myrcène → résineux, linalol et géraniol → floral, humulène → herbacé, caryophyllène → épicé,
  4MMP → tropical). Chaque plage a une mini-barre sur l'échelle de sa rangée, ses références (H2, BM…) et la
  liste des sources. La plus haute de chaque rangée est à la couleur de son houblon. Le linalol mesuré en bière
  est montré avec « pas comparables entre eux ». L'IBU à cru est écrit « non modélisé », jamais 0 ;
- le panel OSU sans molette : trois courbes mesurées (Cascade), la zone 4–8 g/L, un trait à 3,86 g/L
  (≈ la dose égale), et « Idaho 7, Galaxy : pas de panel publié » ;
- le pont vers Dryhopper (`nav`), qui suit le houblon mis en avant.

Seul facteur libre : la variété. Toucher une tête de colonne met ce houblon en avant : le radar le remplit,
avec sa bande, et sa colonne s'encadre. Au départ, le houblon mis en avant suit une règle écrite dans la
légende : le plus floral qui reste dans ta 16D, ici Idaho 7.

## Ce qui tient

- Les quatre acquis : le radar r2 au repos ; la chimie et les vraies valeurs à un toucher (« Chimie et vraies
  valeurs ») ; le panel OSU au repos.
- Honnêteté : profil marqué « ~ simulé » ; inconnu hachuré, jamais 0 ; pépins et melon inconnus pour les trois,
  dits en une ligne ; Idaho 7, avec une seule étude, montre des bandes très larges (floral 0,6–63 sur 100),
  qu'on voit ; « à confirmer » en orangé (Idaho 7 4MMP, E03).
- Au style par défaut ; en absolu, le trait de ta stout à 83 et le +19 de résineux se lisent.
- Appui long sur un nom de houblon : la fiche g1 de la baseline, avec la demande « + Floral − Résineux ».

## Ce qui casse ou reste douteux

- Le radar au style est petit : les houblons restent sous la zone de la 16D, sauf le résineux, qui touche le
  bord. La bande d'Idaho 7, très large, fait une grande étoile pâle. C'est honnête, mais chargé.
- 79 mots au premier écran, pour une limite de 80 : il n'y a plus de marge. L'IBU a quitté la tête de colonne
  pour aller sous le toucher.
- Rôle « mixte » d'Idaho 7 et de Galaxy : il est déduit de la règle rôle-α v1 (prototype), marqué pâle.
- α de Galaxy (17,2 %) au-dessus de ses fiches : marqué ≠ ; douteux selon ENTREES.md.
- Les titres des références (H2…) sont lus dans `composes-houblon.json`, la source que le JSON du lot cite.

## Contrôles (depuis la racine)

COMMUN OK (sans MOTS), MOTS OK (79), UNE-QUESTION OK (1 groupe libre : houblon), ACQUIS OK (4/4), ALPHA OK.
Pire contraste : l'Idaho 7 #e80030 sur blanc, environ 4,7:1 (calcul de luminance), dans le contrôle CONTRASTE
vert.
