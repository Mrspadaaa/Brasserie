# u3 — Six tuiles

- **Chaleur** : tiède.
- **Axe** : libre (série u, brief minimal) ; A1 à A6 non lus (consigne du pilote), à classer par lui.
- **Idée** : une tuile par réponse ; la tuile est le contrôle, sa valeur en grand ; le style en tête, en noir.

## Baseline (hors périmètre, J12 : reprise telle quelle)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème
- [x] Fil des 7 étapes
- [x] Bandeau Grain · OG · IBU · EBC

## Obligatoire
- Honnêteté : évaporation, cuve et repère marqués « estimé » ; le fermenteur dessiné rempli à la teinte de l'EBC (9,5), jauge sans graduation inventée.
- Premier écran : style, volume, ébullition, fermenteur, NOLO, espace libre, cuve ; le nom en bas (J2 : il peut venir après), visible. 75 mots (MOTS OK).
- Interdits respectés ; `type="number"` : 0 ; rien sous 12 px.

## Boosters UX (boosters-ux)
- volume, ebullition, espace-libre — ajuster ; −/+ larges au bas de la tuile ; vu : 31 L → cuve rouge, « 1 L de trop » (`u3-apres.png`).
- nolo — choisir ; la tuile entière est l'interrupteur (verte quand l'objectif est pris).
- style — choisir ; la tuile noire ouvre la liste ; plages OG et IBU dessus.
- B1 OK (TOUCHER OK). B2 OK — dominante : la tuile noire du style. B3 OK — 8 tuiles, 75 mots. B4 OK — grille 2 colonnes, pas de carte dans une carte.
- B5 OK. B6 OK. B7 OK (contraste via commun). B8 OK. B9 OK. B10 OK. B11 — « Double IPA, 24 L, 60 min, 6 L libres, sans NOLO. » B12 OK (`controle-standard`). B13 OK — boutons de 44 px.

## Contrôles (sorties)
- PAGE OK ; PANEL OK (série u ; u3 = 0,56) ; MOTS OK (75).
- `controle-commun --sans=mots` : survol, blocs, contraste, standard, parlant, brutes OK ; couleurs, au-style, fiche, trait, legende ECHEC, sans objet ici (contrôles houblons).
- `controle-choix` : sans objet.

## Ce qui tient, ce qui casse
- Tient : tout se lit d'un coup d'œil, tout se règle sur place.
- Casse : grille de tableau de bord, proche du cockpit si on y ajoute une tuile ; le nom tombe tout en bas.
