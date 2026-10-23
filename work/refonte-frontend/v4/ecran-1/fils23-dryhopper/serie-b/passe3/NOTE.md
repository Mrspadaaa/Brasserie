# b4, passe 3 : le podium sans vide (série B, lot 23 Dryhopper)

Voie r7b3-passe3, 23.10. Fichiers :
- page : `b4/etat.html` ;
- générateur : `generer.mjs`. La tête (données, calculs, Pomona, CoA) vient de la passe 2 ; la vue est réécrite. Copies avant retouche dans `captures/travail/`.
- captures : `captures.mjs`.

La passe 2 (`../passe2/`) n'a pas été touchée. Chaleur : tiède. Levure : en pont, comme en v0 et en passe 2.

## Passe 3

Remplissage du premier écran mesuré par `controle-panel` (M14), avec la même règle que le contrôle : 0,35 en passe 2,
**0,65** en passe 3. Le panel avec r6n2 donne une médiane de 0,70 : `PANEL OK`. Les mots restent à **80**.

Le vide a été comblé par des idées, pas par du texte.

Ce qui change de forme :
- **Fond blanc sans cartes**, comme r6n2. Les blocs se touchent, séparés par un filet. « Au style / Absolu » monte
  sur la ligne de la réponse, le « ? » dans la barre de titre : deux rangées gagnées.
- **Chaque ligne du podium sur deux étages** :
  - en haut, floral et résineux en barres l5b (zone 16D grise, trait noir de ta stout, contour de ce que la chaleur
    ou le CO₂ emporte, valeur simulée) et la jauge d'IBU (Nugget 60, Idaho 7 violet, orangé si trop amer, « ? »
    hachuré à cru) ;
  - en bas, la mesure du moment et les **12 familles en mini-barres**, à leur couleur. Pépins et Melon sont
    hachurés (inconnu). Un chapeau orangé marque ce qui sort du style. L'IBU est chiffrée à droite.
  - Ces mini-barres remplacent les « petites bandes arc-en-ciel » de la passe 2 (verdict r7 : « c'est quoi ? ») :
    une famille par colonne, nommée par un axe de 12 pictos sous le podium, sans un mot.
- **Une ligne « ta stout » en tête du podium** (x3b réduit, « ma bière → + Idaho 7 ») : ses 12 familles et son
  résineux à 83 (dégustation). On voit ce que chaque moment ajoute à la vraie base.

Greffes reçues :
- **greffe e5**, la loupe à mini-barres chiffrées : sous chaque moment voisin, une barre de floral et sa valeur
  (≈+5 · ≈+7 · ≈+8 · ≈+9 · ≈+10 autour de 35′, `travail/b4-pendant.png`).
- **greffe a1**, « emporté » en contour : la hachure est réservée à l'inconnu (retouche commune 2 du verdict). En
  passe 2, c'était une queue pâle.
- **greffes a1/g1**, les jours « sans gain » en bout de frise : 3, 5 et 7 j sont pâles et en pointillé, pas
  hachurés. Chaque jour porte sa barre de floral : on voit le plateau dès 2 j.
- **greffes f5/g6**, la courbe d'activité de la levure : une courbe violette sur les segments actif et après du dock,
  qui retombe vers l'après. C'est un schéma, dit dans la légende (fin vers J+5, à confirmer à la densité).
- **Dock-profil** plus haut (70 px). Le trait orangé « trop amer » reste ; l'interpolé est plus pâle.
- **La ligne du doigt rangée à son solde** (b4 lui-même) : inchangée.
- **Codes de source hors du premier plan** (retouche commune 3) : les cellules gardent « 38 µg/L », « 8,1/15 »,
  « cuit ». Une seule source visible, McCabe 2023, sous la meilleure ligne. Les autres sont dans l'aria-label, la
  légende et la fiche.
- « 1/1 fiche » est remplacé par « 1 fiche (Beer Maverick) », une fois en tête de la fiche (retouche commune 1).
  « au pitch » devient « au levurage » (retouche commune 4).
- « cuit » porte `data-nature="panel"` : c'est un jugement de panel, pas un nombre.

Classes préfixées par composant (L26) : `sh-` pour la coque, `pd-` le podium, `dk-` le dock, `fi-` la fiche,
`lg-` la légende.

## Baseline

Repris de la passe 2 :
- y1b : le moment glissé par 5′ de 60′ à 0′, puis WP, actif et après, avec la loupe (×8,1) ; le dock sous le
  pouce ; « face à ta stout » ; la jauge d'amertume par ligne ;
- x3b réduit : les jours au bout de la frise, et la ligne « ta stout » ;
- la levure en pont, avec un texte qui suit le moment ;
- les acquis : code couleur, pictos au trait (l'épicé cannelle et clou de la planche standard), au style par
  défaut, absolu, « ? », appui long vers la fiche g1 avec le CoA du lot publié, α du lot puis plage des fiches,
  « mixte » en mot, stock en icône ;
- l'honnêteté : « ~ » pour le simulé, « ≈ » pour l'interpolé, hachuré pour l'inconnu seulement, orangé pour le
  hors style seulement.

Écarts :
- Pas de 12 barres l5b en lignes. Les deux familles de la demande sont en l5b ; les douze sont en mini-barres
  verticales par moment, pour garder la comparaison entre moments.
- Le résineux, au style, a une échelle élargie à la plus haute valeur rencontrée (×1,12). Sinon toutes les barres
  butent à droite : ta stout est déjà hors style à 83, et les moments ne se distingueraient plus. La zone 16D
  reste dessinée.

## Contrôles (depuis la racine)

- commun `--sans=mots` : COMMUN OK. En route : CONTRASTE (« ~+14 » à 4,45:1 sur le fond violet de la meilleure
  ligne, fond éclairci).
- MOTS `--max=80` : 80, MOTS OK. En route : 89 ; retirés le mot « dégustation », deux noms de source, deux nombres
  de la ligne de base, « › » (devenu un chevron dessiné) et un « : ».
- D98 `--edition` : UNE-QUESTION OK (1 groupe libre : moment).
- D99 `--outil=dryhopper` : ACQUIS OK (4/4 : geste, frise, valeurs, levure). En route : « cuit » sans nombre ;
  puis une expression régulière perdue dans l'assemblage du générateur (`\d` devenu `d`, L26 et M10), remplacée
  par `[0-9]`.
- verifier-page : PAGE OK.
- panel avec r6n2 `--plancher=0.55 --part-vides=0` : PANEL OK, médiane 0,70. b4 seul : 0,65 (0,49 au premier
  jet, 0,59 au deuxième).
- Geste : de « actif · 2 j » à 35′. Ligne 35′ rangée entre 10′ et 60′. « à 35′ contre ★ : floral ≈−14 · résineux
  ≈−9 · trop amer ». Pont « à chaud, la levure ne change rien ». La fiche s'ouvre à l'appui long. Console vide.
