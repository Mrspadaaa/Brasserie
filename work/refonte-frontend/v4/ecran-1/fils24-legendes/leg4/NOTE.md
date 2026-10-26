# leg4 — « La loupe sous le doigt »

- Chaleur : **tiède** (forme imposée : la légende en bulle au toucher).
- Base : la maquette du soir, rendue par Chrome et figée (`socle.css` = copie de ses assets). Thème clair, 390 × 844.
  `etat.html` : doigt sur Résineux de Nugget et sur le ◇ de Motueka ; `repos.html` : au repos ; `leg4-glisser.png` : le
  doigt glissé de Floral à Tropicaux.

## L'idée
Le doigt glisse sur la bande ; une bulle se pose juste sous les pastilles, sans pousser la page, et sa loupe suit le
doigt façon Dock : le picto tenu à 30 px, ses voisins à 19 et 14, les autres à 10 (×3 du doigt au loin, L12). Dessous,
ce que les fiches disent de la famille tenue : « Résineux ■ marquée · 2/4 fiches « woody » +4 crans, hors style » ;
« Tropicaux … « ananas, litchi, noix de coco » ». Au bout de la bande de Motueka, un petit ◇ : tenu, il lit « hors des
12 : mojito · fruité ». La bulle s'efface 1,6 s après le lever. Le « ? » garde une ligne pour les autres icônes, avec
« ↔ glisser sur la bande ».

## Ce qui tient
- Zéro place au repos (seul ajout : le ◇ au bout de la bande de Motueka, D58). Une famille à la fois, avec ses mots
  précis (D131 ter) : la plus riche des quatre par famille.
- Joué dans Chrome : Floral → « géranium », Tropicaux → « ananas, litchi, noix de coco » ; bulle partie à 1,9 s.

## Ce qui casse
- Une seule famille lisible à la fois ; les pictos à 10 px sont du contexte, pas lisibles.
- Glisser sur la bande concurrence l'appui long (fiche) : à régler dans l'app (glisser = loupe, tenir immobile = fiche).
  La bulle couvre la ligne suivante pendant le geste.
- Parenté : legz1 (« Au doigt ») lit aussi la case tenue, sur une ligne fixe ; leg4 est une bulle-loupe flottante.

## Contrôles
- `controle-commun --page=etat.html --sans=mots,fiche,legende` : COMMUN OK (raisons de leg1). `controle-legende.mjs
  --page=repos.html` : LEGENDE OK (17 mots).

## Passe 2 (« taux d'intensité et + d'info sur les caractéristiques spéciales »)
- Passe 2 : `etat-v2.html`, `captures/leg4-v2.png`. La bulle porte la jauge n/N en grand, « ● en tête d'une fiche », le mot précis de la famille (ou « pas de mot plus précis que la famille ») et l'effet ; tenu, le ◇ lit ses mots avec leurs sources et ce que les fiches disent en propre (linalol, thiols, géraniol « ? », huiles). Toujours zéro place au repos. Ce qui casse : une famille à la fois ; la bulle couvre deux lignes d'ajouts pendant le geste. Données : describeFamilies et familyWords du moteur (n/N fiches, niveau, « en tête » = premier mot d'une fiche), catalogue Hopsteiner 2025 (linalol, thiols, huiles) ; géraniol non publié : « ? » ; Motueka « à 10′ : floral +1 cran » = l'effet du moteur de la maquette (D40, D53). TRAIT OK, COMMUN OK.
