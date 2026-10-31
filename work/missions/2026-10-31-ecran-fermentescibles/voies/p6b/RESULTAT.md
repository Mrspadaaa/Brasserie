OK — p6-b1 et p6-b2 : MASSE OK, VOLEE OK, GESTES OK

Sa demande (D219) : « je pensais plutôt à un mini slider ou bouton+ /- facil ». Deux réponses, copiées de `v5/m1/b.html` (r4e-b, moment
en forme m1, non touché) et assemblées par split/join (`.patch.mjs` dans chaque dossier, L26) : b1 avec les boutons − / +, b2 avec le
slider sur la barre.

## Fichiers écrits
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/` : `etat.html`, `capturer.mjs`, `.patch.mjs`, `.cap.mjs` (+ `.cap-*.txt`),
  `p6b1.css`, `p6b1-fonctions.js`, `p6b1-tenir.js`, 14 captures `p6-b1-*.png`.
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/` : `etat.html`, `capturer.mjs`, `.patch.mjs`, `.cap.mjs` (+ `.cap-*.txt`),
  `p6b2.css`, `p6b2-barre.js`, `p6b2-geste.js`, `p6b2-clavier.js`, 14 captures `p6-b2-*.png`.
- `voies/p6b/COMPRIS.md`, `voies/p6b/RESULTAT.md`. Rien hors du « Possède » (`git status` relu).

## p6-b1 — − et + sur la masse
- Geste : un toucher sur + ou − change la masse d'un cran de la piste (50 g sous 1 kg, 100 g au-dessus). La valeur est posée sur la
  grille : 1,04 tapé, + donne 1,1. À 0 kg, − ne fait rien (`aria-disabled`). Un appui tenu fait défiler la masse (un cran toutes les
  100 ms après 450 ms) et s'arrête au relâcher. Le nom du bouton donne le vrai pas : « Ajouter 100 g de Pilsner Malz », « Ajouter 50 g
  de Dextrose ».
