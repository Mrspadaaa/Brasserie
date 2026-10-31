# g4 — Les molettes

- **Série** : g, le geste d'abord. **Chaleur : tiède** (la forme de l'approche : un pouce qui fait défiler).
- **Axes** : A2 (le fermenteur dessiné dans la molette même), A4 (molettes, valeur libre par 1 L et par 5 min), A5 (interrupteur), A6
  (bouton du corps retiré).
- **L'idée** : volume et ébullition sur deux molettes côte à côte, qu'on fait défiler d'une chiquenaude. La molette du volume est
  le fermenteur :
  - les plus grands volumes en haut ;
  - le moût en gris sous la valeur ;
  - au-dessus du repère, la zone ambre ;
  - le trait rouge « plein » au-dessus de 30, puis les hachures.
  On voit la limite avant de l'atteindre.

## Baseline (plancher à enrichir)
- [x] En-tête commun, [x] fil des 7 étapes, [x] bandeau : tels quels.
- [x] Nom, style et 22A, repères repliés, volume, ébullition, évaporation, NOLO, fermenteur, matériel.
- Enrichi :
  - les limites du fermenteur sur l'échelle même : repère ~20 % en tireté, plein, hachures au-delà ;
  - des points gris aux durées usuelles (60 et 90 min) ;
  - « 6 L libres sur 30 » et « ~3 L évaporés » sous chaque molette.
- Retiré : « Coller » dans le corps.

## Honnêteté (J7)
- Le repère est un tireté ; la zone ambre dit « au-dessus du repère provisoire », pas « interdit ». L'évaporation porte le « ~ ».
- Recette neuve (`capture-etat-neuve.png`) :
  - pas de bandeau, pas d'Abandonner ;
  - nom vide, « Choisir un style » ;
  - 30 L par défaut dans un fermenteur de 30 L, donc « plein » dès l'ouverture : le constat de l'inventaire, montré tel quel.

## Boosters UX (boosters-ux)
- `volume-molette` : ajuster ; défilement aimanté par 1 L, la valeur choisie sur une bande noire. Effet vu : à 31 L, la valeur passe
  au rouge et « dépasse de 1 L » s'affiche (`capture-apres.png`, `capture-etat-plein.png`).
- `ebullition-molette` : ajuster ; pas de 5 min de 0 à 150 min. Effet : l'évaporation se recalcule.
- `nolo-bascule` : choisir. `style-liste`, `reperes-repli`, `materiel-repli` : déclencher.
- B1 OK : 6 boosters ; captures avant et après différentes.
- B2 OK : la bande noire domine ; « Suivant » est la seule action.
- B3 OK : 75 mots ; les rangs hors de la fenêtre sont masqués.
- B4 OK.
- B5 OK.
- B6 à vérifier : 28 px pour la valeur choisie, 16 px pour les voisines, 13 px pour les libellés.
- B7 OK : contraste OK une fois le noir posé sur la rangée même (le premier essai : 1,09:1 mesuré sur le fond de la rangée).
- B8 OK : plein (31 L), neuve, NOLO coché (paramètre `?nolo=1`).
- B9 à vérifier : défilement natif ; aucune animation à l'ouverture.
- B10 OK : 0 `type="number"` ; au toucher de la valeur centrale, la saisie exacte (décrite, pas dessinée).
- B11 OK : « 24 L, 60 min, 6 libres » se lit d'un coup d'œil.
- B12 à vérifier : une molette est un geste nouveau dans l'app.
- B13 OK : rangées de 32 px, molettes au clavier (`role=listbox`).

## Mesures (recopiées)
- PAGE OK ; MOTS 75 ; remplissage 0,61.
- controle-commun `--sans=mots,fiche,trait,legende,au-style` : tout OK sauf STANDARD (S3, S4 + commun).

## Ce qui tient, ce qui casse
- Tient : la plus « frappante » des tièdes ; elle répond à « combien » et montre le mur du fermenteur au même endroit.
- Casse :
  - la molette d'ébullition n'a pas d'échelle propre (seulement deux points) ;
  - les deux molettes ne vont pas dans le même sens de lecture : en haut, plus de litres et plus de minutes, ce qui est cohérent, mais
    inhabituel ;
  - une molette est moins précise qu'un champ pour une valeur lointaine.
