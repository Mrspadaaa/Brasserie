# z3 · La carte

- **L'idée, en une phrase** : où atterrit ma bière — une carte à deux axes en mots (à gauche plus d'agrumes, à droite plus de tropical ; en bas « faible », la bande pâle du style 16D, plus haut hors du style), un pion par houblon posé là où il emmènerait ma bière au réglage courant, et le point « ma bière » qui se déplace avec sa traînée de doses.
- **Pourquoi ça aide à comprendre et à choisir** :
  - « est-ce que ma bière reste dans son style ? » devient une position : sous la ligne pointillée, au style ; au-dessus, hors style ; la traînée 1, 2, 4, 8 g/L montre combien on peut mettre avant de franchir la ligne (Citra franchit entre 2 et 4 g/L ; Cascade et Idaho 7 restent sous la ligne à 4 g/L) ;
  - « vers où » se lit en largeur : Galaxy tire plus à droite (tropical) que Citra, Cascade reste à gauche (agrumes) ; le trait vertical monte jusqu'au haut de la plage simulée, et la flèche dit quand il dépasse l'échelle ;
  - deux pions = ensemble (2 + 2 g/L, 3 j, la seule paire simulée), nommés sur toute la largeur, avec « ensemble = 71 % de la somme des deux seuls » ; le bouton « deux pions ensemble » le fait d'un geste ;
  - sous la carte, la famille par famille (barres de la baseline), la levure et sa biotransformation, les vraies valeurs des pions choisis et les drapeaux.
- **Ce qui tient** : pictos au trait, tons des familles, barres devant la zone du style avec l'orangé au-delà, « au style » / absolu (la carte change d'échelle), α du lot puis des fiches sur les puces, usage en mot, légende derrière « ? », appui long vers la fiche (sur une puce ou sur un pion). En plus : la carte et ses axes en mots, la traînée de doses, le pion creux « non simulé », la confiance du moteur, l'IBU à chaud.
- **Ce qui casse** :
  - 176 mots au premier écran (70 visés) : les axes en mots, les puces avec leur α, les moments et les levures ;
  - deux nombres résument douze familles : la hauteur est la famille la plus forte (hors résineux, ta dégustation), la largeur est tropical moins agrumes ; les baies, le floral ou le végétal ne se voient que dans les barres en dessous ;
  - les pions de Cascade et d'Idaho 7 sont proches à 4 g/L (24 et 19 en hauteur) : à 1 g/L ou à 60′ tous les pions se tassent au sol, et les étiquettes se chevauchent ;
  - le résineux, déjà hors du style par la dégustation, ne place pas le point : il est dit dans la ligne « hors style », pas sur la carte.
- **À greffer dans la baseline** : la ligne du style comme sol, et la position du point « ma bière » comme première lecture avant les barres ; la traînée de doses sur une voie ; le pion creux « non simulé ».
- **Données** : simulé = profils-simules.json (grille, paires) ; vraies valeurs = base/consolide, fils19-choix/donnees, comparatifs-dryhop.json ; style = style-bands.json.
- **Contrôles** (indicatifs en v0, sauf honnêteté et usage au doigt) :
  - LISIBLE OK (14 pictos, 7 mesurées, 19 simulées, 0 faute) ; SIMULATION OK (12 réglages) ; CUMUL OK (bouton « deux pions ensemble », levures, biotransformation) ; ALPHA OK ; FICHE OK 1/1 ; FICHE-BASELINE OK (après l'appui long propre aux pions SVG : le geste commun ne lit que les puces HTML) ;
  - COMMUN : MOTS ECHEC (176 > 70) ; COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, TRAIT, LEGENDE, PARLANT OK ; STANDARD OK après data-serie sur les pions (première passe : « Verdant » barré à 1,73:1 et S1 sur les pions sans nom, corrigés).
- **Captures** (captures/z3-*.png, regardées) : haut, page, dose-8, dose-1, deux-pions, moment-60, actif-pomona, absolu, fiche.
