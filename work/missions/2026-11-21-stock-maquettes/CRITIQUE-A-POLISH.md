OK — 35 écarts de A au modèle (dont 6 sur le seuil), tous corrigeables au port

# Autres stocks, version A : écarts au modèle avant le port (22.11, D423)

Juge : Opus (Fable interdit). Ce qu'il a dit : « Choisi mais elle est de loin pas fini polish […] il y a un modèle » ; « La version malt houblons
et levure est un peu plus clean mais l'idée est là. Aussi il manque quelques trucs genre le seuil ».

J'ai ouvert chaque capture une fois, en mettant côte à côte A et le modèle :
- 390 : `st3-a-390` et `st3-a-390-ligne`, comparées à `st1-d2a-repos-660`, `st1-d2a-houblons-660` et `st1-d3b-legende` ;
- 1280 : `st3-a-1280`, comparée à `st1-d3a-1280` et `st1-d3b-1280`.

J'ai relevé les valeurs dans `st3-build.mjs` (CSS_A), dans `st1-build.mjs` (CSS, CSS_D2A, CSS_LEG) et dans l'app (worktree port-carnet,
`src/ui/stock/mur.css`, `murAjustements.css`, `MurStock.tsx`, `LigneStock.tsx`).

Règle du port : quand d2a et l'app diffèrent, c'est l'app qui fait foi, parce que les deux onglets doivent se ressembler. Les écarts entre d2a
et l'app viennent de corrections déjà jugées : CT4C-3, c25 et ST-T5.

Sens métier : rien d'absurde. Les comptes se recoupent : 8 épuisés, 8 bas, 2 DDM et 3 manquants pour la NEIPA, soit Acide lactique,
Bouteille 33 cl et Étiquette NEIPA.

## Seuil (ce qu'il dit manquer)
1. **Le tiret n'a pas de valeur.** Dans A, le pointillé du mur ne dit ni ce qu'il marque ni combien. Dans le modèle, il est nommé : l'app
   écrit « 1 kg » ou « 250 g » sur la ligne (`.sw-rl`), et la légende dit « tirets : 5 kg… ».
   Correction : écrire « seuil » une fois par rangée, à gauche du pointillé de la première colonne, avec le style `.sw-rl`
   (700 12px/14px, couleur `--l1-t0`, `pointer-events:none`), à 390 comme à 1280.
2. **Le tiret est mal placé.** Dans A, il est à mi-hauteur (`bottom:50%`, soit 11 px sur 22). Dans le modèle, le repère est haut : 14 px
   sur 22 (`.bars::before{bottom:14px}`), 31 px sur 50 à 1280.
   Correction : à la hauteur du modèle (14 px sur 22, 31 px sur 50), avec une hauteur de pot égale à min(22, 14 × q / seuil). Un pot pile
   au seuil touche le tiret.
3. **Le tiret couvre des pots qui n'ont pas de seuil.** Dans A, il traverse toute la colonne, même quand les pots n'ont pas de seuil :
   Épices (1 seuil sur 7), Lev. · enz. (1 sur 6), Clarif. (2 sur 7), Cartons (0 sur 2). Il se lit alors faux.
   Correction : un trait continu quand tous les pots de la colonne ont un seuil. Sinon, un tiret par pot qui a un seuil, de la largeur du
   pot plus 3 px de chaque côté. Pas de tiret sur une colonne qui n'a aucun seuil (Cartons, Conso. sauf Gants).
4. **Les pots sans seuil sont pâles** (`opacity:.5`, à 390 comme à 1280). Le modèle ne pâlit aucun pot : Avoine, qui n'a pas de seuil,
   est plein.
   Correction : opacité 1. Le « sans seuil » se lit dans la ligne de liste (déjà écrit) et dans la table à 1280 (voir 4 bis).
4 bis. **À 1280, le seuil n'est pas une colonne de données.** Dans A, il est écrit en gris (« seuil 250 g », 12,5 px) derrière chaque
   jauge, ce qui donne une jauge de largeur variable. Dans le modèle, la 2e colonne de la table porte la donnée qui décide (EBC, α).
   Correction : colonnes « Article · seuil · stock · jauge », avec le seuil en mono 14 px, aligné à droite, et « — » s'il n'y en a pas.
   Retirer le texte gris derrière la jauge.
