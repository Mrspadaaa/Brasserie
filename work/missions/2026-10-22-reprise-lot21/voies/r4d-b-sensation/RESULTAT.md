OK — planche « épicé » série B : 8 sensations, 6 genres, tailles, voisins et vraies cartes

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/generer.mjs` (page et captures)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/captures/planche-390.png`, `tailles-390.png`, `cartes-390.png`
- brouillons : `captures/travail/` (loupe.mjs, candidats.mjs, loupe.png, loupe1.png, densite1.png)

## Propositions

| Id | Nom | Genre | Ce qu'elle dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- |
| b1-langue | La langue qui picote | sensation | Ça picote en bouche : langue tirée, deux picots | À 12 px, « bouche » avant « langue » ; « goût » en général |
| b2-nez | Ça monte au nez | sensation | Nez de face, la poudre monte aux narines | À 12 px, « A » ou « cloche » ; « odeur » en général |
| b3-grimace | La grimace | visage | Yeux plissés : c'est relevé, ça surprend | « amer », « acide », « mauvais » |
| b4-eclat | La forme du piquant | abstrait | Tout en pointes, l'inverse du rond (bouba / kiki) | « choc », « nouveau », « alerte » |
| b5-gerbe | La poussière qui jaillit | mouvement | Gerbe de grains qui s'envole | « feu d'artifice », « soleil levant » |
| b6-doux-pique | Du doux au piquant | courbe | Vague ronde qui finit en pointes : l'épicé doux des nobles | Abstrait, à apprendre ; « signal », « onde » |
| b7-cactus | Le cactus | métaphore | Ce qui pique, en sec ; lisible à 12 px | Plante : vers Végétal ; « désert » |
| b8-etincelles | Les étincelles | abstrait | Crépitement fin, sans brûlure | Icône courante de l'IA et du « nouveau » |

## Sorties décisives
- G1 : `PLANCHE OK (8 variantes)` (`--ter --genres=2 --nombre=8-8 --voisins=herbal,green`, 12/16/24 px, 16 voisins chacune)
- G2 : `v0 · 200 pictos de famille · 0 faute(s)` puis `TRAIT OK`
- G3 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G4 : voir le rejeu du pilote (`EXISTENT OK` obtenu ici)
- G5, G6 : `NOTE OK` obtenus ici

## Captures ouvertes et regardées
- `captures/planche-390.png` : la planche entière ; la première version montrait le rôle « arôme ≈ » de « Hallertau Mittelfrüh » sous le +, corrigé (nom court « Mittelfrüh »).
- `captures/tailles-390.png` : chaque proposition à 12, 16 et 24 px, à côté de la feuille, des brins et du Floral.
- `captures/cartes-390.png` : Saaz, Cascade et Mittelfrüh, une liste par proposition.
- Contrôle à densité 1 (`captures/travail/densite1.png`) : le nez de profil se lisait « bec » à 12 px, il a été redessiné de face.

Prédiction : « le cactus et la grimace se comprennent tout de suite, mais aucun ne dit vraiment épicé, c'est l'idée mais pas hyper bien réalisé ».

DÉCISION À PRENDRE : aucune dans le contrat. Pour le pilote : la série B montre que la sensation se nomme sans dire « épicé ». Mieux vaut probablement la marier en passe 2 au signe ou à l'épice douce, par exemple la langue avec une forme de la série A.

CONNAISSANCE : à 12 px, au trait 2.571, seuls résistent les dessins à une silhouette fermée ou à trois traits au plus (visage, étoile pointue, cactus, vague). Un profil de nez, des doigts qui pincent, une plume ou un hérisson se lisent mal ou se confondent : la plume se lit comme la feuille d'Herbacé, le hérisson comme le monticule de Terreux, le nuage comme la météo.

LEÇON PROPOSÉE : aucune
