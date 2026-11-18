# Corrections ra + p5f (nuit du 16 au 17.11)

## Passe 2 : verdict du critique (11 problèmes, 1 bloquant)

Le critique avait joué le carnet de zéro au doigt, puis la ventilation telle que la décrit CADRE.md. Les 11 points sont corrigés dans `proto.src.html` (`proto.html` est rebâti par `build.mjs`).

1. **BLOQUANT : le critère écrit avec ses mots.** Avec au moins deux façons ouvertes et aucun critère, toute phrase qui n'est ni une façon, ni un lien, ni une action (attendre, demander, appeler…) reçoit « En faire le critère qui oriente ? ». Toucher la carte « Ensuite : trancher entre… » ouvre le champ avec « Ce qui compte pour trancher… », et la phrase suivante est proposée en critère. « plus de condensation au plafond » est relié à « Capte la buée à la source » sans que la phrase soit redite (E20b).
2. **Tuile Comparer.** Elle compte les proposées et les gardées : « 7 · 6 proposées · 1 gardée » (E20c). Elle affichait à tort « 1 proposées ».
3. **Note d'attente.** Une note « attendre… » devient l'Ensuite, dans le carnet comme dans la liste : « Ensuite : attendre l'avis du ferblantier », statut *compare* (E20g, E20h).
4. **Liens sans aperçu.**
   - La carte et les tableaux les nomment par leur site (« ferblanterie-gex.ch »).
   - Dans Comparer, ils tiennent en une ligne au bas de chaque tableau (« ferblanterie-gex.ch · sans valeurs · Compléter », ou « 2 liens sans valeurs »).
   - Le bouton « Chercher les « ? » » ne les compte plus (E20e).
   - Dans un carnet parti de zéro, un lien inconnu donne un lien sans aperçu, jamais une copie de la fixture.
5. **Liste.** « dites ce qui compte, en une phrase » est retiré de la liste et de la carte (CARNET-LIS).
6. **Une seule façon.** La carte dit « Ensuite : d'autres façons ? » (E02) au lieu de « coller des liens d'articles ».
7. **Fil.** La bulle « IA Lu sur la page » a disparu. La carte de l'article porte « 8 valeurs » ou « 7 valeurs · 1 ? ». Le compte se recalcule quand on garde ou retire une caractéristique (E07a, E12, E12b).
8. **Clavier ouvert : blanc sous le titre** (E01b, E05a, E06, E12, E20f).
   - La carte Ensuite et le critère restent juste sous le titre.
   - Les dépôts précédents remplissent l'espace libre tant qu'ils tiennent. Quand la place manque, le plus ancien part le premier.
   - Le contexte se resserre au critère seul avant de disparaître.
   - Si le brasseur hésite, la question « Retenir… » laisse l'écho au dépôt suivant, mais elle reste dans le fil.
9. **Redite du critère.** La sous-ligne de l'Ensuite ne redit plus ni le critère ni le titre.
10. **Cadence.** La 2 becs de table passe de 250 à 100 bt/h, toujours marquée « exemple ».
11. **Bande de Comparer.** « Toucher un titre pour classer » est retiré. La bande ne paraît qu'avec « Classé par … » ou un toast.

Les doutes du critique :
- **Retenu** : « Tenue à l'humidité » est proposée pour la ventilation (CADRE), avec des valeurs d'exemple (IP55, IP44, IP24).
- **Non traité** : « Pourquoi cette façon ? » mêle toujours la façon et les raisons du produit.
- **Non reproduit** : le toast « Rien de copié ». Le scénario ne l'a pas déclenché.
- **Frigo** : rejoué de zéro, son critère « tenir 2 °C stable en été » est relié à « Température ambiante max ».

### Scénario

`node work/missions/2026-11-16-carnet-decision/ra-p5f/scenario.mjs` → **COEUR OK (45 étapes, 53 captures), DEFAUTS 0**, aucune erreur de page.

La ventilation suit maintenant CADRE.md, sans choix :
- le critère est écrit sans « il faut », après un toucher sur l'Ensuite ;
- 5 liens, dont un sans aperçu ;
- « consommation » retirée ;
- une note d'attente, puis la ligne de la liste.

