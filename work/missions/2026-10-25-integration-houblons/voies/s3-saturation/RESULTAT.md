OK — la demande prime sur la bande (D195) : plus de noble en tête, plus de « Aucune » au-dessus de rangées ; build et perf à rejouer

## Les règles (écrites avant les mesures de non-régression)
- **R1, la demande prime sur la bande.** Une famille de la direction (il la monte, la baisse ou la bannit) qui sort de sa bande : c'est sa demande. Le dépassement reste dit dans `styleOverflow`, marqué `voulu: true`. Il ne compte ni au rang (`overflowRang`, `overflowStyle`), ni « hors du style » à l'écran. Hypothèse 1 du pilote : **confirmée** par la mesure (neipa saturée, « plus d'agrumes » : agrumes 0,5 cran au-dessus de la bande sur toute voie ; East Kent Goldings 3e et Golding 4e avant, hors des 8 premiers après).
- **R2, un excès minuscule n'est pas hors du style.** Sous `SATURATION_MINUSCULE` = 0,25 cran ajouté, l'entrée porte `minuscule: true` : ni rang, ni écran. Raison écrite : un cran est le pas du style (largeur d'un palier de sa bande), un quart de pas est dans la marge. Hypothèse 2 : **confirmée** (voies à 0,01 cran de rang devant 0 : Idaho 7, Motueka).
- **R3, nouvelle (la mesure contredit « R1 et R2 suffisent »).** Après R1, des ajouts jusque-là freinés (Strata, BRU-1, Nectaron, El Dorado, Galaxy…) prennent les 10 + 4 places de `limit` et `buyLimit`. L'écran écarte ensuite ceux qui citent une famille bannie (D194) : plus aucun « Remplacer Columbus » ne restait, `bannir2.mjs B` passait à ECHEC. Une direction qui baisse une famille garde donc, par domaine, jusqu'à `REMPLACEMENTS_RESERVES` = 4 remplacements qui la font baisser, en plus des places normales.
- `saturation: false` rend l'ordre d'ae7c7a8d (option réversible, défaut `SATURATION_DEFAUT = true`).

## Fichiers écrits
- `src/domain/hopIndex/v4/voies.ts` (champs `voulu`, `minuscule`, option `saturation`, 3 constantes, rang, réserve).
- `src/ui/hopIndex/suggerer/voies.ts` : `estHorsDuStyle` (exporté, copié sans importer le moteur : le bundle principal ne le charge pas, B5) lu par `horsDuStyle`.
- `scripts/eval-hop/s3-sonde.ts`, `s3-general.ts` (neufs). `tests/unit/hopIndexV4/saturationD195.test.ts` (neuf, 7 tests).
- Tests adaptés, chacun avec « D195 » : `apportMinoritaire`, `apportCDefaut`, `f8Intensite` (`saturation: false` dans leur enveloppe, comme a4 pour `debordementNeutre`), `affinageD102` (+ la réserve), `suggererIA` (le groupe de tête de la bière saturée est le whirlpool), `prototypes/houblons-v4/tests/` : `client-async`, `worker-calculs` (empreinte `proposer` d6e084ff0c95 → 89b74f788939), `engine` (le rang lit `overflowRang`), `pack` et `substitution` (plafond 560 → 600 ko).
- `prototypes/houblons-v4/data/pack-*.json` régénérés par `build-pack.ts` (553 → 578 ko).
- `work/refonte-frontend/v4/choix/etats/suggerer.json` : un seul état, `etat-sugg-radar`, « Voir les 11 autres voies » → « 18 » (le radar liste 21 voies au lieu de 14 ; un compte qui ne dépend que des données ; note « D195 » dans l'état).
- Dans la voie : `s3-ecran.mjs`, `s3-radar.mjs`, `mesures/`, `img/`, `avant-*.txt`, `apres-*.txt`, `a4-avant.json`, `s3-general.json`.

## Critères
- **Saturation** (`saturation.mjs`, HEAD → après) : carte « Plus agrumes — Aucune voie houblon » + East Kent Goldings, Golding, Spalter Select, Mount Hood → « Plus agrumes — Atteint » + Warrior, Cashmere, Columbus, Nugget. Capture ouverte : `img/saturation-apres.png`.
- **B** (Lotus + 100 g de Columbus au dry hop) : carte « Plus tropicaux — Aucune voie houblon » (`img/colum-avant.png`, ouverte) → « Approche » au-dessus de BRU-1, Galaxy, Enigma, Southern Passion (`img/colum-apres.png`, ouverte). `bannir2.mjs A` : `BANNIR A OK` ; `bannir2.mjs B` : `BANNIR B OK` (Remplacer Columbus présent ; sans R3 : ECHEC, vu).
- **Tests rouges sur ae7c7a8d** (`SATURATION_DEFAUT` posé à false = ordre d'avant, puis remis à true) : 5 des 7 échouent ; les 2 verts d'avant sont celui qui décrit l'option `saturation: false` et `estHorsDuStyle` (fonction neuve). Verts après : 7/7.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : 111 fichiers, 1083 tests verts.
- `npx tsc --noEmit` : sans sortie.
- `construire.mjs` : `CONSTRUIT OK (9 pages)`. `controle-etats.mjs` : `ETATS OK (138/138)` (après l'actualisation de `etat-sugg-radar`).
- D106 `controle-teinte.mjs` : `TEINTE OK 7/7`. D105 `controle-choix.mjs` : ECHEC sur `etape-houblons` (légende « Beer Maverick, Hopsteiner » : sources des descripteurs) et `comparer` (« force illisible » de Cascade et Idaho 7). Les deux échouent aussi sur l'ordre d'avant (rejoué avec le défaut à false, même rendu) : ni cause ni effet de s3. Suggérer est conforme.

## Généralisation (a4-general, 62 listes = 31 styles × 2 demandes ; `s3-general.ts`, avant = `saturation: false`)
| | avant (ae7c7a8d) | après |
|---|---|---|
| contradictions carte / liste | 4 (23A et 23G, agrumes et floral) | **0** |
| meilleur phare, médiane sur 124 lignes | 2 | 1 |
| phare médian, médiane sur 124 lignes | 5 | 5 |
Cas qui reculent de plus de 20 places : **un seul**, 16A · plus floral · dry hop actif, médiane des phares 31 → 76 (tête nugget, columbus, target, mount-hood → willamette, nugget, columbus, target). Le meilleur phare du cas ne bouge pas.

## Non-régressions, avant → après (avant = défaut posé à false)
| contrôle | avant | après |
|---|---|---|
| `f2-phares` 21C | tête Moutere, Vic Secret, Apollo ; Citra cryo au 60′ 9/205 ; Citra simple 46 | identique ; la liste par défaut des cas « moins de » compte 4 houblons de plus (réserve R3) |
| `f5-phares` | 18/31 styles avec un phare dans les 10, 12/31 dans les 5, médiane des médianes 37,5, Mosaic achat n° 4 | identique, ligne pour ligne |
| `f9-nonreg` défaut et typicité | — | identique ; seule change l'option A3 (non défaut), jusqu'à 13 places pour Nelson Sauvin |
| Citra cryo premier (16 listes) | typicité 2 | 2 (≤ 2) |
| East Kent Goldings premier du stout S1 | oui | oui (typicité : EKG, First Gold, Strisselspalt, Liberty) |
| bannirZero + `bannir2` A et B | OK | OK |
| D105 / D106 | voir plus haut | voir plus haut |

## DEMANDE EXECUTANT :
Depuis la racine, dans l'ordre :
1. `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-s3` ; relever la taille du chunk B5 (attendu ≤ 164 ko) et la fumée du worker (le script de fumée de la mission, sortie attendue « OK »).
2. `npm run check:hop-perf` (attendu : sans ECHEC).
3. `npx vite-node scripts/eval-hop/f2-perf.ts` (attendu : même ordre de grandeur que HEAD ; la réserve R3 ajoute jusqu'à 8 voies à évaluer, pas de calcul de plus).
Fichiers à produire : rien dans le dépôt (le build va dans `dist-s3`) ; recopier les sorties dans `mesures/build.txt`, `mesures/perf.txt` de la voie. Rien à ouvrir en capture.

## Doutes et limites
- `f5-phares.ts --etiquette=avant` écrit `phares-avant.json` dans le dossier de la voie f5 (en dur) : mon rejeu l'a modifié ; je l'ai restauré par `git checkout -- …/f5-ajouter-corrige/phares-avant.json`. `git status` ne montre plus rien là. Les tableaux f5 de cette voie sont dans `mesures/f5-avant.txt` et `f5-apres.txt`.
- Les captures « avant » viennent de HEAD (`colum-avant.png`) ou du texte (`avant-saturation.txt`) ; la capture de la saturation avant n'a pas été prise.
- En tête de la neipa saturée, Warrior et Cashmere (mixte, peu d'agrumes sur leur ligne) passent devant : tous les ajouts à 48 g ont le même effet (36,1 en agrumes) et le rang départage par la typicité du style. Ce n'est pas un noble et la carte dit vrai, mais un brasseur attendrait Centennial ou Cascade. À juger par lui, hors de la voie.
- Le groupe de tête de la bière saturée passe du dry hop au whirlpool (test `suggererIA` adapté) : le whirlpool n'a plus de frein de style.
- Le pack gagne 25 ko (réserve sur la liste de S1, 17 → 21 voies). Plafond de test relevé à 600 ko comme au précédent D85 (prototype seulement).
- Ce que le brasseur verra change sur l'écran Suggérer : la famille demandée n'est plus orangée « hors style » dans les barres (Divergent, Traits). C'est la règle du pilote ; la maquette choisie q2b n'est pas touchée dans son dessin.

DÉCISION À PRENDRE : la famille que le brasseur demande d'augmenter reste-t-elle orangée quand elle dépasse sa bande, ou passe-t-elle en couleur normale (c'est ce qui est livré) ? Options : (a) livré : la demande n'est jamais « hors style » ; (b) garder l'orangé sur la barre seulement, hors rang et hors carte (`voulu` est déjà dans la voie : un filtre de plus côté `Divergent`). Recommandation : (a), la couleur orange dit un défaut, pas un choix ; mais c'est un écran qu'il a choisi, donc à lui de trancher, en mini maquettes.

Essais utilisés : bannir B (1 correction, R3) ; pack et fingerprints (adaptés une fois) ; état radar (3 essais pour trouver « 18 »).

CONNAISSANCE : `directionDe` code une famille bannie et une famille à baisser par le même nombre (−1 cran) ; le moteur ne distingue pas bannir de baisser, d'où la réserve R3 plutôt qu'une exclusion côté moteur. Un banc qui passe par `proposer` doit lire `moments: ['dryActive']` (l'enveloppe de `ecran-bannir.mjs`) pour reproduire l'écran.
LEÇON PROPOSÉE : une coupe d'affichage faite avant un filtre d'écran (`limit`, `buyLimit` avant `exclue`) rend un acquis dépendant de l'ordre : tout changement de rang peut le perdre (D194 perdu par D195 jusqu'à R3) ; rejouer `bannir2.mjs A` et `B` après tout changement de rang.
