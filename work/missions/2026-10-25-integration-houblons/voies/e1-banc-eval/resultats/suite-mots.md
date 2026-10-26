# Suite e1 : l’option « mots » mise à l’épreuve (#181)

Généré par `scripts/eval-hop/suite-mots.ts`, déterministe, hors ligne ; mesure seulement (`src/domain` intact). Mêmes houblons, même référence que `rapport.md`. Variante : l’arôme d’un candidat devient λ × arôme du moteur + (1 − λ) × 100 × cosinus des mots (pondérés par la rareté log(N/df)) ; λ = 1 est le moteur. Dry hop (les classements de 10′, whirlpool et dry hop sont identiques). Réplique hors ligne sur les composantes rendues (entiers) : ±1 rang possible hors λ = 1.

Protocole : parité de l’indice du houblon parmi les 217 triés par id : 0 apprentissage (109), 1 contrôle (108). Pour chaque variante, λ est choisi sur la moitié 0 (meilleur MRR ; à égalité, le plus grand λ) puis jugé sur la moitié 1, et inversement. Intervalles à 95 % : 1000 rééchantillonnages des houblons (graine 181) ; l’écart au moteur est apparié (mêmes houblons tirés).

## 1. λ choisi sur une moitié, jugé sur l’autre

### tous les mots

λ choisi sur la moitié 0 : **0.25** (jugé sur la moitié 1) ; choisi sur la moitié 1 : **0** (jugé sur la moitié 0).

Moitié 1 (contrôle de λ choisi sur la moitié 0) :

| λ | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart au moteur [IC 95 %] : MRR · rappel@10 · rang |
|---|---|---|---|---|
| λ=1 | 0,112 [0,079 ; 0,149] | 0,119 [0,077 ; 0,171] | 26,5 [19,5 ; 36] | (moteur) |
| λ=0.75 | 0,167 [0,119 ; 0,225] | 0,145 [0,097 ; 0,197] | 21,5 [14,5 ; 26,5] | [0,025 ; 0,093] · [0,004 ; 0,054] · [-11 ; -2] |
| λ=0.5 | 0,195 [0,143 ; 0,258] | 0,171 [0,123 ; 0,223] | 17 [12 ; 21,5] | [0,043 ; 0,129] · [0,019 ; 0,085] · [-17 ; -5] |
| λ=0.25 | 0,238 [0,181 ; 0,302] | 0,216 [0,164 ; 0,275] | 12 [7,5 ; 17] | [0,072 ; 0,183] · [0,055 ; 0,144] · [-24 ; -8] |
| λ=0 | 0,252 [0,191 ; 0,319] | 0,232 [0,174 ; 0,296] | 11 [8 ; 15] | [0,075 ; 0,205] · [0,06 ; 0,168] · [-25 ; -8] |

Moitié 0 (contrôle de λ choisi sur la moitié 1) :

| λ | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart au moteur [IC 95 %] : MRR · rappel@10 · rang |
|---|---|---|---|---|
| λ=1 | 0,129 [0,09 ; 0,174] | 0,099 [0,063 ; 0,14] | 27 [19 ; 42] | (moteur) |
| λ=0.75 | 0,144 [0,104 ; 0,19] | 0,127 [0,086 ; 0,174] | 21 [15 ; 35] | [-0,007 ; 0,036] · [0,006 ; 0,057] · [-11 ; -1] |
| λ=0.5 | 0,16 [0,119 ; 0,206] | 0,145 [0,103 ; 0,193] | 17 [11 ; 30] | [-0,002 ; 0,065] · [0,021 ; 0,079] · [-16 ; -1] |
| λ=0.25 | 0,166 [0,122 ; 0,211] | 0,134 [0,095 ; 0,18] | 16 [12 ; 29] | [-0,004 ; 0,079] · [-0,004 ; 0,075] · [-18 ; -1] |
| λ=0 | 0,163 [0,117 ; 0,214] | 0,121 [0,082 ; 0,162] | 21 [14 ; 27] | [-0,017 ; 0,085] · [-0,021 ; 0,067] · [-18 ; 2] |

