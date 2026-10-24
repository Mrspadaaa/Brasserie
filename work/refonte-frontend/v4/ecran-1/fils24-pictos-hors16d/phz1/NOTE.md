# phz1 — Code : deux lettres dans une étiquette au trait

- **Chaleur : tiède** (la forme de la série phz : un autre genre que l'objet, ici l'abréviation).
- **Passe 2** : REJET du critique (« VB RA GM c'est quoi ??? » ; pastille à 28 px). Le genre « code » reste sur la planche,
  à part, pour qu'il le voie ; dans les cartes, ce sont les objets de phz2 (greffe), pastille à 19–22 px.
- **Idée** : un code à deux lettres (VB vin blanc, RA raisin, GM groseille, CB cannabis, CR crème, CG chewing-gum,
  CT citronnelle, CF café, CU curry, GB gingembre, MA marmelade, MI miel, MJ mojito, NE nectar, OI oignon) dans une
  étiquette au trait (rect 2,571, bouts ronds, encre du texte) ; « … » dans la même étiquette pour « en plus ». Comme
  « 16D » ou « US-05 » dans la carte : on lit, on n'interprète pas.
- **Ce qui tient** : jamais ambigu entre deux mots ; honnête (le mot est dans le code) ; la légende se mémorise en une
  fois ; genre à part des pictos de famille, donc aucune confusion avec elles.
- **Ce qui casse** : ce n'est pas un dessin : « Les icône sont pas parlant du tout » menace sans la légende ; pour tenir
  12 px de texte (D60), l'étiquette fait 22 px et la pastille « lui seul » monte à 28 px (19 dans la carte d'origine) :
  le seul jeu qui pousse la tête.
- **Écart à la baseline** : aucun symbole de famille réutilisé ; trait des familles ; le texte du picto est en police,
  pas en chemin (le contrôle de trait ne le mesure pas).

## Intégration (commune aux quatre jeux, « Il faut pas que ça gêne ! »)
- Les cartes sont le vrai DOM de la maquette jouable, rendu par le moteur (`parcours/comparer/etat.html#/comparer?h=nelson-sauvin,citra:cryo,target`,
  `…?h=galaxy,saaz-cz`, `parcours/fiche/etat.html#/fiche/nelson-sauvin`), avec son CSS ; seuls le contenu des pastilles
  « lui seul », le ◇ des lignes de la matrice et un bloc « mots précis » changent. Rien d'inventé : les mots sont ceux de
  l'aria-label « lui seul » du moteur et de `pack-fiches.json` (huile : total des fiches, mL/100 g).
- **Version courte** : dans la pastille noire, un picto par mot hors des 12 familles (blanc, 16 px), le picto de sa
  famille (12 px, sa couleur) pour un mot précis, les qualificatifs (doux, noble, fruité) en texte pâle, « +n » pour le
  reste. **Version textuelle** : comme la vraie pastille (premier mot et +n), le picto devant ; sous la ligne des
  familles, un bloc `data-role="precis"` : picto de la famille et son mot précis (« pamplemousse +1 », « pêche »).
- **Ce que la carte a gagné / perdu en place** : pastille « lui seul » de 19 à 22 px (pictos de 16 px ; 28 px ici) ; la
  version textuelle ajoute 1 à 3 lignes de 12 px par colonne précisée (Citra : 3), sans toucher au reste de la tête ;
  bandeau de la fiche inchangé (36 px). Galaxy face à Saaz : une barre « huile » sous la pastille, à la manière de la
  barre « autres » (45 px contre 9 px) : « il faut aussi que on voit comme il faut les différence ! » : l'écart se voit
  sans lire (pictos et barre longue d'un côté, texte pâle et barre courte de l'autre).
- **Légende** (`data-role="legende"`) : en pied de la tête de Comparer, une ligne de 12 px (pictos présents sur la carte
  et « en plus ») ; dans la fiche, dans la légende du « ? » de flb5b, dépliée sur la capture courte. Ailleurs dans
  l'app : derrière le « ? » de Comparer (D89), la légende de Substituer (tableau 16D de u4), la fiche courte, et l'étape
  Houblons près de la carte d'ajout (D113).
