# Chasse UX/UI — Stocks › Matériel › Carnets (préfixe CRU, 21.11)

Version jugée : tag `en-ligne/2026-11-21-tour8` (fc0e96f56), build `vite.parcours.config.mjs` dans os.tmpdir(), fixture
`scripts/parcours/fixtures/carnet.mjs` (ZZ TEST) + un carnet « ZZ TEST — Chambre froide » ajouté dans le dossier temporaire : 2 articles sans
prix, 10 caractéristiques en texte (copie de la forme de ses captures 02 à 04). IA simulée (`?dev-local`), jamais Gemini.
Joué : 390×844 tactile (CDP) et 1280×800 souris, clair et cave ; liste, Chambre froide, Comparer (repos et défilé à droite), Ventilation
(6 articles, prix), Évier (idée sans article), Articles › Étagère. Captures : `%TEMP%/cru-carnet/` (regardées : 390 clair liste, chambre,
comparer, comparer à droite, Ventilation comparer, Évier, étagère ; 390 cave comparer ; 1280 clair comparer). Mesures : `mesures.txt` du même dossier.
Regard : skill boosters-ux (B1 à B13), DESIGN.md (Typography, Layout, Dimensions compactes, Cibles).
Connu, non recopié : CRN-PRIX (prix absent, lignes « rien encore/aucune », « &apos; »), CRN-1 à CRN-21. Les lignes ci-dessous en sont
le versant forme et donnent la forme standard.

## Bilan

13 défauts : 3 bloquants, 7 gênants, 3 mineurs.

