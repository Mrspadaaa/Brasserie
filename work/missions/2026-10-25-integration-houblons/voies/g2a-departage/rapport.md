# g2a — départager les houblons de Suggérer : trois clés mesurées (k1, k2, k3), défaut inchangé

Date : 26.10, données d'aujourd'hui. Moteur : `creerMoteur({catalogue, stock: []})`, les 318 variétés, comme g1.
Chiffres : `departage.json` (sha256 `d5348c10…aaf9`, **identique sur deux passes**), produit par `scripts/eval-hop/departage.ts`
(`npx vite-node scripts/eval-hop/departage.ts -- --sortie=<dossier>`, 300 s). Le défaut du moteur reste `'aucun'`.

## 0. Ce qui est écrit
- `src/domain/hopIndex/v4/departage.ts` : les trois clés. `voies.ts` : l'option `departage: 'aucun' | 'k1' | 'k2' | 'k3'` (défaut `'aucun'`).
- Place de la clé dans `compareRankKeys` : **juste après la distance**, avant les effets de bord, le stock et la dérive d'IBU. Elle ne change jamais `effect`, `distance`, `ibu`, `overflowTotal`, `conflicts` (test).
- Une clé est un vecteur comparé étape par étape, du plus grand au plus petit ; **l'inconnu passe après le connu**, même face à un 0 publié. Le champ `Voie.departage` (clé, source de chaque valeur) n'existe que si l'option est active et qu'une famille monte.
- Une voie sans ajout qui monte (diminuer, retirer, levure) est neutre : tout inconnu. Plusieurs familles visées ou un assemblage : moyenne des clés (poids = part de dose) ; une étape inconnue d'un côté rend l'étape inconnue.
- **À l'octet près** : `scripts/eval-hop/departage-octet.ts` rejoue `voies.ts` de HEAD (copie à chemins absolus) contre l'actuel : 96 appels (2 moteurs, 2 recettes, 6 visées, 4 jeux d'options dont leviers et assemblages), 48 433 542 octets, sha256 **`de5d4545…81ecb` des deux côtés**.

Les trois clés (cible : les houblons qui citent la famille visée) :
| clé | étapes | sources |
|---|---|---|
| k1 | fiche marquée → premier descripteur → part des fiches → signal d'huile de la famille, à défaut huile totale | fiches des sources ; Hopsteiner, Beer Maverick |
| k2 | part des fiches → signal d'huile **propre à la famille** (jamais l'huile totale) | idem |
| k3 | valeur de la famille sur le radar Beer Maverick (0 à 5) | `bm.arome` du catalogue (`proto-data.json`), 181 variétés sur 318 |

