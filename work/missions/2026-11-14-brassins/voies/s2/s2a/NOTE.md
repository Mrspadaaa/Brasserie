# s2a — série B, le prochain geste d'abord

- Chaleur : froide
- Idée : La file du jour : « Maintenant » (°C cuve, densité) en tête, puis la file datée ou à seuil, la courbe en second.

Boosters : releve-cuve, releve-densite (déclencher) ; dryhop-ajoute, consigne-faite (déclencher) ; seuil-garde (jauge 1,018 → bande) ; courbe (suivre, jalons dry hop et 21 °C sur l'axe J) ; frise-cuve (°C par jour, 14.11 « — ») ; curseur-m2 (ajuster).
Images : repos, geste (feuille m2, °C cuve 19,2), liste (par geste à faire + « Cette semaine »), repos cave, repos 1280 (courbe à gauche, gestes à droite).

## Baseline (cochée)
- [x] geste m2 : piste à bande cible, pouce, ±0,1 / ±0,001, valeur tapée à un toucher (champ role=textbox inputmode=decimal) ; aucun type=number (vérifié au rendu : 0)
- [x] grammaire z1 : en-tête de lot, cartes, relevés du jour ; jetons DESIGN.md clair et cave, rayons 10/16/24
- [x] J+5 · levuré le 09.11 (jours civils)
- [x] deux températures : °C cuve (consigne 19 °C) et °C échantillon (liée à la densité, facultative)
- [x] FG visée en bande 1,010–1,014 ; inconnu = « — » ; ABV et atténuation « provisoires »
- [x] dry hop nommé : Citra 100 g + Mosaic 80 g · J+6 ; « Ajouté » date l'ajout et sort du stock en un geste
- [x] premier plan actionnable ; stock, carnet, note à un toucher ; ni cockpit, ni bandeau, ni code interne, ni secondes
- [x] cibles ≥ 44 px
- Valeur du geste (19,2 °C ou 1,016) : saisie simulée du scénario, pas une donnée du brassin ; atténuation et alcool qui en découlent sont calculés (formule 131,25) et dits provisoires.

## Contrôles (sorties recopiées)
- controle-panel (10 captures repos+geste de la série) : remplissage médian 0,50, 5 sous 0,50 ; ressemblance 0,82 ; doubles 0 % → PANEL ECHEC (remplissage).
- controle-commun --profil=sans-houblons --sans=mots : COMMUN ECHEC 6 contrôle(s), l'outil échoue à la navigation (page.goto, controle-valeurs-brutes.mjs:26) sur ces pages autonomes : non concluant, à rejouer.
- --sans=mots : v0, mots non plafonnés (consigne du concepteur).

## Écarts assumés
- Mots non comptés (--sans=mots), v0.
- Remplissage du premier écran sous 0,55 (bas d'écran vide) : à corriger en passe 2.
