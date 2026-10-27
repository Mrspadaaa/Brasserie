OK — page « Quelle liste pour ta Double IPA ? » : A, B, C, D dans son Suggérer (FIDELE OK, PAGE OK)

## Fichiers écrits (tous dans la voie, rien dans `src/`, rien dans la copie propre)
- `ecran.mjs` : ouvre l'écran Suggérer de l'app depuis la copie propre (645c17f4, `git status` vide après la voie), sur « neipa v3 ».
  - La recette est une fixture tirée de son export, comme u3 : 22A, 24 L, OG 1,081, Lotus 84 g à 40′, Verdant IPA. Le module `apercuDev.ts` est intercepté.
  - La combinaison passe par une enveloppe posée dans la page sur `moteur().proposeVoies`, avec les options de f9 (`intensite`, `typicite`). La table est chargée par `chargerTypicite()`.
  - Les calculs tournent sur le fil principal (`?calcul=immediat`, prévu par l'app). La visée « plus d'… d'un cran » est posée par `poserVisee`, comme m6.
- `capturer.mjs` : produit les 8 vignettes (`img/`) et `fidelite.json`. Il s'arrête si les rangées de l'app diffèrent de `listes.json`.
- `faire-page.mjs` produit `page.html`. `sonder.mjs` et `lire-listes.mjs` sont des lectures seules.
- Fichiers de travail : `%TEMP%/m9/` (recadrages) et `%TEMP%/m9-*.png` (captures de la page).

## Les vignettes (écran entier jusqu'à « Changer de levure », 390 px de large)
| | Plus d'agrumes | Plus de tropicaux |
|---|---|---|
| A · l'actuel (référence) | `img/agrumes-a.png` | `img/tropicaux-a.png` |
| B · intensité (A3) | `img/agrumes-b.png` | `img/tropicaux-b.png` |
| C · typicité | `img/agrumes-c.png` | `img/tropicaux-c.png` |
| D · les deux | `img/agrumes-d.png` | `img/tropicaux-d.png` |

- **Les rangées sont celles de l'app**, rendues par son moteur. Pour les 8 vignettes, les rangées affichées, rangées par leur rang, sont les premiers de `listes.json` (dry hop actif) : `CONCORDE` 8 sur 8, enregistré dans `fidelite.json`, clé `concordance`.
- **Mon idée, dans son écran, entre la carte et la liste** : « Tes six ».
  - Ses six houblons, toujours à la même place (El Dorado, Mosaic, Mandarina / Calypso, Pacific Jade, Idaho 7) : l'œil passe d'une vignette à l'autre sans relire.
  - Pour chacun, son rang (« 10e ») et, dans B, C et D, l'écart à A (« ▲ 12 » en vert, « ▼ 13 » en rouge).
  - Absent : « — hors des 80 » pour Calypso en agrumes, « — ne cite pas » pour Pacific Jade en tropicaux.
  - Celui qui tombe dans les rangées de l'écran : sa case passe en orange (l'orange de sa capture), et sa rangée prend une bande orange et un nom surligné.
  - Les rangs sont lus dans `listes.json`, `sesSix`, tels quels.
- **Les barres après l'ajout du premier** : c'est la piste de la carte de l'app, en mode « Au style ». Je n'ai pas collé `barresApresLePremier` (voir plus bas).
- **La ligne honnête** (encart, une seule) : « Calypso n'est que dans 1 % des Double IPA (Beer Analytics), Pacific Jade ne cite pas le tropical, et El Dorado est freiné par sa note pomme-poire, que le 22A veut basse. »

