# Verdict de la passe 2 — compagnon (voie c2, critique Opus)

p2a : REJET
p2b : REJET
p2c : ACCEPT

Ma question pour chaque candidate : « combien et quels problèmes ? ». J'ai ouvert les 12 cadres clairs en plein format, plus 4 cadres en cave (reponse, urgent, erreur, bureau). Mon avis est indicatif (L27) : le brasseur voit les trois.

J'ai vérifié les nombres de la passe 2 dans les trois candidates. Ils sont justes partout :
- Mosaic 43 → 35 g, contact 3 → 2 j, dry hop 19 → 17 °C ;
- dose 9,0 → 8,6 g/L (85 + 43 + 35 = 163 g sur 19 L), et 171 g sur 19 L font bien 9,0 g/L ;
- 9,50 et 11,20 CHF, 2,10 sur 15 CHF, 4 sur 120, 15,00 sur 15 CHF au plafond.

Aucune candidate n'affiche de nom de modèle ni de fournisseur d'IA. Les fautes qui suivent sont donc ailleurs.

## p2a — REJET : 2 valeurs fausses, 7 défauts mineurs

Phrase prédite du brasseur : « Le feu, on comprend tout de suite, et les barres avant/après c'est clair. Mais le Brassin 31, c'est ma NEIPA, pas une blonde. Et ton curseur dit 20 là où il y a 27. »

