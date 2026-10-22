# Annexe : mesures complètes, voie b-nelson-sauvin

Mesuré le 2026-10-22 avec les fonctions réelles du prototype (describeFamilies, familyWords, hopDescriptorEvidence, simulerCas, hopProfile), sur `prototypes/houblons-v4/data/proto-data.json` (318 variétés). Aucun fichier du dépôt n'a été modifié : les scripts sont recopiés en bas de cette page et vivent dans le dossier temporaire de la session.

Définitions. « Mot » : un élément d'une description après le découpage de `itemsOf` (hops.ts:62, aux virgules, points-virgules et « and »). « Rattaché » : le mot est reconnu par au moins une des 12 listes de `axes[].terms` (hopExtrapolationBootstrap.json). « Sans famille » : aucun des 12 axes ne le reconnaît. « Fiche » : une source distincte (auteur et référence), donc au plus 2 ici : Beer Maverick (tags) et Hopsteiner (une seule fiche pour ses deux lignes).

## 1. Les cinq houblons, mot par mot

| Houblon | Mots | Rattachés | Sans famille | Part sans famille | Mots-catégories Hopsteiner | Familles non décrites |
|---|---|---|---|---|---|---|
| Nelson Sauvin | 12 | 2 | 10 | 83 % | 3 | 10 |
| Motueka | 12 | 9 | 3 | 25 % | 2 | 9 |
| Citra | 9 | 8 | 1 | 11 % | 0 | 7 |
| Saaz (CZ) | 8 | 6 | 2 | 25 % | 1 | 6 |
| Galaxy | 7 | 5 | 2 | 29 % | 0 | 9 |

Saaz : la variété `beermaverick-saaz-cz` (Saaz (CZ)), la seule des trois Saaz du catalogue qui a une fiche Hopsteiner. Citra : la clé `beermaverick-citra` (le stock détient le cryo, `citra:cryo`, qui partage ces fiches).

### Nelson Sauvin

| Origine du mot | Mot (texte source) | Famille(s) reconnue(s) |
|---|---|---|
| tags Beer Maverick | white wine | **sans famille** |
| tags Beer Maverick | fruity | **sans famille** |
| tags Beer Maverick | gooseberry | **sans famille** |
| tags Beer Maverick | grapes | **sans famille** |
| tags Beer Maverick | sauvignon blanc | **sans famille** |
| Hopsteiner : familles déclarées | Fruité | **sans famille** |
| Hopsteiner : familles déclarées | Agrumes | Agrumes |
| Hopsteiner : familles déclarées | Épicé | Épicé |
| Hopsteiner : descripteurs de la fiche | White wine | **sans famille** |
| Hopsteiner : descripteurs de la fiche | fruity | **sans famille** |
| Hopsteiner : descripteurs de la fiche | grape | **sans famille** |
| Hopsteiner : descripteurs de la fiche | gooseberry | **sans famille** |

Familles qui s'affichent sur la fiche (niveau, fiches qui la citent, poids de forme du profil simulé, hauteur de barre en px selon `Math.min(22, 10 × fiches)` de l8g/noyau.mjs, mots rattachés) :

| Famille | Niveau | Fiches | Poids de forme | Barre | Mots montrés |
|---|---|---|---|---|---|
| Agrumes | cité | 1/2 | 0.5 | 10 px | Agrumes |
| Épicé | cité | 1/2 | 0.5 | 10 px | Épicé |

Mots « sans famille » tels que la fiche les écrit (dédoublonnés à la casse près, anglais et français séparés) : vin blanc, fruité, groseille à maquereau, raisin, sauvignon blanc, white wine, fruity, grape, gooseberry (9). La fiche en montre 3 puis « +6 » (MAXM = 3, l8g/noyau.mjs:324 et 382).

### Motueka

| Origine du mot | Mot (texte source) | Famille(s) reconnue(s) |
|---|---|---|
| tags Beer Maverick | citrus | Agrumes |
| tags Beer Maverick | mojito | **sans famille** |
| tags Beer Maverick | lime | Agrumes |
| tags Beer Maverick | lemon | Agrumes |
| tags Beer Maverick | tropical fruit | Tropicaux |
| tags Beer Maverick | floral | Floral |
| Hopsteiner : familles déclarées | Agrumes | Agrumes |
| Hopsteiner : familles déclarées | Fruité | **sans famille** |
| Hopsteiner : descripteurs de la fiche | Fresh lime | Agrumes |
| Hopsteiner : descripteurs de la fiche | lemon zest | Agrumes |
| Hopsteiner : descripteurs de la fiche | mojito | **sans famille** |
| Hopsteiner : descripteurs de la fiche | citrus | Agrumes |

Familles qui s'affichent sur la fiche (niveau, fiches qui la citent, poids de forme du profil simulé, hauteur de barre en px selon `Math.min(22, 10 × fiches)` de l8g/noyau.mjs, mots rattachés) :

| Famille | Niveau | Fiches | Poids de forme | Barre | Mots montrés |
|---|---|---|---|---|---|
| Agrumes | marqué (premier) | 2/2 | 1 | 20 px | agrumes, citron vert, citron, Agrumes, Fresh lime, lemon zest, citrus |
| Tropicaux | cité | 1/2 | 0.5 | 10 px | fruits tropicaux |
| Floral | cité | 1/2 | 0.5 | 10 px | floral |

Mots « sans famille » tels que la fiche les écrit (dédoublonnés à la casse près, anglais et français séparés) : mojito, fruité (2). La fiche les montre toutes (MAXM = 3, l8g/noyau.mjs:324 et 382).

### Citra

| Origine du mot | Mot (texte source) | Famille(s) reconnue(s) |
|---|---|---|
| tags Beer Maverick | citrus | Agrumes |
| tags Beer Maverick | grapefruit | Agrumes |
| tags Beer Maverick | peach | Noyau |
| tags Beer Maverick | melon | Melon |
| tags Beer Maverick | lime | Agrumes |
| tags Beer Maverick | floral | Floral |
| tags Beer Maverick | gooseberry | **sans famille** |
| tags Beer Maverick | passion fruit | Tropicaux |
| tags Beer Maverick | lychee | Tropicaux |

Familles qui s'affichent sur la fiche (niveau, fiches qui la citent, poids de forme du profil simulé, hauteur de barre en px selon `Math.min(22, 10 × fiches)` de l8g/noyau.mjs, mots rattachés) :

| Famille | Niveau | Fiches | Poids de forme | Barre | Mots montrés |
|---|---|---|---|---|---|
| Agrumes | marqué (premier) | 1/1 | 1 | 10 px | agrumes, pamplemousse, citron vert |
| Tropicaux | cité | 1/1 | 0.5 | 10 px | fruit de la passion, litchi |
| Noyau | cité | 1/1 | 0.5 | 10 px | pêche |
| Melon | cité | 1/1 | 0.5 | 10 px | melon |
| Floral | cité | 1/1 | 0.5 | 10 px | floral |

