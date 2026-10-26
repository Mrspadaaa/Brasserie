# Moteur v2 de Substituer : mesure hors ligne (#181, D80)

Généré par `scripts/eval-hop/moteur-v2.ts` (formule : `formuleV2.ts`), déterministe, hors ligne ; `src/domain` n'est pas touché par ce rapport. Mesure sur 217 houblons qui ont des substituts Beer Maverick reliés au catalogue : 109 pour apprendre (parité 0), 108 pour juger (parité 1). Intervalles à 95 % : 1000 rééchantillonnages des houblons (graine 181) ; un écart est apparié (mêmes houblons tirés). Hasard au contrôle : MRR 0,047, rappel@10 0,036, rang médian 73.

## 1. La formule v2

- Une ressemblance par variable, entre 0 et 1. Moyenne pondérée des variables **connues des deux houblons** : un inconnu sort du calcul (jamais 0) ; poids renormalisés.
- Quatorze variables : α, β, cohumulone, usage, huile totale, myrcène, humulène, caryophyllène, farnésène, linalol, géraniol, familles, mots, radar BM. Valeurs : le catalogue d'abord, sinon l'enveloppe valide de `complements.json` (borne seule ou [0, 0] : inconnu).
- Trois jeux de poids : amertume (premier moût, 60′, 30′, 15′), arôme chaud (10′, whirlpool), à froid (dry hop). Poids de groupe (amertume, huile, arôme) et part des mots appris sur la moitié d'apprentissage ; poids à l'intérieur d'un groupe fixés à la main :

| moment | amertume : α · β · cohumulone · usage | huile : totale · myrcène · humulène · caryophyllène · farnésène · linalol · géraniol |
|---|---|---|
| amertume (60′ ; premier moût, 30′, 15′) | 0.4 · 0.2 · 0.2 · 0.2 | 0.25 · 0.05 · 0.3 · 0.25 · 0.05 · 0.05 · 0.05 |
| arôme chaud (10′, whirlpool) | 0.3 · 0.2 · 0.1 · 0.4 | 0.2 · 0.15 · 0.15 · 0.1 · 0.1 · 0.2 · 0.1 |
| à froid (dry hop) | 0.25 · 0.15 · 0.1 · 0.5 | 0.25 · 0.1 · 0.1 · 0.05 · 0.1 · 0.25 · 0.15 |

- Arôme : familles (cosinus ; à l'amertume, la part non étrangère, comme aujourd'hui), mots fins (cosinus pondéré par la rareté, garde de 2 mots partagés : le réglage C de e1), radar Beer Maverick (poids 0,1 du groupe quand les deux l'ont : c'est la donnée de la référence). Aux moments d'arôme, la part des mots est apprise (0,25 / 0,5 / 0,75) ; à l'amertume les mots et le radar ne comptent pas.
- Classement : mêmes clés que le moteur actuel (couverture faible derrière ; à l'amertume, produit d'arôme ou houblon aromatique derrière ; score entier ; nom). La réplique de A hors ligne reproduit l'ordre de `substitutes()` pour les 318 originaux aux 3 moments (vérifié par le script, il s'arrête sinon).

### Couverture des données

| variable | catalogue | compléments | inconnu |
|---|---|---|---|
| alpha | 318 | 0 | 0 |
| beta | 311 | 0 | 7 |
| cohumulone | 287 | 0 | 31 |
| usage | 318 | 0 | 0 |
| huile | 301 | 0 | 17 |
| myrcène | 257 | 0 | 61 |
| humulène | 251 | 0 | 67 |
| caryophyllène | 237 | 0 | 81 |
| farnésène | 249 | 0 | 69 |
| linalol | 64 | 0 | 254 |
| géraniol | 0 | 0 | 318 |
| familles | 299 | 0 | 19 |
| mots | 302 | 0 | 16 |
| radar | 181 | 0 | 137 |

Sur 318 houblons. Le géraniol et le linalol sont les variables rares : ils ne comptent que lorsque les deux fiches les ont.

## 2. Poids appris (moitié d'apprentissage)

| réglage | moment | poids de groupe | part des mots | MRR apprentissage |
|---|---|---|---|---|
| v2 (contraint) | amertume (60′ ; premier moût, 30′, 15′) | amertume 0.7 · huile 0.2 · arôme 0.1 | – | 0,286 |
| v2 (contraint) | arôme chaud (10′, whirlpool) | amertume 0.3 · huile 0.2 · arôme 0.5 | 0.75 | 0,280 |
| v2 (contraint) | à froid (dry hop) | amertume 0.2 · huile 0.3 · arôme 0.5 | 0.75 | 0,264 |
| v2 libre | amertume (60′ ; premier moût, 30′, 15′) | amertume 0.7 · huile 0.2 · arôme 0.1 | – | 0,286 |
| v2 libre | arôme chaud (10′, whirlpool) | amertume 0.4 · huile 0.2 · arôme 0.4 | 0.75 | 0,285 |
| v2 libre | à froid (dry hop) | amertume 0.5 · huile 0.2 · arôme 0.3 | 0.5 | 0,270 |

Le réglage libre (aucune contrainte) montre où va la référence (a) quand on la laisse faire : vers l'α et l'usage, comme l'avait montré e1. v2 est donc appris sous une contrainte a priori de brasseur. Amertume : le groupe amertume pèse au moins 0,4, appris sur les 20 amérisants de la moitié d'apprentissage (usage BM bittering) ; garde-fou : appris sur tous les houblons, poids amertume 0.5 · huile 0.4 · arôme 0.1. Moments d'arôme : quatre contraintes a priori essayées (§ 2 bis), et v2 prend la meilleure sur la moitié d'apprentissage dont la liste D est retrouvée (à froid, dans les 10 premiers) aux trois quarts de l'écart A → C : 11 (A) → 16 (C) sur 24, seuil 15. Familles retenues : arôme chaud k1, à froid k3.

