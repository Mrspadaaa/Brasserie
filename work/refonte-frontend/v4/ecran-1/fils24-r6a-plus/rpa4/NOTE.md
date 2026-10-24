# rpa4 · « Le carnet de roses »

Chaleur : **chaude** (forme libre). Une idée : le radar r2 (« À revoir ») devient un carnet de petites roses, une par
houblon (colonnes de r6a) et par étape (lignes : 60′, 10′, dry hop, + levure). Chaque rose porte ta 16D (zone verte),
ta stout (trait noir), ton Nugget (pointillé gris), le houblon (plein à sa couleur), et une pointe orangée au-delà du
bord. Toucher une rose pose son étape sur les rangées de r6a, dessous, et retient le houblon.

## Greffes (`data-greffe`)
- `carnet-roses` : la grille 4 × 3 de roses, le floral gagné et ★ sous chacune, ⚠ et le picto de la famille qui sort.
- `etapes` : les lignes 60′ · 10′ · dry hop, et le floral de ton Nugget sous chaque étape.
- `cuve-x3b` (la ligne « + levure ») : le dry hop pendant la fermentation, avec Pomona ; Galaxy « bio ? ».
- `hors-16d` : « lui seul » dans chaque tête. ⇄ × sous les têtes (D137, dessinés).

## Ce qui tient
- La forme se lit sans chiffre : les roses grossissent de 60′ au dry hop ; Galaxy pousse vers les tropicaux dès 10′ ;
  Idaho 7 avec Pomona est la plus grande rose florale (~1,5). Les rangées de r6a restent au premier écran (9 familles).
- Ta stout et ton Nugget dans chaque rose : la référence est partout, sans colonne de plus.

## Ce qui casse ou reste douteux
- Le résineux de ta stout, déjà hors du domaine, tire un long trait à gauche de chaque rose : il domine le dessin.
- Roses de 96 px : les axes n'ont pas de pictos (ils sont dans la légende et dans les rangées) ; à éprouver au doigt.
- Têtes réduites (sans familles ni verdict, rendus par les roses) : écart à la tête de r6a, pour la place.
- Le « Placer » passe sous le premier écran. 105 mots au premier écran (MOTS sauté en v0).

## Contrôles (24.10)
- `controle-commun --sans=mots` : COMMUN OK. `controle-comparer-etapes` : COMPARER-ETAPES OK (3 houblons + référence
  beermaverick-nugget, b10 b60 dryPost). TRAIT OK. PANEL OK (série). Mots : 105.
- `controle-choix --ecran=comparer` : CHOIX ECHEC (inventaire de la maquette construite, à porter en passe 2).

Captures : `captures/rpa4.png` (dry hop, Idaho 7), `captures/rpa4-galaxy-10.png` (10′, Galaxy touchée).
