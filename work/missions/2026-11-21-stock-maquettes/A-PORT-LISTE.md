# Autres stocks A : liste unique du port (22.11, D423, D424)

Fusion sans doublons de CRITIQUE-A-POLISH (P), CRITIQUE-A-ux (U), CRITIQUE-A-brasseur (B) et CRITIQUE-A-neuf (N).
Chaque ligne cite ses sources ; la correction est donnée en valeur. Ordre : celui que le pilote a validé (seuil, totaux,
pots, puis le reste), regroupé en blocs ; un contrôle par bloc (`stock-etapes/autres-a.mjs`, ids AA-1 à AA-8).

Règles d'arbitrage, appliquées partout :
- La maquette A choisie reste la base (règle n° 1) : un mur de trois rangées (Additifs, Emballage, Nettoyage), une colonne
  par famille, un pot par article, une liste triée « urgence » dessous, une ligne qui s'ouvre sur place.
- Quand d2a et l'app diffèrent, l'app fait foi (P) : le mur d'Autres stocks emploie les mêmes composants et classes que
  l'étagère des ingrédients (`MurStock`, `mur.css`, `murAjustements.css` : `.l1e-r`, `.l1e-w`, `.l1e-b`, `.l1e-t`, `.sw-rl`,
  `.sv-leg`). Ce que la voie d2a change dans ces classes s'applique donc aux deux onglets sans autre geste.
- D424 (pilote, après les critiques) tranche B3, B4, B2 et P27 : la pastille de ligne porte l'information utile ; le seuil est
  écrit sur chaque ligne et se règle dans la ligne ouverte, sans `type="number"`.
- Contradictions tranchées ici : P3 (tiret par pot quand la colonne est mixte) plutôt que U3 (tiret continu), car un tiret
  sur un pot sans seuil se lit faux (L14) ; P6 (somme si une seule unité, sinon compte, jamais coloré) plutôt que U6 (compte
  rouge), car c'est la grammaire du modèle (39,2 kg ; Levures 7) ; P2 (tiret à 14 px sur 22, comme le modèle) plutôt que U21
  (mi-hauteur) ; U1 version principale pour 1280 (consigne : la plus fidèle à d3a, D420), repli refusé.

## Bloc 1 : le seuil (AA-1)
1. Tiret nommé (P1, N2). Écrire « seuil » une fois par rangée, à gauche du tiret de la 1re colonne qui en a un : `.sw-rl`
   (700 12px/14px, `--l1-t0`, `pointer-events:none`), à 390 comme à 1280.
2. Hauteur du tiret (P2). À 14 px du pied sur 22 (31 px sur 50 à 1280), comme `.bars::before{bottom:14px}` du modèle. Hauteur
   d'un pot avec seuil : `min(hm, 14 × q / seuil)` ; un pot pile au seuil touche le tiret.
3. Portée du tiret (P3, U3 écarté). Colonne dont tous les pots ont un seuil : un trait continu sur la colonne. Colonne mixte :
   un tiret par pot qui a un seuil, largeur du pot + 3 px de chaque côté. Colonne sans aucun seuil : pas de tiret.
   Trait : `1.5px dashed var(--l1-t1)` (jeton, U15).
4. Pots sans seuil pleins (P4). `opacity:1` ; leur hauteur se lit contre le plus gros article de la colonne, même unité
   (`0.9 × q / max`, au moins 12 %), règle dite dans la légende (bloc 5).
5. Jauge de liste 390 (P5, U22). Tiret dans le cadre seulement : `left:0; right:0`, à 64 % de la hauteur (14/22),
   `1.5px dashed var(--l1-t1)`, `overflow:hidden` ; aucun tiret sur une jauge épuisée.
6. Seuil sur chaque ligne (B1, D424). 2e ligne : « épuisé · seuil 250 ml », « bas · seuil 100 g », « assez · seuil 10 kg » ou
   « sans seuil » ; zéro avec son unité.
7. Régler le seuil (B2, D424). Dans la ligne ouverte : « seuil » + valeur + unité, champ texte `inputMode="decimal"`,
   boutons − / + (pas de 10 % arrondi), enregistrement de `minStock` au relâchement ; jamais `type="number"`.
8. Échelle écrite (U22, B7, N12). À droite du titre de liste et dans l'en-tête de table 1280, mono 13px, `var(--mut)` :
   « 0 · seuil · 1,6× » (22/14). Sans seuil : « contre le plus gros » dans la légende.
9. 1280, colonne seuil (P4 bis, U21, B7). Colonnes « Article · seuil · stock · jauge » ; seuil en mono 14 px aligné à
   droite, « — » s'il n'y en a pas ; jauge de largeur fixe 84 px, tiret à 64 % ; plus de texte gris derrière la jauge.

