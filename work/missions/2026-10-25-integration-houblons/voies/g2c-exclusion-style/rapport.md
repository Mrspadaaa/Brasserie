# g2c : une seule fiche ne doit plus exclure Nelson Sauvin d’une Hazy (D90)

Mesure déterministe : `scripts/eval-hop/exclusion-style.ts`, lancé dans trois racines (prod et HEAD extraits par `git archive` vers un dossier court de `os.tmpdir()`, jamais en remplaçant un fichier du dépôt ; D90 dans le dépôt). Ce fichier est écrit par `scripts/eval-hop/exclusion-style-rapport.ts`.

Lecture : « exclu » = absent de la liste « ajouter » du moteur pour toutes les familles montées où il figure sous le style 21A (sans famille indésirable), alors que la même recette sous le style testé, ou la même visée sans « moins », l’y met. Mesuré sur le moteur, un seul moment (dry hop actif), catalogue de 318 houblons sans stock (tout vient du pool « à acheter » ; avec du stock, un houblon exclu reste proposé mais en conflit, première clé du classement : partie C).

Seuls trois styles des fixtures ont des familles indésirables : **21C** (herbacé, végétal vert), **23A** et **23G** (les douze, car un style sans houblon). La stout 16D n’en a aucune : sa mesure porte sur la visée « moins de résineux ».

## Production (49907352)

_avant d4 : peu de fiches par houblon ; une fiche suffit pour exclure._

### Houblons retirés du pool

| cas | variétés de la liste de base | retirées | restantes | premières retirées |
|---|---:|---:|---:|---|
| style 21C | 297 | **138** | 159 | Adeena, Admiral, Akoya, Aramis, Ariana, Astra |
| style 16D | 297 | **0** | 297 | — |
| style 23A | 297 | **297** | 0 | Adeena, Admiral, African Queen, Agnus, Ahhhroma, Ahtanum |
| style 23G | 297 | **297** | 0 | Adeena, Admiral, African Queen, Agnus, Ahhhroma, Ahtanum |
| visée « moins de résineux » · 16D | 294 | **99** | 195 | Adeena, Admiral, Ahtanum, Altus, Apollo, Ariana |
| visée « moins de résineux » · 21C | 156 | **49** | 107 | Ahtanum, Altus, Apollo, Atlas, Bobek, Caliente |

### Houblons phares

Fiches qui citent la famille, sur les fiches lues pour ce houblon (« moitié » = D90 la compte comme marquée).

| houblon | herbacé | végétal vert | résineux | 21C | 23A | 16D moins résineux | 21C moins résineux |
|---|---|---|---|---|---|---|---|
| Citra | 0/1 | 0/1 | 0/1 | non | exclu | non | non |
| Nelson Sauvin | 0/2 | 0/2 | 0/2 | non | exclu | non | non |
| Motueka | 0/2 | 0/2 | 0/2 | non | exclu | non | non |
| Galaxy | 0/1 | 0/1 | 0/1 | non | exclu | non | non |
| Mosaic | 0/1 | 1/1 (moitié) | 1/1 (moitié) | exclu | exclu | exclu | non |
| Hallertau Blanc | 0/2 | 0/2 | 0/2 | non | exclu | non | non |
| Cascade | 1/2 (moitié) | 0/2 | 1/2 (moitié) | exclu | exclu | exclu | non |
| Idaho 7 | 1/1 (moitié) | 0/1 | 1/1 (moitié) | exclu | exclu | exclu | non |
| Simcoe | 0/1 | 0/1 | 1/1 (moitié) | non | exclu | exclu | exclu |
| Strata | 0/1 | 0/1 | 0/1 | non | exclu | non | non |

### Suggérer, 21C : les 10 premières voies

