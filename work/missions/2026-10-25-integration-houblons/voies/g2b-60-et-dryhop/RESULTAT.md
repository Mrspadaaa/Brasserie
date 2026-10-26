OK — palier 60′ (+n IBU exacts, usage puis α) et vrai dry hop (actif, après, dose par règle) sous options ; sortie m7

## Fichiers écrits
- `src/domain/hopIndex/v4/palier.ts` (nouveau) : usage, bornes et règle de dose du dry hop, drapeau d'IBU, comparaisons de rang.
- `src/domain/hopIndex/v4/voies.ts` : options `palier60: { ibu }` et `dryHop: true`, champs `VoieResult.palier60` et `VoieResult.dryHop`, champs de voie `palier`, `dose`, `enStock`, `drapeaux` (tous absents sans option), deux clés dans `compareRankKeys` (inertes sans option). `departage.ts` : inchangé.
- `tests/unit/hopIndexV4/palierDryhop.test.ts` : 21 tests.
- `scripts/eval-hop/suggerer-m7.ts` (sortie des mini maquettes), `scripts/eval-hop/palier-octet.ts` (preuve « à l'octet » contre HEAD).
- `voies/g2b-60-et-dryhop/sortie-m7.json` (452 350 octets).
- Hors ma voie, non touchés : `api.ts` (les nouveaux types s'importent de `./palier`), adaptateur, client async, worker : aucun ne passe encore les options.

## Critères (VOIE.md ; il n'y a pas de GATES.md dans le dossier)
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : **80 fichiers, 772 tests verts**. Empreintes de `moteurInchange.test.ts` inchangées.
- Défaut inchangé à l'octet : `npx vite-node scripts/eval-hop/palier-octet.ts` : 144 appels (105 219 681 octets, deux moteurs, deux recettes, six directions, six jeux d'options dont k1, k3 et leviers), sha256 **f2f5e374…187d** des deux côtés (HEAD et actuel). Test : la réponse sans option ne contient aucune des clés nouvelles.
- `npm run build` : vert (sortie 0).
- Déterminisme : deux lancements de `suggerer-m7.ts` en parallèle, `cmp` identique, sha256 **9d0a33710c07a42983a2950cce9494307f74a573273da51409803fc89902dd99** (complément inclus).
- Les tests couvrent chaque option : +n IBU à ± 0,5 (5, 10, 25 ; chaque ajout, par `additionIbu`), aucun arôme avant un amérisant (liste de 205, et « remplacer à IBU égal » avec témoin du défaut où ils se mêlent), actif et après, dose = la règle recalculée hors du moteur, bornes « min » et « max », drapeau de revue, stock sans dose (37, 10, 200 g : 30 g partout), départage k1 et k3 (premier groupe 23 → 1).
- Essais : un par critère ; un test corrigé (la tête de liste est parfois « double usage », mon assertion supposait « amérisant »).

## La règle de dose du dry hop : générique
- Source de style : **aucune dans le dépôt**. Cherché : `hopSolverBootstrap.json` (`searchDosesGL` 2·4·6 g/L par timing, pas par style ; `dryHopReviewGL` 8), `docs/hop-solver.md`, `docs/hop-extrapolation.md`, `hopDoseStudyBootstrap` (Cascade, 0 à 16 g/L, un lot), Beer Analytics `amount-used-per-style` (**part du poids de houblon** de la recette, pas des g/L : non convertible sans le poids total), `hopStyleUsageBootstrap` (rôles sans dose).
- Règle : parmi les multiples de 0,5 g/L de 0,5 à 8, la dose dont l'effet sur la famille visée s'approche le plus de la visée (la plus petite à égalité). Recherche exhaustive sur la grille de 0,5 g/L, qui rend la dose arrondie la plus proche de la visée (pas une bissection continue puis un arrondi : même sortie, sans le risque d'une courbe asymétrique).
- Bornes génériques : plancher 0,5 g/L = plus petite dose de recherche du solveur ; plafond 8 g/L = repère de revue du dry hop cumulé (« ni seuil ni plafond » dans la doc : ici une borne de proposition). Visée hors bornes : `dose.borne` = « min » ou « max », dit. Dry hop cumulé avec l'existant au-dessus de 8 g/L : drapeau, pas d'exclusion.
- 21C, « plus d'agrumes » (+1 cran = 33,3 points) : **actif 1,5 g/L (30 g), après 1 g/L (20 g)** ; avant : 2 g/L fixe. Le dry hop après fermentation rend plus par gramme (0,25 g/L : +10,4 contre +8,2).
- Le reste du stock n'est plus une dose : `enStock` (Galaxy 60 g, Nectaron 0 g, null si aucun stock), statut « manque » s'il est court.
- Limite : l'effet d'une voie est celui de l'ajout seul (convention du moteur) : la dose vise +1 cran **sans compter les 80 g de Cascade déjà là** ; le cumul est dans `after` et le drapeau de revue.

## Ce que chaque rangée apporte (message du 26.10, D165 précisé)
Dans `sortie-m7.json`, par rangée : `apporte.effets` (12 familles, points et crans du style, `null` = aucune fiche ne cite la famille), `apporte.fiche` (cohumulone, β, huile totale, plage d'α ; `null` si inconnu), IBU ajouté / après, grammes, g/L ; au dry hop aussi `amertumeAFroid` (froid.ts : statut « conditional », équivalent mg/L éq. iso-α, 19,7 à 42,3 sur la 21C, jamais un IBU) et `motDeLaFiche` (mots que la rangée est seule à porter parmi les cinq). Par groupe : `cequiDistingue` (constant ou variable, sur les 5 premières et sur tout le groupe).
- **À 60′** : l'IBU ajouté est le même **à 0,5 près** (9,5 à 10,5, l'arrondi du gramme). Ce qui varie : α (15,3 à 17,8), grammes (5 à 6), cohumulone (25,5 à 34), β, huile totale (1,3 à 3). L'arôme restant est négligeable : 0,5 à 0,6 point d'agrumes, soit **0,02 cran** (contre 33 au dry hop). À dire dans la maquette : à 60′ la rangée n'apporte que de l'amertume.
- **Au dry hop** : sur les 5 premières, l'effet sur les familles visées est **identique** (35 points d'agrumes, 34,2 de tropical), l'IBU après idem (27,4, le dry hop n'en ajoute pas) et l'amertume à froid idem. Ce qui varie : α, cohumulone, β, huile totale, **les mots** (Medusa seul « lemon, lime » ; Samba seul « orange » ; Galaxy « cannabis, dank, gooseberry » hors familles ; Nectaron « nectar »). Le moteur ne distingue pas deux houblons qui citent les mêmes familles : seul le départage et les mots les séparent.

