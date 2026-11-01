OK — Substituer à 60′ : l'amertume inconnue passe après la connue, jamais « proche » ; Nugget 5/5 → 0/5, 20 houblons 17 → 0

## Règle de principe (écrite d'abord)
- **Inconnu ≠ 0, et l'inconnu passe après le connu** (L14).
- À un moment d'amertume (premier moût, 60′, 30′, 15′), un candidat dont **ni l'α, ni la β, ni la cohumulone, ni le rôle** ne sont connus des deux houblons n'est noté que par la part étrangère de ses familles (poids 0,1 sur 1). Il passe **derrière tout candidat qui a une variable d'amertume** ; son palier ne dépasse jamais « partiel » ; son score reste celui du calcul (rien d'inventé, rien mis à 0) ; sa raison le dit : « amertume inconnue (ni α, ni β, ni cohumulone, ni rôle connus des deux fiches) : score fondé sur l'arôme seul, après les amérisants connus ».
- Aucun poids n'est touché. La règle n'a aucun paramètre réglé sur Nugget ni sur ses six phares (L20).

## Fichiers écrits
- `src/domain/hopIndex/v4/substitution.ts` : clé de classement `cA` (amertume inconnue) entre le conflit de style et la couverture faible, plafond de palier `PALIER_SANS_AMERTUME = 'partiel'`, raison écrite, phrase de la règle (`RANKING`, point 2 puis renumérotation).
- `tests/unit/hopIndexV4/substituerInconnuApres.test.ts` (neuf, 5 tests).
- `tests/unit/hopIndexV4/moteurInchange.test.ts` : empreinte `substituts` 9e1a3a6d… → 5f7703d6… (raison D196 écrite au fichier).
- `prototypes/houblons-v4/data/pack-fiches.json` : le seul champ `regle` mis à jour (voir « Limites »). Hors de mon « Possède » strict : c'est l'empreinte stockée de `substitutes`, que `pack.test.ts` et `substitution.test.ts` comparent au moteur.
- `scripts/eval-hop/k1-mesure.ts`, `k1-ordre.ts`, `k1-compare.mjs`, `k1-pack-regle.ts` (neufs).
- Sorties : `sorties/` (`k1-avant|apres.json|.log`, `banc-avant|apres.json`, `vitest.log`, `vitest-final.log`, `f1-poids.log`).

## Critères

### Test rouge sur HEAD, puis vert (L13)
- HEAD (348ed482) : `substituerInconnuApres.test.ts` : **4 échecs sur 5** (tête = Bru, Cluster fugget, Extra styrian dana, Kohia Nelson, Limequat ; 17 houblons touchés sur 20 ; inconnus « très proche »). Le 5e test (10′/wp/dry : empreinte de HEAD) est vert, comme prévu : il garde ce qui ne doit pas bouger.
- Après : 5/5 verts. Un premier essai (inconnu et couverture faible dans la même clé) échouait au test « deux blocs » : un candidat d'amertume connue mais d'arôme inconnu se mêlait aux inconnus. Corrigé par une clé séparée, placée avant la couverture faible (l'amertume pèse 0,7 à ce moment). 2 essais.
- Nugget 46 g à 60′, stout S1 (catalogue plein, 504 candidats) :
  - avant : `Bru 100, Cluster fugget 100, Extra styrian dana 100, Kohia Nelson 100, Limequat 100`, tous « très proche », amertume `null` ;
  - après : `Styrian Eureka 99, Trident 99, Yeoman 99, Helios 97, Centennial 96`, tous d'amertume connue (99, 99, …) ; inconnus dans le top 5 : 5 → **0** ; dans le top 30 : 12 → **0** ; montrés à l'écran (avec le stock de la fixture) : 5 → 0.
  - rangs des amérisants attendus : Warrior 25 → 13, Chinook 33 → 21, Columbus 49 → 37, Magnum US 53 → 41, Zeus 70 → 58, Cluster 170 → 157 (l'ordre entre connus est celui de HEAD ; ils gagnent seulement les 12 places des inconnus).

### Les 20 houblons courants à 60′ (d60) : **17/20 → 0/20** gardent un inconnu parmi les cinq montrés
`sorties/k1-apres.json`. Nombre d'inconnus parmi les 5 montrés, avant → après : nugget 5→0, magnum-us 0, warrior 1→0, columbus 4→0, chinook 4→0, perle-us 0, saaz-cz 2→0, east-kent-goldings 0, target 1→0, fuggle 2→0, cascade 3→0, centennial 5→0, citra 5→0, simcoe 3→0, mosaic 5→0, lotus 4→0, galaxy 3→0, motueka 4→0, nelson-sauvin 4→0, hallertau-blanc 5→0.

### Jugement sur l'autre moitié (L20) : tout le catalogue plein (505 variétés posées à 60′)
Moitiés par parité de l'indice parmi les ids triés ; la règle n'a aucun paramètre, donc aucune moitié n'a servi à régler.
| | originaux | inconnu parmi les 5 montrés, avant | après | « très proche » à amertume inconnue, avant → après |
|---|---|---|---|---|
| moitié paire | 253 | 120 | 40 | 312 → 0 |
| moitié impaire | 252 | 118 | 36 | 348 → 0 |
Le reste (40 et 36) est exactement le nombre d'originaux dont **eux-mêmes** n'ont ni α, ni β, ni cohumulone (76 en tout) : aucun candidat ne peut alors être comparé sur l'amertume, tous sont « inconnus » et rien ne les départage du connu. Ce n'est pas un défaut de la règle ; l'écran peut le dire (voir « Décision »).

### À 10′, whirlpool, dry hop : rien ne change
- 20 houblons × `b10`, `wp`, `dryActive`, `dryPost` (80 classements, 40 premiers, `regle` exclu) : empreinte **033aba7b… avant et après** (identique à l'octet près).
- Contrôle large `k1-ordre.ts` + `k1-compare.mjs` : 505 originaux × 4 moments d'amertume (b60, b30, fwh, b15) = 2020 classements, HEAD contre arbre modifié, **INVARIANTS OK** : mêmes candidats, mêmes scores ; ordre des connus = celui de HEAD ; ordre des inconnus = celui de HEAD ; aucun inconnu avant un connu ; aucun inconnu « proche » ou « très proche » ; palier des connus inchangé ; tout classement changé avait un inconnu devant un connu dans HEAD. 1548 classements sur 2020 changent (dont 644 avec un inconnu dans les 5 premiers de HEAD) : c'est l'effet voulu.

### Non-régressions (avant / après)
| contrôle | avant (HEAD) | après | verdict |
|---|---|---|---|
| `banc-justesse.ts` (D, vrai moteur, 60′ et dry hop) | sha 8e4b7b26…, composite60 0,151, P1a 0,109, P1b 0,094, P3 0,25, P1c 0,374, P2 MRR 0,627, K4 1, K5 265 | **identique** (même sha) | aucun gain ni perte : la liste des 317 de Beer Maverick du banc n'a pas d'inconnu devant |
| `f1-poids.ts` | la réplique est celle d'avant D102 : 94593 écarts avec le moteur, déjà à HEAD | idem (`sorties/f1-poids.log`) | sans objet : les f1-* lisent une réplique, pas le classement ; le banc de justesse est leur version sur le vrai moteur |
| `moteurInchange.test.ts`, empreinte `substituts` (12 phares, contexte par défaut) | 9e1a3a6d… | 5f7703d6… | change **à cause du seul texte `regle`** (D196). Sans `regle` : cda1c421… avant et après (mêmes scores, rangs, doses, raisons). Constante mise à jour avec sa raison |
| `pack-fiches.json` (`regle`) | ancienne règle | nouvelle règle | `pack.test.ts` et `substitution.test.ts` verts |
| empreintes `substitutes` et `remplacants` de client-async / worker-calculs (Nugget 60′, fixture) | `289ca4efaed4`, `5c602de7c804` | inchangées au premier passage complet (rien n'a échoué sur elles) | voir la limite sur `proposer` |
| `npx tsc --noEmit` | – | **sans sortie** | OK |
| `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` | – | 1086 verts, **7 rouges, aucun de ma voie** (ci-dessous) | **à rejouer quand s3 aura fini** |

Les 7 rouges du dernier passage (`sorties/vitest-final.log`) : `client-async.test.ts` ×4 et `worker-calculs.test.ts` ×1, tous sur l'empreinte `proposer` (attendu 89b74f788939, reçu 57176985632c), et `saturationD195.test.ts` ×2 (R4 : amérisant au whirlpool et au dry hop). Ce sont les fichiers de la voie s3 en vol (`voies.ts`, `palier.ts`, typicité, le test R4 modifié au début de la session). `voies.ts` n'appelle pas `substitutes()`. Au premier passage complet, fait avec mon changement en place, ces fichiers étaient verts : seuls rouges alors, `pack.test.ts` et `substitution.test.ts` (le `regle`, corrigé) et `f9Typicite.test.ts` (sources Beer Analytics non suivies, vert au passage suivant).

## Essais utilisés
Test et règle : 2 essais (clé séparée). Pack : 1. Aucun critère n'a dépassé 3 essais.

## Doutes et limites
1. **Palier plafonné à « partiel » (choix de ma voie).** Le brief dit « ne s'étiquette jamais très proche ». « Partiel » (≥ 50) dit une information partielle ; « éloigné » aurait contredit un score de 99. Le score chiffré reste affiché tel quel par l'écran (99 ou 100 avec « partiel » à côté) : c'est le moteur qui est honnête, pas encore la carte.
2. **Place de la clé** : après le conflit de style (c0), comme `fiabilite`. Un inconnu sans conflit passe donc devant un connu **en conflit de style**. Sans effet mesuré sur la tête (des centaines de connus sans conflit), mais ce n'est pas « tout candidat qui en a » au sens strict. Pour le rendre strict, mettre `cA` avant `c0` : une ligne.
3. **Originaux sans amertume** (76 sur 505 : ni α, ni β, ni cohumulone) : tous les candidats sont inconnus à 60′, l'ordre ne change pas, mais aucun n'est plus « proche » que « partiel ». Honnête, pas satisfaisant : une carte ne devrait rien afficher de « proche » pour ces originaux ; à l'écran, un mot comme « amertume de l'original inconnue » serait plus clair.
4. **Pack du prototype** : `npm run pack` relirait `voies.ts` (modifié par s3), donc j'ai écrit seulement `regle` dans `pack-fiches.json` (`k1-pack-regle.ts`, aller-retour JSON vérifié à l'octet près, `pack-mini-protos.json` sans `regle` à changer). Git signale LF → CRLF, comme pour les autres fichiers du dossier.
5. **Pas de Chrome** (consigne) : l'écran Substituer n'a pas été regardé. L'ancienne phrase de l'écran (« Aucun remplaçant sans inconnue. Bru, Cluster fugget… vont de 10 à 100 ») doit changer d'elle-même, puisque ses cinq inconnus sortent de la tête ; **à vérifier au rejeu final**.
6. Les rangs du 60′ pour des originaux en conflit de style ne sont pas mesurés séparément : `k1-ordre.ts` tourne sans style (le cas pur).

## À rejouer en Chrome (rejeu final, par un exécutant)
- Stout S1, Nugget 46 g à 60′, écran Substituer : capture avant (`work/missions/2026-10-25-integration-houblons/voies/d60-diagnostic/captures/stout-substituer.png`) et après ; ouvrir l'image. Attendu : Styrian Eureka, Trident, Yeoman, Helios, Centennial à la place de Bru, Cluster fugget, Extra styrian dana, Kohia Nelson, Limequat ; plus de « Aucun remplaçant sans inconnue ».
- Un original sans α (par exemple une variété de peu de données) à 60′ : aucun « proche ».

## DÉCISION À PRENDRE
- **Écran, original sans amertume connue** : (a) ne rien changer (palier « partiel », raison écrite) ; (b) une ligne sous la liste « amertume de l'original inconnue : les scores ne portent que sur l'arôme ». Je recommande (a) maintenant, (b) avec le lot m7 (écran choisi : règle n° 1, mini maquettes, pas de mots seuls).
- **Place de `cA` avant ou après le conflit de style** (doute 2) : je recommande de laisser comme `fiabilite` (après), réversible en une ligne.

CONNAISSANCE : à 60′, 76 des 505 variétés du catalogue plein n'ont ni α, ni β, ni cohumulone (ce sont aussi les candidats « amertume inconnue » de d60) ; une liste de substituts d'amertume les met désormais tous après les amérisants connus. Sur 505 originaux, la règle change 1548 de 2020 classements d'amertume (b60, b30, fwh, b15) sans toucher un score ni l'ordre entre candidats connus.
LEÇON PROPOSÉE : aucune.
