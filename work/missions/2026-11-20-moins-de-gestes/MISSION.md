# Mission « moins de gestes » (20.11)

Demande, mot pour mot (SPEC-BRASSEUR, 20.11) : « Tout ce qui m'economise des gestes ou autre est bon à prendre au c'est pas au détriment de la qualité. » ; « Par exemple des propositions où en un click tout de met ( exemple je choisis une ipa) suggestions des ingrédients correspond, et quand je clique dessus il y a déjà la bonne quantité bon endroit et tout.... » ; « Mais pareil pour plein d'autres trucs, tout ce qui aide le workflow, réduit les actions ».

Portée (L01) : son exemple illustre une règle. Un geste pose tout ce qu'on peut déduire, juste et défaisable, jamais inventé. Toute l'app ; ici seulement des mini maquettes, rien codé ni déployé. Exclus (déjà choisis le 16.11, en cours de port) : pa1 · pa2 · pe1 · pe3 · pe4 · pb1 · pb2 · pb3 · pm1 · pl1 · pl2. Refusés pour l'instant : pa3, pe2, pe5, pb4 (« depuis ta dernière du style »), pm2.

## État de l'art

Détail : `ETAT-DE-L-ART.md`.
- Problème type : formulation de recette par style (style → cibles OG/FG/IBU/EBC → masse de grain au rendement → répartition → IBU par moment, BU:GU → levure et cellules → eau SO4:Cl). Méthode de Palmer (How to Brew, Water), Brewing Classic Styles, BJCP 2021.
- Examiné : BJCP 2021 (dans le dépôt, 123 styles), Brewing Classic Styles (méthode seule, droits réservés), BeerSmith/Brewfather (gabarits sans moteur), Beer Analytics CC BY-SA (fréquences d'ingrédients, déjà dans `typicite-styles.json`), BeerXML (format). Aucune bibliothèque maintenue ne fait style → recette complète.
- Décision : un seul moteur, celui du dépôt (BrewingMath, `buildFromEmpty` v4, solveur de sels, `pitchRate`). Chaque quantité dit sa source à l'écran (moteur, stock, style). Trou de donnée : la répartition du grain en % par style ; options (a) table écrite depuis la méthode et relue par lui, (c) malt de base seul puis ajout qui rééquilibre ; (b) depuis ses recettes = pb4, refusé. Dry hop : dose du solveur non posée par l'orchestrateur, brique à brancher.

## Mesures
`MESURES.md` (app locale port-carnet, seed du dépôt principal, 390 tactile) ; captures `app/`.

## Versions
`VERSIONS.md` ; workflow maquettes adapté (une base par version) ; page de choix `page/index.html`.