### mots hors famille seulement

λ choisi sur la moitié 0 : **1** (jugé sur la moitié 1) ; choisi sur la moitié 1 : **0.75** (jugé sur la moitié 0).

Moitié 1 (contrôle de λ choisi sur la moitié 0) :

| λ | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart au moteur [IC 95 %] : MRR · rappel@10 · rang |
|---|---|---|---|---|
| λ=1 | 0,112 [0,079 ; 0,149] | 0,119 [0,077 ; 0,171] | 26,5 [19,5 ; 36] | (moteur) |
| λ=0.75 | 0,127 [0,088 ; 0,173] | 0,112 [0,069 ; 0,161] | 29,5 [19,5 ; 38] | [-0,013 ; 0,048] · [-0,022 ; 0,006] · [-3 ; 8] |
| λ=0.5 | 0,123 [0,082 ; 0,175] | 0,108 [0,065 ; 0,156] | 32,5 [24 ; 36] | [-0,028 ; 0,054] · [-0,033 ; 0,009] · [-2,5 ; 11,5] |
| λ=0.25 | 0,113 [0,075 ; 0,16] | 0,083 [0,05 ; 0,123] | 35,5 [27 ; 39] | [-0,038 ; 0,044] · [-0,073 ; -0,004] · [-0,5 ; 15] |
| λ=0 | 0,093 [0,06 ; 0,135] | 0,074 [0,04 ; 0,116] | 36 [26 ; 51] | [-0,057 ; 0,021] · [-0,082 ; -0,013] · [0 ; 22,5] |

Moitié 0 (contrôle de λ choisi sur la moitié 1) :

| λ | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart au moteur [IC 95 %] : MRR · rappel@10 · rang |
|---|---|---|---|---|
| λ=1 | 0,129 [0,09 ; 0,174] | 0,099 [0,063 ; 0,14] | 27 [19 ; 42] | (moteur) |
| λ=0.75 | 0,121 [0,086 ; 0,163] | 0,107 [0,071 ; 0,148] | 24 [18 ; 39] | [-0,035 ; 0,018] · [-0,005 ; 0,024] · [-8 ; 5] |
| λ=0.5 | 0,112 [0,081 ; 0,15] | 0,099 [0,064 ; 0,138] | 25 [18 ; 39] | [-0,051 ; 0,013] · [-0,031 ; 0,023] · [-9 ; 7] |
| λ=0.25 | 0,104 [0,073 ; 0,142] | 0,081 [0,05 ; 0,119] | 28 [22 ; 44] | [-0,062 ; 0,008] · [-0,05 ; 0,009] · [-7 ; 16] |
| λ=0 | 0,104 [0,069 ; 0,142] | 0,078 [0,046 ; 0,114] | 37 [22 ; 55] | [-0,065 ; 0,011] · [-0,051 ; 0,006] · [-4 ; 27] |

## 2. Candidats remontés par un seul mot

Au réglage λ = 0.25 sans garde, sur les 318 houblons pris comme original : 1878 candidats entrent dans les 10 premiers sans y être avec le moteur ; **408** n’ont qu’un seul mot partagé avec l’original, 15 aucun (ils montent parce que d’autres redescendent). Exemples parmi les mots les plus rares :