Mots « sans famille » tels que la fiche les écrit (dédoublonnés à la casse près, anglais et français séparés) : groseille à maquereau (1). La fiche les montre toutes (MAXM = 3, l8g/noyau.mjs:324 et 382).

### Saaz (CZ)

| Origine du mot | Mot (texte source) | Famille(s) reconnue(s) |
|---|---|---|
| tags Beer Maverick | earthy | Terreux |
| tags Beer Maverick | herbal | Herbacé |
| tags Beer Maverick | floral | Floral |
| tags Beer Maverick | mild | **sans famille** |
| tags Beer Maverick | noble | **sans famille** |
| Hopsteiner : familles déclarées | Épicé | Épicé |
| Hopsteiner : descripteurs de la fiche | Grass | Végétal |
| Hopsteiner : descripteurs de la fiche | lemon | Agrumes |

Familles qui s'affichent sur la fiche (niveau, fiches qui la citent, poids de forme du profil simulé, hauteur de barre en px selon `Math.min(22, 10 × fiches)` de l8g/noyau.mjs, mots rattachés) :

| Famille | Niveau | Fiches | Poids de forme | Barre | Mots montrés |
|---|---|---|---|---|---|
| Agrumes | cité | 1/2 | 0.5 | 10 px | lemon |
| Floral | cité | 1/2 | 0.5 | 10 px | floral |
| Herbacé | cité | 1/2 | 0.5 | 10 px | herbacé |
| Épicé | marqué (premier) | 1/2 | 1 | 10 px | Épicé |
| Végétal | marqué (premier) | 1/2 | 1 | 10 px | Grass |
| Terreux | marqué (premier) | 1/2 | 1 | 10 px | terreux |

Mots « sans famille » tels que la fiche les écrit (dédoublonnés à la casse près, anglais et français séparés) : doux, noble (2). La fiche les montre toutes (MAXM = 3, l8g/noyau.mjs:324 et 382).

### Galaxy

| Origine du mot | Mot (texte source) | Famille(s) reconnue(s) |
|---|---|---|
| tags Beer Maverick | passion fruit | Tropicaux |
| tags Beer Maverick | citrus | Agrumes |
| tags Beer Maverick | peach | Noyau |
| tags Beer Maverick | pineapple | Tropicaux |
| tags Beer Maverick | tropical fruit | Tropicaux |
| tags Beer Maverick | cannabis | **sans famille** |
| tags Beer Maverick | dank | **sans famille** |

Familles qui s'affichent sur la fiche (niveau, fiches qui la citent, poids de forme du profil simulé, hauteur de barre en px selon `Math.min(22, 10 × fiches)` de l8g/noyau.mjs, mots rattachés) :

| Famille | Niveau | Fiches | Poids de forme | Barre | Mots montrés |
|---|---|---|---|---|---|
| Agrumes | cité | 1/1 | 0.5 | 10 px | agrumes |
| Tropicaux | marqué (premier) | 1/1 | 1 | 10 px | fruit de la passion, ananas, fruits tropicaux |
| Noyau | cité | 1/1 | 0.5 | 10 px | pêche |

Mots « sans famille » tels que la fiche les écrit (dédoublonnés à la casse près, anglais et français séparés) : cannabis, dank (2). La fiche les montre toutes (MAXM = 3, l8g/noyau.mjs:324 et 382).

## 2. Tout le catalogue

- 318 variétés, 301 avec des mots, 2105 mots : 1633 rattachés (78 %), 472 sans famille (22.4 %).
- Nelson Sauvin a la plus forte part de mots sans famille des houblons qui ont 6 mots ou plus (rang 1 sur 180, 83 %) ; Hallertau Blanc est 2e (67 %), Boadicea, Southern Dawn et Zenia 3es (56 %).
- Mots les plus fréquents sans famille (nombre de variétés, anglais singularisé) : fruity 57 ; fruité 37 ; noble 27 ; dank 18 ; sweet 14 ; lemongrass 13 ; gooseberry 12 ; tobacco 11 ; honey 10 ; mild 10 ; zest 9 ; cannabis 8 ; pungent 8 ; clean 8 ; white wine 7 ; candy 7 ; onion 7 ; vanilla 6 ; caramel 6 ; curry 6 ; bubblegum 5 ; sweet fruit 5 ; ginger 5 ; cream 5 ; aniseed 4 ; hoppy 4 ; doux 4 ; pleasant 4 ; grape 4 ; redberry 4 ; banana 4 ; marmalade 4.
- Catégories des lignes Hopsteiner « Familles déclarées » (nombre de lignes) : épicé 45 ; herbacé 44 ; fruité 37 ; agrumes 37 ; floral 19 ; résineux 18 ; doux 4. Le « fruité » générique (mot « fruity » ou « fruité » dans une description) concerne 77 variétés.
- Sauvignon-blanc et groseille dans le catalogue : « white wine » dans Astra, Emerald Spire, Enigma, Godiva, Hallertau Blanc, Jarrylo, Nelson Sauvin ; « gooseberry » dans African Queen, Ariana, Bramling Cross, Styrian Cardinal, Citra, Galena, Godiva, Hallertau Blanc, Marco Polo, Nelson Sauvin, Super Galena, XJA2/436 ; « grape » dans Emerald Spire, Hallertau Blanc, Mistral, Nelson Sauvin.

Parts de mots sans famille les plus fortes (6 mots ou plus) et concepts sans famille des cinq :

```
--- part de mots sans famille, plus fortes (6 mots ou plus) ---
Nelson Sauvin: 10/12 = 83 %
Hallertau Blanc: 10/15 = 67 %
Boadicea: 5/9 = 56 %
Southern Dawn: 5/9 = 56 %
Zenia: 5/9 = 56 %
African Queen: 6/11 = 55 %
Emerald Spire: 4/8 = 50 %
Pacifica: 4/8 = 50 %
Relax: 4/8 = 50 %
Southern Tropic: 5/10 = 50 %
Strata: 3/6 = 50 %
Smaragd: 6/13 = 46 %
Hallertau Taurus: 5/11 = 45 %
Sovereign: 5/11 = 45 %
Triskel: 5/11 = 45 %
rang de Nelson Sauvin (part sans famille décroissante, 6 mots ou plus) : 1 sur 180
--- concepts sans famille, par houblon (concept, nombre de fiches qui le citent) ---
Nelson Sauvin : 6 concepts (white wine 2, fruity 2, gooseberry 2, grape 2, sauvignon blanc 1, fruité 1) ; mots 12, rattaches 2
Motueka : 2 concepts (mojito 2, fruité 1) ; mots 12, rattaches 9
Citra : 1 concepts (gooseberry 1) ; mots 9, rattaches 8
Saaz (CZ) : 2 concepts (mild 1, noble 1) ; mots 8, rattaches 6
Galaxy : 2 concepts (cannabis 1, dank 1) ; mots 7, rattaches 5
```

