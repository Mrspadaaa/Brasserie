# zq1 — Le fil des échéances (tiède)

Idée : la liste est un fil du temps vertical ; au-dessus d'« aujourd'hui 14.11 », ce qui est dû, avec son geste en un toucher ; dessous, les échéances à leur vraie distance (échelle 1,8 px/j, mois marqués) ; puis l'inventaire sans échéance.

- Problèmes résolus : P1 (À traiter · 3 compté sur les échéances), P2, P3 (Fait / Étalonner / Réparée sur la ligne), P4 (cause et durée de panne visibles), P5 (13 appareils au premier écran, aucun défilement interne), P7, P8 (aucun EQ-), P11 (fiche à lire : son propre fil), P12 (dépenses reliées dans le fil), P15 (Achat visible, 32 px), P17 partiel, P19, P20 (pas de pastille Neuf/Bon en liste), P21 (badges courts), P22 (valeur du parc sur 2 prix connus), P28 (tri par échéance). Parcours : M1, M2, M3 (en partie), M4, M5, M10.
- Champs neufs : dernier entretien fait (date), rythme (semaine, mois, 3 mois, brassin), échéance calculée, étalonnage (valeur lue par tampon, écart, tolérance ±0,05), panne depuis (05.11), compteur de brassins depuis le dernier détartrage (5/5).
- Données : toutes calculées depuis le 14.11.2026 (pH-mètre 11.10 + 31 j = 11.11, retard 3 j ; déshumidificateur 01.09 + 3 mois = 01.12, 17 j ; frigo 20.06 + 6 mois = 20.12, 36 j ; réfractomètre 28.09 + 3 mois = 28.12, 44 j ; cuve 02.03.2026 + 1 an = 02.03.2027, 108 j). Rythmes et dates de ces 5 lignes : fictifs plausibles. Dépense « Tampons » : Démo. Parc : 1 450 + 289 = 1 739 CHF, sur 2 prix connus.
- Acquis écartés : la pastille d'état quitte la liste (P20 : « Neuf » ne dit rien d'utile) ; l'état reste dans la fiche, segment à 4 valeurs. « Matériel déjà possédé » et « Projets d'équipement » passent dans le ⋯ (un toucher de plus).
- Écart : bouton « Étalonner » ouvre la fiche (il faut des valeurs lues), pas un geste en un toucher.

## Boosters UX (boosters-ux)
- fil-echeances, echelle-temps : suivre ; rail et position à l'échelle ; quand, sans lire de date.
- filtre-a-traiter, fait, reparee, etalonner, achat : déclencher en un toucher depuis la ligne.
- fil-appareil, etalonnage, rythme, etat, depenses-reliees, payer-entretien, enregistrer-etalonnage (fiche).
- Mesures v0 : 52 mots au premier écran hors noms (≤ 60) ; 0 texte < 12 px ; 0 `type="number"` ; 16 `data-booster`. B2 à B13 : non mesurés en v0 (recettes R1 à R6 en passe 2).
