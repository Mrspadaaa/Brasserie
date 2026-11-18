# zq1 — Le fil des échéances (tiède)

Idée : la liste est un fil du temps vertical ; au-dessus d'« aujourd'hui 14.11 », ce qui est dû, avec son geste en un toucher ; dessous, les échéances à leur vraie distance (échelle 1,8 px/j, mois marqués) ; puis l'inventaire sans échéance.

- Problèmes résolus : P1 (À traiter · 3 compté sur les échéances), P2, P3 (Fait / Étalonner / Réparée sur la ligne), P4 (cause et durée de panne visibles), P5 (13 appareils au premier écran, aucun défilement interne), P7, P8 (aucun EQ-), P11 (fiche à lire : son propre fil), P12 (dépenses reliées dans le fil), P15 (Achat visible, 32 px), P17 partiel, P19, P20 (pas de pastille Neuf/Bon en liste), P21 (badges courts), P22 (valeur du parc sur 2 prix connus), P28 (tri par échéance). Parcours : M1, M2, M3 (en partie), M4, M5, M10.
- Champs neufs : dernier entretien fait (date), rythme (semaine, mois, 3 mois, brassin), échéance calculée, étalonnage (valeur lue par tampon, écart, tolérance ±0,05), panne depuis (05.11), compteur de brassins depuis le dernier détartrage (5/5).
- Données : toutes calculées depuis le 14.11.2026 (pH-mètre 11.10 + 31 j = 11.11, retard 3 j ; déshumidificateur 01.09 + 3 mois = 01.12, 17 j ; frigo 20.06 + 6 mois = 20.12, 36 j ; réfractomètre 28.09 + 3 mois = 28.12, 44 j ; cuve 02.03.2026 + 1 an = 02.03.2027, 108 j). Rythmes et dates de ces 5 lignes : fictifs plausibles. Dépense « Tampons » : Démo. Parc : 1 450 + 289 = 1 739 CHF, sur 2 prix connus.
- Acquis écartés : la pastille d'état quitte la liste (P20 : « Neuf » ne dit rien d'utile) ; l'état reste dans la fiche, segment à 4 valeurs. « Matériel déjà possédé » et « Projets d'équipement » passent dans le ⋯ (un toucher de plus).
- Écart : bouton « Étalonner » ouvre la fiche (il faut des valeurs lues), pas un geste en un toucher.

## Boosters UX (boosters-ux)
- fil-echeances, echelle-temps : suivre ; rail et position à l'échelle ; quand, sans lire de date.
- filtre-a-traiter, fait, reparee, etalonner, achat : déclencher en un toucher depuis la ligne.
- fil-appareil, etalonnage, rythme, etat, depenses-reliees, payer-entretien, enregistrer-etalonnage (fiche).
- Mesures v0 : 52 mots au premier écran hors noms (≤ 60) ; 0 texte < 12 px ; 0 `type="number"` ; 16 `data-booster`. B2 à B13 : non mesurés en v0 (recettes R1 à R6 en passe 2).

## Passe 2
Construite par `voies/p2-z1/build.mjs` depuis `parts.html` (coque commune de la passe 2) ; états `repos`, `geste`, `traiter`,
`ajout`, `vide`, `repos-1280`, et `repos` en cave. Les 7 captures ont été ouvertes une à une.

Défauts du critique corrigés :
- D1. Cave : le soleil remplace la lune dans l'en-tête.
- D2. Échelle partie du point « aujourd'hui » : y = 3,5 px × j − 14, avec 17 j → 45,5 px, 36 j → 112, 44 j → 140, coupure
  après 50 j, puis mars (108 j). Déshumidificateur posé à 17 j, et non plus à environ 28 j.
- D3. Le densimètre « jamais étalonné » passe au-dessus d'aujourd'hui, avec un nœud en tirets et le geste Étalonner. « À traiter 4 »
  (3 après l'étalonnage du pH-mètre, dans l'état traiter).
- D4. Achat fait 44 px. Déjà possédé et Projets sont deux tuiles de 44 px au pied, à côté de la valeur du parc (« 1 739 CHF · 2 prix
  connus »). En large : « Enregistrer un achat », « Matériel déjà possédé », « Projets d'équipement ».
- D5. Plus aucune courbe : chaque nœud est sur le rail et sa ligne à sa hauteur. Frigo (36 j) et Réfractomètre (44 j), à 28 px
  l'un de l'autre, se touchaient. Les nœuds passent à 26 px et restent à leur date ; les deux textes s'écartent de 3 px chacun.
- D6. Fiche : les dépenses sont dépliées en 3 lignes (Tampons 24,90 Démo, Solution KCl 12,50 Démo, Achat « date et prix
  inconnus »), 37,40 CHF sur 2 prix connus. « Utilisé dans 7 brassins » sous le nom. Le blanc est réduit à environ 35 px : le
  prochain étalonnage est en tête du fil (« 14.12 prochain, si étalonné · dans 30 j », point en tirets) et un étalonnage
  du 08.07 a été ajouté.

Retouches communes : « panne 9 j » et « retard 3 j » écrits en toutes lettres. Densimètre jamais étalonné compté. Aucun mot de
développeur à l'écran. Fait, Étalonner et Réparée font 44 px. Coque reprise de la passe 2. Achat, Déjà possédé et Projets
restent visibles au repos.

Greffes faites :
- étapes rincer / pH 7 / pH 4 / ranger (zq4) ;
- flacons teintés devant chaque tampon (zq2) ;
- bande « 30 j » sur le fil, à la forme de la frise rq3 ;
- silhouettes à ombre dans les nœuds (zq2) ;
- tuiles d'ajout toujours visibles (uq4).

États :
- traiter : juste après « Étalonné », le pH-mètre a quitté le haut. Une trace en tirets dit « descend au 14.12 », et il est surligné
  en vert à 30 j, au bord de la bande ; sa carte masque la limite. Le bandeau affiche « Étalonné · prochain 14.12 · Annuler ».
  Le reste tient en « 9 à jour · Tout ».
- ajout : la feuille « Nouveau matériel » propose Enregistrer un achat, Déjà possédé (ouvert) et Projets d'équipement. On y voit
  aussi les cinq catégories de l'app et un aperçu de la place sur le fil (Pompe de transfert, 01.11 + 3 mois = 01.02, dans 79 j).
  La loupe manquait derrière le voile ; elle est rétablie.
- vide : le point « aujourd'hui » seul, le rail en tirets, « Aucun matériel », puis Enregistrer un achat, Matériel déjà possédé
  et le lien Projets.
- repos-1280 : le fil à gauche. Au centre, le fil du pH-mètre à la même échelle (12.09, 11.10, 11.11 prévu, 14.12 prochain). À
  droite, la fiche : dépenses, étalonnage, rythme et état, avec Payer un entretien et Étalonné.

Reste :
- valeur comptable : le pH-mètre n'est pas immobilisé, donc rien n'est affiché. Seule la cuve d'ébullition le serait, et elle n'est
  pas dessinée.
- 1280 : environ 200 px de blanc sous la fiche, au-dessus des boutons.
- « Cuve fermentation 100L » passe sur deux lignes dans la grille « sans échéance ».
- Données fictives et plausibles : rythmes, dates d'étalonnage, Solution KCl 22.05 à 12,50 CHF (Démo), Pompe de transfert.