Signal propre : linalol Hopsteiner (agrumes, floral ; 64 variétés), myrcène Beer Maverick (résineux), classe de thiols Hopsteiner (tropical ; 59). Les autres familles n'ont pas de signal : k2 y reste ex æquo. Géraniol : aucune donnée séparée dans le dépôt (Beer Maverick le range dans « All Others »), donc non utilisé. Valeurs en % de l'huile : l'échelle de la source, lue pour l'ordre seulement.
Radar Beer Maverick : neuf axes, appariés ainsi : agrumes, tropical, fruits à noyau, petits fruits, floral, végétal vert (grassy), herbacé, épicé, résineux. **Pomme et poire, melon, terreux n'ont pas d'axe : k3 y est inconnu.**
Dans k1, le niveau du signal (signal d'huile avant huile totale) évite de comparer des pourcentages de linalol à des mL d'huile : les houblons avec signal passent avant ceux qui n'ont que l'huile totale.

## 1. Les houblons phares (L14) : rang dans la liste, « 54/70 » = rang moyen du groupe d'ex æquo
Rang moyen du groupe, sur la longueur de la liste. `aucun` = aujourd'hui. Détail et rangs exacts : `departage.json`, partie A.

**Une limite avant de lire : sur la 21C (Hazy IPA), Nelson Sauvin, Motueka, Mosaic, Hallertau Blanc et Cascade n'entrent jamais dans la liste, avec aucune clé.**
Le style classe « herbacé » et « végétal vert » comme indésirables, et le moteur exclut du pool tout houblon dont une fiche cite l'une des deux (`departage-absents.ts` : Nelson Sauvin cite végétal vert, Motueka herbacé, Mosaic végétal vert, Hallertau Blanc les deux, Cascade les deux). C'est une règle du moteur en amont du départage ; elle écarte Cascade et Mosaic d'une Hazy sur une seule fiche. Je ne la touche pas (hors voie) : **à signaler** (L14). Sur la 21C, seuls Citra et Galaxy se jugent ; les sept se jugent sur la stout (16D, aucune famille indésirable).

### 1.1 Stout, à 10′ (là où les ex æquo sont petits et où la clé agit le plus)
| houblon | agrumes (233) aucun · k1 · k2 · k3 | tropical (123) aucun · k1 · k2 · k3 | floral (154) aucun · k1 · k2 · k3 |
|---|---|---|---|
| Citra | 221 · 27 · 127 · **4** | 111 · **11** · 59 · 25 | 145 · 90 · 138 · **86** |
| Nelson Sauvin | 210 · 153 · 158 · 154 | 101 · **45** · 81 · 62 | ne cite pas le floral |
| Motueka | 22,5 · **6** · **7** · 26 | **4** · 72 · 80 · 54 | 31,5 · 79 · 88 · 91 |
| Galaxy | 161 · 170 · 214 · **16** | 63,5 · **5** · 41,5 · 38 | ne cite pas le floral |
| Mosaic | 223,5 · 111 · 180 · 68 | 113,5 · **32** · 60 · 52 | 147,5 · 153 · 153 · **60** |
| Hallertau Blanc | 183,5 · **97** · 161 · 106 | 78,5 · **46** · 82 · 76 | 129,5 · 150 · 150 · **107** |
| Cascade | 232 · **11** · **12** · 74 | 122 · 83 · 117 · **71** | 153 · **44** · 90 · 62 |
Aujourd'hui (`aucun`), à 10′, Citra est 221e sur 233 en agrumes et Cascade 232e : le rang vient de la dérive d'IBU (α), pas de l'arôme. Les trois clés remontent presque tous les phares ; **ce qui coule** :
- **Motueka, en tropical à 10′** : 4e aujourd'hui, 72e (k1), 80e (k2), 54e (k3) sur 123. Son 4e rang d'aujourd'hui vient de sa faible α (dérive d'IBU minimale), pas de son arôme : le coulage est la fin d'un artefact. Mais Motueka est « ultra fruité » : aucune clé ne le place haut en tropical. Il est 6e et 7e en agrumes (k1, k2). Cause probable : peu de fiches le marquent tropical, et le radar lui donne 2 sur 5.
- **Galaxy, en agrumes à 10′** : 161e aujourd'hui, **170e (k1) et 214e (k2)** : k1 et k2 la coulent ; k3 la place 16e. Cause non vérifiée (je n'ai pas relu ses fiches) : sans doute moins de fiches qui la marquent agrumes que Citra ou Cascade.
- **Mosaic en floral** : k1 et k2 la mettent 153e sur 154, k3 60e. **Hallertau Blanc en floral** : 150e (k1, k2), 107e (k3).
- **Nelson Sauvin** : aucune clé ne le coule par rapport à aujourd'hui (il remonte de 101e à 45e, k1, en tropical) ; aucune ne le place dans les 10 premiers, ni en tropical (45e à 81e sur 123), ni en agrumes (153e à 158e). Sa réputation (vin blanc, groseille à maquereau) est hors des 12 familles : c'est la limite déjà connue de [[descripteurs-hors-familles]] ; le départage ne la lève pas. Aucune clé ne rejoue « Nelson Sauvin est ordinaire » : elle ne l'aggrave pas non plus.

### 1.2 Stout, au dry hop
Le rang vient surtout du style (débordement de bande), en amont : les groupes d'ex æquo y sont petits (2 à 39), la clé ne les sort pas de leur groupe. Citra 216 → 215 (k1, k3) ; Nelson Sauvin 199,5 → 200 ; Cascade 232,5 → 232 ; Mosaic 226,5 → 226 à 227. **Motueka (groupe de 39) : 34e → 15e (k1), 16e (k2), 20e (k3).** Aucun houblon ne coule. Le dry hop d'une stout n'est pas un cas où la liste se fait par l'arôme.

### 1.3 21C (Hazy IPA) : seuls Citra et Galaxy entrent
| cas | Citra aucun · k1 · k2 · k3 | Galaxy aucun · k1 · k2 · k3 |
|---|---|---|
| agrumes, dry hop (93) | 70,5 · 59 · 68 · 54,5 | 12 · 10 · 22 · **4,5** |
| agrumes, 10′ | 78,5 · 33 · 70,5 · **25** | 19,5 · 10 · 22 · **7** |
| tropical, dry hop (52) | 43,5 · 40 · 41,5 · 38,5 | 9 · **1** · 8,5 · 7 |
| tropical, 10′ | 47,5 · **22** · 38 · 26 | 16 · **1** · 15 · 8 |
| floral, dry hop (50) | 28,5 · 26 · 38,5 · **24** | ne cite pas le floral |
| floral, 10′ | 37 · 23 · 49 · **18** | idem |
Le premier groupe d'ex æquo, dry hop : agrumes 23 → **1** (k1), 17 (k2), **1** (k3) ; tropical 17 → 1, 16, 3 ; floral 17 → 1, 13, 2. Le jugement par réputation sur la 21C est limité à ces deux houblons : Citra est loin de la tête en agrumes sur une Hazy (54e à 70e) parce que le style pénalise ses autres familles (débordement), pas à cause de la clé.