## Bloc 2 : pieds de colonnes (AA-2)
10. Total façon `.l1e-t` (P6, P8, U6, B5, N7). Somme quand la colonne n'a qu'une unité (Sels 1,7 kg ; Bouteilles 248 ;
    Capsules 1 310 ; Nett. Acides 2,3 L) ; sinon le nombre d'articles en stock (Clarif. 6). Colonne toute à zéro : « 0 » ou
    « 0 g ». Couleur `--l1-t1`, jamais colorée, jamais un nom d'article. 1280 : `.l1e-t` ×1,5 (zoom ST-T5).
11. Nettoyage (P7, U11, N15). Retirer la ligne de mots « Détartrant 0 · Peracét. … » ; totaux comme ailleurs.

## Bloc 3 : pots, couleurs, formes (AA-3)
12. Aplats (P9, U13, B6). Retirer toutes les textures (`fx-grain`, `fx-sachet`, `fx-hach`, `fx-disque`, `fx-etiq`,
    `fx-carton`, `fx-goutte`), au mur et dans la liste ; haut arrondi comme `.l1e-b` de l'app.
13. Silhouettes (P10, B6, sa demande « couleur et forme »). Quatre seulement : bouteille (Bouteilles), canette (Canettes),
    flacon (Acides des additifs, Acides du nettoyage), bidon (Alcalins). Les autres colonnes : aplat droit.
14. Couleurs par famille (P11, U15, sa demande). Une gamme par rangée, clarté L 36 à 70 :
    Additifs `#46617c #567899 #6f8fae #86a1bb #9db3c8` (Sels, Acides, Clarif., Enzymes, Épices) ;
    Emballage `#855632 #a66c3f #be8355 #ca9872 #d5ae90` (Bouteilles, Canettes, Capsules, Étiquettes, Cartons) ;
    Nettoyage `#407765 #59a68c #88bfac` (Acides, Alcalins, Consommables). Couleur de rangée (`--l1-k`) : la plus foncée.
15. Largeur unique (P12, P25). Même largeur pour tout le mur, donnée par la mise en page (`murMiseEnPage`) pour faire tenir la
    rangée la plus large ; écart 8 px (`.rg`) gardé, on réduit le pot, pas l'écart ; 6 px à 390 pour 30 pots ; ×1,5 à 1280.
16. Épuisé (P13, N10). Cadre 10 × 8 px, bord `1.5px` rouge, fond `--l1-page`, quelle que soit la largeur du pot ; la même
    marque pour tous les épuisés.
17. DDM (P14, U14, N6). Point orange retiré du mur ; DDM dépassée = pot barré (`.l1e-dx`).
18. À compter (P15). Marque de l'app (contour pointillé `.sv-ac`), à la hauteur de la dernière quantité connue.
19. Jauge de liste (P16). Bord `1.5px` de la couleur de la rangée ; rouge si épuisé.

## Bloc 4 : typographie et rythme du mur (AA-4)
20. Nom de rangée (P17, U5). Règle de l'app (700 13px/15px, sans espacement négatif), colonne du nom 72 px sur ce mur.
21. Titres de colonne (P18, U7). `.l1e-w` (700 12px/14px), sans espacement ; mot long quand il tient, court sinon
    (`data-long` / `data-court`, P19) : « Clarification » / « Clarif. », « Levure · enzymes » / « Enzymes »,
    « Consommables » / « Conso. » ; à 1280 toujours le long.
22. Hauteur des rangées (P24, U11). Hauteur minimale commune 56 px ; mur ≈ 164 px à 390.
23. Rien en stock (P34). Une famille du catalogue sans article s'écrit « ○ <famille> » au bout de sa rangée (`.sx-o`, 12 px,
    `--l1-t2`).

## Bloc 5 : rangée active, geste, légende (AA-5)
24. Rangée active (P26, U2). La règle d'Ingrédients (`murAjustements.css`, `.stock-mur .l1e-r:has(.l1e-n[aria-pressed=true])`),
    sans cadre ni encoche propres à A ; la pointe sous le nom (left 26 px, 14 × 14) si la voie d2a la garde.
25. Toucher un pot (P32). Le geste de l'app (`fenetreGeste` : pot le plus proche de la colonne, bulle, puis ligne ouverte) ;
    le nom de rangée reste le bouton de filtre, cible ≥ 44 px.
26. Bouton de légende (P28, U24). La pastille « Légende » de l'app (cible 40 px), sur Nettoyage, dernière rangée, comme dans
    Ingrédients.
