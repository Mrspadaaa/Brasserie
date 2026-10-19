x4 · Le conseiller. **Chaude** : la réponse d'abord, la preuve à un toucher.

- **L'idée** : partir des questions du brasseur, en puces, presque mot pour mot :
  - « Citra ou Cascade en dry hop ? » ;
  - « Pourquoi à 10′ pas à 60′ ? » ;
  - « 3 j Citra, puis 7 j Galaxy ? » ;
  - « 3 j Citra, puis 5 j Idaho 7 ? » ;
  - « Deux houblons ensemble ? » ;
  - « Quelle levure pour mon dry hop ? ».

  Pour chacune :
  - **une phrase de réponse** dans son langage (16 px). Chaque chiffre y est vrai et sourcé (« 4MMP −91 % publié », « ~100 IBU calcul ») ou simulé et marqué (« agrumes ~37 contre ~24 ») ;
  - **trois plans nommés par leur audace**, sage, franc et osé, avec une jauge de trois crans, jamais une note. Chacun donne :
    - sa recette, avec l'α et l'usage de chaque houblon ;
    - son effet simulé sur la 16D (« Agrumes ~ +2 crans », « hors du style : Agrumes, Tropicaux, Baies », ou « ~ dans la 16D ») ;
    - la saturation partagée pour deux houblons, la biotransformation pour une levure active ;
    - ses vraies valeurs : l'huile apportée, et à chaud l'IBU de la stout (60 → 96 IBU, « trop amer ») ;
  - **toucher un plan** redessine la 16D en haut (les 12 barres) et fixe « Ton plan » en bas ;
  - **la preuve** à un toucher : les mesures publiées, les sources et les trous (« aucune étude ne mesure Citra contre Cascade en bière à dose égale »).
- **Ce qui tient** :
  - On lit la réponse avant le graphique. Les plans mènent à une décision sans « meilleur » : l'osé de Citra sort de la 16D, et le sage de Cascade y reste.
  - « Pourquoi à 10′ pas à 60′ ? » tient en une phrase chiffrée.
  - La levure est expliquée par ce qu'elle fait (« n'agit que si le houblon entre pendant la fermentation active »).
  - Les plans viennent tous du moteur (grille ou cas K3, K4, K5).
- **Ce qui casse** :
  - Les phrases sont écrites par l'auteur à partir des données : leurs chiffres sont calculés, mais leur ton reste un choix éditorial, à valider.
  - « Sage » ne veut pas dire « dans la 16D » : pour la levure, les trois plans (Citra puis Idaho 7, 2 + 2 g/L) sortent tous du style. L'audace porte sur la levure.
  - Trois plans par question, c'est peu : un quatrième est dans la preuve.
  - Le texte est plus long que dans les autres variantes (la réponse fait 40 à 50 mots).
- **Ce qu'elle apprend, même rejetée** : une phrase qui cite ses vraies valeurs se comprend plus vite qu'un graphique. Elle ne remplace pas le graphique : elle dit où regarder. Les plans nommés par leur audace évitent le verdict « meilleur » tout en aidant à trancher.
- **Contrôles** (indicatifs en v0, joués une fois sur `etat.html`, profil du moteur) :
  - COMMUN : `COMMUN ECHEC 1 contrôle(s)` (mots ECHEC, 199 mots au premier écran pour 70 ; couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant OK)
  - LISIBLE : `x4 · 19 pictos · 6 mesurées · 17 simulées · 0 faute(s)` → `LISIBLE OK`
  - SIMULATION : `x4 · 1 simulation(s) · 9 réglage(s) · 8 mesurée(s) · le simulé bouge` → `SIMULATION OK`
  - CUMUL : `x4 · 0 ajout(s) cumulé(s) · 1 choix de levure · biotransformation visible · la levure fait bouger le simulé` → `CUMUL OK`
  - ALPHA : `x4 · 3 voies · 3 avec leur α` → `ALPHA OK`
  - FICHE-BASELINE : `x4 · fiche de Cascade · 12 familles nommées, 18 pictos · 0 faute(s)` → `FICHE-BASELINE OK`
- **Pire contraste** : 4,64:1, « hors du style : Agrumes, … » (#c2410c sur #fdf0ea) ; aucun texte sous 4,5:1.
- Générée par `node generateur-x4.mjs`, avec le socle de `../x1/socle-x.mjs`.
