y4 · « Les levures en cartes » : on balaie les levures du pouce, le profil glisse avec le doigt (K4, K5).

- **Ce qui tient** :
  - **Le geste est la simulation.** Quatre cartes (US-05, Pomona, Verdant, Diamond) suivent le pouce ; pendant le balayage, les 12 familles passent d'une levure à l'autre (fondu entre deux profils du moteur ; les chiffres sont ceux de la carte la plus proche) ; au lâcher, la carte se cale. Les cartes voisines dépassent sur les bords, ce qui invite au geste ; sous le rail, les quatre noms se touchent aussi.
  - **Preuve, jouée au doigt** (`jouer-y4.mjs`, `geste-y4.json`) : plan K4 (Citra 3 j puis Idaho 7 5 j, actif). Le rail passe de 35 px (US-05) à −125 (doigt gardé, à mi-chemin) puis −275 (Pomona). Les agrumes passent de 2,8 à 3,1 puis 3,4 crans, la barre de 71 à 79 puis 86 px ; Pomona face à US-05 : agrumes ~+0,6 cran. Après fermentation, les quatre cartes donnent la même bière (« ~ aucun écart, même profil »).
  - **Chaque carte dit le vrai et le simulé** : atténuation et température de la fiche (US-05 78–82 %, Pomona 75–84 %…), esters de la fiche en familles (Pomona : pêche, agrumes, tropical), statut de la biotransformation (documentée, qualitative, paradoxe, non publiée), puis ce que le moteur simule, par houblon : citronellol ~55 µg/L [0–446] pour Citra avec Pomona, ~82 pour Idaho 7 ; thiols libérés ~47 ng/L [4,7–165] avec Verdant ou Diamond.
  - **Ce qu'on sait et ce qui manque** : β-citronellol au-dessus du seuil avec Citra (E01, en bière) ; linalol stable entre 12 souches (H44, p = 0,82 : le floral ne suit pas la levure) ; thiols libérés 0,01–0,35 % des précurseurs, sur précurseur synthétique (H42) ; « variété × levure × dry hop : aucune mesure croisée ». Diamond : le plus de thiols mesurés, le fruité perçu le plus faible (Samia), écrit et non simulé.
  - **Ajout cumulé** : cinq plans sur toute la largeur, la suite K4 (quatre levures), trois « ensemble » K5 (Citra + Galaxy, + Idaho 7, + Cascade : US-05, Pomona, Verdant), Citra seul par la grille.
  - **Écart à la baseline** : des cartes balayées au lieu de pastilles ; l'effet d'une levure est écrit au dixième de cran (il est petit dans le moteur et ne doit pas s'arrondir à zéro).
- **Ce qui casse** :
  - 262 mots au premier écran (70 indicatifs) : les cartes sont denses, et les voisines comptent aussi.
  - L'effet de levure est petit dans le moteur (au plus ~0,6 cran) : le geste se voit surtout dans les chiffres et la carte, peu dans les barres.
  - Verdant et Diamond donnent le même profil (même convention de thiols dans le moteur) ; la page le dit.
  - Diamond manque dans les cas K5 : « inconnu » pour les plans « ensemble ».
- **Contrôles** (indicatifs, joués une fois) :
  - COMMUN ECHEC 1 contrôle(s) : MOTS ECHEC (262 mots) ; les dix autres OK ;
  - LISIBLE OK (33 pictos, 4 mesurées, 23 simulées, 0 faute) ; SIMULATION OK (11 réglages) ; CUMUL OK (1 ajout cumulé, la levure fait bouger le simulé) ; ALPHA OK (4 voies sur 4) ; FICHE-BASELINE OK (Citra, 0 faute).
- **Pire contraste** : 5,18:1, « hors style » (#c2410c sur #fff).
- Généré par `generateur-y4.mjs`. Captures : `captures/y4-390.png`, `y4-premier-ecran.png`, `y4-avant.png`, `y4-pendant.png`, `y4-apres.png`, `y4-apres-fermentation.png`.
