# u6 — Les molettes

- **Chaleur** : chaude.
- **Axe** : libre (série u, brief minimal) ; A1 à A6 non lus (consigne du pilote), à classer par lui.
- **Idée** : quelle bière, combien, comment, sur trois molettes côte à côte (style, litres, minutes), lues sur une seule bande dorée.

## Baseline (hors périmètre, J12 : reprise telle quelle)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème
- [x] Fil des 7 étapes
- [x] Bandeau Grain · OG · IBU · EBC

## Obligatoire
- Honnêteté : évaporation « estimée », cuve « estimé » ; styles réels (BJCP 2021 : American IPA 21A, Specialty IPA 21B, Hazy IPA 21C, Double IPA 22A, American Strong Ale 22B abrégé « Strong Ale », Imperial Stout 20C).
- Premier écran : nom, style, volume, ébullition, NOLO, fermenteur. 80 mots, au plafond (MOTS OK). Molettes fenêtrées à 7 crans, pour que le compte ne lise que ce qui se voit.
- Interdits : pas de superposition (la bande de lecture est derrière les chiffres, pas dessus) ; `type="number"` : 0 ; rien sous 12 px.

## Boosters UX (boosters-ux)
- molette-style, molette-volume, molette-ebullition — choisir et ajuster ; glisser vertical (un cran par 34 px), toucher d'un cran, molette de souris, flèches ; vu : glisser de 7 crans → 31 L, fermenteur rouge « 1 L de trop », cuve ≈ 34 L (`u6-apres.png`).
- espace-libre — choisir ; segment 15 / 20 / 25 %. nolo — interrupteur.
- B1 OK (TOUCHER OK). B2 OK — dominante : le bloc sombre des molettes et sa bande dorée. B3 OK — 80 mots. B4 OK — choisir (molettes) / lire (carte). B5 OK. B6 OK. B7 OK (contraste via commun). B8 OK. B9 OK — glisser avec équivalent au toucher et au clavier.
- B10 OK. B11 — « Double IPA, 24 L, 60 min ; 6 L libres. » B12 OK. B13 OK — crans de 34 px.

## Contrôles (sorties)
- PAGE OK ; PANEL OK (série u ; u6 = 0,60) ; MOTS OK (80).
- `controle-commun --sans=mots` : survol, blocs, contraste, standard, parlant, brutes OK ; couleurs, au-style, fiche, trait, legende ECHEC, sans objet ici (contrôles houblons).
- `controle-choix` : sans objet.

## Ce qui tient, ce qui casse
- Tient : les trois réponses se lisent sur une seule ligne ; geste connu du téléphone.
- Casse : une molette de styles devient longue au-delà de 6 styles (il faudra un filtre) ; le bloc sombre en thème clair est un écart à valider.
