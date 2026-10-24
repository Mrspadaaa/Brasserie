# d8b, « Le ruban de ta stout », passe 2 (voie r7d2-passe2, lot 23)

Question : « Quand ajouter Idaho 7 ? ». Un seul facteur libre, le moment. Chaleur : chaude (forme libre de la
série D, le simulateur). La v0 (`../d8/etat.html`) n'est pas modifiée.

- Générée par `generer.mjs`, sur le socle de la passe `socle.mjs` (données de la v0, pictos de la planche
  standard, stock, lot dans la fiche).
- Captures par `captures.mjs`, preuve du geste dans `captures/geste-d8.json`.
- Copies avant les retouches scriptées : `captures/travail/`.

## Passe 2

Ce que le critique a demandé (`tri/SYNTHESE.md`, « Candidates », d8) et ce qui a été fait :

**Retouches**
1. **La hachure de 60′ est nommée et vraie.** « emporté par la chaleur » ou « emporté par le CO₂ » est écrit
   sous le ruban. La part emportée se dessine famille par famille, en hachuré à la couleur de la famille :
   chaque morceau mesure le centre « à froid » (après fermentation, mêmes jours) moins le centre au moment.
   C'est la part réelle du moteur, pas la longueur du ruban. À 60′, elle est longue parce que la chaleur
   emporte vraiment presque tout : floral ~−21, baies ~−21, résineux ~−18 contre « après ».
2. **α du lot puis plage des fiches**, déjà là (« α 12,7 % 9,5–14,9 »). Le **stock en icône** est ajouté :
   un carré plein de 12 px, sans mot, comme sur la carte.
3. **Un toucher sur un segment du ruban ouvre les 12 barres l5b.** Elles ont leur zone du style, la stout
   avant (rond), ce qui est emporté (hachuré) et les inconnus hachurés (« ? »). La famille touchée est mise
   en avant ; un second toucher referme. Capture `d8-barres-390.png`.

**Greffes**
- **greffe g8, barres divergentes « contre après »** : ce que le moment change contre un dry hop après,
  mêmes jours. Elles sont au repos sous les mini-rubans plutôt qu'en bascule, ce qui remplit le vide du
  premier écran. Pour un moment « après », le bloc dit « le repère ».
- **greffe f5 / g6, l'allure de la levure** : une bosse grise sur le segment « actif » du rail trace la
  frontière actif / après. C'est une allure, pas une donnée ; la légende dit « à confirmer à la densité ».
- **greffe b2, la chaîne « Ma bière → + Idaho 7 → Levure › »** : le ruban avant, le ruban avec Idaho 7, puis
  la levure en dernière étape. Le texte de la levure suit le moment : « US-05 ~0, Pomona ~+13 agrumes » en
  actif, « rien à cette étape » ailleurs. Pomona ne change que l'actif (`cerveau/metier/dryhop-moment.md`).
- **greffe g1, la hachure « à cru, IBU ? »** sur la jauge d'amertume de la stout, et sur une fine ligne d'IBU
  sous chaque mini-ruban d'étape. Le piège se lit sans mot : à 60′, la ligne est orangée et longue
  (≈ 162 IBU) ; au WP, elle dépasse la 16D (≈ 75) ; en actif et après, elle est hachurée (à cru).
- **greffe a1 / b1, les sauts et la loupe** : sous le rail, la frise 60′ · WP · actif · après sert de sauts.
  La loupe montre 68 px par cran sous le doigt, contre ~21 px sur le rail à l'ébullition (×3,2).
- **greffe e2, « au-delà de 2 j, sans gain »** : les jours 3, 5 et 7 sont légèrement hachurés, car la grille
  sature dès 2 j. La légende le dit.
- **greffe d5, la teneur du lot dans la fiche** : « lot 2573 : huile 2,5 mL/100 g · linalol 0,4 % · myrcène
  45,4 % » (CoA ID7-2573).

**Retouches communes**
- **Une seule unité** : les points, « ~+22 ».
- **Mots** : 77 au premier écran. Les flèches et le « + » passent en CSS, la mesure est raccourcie et le
  moment n'est dit qu'une fois, dans le dock.
- **Le vide** : le premier écran est rempli jusqu'au dock.
- **La loupe** est là ; **le meilleur et le piège** sont nommés (rond violet « ta demande » sur « actif », IBU
  orangé).
