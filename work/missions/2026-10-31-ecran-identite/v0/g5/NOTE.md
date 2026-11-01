# g5 — Une réglette pour tout

- **Série** : g, le geste d'abord. **Chaleur : chaude** (forme libre).
- **Axes** : A4 (réglette à glisser), A2 (le plein du fermenteur hachuré sur la réglette), A5 (interrupteur), A6 (bouton du corps
  retiré).
- **L'idée** : un seul instrument sous le pouce, un ruban gradué sombre qu'on fait glisser, branché sur la grandeur qu'on touche au-dessus :
  Volume, Ébullition ou Espace libre. On choisit quoi, on glisse combien. La grandeur active est lue en grand, une seule fois.

## Baseline (plancher à enrichir)
- [x] En-tête commun, [x] fil des 7 étapes, [x] bandeau : tels quels.
- [x] Nom, style et 22A, repères repliés, volume, ébullition, évaporation, NOLO, fermenteur, cuve, matériel.
- Enrichi : chaque échelle porte ses repères à leur vraie place.
  - Volume : plein à 30, hachures au-delà, tireté du conseil (24, tiré de l'espace libre).
  - Ébullition : 60 et 90 en traits forts, rien de figé (pas de 5 min).
  - Espace libre : tireté au repère de 20 %.
- Une rangée de raccourcis, sous la réglette, l'aimante sur une valeur : « conseil ~24 L », ou « 60 min » et « 90 min ».
- Trois effets lus en cartes : fermenteur (libres), cuve (à chauffer), ébullition (évaporés).
- Retiré : « Coller » dans le corps.

## Honnêteté (J7)
- Le conseil se recalcule depuis l'espace libre réglé (30 × (1 − 20 %) = 24 L) : c'est une conséquence, pas une mesure.
- L'espace libre se lit « ~20 % » et se dit « repère à ajuster ».
- Au-delà de 30 L : « dépasse le fermenteur de 1 L », en rouge (`capture-etat-plein.png`). Volume inconnu : « — » (décrit dans
  l'annexe).

## Boosters UX (boosters-ux)
- `cible-reglette` : choisir ; trois segments. Effet : la réglette change d'échelle et de repères.
- `reglette` : ajuster ; défilement aimanté, une aiguille fixe, `role=slider`. Effet vu : à 32 L, hachures rouges sous l'aiguille et
  « dépasse le fermenteur de 2 L » (`capture-apres.png`).
- `raccourcis` : déclencher ; aimante la réglette, sans animation si le mouvement est réduit.
- `nolo-bascule`, `style-liste`, `reperes-repli`, `materiel-repli`.
- B1 OK : 7 boosters ; captures avant et après différentes.
- B2 OK : le ruban sombre et la lecture de 28 px dominent ; une seule action noire de fond.
- B3 OK : 75 mots.
- B4 OK : choisir, glisser, lire, de haut en bas.
- B5 OK.
- B6 à vérifier : 28, 16 et 13 px, plus 12 px pour les marques du ruban.
- B7 OK : traits clairs sur noir, rouge clair (`alert-strong`) sur le ruban.
- B8 partiel : plein et NOLO capturés ; neuve capturée (`capture-etat-neuve.png`) ; volume inconnu décrit, non dessiné.
- B9 OK : défilement natif.
- B10 OK : 0 `type="number"`.
- B11 OK.
- B12 à vérifier : un ruban sombre en thème clair est une forme nouvelle.
- B13 OK.

## Mesures (recopiées)
- PAGE OK ; MOTS 75 ; remplissage 0,56.
- controle-commun `--sans=mots,fiche,trait,legende,au-style` : tout OK sauf STANDARD (S3 rayons, dont 12 px pour les segments ; S4 +
  commun).

## Ce qui tient, ce qui casse
- Tient : un seul geste à apprendre pour toutes les grandeurs ; le mur du fermenteur se voit et se sent.
- Casse :
  - l'étiquette « plein » est cachée quand l'aiguille est à 30–31 ;
  - les valeurs non actives sont un toucher plus loin ;
  - « à chauffer » passe sur deux lignes dans sa carte.
