# Critique UX/UI — Autres stocks, version A, contre son modèle (22.11)

Juge : Opus, regard d'expert UX/UI (boosters-ux, ui-design-system, DESIGN.md).
Objet : la version A, choisie (D423), à polir sur son modèle, l'étagère des ingrédients.
Ses mots : « de loin pas fini polish … il y a un modèle » ; « La version malt houblons et levure est un peu plus clean … il manque
quelques trucs genre le seuil ».

Captures ouvertes une fois chacune, côte à côte :
- A : `st3-captures/st3-a-390.jpg`, `st3-a-390-ligne.jpg`, `st3-a-1280.jpg` ;
- modèle : `st1-captures/st1-d2a-repos-660.jpg`, `st1-d2a-houblons-660.jpg`, `st1-d3b-1280.jpg`, `st1-d3b-legende.jpg`,
  `st1-d3a-1280.jpg`.

Les valeurs CSS viennent des pages (`st3-a-*.html`, `st1-d2a-repos-660.html`, `st1-d3a-1280.html`). Les mesures en px CSS
sont les pixels de capture divisés par 2 à 390, et par 1 à 1280.

## À garder (le seuil, qui manque au modèle)
- Le seuil se voit en trois endroits : le tiret du mur, le tiret de la jauge de liste et le texte « bas · seuil 100 g ». C'est
  le « quelques trucs genre le seuil » qui manque au modèle. Le polissage le rend net, il ne le retire pas. Le tiret de la
  légende du modèle (`seuil` : barre et tiret qui dépasse) est le même signe.
- Le gabarit est identique à celui d'Ingrédients : mur, bascule, liste, rangées de 51 px, jauge 12 × 30, étoile 36 × 44 et `+`.

## Écarts

### Grille et alignements
1. **1280 : les tables ne tombent pas sous leurs murs.**
   - Dans A, les murs vont de 96 à 578, de 590 à 971 et de 983 à 1265. Les tables vont de 97 à 412, de 422 à 725, de 734 à 1000
     et de 1013 à 1265 : aucun bord commun, sauf le premier et le dernier.
   - Dans d3a, chaque table est sous son mur (96–502, 512–875, 886–1265).
   - Correction : une seule grille pour les murs et les tables, `grid-template-columns: 5fr 4fr 3fr; column-gap: 12px`
     (environ 476, 381 et 286 px), une table par mur, comme d3a. Additifs tient en une colonne de 30 rangées.
   - Coût : la page défile d'environ 300 px à 1280 × 800.
   - Repli si on refuse ce défilement : `columns: 2; column-gap: 12px` dans la piste Additifs, et la colonne seuil du point 21
     remplacée par le tiret seul.
2. **Mur 390 : la pointe du rayon actif est au coin.**
   - A : `.a3-r.actif::after{left:-4px; 9 × 9; bottom:-6px}`, donc la pointe est sur le liseré, à gauche du mot « Emballage ».
   - Modèle : `left:26px`, 14 × 14, `bottom:-8px`, la pointe sous le nom du rayon.
   - Correction : reprendre les valeurs du modèle. Le nom « Emballage » descend de 2 px (`.rl padding-top: 4px` sur le
     rayon qui suit l'actif) pour que la pointe ne le touche pas.
3. **Mur : le tiret de seuil est coupé par famille.**
   - A : `.a3-r .bars::before{left:-3px; right:-3px}` dessine un segment par famille, avec des trous entre Sels, Acides,
     Clarif., etc.
   - Modèle : un seul tiret continu sur tout le rayon (Malts de Base à Spéciaux, Houblons de Hazy à Pale).
   - Correction : poser le tiret sur `.rg` (le conteneur du rayon), `left: 0; right: 0; bottom: 50%`, et le retirer de `.bars`.
4. **Ligne ouverte 390 : le panneau ne s'aligne pas sur la colonne du nom.**
   - Le nom commence à 32 px. Le panneau `.a3-o` a `padding-left: 34px`, donc « dernier achat » est à 34 px et l'icône de
     « manque pour » à 35 px.
   - Correction : `.a3-o{padding: 2px 10px 8px 32px}`, et l'icône du besoin en retrait négatif (`margin-left: -18px`) pour que
     le texte reste à 32 px.

### Échelle typographique
5. **Nom de rayon du mur.**
   - A : `13.5px`, `letter-spacing: -.35px`, serré pour faire tenir « Emballage ».
   - Modèle : `.rl b` à `14px`, sans espacement.
   - Correction : `14px`, `letter-spacing: -.2px` sur les deux onglets (une seule règle `.rl b`). Vérifier que « Emballage »
     tient dans 68 px ; sinon `.rl{width: 72px}` sur les deux onglets.
6. **Sous chaque famille, trois grammaires pour la même case.**
   - Additifs : nom rouge de l'article le plus urgent (« Bicarb. », « Lactique »), en sans à 600.
   - Emballage : un mélange de noms rouges (« 50 cl », « IPA ») et de nombres gris (« 2 », « 3 »).
   - Nettoyage : une phrase qui court sous tout le rayon (« Détartrant 0 · Peracét. 1,5 L · PBW 0,4 kg »).
   - Modèle : une seule grammaire, le total de la famille en chasse fixe, `.tot` à `14px/17px` (39,2 kg, 720 g ; pour les
     Levures, le compte : 7, 2, 0).
   - Correction : sous chaque famille, toujours le **compte d'articles**, en chasse fixe `14px/17px`, en `var(--rouge)` si la
     famille a un épuisé, sinon en `var(--ink)`. Le compte remplace le total, puisque les unités se mélangent (g, ml, pièces).
     Le nom de l'urgent reste en tête de liste (tri « urgence »).
7. **Abréviations.**
   - A : « Lev. · enz. », « Clarif. », « Conso. », « Bicarb. », « Peracét. ».
   - Modèle : une seule (« W. Coast »).
   - Correction : avec le point 6, les noms d'article quittent le mur. Garder au plus une abréviation par rayon (« Lev. · enz. »
     devient « Enzymes » ; « Clarif. » et « Conso. » restent, faute de place) avec `font-size: 12.5px`, sans `letter-spacing`
     négatif (A : `-.2px`).
