r6g · Trois verres à même amertume (« Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »).

## Choix portés
- Radar : r3
- Base : IBU égal
- Porte : non
- Descripteurs : A

## L'angle, et ce que j'en ai fait
- **Point de départ** : à IBU égal (10 IBU à 10′), trois verres de la même stout, un radar r3 sous chaque verre.
- **Enrichi** :
  - le verre est le même trois fois (même amertume) ; à côté, une barre à la couleur du houblon donne la poignée pour 20 L. Cascade 41,6 g, Idaho 7 21,8 g, Galaxy 16,2 g. On voit que moins d'α veut dire plus de houblon ;
  - au-dessus de la mousse, les trois familles que le houblon ajoute le plus (au style), en pictos de couleur ;
  - sous le radar, les deux familles qui comptent pour cette stout : floral (« je la veux plus floral ») et résineux (« trop résineuses »). Le résineux est en orangé, car il est déjà hors du style ;
  - une réponse calculée, pas écrite à la main : « Idaho 7 ≈ Galaxy, puis Cascade ». Dessous : « tous sous 1 cran ; même floral ; Cascade, le plus de résineux ». La règle est derrière « ? » : familles attendues par la 16D gagnées, moins le résineux gagné, en crans ; sous 0,1 cran d'écart, « ≈ » ;
  - le pont, dans un `nav` : « Plus de floral : <houblon en avant> à cru, dans Dryhopper ». À 10′, aucun houblon ne déplace la stout d'un cran. La suite honnête est donc le dry hop.

## Ce qui tient
- **Un seul facteur libre**, la variété : toucher l'en-tête d'un verre le met en avant (`aria-pressed`). Le cadre passe sur ce verre, les autres radars pâlissent, et le nom passe dans le pont Dryhopper. La ligne de contexte n'a aucun bouton : même amertume (10 IBU), à 10′, stout 16D (20 L), US-05.
- **Le radar r3**, un par verre, 122 px, mêmes axes :
  - le bord est le gain simulé (~) ;
  - le noyau est le bas du moteur. Il est presque invisible : au bas du moteur, un 10′ ne met presque rien, et c'est vrai ;
  - en pâle, la place que la 16D laisse dans la stout ;
  - en orangé hachuré, le résineux, déjà hors du style (dégustation, « marqué ») ;
  - en hachuré gris, pépins et melon : aucun des trois ne les touche et la stout ne les situe pas. Ils sont inconnus, pas à zéro, et hors du polygone ;
  - le cercle vaut 1 cran du style, ou 10 points en absolu (dit dans la légende). Les silhouettes se distinguent : Cascade agrumes, baies et résineux ; Idaho 7 petit et rond ; Galaxy tropical, agrumes et noyau.
- **Au style par défaut**. En absolu, les radars et les valeurs passent en points. En points, Cascade a le plus de floral (+5,2 contre 4,3 et 4,4), mais la bande florale est large : en crans, c'est pareil.
- **Les vraies valeurs, à un toucher**, alignées sous chaque verre :
  - mesurées : α du lot, α des fiches, huile totale (Beer Maverick 2023, Hopsteiner 2025) ;
  - calculées (« ≈ ») : IBU par gramme à 10′ (moteur v4), dose pour 10 IBU, huile dans le verre (dose × huile). À même amertume, Cascade met 2,6 fois plus de houblon, mais une huile du même ordre : 1,5–5,2 mL/hL contre 1,5–4,1 pour Galaxy et 1,1–2,2 pour Idaho 7.
- **La chimie, à un toucher** : 7 composés en % de l'huile (4MMP en µg/kg), chacun avec le picto de ses familles (liens de composes-houblon.json). Les sources sont en nom court : YCH, Haas, HPA, Beer Maverick, Schmidt 2024. Le géraniol de Galaxy est « inconnu », hachuré.
- **Le panel OSU, à un toucher**, sans molette : Cascade à cru 24 h (Lafontaine et Shellhammer 2018, H22), trois courbes et la zone 4–8 g/L. Un trait marque 2,08 g/L : « tes 41,6 g de 10 IBU, s'ils allaient à cru ». Il est écrit qu'Idaho 7 et Galaxy n'ont pas de panel OSU.
- **Appui long** : la fiche g1 (socle de v1), testée sur Galaxy (α 17,2 % ≠ 11–16 %, « sans famille : cannabis, dank »).
- **Baseline gardée** : pictos au trait, α du lot puis ≠, usage en mot (« aromatique », « mixte »), stock en icône de 14 px, légende derrière « ? », lentille au style / absolu.

## Ce qui casse
- **Le message est « presque rien »**. À 10′, les gains simulés restent sous 1 cran : au plus 0,9 cran, le tropical de Galaxy. L'écart entre Idaho 7 et Galaxy (0,12 contre 0,10 cran) est du bruit : la page dit « ≈ ». C'est honnête, mais cette base répond moins fort que « dose égale » ou « effet égal ».
- **Interpolation** : les doses de 10 IBU (0,81 à 2,08 g/L) tombent entre 0, 1 et 2 g/L de la grille. Le gain est une droite entre ces points, et la courbe réelle du moteur est concave. Le gain de Galaxy (0,81 g/L, entre 0 et 1) est donc un peu sous-estimé.
- **Le haut du moteur** n'est pas un gain : il vient de la plage de la stout avant, dont les composés de Nugget sont en « haut partiel ». Le radar montre le bas (noyau) et le centre (bord), pas le haut. La légende le dit.
- **Radars de 122 px** : la place de trois verres côte à côte. Les pictos d'axe font 12 px, le minimum.
- **Descripteurs A** : la règle (« groseille à maquereau » rangée dans Petits fruits) ne change que Nelson Sauvin. Nelson Sauvin n'est pas sur cette page (Porte : non). **A ne se voit donc nulle part ici** : les fiches de Cascade, Idaho 7 et Galaxy sont identiques sous A et sous B.
- Le rôle « mixte » d'Idaho 7 et de Galaxy vient de la règle rôle-α v1 (prototype, à valider). L'α d'Idaho 7 est « lu sur l'article », pas sur la fiche de stock.
- Le classement est une règle du concepteur, proposée et non validée par le brasseur. Il ne garde que le floral, l'herbacé et le terreux (la 16D) contre le résineux (la plainte), et ignore que Galaxy met du tropical.

## Contrôles (joués le 22.10 sur `etat.html`, depuis la racine)
- COMMUN OK, sans MOTS : COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE, PARLANT et BRUTES OK.
- MOTS OK : 76 mots au premier écran, pour 80 au plus.
- UNE-QUESTION OK : 1 groupe libre, houblon ; contexte base, moment, bière, levure.
- ACQUIS OK : 4/4. Le radar r3 au repos ; chimie, OSU et valeurs à un toucher.
- ALPHA OK : 3 houblons, 3 avec leur α.
- SANS-FAMILLE OK : aucun houblon au-dessus de 50 %.

## Pire contraste
5,18:1, « ~+0,4 » (orangé #c2410c sur blanc), sur 33 textes mesurés.

## Fichiers
- `generer.mjs` écrit `etat.html` ; il lit seulement `donnees/comparer-stout.json` et le socle de v1 (pictos, fiche, légende).
- `captures.mjs` prend les captures : `captures/r6g-390.png`, `-premier-ecran`, `-fiche-390`, `-toucher-390` (chimie ouverte), `-valeurs-390`, `-osu-390`, `-absolu-390`, `-legende-390`.
