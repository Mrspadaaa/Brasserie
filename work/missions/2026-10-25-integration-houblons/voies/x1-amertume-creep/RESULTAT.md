OK — froid.ts : amertume au dry hop, risque de hop creep, familles près de leur borne ; 17 tests, build vert

## Fichiers écrits
- `src/domain/hopIndex/v4/froid.ts` (nouveau ; aucun module existant touché, rien dans `src/ui/`, pas d'export ajouté à `api.ts`).
- `tests/unit/hopIndexV4/froid.test.ts` (17 tests).
- Ce fichier. Il n'y a pas de GATES.md dans la voie : j'ai pris les critères de VOIE.md.

## Les trois fonctions
- `amertumeAFroid(recipe, ajout, { science? })` : réemploie `dryHopBitterness()` sans copie. Rend l'équivalent final, le delta, leur plage (alpha en plage, et alpha au centre), les humulinones, le statut du modèle (`conditional` ou `incomplete`), les raisons, les 5 scénarios, la version et la source.
- `hopCreepDe(recipe, ajout, { levureViable? })` : risque `nul | faible | moyen | fort`, ou « sans objet » pour un ajout à chaud. Rend les facteurs avec leurs points et sources, les inconnus, les 3 effets (atténuation, CO₂, diacétyle) et la règle (`HOP_CREEP_RULE`, `HOP_CREEP_SEUILS`).
- `famillesProchesDeLaLimite(recipe, ajout, { levure?, degustation? })` : familles neutres ou indésirables que l'ajout monte et qui sont à moins d'un cran de la borne haute, ou au-dessus. Rend valeur, plage, apport, borne, marge, cran, crans, verdict, `depasse`, `approche`, et les familles non situées à part.

## Sa capture : Cascade, 21C, 4 g/L (80 g dans 20 L), dry hop après, 3 j
Recette : Nugget 20 g à 60′, 27,9 IBU à chaud (c'est son « IBU 28+? »). Un test le recalcule.

1. **Amertume** : statut `conditional`, dose 4 g/L, IBU à chaud 27,9.
   - Équivalent final : **22,3 à 34,0 mg/L éq. iso-α**. Delta : **−5,6 à +6,1**. Humulinones apportées : 6,4 à 13,5 mg/L.
   - Source : Maye, Smith et Leker 2016, MBAA TQ 53(1) 23–27, tableaux 1 à 6 ; révision `dry-hop-bitterness-maye-2016-v1`, version 2026-09-09.1.
   - Le signe du delta n'est pas établi sur l'enveloppe des 5 essais. Les 3 essais Cascade seuls donnent 22,3 à 26,3 et un delta de −5,6 à −1,6 ; les 2 essais Centennial tirent la plage vers le haut. Le test recalcule à la main le scénario Cascade à 5 j (22,34).
   - Ce n'est jamais un IBU mesuré : `nature` le dit.
2. **Hop creep** : **moyen**, 2 points. Après fermentation compte 1, Cascade compte 1 (H68). La dose de 4 g/L (sous 10 g/L) et la durée de 3 j (sous 7 j) ne comptent pas. La température inconnue ne compte pas et est listée dans `inconnus`, comme la viabilité de la levure.
   - Ce qu'il fait : atténuation en plus, CO₂, diacétyle. Les ordres de grandeur publiés viennent avec leur source : à 10 g/L, 7 j, levure ale, +0,57 à +1,05 % vol. (H68) ; Cascade 10 g/L à 20 °C, +1,3 % vol. (H84, relayé) ; diacétyle 25 → 200 ppb (H87, relayé). L'ampleur pour ce brassin est `null`, toujours.
3. **Familles près de leur limite** (style 21C : résineux, floral, épicé, terreux neutres 0–30 ; vert et herbacé indésirables 0–5) :
   - Résineux : valeur 27,5, apport +26,8 (= son « +27 »), borne 30, marge 2,5, cran 10 : **s'approche**.
   - Floral : valeur 24,4, apport +23,3, marge 5,6 : s'approche.
   - **Vert** : valeur 20,6, borne 5 (indésirable) : **dépasse de 15,6**. **Herbacé** : 13,5, borne 5 : dépasse de 8,5. Elle n'était pas dans sa capture et mérite sa place sur l'écran.
   - Les verdicts valent « incertain » : les plages du modèle sont larges (le résineux va de 2,3 à 62,6).
   - Épicé (marge 11,7) n'est pas cité : plus d'un cran de sa borne.

## Nugget en 16D (46 g à 60′ visent le milieu de la bande 50–70), dry hop après, 4 g/L, 3 j
- Amertume : IBU à chaud 60,3 ; final 40,5 à 63,7 ; delta −19,7 à +3,4 (une bière déjà amère perd surtout de l'iso-α).
- Hop creep : faible (1 point, après fermentation) ; moyen si le dry hop est actif. Nugget n'est pas cité par H68 : sa variété reste inconnue, jamais « faible ».
- Familles : résineux 29,7 pour une borne de 30 (marge 0,3), vert 27,5 (marge 2,5), agrumes 22,8 (marge 7,2) ; le melon n'est décrit par aucune fiche de Nugget : non situé.

## Cas hors domaine
- 300 g dans 20 L (15 g/L, au-delà des 7,73 g/L des essais) : statut `incomplete`, aucune valeur, raison du modèle (« Dose cumulée au-delà des essais (7.73 g/L) »).
- Alpha inconnu d'un ajout à chaud : rien de calculé, l'ajout est nommé. Science désactivée : raison du modèle. Style non documenté, moment non simulé : statut et raison.

## Comment la science est chargée, et si elle est activée
- Graine : `src/data/hopBitternessBootstrap.json` (révision `dry-hop-bitterness-maye-2016-v1`, `enabled: true`).
- Dans l'app : `bitternessScience(knowledge)` de `src/domain/hopBitterness.ts`. `knowledge` vient de `StorageService.getHopKnowledge` (lu par `useStorageValue` dans `HopBitternessPanel`, montée par RecipePage et BrewWizard). Une révision enregistrée qui porte le même id prime sur la graine, même désactivée ou invalide : le résultat est alors `undefined` et le modèle répond « absente, désactivée ou invalide ».
- Le moteur v4 ne la charge pas (`data.ts` ne la lit pas) : aujourd'hui seul `HopBitternessPanel` s'en sert. Mon module la prend par `options.science` ; sans l'option, c'est la graine activée. **Celui qui branche l'écran doit passer `bitternessScience(knowledge)`**, sinon une révision désactivée par le brasseur serait ignorée.

## Critères
- `npx vitest run tests/unit/hopIndexV4` : 482 verts sur 483. L'échec est `complements.test.ts` (« aucun fichier de src n'importe src/data/hopSources ») : il vient de `src/ui/hopIndex/commun/sourcesMesures.ts`, fichier non suivi d'une autre voie, pas du mien. `moteurInchange` vert, aucune empreinte changée. `froid.test.ts` : 17 sur 17.
- `npm run build` : vert (`tsc` sans erreur, vite 22 s). B5 : `check-hop-budget.mjs --dist dist --chunk-outils profil-simule` donne 157,6 ko gzip, tenu (≤ 160). `froid.ts` n'est importé par rien : il n'ajoute rien au bundle tant que l'écran ne l'appelle pas ; B5 est à re-mesurer à l'intégration (il importe `hopBitterness.ts`, la graine JSON et `hopBitternessCore`).
- Aucun appel réseau, aucune valeur inventée. Chaque nombre a une source ou « inconnu ».

## Essais
1 par critère ; aucun critère n'a demandé de reprise.

## Doutes et limites
- **Les niveaux de hop creep sont une convention** du prototype [H] : aucune étude ne publie « faible, moyen, fort ». Seuls les seuils ont une ancre publiée : 10 g/L (H68, H84), 7 j (H68), 20 °C (H84), et Cascade et Citra « parmi les plus fortes » (H68, résumé lu et vérifié). Les points et les seuils de niveau (1, 2, 4) sont à valider par le brasseur.
- Le facteur « variété » est une valeur par variété sourcée, mais qualitative et sur deux noms seulement. À retirer si le pilote veut zéro valeur par variété.
- CO₂ : conséquence de la refermentation, non chiffrée. Sa source est le Technical Brief Stokholm et Shellhammer 2020 (relayé, non relu dans cette voie).
- Le modèle d'amertume est des essais pellets Cascade et Centennial à 16 °C, 1 à 5 j, sur bière finie. Hors de ces conditions, il le dit (contact hors de 1–5 j, température éloignée de 16 °C). Un dry hop actif n'a pas de raison propre en plus de celle du modèle.
- Les familles se lisent en points absolus contre la bande du style (valeur simulée, borne haute, cran) : c'est la lecture « Au style » sans normalisation au moment. Défaut de l'outil quand la levure ou la durée manquent : US-05, 3 j, tous deux dits dans `raisons`.

DÉCISION À PRENDRE : garder le facteur « variété » (Cascade, Citra +1 point) du hop creep ? Options : (a) le garder, sourcé H68 ; (b) le retirer, le risque ne dépend alors que du moment, de la dose, de la durée et de la température. Recommandation : (a), tant que m5 affiche « variété citée par l'étude » avec sa source.

CONNAISSANCE : en 21C, un dry hop Cascade à 4 g/L fait dépasser le vert (+20,1) et l'herbacé (+13,4), indésirables à 0–5, et approcher le résineux (+26,8 pour une borne de 30) et le floral. Le delta d'amertume au dry hop d'une bière à 28 IBU n'a pas de signe établi (−5,6 à +6,1), négatif avec Cascade seul.

LEÇON PROPOSÉE : aucune
