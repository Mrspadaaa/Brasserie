y3 · « La molette » : on tourne la dose d'un doigt, la saturation se sent ; combien de Cascade pour un Citra ?

- **Ce qui tient** :
  - **Le geste est la simulation.** Un doigt tourne la molette de 0 à 16 g/L (crans sentis à 1, 2, 4, 8 et 16 g/L). À angle égal, la barre avance de moins en moins : c'est la courbe du moteur. Vérifié : partie de la dose 1 g/L, elle redonne toute la grille (2, 4, 8 g/L, quatre houblons, deux moments, deux levures) à 0,62 point près. Entre deux doses, la page écrit « ≈ » ; au-delà de 8 g/L, « au-delà de la grille ».
  - **Preuve, jouée au doigt** (`jouer-y3.mjs`, `geste-y3.json`) : Cascade après fermentation, la barre des agrumes mesure 3, 22, 36, 57, 80 et 104 px à 0, 1, 2, 4, 8 et 16 g/L, soit 19, 14, 10,5, 5,8 puis 3 px par g/L. « Le gramme de plus » tombe de ~+0,4 à ~+0,2 puis ~+0 cran par g/L. À côté, le vrai panel OSU (E04, Cascade, 24 h, sur 15) : agrumes 1,9 → 7,1 → 7,0, plafond dès 8 g/L, herbacé/thé qui monte jusqu’à 10,4 (lecture tranchée par la recherche K), avec la dose du doigt en repère orangé.
  - **La réponse à « Citra et Cascade sont similaires d'après nos outils »** : même famille, pas la même force. Avec Citra 4 g/L en pointillé, la page écrit ce qu'il faudrait de Cascade : agrumes ~10,7 g/L, petits fruits ~6,9 g/L, tropical « jamais, même à 16 g/L » (simulé). À côté, les vraies valeurs sur la même base : 4MMP face au seuil, Citra ×4–71 contre Cascade ×0,96–7,1 (base commune) ; linalol de Citra ×0,06–2 060 en bande log ; huile 1–3 contre 0,5–2,6 mL/100 g ; charge d'huile en mL/hL qui suit la dose (huile × dose, H §7.4).
  - **La saturation mesurée** : part de linalol extraite chez Cascade, 23 % à 2 g/L, 7 % à 16 g/L (E04).
  - **Ajout cumulé** : « Dans le même ajout que Citra 2 g/L » fait tourner la dose du second houblon sur la même saturation ; la page écrit ce qu'il ajoute vraiment (Cascade à 4 g/L : ~50 % de ce qu'il donne seul en petits fruits).
  - **Écart à la baseline** : la molette, et des familles en lignes nommées ; le reste comme y1.
- **Ce qui casse** :
  - 152 mots au premier écran (70 indicatifs).
  - CUMUL C2 en échec, et c'est vrai : après fermentation (le moment par défaut), le moteur ne fait pas agir la levure ; la page le dit (« après : levure au repos, rien de compté »). En actif, US-05 et Pomona changent le profil ; Verdant et Diamond ne sont pas dans la grille (« inconnu »).
  - E04 a été relu en cours de route (recherche K : les agrumes plafonnent, l’herbacé monte) ; la page suit cette lecture, comme le moteur.
  - L'équivalence suppose la courbe du moteur jusqu'à 16 g/L : au-delà de 8, c'est une extrapolation.
- **Contrôles** (indicatifs, joués une fois) :
  - COMMUN ECHEC 1 contrôle(s) : MOTS ECHEC (152 mots) ; les dix autres OK ;
  - LISIBLE OK (16 pictos, 2 mesurées, 13 simulées, 0 faute) ; SIMULATION OK (17 réglages) ; CUMUL ECHEC 1 problème(s) : « C2 le choix de levure ne fait bouger aucune valeur simulée » (raison ci-dessus) ; ALPHA OK (4 voies sur 4) ; FICHE-BASELINE OK (Cascade, 12 familles, 18 pictos, 0 faute).
- **Pire contraste** : 4,96:1, « agrumes » (#856e0c, 12 px, sur #fff), dans le graphique du panel.
- Généré par `generateur-y3.mjs`. Captures : `captures/y3-390.png`, `y3-premier-ecran.png`, `y3-avant.png`, `y3-pendant.png`, `y3-apres.png`, `y3-ensemble.png`.
