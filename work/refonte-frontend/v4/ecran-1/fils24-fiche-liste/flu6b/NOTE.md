# flu6b — les mots au bout des rayons, passe 2 de flu6

- Chaleur : **chaude**. Elle est refaite après le REJET du critique (`critique/PASSE2.md`), qui disait : « Pourquoi il y a les mots deux fois, en anglais et en français ??? ». Le dossier `flu6/` (v0) est intact.
- Pages : `etat.html` (Nugget, l'état contrôlé) et `nelson.html` (Nelson Sauvin). Elles sortent du même socle et des mêmes données que flu2b (`pack-fiches.json`).
- Captures (390 × 844, DPR 2) : `captures/flu6b-nelson.png` et `captures/flu6b-nugget.png`. Je les ai ouvertes et recomptées.

## Retouches et leur mesure
1. **Le français au repos, avec la table de flu2b.**
   - La table : pineapple → ananas, woody → boisé, resinous et resiny → résineux, white wine → vin blanc, fruity → fruité, grape → raisin, gooseberry → groseille à maquereau.
   - Elle est déclarée comme la nôtre deux fois : au repos (« en français : notre traduction »), et en entier dans la légende « ? », avec les fiches et leur année.
   - Mesure : il ne reste aucun mot anglais au repos sur les deux captures. Sur la v0 Nelson, il y en avait cinq : White wine, fruity, grape, gooseberry, et Fruité en double. Sur la v0 Nugget, il y en avait quatre : pineapple, woody, resinous, resiny.
2. **Une idée par mot, aucun mot en double.** Les mots sont regroupés après traduction. Le nombre affiché compte les fiches qui disent le mot, pas les mentions.
   - **Nelson, hors des 12 : 5 mots au lieu de 10.**
     - vin blanc (1er) 2/2, fruité 2/2, groseille à maquereau 2/2, raisin 2/2, sauvignon blanc 1/2.
     - Hopsteiner dit « Fruité » et « fruity » : il compte pour une seule fiche.
   - **Nugget.**
     - Tropicaux : ananas ×2 (ananas chez Beer Maverick, pineapple chez Hopsteiner), litchi, noix de coco.
     - Résineux : boisé ×2 (boutique Hopsteiner US et Yakima Chief), résineux. Notre table range resiny dans Résineux, qui reste à 2/4.
     - Hors des 12 : gingembre 1/4.
3. **« en tête chez Hopsteiner » retiré (D115), une seule pastille « 1er ».** Sur Nugget, elle est sur Épicé, comme dans g1. Sur Nelson, elle est sur vin blanc, premier mot des deux fiches. C'est la même règle que flu2b.
4. **Les inconnues dans la couleur de leur famille.** Le « Floral ? » et les autres sont écrits en couleur de famille. Sans cela, Nelson ne portait qu'une teinte au premier écran, et COULEURS échouait.
5. **La ligne des sources passe derrière le « ? ».** Elle était au repos (D1). Le premier écran passe ainsi sous 80 mots.

## Nombres recomptés
- **Nelson :**
  - α 12–14 %, lot 9,6 %, et son repère orangé sous la plage ;
  - Agrumes 1/2 (agrumes), Épicé 1/2 (épicé) ;
  - 10 familles « ? », et + Floral ?, − Résineux ? ;
  - 5 mots hors des 12, ceux listés plus haut.
- **Nugget :**
  - α 11–14 %, lot 13 % ;
  - Résineux 2/4, Agrumes 1/4, Tropicaux 2/4, Terreux 1/4, Épicé 1/4 (1er), Herbacé 2/4 (herbacé ×2), Floral 2/4 (géranium · floral) ;
  - 5 familles « ? », et + Floral 2/4, − Résineux 2/4 ;
  - gingembre 1/4.
- Tout est conforme au pack.

## Ce qui tient, ce qui casse
- **Ce qui tient :** radar et mots se lisent ensemble, en français, une fois chacun. Sur Nelson, les cinq mots du vin blanc sont en grand sous le radar.
- **Ce qui casse :**
  - Sur Nelson, le radar reste presque vide : ses mots sont hors des 12, et donc hors du dessin.
  - Sur Nelson, Agrumes et Épicé redisent leur famille en mot (« agrumes », « épicé »). C'est le mot de la fiche, mais le critique s'en est plaint sur fld8b.
  - Sur Nugget, les étiquettes Agrumes et Tropicaux se touchent.
  - Le contenu de Nelson finit à 867 px, soit 1,03 écran.

## Contrôles (24.10, sur flu6b)
```
== COMMUN etat.html
mots       sauté (--sans)
couleurs   OK
au-style   OK
survol     OK
blocs      OK
contraste  OK
fiche      OK
standard   OK
trait      OK
legende    OK
parlant    OK
brutes     OK
COMMUN OK
== MOTS etat.html
flu6b 74 mots (hors données)
MOTS OK
== COMMUN nelson.html
mots       sauté (--sans)
couleurs   OK
au-style   OK
survol     OK
blocs      OK
contraste  OK
fiche      OK
standard   OK
trait      OK
legende    OK
parlant    OK
brutes     OK
COMMUN OK
== MOTS nelson.html
flu6b 70 mots (hors données)
MOTS OK
```