## 3. Les corrections essayées en mémoire (niveaux par famille : M = marqué, c = cité, n/N = fiches qui la citent)

C1 = « gooseberry, gooseberries, groseille à maquereau » ajoutés aux termes des petits fruits. C3 = les deux fiches communautaires déjà dans le dépôt mais non lues par le prototype (kasperg3/HopDatabase dans `hopDatabaseBootstrap.json`, stuartraetaylor/hops-json dans `hopLegacyBootstrap.json`, année non datée).

```
--- essais sur les cinq ---
Nelson Sauvin
  actuel : citrus:c1/2 spice:c1/2
  C1 (gooseberry vers petits fruits) : citrus:c1/2 berries:M2/2 spice:c1/2
  C3 (+2 fiche(s) communautaire(s)) : citrus:M2/4 tropical:c1/4 berries:M1/4 herbal:c1/4 spice:c1/4 earthy:c1/4
     fiches : kasperg3/HopDatabase : Descripteurs documentaires (langue source) : berry, citrus, fruity, gooseberries, grape, herbal/earthy, tropical, tropical/fruit, white wine | stuartraetaylor/hops-json : Descripteurs documentaires (langue source) : Distinctive white wine 'fruitiness', gooseberry
  C1+C3 : citrus:M2/4 tropical:c1/4 berries:M4/4 herbal:c1/4 spice:c1/4 earthy:c1/4
Motueka
  actuel : citrus:M2/2 tropical:c1/2 floral:c1/2
  C1 (gooseberry vers petits fruits) : citrus:M2/2 tropical:c1/2 floral:c1/2
  C3 (+2 fiche(s) communautaire(s)) : citrus:M4/4 tropical:M3/4 floral:c1/4
     fiches : kasperg3/HopDatabase : Descripteurs documentaires (langue source) : citrus, fresh lime, fruity, lemon, lemon zest, lime, mojito, tropical, tropical/fruit | stuartraetaylor/hops-json : Descripteurs documentaires (langue source) : Lemon, lime, tropical fruit
  C1+C3 : citrus:M4/4 tropical:M3/4 floral:c1/4
Citra
  actuel : citrus:M1/1 tropical:c1/1 stoneFruit:c1/1 melon:c1/1 floral:c1/1
  C1 (gooseberry vers petits fruits) : citrus:M1/1 tropical:c1/1 stoneFruit:c1/1 berries:c1/1 melon:c1/1 floral:c1/1
  C3 (+2 fiche(s) communautaire(s)) : citrus:M3/3 tropical:M3/3 stoneFruit:M2/3 berries:M1/3 melon:M2/3 floral:c1/3 resin:c1/3
     fiches : kasperg3/HopDatabase : Descripteurs documentaires (langue source) : blackberry, citrus, gooseberry, grapefruit, mango, pineapple, stone fruit, tropical, tropical/fruit, woody | stuartraetaylor/hops-json : Descripteurs documentaires (langue source) : Strong citrus and tropical tones - grapefruit, melon, lime, gooseberry, passion fruit and lychee
  C1+C3 : citrus:M3/3 tropical:M3/3 stoneFruit:M2/3 berries:M3/3 melon:M2/3 floral:c1/3 resin:c1/3
Saaz (CZ)
  actuel : citrus:c1/2 floral:c1/2 herbal:c1/2 spice:M1/2 green:M1/2 earthy:M1/2
  C1 (gooseberry vers petits fruits) : citrus:c1/2 floral:c1/2 herbal:c1/2 spice:M1/2 green:M1/2 earthy:M1/2
  C3 (+2 fiche(s) communautaire(s)) : citrus:c1/4 floral:M2/4 herbal:M2/4 resin:c1/4 spice:M2/4 green:M2/4 earthy:M2/4
     fiches : kasperg3/HopDatabase : Descripteurs documentaires (langue source) : earthy, floral, grassy, herbal/earthy, spicy, woody | stuartraetaylor/hops-json : Descripteurs documentaires (langue source) : Very mild with pleasant hoppy notes
  C1+C3 : citrus:c1/4 floral:M2/4 herbal:M2/4 resin:c1/4 spice:M2/4 green:M2/4 earthy:M2/4
Galaxy
  actuel : citrus:c1/1 tropical:M1/1 stoneFruit:c1/1
  C1 (gooseberry vers petits fruits) : citrus:c1/1 tropical:M1/1 stoneFruit:c1/1
  C3 (+2 fiche(s) communautaire(s)) : citrus:M3/3 tropical:M3/3 stoneFruit:M3/3 berries:M1/3
     fiches : kasperg3/HopDatabase : Descripteurs documentaires (langue source) : black currant, black current, blueberry, citrus, gooseberry, peach, pineapple, stone fruit, tropical | stuartraetaylor/hops-json : Descripteurs documentaires (langue source) : Strong passionfruit, peach and citrus
  C1+C3 : citrus:M3/3 tropical:M3/3 stoneFruit:M3/3 berries:M1/3
```

Portée de C1 sur le catalogue : 7 variétés changent de niveau : Styrian Cardinal (berries 0 vers 1) ; Citra (berries 0 vers 1) ; Godiva (berries 0 vers 1) ; Hallertau Blanc (berries 1 vers 2) ; Marco Polo (berries 0 vers 2) ; Nelson Sauvin (berries 0 vers 2) ; Super Galena (berries 0 vers 1).

## 3 bis. Chiffres des trois options sur les cinq houblons (mesure-options.ts)

A = table de rattachement ciblée (petits fruits). B = part « autres » : concepts sans famille, dédoublonnés en anglais, hors mots génériques de la liste d'essai (fruity, fruité, noble, mild, sweet, doux, clean, pleasant, smooth, hoppy, fresh ; à trancher par le brasseur). C = partage de la force de la fiche : poids « autres » = 0,5 par concept, plafonné à 1, ajouté à la somme des poids de forme (profil-simule.ts:283) ; seules les parts sont calculées, pas les points, car le moteur n'est pas modifié ici.

