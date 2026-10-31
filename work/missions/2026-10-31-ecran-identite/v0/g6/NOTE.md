# g6 — L'anneau du pouce

- **Série** : g, le geste d'abord. **Chaleur : chaude** (forme libre).
- **Axes** : A2 (le fermenteur est l'anneau), A4 (rotation), A5 (interrupteur), A6 (bouton du corps retiré).
- **L'idée** : deux anneaux concentriques que le pouce fait tourner, sans viser un champ :
  - l'anneau extérieur est le fermenteur (0 à 30 L, puis une zone hachurée au-delà) ;
  - l'anneau intérieur est l'ébullition (0 à 120 min).
  Au centre, la réponse : 24 L, 6 L libres, 60 min, ~3 L évaporés.

## Baseline (plancher à enrichir)
- [x] En-tête commun, [x] fil des 7 étapes, [x] bandeau : tels quels.
- [x] Nom, style et 22A (pastille noire), repères repliés, volume, ébullition, évaporation, NOLO, fermenteur, cuve, matériel.
- Enrichi :
  - la graduation de 0 à 30, l'arc hachuré « au-delà : plein » ;
  - le tireté du conseil, à 24 L sur l'anneau ;
  - les traits de 60 et 90 min sur l'anneau intérieur ;
  - la barre de la cuve : ~27 L à chauffer sur 45, avec la limite provisoire de 35 L ;
  - l'espace libre, replié.
- Retiré : « Coller » dans le corps.

## Honnêteté (J7)
- La graduation est à sa vraie place (loi 3) : 30 L tombe à la fin de l'arc neutre.
- Le repère et l'évaporation sont marqués (tireté, « ~ »).
- Recette neuve (`capture-etat-neuve.png`) : 30 L par défaut, donc « fermenteur plein » en rouge dès l'ouverture. C'est le constat
  de l'inventaire, non masqué.

## Boosters UX (boosters-ux)
- `anneaux` : ajuster ; glisser sur l'anneau, extérieur pour le volume, intérieur pour l'ébullition. Au clavier, deux `role=slider`
  avec les flèches (pas de 1 L et de 5 min). Effet vu : tiré à 33 L, l'anneau passe au rouge et le centre dit « dépasse de 3 L »
  (`capture-apres.png`).
- `cuve-barre` : lire. `espace-repli`, `nolo-bascule`, `style-liste`, `reperes-repli`, `materiel-repli`.
- B1 OK : 7 boosters ; captures avant et après différentes.
- B2 OK : l'anneau noir domine.
- B3 OK : 74 mots.
- B4 OK.
- B5 à vérifier : environ 90 px vides entre la cuve et l'espace libre.
- B6 à vérifier : 28, 16, 13 et 12 px (les graduations).
- B7 OK. Au-delà de 30, tout l'anneau rougit : fort, mais c'est la seule exception.
- B8 partiel : plein et neuve capturés ; volume inconnu décrit, non dessiné.
- B9 OK : capture du pointeur ; aucune animation.
- B10 OK : 0 `type="number"`.
- B11 OK.
- B12 à vérifier : forme nouvelle dans l'app.
- B13 à vérifier :
  - les boutons de l'anneau font 34 et 24 px ;
  - les anneaux sont proches (40 px entre les centres) ;
  - la prise se fait à la distance du centre, sans chevauchement.

## Mesures (recopiées)
- PAGE OK ; MOTS 74 ; remplissage 0,56.
- controle-commun `--sans=mots,fiche,trait,legende,au-style` : tout OK sauf STANDARD (S3, S4 + commun).

## Ce qui tient, ce qui casse
- Tient : la plus frappante de la série ; le fermenteur est l'instrument, et le pouce le remplit.
- Casse :
  - deux anneaux proches, que les gants peuvent confondre ;
  - précision faible : 1 L ≈ 7°, soit environ 18 px ;
  - le rouge plein est fort ;
  - la cuve à ~37 L dépasse le tireté de 35 L sans le dire.