Listes à la tête (agrumes, 21C, dry hop) : aujourd'hui, ordre alphabétique de 23 ex æquo (African Queen, Belma, Galaxy, Herald…) ; k1 : Satus, Herald, Multihead, Shaddock, Southern Sublime… ; k2 : 17 ex æquo, Herald, Medusa, Multihead… ; k3 : NZH-107 (radar 5), puis Galaxy, Medusa, Nectaron, Samba, Trident, Zamba Blend (radar 4). Les 10 listes complètes : `departage.json`, partie D.

## 2. Provenance du départage : d'où vient la séparation ?
Parmi les variétés qui citent la famille, chaque paire est séparée à la première étape où ses deux valeurs diffèrent.

| famille (variétés) | clé | paires | séparées par… | ex æquo restants | valeurs distinctes · plus grand groupe |
|---|---|---|---|---|---|
| agrumes (233) | k1 | 27 028 | marquée 10 710 · premier 5 704 · part 6 745 · niveau du signal 1 617 · **huile totale 2 008 · signal 164** | 80 | 183 · 7 |
| | k2 | | part 17 995 · signal propre 2 696 | **6 337 (23 %)** | 63 · **110** |
| | k3 | | radar 21 067 | 5 961 (22 %) | 7 · 79 |
| tropical (123) | k1 | 7 503 | marquée 3 320 · premier 1 566 · part 1 737 · niveau 117 · **huile totale 734** · signal 3 | 26 | 107 · 5 |
| | k2 | | part 5 438 · signal 148 | **1 917 (26 %)** | 36 · 61 |
| | k3 | | radar 6 152 | 1 351 | 7 · 37 |
| floral (154) | k1 | 11 781 | marquée 5 733 · premier 1 888 · part 3 303 · niveau 241 · huile totale 569 · signal 32 | 15 | 140 · 3 |
| | k2 | | part 9 686 · signal 510 | 1 585 (13 %) | 54 · 50 |
| | k3 | | radar 9 468 | 2 313 | 6 · 46 |
| résineux (134) | k1 | 8 911 | marquée 4 408 · premier 1 344 · part 2 597 · niveau 219 · huile totale 45 · **signal 290** | 8 | 127 · 3 |
| | k2 | | part 7 455 · signal 1 341 | 115 (1 %) | 104 · 14 |
| | k3 | | radar 7 187 | 1 724 | 6 · 41 |

À lire :
- **k1 : 86 à 94 % des séparations viennent des trois étapes de vocabulaire** (agrumes 86 % : 23 159 sur 26 948 ; tropical 89 % ; floral 93 % ; résineux 94 %). C'est ce que le Brasseur et le Contradicteur redoutaient : la clé lit les mots, pas la puissance. La valeur d'huile (étape 5) ne sépare que 8 % des paires en agrumes, 10 % en tropical, 5 % en floral, 4 % en résineux (dont 290 paires par le myrcène).
- **Pour k1, les 179 valeurs d'agrumes** (le chiffre de g1 ; ici 183 sur les 233 variétés qui la citent : ma part des fiches est comparée à 4 décimales, celle de g1 à 2) : **131 viennent de l'huile totale** à l'étape 4 (niveau 1), 50 d'un signal propre, 2 d'aucune donnée. Pour le tropical : 80 sur 107 viennent de l'huile totale. Pour le floral : 96 sur 140. Seul le résineux est servi par un signal propre (110 sur 127). **L'huile totale est un mauvais proxy de l'agrume** (g1, § 1.4) : elle intervient ici pour 2 008 paires d'agrumes sur 27 028.
- **k2 laisse de gros groupes d'ex æquo** : 110 houblons en agrumes, 61 en tropical, 50 en floral (le signal propre ne couvre que 59 à 64 variétés). C'est honnête : ils restent ex æquo et `tieWith` les signale.
- **k3 : 12 166 des 21 067 paires d'agrumes sont séparées par un inconnu face à un connu**, soit 58 % (radar absent pour 137 variétés sur 318, k3 les range après). Cette moitié de l'ordre vient de la couverture des données, pas d'une mesure. Seulement 6 à 7 valeurs distinctes (entiers de 0 à 5, moyennés) : groupes de 79, 37, 46, 41.

