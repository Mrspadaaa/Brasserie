# NOTE s1e2 — La courbe pointe le geste, passe 2 (série A)

Chaleur : chaude (forme de s1e gardée : épingles ① à ④ sur l'axe, cartes en escalier sous la courbe).
Base : `voies/s1/s1e/etat.html`, préfixe `s1e2-`.

## Défauts de s1e (t1) corrigés
1. Marches de consigne calées : 19 °C jusqu'à J+6, 21 °C de J+7 à J+9, 2 °C dès J+10 (marches sous ③ et ④, en 390 et 1280).
2. « 1,018 » posé à gauche de son point, hors de la ligne du jour ; 1,030 chiffré aussi.
3. Stock, Carnet, Dossier : boutons de 44 px, icône et mot.
4. Trait parasite (x 20, y 690) retiré : le raccord ne part plus de la première carte.
5. ③ et ④ n'ont plus de « Réglé » actif à J+5 : « dans 2 j · à régler », « dans 5 j · si stable ».
6. Bas rempli : premier écran sans bande vide de plus de 80 px (hauteur 844 au repos).

## Greffes reçues
- Densimètre dans la colonne J+5 (s1c) : piste verticale de l'OG à la bande, graduée, case FG, dernière valeur en pointillé, « densité — ».
- Cases °C cuve par jour face à /19, J+5 « — » encadré, futures en pointillé colorées par phase (s1c).
- Tuiles par houblon Citra 100 g, Mosaic 80 g « réservé » + « 7,5 g/L sur 24 L » + « Ajouté aujourd'hui » (s2c).
- Barre des phases Fermenter J+5 · Repos 16.11 · Garde 19.11 · Cond. (s2a).
- ④ posé sur son seuil : la pastille Garde est sur la bande FG à J+10 (s2d).
- Dry hop au geste : « fait sam. 14.11 · J+5 · J+6 barré · 1 j d'avance », « sorti du stock », « stock −180 g », Annuler (s3d).
- Goutte ② déplacée de J+6 (cercle barré) à J+5 (s1d).
- Liste : « Mes cuves » sur un calendrier commun 26.10 → 21.11, phases en bandes, ligne du jour (s1b) ; Pale Ale en retard en tête, « Brasser / Replanifier ».

## Baseline
- [x] geste m2 : toucher « Relever », piste 15–23 avec bande 18–20, ±0,1, valeur 19,2 tapable à un toucher
- [x] grammaire z1 : en-tête de lot, cartes, relevés du jour
- [x] J+5 · levuré le 09.11
- [x] deux températures : °C cuve face à consigne (cases, courbe) ; échantillon « éch. 20,5 °C » devant 1,018 au repos, et au tableau des relevés en 1280
- [x] FG en bande 1,010–1,014 ; inconnu « — »
- [x] dry hop nommé, dosé, daté ; « Ajouté aujourd'hui » date et sort du stock
- [x] pas de cockpit ni bandeau d'alerte ; atténuation 71 % et alcool 5,8 % « provisoires »

## Boosters UX
- courbe-gestes (suivre), densimetre (ajuster, piste verticale), releve-cuve + curseur + pas + valeur (ajuster, m2), dryhop (déclencher), phases (suivre), cases-cuve (comparer), calendrier, retard (déclencher).
- B13 : aucun bouton visible sous 44 px (script de capture, `petits=[]` sur les six images).

## Captures (ouvertes)
repos, geste, dryhop, liste 390 clair ; repos 390 cave ; repos 1280 clair.
Restes de la reprise corrigés : liste à 4 repères de date (01.11, 08.11, 14.11, 21.11), rangées de 80 px et une ligne Clos de plus (bas plein) ; 1280, courbe ramenée à 600 px et tableau « Relevés de densité · échantillon » sous les boutons (colonne droite pleine) ; °C d'échantillon rendu au repos. Repère 1,020 retiré à 390 (il heurtait « éch. 20,5 °C »).