```
Nelson Sauvin | actuel
  familles : citrus c1, spice c1
  mots sans famille : 10/12 = 83 %
  B, concepts « autres » (4) : white wine (2 fiches), gooseberry (2 fiches), grape (2 fiches), sauvignon blanc (1 fiche)
  part de la forme : {"citrus":50,"spice":50}
  C, part avec « autres » : {"citrus":25,"spice":25,"autres":50}
Nelson Sauvin | avec A
  familles : citrus c1, berries M2, spice c1
  mots sans famille : 8/12 = 67 %
  B, concepts « autres » (3) : white wine (2 fiches), grape (2 fiches), sauvignon blanc (1 fiche)
  part de la forme : {"citrus":25,"berries":50,"spice":25}
  C, part avec « autres » : {"citrus":17,"berries":33,"spice":17,"autres":33}
Motueka | actuel
  familles : citrus M2, tropical c1, floral c1
  mots sans famille : 3/12 = 25 %
  B, concepts « autres » (1) : mojito (2 fiches)
  part de la forme : {"citrus":50,"tropical":25,"floral":25}
  C, part avec « autres » : {"citrus":40,"tropical":20,"floral":20,"autres":20}
Motueka | avec A
  familles : citrus M2, tropical c1, floral c1
  mots sans famille : 3/12 = 25 %
  B, concepts « autres » (1) : mojito (2 fiches)
  part de la forme : {"citrus":50,"tropical":25,"floral":25}
  C, part avec « autres » : {"citrus":40,"tropical":20,"floral":20,"autres":20}
Citra | actuel
  familles : citrus M1, tropical c1, stoneFruit c1, melon c1, floral c1
  mots sans famille : 1/9 = 11 %
  B, concepts « autres » (1) : gooseberry (1 fiche)
  part de la forme : {"citrus":33,"tropical":17,"stoneFruit":17,"melon":17,"floral":17}
  C, part avec « autres » : {"citrus":29,"tropical":14,"stoneFruit":14,"melon":14,"floral":14,"autres":14}
Citra | avec A
  familles : citrus M1, tropical c1, stoneFruit c1, berries c1, melon c1, floral c1
  mots sans famille : 0/9 = 0 %
  B, concepts « autres » (0) : (aucun)
  part de la forme : {"citrus":29,"tropical":14,"stoneFruit":14,"berries":14,"melon":14,"floral":14}
  C, part avec « autres » : {"citrus":29,"tropical":14,"stoneFruit":14,"berries":14,"melon":14,"floral":14,"autres":0}
Saaz (CZ) | actuel
  familles : citrus c1, floral c1, herbal c1, spice M1, green M1, earthy M1
  mots sans famille : 2/8 = 25 %
  B, concepts « autres » (0) : (aucun)
  part de la forme : {"citrus":11,"floral":11,"herbal":11,"spice":22,"green":22,"earthy":22}
  C, part avec « autres » : {"citrus":11,"floral":11,"herbal":11,"spice":22,"green":22,"earthy":22,"autres":0}
Saaz (CZ) | avec A
  familles : citrus c1, floral c1, herbal c1, spice M1, green M1, earthy M1
  mots sans famille : 2/8 = 25 %
  B, concepts « autres » (0) : (aucun)
  part de la forme : {"citrus":11,"floral":11,"herbal":11,"spice":22,"green":22,"earthy":22}
  C, part avec « autres » : {"citrus":11,"floral":11,"herbal":11,"spice":22,"green":22,"earthy":22,"autres":0}
Galaxy | actuel
  familles : citrus c1, tropical M1, stoneFruit c1
  mots sans famille : 2/7 = 29 %
  B, concepts « autres » (2) : cannabis (1 fiche), dank (1 fiche)
  part de la forme : {"citrus":25,"tropical":50,"stoneFruit":25}
  C, part avec « autres » : {"citrus":17,"tropical":33,"stoneFruit":17,"autres":33}
Galaxy | avec A
  familles : citrus c1, tropical M1, stoneFruit c1
  mots sans famille : 2/7 = 29 %
  B, concepts « autres » (2) : cannabis (1 fiche), dank (1 fiche)
  part de la forme : {"citrus":25,"tropical":50,"stoneFruit":25}
  C, part avec « autres » : {"citrus":17,"tropical":33,"stoneFruit":17,"autres":33}
```

## 4. Le profil simulé du lot 21 (profil-simule.ts, correspondance-familles.json : poids de forme 1 / 0,5 / 0, λ = 0,5)

Stout 16D S1 (`s1Recipe`), US-05, 4 g/L, dry hop après fermentation (J+7, 3 jours) ou whirlpool ; même entrée que la grille de `scripts/profil-simule-cas.ts`. « Part de la forme » = poids ÷ somme des poids (profil-simule.ts:283). Écart = apport du houblon au centre, sur l'échelle 0–100 ; crans = cran du style.

| Houblon | Part de la forme | Écart dry hop après fermentation (centre ; crans) | Écart whirlpool (centre ; crans) |
|---|---|---|---|
| Nelson Sauvin | Agrumes 50 %, Épicé 50 % | Agrumes +14.28 (cran 1), Floral +4.78, Résineux +8.38 (cran 1), Épicé +14.18 (cran 1), Végétal +4.19 ; confiance faible | Agrumes +10.26 (cran 1), Floral +5.43, Résineux +2.33, Épicé +7.55 (cran 1), Végétal +1.08 ; confiance moyenne |
| Motueka | Agrumes 50 %, Tropicaux 25 %, Floral 25 % | Agrumes +16.88 (cran 2), Tropicaux +7.52 (cran 1), Floral +12.88, Résineux +8.63 (cran 1), Épicé +0.58, Végétal +6.78 ; confiance faible | Agrumes +13.62 (cran 1), Tropicaux +4.83, Floral +11.58, Résineux +2.41, Épicé +0.14, Végétal +1.77 ; confiance moyenne |
| Citra | Agrumes 33 %, Tropicaux 17 %, Noyau 17 %, Melon 17 %, Floral 17 % | Agrumes +35.18 (cran 4), Tropicaux +38.76 (cran 4), Noyau +23.15 (cran 2), Baies +32 (cran 3), Melon +23.15 (cran 2), Floral +31.96 (cran 2), Résineux +13.79 (cran 1), Épicé +2.57, Végétal +10.51 (cran 1) ; confiance bonne | Agrumes +29.44 (cran 3), Tropicaux +29.43 (cran 3), Noyau +15.59 (cran 2), Baies +22.73 (cran 2), Melon +15.59 (cran 2), Floral +25.77 (cran 1), Résineux +4.13, Épicé +0.66, Végétal +2.8 ; confiance moyenne |
| Galaxy | Agrumes 25 %, Tropicaux 50 %, Noyau 25 % | Agrumes +28.62 (cran 3), Tropicaux +38.96 (cran 4), Noyau +23.9 (cran 2), Baies +18.85 (cran 2), Floral +15.63 (cran 1), Résineux +19.69 (cran 2), Épicé +2.45, Végétal +17.29 (cran 2) ; confiance moyenne | Agrumes +24.19 (cran 2), Tropicaux +30.21 (cran 3), Noyau +16.38 (cran 2), Baies +11.96 (cran 1), Floral +17.32 (cran 1), Résineux +6.44, Épicé +0.63, Végétal +4.79 ; confiance moyenne |

Saaz (CZ) n'est pas simulé : composes-houblon.json ne contient que Citra, Citra cryo, Cascade, Galaxy, Idaho 7, Motueka, Nelson Sauvin et Nugget. Un houblon sans composés prend la force de Cascade, répartie selon ses seules fiches (`activiteSansDonnees`, profil-simule.ts:290).

