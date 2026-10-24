OK — huit concepts chauds de Substituer (sbz1 à sbz8), baseline tenue, COMMUN OK, PANEL OK, captures regardées.

## Fichiers écrits (OWNS seulement)
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbz1/` à `sbz8/` : `etat.html` (page statique, données du moteur v4 figées dedans) et `NOTE.md` (chaleur, idée, ce qui tient, ce qui casse, sorties des contrôles).
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbz<n>-premier-ecran.png` et `sbz<n>-page.png` (390 × 844, 2×), 16 captures.
- Scripts de travail dans `os.tmpdir()` (scratchpad `sbz/` : `calc-sbz.ts`, `calc2-sbz.ts`, `build.mjs`, `capturer.mjs`, sources `sbz<n>.src.html`) ; rien dans `prototypes/`, `choix/` ni à la racine.
- Données : le moteur `substitutes()` rejoué par `vite-node` pour Nugget 46 g (recette S1), les 318 candidats, à 60′, au whirlpool et en dry hop actif ; fiches par `hopRef`, `describeFamilies`, `familyWords` ; échelle 16D (`getStyleScale` : attendues floral, herbacé, terreux ; IBU 50–70). Aucun nombre inventé ; « ~ » sur le simulé, « ? » et hachures sur l'inconnu (huiles d'Altus, Trident, Zenia : score en plage 79–99).

## Les huit (une ligne chacun)
- **sbz1 · La cible** — chaude ; Nugget au centre, chaque remplaçant à la distance de son score, haut/bas l'α, droite/gauche ce qu'il garde ; tient : lecture en trois secondes, stock et inconnu sans mot ; casse : étiquettes qui se chevauchent près du centre et en bas.
- **sbz2 · La pile** — chaude ; le score empilé par ce qui le fait (amertume 60 %, huiles 20, arômes 20 à 60′ ; huiles inconnues hachurées, plage) et la même pile au whirlpool (10 / 30 / 60) ; tient : on voit pourquoi, et que le moment renverse la liste ; casse : pictos petits, 82 mots.
- **sbz3 · L'ombre de Nugget** — chaude ; le contour de ses sept familles, rempli par chaque remplaçant (hachuré perdu, « + » gagné, point non décrit), douze lignes ; tient : la forme à comparer, douze fois, remplissage 0,77 ; casse : hauteurs = niveau de fiche, pas intensité ; pas de whirlpool.
- **sbz4 · La règle à calcul** — chaude ; α en haut, grammes pour 60 IBU en bas, Nugget en curseur, stock en pins, variétés en plages ; tient : « α plus bas, plus de grammes » devient un objet ; casse : l'arôme n'est que dans la carte et la liste du bas.
- **sbz5 · Mot pour mot** — chaude ; les mots des fiches face à face, famille par famille, mots hors roue en gris (vin blanc, groseille à maquereau…) ; tient : rien d'inventé, Nelson Sauvin cesse d'être « ordinaire » ; casse : le moins rempli (0,48), 90 mots.
- **sbz6 · La file des 318** — chaude ; tout le catalogue en traits rangés par score, le stock en drapeaux avec son rang, la même file au whirlpool qui se renverse ; tient : on voit où tombe ce qu'on a, et que le moment change tout ; casse : drapeaux serrés entre 74 et 86, 112 mots.
- **sbz7 · Gramme pour gramme** — chaude ; l'amertume de la stout si on met les mêmes 46 g (orangé hors 16D, plage si α variétal), puis la dose juste ; tient : le piège et sa correction sur la même ligne, lentille au style / absolu à sens réel ; casse : arôme réduit à deux pictos, calcul de page (~).
- **sbz8 · Le duo** — chaude ; deux du stock pour un Nugget, part d'IBU par l'α, cases des sept familles couvertes (Idaho 7 + Nelson Sauvin : 7/7, tout en stock) ; tient : réponse neuve et calculable, honnête sur ce que le moteur ne note pas ; casse : le facteur libre devient un couple, 93 mots.

## Critères
- G1 (page, NOTE avec chaleur, deux captures) : `SERIE-BIEN-8`.
- G2 (baseline) : `COMMUN OK` (`controle-commun … --page=etat.html --sans=mots` : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK sur les 8).
- G3 (rapport) : `NOTE OK`.
- Panel (M14) : `PANEL OK` — 8 captures, remplissage médian 0,55 (sbz5 0,48 seul sous 0,50), ressemblance 0,89, 0 paire presque identique. Marge faible sur la médiane (0,552 contre 0,55).
- Indicatifs, joués une fois et recopiés dans chaque NOTE : `controle-une-question` ECHEC 8 problèmes (bouton « Remplacer par X › » lu comme sélecteur sur sbz1, sbz5 ; faux « moment » lu dans le texte des lignes de sbz2, sbz4, sbz6 ; sbz3, sbz7, sbz8 OK) ; `controle-sans-famille` ECHEC (Nelson Sauvin, Hallertau Blanc sans « part autres » dessinée ; sbz5 montre leurs mots en chips, D100 conditionnel) ; `mots-premier-ecran --sans-donnees` : 67, 82, 65, 83, 90, 112, 75, 93 (5 au-dessus de 80).

## Captures regardées (L12)
`work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbz1-premier-ecran.png` … `sbz8-premier-ecran.png` et `sbz<n>-page.png` : ouvertes après chaque reprise ; corrigés en cours de route : colonnes coupées (sbz2, sbz3, sbz7), étiquettes empilées (sbz1, sbz4, sbz6), doses qui se cassaient sur deux lignes (sbz1, sbz4), lentille sortie de la ligne de contexte (D98), pictos colorés par le svg lui-même (controle-couleurs), un symbole d'icône par taille (S4), pink des arômes assombri (contraste), bouton « Annuler » à côté de « Remplacer › » (D120), croix 44 px à gauche (D109).

## Prédiction
Il gardera l'idée de sbz7 (« gramme pour gramme ») et de sbz6 (« la file des 318 ») — « pas mal, mais » les étiquettes de la cible (sbz1) ; sbz8 le fera réagir (« un duo ? intéressant mais c'est plus un remplaçant ») ; sbz5 risque « trop de texte ».

DÉCISION À PRENDRE : sbz8 (le duo) laisse libre un couple de houblons, pas un seul ; à garder dans le panel comme idée extravagante (greffe possible : « il en manque 15 g, complète avec… »), ou à écarter au nom de L10. Rappel : `fils24-substituer/` est ignoré par git (`.gitignore` ligne 57, `/work/refonte-frontend/**`), comme les autres séries ; `git status --short` ne montre donc rien de cette voie, et aucun fichier n'a été écrit hors des OWNS.

CONNAISSANCE : le moteur `substitutes()` tourne hors du projet avec `vite-node --root C:/Users/mrspa <script.ts>` (le root large lève la restriction `server.fs`) ; à 60′ le classement démonte Target (94, 213e) et Citra cryo (88, 215e) comme « chers pour amériser », et au whirlpool Nelson Sauvin passe de 73e à 236e sur 318 ; Chrome déporte un appui long vers le bouton voisin (le « ? » à 8 px) quand l'élément touché n'a pas d'écouteur de clic : un écouteur de clic vide sur chaque `[data-houblon]` rétablit la fiche (controle-fiche).

LEÇON PROPOSÉE : un contrôle de panel qui mesure le remplissage par lignes de pixels ne compte pas une teinte à moins de 60 de différence avec le fond (#f7f7f9 ne « remplit » pas) ; dire le seuil dans le brief des séries, pour que la densité vienne du contenu et non d'un fond.