5. **À 390, la jauge de liste fait déborder le seuil.** Dans A (`.a3-js::after`, left/right −3 px), le pointillé sort du cadre, y compris
   sur les lignes épuisées (Bicarbonate, Acide lactique : « -[ ]- »). Le modèle n'a pas de tiret dans la jauge de liste.
   Correction : un tiret dans le cadre seulement (left/right 0, 1,5 px dashed #444, `overflow:hidden`), aucun sur une jauge épuisée.

## Totaux sous les colonnes
6. **Sous chaque colonne, A écrit le nom de l'article le plus urgent** (Bicarb., Lactique, Gélatine, Zinc, Cacao, 50 cl, IPA, Détartrant,
   PBW), en rouge ou brun, Source Sans 600. Dans le modèle, il y a un total en mono 13px/15px, couleur #333, jamais coloré, jamais de nom
   (39,2 kg ; 720 g ; 7).
   Correction : un total façon `.l1e-t`. C'est la somme quand la colonne n'a qu'une unité : Sels 1,7 kg, Bouteilles 248, Canettes 216,
   Capsules 1 310, Étiquettes 247, Cartons 48, Nett. Acides 2,3 L. Sinon, c'est le nombre d'articles en stock, comme Levures dans le
   modèle : Acides 2, Clarif. 6, Lev. · enz. 5, Épices 6, Alcalins 3, Conso. 4.
   Une colonne entièrement à zéro affiche « 0 » ou « 0 g », comme W. Coast.
   Ce qui est urgent se dit déjà par le cadre rouge, les filtres et la liste triée.
7. **Nettoyage, à 390 : une ligne de mots remplace les totaux** (« Détartrant 0 · Peracét. 1,5 L · PBW 0,4 kg »). C'est du texte en
   trop, et c'est la seule rangée bâtie autrement ; elle passe à 61 px, contre 52 à 56 pour les autres.
   Correction : la retirer et mettre des totaux comme ailleurs (point 6).
8. **À 1280, même défaut qu'en 6** (noms rouges sous les colonnes). Correction : totaux en mono 14px/17px (`.d3a-m .tot`).

## Couleurs et formes
9. **Les pots portent des textures internes** (points de grain sur Sels, rayures de sachet sur Lev. · enz., hachures sur Épices, rayures
   de capsule, bande d'étiquette, diagonale de carton). Le modèle n'en a aucune : le pot est un aplat, haut arrondi de 2 px.
   « Plus clean ».
   Correction : supprimer `.fx-grain`, `.fx-sachet`, `.fx-hach`, `.fx-disque`, `.fx-etiq` et `.fx-carton` (dans le mur et dans la liste).
   Garder la couleur par famille, puisqu'il l'a demandée le 22.11 : « couleur et forme pour les stock autre ».
10. **Il y a trop de silhouettes.** La forme ne se lit qu'à partir de 8 px. Garder seulement celles qu'on lit d'un coup d'œil : la
   bouteille (Bouteilles), la canette (Canettes), le flacon (Acides additifs, Nett. Acides) et le bidon (Alcalins). Les autres
   deviennent des aplats droits, comme dans le modèle. Supprimer la goutte, qui arrondit Clarif. sans rien dire.
11. **La couleur des familles est saturée et varie d'une rangée à l'autre** (bleu-gris, or, sarcelle, brun, rouge brique sur la seule
   rangée Additifs). Dans le modèle, les teintes d'une rangée restent dans une seule gamme (bruns EBC, verts houblon).
   Correction : pour chaque rangée, cinq teintes au plus, prises dans sa gamme, à la clarté de `degrade()` de l'app (L 36 à 70) :
   Additifs en bleus et gris, Emballage en cuivres et bruns, Nettoyage en verts. La couleur reste un repère de famille, pas un arc-en-ciel.
   (Mon étalonnage : je suis trop clément devant les planches à plusieurs couleurs.)
12. **Les pots ont trois largeurs** : 6 px pour Additifs, 8 px pour Emballage, 10 px pour Nettoyage. Dans le modèle, la largeur est la
   même partout (8 px, `.l1e-b`).
   Correction : une seule largeur pour tout le mur, la plus grande qui fasse tenir la rangée la plus large : 6 px à 390 pour 30 pots.
   Elle vient de `murMiseEnPage`, avec un écart de 2 px. À 1280, ×1,5 (`zoom`, ST-T5).
13. **Le cadre d'épuisé suit la largeur du pot** (6 px dans Additifs). Dans le modèle, il fait 10 × 8 px, bord rouge de 1,5 px, fond
   blanc.
   Correction : 10 × 8 px partout, quelle que soit la largeur du pot.
14. **Le point orange DDM** (7 px, anneau blanc, sur Biofine et Glucoamylase) n'existe pas dans le modèle. Le mur de l'app ne marque que
   la DDM dépassée (« barré », Levures).
   Correction : le retirer du mur. La DDM se lit par le filtre « DDM 2 » et dans la ligne ; une DDM dépassée devient un pot barré, comme
   `.sv-dx`.
15. **Le pot à compter** (Vanille) ne fait que 45 % de la hauteur. Correction : la marque à compter de l'app (`.sv-ac`, contour en
   pointillé), à la hauteur de la dernière quantité connue, comme Cryo Citra.