Thiols dans le dépôt (data/composes-houblon.json) : Nelson Sauvin 4MMP, 3MH, 3M4MP sans valeur (« classe Hopsteiner forte seulement ») ; Motueka idem (« moyenne ») ; Galaxy 4MMP et 3M4MP supérieurs à 10 ; Citra précurseurs 23,6 mg/kg. Classe Hopsteiner « Thiol impact » (proto-data.json, hsThiol) : Nelson Sauvin forte, Motueka moyenne, Saaz faible ; Citra et Galaxy sans classe liée. Cette classe n'est lue que par yeast.ts (signal de libération des thiols) : elle n'apparaît ni sur la fiche ni dans les barres. Répartition dans le catalogue : 13 fortes, 14 moyennes, 32 faibles, 259 sans classe.

## 5. Le profil V5.5 de référence (hopProfile, whirlpool, 3 g/L)

```
== Nelson Sauvin (whirlpool, 3 g/L)
  citrus     cité       1/2  central=51.9  plage=0–100  situé=false  domaineComplet=true
  tropical   non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  stoneFruit non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  pomeFruit  non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  berries    non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  melon      non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  floral     non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  herbal     non décrit 0/2  central=29.2  plage=0–100  situé=false  domaineComplet=true
  resin      non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  spice      cité       1/2  central=51.4  plage=0–100  situé=false  domaineComplet=true
  green      non décrit 0/2  central=29.2  plage=0–100  situé=false  domaineComplet=true
  earthy     non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
== Motueka (whirlpool, 3 g/L)
  citrus     marqué     2/2  central=51.9  plage=0–100  situé=false  domaineComplet=true
  tropical   cité       1/2  central=51.4  plage=0–100  situé=false  domaineComplet=true
  stoneFruit non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  pomeFruit  non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  berries    non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  melon      non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  floral     cité       1/2  central=51.4  plage=0–100  situé=false  domaineComplet=true
  herbal     non décrit 0/2  central=29.2  plage=0–100  situé=false  domaineComplet=true
  resin      non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  spice      non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  green      non décrit 0/2  central=29.2  plage=0–100  situé=false  domaineComplet=true
  earthy     non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
== Citra (whirlpool, 3 g/L)
  citrus     marqué     1/1  central=51.9  plage=0–100  situé=false  domaineComplet=true
  tropical   cité       1/1  central=51.4  plage=0–100  situé=false  domaineComplet=true
  stoneFruit cité       1/1  central=51.4  plage=0–100  situé=false  domaineComplet=true
  pomeFruit  non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  berries    non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  melon      cité       1/1  central=51.4  plage=0–100  situé=false  domaineComplet=true
  floral     cité       1/1  central=51.4  plage=0–100  situé=false  domaineComplet=true
  herbal     non décrit 0/1  central=29.2  plage=0–100  situé=false  domaineComplet=true
  resin      non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  spice      non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  green      non décrit 0/1  central=29.2  plage=0–100  situé=false  domaineComplet=true
  earthy     non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
== Saaz (CZ) (whirlpool, 3 g/L)
  citrus     cité       1/2  central=51.9  plage=0–100  situé=false  domaineComplet=true
  tropical   non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  stoneFruit non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  pomeFruit  non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  berries    non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  melon      non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  floral     cité       1/2  central=51.4  plage=0–100  situé=false  domaineComplet=true
  herbal     cité       1/2  central=38.3  plage=0–100  situé=false  domaineComplet=true
  resin      non décrit 0/2  central=40  plage=0–100  situé=false  domaineComplet=true
  spice      marqué     1/2  central=51.4  plage=0–100  situé=false  domaineComplet=true
  green      marqué     1/2  central=38.3  plage=0–100  situé=false  domaineComplet=true
  earthy     marqué     1/2  central=51.4  plage=0–100  situé=false  domaineComplet=true
== Galaxy (whirlpool, 3 g/L)
  citrus     cité       1/1  central=51.9  plage=0–100  situé=false  domaineComplet=true
  tropical   marqué     1/1  central=51.4  plage=0–100  situé=false  domaineComplet=true
  stoneFruit cité       1/1  central=51.4  plage=0–100  situé=false  domaineComplet=true
  pomeFruit  non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  berries    non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  melon      non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  floral     non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  herbal     non décrit 0/1  central=29.2  plage=0–100  situé=false  domaineComplet=true
  resin      non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  spice      non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
  green      non décrit 0/1  central=29.2  plage=0–100  situé=false  domaineComplet=true
  earthy     non décrit 0/1  central=40  plage=0–100  situé=false  domaineComplet=true
```

Lecture : toutes les plages font 0–100 (domaine complet, jamais « situé »). Le repère central ne sépare une famille citée (51,4 à 51,9) d'une famille non décrite (40, ou 29,2 pour herbacé et végétal) que de 11 à 12 points. Ce que l'écran dessine pour différencier les houblons vient donc seulement du nombre de fiches qui citent chaque famille, c'est-à-dire du vocabulaire.

## 6. Scripts jetables

Lancés depuis `prototypes/houblons-v4` : `node_modules/.bin/vite-node --config <vite.mesure.config.mjs> <script>.ts`. Les chemins absolus sont ceux de cette machine ; `vite.mesure.config.mjs` reprend les deux alias de `vite.config.ts` et ouvre l'accès aux fichiers hors de la racine, pour que les scripts puissent rester hors du dépôt. Rien n'est écrit dans le dépôt.

### vite.mesure.config.mjs

```js
// Config jetable : mêmes alias que prototypes/houblons-v4/vite.config.ts, accès fichiers ouvert.
const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
export default {
  root: R + '/prototypes/houblons-v4',
  server: { fs: { strict: false } },
  resolve: { alias: [
    { find: /^@app\/(.*)$/, replacement: R + '/src/$1' },
    { find: /^@functions\/(.*)$/, replacement: R + '/functions/src/$1' },
  ] },
};
```

### mesure.ts

