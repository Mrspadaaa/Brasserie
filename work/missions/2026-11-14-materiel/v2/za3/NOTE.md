# za3 — zq1 apaisée par les mots (froide : zq1 reprise telle quelle, seuls les mots changent)

Lecture dominante (BRIEF-APAISE, za3) : plus aucun compteur de jours au premier plan. Chaque appareil dit **un verbe et une
date**, sur le ton d'un carnet d'atelier ; ce qui est fait se dit « à jour jusqu'au … ». Le fil, l'échelle, les nœuds, les gestes
et la coque de zq1 sont repris tels quels (copie de `v1/z/zq1/etat.html`, préfixe `zq1-` → `za3-` par split/join, L26).

## Ce qui change par rapport à zq1
1. Pompe : pastille rouge « panne 9 j » → « fuit au raccord · depuis le 05.11 » (la cause d'abord, puis la date).
2. pH-mètre : « retard 3 j » → « étalonner · prévu le 11.11 ».
3. Refroidisseur : « 5/5 brassins » → « détartrer · après 5 brassins ».
4. Densimètre : « jamais étalonné » → « pas encore étalonné » (l'inconnu reste dit, jamais 0, sans ton de reproche).
5. Plus aucune pastille colorée dans les lignes dues : le verbe en encre, la date en gris, séparés par un point.
6. Avenir : « dans 17 j », « dans 36 j »… → la date seule (01.12, 20.12, 28.12, 02.03) ; la distance reste lisible sur l'échelle.
   Le déshumidificateur perd son ambre « proche ».
7. Sous-lignes en verbes : « filtre » → « nettoyer le filtre », « joint du robinet » → « changer le joint ».
8. Fiche : « retard 3 j » en 22 px mono ambre → « À étalonner · prévu le 11.11 » en 20 px encre ; « dans 30 j » retiré du
   prochain étalonnage (14.12 suffit).
9. Traiter (après Étalonné) : « descend au 14.12 » → « ✓ pH-mètre à jour jusqu'au 14.12 » ; bandeau « Étalonné · à jour
   jusqu'au 14.12 · Annuler » ; la ligne déplacée montre « 14.12 » au lieu de « dans 30 j ».
10. Ajout : « sur le fil 01.02 · dans 79 j » → « prochain le 01.02 ».
11. 1280 : « dans 17 j · 01.12 » → « 01.12 » ; le segment ambre « en retard » du fil du pH-mètre devient un pointillé gris.

Emprunt à za1 (un seul) : le chiffre de « À traiter 4 » passe du rouge à l'encre. Le rouge ne reste que sur le nœud de la pompe en
panne (seule vraie alarme) et le début du rail.

## Ce qui est gardé (zq1, sa maquette retenue)
Coque de l'app identique ; fil vertical à sa vraie distance (3,5 px/j), point « aujourd'hui 14.11 », bande « 30 j », coupure ;
gestes Réparée / Étalonner / Fait / Étalonner à 44 px à droite de chaque ligne ; Tout 13 · À traiter 4, loupe, Achat ; grille
« sans échéance 5 » ; Déjà possédé, Projets, « 1 739 CHF · 2 prix connus » ; fiche du pH-mètre en fil (rincer / pH 7 / pH 4 /
ranger, flacons, tampons lus, écarts, historique, rythme, état, dépenses reliées « 37,40 CHF · 2 prix connus », Démo) ;
états traiter, ajout, vide, 1280 ; toutes les données et dates de zq1.

## Mesures (repos 390, script puppeteer)
- 43 mots au premier écran hors noms (≤ 60 ; zq1 : 52) ; 0 texte < 12 px ; 0 débordement de ligne ; 0 `type="number"`.
- Dates vérifiées depuis le 14.11.2026 : pH-mètre prévu 11.11 (11.10 + 1 mois), déshumidificateur 01.12, frigo 20.12,
  réfractomètre 28.12, cuve 02.03.2027, pompe en panne depuis 05.11, pH-mètre étalonné → 14.12.

## Boosters UX (boosters-ux)
- Boosters repris de zq1 (data-booster) : fil-echeances, echelle-temps, frise-30-jours, filtre-a-traiter, reparee, etalonner,
  fait, achat, deja-possede, projets, valeur-parc, fil-appareil, prochain, enregistrer-etalonnage, annuler, voir-tout, apercu-fil.
- B3 OK — 43 mots. B6 OK — dates en Plex Mono, verbes en Source Sans, rien < 12 px. B7 — une seule couleur d'alerte (rouge,
  pompe) ; contraste non mesuré. B8 OK — « pas encore étalonné », « date et prix inconnus », « 2 prix connus ». B11 — phrase :
  « La pompe fuit depuis le 05.11, le pH-mètre est à étalonner depuis le 11.11, le reste suit au calendrier. » B2, B4, B5,
  B9, B10, B12, B13 : hérités de zq1, non remesurés.

## Prédiction
« Là je lis ce que j'ai à faire sans avoir l'impression d'être en retard partout — mais il me faut encore le nombre de jours
quelque part, dans la fiche. »

Limite : sans le compteur, l'urgence relative se lit moins vite (05.11 contre 11.11) ; la position sur le fil et l'ordre de tri
la portent.
