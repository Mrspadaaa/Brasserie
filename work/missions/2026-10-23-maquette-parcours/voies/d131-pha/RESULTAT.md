OK — quatre jeux pha prêts : Citra +4 partout, citronnelle et gingembre en mot

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/pha1/` à `pha4/` : `etat.html` et `NOTE.md` pour chacun.
- `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/captures/pha{1..4}-` : `planche`, `carte` (Comparer, version courte), `carte-texte` (version textuelle, légende ouverte), `galaxy-saaz`, `fiche` (courte), `fiche-texte` (légende ouverte), `cote-carte`, `cote-galaxy-saaz`, `cote-fiche` (la maquette telle quelle à gauche, le jeu à droite).
- Les scripts (générateur, figeage des vraies pages, aperçus en vrais pixels) sont dans `%TEMP%/pha/`, hors du dépôt.

## Critères
- G1 (remplacé par le pilote) : `node work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/outils/jeux.mjs pha1 pha2 pha3 pha4` → `JEUX-BIEN-4`.
- G2 : `controle-pictos-trait.mjs … pha1 pha2 pha3 pha4 --page=etat.html` → `TRAIT OK` (318 à 328 pictos par page, 0 faute ; les pictos du lot portent `data-famille="hors-16d"` pour que D88 les juge aussi).
- PANEL sur les quatre planches → `PANEL OK` (médiane 0,61, ressemblance 0,83, 0 % de paires presque identiques). Sur les captures de carte, il échoue (21 %) : c'est la même vraie carte pour chaque jeu, comme le brief le demande.
- controle-commun --sans=mots : OK pour au-style, survol, blocs, contraste, trait, légende, parlant et brutes. Trois écarts, avec leur raison dans chaque NOTE : COULEURS (planche à l'encre, par la règle du brief), FICHE D25 (cartes figées, sans appui long) et STANDARD S1 (couleurs de colonne qui viennent de la maquette elle-même).

## Ce que fait chaque jeu
Les quatre jeux suivent la même grammaire : à l'encre, viewBox 24, trait 2.571, bouts ronds. Chacun pose aussi le mot précis et la légende à sa façon.
- **pha1, froide** : une silhouette par mot. Le mot précis est dans la ligne noire, avec le picto de sa famille. La légende s'ouvre au toucher de « lui seul ». « En plus » reprend le ◇ que l'app utilise déjà.
- **pha2, tiède** : chaque objet porte un détail de goût. Le mot précis est à côté de sa famille, souligné à sa couleur, dans le rang des pictos. La légende est en pied du tableau. « En plus » : trois points.
- **pha3, tiède** : une silhouette fermée et un seul trait intérieur, comme les 12. Le mot précis est regroupé par famille dans la ligne noire. « En plus » : une bulle.
- **pha4, chaude** : l'objet dessiné, avec deux ou trois détails. En version courte, tout est picto. La légende est en pied du tableau. « En plus » : une étiquette.

Pour tous les jeux :
- Le bandeau de la fiche se remplit de pictos, et les lignes « ◇ mot » de la grille prennent leur picto.
- Galaxy et Saaz (CZ) se distinguent d'un coup d'œil : Galaxy a une ligne noire pleine de pictos et de mots précis ; Saaz a un seul mot précis (citron), puis doux et noble en clair.

## Ce qui casse
- **Mots mal reconnus** : à 16 px, je n'arrive pas à nommer citronnelle, gingembre et nectar sans légende, dans aucun des quatre jeux. Crème et curry hésitent selon le jeu. pha3 est le jeu le plus faible sur ce point.
- **pha2 prend de la place** : le mot précis à côté de sa famille ajoute environ 18 px à la tête de colonne de Galaxy. Chez Citra, il fait descendre le verdict d'une ligne.

## Prédiction
« pha1 et pha4 s'intègrent bien et on voit enfin Galaxy face à Saaz, mais citronnelle et gingembre, je ne les reconnais pas. »

DÉCISION À PRENDRE : où poser le mot précis. Trois façons sont montrées : dans la ligne noire (pha1, pha3, pha4), à côté de la famille dans la tête (pha2, plus visible mais plus haute), ou en picto seul dans la version courte (pha4). C'est son choix sur les captures.

CONNAISSANCE : Nelson Sauvin n'a aucun mot précis dans ses fiches : elles disent seulement « Agrumes » et « Épicé ». Saaz (CZ) en a un : « lemon » (Hopsteiner), traduit citron. La grille de la fiche range « fruité » parmi les mots hors des 12 avec un ◇ : c'est un qualificatif, qui doit rester un mot sans picto.

LEÇON PROPOSÉE : une maquette en React se montre dans une vraie carte, sans refaire la carte : il suffit de figer son DOM rendu par la route (`#/comparer?h=…`, `#/fiche/<houblon>`) après y avoir posé l'ajout, dans un cadre `transform: translateZ(0)` qui contient ses éléments fixes. Le défilement figé se rejoue par un attribut.

## Passe 2 (retour du critique, 24.10 soir)
- Les quatre jeux sont repris sur place (G1 tourne sur pha1 à pha4). La v0 est gardée : pha*/v0-etat.html, pha*/v0-NOTE.md, captures/pha*-v0-*.png.
- Commun : un picto ne passe jamais dans « +n » ; Nelson Sauvin a ses trois pictos (la groseille, aussi chez Citra, en clair) ; « herbe » retiré de Saaz ; plus de pastille vide ; barre d’huile (1,8–5 contre 0,3–1 mL/100 g) dans la carte Galaxy/Saaz ; curry en marmite, crème en brique, nectar en pichet, citronnelle en biseau, gingembre en rhizome.
- pha2 : le mot précis revient dans la ligne noire, souligné à la couleur de sa famille (rang des familles intact) ; « en plus » devient la bulle ronde. pha3 : le premier mot précis de Galaxy sort du « +n », et le miel passe en alvéoles. pha4 : le premier mot précis est écrit dans la version courte.
- Sorties : jeux.mjs → JEUX-BIEN-4 ; controle-pictos-trait → TRAIT OK ; PANEL des planches → PANEL OK ; controle-commun : les mêmes trois écarts (couleurs, fiche, standard S1).
- Reste ouvert : citronnelle (le biseau se lit « tige » ou « crayon ») et gingembre (le rhizome se lit « chaîne »). DÉCISION À PRENDRE : un autre dessin, ou le mot seul pour ces deux mots.
- Prédiction : « Là on voit Galaxy face à Saaz, et ça gêne toujours pas ; mais gingembre, c’est une chaîne ? »
- Retouche courte (nuit) : Citra « +4 » partout (data-plus=4 dans les huit cartes Citra des quatre jeux) ; citronnelle et gingembre en mot seul ; JEUX-BIEN-4, TRAIT OK.