```ts
// Mesure jetable (voie b-nelson-sauvin) : lue seule, n'écrit rien dans le dépôt.
// Lancer depuis prototypes/houblons-v4 :
//   node_modules/.bin/vite-node --config vite.config.ts <chemin>/mesure.ts
import { describeFamilies, familyWords } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine/hops';
import { CATALOGUE_BY_ID, VARIETY_BY_ID, EXTRAPOLATION } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine/data';
import { FAMILIES } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine/families';
import { hopDescriptorEvidence } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/functions/src/hopExtrapolationCore';

const terms = new Map(EXTRAPOLATION.axes.map((a: any) => [a.id, a.terms]));
// Copie exacte de itemsOf (src/engine/hops.ts ligne 62) : le découpage d'une description en mots.
const itemsOf = (text: string) => (text.split(':').slice(1).join(':') || text).split(/,|;| and /)
  .map((s) => s.replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ')).filter(Boolean);
const origine = (d: any) => d.source.author === 'Beer Maverick' ? 'tags Beer Maverick'
  : /^Familles déclarées/.test(d.text) ? 'Hopsteiner : familles déclarées'
  : /^Descripteurs de la fiche/.test(d.text) ? 'Hopsteiner : descripteurs de la fiche' : d.source.author + ' (autre)';

const HOUBLONS: [string, string][] = [
  ['beermaverick-nelson-sauvin', 'Nelson Sauvin'], ['beermaverick-motueka', 'Motueka'],
  ['beermaverick-citra', 'Citra'], ['beermaverick-saaz-cz', 'Saaz (CZ)'], ['beermaverick-galaxy', 'Galaxy'],
];
const out: any = {};
for (const [id, nom] of HOUBLONS) {
  const v = VARIETY_BY_ID.get(id)!;
  const items: { origine: string; mot: string; familles: string[] }[] = [];
  for (const d of v.descriptions ?? []) {
    if ((d as any).context === 'beer') continue;
    for (const mot of itemsOf(d.text)) {
      const familles = FAMILIES.filter((f) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: mot }] } as any, (terms.get(f) as string[]) ?? []).length > 0);
      items.push({ origine: origine(d), mot, familles });
    }
  }
  const desc = describeFamilies(id);
  const fw = familyWords(id, CATALOGUE_BY_ID.get(id) as any);
  const poidsForme = { 'marqué': 1, 'cité': 0.5, 'non décrit': 0 } as const;
  out[nom] = {
    id, sources: desc.citrus.of,
    nbMots: items.length,
    nbRattaches: items.filter((i) => i.familles.length).length,
    nbSansFamille: items.filter((i) => !i.familles.length).length,
    // Mots de « Familles déclarées » : des noms de catégories, pas des descripteurs fins.
    nbMotsCategories: items.filter((i) => i.origine === 'Hopsteiner : familles déclarées').length,
    items,
    sansFamilleAffiches: [...new Set(fw.sansFamille.map((s) => s.mot.toLowerCase()))],
    familles: FAMILIES.filter((f) => desc[f].level !== 'non décrit').map((f) => ({
      f, niveau: desc[f].level, sources: `${desc[f].sources}/${desc[f].of}`, premier: desc[f].first, poidsForme: poidsForme[desc[f].level],
      hauteurBarre: Math.min(22, desc[f].sources * 10), mots: fw.mots[f].flatMap((r) => r.mots),
    })),
    nbNonDecrites: FAMILIES.filter((f) => desc[f].level === 'non décrit').length,
  };
}
console.log(JSON.stringify(out, null, 1));
```

### mesure-global.ts