8. **Compte du titre de liste.**
   - A : « Additifs 30 », avec le compte en chasse fixe et en graisse normale.
   - Modèle : « Malts 17 », en sans, tout en gras.
   - Correction : `font-family: "Source Sans 3"; font-weight: 700; color: var(--ink)` pour le compte, comme le nom.
9. **Deuxième ligne de la liste.**
   - A : le besoin « NEIPA 28.11 » est en `600` brun `#5a3d12`. La ligne entière « bas · seuil 100 g » est en `var(--brun)`.
   - Modèle : `small` à 14px, en `var(--mut)` ; seul le mot d'état est coloré (« épuisé » rouge).
   - Correction : le mot d'état seul en couleur (« bas » en `var(--brun)`, « épuisé » en `var(--rouge)`), puis
     « · seuil 100 g » en `var(--mut)`. Le besoin passe en `font-weight: 500; color: var(--brun)`. Le séparateur
     `.a3-m>i{color:#aaa}` passe en `var(--mut)`.
10. **1280 : l'état est donné par la couleur du nom.**
    - A : le nom entier est en rouge si l'article est épuisé (Bicarbonate de sodium, Gélatine), en brun s'il est bas (Chaux
      éteinte, Mousse irlandaise), et le « 0 » est rouge.
    - d3a : le nom en `var(--ink)`, puis le mot d'état (« Pils bio épuisé »), et la quantité en encre (« 0 kg »).
    - Correction : le nom en `var(--ink)`, suivi de `<small>` à `13px` avec « épuisé » en `var(--rouge)`, « bas » en
      `var(--brun)` ou « à compter » souligné en pointillé. La quantité est en `var(--ink)` et porte son unité (« 0 g »,
      « 0 ml »).

### Rythme vertical
11. **Mur 390 : le rayon Nettoyage est plus haut que les autres.**
    - Additifs mesure 52,5 px et Emballage 56,5 px ; Nettoyage mesure 61 px, à cause de sa ligne d'urgents.
    - Modèle : 52,5, 56 et 55,5 px.
    - Correction : appliquer le point 6, ce qui ramène Nettoyage à environ 56 px et le mur de 170 à 164 px, comme le modèle.
12. **1280 : rangées et barres plus petites que dans d3a.**
    - A : rangées de 24 px (`td{padding: 2px 5px; height: 24px}`), noms et quantités à `14px`, barre de `12px`.
    - d3a : rangées de 27 px (`padding: 3px 6px`), noms à `15px`, quantités à `16px`, barre de `14px`.
    - Correction : `td{padding: 3px 6px; height: 26px}`, noms `14px`, quantités `15px`, barre `14px`. Les intertitres de
      famille (`tr.fa`) passent à `22px`, avec `padding-top: 4px`.