### 2 bis. Tous les réglages essayés

Aux moments d'arôme : tous les houblons au contrôle. À l'amertume : les amérisants au contrôle (colonne « tous » : MRR sur les 108 houblons). (b) : les 24 houblons de D parmi les 10 premiers (A et C : voir § 5, seuls les moments d'arôme ont un (b)).

| moment | famille d'a priori | poids de groupe (amertume · huile · arôme), part des mots | MRR appr. | MRR contrôle | écart à A [IC] | écart à C [IC] | rappel@10 | (b) dans les 10 | (b) rang médian | |
|---|---|---|---|---|---|---|---|---|---|---|
| amertume (60′ ; premier moût, 30′, 15′) | k1 : amertume ≤ 0,3 | 0.7 · 0.2 · 0.1 | 0,286 | 0,276 (tous : 0,162) | +0,080 [0,019 ; 0,153] | +0,080 [0,019 ; 0,153] | 0,262 | 3 | 72 | **retenu** |
| amertume (60′ ; premier moût, 30′, 15′) | libre : aucune contrainte | 0.7 · 0.2 · 0.1 | 0,286 | 0,276 (tous : 0,162) | +0,080 [0,019 ; 0,153] | +0,080 [0,019 ; 0,153] | 0,262 | 3 | 72 |  |
| arôme chaud (10′, whirlpool) | k1 : amertume ≤ 0,3 | 0.3 · 0.2 · 0.5, 0.75 | 0,280 | 0,282 | +0,099 [0,031 ; 0,170] | +0,050 [0,011 ; 0,091] | 0,287 | 16 | 5 | **retenu** |
| arôme chaud (10′, whirlpool) | k2 : amertume ≤ 0,3 et arôme ≥ 0,4 | 0.3 · 0.2 · 0.5, 0.75 | 0,280 | 0,282 | +0,099 [0,031 ; 0,170] | +0,050 [0,011 ; 0,091] | 0,287 | 16 | 5 |  |
| arôme chaud (10′, whirlpool) | k3 : amertume ≤ 0,2 et arôme ≥ 0,5 | 0.2 · 0.3 · 0.5, 0.75 | 0,266 | 0,280 | +0,098 [0,037 ; 0,164] | +0,049 [0,013 ; 0,082] | 0,328 | 15 | 5,5 |  |
| arôme chaud (10′, whirlpool) | k4 : arôme ≥ 0,6 (comme A et C) | 0.2 · 0.2 · 0.6, 0.75 | 0,262 | 0,267 | +0,084 [0,022 ; 0,149] | +0,035 [0,002 ; 0,067] | 0,284 | 15 | 5 |  |
| arôme chaud (10′, whirlpool) | libre : aucune contrainte | 0.4 · 0.2 · 0.4, 0.75 | 0,285 | 0,293 | +0,111 [0,045 ; 0,187] | +0,062 [0,017 ; 0,104] | 0,290 | 15 | 6 |  |
| à froid (dry hop) | k1 : amertume ≤ 0,3 | 0.2 · 0.4 · 0.4, 0.75 | 0,268 | 0,301 | +0,119 [0,059 ; 0,189] | +0,069 [0,026 ; 0,111] | 0,309 | 13 | 7 |  |
| à froid (dry hop) | k2 : amertume ≤ 0,3 et arôme ≥ 0,4 | 0.2 · 0.4 · 0.4, 0.75 | 0,268 | 0,301 | +0,119 [0,059 ; 0,189] | +0,069 [0,026 ; 0,111] | 0,309 | 13 | 7 |  |
| à froid (dry hop) | k3 : amertume ≤ 0,2 et arôme ≥ 0,5 | 0.2 · 0.3 · 0.5, 0.75 | 0,264 | 0,297 | +0,114 [0,052 ; 0,183] | +0,065 [0,023 ; 0,109] | 0,324 | 14 | 5,5 | **retenu** |
| à froid (dry hop) | k4 : arôme ≥ 0,6 (comme A et C) | 0.2 · 0.2 · 0.6, 0.75 | 0,247 | 0,273 | +0,091 [0,027 ; 0,159] | +0,042 [0,004 ; 0,078] | 0,282 | 14 | 6 |  |
| à froid (dry hop) | libre : aucune contrainte | 0.5 · 0.2 · 0.3, 0.5 | 0,270 | 0,307 | +0,125 [0,062 ; 0,198] | +0,076 [0,027 ; 0,129] | 0,287 | 12 | 11 |  |

## 3. Contre (a), les substituts Beer Maverick, sur la moitié de contrôle

(a) ressemble à la formule de Beer Maverick (fuite) : un gain ici ne dit pas la justesse pour le brasseur. Lecture : MRR = moyenne de 1/rang du premier substitut ; rappel@10 = part des substituts dans les 10 premiers.

### amertume (60′ ; premier moût, 30′, 15′) — tous les houblons (contrôle, n = 108)

| méthode | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart à A : MRR [IC] | écart à C : MRR [IC] |
|---|---|---|---|---|---|
| A (actuel) | 0,102 [0,070 ; 0,143] | 0,130 [0,083 ; 0,184] | 32,5 [26,5 ; 44,5] | – | – |
| C (mots, λ 0,25) | 0,102 [0,070 ; 0,143] | 0,130 [0,083 ; 0,184] | 32,5 [26,5 ; 44,5] | 0,000 [0,000 ; 0,000] | – |
| v2 | 0,162 [0,113 ; 0,221] | 0,168 [0,112 ; 0,226] | 27 [16 ; 43] | +0,060 [0,034 ; 0,092] | +0,060 [0,034 ; 0,092] |
| v2 libre (sans contrainte) | 0,162 [0,113 ; 0,221] | 0,168 [0,112 ; 0,226] | 27 [16 ; 43] | +0,060 [0,034 ; 0,092] | +0,060 [0,034 ; 0,092] |
| v2 (amertume apprise sur tous) | 0,164 [0,113 ; 0,223] | 0,165 [0,110 ; 0,224] | 29,5 [16 ; 38] | +0,062 [0,026 ; 0,100] | +0,062 [0,026 ; 0,100] |

Moitié d'apprentissage (n = 109) : A (actuel) MRR 0,121 ; C (mots, λ 0,25) MRR 0,121 ; v2 MRR 0,159 ; v2 libre (sans contrainte) MRR 0,159 ; v2 (amertume apprise sur tous) MRR 0,159.

### amertume (60′ ; premier moût, 30′, 15′) — amérisants (usage BM : bittering) (contrôle, n = 17)

| méthode | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart à A : MRR [IC] | écart à C : MRR [IC] |
|---|---|---|---|---|---|
| A (actuel) | 0,197 [0,090 ; 0,338] | 0,197 [0,083 ; 0,337] | 13 [5 ; 44] | – | – |
| C (mots, λ 0,25) | 0,197 [0,090 ; 0,338] | 0,197 [0,083 ; 0,337] | 13 [5 ; 44] | 0,000 [0,000 ; 0,000] | – |
| v2 | 0,276 [0,142 ; 0,441] | 0,262 [0,142 ; 0,395] | 6 [3 ; 51] | +0,080 [0,019 ; 0,153] | +0,080 [0,019 ; 0,153] |
| v2 libre (sans contrainte) | 0,276 [0,142 ; 0,441] | 0,262 [0,142 ; 0,395] | 6 [3 ; 51] | +0,080 [0,019 ; 0,153] | +0,080 [0,019 ; 0,153] |
| v2 (amertume apprise sur tous) | 0,307 [0,147 ; 0,492] | 0,231 [0,116 ; 0,352] | 6 [2 ; 35] | +0,110 [0,018 ; 0,215] | +0,110 [0,018 ; 0,215] |

Moitié d'apprentissage (n = 20) : A (actuel) MRR 0,179 ; C (mots, λ 0,25) MRR 0,179 ; v2 MRR 0,286 ; v2 libre (sans contrainte) MRR 0,286 ; v2 (amertume apprise sur tous) MRR 0,243.

### arôme chaud (10′, whirlpool) — tous les houblons (contrôle, n = 108)

| méthode | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart à A : MRR [IC] | écart à C : MRR [IC] |
|---|---|---|---|---|---|
| A (actuel) | 0,182 [0,131 ; 0,241] | 0,153 [0,113 ; 0,199] | 18,5 [13 ; 24,5] | – | – |
| C (mots, λ 0,25) | 0,232 [0,175 ; 0,298] | 0,252 [0,194 ; 0,313] | 10,5 [8 ; 14,5] | +0,049 [-0,014 ; 0,113] | – |
| v2 | 0,282 [0,217 ; 0,355] | 0,287 [0,226 ; 0,356] | 9 [6 ; 12] | +0,099 [0,031 ; 0,170] | +0,050 [0,011 ; 0,091] |
| v2 libre (sans contrainte) | 0,293 [0,228 ; 0,368] | 0,290 [0,235 ; 0,356] | 8,5 [6 ; 12] | +0,111 [0,045 ; 0,187] | +0,062 [0,017 ; 0,104] |
| v2 (amertume apprise sur tous) | 0,282 [0,217 ; 0,355] | 0,287 [0,226 ; 0,356] | 9 [6 ; 12] | +0,099 [0,031 ; 0,170] | +0,050 [0,011 ; 0,091] |

Moitié d'apprentissage (n = 109) : A (actuel) MRR 0,134 ; C (mots, λ 0,25) MRR 0,236 ; v2 MRR 0,280 ; v2 libre (sans contrainte) MRR 0,285 ; v2 (amertume apprise sur tous) MRR 0,280.

### à froid (dry hop) — tous les houblons (contrôle, n = 108)

| méthode | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart à A : MRR [IC] | écart à C : MRR [IC] |
|---|---|---|---|---|---|
| A (actuel) | 0,182 [0,131 ; 0,241] | 0,153 [0,113 ; 0,199] | 18,5 [13 ; 24,5] | – | – |
| C (mots, λ 0,25) | 0,232 [0,175 ; 0,298] | 0,252 [0,194 ; 0,313] | 10,5 [8 ; 14,5] | +0,049 [-0,014 ; 0,113] | – |
| v2 | 0,297 [0,230 ; 0,371] | 0,324 [0,263 ; 0,394] | 7,5 [5,5 ; 10] | +0,114 [0,052 ; 0,183] | +0,065 [0,023 ; 0,109] |
| v2 libre (sans contrainte) | 0,307 [0,241 ; 0,384] | 0,287 [0,226 ; 0,354] | 8,5 [4 ; 13,5] | +0,125 [0,062 ; 0,198] | +0,076 [0,027 ; 0,129] |
| v2 (amertume apprise sur tous) | 0,297 [0,230 ; 0,371] | 0,324 [0,263 ; 0,394] | 7,5 [5,5 ; 10] | +0,114 [0,052 ; 0,183] | +0,065 [0,023 ; 0,109] |

Moitié d'apprentissage (n = 109) : A (actuel) MRR 0,134 ; C (mots, λ 0,25) MRR 0,236 ; v2 MRR 0,264 ; v2 libre (sans contrainte) MRR 0,270 ; v2 (amertume apprise sur tous) MRR 0,264.

Hasard, amérisants au contrôle : MRR 0,060, rappel@10 0,037, rang médian 52,5. À l'amertume, A et C sont le même classement (C ne touche que l'arôme).

