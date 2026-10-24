# Substituer = u4, son choix du 19.10 (voie r6-substituer, 24.10)

## Base

- Sa maquette choisie : `work/refonte-frontend/v4/ecran-1/fils11-substitution/u4/vue.html` et sa NOTE ; capture
  `fils11-substitution/captures/u4-vue-390.png`. Ses mots : « Substitution, ça serait plus du u4 » (19.10) ; registre
  « choisi u4 » (D34). La « porte » du conseil du 22.10 (colonnes, Nugget épinglé) est retirée : une carte mise à sa place.
- Ses états, joués : `work/refonte-frontend/v4/choix/etats/substituer.json` (15 états, 14 rejoués, croix voulue D109).

## Repris de u4, tel quel

- Tête : le nom, et à droite « remplaçants / à 60′ » (rendu dans la tête du cadre par un portail, le contenu défilant).
- La réponse : « Magnat et Yeoman, 99 sans inconnue. » ; « Altus, Trident, Zenia vont de 78 à 99. ».
- L'échelle 50–100 à paliers (partiel, proche, très proche), huit remplaçants (cinq du catalogue, trois du stock, le
  premier du stock qui suffit toujours compris) rangés par le pire cas ; point si tout est connu, plage hachurée sinon
  (inconnue ouverte de 0 à 100 aux poids du moteur) ; stock en icône (chariot, boîte pleine, basse, pointillée).
- Face à face, même IBU : bandes (usage, stock, dose ; plage de dose pour un houblon à acheter), α par source (lot,
  article ▽), arômes en barres face au style (attendues en gras, « Hors 16D », « ce n'est pas zéro », fiches lues),
  radar D3 (Nugget en contour), β, huiles, relation au style ; « Ajouter Magnat aux achats » ; « Lire ces scores » ouvert.

## Écarts voulus et retraits

- La croix (D109) ; « Annuler » à côté de « Remplacer › » en pied, avec le résumé « 46 g de Nugget → 62,5 g de Nelson
  Sauvin » (D120) : « Remplacer par Nelson Sauvin » de u4 devient ce pied (le nom passe au résumé, D98).
- L'usage en mot de l'app (« double usage », « amérisant », comme l'étape Houblons ; u4 : « double »), D90.
- La ligne d'annotation « u4 · Chaud : … » de la page de lot : une note d'auteur, pas un élément d'écran.
- La dose au demi-gramme à IBU égal (62,5 g ; u4 et le moteur : 62 g) : jusqu'à 0,65 IBU d'écart au gramme.

## Enrichi (plancher, L07)

- Toucher un remplaçant le met au face à face (à la place de l'autre comparé) et en fait le remplaçant ; toucher une
  bande le choisit ; appui long : sa fiche. u4 : « choix des deux comparés statique ».
- Les arômes cités en pictos dans chaque bande (L04, D74) ; « sans famille » au tableau (L14 : Nelson Sauvin 83 %).
- « À 60′, surtout l'amertume » sous les arômes ; « Ma bière avec chacun », au style ou en absolu (D75).
- « Lire ces scores » dit pourquoi la composante arôme n'est pas montrée seule à 60′ (elle vaut 100 pour un houblon
  qui perd six familles : elle ne mesure que l'arôme étranger, contexte amertume du moteur).

## Pour l'app

- `src/ui/hops/HopSubstitute.tsx`, route `{ view: 'hopSubstitute', recipeId, hopKey }` ; `donnees.ts` (plage, huit
  remplaçants, mesures par source) va à côté de `src/domain/hops/` ; « Ajouter aux achats » attend une liste d'achats.

## Reprise D127 (voie r9, 24.10, soir)

Ses mots sur « u4 · ton choix » : « bien mais trop centré ibu, il faudrait aussi pas que à 60' mais aussi en dry hop. […]
Attention à toujours utilisé la baseline. Aussi ajouter à comparé doit être facile. Et le remplacement aussi. Ainsi que
ferme la vue » ; coche sur le tableau « Arômes 16D » : « Ça c'est vraiment bien ». Tout u4 reste (15 états, ETATS 14/14).

- **Le moment, un toucher** : la puce de sbc1b, étendue en trois segments sous la tête : « 60′ · recette », « whirlpool »,
  « dry hop » (`role=radio`, `data-moment`). Le toucher place l'ajout du brouillon à ce moment (`gestes.moment`, dry hop
  actif 3 j comme Dryhopper) ; `substitutes()` reclasse au moment (poids arôme 0,6, huiles 0,3, amertume 0,1 hors
  ébullition), la tête dit « remplaçants / au dry hop », le face à face repart de ses deux par défaut. Hors de la recette,
  une phrase dit le prix : « Au dry hop, l'arôme fait le score. Nugget au dry hop : ta stout passerait de 59,7 à 0 IBU ;
  chaque remplaçant à masse égale. » ; le pied dit les deux moments (« 46 g de Nugget à 60′ → 46 g de Cascade au dry hop »).
  « Remplacer » inscrit ce brouillon ; la croix et « Annuler » le jettent (la recette reste à 60′).
- **L'arôme à côté du score** : sous chaque nom, les crans du tableau « Arômes 16D » (2 crans cité / marqué, pointillé =
  non décrit), en couleur de famille, pour les familles de sa stout : floral, herbacé, terreux (attendues), puis résineux
  (hors style dans sa recette), pictos au trait en tête de colonne. Nugget en tête de l'échelle (« l'original, 46 g à 60′ »)
  pour lire ce que chacun garde ou perd d'un coup d'œil. Le tableau « Arômes 16D » reste tel quel (forme, mots, pointillé).
