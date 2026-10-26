# Banc d’évaluation Substituer et Suggérer (#181, étape 1 : mesurer)

Généré par `scripts/eval-hop/banc-eval.ts` (déterministe, hors ligne, sans Gemini). **Cette étape mesure, elle ne règle rien** : aucun changement dans `src/domain`.

## 1. Données et méthode

- Moteur : `creerMoteur({ catalogue: CATALOGUE, stock: [] })` — 318 variétés du catalogue, sans stock. Le stock du brasseur ne pèse pas sur la mesure.
- Vérité de terrain : le bloc `bm.substituts` (Beer Maverick, D75), que le moteur ne lit pas. 217 houblons, 697 paires (médiane 3 substituts par houblon) ; 31 citations au nom non relié sont ignorées.
- Usage de l’original : aroma 86, dual 94, bittering 37.
- Référence imparfaite : seules 174 paires sur 697 (25 %) sont réciproques (A cite B et B cite A). Un score parfait n’existe pas.
- Métriques : rappel@k = part des substituts de référence dans les k premiers, moyennée sur les houblons ; « au moins 1 » = part des houblons dont un substitut est dans les 10 premiers ; rang du premier substitut (médiane) ; MRR = moyenne de 1/rang du premier. Le rang est la position dans la liste telle que l’app l’affiche (ex æquo départagés par le nom).
- Référence au hasard (même nombre de substituts, classement tiré au sort, graine 182, 20 tirages) : rappel@10 3 %, MRR 0,047, rang médian 70.

## 2. Substituer : le moteur contre les substituts de Beer Maverick

**Constat de structure** : à 10′, au whirlpool et au dry hop actif, les classements sont **identiques** pour 217 houblons sur 217 (10′ contre dry hop : 217). Les poids ne dépendent que de la nature du moment (amertume : 60′ ; arôme : tout le reste) ; seule la dose change. Il y a donc deux classements réels, pas quatre.

|  | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| 60′ | 217 | 6 % | 10 % | 24 % | 36 | 0,118 |
| 10′ = whirlpool = dry hop | 217 | 7 % | 11 % | 26 % | 27 | 0,121 |
| au hasard | 4340 | 2 % | 3 % | 10 % | 70 | 0,047 |

Par moment et par usage de l’original :

|  | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| 60′ · aroma | 86 | 7 % | 10 % | 23 % | 33 | 0,120 |
| 60′ · dual | 94 | 6 % | 9 % | 18 % | 46 | 0,100 |
| 60′ · bittering | 37 | 5 % | 12 % | 41 % | 15 | 0,155 |
| 10′ · aroma | 86 | 8 % | 15 % | 29 % | 23,5 | 0,124 |
| 10′ · dual | 94 | 5 % | 7 % | 18 % | 31 | 0,103 |
| 10′ · bittering | 37 | 7 % | 12 % | 38 % | 20 | 0,157 |
| dry hop actif · aroma | 86 | 8 % | 15 % | 29 % | 23,5 | 0,124 |
| dry hop actif · dual | 94 | 5 % | 7 % | 18 % | 31 | 0,103 |
| dry hop actif · bittering | 37 | 7 % | 12 % | 38 % | 20 | 0,157 |

Lecture : le moteur fait mieux que le hasard (rappel@10 ~3 fois, MRR ~2,5 fois), mais ne retrouve qu’un substitut sur 10 dans les 10 premiers, et un houblon sur quatre a au moins un substitut dans ses 10 premiers.

### Où la référence semble fausse ou discutable

Sur 697 paires : usage opposé (aromatique contre amérisant) 66 ; α à plus du double 68 ; aucune famille d’arôme en commun 36 ; au moins un de ces drapeaux 156. Hypothèse (non prouvée) : les substituts de Beer Maverick semblent souvent être des substituts de **classe** (noble pour noble, « un houblon doux ») ou de **marché**, peu sensibles à l’α ; le moteur pèse l’α et le rôle et s’en éloigne. Contre-indice : « amertume seule » bat « arôme seul » (§ 6), ce qui ferait de la référence une référence d’α.

Cinq exemples (deux houblons décrits par au moins 3 familles ; le mauvais rang ne vient donc pas d’un profil creux) :

| Houblon → substitut Beer Maverick | rang à l’arôme | rang à 60′ | usage | α (%) | mots (fr) | drapeaux |
|---|---|---|---|---|---|---|
| Dana → Fuggle | 254 | 280 | dual / aroma | 7.2–13 / 2.4–6.1 | floral, agrumes, pin // boisé, herbe coupée, menthe, doux | α à plus du double |
| Loral → Glacier | 277 | 206 | aroma / dual | 10–17 / 3.3–9.7 | floral, poivre noir, agrumes, dark fruit // prune, mûre, boisé, cèdre | α à plus du double, aucune famille en commun |
| Falconer's Flight 7CS → Crystal | 214 | 256 | dual / aroma | 9–10.5 / 2.8–6 | fruité, agrumes, épicé, terreux // boisé, floral, vert, fruité | α à plus du double |
| Bobek → Fuggle | 180 | 288 | bittering / aroma | 3.5–9.3 / 2.4–6.1 | pin, floral // boisé, herbe coupée, menthe, doux | usage opposé |
| Pekko → Saaz (CZ) | 195 | 269 | dual / aroma | 13–16 / 2–5 | pleasant, floral, agrumes, menthe // terreux, herbacé, floral, doux | α à plus du double |

