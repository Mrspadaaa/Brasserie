# e2 — Une seule règle en litres (série e, l'échelle du matériel)

- **Chaleur** : froide (le formulaire de la baseline gardé, libellés à gauche ; le bloc « Choix pour ce brassin » et
  « Matériel du plan » refondus en un seul bloc dessiné).
- **Axes** : A2 (fermenteur et cuve en barres, le conseil marqué), A6 (le bouton d'import retiré du corps : l'icône de
  l'en-tête fait la même chose, J9), A3 (repères du style dépliés en trois plages, chiffres une fois).
- **L'idée** : cuve et fermenteur sur une même règle de 0 à 45 L : le fermenteur est visiblement plus court que la cuve,
  le moût avant ébullition, la part évaporée, la limite de 35 L et l'espace libre se lisent sur la même graduation.
- **Captures** : `e2-haut.png`, `e2-page.png` ; `etats/neuve.png`, `plein.png`, `nolo.png`, `long.png`, `geste-*.png`.

## Baseline (acquis cochés)
- [x] En-tête commun tel quel (Abandonner absent sur recette neuve, comme l'app).
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel.
- [x] Plancher enrichi : les champs Volume et Ébullition restent des champs (saisie décimale, `inputmode`), le texte
  « 24 / 30 L · 6 L libres. Repère provisoire… » devient la règle, le réglage fin se replie (« Espace libre et rinçage ⌄ »).
- Écart : « Coller une recette trouvée » quitte le corps (doublon de l'icône d'import acceptée, J9, A6).

## Boosters UX (boosters-ux)
- `volume-glisser` — ajuster ; on tire le bout du moût dans la barre du fermenteur ; capture avant 24 L, après 28 L.
- `volume-champ`, `ebullition-champ` — ajuster ; champs décimaux ; la règle suit (cuve ~27 → ~28 L à 90 min).
- `nolo` — choisir ; case de la baseline gardée ; `reperes`, `materiel` — lire ; `etat` — démo des cas limites.
- B1 OK — le geste change l'écran (ETATS OK). B2 OK — dominante : la règle et ses deux barres ; une `primary`.
- B3 OK — 72 mots (MOTS OK). B4 OK — trois groupes : identité, matériel, repères. B5 s.o. (R2 non joué).
- B6 ECHEC voulu — 12, 14, 16 (bandeau commun), 18. B7 OK — contraste et couleurs OK (clair) ; cave non mesuré.
- B8 OK — volume vide → « — » et « volume à renseigner », jamais 0 ; recette neuve à 30 L → « Fermenteur plein » ;
  plein : bord rouge et alerte sous la règle.
- B9 OK — halo or pendant le glisser, mesuré ; mouvement réduit respecté. B10 OK — aucun `type="number"`.
- B11 OK — « 24 L tient dans 30 L, 6 L libres ; ~27 L en cuve sur 45 L » se lit d'un coup d'œil.
- B12 OK — chevron ⌄ unique, rayons de DESIGN.md. B13 s.o. — R5 non joué ; barre glissable de 88 px de haut.

## Contrôles
- PAGE OK ; MOTS OK (72) ; PANEL OK (série) ; e2 rempli à 0,50.
- `controle-commun --sans=mots,au-style,fiche,trait` : standard ECHEC S3 seul (rayons 10/16 de DESIGN.md, voir e1).
- ETATS OK.

## Ce qui tient, ce qui casse
- Tient : la comparaison des deux contenants à la même échelle, sans phrase ; la limite de 35 L est un trait, pas un texte.
- Casse : les barres de 88 px sont massives ; la gradation verticale est discrète ; la règle est un tableau de bord en
  puissance si on y ajoute d'autres lignes (pas de cockpit : deux lignes au plus).