- **Au whirlpool et au dry hop, l'arôme répond** : la réponse ajoute « Target garde floral, herbacé et résineux, perd
  terreux (fiches). » ; le tableau des arômes et le radar montent juste sous les bandes, l'α passe après. « Face à face,
  même masse » au dry hop (même IBU ailleurs) ; « à froid, sans IBU » sur la bande de Nugget. À 60′ : l'ordre de u4 et
  « À 60′, surtout l'amertume », « l'arôme compte peu » (Lire ces scores) restent.
- **Comparer, d'un toucher** : un « + » (40 px sous le doigt, rond léger de 30 px ; ✓ noir une fois ajouté) au bout de
  chaque ligne, la grammaire de q2b ; il ajoute à la liste partagée (celle de Suggérer) sans quitter la vue.
  « Comparer (n) › » sous l'échelle ouvre `#/comparer?h=…&pin=nugget` : Nugget épinglé en colonne 1 (⌖), 4 colonnes au plus.
- **Remplacer et fermer** : inchangés (pied fixe « Annuler · Remplacer › », croix en haut, D109, D120).
- Légende « ? » rangée à droite de l'en-tête de l'échelle (sa feuille s'ouvre vers la gauche) ; elle dit les crans et le « + ».
- Limites : au whirlpool et au dry hop, `substitutes()` a les mêmes poids (contexte « arôme ») : le classement est le même,
  seuls la dose et le stock changent. Aller à Comparer quitte le brouillon (la Coquille l'abandonne hors d'un outil) :
  revenir rouvre Substituer à 60′.

## Reprise D129 (24.10, soir : « Il faut être modéré avec les mots » ; « Fait attention aux header, footer, sur la continuité de l'app »)

- En-tête : celui des autres outils (croix 44 px, titre 15 px semi-gras, même place que Levure et Dryhopper). Le contexte
  « remplaçants / à 60′ » de u4, redit par la puce, passe dans le libellé de la puce (« Moment des remplaçants de Nugget :
  à 60′ ») ; le titre 20 px gras de u4 n'est plus repris.
- Pied : « Annuler » et « Remplacer › » à la place et à la taille de Levure (8,788 et 113,788 ; 48 px) ; le résumé reste au-dessus (D120).
- Premier écran 118 → 85 mots, sans rien retirer d'utile : « + », « ✓ », « › » de Comparer et « → » du pied sont dessinés
  (plus des mots) ; « l'original, 46 g à 60′ » devient « l'original » (la dose est dans la bande et le pied) ; « à la place
  de Nugget » dans la bande choisie (redit du pied) est retiré ; la clé « tout connu · plage, une composante inconnue »
  (redite de « ? ») passe au toucher : chaque point et chaque plage portent leur mot (aria-label). Lignes de l'échelle à
  44 px (cible du doigt). Restent au-dessus de 80 : la réponse de u4 et ses nombres, le face à face qui commence à l'écran.
