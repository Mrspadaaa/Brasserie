# gfd — Le jour du dry hop s'ouvre
Chaleur : **chaude**.
Idée : le jour J+6 s'ouvre.
Composition : le graphique est l'écran, pleine hauteur. Les jours sont des colonnes : étroites pour le passé et l'après, plus large pour « auj. », et J+6 s'ouvre (« J+6 dim. 15.11 · dry hop ») ; les colonnes de houblons y sont posées, là où elles se joueront. Fond de colonne teinté par phase, liseré et consignes en pied de graphique ; courbe mesurée pleine, attendue en pointillé jusqu'à la bande FG. Pied : Mesurer + « cuve — / 19 °C ».
Geste : Mesurer ouvre le pied en relevé m2 (1,016 au curseur, °C échantillon, Taper, Enregistrer) ; le point creux se pose dans la colonne J+5.
- De s4a : grille jour par jour, auj. encadré, courbe, bande FG, phases.
- De s6c : colonnes de houblons, resserrées (barres de 8 px, coche au-dessus du mot).
- Écart assumé : l'axe n'est pas à pas constant (J+6 élargi) ; les points mesurés (J+1 à J+4) sont à pas égal, la pente lue reste juste.
- Retiré ou replié : comme gfa ; alc./att. sous les houblons.
- Éléments au premier écran : **5** (réponse, tête des jours, graphique avec les houblons dedans, consignes, pied) contre **16** pour s4a.
Images : gfd-repos-390-clair, gfd-geste-390-clair, gfd-repos-390-cave.
## Baseline (plancher à enrichir)
- [x] geste m2 : curseur (piste, bande cible 1,010–1,014, ±0,001, « Taper » à un toucher), jamais type="number", virgule
- [x] J+5 · levuré le 09.11 ; deux températures : °C cuve (face à la consigne 19) et °C échantillon (au relevé, « hier 20,5 »)
- [x] FG en bande ; inconnu « — » ; alc. 5,8 % et att. 71 % « provisoires »
- [x] dry hop nommé, dosé, daté (Citra 100 g, Mosaic 80 g, J+6 · dim. 15.11) ; « Ajouté auj. » date et déstocke en un geste
- [x] feuille de l'app (poignée, titre, ×) ; carnet · stock · dossier à côté du × (k4 B0) ; pas de cockpit, ni bandeau, ni code, ni secondes
- [x] trousse d'identité chargée (IDENTITE OK) ; valeurs en ligne en Source Sans à chiffres tabulaires (k3 n° 6)
## Honnêteté
Chiffres du BRIEF-AUTEUR seulement. α et rôle : hopAlpha/hopRole de src/domain/hopIndex/v4/roles.ts (source de l'app, comme s4a ; k4 demandait d'unifier) : Citra α 10–15 %, Mosaic α 11,5–13,5 %, aromatique. Barres de familles : voir « Corrections kg » (source de l'app, plus les notes de s6c). Valeur du geste 1,016 : saisie d'exemple.

## Corrections kg (voie gk, 15.11)
Familles (gk, 15.11, source unique des quatre greffes) : describeFamilies de src/domain/hopIndex/v4/hops.ts (fiches de variété du dépôt, 12 familles de l'app), barre = part des fiches qui citent la famille, 4 premières. Citra (7 fiches) : agrumes 7, tropicaux 7, noyau 2, floral 2. Mosaic (8 fiches) : tropicaux 8, baies 7, agrumes 5, noyau 4 ; baie = sa signature (picto de J+6 et liseré). Pictos et tons : planche fils17-standard/v3 et jetons-familles.json ; baies et résineux éclaircis en cave. Remplace les notes Beer Maverick de s6c (Mosaic sans baie, Citra épicé : kg n° 1).
- n° 1 familles ; n° 2 pas de temps constant (J+1 à J+10 égaux), J+6 marqué par sa teinte, les houblons dans une bulle pointée sur J+6 qui déborde sur les jours à venir (repliée au relevé : nom, dose, case) ; n° 3 « Quand ajouter ? » 44 px en tête de bulle ; n° 4 « Ajouté auj. » sur une ligne pour les deux ; n° 5 alc./att. sous le titre ; n° 6 « J+1 … J+10 », « 2 °C » ; n° 7 relevé à deux températures (échantillon, cuve), − valeur + 44 px ; n° 8 « 1,016 » à droite du cadre d'aujourd'hui ; n° 9 capture 1280 ; n° 10 tâches J+7 et J+10 sous le graphique.