| id | grav. | où, geste | constaté (mesure) | attendu, forme standard |
|---|---|---|---|---|
| CRU-1 | bloquant | 390, Chambre froide › Comparer | Tableau de 1091 px dans 342 px. Chaque colonne d'article fait 435 px (valeur texte sans retour à la ligne), la colonne des noms 221 px. Valeurs alignées à droite au bout de leur colonne de 435 px : au repos, 8 rangées sur 10 paraissent **vides** (seule « Panneaux sand… » dépasse). Le 2e article est hors écran. C'est sa capture 04 (« colonne vide ») reproduite. Pareil à 1280 : 1091 px dans 736, le 2e article coupé. | 2 à 3 articles : **cartes côte à côte**, chaque article dans une colonne égale (≈ 165 px à 390), texte qui passe à la ligne. Au-delà de 3 : **lignes avec attribut épinglé**, le nom de l'attribut sur sa propre ligne en pleine largeur et les valeurs en dessous, colonnes égales plafonnées à 160 px, défilement horizontal au pas d'une colonne (scroll-snap). Contrôle : aucune cellule non vide hors de l'écran au repos à 390 ; largeur de colonne ≤ 45 % de la vue. |
| CRU-2 | bloquant | 390 et 1280, Comparer | Le prix n'a aucune rangée quand aucun article n'a de prix : `colonnesVue` ne l'ajoute que si un prix existe (Comparer.tsx). L'attribut qui décide un achat disparaît sans rien dire. Versant forme de CRN-PRIX. | Rangée **prix toujours présente, épinglée en tête** (attribut épinglé), valeur inconnue dite « prix ? » avec son geste (« relire la page »), jamais une rangée absente ni un zéro (B8). |
| CRU-3 | bloquant | 390, création d'un carnet (sa ligne CRN-CREATION-VUE, captures 05 à 07) | Après la création, la fiche ne s'ouvre pas seule. Ouverte à la main, elle a une première mise en page : zone d'en-tête teintée, carte beige « Idée · 21 nov. / Ensuite : l'IA cherche les façons » (≈ 70 px CSS), bandeau pointillé « L'IA range… » (≈ 45 px), rangée Photos. Après le rangement, elle change : en-tête blanc, pastille « Idée · 21 nov. », titre « Test eauds » remplacé par « Eau » avec « votre phrase en titre », Photos retiré, Quand et ses 5 puces ajoutés, compteur 17 puis 16. Tout bouge sous le doigt. | **Interface optimiste et mise en page stable** : créer = naviguer aussitôt vers la fiche (même composant que la fiche finie), sections réservées à leur hauteur finale, et l'attente de l'IA en **squelette dans la section qu'elle remplira** (2 lignes grises sous Façons), pas dans un bandeau qui part. Le titre proposé arrive en **suggestion** sous le titre (« Renommer en « Eau » ? Oui · Garder »), jamais appliqué sans geste ; compteur incrémenté une fois. Contrôle : CLS de la fiche < 0,05 entre création et fin du rangement ; titre inchangé sans toucher. |
| CRU-4 | gênant | 390, Chambre froide, rangée Articles | Le tableau intégré déborde dans sa carte : en-tête « Dimensio… », valeurs « 1800 x » coupées, aucune ombre ni indice de suite, aucun prix. Ses captures 02-03 le montrent pareil. | **Liste à attribut épinglé** : une rangée par article, nom sur 2 lignes à gauche, à droite le prix en mono (`tnum`) puis la valeur du 1er critère ; le reste à Comparer. Rien de coupé à 390. |
| CRU-5 | gênant | 390, Comparer (les deux carnets) | Le premier plan dépense sa hauteur avant la 1re valeur : fil « ‹ ZZ TEST — Chambre froide » **et** titre identique dessous (redite, aussi à 1280), pastille « À comparer » qui redit l'onglet, pastille « Côte à côte 2 », puis en-tête de colonne de ≈ 150 px (picto 44 px, rang, nom tronqué sur 3 lignes « m… »). 1re valeur à y ≈ 436 sur 844. | **En-tête compact sur une rangée** (DESIGN « Le budget vertical ») : « ‹ Carnet » + titre seul ; en-tête de colonne collant de 2 lignes (rang + nom tronqué à 2 lignes, nom entier à l'appui), sans picto. 1re valeur sous y 300. |
| CRU-6 | gênant | 390 et 1280, Comparer | Valeurs **texte** en IBM Plex Mono et alignées à droite (« Panneaux sandwich, groupe frigorifique monobloc », « blanc »). DESIGN.md : un mot en mono qui n'est pas une mesure est une faute. | Mono `tnum` et droite pour nombre + unité seulement ; texte en Source Sans, aligné à gauche, retour à la ligne. Une valeur mixte (« 1800 x 1500 x 2200 mm ») se dit en mesure, en lignes L / P / H. |
| CRU-7 | gênant | 390, fiche d'un carnet | Premier écran : 100 mots (Chambre froide), 177 (Ventilation), 73 (Évier) ; Comparer 145 et 167 ; liste 77. Plafond DESIGN : 60. Les sections vides prennent chacune une rangée de ≈ 38 px (« Ce qui compte · rien encore… », « Façons · aucune… », « Notes · aucune », « Quand · pas encore daté ») : ≈ 150 px pour dire « rien ». | **Divulgation progressive** : une section vide ne prend pas de rangée ; une seule ligne « À compléter : critères, façons, date › » ouvre la suite. État vide = le cadre et l'action là où la donnée viendra (B8), pas une phrase par section. |
| CRU-8 | gênant | 390, fiche, rangée Quand | 5 puces (Aujourd'hui, 1 mois, 3 mois, 6 mois, 1 an) sur 2 lignes : « 1 an » seule sur la 2e (≈ 50 px de plus), dans chaque carnet, même une idée sans article. | **Contrôle segmenté sur une rangée** (4 segments, « 1 an » compris en raccourcissant « Aujourd'hui » en « Auj. »), ou une seule rangée « Quand · pas daté › » qui ouvre une feuille de dates. |
| CRU-9 | gênant | 390, liste des carnets | Chaque carte Idée porte son bouton « Coller un lien » (≈ 44 px de haut) sous le titre : carte ≈ 125 px, 2,5 cartes visibles. 16 idées = 16 fois le même bouton. Chambre froide n'a ni prix ni « dès » alors que Ventilation dit « dès 420 CHF » : la colonne de droite saute d'une carte à l'autre. | **Rangées de liste d'une ligne** (48 px : picto, titre, à droite le prix « dès » ou « prix ? ») ; l'action répétée une seule fois dans l'en-tête du groupe, ou en action de glissement. |
| CRU-10 | gênant | 390, toutes les vues du Carnet | Barres fixes : zone du champ 70 px (679-749) + navigation 40 px + bouton + de 56 px qui flotte à côté du champ, soit 165 px de bas fixe, plus en-tête et deux rangées d'onglets ≈ 125 px. Il reste ≈ 409 px de données à Comparer (48 % de l'écran). Deux entrées pour ajouter (champ et +) côte à côte. | **Un seul point d'ajout** par écran ; sur Comparer (lecture), le champ se replie en icône ou disparaît. Onglets de 2e niveau collants en 28 px (DESIGN : 28–32). |
| CRU-11 | mineur | 390 et 1280, liste et fiche | Tailles de texte au premier écran : liste 14/15/16/17 (4), fiche 13/14/15/16/21 (5), Comparer 13/14/15/16/22 (5). DESIGN : 3 au plus. L'étagère voisine tient en 12/13/14 (+16 titre vide) : le Carnet paraît en plus gros corps que son voisin d'onglet. | Échelle de DESIGN : titre 18, corps et données 14, libellés 12. Même densité que l'étagère (rangées 28–32 px). |
| CRU-12 | mineur | 390 et 1280, Ventilation | « 1 critère sans valeur à comparer » : cible de 221 × 20 px (390) et 235 × 21 (1280), sous 24 px (WCAG 2.5.8). Toutes les autres cibles mesurées ≥ 24. | Rangée entière comme cible, 24 px au moins. |
| CRU-13 | mineur | 390, Comparer défilé | L'ombre de bord droite reste après le défilement complet (capture 03b) et la rangée d'en-tête de colonne, défilée, devient un bloc blanc de ≈ 150 px sans nom (les noms sont partis à gauche). | Ombre seulement s'il reste une suite ; noms d'article collants (CRU-5). |

## Non vu, non jugé

- Chargement et erreur de l'IA : banc en IA simulée, ni lenteur ni échec rejoués. L'attente vue est celle de ses captures 05-06 (bandeau
  « L'IA range… », jugé en CRU-3). Hors ligne : non joué.
- Cohérence avec la fiche v02 du Calendrier : non capturée (plafond de contexte de l'agent). L'étagère est vue, mais la fixture n'a aucun
  article en stock : comparaison de densité seulement (CRU-11).
- Le rendu « &apos; » est reproduit (mesure `entite=true` sur Comparer, deux thèmes, deux tailles) : déjà CRN-PRIX.

## Boosters UX (boosters-ux)

- B1 : ECHEC à Comparer. Le booster « meilleure valeur surlignée » marche sur Ventilation (valeurs numériques), mais il est muet sur
  Chambre froide (texte seul) : rien à lire d'un coup d'œil.
- B2 : ECHEC. Sur la fiche, la masse dominante est l'en-tête et la liste des sections vides, pas les articles.
- B3 : ECHEC. 100 à 177 mots (CRU-7).
- B6 : ECHEC. CRU-6 et CRU-11.
- B8 : ECHEC. CRU-2 (prix absent sans rangée) et CRU-7 (vide verbeux).
- B13 : 1 cible sous 24 px (CRU-12).