16. **Le liseré de la jauge de liste est gris foncé.** Dans le modèle, il est de la couleur de la rangée (1,5 px brun). Correction : bord
   de 1,5 px dans la couleur de la rangée ; rouge s'il est épuisé (inchangé).

## Typographie et tailles
17. **Le nom de la rangée** est en 13,5 px avec un espacement de −0,35 px (pour faire tenir « Emballage », qui dépasse quand même sur la
   colonne, à 78 px pour 68). Dans le modèle et dans l'app : 700, 13px/15px, colonne de 60 px.
   Correction : 13 px, sans espacement négatif, et une colonne du nom de 72 px sur ce mur. « Emballage » se mesure en 13 px gras,
   à 64 px environ.
18. **Les titres de colonne** sont en 12,5 px avec un espacement de −0,2 px (et 13 px à 1280). Dans l'app : 700, 12px/14px, sans
   espacement.
   Correction : la règle de l'app (`.l1e-w`), à 390 comme à 1280.
19. **Les mots de colonne sont abrégés même à 1280** (« Clarif. », « Lev. · enz. », « Conso. »), alors que la place existe. Correction :
   le mot long à 1280 (« Clarification », « Levure · enzymes », « Consommables »), le court seulement quand le mot long ne tient pas.
   C'est le mécanisme `data-long` / `data-court` de l'app.
20. **Le second mot de la ligne de liste** : « NEIPA 28.11 » est en brun 600 avec une tasse de 14 px. Dans le modèle, la 2e ligne est en
   400, 15 px, sourdine, et la couleur porte l'état. Correction : « manque NEIPA 28.11 » en 400, couleur brune comme « bas », icône
   de 12 px.
21. **La pastille de la liste** (« Sels », « Acides »…) est en Source Sans, sans repère de couleur. Dans le modèle, elle est en mono avec
   un point de couleur (EBC). Correction : un point de 8 px de la couleur de la famille (celle du pot), suivi du mot court, avec la classe
   `.pil` du modèle. La pastille relie la ligne à sa colonne du mur.
22. **À 1280, les noms et les quantités sont colorés en rouge ou brun** (« Bicarbonate de sodium », « 0 », « 80 g »). Dans le modèle, le
   nom et le stock sont à l'encre, et seul le mot « épuisé » est rouge, en 13 px, après le nom (« Pils bio épuisé »).
   Correction : nom et stock à l'encre, puis « épuisé » en rouge ou « bas » en brun, en 13 px, après le nom.