### Couleurs, formes, jetons
13. **Textures sur les pots et les jauges.**
    - A introduit six textures : `fx-grain`, `fx-hach`, `fx-goutte`, `fx-etiq`, `fx-carton`, `fx-disque`. Elles donnent des
      bouteilles à goulot, un biseau pour les cartons, des pots grillés pour les sels. Le biseau des cartons ressemble au signe
      « ⫽ échelle resserrée » de la légende.
    - Modèle : des pots plats, en rectangles pleins, avec une gamme de teinte par famille. Seuls les sachets de levure portent
      une lettre, et la légende les explique.
    - Correction : retirer les `fx-*` du mur et de la liste, `background-image: none`, garder un aplat plein par famille, et
      `border-radius: 1px` comme les barres du modèle.
14. **Pastille de DDM sur le mur.**
    - A : `.a3-dd`, un point orange `#d9822b` de 7 px avec un anneau `#fff`, sur Clarif. et Lev. · enz. C'est un signe neuf,
      absent de la légende du modèle (seuil, épuisé, à compter, sachets, échelle resserrée).
    - Correction : le retirer du mur, car la puce « DDM 2 » suffit. S'il est gardé, l'ajouter à la légende `?` et remplacer
      l'anneau `#fff` par `var(--mur)`.
15. **Couleurs en dur au lieu de jetons.**
    - La sélection est en `#3f74a3`, le tiret en `#7d7d75` et `#444`, la DDM en `#b4621a`, le besoin en `#5a3d12`, et la ligne
      ouverte a un fond `#fff`.
    - En thème cave, le fond blanc `#fff` de `.a3-sel` et de `.a3-o` reste blanc sous un texte clair.
    - Correction : liseré de sélection `var(--rc)`, fond de ligne ouverte `cave-850` (surface surélevée, DESIGN.md), tirets
      `cave-600` (bordure, jamais du texte), DDM et besoin `var(--brun)`.
16. **Puce de famille dans la liste.**
    - A : `.pil` « Sels », sans pastille.
    - Modèle : `.pil mono`, avec un point de couleur de 9 px (EBC) devant la valeur.
    - Correction : garder le nom de famille en sans, avec `<i>` de 9 px de la teinte de la famille sur le mur
      (`#8e9fb3` pour Sels, etc.). C'est le lien visuel entre la ligne et sa colonne du mur.
17. **1280 : chaque famille a sa couleur de barre.**
    - A : bleu-gris, moutarde, sarcelle, brun et rouille dans la même colonne, et une piste de fond différente par famille.
    - d3a : une teinte par table (malt `#c9a36a` sur `#e9dcc6`, houblon `#7f8a5e` sur `#e3e8d6`).
    - Correction : remplissage `var(--rc)` de la zone, piste `var(--rc)` à 15 % d'opacité. Les teintes par famille restent
      sur le mur seulement.
18. **Puce « +1 » en tirets.**
    - A 390 : la puce « +1 » a une bordure en tirets.
    - Modèle : les tirets veulent dire vide ou inactif (« DDM 0 ») et les pointillés « à compter ». Le même trait prend donc
      un troisième sens.
    - Correction : `.chip` plein, bordure `1.5px solid var(--line2)`. Le NEIPA a un liseré brun de 1,5 px : le passer à
      `var(--line2)` comme les autres, et garder la couleur sur le seul chiffre.

### États (épuisé, bas, à compter, seuil)
19. **« à compter » invisible à 390.**
    - A : l'état est rangé dans « +1 ».
    - Modèle 390 : une puce « à compter 1 » en pointillé, une jauge `.cpt` en pointillé et le mot souligné en pointillé
      (Cryo Citra).
    - Correction : ordre des puces selon la pertinence, mais « à compter » s'affiche dès que son compte est supérieur à 0.
      Pour gagner la place, « DDM » devient l'icône sablier et son compte (environ 44 px). La ligne Vanille reprend
      `.jauge.cpt` et `<small>à compter</small>` souligné en pointillé.
20. **1280 : « à compter » sur le nom.**
    - A : le nom « Vanille (gousses) » est souligné en pointillé, sans le mot.
    - d3a : « Cryo Citra 25g à compter », c'est le mot qui est souligné.
    - Correction : la même règle que le point 10.
21. **1280 : le texte du seuil écrase la jauge.**
    - A : `.tb .bar{flex: 1; min-width: 20px}`. Les rangées qui ont un seuil montrent une barre d'environ 28 px, puis
      « seuil 250 g » ; les autres ont une barre de 80 px. Les barres d'une même colonne ne se comparent plus.
    - Correction : une colonne `seuil` fixe, à la manière de la colonne EBC ou α de d3a : `width: 58px`, chasse fixe
      `12.5px`, `var(--mut)`, alignée à droite, vide si l'article n'a pas de seuil. Barre de `width: 84px` fixe, tiret toujours
      à 50 %.
