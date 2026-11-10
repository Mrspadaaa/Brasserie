# p2b — Impôt bière, tiède : la règle du barème en °Plato, l'impôt par bouteille

Chaleur : **tiède** (une représentation neuve : le barème est une règle à trois bandes ; le brassin est un curseur dessus).
Idée : l'impôt se lit d'abord par bière vendue. La règle 0–20 °P porte trois bandes (légère 16,88 · normale 25,32 · forte 33,76 CHF/hl) ; le brassin sans densité hachure toute la règle ; un curseur « 12 °P · exemple » donne 6,74 CHF pour le brassin, 0,08 par 33 cl, 0,19 par 75 cl, 5,06 par fût de 20 L, ~ 303,84 sur 1 200 L.

## Ce qui est montré
- Feuille ouverte depuis le brassin : « ‹ Pale Ale de septembre · Impôt bière » (proposition : l'impôt vit dans le brassin, pas dans Clients).
- Règle : bandes couleur bière (paille, or, cuivre clair) avec le taux au centre ; graduations 0 · 10 · 14 · 20 °P ; curseur noir à 12 °P « exemple », hachures « densité à noter » ; sous la règle, un curseur de réglage ; « à 12 °P, ce brassin doit **6,74 CHF** ».
- Par format vendu : trois cartes à picto (33 cl, 75 cl, fût 20 L) avec l'impôt unitaire.
- « Sur l'année, si 1 200 L à 12 °P ~ 303,84 · estimé · exemple ».
- Quand : à la sortie de cave, aucune sortie notée · À qui : OFDF, par Taxas, déclarer sous 20 j, payer sous 30.
- Réduction petit brasseur › · Comprendre le barème ⌄ · liens Taxas, Directives · primaire « + Noter la densité ».
- Annexe : curseur à 15 °P → bande « forte », 8,98 CHF, 0,11 / 0,25 / 6,75, ~ 405,12 sur l'année.

## Problèmes de l'inventaire
4 (l'impôt par format : le premier maillon « coût d'un format vendu » de la chaîne), 14 (un seul barème, dessiné), 13 (Quand dit la sortie de cave), 125-métier (combien par bière, pas une réserve annuelle abstraite).
Baseline : année (celle du brassin), montant, réduction, densité manquante (hachures + action), Comprendre (pli), Copier (à dire au port : via le partage de la feuille), Taxas, Directives.

## Honnêteté
Tant que la densité n'est pas notée, la règle est hachurée et le curseur dit « exemple » ; 1 200 L marqué « estimé · exemple » ; réduction non appliquée, dite ; aucune date calculée.
Un seul facteur libre : le °Plato. Le volume (26,6 L) et les formats sont des constantes du brassin et des tarifs.

## Boosters UX (boosters-ux)
- regle-plato — ajuster ; curseur sur une règle à bandes ; le taux, l'impôt du brassin, les formats et l'année changent (annexe).
- par-format — lire ; trois cartes à picto ; l'impôt d'une bouteille en un regard.
- Statique (09.11) : la position 15 °P est dessinée à côté.
- B1 OK · B2 OK (la règle domine ; un primaire) · B3 ECHEC (104 mots hors données) · B4 OK · B5 non mesuré · B6 OK · B7 OK (bande « forte » éclaircie, texte sombre, pour 4,5:1 sous les hachures) · B8 OK (hachures = inconnu) · B9 s.o. · B10 OK (curseur `range`, pas de `number`) · B11 OK (« à 12 °P, 6,74 CHF, 8 centimes la bouteille ») · B12 OK · B13 OK (curseur 28 px, cartes 90 px).

## Contrôles
PAGE OK · 1280 OK · COMMUN OK (les 6 ; COULEURS passé après le picto des formats en bleu : 3 teintes) · mots 104 (> 60) · panel : remplissage **0,479**, sous le plancher 0,50 (pied bas, texte fin) : à resserrer en passe 2.

## Tient / casse
- Tient : « 8 centimes la bouteille » est la phrase qu'un brasseur retient ; la règle montre d'un coup où une bière forte coûte plus.
- Casse : l'impôt par brassin ne fait pas la somme de l'année (il faut p2a ou p2c pour « combien cette année ») ; les bandes couleur bière frôlent l'échelle EBC (DESIGN.md la réserve au moût) : une raison à discuter, ou passer aux neutres.
