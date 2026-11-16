OK — 15 variantes jugées, toutes utilisables seules ; 4 bloquants à corriger avant la page (onglet v2, fournisseur v2, lot v1, lot v2)

# Critique des choix ouverts (16.11) : onglet, fournisseur, suppression, lot, seuil

Juge : critique Opus calibré sur PORTRAIT.md (§ 7, « Écart des juges »). Pas de note chiffrée.
Les 15 `proto.html` ont été joués à 390 tactile : chaque cliquable touché sur une page neuve (306 gestes au total), aucune erreur de page,
aucun débordement horizontal et aucun texte sous 14 px, y compris à l'état vide en cave. J'ai ouvert toutes les captures claires,
plus le repos en cave, sur des planches par variante.
Les onglets du bas ne réagissent pas, et c'est normal : ils sont hors sujet. Le + est partout en bas à droite, 12 à 16 px au-dessus des onglets,
comme il l'a corrigé le 16.11.

## Onglet Calendrier — il prendrait **v1**
« v1 c'est clair, le calendrier a son onglet et Bord bouge pas. v3 pas mal pour finance mais elles sont passé où mes finances ?? »
Ce qui le fait pencher : ses derniers mots demandent « un général avec son Tab Mais aussi un spécifique aux thématiques ».

- **v1, sixième onglet** : utilisable seule. Les 6 libellés tiennent à 14 px. Bord garde tout et a un lien « Cette semaine au calendrier ».
  1. Sur Calendrier, le + couvre la barre « Noël privés » au repos. Il faut une marge basse sous la frise.
  - Doute : « Cette semaine » reprend les trois tâches de « Aujourd'hui » de Bord.
- **v2, fusionné avec Bord** : utilisable seule, avec un bloquant.
  1. **Bloquant** : Bord perd « En un coup d'œil » (259 à te permettre, 5 à commander) et « En cuve » (les densités). Mesuré : absents de
     la page. Il a dit « Je veux pas perdre en fonctionnalités ni en données ». Il faut les garder, sous la frise ou dans le bloc du haut.
  2. Toucher « S47 » ne fait rien. C'est la semaine en cours : il faudrait un retour visible.
- **v3, à la place de Finances** : utilisable seule.
  1. La rangée Tout · Finances · Brassins · St… est coupée au bord. Stocks et Agenda ne se voient qu'en faisant défiler.
  2. Brassins et Stocks existent à la fois en onglet et en section du calendrier, alors que Finances n'existe plus qu'en section.
     Ces deux entrées pour la même chose ne suivent pas une même logique.

## Fiche fournisseur — il prendrait **v3**, avec la liste des prix de v1
« v3 c'est exactement le pourquoi j'ai pris ce fournisseur, top ! Mais les prix des articles direct comme v1 »
Ce qui le fait pencher : son besoin du 16.11, « pas revenir en arrière… pourquoi j'ai pris ce fournisseur ». S'y ajoutent les barres
comparées, port hachuré compris (« Les bar de ce type sont plus informative »).

- **v1, les prix d'abord** : utilisable seule, la plus lisible en 3 secondes (6 j, puis les prix avec leur écart ↑↓). Les sommes de la fusion sont justes :
  2 104,60 + 1 890,30 + 612,40 + 205,10 = 4 812,40, et 14 factures.
  1. Après la fusion, le message « 4 noms réunis » cache un prix et « Tes choix ici » pendant 6 s.
- **v2, le fil** : utilisable seule, avec un bloquant.
  1. **Bloquant, valeur fausse** : après « 3 noms réunis · +7 factures », la carte dit « Brouwland 7 factures ici ». Il en avait 3 avant,
     donc il en faut 10 (mesuré dans le DOM).
  2. « Glisse un nom sur Brouwland pour le réunir, ou touche-le » s'affiche au repos. C'est une légende écrite, déjà refusée (DEFAUTS).
  3. Les prix passent sous la frise des 12 mois et le filtre. Au premier écran, l'information est dense et éclatée.
- **v3, le pourquoi** : utilisable seule. L'état vide est bien rempli (raisons à toucher, articles, factures, délai). L'homonyme de Gand reste décoché.
  1. Le + couvre « Articles 3 · Pilsner… » en bas du premier écran.
  - Doute : le premier écran est fait surtout de texte (phrase en 23 px et puces), mais c'est sa propre phrase de décision.

## Refus de suppression — il prendrait **v3**, avec les pastilles de liens à toucher de v1
« v3 top, archiver direct c'est le plus simple. v2 trop d'étapes juste pour supprimer un fût »
Ce qui le fait pencher : « workflow le plus simple », « pas perdre… ni en données », et L33 (« refus avec raison ou archivage, jamais de
cascade »).

- **Commun aux trois** : dans la liste, « plein de L-014 · chez Café du … » est coupé. Le client, qui est la raison même du refus, disparaît.
  Il faut écrire « L-014 · Café du Pont » ou passer sur deux lignes.
- **v1, la raison d'abord** : utilisable seule. Ses deux actions sont nettes (« Compris, je le garde » et « Archiver F-07 à la place »).
- **v2, les liens un par un** : utilisable seule. Le compteur qui descend parlera (le décompte, L9).
  1. Dans la feuille, « ✓ Vidé · 30 L sortis de L-014 » écrit un mouvement de stock à seule fin de pouvoir supprimer. C'est une donnée produite par le
     refus, contraire à « pas perdre… ni en données ». Il faut au moins que ce geste ouvre l'écran du mouvement, et non une case.
  2. En cave, le bouton grisé « Supprimer · encore 3 liens » est presque illisible.
  - Doute de métier : le fût « 30 L dedans, pas encore vendus » est chez Café du Pont, avec une consigne. Un fût livré avec consigne est vendu.