**fixtures · plus d’agrumes**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Galaxy · 10′ · 40 g | 0 | stock |
| 2 | Ajouter Belma · 10′ · 40 g | 0 | à acheter |
| 3 | Ajouter El Dorado · 10′ · 40 g | 0 | à acheter |
| 4 | Assembler Galaxy + Motueka · 10′ · 20 g + 20 g | 0 | stock |
| 5 | Assembler Galaxy + Hallertau Blanc · 10′ · 20 g + 20 g | 0 | stock |
| 6 | Ajouter Galaxy · whirlpool · 40 g | 0 | stock |
| 7 | Ajouter Belma · whirlpool · 40 g | 0 | à acheter |
| 8 | Ajouter El Dorado · whirlpool · 40 g | 0 | à acheter |
| 9 | Ajouter Motueka · whirlpool · 20 g | 0 | stock |
| 10 | Ajouter Hallertau Blanc · whirlpool · 20 g | 0 | stock |

**fixtures · plus de tropical**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Galaxy · 10′ · 40 g | 0 | stock |
| 2 | Ajouter Belma · 10′ · 40 g | 0 | à acheter |
| 3 | Ajouter El Dorado · 10′ · 40 g | 0 | à acheter |
| 4 | Assembler Galaxy + Motueka · 10′ · 20 g + 20 g | 0 | stock |
| 5 | Assembler Galaxy + Hallertau Blanc · 10′ · 20 g + 20 g | 0 | stock |
| 6 | Ajouter Galaxy · dry hop en fermentation active · 40 g | 0 | stock |
| 7 | Ajouter Belma · dry hop en fermentation active · 40 g | 0 | à acheter |
| 7 | Ajouter El Dorado · dry hop en fermentation active · 40 g | 0 | à acheter |
| 9 | Ajouter Motueka · dry hop en fermentation active · 20 g | 0 | stock |
| 10 | Ajouter Motueka · whirlpool · 20 g | 0 | stock |

**catalogue entier en stock · plus d’agrumes**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Monroe · 10′ · 40 g | 0 | stock |
| 2 | Assembler Monroe + Medusa · 10′ · 20 g + 20 g | 0 | stock |
| 2 | Assembler Monroe + Multihead · 10′ · 20 g + 20 g | 0 | stock |
| 4 | Ajouter Medusa · 10′ · 40 g | 0 | stock |
| 4 | Ajouter Multihead · 10′ · 40 g | 0 | stock |
| 6 | Ajouter Shaddock · 10′ · 40 g | 0 | stock |
| 7 | Ajouter Riwaka · 10′ · 40 g | 0 | stock |
| 8 | Ajouter Yellow Sub · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Columbia · 10′ · 40 g | 0 | stock |
| 10 | Ajouter Huell Melon · 10′ · 40 g | 0 | stock |

**catalogue entier en stock · plus de tropical**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Monroe · 10′ · 40 g | 0 | stock |
| 2 | Assembler Monroe + Medusa · 10′ · 20 g + 20 g | 0 | stock |
| 2 | Assembler Monroe + Multihead · 10′ · 20 g + 20 g | 0 | stock |
| 4 | Ajouter Medusa · 10′ · 40 g | 0 | stock |
| 4 | Ajouter Multihead · 10′ · 40 g | 0 | stock |
| 6 | Ajouter Riwaka · 10′ · 40 g | 0 | stock |
| 7 | Ajouter Kohatu · 10′ · 40 g | 0 | stock |
| 8 | Ajouter Columbia · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Vienna Gold · 10′ · 40 g | 0 | stock |
| 10 | Ajouter Tropica · 10′ · 40 g | 0 | stock |

### Substituer, 21C, dry hop : remplaçants

**Galaxy** : 138 candidats sur 317 en conflit de style (derrière tous les autres).

Dix premiers : 1. Samba (97) ; 2. Zamba Blend (92) ; 3. Harlequin (91) ; 4. Nectaron (89) ; 5. NZH-107 (88) ; 5. YQH-1380 (88) ; 7. Trident (87) ; 7. Tropica (87) ; 9. Solero (86) ; 9. Southern Sublime (86).

Rangs des phares : Citra 25 ; Nelson Sauvin 95 ; Motueka 49 ; Mosaic 209 (conflit green) ; Hallertau Blanc 25 ; Cascade 214 (conflit herbal) ; Idaho 7 203 (conflit herbal) ; Simcoe 31 ; Strata 39.

**Nelson Sauvin** : 138 candidats sur 317 en conflit de style (derrière tous les autres).