22. **La règle de la jauge n'est dite nulle part.**
    - Le tiret est toujours à mi-hauteur, donc la jauge pleine vaut deux fois le seuil.
    - Modèle : l'échelle est écrite à droite du titre de liste (« 0 · 1 · 5 kg ⫽ 200 ») et dans l'en-tête de table
      (« 0 — 5 kg ⫽ 25 »). A laisse ce coin vide à 390 et écrit « jauge » à 1280.
    - Correction : à droite du titre de liste et dans l'en-tête, en chasse fixe `13px`, `var(--mut)` : « 0 · seuil · 2× ».
      Sans seuil, la jauge se règle sur le plus gros article de la famille. Ajouter la ligne à la légende `?`.

### Cibles
23. **L'étoile change de sens dans la ligne ouverte.**
    - A, ligne ouverte : à l'emplacement de l'étoile (36 × 44), il y a un chevron qui ferme la ligne, et « Favori » descend
      en bouton. Le même toucher, au même endroit, fait autre chose.
    - Correction : garder l'étoile à sa place. L'état ouvert se lit au liseré `inset 3px 0 0 var(--rc)`. Retirer le bouton
      « Favori », ce qui laisse « Commander 250 ml » et « Fiche › » (hauteur 34 px, conforme au plancher 32).
24. **« ? » du mur trop petit.**
    - A, comme le modèle : 20 × 20 px, sous le plancher de 24 px (WCAG 2.5.8).
    - Correction : zone de toucher de 32 × 32 px (`::before{inset: -6px}`), sans changer le dessin.
25. **Le `+` couvre une étoile.**
    - Le `+` flottant couvre l'étoile de la 6e rangée (Chaux éteinte) : 690–775 × 1465–1550 en capture. Défaut hérité du modèle
      (Pilsner).
    - Correction : `padding-bottom: 72px` en fin de liste, pour que la dernière étoile se dégage.

### Densité à 30 articles
26. **390 : la liste est longue sous le mur.**
    - Liste plate de 30 rangées de 51 px, soit 1 530 px ; environ 6,5 rangées visibles sous un mur de 170 px.
    - Le modèle a déjà la variante `.mur.mince` (rayons de 38 px, noms de famille cachés).
    - Correction : dès que la liste défile (`scrollTop > 0`), le mur passe en `.mur.mince` (3 × 38 = 114 px au lieu de 170 px),
      ce qui gagne environ une rangée. Un toucher sur une colonne du mur filtre la liste sur sa famille (7 rangées au plus),
      et « tout » rend les 30.
27. **Le tri change entre 390 et 1280.**
    - 390 : liste plate, triée par urgence. 1280 : groupée par famille, dans un ordre sans règle visible (Bicarbonate épuisé
      au 5e rang des Sels, Chaux bas au 7e).
    - Modèle : le même tri aux deux tailles (couleur).
    - Correction : à 1280, dans chaque famille, le tri de la puce ⇅ : épuisé, puis bas, puis à compter, puis le reste par
      ordre alphabétique.

### 1280
28. **En-têtes de table.**
    - A : « Additifs | stock | jauge », et la 2e colonne n'a pas de titre.
    - d3a : « Malts | EBC | stock | 0 — 5 kg ⫽ 25 ».
    - Correction : « Additifs 30 | seuil | stock | 0 · seuil · 2× ». Avec le point 1, la colonne sans titre disparaît.
29. **Pas d'unité sur zéro.**
    - A : « 0 ». d3a : « 0 kg ».
    - Correction : « 0 g », « 0 ml » ou « 0 » pour les pièces, en chasse fixe `15px`, aligné à droite (point 10).

## Non vérifiable sur ces captures
- Le thème cave : aucune capture A en sombre. Le point 15 annonce le fond blanc de `.a3-sel` et `.a3-o` d'après le CSS.
- La légende `?` d'A, la ligne ouverte à 1280, et un toucher sur une colonne du mur.

## Bilan
29 écarts : 4 de grille, 6 de typographie, 2 de rythme, 6 de couleur et de jeton, 4 d'état, 3 de cible, 2 de densité et 2
propres à 1280.

Les plus lourds :
- le point 1 (tables hors des murs à 1280) ;
- le point 6 (trois grammaires sous les familles) ;
- le point 13 (textures absentes du modèle) ;
- le point 21 (jauges de largeurs différentes) ;
- le point 23 (l'étoile qui change de sens).

Ce sont eux qui font « pas fini » face au modèle, plus « clean ». Le seuil reste, rendu net (points 9, 21 et 22).
