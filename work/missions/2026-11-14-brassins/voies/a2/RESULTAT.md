OK — Ses problèmes sourcés pour Créer un brassin et Recettes : 9 + 9 problèmes, 7 + 7 genres neufs

- Fichiers écrits : `voies/a2/PROBLEMES.md`, `voies/a2/tests.txt`, ce fichier. Rien dans `src/`, ni commit ni stash.
- G1 : `PROBLEMES OK` (sortie dans `tests.txt`), 1 essai. Aucune suite Vitest.
- Images ouvertes : A1 `liste-remplie-390-clair`, `e5/e5a/e5a-repos-390-clair`, `e8/e8a/e8a-repos-390-clair`. Lus : SPEC (l.70-110, 560-566, 834, 930-941, 1599-1632, 1651-1780), COUVERTURE, TROUS, c3, NOTE de chaque série refusée, VERDICT k2, k6, k7, k9, synthèse de revue-page5, code (`fabActions.ts`, `QuickActionModal.tsx:1256-1340`, `BrewScheduleField.tsx`, `CatalogCards.tsx`).

Constats décisifs
- Les 10 maquettes de Créer (e5a-d, e5na-nd, e5ga-gb) posent toutes les mêmes trois questions (recette, volume, date, parfois cuve) ; seul le contenant change. Les 8 de Recettes rangent les mêmes champs de carte. Il dit que ça ne répond à aucun de ses problèmes.
- Pour Créer, il n'a jamais écrit une raison, seulement des refus. 3 problèmes tiennent à ses mots sur l'écran ; 6 sont déduits de ses mots ailleurs (marqués « Déduit »).
- Pour Recettes, « quand il y aura des dizaines » est un problème anticipé ; ce qu'il vit aujourd'hui sur Recettes n'est pas dit.
- L'app : Créer = 4 gestes au mieux, 7 à 9 avec une autre recette et une date ; la recette préremplie est la première du carnet (`recipes[0]`). Brasser une recette = 5 gestes ; « Brasser » n'est pas sur la carte de recette.

Doutes et limites
- Aucune capture A1 de la feuille « Préparer un brassin » ni de Recettes (COUVERTURE, groupes 4 et 7) : parcours compté sur le code, dessin vu sur e5a et e8a. La carte `compact` mobile des recettes n'est pas capturée.
- Aucune donnée réelle lue : je ne sais pas quelle part de ses brassins naît « Planifié » plutôt que le jour même (problème 8 de Créer, genre 6).
- Le + de l'onglet Brassins : action « Nouveau brassin » lue dans le code ; le menu e11a n'a pas été rejoué dans un navigateur.

DÉCISION À PRENDRE : comment faire dire au brasseur ses vrais problèmes sans le questionner en mots seuls ? Options : (a) une page courte, un genre par ligne, chaque maquette portant en titre le problème qu'elle résout (1 à 2 maquettes par problème 2, 4, 5, 6 de Créer ; 1, 3, 5 de Recettes) et il choisit ; (b) demander d'abord les problèmes à voix libre. Recommandation : (a), avec pour Créer les genres 1, 4 et 6, pour Recettes les genres 1, 3 et 6, car ils attaquent les problèmes les plus sourcés (gestes, stock, brasser depuis la ligne), et aucun ne reprend une forme refusée.

CONNAISSANCE : toutes les séries refusées de Créer posaient les mêmes trois questions ; changer le contenant ne suffit pas, il faut changer la question. À verser dans `cerveau/brasseur/` par le pilote si confirmé par son prochain choix.

LEÇON PROPOSÉE : avant de dessiner une série de variantes, comparer le contenu demandé (champs, questions) des variantes, pas leur forme ; si toutes posent les mêmes questions, c'est une seule maquette (même constat que c3 pour la fermentation).