## 4. Ce que chaque variable ajoute (v2 sans elle, contrôle)

Une ligne = v2 dont la variable (ou le groupe) est mise à poids 0, les autres renormalisées. Un écart négatif : la variable aide ; positif : elle gêne sur cette référence. L'IC est celui de l'écart apparié au v2 entier.

### amertume (60′ ; premier moût, 30′, 15′) | tous les houblons

| sans… | poids dans v2 | MRR sans | écart de MRR [IC 95 %] | écart de rappel@10 |
|---|---|---|---|---|
| α | 0,280 | 0,150 | -0,011 [-0,045 ; 0,021] | +0,010 |
| β | 0,140 | 0,105 | -0,057 [-0,092 ; -0,027] | -0,022 |
| cohumulone | 0,140 | 0,131 | -0,031 [-0,058 ; -0,009] | -0,022 |
| usage | 0,140 | 0,145 | -0,017 [-0,038 ; 0,002] | -0,022 |
| huile totale | 0,050 | 0,157 | -0,005 [-0,020 ; 0,009] | -0,007 |
| myrcène | 0,010 | 0,165 | +0,003 [-0,005 ; 0,013] | -0,010 |
| humulène | 0,060 | 0,190 | +0,028 [0,009 ; 0,056] | +0,007 |
| caryophyllène | 0,050 | 0,165 | +0,003 [-0,010 ; 0,017] | -0,006 |
| farnésène | 0,010 | 0,160 | -0,002 [-0,006 ; 0,000] | -0,003 |
| linalol | 0,010 | 0,162 | 0,000 [-0,001 ; 0,001] | -0,002 |
| géraniol | 0,010 | 0,162 | 0,000 [0,000 ; 0,000] | 0,000 |
| familles | 0,100 | 0,133 | -0,029 [-0,055 ; -0,007] | +0,007 |
| mots | 0,000 | 0,162 | 0,000 [0,000 ; 0,000] | 0,000 |
| radar BM | 0,000 | 0,162 | 0,000 [0,000 ; 0,000] | 0,000 |
| groupe amertume | 0,700 | 0,057 | -0,105 [-0,154 ; -0,062] | -0,091 |
| groupe huile | 0,200 | 0,162 | 0,000 [-0,024 ; 0,022] | -0,014 |
| groupe arôme | 0,100 | 0,133 | -0,029 [-0,055 ; -0,007] | +0,007 |

