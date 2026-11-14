# rq3 — tiède : le mois qui vient, en frise, puis le tableau des échéances

Idée : une frise des 10 derniers et 30 prochains jours (panne, retard, dû, puis déshumidificateur 6 j et frigo 17 j), un segment
« Par échéance / Par rayon » comme Étagère / Recompter, et un tableau date · matériel · jours. Valeur d'achat du parc en pied
(1 739 CHF sur 2 prix connus, jamais un total inventé). Fiche : cadrans d'étalonnage (loupe sur ±0,10).

- Problèmes résolus : P1, P2, P3, P4, P7 (13 lignes au premier écran), P8, P11, P12, P15 (achat en haut), P21, P22 (valeur des prix
  connus), P28. M1, M4 (cadrans lu contre attendu), M5, M6 (sans valeur comptable inventée pour le pH-mètre, non immobilisé), M10.
- Champs neufs : comme rq1.
- Acquis écartés : rayons pliables (accessibles par le segment « Par rayon », non dessiné en v0).
- Contrôles : COMMUN OK ; MOTS 33.

## Passe 2

Défauts corrigés (critique/SYNTHESE.md, ### rq3) :
- D1 : « panne 9 j », « retard 6 j » en toutes lettres, partout (frise, tableau, fiche) ; « dans 6 j » pour l'avenir. L'unité « j » sort de la chasse fixe (plus de grand blanc « 9  j »).
- D2 : date toujours à gauche (« — » si jamais faite), état et compteur à droite (« dû · 5 brassins sur 5 », « jamais étalonné »).
- D3 : picto de rayon à la place du carré de couleur ; « passé » écrit sous les hachures ; chaque teinte porte son mot (panne, retard, dû, jamais étalonné).
- D4 : cadrans remplacés par « Écart aux tampons » : une règle de tolérance ±0,10 par tampon, dérive des 4 derniers étalonnages, légende (08.10, 3 précédents, tolérance) et verdict « 4 étalonnages sur 4 dans la tolérance ».
- D5 : historique complet (08.10 ×2, 09.09, 07.08, 07.07), badges « date inconnue » et « prix inconnu ». Le fournisseur de jeu d'essai « Démo » retiré.
- D6 : coque de l'app (en-tête 36 px, logo, lune / soleil en cave, sous-navigation Stocks, barre du bas et « + »).

Retouches communes : geste « fait » de 44 px ; densimètre jamais étalonné compté dans « À traiter 4 » ; Achat en haut, Déjà possédé et Projets en pied (et dans la feuille d'ajout) ; aucun mot de développeur ; parc « 1 739 CHF · sur 2 prix connus » (aucun total inventé).

Ajouts : « sans entretien prévu » en puces ; « Utilisé dans 6 brassins · dernier le 10.11.2026 » dans la fiche ; verbe exact sur le bouton (« Étalonné »).

États :
- traiter : puce « À traiter 3 × » active, le pH-mètre touché reste en place, vert et barré, prochain 14.12 ; toast « Annuler » ; frise gardant le passé hachuré ; « Ensuite, dans les 30 jours » en gris.
- ajout : feuille « Nouveau matériel » : Enregistrer un achat, Matériel déjà possédé (déplié : nom, rayon à picto, état « Bon » par défaut, entretien, date et prix inconnus), Projets d'équipement.
- vide : frise réduite au trait 14.11 « aucune échéance », Achat et Déjà possédé, Projets, puces d'ajout rapide.
- repos-1280 : frise de 60 jours en largeur, tableau « Par rayon » (rayons repliables, ligne active) et fiche à droite ; actions « Payer un entretien » et « Étalonné » (44 px) en tête de fiche pour que tout tienne en 900 px.

Reste : rq3 n'est pas une candidate ; elle est donneuse (segment Par échéance / Par rayon vers uq2, frise des 30 jours vers zq1), sans greffe à recevoir. La frise à 390 renvoie la hotte (25.12) hors échelle par « Hotte 25.12 › ».
