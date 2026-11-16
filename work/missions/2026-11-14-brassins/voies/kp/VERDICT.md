OK — 39 problèmes, 21 bloquants

Version : arbre de travail non commité au 15.11 (HEAD 2ddd792e + ports p1 à p4). Captures ouvertes côte à côte avec la maquette du même état (390 clair, 390 cave quand elle existe, 1280).

| maquette | captures app ouvertes | thèmes | largeurs | problèmes | bloquants |
|---|---|---|---|---|---|
| e1a | repos, repos-bas, geste (9) | clair, cave | 390, 1280 | 7 | 4 |
| e2a | repos, repos-bas, geste-fg, fg-confirmee, conditionne, conditionne-bas, conditionne-termine-apres, termine, termine-bas, annule (30) | clair, cave | 390, 1280 | 10 | 5 |
| e4c | repos, geste, retour, garde-fg, conditionne-echelle (15) | clair, cave | 390, 1280 | 9 | 5 |
| e7a | repos, repos-bas, repos-milieu, repos-mois, geste-fg, geste-alcool, geste-volume, ligne-fiche, puce-liste, archives-incluses, archives-exclues (37) | clair, cave | 390, 1280 | 5 | 2 |
| e10c | repos, repos-bas, geste, trop, refuse, vide (8) | clair, cave (repos) | 390, 1280 (repos) | 1 | 0 |
| e11a | repos, recettes, geste (5) | clair, cave (repos) | 390, 1280 (repos) | 7 | 5 |

## Captures plus anciennes que le dernier changement (signalées, défauts non comptés)
- Les 54 captures de p1 (e1a, e2a, e4c) datent de 17:36 à 17:39 ; `BatchDetailSheet.tsx`, `fiche/StageLadder.tsx` et `fiche/PostFiche.tsx` ont changé à 18:00 et 18:01 (p4). Non comptés : la tête « Abandonnée en cours de route » de e2a annulé (PostFiche), le panneau « ⋯ », et « du 2026- à son dernier verre » / « 2026- » en Conditionné (e2a terminé, e4c retour et conditionné). Ce dernier vient d'une date ISO de la fixture ; p1 dit le rejeu en JJ.MM.AAAA en cours. À rejouer.
- Captures manquantes : 1280 cave de e1a, e2a, e4c, e10c, e11a ; 390 cave de e10c (hors repos) et e11a (geste, recettes) ; maquette e7a 390 du bas (Styles, Houblons, Alcool et amertume, Retours) : ces parties n'ont pas été comparées.

## Doutes (non comptés)
- e7a gestes FG, Alcool, Volume : après le toucher, le titre est coupé sous l'en-tête ; peut venir du clic du banc.
- e7a : toutes les teintes de bière sont ambrées (Stout compris) ; p2 l'attribue à la fixture. À vérifier sur de vraies recettes.
- e2a, e4c : « °C cuve 12 » sur un brassin « en garde froide » ; valeur de fixture, peu plausible en garde froide.
- e2a et e4c : graphes de densité avec un trait vertical le premier jour (OG et un relevé à la même date) ; fixture.
- Fermenteur (« F2 », « F3 libre », « Brasser la Pale Ale dans F3 », « F1 30 » → « cuve 30 »), litres par fût (« 12 L dans 20 L »), consigne « garde 2 °C » : absents du modèle, ACCORD des ports.
- e10c trop : « Système 30L » sans espace ; nom du matériel saisi, pas une valeur calculée.
- e2a, e4c, Conditionné : « 38,5 L en place » pour 30 × 33 cl (9,9 L) + un fût de 20 L (29,9 L) ; compté en e2a 8.


## e1a — CORRIGER
1. [B] Repos 1280 clair, bloc date : le segment actif « Reporter » est un aplat noir sans texte (à 390 il se lit). Attendu : libellé blanc lisible à toutes les largeurs.
2. [B] Repos 390 et 1280, bloc date : deux jours rapides (« demain 16 », « +7 j 22 ») ; la maquette en a trois, dont le jour proposé coché (« lu 16 ✓ »). Attendu : la troisième puce, jour proposé, cochée.
3. [B] Repos et repos-bas 390 (clair, cave) et 1280, rangée du bas : « Estimer le budget de ce brassin » sur trois lignes à la place de « Budget » ; en cave le libellé passe en jaune. Attendu : « Budget », même habillage que Compagnon et Étape (prop `label` de `BrewBudgetButton`).
4. [B] Geste 390 (clair, cave), règle des jours : « di 15 » et « lu 16 » collés (« di 15lu 16 »), illisibles. Attendu : graduations espacées comme la maquette (« sa 14 · di 15 · lu 16 … »).
5. Geste 390 : la date choisie (me 18.11) ne change rien à la carte Starter : pastille « trop tard pour ce jour », ligne 08.11 et avertissement rouge restent. La maquette rejoue le plan au geste (« à lancer ce soir », 1re ligne « ce soir »). Attendu : le starter suit la date en aperçu.
6. Repos et geste, carte Starter : trois lignes ajoutées que la maquette n'a pas (« Échéance passée · à revalider » + deux lignes rouges « L'ensemencement cible est passé… »). Attendu : l'état dit par la seule pastille, comme la maquette (trop de texte).
7. Repos 390 et 1280 (clair, cave) : le × de fermeture porte un anneau (focus visible au repos ; jaune en cave). Attendu : × nu comme la maquette.