### amertume (60′ ; premier moût, 30′, 15′) | amérisants (usage BM : bittering)

| sans… | poids dans v2 | MRR sans | écart de MRR [IC 95 %] | écart de rappel@10 |
|---|---|---|---|---|
| α | 0,280 | 0,211 | -0,066 [-0,167 ; 0,012] | -0,044 |
| β | 0,140 | 0,166 | -0,111 [-0,196 ; -0,041] | -0,044 |
| cohumulone | 0,140 | 0,228 | -0,049 [-0,161 ; 0,058] | -0,042 |
| usage | 0,140 | 0,272 | -0,005 [-0,029 ; 0,015] | 0,000 |
| huile totale | 0,050 | 0,256 | -0,021 [-0,048 ; 0,000] | -0,007 |
| myrcène | 0,010 | 0,277 | 0,000 [0,000 ; 0,000] | 0,000 |
| humulène | 0,060 | 0,292 | +0,016 [-0,010 ; 0,060] | +0,008 |
| caryophyllène | 0,050 | 0,320 | +0,043 [-0,016 ; 0,108] | 0,000 |
| farnésène | 0,010 | 0,276 | -0,001 [-0,002 ; 0,000] | 0,000 |
| linalol | 0,010 | 0,276 | 0,000 [0,000 ; 0,000] | 0,000 |
| géraniol | 0,010 | 0,276 | 0,000 [0,000 ; 0,000] | 0,000 |
| familles | 0,100 | 0,271 | -0,005 [-0,091 ; 0,074] | -0,030 |
| mots | 0,000 | 0,276 | 0,000 [0,000 ; 0,000] | 0,000 |
| radar BM | 0,000 | 0,276 | 0,000 [0,000 ; 0,000] | 0,000 |
| groupe amertume | 0,700 | 0,101 | -0,175 [-0,314 ; -0,068] | -0,118 |
| groupe huile | 0,200 | 0,288 | +0,011 [-0,037 ; 0,076] | -0,007 |
| groupe arôme | 0,100 | 0,271 | -0,005 [-0,091 ; 0,074] | -0,030 |

### arôme chaud (10′, whirlpool) | tous les houblons

