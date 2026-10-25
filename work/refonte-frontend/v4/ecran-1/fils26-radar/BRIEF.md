# Lot 26 — le radar seul, 20 mini maquettes (25.10)

## Ses mots, mot pour mot
- Sur `cmb4b-nelson` (sa capture `fils25-comparer/captures/brasseur-cmb4b-nimporte-quoi.jpg`, un Λ rouge dessiné à droite) :
  « Non mais c'est n'importe quoi ça.... Fait moi juste plein de mini maquettes, genre 20 sur le radargraph uniquement focus
  dessus. Prends l'exemple de base. »
- « Pas besoin d'une grosse revue, gros contrôle » ; « Allégé les contrôle, Review, feedback ».
- « En partant de ce type de base », avec sa capture de **cmb3b** (`fils25-comparer/captures/brasseur-base-type-cmb3b.jpg`).
- Avant :
  - « Les Spider graph radargraph doivent être plus comme ça » (courbes orange dessinées sur cmb3b : `brasseur-radar-courbes.jpg`) ;
  - « Ça c'est vraiment bien aussi avec la vue facile pour les huiles, le radar » (rpz2 : `brasseur-rpz2-huiles-radar.jpg`) ;
  - « Mais l'affichage des pic du radar sont toujours pas bon ».

## Le type de base : le radar de cmb3b
`work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb3b/` (etat.html, source/Radar.tsx, RadarOutils.ts). Il comprend :
- 12 axes, chacun avec le picto de sa famille ;
- la bande du style 16D en vert pâle ;
- les secteurs inconnus hachurés ;
- le houblon retenu plein (Idaho 7, rouge), l'autre au trait (Cascade, bordeaux), un point à chaque valeur ;
- le point orangé du hors style (résineux).

Refusé :
- les patates de cmb4b, qui couvrent l'inconnu et gonflent entre les axes (« n'importe quoi ») ;
- les pics mal affichés de cmb3 : les étoiles qui plongent au centre.

Le Λ de sa capture peut vouloir dire « un pic, comme ça ». Les deux lectures, des courbes ou des pics bien dessinés, sont des
axes du lot, pas une règle.

## Ce qu'on fait
20 mini maquettes du **radar seul**, sans écran autour : le radar, ses pictos, la légende des deux houblons. Chacune part du
type de base et change une seule idée. Chaque concepteur part de `socle/rd00/etat.html`, qui est cmb3b redessiné sur les
données communes (`donnees.js`).

Séries (4 chacune), en trois chaleurs :
- **rda, froide** : cmb3b presque tel quel, seuls les pics changent (zéro, pointes, jointures, points).
- **rdb, tiède** : son dessin, des courbes, mais sans gonfler entre les axes ni couvrir l'inconnu.
- **rdc, tiède** : le Λ, des pics bien dessinés et lisibles (pointes, pétales en pointe, deux pointes par axe…).
- **rdd, chaude** : d'autres façons de comparer deux houblons sur le même radar (écart coloré, moitiés, superposition…).
- **rde, chaude** : libre, même extravagant, tant que ça reste lisible au téléphone.

## Règles (légères)
- Mêmes données pour tous (`donnees.js`). La valeur est exacte à chaque axe. Un inconnu n'est jamais dessiné comme une
  valeur : aucun plein, point ni trait ne traverse un secteur hachuré.
- Les pictos des familles comme dans la base. 20 mots au plus autour du radar.
- Trois états : `?etat=apres` (Idaho 7 face à Cascade, dry hop après), `?etat=60` (la même paire à 60′), `?etat=nelson`
  (Motueka face à Nelson Sauvin, après).
- Par variante : `<id>/etat.html` (autonome, SVG), `<id>/NOTE.md` (titre en une ligne, puis une phrase).
- Captures : `node work/refonte-frontend/v4/ecran-1/fils26-radar/outils/capturer.mjs <id>` → `captures/<id>.png`, `-60.png`,
  `-nelson.png`. Ouvre-les.
- Seul contrôle : `node work/refonte-frontend/v4/ecran-1/fils26-radar/outils/verifier.mjs <id…>` → `RADAR OK`.
- On n'écrit que dans son dossier. Retour en une ligne.
