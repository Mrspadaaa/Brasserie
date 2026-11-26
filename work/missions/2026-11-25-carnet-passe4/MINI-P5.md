# Mini maquettes passe 5 : SES choix, rendus pratiques, précis, adultes (26.11)

Ses mots, dans l'ordre :
- « Mais tu as jamais fait comme demandé un carnets jouable en partant ces des choix Carnet passe 4, classement par écran (25.11) ».
- « Mais je pense que pour l'arbre et tout, ça doit être règle. » Lu : réglé. L'arbre et la liste sont tranchés par son classement ; on ne les
  réexplore pas.
- « Prends mes choix et adapte les au maquettes jouable. Rend les plus pratique, plus précis et moins enfentin. Et reprends toutes mes
  remarques et ça devrait être bon, fait des mini maquettes de ça ».

Donc : des mini maquettes statiques, une par écran. Chacune reprend SA version choisie (recette ci-dessous) et la rend plus pratique, plus
précise et moins enfantine. Toutes ses remarques s'appliquent. Le jouable viendra ensuite, sur ces maquettes.

## Recette : écran → SA version (CLASSEMENT-4.md, rang 1 = meilleur)
Sources : `v01.html … v06.html` (ce dossier), page passe 4 `page/index.html` (M4, base, passe 3), captures `cap/` et `../2026-11-26-liens/img/p4-*`.
- **Liste au repos** : v02. Arbre catégorie › sous-catégorie, réglé.
- **Ranger en glissant** : v01 glisser, son seul rang 1 de geste.
- **Noter vite** : v01, avec M4 « Directement écrit dans le carnet ».
- **Note rangée par l'IA** : v01.
- **Mes notes, on écrit** : v04, rang 1.
- **Mes notes, sa ligne retrouvée** : M4 et v01, plus « On peut quand même un peu organiser les notes » (v03).
- **L'IA lit** : v03.
- **Organisé, problème** : v04, son meilleur. La base est « Pas encore ça mais mieux » : c'est l'écran à soigner le plus.
- **Changé par l'IA** : v05.
- **Options et Comparer** : v02 et v06. Doit tenir 6 options et plus ; sur v02 : « Fonctionne mal du on en a vraiment beaucoup ».
- **Décider** : v01.
- **À faire** : v01.
- **Résoudre** : v01.
- **Résolu** : v01.
- **Relecture** : v03, à garder simple (« Bof »).
- **Mémo** : v02.
- **L'IA n'a pas pu lire** : v01.

## Et toujours visuel
« Mais toujours bon visuel pour un visal learner. » (26.11) : moins enfantin ne veut pas dire moins visuel. Garder les représentations visuelles
de sa version (couleur d’état, jauges, barres de prix, icônes au trait) ; un écran qui devient texte ou tableau sec est raté (PRO-MAIS-PAS-CLAIR).

Tableaux : « Dans certaine cas comme les comparaisons, c’est ok mais globalement non » (26.11) — puis « En soit les tableaux sont un bon outil tout de même, mais il doit être adapté » : un tableau quand le cas compare ou aligne des valeurs (offres, critères, chiffres), adapté au cas (peu de colonnes, gagnant visible, unité), jamais un tableau de propriétés par défaut.

## Toutes ses remarques (à relire en entier, aucune n'est facultative)
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, lignes du 24.11 à la fin, pour la partie Carnet.
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` § CARNET-* (lignes 519 à 580). Puis ORGANISE-TROP-TEXTUEL, FRISE-GENERIQUE, ENTETE-PEU-UTILE,
  PAS-DE-HARCELEMENT, LIENS-NON-LUS, TROP-ENFANTIN, COMPARER-BEAUCOUP-D-OPTIONS, PRO-MAIS-PAS-CLAIR.
- En bref :
  - visuel pour un TDAH, pas de texte en pavé ;
  - pas de frise générique ;
  - en-tête utile ;
  - pas de question collée au pouce ;
  - noms réels de 2 à 5 mots ;
  - emoji de 16 px au plus, qui accompagne sans remplacer ;
  - liens lus et comparés (marqués 🔗) ;
  - « qui gagne quoi » à quantité égale ;
  - un champ texte plutôt qu'un bouton, avec ✦ suggestion de l'IA à côté du « + » ;
  - Organisé par défaut ;
  - l'IA se déclenche quand il arrête d'écrire ;
  - arbre compact avec sous-catégories ;
  - pas d'austérité qui rend moins clair.
- « Plus précis » veut dire :
  - chiffres exacts avec unité et quantité ;
  - dates comptées depuis aujourd'hui (26.11.2026), heure suisse ;
  - « trouvé », « pas trouvé » et « estimé » distingués ;
  - chaque valeur renvoie à sa ligne.
- « Plus pratique » veut dire :
  - l'action principale est sous le pouce ;
  - moins de touchers ;
  - cibles de 44 px au moins.

## Données
Ses notes telles quelles. Fixtures : `tests/fixtures/c79/*.json`, `tests/fixtures/c75/*.json`, et les cas fictifs
`../2026-11-25-carnet-document/visuel/cas-fictifs.json`. Ce que l'IA ajoute est marqué ✦ ; rien n'est inventé.

## Contrat
Thème sombre, 390 × 844.
Chaque mini maquette montre l'écran seul, avec à côté la capture de SA version d'origine (sa source), pour que la reprise se voie.
Fichiers possédés :
- `mini/<lettre>-<écran>.html` ;
- `mini/cap/<lettre>-<écran>.png` ;
- `mini/RESULTAT-<lettre>.md`.

Captures :
- format 390 × 844, deviceScaleFactor 2 ;
- puppeteer-core sur le Chrome 9222, dans ton onglet ;
- à la fin : page.close() puis browser.disconnect(), jamais browser.close() ;
- ouvre chaque capture et juge-la : pratique ? précise ? enfantine ? fidèle à sa version ?

Commit local de tes seuls chemins. Rends une ligne : écrans faits, commit.

## Ajout 26.11 : comparer toutes les caractéristiques
« Par exemple, pour les chambres froides, je veux quand même pouvoir comparer toutes leur caractéristiques ». Écran Comparer : une 3e maquette
O-comparer-caracteristiques sur la chambre froide (tests/fixtures/c54/chambre-froide.json, c52/caracteristiques.json, c55/comparer.json) :
TOUTES les caractéristiques des offres, en tableau adapté au téléphone (1re colonne figée, écarts mis en avant, unités, gagnant par ligne
visible, inconnu « — » ou « 🔗 en lecture »), le résumé « qui gagne quoi » au-dessus.