Rangs de ses six au dry hop actif (A → C) :
- agrumes : Mosaic 22 → 10, Idaho 7 24 → 11, Mandarina 5 → 18, Pacific Jade 35 → 27, El Dorado 77 → 74, Calypso hors des 80 ;
- tropicaux : Idaho 7 5 → 3 (dans l'écran), Mosaic 18 → 8, Mandarina 21 → 21, El Dorado 71 → 69, Calypso 74 → 71, Pacific Jade absent.

## Critères (sortie décisive)
- `node work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs …/m9-dipa-listes/capturer.mjs` → `FIDELE OK (capturer.mjs : rien de caché, mesure gardée)`. Les nœuds de l'app sont les mêmes avant et après l'ajout, dans chaque vignette (570 → 570, 557 → 557…).
- `node scripts/agents/verifier-page.mjs …/m9-dipa-listes/page.html --page-lot --captures %TEMP%/m9` → `PAGE OK (8 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- « aucune erreur de page » sur les 8 captures.
- Captures ouvertes et relues :
  - `agrumes-a`, `agrumes-d`, `tropicaux-c`, `tropicaux-d` ;
  - la page à 390 px (`%TEMP%/m9-haut.png`) et à 1280 px (`%TEMP%/m9-ordinateur.png`).
  - Corrigé au premier passage : le surlignage s'étendait à « lui seul : piquant », qui porte lui aussi `data-houblon`. Il est maintenant limité au nom.

## Écarts à signaler (mesurés, non corrigés : hors contrat)
1. **Le moment.** Sans dry hop dans la recette, l'app range d'abord le whirlpool (« même effet 48 g · whirlpool » : Citra, Waimea, Amarillo, Mandarina, l'ordre whirlpool de f9). J'ai fixé le dry hop actif dans l'enveloppe (`moments: ['dryActive']`), comme la question de f9. Le sur-titre de la page le dit.
2. **Quatre rangées seulement.** L'app rend 4 voies à acheter (`buyLimit = 4` du moteur, non changé). Ses six sont donc presque toujours sous l'écran ; seul Idaho 7 (tropicaux C et D) y paraît. D'où « Tes six ».
3. **B et D, défaut d'affichage de l'app.** Avec A3, le n° 1 n'a plus le même effet que les suivants. Il passe alors dans « Ajouter », sous le groupe « même effet », et s'affiche 4e :
   - Citra en agrumes B et D ;
   - Strata en tropicaux D.
   L'app groupe avant de garder le rang.
4. **`barresApresLePremier` (f9) ne concorde pas avec l'app.**
   - En agrumes A, la carte de l'app dit 13,8 → 49,9 (+36,1, le même apport que f9). f9 donne 61,9 après : son profil de départ vaut donc environ 25,8. La recette de base diffère, probablement par la lecture de 40′ (f9 : `b30`).
   - Les barres de f9 sont identiques en A et en B (A3 n'y entre pas), alors que la carte de l'app passe à 64,4 avec A3.
   - J'ai donc gardé la carte de l'app.
5. IBU 80 dans l'app sur cette fixture, contre 92 sur son téléphone : sa vraie recette n'est pas la fixture. Rien ne dépend de cet écart ici.

## Ma préférence, comme il la jugerait : C (typicité)
- C est la seule qui fait monter ses houblons sans rien casser à l'écran :
  - en tropicaux, Idaho 7 est 3e et visible, et Mosaic passe de 18e à 8e ;
  - en agrumes, Mosaic et Idaho 7 gagnent 12 et 13 places.
- B ne change presque pas l'ordre, et son affichage fait croire que Citra a reculé (défaut 3). D cumule ce défaut et les gains de C.
- Mais C ne tient pas sa demande en agrumes. L'écran montre toujours Citra, Centennial, Amarillo, Nectaron. Mandarina recule de 5e à 18e, et Calypso, El Dorado et Pacific Jade restent loin : les données ne les portent pas.
- Prédiction : « C c'est mieux pour les tropicaux, Idaho 7 est là ; mais en agrumes c'est encore Citra et Centennial, et Mandarina qui recule, c'est pas une liste de Double IPA. »

DÉCISION À PRENDRE :
- Il choisit A, B, C ou D (pages par question).
- À trancher hors de son choix :
  - le défaut 3 : garder le rang du moteur quand le n° 1 sort de son groupe ;
  - le défaut 2 : faut-il plus de 4 voies à acheter dans Suggérer ?
  - le défaut 4 : `barresApresLePremier` de f9 ignore A3 et part d'une autre base.
- La page n'est pas publiée : le pilote la publie.

CONNAISSANCE : sur neipa v3, l'écran Suggérer de l'app (645c17f4) rend exactement les premiers de la liste principale de f9, pour les quatre combinaisons, une fois le moment fixé au dry hop actif. Il n'en montre que 4 (`buyLimit`). Sans dry hop dans la recette, il ouvre sur le whirlpool. Les options de f9 se jouent dans l'app sans toucher au code, par une enveloppe sur `moteur().proposeVoies` et `?calcul=immediat`.

LEÇON PROPOSÉE : avant d'afficher dans une maquette des valeurs calculées hors de l'app (ici `barresApresLePremier`), les confronter au nombre que l'app affiche au même endroit (la carte). Le 27.10, elles différaient de 12 points en agrumes et ignoraient l'option A3 (rôles : concepteur, auteur).