## e2a — CORRIGER
1. [B] FG confirmée (390 clair, cave, 1280) et e4c garde-fg : après « Confirmer la FG 1,013 », la tête dit « Prête à conditionner » mais garde la puce « 1,010 · 11.11 pas encore stable ». La maquette montre « ✓ FG 1,010 » à côté des relevés. Attendu : « ✓ FG 1,013 » (la valeur confirmée), plus de « pas encore stable ».
2. [B] Terminé (390 clair, cave, 1280), onglet Carnet : les puces « à refaire · à corriger · sans suite » sous « Dégustation et prochain essai » sont absentes. Attendu : les trois puces.
3. [B] Terminé, onglet Carnet : « Observations du jour de brassage » et « Inspiration et profil visé » sont deux grands champs vides ; la maquette en fait deux lignes « — ✎ ». Attendu : lignes repliées avec crayon.
4. [B] Terminé, barre du bas : « Fermer » à la place de « Rebrasser cette Saison ». Geste perdu. Attendu : bouton principal « Rebrasser cette <style> ».
5. Terminé, Carnet : bloc « Prédit et dégusté » (4 lignes d'explication, « Noter une dégustation du brassin », « Aucune dégustation enregistrée ») absent de la maquette ; le graphique Densité de la maquette n'y est pas. Attendu : le carnet de la maquette, puis Densité.
6. [B] Annulé (390 clair, cave, 1280), Dossier : la liste « Budget du brassin — › · Historique conservé › · Supprimer ce brassin × » est remplacée par une pastille « Estimer le budget de ce brassin » en tête, une ligne « Annulé · Brassin abandonné, historique conservé », une barre « Compagnon brasseur » et un grand bouton rouge. Attendu : la carte-liste de la maquette.
7. Annulé, Étape : « Revenir à « … » » en bouton gris ; la maquette le met en bouton principal noir (jaune en cave). La puce « Annulée » sans hachures.
8. Conditionné (390 clair, cave, 1280) : « 38,5 L en place » alors que la carte montre 30 × 33 cl (9,9 L) et un fût de 20 L, soit 29,9 L : 8,6 L ne sont expliqués nulle part. La fixture est incohérente (`volumePackagedL` 38,5), mais l'écran l'affiche sans le dire. Attendu : « en place » = somme des contenants, ou l'écart dit (« 8,6 L non répartis »).
9. FG confirmée : l'annonce « FG 1,013 enregistrée · Annuler » est un bandeau vert dans la page ; la maquette en fait un toast sombre en bas, au-dessus de la barre. Attendu : le toast.
10. Repos, toutes captures : × avec anneau au repos (comme e1a 7).

## e4c — CORRIGER
1. [B] Repos, geste, conditionné, retour (390, 1280) : les dates des étapes passées sont absentes (« Fermentation 27.10 → 03.11 », « Garde 11 j · depuis 03.11 », « 03.11 → 14.11 »). Attendu : dates à droite de chaque marche.
2. [B] Geste (390 clair, cave, 1280) : après 6 bouteilles et ZZ-F02 (21,98 L), le reste de la barre dit encore « ≈43L en cuve ». Chiffre faux. Attendu : le reste (≈ 21 L) ou une part hachurée sans libellé, comme la maquette.
3. [B] Repos, geste, retour : « Abandonner le lot · toucher ici » ; la maquette dit « toucher ou glisser ici » et le palet se glisse. Geste perdu (écart 9 de p1). Attendu : palet glissable.
4. [B] Retour (390 clair, cave, 1280) : la flèche rouge ↑ et le rail rouge entre Conditionné et Garde sont absents (rail vert, pas de nœud). Attendu : nœud rouge flèche montante, rail rouge.
5. [B] Retour et conditionné : la carte Conditionné perd sa barre de répartition « 30 bt | F-01 · 12 L » et sa teinte de bière (brun stout dans la maquette, ambre dans l'app). Attendu : barre et teinte de la bière.
6. Retour : la croix rouge porte un paragraphe de six lignes (« Le stock déjà retiré reste retiré… ») ; la maquette dit « Aucun ingrédient remis en rayon ». « Laisser conditionné » passe sur deux lignes ; « Revenir en garde » est en contour, la maquette le remplit en rouge. Attendu : une ligne, bouton rouge plein.
7. Repos : « ≈43L en cuve » sans espaces ; attendu « ≈ 43 L en cuve ». Le titre « ≈ 43 L à tirer » n'a pas la couleur d'accent bleue de la maquette. L'icône bouteille à gauche du curseur manque.
8. Repos et retour : « Terminé » sans « tout vendu » (repos) ; en retour, un grand bouton « Clôturer » pleine largeur au lieu du petit bouton à droite.
9. Hachures (jauge en cuve, Abandonner) en aplat : écart 5 connu de p1.

## e7a — CORRIGER
1. [B] Repos, archives, gestes (390 clair, cave ; 1280 clair, cave) : la flèche « ‹ » de « ‹ Le bilan » est absente (ACCORD p2 : `onBack` manque dans `ProductionCatalog`). Attendu : « ‹ Le bilan », retour à la liste.
2. [B] 1280 (toutes) : au-dessus du bilan, l'app garde toute la barre de la liste : onglets « Carnet | Bilan », recherche « Nom, lot, houblon, malt… », Filtres, 8 puces (Tous 5, En cuve 2…), « Tout, archives incluses · 5 », « À suivre d'abord ». Le titre tombe à mi-écran. La maquette 1280 met « ‹ Le bilan » juste sous les onglets. À 390, même ajout en plus court (« 5 brassins · Historique / Bilan » + 3 icônes). Attendu : la vue Bilan sans la barre de la liste.
3. Archives exclues 1280 : la barre dit « Tout, archives incluses · 5 · 1 archive incluse » pendant que l'interrupteur du bilan, coupé, compte « 2 brassins sur 3 ». Deux réglages des archives qui se contredisent. Attendu : un seul, celui du bilan (`onFolder`).
4. Archives (390, 1280) : le compteur de l'onglet passe à « Brassins 4 » alors que la ligne dessous dit « 5 brassins · Historique ». Attendu : un seul compte.
5. Repos 390 et 1280 : l'interrupteur « Archives » est grisé (désactivé) ; la maquette le montre actif, éteint. Attendu : actif, comme la maquette.

## e10c — CONFORME
1. Geste (30 L) et trop (36 L), 390 clair : les écarts en pastille n'ont pas de décimales fixes (« +0,2 », « +0,15 », « +2,5 », « +0,4 ») ; la maquette écrit « +0,53 », « +0,40 ». Attendu : deux décimales pour les kg (« +0,20 », « +2,50 »).
Le reste suit la maquette à 390 (clair, cave) et 1280 : tête, trois totaux, rail coloré, curseur du bas, refus « 2 500 L ? » avec totaux « — », carnet vide. Vérifié : 6,40 kg × 1,25 = 8,00 kg, 300 g × 1,5 = 450 g, eau 28,7 + 14,3 = 43,0 L.

## e11a — CORRIGER
1. [B] Repos 390 (clair, cave) et 1280, liste Brassins : les cartes de la maquette ne sont pas portées. L'app garde les anciennes cartes (« ZZ-002 · Fermentation · 42,5 L en cuve · Densité 1,018 · Voir les mesures · ☆ · ⋯ »). Manquent : pastille de cuve (F1, 2 °C), densité sur jauge avec la bande FG, houblons du moment (« Citra 100 g · Mosaic 80 g · demain »), les boutons de l'état (« Confirmer FG », « Replanifier / Brasser », « Déguster ») et la ligne repliée de la bière écoulée. Attendu : les cartes de la maquette, une par état.
2. [B] Repos 390 : les puces « Tous · 2 en cuve · 1 en retard » sont absentes (« 3 brassins » + 3 icônes à la place) ; à 1280, toute l'ancienne barre reste (onglets Carnet | Bilan, recherche, 8 puces, « Courant · 3 », « À suivre d'abord »). Attendu : les trois puces de la maquette.
3. [B] Repos et Recettes (390, 1280) : le bouton flottant est un « + » nu ; la maquette le nomme « + Brassin » ou « + Recette » selon le sous-onglet (écart 5 de p3).
4. [B] Geste 390 clair, menu du + : « Outils houblons » est absent ; l'ordre change (Compagnon en 2e, « Créer une recette » en dernier) ; le menu est une petite liste dans le coin, sans « Nouveau brassin » en tête noire ni séparateurs. Attendu : le menu de la maquette, dans son ordre (Nouveau brassin, Créer une recette, Outils houblons | facture, vente | Compagnon).
5. [B] Recettes 390 clair : les cartes recette de la maquette ne sont pas portées (état « F2 réservé · OG — », bouton « Brasser » ou « Modifier », lien « Brassins LOT-… », bord rouge de la recette en attente) ; l'app garde l'ancienne carte (« V1 · 24 L · — · 21 IBU · Détails et actions »). Les puces « Toutes · À cru » manquent aussi. Attendu : cartes et puces de la maquette.
6. Recettes : la phrase dit « ZZ Pale Ale planifiée attend son brassin depuis 7 j », nom d'un brassin, alors que la seule recette listée est ZZ NEIPA. La fixture n'a qu'une recette, mais la phrase doit nommer la recette (« Pale Ale ») et la liste la montrer. Attendu : nom de recette, recette présente.
7. Repos 390 : la phrase fait 4 lignes en 32 px et toute la première proposition est rouge ; la maquette tient en 2 lignes et ne met en couleur que l'état (« NEIPA dry hop demain » en vert). Attendu : rouge seulement sur « en retard de 7 j ».
