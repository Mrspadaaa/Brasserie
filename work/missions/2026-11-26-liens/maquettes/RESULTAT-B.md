OK — B : trois genres (Things 3, cockpit, cartes de décision), 4 écrans chacun + ✦ ouvert

## Fichiers
- `maquettes/B-things.html` — B1 « Things 3 » : listes calmes, une action par ligne, cases et anneaux fins, en-têtes de section à filet.
- `maquettes/B-cockpit.html` — B2 « cockpit de brassage » : 3 instruments en tête (urgent, à vérifier, ouverts), voyants d'état, grands chiffres mono, jauge fine du temps restant, échelle de prix, check-list numérotée, journal horodaté.
- `maquettes/B-decision.html` — B3 « cartes de décision » : arbre à traits classé par ce qui attend (à décider, à trouver, à faire), une carte par décision, options côte à côte et chiffrées, gagnant à liseré, « Choisir » sous chaque offre.
- Écrans : `?e=1` liste en arbre, `?e=2` écoulement, `?e=2&ia=1` ✦ ouvert, `?e=3` 600 bouteilles, `?e=4` assurance.

## Captures (390 × 844, DPR 2, toutes ouvertes)
`maquettes/cap/B-{things,cockpit,decision}-{liste,probleme,probleme-ia,achat,echeance}.png` (15).
Mesures au rendu : aucun débordement hors cadre ; tailles de texte 12/14/20 (B1, B3), 12/14/28 (B2), plus 16 dans le champ ; 66 à 166 mots par écran.
Seules coupures : des lignes de « Tes notes » ou du journal, en points de suspension.

## Données
- Le texte vient des notes telles quelles : fixtures c79 (écoulement, assurance et les 10 autres de l'arbre) et `cas-fictifs.json` (600 bouteilles, chaudière, sureau, bar, levure récoltée).
- ✦ marque ce que l'IA ajoute : la piste « Changer le joint » (coût « — ») et « Demander si le joint suffit », tirées de `reponse-reelle-ecoulement.json` ; le total pour 600 (504 / 410 / —), calculé depuis ses prix ; la tâche « Renouveler », rangée par l'IA (fixture) ; la question « Renouveler chez qui ? » (B3).
- Le préfixe « ZZ TEST — » est retiré des titres.
- Les dates relatives sont calculées depuis le 26.11 (31 déc. = J-35) ; « lundi », « demain 7h » et « avant le 15 » restent tels qu'il les a écrits.
- Inconnu = « — » ; jamais un zéro.

## Prédiction
Il dira que B3 (cartes de décision) est le plus « adulte et visuel », surtout sur les bouteilles. B2 lui plaira pour le coup d'œil de la liste, au risque de le trouver « un peu cockpit ». B1 lui paraîtra propre mais un peu vide sur les carnets courts.

## Réserves
- Bas d'écran vide (150 à 380 px) sur les carnets courts, surtout en B1 : peu de données, rien n'a été ajouté pour remplir.
- B2 : l'état « réglé » s'affiche en gris, pas en vert (la règle de colonne l'emporte).
- B3 : « Choisir » est en `primary` sous Fournisseur B, gagnant ✦ ; cela oriente le choix.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