Contrôles ajoutés :
- l'Ensuite dit « d'autres façons ? » ;
- aucune bulle « Lu sur la page » ;
- « N valeurs · N ? » dans la carte ;
- au repos, pas de redite du critère ;
- pas de mode d'emploi dans la bande ;
- la tuile dit « 6 proposées · 1 gardée » ;
- une seule ligne « sans valeurs » par tableau.

Les anciennes captures E20 (choix, piège, pourquoi) sont déplacées hors du dépôt, puisque la ventilation ne se choisit plus.

En mode rempli (fixture), à 390 px : 0 erreur de page, et la ventilation affiche « Ensuite : attendre l'avis du ferblantier ».

Planches regardées : E01b, E02, E04a, E05a, E06, E07a, E12, E12b, E13a, E14a, E14b, E19b, E19d, E20b à E20h, E21b.

### Page 7

- 46 webp reconvertis depuis `cap/`, sous les mêmes noms.
- La section ventilation montre le scénario du CADRE (E20a, b, c, d, e, g, h).
- « Ce qui reste » est à jour, et `proto.html` est recopié.
- `verifier-page.mjs … --page-lot` → **PAGE OK (46 images chargées, lisible à 390 et 1280 px, sans erreur)**.

### Ce qui reste

- Le clavier est simulé (300 px) : pas encore joué sur son téléphone.
- Clavier ouvert, quand les dépôts précédents ne tiennent pas, un blanc sépare encore le contexte du dernier dépôt. Il n'est plus sous le titre.
- « Pourquoi cette façon ? » mêle deux questions.
- Dans Comparer de la ventilation, deux encadrés « moins bien que… » passent avant le premier tableau : c'est long.
- Liste vide, clavier ouvert : un blanc sépare « Carnets » du champ.

## Passe 1
Le verdict transmis était vide. J'ai donc jugé moi-même les 54 captures de la passe précédente, ouvertes une à une, contre TRANCHE.md (§ « Ce que l'assemblage doit corriger »), CADRE.md et CARNET-LIS, CARNET-MAIGRE, CARNET-CLAV et CARNET-COEUR. Puis j'ai tout corrigé et rejoué le scénario de zéro, au doigt.

## Défauts vus sur les captures, et ce qui a été corrigé

1. **Texte coupé derrière le champ, clavier ouvert** (E01b, E02, E04a/b, E06, E12, E19a/b/d, E21b) : sous le panneau du champ, les tuiles Façons, Articles et Comparer ainsi que la carte « Ensuite » restaient visibles à moitié. Correction : clavier ouvert, le panneau couvre tout ce qui se trouve sous le titre. La page remonte en haut, si bien que le titre reste lisible. Le contexte du carnet (la carte « Ensuite » et le critère) est recopié au-dessus du dernier dépôt, mais seulement s'il tient en entier. Le dernier dépôt est rangé contre le champ, comme dans une conversation.
2. **Débordement de l'écho** (E21b, carte du critère coupée en haut) : quand une question de l'IA attend une réponse, la puce « Coller le lien copié » attend aussi. Il n'y a qu'une action à la fois.
3. **Mode d'emploi (CARNET-LIS)** : trois textes ont été retirés.
   - « « embouteillage », « frigo de garde », « évier » : une ligne suffit » ;
   - « Déposez ce que vous trouvez : liens, photos, phrases », remplacé par « Ensuite : chercher les façons de faire » ;
   - « Une ligne suffit ; elle reste datée dans « Pourquoi ? » ».