Dix premiers : 1. Herkules (93) ; 2. Boomerang (92) ; 3. Phoenix (90) ; 4. Kazbek (88) ; 5. Godiva (87) ; 6. Olympic (85) ; 7. Southern Cross (84) ; 8. Altus (83) ; 8. Diamant (83) ; 8. Jarrylo (83).

Rangs des phares : Citra 78 ; Motueka 43 ; Galaxy 104 ; Mosaic 253 (conflit green) ; Hallertau Blanc 98 ; Cascade 188 (conflit herbal) ; Idaho 7 274 (conflit herbal) ; Simcoe 83 ; Strata 65.


## HEAD (d4, sans D90)

_fiches de 12 sources ; une fiche suffit pour exclure._

### Houblons retirés du pool

| cas | variétés de la liste de base | retirées | restantes | premières retirées |
|---|---:|---:|---:|---|
| style 21C | 299 | **175** | 124 | Adeena, Admiral, Ahtanum, Akoya, Amarillo, Aramis |
| style 16D | 299 | **0** | 299 | — |
| style 23A | 299 | **299** | 0 | Adeena, Admiral, African Queen, Agnus, Ahhhroma, Ahtanum |
| style 23G | 299 | **299** | 0 | Adeena, Admiral, African Queen, Agnus, Ahhhroma, Ahtanum |
| visée « moins de résineux » · 16D | 298 | **133** | 165 | Adeena, Admiral, Ahtanum, Altus, Amarillo, Apollo |
| visée « moins de résineux » · 21C | 123 | **44** | 79 | Altus, Apollo, Atlas, Caliente, Callista, Canadian Redvine |

### Houblons phares

Fiches qui citent la famille, sur les fiches lues pour ce houblon (« moitié » = D90 la compte comme marquée).

| houblon | herbacé | végétal vert | résineux | 21C | 23A | 16D moins résineux | 21C moins résineux |
|---|---|---|---|---|---|---|---|
| Citra | 0/7 | 0/7 | 1/7 | non | exclu | exclu | exclu |
| Nelson Sauvin | 0/9 | 1/9 | 0/9 | exclu | exclu | non | non |
| Motueka | 1/7 | 0/7 | 0/7 | exclu | exclu | non | non |
| Galaxy | 0/5 | 0/5 | 0/5 | non | exclu | non | non |
| Mosaic | 0/7 | 1/7 | 2/7 | exclu | exclu | exclu | non |
| Hallertau Blanc | 1/6 | 2/6 | 0/6 | exclu | exclu | non | non |
| Cascade | 3/9 | 1/9 | 3/9 | exclu | exclu | exclu | non |
| Idaho 7 | 3/6 (moitié) | 0/6 | 5/6 (moitié) | exclu | exclu | exclu | non |
| Simcoe | 1/6 | 0/6 | 6/6 (moitié) | exclu | exclu | exclu | non |
| Strata | 3/4 (moitié) | 0/4 | 0/4 | exclu | exclu | non | non |

### Suggérer, 21C : les 10 premières voies

**fixtures · plus d’agrumes**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Galaxy · 10′ · 40 g | 0 | stock |
| 2 | Ajouter Huell Melon · 10′ · 40 g | 0 | à acheter |
| 3 | Ajouter Belma · 10′ · 40 g | 0 | à acheter |
| 4 | Ajouter African Queen · 10′ · 40 g | 0 | à acheter |
| 5 | Ajouter Galaxy · whirlpool · 40 g | 0 | stock |
| 6 | Ajouter Huell Melon · whirlpool · 40 g | 0 | à acheter |
| 7 | Ajouter Citra cryo · whirlpool · 20 g | 0 | stock |
| 8 | Ajouter Citra cryo · 10′ · 20 g | 0 | stock |
| 9 | Assembler Galaxy + Citra cryo · 10′ · 20 g + 20 g | 1 | stock |
| 10 | Ajouter Target · 10′ · 5 g | 1 | stock |

