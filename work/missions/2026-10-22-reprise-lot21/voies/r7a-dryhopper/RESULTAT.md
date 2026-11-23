OK — huit concepts Dryhopper « le geste d'abord », COMMUN et D98 verts, gestes joués

## Fichiers écrits
Tous dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/` :
- `a1/etat.html` à `a8/etat.html` : une page autonome par concept, à 390 px ;
- `socle.mjs` : données, contexte, lentille, légende, barres l5b, jauge, fiche à l'appui long ; classes `s-`,
  assemblage par concaténation (L26) ;
- `concepts/a1.mjs` à `a8.mjs` : un concept chacun, classes préfixées `aN-` ;
- `generer.mjs` et `jouer.mjs`, avec la sortie `geste-a.json` ;
- `NOTE.md` ;
- `captures/` (28 images) et `captures/travail/` (sorties des contrôles).

`git status` : rien d'écrit hors du périmètre possédé. `pistes-l5f.png`, à la racine, existait déjà.

## Concepts

| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| a1 | froide | y1b et la carte : « Face à ta stout », 12 barres l5b, jauge IBU. Un relief au-dessus du rail : floral en violet, amertume hors du style en orangé. | glisser le pouce, par 5′, avec loupe ×5,8 | E08 : l'essentiel passe en 2 j | pont |
| a2 | froide | x3b réduit : le bloc Idaho 7 dans la frise du brassin et de la cuve ; ma bière → + Idaho 7 en colonnes | glisser le bloc ; étirer son bord ou pincer pour les jours | E10 : 1 h ou 96 h, même nez | étape 2 |
| a3 | tiède | la brasserie en colonne, de la chaudière à la cuve au repos ; un trait orangé marque l'amertume hors du style | tirer la pastille vers le bas : plus bas, plus tard | E03 : Idaho 7, linalol 38 µg/L (à vérifier) | pont |
| a4 | tiède | une carte par étape ; les voisines dépassent au bord avec leurs valeurs | balayer ← → les étapes, rouler ↑ ↓ minutes ou jours | E08 | étape 2, en dernière carte |
| a5 | tiède | l'horloge du brassin ; l'anneau s'épaissit avec le floral | tenir pour que le temps coule, lâcher pour ajouter ; ‹ › | E05 : floral 24 h, résineux retombe après 6 h | étape 2 |
| a6 | tiède | le floral et l'amertume avec poignées ; le moment suit | tirer la barre de ce qu'on veut | E08 | pont |
| a7 | tiède | les courbes des familles et de l'IBU selon le moment | balayer le graphe du doigt | E08 | pont |
| a8 | tiède | quatre postes en tuiles avec leur floral et leur IBU | déposer la pastille dans un poste ; ‹ › | E10 | pont |

## Sorties décisives
Chaque critère est joué depuis la racine.
- G1 : `controle-commun … a1 … a8 --page=etat.html --sans=mots` → **COMMUN OK**. Couleurs, au style, survol,
  blocs, contraste, fiche, standard, trait, légende, parlant et brutes passent tous.
- G2 : `controle-une-question …` → **UNE-QUESTION OK (1 groupe libre : moment)**, contexte houblon, dose, levure
  et base sur les huit pages.
- G3 : `systeme.mjs existent …` → **EXISTENT OK** ; G4 : `systeme.mjs note … NOTE.md` → **NOTE OK** ; G5 :
  `systeme.mjs note … RESULTAT.md` → **NOTE OK**.
- Joués une fois, recopiés dans la NOTE :
  - D99 → ACQUIS ECHEC 32, 0/4 par page. C'est un contrôle d'écran Comparer (radar, chimie, panel OSU, vraies
    valeurs) ; il ne s'applique pas tel quel à Dryhopper.
  - MOTS (≤ 80) → ECHEC 8/8 : a1 103, a2 103, a3 102, a4 207, a5 91, a6 82, a7 85, a8 112.
- Gestes au doigt (`jouer.mjs`) → **GESTES OK 8/8** : le simulé bouge à chaque geste. Par exemple, a1 passe
  d'actif 3 j ~+22 à 45′ ≈+5 (≈150 IBU) ; a5, tenu 1,9 s, arrive au whirlpool ~+14 (~75 IBU).

## Captures ouvertes
Dans `serie-a/captures/` :
- premiers écrans a1-390.png, a2-390.png, a3-390.png, a4-390.png, a5-390.png, a6-390.png, a7-390.png,
  a8-390.png ;
- à 60′, les huit `aN-60-390.png` ;
- pendant le geste, les huit `aN-geste-390.png` ;
- a1-fiche-390.png et a5-legende-390.png.

Non ouvertes : a5-fiche-390.png et a1-legende-390.png, qui viennent du même socle.

## Prédiction
« a1 et a2 c'est la baseline mais en mieux, le relief sur le rail j'aime bien ; a3 et a5 sont vraiment
intéressants mais trop de texte et de chiffres partout. »

DÉCISION À PRENDRE : D99 doit-il s'appliquer à Dryhopper en passe 2 ? Si oui, il faut le radar, la chimie, le panel
OSU et les vraies valeurs « à un toucher ». Sinon, il faut un critère d'acquis propre à Dryhopper.

CONNAISSANCE :
- Dans la grille d'Idaho 7 à 4 g/L, US-05, dans la stout 16D, tout ajout à chaud sort l'amertume de la bande 50–70
  IBU : 60′ ~162, 10′ ~97, whirlpool ~75. Seul le dry hop garde 60 IBU et donne le plus de floral (~+22 actif,
  ~+23 après).
- Au-delà de 3 j, rien ne bouge dans le moteur (t plafonné à 3 j). E08 et E10 le confirment en mesure : l'essentiel
  passe en 2 j, et 1 h vaut 96 h au nez en bière jeune.

LEÇON PROPOSÉE : un groupe libre porté par l'élément de commande lui-même (`data-libre` sur un `role="slider"`)
fait échouer D98 (« 0 option ») : le contrôle ne cherche que dans les descendants. Mettre `data-libre` sur un
conteneur autour du curseur, ou faire accepter l'élément lui-même par D98.
