# Dossier c77-tests — reel-77 (voies/reel-77/RESULTAT.md ; lignes R77-n, R73-n et R75-n rouverts de BUGS.md)

Documents RÉELS : tests/fixtures/c75/*.json (houblons-citra, embouteillage-planning, zz-*) ; s'il faut un autre carnet (Frigo, Sol murs), construis-le en copiant la FORME exacte de embouteillage-planning.json (même champs), dates changées.
- R103 (R77-1) : dans Comparer, la ligne « prix CHF » dit le prix du conditionnement (≈3,7 CHF les 50 g), jamais le prix au kilo (73,8) ; le prix au kilo a sa propre ligne « CHF/kg ».
- R104 (R77-2) : une valeur que le carnet montre (arômes lus) est la même sur la fiche et dans Comparer ; jamais « Non publié » / « ? » quand une autre surface la connaît (une seule source de vérité par champ).
- R105 (R73-25, 2e retour : le correctif c75 n'a tenu que pour Embouteillage — surapprentissage) : la RÈGLE : toute date hors de l'année en cours dit son année partout (Quand, À faire, liste), quelle que soit sa forme (semaine, plage, date seule, Planning importé ou non) ; teste au moins 6 dates de formes différentes (S17 2027, S50 2026 vue en 2027, plage à cheval sur deux années, date seule, semaine de l'année en cours sans année, S53).
- R106 : les autres R77-n (m) et les R73/R75 rouverts listés au RESULTAT de reel-77, chacun par le composant sur les documents réels.
SEULEMENT des tests rouges ; aucun fichier de src/ ni functions/ modifié.