**fixtures · plus de tropical**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Galaxy · 10′ · 40 g | 0 | stock |
| 2 | Ajouter Medusa · 10′ · 40 g | 0 | à acheter |
| 3 | Ajouter Belma · 10′ · 40 g | 0 | à acheter |
| 4 | Ajouter Galaxy · dry hop en fermentation active · 40 g | 0 | stock |
| 5 | Ajouter Belma · dry hop en fermentation active · 40 g | 0 | à acheter |
| 5 | Ajouter Medusa · dry hop en fermentation active · 40 g | 0 | à acheter |
| 7 | Ajouter Citra cryo · whirlpool · 20 g | 0 | stock |
| 8 | Ajouter Citra cryo · 10′ · 20 g | 0 | stock |
| 9 | Assembler Galaxy + Citra cryo · 10′ · 20 g + 20 g | 1 | stock |
| 10 | Remplacer Nugget par Nelson Sauvin · 60′ · 27 g | 1 | stock |

**catalogue entier en stock · plus d’agrumes**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Monroe · 10′ · 40 g | 0 | stock |
| 2 | Assembler Monroe + Medusa · 10′ · 20 g + 20 g | 0 | stock |
| 2 | Assembler Monroe + Multihead · 10′ · 20 g + 20 g | 0 | stock |
| 4 | Ajouter Medusa · 10′ · 40 g | 0 | stock |
| 4 | Ajouter Multihead · 10′ · 40 g | 0 | stock |
| 6 | Ajouter Shaddock · 10′ · 40 g | 0 | stock |
| 7 | Ajouter Yellow Sub · 10′ · 40 g | 0 | stock |
| 8 | Ajouter Huell Melon · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Tropica · 10′ · 40 g | 0 | stock |
| 10 | Ajouter NZH-107 · 10′ · 40 g | 0 | stock |

**catalogue entier en stock · plus de tropical**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Monroe · 10′ · 40 g | 0 | stock |
| 2 | Assembler Monroe + Medusa · 10′ · 20 g + 20 g | 0 | stock |
| 2 | Assembler Monroe + Multihead · 10′ · 20 g + 20 g | 0 | stock |
| 4 | Ajouter Medusa · 10′ · 40 g | 0 | stock |
| 4 | Ajouter Multihead · 10′ · 40 g | 0 | stock |
| 6 | Ajouter Vienna Gold · 10′ · 40 g | 0 | stock |
| 7 | Ajouter Tropica · 10′ · 40 g | 0 | stock |
| 8 | Ajouter NZH-107 · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Samba · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Zamba Blend · 10′ · 40 g | 0 | stock |

### Substituer, 21C, dry hop : remplaçants

**Galaxy** : 175 candidats sur 317 en conflit de style (derrière tous les autres).

Dix premiers : 1. Harlequin (65) ; 2. Citra (60) ; 3. Nectaron (59) ; 3. Rakau (59) ; 3. Zamba Blend (59) ; 6. Sultana (Denali) (58) ; 6. Trident (58) ; 8. Samba (57) ; 8. Southern Sublime (57) ; 8. Styrian Cardinal (57).

Rangs des phares : Citra 2 ; Nelson Sauvin 168 (conflit green) ; Motueka 211 (conflit herbal) ; Mosaic 143 (conflit green) ; Hallertau Blanc 171 (conflit herbal+green) ; Cascade 187 (conflit herbal+green) ; Idaho 7 151 (conflit herbal) ; Simcoe 164 (conflit herbal) ; Strata 149 (conflit herbal).

**Nelson Sauvin** : 154 candidats sur 317 en conflit de style (derrière tous les autres).

Dix premiers : 1. Sládek (61) ; 2. Solero (58) ; 2. Southern Sublime (58) ; 2. Trident (58) ; 5. Pacific Sunrise (57) ; 6. Herkules (56) ; 6. Southern Passion (56) ; 8. Lotus (55) ; 8. Nectaron (55) ; 10. Apollo (54).

Rangs des phares : Citra 17 ; Motueka 188 (conflit herbal) ; Galaxy 31 ; Mosaic 14 ; Hallertau Blanc 164 (conflit herbal) ; Cascade 181 (conflit herbal) ; Idaho 7 171 (conflit herbal) ; Simcoe 171 (conflit herbal) ; Strata 181 (conflit herbal).


## HEAD + D90