- Qualificatifs sans picto (fruité, doux, noble) ; « sauvignon blanc » et « dank » prennent le picto de vin blanc et de
  cannabis (brief). Rare hors relevé (« Tabacco » de Target) : le picto « en plus », le mot au toucher et dans la version
  textuelle.

## Passe 2 (retour du critique, VERDICTS.md)
- Commun aux quatre jeux : en version textuelle la pastille passe à la ligne dans sa colonne (plus de troncature), le bloc
  « mots précis » vient après la pastille (« dans » reste à la même hauteur dans toutes les têtes), la pastille ne redit
  plus le bloc précis (Citra, sans mot propre, n'a plus de pastille en textuel : le bloc précis la remplace, jamais une
  pastille vide). « +n » ne compte que les mots sans picto (un deuxième mot précis d'une même famille) ; un doublon de
  picto (sauvignon blanc → vin blanc, dank → cannabis) ne compte pas. « herbe » retiré des mots précis de Saaz (il redit
  Végétal) : Saaz = doux, noble, citron.
- Honnêteté des comptes : dans Comparer face à Citra cryo et Target, Nelson Sauvin a DEUX pictos (vin blanc, qui couvre
  sauvignon blanc ; raisin) : « groseille à maquereau » n'y est pas « lui seul », Citra cryo le dit aussi (aria-label du
  moteur). Dans la fiche, face à Boomerang, Herkules, Phoenix et CTZ, il en a TROIS (vin blanc, raisin, groseille).
- Côte à côte avec la maquette telle quelle (la vraie page, puis la même page avec les pictos posés en version courte) :
  `captures/<id>-cote-carte.png`, `<id>-cote-galaxy-saaz.png`, `<id>-cote-fiche.png`. Vu : la tête garde sa hauteur dans
  Nelson Sauvin / Citra / Target ; dans Galaxy / Saaz, la barre huile ajoute une ligne (≈ 20 px) sous la pastille, qui
  pousse le tableau d'autant : c'est le prix de « on voit comme il faut les différence ».
- Greffes : cannabis à sept folioles et gingembre en rhizome (pha1) dans phz2, phz3 et phz4 ; grappe de points pleins,
  groseille striée, alvéole et pichet de phz2 dans phz3 et phz4 ; bulle de parole « en plus » (phz3) dans phz4.

## Contrôles (passe 2)
- G1 : JEUX-BIEN-4. G2 `controle-pictos-trait.mjs … --page=etat.html` : TRAIT OK (phz1 144, phz2 160, phz3 144, phz4 160
  pictos de famille visibles, 0 faute).
- `controle-panel.mjs` sur les planches (v0) : PANEL OK ; sur les cartes : PANEL ECHEC par construction (même carte).
- Limites : pack de 32 houblons ; lisibilité à 12 px montrée, pas mesurée ; contraste des pictos de famille sombres sur la
  pastille noire non contrôlé.

## Retouche courte avant de lui montrer (passe 2 jugée : quatre jeux acceptés, phz2 en tête)
- Nelson Sauvin dans Comparer : trois pictos, la groseille en clair (opacité ,5, « un autre le dit aussi » au toucher) ;
  un seul compte avec la fiche. Version textuelle : « pamplemousse » sur sa ligne, sans césure. Version courte : le
  premier mot précis (le plus court) écrit dans la pastille avec le picto de sa famille (« 🍑 pêche 🍊 🍍 », « 🍊 citron »),
  pour que les pictos ne redisent pas le rang des familles ; ce qui dépasse la colonne reste coupé, comme dans la carte
  d'origine. Citronnelle et gingembre : le mot seul en clair sur la planche, sans picto, tant qu'aucun dessin ne se nomme.
  Recapturé, rouvert ; G1 JEUX-BIEN-4, G2 TRAIT OK.