Noms de substituts cités par la page mais non reliés au catalogue (donnée du #180) : 10 noms distincts, 7 retrouvables par une correspondance indulgente (East Kent Golding → East Kent Goldings ; Magnum → Magnum (GR) ou Magnum (US) ; Northern Brewer → Northern Brewer (GR) ou Northern Brewer (US) ; Saaz (CH) → Saaz (CZ) ou Saaz Late ; Taurus → Hallertau Taurus ; Tettnang → Tettnang (US) ou Tettnanger ; Whitbread Golding Variety → Whitbread Golding Variety (WGV)) ; absents du catalogue : Lubelski, Mount Ranier, Polish Lublin.

## 3. Les houblons phares (L14)

Dix premiers de `substitutes()` avec le score (arôme / huiles / amertume), puis les substituts de Beer Maverick avec leur rang sur 317. « inconnu » : la page cite un nom que le catalogue ne relie pas.

### Nelson Sauvin

Usage aroma, α 10–13 %, 2 familles décrites, 9 mots dont 78 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Boomerang 93 (95/92/82) · 2. Herkules 93 (93/100/70) · 3. Phoenix 90 (90/95/76) · 4. Kazbek 89 (95/88/56) · 5. Marynka 89 (89/95/67) · 6. Pacific Jade 89 (87/98/79) · 7. Summit 89 (96/83/67) · 8. CTZ 88 (98/75/67) · 9. Godiva 88 (95/–/46) · 10. Tomahawk 88 (98/75/67)

Beer Maverick : Hallertau Blanc 155e (52) · Enigma 244e (32) · Motueka 89e (62) · Riwaka 206e (44)

Verdict : Non. Tête : Boomerang, Herkules, Phoenix, Kazbek… des houblons à peine décrits ou nobles/neutres ; aucun ne dit vin blanc ni sauvignon. Hallertau Blanc, le plus proche pour un brasseur, est 155e ; Riwaka 206e. Nelson Sauvin n’a que 2 familles décrites et 78 % de mots sans famille (L14).

**60′** : 1. Boomerang 96 (100/92/97) · 2. Herkules 93 (86/100/93) · 3. Pacific Jade 93 (75/98/97) · 4. Satus 93 (100/83/93) · 5. Gaia 91 (100/67/97) · 6. Herald 91 (100/81/92) · 7. Yeoman 91 (100/78/92) · 8. Hallertau Taurus 90 (83/85/94) · 9. Jarrylo 90 (75/78/99) · 10. Tomahawk 90 (89/75/95)

Beer Maverick : Hallertau Blanc 125e (71) · Enigma 95e (75) · Motueka 163e (66) · Riwaka 250e (37)

Verdict : Défendable pour de l’amertume (Boomerang, Herkules, Pacific Jade sont des α 10–14 propres), mais Hallertau Blanc 125e et Riwaka 250e : la liste ne garde rien de l’identité du houblon.

### Citra

Usage dual, α 10–15 %, 5 familles décrites, 9 mots dont 11 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Bitter Gold 88 (85/97/79) · 2. Hydra 88 (89/86/84) · 3. Mistral 88 (88/92/75) · 4. McKenzie 85 (88/–/71) · 5. Palisade 85 (94/75/65) · 6. Southern Sublime 84 (87/78/92) · 7. Sabro 83 (75/97/85) · 8. Amarillo 82 (82/85/72) · 9. Styrian Cardinal 82 (87/68/95) · 10. Taiheke 82 (80/92/66)

Beer Maverick : Simcoe 103e (63) · Mosaic 106e (62) · Centennial 39e (74) · Cascade 33e (75)

Verdict : Moyen. Amarillo (8e) et Sabro sont de bons voisins ; Bitter Gold, Mistral et Palisade en tête ne sont pas des houblons de Citra. Centennial 39e, Cascade 33e, Simcoe 103e, Mosaic 106e (les quatre de la page Beer Maverick).

**60′** : 1. Trident 97 (100/–/96) · 2. Bravo 93 (89/86/97) · 3. Nectaron 92 (100/95/88) · 4. Caliente 91 (75/–/97) · 5. Loral 91 (75/84/99) · 6. Southern Sublime 91 (100/78/92) · 7. Styrian Cardinal 91 (100/68/95) · 8. Petoskey 90 (100/–/87) · 9. Styrian Wolf 90 (70/87/98) · 10. Yeoman 90 (100/63/96)

Beer Maverick : Simcoe 55e (82) · Mosaic 37e (84) · Centennial 49e (82) · Cascade 163e (66)

Verdict : Défendable : à 60′ on remplace une amertume (Bravo, Loral, Nectaron, α hauts). Mais Trident, Caliente, Petoskey n’ont pas de rapport avec Citra, et Cascade est 163e.

### Motueka

Usage dual, α 5–8.5 %, 3 familles décrites, 10 mots dont 20 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Buzz Bullets 94 (95/–/86) · 2. Shaddock 90 (94/–/65) · 3. Cascade 87 (87/83/96) · 4. Southern Sublime 85 (87/86/72) · 5. Mandarina Bavaria 84 (92/69/85) · 6. Pilot 84 (84/84/78) · 7. Multihead 83 (87/–/58) · 8. Taiheke 83 (89/66/98) · 9. Yakima Gold 83 (94/57/89) · 10. Herald 82 (94/60/77)

Beer Maverick : Saaz (US) 291e (10) · Sterling 198e (39)

Verdict : Plausible côté agrumes (Shaddock, Mandarina Bavaria, Cascade, Southern Sublime), ce qui colle à « citron vert ». Mais ne dit rien du mojito ni du tropical. Les deux substituts Beer Maverick (Saaz US 291e, Sterling 198e) n’ont presque rien en commun avec la liste : la référence est discutable ici.

**60′** : 1. Vienna Gold 100 (100/–/100) · 2. Zula 100 (100/–/99) · 3. Buzz Bullets 99 (100/–/99) · 4. Petoskey 97 (100/–/96) · 5. Trident 97 (100/–/96) · 6. Arcadian 94 (100/–/92) · 7. Solero 94 (86/–/97) · 8. NZH-107 93 (100/72/97) · 9. Samba 93 (75/–/99) · 10. Ariana 92 (67/–/100)

Beer Maverick : Saaz (US) 292e (35) · Sterling 87e (80)

Verdict : Peu parlant : des α de 4–6 % ou inconnus (Vienna Gold, Zula, Buzz Bullets, huiles inconnues) arrivent en tête avec un « arôme 100 » qui ne dit que l’absence d’arôme étranger.

### Mosaic

Usage dual, α 11.5–13.5 %, 8 familles décrites, 12 mots dont 17 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Styrian Fox 89 (85/100/81) · 2. Idaho 7 88 (82/99/95) · 3. Simcoe 78 (74/85/83) · 4. Galena 77 (67/98/77) · 5. Brewer's Gold (US) 76 (67/91/79) · 6. Hydra 76 (67/92/83) · 7. Styrian Eagle 75 (68/85/86) · 8. Strata 74 (70/82/73) · 9. Falconer's Flight 73 (57/100/88) · 10. Nugget 73 (58/96/94)

Beer Maverick : Citra 63e (62) · Simcoe 3e (78)

Verdict : Presque juste. Idaho 7 (2e) et Simcoe (3e) sont ce qu’un brasseur répond ; Styrian Fox 1er est discutable ; Galena et Brewer’s Gold sont des amérisants résineux, pas Mosaic. Citra 63e (référence : Citra, Simcoe).

**60′** : 1. TNT Blend 99 (100/–/99) · 2. Loral 97 (100/95/97) · 3. Altus 96 (100/–/94) · 4. Trident 96 (100/–/95) · 5. Bravo 95 (89/100/96) · 6. Zenia 95 (100/–/93) · 7. Azacca 94 (100/90/93) · 8. Magnat 94 (100/94/93) · 9. Olympic 94 (100/94/91) · 10. Sticky Fingers Blend 94 (100/–/92)

Beer Maverick : Citra 30e (90) · Simcoe 22e (92)

Verdict : Défendable : Loral, Bravo, Azacca, Magnat. Simcoe 22e et Citra 30e restent derrière TNT Blend, Altus, Trident et Zenia, des profils sans huiles dont l’« arôme 100 » ne veut rien dire.

### Galaxy

Usage dual, α 11–16 %, 3 familles décrites, 7 mots dont 29 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Samba 97 (100/–/79) · 2. Zamba Blend 92 (100/80/79) · 3. Harlequin 91 (91/94/86) · 4. Nectaron 89 (100/69/81) · 5. Idaho Gem 88 (87/–/93) · 6. NZH-107 88 (91/85/80) · 7. YQH-1380 88 (100/65/87) · 8. Trident 87 (87/–/86) · 9. Tropica 87 (91/–/61) · 10. Southern Sublime 86 (83/91/87)

Beer Maverick : Simcoe 43e (71) · Citra 32e (76) · Amarillo 66e (63)

Verdict : Plausible (Nectaron, Samba, Zamba Blend, Idaho Gem : tropicaux), mais la liste est faite de blends et de codes expérimentaux (YQH-1380, NZH-107) peu utiles à un brasseur ; Citra 32e, Simcoe 43e, Amarillo 66e.

**60′** : 1. Eclipse 92 (67/100/99) · 2. HPA-016 92 (67/100/99) · 3. Satus 92 (100/79/94) · 4. Southern Sublime 90 (100/91/87) · 5. Tillicum 90 (100/78/91) · 6. Trident 90 (100/–/86) · 7. El Dorado 89 (64/82/99) · 8. Yeoman 89 (100/74/90) · 9. Zula 89 (100/–/85) · 10. BRU-1 88 (67/92/94)

Beer Maverick : Simcoe 73e (77) · Citra 216e (79) · Amarillo 101e (72)

Verdict : Hors de propos pour le goût (Eclipse, HPA-016, Satus) ; correct seulement comme amertume. Citra 216e.

### Simcoe

Usage dual, α 11–15 %, 6 familles décrites, 9 mots dont 22 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Idaho 7 89 (86/98/83) · 2. HBC 630 78 (68/100/77) · 3. Hydra 78 (77/82/71) · 4. Mosaic 78 (74/85/83) · 5. Sabro 76 (72/85/75) · 6. Strata 76 (71/83/86) · 7. Talus 76 (68/100/51) · 8. XJA2/436 75 (77/72/68) · 9. Zythos 74 (62/99/74) · 10. Newport 73 (58/100/84)

Beer Maverick : Summit 91e (59) · Magnum (US) 216e (41) · Amarillo 83e (59) · Mosaic 4e (78) · Cascade 51e (64) · Centennial 96e (58) · Citra 55e (63) · Columbus 86e (59)

Verdict : Bon début : Idaho 7, Mosaic, Strata, Sabro sont de vrais voisins. Newport et Talus (amérisant/résineux) sont plus loin. Mosaic 4e, Cascade 51e, Citra 55e.

**60′** : 1. Caliente 99 (100/–/98) · 2. Yeoman 98 (100/99/97) · 3. Trident 97 (100/–/96) · 4. Warrior 97 (100/100/94) · 5. Zenia 96 (100/–/94) · 6. Idaho 7 93 (78/98/96) · 7. African Queen 92 (100/74/95) · 8. Hartwick 92 (100/–/89) · 9. Newport 92 (100/100/86) · 10. Sticklebract 92 (100/100/86)

Beer Maverick : Summit 46e (85) · Magnum (US) 121e (75) · Amarillo 144e (71) · Mosaic 213e (88) · Cascade 223e (68) · Centennial 106e (77) · Citra 216e (84) · Columbus 43e (85)

Verdict : Correct pour l’amertume : Warrior, Yeoman, Newport (α hauts, propres) ; Summit 46e (Beer Maverick l’a en premier).

### Saaz

Usage aroma, α 2–5 %, 6 familles décrites, 8 mots dont 25 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Pacific Crest 84 (84/86/79) · 2. Tettnang (US) 82 (73/100/85) · 3. Aurum 81 (82/–/73) · 4. Styrian Golding 81 (84/80/68) · 5. Hallertau Tradition 80 (89/64/70) · 6. Sussex 80 (78/90/66) · 7. Spalter Select 79 (80/79/75) · 8. Aramis 78 (74/96/48) · 9. Marynka 77 (82/84/26) · 10. Strisselspalt 77 (68/95/78)

Beer Maverick : Polish Lublin (inconnu) · Saaz (US) 19e (74) · Sterling 40e (67) · Tettnang (inconnu)

Verdict : Oui. Pacific Crest, Tettnang US, Styrian Golding, Hallertau Tradition, Spalter Select : la famille noble que le brasseur attend. Saaz US 19e et Sterling 40e (Beer Maverick). Tettnang et Polish Lublin non reliés dans les données.

**60′** : 1. Wild Loyalist 99 (100/–/99) · 2. Mount Hood 98 (100/94/98) · 3. Saaz Late 98 (100/100/97) · 4. Amethyst 95 (100/92/95) · 5. Spalt 94 (100/96/91) · 6. Tettnang (US) 94 (100/100/91) · 7. Willamette 94 (100/100/89) · 8. Contessa 93 (75/–/99) · 9. Saphir 93 (100/79/95) · 10. Tettnanger 93 (100/94/91)

Beer Maverick : Polish Lublin (inconnu) · Saaz (US) 21e (90) · Sterling 43e (88) · Tettnang (inconnu)

Verdict : Oui : Mount Hood, Saaz Late, Spalt, Tettnang US, Saphir, Tettnanger ; le mot « noble » tient.

### Cascade

Usage dual, α 4.5–9 %, 6 familles décrites, 10 mots dont 10 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Barbe Rouge 92 (91/95/89) · 2. Mandarina Bavaria 91 (90/94/88) · 3. Sasquatch 91 (89/95/87) · 4. Olympic 89 (88/97/68) · 5. Taiheke 89 (82/100/95) · 6. Buzz Bullets 87 (88/–/84) · 7. Herald 87 (87/90/73) · 8. HORT9909 87 (82/100/79) · 9. Motueka 87 (87/83/96) · 10. Southern Cross 87 (82/100/71)

Beer Maverick : Amarillo 108e (67) · Centennial 51e (79) · Ahtanum 17e (84) · Summit 61e (76)

Verdict : Plausible (agrumes : Mandarina Bavaria, Sasquatch, Olympic, Southern Cross), mais les voisins classiques américains sont loin : Ahtanum 17e, Centennial 51e, Summit 61e, Amarillo 108e.

**60′** : 1. Aloha Blend 100 (100/–/100) · 2. Diamant 100 (100/–/100) · 3. Sun 99 (100/–/98) · 4. Agnus 98 (100/100/96) · 5. Buzz Bullets 98 (100/–/97) · 6. Sticklebract 98 (100/100/96) · 7. Tomahawk 98 (100/100/96) · 8. Zeus 98 (100/100/96) · 9. Arcadian 97 (100/–/95) · 10. Brewer's Gold (US) 97 (100/94/96)

Beer Maverick : Amarillo 86e (89) · Centennial 57e (92) · Ahtanum 208e (76) · Summit 81e (90)

Verdict : Hors de propos pour l’identité (Aloha Blend, Diamant, Sun) ; défendable comme amertume seulement. Ahtanum 208e.

### Idaho 7

Usage aroma, α 9.5–14.9 %, 8 familles décrites, 12 mots dont 0 % sans famille.

**Dry hop (aussi 10′ et whirlpool)** : 1. Simcoe 89 (86/98/83) · 2. Mosaic 88 (82/99/95) · 3. Styrian Fox 87 (85/94/78) · 4. Hydra 84 (76/97/88) · 5. HBC 630 83 (80/88/88) · 6. Ariana 79 (77/–/90) · 7. Nugget 79 (65/100/97) · 8. Talus 78 (70/96/67) · 9. Sabro 76 (64/97/86) · 10. Strata 76 (70/87/78)

Beer Maverick : Azacca 98e (59) · El Dorado 101e (59) · Cashmere 154e (54) · Citra 43e (67) · Idaho Gem 105e (59) · Amarillo 46e (66) · Chinook 81e (61) · Columbus 70e (62)

Verdict : Oui pour la tête : Simcoe, Mosaic, HBC 630, Hydra, Strata. Mais les substituts de Beer Maverick (Azacca 98e, El Dorado 101e, Citra 43e, Amarillo 46e) sont loin derrière Nugget (7e).

**60′** : 1. Bravo 100 (100/100/100) · 2. Caliente 100 (100/–/100) · 3. Simcoe 99 (100/98/99) · 4. Trident 99 (100/–/99) · 5. Magnat 98 (100/100/97) · 6. Marco Polo 98 (100/100/96) · 7. Nugget 98 (90/100/99) · 8. Yeoman 98 (100/96/99) · 9. Zenia 98 (100/–/97) · 10. Styrian Cardinal 97 (100/100/95)

Beer Maverick : Azacca 217e (90) · El Dorado 86e (85) · Cashmere 223e (72) · Citra 214e (92) · Idaho Gem 52e (90) · Amarillo 136e (79) · Chinook 47e (90) · Columbus 48e (90)

Verdict : Défendable pour l’amertume (Bravo, Simcoe, Magnat, Marco Polo, Nugget) ; la liste dit « α élevé propre », pas « Idaho 7 ». Citra 214e.

## 4. Suggérer : l’aller-retour

**Méthode.** Pour une variété X, la visée est son profil : « plus » sur ses familles marquées (trois au plus ; sinon sa famille citée la plus nette). Recette de base : 20 L, US-05, sans houblon, dry hop en fermentation active, toutes les voies « ajouter » de `proposeVoies` (400 variétés examinées, aucune limite). On lit le rang de X puis celui de ses substituts Beer Maverick (X ôté de la liste). Échantillon fixe : 67 variétés, graine 181 (mélange de Fisher-Yates, mulberry32, sur les ids triés des 217 houblons avec substituts et au moins une famille décrite ; les 60 premiers, plus les phares absents). Les ex æquo reçoivent leur **rang moyen** : le moteur range alors par ordre alphabétique, ce qui n’a aucun sens.

| base | houblons | X dans la liste | rang moyen médian de X | X dans les 10 | taille médiane du 1er groupe | liste médiane | groupes distincts (médiane) |
|---|---|---|---|---|---|---|---|
| neutre (style sans échelle) | 67 | 67 | 51,5 | 11 | 102 | 138 | 1 |
| IPA 21A (contrôle) | 20 | 20 | 29,8 | 1 | 45 | 137 | 9 |

|  | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR | absents de la liste |
|---|---|---|---|---|---|---|---|
| substituts BM, base neutre | 67 | 0 % | 1 % | 3 % | 51,5 | 0,024 | 54 / 211 |
| substituts BM, base IPA | 20 | 0 % | 0 % | 0 % | 30 | 0,037 | 15 / 73 |
| au hasard (317) | 1340 | 1 % | 4 % | 10 % | 75 | 0,044 | – |

**Lecture.** Sur la base neutre, la liste a **un seul groupe de rang** (médiane 1) : tous les houblons qui citent une famille visée reçoivent le même effet (l’apport V5.5 d’une famille citée ne dépend pas de la variété), donc la même distance. Suggérer ne **classe** pas les variétés entre elles : il sépare celles qui citent la famille de celles qui ne la citent pas, puis range par ordre alphabétique. X est au milieu de sa liste (rang moyen médian 51,5 sur 138) : aucun signal de ressemblance. Avec le style IPA, 9 groupes apparaissent (bandes et débordements), mais le premier groupe garde 45 houblons. 54 substituts sur 211 sont absents de la liste parce qu’ils ne citent aucune des familles visées.

Inconnu lu comme zéro : parmi les 10 premières voies de chaque houblon (670 voies), 12 ont une famille visée sans effet établi, comptée avec un effet de 0 dans la distance (`central ?? 0`, voies.ts).

Levure : mêmes visées avec Pomona au lieu d’US-05 (10 houblons) : écart moyen du rang de X 0, recouvrement du premier groupe 1. Au dry hop actif, la levure ne change pas le classement des variétés dans ces cas.

### Cinq cas « recette et attente » (mots du brasseur)

| cas | ses mots | réponse attendue | observé | verdict |
|---|---|---|---|---|
| K1 · Stout 16D « trop résineuse, plus floral » | « ma stout est trop résineuses, je la veux plus floral » (SPEC-BRASSEUR.md § 1, 18.10) | Les 5 premiers houblons proposés citent le floral dans leurs fiches et ne citent pas le résineux ; aucune des 10 premières voies en conflit ; aucun ne porte un mot résineux sans famille (dank, cannabis, pin). | `{"top5":["Golding","Motueka","Aurum","East Kent Goldings","Columbus"],"floralSansResine":5,"conflitsDansLesDix":0,"reservesMotsResineuxSansFamille":[{"nom":"Columbus","mots":["dank","cannabis"]}]}` | ÉCHEC |
| K2 · « Plus résineux » : la stout le tolère, la lager non | « un peu plus résineux pour une stout est pas très problématique, pour une lager kolsch très » (SPEC-BRASSEUR.md § 1, 18.10) | Pour la même visée (résineux +1), la part des voies hors style est plus forte sur la lager 3B que sur la stout 16D, d’au moins 25 points ; l’échelle du résineux n’est pas la même. | `{"stout":{"voies":102,"horsStyle":102,"part":1},"lager":{"voies":102,"horsStyle":102,"part":1},"echelleResineux16D":{"statut":"neutre","bande":[0,30],"cran":10},"echelleResineux3B":{"statut":"neutre","bande":[0,30],"cran":10}}` | ÉCHEC |
| K3 · Agrumes : un écart faible en IPA est grand en lager | « le côté agrumes pour une ipa est infiniment plus subtil pour une cezc lager. Les échelles doivent être revu en fonction du style » (SPEC-BRASSEUR.md § 2, 18.10) | Le cran « plus agrumes » (points sur 0–100) est plus petit en lager 3B qu’en IPA 21A, au moins deux fois plus petit. | `{"cran21A":33.3,"cran3B":10,"bande21A":[0,100],"bande3B":[0,30]}` | tenu |
| K4 · Nelson Sauvin : « sauvignon blanc », « houblon incroyable » | « nelson sauvin est un houbon ordinaire alors que c’est un un houbon incroyable » (l5f, SPEC-BRASSEUR.md § 1) ; « on voit pas que c’est Sauvignon blanc » (24.10) | Au dry hop, au moins deux des quatre substituts de Beer Maverick (Hallertau Blanc, Enigma, Motueka, Riwaka) dans les 10 premiers ; Hallertau Blanc (« white wine ») en fait partie. | `{"rangsBM":[{"nom":"Hallertau Blanc","rang":155},{"nom":"Enigma","rang":244},{"nom":"Motueka","rang":89},{"nom":"Riwaka","rang":206}],"top3":["Boomerang","Herkules","Phoenix"]}` | ÉCHEC |
| K5 · Galaxy n’est pas Saaz | « différencier un houblon hyper aromatique type Galaxy d’un houblon plus fade type Saaz » ; « il faut aussi que on voit comme il faut les différences » (SPEC-BRASSEUR.md § 3, D131 ter) | Au dry hop, Galaxy n’est pas « très proche » (score ≥ 80) de Saaz, ni Saaz de Galaxy. | `{"saazChezGalaxy":30,"galaxyChezSaaz":30,"rangSaazChezGalaxy":223,"rangGalaxyChezSaaz":253}` | tenu |

## 5. Où l’algorithme se trompe, par cause

Inventaire du catalogue (318 variétés) : aucune famille décrite 21 ; deux familles au plus 91 ; moins de deux composants d’huile 65 ; au moins 50 % de mots sans famille (6 mots ou plus) 13.

Substituer : les paires de référence **hors des 10 premiers**, rangées dans la première cause qui s’applique (ordre du tableau), et le nombre où la cause est présente, exclusive ou non. « Non expliqué » : référence discutable ou vrai écart.

| cause | 60′ : première cause | 60′ : présente | arôme : première cause | arôme : présente |
|---|---|---|---|---|
| données manquantes | 78 | 78 | 77 | 77 |
| amérisant écarté à 60′ | 108 | 126 | 0 | 0 |
| profil creux (inconnus lus comme zéros) | 112 | 177 | 142 | 184 |
| mots sans famille | 11 | 36 | 17 | 37 |
| poids de l’amertume | 13 | 24 | 41 | 71 |
| levure | 0 | 0 | 0 | 0 |
| non expliqué (référence discutable ou vrai écart) | 291 | 291 | 344 | 344 |

Paires hors des 10 premiers : 60′ 613 sur 697 (88 %) ; arôme 621 sur 697 (89 %).

Définitions : *données manquantes* = arôme inconnu d’un côté (rejeté derrière tous les autres par la clé de couverture), huiles ou amertume inconnues ; *amérisant écarté* = le substitut est un houblon aromatique, passé derrière les amérisants à 60′ ; *profil creux* = au plus 2 familles décrites pour l’original ou le substitut (les autres lues comme 0) ; *mots sans famille* = au moins 50 % de mots hors des 12 familles (6 mots ou plus) ; *poids de l’amertume* = le substitut entre dans les 10 premiers avec les meilleurs poids de la grille (§ 6) ; *levure* = Substituer ne lit pas la levure : 0 par construction.

Suggérer : (1) le classement est **plat** (§ 4) ; (2) inconnu lu comme zéro : 12 voies sur 670 (§ 4) ; (3) mots sans famille : K1, Columbus (dank, cannabis) passe(nt) pour « floral sans résineux » alors que les fiches disent le contraire en mots hors famille ; (4) levure : sans effet sur le rang dans ces cas ; (5) données manquantes : 54 substituts sur 211 ne citent aucune famille visée.

## 6. Options de réglage, chacune mesurée sur le banc

Toutes les mesures ci-dessous sont **hors ligne**, sur la même référence (substituts Beer Maverick). Une amélioration ici veut dire « plus proche de Beer Maverick », pas « plus juste pour le brasseur » : voir les réserves.

### Poids par moment — 60′

| poids (arôme / huiles / amertume) | jeu | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|---|
| ,,,,,,,,,,,,,,, (actuels) | tous | 217 | 6 % | 10 % | 24 % | 36 | 0,119 |
| ,,,,,,,,,,,,,,, (actuels) | contrôle | 108 | 7 % | 11 % | 25 % | 34,5 | 0,122 |
| ,,,,,,,,,,,,,,, (meilleurs, appris sur une moitié) | contrôle (autre moitié) | 108 | 10 % | 13 % | 28 % | 35 | 0,130 |
| ,,,,,,,,,,,,,,, (meilleurs) | tous | 217 | 8 % | 13 % | 28 % | 35 | 0,132 |
| 0,7 / 0,3 / 0 (sans amertume) | tous | 217 | 2 % | 5 % | 14 % | 51 | 0,061 |
| 1 / 0 / 0 (arôme seul) | tous | 217 | 2 % | 4 % | 13 % | 53 | 0,054 |
| 0 / 1 / 0 (huiles seules) | tous | 217 | 3 % | 7 % | 18 % | 47 | 0,078 |
| 0 / 0 / 1 (amertume seule) | tous | 217 | 5 % | 10 % | 21 % | 35 | 0,094 |

### Poids par moment — arôme (10′, whirlpool, dry hop)

| poids (arôme / huiles / amertume) | jeu | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|---|
| ,,,,,,,,,,,,,,, (actuels) | tous | 217 | 6 % | 11 % | 26 % | 27 | 0,116 |
| ,,,,,,,,,,,,,,, (actuels) | contrôle | 108 | 7 % | 12 % | 26 % | 26,5 | 0,111 |
| ,,,,,,,,,,,,,,, (meilleurs, appris sur une moitié) | contrôle (autre moitié) | 108 | 12 % | 16 % | 35 % | 25,5 | 0,190 |
| ,,,,,,,,,,,,,,, (meilleurs) | tous | 217 | 10 % | 14 % | 33 % | 25 | 0,181 |
| 0,7 / 0,3 / 0 (sans amertume) | tous | 217 | 6 % | 10 % | 24 % | 31 | 0,105 |
| 1 / 0 / 0 (arôme seul) | tous | 217 | 5 % | 8 % | 19 % | 35 | 0,108 |
| 0 / 1 / 0 (huiles seules) | tous | 217 | 3 % | 8 % | 21 % | 39 | 0,085 |
| 0 / 0 / 1 (amertume seule) | tous | 217 | 8 % | 12 % | 27 % | 32 | 0,138 |

Contrôle exact par le moteur avec ces poids imposés (valide la réplique hors ligne) : 60′ MRR 0,131, rappel@10 13 % ; arôme MRR 0,180, rappel@10 14 %.

**Réserve forte** : les meilleurs poids sont ceux de l’amertume (0,8), à tous les moments, et « amertume seule » bat l’arôme seul : la référence Beer Maverick suit surtout l’α, le rôle et la bêta, ce que le brasseur de Nelson Sauvin ne veut pas (il veut le vin blanc). Un gain ici est un alignement sur le marché, pas une preuve de justesse.

### Mots sans famille (cosinus pondéré par la rareté des mots, hors ligne)

Variante mesurée : l’arôme d’un candidat = λ × cosinus des 12 familles + (1 − λ) × cosinus des **mots** de toutes les fiches (famille ou non, pondérés par log(N/df)), poids actuels de l’arôme conservés. Aux moments d’arôme seulement.

| λ | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| λ=1 | 217 | 6 % | 11 % | 26 % | 27 | 0,116 |
| λ=0.75 | 217 | 10 % | 14 % | 32 % | 21 | 0,155 |
| λ=0.5 | 217 | 11 % | 16 % | 38 % | 17 | 0,177 |
| λ=0.25 | 217 | 12 % | 18 % | 42 % | 14 | 0,202 |
| λ=0 | 217 | 12 % | 18 % | 39 % | 15 | 0,207 |

Mots (λ = 0,25) plus les poids appris : contrôle (autre moitié) MRR 0,186, rappel@10 15 % ; tous MRR 0,178, rappel@10 13 %. Les deux gains ne s’additionnent pas.

Nelson Sauvin (K4), rangs de ses quatre substituts Beer Maverick (Hallertau Blanc, Enigma, Motueka, Riwaka), 155, 244, 89, 206 aujourd’hui : λ=0.5 → Hallertau Blanc 40, Enigma 180, Motueka 102, Riwaka 210 ; λ=0.25 → Hallertau Blanc 2, Enigma 92, Motueka 130, Riwaka 204 ; λ=0 → Hallertau Blanc 1, Enigma 10, Motueka 174, Riwaka 199.

Réserve : les mots viennent de la même page Beer Maverick que les substituts (mêmes étiquettes pour des houblons voisins) ; le gain peut être en partie une corrélation de source. Il confirme néanmoins que les mots hors famille portent de l’information que le moteur jette (L14).

### Radar Beer Maverick `bm.arome` (9 axes, 57 % des variétés)

| λ (tous les houblons ; repli sur les familles sans radar) | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| λ=1 | 217 | 6 % | 11 % | 26 % | 27 | 0,116 |
| λ=0.75 | 217 | 7 % | 12 % | 28 % | 26 | 0,125 |
| λ=0.5 | 217 | 7 % | 12 % | 26 % | 25 | 0,129 |
| λ=0.25 | 217 | 8 % | 12 % | 29 % | 28 | 0,148 |
| λ=0 | 217 | 8 % | 12 % | 29 % | 34 | 0,154 |

| λ (seulement les 138 houblons dont l’original a un radar) | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| λ=1 | 138 | 9 % | 14 % | 35 % | 19 | 0,148 |
| λ=0.75 | 138 | 10 % | 16 % | 37 % | 18,5 | 0,162 |
| λ=0.5 | 138 | 10 % | 15 % | 35 % | 17 | 0,168 |
| λ=0.25 | 138 | 11 % | 15 % | 38 % | 20 | 0,198 |
| λ=0 | 138 | 12 % | 16 % | 39 % | 19 | 0,207 |

Même sous-ensemble, avec les **mots** à la place du radar :

| λ (mots, sous-ensemble radar) | houblons | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| λ=1 | 138 | 9 % | 14 % | 35 % | 19 | 0,148 |
| λ=0.75 | 138 | 13 % | 17 % | 39 % | 15 | 0,197 |
| λ=0.5 | 138 | 14 % | 19 % | 46 % | 13 | 0,228 |
| λ=0.25 | 138 | 15 % | 20 % | 48 % | 11,5 | 0,241 |
| λ=0 | 138 | 14 % | 20 % | 46 % | 12 | 0,254 |

Réserve : fuite possible de source (radar et substituts viennent de la même page) ; un radar est un résumé de 9 nombres par variété, absent pour 43 % ; les mots font mieux sur le même sous-ensemble.

## 7. Protocole d’un essai d’IA en re-classement (aucun appel fait ici)

- **Quoi** : le moteur garde la main sur la liste ; un modèle (Gemini) reçoit les 20 premiers candidats avec leurs fiches (mots, α, huiles) et rend un ordre des 10 premiers avec une phrase. Jamais sur tout le catalogue.
- **Banc** : les 30 premiers houblons de l’échantillon de ce banc (graine 181), aux deux moments (60′, dry hop), plus les 9 phares : 78 requêtes au plus, journalisées (entrée, sortie, durée, jetons).
- **À battre** : sur ces mêmes cas, MRR et rappel@10 du moteur seul (§ 2) et du meilleur réglage hors ligne (§ 6). Gain minimal pour continuer : +0,05 de MRR, ou +5 points de rappel@10, **et** les verdicts du brasseur sur les 9 phares (Nelson Sauvin : Hallertau Blanc dans les 5 premiers).
- **Limites** : durée par requête sous 3 s au p95 (écran Substituer) ; coût journalisé en jetons ; jamais dans `npm test` ; un fichier de requêtes figé et rejoué hors ligne pour comparer deux invites ; résultats dans un dossier daté, appels lancés à la main, très limités ; hors ligne : le moteur reste la réponse.
- **Risque** : même source que la référence (le modèle a vu Beer Maverick) ; contre la fuite, juger aussi sur les cinq cas du brasseur (K1 à K5) qui ne viennent pas de Beer Maverick.