| sans… | poids dans v2 | MRR sans | écart de MRR [IC 95 %] | écart de rappel@10 |
|---|---|---|---|---|
| α | 0,090 | 0,273 | -0,009 [-0,029 ; 0,012] | -0,018 |
| β | 0,060 | 0,274 | -0,007 [-0,030 ; 0,014] | +0,013 |
| cohumulone | 0,030 | 0,273 | -0,009 [-0,029 ; 0,012] | -0,019 |
| usage | 0,120 | 0,276 | -0,006 [-0,028 ; 0,013] | +0,015 |
| huile totale | 0,040 | 0,270 | -0,012 [-0,027 ; -0,001] | -0,008 |
| myrcène | 0,030 | 0,280 | -0,002 [-0,017 ; 0,010] | +0,006 |
| humulène | 0,030 | 0,272 | -0,010 [-0,020 ; -0,002] | -0,009 |
| caryophyllène | 0,020 | 0,272 | -0,010 [-0,026 ; 0,001] | -0,014 |
| farnésène | 0,020 | 0,271 | -0,011 [-0,026 ; 0,000] | -0,006 |
| linalol | 0,040 | 0,276 | -0,006 [-0,018 ; 0,000] | -0,009 |
| géraniol | 0,020 | 0,282 | 0,000 [0,000 ; 0,000] | 0,000 |
| familles | 0,113 | 0,265 | -0,017 [-0,039 ; 0,001] | -0,002 |
| mots | 0,338 | 0,270 | -0,012 [-0,071 ; 0,053] | -0,038 |
| radar BM | 0,050 | 0,281 | -0,001 [-0,013 ; 0,014] | -0,016 |
| groupe amertume | 0,300 | 0,242 | -0,040 [-0,073 ; -0,007] | -0,039 |
| groupe huile | 0,200 | 0,256 | -0,025 [-0,047 ; -0,006] | -0,049 |
| groupe arôme | 0,500 | 0,179 | -0,102 [-0,172 ; -0,036] | -0,097 |

### à froid (dry hop) | tous les houblons

| sans… | poids dans v2 | MRR sans | écart de MRR [IC 95 %] | écart de rappel@10 |
|---|---|---|---|---|
| α | 0,050 | 0,281 | -0,016 [-0,033 ; -0,002] | -0,012 |
| β | 0,030 | 0,287 | -0,009 [-0,027 ; 0,003] | -0,016 |
| cohumulone | 0,020 | 0,288 | -0,008 [-0,020 ; 0,001] | -0,024 |
| usage | 0,100 | 0,278 | -0,018 [-0,037 ; -0,004] | -0,026 |
| huile totale | 0,075 | 0,267 | -0,029 [-0,057 ; -0,006] | -0,052 |
| myrcène | 0,030 | 0,292 | -0,005 [-0,012 ; 0,002] | -0,015 |
| humulène | 0,030 | 0,290 | -0,007 [-0,021 ; 0,008] | -0,043 |
| caryophyllène | 0,015 | 0,289 | -0,008 [-0,023 ; 0,002] | -0,023 |
| farnésène | 0,030 | 0,269 | -0,027 [-0,052 ; -0,009] | -0,040 |
| linalol | 0,075 | 0,286 | -0,010 [-0,026 ; 0,002] | -0,019 |
| géraniol | 0,045 | 0,297 | 0,000 [0,000 ; 0,000] | 0,000 |
| familles | 0,113 | 0,275 | -0,021 [-0,048 ; 0,002] | -0,037 |
| mots | 0,338 | 0,268 | -0,029 [-0,084 ; 0,028] | -0,087 |
| radar BM | 0,050 | 0,287 | -0,009 [-0,028 ; 0,008] | -0,017 |
| groupe amertume | 0,200 | 0,264 | -0,033 [-0,058 ; -0,010] | -0,050 |
| groupe huile | 0,300 | 0,246 | -0,050 [-0,085 ; -0,019] | -0,090 |
| groupe arôme | 0,500 | 0,143 | -0,154 [-0,224 ; -0,088] | -0,163 |

## 5. Contre (b), le jugement du brasseur : les 3 premiers de D pour les 8 phares

