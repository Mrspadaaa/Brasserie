OK — « trop herbal » : l'herbacé et le végétal neutres comptent au rang ; K de l'herbacé juste, rien changé

Règle écrite avant toute mesure (31.10) et gardée telle quelle : aucune mesure ne la contredit.
Reprise : le premier auteur avait écrit la règle dans `voies.ts`, le test `herbaceH1.test.ts` et cinq scripts. J'ai fini : un test faux corrigé (3A → 1A), le banc des 124 cas, les non-régressions, le houblon frais et la demande exécutant.

## Règle de principe

Un excès d'herbacé (`herbal`) ou de végétal (`green`) au-dessus de la bande est un défaut même quand le style n'en dit rien (statut `neutre`, bande [0, 30], `from: []`) : le BJCP range l'herbe coupée parmi les défauts.
- Ces deux familles comptent au rang (`overflowRang`, `overflowStyle`) et sont marquées `defaut: true` dans `styleOverflow`.
- Exceptions, déjà portées par le code : la demande du brasseur prime (`voulu`, s3 R1) et un excès sous 0,25 cran (`minuscule`) ne comptent pas ; un style qui attend la famille (`attendue`, bande de son guide) n'est jamais marqué `defaut`.
- Les autres familles neutres (poire d'El Dorado…) restent sous a4 (D125).
- Code : `voies.ts` seulement : `DEFAUT_VEGETAL_DEFAUT = true`, `FAMILLES_VEGETALES`, option `defautVegetal` (`false` rend l'ordre d'avant), champ `StyleOverflow.defaut`, filtre `horsNeutre` dans les deux calculs du débordement.

## Fichiers

- Écrits : `src/domain/hopIndex/v4/voies.ts` (+17 −4), `tests/unit/hopIndexV4/herbaceH1.test.ts` (9 tests), `scripts/eval-hop/h1-commun.ts`, `h1-courbe.ts`, `h1-neipa.ts`, `h1-general.ts` (neuf), `h1-sonde.ts`, `h1-debug.ts`, `h1-attendue.ts` (neuf), `h1-3a.ts` (neuf), ce fichier.
- Non touchés : `profil-simule.ts` (K inchangé), `style-bands.json` (la règle est en code, pas en données), `substitution.ts` (k1).

## Critère 1 : le modèle contre la donnée (E04, Cascade, dry hop 24 h)

`npx vite-node scripts/eval-hop/h1-courbe.ts`. Ajout (dose − témoin) en points de l'axe 0–100 ; mesuré = Δ panel × 100/15 (convention `correspondance-familles.json`).

| dose g/L | agrumes mesuré | simulé | écart | herbacé mesuré | simulé | écart | herbacé/agrumes mesuré | simulé |
|---|---|---|---|---|---|---|---|---|
| 2 | 16,7 | 17,3 | +0,7 | 12,0 | 9,4 | −2,6 | 0,72 | 0,54 |
| 3,86 | 26,0 | 26,0 | 0 | 21,3 | 17,1 | −4,2 | 0,82 | 0,66 |
| 8 | 34,7 | 36,0 | +1,4 | 32,7 | 31,2 | −1,5 | 0,94 | 0,86 |
| 16 | 34,0 | 44,0 | +10,0 | 52,7 | 50,6 | −2,1 | 1,55 | 1,15 |

- Écart quadratique moyen : herbacé 2,8 pts, agrumes 5,0 pts.
- De 8 à 16 g/L : herbacé mesuré +61 %, simulé +62 % (la montée est bien reproduite). Agrumes mesuré −3 % (7,1 → 7,0 sur 15), simulé +22 %.
- K en vigueur : herbacé 16, agrumes 4,5. **K de l'herbacé non changé** : la donnée ne le demande pas (sous-estimation de 1,5 à 4 pts, dans le bruit d'un panel sur 15 ; la pente de 8 à 16 g/L est juste).
- **Limite honnête (L20)** : E04 est la seule série dose → herbacé du catalogue. Le réglage ne peut donc se juger que sur Cascade ; je n'ai rien réglé, donc rien à sur-ajuster. Les autres houblons (Citra, Lotus, Mosaic) ont un herbacé inconnu dans le simulé (affiché « ? », jamais 0) ; East Kent Goldings sort 27 pts à 4 g/L et 67 à 16 g/L, sans mesure pour le juger.
- **Écart restant, hors de ma voie** : le plafond des agrumes mesuré à 8 g/L (35 → 34) n'est pas reproduit à 16 g/L (+10 pts simulés). C'est le K des agrumes (`courbeDe('citrus')`, 4,5), que `Possède` ne me donne pas ; une seule mesure (16 g/L) le porte.

## Critère 3 : la neipa saturée (22A, Lotus 78 g à 15′ + 144 g au dry hop actif)

`npx vite-node scripts/eval-hop/h1-neipa.ts -- --grand --moment=dryActive,wp --crans=2`, avant = `defautVegetal: false` (ordre de HEAD).