## Complément (26.10, « pas de vrai dry hopping ») : 4 et 8 g/L, et la saturation
- Moteur : `dryHop: { doseGL }` impose une dose à tout le groupe ; `dose.imposee` = « dose générique, sans source de style ». La règle (1 à 1,5 g/L) ne bouge pas (test). Défaut inchangé : même preuve à l'octet (144 appels, sha256 f2f5e374…).
- `sortie-m7.json`, `jeux[i].dryHop.dosesImposees["4 g/L" | "8 g/L"]` : groupes actif et après, ordre k3, 5 premiers avec, par rangée : `apporte.effets` (12 familles), `debordement` (crans, familles, effets de bord), `amertumeAFroid`, `motDeLaFiche`, `doseImposee`, `drapeaux` ; `cequiDistingue` ; rangs des 5 phares ; `cumulAuDessusDuRepereDeRevue`. `dryHop.saturation` : la courbe et la ligne dite.
- **Ça sature** (agrumes, ajout seul, 21C ; Citra, identique pour tout houblon qui cite la famille) :
  - actif : 35 points à 1,5 g/L (1,05 cran), 55,6 à 4 (1,67), 64,8 à 8 (1,94). +20,6 de 1,5 à 4 g/L (8,2 points par g/L), +9,2 de 4 à 8 (2,3 par g/L) : pente ÷ 3,6.
  - après : 42,1 (1,26 cran), 64,1 (1,92), 73 (2,19) ; +22 puis +8,9 : pente ÷ 4.
  - Doubler de 4 à 8 g/L (160 g sur 20 L) ajoute 0,27 cran d'agrumes. Convention du moteur, non mesurée sur bière hors du Cascade de Lafontaine (domaine 0 à 16 g/L).
