# z2 · Les deux verres

- **L'idée, en une phrase** : deux verres côte à côte, à dose égale et au même moment, avec au-dessus de chacun le « faux profil aromatique » dessiné comme un nuage de pictos de famille, d'autant plus grands que la famille est forte ; un curseur de moment fait fondre ou grandir les deux nuages d'un coup.
- **Pourquoi ça aide à comprendre et à choisir** :
  - « Citra ou Cascade ? » se lit à dose égale, ce que nos fiches ne font pas : à 4 g/L en dry hop après, Citra sort du style (agrumes, tropicaux, baies), Cascade reste au style ; la vraie valeur qui tranche est en dessous, 4MMP ×4–×71 contre ×0,3–×31, avec la bande logarithmique et le trou « aucune étude ne mesure Citra contre Cascade en bière à dose égale » ;
  - « pourquoi 10′ pas 60′ » : le curseur ramené à 60′ vide les deux nuages et affiche ~100 IBU (Citra) et ~52 IBU (Cascade) ; la phrase du moment dit pourquoi, avec sa source ;
  - « ensemble » met les deux houblons dans un seul verre (2 + 2 g/L, 3 j), montre ce que chacun apporte en points et la saturation partagée (ensemble = 76 % des agrumes et 81 % des tropicaux de la somme des deux seuls) ;
  - la levure change le simulé en dry hop actif seulement ; US-05 et Pomona sont simulées pour un houblon seul, Verdant pour la paire ; les autres sont barrées et la page dit « non simulé » plutôt que d'inventer.
- **Ce qui tient** : pictos au trait, tons des familles, « au style » / absolu (le nuage change d'échelle), α du lot puis des fiches, usage en mot, légende derrière « ? », appui long vers la fiche ; les barres de la baseline sont en bas, deux par famille (pleine pour le premier houblon, creuse pour le second), devant la zone du style. En plus : le nuage, le curseur du moment avec sa phrase sourcée, l'IBU à chaud, « ensemble » sur toute la largeur avec les apports, les trous des études.
- **Ce qui casse** :
  - 179 mots au premier écran (70 visés) : les chips des paires, les deux verres et les curseurs ;
  - un nuage de pictos n'est pas une mesure : la taille se lit en relatif, la valeur exacte est dans la liste famille par famille, en dessous ; les familles « rien de simulé » sont un simple « ? » ;
  - Verdant ou Diamond sur un houblon seul vident les verres : honnête, mais frustrant ;
  - les deux verres partagent la même dose et les mêmes jours par construction : pour « 3 j Citra contre 7 j Galaxy », voir z1 ou z4.
- **À greffer dans la baseline** : la comparaison à dose égale avec la dose en tête ; la phrase du moment avec sa source ; l'IBU simulé quand l'ajout est à chaud ; les apports de chaque houblon dans un assemblage, en points ; les trous écrits.
- **Données** : simulé = profils-simules.json (grille, paires) ; vraies valeurs = base/consolide, fils19-choix/donnees, comparatifs-dryhop.json ; style = style-bands.json.
- **Contrôles** (indicatifs en v0, sauf honnêteté et usage au doigt) :
  - LISIBLE OK (31 pictos, 13 mesurées, 27 simulées, 0 faute) ; SIMULATION OK (12 réglages) ; CUMUL OK ; ALPHA OK (après rattachement de l'α au nom du verre) ; FICHE-BASELINE OK ;
  - COMMUN : MOTS ECHEC (179 > 70) ; COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE, PARLANT OK (première passe : « ? » à 3,2:1 et STANDARD S2 sur les lignes de comparaison, corrigés : gris 5b5b66, data-famille retiré des lignes qui portent les couleurs des houblons).
- **Captures** (captures/z2-*.png, regardées) : haut, page, moment-60, moment-10, dose-8, paire-galaxy, ensemble, actif-verdant (non simulé, dit), absolu, fiche.