## 3. Le banc de 66 houblons de g1, en deux moitiés (L20)
Même échantillon (graine 181, 66 houblons), même visée (familles marquées de X), base neutre. Le banc `aucun` rejoue g1 : premier groupe médian 53, 5 groupes, X dans les 10 : 4 sur 66, rappel@10 1,1 %. Moitiés : ids triés, rang pair = A, rang impair = B (33 chacune). Choix sur une moitié : plus petit premier groupe médian, puis plus petit rang médian de X.
Colonnes : premier groupe médian · rang médian de X · X dans les 10 · rappel@10 (indicatif).

**Dry hop**
| clé | moitié A | moitié B | 66 |
|---|---|---|---|
| aucun | 68 · 34,5 · 3 · 0,6 % | 53 · 27 · 1 · 1,5 % | 53 · 27 · 4 · 1,1 % |
| k1 | **1** · **12** · **15** · 17,6 % | **1** · **6** · **22** · 23,2 % | 1 · 9 · 37 · 20,4 % |
| k2 | 4 · 16,5 · 11 · 5,5 % | 5 · 11,5 · 15 · 5,2 % | 5 · 15 · 26 · 5,3 % |
| k3 | 2 · 29 · 6 · 2,5 % | 2 · 25,5 · 8 · 12,2 % | 2 · 28 · 14 · 7,3 % |

**10′**
| clé | moitié A | moitié B | 66 |
|---|---|---|---|
| aucun | 1 · 18 · 12 · 20,5 % | 1 · 28 · 5 · 18,4 % | 1 · 25,3 · 17 · 19,5 % |
| k1 | 1 · 12 · 15 · 17,6 % | 1 · 6 · 22 · 23,2 % | 1 · 9 · 37 · 20,4 % |
| k2 | 1 · 15 · 13 · 6,5 % | 1 · 11 · 15 · 6,9 % | 1 · 13 · 28 · 6,7 % |
| k3 | 1 · 23 · 8 · 10,8 % | 1 · 28 · 7 · 14,7 % | 1 · 25,5 · 15 · 12,8 % |

**Protocole : choisie sur A, jugée sur B ; choisie sur B, jugée sur A : k1 dans les deux sens, aux deux moments** (premier groupe 1, rang de X 6 puis 12 contre 27 et 34,5 pour `aucun`).

**Mais ce banc est circulaire pour k1, et je ne m'y fie pas :**
- la visée du banc est « les familles que les fiches de X marquent » ; la première étape de k1 est « la fiche du houblon marque la famille ». Il retrouve donc X parce qu'il lit les mêmes fiches (37 sur 66 dans les 10 premiers) ;
- le seul chiffre qui ne vient pas des fiches est le rappel@10 des substituts Beer Maverick. À 10′ il **ne bouge pas** : 20,4 % (k1) contre 19,5 % (`aucun`). Il monte au dry hop (20,4 % contre 1,1 %), où `aucun` classe par ordre alphabétique ; mais g1 a déjà dit qu'à 10′ le 19,5 % d'`aucun` est lui-même un artefact (l'α).
- k3, qui ne lit pas les mêmes mots que la visée, rend 12,8 % à 10′ (7,3 % au dry hop). k2 : 6,7 % et 5,3 %.
Le banc ne prouve donc pas que k1 classe mieux, seulement qu'il départage et suit le vocabulaire des fiches.

## 4. Limites et doutes
- Le jugement par réputation (§ 1) est le mien, sur sept houblons ; **le brasseur juge les 10 listes** (`departage.json`, D) : pas de défaut tant qu'il ne les a pas vues.
- Le départage ne sort pas un houblon de son groupe de distance : sur une stout au dry hop, le style décide déjà (§ 1.2).
- **Place de la clé** : après la distance, avant le stock et la dérive d'IBU (choix de g1). Conséquence à décider : à distance égale, une voie « à acheter » avec une bonne clé passe devant une voie du stock ; à 10′, la clé remplace la dérive d'IBU (l'α) comme critère d'ordre (g1 : « un classement d'amérisants déguisé »). Placer la clé après le stock est possible en une ligne.
- Le banc de 60′ n'est pas rejoué : g1 a montré que la dérive d'IBU y est le critère, et le départage d'arôme n'y a pas de sens (a2).
- `proposeVoies` appelé par l'écran ne passe pas l'option : l'adaptateur (`parcours/adaptateur.ts`), le client async et le worker devront la transmettre le jour du basculement (hors de ma voie).
- La règle de pool qui écarte Cascade, Mosaic, Nelson Sauvin d'une Hazy IPA (§ 1) n'est pas dans ma voie : à décider.