| | avant | après |
|---|---|---|
| 4 premières voies | Ahtanum, Pacifica, Falconer's Flight, Jarrylo : **144 g au dry hop actif, herbacé +45 pts, 1,54 cran hors bande** (végétal 1,49 cran pour deux) | Apollo, Horizon, Phoenix (144 g), Triskel (96 g) : **0/4 sortent de la bande** |
| voies suivantes | | 5 à 8 : whirlpool 72 g (agrumes 40,5) ; 9 et suivantes : dry hop 48 g (agrumes 36, herbacé 25, dans la bande de 30) |
| agrumes de la tête | 52,4 | 52,4 (identique pour les trois premières) |

Dans la liste par défaut (pool étroit, « plus d'agrumes » à 1 cran) la tête ne bouge pas : Warrior, Wai-iti, Lemondrop, Eureka au whirlpool 48 g, herbacé 26 pts, sous la bande avant comme après.

**Doute** : les trois premières voies d'après sont des houblons dont l'herbacé est inconnu dans les fiches (« ? ») et gardent 144 g. L'inconnu n'est pas compté 0 mais il ne freine pas non plus : on ne sait pas si ces 144 g donneraient de l'herbe. Voir DÉCISION 2.

## 124 cas d'`a4-general` / `s3-general` (`h1-general.ts`)

31 styles × 2 demandes × 2 moments (124 cas, 62 listes montrées, 248 voies).

| | avant | après |
|---|---|---|
| contradictions carte / liste | 0 | 0 (et 0 avec la correction d'écran de la DÉCISION 1) |
| meilleur phare, médiane | 2 | 2 |
| phare médian, médiane | 6,5 | 6,5 |
| voies montrées | 248 | 248 |
| reculs de plus de 20 places | | 0 |
| têtes qui changent (4 premiers, 124 cas et 62 listes montrées) | | 0 |

La recette de ces cas (Nugget 20 g à 60′) n'a pas d'herbacé hors bande : la règle ne mord pas, ce qui est voulu. Elle ne mord que sur une bière déjà chargée ou une forte dose.

## Non-régressions

| contrôle | résultat |
|---|---|
| El Dorado (D127) | `a4Biais.test.ts` vert ; `herbaceH1` : la poire neutre est dite, jamais `defaut`, jamais au rang |
| Citra cryo premier (`f9-nonreg.ts`, sur 16 listes) | actuel 0, A3 0, typicité 1, A3 + typicité 1 : au plus 1/16 (limite 2/16), identique avant/après |
| East Kent Goldings premier du stout S1 | identique avant/après : « East Kent Goldings, First Gold, Strisselspalt, Liberty » (typicité, défaut) ; `f9Typicite.test.ts` vert |
| `f5-phares.ts` | 18/31 styles avec un phare dans les 10, 12/31 dans les 5, médiane des médianes 37,5, Mosaic achat n° 4 en 21A : **identique** avant/après (tête 21A identique) |
| `bannirZero.test.ts` | vert |
| `f9-nonreg.ts`, sortie complète comparée à l'arbre avec le `voies.ts` de HEAD | **5 lignes sur ~100 changent, toutes en dry hop actif, toutes expliquées par la règle** (ci-dessous) |
| `herbaceH1.test.ts` | 9/9 vert sur l'arbre ; **7/9 rouges sur HEAD** (les 2 verts à vide sont les gardes-fous « les autres familles neutres restent sous a4 » et « le rang ne lit que l'herbacé et le végétal », voulus) |

Les 5 lignes de `f9-nonreg` qui changent (rang dans la liste principale, fixtures) :
- 16D floral, dry hop actif, A3 : Motueka 73 → 72 ; A3 + typicité : Motueka 73 → 72.
- 22A tropicaux, dry hop actif, A3 : Nelson Sauvin 59 → 51, Motueka 60 → 52 ; A3 + typicité : 63 → 53 et 64 → 54.
- 16D tropicaux, dry hop actif, « actuel » : Citra 17 → 16, Nelson 19 → 18, Galaxy 14 → 13, Mosaic 10 → 9.
Cause : des houblons dont les fiches marquent l'herbacé tombent sous la règle quand leur dose au dry hop sort la bande ; les autres montent d'un à dix rangs. Aucun premier de liste ne change.

## Suite de tests, types

- `npx tsc --noEmit` : sans sortie.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : 116 fichiers, **1124 verts, 5 rouges** : `prototypes/houblons-v4/tests/client-async.test.ts` (4) et `worker-calculs.test.ts` (1), empreinte de `proposer` `57176985632c` au lieu de `89b74f788939`. **Ces 5 rouges ne viennent pas de D197** : refaits avec le `voies.ts` de HEAD, mêmes 5 rouges, même valeur `57176985632c`. Origine probable : le commit t3 `137d3d17` (départage par l'usage au frais, `voies.ts` +40) n'a pas mis à jour ces empreintes. Je n'y touche pas : le pilote tranche (DÉCISION 3). Ma règle ne change donc aucune empreinte de ces tests.

## Critère 4 : le houblon frais (wet hop)

**Manque, rien inventé.** Les formes connues du moteur sont `cryo | unknown` (`data.ts` : `form`, `HopLot.form`) ; ni le catalogue, ni les formes, ni les sources n'ont une forme fraîche avec une mesure. Seuls traits : « Fresh Hops » comme étiquette de disponibilité dans la fiche Crosby (`hopSources/crosbyhops.json`), et le style « Fresh Hop Beer » (BA 896, sans `stats`) dans `brewingStylesBootstrap.json`. Aucun herbacé de houblon frais n'est mesuré. Le plus proche, E04 (la forte dose), est le proxy déjà pris en compte par la règle ; il ne dit rien du cône frais lui-même (eau, chlorophylle, polyphénols).

## Essais

Critère 1 : un. Critère 3 : deux (liste étroite sans effet, puis `--grand --crans=2`). Test 3A : un (échec « 0 herbal » : à 30 g/L aucune voie ; à 12 g/L l'herbacé de 3A, bande 0–68, ne sort pas ; remplacé par 1A, bande 0–30, à 6 g/L, où il sort de 45 pts). Suite vitest : deux.

## DÉCISION À PRENDRE

1. **« Hors du style » à l'écran.** `estHorsDuStyle` (`src/ui/hopIndex/suggerer/voies.ts:79`) lit `status !== 'neutre' && !voulu && !minuscule` et ne connaît pas `defaut`. Le rang du moteur prend donc la règle, mais l'étiquette « hors du style » de la carte et de la rangée non : l'herbacé neutre reste muet à l'écran. Hors de mon `Possède` (voie ia3 / a4 de l'écran). Changement d'une ligne, que j'ai mesuré dans `h1-general.ts` (colonne `apresEcran` : 0 contradiction carte / liste sur 62 listes) : `(o.status !== 'neutre' || o.defaut) && !o.voulu && !o.minuscule`. **Recommandation : l'appliquer** (la voie d'écran, avec une capture de la neipa saturée).
2. **Herbacé inconnu devant.** À la neipa saturée, les voies d'après passent devant avec des houblons dont l'herbacé est inconnu (Apollo, Horizon, Phoenix, 144 g). Options : (a) laisser (l'inconnu n'est pas compté, honnête) ; (b) un petit départage « herbacé connu et dans la bande » avant « herbacé inconnu » à dose forte ; (c) une marque « herbacé non établi » sur la rangée. **Recommandation : (c)**, sans changer le rang ; (b) sinon, après la voie k1.
3. **Cinq empreintes `client-async` / `worker-calculs`** (`89b74f788939` → `57176985632c`) : à mettre à jour par le pilote, raison « t3 R4 (137d3d17) », après avoir confirmé que les fichiers `hopSources/beeranalytics-*.json` non suivis ne jouent pas.
4. **Plafond des agrumes (E04, 8 → 16 g/L).** Le simulé monte de 22 % là où la mesure est plate (+10 pts à 16 g/L). K des agrumes (4,5), hors de `Possède`, une seule mesure. **Recommandation : ne pas toucher sans seconde source** ; le dire à la voie qui tient les agrumes.

## DEMANDE EXECUTANT :

Depuis la racine, sur l'arbre courant (relire `git status` avant ; ne rien commiter). Tout est mécanique.
1. `node prototypes/houblons-v4/parcours/outils/construire.mjs` ; attendu : `CONSTRUIT OK (9 pages)`.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` ; attendu : `ETATS OK (138/138)` (comme a3 et a4). Non rejoué par moi : si un état change, noter lequel sans le corriger.
3. `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-h1`.
4. `node scripts/check-hop-budget.mjs --dist C:/Users/mrspa/AppData/Local/Temp/dist-h1 --chunk-outils profil-simule` ; attendu : B5 ≤ 164 ko (le moteur gagne une quinzaine de lignes ; B1 et B2 dépassés comme à HEAD).
5. `npm run build` à part (`tsc && vite build && check-private-research`) ; attendu : sans erreur.
6. `npx vite-node scripts/eval-hop/h1-neipa.ts -- --grand --moment=dryActive,wp --crans=2` ; attendu : « 4 premières voies : … 0/4 sortent de la bande » après, « 4/4 » avant.
7. Captures à ouvrir en image : l'écran Suggérer de l'app sur la neipa saturée (Lotus 78 g à 15′ + 144 g au dry hop actif), « plus d'agrumes ». À regarder : aucune des 4 premières rangées n'est un dry hop à 144 g d'un houblon à herbacé établi ; la carte et les rangées ne se contredisent pas (« Aucune voie houblon » absent quand des rangées sont montrées). Si la DÉCISION 1 est appliquée : l'étiquette « hors du style » figure sur une rangée d'herbacé.

CONNAISSANCE : le moteur n'a que `cryo | unknown` comme formes de houblon ; aucun houblon frais (wet hop) n'est modélisé ni mesuré. E04 (Cascade) est la seule série dose → herbacé du catalogue : herbacé simulé juste (+62 % de 8 à 16 g/L contre +61 % mesuré), agrumes simulés sans le plafond mesuré.
LEÇON PROPOSÉE : un test qui sonde un dépassement de bande le choisit sur la donnée (h1-3a.ts : 3A à 30 g/L ne donne aucune voie, à 12 g/L l'herbacé ne sort pas de 0–68), pas sur la bande qu'on suppose.
