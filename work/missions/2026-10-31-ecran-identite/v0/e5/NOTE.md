# e5 — Le cadran d'ébullition (série e, l'échelle du matériel)

- **Chaleur** : chaude (forme libre).
- **Axes** : A4 (ébullition en cadran tournant, pas de 5 min), A5 (NOLO en pastille à côté du style), A2 (deux tuiles de
  contenants en bas), A1 (nom en titre éditable sur place).
- **L'idée** : on tourne la durée d'ébullition comme un minuteur ; au centre, la cuve en coupe montre ce qui part en
  vapeur (bande bleue) ; les contenants vivent dessous en deux tuiles.
- **Captures** : `e5-haut.png`, `e5-page.png` ; `etats/*.png` (`geste-apres.png` : 90 min, ~4 L évaporés).

## Baseline (acquis cochés)
- [x] En-tête commun tel quel. [x] Fil des 7 étapes. [x] Bandeau tel quel.
- [x] Plancher enrichi : les six éléments du premier plan (J4) présents ; « 3 L évaporés » devient un dessin réglable.
- Écart : la durée prend la place dominante, parce que c'est l'idée de ce concept (le temps qui change le volume).

## Boosters UX
- `ebullition-cadran` — ajuster ; tourner la poignée, pas de 5 min, 0 à 120 ; avant 60 min, après 90 min et ~4 L.
- `ebullition-moins` / `ebullition-plus` — ajuster ; même cadran.
- `volume-jauge`, `volume-plus` / `volume-moins` — ajuster ; mini fermenteur glissable ; `nolo` — choisir (pastille) ;
  `style` — ouvrir la liste ; `etat`.
- B1 OK (ETATS OK). B2 OK — dominante : le cadran. B3 OK — 55 mots. B4 OK — identité, temps, contenants.
- B5 s.o. B6 ECHEC voulu — 12, 14, 16 (bandeau), 18, 28 (lecture de la durée). B7 OK (clair).
- B8 OK — plein : tuile du fermenteur bordée de rouge et alerte ; ébullition à 0 : aucun arc, ~0 L.
- B9 OK — classe `e5-tient` pendant le geste ; au-delà de 120 min, l'arc reste plein (lecture « ≥ ») — à affiner.
- B10 OK. B11 OK — « 60 min, ~3 L évaporés, ~27 L en cuve, 24 L au fermenteur ».
- B12 OK. B13 s.o. — poignée de 26 px, mais toute la couronne répond au doigt ; pas de 32 px.

## Contrôles
- PAGE OK ; MOTS OK (55) ; PANEL OK (série) ; rempli à 0,61 ; commun : S3 seul ; ETATS OK.

## Ce qui tient, ce qui casse
- Tient : le lien temps → évaporation devient physique ; c'est le seul concept de la série où l'ébullition est l'objet.
- Casse : le cadran donne beaucoup de place à une valeur souvent laissée à 60 min ; le volume, plus important, est petit.
