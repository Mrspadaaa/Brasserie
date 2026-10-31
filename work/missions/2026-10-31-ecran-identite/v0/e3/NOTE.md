# e3 — Deux cuves à la même échelle (série e, l'échelle du matériel)

- **Chaleur** : tiède (la forme de l'approche : le matériel dessiné).
- **Axes** : A2 (fermenteur et cuve dessinés, le conseil marqué dessus), A4 (pas à pas), A5 (interrupteur).
- **L'idée** : la cuve de 45 L et le fermenteur de 30 L dessinés à la même échelle, le brassin qui passe de l'une à
  l'autre : la vapeur sort de la cuve (~3 L), le moût descend au fermenteur, et on glisse son niveau au doigt.
- **Captures** : `e3-haut.png`, `e3-page.png` ; `etats/neuve.png`, `plein.png`, `nolo.png`, `long.png`, `geste-*.png`.

## Baseline (acquis cochés)
- [x] En-tête commun tel quel. [x] Fil des 7 étapes. [x] Bandeau tel quel.
- [x] Plancher enrichi : nom et style sur une rangée ; volume, ébullition, NOLO et état du fermenteur au premier écran ;
  repères du style à un toucher (« 22A repères ⌄ »).
- Écart : l'import quitte le corps (icône d'en-tête, J9).

## Boosters UX
- `volume-niveau` — ajuster ; glisser le niveau dans le fermenteur dessiné ; avant 24 L, après ~29 L (`geste-*`).
- `volume-moins` / `volume-plus` — ajuster ; « − volume + » (le nombre n'est écrit qu'une fois, dans le fermenteur).
- `ebullition-moins` / `ebullition-plus` — ajuster ; la vapeur, la bande bleue et le niveau de la cuve suivent.
- `nolo`, `reperes`, `etat`.
- B1 OK (ETATS OK). B2 OK — dominante : les deux contenants. B3 OK — 54 mots. B4 OK — scène, réglages, options.
- B5 s.o. B6 ECHEC voulu (12, 14, 16 du bandeau, 18). B7 OK (clair). B8 OK — neuve : 30 L dans 30 L, fermenteur bordé
  de rouge et alerte ; plein : idem ; style vide : la puce des repères disparaît.
- B9 OK — fond or sous le doigt pendant le glisser. B10 OK. B11 OK — « ~27 L en cuve, 24 L au fermenteur, 6 L libres ».
- B12 OK. B13 s.o. — zone de glisser : tout le fermenteur (130 × 160 px).

## Contrôles
- PAGE OK ; MOTS OK (54) ; PANEL OK (série) ; rempli à 0,51 ; commun : S3 seul (voir e1) ; ETATS OK.

## Ce qui tient, ce qui casse
- Tient : se lit sans légende, comme un dessin de brasseur ; l'évaporation se voit avant de se lire.
- Casse : la flèche de transfert est décorative ; le bas du premier écran reste vide (146 px) ; le « 35 » de la limite
  demande la légende.
