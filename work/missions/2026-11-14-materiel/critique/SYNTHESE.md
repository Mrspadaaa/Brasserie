# Tri v0 — Stocks › Matériel (14.11.2026)

Juge : critique, en Opus (Fable interdit). 36 captures ouvertes en plein format : repos, geste et repos-cave à 390 pour
chacune des 12 variantes. Planches et capture du brasseur relues. Aucun REJET au tri (M13) : le brasseur voit tout.

## Niveau du panel : relancer les fiches seulement

**Relancer : les fiches (état `geste`), pas les listes.** Le contrôle donne PANEL ECHEC (remplissage médian 0,44,
ressemblance 0,91). Voici où le vide est réel et où la mesure se trompe.

- **Vide réel, dans les fiches.** Sous la dernière section, 10 fiches sur 12 laissent 140 à 260 px CSS de blanc :
  rq2, rq4, zq2, zq3, zq4, uq2, uq3 et uq4 surtout, puis rq3 et zq1. Seules rq1 et uq1 remplissent la leur.
  - Les 12 fiches ont aussi le même squelette : titre, deux tampons, dépenses reliées, puis « Payer un entretien » et
    « Étalonné ». La ressemblance du geste est donc en partie vraie.
  - Ce qui manque pour remplir : le rythme et l'état (seule zq1 les montre), les entretiens hors étalonnage, « utilisé
    dans N brassins » (M8), la valeur comptable d'un appareil immobilisé (M6), la sortie vendu ou réformé (M7, seule uq1
    l'a) et les notes.
- **Vide réel, dans les listes.** Il reste de 90 à 170 px CSS de blanc au-dessus de la barre du bas dans rq4, zq2, zq3,
  uq3 et uq4. On peut y mettre la valeur du parc, les liens Déjà possédé et Projets, ou la ligne des 30 prochains jours.
- **Mesure trompée par la coque.** L'en-tête, la sous-navigation et la barre du bas occupent environ 200 px CSS sur 844
  (24 % de la hauteur). Le brief les impose identiques : ils pèsent sur la ressemblance sans rien dire des variantes.
  - Les lignes d'une liste blanche (rq1, uq1, uq2) et les rangées « sans intervalle », légères par nature, font baisser
    le remplissage sans vide réel.
  - Au repos, la diversité est réelle : rayons, cartes, frise, étagère, fil du temps, panneau perforé, course vers une
    ligne commune, bons, chaîne de brassage et anneaux. Rien à relancer dans les listes.
- **Exemples du brasseur.** Seules rq1 et uq1 reprennent Articles presque mot pour mot (2 sur 12, sous le tiers).
- **Coque à corriger avant la passe 2.**
  - Série z : le bouton de thème garde la lune en cave. L'app montre le soleil (`src/theme/ThemeToggle.tsx` :
    `versCave ? Moon : Sun`).
  - Série r : l'en-tête mesure 43 px CSS, contre 36 dans l'app et dans la référence Articles. Le logo est redessiné. La
    série u est la seule identique à l'app.

## Classement

1. **uq2** (chaque appareil a sa jauge) : on lit le parc en trois secondes. Une barre par ligne contre un trait « dû »
   commun, comme la barre de stock d'Articles ; légende « fait · dû · retard » ; les gestes sont sur la ligne ; tous les
   acquis sont là ; parc « 2 prix connus » ; fiche nette.