| original | candidat | rang | rang du moteur | mot partagé | rareté (idf) |
|---|---|---|---|---|---|
| Relax | Michigan Copper | 10 | 38 | hibiscus | 4,67 |
| Wurttemberg | Marco Polo | 6 | 186 | oregano | 4,67 |
| Akoya | BRU-1 | 7 | 173 | green fruit | 4,38 |
| Akoya | TNT Blend | 2 | 84 | green fruit | 4,38 |
| Gemini | Idaho 7 | 7 | 33 | black tea | 4,38 |
| Monroe | Yakima Gold | 7 | 96 | smooth | 4,38 |
| Pahto | Yakima Gold | 5 | 210 | smooth | 4,38 |
| TNT Blend | Akoya | 2 | 58 | green fruit | 4,38 |
| Emerald Spire | Gemini | 10 | 27 | honeydew | 4,16 |
| Gaia | Sylva | 4 | 217 | hoppy | 4,16 |
| Gaia | Willamette | 9 | 107 | hoppy | 4,16 |
| Gemini | Emerald Spire | 4 | 42 | honeydew | 4,16 |

Les mots « dank » et « cannabis » (hors famille, ceux de Columbus) font entrer 26 candidats, presque tous avec plusieurs mots partagés (Chinook, Summit, Galaxy, Amarillo, Columbus… entre eux) : ils rapprochent des houblons que le brasseur dit « dank » ; un seul entrant partage « dank » seul (African Queen → Chinook).

Gardes mesurées à ce λ (mots de toutes les fiches) :

| garde | entrants dans les 10 | dont un seul mot | dont aucun | MRR contrôle [IC] | rappel@10 contrôle [IC] | rang médian contrôle [IC] | MRR tous |
|---|---|---|---|---|---|---|---|
| aucune | 1878 | 408 | 15 | 0,238 [0,181 ; 0,302] | 0,216 [0,164 ; 0,275] | 12 [7,5 ; 17] | 0,202 |
| au moins 2 mots partagés | 1844 | 57 | 59 | 0,248 [0,191 ; 0,314] | 0,228 [0,176 ; 0,287] | 12 [7 ; 15] | 0,208 |
| plafond de rareté (un mot compte au moins comme df = 8) | 1888 | 377 | 14 | 0,24 [0,183 ; 0,308] | 0,22 [0,169 ; 0,28] | 12 [8,5 ; 17] | 0,204 |
| les deux | 1885 | 48 | 58 | 0,25 [0,192 ; 0,317] | 0,236 [0,181 ; 0,299] | 10,5 [7 ; 16] | 0,211 |

## 3. Pourquoi Nelson Sauvin, Motueka, Riwaka et Hallertau Blanc bougent

Mots de Nelson Sauvin : agrumes, fruity, fruité, gooseberry, grape, grapes, sauvignon blanc, white wine, épicé. Hors famille : fruity, fruité, gooseberry, grape, grapes, sauvignon blanc, white wine.

**Hallertau Blanc** (cosinus des 12 familles 0,53) — mots : agrumes, cassis, clean, coffee, fruité, gooseberry, grapes, lemongrass, passion fruit, pineapple, sauvignon blanc, white wine, épicé.

| variante | rang λ=1 | rang λ=0.75 | rang λ=0.5 | rang λ=0.25 | rang λ=0 | arôme (moteur → λ=0,25) | mots partagés |
|---|---|---|---|---|---|---|---|
| tous les mots | 155 | 94 | 40 | 2 | 1 | 53 → 58 | agrumes, fruité, gooseberry, grapes, sauvignon blanc, white wine, épicé |
| hors famille seulement | 155 | 98 | 63 | 35 | 27 | 53 → 61 | fruité, gooseberry, grapes, sauvignon blanc, white wine |

**Enigma** (cosinus des 12 familles 0) — mots : berry, raspberry, redcurrant, stone fruit, tropical fruit, white wine.

| variante | rang λ=1 | rang λ=0.75 | rang λ=0.5 | rang λ=0.25 | rang λ=0 | arôme (moteur → λ=0,25) | mots partagés |
|---|---|---|---|---|---|---|---|
| tous les mots | 244 | 223 | 180 | 92 | 10 | 0 → 12 | white wine |
| hors famille seulement | 244 | 218 | 150 | 69 | 35 | 0 → 28 | white wine |

