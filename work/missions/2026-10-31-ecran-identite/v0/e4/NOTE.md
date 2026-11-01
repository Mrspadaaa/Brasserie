# e4 — Le fermenteur en colonne (série e, l'échelle du matériel)

- **Chaleur** : tiède (la forme de l'approche, une composition en deux colonnes).
- **Axes** : A2 (jauge du fermenteur, grande, le conseil dessus), A4 (pas à pas avec lecture en grand), A5.
- **L'idée** : le formulaire à gauche, le fermenteur de 30 L debout à droite sur toute la hauteur, gradué tous les 5 L ;
  un trait relie la lecture « 24 L » au niveau du moût, et les bulles au-dessus sont l'espace libre pour la mousse.
- **Captures** : `e4-haut.png`, `e4-page.png` ; `etats/*.png`.

## Baseline (acquis cochés)
- [x] En-tête commun tel quel. [x] Fil des 7 étapes. [x] Bandeau tel quel.
- [x] Plancher enrichi : nom, style, volume, ébullition, cuve, NOLO dans l'ordre de la baseline ; le fermenteur devient
  l'instrument de la page. Import retiré du corps (J9).

## Boosters UX
- `volume-colonne` — ajuster ; glisser le niveau dans la colonne ; avant 24 L, après ~27 L (`geste-*`).
- `volume-moins` / `volume-plus`, `ebullition-moins` / `ebullition-plus` — ajuster ; la cuve (barre fine) suit.
- `nolo`, `materiel` (espace libre visé et repères du style, repliés), `etat`.
- B1 OK (ETATS OK). B2 OK — dominante : la colonne or. B3 OK — 72 mots. B4 OK — le trait relie la valeur au niveau.
- B5 s.o. B6 ECHEC voulu — 12, 14, 16 (bandeau), 28 (lecture prioritaire, permise par DESIGN.md « display »).
- B7 OK (clair). B8 OK — plein : colonne bordée de rouge, « plein », alerte ; neuve : idem à 30 L ; cuve hors limite visible.
- B9 OK — halo or pendant le glisser. B10 OK. B11 OK — « 24 L, 6 L libres, 20 % ; 60 min ; ~27 L sur 45 L ».
- B12 OK. B13 s.o. — colonne de 104 × 430 px, pas de 32 × 32.

## Contrôles
- PAGE OK ; MOTS OK (72) ; PANEL OK (série) ; rempli à 0,64 ; commun : S3 seul ; ETATS OK.

## Ce qui tient, ce qui casse
- Tient : la plus grande lecture du fermenteur de la série, densité sans texte ; la mousse a enfin une place visible.
- Casse : la colonne prend un tiers de la largeur, les champs à gauche sont étroits (un nom long se tronque) ; le trait
  de liaison peut paraître technique.