2. **zq3** (la ligne d'échéance) : la meilleure image de « qui dépasse » ; le nom est dans la barre, comme Malt
   Pilsner ; « échéance · 3 » sert de filtre ; fiche avec cycles et règle de tolérance, la plus parlante. Mais le tri
   par part écoulée brouille la colonne des jours, et la barre s'éteint en cave.
3. **zq1** (le fil des échéances) : le temps à sa vraie distance, le dû au-dessus d'« aujourd'hui », gestes de 44 px.
   Fiche en fil avec saisie, rythme et état. Achat petit ; Déjà possédé et Projets cachés.
4. **rq3** (frise et tableau par échéance) : la plus complète en données (dates, jours, parc, segment Par rayon). Mais
   « −6 j » se distingue mal de « 6 j », les carrés de couleur n'ont pas de légende et la fiche à cadrans fait cockpit.
5. **rq2** (d'abord à faire) : la plus claire sur « que dois-je faire », avec le verbe juste sur chaque bouton. Les
   quatre cartes sont lourdes, et les jauges colorées par rayon n'ont pas de légende.
6. **uq3** (la chaîne du brassin) : l'idée la plus neuve, « puis-je brasser ? », avec un rail cassé à la pompe. Fiche
   « dérive de la sonde », la meilleure idée de fiche du panel. Mais un nom est tronqué, le frigo est mal placé en
   « garder » et le bas de l'écran reste vide.
7. **rq1** (Articles mot pour mot) : fidèle à Articles, et sa fiche est riche (jauge, étalonnage, historique). Mais les
   barres de ligne sont presque invisibles, une date en sous-titre change de sens d'une ligne à l'autre, et l'en-tête
   n'est pas celui de l'app.
8. **uq1** (rayons et échéance) : propre et complète (Gestion vendu ou réformé, Rappel), mais timide. Aucun signal
   visuel : on y lit des mots, pas une image. « Tu t'es trop limité ».
9. **zq4** (les bons de travail) : le verbe et le chiffre se voient vite, et la fiche pas à pas est une vraie idée.
   Mais « Bons » et « Sans bon » sont du jargon, les bons sont hauts, et Déjà possédé et Projets sont cachés.
10. **uq4** (grille à anneaux) : tout le parc d'un coup, mais les anneaux ont plusieurs couleurs sans légende, et
    plusieurs pictos ne sont pas l'objet (la cuve de fermentation ressemble à un verre à vin).
11. **rq4** (l'étagère) : pictos soignés, mais du texte déborde ou se chevauche dans trois tuiles et le bas de l'écran
    reste vide. La grille des 12 mois de sa fiche est à greffer.
12. **zq2** (le tableau d'ombres) : la plus audacieuse, mais les étiquettes cachent le picto des appareils à traiter.
    En cave, le texte des étiquettes devient illisible, et trois catégories sont fondues en « Cave · Atelier ». Ses
    flacons de tampon et ses étiquettes passées sont à greffer.

## Défauts

Repères : les zones sont données en px de capture (DPR 2) ou en px CSS. Date du jour : 14.11.2026. Chaque calcul
d'échéance a été refait ; ceux qui ne sont pas cités sont justes.

### rq1
- D1. Ligne pH-mètre, colonne de droite, deux thèmes : « −6 j ». Le brasseur peut lire « dans 6 j », alors qu'Atelier
  affiche « 6 j » deux lignes plus bas. Il dirait « −6 j c'est quoi ? ». Correction : écrire « retard 6 j », dans la
  teinte du retard.
- D2. Ligne Pompe : « 9 j » en rouge, sans dire ce que c'est (panne depuis 9 j). Correction : « panne 9 j ».
- D3. Sous-titres : « joint du robinet · 02.03.2027 » donne une échéance, mais « eau 0 °Bx · 02.11.2026 » donne le
  dernier étalonnage (02.11 + 3 mois = 02.02, d'où 80 j). Une même place change de sens. Correction : toujours
  l'échéance, ou toujours « fait le … ».
- D4. Barre écoulée en fond de ligne : à peine visible en clair, presque invisible en cave. La légende « écoulé ·
  échéance · retard » renvoie à une image qu'on ne voit pas. Correction : une barre pleine de 4 px sous le nom, comme
  la barre de Malt Pilsner, contrastée dans les deux thèmes.
- D5. Le ✓ de ligne fait environ 30 px CSS, sous les 44 px d'un geste principal. Correction : une cible de 44 px.
- D6. Coque : l'en-tête mesure 43 px CSS contre 36 dans l'app, et le logo est redessiné. Correction : reprendre la
  coque de la série u.
- D7. Fiche : le titre dit « Ce qui a bougé », formule floue, et le fil d'Ariane dit « Stock » au singulier.
  Correction : « Historique » et « Stocks · Matériel ».

### rq2
- D1. Les quatre cartes « À faire » prennent environ 240 px CSS pour 4 appareils. Correction : des cartes de 52 px,
  ou deux par rangée.
- D2. « Le reste » : les jauges sont teintes par rayon (violet, vert, bleu, brun), sans légende (D259 : « et la partie
  maron ? »). Correction : une seule teinte pour l'écoulé, le rayon porté par le picto.
- D3. « Étalonné » en un toucher sur la carte du pH-mètre enregistre un étalonnage sans valeurs lues. Correction : le
  bouton ouvre la saisie des deux tampons (l'écart de zq4).
- D4. L'espacement de « 9  j » et « 6  j » est trop large (police mono). Correction : une espace fine.
- D5. Fiche (feuille) : 180 px CSS de blanc sous Gestion. Correction : y mettre rythme, état et « utilisé dans N
  brassins ».
- D6. Coque : même en-tête que rq1 (D6).

### rq3
- D1. Colonne de droite : « −6 j » (pH-mètre) et « 6 j » (Déshumidificateur) ne diffèrent que d'un signe. Correction :
  « retard 6 j ».
- D2. La colonne de gauche mêle trois sortes de valeurs : une date (05.11), un compte (« 5/5 br. ») et un badge
  (« jamais »). Correction : la date toujours, et le compteur à droite.
- D3. Les carrés de couleur devant chaque nom et les hachures à gauche du 14.11 dans la frise n'ont pas de légende
  (D259). Correction : un mot (« passé ») sur les hachures, et le picto de rayon à la place du carré.
- D4. Fiche : deux cadrans à aiguille, avec la mention « tampons · loupe ×100 ↓ 14 ». Cela fait tableau de bord, et le
  brasseur ne le comprend pas. Les « −0,1 » touchent l'arc. Correction : une règle de tolérance par tampon (zq3) ou la
  dérive (uq3).
- D5. Fiche : « Dépenses et entretiens » montre l'étalonnage du 09.09 mais pas celui du 08.10, et « date ? » n'est pas
  un badge. Correction : un historique complet, et « date inconnue » en badge.
- D6. Coque : même en-tête que rq1 (D6).

### rq4
- D1. Tuile Densimètre : « éprouvette » est coupé par la bande « ✓ étalonné », dans les deux thèmes. Tuile
  Réfractomètre : le nom touche le bord. Tuile Balance : « 0,1 / g » est coupé en deux lignes. Correction : un nom sur
  deux lignes au plus, en 13 px, avec césure ; « Balance 0,1 g » insécable.
- D2. Le badge « 9 j » de la Pompe ne dit pas « panne ». Le badge « −6 j » se lit mal. Correction : « panne 9 j » et
  « retard 6 j ».
- D3. La case « acheter / possédé » : « possédé » seul ne veut rien dire. Correction : « déjà possédé ».
- D4. Environ 130 px CSS de blanc sous la dernière étagère. Correction : la valeur du parc, et Déjà possédé en clair.
- D5. Pictos : la balance ressemble à une boîte empilée, le réfractomètre à une seringue (« un forme qui représente
  vraiment ce que c'est »). Correction : les redessiner, puis les nommer à voix haute.
- D6. Fiche : « dernier 4,02 · tolérance / ±0,10 » se coupe sur deux lignes, et le bouton « Payer » ne dit pas quoi.
  Correction : un texte plus court ; « Payer un entretien ».

### zq1
- D1. Coque, cave : la lune reste affichée (l'app montre le soleil). Correction : le soleil en cave.
- D2. Fil du temps : les nœuds et les mois sont décalés d'environ 36 px de capture (environ 10 j) sous « aujourd'hui ».
  Déshumidificateur (17 j) est placé comme à 28 j. Correction : l'origine de l'échelle sur le point « aujourd'hui »
  (à vérifier en code).
- D3. « À traiter 3 » ne compte pas le densimètre « jamais étalonné ». Un instrument de mesure jamais étalonné demande
  son attention : c'est la plainte « À traiter · 0 ». Correction : le compter, et le placer au-dessus d'aujourd'hui.
- D4. Achat fait environ 32 px CSS de haut ; Déjà possédé et Projets sont cachés dans le ⋯ (un acquis moins visible).
  Correction : Achat à 44 px ; Déjà possédé et Projets en pied, à côté de la valeur du parc.
- D5. Les courbes qui relient un nœud à son appareil se croisent (frigo et réfractomètre). Correction : des traits
  horizontaux.
- D6. Fiche : 115 px CSS de blanc, et les dépenses sont pliées en une ligne. Correction : déplier les dépenses (2 ou 3
  lignes) et ajouter « utilisé dans N brassins ».

### zq2
- D1. Les étiquettes en biais couvrent le picto des appareils à traiter (refroidisseur, pH-mètre) : l'information la
  plus utile cache l'objet. Correction : l'étiquette à côté du picto, pas dessus.
- D2. Cave : sur les étiquettes jaunes, le texte « 5/5 brassins détartré » et « retard 3 j étalonner » devient brun pâle
  sur jaune, illisible. Correction : du texte foncé sur l'étiquette dans les deux thèmes.
- D3. Fiche : « retard 3 / j » se coupe sur deux lignes dans l'étiquette. Correction : une étiquette plus large, ou
  « retard 3 j » insécable.
- D4. « Cave · Atelier » fond Embouteillage, Stockage et Atelier en une zone, et « Cave » est le nom du thème sombre.
  Correction : garder les cinq catégories de l'app.
- D5. « Enregistrer un achat » a disparu (il faut passer par « Ajouter » dans une zone) : l'acquis principal perd sa
  place. Correction : Achat dans la barre, à côté de « À traiter ».
- D6. Le nom « Cuve fermentation 100L » touche le picto ; « Déshumidificateur » touche le bord droit. Correction : une
  marge de 8 px.

### zq3
- D1. Tri par part écoulée : la colonne « reste » se lit 17, 36, 108 puis 44 j, comme une erreur. Correction : trier
  par jours restants, la barre gardant sa part.
- D2. Cave : la part écoulée (gris foncé) et le reste (noir) se distinguent à peine, alors que c'est le signal de
  l'écran. Correction : un écoulé plus clair en cave, avec un contraste d'au moins 3:1 sur le fond.
- D3. Le densimètre « jamais étalonné » est rangé dans « sans rythme » et sort du compte « échéance · 3 ». Correction :
  le compter et le montrer en barre pointillée.
- D4. Déjà possédé et Projets sont cachés dans le ⋯. Correction : en pied.
- D5. Fiche : la colonne des cycles mêle « +3 j » (dépassement) et des durées (29, 33, 35 j), et les cycles de 33 et
  35 j dépassent sans le dire. Correction : la durée partout, le dépassement en teinte.
- D6. Environ 130 px CSS de blanc sous la liste, et 235 dans la fiche. Correction : la valeur du parc, puis l'état, le
  rythme et l'historique d'entretien dans la fiche.

### zq4
- D1. « Bons 3 » et « Sans bon 6 » : le mot n'est pas le sien. Un brasseur dit « à faire » (goût non cité : je le
  signale, je ne le compte pas). Correction : essayer « À faire 3 », et garder le bon comme forme.
- D2. Les bons font environ 210 px CSS de haut, et le texte de la pompe se coupe sur trois lignes (« fuit au /
  raccord »). Correction : des bons de 150 px, cause sur une ligne.
- D3. Le densimètre « jamais étalonné » n'a pas de bon. Correction : un bon « Étalonner · Densimètre ».
- D4. Déjà possédé et Projets sont cachés dans le ⋯ ; la recherche passe en loupe. Correction : Déjà possédé en pied.
- D5. Fiche : « tolérance ±0,05 · tenue » est rangé sous l'étape « Ranger, électrode humide », hors de sa place, et
  le fond gris est vide sur 260 px CSS. Correction : la tolérance en tête du bon ; y ajouter le rythme et les
  entretiens.
- D6. Coque, cave : la lune (comme zq1, D1).

### uq1
- D1. Aucune image du temps : la ligne ne porte que des mots (« dans 108 j »), et rien ne montre où en est chaque
  appareil. Correction : la jauge de uq2 sous le nom.
- D2. Rayons repliés : Atelier et Stockage montrent leurs noms mais pas leur prochaine échéance. Correction :
  l'échéance la plus proche en mono, comme rq1.
- D3. Pas de puce « tout » : on ne sait pas comment sortir d'un filtre. Correction : « tout 13 » en tête.
- D4. ✓ de ligne d'environ 30 px CSS. Correction : 44 px.
- D5. Fiche : « Ce qui s'est passé · depuis 02.07 · 4 » n'affiche que 2 lignes ; « dans ±0,05 » est jargonneux ;
  « champ neuf » est un mot de développeur affiché à l'écran. Correction : afficher les 4 lignes ou dire « 2 sur 4 » ;
  écrire « tenu » ; retirer « champ neuf ».
- D6. « Rappel : séance » : il ne sait pas ce qu'est une séance. Correction : « brassin ».

### uq2
- D1. Les boutons « Fait » et « Réparée » font environ 33 px CSS de haut. Correction : 44 px.
- D2. Déshumidificateur, Frigo et Hotte sont classés « Sans rappel » : seules 6 lignes ont une jauge. Le frigo à
  dégivrer et le filtre du déshumidificateur ont un rythme réel. Correction : leur donner un rythme (le dégivrage du
  frigo, le filtre), comme les autres séries.
- D3. « Tout 13 » a son chiffre en rouge, qui annonce une alarme. Correction : le chiffre neutre ; le rouge réservé à
  la panne.
- D4. Cave : les jauges grises se lisent mal sur le fond noir (pH-mètre, densimètre). Correction : un écoulé plus clair.
- D5. Fiche : « tolérance ±0,05 · champ neuf » (mot de développeur), « Payer » sans objet, et 190 px CSS de blanc sous
  « Avant ». Correction : retirer « champ neuf » ; « Payer un entretien » ; étendre « Avant » en historique (grille de
  rq4 ou dérive de uq3).

### uq3
- D1. « Refroidisseur à plaq… » : le nom est tronqué, ce que le brasseur ne pardonne pas sur un nom. Correction : le
  nom entier sur deux lignes, ou « 5/5 br. ».
- D2. Sens métier : « GARDER · Frigo levures & houblons ». Le frigo garde des ingrédients, pas la bière, et le placer
  après « capsuler » laisse croire au contraire. Correction : une étape « stocker » en tête, avant « moudre », ou le
  frigo hors de la chaîne.
- D3. Atelier n'a que des noms, sans état ni échéance ; « 289 CHF » apparaît sur le seul moulin. Correction : la même
  colonne de droite pour tous (échéance ou état).
- D4. Environ 170 px CSS de blanc sous Projets. Correction : la valeur du parc, et la chaîne étendue (pompe : « brassage
  bloqué »).
- D5. Fiche : « champ neuf » s'affiche, et l'en-tête dit « Mesurer » au lieu de « Matériel · Mesure ». Correction :
  retirer le mot ; le fil d'Ariane de l'app.
- D6. ✓ de ligne d'environ 30 px CSS. Correction : 44 px.

### uq4
- D1. Les anneaux ont plusieurs couleurs (brun, bleu, rouge, jaune pointillé) sans légende. Le pointillé rouge de la
  pompe et le pointillé gris du réfractomètre disent deux choses différentes. Correction : une teinte d'écoulé, le
  rouge pour le retard, et le mot sous la tuile.
- D2. Pictos : la cuve de fermentation ressemble à un verre à vin, le refroidisseur à une liste, la balance à un fer
  à repasser. Correction : les redessiner (les silhouettes de zq2 sont meilleures).
- D3. Les tuiles sans rappel (moulin, cuve de fermentation, balance) font 110 px CSS pour un nom. Correction : des
  tuiles basses pour les appareils sans rappel.
- D4. Fiche : « +6 j » chevauche le picto dans l'anneau. Correction : « +6 j » sous l'anneau.
- D5. Fiche : ni rythme, ni état, ni gestion ; 255 px CSS de blanc. Correction : ajouter ces sections.

## Candidates

Trois genres, deux séries et deux chaleurs :

### A. uq2, la jauge (tiède, série u) : la liste qui se lit d'un coup d'œil
- Retouches :
  1. Cibles de 44 px pour Fait et Réparée ; « retard 6 j » et « panne 9 j » restent écrits.
  2. Un rythme pour le frigo, le déshumidificateur et la hotte, de sorte que 9 lignes sur 13 aient une jauge.
  3. Une fiche remplie : historique, rythme, état, Gestion (vendu, réformé, supprimer) ; plus de « champ neuf ».
- Greffes :
  - le nom dans la barre, et la puce « échéance · n » posée sur le trait dû, qui sert de filtre (**zq3**) ;
  - les cycles d'étalonnage en barres contre le rythme, et la règle de tolérance avec le repère du lu (**zq3**) ;
  - la date sous les jours (« 17 j / 01.12 ») (**zq1**) ;
  - les rayons repliés avec leur prochaine échéance (**rq1**), et le segment Par échéance / Par rayon (**rq3**) ;
  - le verbe exact sur le bouton (Réparée, Étalonné, Détartré) plutôt que « Fait » (**rq2**) ;
  - la grille des 12 mois dans la fiche, pour la régularité (**rq4**).

### B. zq1, le fil des échéances (tiède, série z) : le temps à sa vraie distance
- Retouches :
  1. L'échelle partant d'aujourd'hui (décalage d'environ 10 j) ; le densimètre jamais étalonné au-dessus de la ligne.
  2. Achat à 44 px ; Déjà possédé et Projets en pied ; le soleil en cave.
  3. Dans la fiche : les dépenses dépliées, « utilisé dans N brassins », et une valeur comptable si l'appareil est
     immobilisé.
- Greffes :
  - l'étalonnage pas à pas (rincer, pH 7, pH 4, ranger), coché et daté (**zq4**) ;
  - les flacons de tampon teintés (pH 7 jaune, pH 4 rouge) comme repère de saisie (**zq2**) ;
  - la frise des 30 prochains jours en tête, pour une vue d'ensemble (**rq3**) ;
  - les silhouettes d'appareils, plus grandes et parlantes, sur les nœuds (**zq2**) ;
  - les tuiles « Déjà possédé » et « Projets » toujours visibles (**uq4**).

### C. uq3, la chaîne du brassin (chaude, série u) : « puis-je brasser ? »
- Retouches :
  1. Aucun nom tronqué ; le frigo hors de la chaîne, ou dans une étape « stocker » placée avant « moudre » ; Atelier
     avec la même colonne de droite que les autres.
  2. Un mot au rail cassé (« brassage bloqué · pompe »), et le blanc du bas rempli par la valeur du parc et les 30
     prochains jours.
  3. Des ✓ de 44 px, et le fil d'Ariane de l'app dans la fiche.
- Greffes :
  - la dérive de la sonde, à garder telle quelle : la meilleure fiche du panel ;
  - la case « Ajouter » par étape, qui préremplit la catégorie (**zq2**, réponse à P25) ;
  - une jauge fine sous chaque nœud qui a un rythme (**uq2**) ;
  - les compteurs en puces « en panne 1 · à étalonner 2 » (**rq1**) ;
  - la Gestion « vendu, réformé, supprimer » (**uq1**).

### Retouches communes (toutes les variantes)
- Ne jamais écrire « −6 j » ni « 9 j » seuls : écrire « retard 6 j » et « panne 9 j ».
- Un instrument jamais étalonné compte dans « À traiter » (la plainte « À traiter · 0 »).
- Retirer « champ neuf » et tout mot de développeur de l'écran.
- Donner une légende à chaque couleur ou hachure (D259).
- Cible de 44 px pour tout geste « fait ».
- Coque : en-tête de 36 px CSS, logo de l'app, soleil en cave. Achat, Déjà possédé et Projets visibles.

## États de passe 2

Pour chaque variante, l'état et ce qu'il doit montrer, dans sa langue.

### rq1
- **traiter** : la puce « à traiter 3 » est active. Les rayons ne gardent que les lignes dues ; la pompe passe sous
  « Fait le 14.11 », grisée, avec Annuler.
- **ajout** : la feuille d'achat, intent matériel, avec la catégorie choisie par les rayons à picto ; « Déjà possédé »
  avec l'état « Bon » par défaut (P27).
- **vide** : un seul rayon fantôme et ses deux boutons, Achat et Déjà possédé ; aucune phrase.
- **repos-1280** : les rayons sur deux colonnes, ou la liste à gauche et la fiche ouverte à droite ; la jauge
  s'élargit sans étirer les lignes (P10).

### rq2
- **traiter** : la carte du refroidisseur part après « Détartré », un toast l'annonce, et le reste remonte d'un cran.
- **ajout** : Achat et Déjà possédé ouvrent leur feuille ; l'en-tête « Le reste » garde la loupe.
- **vide** : « À faire 0 » disparaît ; les deux boutons se placent au centre.
- **repos-1280** : « À faire » en colonne à gauche, « Le reste » à droite.

### rq3
- **traiter** : le tableau filtré sur les 4 dus ; la frise garde le passé hachuré.
- **ajout** : le gros bouton Achat ouvre la feuille ; Déjà possédé passe du pied à la feuille.
- **vide** : une frise vide avec le seul trait 14.11, et les deux boutons.
- **repos-1280** : frise sur toute la largeur, tableau et fiche côte à côte, segment « Par rayon » dessiné.

### rq4
- **traiter** : seules les tuiles à badge restent, une étagère par rayon ; une tuile « fait » s'éteint.
- **ajout** : la case « acheter / déjà possédé » d'une étagère ouvre la feuille avec la catégorie préremplie.
- **vide** : cinq étagères vides, chacune avec sa case d'ajout.
- **repos-1280** : six tuiles par étagère, et la fiche en carnet à droite.

### zq1
- **traiter** : le fil ne garde que ce qui est au-dessus d'aujourd'hui ; un appareil « fait » glisse sous la ligne, à
  sa nouvelle échéance.
- **ajout** : le ⋯ ouvert sur Achat, Déjà possédé et Projets (ou en pied, après la retouche).
- **vide** : seul le point « aujourd'hui », avec les deux boutons d'ajout.
- **repos-1280** : le fil vertical à gauche et la fiche en fil à droite, à la même échelle de temps.

### zq2
- **traiter** : le panneau n'allume que les étiquettes, et les autres silhouettes pâlissent.
- **ajout** : la case « Ajouter » d'une zone propose Achat ou Déjà possédé, catégorie préremplie.
- **vide** : le panneau perforé nu, avec ses trois cases « Ajouter ».
- **repos-1280** : un panneau large, une zone par catégorie (cinq), et la fiche à droite.

### zq3
- **traiter** : seules les barres qui touchent la ligne restent ; après « Fait », la barre repart de zéro.
- **ajout** : Achat ouvert ; Déjà possédé visible en pied.
- **vide** : la ligne rouge seule, avec « fixer un rythme » et les deux boutons.
- **repos-1280** : des barres plus longues, la même ligne commune, et la fiche à droite avec les cycles.

### zq4
- **traiter** : la tringle seule ; un bon « fait » se détache et part en talon.
- **ajout** : le ⋯ ou la loupe ouverts, Achat en feuille.
- **vide** : une tringle vide, puis les deux boutons.
- **repos-1280** : la tringle en largeur (bons côte à côte), « Bientôt » et « Sans bon » en deux colonnes.

### uq1
- **traiter** : la puce active ; les rayons sans dû se replient.
- **ajout** : Acheter ouvre la feuille ; Déjà possédé ouvre le nouveau, avec la catégorie du rayon.
- **vide** : les cinq rayons repliés à 0, et les deux boutons.
- **repos-1280** : les rayons dépliés sur deux colonnes, et la fiche pleine page devient un panneau.

### uq2
- **traiter** : le segment « À traiter 4 » est actif ; après « Fait », la jauge du refroidisseur revient à 0/5 et la
  ligne quitte la liste.
- **ajout** : Acheter ouvre la feuille ; Déjà possédé, en pied, ouvre le nouveau.
- **vide** : la ligne de légende « fait · dû · retard » seule, sans ligne dessous, et les deux boutons.
- **repos-1280** : des jauges plus longues, alignées sur le même trait dû, et la feuille en panneau à droite.

### uq3
- **traiter** : la chaîne réduite aux nœuds en rouge ou en ocre ; après « Réparée », le rail se ressoude.
- **ajout** : Acheter ouvre la feuille ; « Ajouter » sur une étape préremplit la catégorie.
- **vide** : le rail des six étapes sans nœuds, et les deux boutons.
- **repos-1280** : la chaîne à l'horizontale (moudre → garder), « Mesurer » dessous, et la fiche de dérive à droite.

### uq4
- **traiter** : seules restent les tuiles à anneau rouge ou ocre ; après le ✓, l'anneau repart vide.
- **ajout** : la tuile « Déjà possédé » ouvre le nouveau ; Acheter ouvre la feuille.
- **vide** : les deux seules tuiles « Déjà possédé » et « Projets ».
- **repos-1280** : une grille de 6 colonnes, et la fiche à droite.
