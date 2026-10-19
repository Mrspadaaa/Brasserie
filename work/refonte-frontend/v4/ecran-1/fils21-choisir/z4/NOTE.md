# z4 · La phrase

- **L'idée, en une phrase** : la recette est une phrase dont chaque mot se touche — « Je mets [Citra] à [4 g/L] en [dry hop après] pendant [3 j], levure [US-05], [seul]. » — et la réponse se réécrit sous elle.
- **Pourquoi ça aide à comprendre et à choisir** :
  - la décision est littéralement la phrase : quel houblon, combien, quand, combien de jours, quelle levure, seul ou pas ; toucher un mot le fait passer au choix suivant et ouvre la liste de ses choix, la phrase et la réponse bougent tout de suite ;
  - le dernier mot porte l'ajout cumulé et l'enchaînement comme des mots ordinaires : « + Galaxy ensemble » (2 + 2 g/L, 3 j, la dose totale compte, « ensemble = 71 % de la somme des deux seuls ») ou « puis Galaxy 7 j » (l'un après l'autre, ordre non calculé) ;
  - la réponse tient en une ligne (« Agrumes, tropicaux et baies sortent du style 16D. ») puis famille par famille en lignes nommées, devant la zone du style, avec le trait fin jusqu'au haut de la plage ; les vraies valeurs (α, huile, 4MMP et linalol au seuil, mesures en bière) sont dessous ;
  - une phrase hors de la grille le dit (« non simulé : … ») et les lignes montrent ma bière avant, nommée comme telle.
- **Ce qui tient** : pictos au trait, tons des familles, zone du style et orangé au-delà, « au style » / absolu, α du lot puis des fiches sur le mot houblon, légende derrière « ? », appui long sur le houblon vers la fiche. En plus : la phrase et ses listes de choix, les lignes nommées (la page a la place des noms), la confiance du moteur, l'IBU quand l'ajout est à chaud.
- **Ce qui casse** :
  - 187 mots au premier écran (70 visés) : la phrase, les douze lignes nommées et leurs valeurs ;
  - toucher un mot le change : c'est volontaire (le geste se voit), mais celui qui voulait seulement voir les choix a déjà changé la phrase ; retoucher ramène le mot suivant, pas le précédent ;
  - les enchaînements simulés partent de Citra (cas K3 et K4 du moteur) : avec un autre premier houblon, « puis … » est dit non simulé ;
  - avec un second houblon, la dose et les jours sont figés par la grille (2 + 2 g/L, 3 j) : les mots passent en pointillé et une note le dit.
- **À greffer dans la baseline** : la réponse en une ligne au-dessus des barres ; les lignes nommées quand la largeur le permet ; « non simulé » écrit avec la bière avant nommée ; le mot « seul / ensemble / puis » comme réglage unique de l'assemblage.
- **Données** : simulé = profils-simules.json (grille, paires, cas K3 et K4) ; vraies valeurs = base/consolide, fils19-choix/donnees, comparatifs-dryhop.json ; style = style-bands.json.
- **Contrôles** (indicatifs en v0, sauf honnêteté et usage au doigt) :
  - LISIBLE OK (20 pictos, 10 mesurées, 28 simulées, 0 faute) ; SIMULATION OK (6 réglages, le simulé bouge) ; CUMUL OK (le mot « levure » est le choix de levure, le mot « seul » crée l'ajout cumulé) ; ALPHA OK ; FICHE-BASELINE OK (après data-voie sur la phrase) ;
  - COMMUN : MOTS ECHEC (187 > 70) ; COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE, PARLANT OK.
- **Captures** (captures/z4-*.png, regardées) : haut, page, mot-ouvert, moment-60, cascade, puis-galaxy, ensemble-galaxy, levure-verdant-actif (Verdant sur un houblon seul : non simulé, dit), absolu, fiche.
