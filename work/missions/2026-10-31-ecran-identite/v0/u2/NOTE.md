# u2 — Les trois questions

- **Chaleur** : froide (les champs actuels, rangés autrement).
- **Axe** : libre (série u, brief minimal) ; A1 à A6 non lus (consigne du pilote), à classer par lui.
- **Idée** : l'écran suit la question de l'outil, mot pour mot : 1 Quelle bière ? 2 Combien ? 3 Comment ? Le nom vient après le style (J2).

## Baseline (hors périmètre, J12 : reprise telle quelle)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème
- [x] Fil des 7 étapes
- [x] Bandeau Grain · OG · IBU · EBC

## Obligatoire
- Honnêteté : « ≈ 3 L évaporés, estimé » ; « Cuve 45 L, avant ébullition ≈ 27 L estimé » ; repère « estimé ». Plages BJCP 22A réelles (OG 1,065–1,085, IBU 60–100).
- Premier écran : nom, style, volume, ébullition, NOLO, fermenteur ; 79 mots (MOTS OK) ; aucune phrase explicative.
- Interdits respectés ; `type="number"` : 0 ; rien sous 12 px.

## Boosters UX (boosters-ux)
- volume — ajuster ; gros pas à pas ; barre du fermenteur ; vu : 31 L → « 1 L de trop », barre rouge (`u2-apres.png`).
- espace-libre — choisir ; segment 15 / 20 / 25 % ; « N L conseillés » et le repère pointillé suivent.
- ebullition — ajuster ; pas de 5′ ; évaporation et barre de cuve suivent.
- nolo — choisir ; interrupteur. style — choisir ; sélecteur ⌄.
- B1 OK (TOUCHER OK). B2 OK — dominante : « 24 L » à 64 px. B3 OK — 3 groupes, 79 mots. B4 OK — groupes = les trois questions, numérotés, reliés.
- B5 OK. B6 OK — 3 tailles de lecture, mesures en Plex Mono. B7 OK (contraste via commun). B8 OK — dépassement dessiné. B9 OK — `:active`, mouvement réduit.
- B10 OK. B11 — « Une Double IPA, 24 L dans un fermenteur de 30, 60 min. » B12 OK (`controle-standard`). B13 OK — cibles ≥ 32 px.

## Contrôles (sorties)
- PAGE OK ; PANEL OK (série u, médiane 0,57 ; u2 = 0,54) ; MOTS OK (79).
- `controle-commun --sans=mots` : survol, blocs, contraste, standard, parlant, brutes OK ; couleurs, au-style, fiche, trait, legende ECHEC, contrôles des écrans houblons, sans objet ici (ni houblon ni famille).
- `controle-choix` : sans objet (pas de maquette choisie pour Identité).

## Ce qui tient, ce qui casse
- Tient : se lit comme la question ; le brasseur sait où il en est.
- Casse : le fil numéroté prend une colonne de 40 px ; la cuve répète un peu le fermenteur.