- **Conventions derrière le « ? »** :
  - « meilleur : actif · 2 j, 0,01 devant 3 j » ;
  - « ≈ interpolé entre 60′ et 10′ » ;
  - la bosse de la levure.

**Ce qui change à l'écran depuis la v0**
- Le dock porte le rail par 5′ (14 crans : 60′ à 10′, WP, actif, après). Dessous, la frise (sauts), puis les
  jours 1 j, 2 j, 3 j, 5 j et 7 j en bout de frise, comme x3b réduit en fin de frise. Les jours restent
  grisés et hachurés à l'ébullition et au whirlpool. Toucher un jour pendant l'ébullition pose le dry hop
  actif à ce jour.
- Le pictogramme « épicé » est celui de la planche standard, cannelle et clou croisés, repris tel quel. Les
  12 symboles viennent de `fils17-standard/v3/planche.html`.

**Sorties décisives**
- `COMMUN OK`
- `MOTS OK` (77)
- `UNE-QUESTION OK (1 groupe libre : moment)` avec `--edition` (10 contrôles, tous du moment)
- `ACQUIS OK (4/4 : geste, frise, valeurs, levure)` (au repos)
- `PAGE OK (0 images chargées, 390 px, sans erreur)`
- Geste (`geste-d8.json`) : actif · 3 j → 45′ ; floral ~+22,1 → ~+5,4, IBU à cru → ≈ 150 ; 0 erreur ;
  largeur 390.

## Baseline

Repris :
- **y1b** : le moment se glisse comme un curseur, par 5′ (`data-pas="5"`, vérifié au clavier par ACQUIS), dans
  le dock sous le pouce avec la loupe. « Face à ta stout » : le ruban avant au-dessus du ruban avec Idaho 7. La
  jauge d'amertume de toute la stout porte la zone 16D 50–70 et l'à cru hachuré.
- **x3b réduit en fin de frise** : les jours de contact au bout de la frise. La chaîne « Ma bière → + Idaho 7 →
  Levure › » est reprise de l'idée « ma bière de base → 1 dry hop : levure ».
- **a2b** : la cuve apporte (le ruban), le CO₂ ou la chaleur emporte (le hachuré), la levure ajoute (dernière
  étape, US-05 ~0, Pomona ~+13 agrumes en actif).
- **Acquis** :
  - code couleur des arômes ; pictos au trait, de la planche standard, dont « épicé » choisi le 23.10 ;
  - au style par défaut, absolu à un toucher ;
  - α du lot puis plage des fiches, rôle « mixte » en mot, stock en icône ;
  - légende derrière « ? » ;
  - appui long (ou survol long) qui ouvre la fiche courte g1 avec la teneur du lot ;
  - barres l5b à un toucher.
- **Honnêteté** :
  - « ~ » pour le simulé, « ≈ » pour l'interpolé ;
  - « ? » hachuré pour l'inconnu (Pépins, Melon), jamais 0 ;
  - IBU à cru « + ? » hachuré ;
  - la mesure suit le moment : H13 (4MMP −91 % en 60′, −23 % à 90 °C), E03 (linalol 38 ± 13 µg/L, ligne
    Idaho-7, au pitch), E10 (1 h ≈ 96 h au panel, Cascade).
- **Carte des outils** : titre en question, contexte sans contrôle (houblon, dose, levure, base), un seul
  groupe libre (`data-libre="moment"` : rail, sauts, jours).

Écarts, chacun avec sa raison :
- **Pas de barres l5b au premier plan.** Les longueurs du ruban les remplacent (forme libre du concept,
  chaude). Les 12 barres sont à un toucher sur le ruban, comme le demande la retouche 3.
- **La levure en dernière étape** (forme du concept depuis la v0), pas en pont vers un outil. Le lien
  « Levure › » mène à l'étape Levure de la carte.
- **« contre après » au repos plutôt qu'en bascule** (greffe g8). La bascule coûtait trois mots et laissait un
  tiers d'écran vide. Les mini-rubans par étape et les barres divergentes répondent à deux questions
  différentes (où arrive la couleur ; ce que ce moment change contre un dry hop après).
- **La bosse de la levure n'est pas une donnée.** C'est une allure, dite comme telle dans la légende.

## Captures (ouvertes)

`captures/` : d8-premier-ecran.png, d8-390.png (page entière), d8-toucher-390.png (doigt sur le rail à 45′,
loupe), d8-60-390.png, d8-barres-390.png (floral touché, 12 barres ouvertes), d8-absolu-390.png, d8-fiche-390.png.
