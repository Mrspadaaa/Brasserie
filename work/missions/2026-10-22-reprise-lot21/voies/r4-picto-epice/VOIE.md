# Voie r4-picto-epice — planche de pictos « épicé »

- Mission : 2026-10-22-reprise-lot21
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : brasseur (il choisit le picto) ; pilote pour la forme de la planche

## Objectif
Une planche de **6 à 8 pictos « épicé »** au trait, au ton de la famille Épicé, rendue et capturée
à 390 px. Chaque picto est montré à sa taille d'usage et en contexte, pour que le brasseur en choisisse
un.

## Entrées
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` — « épicé l'icone est toujours pas bon.. » (lot 21, 20.10).
- `work/refonte-frontend/registre.md` — lot 15 : « pico épice très étrange, plutôt vanille, canelle ? », alors traduit en grains de poivre ; lot 21 : « Les grains de poivre ne passent pas non plus ».
- `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html` — les pictos duo actuels des 12 familles (`<symbol id="p-…">`, viewBox 24, trait 2.571). `p-spice` = 5 cercles : c'est le picto rejeté.
- `work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json` — tons des familles ; Épicé : base `#7a4e3a`, fond `#f5eeea`.
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/noyau.mjs` — `symboles()`, `picto(f, w)` (lignes 90-112) : comment un picto de famille est posé dans les pages.
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/captures/l8g-fiche-390.png` — une fiche réelle où le picto apparaît (à ouvrir en image).
- `work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs` — le critère de la planche (lis l'en-tête : il dit tout ce qui est mesuré).
- `work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs` — D88 : au trait, sans halo, sans forme pleine de plus de 25 %.
- `.claude/rules/affinee-frontend.md` et `DESIGN.md` — règles d'interface.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice/**` (générateur `generer-planche.mjs`, page `planche/etat.html`, `NOTE.md`, captures dans `captures/`)
- `work/missions/2026-10-22-reprise-lot21/voies/r4-picto-epice/RESULTAT.md`

## Consignes
- **Ce que veut dire « épicé » pour un houblon** : poivre, clou de girofle, herbes sèches, anis…
  (Saaz, les nobles, Nelson Sauvin selon Hopsteiner). Le poivre est exclu : il a été rejeté deux fois.
- **Les deux lectures de sa plainte du lot 15** : « plutôt vanille, canelle ? » peut vouloir dire
  « ce picto ressemble à de la vanille ou de la cannelle », ou « dessine plutôt une vanille ou une
  cannelle ». Le passage au poivre n'a retenu que la première lecture, et il a échoué. La planche doit
  donc couvrir les deux : au moins un picto « bâton de cannelle » ou « gousse de vanille », et au moins
  un picto d'une autre idée (badiane, clou de girofle, mortier et pilon, flamme, feuille et étincelle…).
  Le choix des idées reste le tien.
- **Planche** : une page `planche/etat.html`, produite par `generer-planche.mjs` (le HTML n'est pas
  versionné, le générateur l'est). Pas de défilement horizontal à 390 px.
  - Chaque variante est un bloc `[data-variante="<id>"]`, avec un nom visible court (son idée, en
    français). Elle montre son `svg[data-famille="spice"]` à 12, 16 et 24 px.
  - Chaque variante est aussi montrée en contexte, sur une ligne de houblon : le picto à 16 px parmi
    au moins 3 pictos d'autres familles réels, tirés de la planche v3, comme sur une carte.
  - Le picto actuel peut figurer une fois, hors des blocs `data-variante`, marqué « actuel, rejeté ».
- **Dessin** : viewBox 24, au trait, `stroke` au ton `#7a4e3a`, `stroke-width` 2.571, extrémités
  rondes, sans remplissage de plus de 25 % du cadre, sans flou ni halo. Il doit rester lisible à
  12 px, et ne pas ressembler aux autres familles : Herbacé, Végétal et Boisé ont déjà des feuilles et
  des branches. Compare-les à côté.
- **Captures** à 390 px, avec `work/refonte-frontend/v4/tournoi/outils/capture-page.mjs` ou puppeteer :
  la planche entière, plus un gros plan des lignes de contexte. **Ouvre chaque capture en image (Read)
  et juge-la** avant de dire OK (L12). Cite dans RESULTAT.md les captures regardées.
- `NOTE.md` : pour chaque variante, son idée, pourquoi elle dit « épicé » à un brasseur, et son risque
  de confusion.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Code couleur des arômes (acquis) : le picto prend le ton de sa famille.
- Pictos au trait, sans halo ni « glowing » (D88).
- Peu de texte au premier plan. Le nom d'une variante suffit.
- Le brasseur choisit : la planche montre toutes les variantes, sans classement imposé. Une
  recommandation peut figurer dans NOTE.md.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec la liste des captures ouvertes et `DÉCISION À PRENDRE`
(la question au brasseur). Réponse finale au pilote : une ligne.