```ts
// Mesure jetable 2 (voie b-nelson-sauvin) : portée sur tout le catalogue, et essai des corrections.
// Ne modifie rien : les corrections sont simulées en mémoire (termes ajoutés à la volée).
// Lancer depuis prototypes/houblons-v4 : node_modules/.bin/vite-node --config <vite.mesure.config.mjs> mesure-global.ts
import { VARIETY_BY_ID, EXTRAPOLATION } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine/data';
import { FAMILIES } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine/families';
import { hopDescriptorEvidence } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/functions/src/hopExtrapolationCore';
import fs from 'node:fs';

const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const baseTerms = new Map<string, string[]>(EXTRAPOLATION.axes.map((a: any) => [a.id, a.terms]));
// Copie de itemsOf (prototypes/houblons-v4/src/engine/hops.ts, ligne 62).
const itemsOf = (text: string) => (text.split(':').slice(1).join(':') || text).split(/,|;| and /)
  .map((s) => s.replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ')).filter(Boolean);
const isCategorie = (d: any) => /^Familles déclarées/.test(d.text);
const sing = (w: string) => w.toLowerCase().replace(/ies$/, 'y').replace(/([^siu])s$/, '$1');
const premierMot = (d: any) => (d.text.split(':').slice(1).join(':') || d.text).split(/,|;| and /)[0].replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ');

// Niveau d'une famille comme describeFamilies (hops.ts, ligne 38) : 0 non décrit, 1 cité, 2 marqué.
function niveaux(v: any, extra: Record<string, string[]> = {}, descExtra: any[] = []) {
  const descs = [...(v.descriptions ?? []), ...descExtra];
  const key = (d: any) => `${d.source.author}|${d.source.reference}`;
  const all = new Set(descs.map(key));
  const out: Record<string, { n: number; of: number; level: number }> = {};
  for (const f of FAMILIES) {
    const t = [...(baseTerms.get(f) ?? []), ...(extra[f] ?? [])];
    const ev = hopDescriptorEvidence({ ...v, descriptions: descs } as any, t);
    const keys = new Set(ev.map(key));
    const first = descs.some((d: any) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: premierMot(d) }] } as any, t).length > 0);
    out[f] = { n: keys.size, of: all.size, level: keys.size === 0 ? 0 : keys.size >= 2 || first ? 2 : 1 };
  }
  return out;
}
const resume = (n: ReturnType<typeof niveaux>) => FAMILIES.filter((f) => n[f].level > 0).map((f) => `${f}:${n[f].level === 2 ? 'M' : 'c'}${n[f].n}/${n[f].of}`).join(' ') || '(rien)';

// ---------- 1. Portée : tout le catalogue ----------
const stats = { varietes: 0, avecMots: 0, mots: 0, rattaches: 0, sans: 0 };
const freqSans = new Map<string, Set<string>>();
const freqCategories = new Map<string, number>();
const partSans: { id: string; nom: string; mots: number; sans: number; part: number }[] = [];
for (const v of VARIETY_BY_ID.values() as any) {
  stats.varietes++;
  let mots = 0, sans = 0;
  for (const d of v.descriptions ?? []) {
    if (d.context === 'beer') continue;
    for (const mot of itemsOf(d.text)) {
      const fams = FAMILIES.filter((f) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: mot }] } as any, baseTerms.get(f) ?? []).length > 0);
      mots++;
      if (isCategorie(d)) freqCategories.set(mot.toLowerCase(), (freqCategories.get(mot.toLowerCase()) ?? 0) + 1);
      if (!fams.length) { sans++; const k = sing(mot.replace(/^étiquette\s+/i, '')); if (!freqSans.has(k)) freqSans.set(k, new Set()); freqSans.get(k)!.add(v.id); }
    }
  }
  if (mots) { stats.avecMots++; stats.mots += mots; stats.sans += sans; stats.rattaches += mots - sans; partSans.push({ id: v.id, nom: v.name, mots, sans, part: sans / mots }); }
}
const top = [...freqSans.entries()].map(([m, s]) => [m, s.size] as const).sort((a, b) => b[1] - a[1]).slice(0, 45);

// ---------- 2. Essai des corrections ----------
const CINQ: [string, string][] = [['beermaverick-nelson-sauvin', 'Nelson Sauvin'], ['beermaverick-motueka', 'Motueka'], ['beermaverick-citra', 'Citra'], ['beermaverick-saaz-cz', 'Saaz (CZ)'], ['beermaverick-galaxy', 'Galaxy']];
// Correction 1 : rattachement ciblé. « groseille » est déjà dans les termes des petits fruits ; gooseberry est une baie (Ribes).
const C1: Record<string, string[]> = { berries: ['gooseberry', 'gooseberries', 'groseille à maquereau'] };
// Correction 3 : fiches communautaires déjà dans le dépôt mais non lues par le prototype.
const lire = (f: string) => JSON.parse(fs.readFileSync(`${R}/src/data/${f}.json`, 'utf8'));
const hd = lire('hopDatabaseBootstrap'), hl = lire('hopLegacyBootstrap');
const norm = (n: string) => n.toLowerCase().replace(/\(.*\)/, '').replace(/[^a-z0-9]/g, '');
const parNom = (arr: any[]) => new Map<string, any>(arr.map((x) => [norm(x.name), x]));
const HD = parNom(hd.hopVarieties ?? hd), HL = parNom(hl.hopVarieties ?? hl);
const supplementaires = (nom: string) => {
  const k = norm(nom);
  const out: any[] = [];
  for (const m of [HD, HL]) { const x = m.get(k) ?? [...m.entries()].find(([kk]) => kk.startsWith(k))?.[1]; if (x) out.push(...x.descriptions.filter((d: any) => /Descripteurs documentaires/.test(d.text))); }
  return out;
};
const lignes: string[] = [];
for (const [id, nom] of CINQ) {
  const v: any = VARIETY_BY_ID.get(id);
  const sup = supplementaires(nom);
  lignes.push(`${nom}\n  actuel : ${resume(niveaux(v))}\n  C1 (gooseberry vers petits fruits) : ${resume(niveaux(v, C1))}\n  C3 (+${sup.length} fiche(s) communautaire(s)) : ${resume(niveaux(v, {}, sup))}${sup.length ? '\n     fiches : ' + sup.map((d: any) => d.source.author + ' : ' + d.text).join(' | ') : ''}\n  C1+C3 : ${resume(niveaux(v, C1, sup))}`);
}
// Portée de C1 sur le catalogue : variétés dont un niveau change.
const touchees: string[] = [];
for (const v of VARIETY_BY_ID.values() as any) {
  const a = niveaux(v), b = niveaux(v, C1);
  const diff = FAMILIES.filter((f) => a[f].level !== b[f].level);
  if (diff.length) touchees.push(`${v.name} (${diff.map((f) => `${f} ${a[f].level} vers ${b[f].level}`).join(', ')})`);
}
// « fruité » générique.
const fruite = [...VARIETY_BY_ID.values() as any].filter((v: any) => (v.descriptions ?? []).some((d: any) => itemsOf(d.text).some((m) => /^fruit(y|é)$/i.test(m))));
console.log(JSON.stringify({ stats, partSansGlobal: stats.sans / stats.mots, top, categoriesHopsteiner: [...freqCategories.entries()].sort((a, b) => b[1] - a[1]), nbFruiteGenerique: fruite.length, fruiteNoms: fruite.map((v: any) => v.name).slice(0, 60), touches: touchees.length, touchees: touchees.slice(0, 40) }, null, 1));
console.log('--- essais sur les cinq ---\n' + lignes.join('\n'));
const eligibles = partSans.filter((x) => x.mots >= 6).sort((a, b) => b.part - a.part);
console.log('--- part de mots sans famille, plus fortes (6 mots ou plus) ---\n' + eligibles.slice(0, 15).map((x) => `${x.nom}: ${x.sans}/${x.mots} = ${(100 * x.part).toFixed(0)} %`).join('\n'));
console.log(`rang de Nelson Sauvin (part sans famille décroissante, 6 mots ou plus) : ${eligibles.findIndex((x) => x.id === 'beermaverick-nelson-sauvin') + 1} sur ${eligibles.length}`);

// ---------- 3. Concepts sans famille des cinq (dédoublonnés en anglais, source par source) ----------
console.log('--- concepts sans famille, par houblon (concept, nombre de fiches qui le citent) ---');
for (const [id, nom] of CINQ) {
  const v: any = VARIETY_BY_ID.get(id);
  const concepts = new Map<string, Set<string>>();
  let motsFamille = 0, motsTotal = 0;
  for (const d of v.descriptions ?? []) {
    if (d.context === 'beer') continue;
    for (const mot of itemsOf(d.text)) {
      motsTotal++;
      const fams = FAMILIES.filter((f) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: mot }] } as any, baseTerms.get(f) ?? []).length > 0);
      if (fams.length) { motsFamille++; continue; }
      const k = sing(mot);
      if (!concepts.has(k)) concepts.set(k, new Set());
      concepts.get(k)!.add(d.source.author);
    }
  }
  console.log(nom + ' : ' + concepts.size + ' concepts (' + [...concepts.entries()].map(([k, a]) => k + ' ' + a.size).join(', ') + ') ; mots ' + motsTotal + ', rattaches ' + motsFamille);
}
```

### mesure-options.ts

