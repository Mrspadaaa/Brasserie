OK — série d : huit concepts de la liste de la fiche, COMMUN OK, PANEL OK

## Concepts (une ligne par concept)
| id | chaleur | idée (forme) | ce qui tient | ce qui casse |
|---|---|---|---|---|
| fld1 | froide | rangées g1 affinées : pas de nom de famille redit, « 1er » une fois, français, hors des 12 à leur rang | Nelson Sauvin ouvre sur vin blanc², groseille à maquereau², raisin² ; Agrumes/Épicé dits « catégories Hopsteiner » | reste une liste, peu de gain visuel sur g1 |
| fld2 | froide | bande g1 devenue barre des mots (part grise « hors des 12 », accolade 16D) et puces à points de fiches | la répartition des mots se lit d'un coup ; mojito ●● au même poids que citron vert ●● | deux lectures de la même part ; points sur 4 peu lisibles |
| fld3 | tiède | nuage : taille = fiches qui citent, couleur = famille, noir = hors des 12 au même corps | Nelson Sauvin redevient « incroyable » ; Motueka dit citron vert et mojito, pas « ultra fruité » | nuage tout noir pour Nelson ; la place d'un mot ne veut rien dire |
| fld4 | tiède | échelle à barreaux (toutes ses fiches → une seule → catégorie), colonnes dans / hors du radar | « qui le dit le plus » et « ce que le radar rate » en un regard | colonne sombre lourde quand elle est vide ; 5 barreaux à 4 fiches |
| fld5 | tiède | carte : les mots en légende au bout de chaque axe du radar, territoire « Hors carte » dessous | une seule figure, forme et mots ensemble | radar réduit (écart à g1 écrit dans la NOTE) ; collisions côté gauche (Nugget) |
| fld6 | chaude | éventail : arc des familles, un secteur par mot qui s'allonge avec ses fiches, part hors des 12 au centre | Nelson Sauvin « 83 % hors des 12 », arc gris presque plein ; Cascade multicolore à 0 % | texte en rayon ; plancher de longueur des secteurs (le chiffre reste vrai) |
| fld7 | chaude | cible face au style : centre attendu au 16D, anneau pas attendu, bord sombre « le style n'en dit rien » ; absolu = par fiches | seul concept où au style / absolu change la forme ; Nugget met géranium, floral, herbacé, terreux au centre | position sur l'anneau sans sens ; une hauteur d'écran de plus |
| fld8 | chaude | iceberg : le radar est la pointe, ses mots en surface ; sous l'eau la coque des mots hors des 12, hauteur = leur part | on comprend en 3 s pourquoi le radar sous-dit Nelson Sauvin ; Motueka presque tout dehors | la coque dit une part de vocabulaire, pas une intensité ; eau bleu pâle |

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/fld1/` à `fld8/` : `etat.html` (houblon par défaut), `h-<houblon>.html` (les quatre autres), `gen.mjs`, `NOTE.md` ; socle commun `fld1/socle.mjs`, captures `fld1/captures.mjs`.
- Captures : `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/fld*-premier-ecran.png`, `fld*-page.png`, `fld*-fiche.png` (fiche courte à l'appui long), `fld*-<autre houblon>.png` et `-page.png` (Nelson Sauvin, Motueka, Nugget ou Citra cryo), `fld7-absolu.png`.
- Ce RESULTAT.md. Rien à la racine, rien dans `prototypes/` ni `choix/`.

## Critères (sortie décisive)
- G1 : `SERIE-BIEN-8`.
- G2 : `controle-commun.mjs … fld1 … fld8 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes OK ; `COMMUN OK`.
- G3 : `systeme.mjs note … --contient "fld1,…,fld8,chaleur"` → `NOTE OK`.
- Indicatifs (recopiés dans chaque NOTE) : `controle-panel.mjs` → remplissage médian 0,65, ressemblance 0,87, 0 paire identique, `PANEL OK` ; `mots-premier-ecran --sans-donnees --max=80` → 48 à 72 mots, `MOTS OK` ; `controle-sans-famille` → `SANS-FAMILLE OK` ; `controle-une-question` → ECHEC, 2 fautes par page (pas de sélecteur libre : le facteur libre est la représentation ; pas de ligne `data-role="contexte"`).
- Captures regardées en image : les 8 premiers écrans, les pages, les autres houblons, fld7 absolu et une fiche courte.

## Prédiction
« fld8 et fld3, là on voit enfin que Nelson Sauvin c'est un houblon incroyable ; fld7 très bien pour ma stout, mais il manque les couleurs dans le nuage. »

DÉCISION À PRENDRE : aucune pour la v0. Pour la passe 2 : ajouter ou non une ligne de contexte `data-role="contexte"` dans la fiche g1 (une-question), qui n'existe pas dans son choix.

CONNAISSANCE : chez Hopsteiner, « Familles déclarées sur houblon brut » (Agrumes, Épicé, Fruité…) sont des catégories, pas des mots de dégustation : pour Nelson Sauvin, les deux seules familles du radar viennent de ces catégories, tous ses vrais mots (vin blanc, groseille à maquereau, raisin, sauvignon blanc) sont hors des 12.

LEÇON PROPOSÉE : un panel v0 qui reprend un cadre choisi (fiche g1, radar d'abord) dépasse vite la ressemblance 0,90 de `controle-panel` : donner à chaque concept une masse visuelle propre (un bloc sombre, une figure) dans la zone libre, pas seulement des mots différents.
