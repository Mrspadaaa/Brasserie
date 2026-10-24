# Lot « Dryhopper, avec ses retours » (24.10, soir)

## Sa demande, mot pour mot
« Faire des mini maquettes du dryhopping avec mes feedback ».

## La base, d'après lui (24.10, soir), mot pour mot
« Pour le dryhopping, la meilleure version est celle de l'app jouable mais il lui faut quelques améliorations ». La base est
l'écran Dryhopper de la maquette jouable, tel qu'il se joue : `prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`
(sa p4b2f rendue sur le moteur). Quelques améliorations : on la garde, on la retouche, on y greffe.

## Ses retours sur Dryhopper, mot pour mot
- Sur p4b2f (« L'aire du floral », retouche de p4b2) : « Partir sur cette version » (D43). **C'est la base** : reprise telle
  quelle (règle n° 1), on y greffe.
- Sur p4b2 : « Ça j'aime beaucoup mais c'est encore assez peu lisible ».
- Sur la frise de **y1b** (lot 21, « Le brassin au doigt » : en bas, le rail 60′ · 10′ · whirlpool · actif · après, le houblon
  posé au doigt) : « Une frise de ce type est vraiment intéressant aussi, un peu à retravailler ».
- Sur **w2** (lot 21, « Trois plans » : Sage, Franc, Osé côte à côte, chacun sa dose, ses jours, son moment, sa levure ; puis le
  plan tenu réglé en dessous) : « Ça c'est vraiment très intéressant ».
- Sur x3b (lot 21, « Ma cuve, jour après jour ») : « ça peut être interessant de l'utiliser jsute pour de la comparaison entre
  ma bière de base -> 1 dry hop, 2 dry hop: levure ».
- Sur la maquette : « c'est pas ultra réactif » (D138) ; « Il faut pas que ça gêne ! » (D131 quater).

## Les sources
- p4b2f : `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4b2f/etat.html` (sa page) et sa reprise dans la maquette,
  `prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html` (construction du soir).
- y1b : `work/refonte-frontend/v4/ecran-1/fils21-choisir/y1b/etat.html` (capture `…/fils21-choisir/captures/y1b-premier-ecran.png`).
- w2 : `work/refonte-frontend/v4/ecran-1/fils21-choisir/w2/etat.html` (capture `…/captures/w2-390.png`).
- x3b : `work/refonte-frontend/v4/ecran-1/fils21-choisir/x3b/etat.html`.
- La baseline : `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html` ; le moteur et ses données : ceux de la
  maquette (`prototypes/houblons-v4/parcours/src/moteur`, `prototypes/houblons-v4/data/`). Idaho 7 dans la stout, comme p4b2f.

## Obligatoire, et rien d'autre
- p4b2f au premier plan, telle quelle (ses courbes, l'aire du floral, ses quatre chiffres) ; la greffe s'ajoute sans gêner.
- Plus lisible que p4b2 (« assez peu lisible ») : chaque chiffre et chaque courbe se lisent à 390 px sans zoom.
- La baseline (pictos au trait des 12 familles, couleurs, thème clair D106) ; mots modérés (D41) ; vraies valeurs du moteur
  (rien d'inventé ; l'inconnu en « ? », jamais 0) ; téléphone 390 × 844.
- Chaque variante dit sa greffe : `data-greffe="frise-y1b"`, `data-greffe="trois-plans-w2"`, `data-greffe="cuve-x3b"` ou une
  greffe libre nommée, sur l'élément greffé.

## Chaque variante rend
`<id>/etat.html` ; `<id>/NOTE.md` (chaleur, greffe, ce qui tient, ce qui casse) ; `captures/<id>.png` (390 × 844) et, si un
geste compte, `captures/<id>-geste.png`. Ouvre tes captures (L12). Une idée par variante (M14).