_exclusion seulement si la famille est citée par la moitié au moins des fiches._

### Houblons retirés du pool

| cas | variétés de la liste de base | retirées | restantes | premières retirées |
|---|---:|---:|---:|---|
| style 21C | 299 | **113** | 186 | Adeena, Admiral, Akoya, Aramis, Astra, Aurum |
| style 16D | 299 | **0** | 299 | — |
| style 23A | 299 | **298** | 1 | Adeena, Admiral, African Queen, Agnus, Ahhhroma, Ahtanum |
| style 23G | 299 | **298** | 1 | Adeena, Admiral, African Queen, Agnus, Ahhhroma, Ahtanum |
| visée « moins de résineux » · 16D | 298 | **88** | 210 | Adeena, Admiral, Ahtanum, Altus, Apollo, Atlas |
| visée « moins de résineux » · 21C | 185 | **53** | 132 | Ahtanum, Altus, Apollo, Atlas, Azacca, Bobek |

### Houblons phares

Fiches qui citent la famille, sur les fiches lues pour ce houblon (« moitié » = D90 la compte comme marquée).

| houblon | herbacé | végétal vert | résineux | 21C | 23A | 16D moins résineux | 21C moins résineux |
|---|---|---|---|---|---|---|---|
| Citra | 0/7 | 0/7 | 1/7 | non | exclu | non | non |
| Nelson Sauvin | 0/9 | 1/9 | 0/9 | non | exclu | non | non |
| Motueka | 1/7 | 0/7 | 0/7 | non | exclu | non | non |
| Galaxy | 0/5 | 0/5 | 0/5 | non | exclu | non | non |
| Mosaic | 0/7 | 1/7 | 2/7 | non | exclu | non | non |
| Hallertau Blanc | 1/6 | 2/6 | 0/6 | non | exclu | non | non |
| Cascade | 3/9 | 1/9 | 3/9 | non | exclu | non | non |
| Idaho 7 | 3/6 (moitié) | 0/6 | 5/6 (moitié) | exclu | exclu | exclu | non |
| Simcoe | 1/6 | 0/6 | 6/6 (moitié) | non | exclu | exclu | exclu |
| Strata | 3/4 (moitié) | 0/4 | 0/4 | exclu | exclu | non | non |

### Suggérer, 21C : les 10 premières voies

**fixtures · plus d’agrumes**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Galaxy · 10′ · 40 g | 0 | stock |
| 2 | Ajouter Huell Melon · 10′ · 40 g | 0 | à acheter |
| 3 | Ajouter Belma · 10′ · 40 g | 0 | à acheter |
| 4 | Ajouter African Queen · 10′ · 40 g | 0 | à acheter |
| 5 | Ajouter Galaxy · whirlpool · 40 g | 0 | stock |
| 6 | Ajouter Huell Melon · whirlpool · 40 g | 0 | à acheter |
| 7 | Ajouter Citra cryo · whirlpool · 20 g | 0 | stock |
| 8 | Ajouter Citra cryo · 10′ · 20 g | 0 | stock |
| 9 | Assembler Motueka + Nelson Sauvin · 10′ · 5 g + 5 g | 0 | stock |
| 10 | Remplacer Nugget par Nelson Sauvin · 60′ · 27 g | 0 | stock |

**fixtures · plus de tropical**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Galaxy · 10′ · 40 g | 0 | stock |
| 2 | Ajouter Medusa · 10′ · 40 g | 0 | à acheter |
| 3 | Ajouter Belma · 10′ · 40 g | 0 | à acheter |
| 4 | Ajouter Galaxy · dry hop en fermentation active · 40 g | 0 | stock |
| 5 | Ajouter Belma · dry hop en fermentation active · 40 g | 0 | à acheter |
| 5 | Ajouter Medusa · dry hop en fermentation active · 40 g | 0 | à acheter |
| 7 | Ajouter Citra cryo · whirlpool · 20 g | 0 | stock |
| 8 | Ajouter Citra cryo · 10′ · 20 g | 0 | stock |
| 9 | Assembler Motueka + Nelson Sauvin · 10′ · 5 g + 5 g | 0 | stock |
| 10 | Remplacer Nugget par Nelson Sauvin · 60′ · 27 g | 0 | stock |