1. **conversations** : « Brassin 31 · Blonde de garde » apparaît alors que l'en-tête de tous les autres cadres dit Brassin 31 · New England IPA. Un même numéro désigne deux bières : c'est une valeur fausse, vue en 2 s (« Sens métier, avant le visuel » ; L14 bis). Correction : « Brassin 30 · Blonde de garde », la donnée que le pilote a acceptée pour p2c.
2. **plafond** : le libellé « 20 CHF » est centré sous l'échelle de 5 à 50 CHF, soit à l'endroit de 27,5 CHF. Le bouton du curseur, posé à 20, se trouve environ 55 px plus à gauche. C'est une valeur fausse sur une échelle, le même défaut que la marque 3:00 de s2a en v0. Correction : placer chaque libellé à sa valeur, (v − 5) / 45 de la piste, ou n'en garder que deux, 5 et 50, aux extrémités, avec la valeur choisie au-dessus du bouton.
3. **reponse**, 390 : le titre coupe sur « dry / hop. ». Un mot isolé à la ligne nuit à la lecture. Raccourcir le titre, ou équilibrer la coupure (`text-wrap: balance`).
4. **reponse** : « Contact Mosaic J+9 » tient sur deux lignes. La barre de « Temp. du dry hop », presque pleine, ne dit pas ce qu'elle mesure.
5. Espaces de travers, contraires au défaut commun 3 :
   - « Et la garde à 18 °C  ? » (espace double avant le point d'interrogation) ;
   - « rappel dans  30 min » (espace double, cadre urgent) ;
   - « 2,10 /15 CHF » (espace avant la barre oblique, aucune après ; accueil et erreur).
6. **finances** : le segment « Approfondi » touche le bord de sa pastille, et « conseillé » est rejeté hors du segment.
7. **finances** : « 2026 » et « 4 sur 4 » sont en mono, alors que ce ne sont pas des mesures (défaut commun 8).
8. **bureau** : environ 115 px vides sous le journal, à la limite du plafond de 120.
9. **conversations** : la corbeille rouge « Supprimer » est visible dans le cadre. Elle s'ouvre bien à un toucher de plus, mais elle domine la rangée.

Doutes, non comptés :
- en cave, le niveau Attention et le bouton principal sont dans le même jaune. Le primaire paille suit DESIGN.md (`button-primary`), mais le niveau ne se lit plus seul ;
- « garde à 18 °C » : une garde se fait d'ordinaire à froid ;
- l'accueil à J+4 montre « DF 1,012 » : c'est cohérent tant que la réponse info « vers 1,020 à J+4 » n'est pas dessinée (voir p2b, défaut 1).

Les défauts de s3b en v0 sont corrigés : tuiles entières, légende de la pile lisible, Citra J+2 marqué « fait », bas de la réponse rempli.

## p2b — REJET : 1 absurdité métier, 1 valeur fausse, 1 texte coupé, 7 défauts mineurs

Phrase prédite du brasseur : « J'ai déjà 1,012 à J+4 et il me dit "vers 1,020 à J+4" ? Et le Citra de J+2, je l'ai mis il y a deux jours. Le reste est propre, la règle de temps est juste. »

1. **erreur**, en clair et en cave : l'écran est à J+4 et la réponse info dit « Densité à J+4 : vers 1,020 » et « le Citra de J+2 se fait pendant cette activité ». Or l'accueil (« Fermentation J+4 · DF 1,012 », Citra J+2 85 g fait) et le journal du bureau (« J+4 · 09:10 DF 1,012 ») disent le contraire. C'est une absurdité métier (« Sens métier, avant le visuel » ; L14 bis), la contradiction déjà relevée par p2c. Correction : reprendre la décision acceptée par le pilote. L'accueil, l'attente et l'erreur passent à J+1 (36 h à 19 °C) ; la question « DF 1,012 : la levure a fini ? » devient « Densité à J+4 : la levure a fini ? » ; la DF 1,012 sort de l'accueil et de la carte de fermentation. Au bureau, le journal suit J+4 « Densité 1,020 », puis J+6 « DF 1,012 ».
2. **accueil** (« Tourne ailleurs ») et **conversations** : « Brassin 31 · Blonde de garde » apparaît sous l'en-tête Brassin 31 · New England IPA, soit le même numéro pour deux bières. Correction : « Brassin 30 ».
3. **bureau**, en clair et en cave : la pile du dry hop est coupée en « Galax » et « Mos », un texte coupé à 1280. Correction : donner à la pile toute la largeur du panneau, sur sa propre ligne, au-dessus des totaux, comme à 390.
4. **bureau** : environ 300 px vides sous le journal, au-delà du plafond de 120. La largeur ne sert pas : y mettre la frise du brassin ou la courbe de densité.
5. **accueil** : « pH visé 5,3 » figure dans la carte de fermentation. 5,3 est un pH d'empâtage ; une bière en fermentation est vers 4,2 à 4,5 (sens métier). Correction : retirer la valeur, ou la remplacer par la densité visée.
6. **erreur** : « Envoyer maintenant » est le bouton principal alors qu'il n'y a pas de réseau, un geste sans effet. Correction : un seul geste, « Envoyer au retour du réseau » (le basculeur actuel), et « Reformuler » en second.
7. **erreur** : le sélecteur de mode « Auto 15–30 s » reste dans le champ pendant la lecture d'une réponse (défaut commun 5). Le cadre reponse, lui, le masque bien.
8. **conversations** :
   - « rien n'est com… » est coupé dans la rangée Stout ;
   - le décompte « 2 prêtes · 1 en cours · 1 à relancer » est écrit deux fois (sous-titre et rangée de pastilles).
9. **reponse** : la question du brasseur est tronquée en « que… », et la pile dessine « Mosaic 35 » en vert alors que la case est décochée.
10. **attente** : les temps des étapes (0:04, 0:41, 1:48) ne disent pas s'il s'agit de durées ou d'heures de départ.

Doute, non compté :
- en cave, les cases, le bouton principal et l'onglet actif sont dans le jaune du niveau Attention (le primaire paille suit DESIGN.md).

Les défauts de s2a en v0 sont corrigés :
- le mode est dans le champ ;
- la règle de durée place 1:00 et 3:00 à leur valeur ;
- Citra est « fait » ;
- la pile avant/après est là ;
- « Déjà calculé » s'affiche pendant l'attente.

## p2c — ACCEPT : 8 défauts mineurs, aucun bloquant

Phrase prédite du brasseur : « Là je vois mon brassin et quand agir, d'un coup d'œil. L'urgent ne se rate pas. Le champ des finances est un peu long, et la liste de l'urgent a deux boutons par ligne. »

Les données sont cohérentes d'un cadre à l'autre :
- J+1 à l'accueil ;
- J+4 « Densité 1,020 », puis J+6 « DF 1,012 » au journal ;
- Brassin 30 pour la blonde ;
- rappel du lundi 16.11 à 09:00 pour J+10 (le 14.11 est J+8, un samedi) ;
- estimation de 4,50 CHF au 30.11, au rythme de 2,10 CHF en 14 jours ;
- Prévenir à 80 %, soit 12,00 CHF.

1. **urgent** : chaque ligne porte une case et un second contrôle (« Fait », un interrupteur, « Noter »), soit deux gestes pour une même chose. C'est peu pratique sous la pression. Garder un seul geste par ligne : la case qui note l'heure, ou le bouton.
2. **urgent** : « >  24  °C » a des espaces doubles en mono (défaut commun 3).
3. **finances** : la frise coupe « 1.11 » contre le bord gauche.
4. **finances** : la question préremplie tient sur 6 lignes, dans une colonne réduite à 60 % du champ par la pastille de mode. Placer la pastille sous le texte et rendre au texte toute la largeur.
5. **reponse**, 390 : la question du brasseur (« Dégustation J+8 : … ») n'est pas affichée. Elle ne se voit qu'au bureau. La remettre en une ligne, repliable, au-dessus du niveau.
6. **zero** : les éléments qui s'effacent sont barrés en rouge, un texte peu lisible. Une croix devant chaque ligne suffit.
7. **fournisseurs** : « toi- / même » est coupé en fin de ligne.
8. **accueil** : la mini-jauge de 2,10 sur 15 CHF fait 1 px de haut à peine. Elle ne se lit pas : 3 px au moins.

Doute, non compté :
- en cave, les cases et le bouton principal sont dans le jaune du niveau Attention. Ce jaune suit le `button-primary` de DESIGN.md, mais je le signale au pilote.

Les défauts de s2d en v0 sont corrigés :
- plus de superposition « 2 j de marge » (D164) ;
- Citra n'est plus proposé ;
- les bas des cadres sont remplis (111 px au plus) ;
- les barres passées restent visibles en cave ;
- l'urgent est dessiné, dans une forme différente d'Attention.
