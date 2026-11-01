# u4 — Lire en haut, régler en bas

- **Chaleur** : tiède.
- **Axe** : libre (série u, brief minimal) ; A1 à A6 non lus (consigne du pilote), à classer par lui.
- **Idée** : les réponses se lisent en grand en haut ; on touche celle à changer, et un seul pupitre sombre, sous le pouce, la règle.

## Baseline (hors périmètre, J12 : reprise telle quelle)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème
- [x] Fil des 7 étapes
- [x] Bandeau Grain · OG · IBU · EBC

## Obligatoire
- Honnêteté : « ≈ 3 L évaporés, estimé » ; cuve « ≈ 27 L », « estimé » ; zone au-delà de 30 L teintée d'alerte sur la règle ; repère pointillé = remplissage conseillé (repère, pas mesure).
- Premier écran : style, volume, ébullition, espace libre, NOLO, nom ; le fermenteur dans le pupitre (volume choisi au repos). 78 mots (MOTS OK).
- Interdits : le pupitre est dans le flux de la page, pas superposé (D164) ; en-tête fixe ; `type="number"` : 0 ; rien sous 12 px.

## Boosters UX (boosters-ux)
- lire-* — choisir le champ ; la ligne touchée se marque (barre noire à gauche) et le pupitre change (`u4-apres.png` : ébullition).
- regle-volume, regle-ebullition, regle-espace — ajuster ; règle graduée glissée au doigt, plus −/+ ; fermenteur et cuve en barres qui suivent.
- nolo — choisir ; la ligne bascule « NOLO non / oui » au toucher.
- B1 OK (TOUCHER OK). B2 OK — dominante : le pupitre et sa valeur à 40 px. B3 OK — 6 lignes, 78 mots, un seul pupitre. B4 OK — lecture / réglage séparés par la teinte.
- B5 à revoir — un vide d'environ 110 px entre la liste et le pupitre (le pupitre reste collé en bas, au pouce). B6 OK. B7 OK (contraste via commun, pupitre en tons cave). B8 OK. B9 OK — glisser avec équivalent −/+.
- B10 OK. B11 — « Double IPA, 24 L, 60 min, 20 % libre, sans NOLO ; je règle le volume. » B12 OK. B13 OK — −/+ de 48 px.

## Contrôles (sorties)
- PAGE OK ; PANEL OK (série u ; u4 = 0,57) ; MOTS OK (78).
- `controle-commun --sans=mots` : survol, blocs, contraste, standard, parlant, brutes OK ; couleurs, au-style, fiche, trait, legende ECHEC, sans objet ici (contrôles houblons).
- `controle-choix` : sans objet.

## Ce qui tient, ce qui casse
- Tient : un seul geste à apprendre ; les grands chiffres se lisent de loin, au brassage.
- Casse : un toucher de plus pour régler ; le vide au-dessus du pupitre ; le pupitre sombre en thème clair est un écart à valider.
