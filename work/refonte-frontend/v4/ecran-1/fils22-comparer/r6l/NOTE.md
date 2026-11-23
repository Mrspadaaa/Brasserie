# r6l · Des cartes à glisser · « Lequel pour ma stout ? »

Page : `etat.html`, écrite par `generer.mjs` (données : `../donnees/comparer-stout.json` seulement ; style
`style.css`, geste et rendu `client.js`). Captures jouées au doigt : `captures.mjs`.

## Choix portés
- Radar : r2
- Base : IBU égal
- Porte : oui (Nelson Sauvin)
- Descripteurs : A

## L'angle, et ce que j'en ai fait
- **Un houblon en grand, les autres en vignettes.** Le rail du haut tient quatre cartes : Nelson Sauvin
  épinglé (punaise, fond pâle, panier « pas en stock », le mot « cible »), puis Cascade, Idaho 7 et
  Galaxy. Trois gestes mettent un candidat en grand : toucher sa vignette, la **glisser sur la grande
  carte** (un fantôme suit le doigt, la carte s'entoure à sa couleur), ou **glisser la grande carte de
  côté** (suivant, précédent). C'est le seul facteur libre (`data-libre="houblon"`).
- **Nelson Sauvin, cible fixe.** Sur chaque barre, un losange charbon marque ce que Nelson Sauvin
  aurait donné au même IBU. Il ne bouge jamais : quand on change de candidat, seules les barres
  glissent face aux losanges. On voit d'un coup d'œil où le candidat dépasse la cible et où il manque.
- **À IBU égal, la dose devient un résultat montré** : 42 g de Cascade, 22 g d'Idaho 7, 16 g de Galaxy
  (10 IBU à 10′, 20 L), sur les vignettes. Pour le brasseur, c'est déjà une réponse : à amertume égale,
  Galaxy coûte 2,6 fois moins de cônes que Cascade.
- **La réponse en une ligne** : « Le plus proche de Nelson Sauvin » (Idaho 7), « 2e plus proche »
  (Galaxy), « Le plus loin » (Cascade). Règle écrite dans la légende : la plus petite somme des écarts
  de gain sur les 12 familles (Idaho 7 18,0 ; Galaxy 24,7 ; Cascade 26,5 points sur 100).
- **Enrichi par rapport à la base v4.9** (plancher, L07) : les barres de l5b deviennent des pistes de
  gain à l'échelle d'un cran de ta 16D, avec la cible ; à droite de chaque piste, ta stout dans la zone
  de son style (ta bière, l'orangé hors style, la plage possible) ; le radar met des pictos au bout des
  axes à la place des mots (radars m4 et h4 « sans légende écrite ») ; la fiche au long appui garde la
  silhouette g1, axes aux couleurs des familles.

## Ce qui tient
- Ordre brasseur sur chaque carte : nom, α (lot, ou plage des fiches pour la cible ; ≠ pour Galaxy
  17,2 % hors de 11–16 %), rôle en mot, arômes en couleur, moment et dose, puis l'IBU (dans le
  contexte, égal pour tous). Stock en icône seulement (colis, panier).
- Ligne de contexte sans commande : Stout 16D, 20 L · 10 IBU · 10′ · US-05.
- Quatre acquis : radar r2 au repos (un seul plein, les autres en contour, trait de 3 ; noyau plein
  quand toutes les fiches d'un houblon disent la même chose ; familles sans fiche hachurées avec un
  « ? ») ; chimie, vraies valeurs et panel OSU à un toucher chacun, face à la cible.
- Honnêteté : « ~ simulé » sur les barres ; la plage possible se voit (elle vient presque toute de ta
  bière de départ, Nugget : 54,6 de haut en agrumes avant tout ajout) ; ta bière inconnue en Noyau et
  Baies s'écrit « ? », jamais 0 ; un composé inconnu s'écrit « inconnu » ; « Inconnus pour les deux :
  Géraniol, 3MH » (Galaxy) ; le panel absent se dit (« Idaho 7 : aucune courbe de dose mesurée » ;
  « Nelson Sauvin : aucun panel trouvé ») ; le panel OSU est dit « dry hop 24 h », et « ton ajout à 10′
  n'est pas un dry hop : la forme de la courbe seulement ».
- Opérations faites et dites : interpolation linéaire de la grille (b10, US-05) entre 0 (ta bière), 1,
  2, 4 et 8 g/L ; mises à l'échelle ; somme des écarts ; union des plages publiées des composés.
- Descripteurs A : seule la fiche de **Nelson Sauvin** change (Baies 2/2, « groseille à maquereau,
  gooseberry », marque « choix A ») ; sur Cascade, Idaho 7 et Galaxy, A ne se voit pas. Comme le radar
  principal lit les fiches, le contour de la cible y montre aussi les Baies.

## Ce qui casse
- **Les écarts sont petits** : aucun ne dépasse 0,9 cran à 10′ (la légende le dit). Le classement
  « le plus proche » reste dans l'incertitude du moteur ; il ordonne, il ne tranche pas.
- **A n'est pas dans le simulé** : la grille n'a pas été recalculée avec A, donc la cible ne donne
  rien en Baies sur les barres alors que son radar (fiches) les montre marquées. Écart visible, non
  corrigé ici (la grille est hors de ma voie).
- La cible garde 67 % de mots hors familles (vin blanc, raisin, sauvignon blanc) : A seul ne rend pas
  Nelson Sauvin « incroyable ».
- Le radar r2 à quatre séries (un plein, trois contours) reste chargé là où Cascade et Galaxy montent
  ensemble (Agrumes, Tropicaux).
- Glisser une vignette bloque le défilement vertical qui commence sur elle (`touch-action: none`).
- Les couleurs : Idaho 7 en bleu canard (#0b6e8a) au lieu du rouge du lot 21, pour ne pas se
  confondre avec l'orangé « hors du style » ; la cible en charbon (cave-800).
- La petite colonne « 16D » (ta stout dans son style) se lit avec la légende, pas seule.
- « Dryhopper » est un lien inerte (pont seulement).

## Contrôles (joués depuis la racine)
- COMMUN OK (sans MOTS) : COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT,
  LEGENDE, PARLANT, BRUTES.
- MOTS OK : 77 au premier écran (≤ 80).
- UNE-QUESTION OK (1 groupe libre : houblon) ; contexte : bière, base, moment, levure.
- ACQUIS OK (4/4) : radar au repos ; chimie, OSU et valeurs à un toucher.
- ALPHA OK : 4 houblons sur 4 avec leur α.
- Console sans erreur sur tous les parcours de `captures.mjs`.

## Pire contraste
4,96:1, « Agrumes » (#856e0c, 12 px) sur blanc, au repos.