- Ce que 4 et 8 g/L changent dans les listes (k3, actif ; après : mêmes ordres à ± 1) : tête NZH-107, Galaxy, Medusa, Nectaron, Samba, **la même qu'à 1,5 g/L** ; Galaxy 2e ; Citra 54e, Mosaic 132e, Nelson Sauvin 98e, Motueka 101e. Le débordement du style (crans au-dessus de la bande, `overflowTotal`) **grandit avec la dose** : Citra 0,84 → 4,18 → 5,88 (1,5, 4, 8 g/L) ; Nelson Sauvin 3,88 → 8,99 → 12,12 ; Mosaic 5,14 → 15,26 → 20,94 ; Motueka 3,6 → 9,07 → 12,42 ; Galaxy 0 aux trois doses. Leur rang ne bouge pas parce qu'il est déjà bas. À 4 et 8 g/L ces quatre houblons débordent la bande de façon visible : la DÉCISION sur le débordement plus bas reste entière et pèse davantage.
- **À 8 g/L**, le dry hop cumulé avec les 80 g de Cascade déjà là fait 12 g/L : les 152 voies portent le drapeau de revue (> 8 g/L). **À 4 et 8 g/L, l'amertume à froid devient « incomplete », sans valeur** : la dose cumulée (8 et 12 g/L) dépasse le domaine des essais (7,73 g/L, froid.ts). À 1,5 g/L (cumul 5,5) elle est « conditional », 19,7 à 42,3 mg/L éq. iso-α. La maquette ne peut donc pas afficher une amertume à froid à ces doses : « hors du domaine des essais ».
- Distance à la visée : à 4 g/L elle est de 0,2 environ (dépassement de la visée de +1 cran), à 8 g/L 0,3 : la visée « +1 cran » n'est plus la question à ces doses, la dose est choisie par le brasseur, pas par la visée.

## Les listes (21C, plus d'agrumes ; 152 houblons par groupe de dry hop ; 205 à 60′)
- **60′, +10 IBU** : Moutere (α 18,5 %), Vic Secret, Apollo, Eclipse, Ahhhroma ; 113 houblons exclus par conflit de famille. « Remplacer Nugget à IBU égal » : Cascade 38 g, Cashmere, Mandarina Bavaria, Centennial, Triumph (plus de Callista ni de Monroe 94 g en tête).
- **Dry hop, premier groupe d'ex æquo** : 23 sans départage (alphabétique : African Queen, Belma, Galaxy…), **1 sous k1 et sous k3**. k1 : Satus, Herald, Multihead, Shaddock, Southern Sublime. k3 : NZH-107, Galaxy, Medusa, Nectaron, Samba.
- **Réputation (L14), rang sur 152 au dry hop actif (après : mêmes ordres ± 1)** :

| houblon | sans départage | k1 | k3 | jugement |
|---|---|---|---|---|
| Galaxy | 3 (alphabétique) | 10 | **2** | crédible |
| Citra | 61 | 59 | 54 | **pas crédible** pour un Hazy : 3,4 crans d'effets de bord (floral, résineux) au-dessus de la bande |
| Motueka | 102 | 98 | 99 | **pas crédible** : herbacé +4,2 crans (famille indésirable de la Hazy) |
| Nelson Sauvin | 106 | 107 | 107 | **pas crédible** (« un houblon incroyable », L14) : végétal vert +4,5 crans |
| Mosaic | 134 | 134 | 134 | **pas crédible** : 5 familles au-dessus de la bande, végétal vert +3,5 |
- Cause mesurée : ce n'est **pas** le départage (il agit après) mais le **débordement de style**, clé de rang qui passe avant (`overflowTotal` : Citra 0,84, Nelson Sauvin 3,88, Mosaic 5,14 ; Galaxy 0). Les fiches qui citent vert, herbacé ou résine font descendre ces houblons malgré D90, qui les a gardés dans le pool mais pas à l'écart du classement. À 60′, Citra et Mosaic sont 46e, Galaxy 33e, Motueka 116e, Nelson Sauvin 141e (usage arôme) : cohérent, ce ne sont pas des amérisants.