**Motueka** (cosinus des 12 familles 0,67) — mots : agrumes, citrus, floral, fresh lime, fruité, lemon, lemon zest, lime, mojito, tropical fruit.

| variante | rang λ=1 | rang λ=0.75 | rang λ=0.5 | rang λ=0.25 | rang λ=0 | arôme (moteur → λ=0,25) | mots partagés |
|---|---|---|---|---|---|---|---|
| tous les mots | 89 | 85 | 102 | 130 | 174 | 67 → 24 | agrumes, fruité |
| hors famille seulement | 89 | 102 | 146 | 174 | 218 | 67 → 24 | fruité |

**Riwaka** (cosinus des 12 familles 0,5) — mots : agrumes, citrus, fruité, grapefruit, lime, passion fruit, tropical fruit.

| variante | rang λ=1 | rang λ=0.75 | rang λ=0.5 | rang λ=0.25 | rang λ=0 | arôme (moteur → λ=0,25) | mots partagés |
|---|---|---|---|---|---|---|---|
| tous les mots | 206 | 208 | 210 | 204 | 199 | 50 → 25 | agrumes, fruité |
| hors famille seulement | 206 | 209 | 212 | 215 | 219 | 50 → 29 | fruité |

Motueka comme original (ses mots : agrumes, citrus, floral, fresh lime, fruité, lemon, lemon zest, lime, mojito, tropical fruit) : Saaz (US) → λ=1 : 291e, λ=0.75 : 291e, λ=0.5 : 291e, λ=0.25 : 289e, λ=0 : 279e (mots partagés : aucun) ; Sterling → λ=1 : 198e, λ=0.75 : 184e, λ=0.5 : 159e, λ=0.25 : 112e, λ=0 : 42e (mots partagés : floral).

## 4. Réglages retenus, sur toutes les mesures

| réglage | jeu | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart au moteur [IC 95 %] : MRR · rappel@10 · rang |
|---|---|---|---|---|---|
| retenu : λ = 0.25, garde ≥ 2 mots, plafond df 8 | moitié 0 | 0,173 [0,126 ; 0,224] | 0,154 [0,114 ; 0,2] | 18 [10 ; 27] | [-0,001 ; 0,089] · [0,025 ; 0,094] · [-18 ; 0] |
| retenu : λ = 0.25, garde ≥ 2 mots, plafond df 8 | moitié 1 | 0,25 [0,192 ; 0,317] | 0,236 [0,181 ; 0,299] | 10,5 [7 ; 16] | [0,079 ; 0,203] · [0,072 ; 0,169] · [-25 ; -8,5] |
| retenu : λ = 0.25, garde ≥ 2 mots, plafond df 8 | tous | 0,211 [0,174 ; 0,254] | 0,195 [0,158 ; 0,235] | 13 [9 ; 18] | [0,054 ; 0,13] · [0,056 ; 0,116] · [-19 ; -8] |
| prudent : λ = 0.5, garde ≥ 2 mots, plafond df 8 | moitié 0 | 0,173 [0,129 ; 0,221] | 0,164 [0,12 ; 0,216] | 16 [10 ; 30] | [0,011 ; 0,077] · [0,038 ; 0,1] · [-17 ; 1] |
| prudent : λ = 0.5, garde ≥ 2 mots, plafond df 8 | moitié 1 | 0,208 [0,156 ; 0,272] | 0,188 [0,139 ; 0,241] | 15 [10 ; 19] | [0,05 ; 0,144] · [0,036 ; 0,105] · [-20 ; -6,5] |
| prudent : λ = 0.5, garde ≥ 2 mots, plafond df 8 | tous | 0,191 [0,154 ; 0,227] | 0,176 [0,141 ; 0,213] | 15 [11 ; 23] | [0,043 ; 0,099] · [0,045 ; 0,091] · [-17 ; -7] |

Listes avant/après pour 11 houblons : `listes-lambda.json`.

