y5 · « Une bière possible » : on pose deux houblons dans la cuve, puis chaque toucher tire une bière (K5).

- **Ce qui tient** :
  - **Deux gestes, une simulation.** On glisse un houblon dans la cuve (un toucher le pose aussi ; la cuve s'éclaire quand le doigt la vise). À deux, le moteur donne l'ajout cumulé (2 + 2 g/L, 3 j : paires du moteur) ; la part du second se voit en hachuré, le premier seul à 4 g/L en pointillé, et la saturation partagée s'écrit (Citra + Galaxy : tropical ~69 %, agrumes ~72 % de la somme des deux seuls). Puis « Tire une bière » : chaque toucher tire une bière possible dans la plage du moteur, un point par famille ; « Tire-en 20 » en tire vingt ; secouer le téléphone tire aussi, là où le navigateur le permet.
  - **Preuve, jouée au doigt** (`jouer-y5.mjs`, `geste-y5.json`) : Citra seul, tropical 2,9 crans (barre 72 px) ; Galaxy glissé dans la cuve (cuve visée pendant le glissé), tropical 3,9 crans (99 px). Douze touchers : 12 bières, 132 points ; « hors du style : tropical 11 sur 12, agrumes 8 sur 12, végétal 8 sur 12 » (tirage au hasard : ces comptes changent d’une fois à l’autre).
  - **L'incertitude énorme devient tangible** : les points s'étalent sur toute la plage, orangés hors du style, et la page compte les bières qui sortent du style. Elle précise : « l'étendue du possible, pas une probabilité mesurée ». Le tirage est triangulaire autour du centre du moteur : c'est une convention de la page, écrite sur la page.
  - **Vraies valeurs et inconnus** : charge d'huile de l'ajout sous la cuve (huile × dose, H §7.4, par exemple 5,6–16 mL/hL pour Citra + Galaxy) ; α et huile de chaque houblon posé ; linalol face au seuil, Citra ×0,06–2 060 et Galaxy ×0,1–1 720 en bandes log ; synergie et masquage « inconnu », « deux houblons ensemble, en bière : aucune mesure lue », « Galaxy : aucune comparaison chiffrée ».
  - **Six houblons des paires** (Citra, Galaxy, Idaho 7, Cascade, Motueka, Nelson Sauvin), deux moments, levures US-05, Pomona, Verdant (Diamond : « inconnu »).
  - **Écart à la baseline** : la cuve et le dépôt, et les points tirés sur les lignes ; le reste comme y1.
- **Ce qui casse** :
  - 150 mots au premier écran (70 indicatifs).
  - CUMUL C2 en échec, et c'est vrai : après fermentation (le moment par défaut), le moteur ne fait pas agir la levure ; en actif, Pomona et Verdant changent le profil (paires K5).
  - Les hauts du moteur sont parfois partiels et très hauts (végétal jusqu'à ~120) : les tirages en tiennent compte, d'où « végétal hors du style 8 sur 12 ». C'est l'étendue de ce qu'on ne sait pas, pas un risque mesuré ; la phrase le dit, mais le chiffre peut impressionner.
  - Un tirage efface les précédents quand on change de houblon, de moment ou de levure.
- **Contrôles** (indicatifs, joués une fois) :
  - COMMUN ECHEC 1 contrôle(s) : MOTS ECHEC (150 mots) ; les dix autres OK ;
  - LISIBLE OK (15 pictos, 1 mesurée, 14 simulées, 0 faute) ; SIMULATION OK (16 réglages) ; CUMUL ECHEC 1 problème(s) : « C2 le choix de levure ne fait bouger aucune valeur simulée » (raison ci-dessus) ; ALPHA OK (6 voies sur 6) ; FICHE-BASELINE OK (Citra, 0 faute).
- **Pire contraste** : 5,09:1, « × » de retrait (blanc sur la pastille du houblon).
- Généré par `generateur-y5.mjs`. Captures : `captures/y5-390.png`, `y5-premier-ecran.png`, `y5-avant.png`, `y5-pendant.png`, `y5-apres.png`, `y5-tirages.png`.