4. **Phrase fausse** (E05a) : « Écartée avec ce pourquoi : Gravité » était faux, car Gravité reçoit la raison tirée du critère et non la phrase tapée. Le texte devient « **Gravité** sera écartée. »
5. **« … » dans un texte de l'IA (Q3)** : « (Oxygène capté, Cadence, Becs…) : à garder ou retirer dans Comparer » devient « 8 caractéristiques à comparer : Oxygène capté, Cadence, Becs et 5 autres. »
6. **Redite de la façon (Q1)** sur les cartes d'article : « Isobarique 2 becs… · CH · Isobarique » devient « … · CH ». La façon n'est plus redite quand le nom la contient déjà, comme pour « Évier sur pieds ».
7. **Date coupée** : « choisi le 16 / nov. » et « décision du 16 / nov. » passaient à la ligne entre le jour et le mois. Une espace insécable les tient désormais ensemble.
8. **Écartés en drapeau** (« Isobarique 4 becs pré-évacuation Abfülltechnik / West · DE », « · CH » seul sur sa ligne) : le nom est seul en ligne 1. En dessous viennent le fournisseur, seulement pour la même machine, puis la raison. C'est le cas dans la feuille Choisir comme dans la fiche.
9. **Redite de la réponse (Q1)** (E18, E19h, E20h, E21h) : la réponse à « Pourquoi ce fournisseur ? » reprenait les raisons cochées, listées juste en dessous. Elle remplace maintenant la liste « Pourquoi ». De même, la réponse « les écartés » remplace la liste « Écartés ».
10. **Raison qui n'en est pas une** : « vos notes : « demander une démo au revendeur romand » » était proposé comme pourquoi du choix. Une note d'action (demander, appeler, voir, attendre…) n'est plus proposée.

Rien n'a été retiré de ce que da ou p5f montraient (CARNET-MAIGRE). Les éléments retirés sont du mode d'emploi, des redites ou des faux.

## Rejeu de zéro (CARNET-COEUR)

`node work/missions/2026-11-16-carnet-decision/ra-p5f/scenario.mjs` : `proto.html?vide=1&clavier=300`, à 390 × 844 en tactile, d'un carnet vide.
- Résultat : **COEUR OK (47 étapes, 54 captures)**, **DEFAUTS 0**.
- Sondes rejouées à chaque capture : texte sous 14 px, texte coupé, + ou toast qui couvre, champ au-dessus du clavier à chaque frappe.
- Sondes ajoutées dans cette passe :
  - **ligne de la page à moitié cachée par le champ** ;
  - **écho qui déborde** ;
  - **titre couvert**.

Le test a été ajusté à trois endroits, pour suivre les corrections et non pour les masquer :
- les dates sont lues avec l'espace insécable ;
- le pays est lu sans la façon redite ;
- il faut au moins 2 raisons proposées, et aucune « demander… ».

Gestes : idée en 1 toucher et 14 frappes ; choix avec pourquoi en 6 touchers et 0 frappe ; plus tard, pourquoi iso puis pourquoi ce fournisseur en 5 touchers. Pour le frigo, la ventilation et l'évier, chaque objet a été refait de zéro, piège « vos tableaux disent l'inverse » compris.

Captures : `ra-p5f/cap/E*.png` (54), toutes regardées en planches après la dernière passe pour les états avec clavier (E01 à E06, E12, E19b, E21b) et les états touchés (E07a, E12b, E16a, E16c, E17b, E18, E19d, E19h, E21d).

## Page 7

`page7/index.html` (`node …/page7/build.mjs`) montre les 11 étapes, ra ou p5f, avec 42 captures et le lien « Jouer le carnet vide ». Contrôle à 1280 et à 390 : 0 texte sous 14 px, 0 image cassée, aucun débordement horizontal. Captures : `page7/page7-1280.png` et `page7/page7-390.png`.

## Ce qui reste

- **Clavier ouvert, liste vide** (E01a) : un blanc sépare « Carnets » du champ. La carte « Aucun carnet encore » est couverte par le panneau. C'est un défaut mineur, et un choix de forme possible.
- **Le contexte recopié au-dessus du dépôt disparaît quand il ne tient pas** (E12 : carte d'article plus lecture de l'IA). Rien n'est coupé, mais le critère n'est plus visible pendant qu'on colle.
- **Clavier simulé** (300 px) : il n'a pas été joué sur un vrai téléphone.
- **Sondes non jouées** : thème sombre et Q4 à Q23 au-delà des sondes listées ci-dessus.
