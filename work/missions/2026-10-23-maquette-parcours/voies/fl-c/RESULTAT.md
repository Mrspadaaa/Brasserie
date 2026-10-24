OK — série c, huit concepts v0 : d'où vient chaque mot (fiche, année, accord), baseline tenue

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flc1/commun-c.mjs` : le commun technique (données lues dans `pack-fiches.json`, traductions D97, années, radar 12 axes, pièces de la baseline, fiche g1 du socle à l'appui long). Aucune mise en page commune.
- `flc1/` à `flc8/` : `generer.mjs`, `etat.html`, `NOTE.md` (chaleur, idée, ce qui tient, ce qui casse, sorties des contrôles).
- `flc1/captures-c.mjs` : les captures à 390 × 844 (×2).
- `captures/flcN-premier-ecran.png`, `captures/flcN-page.png`, et les états `-absolu`, `-nelson`, `-motueka`, `-legende`, `-fiche-g1` (appui long réel) pour chaque concept.

## Une ligne par concept
| id | chaleur | idée | ce qui tient | ce qui casse |
|---|---|---|---|---|
| flc1 | froide | g1 tel quel, chaque mot signé de ses fiches et de leur année (BM²³, HS²⁵) ; « Hors des 12 » rangée à son nombre de fiches | tout g1 au même endroit ; Nelson Sauvin : 4 mots 2/2 en tête, Agrumes et Épicé « rangé sous » | les marques se répètent, 105 mots hors données |
| flc2 | froide | g1, la liste rangée par accord : les 2 fiches / 1 seule (une colonne par fiche) / rangé, pas goûté / aucune fiche | plus de « Floral · floral » ni de « nommé en premier » répété | la famille n'est plus l'axe de lecture |
| flc3 | tiède | la table « qui dit quoi » : mots × fiches, case pleine, creuse (rangement) ou vide, « 1er » une fois, 2/2 au bout ; bandeau « 4 mots dits par ses 2 fiches, dont 4 hors des 12 » | l'honnêteté au premier regard sur Nelson Sauvin | austère ; 4 colonnes serrées pour Nugget |
| flc4 | tiède | la fermeture éclair : Beer Maverick à gauche, Hopsteiner à droite, l'idée au milieu, un fil par citation | Motueka : 5 idées d'agrumes sur 8, c'est le vocabulaire qui le fait « ultra fruité » ; Citra cryo : « aucune autre fiche lue » hachuré | les fils se croisent ; trois fiches mêlées à droite pour Nugget |
| flc5 | tiède | les fiches citées telles qu'écrites, mots surlignés à la couleur de leur famille, original anglais au-dessus ; bande des 12 familles de g1 au style 16D | rien n'est réinterprété ; « année ? » visible pour 2 des 4 fiches de Nugget | radar sans étiquettes (la bande les porte) ; 89 mots |
| flc6 | chaude | où vont les mots : flux fiches → mots → famille ou « Hors des 12 » ; « 2 mots sur 7 dans le radar » en gros | la réponse chiffrée à « Nelson Sauvin paraît ordinaire » | forme inhabituelle, temps de lecture ; colonne de droite étroite |
| flc7 | chaude | la pile de fiches : une carte tamponnée par fiche, ses mots sur des lignes ; une seule carte = la place vide hachurée | le nombre de voix se voit avant les mots ; α du cryo honnête (fiche en pellets) | radar plein à 1/1 pour Citra cryo : une seule voix paraît forte |
| flc8 | chaude | les mots tamponnés : une tuile par mot, large selon l'accord, tamponnée par ses fiches ; tuiles hachurées « personne » | Nelson Sauvin : quatre tuiles pleine largeur tamponnées deux fois | expressif : lisible ou « joli inutile » ? ; tuiles hachurées encombrantes |

## Sorties décisives
- G1 : `SERIE-BIEN-8`.
- G2 : `controle-commun.mjs … flc1 … flc8 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK → `COMMUN OK`.
- G3 : voir la ligne `NOTE OK` du pilote (`systeme.mjs note … --contient "flc1,…,flc8,chaleur"`).
- Panel : `controle-panel.mjs` sur les 8 premiers écrans → remplissage médian 0,56, 0 sous 0,50 · ressemblance 0,89 · 0/28 paires presque identiques → `PANEL OK` (ressemblance proche du seuil 0,90).
- Indicatifs, joués une fois : `mots-premier-ecran --sans-donnees --max=80` MOTS ECHEC 3/8 (flc1 105, flc3 87, flc5 89) ; `controle-une-question` UNE-QUESTION ECHEC 24 (pas de titre-question ni de ligne de contexte : la fiche n'est pas un écran d'outil D98) ; `controle-sans-famille` SANS-FAMILLE ECHEC 8 (Nelson Sauvin sans part « autres » balisée ; ses mots hors familles sont des éléments à part entière ; D100 conditionnel).
- Captures regardées en image, à côté du plancher (`consolide-fiche-390.png`, `p22-fiche-cascade-liste.png`) : les 8 premiers écrans, et les états Nelson Sauvin de flc1, flc2, flc8, la fiche g1 de flc5.

## Prédiction
« flc6 et flc3, là on voit enfin pourquoi Nelson paraît ordinaire, et le côté tampons de flc8 j'aime bien ; mais flc1 a trop de petits codes partout. »

DÉCISION À PRENDRE : le rayon du radar en fiches qui citent / fiches lues (choisi ici, contre D72 « 1/4, 2/4 mais même valeur ») dessine Citra cryo plein sur sa seule fiche ; à trancher en passe 2 (garder, ou marquer « une seule fiche »).

CONNAISSANCE : dans `pack-fiches.json`, les deux seuls mots rattachés de Nelson Sauvin (Agrumes, Épicé) sont des « Familles déclarées sur houblon brut » de Hopsteiner, pas des mots goûtés ; même cas pour l'Herbacé de Cascade et l'Épicé de Nugget. Ses quatre mots les plus sûrs (vin blanc, fruité, groseille à maquereau, raisin) sont dits par ses deux fiches, et tous hors des 12 familles.

LEÇON PROPOSÉE : une classe courte non préfixée (`.c`, `.g`, `.d`) prend les styles du socle w (fond gris sur la colonne centrale de flc4) : L26 vaut aussi pour les modificateurs, pas seulement pour les classes de rôle.