```ts
// Mesure jetable 5 (voie b-nelson-sauvin) : chiffres des trois options sur les cinq houblons. Rien n'est écrit.
//  A = « gooseberry, gooseberries, groseille à maquereau » ajoutés aux termes des petits fruits (en mémoire) ;
//  B = part « autres » : concepts sans famille, dédoublonnés en anglais, hors mots génériques (liste d'essai) ;
//  C = partage de la force de la fiche : poids « autres » = 0,5 par concept, plafonné à 1, ajouté à la somme des poids de forme.
import { VARIETY_BY_ID, EXTRAPOLATION } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine/data';
import { FAMILIES } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine/families';
import { hopDescriptorEvidence } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/functions/src/hopExtrapolationCore';

const base = new Map<string, string[]>(EXTRAPOLATION.axes.map((a: any) => [a.id, a.terms]));
const A_TERMS: Record<string, string[]> = { berries: ['gooseberry', 'gooseberries', 'groseille à maquereau'] };
// Liste d'essai des mots génériques : à trancher par le brasseur, ce n'est pas une décision.
const GENERIQUES = new Set(['fruity', 'fruité', 'noble', 'mild', 'sweet', 'doux', 'clean', 'pleasant', 'smooth', 'hoppy', 'fresh']);
const itemsOf = (text: string) => (text.split(':').slice(1).join(':') || text).split(/,|;| and /).map((s) => s.replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ')).filter(Boolean);
const premierMot = (d: any) => itemsOf(d.text)[0] ?? '';
const sing = (w: string) => w.toLowerCase().replace(/ies$/, 'y').replace(/([^siu])s$/, '$1');
const POIDS = [0, 0.5, 1];

function etat(id: string, avecA: boolean) {
  const v: any = VARIETY_BY_ID.get(id);
  const descs = (v.descriptions ?? []).filter((d: any) => d.context !== 'beer');
  const key = (d: any) => `${d.source.author}|${d.source.reference}`;
  const termes = (f: string) => [...(base.get(f) ?? []), ...(avecA ? A_TERMS[f] ?? [] : [])];
  const niveau: Record<string, number> = {}, fiches: Record<string, number> = {};
  for (const f of FAMILIES) {
    const ev = hopDescriptorEvidence({ ...v, descriptions: descs } as any, termes(f));
    const n = new Set(ev.map(key)).size;
    const premier = descs.some((d: any) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: premierMot(d) }] } as any, termes(f)).length > 0);
    fiches[f] = n; niveau[f] = n === 0 ? 0 : n >= 2 || premier ? 2 : 1;
  }
  const concepts = new Map<string, Set<string>>();
  let mots = 0, sans = 0;
  for (const d of descs) for (const mot of itemsOf(d.text)) {
    mots++;
    const fam = FAMILIES.some((f) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: mot }] } as any, termes(f)).length > 0);
    if (fam) continue;
    sans++;
    const k = sing(mot);
    if (!concepts.has(k)) concepts.set(k, new Set());
    concepts.get(k)!.add(d.source.author);
  }
  const utiles = [...concepts.entries()].filter(([k]) => !GENERIQUES.has(k));
  const somme = FAMILIES.reduce((s, f) => s + POIDS[niveau[f]], 0);
  const wAutres = Math.min(1, 0.5 * utiles.length);
  const part = (den: number) => Object.fromEntries(FAMILIES.filter((f) => niveau[f] > 0).map((f) => [f, Math.round((100 * POIDS[niveau[f]]) / den)]));
  return {
    familles: FAMILIES.filter((f) => niveau[f] > 0).map((f) => `${f} ${niveau[f] === 2 ? 'M' : 'c'}${fiches[f]}`).join(', '),
    partSans: `${sans}/${mots} = ${Math.round((100 * sans) / mots)} %`,
    autres: utiles.map(([k, a]) => `${k} (${a.size} fiche${a.size > 1 ? 's' : ''})`).join(', ') || '(aucun)',
    nbAutres: utiles.length,
    partForme: part(somme),
    partFormeC: { ...part(somme + wAutres), autres: Math.round((100 * wAutres) / (somme + wAutres)) },
  };
}
for (const [id, nom] of [['beermaverick-nelson-sauvin', 'Nelson Sauvin'], ['beermaverick-motueka', 'Motueka'], ['beermaverick-citra', 'Citra'], ['beermaverick-saaz-cz', 'Saaz (CZ)'], ['beermaverick-galaxy', 'Galaxy']] as const) {
  for (const a of [false, true]) {
    const e = etat(id, a);
    console.log(`${nom}${a ? ' | avec A' : ' | actuel'}\n  familles : ${e.familles}\n  mots sans famille : ${e.partSans}\n  B, concepts « autres » (${e.nbAutres}) : ${e.autres}\n  part de la forme : ${JSON.stringify(e.partForme)}\n  C, part avec « autres » : ${JSON.stringify(e.partFormeC)}`);
  }
}
```

### mesure-simule.ts

```ts
// Mesure jetable 3 (voie b-nelson-sauvin) : ce que le profil simulé (lot 21) fait de la forme des fiches.
// Mêmes entrées que la grille de prototypes/houblons-v4/scripts/profil-simule-cas.ts : stout 16D S1, US-05,
// 4 g/L en dry hop après fermentation (J+7, 3 j) et 4 g/L en whirlpool. Lecture seule, rien n'est écrit.
import { FAMILIES, simulerCas, hopRef, formeDe, type AjoutSimule, type MomentSimule } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine';
import { S1_TASTING, s1Recipe } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/pack/buildPack';

const recette = s1Recipe();
const HOUBLONS: [string, string][] = [
  ['beermaverick-nelson-sauvin', 'Nelson Sauvin'], ['beermaverick-motueka', 'Motueka'], ['beermaverick-citra', 'Citra'],
  ['beermaverick-galaxy', 'Galaxy'],
];
const aj = (houblon: string, moment: MomentSimule): AjoutSimule => ({ id: 'x', houblon, dose_gL: 4, moment, jourDebut: moment === 'dryPost' ? 7 : null, jours: moment === 'dryPost' ? 3 : null });
const sortie: any = {};
for (const [k, nom] of HOUBLONS) {
  const forme = formeDe(k);
  const somme = FAMILIES.reduce((s, f) => s + forme[f], 0);
  sortie[nom] = { partDeLaForme: Object.fromEntries(FAMILIES.filter((f) => forme[f] > 0).map((f) => [f, Math.round((100 * forme[f]) / somme)])), moments: {} };
  for (const m of ['dryPost', 'wp'] as MomentSimule[]) {
    const r = simulerCas({ id: 'm', titre: 'm', ajouts: [aj(k, m)], levure: 'fermentis-us05', recette, degustation: S1_TASTING, complet: false });
    sortie[nom].moments[m] = {
      deltaCentre: Object.fromEntries(FAMILIES.filter((f) => Math.abs(r.delta[f].centre) >= 0.05).map((f) => [f, r.delta[f].centre])),
      crans: Object.fromEntries(FAMILIES.filter((f) => r.delta[f].crans !== '≈' && r.delta[f].crans !== 0).map((f) => [f, r.delta[f].crans])),
      confiance: r.confiance.niveau,
    };
  }
}
console.log(JSON.stringify(sortie, null, 1));
```

### mesure-v55.ts

```ts
// Mesure jetable 4 (voie b-nelson-sauvin) : profil V5.5 de référence (whirlpool, dose centrale) des cinq houblons.
// Montre ce que le moteur de l'app fait d'une famille citée, non citée ou sans descripteur. Lecture seule.
import { hopProfile, FAMILIES } from '/C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/src/engine';

for (const [k, nom] of [['beermaverick-nelson-sauvin', 'Nelson Sauvin'], ['beermaverick-motueka', 'Motueka'], ['beermaverick-citra', 'Citra'], ['beermaverick-saaz-cz', 'Saaz (CZ)'], ['beermaverick-galaxy', 'Galaxy']] as const) {
  const p = hopProfile(k);
  console.log(`== ${nom} (${p.reference.label})`);
  for (const f of FAMILIES) {
    const x = p.families[f];
    console.log(`  ${f.padEnd(10)} ${x.description.level.padEnd(10)} ${String(x.description.sources) + '/' + x.description.of}  central=${x.central ?? '-'}  plage=${x.range ? x.range.min + '–' + x.range.max : '-'}  situé=${x.situated}  domaineComplet=${x.completeDomain}`);
  }
}
```

