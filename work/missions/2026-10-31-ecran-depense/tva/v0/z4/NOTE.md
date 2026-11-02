# z4 — mode TVA : la TVA par brassin, en centimes par litre ; le hors brassin à part (v0 TVA, série z, 01.11)

**Chaleur : chaude.** Forme libre, pensée brasseur : « combien la TVA me coûte » se lit sur mes bières. Une bouteille par brassin,
remplie à la hauteur de sa TVA (celle des achats reliés au brassin : malts, houblons, levures), le montant et sa traduction en
centimes par litre (« 10 ct/L ») ; puis un fût « Hors brassin » (matériel, verre, nettoyage, gaz) qui porte, en vrai, la plus
grosse part (69 %). Le brassin le plus lourd et le hors brassin sont ouverts sur leurs factures. Une seule idée : la TVA par bière.

**Axes** : place = mode de Synthèse à côté de « Situation / Coûts » (comme z1, composition toute autre) ; période = par brassin
(le facteur libre : un brassin pressé s'ouvre ; l'année reste au stepper) ; « si assujetti » = aucun chiffre, feuille AFC /
fiduciaire / réglage ; forme = bouteilles remplies et barres par taux (hors des trois formes du brief).

**Honnêteté** : un brassin dont toute la TVA est inconnue montre une bouteille hachurée, « ? » et « TVA inconnue », jamais 0 ni
0 ct/L ; les inconnues du hors brassin sont une bande hachurée « 3 sans TVA lue · 228,10 » ; à 14 inconnues la réponse dit « total
partiel ». La douteuse est un segment hachuré « choisie » dans la barre du brassin. L'allemande est une ligne violette « DE 19 % ·
228,00 · hors CH » dans le fût, hors du total. Les ct/L ne sont calculés que sur la TVA connue et le volume du brassin, dits tels
quels. Statut : chip à interrupteur « Non assujetti · réglage ».

**Ce qui vient de la base** : la coquille, le titre « Situation financière », son picto de réglages et la bascule « Situation / Coûts »
(segment « TVA » ajouté), la navigation du bas ; la couleur de rubrique production (`#9A4F1E`) pour les ct/L.

## Boosters UX (boosters-ux)
- Boosters : `mode-tva` — choisir ; segment. `periode` — ajuster ; stepper ‹ 2026 ›. `statut` — lire, déclencher ; chip à
  interrupteur. `brassin` — choisir, lire ; bouteille remplie + montant + ct/L ; pressé, le brassin ouvre ses factures et dit son
  volume. `si-assujetti` — déclencher ; feuille AFC / fiduciaire, aucun chiffre déduit.
- B1 OK (5 boosters) · B2 OK (le 160,19 ; les bouteilles comme masse secondaire) · B3 OK (60 mots hors lignes, juste au seuil :
  « ct/bout. » et les dates retirés du premier plan) · B4 OK (une carte par brassin, factures dedans) · B5 OK · B6 : 12 / 14 / 18 /
  28 · B7 OK (pire « 6 ct/L » 5,15:1) · B8 OK (sept états) · B9 OK · B10 s.o. · B11 : « 160 CHF de TVA, 69 % hors brassin ; une Pale
  Ale me coûte 10 ct de TVA par litre » · B12 OK · B13 OK (en-têtes de 44 px).
- Écarts voulus : quatre tailles (18 px pour le montant du brassin, à côté du 28 du total) ; « ct/bout. » (33 cl) gardé pour la
  passe 2 si le premier plan le supporte.

## Contrôles (sorties)
PAGE OK · COMMUN OK · MOTS OK (97 → 65 → 60) · CONTRASTE OK (100 textes, pire 5,15:1) · CHOIX OK (0 ; Finances sans entrée).