Rang, dans chaque classement, des 24 houblons que D place en tête (3 par phare). **Limite** : D est fait avec le classement C (l'IA reclasse les 20 premiers de C) ; (b) est donc plus proche de C que d'A ou de v2. Il départage, il ne tranche pas.

| moment | méthode | dans les 10 premiers (sur 24) | rang médian | rang moyen |
|---|---|---|---|---|
| à froid (dry hop) | A (actuel) | 11 | 19,5 | 31,3 |
| à froid (dry hop) | C (mots, λ 0,25) | 16 | 5 | 14,5 |
| à froid (dry hop) | v2 | 14 | 5,5 | 12,5 |
| à froid (dry hop) | v2 libre | 12 | 11 | 26,1 |
| arôme chaud (10′, whirlpool) | A (actuel) | 11 | 19,5 | 31,3 |
| arôme chaud (10′, whirlpool) | C (mots, λ 0,25) | 16 | 5 | 14,5 |
| arôme chaud (10′, whirlpool) | v2 | 16 | 5 | 13,9 |
| arôme chaud (10′, whirlpool) | v2 libre | 15 | 6 | 17,4 |
| amertume (60′ ; premier moût, 30′, 15′) | A (actuel) | 5 | 26,5 | 74,8 |
| amertume (60′ ; premier moût, 30′, 15′) | C (mots, λ 0,25) | 5 | 26,5 | 74,8 |
| amertume (60′ ; premier moût, 30′, 15′) | v2 | 3 | 72 | 88 |
| amertume (60′ ; premier moût, 30′, 15′) | v2 libre | 3 | 72 | 88 |

Détail à froid (rang des 3 houblons de D, dans l'ordre de D) :

| phare | A | C | v2 | v2 libre |
|---|---|---|---|---|
| Nelson Sauvin | 69 · 156 · 153 | 11 · 62 · 92 | 1 · 46 · 54 | 1 · 44 · 145 |
| Citra | 3 · 36 · 8 | 5 · 17 · 8 | 7 · 22 · 11 | 5 · 35 · 20 |
| Motueka | 5 · 21 · 2 | 3 · 10 · 2 | 3 · 18 · 2 | 1 · 117 · 2 |
| Mosaic | 24 · 1 · 7 | 1 · 2 · 3 | 1 · 2 · 5 | 2 · 3 · 14 |
| Galaxy | 8 · 42 · 71 | 5 · 23 · 40 | 4 · 33 · 21 | 24 · 48 · 40 |
| Simcoe | 19 · 1 · 3 | 1 · 3 · 13 | 1 · 5 · 22 | 1 · 3 · 43 |
| Saaz (CZ) | 5 · 53 · 21 | 1 · 28 · 7 | 1 · 11 · 3 | 1 · 8 · 2 |
| Cascade | 20 · 2 · 22 | 5 · 1 · 4 | 6 · 2 · 20 | 26 · 1 · 40 |

## 6. Les 10 premiers de v2, pour les 8 phares et les 3 moments

Marques : **D** = l'un des 3 premiers de D ; **BM** = substitut Beer Maverick. Entre parenthèses, le score v2.

### Nelson Sauvin

D : Hallertau Blanc, African Queen, Godiva. Beer Maverick : Hallertau Blanc, Enigma, Motueka, Riwaka.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. TNT Blend (98) ; 2. Southern Passion (97) ; 3. Hallertau Taurus (95) ; 4. Pacific Jade (94) ; 5. Southern Tropic (94) ; 6. Lumberjack (92) ; 7. African Queen (91) **D** ; 8. Brooklyn (91) ; 9. Sorachi Ace (91) ; 10. Trident (91)
  - rang des houblons de D : Hallertau Blanc 73, African Queen 7, Godiva 180 ; rang des substituts BM : Hallertau Blanc 73, Enigma 149, Motueka 187, Riwaka 247
- **arôme chaud (10′, whirlpool)** : 1. Hallertau Blanc (66) **D** BM ; 2. Trident (62) ; 3. Cashmere (61) ; 4. Southern Sublime (61) ; 5. Pacific Sunrise (60) ; 6. Sládek (60) ; 7. Styrian Dragon (60) ; 8. Zythos (60) ; 9. Solero (59) ; 10. Southern Passion (59)
  - rang des houblons de D : Hallertau Blanc 1, African Queen 38, Godiva 71 ; rang des substituts BM : Hallertau Blanc 1, Enigma 97, Motueka 84, Riwaka 105
- **à froid (dry hop)** : 1. Hallertau Blanc (65) **D** BM ; 2. Cashmere (61) ; 3. Sládek (60) ; 4. Mandarina Bavaria (58) ; 5. Southern Sublime (58) ; 6. Styrian Dragon (58) ; 7. Trident (58) ; 8. Zythos (58) ; 9. Solero (57) ; 10. Pacific Sunrise (56)
  - rang des houblons de D : Hallertau Blanc 1, African Queen 46, Godiva 54 ; rang des substituts BM : Hallertau Blanc 1, Enigma 111, Motueka 56, Riwaka 48

### Citra

D : Nectaron, Galaxy, NZH-107. Beer Maverick : Simcoe, Mosaic, Centennial, Cascade.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. Trident (97) ; 2. Bravo (96) ; 3. Mosaic (96) BM ; 4. Loral (94) ; 5. Southern Sublime (94) ; 6. Zenia (94) ; 7. Caliente (93) ; 8. Idaho 7 (93) ; 9. Sabro (93) ; 10. Styrian Wolf (93)
  - rang des houblons de D : Nectaron 25, Galaxy 73, NZH-107 65 ; rang des substituts BM : Simcoe 27, Mosaic 3, Centennial 30, Cascade 170
- **arôme chaud (10′, whirlpool)** : 1. Mosaic (69) BM ; 2. Falconer's Flight (68) ; 3. YQH-1380 (68) ; 4. Styrian Cardinal (67) ; 5. Comet (66) ; 6. Nectaron (66) **D** ; 7. Zamba Blend (66) ; 8. Azacca (64) ; 9. Idaho 7 (64) ; 10. NZH-107 (64) **D**
  - rang des houblons de D : Nectaron 6, Galaxy 19, NZH-107 10 ; rang des substituts BM : Simcoe 14, Mosaic 1, Centennial 23, Cascade 46
- **à froid (dry hop)** : 1. Falconer's Flight (67) ; 2. YQH-1380 (67) ; 3. Comet (65) ; 4. Mosaic (65) BM ; 5. Zamba Blend (65) ; 6. Azacca (64) ; 7. Nectaron (64) **D** ; 8. HBC 586 (63) ; 9. Pacific Sunrise (63) ; 10. Styrian Cardinal (63)
  - rang des houblons de D : Nectaron 7, Galaxy 22, NZH-107 11 ; rang des substituts BM : Simcoe 16, Mosaic 4, Centennial 25, Cascade 40

### Motueka

D : Taiheke, Riwaka, Cascade. Beer Maverick : Saaz (US), Sterling.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. Vienna Gold (100) ; 2. Buzz Bullets (99) ; 3. Sun (99) ; 4. Petoskey (97) ; 5. Zula (97) ; 6. Walhalla (95) ; 7. Arcadian (93) ; 8. Olicana (93) ; 9. Trident (93) ; 10. Samba (92)
  - rang des houblons de D : Taiheke 19, Riwaka 223, Cascade 216 ; rang des substituts BM : Saaz (US) 281, Sterling 41
- **arôme chaud (10′, whirlpool)** : 1. Taiheke (63) **D** ; 2. Zythos (62) ; 3. Cascade (61) **D** ; 4. Astra (59) ; 5. Wakatu (59) ; 6. Mandarina Bavaria (58) ; 7. Cluster (56) ; 8. Falconer's Flight (56) ; 9. Sitiva Blend (56) ; 10. Southern Cross (56)
  - rang des houblons de D : Taiheke 1, Riwaka 17, Cascade 3 ; rang des substituts BM : Saaz (US) 276, Sterling 35
- **à froid (dry hop)** : 1. Zythos (60) ; 2. Cascade (58) **D** ; 3. Taiheke (58) **D** ; 4. Wakatu (57) ; 5. Mandarina Bavaria (56) ; 6. Astra (54) ; 7. Cluster (53) ; 8. Comet (53) ; 9. Sitiva Blend (53) ; 10. Southern Cross (53)
  - rang des houblons de D : Taiheke 3, Riwaka 18, Cascade 2 ; rang des substituts BM : Saaz (US) 248, Sterling 27

### Mosaic

D : Simcoe, Idaho 7, Azacca. Beer Maverick : Citra, Simcoe.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. TNT Blend (98) ; 2. Citra (96) BM ; 3. Loral (93) ; 4. Magnat (93) ; 5. Trident (93) ; 6. Zenia (93) ; 7. Nugget (92) ; 8. Southern Sublime (92) ; 9. Yeoman (92) ; 10. Nectaron (91)
  - rang des houblons de D : Simcoe 23, Idaho 7 27, Azacca 97 ; rang des substituts BM : Citra 2, Simcoe 23
- **arôme chaud (10′, whirlpool)** : 1. Simcoe (73) **D** BM ; 2. Citra (69) BM ; 3. Idaho 7 (68) **D** ; 4. Azacca (66) **D** ; 5. Nectaron (66) ; 6. Falconer's Flight (64) ; 7. Galaxy (63) ; 8. Mandarina Bavaria (63) ; 9. Rakau (63) ; 10. Southern Cross (63)
  - rang des houblons de D : Simcoe 1, Idaho 7 3, Azacca 4 ; rang des substituts BM : Citra 2, Simcoe 1
- **à froid (dry hop)** : 1. Simcoe (70) **D** BM ; 2. Idaho 7 (66) **D** ; 3. Citra (65) BM ; 4. Nectaron (65) ; 5. Azacca (64) **D** ; 6. Mandarina Bavaria (63) ; 7. Moutere (61) ; 8. Rakau (61) ; 9. Zamba Blend (61) ; 10. Zythos (61)
  - rang des houblons de D : Simcoe 1, Idaho 7 2, Azacca 5 ; rang des substituts BM : Citra 3, Simcoe 1

### Galaxy

D : Nectaron, Vic Secret, Strata. Beer Maverick : Simcoe, Citra, Amarillo.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. HPA-016 (93) ; 2. Eclipse (92) ; 3. Ahhhroma (90) ; 4. Enigma (90) ; 5. Satus (90) ; 6. Bitter Gold (89) ; 7. El Dorado (89) ; 8. BRU-1 (87) ; 9. Caliente (87) ; 10. Galena (87)
  - rang des houblons de D : Nectaron 218, Vic Secret 71, Strata 223 ; rang des substituts BM : Simcoe 133, Citra 216, Amarillo 135
- **arôme chaud (10′, whirlpool)** : 1. Harlequin (69) ; 2. Mosaic (63) ; 3. Nectaron (62) **D** ; 4. Azacca (61) ; 5. Citra (61) BM ; 6. Rakau (61) ; 7. Zamba Blend (61) ; 8. Comet (60) ; 9. Trident (60) ; 10. Ariana (59)
  - rang des houblons de D : Nectaron 3, Vic Secret 39, Strata 29 ; rang des substituts BM : Simcoe 51, Citra 5, Amarillo 54
- **à froid (dry hop)** : 1. Harlequin (65) ; 2. Mosaic (60) ; 3. Citra (59) BM ; 4. Nectaron (59) **D** ; 5. Rakau (59) ; 6. Zamba Blend (59) ; 7. Azacca (58) ; 8. Comet (58) ; 9. Trident (58) ; 10. Sabro (57)
  - rang des houblons de D : Nectaron 4, Vic Secret 33, Strata 21 ; rang des substituts BM : Simcoe 50, Citra 3, Amarillo 56

### Simcoe

D : Mosaic, Idaho 7, Vic Secret. Beer Maverick : Summit, Magnum (US), Amarillo, Mosaic, Cascade, Centennial, Citra, Columbus.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. Zenia (94) ; 2. Trident (93) ; 3. Yeoman (93) ; 4. HBC 630 (92) ; 5. Sabro (92) ; 6. Warrior (92) ; 7. Hartwick (91) ; 8. Magnat (91) ; 9. Loral (90) ; 10. Nugget (90)
  - rang des houblons de D : Mosaic 215, Idaho 7 32, Vic Secret 75 ; rang des substituts BM : Summit 25, Magnum (US) 52, Amarillo 79, Mosaic 215, Cascade 227, Centennial 39, Citra 214, Columbus 58
- **arôme chaud (10′, whirlpool)** : 1. Mosaic (73) **D** BM ; 2. Rakau (70) ; 3. Falconer's Flight (67) ; 4. Idaho 7 (66) **D** ; 5. Moutere (65) ; 6. Southern Cross (65) ; 7. Citra (63) BM ; 8. Trident (63) ; 9. Chinook (62) ; 10. Falconer's Flight 7CS (62)
  - rang des houblons de D : Mosaic 1, Idaho 7 4, Vic Secret 35 ; rang des substituts BM : Summit 34, Magnum (US) 121, Amarillo 58, Mosaic 1, Cascade 116, Centennial 18, Citra 7, Columbus 95
- **à froid (dry hop)** : 1. Mosaic (70) **D** BM ; 2. Rakau (70) ; 3. Moutere (66) ; 4. Falconer's Flight (65) ; 5. Idaho 7 (64) **D** ; 6. Southern Cross (63) ; 7. Falconer's Flight 7CS (62) ; 8. Citra (61) BM ; 9. Mandarina Bavaria (61) ; 10. Trident (61)
  - rang des houblons de D : Mosaic 1, Idaho 7 5, Vic Secret 22 ; rang des substituts BM : Summit 31, Magnum (US) 121, Amarillo 65, Mosaic 1, Cascade 90, Centennial 15, Citra 8, Columbus 104

### Saaz (CZ)

D : Saaz Late, Saaz (US), Spalt. Beer Maverick : Saaz (US), Sterling.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. Wild Loyalist (99) ; 2. Amethyst (96) ; 3. Saaz Late (96) **D** ; 4. Sylva (95) ; 5. Crystal (94) ; 6. Spalt (94) **D** ; 7. Tettnang (US) (94) ; 8. Tettnanger (94) ; 9. Mount Hood (93) ; 10. Southern Aroma (93)
  - rang des houblons de D : Saaz Late 3, Saaz (US) 19, Spalt 6 ; rang des substituts BM : Saaz (US) 19, Sterling 38
- **arôme chaud (10′, whirlpool)** : 1. Aurum (65) ; 2. Saaz Late (65) **D** ; 3. Tettnang (US) (63) ; 4. Wild Loyalist (63) ; 5. Hersbrucker (62) ; 6. Spalt (62) **D** ; 7. Tettnanger (62) ; 8. Fuggle (61) ; 9. Pacific Crest (61) ; 10. Saaz (US) (60) **D** BM
  - rang des houblons de D : Saaz Late 2, Saaz (US) 10, Spalt 6 ; rang des substituts BM : Saaz (US) 10, Sterling 35
- **à froid (dry hop)** : 1. Saaz Late (64) **D** ; 2. Aurum (63) ; 3. Spalt (62) **D** ; 4. Tettnang (US) (62) ; 5. Tettnanger (62) ; 6. Fuggle (61) ; 7. Wild Loyalist (60) ; 8. Hersbrucker (59) ; 9. Pacific Crest (59) ; 10. Southern Aroma (59)
  - rang des houblons de D : Saaz Late 1, Saaz (US) 11, Spalt 3 ; rang des substituts BM : Saaz (US) 11, Sterling 31

### Cascade

D : Centennial, Taiheke, Falconer's Flight. Beer Maverick : Amarillo, Centennial, Ahtanum, Summit.

- **amertume (60′ ; premier moût, 30′, 15′)** : 1. Petoskey (100) ; 2. Vienna Gold (100) ; 3. Aloha Blend (99) ; 4. Hartwick (99) ; 5. Mandarina Bavaria (99) ; 6. Solero (99) ; 7. Sun (99) ; 8. TNT Blend (99) ; 9. Yellow Sub (99) ; 10. Buzz Bullets (98)
  - rang des houblons de D : Centennial 97, Taiheke 12, Falconer's Flight 112 ; rang des substituts BM : Amarillo 140, Centennial 97, Ahtanum 211, Summit 120
- **arôme chaud (10′, whirlpool)** : 1. Taiheke (66) **D** ; 2. Cluster (65) ; 3. Mandarina Bavaria (64) ; 4. Centennial (62) **D** BM ; 5. Motueka (61) ; 6. Sasquatch (61) ; 7. Aramis (60) ; 8. Atlas (60) ; 9. Bravo (60) ; 10. Endeavour (60)
  - rang des houblons de D : Centennial 4, Taiheke 1, Falconer's Flight 25 ; rang des substituts BM : Amarillo 15, Centennial 4, Ahtanum 52, Summit 83
- **à froid (dry hop)** : 1. Mandarina Bavaria (63) ; 2. Taiheke (63) **D** ; 3. Cluster (62) ; 4. Bravo (61) ; 5. Sorachi Ace (61) ; 6. Centennial (60) **D** BM ; 7. Comet (59) ; 8. Endeavour (59) ; 9. Target (59) ; 10. Amarillo (58) BM
  - rang des houblons de D : Centennial 6, Taiheke 2, Falconer's Flight 20 ; rang des substituts BM : Amarillo 10, Centennial 6, Ahtanum 52, Summit 59

## 7. Recouvrement A et v2 à 60′ (les dix premiers)

Nelson Sauvin 5/10 · Citra 7/10 · Motueka 8/10 · Mosaic 5/10 · Galaxy 3/10 · Simcoe 7/10 · Saaz (CZ) 8/10 · Cascade 7/10 · Magnum (US) 5/10 · Nugget 6/10 · Columbus 5/10 · Warrior 5/10 · Herkules 6/10 · Apollo 3/10 · Summit 8/10 · Target 5/10