- **v3, archiver à la place** : utilisable seule. L'avant/après « En service 7 → 6 / Archivés 0 → 1 » se lit en 3 secondes.
  1. Une fois « Pourquoi » déplié, « Garder en service » sort de l'écran (il faut faire défiler la feuille).

## Qui a reçu ce lot — il prendrait **v3**, avec le mode retrait de v2 (prévenu, message unique)
« v3 vachement bien, on voit direct qui l'avait le jour de la plainte. Le mode retrait de v2 avec appeler et prévenu faut le garder »
Ce qui le fait pencher : c'est la frise de fb, avec un geste direct sur la frise (sa priorité du 16.11). Les données sont cohérentes : le 8 nov., Café du Pont (F07),
La Cave à Jules et Corcelles l'avaient ; Tilleul (le 14) et le marché (le 9) ne l'avaient pas encore.

- **v1, branches** : utilisable seule. Le total se lit en 3 secondes (4 clients, 3 fûts dehors). L'appel s'ouvre sur place.
  1. **Bloquant, sens métier (L14 bis)** : le + propose « Mesure de densité » sur le lot 41, conditionné le 2 nov. et en fûts. Il faut
     retirer cette entrée hors cuve.
  2. Une fois Café du Pont ouvert, le + couvre les pictos de Corcelles.
- **v2, mode retrait** : utilisable seule. C'est la plus actionnable (appel, prévenu, Annuler, message déjà écrit).
  1. **Bloquant, texte coupé** : en retrait, le + couvre la moitié droite de l'action principale « Même message à tous, déjà é… »
     (bouton 730-784 px, + 708-768 px).
  2. Au repos, il faut toucher « Reçu par 4 clients › » pour voir qui l'a reçu. Le PORTRAIT le dit : quand l'essentiel est à un toucher, l'écran perd.
  - Doute de métier : 6 fûts et 48 bouteilles tirés d'une recette de 120 L ne tiennent que si les fûts font 17 L au plus. Il faut afficher leur contenance.
- **v3, fil du temps** : utilisable seule.
  1. La pastille de date « auj. 16 nov. » cache la fin de « Glisse la date sur son jour » et les repères S46 et 16.
  2. Cette phrase est une légende écrite au repos : elle est à retirer, la pastille suffit.

## Pastille 24 et « 5 à commander » — il prendrait **v3** (doute avec v1)
« v3 l'histogramme c'est top, je vois ce qui arrive semaine par semaine. Mais faut que ça reste simple »
Ce qui le fait pencher : le dense utile l'emporte. Les nombres concordent : 1 + 4 = 5 avant S49 ; 2 + 3 + 1 = 6 de S50 à S52 ; 13 au seuil ; total 24.
v1 est le plus simple et rend le même signe partout (Q21) : s'il tient à « 0 réglage », c'est v1.

- **v1, un seul chiffre** : utilisable seule.
  1. À l'état vide, « 0 rien ne presse » et « Rien à commander » se répètent.
  2. « même chiffre que la pastille » est une légende au repos.
  3. Une fois la liste dépliée, le + couvre une quantité (Gypse).
- **v2, vingt-quatre cases** : utilisable seule.
  1. « 19 · rien ne presse » mélange les 13 articles au seuil et 6 articles dont un brassin a besoin en S50 à S52, comme les capsules de la Blonde en S50.
     « Rien ne presse » y est trop fort.
  2. Le + couvre les quantités de Mosaic et de Simcoe dans la liste filtrée.
- **v3, un horizon commun** : utilisable seule. Un toucher règle à la fois le chiffre et la pastille (5, 11 ou 24).
  1. En mode « Tout », le + couvre la quantité des Capsules.
- **Commun** : la rangée Articles · Courses · Fûts · Houblons · Mat… est coupée. Elle vient de la base `s-stk-repos`, elle défile.

## Retouches communes, avant de faire la page de choix
1. **Thème** : les `proto.html` s'ouvrent en clair, et le clair est noir et blanc avec peu de couleur. Le cave n'apparaît qu'avec `&theme=cave`.
   Ses mots du 16.11 : « Pourquoi il y a un thème autre que celui de l'app, et pas de couleur ? ». Il faut ouvrir en cave par défaut, avec les couleurs de zone.
2. **Le +** : sa place est juste. Mais dans 9 états, il couvre une quantité, un texte ou un bouton. Il faut une marge basse d'environ 80 px sous chaque liste.
3. **La barre du bas** : fournisseur, lot et seuil ont 6 onglets avec Calendrier, ce qui suppose déjà le choix de l'onglet (v1). Suppression en a 5.
   Il faut garder la barre de l'app tant que l'onglet n'est pas choisi (D123).
4. **Légendes au repos** (fournisseur v2, lot v3, seuil v1) : les retirer.
5. **Méthode** : il a dit le 16.11 « des mini maquettes, tout simple pas jouable… pleins de versions ». Trois variantes jouables par sujet
   se montrent telles quelles. Si aucune ne lui convient, relancer en statiques nombreuses plutôt qu'une passe jouable. La page de choix
   suit D126 et ses mots du 15.11 : côte à côte, « Choisir » et « Copier ».

## Sa phrase d'ensemble prédite
« Pas mal du tout ! Onglet v1, fournisseur v3, suppression v3, lot v3 avec le retrait de v2, seuil v3. Mais le + qui cache des trucs et le thème blanc, encore ?? »

LEÇON PROPOSÉE : un état jouable se vérifie avec le + flottant par-dessus. Il faut mesurer le chevauchement du + avec le dernier bouton et la dernière quantité, en
fin de liste et dans les feuilles. C'est le défaut le plus fréquent du lot (9 états), et aucun des contrôles de mesure ne le voit.