- Forme : − masse kg + dans un étui fin (trait #DDD, rayon 10). On y reconnaît le −/+ du plateau, et l'étui sépare le + du × voisin.
  La masse monte sur le rang du nom. Le moment, la part et la barre prennent toute la largeur dessous : la barre passe de 84 à 141 px.
  La hauteur de ligne ne change pas (50 px, 47 serrée ; 8 grains : 1,02 écran).
- Cibles : − et + font 28 × 24 px, sans chevauchement. La masse tapée garde un champ de 61 × 24 px.
- Sorties : G2 `MASSE OK` · G3 `MOMENT OK` · G4 `VOLEE OK (10)` · G5 `GESTES OK (8)` · G6 `PAGE OK (0 images chargées, 390 px, sans
  erreur)` · G7 `p6-b1 76 mots` `MOTS OK` · G8 `COMMUN OK` · G9 `CONTRASTE OK` (pire 4.85:1) · G10 `HAUTEUR OK (1,04 écran)` ·
  G11 `CAPTURES OK`. Valeurs relevées par le capturer : + tenu 1,2 s, 5,0 → 5,8 ; un toucher, 5,1 kg (grain 8,1 ; parts 63/19/19 ;
  plateau 5,1) ; Dextrose 0,45 ; Mangue 0,95.
- Captures ouvertes : `p6-b1-repos.png` (à côté de `v4/r4e-b/r4e-b-repos.png`), `p6-b1-plus-pendant.png`,
  `p6-b1-plus-apres.png`, `p6-b1-sucre-apres.png`, `p6-b1-fruit-apres.png`, `p6-b1-huit-repos.png`, `p6-b1-1280.png`.

## p6-b2 — la barre porte la masse (le « mini slider »)
- Geste : on tire la barre de la ligne au doigt et la masse suit au cran. Toutes les lignes ont leur barre : grains, sucres, fruits
  et lactose. Pour sucres et fruits, c'est la même barre, à points comme leur part dans la composition et leur piste au plateau. Il
  n'y a qu'une chose à tirer par ligne. Le slider s'appelle « Masse de Pilsner Malz », `aria-valuetext` « 5,0 kg ». Les flèches font
  ±1 cran, Maj ±10 crans. Le plancher est 0, Échap pendant le glisser rend la masse d'avant, et un toucher sans glisser ne change rien.
  La barre passe de 84 à 141 px, parce que la masse monte sur le rang du nom comme dans b1 : un geste plus fin.
- Ce que représente la longueur :
  - Grain : la part du grain (0 à 100 % de la largeur, comme dans la base). Le brasseur pense sa recette en % du grain. La barre
    garde le sens qu'elle avait, et `controle-volee` exige qu'un glisser à 30 % donne 30 %. Tirée, elle pose la part ; la masse
    suit au cran, puis le % suit la masse.
  - Sucre, fruit, lactose : ils n'ont pas de part du grain. La barre montre leur masse sur la plage de la piste du plateau (0–2 kg sous
    1 kg, puis la graduation ronde au-dessus d'une fois et demie la masse). Ligne et plateau disent donc la même chose. La plage
    reste fixe tant que la masse y tient : la barre ne saute pas au relâcher.
  - Un grain seul n'a pas de part à régler : sa barre suit aussi sa plage (relevé : 5,0 → 4,0 à mi-barre).
- Cibles : la barre fait 141 × 24 px (171 pour la mangue).
- Sorties : G12 `MASSE OK` · G13 `MOMENT OK` · G14 `VOLEE OK (10)` · G15 `GESTES OK (8)` · G16 `PAGE OK (0 images chargées, 390 px,
  sans erreur)` · G17 `p6-b2 76 mots` `MOTS OK` · G18 `COMMUN OK` · G19 `CONTRASTE OK` · G20 `HAUTEUR OK (1,04 écran)` ·
  G21 `CAPTURES OK`. Valeurs relevées par le capturer : Pilsner tiré à 70 %, 7,0 kg (grain 10,0 ; parts 70/15/15 ; plateau 7,0) ;
  Dextrose 0,40 → 1,0, barre à 50 % ; Mangue 1,0 → 0,50.
- Captures ouvertes : `p6-b2-repos.png`, `p6-b2-barre-pendant.png` (pouce de 22 px, barre de 14 px), `p6-b2-barre-apres.png`,
  `p6-b2-sucre-apres.png`, `p6-b2-fruit-apres.png`, `p6-b2-huit-repos.png`, `p6-b2-1280.png`.

## Écarts à la consigne, signalés
- b2, le rôle : VOIE.md propose `data-role="part-ligne masse-curseur"` sur le même élément. Or `controle-volee.mjs` lit
  `[data-role="part-ligne"]` en égalité exacte : la part y aurait disparu. La zone tirée garde donc `data-role="part-ligne"` tel
  quel, et le slider `masse-curseur` est l'élément intérieur qui la remplit. Les deux ont la même boîte : une seule barre, un seul
  doigt. Le slider dit la masse ; la part se lit sur la ligne (« 63 % du grain »). Aucun rôle n'a été retiré ni renommé.
- b1 et b2 : la masse passe du centre des deux rangs au rang du nom. C'est le seul déplacement de la base, fait pour ce geste (place
  des −/+ dans b1, longueur de la barre dans b2).

## En brasseur, entre − / + et la barre
Pour corriger une pesée (« +100 g de Pils »), b1 gagne : un toucher, un pas connu, rien à viser, et l'appui tenu pour aller loin. b2
est plus calme au repos : la barre existait déjà, il n'y a rien de plus à lire. Mais un glisser ne vise pas 100 g près : sur
Pilsner, un pixel vaut environ 0,1 à 0,2 kg. La barre sert à poser une part ; les −/+ servent à ajuster une masse. Mon pari pour sa
demande littérale (« en une action ») : b1. Les deux se combineraient (la barre pour la part, −/+ pour la masse) s'il les veut tous
les deux, au prix d'une ligne plus chargée.

Prédiction : « b1, c'est ça : je vois + et −, je touche, c'est fait » ; la barre de b2 lui paraîtra juste pour le %, imprécise
pour les grammes.

DÉCISION À PRENDRE : aucune dans mon contrat. Pour le pilote : la page de choix peut montrer b1 et b2 côte à côte, avec un toucher
de + et un glisser de barre sur Pilsner (`p6-b1-plus-apres.png` / `p6-b2-barre-apres.png`).

CONNAISSANCE : `controle-volee.mjs` et `controle-gestes-ligne.mjs` lisent les rôles en égalité exacte (`[data-role="part-ligne"]`).
Ajouter un nom à côté (`data-role="part-ligne masse-curseur"`) les casse ; un second rôle passe par un élément intérieur.

LEÇON PROPOSÉE : avant d'écrire dans un brief « ajouter un nom au rôle est permis », vérifier le sélecteur des contrôles visés :
`[data-role="x"]` refuse une liste, `[data-role~="x"]` l'accepte.