**catalogue entier en stock · plus d’agrumes**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Monroe · 10′ · 40 g | 0 | stock |
| 2 | Assembler Monroe + Medusa · 10′ · 20 g + 20 g | 0 | stock |
| 2 | Assembler Monroe + Multihead · 10′ · 20 g + 20 g | 0 | stock |
| 4 | Ajouter Medusa · 10′ · 40 g | 0 | stock |
| 4 | Ajouter Multihead · 10′ · 40 g | 0 | stock |
| 6 | Ajouter Shaddock · 10′ · 40 g | 0 | stock |
| 7 | Ajouter Yellow Sub · 10′ · 40 g | 0 | stock |
| 8 | Ajouter Huell Melon · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Tropica · 10′ · 40 g | 0 | stock |
| 10 | Ajouter NZH-107 · 10′ · 40 g | 0 | stock |

**catalogue entier en stock · plus de tropical**

| rang | voie | conflits | domaine |
|---:|---|---:|---|
| 1 | Ajouter Monroe · 10′ · 40 g | 0 | stock |
| 2 | Assembler Monroe + Medusa · 10′ · 20 g + 20 g | 0 | stock |
| 2 | Assembler Monroe + Multihead · 10′ · 20 g + 20 g | 0 | stock |
| 4 | Ajouter Medusa · 10′ · 40 g | 0 | stock |
| 4 | Ajouter Multihead · 10′ · 40 g | 0 | stock |
| 6 | Ajouter Vienna Gold · 10′ · 40 g | 0 | stock |
| 7 | Ajouter Tropica · 10′ · 40 g | 0 | stock |
| 8 | Ajouter NZH-107 · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Samba · 10′ · 40 g | 0 | stock |
| 9 | Ajouter Zamba Blend · 10′ · 40 g | 0 | stock |

### Substituer, 21C, dry hop : remplaçants

**Galaxy** : 113 candidats sur 317 en conflit de style (derrière tous les autres).

Dix premiers : 1. Harlequin (65) ; 2. Citra (60) ; 2. Mosaic (60) ; 4. Nectaron (59) ; 4. Rakau (59) ; 4. Zamba Blend (59) ; 7. Azacca (58) ; 7. Comet (58) ; 7. Sultana (Denali) (58) ; 7. Trident (58).

Rangs des phares : Citra 2 ; Nelson Sauvin 41 ; Motueka 98 ; Mosaic 2 ; Hallertau Blanc 44 ; Cascade 59 ; Idaho 7 207 (conflit herbal) ; Simcoe 35 ; Strata 205 (conflit herbal).

**Nelson Sauvin** : 97 candidats sur 317 en conflit de style (derrière tous les autres).

Dix premiers : 1. Hallertau Blanc (65) ; 2. Cashmere (61) ; 2. Sládek (61) ; 4. Styrian Dragon (59) ; 5. Mandarina Bavaria (58) ; 5. Solero (58) ; 5. Southern Sublime (58) ; 5. Trident (58) ; 9. Pacific Sunrise (57) ; 10. Herkules (56).

Rangs des phares : Citra 29 ; Motueka 41 ; Galaxy 50 ; Mosaic 24 ; Hallertau Blanc 1 ; Cascade 29 ; Idaho 7 222 (conflit herbal) ; Simcoe 16 ; Strata 226 (conflit herbal).

## Trois lectures de « citée » (même catalogue, états identiques)

Variétés du catalogue qui citent la famille, selon la lecture. « Une fiche » est l’ancienne règle ; « niveau marqué » est celui de `describeFamilies` (deux fiches, ou premier descripteur) ; « moitié » est D90.

| famille(s) | une fiche | niveau « marqué » | moitié des fiches (D90) |
|---|---:|---:|---:|
| 21C : herbacé ou végétal vert (fiches d4) | 175 | 95 | 113 |
| moins de résineux : résineux (fiches d4) | 134 | 76 | 89 |
| 21C : herbacé ou végétal vert (production) | 138 | 52 | 138 |
| moins de résineux : résineux (production) | 102 | 31 | 102 |