## Doutes et limites
- Le pool du dry hop n'est pas borné par `maxBuy` (qui ne garde que 6 « à acheter » alphabétiques) : sinon le départage ne verrait que A à H (g1). Les plafonds `limit` et `buyLimit` s'appliquent comme au reste.
- Coût (fixtures du prototype, limites par défaut 10 et 4) : 0,36 s à chaud, 1,1 s à froid, contre 0,07 s sans option. Les listes complètes de `suggerer-m7.ts` (limites 2 000) : 3 à 4 s par appel, dues au profil « après » de chaque voie gardée.
- Sous l'option `palier60`, l'usage passe **juste après les conflits** dans le classement général (avant le débordement et la distance) : sans cela, Callista (arôme, 73 g) restait en tête de « remplacer à IBU égal » parce que la distance l'emportait. Seuls les remplacements d'un ajout d'amertume portent un palier ; les autres voies sont au palier des amérisants.
- Les trois premiers du 60′ sont des « double usage », pas des amérisants : D88 B écrit « amérisant ou double usage avant arôme, puis α », je l'ai suivi à la lettre (un seul palier, l'α décide). Aucun houblon du catalogue n'a d'usage inconnu : ce rang n'est pas exercé par les données.
- Palier 60′ : seulement des ajouts, pas de b30, b15 ni fwh. Visée négative : aucun ajout, une note.
- Beer Analytics (`src/data/hopSources/beeranalytics*.json`, en cours de collecte) ne donne pas de dose par style ; si la collecte ajoute des g/L par style, remplacer `BORNES_DRYHOP_GL` par des bornes de style (`REGLE_DRYHOP.source` passerait de « générique » à « style »).

DÉCISION À PRENDRE : le débordement de style fait descendre Citra (54e), Mosaic (134e), Nelson Sauvin (107e) et Motueka (99e) d'une liste « plus d'agrumes » en Hazy, ce que le brasseur ne reconnaîtra pas. Options : (a) laisser (c'est la règle d'avant, la liste m7 les montre bas) ; (b) au dry hop, passer le débordement des familles « neutres » **après** la distance (il resterait un drapeau et départagerait les ex æquo) ; (c) ne compter que les débordements d'une famille indésirable **marquée** (D90) dans le rang. Recommandation : (c), voie dédiée avec contrôle L14 sur ces quatre houblons ; à trancher par le pilote ou le conseil avant de montrer les listes au brasseur.

DÉCISION À PRENDRE (mineure) : bornes génériques 0,5 à 8 g/L et « amérisant ou double usage » au même palier à 60′. Recommandation : garder les deux, à lui montrer sur m7 (le premier palier sépare aisément les deux en changeant `USAGE_RANG`, une ligne).

CONNAISSANCE : au dry hop, l'effet d'une famille citée ne dépend pas de la variété ni, à dose égale, du houblon : une dose qui vise +1 cran vaut 1,5 g/L en actif et 1 g/L après fermentation sur la 21C ; les 60′ rendent 0,02 cran à la même visée. Ce qui sépare deux rangées, c'est le débordement de style, le départage (g2a) et les mots de la fiche, pas l'effet.

LEÇON PROPOSÉE : une clé de rang présente seulement sous une option doit valoir une valeur neutre dans un préordre total (absent = palier des amérisants, ou « après ceux qui en ont »), jamais « égal à tout » : sinon le tri devient intransitif dès que l'option est active. Corollaire vu ici : placer la nouvelle clé là où elle décide vraiment (l'usage après la distance laissait Callista en tête).