23. **La DDM s'écrit avec un sablier emoji** (« ⌛ DDM 12.26 »), un glyphe de couleur qui dépend du système. Correction : « DDM 12.26 »
   en texte brun (#b4621a), sans glyphe, à 390 comme à 1280.

## Espacements et hauteur des rangées
24. **Les hauteurs de rangée diffèrent à 390** : Additifs 52 px, Emballage 56 px, Nettoyage 61 px. Dans le modèle : 53, 55 et 56 px,
   régulières. Correction : retirer la ligne de mots (point 7), puis une hauteur minimale commune de 56 px, comme Levures dans le modèle.
25. **L'écart entre colonnes** est de 6 px à 390 et 8 px à 1280. Dans l'app, il vaut 8 px (`.rg gap`) à toute largeur. Correction : 8 px,
   et si la rangée la plus large ne tient pas, réduire la largeur des pots (point 12), pas l'écart.

## Rangée et ligne actives
26. **Rangée active** : A met un cadre bleu de 2 px autour de la rangée, avec une encoche de 9 px dans le coin bas gauche, qui ressemble à
   un défaut. Dans l'app (`murAjustements.css`) : un bandeau teinté (`color-mix` de 12 % de la couleur de la rangée), le nom souligné de
   3 px et un ruban de 7 px.
   Correction : la règle de l'app, sans cadre ni encoche.
27. **Ligne touchée** (`st3-a-390-ligne`) : A déplie la ligne sur place (manque, dernier achat, Commander 250 ml, Favori, Fiche ›). Dans
   le modèle comme dans l'app (`LigneStock`, `onOpen`), toucher la ligne ouvre la fiche de l'article.
   Correction : le même geste que dans Ingrédients, qui ouvre la fiche. « Manque pour NEIPA 28.11 · 40 ml » et « Commander » vont dans
   la fiche. Le bouton « Favori » fait double emploi avec l'étoile de la ligne : le retirer.

## Légende
28. **Le bouton de légende n'est ni au bon endroit ni de la bonne forme.** Dans A, c'est un « ? » rond de 22 px sur la 1re rangée
   (Additifs). Dans l'app, c'est la pastille « Légende » (CT4C-3 : 12 px/25, cible de 40 px) sur la dernière rangée, et dans d2a le
   « ? » est aussi sur la dernière rangée.
   Correction : la pastille « Légende » de l'app, sur Nettoyage (dernière rangée), au même endroit et sous la même forme que dans
   Ingrédients.
29. **La légende n'est ni dessinée ni capturée.** Correction : une note par rangée, comme les `sv-leg` de l'app, avec dans l'ordre :
   « tirets : le seuil de l'article » ; « cadre rouge : épuisé » ; « pointillé : à compter » ; « barré : DDM dépassée » ; une ligne par
   famille avec son pot (teinte et silhouette) et son mot long ; « au bout : rien en stock dans cette famille ». Il faut la capturer
   ouverte, en clair et en sombre.

## Filtres
30. **Les noms de filtres changent d'un onglet à l'autre** : « NEIPA 28.11 3 », avec une tasse et un bord brun de 1,5 px, alors que le
   modèle et l'onglet Ingrédients disent « manque 6 », en pastille grise et compte brun.
   Correction : « manque 3 », du même style que les autres pastilles. Le brassin (NEIPA 28.11) s'écrit dans la ligne de liste (point 20).
31. **Le « +1 » cache « à compter 1 » à 390.** Une fois « manque » raccourci, les cinq filtres tiennent sur une ligne de 390 :
   manque 3 · épuisés 8 · bas 8 · DDM 2 · à compter 1, puis l'étoile, environ 350 px en tout. C'est le cas du modèle.
   Correction : pas de « +n » à 390 tant que tout tient. Garder l'ordre par pertinence et les zéros cachés (sa note du 22.11), et le bord en
   pointillé de « à compter ».

## Cibles
32. **Les pots de 6 px ne se touchent pas un par un.** Correction : le geste de l'app (`fenetreGeste` : le pot le plus proche dans la
   colonne touchée, une bulle, puis la fiche). Le nom de la rangée reste le bouton de rangée, haut de 44 px au moins. Rien de nouveau à
   dessiner.

## Mise en page à 1280
33. **Les tables ne sont pas sous leurs murs.** Elles sont sur une grille de 4 colonnes `auto` : celle d'Emballage commence à x = 735 et
   son mur à 590, celle de Nettoyage commence à 1015 et son mur à 985. Dans le modèle, chaque table est sous son mur.
   Correction : la même grille pour les tables que pour les murs (1.7fr / 1.35fr / 1fr). La table Additifs se coupe en deux
   sous-colonnes, dans sa propre cellule.

## Ce qui manque au modèle
34. **La pastille « rien en stock » au bout de la rangée.** Dans le modèle, elle s'écrit « ○ Fumé » (12 px, #999, alignée à droite) ;
   A n'a rien. Correction : une famille du catalogue qui n'a aucun article en stock s'écrit « ○ <famille> » au bout de sa rangée, comme
   dans l'app (`.sx-o`).

## Écarts assumés (non comptés)
- Il n'y a pas d'échelle (« 0 · 1 · 5 kg ⫽ 200 ») dans l'en-tête de liste : les unités sont mêlées (g, ml, pièces). Le tiret nommé
  « seuil » (point 1) la remplace.
- Le tri « urgence » remplace « couleur » ou « α » : il n'existe pas de donnée unique qui décide pour les additifs.
- Le « + » flottant couvre l'étoile de la 6e ligne, comme dans le modèle (Pilsner).

## Pour le port
- Le pilote valide l'ordre des corrections : 1 à 5 (seuil), 6 à 8, 9 à 16, puis le reste.
- Captures à rejouer après le port, côte à côte avec `st1-d2a-repos-660` et l'onglet Ingrédients de l'app :
  - repos, rangée touchée, légende ouverte et ligne touchée (fiche) ;
  - en clair et en sombre ;
  - à 390 et à 1280.
- Le sombre n'a pas été capturé.

Phrase prédite du brasseur, une fois les corrections faites : « Là c'est propre, c'est la même étagère que les ingrédients, et je vois le
seuil. »
