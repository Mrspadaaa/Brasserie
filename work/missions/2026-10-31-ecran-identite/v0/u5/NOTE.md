# u5 — L'affiche

- **Chaleur** : chaude.
- **Axe** : libre (série u, brief minimal) ; A1 à A6 non lus (consigne du pilote), à classer par lui.
- **Idée** : la bière posée en affiche typographique (style en 72 px, volume et ébullition en 64 px), chaque mot réglable là où il est ; NOLO est un tampon.

## Baseline (hors périmètre, J12 : reprise telle quelle)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème
- [x] Fil des 7 étapes
- [x] Bandeau Grain · OG · IBU · EBC

## Obligatoire
- Honnêteté : le bandeau doré du haut est la teinte de l'EBC 9,5 (pas une mesure de couleur) ; « ≈ 3 L évaporés, repli 10 %/h, estimé » ; cuve « ≈ 27 L » ; « repère 24 L, estimé ».
- Premier écran : nom, style, volume, ébullition, fermenteur, NOLO (tampon). 77 mots (MOTS OK). Aucune phrase.
- Interdits : affiche dans le flux ; tampon de 120 px, contour pointillé au repos : présent sans être un bouton imposant (à juger) ; `type="number"` : 0 ; rien sous 12 px.

## Boosters UX (boosters-ux)
- volume, ebullition — ajuster ; −/+ ronds sous chaque grand chiffre ; la bande du fermenteur suit (31 L → rouge, « +1 L », `u5-apres.png`).
- espace-libre — choisir ; segment 15 / 20 / 25 % ; le repère suit.
- nolo — choisir ; tampon : pointillé gris → vert plein, légèrement plus grand.
- style — choisir ; ⌄ à côté du nom du style.
- B1 OK (TOUCHER OK). B2 OK — dominante : « Double IPA ». B3 OK. B4 OK — une seule affiche découpée en cases. B5 OK. B6 — 5 tailles (72, 64, 20, 14, 12) : au-delà de 3, voulu pour l’affiche. B7 OK. B8 OK. B9 OK. B10 OK.
- B11 — « Une Double IPA, 24 L, 60 min, sans NOLO. » B12 OK. B13 OK.

## Contrôles (sorties)
- PAGE OK ; PANEL OK (série u ; u5 = 0,59) ; MOTS OK (77).
- `controle-commun --sans=mots` : survol, blocs, contraste, standard, parlant, brutes OK ; couleurs, au-style, fiche, trait, legende ECHEC, sans objet ici (contrôles houblons).
- `controle-choix` : sans objet.

## Ce qui tient, ce qui casse
- Tient : frappant (C096), la bière se reconnaît avant les chiffres.
- Casse : trois tailles dépassées ; le tampon peut paraître gadget ; la bordure de 2 px s'écarte du 1 px de DESIGN.md.