27. Contenu de la légende (P29, N5, N6, U22). Une note `sv-leg` par rangée : « tirets : le seuil de l'article » ;
    « sans seuil : contre le plus gros de la famille » ; « cadre rouge : épuisé » ; « pointillé : à compter » ;
    « barré : DDM dépassée » ; une ligne par famille, son pot (teinte, silhouette) et son mot long ; « ○ : rien en stock ».

## Bloc 6 : liste 390 (AA-6)
28. Titre (U8). « Additifs 30 » : compte en Source Sans 700, `var(--ink)` ; échelle à droite (n° 8).
29. Pastille utile (D424, B3, B4, P21, U16). Point de 8 px de la couleur de la famille, puis, en mono : « manque 40 ml pour
    NEIPA 28.11 » si un brassin prévu en demande, sinon « ≈ N brassins » si la dose est connue, sinon « DDM 12.26 » si
    proche, sinon pas de pastille.
30. 2e ligne (P20, P23, U9, B9). Mot d'état seul en couleur (« épuisé » `var(--rouge)`, « bas » `var(--brun)`, « à compter »
    souligné en pointillé), puis « · seuil … » en `var(--mut)` ; « · DDM 12.26 » en texte brun, sans sablier, quand la
    pastille ne la porte pas déjà.
31. Ligne ouverte (P27 tranché par D424, U4, U15, U23, B8, N3). S'ouvre sur place ; l'étoile reste à sa place et garde son
    sens ; ouvert = liseré `inset 3px 0 0 var(--l1-k)`, fond surface surélevée (jeton, sombre compris) ; contenu aligné sur
    le nom (32 px) : besoin (« manque 40 ml pour NEIPA 28.11 »), réglage du seuil (n° 7), « dernier achat 18.09 · 250 ml ·
    9,80 CHF · Brouwland », puis « Commander 250 ml » et « Fiche › » (hauteur ≥ 34 px) ; « Favori » retiré.
32. Fin de liste (U25, N14). `padding-bottom:72px` : le `+` flottant ne couvre plus ni étoile ni quantité.

## Bloc 7 : filtres (AA-7)
33. Noms (P30, U18, N8, N11). « manque 3 » comme dans Ingrédients (pastille grise, compte brun), sans tasse ni liseré brun ;
    le brassin s'écrit dans la pastille de ligne (n° 29).
34. Pas de « +n » tant que tout tient (P31, U19, B9, N8). À 390 : manque · épuisés · bas · DDM · à compter puis ★ sur une
    ligne (≈ 350 px) ; ordre de pertinence, zéros cachés ; bord pointillé pour « à compter » seulement.

## Bloc 8 : 1280 (AA-8)
35. Une grille pour murs et tables (U1, P33 ; version fidèle à d3a). `grid-template-columns:5fr 4fr 3fr; column-gap:12px` ;
    une table sous chaque mur ; Additifs en une colonne de 30 rangées ; ≈ 300 px de défilement de plus, accepté.
36. En-têtes (U28). « Additifs 30 | seuil | stock | 0 · seuil · 1,6× ».
37. Rangées (U12, à la valeur d3a). `td{padding:3px 6px}`, nom 15 px, stock 16 px, barre 14 px ; intertitre de famille 22 px,
    `padding-top:4px`.
38. État (P22, U10, U20). Nom et stock à l'encre, puis `<small>` 13 px : « épuisé » rouge, « bas » brun, « à compter »
    souligné en pointillé ; DDM en texte brun (n° 30).
39. Unités (U29). « 0 g », « 0 ml », « 0 » pour les pièces, mono, aligné à droite.
40. Barres (U17). Remplissage `var(--l1-k)` de la rangée, piste à 15 % ; les teintes de famille restent au mur.
41. Tri (U27). Dans chaque famille : épuisé, bas, à compter, puis alphabétique.
42. Toucher une rangée de table : la même ligne ouverte (n° 31), avec le fournisseur (B8).

## Vérifications sans correction propre
- 390×660 (B10) : capture du premier écran ; le mur doit tenir en ≈ 164 px et laisser au moins 5 lignes.
- Thème sombre (P, U) : jamais capturé ; chaque bloc se capture en clair et en sombre.
- Écarts assumés, non comptés (P) : pas d'échelle d'unités dans l'en-tête de liste (remplacée par n° 8) ; tri « urgence » au
  lieu de « couleur » ; liste plate à 390 (N13, la pastille de couleur relie la ligne à sa colonne).
- Écartés : U26 (mur mince au défilement : absent de l'app, rien de neuf), U19 « DDM en sablier » (contraire à n° 30),
  B8 « regroupement par fournisseur » (pas dans A ni dans Ingrédients : le fournisseur est dans la ligne ouverte).
